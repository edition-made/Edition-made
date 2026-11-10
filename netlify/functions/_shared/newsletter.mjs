import crypto from 'node:crypto';

export const SITE_URL = (process.env.ALMA_SITE_URL || process.env.SITE_URL || 'https://editionmade.com').replace(/\/$/, '');
export const WELCOME_DISCOUNT_PERCENT = 5;

const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const FROM_EMAIL = 'Edition Made <noreply@editionmade.com>';
const LOGO_URL = 'https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp';

export function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}

export const randomToken = () => crypto.randomBytes(24).toString('hex');

export function generatePromoCode() {
  // Alphabet sans caractères ambigus (0/O, 1/I)
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let suffix = '';
  for (const byte of crypto.randomBytes(6)) suffix += alphabet[byte % alphabet.length];
  return `BIENVENUE5-${suffix}`;
}

export const isValidEmail = (value) =>
  typeof value === 'string' && value.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value);

export const escapeHtml = (value) =>
  String(value ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

export function unsubscribeUrl(token) {
  return `${SITE_URL}/newsletter/desinscription?token=${token}`;
}

export function wrapEmail(content, { unsubscribeLink } = {}) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width, initial-scale=1.0"/></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;"><tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e8e0;">
<tr><td style="background:#000;padding:24px 32px;text-align:center;"><img src="${LOGO_URL}" alt="Edition Made" style="height:48px;width:auto;" /></td></tr>
<tr><td style="padding:32px;color:#111;font-size:15px;line-height:1.6;">${content}</td></tr>
<tr><td style="background:#000;padding:20px 32px;text-align:center;">
<p style="margin:0 0 4px;color:#fff;font-size:13px;font-weight:bold;letter-spacing:1px;">EDITION MADE</p>
<p style="margin:0 0 4px;color:#888;font-size:11px;">14 avenue des Canadiens · 94410 Saint-Maurice</p>
<p style="margin:0;color:#888;font-size:11px;"><a href="mailto:contact@editionmade.com" style="color:#fff500;text-decoration:none;">contact@editionmade.com</a></p>
${unsubscribeLink ? `<p style="margin:10px 0 0;color:#888;font-size:11px;"><a href="${unsubscribeLink}" style="color:#888;">Se désinscrire</a></p>` : ''}
</td></tr></table></td></tr></table></body></html>`;
}

export const buttonHtml = (href, label) =>
  `<p style="text-align:center;margin:28px 0;"><a href="${href}" style="background:#fff500;color:#000;font-weight:bold;text-decoration:none;padding:14px 28px;display:inline-block;text-transform:uppercase;font-size:13px;letter-spacing:.5px;">${label}</a></p>`;

export async function sendEmail({ to, subject, html, headers }) {
  if (!RESEND_API_KEY) {
    console.error('[newsletter] RESEND_API_KEY manquante — email non envoyé');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html, ...(headers ? { headers } : {}) }),
  });
  if (!res.ok) {
    console.error('[newsletter] Resend error', res.status, JSON.stringify(await res.json().catch(() => ({}))));
    return false;
  }
  return true;
}

// Envoi par lots (max 100 par appel Resend)
export async function sendBatch(messages) {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY manquante');
  const res = await fetch('https://api.resend.com/emails/batch', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify(messages.map((m) => ({ from: FROM_EMAIL, ...m }))),
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(`Resend: ${body.message || res.status}`);
  }
  return messages.length;
}

export function adminAuthorized(event) {
  const expected = process.env.ADMIN_PASSWORD || process.env.VITE_ADMIN_PASSWORD;
  const given = event.headers?.['x-admin-password'] || '';
  if (!expected || !given) return false;
  const a = crypto.createHash('sha256').update(String(given)).digest();
  const b = crypto.createHash('sha256').update(String(expected)).digest();
  return crypto.timingSafeEqual(a, b);
}

/**
 * Valide un code promo de bienvenue et calcule la remise sur le sous-total produits.
 * Le code est consommé seulement quand une commande est payée (payment_status = 'paid').
 */
export async function resolvePromo(supabase, rawCode) {
  const code = String(rawCode || '').trim().toUpperCase();
  if (!code) return null;
  const invalid = (message) => {
    const error = new Error(message);
    error.statusCode = 400;
    error.code = 'INVALID_PROMO';
    return error;
  };

  const { data: subscriber } = await supabase
    .from('newsletter_subscribers')
    .select('id, status')
    .eq('promo_code', code)
    .maybeSingle();
  if (!subscriber || subscriber.status === 'pending') throw invalid('Ce code promo n’est pas valide.');

  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('promo_code', code)
    .eq('payment_status', 'paid');
  if ((count ?? 0) > 0) throw invalid('Ce code promo a déjà été utilisé (offre réservée au premier achat).');

  return { code, percent: WELCOME_DISCOUNT_PERCENT };
}

export function applyPromoToCart(cart, promo) {
  if (!promo) return cart;
  const discount = Math.round(cart.subtotal * promo.percent) / 100;
  const total = Math.round((cart.subtotal - discount + cart.deliveryCost) * 100) / 100;
  return {
    ...cart,
    promoCode: promo.code,
    discountAmount: discount,
    total,
    amountCents: Math.round(total * 100),
  };
}
