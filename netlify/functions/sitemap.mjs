import { createClient } from '@supabase/supabase-js';

const SITE_URL = 'https://editionmade.com';

const STATIC_PAGES = [
  { path: '/', changefreq: 'daily', priority: '1.0' },
  { path: '/promotions', changefreq: 'daily', priority: '0.9' },
  { path: '/arrivage', changefreq: 'daily', priority: '0.9' },
  { path: '/magasin', changefreq: 'monthly', priority: '0.7' },
  { path: '/blog', changefreq: 'weekly', priority: '0.8' },
  { path: '/contact', changefreq: 'monthly', priority: '0.5' },
  { path: '/faq', changefreq: 'monthly', priority: '0.5' },
  { path: '/livraison', changefreq: 'monthly', priority: '0.4' },
  { path: '/retours', changefreq: 'monthly', priority: '0.4' },
  { path: '/mentions-legales', changefreq: 'yearly', priority: '0.2' },
];

const CATEGORY_PATHS = [
  '/categorie/canapes',
  '/categorie/fauteuils-poufs',
  '/categorie/meubles',
  '/categorie/tables',
  '/categorie/chaises-tabourets',
  '/categorie/accessoires-decoration',
  '/categorie/literie',
  '/categorie/mobilier-exterieur',
];

function escapeXml(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&apos;');
}

function validDate(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function urlEntry({ path, lastmod, changefreq, priority }) {
  const fields = [`<loc>${escapeXml(`${SITE_URL}${path}`)}</loc>`];
  const normalizedDate = validDate(lastmod);
  if (normalizedDate) fields.push(`<lastmod>${normalizedDate}</lastmod>`);
  if (changefreq) fields.push(`<changefreq>${changefreq}</changefreq>`);
  if (priority) fields.push(`<priority>${priority}</priority>`);
  return `  <url>${fields.join('')}</url>`;
}

export const handler = async () => {
  const entries = [
    ...STATIC_PAGES,
    ...CATEGORY_PATHS.map(path => ({ path, changefreq: 'weekly', priority: '0.8' })),
  ];

  try {
    const supabase = createClient(
      process.env.VITE_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
    );

    const [productsResult, postsResult, subcategoriesResult] = await Promise.all([
      supabase.from('products').select('slug, updated_at').not('slug', 'is', null),
      supabase.from('blog_posts').select('slug, updated_at, published_at').eq('published', true).not('slug', 'is', null),
      supabase.from('subcategories').select('parent_slug, slug, updated_at').order('sort_order'),
    ]);

    if (productsResult.error) console.error('[sitemap] Products:', productsResult.error.message);
    if (postsResult.error) console.error('[sitemap] Blog:', postsResult.error.message);
    if (subcategoriesResult.error) console.error('[sitemap] Subcategories:', subcategoriesResult.error.message);

    for (const subcategory of subcategoriesResult.data || []) {
      entries.push({
        path: `/categorie/${encodeURIComponent(subcategory.parent_slug)}/${encodeURIComponent(subcategory.slug)}`,
        lastmod: subcategory.updated_at,
        changefreq: 'weekly',
        priority: '0.7',
      });
    }

    for (const product of productsResult.data || []) {
      entries.push({
        path: `/produit/${encodeURIComponent(product.slug)}`,
        lastmod: product.updated_at,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    for (const post of postsResult.data || []) {
      entries.push({
        path: `/blog/${encodeURIComponent(post.slug)}`,
        lastmod: post.updated_at || post.published_at,
        changefreq: 'monthly',
        priority: '0.7',
      });
    }
  } catch (error) {
    console.error('[sitemap] Dynamic URLs:', error);
  }

  const uniqueEntries = [...new Map(entries.map(entry => [entry.path, entry])).values()];
  const body = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
    ...uniqueEntries.map(urlEntry),
    '</urlset>',
  ].join('\n');

  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/xml; charset=UTF-8',
      'Cache-Control': 'public, max-age=0, s-maxage=3600, stale-while-revalidate=86400',
      'X-Robots-Tag': 'noindex',
    },
    body,
  };
};
