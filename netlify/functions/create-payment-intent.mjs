import Stripe from 'stripe';
import {
  addDeliveryToCart,
  checkoutErrorResponse,
  createPendingOrder,
  createServerSupabase,
  validateCart,
} from './_shared/checkout.mjs';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod === 'OPTIONS') {
    return {
      statusCode: 200,
      headers: {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type',
      },
    };
  }
  if (event.httpMethod !== 'POST') return json(405, { error: 'Method Not Allowed' });

  let payload;
  try {
    payload = JSON.parse(event.body);
  } catch {
    return json(400, { error: 'Corps de requête invalide' });
  }

  const { customer, deliveryMode, address, city, zip, items } = payload;
  let supabase;
  let order = null;

  try {
    supabase = createServerSupabase();
    const cart = addDeliveryToCart(await validateCart(supabase, items), deliveryMode);
    order = await createPendingOrder(supabase, {
      customer,
      deliveryMode,
      address,
      city,
      zip,
      cart,
      paymentMethod: 'stripe',
    });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: cart.amountCents,
      currency: 'eur',
      metadata: {
        order_id: order.id,
        order_number: order.order_number,
        customer_email: customer.email,
      },
      receipt_email: customer.email,
    });

    const { error: updateError } = await supabase
      .from('orders')
      .update({ stripe_payment_intent_id: paymentIntent.id })
      .eq('id', order.id);

    if (updateError) throw new Error('Impossible de rattacher le paiement à la commande');

    return json(200, {
      clientSecret: paymentIntent.client_secret,
      orderNumber: order.order_number,
      orderId: order.id,
    });
  } catch (error) {
    console.error('[stripe:create-payment-intent]', error.message);
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
