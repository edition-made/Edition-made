import { createServerSupabase } from './_shared/checkout.mjs';
import { adminAuthorized, escapeHtml, json, sendBatch, sendEmail, unsubscribeUrl, wrapEmail } from './_shared/newsletter.mjs';

const BATCH_SIZE = 50;

function personalize(html, subscriber) {
  const unsub = unsubscribeUrl(subscriber.unsubscribe_token);
  const hasHtmlDocument = /<html[\s>]/i.test(html);
  let out = html
    .replaceAll('{{first_name}}', escapeHtml(subscriber.first_name || ''))
    .replaceAll('{{unsubscribe_url}}', unsub);
  // Si l'admin n'a pas mis de lien de désinscription, on l'ajoute (obligation légale)
  if (!html.includes('{{unsubscribe_url}}')) {
    const footer = `<p style="text-align:center;font-size:11px;color:#888;margin:24px 0;"><a href="${unsub}" style="color:#888;">Se désinscrire</a></p>`;
    out = hasHtmlDocument ? out.replace(/<\/body>/i, `${footer}</body>`) : out + footer;
  }
  return out;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type, x-admin-password' } };
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });
  if (!adminAuthorized(event)) return json(401, { error: 'Non autorisé' });

  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return json(400, { error: 'Corps invalide' }); }

  try {
    const supabase = createServerSupabase();

    if (body.action === 'list') {
      const { data, error } = await supabase
        .from('newsletter_subscribers')
        .select('id, email, first_name, phone, status, promo_code, source, created_at, confirmed_at')
        .order('created_at', { ascending: false })
        .limit(5000);
      if (error) throw error;
      const { data: campaigns } = await supabase
        .from('newsletter_campaigns')
        .select('id, subject, recipients_total, sent_count, created_at')
        .order('created_at', { ascending: false })
        .limit(50);
      return json(200, { subscribers: data || [], campaigns: campaigns || [] });
    }

    if (body.action === 'delete') {
      const { error } = await supabase.from('newsletter_subscribers').delete().eq('id', String(body.id));
      if (error) throw error;
      return json(200, { ok: true });
    }

    if (body.action === 'send-test') {
      const to = String(body.to || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to) || !body.subject || !body.html) return json(400, { error: 'Paramètres invalides' });
      const ok = await sendEmail({
        to,
        subject: `[TEST] ${body.subject}`,
        html: personalize(String(body.html), { first_name: 'Jordan', unsubscribe_token: 'test' }),
      });
      return ok ? json(200, { ok: true }) : json(502, { error: 'Échec de l’envoi du test (voir logs Resend).' });
    }

    // Envoi par tranches : le client rappelle avec `offset` jusqu'à `done`
    if (body.action === 'send-campaign') {
      const { campaignId, subject, html } = body;
      const offset = Number.isInteger(body.offset) && body.offset >= 0 ? body.offset : 0;
      if (!campaignId || !subject || !html) return json(400, { error: 'Sujet et contenu requis' });

      const { data: recipients, count, error } = await supabase
        .from('newsletter_subscribers')
        .select('email, first_name, unsubscribe_token', { count: 'exact' })
        .eq('status', 'confirmed')
        .order('created_at', { ascending: true })
        .range(offset, offset + BATCH_SIZE - 1);
      if (error) throw error;

      if (offset === 0) {
        await supabase.from('newsletter_campaigns').upsert(
          { id: campaignId, subject: String(subject), html: String(html), recipients_total: count ?? 0, sent_count: 0 },
          { onConflict: 'id' },
        );
      }

      if (recipients?.length) {
        await sendBatch(recipients.map((r) => ({
          to: r.email,
          subject: String(subject),
          html: personalize(String(html), r),
          headers: {
            'List-Unsubscribe': `<${unsubscribeUrl(r.unsubscribe_token)}>`,
            'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          },
        })));
        const { data: campaign } = await supabase.from('newsletter_campaigns').select('sent_count').eq('id', campaignId).maybeSingle();
        await supabase.from('newsletter_campaigns')
          .update({ sent_count: (campaign?.sent_count ?? 0) + recipients.length }).eq('id', campaignId);
      }

      const next = offset + (recipients?.length ?? 0);
      return json(200, { sent: recipients?.length ?? 0, next, total: count ?? 0, done: next >= (count ?? 0) });
    }

    return json(400, { error: 'Action inconnue' });
  } catch (error) {
    console.error('[newsletter-admin]', error.message);
    return json(500, { error: error.message || 'Erreur serveur' });
  }
};
