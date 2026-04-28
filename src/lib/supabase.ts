import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type DbProduct = {
  id: string;
  name: string;
  slug: string;
  category: string;
  subcategory?: string;
  price: number;
  original_price?: number;
  discount?: number;
  images: string[];
  badge?: 'promo' | 'new' | 'last' | 'bestseller';
  short_description: string;
  description: string;
  dimensions?: string;
  material?: string;
  colors?: string[];
  in_stock: boolean;
  stock_count?: number;
  is_new?: boolean;
  is_featured?: boolean;
  is_weekly_arrival?: boolean;
  rating?: number;
  review_count?: number;
  brand?: string;
  tags?: string[];
  created_at: string;
  updated_at: string;
};

export type DbBlogPost = {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  cover_image: string;
  category: string;
  author: string;
  published: boolean;
  published_at?: string;
  read_time: number;
  tags: string[];
  seo_title: string;
  seo_description: string;
  seo_keywords: string;
  og_image: string;
  canonical_url: string;
  created_at: string;
  updated_at: string;
};

export type DbOrder = {
  id: string;
  order_number: string;
  customer_id?: string;
  customer_first_name: string;
  customer_last_name: string;
  customer_email: string;
  customer_phone?: string;
  delivery_mode: 'delivery' | 'pickup';
  delivery_address?: string;
  delivery_city?: string;
  delivery_zip?: string;
  status: 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled' | 'refunded';
  subtotal: number;
  delivery_cost: number;
  total: number;
  payment_method: string;
  payment_status: 'pending' | 'paid' | 'failed' | 'refunded';
  notes?: string;
  created_at: string;
  updated_at: string;
};

export type DbOrderItem = {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  product_image?: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  selected_color?: string;
  created_at: string;
};

export type DbCustomer = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  phone?: string;
  address?: string;
  city?: string;
  zip?: string;
  country: string;
  notes?: string;
  total_orders: number;
  total_spent: number;
  created_at: string;
  updated_at: string;
};

export type DbContactSubmission = {
  id: string;
  name: string;
  email: string;
  phone?: string;
  subject?: string;
  message: string;
  status: 'new' | 'read' | 'replied' | 'archived';
  notes?: string;
  created_at: string;
};
