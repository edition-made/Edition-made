import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { Category } from '../../types';

interface CategoryCardProps {
  category: Category;
  className?: string;
  imageUrl?: string;
}

export default function CategoryCard({ category, className = '', imageUrl }: CategoryCardProps) {
  return (
    <Link
      to={`/categorie/${category.slug}`}
      className={`group relative overflow-hidden block aspect-square bg-gray-100 ${className}`}
    >
      <img
        src={imageUrl || category.image}
        alt={category.name}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
      <div className="absolute bottom-0 left-0 right-0 p-4">
        <h3 className="text-white font-display font-bold text-lg leading-tight">{category.name}</h3>
        {category.productCount && (
          <p className="text-gray-300 text-xs mt-1">{category.productCount} produits</p>
        )}
        <div className="flex items-center gap-1 mt-2 text-[#fff500] text-xs font-bold opacity-0 group-hover:opacity-100 transition-opacity transform translate-y-1 group-hover:translate-y-0 duration-300">
          Découvrir <ArrowRight size={12} />
        </div>
      </div>
    </Link>
  );
}
