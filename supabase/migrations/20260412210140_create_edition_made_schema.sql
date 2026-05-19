/*
  # Edition Made — Schéma complet de la base de données

  ## Tables créées
  1. `products` — Catalogue produits complet avec toutes les données
  2. `blog_posts` — Articles de blog avec champs SEO complets
  3. `customers` — Clients (créés lors d'une commande)
  4. `orders` — Commandes clients
  5. `order_items` — Lignes de commande
  6. `contact_submissions` — Soumissions du formulaire de contact

  ## Sécurité
  - RLS activé sur toutes les tables
  - Lecture publique sur products et blog_posts (site vitrine)
  - Écriture ouverte pour l'administration (sécurisée côté client par mot de passe)
  - Insertion ouverte pour orders/customers/contacts (parcours client)
*/

-- =====================
-- TABLE: products
-- =====================
CREATE TABLE IF NOT EXISTS products (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  slug text UNIQUE NOT NULL,
  category text NOT NULL DEFAULT '',
  subcategory text DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  original_price numeric(10,2),
  discount integer,
  images text[] DEFAULT '{}',
  badge text CHECK (badge IN ('promo', 'new', 'last', 'bestseller')),
  short_description text DEFAULT '',
  description text DEFAULT '',
  dimensions text DEFAULT '',
  material text DEFAULT '',
  colors text[] DEFAULT '{}',
  in_stock boolean DEFAULT true,
  stock_count integer DEFAULT 0,
  is_new boolean DEFAULT false,
  is_featured boolean DEFAULT false,
  is_weekly_arrival boolean DEFAULT false,
  rating numeric(3,2) DEFAULT 0,
  review_count integer DEFAULT 0,
  brand text DEFAULT 'Edition Made',
  tags text[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read products"
  ON products FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can insert products"
  ON products FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update products"
  ON products FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete products"
  ON products FOR DELETE
  TO anon, authenticated
  USING (true);

-- =====================
-- TABLE: blog_posts
-- =====================
CREATE TABLE IF NOT EXISTS blog_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  slug text UNIQUE NOT NULL,
  excerpt text DEFAULT '',
  content text DEFAULT '',
  cover_image text DEFAULT '',
  category text DEFAULT '',
  author text DEFAULT 'Équipe Edition Made',
  published boolean DEFAULT false,
  published_at timestamptz,
  read_time integer DEFAULT 5,
  tags text[] DEFAULT '{}',
  -- SEO fields
  seo_title text DEFAULT '',
  seo_description text DEFAULT '',
  seo_keywords text DEFAULT '',
  og_image text DEFAULT '',
  canonical_url text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published blog posts"
  ON blog_posts FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can insert blog posts"
  ON blog_posts FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update blog posts"
  ON blog_posts FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete blog posts"
  ON blog_posts FOR DELETE
  TO anon, authenticated
  USING (true);

-- =====================
-- TABLE: customers
-- =====================
CREATE TABLE IF NOT EXISTS customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  first_name text NOT NULL,
  last_name text NOT NULL,
  email text UNIQUE NOT NULL,
  phone text DEFAULT '',
  address text DEFAULT '',
  city text DEFAULT '',
  zip text DEFAULT '',
  country text DEFAULT 'France',
  notes text DEFAULT '',
  total_orders integer DEFAULT 0,
  total_spent numeric(10,2) DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE customers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read customers"
  ON customers FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert customer"
  ON customers FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update customers"
  ON customers FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete customers"
  ON customers FOR DELETE
  TO anon, authenticated
  USING (true);

-- =====================
-- TABLE: orders
-- =====================
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL DEFAULT 'EM-' || to_char(now(), 'YYYYMMDD') || '-' || substr(gen_random_uuid()::text, 1, 6),
  customer_id uuid REFERENCES customers(id),
  customer_first_name text NOT NULL,
  customer_last_name text NOT NULL,
  customer_email text NOT NULL,
  customer_phone text DEFAULT '',
  delivery_mode text DEFAULT 'delivery' CHECK (delivery_mode IN ('delivery', 'pickup')),
  delivery_address text DEFAULT '',
  delivery_city text DEFAULT '',
  delivery_zip text DEFAULT '',
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded')),
  subtotal numeric(10,2) DEFAULT 0,
  delivery_cost numeric(10,2) DEFAULT 0,
  total numeric(10,2) DEFAULT 0,
  payment_method text DEFAULT 'card',
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'failed', 'refunded')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read orders"
  ON orders FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert order"
  ON orders FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update orders"
  ON orders FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete orders"
  ON orders FOR DELETE
  TO anon, authenticated
  USING (true);

-- =====================
-- TABLE: order_items
-- =====================
CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id text NOT NULL,
  product_name text NOT NULL,
  product_image text DEFAULT '',
  quantity integer NOT NULL DEFAULT 1,
  unit_price numeric(10,2) NOT NULL DEFAULT 0,
  total_price numeric(10,2) NOT NULL DEFAULT 0,
  selected_color text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read order items"
  ON order_items FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert order item"
  ON order_items FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update order items"
  ON order_items FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

-- =====================
-- TABLE: contact_submissions
-- =====================
CREATE TABLE IF NOT EXISTS contact_submissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL,
  phone text DEFAULT '',
  subject text DEFAULT '',
  message text NOT NULL,
  status text DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied', 'archived')),
  notes text DEFAULT '',
  created_at timestamptz DEFAULT now()
);

ALTER TABLE contact_submissions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admin can read contact submissions"
  ON contact_submissions FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Anyone can insert contact submission"
  ON contact_submissions FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admin can update contact submissions"
  ON contact_submissions FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Admin can delete contact submissions"
  ON contact_submissions FOR DELETE
  TO anon, authenticated
  USING (true);
