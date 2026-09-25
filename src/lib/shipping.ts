export function getDeliveryCost(subtotal: number, deliveryMode: 'delivery' | 'pickup' = 'delivery') {
  if (deliveryMode === 'pickup') return 0;
  if (subtotal < 50) return 6.9;
  if (subtotal < 300) return 29;
  if (subtotal < 1000) return 99;
  if (subtotal < 2000) return 129;
  return 0;
}
