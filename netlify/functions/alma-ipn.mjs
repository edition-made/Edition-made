import { createServerSupabase } from './_shared/checkout.mjs';
import { verifyAndFinalizeAlmaOrder } from './_shared/alma-order.mjs';

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    body: JSON.stringify(body),
  };
}

export const handler = async (event) => {
  if (event.httpMethod !== 'GET') return json(405, { error: 'Method Not Allowed' });
  const paymentId = event.queryStringParameters?.pid;

  try {
    const supabase = createServerSupabase();
    const result = await verifyAndFinalizeAlmaOrder(supabase, paymentId);
    return json(200, {
      received: true,
      orderNumber: result.order.order_number,
      alreadyConfirmed: !result.newlyConfirmed,
    });
  } catch (error) {
    console.error('[alma:ipn]', error.message);
    return json(error.statusCode || error.status || 500, { error: error.message });
  }
};
