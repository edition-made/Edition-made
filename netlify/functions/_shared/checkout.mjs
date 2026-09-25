import { createClient } from '@supabase/supabase-js';

export function createServerSupabase() {
  const url = process.env.VITE_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) throw new Error('Configuration Supabase serveur manquante');
  return createClient(url, serviceRoleKey);
}

export function generateOrderNumber() {
  const date = new Date();
  const datePart = `${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, '0')}${String(date.getDate()).padStart(2, '0')}`;
  const randomPart = Math.random().toString(36).slice(2, 8).toUpperCase();
  return `EM-${datePart}-${randomPart}`;
}

export function getDeliveryCost(subtotal, deliveryMode) {
  if (deliveryMode === 'pickup') return 0;
  if (subtotal < 50) return 6.9;
  if (subtotal < 300) return 29;
  if (subtotal < 1000) return 99;
  if (subtotal < 2000) return 129;
  return 0;
}

export function addDeliveryToCart(cart, deliveryMode) {
  const deliveryCost = getDeliveryCost(cart.total, deliveryMode);
  const subtotal = cart.total;
  const total = subtotal + deliveryCost;
  return {
    ...cart,
    subtotal,
    deliveryCost,
    total,
    amountCents: Math.round(total * 100),
  };
}

export async function validateCart(supabase, items) {
  if (!Array.isArray(items) || items.length === 0) {
    const error = new Error('Le panier est vide');
    error.statusCode = 400;
    throw error;
  }

  const requestedQuantities = new Map();
  for (const item of items) {
    if (typeof item?.productId !== 'string' || !Number.isSafeInteger(item.quantity) || item.quantity <= 0) {
      const error = new Error('Le panier contient une quantité invalide');
      error.statusCode = 400;
      throw error;
    }
    requestedQuantities.set(item.productId, (requestedQuantities.get(item.productId) || 0) + item.quantity);
  }

  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, name, price, stock_count, in_stock, images')
    .in('id', [...requestedQuantities.keys()]);

  if (productsError || !products) throw new Error('Impossible de vérifier les produits');

  for (const [productId, requestedQuantity] of requestedQuantities) {
    const product = products.find((candidate) => candidate.id === productId);
    if (!product) {
      const error = new Error(`Produit introuvable : ${productId}`);
      error.statusCode = 400;
      throw error;
    }

    const availableStock = Math.max(0, product.stock_count ?? 0);
    if (!product.in_stock || availableStock === 0) {
      const error = new Error(`Le produit « ${product.name} » est épuisé et ne peut plus être commandé.`);
      error.statusCode = 409;
      error.code = 'OUT_OF_STOCK';
      error.productId = productId;
      throw error;
    }
    if (availableStock < requestedQuantity) {
      const error = new Error(`Il ne reste que ${availableStock} exemplaire${availableStock > 1 ? 's' : ''} de « ${product.name} ».`);
      error.statusCode = 409;
      error.code = 'INSUFFICIENT_STOCK';
      error.productId = productId;
      throw error;
    }
  }

  const normalizedItems = items.map((item) => {
    const product = products.find((candidate) => candidate.id === item.productId);
    const unitPrice = Number(product.price);
    return {
      productId: item.productId,
      productName: product.name,
      productImage: item.image || product.images?.[0] || '',
      quantity: item.quantity,
      unitPrice,
      totalPrice: unitPrice * item.quantity,
      selectedColor: item.selectedColor || '',
    };
  });

  const total = normalizedItems.reduce((sum, item) => sum + item.totalPrice, 0);
  return { products, items: normalizedItems, total, amountCents: Math.round(total * 100) };
}

export async function createPendingOrder(supabase, { customer, deliveryMode, address, city, zip, cart, paymentMethod }) {
  if (!customer?.email || !customer?.firstName || !customer?.lastName) {
    const error = new Error('Données client manquantes');
    error.statusCode = 400;
    throw error;
  }

  const now = new Date().toISOString();
  const { data: savedCustomer, error: customerError } = await supabase
    .from('customers')
    .upsert({
      first_name: customer.firstName,
      last_name: customer.lastName,
      email: customer.email,
      phone: customer.phone || '',
      address: address || '',
      city: city || '',
      zip: zip || '',
      updated_at: now,
    }, { onConflict: 'email' })
    .select('id')
    .single();

  if (customerError || !savedCustomer) throw new Error('Impossible d’enregistrer le client');

  const orderNumber = generateOrderNumber();
  const { data: order, error: orderError } = await supabase
    .from('orders')
    .insert({
      order_number: orderNumber,
      customer_id: savedCustomer.id,
      customer_first_name: customer.firstName,
      customer_last_name: customer.lastName,
      customer_email: customer.email,
      customer_phone: customer.phone || '',
      delivery_mode: deliveryMode === 'pickup' ? 'pickup' : 'delivery',
      delivery_address: address || '',
      delivery_city: city || '',
      delivery_zip: zip || '',
      status: 'pending',
      subtotal: cart.subtotal ?? cart.total,
      delivery_cost: cart.deliveryCost ?? 0,
      total: cart.total,
      payment_method: paymentMethod,
      payment_status: 'pending',
    })
    .select('id, order_number')
    .single();

  if (orderError || !order) throw new Error('Impossible de créer la commande');

  const { error: itemsError } = await supabase.from('order_items').insert(
    cart.items.map((item) => ({
      order_id: order.id,
      product_id: item.productId,
      product_name: item.productName,
      product_image: item.productImage,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      total_price: item.totalPrice,
      selected_color: item.selectedColor,
    }))
  );

  if (itemsError) {
    await supabase.from('orders').delete().eq('id', order.id);
    throw new Error('Impossible d’enregistrer les produits de la commande');
  }

  return order;
}

export function checkoutErrorResponse(error) {
  return {
    statusCode: error.statusCode || error.status || 500,
    body: {
      error: error.message || 'Une erreur est survenue',
      ...(error.code ? { code: error.code } : {}),
      ...(error.productId ? { productId: error.productId } : {}),
    },
  };
}
