-- Le site est servi sur editionmade.com : aligne les URL canoniques des articles
-- créés avec l'ancien domaine editionmade.fr.
UPDATE public.blog_posts
SET canonical_url = replace(canonical_url, 'https://editionmade.fr', 'https://editionmade.com'),
    updated_at = now()
WHERE canonical_url LIKE 'https://editionmade.fr%';
