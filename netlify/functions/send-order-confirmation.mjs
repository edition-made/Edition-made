import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });
const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);
const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const ADMIN_EMAIL = 'contact@editionmade.com';
const FROM_EMAIL = 'Edition Made <noreply@editionmade.com>';
const LOGO_URL = 'https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp';

function json(status, body) {
  return {
    statusCode: status,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) { console.error('[email] RESEND_API_KEY missing'); return; }
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
  });
  if (!res.ok) console.error('[email] Resend error:', await res.text());
}

function emailTemplate({ orderNumber, firstName, items, total, deliveryLabel }) {
  const itemsRows = items.map(i => `
    <tr>
      <td style="padding:12px 0;border-bottom:1px solid #f0efe8;">
        <p style="margin:0;font-size:13px;font-weight:700;color:#111;font-family:Georgia,'Times New Roman',serif;">${i.product_name}</p>
        <p style="margin:4px 0 0;font-size:12px;color:#888;">Quantité : ${i.quantity}</p>
      </td>
      <td style="padding:12px 0;border-bottom:1px solid #f0efe8;text-align:right;white-space:nowrap;">
        <span style="font-size:13px;font-weight:700;color:#111;">${parseFloat(i.total_price).toFixed(2)} €</span>
      </td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Confirmation commande ${orderNumber}</title>
</head>
<body style="margin:0;padding:0;background:#f2f1ec;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ec;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;">

  <!-- HEADER -->
  <tr>
    <td style="background:#000;padding:28px 40px;text-align:center;">
      <img src="${LOGO_URL}" alt="Edition Made" style="height:52px;width:auto;display:block;margin:0 auto;"/>
    </td>
  </tr>

  <!-- HERO BAND -->
  <tr>
    <td style="background:#fff500;padding:14px 40px;text-align:center;">
      <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:3px;color:#000;text-transform:uppercase;">Commande confirmée</p>
    </td>
  </tr>

  <!-- BODY -->
  <tr>
    <td style="padding:36px 40px 0;">
      <h1 style="margin:0 0 10px;font-size:24px;font-weight:700;color:#111;font-family:Georgia,'Times New Roman',serif;line-height:1.2;">
        Merci ${firstName} !
      </h1>
      <p style="margin:0;font-size:14px;color:#555;line-height:1.6;">
        Votre paiement a bien été accepté. Vous trouverez ci-dessous le récapitulatif de votre commande.
      </p>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr><td style="padding:24px 40px 0;"><hr style="border:none;border-top:1px solid #e8e7e0;margin:0;"/></td></tr>

  <!-- ORDER NUMBER -->
  <tr>
    <td style="padding:24px 40px 0;">
      <p style="margin:0 0 4px;font-size:11px;font-weight:700;color:#999;letter-spacing:2px;text-transform:uppercase;">Référence commande</p>
      <p style="margin:0;font-size:18px;font-weight:900;color:#000;letter-spacing:1px;">${orderNumber}</p>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr><td style="padding:24px 40px 0;"><hr style="border:none;border-top:1px solid #e8e7e0;margin:0;"/></td></tr>

  <!-- ITEMS -->
  <tr>
    <td style="padding:24px 40px 0;">
      <p style="margin:0 0 16px;font-size:11px;font-weight:700;color:#999;letter-spacing:2px;text-transform:uppercase;">Produits commandés</p>
      <table width="100%" cellpadding="0" cellspacing="0">${itemsRows}</table>
    </td>
  </tr>

  <!-- TOTAL -->
  <tr>
    <td style="padding:16px 40px 0;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr>
          <td style="font-size:16px;font-weight:900;color:#000;font-family:Georgia,'Times New Roman',serif;">Total payé</td>
          <td style="font-size:16px;font-weight:900;color:#000;text-align:right;">${total} €</td>
        </tr>
      </table>
    </td>
  </tr>

  <!-- DIVIDER -->
  <tr><td style="padding:24px 40px 0;"><hr style="border:none;border-top:1px solid #e8e7e0;margin:0;"/></td></tr>

  <!-- DELIVERY -->
  <tr>
    <td style="padding:24px 40px 0;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#999;letter-spacing:2px;text-transform:uppercase;">Réception</p>
      <p style="margin:0;font-size:13px;color:#333;line-height:1.6;">${deliveryLabel}</p>
    </td>
  </tr>

  <!-- CTA -->
  <tr>
    <td style="padding:32px 40px;">
      <p style="margin:0 0 20px;font-size:13px;color:#555;line-height:1.6;">
        Notre équipe prépare votre commande. Vous recevrez une notification dès qu'elle sera prête.
        Pour toute question, n'hésitez pas à nous contacter.
      </p>
      <a href="https://editionmade.com/contact"
         style="display:inline-block;background:#000;color:#fff500;font-weight:900;font-size:13px;
                letter-spacing:1px;text-transform:uppercase;padding:14px 28px;text-decoration:none;">
        Nous contacter
      </a>
    </td>
  </tr>

  <!-- FOOTER -->
  <tr>
    <td style="background:#000;padding:28px 40px;text-align:center;">
      <p style="margin:0 0 6px;color:#fff;font-size:13px;font-weight:900;letter-spacing:2px;text-transform:uppercase;">EDITION MADE</p>
      <p style="margin:0 0 4px;color:#888;font-size:11px;">14 avenue des Canadiens · 94410 Saint-Maurice (94)</p>
      <p style="margin:0 0 4px;color:#888;font-size:11px;">Lun–Sam 10h–18h30 · Dim 14h–18h30</p>
      <p style="margin:8px 0 0;">
        <a href="mailto:contact@editionmade.com"
           style="color:#fff500;font-size:11px;text-decoration:none;font-weight:700;">
          contact@editionmade.com
        </a>
      </p>
    </td>
  </tr>

</table>
</td></tr>
</table>
</body>
</html>`;
}

function adminEmailTemplate({ orderNumber, firstName, lastName, email, phone, total, items, deliveryLabel }) {
  const itemsRows = items.map(i => `
    <tr>
      <td style="padding:8px 0;border-bottom:1px solid #f0efe8;font-size:13px;color:#333;">${i.product_name}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0efe8;font-size:13px;color:#333;text-align:center;">×${i.quantity}</td>
      <td style="padding:8px 0;border-bottom:1px solid #f0efe8;font-size:13px;font-weight:700;color:#111;text-align:right;">${parseFloat(i.total_price).toFixed(2)} €</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="fr">
<head><meta charset="UTF-8"/></head>
<body style="margin:0;padding:0;background:#f2f1ec;font-family:Arial,Helvetica,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f2f1ec;padding:40px 16px;">
<tr><td align="center">
<table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff;">
  <tr>
    <td style="background:#000;padding:20px 40px;text-align:center;">
      <img src="${LOGO_URL}" alt="Edition Made" style="height:40px;width:auto;"/>
    </td>
  </tr>
  <tr>
    <td style="background:#fff500;padding:12px 40px;text-align:center;">
      <p style="margin:0;font-size:11px;font-weight:900;letter-spacing:3px;color:#000;text-transform:uppercase;">Nouvelle commande payée</p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 40px 0;">
      <h1 style="margin:0 0 4px;font-size:20px;font-weight:700;color:#111;font-family:Georgia,serif;">${firstName} ${lastName}</h1>
      <p style="margin:0;font-size:13px;color:#555;">Référence : <strong>${orderNumber}</strong></p>
    </td>
  </tr>
  <tr><td style="padding:20px 40px 0;"><hr style="border:none;border-top:1px solid #e8e7e0;"/></td></tr>
  <tr>
    <td style="padding:20px 40px 0;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#999;letter-spacing:2px;text-transform:uppercase;">Contact</p>
      <p style="margin:0;font-size:13px;color:#333;line-height:1.8;">
        <a href="mailto:${email}" style="color:#000;">${email}</a><br/>
        ${phone || ''}
      </p>
    </td>
  </tr>
  <tr><td style="padding:20px 40px 0;"><hr style="border:none;border-top:1px solid #e8e7e0;"/></td></tr>
  <tr>
    <td style="padding:20px 40px 0;">
      <p style="margin:0 0 12px;font-size:11px;font-weight:700;color:#999;letter-spacing:2px;text-transform:uppercase;">Produits</p>
      <table width="100%" cellpadding="0" cellspacing="0">${itemsRows}</table>
      <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
        <tr>
          <td style="font-size:15px;font-weight:900;color:#000;">Total</td>
          <td style="font-size:15px;font-weight:900;color:#000;text-align:right;">${total} €</td>
        </tr>
      </table>
    </td>
  </tr>
  <tr><td style="padding:20px 40px 0;"><hr style="border:none;border-top:1px solid #e8e7e0;"/></td></tr>
  <tr>
    <td style="padding:20px 40px 32px;">
      <p style="margin:0 0 6px;font-size:11px;font-weight:700;color:#999;letter-spacing:2px;text-transform:uppercase;">Réception</p>
      <p style="margin:0;font-size:13px;color:#333;">${deliveryLabel}</p>
    </td>
  </tr>
  <tr>
    <td style="background:#000;padding:20px 40px;text-align:center;">
      <p style="margin:0;color:#888;font-size:11px;">Edition Made · 14 avenue des Canadiens · 94410 Saint-Maurice</p>
    </td>
  </tr>
</table>
</td></tr>
</table>
</body>
</html>`;
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers: { 'Access-Control-Allow-Origin': '*', 'Access-Control-Allow-Headers': 'Content-Type' } };
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let payload;
  try { payload = JSON.parse(event.body); } catch { return json(400, { error: 'Corps invalide' }); }

  const { paymentIntentId, orderNumber } = payload;
  if (!paymentIntentId || !orderNumber) return json(400, { error: 'paymentIntentId et orderNumber requis' });

  // 1. Vérification Stripe (source de vérité)
  let pi;
  try {
    pi = await stripe.paymentIntents.retrieve(paymentIntentId);
  } catch (err) {
    console.error('[confirm] Stripe error:', err.message);
    return json(500, { error: 'Impossible de vérifier le paiement' });
  }

  if (pi.status !== 'succeeded') {
    return json(400, { error: `Paiement non validé (status: ${pi.status})` });
  }

  // 2. Récupération commande + articles
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('order_number', orderNumber)
    .single();

  if (orderError || !order) {
    console.error('[confirm] Order not found:', orderNumber);
    return json(404, { error: 'Commande introuvable' });
  }

  const { data: items } = await supabase
    .from('order_items')
    .select('product_name, quantity, unit_price, total_price')
    .eq('order_id', order.id);

  // 3. Mise à jour statut commande
  await supabase.from('orders').update({
    payment_status: 'paid',
    status: 'confirmed',
    stripe_payment_intent_id: paymentIntentId,
    updated_at: new Date().toISOString(),
  }).eq('id', order.id);

  // 4. Décrémentation stock
  if (items) {
    for (const item of items) {
      if (item.product_id) {
        await supabase.rpc('decrement_stock', { p_product_id: item.product_id, p_qty: item.quantity }).catch(() => {});
      }
    }
  }

  // 5. Mise à jour totaux client
  if (order.customer_id) {
    const { data: cust } = await supabase.from('customers').select('total_orders, total_spent').eq('id', order.customer_id).single();
    if (cust) {
      await supabase.from('customers').update({
        total_orders: (cust.total_orders || 0) + 1,
        total_spent: (parseFloat(cust.total_spent) || 0) + parseFloat(order.total),
        updated_at: new Date().toISOString(),
      }).eq('id', order.customer_id);
    }
  }

  const totalStr = (pi.amount / 100).toFixed(2);
  const deliveryLabel = order.delivery_mode === 'pickup'
    ? 'Retrait en magasin · 14 avenue des Canadiens, 94410 Saint-Maurice'
    : `Livraison à domicile · ${order.delivery_address}, ${order.delivery_zip} ${order.delivery_city}`;

  const customerEmail = order.customer_email;
  const safeItems = items || [];

  // 6. Email client
  if (customerEmail) {
    await sendEmail(
      customerEmail,
      `Commande confirmée · ${orderNumber} — Edition Made`,
      emailTemplate({
        orderNumber,
        firstName: order.customer_first_name,
        items: safeItems,
        total: totalStr,
        deliveryLabel,
      })
    );
  }

  // 7. Email admin
  await sendEmail(
    ADMIN_EMAIL,
    `[Commande payée] ${order.customer_first_name} ${order.customer_last_name} · ${totalStr} €`,
    adminEmailTemplate({
      orderNumber,
      firstName: order.customer_first_name,
      lastName: order.customer_last_name,
      email: customerEmail,
      phone: order.customer_phone,
      total: totalStr,
      items: safeItems,
      deliveryLabel,
    })
  );

  return json(200, { sent: true, orderNumber });
};
