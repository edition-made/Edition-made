-- Explicit catalogue ordering used by the homepage, categories and admin.
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS sort_order integer NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS products_sort_order_idx
  ON public.products (sort_order, created_at DESC);
