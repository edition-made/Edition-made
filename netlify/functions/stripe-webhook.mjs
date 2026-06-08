import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const ADMIN_EMAIL = 'contact@editionmade.com';
const FROM_EMAIL = 'Edition Made <onboarding@resend.dev>';
const LOGO_URL = 'https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp';

// ── Helpers email ────────────────────────────────────────────────────────────

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY) return;
  try {
    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
  } catch (err) {
    console.error('[webhook] email error:', err);
  }
}

function emailWrapper(content) {
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

function sep() {
  return `<tr><td style="padding:0 32px;"><hr style="border:none;border-top:1px solid #e8e8e0;margin:0;"/></td></tr>`;
}

// ── Handler principal ────────────────────────────────────────────────────────

export const handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  // Corps brut pour vérification de signature
  const rawBody = event.isBase64Encoded
    ? Buffer.from(event.body, 'base64').toString('utf8')
    : event.body;

  const sig = event.headers['stripe-signature'];
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let stripeEvent;
  try {
    stripeEvent = stripe.webhooks.constructEvent(rawBody, sig, webhookSecret);
  } catch (err) {
    console.error('[webhook] Signature invalide:', err.message);
    return { statusCode: 400, body: `Webhook Error: ${err.message}` };
  }

  // ── payment_intent.succeeded ─────────────────────────────────────────────
  if (stripeEvent.type === 'payment_intent.succeeded') {
    const pi = stripeEvent.data.object;
    const { order_id, order_number, customer_email } = pi.metadata;

    // Mise à jour de la commande
    await supabase
      .from('orders')
      .update({ payment_status: 'paid', status: 'confirmed', updated_at: new Date().toISOString() })
      .eq('id', order_id);

    // Récupération des lignes de commande pour décrémentation du stock
    const { data: orderItems } = await supabase
      .from('order_items')
      .select('product_id, quantity')
      .eq('order_id', order_id);

    if (orderItems) {
      for (const item of orderItems) {
        await supabase.rpc('decrement_stock', {
          p_product_id: item.product_id,
          p_qty: item.quantity,
        });
      }
    }

    // Mise à jour des totaux client
    const { data: order } = await supabase
      .from('orders')
      .select('customer_id, total, customer_first_name, customer_last_name, customer_phone, delivery_mode, delivery_address, delivery_city, delivery_zip')
      .eq('id', order_id)
      .single();

    if (order?.customer_id) {
      await supabase.rpc('increment_customer_totals', {
        p_customer_id: order.customer_id,
        p_amount: order.total,
      }).catch(() => {
        // La fonction RPC peut ne pas exister — on met à jour manuellement
        return supabase
          .from('customers')
          .update({
            total_orders: supabase.rpc('coalesce_increment', { row_id: order.customer_id }),
            total_spent: supabase.rpc('coalesce_add', { row_id: order.customer_id, amount: order.total }),
          })
          .eq('id', order.customer_id);
      });

      // Mise à jour manuelle simple
      const { data: cust } = await supabase
        .from('customers')
        .select('total_orders, total_spent')
        .eq('id', order.customer_id)
        .single();

      if (cust) {
        await supabase.from('customers').update({
          total_orders: (cust.total_orders || 0) + 1,
          total_spent: (parseFloat(cust.total_spent) || 0) + parseFloat(order.total),
          updated_at: new Date().toISOString(),
        }).eq('id', order.customer_id);
      }
    }

    // Emails de confirmation
    const { data: items } = await supabase
      .from('order_items')
      .select('product_name, quantity, unit_price, total_price, product_image')
      .eq('order_id', order_id);

    if (items && order && customer_email) {
      const itemsHtml = items.map(i => `
        <tr>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0e8;">
            <p style="margin:0;font-size:13px;font-weight:bold;color:#111;">${i.product_name}</p>
            <p style="margin:2px 0 0;font-size:12px;color:#666;">Qté : ${i.quantity}</p>
          </td>
          <td style="padding:10px 0;border-bottom:1px solid #f0f0e8;text-align:right;font-size:13px;font-weight:bold;color:#111;">
            ${parseFloat(i.total_price).toFixed(2)} €
          </td>
        </tr>`).join('');

      const deliveryLabel = order.delivery_mode === 'pickup'
        ? 'Retrait en magasin — 14 avenue des Canadiens, 94410 Saint-Maurice'
        : `Livraison à domicile — ${order.delivery_address}, ${order.delivery_zip} ${order.delivery_city}`;

      const totalStr = parseFloat(pi.amount / 100).toFixed(2);

      // Email client
      await sendEmail(
        customer_email,
        `✅ Commande confirmée ${order_number} — Edition Made`,
        emailWrapper(`
          <tr><td style="padding:32px 32px 16px;">
            <h1 style="margin:0 0 8px;font-size:22px;font-weight:bold;color:#111;font-family:Georgia,serif;">Merci pour votre commande !</h1>
            <p style="margin:0;font-size:14px;color:#555;">
              Bonjour ${order.customer_first_name},<br/>
              Votre paiement a été accepté. Commande <strong style="color:#111;">${order_number}</strong>.
            </p>
          </td></tr>
          ${sep()}
          <tr><td style="padding:20px 32px;">
            <p style="margin:0 0 12px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Récapitulatif</p>
            <table width="100%" cellpadding="0" cellspacing="0">${itemsHtml}</table>
            <table width="100%" cellpadding="0" cellspacing="0" style="margin-top:12px;">
              <tr>
                <td style="font-size:15px;font-weight:bold;color:#111;">Total payé</td>
                <td style="font-size:15px;font-weight:bold;color:#111;text-align:right;">${totalStr} €</td>
              </tr>
            </table>
          </td></tr>
          ${sep()}
          <tr><td style="padding:20px 32px 32px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Réception</p>
            <p style="margin:0 0 16px;font-size:13px;color:#333;">${deliveryLabel}</p>
            <a href="https://editionmade.com/contact" style="display:inline-block;background:#fff500;color:#000;font-weight:bold;font-size:13px;padding:12px 24px;text-decoration:none;">
              Nous contacter
            </a>
          </td></tr>
        `)
      );

      // Email admin
      const itemsText = items.map(i => `• ${i.product_name} × ${i.quantity} — ${parseFloat(i.total_price).toFixed(2)} €`).join('<br/>');
      await sendEmail(
        ADMIN_EMAIL,
        `[Commande payée] ${order.customer_first_name} ${order.customer_last_name} — ${totalStr} €`,
        emailWrapper(`
          <tr><td style="padding:32px 32px 16px;">
            <h1 style="margin:0 0 8px;font-size:20px;font-weight:bold;color:#111;font-family:Georgia,serif;">Nouvelle commande payée</h1>
            <p style="margin:0;font-size:13px;color:#555;">Référence : <strong>${order_number}</strong></p>
          </td></tr>
          ${sep()}
          <tr><td style="padding:20px 32px;">
            <p style="margin:0 0 6px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Client</p>
            <p style="margin:0;font-size:13px;color:#333;">
              ${order.customer_first_name} ${order.customer_last_name}<br/>
              <a href="mailto:${customer_email}" style="color:#000;">${customer_email}</a><br/>
              ${order.customer_phone || ''}
            </p>
          </td></tr>
          ${sep()}
          <tr><td style="padding:20px 32px;">
            <p style="margin:0 0 8px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Produits</p>
            <p style="margin:0;font-size:13px;color:#333;line-height:1.8;">${itemsText}</p>
            <p style="margin:12px 0 0;font-size:14px;font-weight:bold;color:#111;">Total : ${totalStr} €</p>
          </td></tr>
          ${sep()}
          <tr><td style="padding:20px 32px 32px;">
            <p style="margin:0 0 4px;font-size:12px;font-weight:bold;color:#888;text-transform:uppercase;letter-spacing:1px;">Réception</p>
            <p style="margin:0;font-size:13px;color:#333;">${deliveryLabel}</p>
          </td></tr>
        `)
      );
    }
  }

  // ── payment_intent.payment_failed ────────────────────────────────────────
  if (stripeEvent.type === 'payment_intent.payment_failed') {
    const pi = stripeEvent.data.object;
    const { order_id } = pi.metadata;
    if (order_id) {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', order_id);
    }
  }

  return { statusCode: 200, body: JSON.stringify({ received: true }) };
};
