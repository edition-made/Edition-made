-- Sous-catégories administrables utilisées par le catalogue et la navigation.
CREATE TABLE IF NOT EXISTS public.subcategories (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_slug text NOT NULL,
  name text NOT NULL,
  slug text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT subcategories_parent_slug_slug_unique UNIQUE (parent_slug, slug),
  CONSTRAINT subcategories_parent_slug_format CHECK (parent_slug ~ '^[a-z0-9-]+$'),
  CONSTRAINT subcategories_slug_format CHECK (slug ~ '^[a-z0-9-]+$')
);

ALTER TABLE public.subcategories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read subcategories"
  ON public.subcategories FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can insert subcategories"
  ON public.subcategories FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update subcategories"
  ON public.subcategories FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete subcategories"
  ON public.subcategories FOR DELETE
  TO anon, authenticated
  USING (true);

INSERT INTO public.subcategories (parent_slug, name, slug, sort_order)
VALUES
  ('canapes', 'Canapés fixes', 'canapes-fixes', 10),
  ('canapes', 'Convertibles', 'convertibles', 20),
  ('tables', 'Tables basses', 'tables-basses', 10),
  ('tables', 'Tables de repas', 'tables-repas', 20),
  ('literie', 'Matelas', 'matelas', 10),
  ('literie', 'Sommiers', 'sommiers', 20),
  ('literie', 'Linge de lit', 'linge-de-lit', 30)
ON CONFLICT (parent_slug, slug) DO UPDATE SET
  name = EXCLUDED.name,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

CREATE INDEX IF NOT EXISTS subcategories_parent_sort_idx
  ON public.subcategories (parent_slug, sort_order, name);
