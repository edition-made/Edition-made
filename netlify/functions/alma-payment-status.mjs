import { createServerSupabase } from './_shared/checkout.mjs';
import { verifyAndFinalizeAlmaOrder } from './_shared/alma-order.mjs';

function json(statusCode, body) {
  return {
    statusCode,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'no-store',
      'Access-Control-Allow-Origin': '*',
    },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });

  try {
    const supabase = createServerSupabase();
    const result = await verifyAndFinalizeAlmaOrder(supabase, event.queryStringParameters?.pid);
    return json(200, {
      paid: true,
      orderNumber: result.order.order_number,
    });
  } catch (error) {
    console.error('[alma:payment-status]', error.message);
    return json(error.statusCode || error.status || 500, {
      paid: false,
      status: error.paymentStatus || 'failed',
      error: error.message,
    });
  }
};
