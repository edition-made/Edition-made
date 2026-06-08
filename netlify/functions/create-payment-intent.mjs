import Stripe from 'stripe';
import { createClient } from '@supabase/supabase-js';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY, { apiVersion: '2024-04-10' });

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

function generateOrderNumber() {
  const d = new Date();
  const date = `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}`;
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `EM-${date}-${rand}`;
}

function json(statusCode, body) {
  return {
    statusCode,
    headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
    body: JSON.stringify(body),
  };
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
    return json(400, { error: 'Corps de requête invalide' });
  }

  const { customer, deliveryMode, address, city, zip, items } = payload;

  // ── 1. Validation basique ──────────────────────────────────────────────────
  if (!customer?.email || !items?.length) {
    return json(400, { error: 'Données client ou panier manquantes' });
  }

  // ── 2. Vérification des prix et du stock côté serveur ─────────────────────
  const productIds = items.map((i) => i.productId);
  const { data: dbProducts, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, stock_count, in_stock')
    .in('id', productIds);

  if (productsError || !dbProducts) {
    return json(500, { error: 'Impossible de vérifier les produits' });
  }

  let serverTotal = 0;
  for (const item of items) {
    const dbProduct = dbProducts.find((p) => p.id === item.productId);
    if (!dbProduct) return json(400, { error: `Produit introuvable : ${item.productId}` });
    if (!dbProduct.in_stock || (dbProduct.stock_count ?? 0) < item.quantity) {
      return json(400, { error: `Stock insuffisant pour "${dbProduct.name}"` });
    }
    serverTotal += dbProduct.price * item.quantity;
  }

  // ── 3. Upsert client ──────────────────────────────────────────────────────
  let customerId = null;
  const { data: existingCustomer } = await supabase
    .from('customers')
    .select('id')
    .eq('email', customer.email)
    .maybeSingle();

  if (existingCustomer) {
    customerId = existingCustomer.id;
    await supabase.from('customers').update({
      first_name: customer.firstName,
      last_name: customer.lastName,
      phone: customer.phone || '',
      address: address || '',
      city: city || '',
      zip: zip || '',
      updated_at: new Date().toISOString(),
    }).eq('id', customerId);
  } else {
    const { data: newCustomer } = await supabase.from('customers').insert({
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      address: address || '',
      city: city || '',
      zip: zip || '',
    }).select('id').single();
    customerId = newCustomer?.id ?? null;
  }

  // ── 4. Création de la commande (statut pending) ───────────────────────────
  const orderNumber = generateOrderNumber();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: customerId,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: customer.email,
      customer_phone: customer.phone || '',
      delivery_mode: deliveryMode,
      delivery_address: address || '',
      delivery_city: city || '',
      delivery_zip: zip || '',
      status: 'pending',
      subtotal: serverTotal,
      delivery_cost: 0,
      total: serverTotal,
      payment_method: 'stripe',
      payment_status: 'pending',
    })
    .select('id')
    .single();

  if (orderError || !order) {
    return json(500, { error: 'Impossible de créer la commande' });
  }

  // ── 5. Lignes de commande ─────────────────────────────────────────────────
  await supabase.from('order_items').insert(
    items.map((item) => {
      const dbProduct = dbProducts.find((p) => p.id === item.productId);
      return {
        order_id: order.id,
        product_id: item.productId,
        product_name: dbProduct.name,
        product_image: item.image || '',
        quantity: item.quantity,
        unit_price: dbProduct.price,
        total_price: dbProduct.price * item.quantity,
        selected_color: item.selectedColor || '',
      };
    })
  );

  // ── 6. Stripe PaymentIntent ───────────────────────────────────────────────
  const paymentIntent = await stripe.paymentIntents.create({
    amount: Math.round(serverTotal * 100), // centimes
    currency: 'eur',
    metadata: {
      order_id: order.id,
      order_number: orderNumber,
      customer_email: customer.email,
    },
    receipt_email: customer.email,
  });

  // ── 7. Sauvegarde de l'ID PaymentIntent sur la commande ───────────────────
  await supabase
    .from('orders')
    .update({ stripe_payment_intent_id: paymentIntent.id })
    .eq('id', order.id);

  return json(200, {
    clientSecret: paymentIntent.client_secret,
    orderNumber,
    orderId: order.id,
  });
};
