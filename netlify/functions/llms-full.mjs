import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://editionmade.com';

function markdownText(value) {
  return String(value || '').replace(/[\[\]\r\n]+/g, ' ').replace(/\s+/g, ' ').trim();
}

export const handler = async () => {
  const lines = [
    '# Edition Made — Catalogue détaillé',
    '',
    '> Catalogue public et contenus éditoriaux d’Edition Made, magasin de mobilier haut de gamme à prix déstockés à Saint-Maurice (94).',
    '',
    'Ce document est généré depuis le catalogue actif. Une fiche produit reste la source de référence pour le prix, la remise et la disponibilité.',
    '',
    '## Informations essentielles',
    '',
    `- [Showroom](${SITE_URL}/magasin): 14 avenue des Canadiens, 94410 Saint-Maurice. Lun–Sam 10h00–18h30, dimanche 14h00–18h30.`,
    `- [Livraison](${SITE_URL}/livraison): 6,90 € sous 50 € de produits ; 29 € de 50 € à 299,99 € ; 99 € de 300 € à 999,99 € ; 129 € de 1 000 € à 1 999,99 € ; gratuite dès 2 000 €. Retrait en magasin gratuit.`,
    `- [Retours](${SITE_URL}/retours): Conditions de retour et droit de rétractation.`,
    `- [Contact](${SITE_URL}/contact): +33 6 60 22 25 25 et contact@editionmade.com.`,
    '',
  ];

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    );

    const [productsResult, postsResult] = await Promise.all([
      supabase
        .from('products')
        .select('name, slug, category, price, original_price, discount, short_description, stock_count, in_stock, updated_at')
        .eq('in_stock', true)
        .gt('stock_count', 0)
        .order('category')
        .order('name'),
      supabase
        .from('blog_posts')
        .select('title, slug, excerpt, category, published_at, updated_at')
        .eq('published', true)
        .order('published_at', { ascending: false }),
    ]);

    if (productsResult.error) console.error('[llms-full] Products:', productsResult.error.message);
    if (postsResult.error) console.error('[llms-full] Blog:', postsResult.error.message);

    lines.push('## Produits disponibles', '');
    for (const product of productsResult.data || []) {
      const price = Number(product.price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' });
      const originalPrice = product.original_price
        ? ` au lieu de ${Number(product.original_price).toLocaleString('fr-FR', { style: 'currency', currency: 'EUR' })}`
        : '';
      const discount = product.discount ? `, remise de ${product.discount} %` : '';
      lines.push(
        `- [${markdownText(product.name)}](${SITE_URL}/produit/${encodeURIComponent(product.slug)}): ${price}${originalPrice}${discount}. Catégorie : ${markdownText(product.category)}. Stock : ${product.stock_count}. ${markdownText(product.short_description)}`
      );
    }
    if (!productsResult.data?.length) lines.push('- Aucun produit disponible actuellement.');

    lines.push('', '## Articles et conseils', '');
    for (const post of postsResult.data || []) {
      lines.push(
        `- [${markdownText(post.title)}](${SITE_URL}/blog/${encodeURIComponent(post.slug)}): ${markdownText(post.excerpt)} Catégorie : ${markdownText(post.category)}.`
      );
    }
    if (!postsResult.data?.length) lines.push('- Aucun article publié actuellement.');
  } catch (error) {
    console.error('[llms-full] Dynamic content:', error);
    lines.push('## Catalogue', '', `- [Consulter le catalogue](${SITE_URL}/): Catalogue public Edition Made.`);
  }

  lines.push('', '## Ressources', '',
    `- [Résumé LLM](${SITE_URL}/llms.txt): Présentation concise du site.`,
    `- [Sitemap XML](${SITE_URL}/sitemap.xml): Toutes les URL indexables.`,
    `- [Robots](${SITE_URL}/robots.txt): Directives d’exploration.`
  );

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'text/markdown; charset=UTF-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'Link': '</llms.txt>; rel="describedby"; type="text/markdown"',
      'X-Robots-Tag': 'index, follow',
    },
    body: `${lines.join('\n')}\n`,
  };
};
