import { createAlmaPayment, getAlmaEligibility, isTrustedAlmaPaymentUrl } from './_shared/alma.mjs';
import {
  addDeliveryToCart,
  checkoutErrorResponse,
  createPendingOrder,
  createServerSupabase,
  validateCart,
} from './_shared/checkout.mjs';
import { applyPromoToCart, resolvePromo } from './_shared/newsletter.mjs';

const SITE_URL = (process.env.ALMA_SITE_URL || 'https://editionmade.com').replace(/\/$/, '');
const FALLBACK_IMAGE_URL = 'https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp';

// Alma pré-remplit son formulaire : un téléphone hors format E.164 déclenche
// « Certaines informations doivent être corrigées avant l’envoi ».
function toE164(value) {
  const digits = String(value || '').replace(/[\s.\-()]/g, '');
  if (/^\+\d{8,15}$/.test(digits)) return digits;
  if (/^00\d{8,15}$/.test(digits)) return `+${digits.slice(2)}`;
  if (/^0[1-9]\d{8}$/.test(digits)) return `+33${digits.slice(1)}`;
  if (/^33[1-9]\d{8}$/.test(digits)) return `+${digits}`;
  return null;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') return json(200, {});
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let payload;
  try {
    payload = JSON.parse(event.body || '{}');
  } catch {
    return json(400, { error: 'Corps de requête invalide' });
  }

  const { customer, deliveryMode, address, city, zip, items, installmentsCount, promoCode } = payload;
  if (![3, 4].includes(installmentsCount)) {
    return json(400, { error: 'Choisissez un paiement Alma en 3x ou 4x.' });
  }

  let supabase;
  let order = null;
  try {
    supabase = createServerSupabase();
    const cart = applyPromoToCart(
      addDeliveryToCart(await validateCart(supabase, items), deliveryMode),
      await resolvePromo(supabase, promoCode, customer?.email),
    );
    const eligibilityResponse = await getAlmaEligibility(cart.amountCents, [installmentsCount]);
    const eligibility = Array.isArray(eligibilityResponse) ? eligibilityResponse[0] : eligibilityResponse;
    if (!eligibility?.eligible) {
      const error = new Error(`Le paiement en ${installmentsCount}x n’est pas disponible pour ce panier.`);
      error.statusCode = 422;
      throw error;
    }

    order = await createPendingOrder(supabase, {
      customer,
      deliveryMode,
      address,
      city,
      zip,
      cart,
      paymentMethod: 'alma',
    });

    const phone = toE164(customer.phone);
    const addressPayload = {
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      ...(phone ? { phone } : {}),
      line1: address || 'Retrait en magasin',
      postal_code: zip || '94410',
      city: city || 'Saint-Maurice',
      country: 'FR',
    };
    // Le code promo est réparti proportionnellement sur les lignes pour que le total du panier
    // corresponde au montant payé (la dernière ligne absorbe l'arrondi).
    const goodsCents = Math.round((cart.subtotal - (cart.discountAmount || 0)) * 100);
    const rawLines = cart.items.map((item) => Math.round(item.totalPrice * 100));
    const rawSum = rawLines.reduce((sum, value) => sum + value, 0);
    const almaLinePrices = rawLines.map((value) => (cart.discountAmount ? Math.round((value * goodsCents) / rawSum) : value));
    if (cart.discountAmount) {
      const drift = goodsCents - almaLinePrices.reduce((sum, value) => sum + value, 0);
      almaLinePrices[almaLinePrices.length - 1] += drift;
    }
    const confirmationUrl = `${SITE_URL}/commande-confirmee?payment_provider=alma&order_number=${encodeURIComponent(order.order_number)}`;

    const payment = await createAlmaPayment({
      payment: {
        purchase_amount: cart.amountCents,
        installments_count: installmentsCount,
        billing_address: addressPayload,
        shipping_address: addressPayload,
        customer_cancel_url: `${SITE_URL}/panier?alma=annule`,
        failure_return_url: `${confirmationUrl}&redirect_status=failed`,
        return_url: confirmationUrl,
        ipn_callback_url: `${SITE_URL}/api/alma-ipn`,
        origin: 'online',
        locale: 'fr',
        capture_method: 'automatic',
        custom_data: {
          order_id: order.id,
          order_number: order.order_number,
        },
        cart: {
          items: [
            ...cart.items.map((item, index) => ({
            title: item.productName,
            quantity: item.quantity,
            line_price: almaLinePrices[index],
            picture_url: item.productImage || FALLBACK_IMAGE_URL,
            })),
            ...(cart.deliveryCost > 0 ? [{
              title: 'Livraison',
              quantity: 1,
              line_price: Math.round(cart.deliveryCost * 100),
              picture_url: FALLBACK_IMAGE_URL,
            }] : []),
          ],
        },
      },
      customer: {
        first_name: customer.firstName,
        last_name: customer.lastName,
        email: customer.email,
        ...(phone ? { phone } : {}),
        account_id: order.id,
      },
      order: {
        merchant_reference: order.order_number,
        customer_url: confirmationUrl,
      },
    });

    if (!payment?.id || !isTrustedAlmaPaymentUrl(payment.url)) {
      throw new Error('Réponse de paiement Alma invalide');
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({ alma_payment_id: payment.id, updated_at: new Date().toISOString() })
      .eq('id', order.id);
    if (updateError) throw new Error('Impossible de rattacher le paiement Alma à la commande');

    return json(200, {
      redirectUrl: payment.url,
      orderNumber: order.order_number,
    });
  } catch (error) {
    console.error('[alma:create-payment]', error.message);
    if (supabase && order) {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', status: 'cancelled', updated_at: new Date().toISOString() })
        .eq('id', order.id);
    }
    const response = checkoutErrorResponse(error);
    return json(response.statusCode, response.body);
  }
};
