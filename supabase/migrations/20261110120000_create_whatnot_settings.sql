/*
  # Paramètres Whatnot (pop-up promotionnel)

  Table à ligne unique (id = 1) pilotée depuis l'admin :
  activation, lien, titre, description, date/heure de début et de fin du live.
  Lecture publique, écriture ouverte comme les autres tables admin du projet.
*/

CREATE TABLE IF NOT EXISTS whatnot_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  enabled boolean NOT NULL DEFAULT false,
  url text NOT NULL DEFAULT '',
  title text NOT NULL DEFAULT 'Nos produits à prix cassés sont aussi sur Whatnot !',
  description text NOT NULL DEFAULT '',
  event_start timestamptz,
  event_end timestamptz,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO whatnot_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE whatnot_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read whatnot settings"
  ON whatnot_settings FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Admin can insert whatnot settings"
  ON whatnot_settings FOR INSERT
  TO anon, authenticated
  WITH CHECK (id = 1);

CREATE POLICY "Admin can update whatnot settings"
  ON whatnot_settings FOR UPDATE
  TO anon, authenticated
  USING (true)
  WITH CHECK (id = 1);
