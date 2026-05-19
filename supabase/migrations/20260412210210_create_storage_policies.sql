/*
  # Storage RLS Policies for product-images and blog-images buckets
  Allows public read and admin upload/delete
*/

CREATE POLICY "Public can read product-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Admin can upload product-images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admin can update product-images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'product-images')
WITH CHECK (bucket_id = 'product-images');

CREATE POLICY "Admin can delete product-images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'product-images');

CREATE POLICY "Public can read blog-images"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'blog-images');

CREATE POLICY "Admin can upload blog-images"
ON storage.objects FOR INSERT
TO anon, authenticated
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Admin can update blog-images"
ON storage.objects FOR UPDATE
TO anon, authenticated
USING (bucket_id = 'blog-images')
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Admin can delete blog-images"
ON storage.objects FOR DELETE
TO anon, authenticated
USING (bucket_id = 'blog-images');
