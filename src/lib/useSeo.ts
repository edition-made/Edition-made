import { useEffect } from 'react';

export const SITE_URL = 'https://editionmade.com';
export const SITE_NAME = 'Edition Made';
export const SITE_LOGO =
  'https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp';

export type SeoOptions = {
  title: string;
  description: string;
  canonical: string;
  keywords?: string;
  image?: string;
  type?: 'website' | 'article';
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  jsonLd?: Record<string, unknown>[];
};

type Restore = () => void;

// Met à jour (ou crée) une balise du <head> et renvoie la fonction qui rétablit l'état d'origine.
function setTag(tag: 'meta' | 'link', key: 'name' | 'property' | 'rel', id: string, attr: 'content' | 'href', value: string): Restore {
  let el = document.head.querySelector<HTMLElement>(`${tag}[${key}="${id}"]`);
  const created = !el;
  if (!el) {
    el = document.createElement(tag);
    el.setAttribute(key, id);
    document.head.appendChild(el);
  }
  const previous = el.getAttribute(attr);
  el.setAttribute(attr, value);
  return () => {
    if (created) el?.remove();
    else if (previous !== null) el?.setAttribute(attr, previous);
  };
}

/**
 * Applique les balises SEO d'une page (title, description, canonical, Open Graph, Twitter, JSON-LD)
 * et les restaure en quittant la page. Passer `null` tant que les données ne sont pas chargées.
 */
export function useSeo(options: SeoOptions | null) {
  const serialized = options ? JSON.stringify(options) : '';

  useEffect(() => {
    if (!serialized) return;
    const seo = JSON.parse(serialized) as SeoOptions;
    const restores: Restore[] = [];
    const previousTitle = document.title;

    document.title = seo.title;
    restores.push(() => { document.title = previousTitle; });

    restores.push(setTag('meta', 'name', 'description', 'content', seo.description));
    if (seo.keywords) restores.push(setTag('meta', 'name', 'keywords', 'content', seo.keywords));
    restores.push(setTag('link', 'rel', 'canonical', 'href', seo.canonical));

    restores.push(setTag('meta', 'property', 'og:type', 'content', seo.type ?? 'website'));
    restores.push(setTag('meta', 'property', 'og:title', 'content', seo.title));
    restores.push(setTag('meta', 'property', 'og:description', 'content', seo.description));
    restores.push(setTag('meta', 'property', 'og:url', 'content', seo.canonical));
    restores.push(setTag('meta', 'name', 'twitter:title', 'content', seo.title));
    restores.push(setTag('meta', 'name', 'twitter:description', 'content', seo.description));
    if (seo.image) {
      restores.push(setTag('meta', 'property', 'og:image', 'content', seo.image));
      restores.push(setTag('meta', 'name', 'twitter:image', 'content', seo.image));
    }
    if (seo.type === 'article') {
      if (seo.publishedTime) restores.push(setTag('meta', 'property', 'article:published_time', 'content', seo.publishedTime));
      if (seo.modifiedTime) restores.push(setTag('meta', 'property', 'article:modified_time', 'content', seo.modifiedTime));
      if (seo.section) restores.push(setTag('meta', 'property', 'article:section', 'content', seo.section));
    }

    const scripts = (seo.jsonLd ?? []).map(data => {
      const script = document.createElement('script');
      script.type = 'application/ld+json';
      script.dataset.seo = 'page';
      script.text = JSON.stringify(data);
      document.head.appendChild(script);
      return script;
    });

    return () => {
      restores.reverse().forEach(restore => restore());
      scripts.forEach(script => script.remove());
    };
  }, [serialized]);
}
