-- Un produit avec un stock nul ne peut jamais rester marqué disponible.
UPDATE public.products
SET in_stock = false, updated_at = now()
WHERE COALESCE(stock_count, 0) <= 0
  AND in_stock = true;

CREATE OR REPLACE FUNCTION public.mark_zero_stock_as_unavailable()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF COALESCE(NEW.stock_count, 0) <= 0 THEN
    NEW.in_stock := false;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS products_zero_stock_status ON public.products;

CREATE TRIGGER products_zero_stock_status
BEFORE INSERT OR UPDATE OF stock_count, in_stock ON public.products
FOR EACH ROW
EXECUTE FUNCTION public.mark_zero_stock_as_unavailable();
