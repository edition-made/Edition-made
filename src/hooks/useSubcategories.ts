import { useCallback, useEffect, useState } from 'react';
import { categories } from '../data/categories';
import { supabase } from '../lib/supabase';

export type ManagedSubcategory = {
  id: string;
  name: string;
  slug: string;
  parentSlug: string;
  sortOrder: number;
};

const fallbackSubcategories: ManagedSubcategory[] = categories.flatMap(category =>
  (category.subcategories || []).map((subcategory, index) => ({
    id: subcategory.id,
    name: subcategory.name,
    slug: subcategory.slug,
    parentSlug: category.slug,
    sortOrder: (index + 1) * 10,
  }))
);

export function useSubcategories() {
  const [subcategories, setSubcategories] = useState<ManagedSubcategory[]>(fallbackSubcategories);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const refresh = useCallback(async () => {
    const { data, error: queryError } = await supabase
      .from('subcategories')
      .select('id, name, slug, parent_slug, sort_order')
      .order('parent_slug')
      .order('sort_order')
      .order('name');

    if (queryError) {
      setError(true);
    } else {
      setError(false);
      setSubcategories((data || []).map(row => ({
        id: row.id,
        name: row.name,
        slug: row.slug,
        parentSlug: row.parent_slug,
        sortOrder: row.sort_order ?? 0,
      })));
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    void refresh();

    const channel = supabase
      .channel('public-subcategories-navigation')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'subcategories' }, () => {
        void refresh();
      })
      .subscribe();

    const handleLocalRefresh = () => void refresh();
    const handleStorageRefresh = (event: StorageEvent) => {
      if (event.key === 'editionmade:subcategories-version') void refresh();
    };
    window.addEventListener('editionmade:subcategories-changed', handleLocalRefresh);
    window.addEventListener('storage', handleStorageRefresh);

    return () => {
      window.removeEventListener('editionmade:subcategories-changed', handleLocalRefresh);
      window.removeEventListener('storage', handleStorageRefresh);
      void supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { subcategories, loading, error, refresh };
}

export function notifySubcategoriesChanged() {
  window.dispatchEvent(new Event('editionmade:subcategories-changed'));
  try {
    localStorage.setItem('editionmade:subcategories-version', String(Date.now()));
  } catch {
    // La mise à jour du même onglet et Supabase Realtime restent actives.
  }
}
