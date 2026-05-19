import { categories } from '../../data/categories';
import CategoryCard from '../ui/CategoryCard';
import SectionHeader from '../ui/SectionHeader';

export default function CategoriesSection() {
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
              className={index === 0 ? 'lg:col-span-2 lg:row-span-2 lg:aspect-auto' : ''}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
