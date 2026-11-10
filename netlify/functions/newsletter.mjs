import { createServerSupabase } from './_shared/checkout.mjs';
import {
  SITE_URL, WELCOME_DISCOUNT_PERCENT, buttonHtml, escapeHtml, generatePromoCode, isValidEmail, json,
  randomToken, resolvePromo, sendEmail, unsubscribeUrl, wrapEmail,
} from './_shared/newsletter.mjs';

const RESEND_COOLDOWN_MS = 60 * 1000;

async function sendConfirmationEmail(subscriber) {
  const link = `${SITE_URL}/newsletter/confirmer?token=${subscriber.confirm_token}`;
  const name = subscriber.first_name ? ` ${escapeHtml(subscriber.first_name)}` : '';
  return sendEmail({
    to: subscriber.email,
    subject: `Confirmez votre inscription pour recevoir -${WELCOME_DISCOUNT_PERCENT} % sur votre premier achat`,
    html: wrapEmail(`
      <h1 style="font-size:22px;margin:0 0 12px;">Bonjour${name},</h1>
      <p>Merci de votre intérêt pour Edition Made ! Confirmez votre adresse e-mail pour recevoir votre code promo
      <strong>-${WELCOME_DISCOUNT_PERCENT} % supplémentaires sur votre premier achat</strong> et nos meilleures offres de déstockage.</p>
      ${buttonHtml(link, 'Confirmer mon inscription')}
      <p style="font-size:12px;color:#777;">Si le bouton ne fonctionne pas, copiez ce lien : <br/>${link}</p>
      <p style="font-size:12px;color:#777;">Vous n’êtes pas à l’origine de cette demande ? Ignorez simplement cet e-mail.</p>`),
  });
}

async function subscribe(supabase, body) {
  if (body.website) return json(200, { ok: true }); // honeypot anti-bot
  const email = String(body.email || '').trim().toLowerCase();
  const firstName = String(body.firstName || '').trim().slice(0, 60);
  const lastName = String(body.lastName || '').trim().slice(0, 60);
  const phone = String(body.phone || '').trim().slice(0, 30);
  if (!isValidEmail(email)) return json(400, { error: 'Adresse e-mail invalide.' });
  if (!firstName) return json(400, { error: 'Merci d’indiquer votre prénom.' });
  if (!lastName) return json(400, { error: 'Merci d’indiquer votre nom.' });
  if (phone.replace(/[^\d]/g, '').length < 8) return json(400, { error: 'Merci d’indiquer un numéro de téléphone valide.' });
  if (body.consent !== true) return json(400, { error: 'Veuillez accepter de recevoir nos offres par e-mail.' });

  const { data: existing } = await supabase
    .from('newsletter_subscribers')
    .select('*')
    .ilike('email', email)
    .maybeSingle();

  // Réponse volontairement identique dans tous les cas (pas de fuite sur les adresses déjà inscrites)
  const okResponse = json(200, { ok: true });

  if (existing) {
    if (existing.status === 'confirmed') {
      await sendEmail({
        to: email,
        subject: 'Vous êtes déjà inscrit(e) — Edition Made',
        html: wrapEmail(`<p>Bonjour ${escapeHtml(existing.first_name || '')}, vous êtes déjà inscrit(e) à notre newsletter.</p>
          ${existing.promo_code ? `<p>Votre code promo -${WELCOME_DISCOUNT_PERCENT} % (premier achat) : <strong style="font-size:18px;">${existing.promo_code}</strong></p>` : ''}
          ${buttonHtml(SITE_URL, 'Découvrir nos offres')}`, { unsubscribeLink: unsubscribeUrl(existing.unsubscribe_token) }),
      });
      return okResponse;
    }
    const last = existing.confirmation_sent_at ? new Date(existing.confirmation_sent_at).getTime() : 0;
    if (Date.now() - last < RESEND_COOLDOWN_MS) return okResponse;

    // pending ou désinscrit : on relance une confirmation (nouveau token)
    const { data: updated } = await supabase
      .from('newsletter_subscribers')
      .update({
        status: 'pending', first_name: firstName, last_name: lastName, phone, confirm_token: randomToken(),
        consent_at: new Date().toISOString(), confirmation_sent_at: new Date().toISOString(), unsubscribed_at: null,
      })
      .eq('id', existing.id)
      .select('*')
      .single();
    if (updated) await sendConfirmationEmail(updated);
    return okResponse;
  }

  const { data: created, error } = await supabase
    .from('newsletter_subscribers')
    .insert({
      email, first_name: firstName, last_name: lastName, phone, status: 'pending',
      confirm_token: randomToken(), unsubscribe_token: randomToken(),
      source: String(body.source || 'home').slice(0, 30), confirmation_sent_at: new Date().toISOString(),
    })
    .select('*')
    .single();
  if (error || !created) {
    console.error('[newsletter:subscribe]', error?.message);
    return json(500, { error: 'Inscription impossible pour le moment. Réessayez plus tard.' });
  }
  const sent = await sendConfirmationEmail(created);
  if (!sent) return json(502, { error: 'Impossible d’envoyer l’e-mail de confirmation. Réessayez plus tard.' });
  return okResponse;
}

