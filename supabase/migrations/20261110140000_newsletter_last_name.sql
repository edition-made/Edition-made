-- Nom de famille des inscrits newsletter (prénom, nom, téléphone et e-mail sont obligatoires)
ALTER TABLE newsletter_subscribers
  ADD COLUMN IF NOT EXISTS last_name text NOT NULL DEFAULT '';
