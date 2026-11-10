/*
  # Newsletter + code promo de bienvenue (-5 %)

  - newsletter_subscribers : inscrits (double opt-in par e-mail) et code promo unique
  - newsletter_campaigns   : historique des newsletters envoyées depuis l'admin
  - orders.promo_code / discount_amount : trace du code utilisé à la commande

  SÉCURITÉ : RLS activé SANS aucune policy sur les deux tables newsletter.
  Les adresses e-mail ne sont donc accessibles ni en lecture ni en écriture avec la
  clé anon : tout passe par les fonctions Netlify (clé service role).
*/

CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  first_name text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'unsubscribed')),
  confirm_token text NOT NULL,
  unsubscribe_token text NOT NULL,
  promo_code text,
  source text NOT NULL DEFAULT 'home',
  consent_at timestamptz NOT NULL DEFAULT now(),
  confirmation_sent_at timestamptz,
  confirmed_at timestamptz,
  unsubscribed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_email_idx
  ON newsletter_subscribers (lower(email));
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_confirm_token_idx
  ON newsletter_subscribers (confirm_token);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_unsub_token_idx
  ON newsletter_subscribers (unsubscribe_token);
CREATE UNIQUE INDEX IF NOT EXISTS newsletter_subscribers_promo_code_idx
  ON newsletter_subscribers (promo_code) WHERE promo_code IS NOT NULL;

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

CREATE TABLE IF NOT EXISTS newsletter_campaigns (
  id uuid PRIMARY KEY,
  subject text NOT NULL,
  html text NOT NULL,
  recipients_total integer NOT NULL DEFAULT 0,
  sent_count integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE newsletter_campaigns ENABLE ROW LEVEL SECURITY;

ALTER TABLE orders
  ADD COLUMN IF NOT EXISTS promo_code text,
  ADD COLUMN IF NOT EXISTS discount_amount numeric(10,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS orders_promo_code_idx ON orders (promo_code) WHERE promo_code IS NOT NULL;
