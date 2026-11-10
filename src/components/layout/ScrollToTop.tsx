import { useEffect } from 'react';
import { useLocation, useNavigationType } from 'react-router-dom';

// Remonte en haut de page à chaque navigation (clic sur un produit, une catégorie…).
// Sur retour arrière (POP) on laisse le navigateur restaurer la position.
export default function ScrollToTop() {
  const { pathname, search, hash } = useLocation();
  const navigationType = useNavigationType();

  useEffect(() => {
    if (hash || navigationType === 'POP') return;
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, search, hash, navigationType]);

  return null;
}
