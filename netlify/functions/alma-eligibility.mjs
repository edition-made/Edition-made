import { getAlmaEligibility } from './_shared/alma.mjs';
import { addDeliveryToCart, createServerSupabase, validateCart } from './_shared/checkout.mjs';

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

  try {
    const { items, deliveryMode } = JSON.parse(event.body || '{}');
    const supabase = createServerSupabase();
    const cart = addDeliveryToCart(await validateCart(supabase, items), deliveryMode);
    const eligibility = await getAlmaEligibility(cart.amountCents, [3, 4]);
    const entries = Array.isArray(eligibility) ? eligibility : [eligibility];
    const plans = entries
      .filter((entry) => entry?.eligible)
      .map((entry) => ({
        installmentsCount: entry.installments_count,
        customerTotalCostAmount: entry.customer_total_cost_amount || 0,
        paymentPlan: (entry.payment_plan || []).map((installment) => ({
          totalAmount: installment.total_amount,
          dueDate: installment.due_date,
        })),
      }));

    return json(200, {
      eligible: plans.length > 0,
      amount: cart.amountCents,
      subtotal: Math.round(cart.subtotal * 100),
      deliveryCost: Math.round(cart.deliveryCost * 100),
      plans,
    });
  } catch (error) {
    console.error('[alma:eligibility]', error.message);
    return json(error.statusCode || error.status || 500, {
      error: error.status === 401
        ? 'La configuration Alma doit être vérifiée.'
        : 'Le paiement Alma n’est pas disponible pour ce panier.',
      plans: [],
    });
  }
};
