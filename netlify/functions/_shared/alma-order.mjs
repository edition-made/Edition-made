import { retrieveAlmaPayment } from './alma.mjs';

const RESEND_API_KEY = process.env.RESEND_API_KEY || process.env.VITE_RESEND_API_KEY;
const ADMIN_EMAIL = 'contact@editionmade.com';
const FROM_EMAIL = 'Edition Made <noreply@editionmade.com>';

function escapeHtml(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

async function sendEmail(to, subject, html) {
  if (!RESEND_API_KEY || !to) return;
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ from: FROM_EMAIL, to, subject, html }),
    });
    if (!response.ok) console.error('[alma:email]', response.status, await response.text());
  } catch (error) {
    console.error('[alma:email]', error.message);
  }
}

function emailLayout(title, content) {
  return `<!doctype html><html lang="fr"><head><meta charset="utf-8"></head>
  <body style="margin:0;background:#f2f1ec;font-family:Arial,sans-serif;color:#111">
    <table width="100%" cellpadding="0" cellspacing="0" style="padding:32px 16px"><tr><td align="center">
      <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#fff">
        <tr><td style="padding:24px 32px;background:#000;color:#fff;text-align:center;font-weight:900;letter-spacing:2px">EDITION MADE</td></tr>
        <tr><td style="padding:12px 32px;background:#fff500;text-align:center;font-size:12px;font-weight:900;text-transform:uppercase">${escapeHtml(title)}</td></tr>
        <tr><td style="padding:30px 32px">${content}</td></tr>
        <tr><td style="padding:18px 32px;background:#000;color:#999;text-align:center;font-size:11px">14 avenue des Canadiens · 94410 Saint-Maurice</td></tr>
      </table>
    </td></tr></table>
  </body></html>`;
}

async function sendOrderEmails(order, items) {
  const itemRows = items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #eee">${escapeHtml(item.product_name)} × ${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #eee;text-align:right;font-weight:700">${Number(item.total_price).toFixed(2)} €</td>
    </tr>`).join('');
  const delivery = order.delivery_mode === 'pickup'
    ? 'Retrait en magasin — 14 avenue des Canadiens, 94410 Saint-Maurice'
    : `${escapeHtml(order.delivery_address)}, ${escapeHtml(order.delivery_zip)} ${escapeHtml(order.delivery_city)}`;
  const common = `
    <p style="margin:0 0 18px">Référence : <strong>${escapeHtml(order.order_number)}</strong></p>
    <table width="100%" cellpadding="0" cellspacing="0">${itemRows}</table>
    <p style="margin:18px 0;font-size:17px;font-weight:900">Total payé : ${Number(order.total).toFixed(2)} €</p>
    <p style="margin:0;color:#555">${delivery}</p>`;

  await Promise.all([
    sendEmail(
      order.customer_email,
      `Commande confirmée ${order.order_number} — Edition Made`,
      emailLayout('Commande confirmée', `<p>Bonjour ${escapeHtml(order.customer_first_name)},</p><p>Votre paiement Alma a bien été accepté.</p>${common}`)
    ),
    sendEmail(
      ADMIN_EMAIL,
      `[Commande Alma payée] ${order.order_number} — ${Number(order.total).toFixed(2)} €`,
      emailLayout('Nouvelle commande Alma', `<p><strong>${escapeHtml(order.customer_first_name)} ${escapeHtml(order.customer_last_name)}</strong><br>${escapeHtml(order.customer_email)}<br>${escapeHtml(order.customer_phone)}</p>${common}`)
    ),
  ]);
}

export async function verifyAndFinalizeAlmaOrder(supabase, paymentId) {
  if (!paymentId || typeof paymentId !== 'string' || !paymentId.startsWith('payment_')) {
    const error = new Error('Identifiant de paiement Alma invalide');
    error.statusCode = 400;
    throw error;
  }

  const payment = await retrieveAlmaPayment(paymentId);
  if (!payment || payment.id !== paymentId) {
    const error = new Error('Paiement Alma introuvable');
    error.statusCode = 404;
    throw error;
  }

  if (!['authorized', 'captured'].includes(payment.processing_status)) {
    const error = new Error(`Paiement Alma non validé (${payment.processing_status || 'inconnu'})`);
    error.statusCode = 409;
    error.paymentStatus = payment.processing_status || 'unknown';
    throw error;
  }

  const { data: order, error: orderError } = await supabase
    .from('orders')
    .select('*')
    .eq('alma_payment_id', paymentId)
    .maybeSingle();

  if (orderError || !order) {
    const error = new Error('Commande Alma introuvable');
    error.statusCode = 404;
    throw error;
  }

  const expectedAmount = Math.round(Number(order.total) * 100);
  if (Number(payment.purchase_amount) !== expectedAmount) {
    console.error('[alma:verify] Amount mismatch', { orderId: order.id, expectedAmount, paymentAmount: payment.purchase_amount });
    const error = new Error('Le montant Alma ne correspond pas à la commande');
    error.statusCode = 409;
    throw error;
  }

  const { data: newlyConfirmed, error: confirmationError } = await supabase.rpc('confirm_alma_order', {
    p_order_id: order.id,
    p_payment_id: paymentId,
    p_amount_cents: expectedAmount,
  });

  if (confirmationError) throw new Error(`Impossible de confirmer la commande : ${confirmationError.message}`);

  const confirmedOrder = {
    ...order,
    payment_status: 'paid',
    status: 'confirmed',
  };

  if (newlyConfirmed) {
    const { data: items } = await supabase
      .from('order_items')
      .select('product_name, quantity, total_price')
      .eq('order_id', order.id);
    await sendOrderEmails(confirmedOrder, items || []);
  }

  return { order: confirmedOrder, payment, newlyConfirmed: Boolean(newlyConfirmed) };
}
