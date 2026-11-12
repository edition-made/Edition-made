import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

// Le site est une SPA : GA4 ne voit que le chargement initial, on envoie donc un page_view à chaque navigation.
export default function GoogleAnalytics() {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (pathname.startsWith('/admin')) return;
    // Petit délai : le titre de la page est mis à jour par la page elle-même après le rendu
    const timer = setTimeout(() => {
      window.gtag?.('event', 'page_view', {
        page_path: pathname + search,
        page_location: window.location.href,
        page_title: document.title,
      });
    }, 150);
    return () => clearTimeout(timer);
  }, [pathname, search]);

  return null;
}
