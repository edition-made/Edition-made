/*
  # Horaires du magasin (pilotés depuis l'admin)

  Ligne unique (id = 1). hours = tableau JSON de 7 jours :
  [{ "day": 1, "closed": false, "open": "10:00", "close": "18:30" }, ...]  (day : 0 = dimanche … 6 = samedi)
  Lecture publique, écriture ouverte comme les autres réglages admin du projet.
*/
CREATE TABLE IF NOT EXISTS store_settings (
  id integer PRIMARY KEY DEFAULT 1 CHECK (id = 1),
  hours jsonb NOT NULL DEFAULT '[
    {"day":1,"closed":false,"open":"10:00","close":"18:30"},
    {"day":2,"closed":false,"open":"10:00","close":"18:30"},
    {"day":3,"closed":false,"open":"10:00","close":"18:30"},
    {"day":4,"closed":false,"open":"10:00","close":"18:30"},
    {"day":5,"closed":false,"open":"10:00","close":"18:30"},
    {"day":6,"closed":false,"open":"10:00","close":"18:30"},
    {"day":0,"closed":false,"open":"14:00","close":"18:30"}
  ]'::jsonb,
  updated_at timestamptz NOT NULL DEFAULT now()
);

INSERT INTO store_settings (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

ALTER TABLE store_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read store settings"
  ON store_settings FOR SELECT TO anon, authenticated USING (true);

CREATE POLICY "Admin can insert store settings"
  ON store_settings FOR INSERT TO anon, authenticated WITH CHECK (id = 1);

CREATE POLICY "Admin can update store settings"
  ON store_settings FOR UPDATE TO anon, authenticated USING (true) WITH CHECK (id = 1);
