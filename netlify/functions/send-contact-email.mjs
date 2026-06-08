const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const ADMIN_EMAIL = 'contact@editionmade.com';
const FROM_EMAIL = 'Edition Made <onboarding@resend.dev>';
const LOGO_URL = 'https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp';

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}

function wrapHtml(content) {
  return `<!DOCTYPE html><html lang="fr"><head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;border:1px solid #e8e8e0;">
<tr><td style="background:#000;padding:24px 32px;text-align:center;">
  <img src="${LOGO_URL}" alt="Edition Made" style="height:48px;width:auto;" />
</td></tr>
${content}
<tr><td style="background:#000;padding:20px 32px;text-align:center;">
  <p style="margin:0 0 4px;color:#fff;font-size:13px;font-weight:bold;letter-spacing:1px;">EDITION MADE</p>
  <p style="margin:0 0 4px;color:#888;font-size:11px;">14 avenue des Canadiens · 94410 Saint-Maurice</p>
  <p style="margin:0;color:#888;font-size:11px;">
    <a href="mailto:contact@editionmade.com" style="color:#fff500;text-decoration:none;">contact@editionmade.com</a>
  </p>
</td></tr>
</table>
</td></tr>
</table>
</body></html>`;
}

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) {
    console.error('[send-contact-email] RESEND_API_KEY manquante — email non envoyé');
    return false;
  }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    console.error('[send-contact-email] Resend error', res.status, JSON.stringify(body));
    return false;
  }
  console.log('[send-contact-email] Envoyé à', to, '— id:', body.id);
  return true;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } };
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return json(400, { error: 'Corps invalide' });
  }

  const { name, email, phone, subject, message } = payload;
  if (!name || !email || !message) return json(400, { error: 'Champs obligatoires manquants' });

  const sep = `<tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e8e8e0;margin:0;"/></td></tr>`;
  const msgHtml = message.replace(/\n/g, '<br/>');

  // Email de confirmation au client
  await sendEmail(
    email,
    'Votre message a bien été reçu — Edition Made',
    wrapHtml(`
      <tr><td style="padding:32px 32px 16px;">
        <h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#111;font-family:Georgia,serif;">Message bien reçu !</h1>
        <p style="margin:0;font-size:14px;color:#555;">
          Bonjour ${name},<br/><br/>
          Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
        </p>
      </td></tr>
      ${sep}
      <tr><td style="padding:20px 32px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Votre message</p>
        <p style="margin:0;font-size:13px;color:#333;background:#f8f8f4;padding:16px;border-left:3px solid #fff500;line-height:1.7;">${msgHtml}</p>
      </td></tr>
      ${sep}
      <tr><td style="padding:20px 32px 32px;">
        <p style="margin:0;font-size:13px;color:#555;">En attendant, n'hésitez pas à visiter notre showroom ou à parcourir nos collections en ligne.</p>
      </td></tr>
    `)
  );

  // Notification admin
  await sendEmail(
    ADMIN_EMAIL,
    `[Contact] ${name}${subject ? ` — ${subject}` : ''}`,
    wrapHtml(`
      <tr><td style="padding:32px 32px 16px;">
        <h1 style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111;font-family:Georgia,serif;">Nouveau message de contact</h1>
      </td></tr>
      ${sep}
      <tr><td style="padding:20px 32px;">
        <p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Coordonnées</p>
        <table cellpadding="0" cellspacing="0" style="font-size:13px;color:#333;">
          <tr><td style="padding:3px 12px 3px 0;font-weight:bold;">Nom</td><td>${name}</td></tr>
          <tr><td style="padding:3px 12px 3px 0;font-weight:bold;">Email</td>
              <td><a href="mailto:${email}" style="color:#000;">${email}</a></td></tr>
          ${phone ? `<tr><td style="padding:3px 12px 3px 0;font-weight:bold;">Tél.</td>
              <td><a href="tel:${phone}" style="color:#000;">${phone}</a></td></tr>` : ''}
          ${subject ? `<tr><td style="padding:3px 12px 3px 0;font-weight:bold;">Sujet</td><td>${subject}</td></tr>` : ''}
        </table>
      </td></tr>
      ${sep}
      <tr><td style="padding:20px 32px 32px;">
        <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Message</p>
        <p style="margin:0;font-size:13px;color:#333;background:#f8f8f4;padding:16px;border-left:3px solid #fff500;line-height:1.7;">${msgHtml}</p>
      </td></tr>
    `)
  );

  return json(200, { ok: true });
};
