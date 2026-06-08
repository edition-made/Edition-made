import { supabase } from './supabase';

export function toSeoSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .slice(0, 80);
}

export function generateSeoFilename(originalName: string, prefix = ''): string {
  const base = originalName.replace(/\.[^/.]+$/, '');
  const slug = toSeoSlug(base);
  const ts = Date.now();
  const name = prefix ? `${toSeoSlug(prefix)}-${slug}-${ts}` : `${slug}-${ts}`;
  return `${name}.webp`;
}

export async function convertToWebP(file: File, quality = 0.85): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) { reject(new Error('Canvas not supported')); return; }
      ctx.drawImage(img, 0, 0);
      canvas.toBlob(
        blob => {
          URL.revokeObjectURL(url);
          if (blob) resolve(blob);
          else reject(new Error('Conversion WebP échouée'));
        },
        'image/webp',
        quality
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Chargement image échoué')); };
    img.src = url;
  });
}

export async function uploadImage(
  file: File,
  bucket: 'product-images' | 'blog-images' | 'category-images',
  prefix = ''
): Promise<string> {
  const webpBlob = await convertToWebP(file);
  const filename = generateSeoFilename(file.name, prefix);
  const webpFile = new File([webpBlob], filename, { type: 'image/webp' });

  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(filename, webpFile, { upsert: false, contentType: 'image/webp' });

  if (error) throw error;

  const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(data.path);
  return urlData.publicUrl;
}

export async function deleteImage(url: string, bucket: 'product-images' | 'blog-images' | 'category-images'): Promise<void> {
  const path = url.split(`/${bucket}/`)[1];
  if (!path) return;
  await supabase.storage.from(bucket).remove([path]);
}
