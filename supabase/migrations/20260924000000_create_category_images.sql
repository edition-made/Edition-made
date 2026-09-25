-- Images personnalisées de la section « Nos univers »
CREATE TABLE IF NOT EXISTS public.category_images (
  category_id text PRIMARY KEY,
  category_name text NOT NULL,
  image_url text NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.category_images ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read category images"
  ON public.category_images FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can insert category images"
  ON public.category_images FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update category images"
  ON public.category_images FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete category images"
  ON public.category_images FOR DELETE
  TO anon, authenticated
  USING (true);

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'category-images',
  'category-images',
  true,
  12582912,
  ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
)
ON CONFLICT (id) DO UPDATE SET
  public = EXCLUDED.public,
  file_size_limit = EXCLUDED.file_size_limit,
  allowed_mime_types = EXCLUDED.allowed_mime_types;

CREATE POLICY "Public can read category-images"
  ON storage.objects FOR SELECT
  TO anon, authenticated
  USING (bucket_id = 'category-images');

CREATE POLICY "Admin can upload category-images"
  ON storage.objects FOR INSERT
  TO anon, authenticated
  WITH CHECK (bucket_id = 'category-images');

CREATE POLICY "Admin can update category-images"
  ON storage.objects FOR UPDATE
  TO anon, authenticated
  USING (bucket_id = 'category-images')
  WITH CHECK (bucket_id = 'category-images');

CREATE POLICY "Admin can delete category-images"
  ON storage.objects FOR DELETE
  TO anon, authenticated
  USING (bucket_id = 'category-images');
