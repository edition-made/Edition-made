/*
  # Réglages du code promo de bienvenue (pilotés depuis l'admin)

  Ligne unique (id = 1). RLS activé sans policy : lecture/écriture uniquement
  via les fonctions Netlify (clé service role).
*/
CREATE TABLE IF NOT EXISTS newsletter_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  promo_enabled boolean NOT NULL DEFAULT true,
  promo_percent numeric(5,2) NOT NULL DEFAULT 5 CHECK (promo_percent > 0 AND promo_percent <= 90),
  promo_mode text NOT NULL DEFAULT 'unique' CHECK (promo_mode IN ('unique', 'fixed')),
  fixed_code text NOT NULL DEFAULT '',
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO newsletter_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE newsletter_settings ENABLE ROW LEVEL SECURITY;
