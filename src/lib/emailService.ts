const LOGO_URL =
  'https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp';

const ADMIN_EMAIL = 'contact@editionmade.fr';
const FROM = 'Edition Made <noreply@editionmade.fr>';

// ── Envoi via fetch (compatible browser — pas de SDK Node.js) ────────────────

async function sendEmail(to: string, subject: string, html: string): Promise<void> {
  const apiKey = import.meta.env.VITE_RESEND_API_KEY;
  if (!apiKey) {
    console.warn('[emailService] VITE_RESEND_API_KEY manquante — email non envoyé');
    return;
  }
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM, to, subject, html }),
    });
  } catch (err) {
    console.error('[emailService] Erreur envoi email:', err);
  }
}

// ── HTML wrapper commun ──────────────────────────────────────────────────────

function wrapHtml(content: string): string {
  return `<!DOCTYPE html>
<html lang="fr">
<head>
<meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0"/>
<title>Edition Made</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f0;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f0;padding:32px 16px;">
  <tr><td align="center">
    <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border:1px solid #e8e8e0;">

      <!-- Header -->
      <tr><td style="background:#000000;padding:24px 32px;text-align:center;">
        <img src="${LOGO_URL}" alt="Edition Made" style="height:48px;width:auto;display:inline-block;" />
      </td></tr>

      <!-- Content -->
      ${content}

      <!-- Footer -->
      <tr><td style="background:#000000;padding:20px 32px;text-align:center;">
        <p style="margin:0 0 8px;color:#ffffff;font-size:13px;font-weight:bold;letter-spacing:1px;">
          EDITION MADE
        </p>
        <p style="margin:0 0 4px;color:#888;font-size:11px;">14 avenue des Canadiens · 94410 Saint-Maurice (Val-de-Marne)</p>
        <p style="margin:0 0 4px;color:#888;font-size:11px;">Lun–Sam : 10h–19h · Dim : 10h–17h</p>
        <p style="margin:0;color:#888;font-size:11px;">
          <a href="mailto:contact@editionmade.fr" style="color:#fff500;text-decoration:none;">contact@editionmade.fr</a>
        </p>
      </td></tr>

    </table>
  </td></tr>
</table>
</body>
</html>`;
}

function separator(): string {
  return `<tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e8e8e0;margin:0;" /></td></tr>`;
}

// ── 1. Confirmation de commande (client) ─────────────────────────────────────

export type OrderEmailData = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  deliveryMode: 'delivery' | 'pickup';
  address?: string;
  city?: string;
  zip?: string;
  items: Array<{ name: string; quantity: number; price: number; image?: string }>;
  total: number;
  orderNumber?: string;
};

