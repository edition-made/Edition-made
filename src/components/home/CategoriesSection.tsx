import { useState, useEffect } from 'react';
import { categories } from '../../data/categories';
import CategoryCard from '../ui/CategoryCard';
import SectionHeader from '../ui/SectionHeader';
import { supabase } from '../../lib/supabase';

export default function CategoriesSection() {
  const [imageMap, setImageMap] = useState<Record<string, string>>({});

  useEffect(() => {
    supabase.from('category_images').select('category_id, image_url').then(({ data }) => {
      if (data) {
        const map: Record<string, string> = {};
        data.forEach(row => { if (row.image_url) map[row.category_id] = row.image_url; });
        setImageMap(map);
      }
    });
  }, []);

  return (
    <section className="py-14 bg-white">
      <div className="max-w-screen-xl mx-auto px-4">
        <SectionHeader
          title="Nos univers"
          subtitle="Mobilier et décoration haut de gamme à prix déstockés"
          linkHref="/categories"
          linkLabel="Toutes les catégories"
        />

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              imageUrl={imageMap[category.id]}
              className={index === 0 ? 'lg:col-span-2 lg:row-span-2 lg:aspect-auto' : ''}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