async function confirm(supabase, body) {
  const token = String(body.token || '');
  if (!/^[a-f0-9]{48}$/.test(token)) return json(400, { error: 'Lien de confirmation invalide.' });

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers').select('*').eq('confirm_token', token).maybeSingle();
  if (!subscriber) return json(404, { error: 'Lien de confirmation invalide ou expiré.' });

  let promoCode = subscriber.promo_code;
  const firstConfirmation = subscriber.status !== 'confirmed';

  if (firstConfirmation) {
    const patch = { status: 'confirmed', confirmed_at: new Date().toISOString(), unsubscribed_at: null };
    if (!promoCode) {
      // Réessaie en cas (très improbable) de collision sur l'index unique
      for (let attempt = 0; attempt < 5; attempt++) {
        const candidate = generatePromoCode();
        const { error } = await supabase
          .from('newsletter_subscribers').update({ ...patch, promo_code: candidate }).eq('id', subscriber.id);
        if (!error) { promoCode = candidate; break; }
      }
      if (!promoCode) return json(500, { error: 'Impossible de générer votre code. Réessayez.' });
    } else {
      await supabase.from('newsletter_subscribers').update(patch).eq('id', subscriber.id);
    }
    await sendEmail({
      to: subscriber.email,
      subject: `Votre code promo -${WELCOME_DISCOUNT_PERCENT} % Edition Made`,
      html: wrapEmail(`
        <h1 style="font-size:22px;margin:0 0 12px;">Bienvenue${subscriber.first_name ? ` ${escapeHtml(subscriber.first_name)}` : ''} !</h1>
        <p>Votre inscription est confirmée. Voici votre code pour <strong>-${WELCOME_DISCOUNT_PERCENT} % supplémentaires sur votre premier achat</strong> :</p>
        <p style="text-align:center;margin:24px 0;"><span style="background:#000;color:#fff500;font-size:22px;font-weight:bold;letter-spacing:2px;padding:14px 24px;display:inline-block;">${promoCode}</span></p>
        <p style="text-align:center;font-size:13px;color:#555;">À saisir à l’étape « Informations » de la commande. Valable une seule fois, cumulable avec nos prix déjà remisés.</p>
        ${buttonHtml(SITE_URL, 'Profiter de mon offre')}`, { unsubscribeLink: unsubscribeUrl(subscriber.unsubscribe_token) }),
    });
  }

  return json(200, { ok: true, code: promoCode, percent: WELCOME_DISCOUNT_PERCENT, firstName: subscriber.first_name });
}

async function unsubscribe(supabase, body) {
  const token = String(body.token || '');
  if (!/^[a-f0-9]{48}$/.test(token)) return json(400, { error: 'Lien de désinscription invalide.' });
  const { data } = await supabase
    .from('newsletter_subscribers')
    .update({ status: 'unsubscribed', unsubscribed_at: new Date().toISOString() })
    .eq('unsubscribe_token', token)
    .select('id')
    .maybeSingle();
  if (!data) return json(404, { error: 'Lien de désinscription invalide.' });
  return json(200, { ok: true });
}

async function validateCode(supabase, body) {
  try {
    const promo = await resolvePromo(supabase, body.code);
    if (!promo) return json(400, { valid: false, error: 'Saisissez un code promo.' });
    return json(200, { valid: true, code: promo.code, percent: promo.percent });
  } catch (error) {
    if (error.code === 'INVALID_PROMO') return json(200, { valid: false, error: error.message });
    throw error;
  }
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } };
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Corps invalide' }); }

  try {
    const supabase = createServerSupabase();
    switch (body.action) {
      case 'subscribe': return await subscribe(supabase, body);
      case 'confirm': return await confirm(supabase, body);
      case 'unsubscribe': return await unsubscribe(supabase, body);
      case 'validate-code': return await validateCode(supabase, body);
      default: return json(400, { error: 'Action inconnue' });
    }
  } catch (error) {
    console.error('[newsletter]', error.message);
    return json(500, { error: 'Une erreur est survenue.' });
  }
};
