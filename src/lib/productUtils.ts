import { DbProduct } from './supabase';
import { Product } from '../types';

export function dbProductToProduct(p: DbProduct): Product {
  return {
    id: p.id,
    name: p.name,
    slug: p.slug,
    category: p.category,
    subcategory: p.subcategory,
    price: p.price,
    originalPrice: p.original_price,
    discount: p.discount,
    images: p.images || [],
    badge: p.badge,
    shortDescription: p.short_description,
    description: p.description,
    dimensions: p.dimensions,
    material: p.material,
    colors: p.colors,
    inStock: p.in_stock,
    stockCount: p.stock_count,
    isNew: p.is_new,
    isFeatured: p.is_featured,
    isWeeklyArrival: p.is_weekly_arrival,
    rating: p.rating,
    reviewCount: p.review_count,
    brand: p.brand,
    tags: p.tags,
  };
}
