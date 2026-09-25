-- Confirm Stripe orders atomically and exactly once.
ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS stripe_payment_intent_id text DEFAULT '';

CREATE UNIQUE INDEX IF NOT EXISTS orders_stripe_payment_intent_id_unique
  ON orders (stripe_payment_intent_id)
  WHERE stripe_payment_intent_id IS NOT NULL AND stripe_payment_intent_id <> '';

CREATE OR REPLACE FUNCTION confirm_stripe_order(
  p_order_id uuid,
  p_payment_intent_id text,
  p_amount_cents integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item record;
  v_expected_cents integer;
BEGIN
  SELECT * INTO v_order
  FROM orders
  WHERE id = p_order_id
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Commande introuvable';
  END IF;

  IF v_order.payment_method <> 'stripe'
     OR v_order.stripe_payment_intent_id <> p_payment_intent_id THEN
    RAISE EXCEPTION 'Le paiement Stripe ne correspond pas à cette commande';
  END IF;

  v_expected_cents := round(v_order.total * 100)::integer;
  IF v_expected_cents <> p_amount_cents THEN
    RAISE EXCEPTION 'Montant Stripe invalide';
  END IF;

  IF v_order.payment_status = 'paid' THEN
    RETURN false;
  END IF;

  IF v_order.status <> 'pending' OR v_order.payment_status <> 'pending' THEN
    RAISE EXCEPTION 'Commande non confirmable';
  END IF;

  PERFORM 1
  FROM products p
  JOIN order_items oi ON p.id::text = oi.product_id
  WHERE oi.order_id = p_order_id
  FOR UPDATE OF p;

  FOR v_item IN
    SELECT oi.product_id, SUM(oi.quantity)::integer AS quantity,
           p.name, p.stock_count, p.in_stock
    FROM order_items oi
    JOIN products p ON p.id::text = oi.product_id
    WHERE oi.order_id = p_order_id
    GROUP BY oi.product_id, p.name, p.stock_count, p.in_stock
  LOOP
    IF NOT v_item.in_stock OR COALESCE(v_item.stock_count, 0) < v_item.quantity THEN
      RAISE EXCEPTION 'Stock insuffisant pour %', v_item.name;
    END IF;
  END LOOP;

  UPDATE products p
  SET
    stock_count = GREATEST(0, p.stock_count - oi.quantity),
    in_stock = GREATEST(0, p.stock_count - oi.quantity) > 0,
    updated_at = now()
  FROM (
    SELECT product_id, SUM(quantity)::integer AS quantity
    FROM order_items
    WHERE order_id = p_order_id
    GROUP BY product_id
  ) oi
  WHERE p.id::text = oi.product_id;

  UPDATE orders
  SET payment_status = 'paid', status = 'confirmed', updated_at = now()
  WHERE id = p_order_id;

  IF v_order.customer_id IS NOT NULL THEN
    UPDATE customers
    SET
      total_orders = COALESCE(total_orders, 0) + 1,
      total_spent = COALESCE(total_spent, 0) + v_order.total,
      updated_at = now()
    WHERE id = v_order.customer_id;
  END IF;

  RETURN true;
END;
$$;

REVOKE ALL ON FUNCTION confirm_stripe_order(uuid, text, integer) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION confirm_stripe_order(uuid, text, integer) TO service_role;
