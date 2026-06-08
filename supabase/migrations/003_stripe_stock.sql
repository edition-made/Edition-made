-- =====================
-- Stripe PaymentIntent ID sur les commandes
-- =====================
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text DEFAULT '';

-- =====================
-- Fonction de décrémentation du stock (appelée par le webhook)
-- =====================
CREATE OR REPLACE FUNCTION decrement_stock(p_product_id text, p_qty integer)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE products
  SET
    stock_count = GREATEST(0, COALESCE(stock_count, 0) - p_qty),
    in_stock    = GREATEST(0, COALESCE(stock_count, 0) - p_qty) > 0,
    updated_at  = now()
  WHERE id::text = p_product_id;
END;
$$;