export async function sendOrderConfirmation(data: OrderEmailData): Promise<void> {
  const orderRef = data.orderNumber || `EM-${Date.now().toString(36).toUpperCase()}`;
  const deliveryLabel = data.deliveryMode === 'pickup'
    ? 'Retrait en magasin – 14 avenue des Canadiens, 94410 Saint-Maurice'
    : `Livraison à domicile – ${data.address || ''}, ${data.zip || ''} ${data.city || ''}`;

  const itemsRows = data.items.map(item => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0e8;">
        <p style="margin:0;font-size:13px;font-weight:bold;color:#111;">${item.name}</p>
        <p style="margin:2px 0 0;font-size:12px;color:#666;">Qté : ${item.quantity}</p>
      </td>
      <td style="padding:10px 0;border-bottom:1px solid #f0f0e8;text-align:right;font-size:13px;font-weight:bold;color:#111;">
        ${(item.price * item.quantity).toFixed(2)} €
      </td>
    </tr>
  `).join('');

  const html = wrapHtml(`
    <tr><td style="padding:32px 32px 16px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#111;font-family:Georgia,serif;">
        Merci pour votre commande !
      </h1>
      <p style="margin:0;font-size:14px;color:#555;">
        Bonjour ${data.firstName},<br/>
        Votre commande <strong style="color:#111;">${orderRef}</strong> a bien été enregistrée.
        Notre équipe vous contactera pour confirmer les détails.
      </p>
    </td></tr>

    ${separator()}

    <tr><td style="padding:20px 32px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Récapitulatif</p>
      <table width="100%" cellpadding="0" cellspacing="0">${itemsRows}</table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          <td style="font-size:15px;font-weight:bold;color:#111;">Total</td>
          <td style="font-size:15px;font-weight:bold;color:#111;text-align:right;">${data.total.toFixed(2)} €</td>
        </tr>
      </table>
    </td></tr>

    ${separator()}

    <tr><td style="padding:20px 32px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Mode de réception</p>
      <p style="margin:0;font-size:13px;color:#333;">${deliveryLabel}</p>
    </td></tr>

    ${separator()}

    <tr><td style="padding:20px 32px 32px;">
      <p style="margin:0 0 16px;font-size:13px;color:#555;">
        Vous avez une question ? Contactez-nous par email ou passez directement en showroom.
      </p>
      <a href="https://editionmade.fr/contact"
         style="display:inline-block;background:#fff500;color:#000;font-weight:bold;font-size:13px;padding:12px 24px;text-decoration:none;letter-spacing:0.5px;">
        Nous contacter
      </a>
    </td></tr>
  `);

  await sendEmail(data.email, `Confirmation de commande ${orderRef} — Edition Made`, html);
}

// ── 2. Notification admin (nouvelle commande) ────────────────────────────────

export async function sendOrderNotificationToAdmin(data: OrderEmailData): Promise<void> {
  const orderRef = data.orderNumber || `EM-${Date.now().toString(36).toUpperCase()}`;
  const itemsText = data.items
    .map(i => `• ${i.name} × ${i.quantity} — ${(i.price * i.quantity).toFixed(2)} €`)
    .join('<br/>');

  const html = wrapHtml(`
    <tr><td style="padding:32px 32px 16px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111;font-family:Georgia,serif;">
        Nouvelle commande reçue
      </h1>
      <p style="margin:0;font-size:13px;color:#555;">Référence : <strong>${orderRef}</strong></p>
    </td></tr>
    ${separator()}
    <tr><td style="padding:20px 32px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Client</p>
      <p style="margin:0;font-size:13px;color:#333;">
        ${data.firstName} ${data.lastName}<br/>
        <a href="mailto:${data.email}" style="color:#000;">${data.email}</a><br/>
        ${data.phone}
      </p>
    </td></tr>
    ${separator()}
    <tr><td style="padding:20px 32px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Produits commandés</p>
      <p style="margin:0;font-size:13px;color:#333;line-height:1.8;">${itemsText}</p>
      <p style="margin:12px 0 0;font-size:14px;font-weight:bold;color:#111;">Total : ${data.total.toFixed(2)} €</p>
    </td></tr>
    ${separator()}
    <tr><td style="padding:20px 32px 32px;">
      <p style="margin:0 0 4px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Mode</p>
      <p style="margin:0;font-size:13px;color:#333;">
        ${data.deliveryMode === 'pickup' ? 'Retrait en magasin' : `Livraison — ${data.address}, ${data.zip} ${data.city}`}
      </p>
    </td></tr>
  `);

  await sendEmail(ADMIN_EMAIL, `[Commande] ${data.firstName} ${data.lastName} — ${data.total.toFixed(2)} €`, html);
}

// ── 3. Confirmation contact (client) ────────────────────────────────────────

export type ContactEmailData = {
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
};

export async function sendContactConfirmation(data: ContactEmailData): Promise<void> {
  const html = wrapHtml(`
    <tr><td style="padding:32px 32px 16px;">
      <h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#111;font-family:Georgia,serif;">
        Message bien reçu !
      </h1>
      <p style="margin:0;font-size:14px;color:#555;">
        Bonjour ${data.name},<br/><br/>
        Nous avons bien reçu votre message et vous répondrons dans les plus brefs délais.
      </p>
    </td></tr>
    ${separator()}
    <tr><td style="padding:20px 32px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Votre message</p>
      <p style="margin:0;font-size:13px;color:#333;background:#f8f8f4;padding:16px;border-left:3px solid #fff500;line-height:1.7;">
        ${data.message.replace(/\n/g, '<br/>')}
      </p>
    </td></tr>
    ${separator()}
    <tr><td style="padding:20px 32px 32px;">
      <p style="margin:0;font-size:13px;color:#555;">
        En attendant, n'hésitez pas à visiter notre showroom ou à parcourir nos collections en ligne.
      </p>
    </td></tr>
  `);

  await sendEmail(data.email, 'Votre message a bien été reçu — Edition Made', html);
}

// ── 4. Notification admin (nouveau contact) ──────────────────────────────────

export async function sendContactNotificationToAdmin(data: ContactEmailData): Promise<void> {
  const html = wrapHtml(`
    <tr><td style="padding:32px 32px 16px;">
      <h1 style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111;font-family:Georgia,serif;">
        Nouveau message de contact
      </h1>
    </td></tr>
    ${separator()}
    <tr><td style="padding:20px 32px;">
      <p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Coordonnées</p>
      <table cellpadding="0" cellspacing="0" style="font-size:13px;color:#333;">
        <tr><td style="padding:3px 12px 3px 0;font-weight:bold;">Nom</td><td>${data.name}</td></tr>
        <tr><td style="padding:3px 12px 3px 0;font-weight:bold;">Email</td>
            <td><a href="mailto:${data.email}" style="color:#000;">${data.email}</a></td></tr>
        ${data.phone ? `<tr><td style="padding:3px 12px 3px 0;font-weight:bold;">Téléphone</td>
            <td><a href="tel:${data.phone}" style="color:#000;">${data.phone}</a></td></tr>` : ''}
        ${data.subject ? `<tr><td style="padding:3px 12px 3px 0;font-weight:bold;">Sujet</td><td>${data.subject}</td></tr>` : ''}
      </table>
    </td></tr>
    ${separator()}
    <tr><td style="padding:20px 32px 32px;">
      <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Message</p>
      <p style="margin:0;font-size:13px;color:#333;background:#f8f8f4;padding:16px;border-left:3px solid #fff500;line-height:1.7;">
        ${data.message.replace(/\n/g, '<br/>')}
      </p>
    </td></tr>
  `);

  await sendEmail(ADMIN_EMAIL, `[Contact] ${data.name}${data.subject ? ` — ${data.subject}` : ''}`, html);
}
