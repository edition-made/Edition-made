import { Link } from 'react-router-dom';
import { ShoppingCart, Eye } from 'lucide-react';
import { Product } from '../../types';
import { useCart } from '../../context/CartContext';

interface ProductCardProps {
  product: Product;
  className?: string;
}

const badgeConfig = {
  promo: { label: 'Promo', class: 'badge-promo' },
  new: { label: 'Nouvel arrivage', class: 'badge-new' },
  last: { label: 'Dernière pièce', class: 'badge-last' },
  bestseller: { label: 'Best seller', class: 'badge-best' },
};

export default function ProductCard({ product, className = '' }: ProductCardProps) {
  const { addItem } = useCart();

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addItem(product);
  };

  return (
    <Link to={`/produit/${product.slug}`} className={`product-card group block ${className}`}>
      <div className="product-img-zoom relative aspect-[4/3] bg-gray-100">
        <img
          src={product.images[0]}
          alt={product.name}
          className="w-full h-full object-cover"
          loading="lazy"
        />
        {product.badge && (
          <div className="absolute top-2 left-2">
            <span className={badgeConfig[product.badge]?.class}>
              {badgeConfig[product.badge]?.label}
            </span>
          </div>
        )}
        {product.discount && (
          <div className="absolute top-2 right-2">
            <span className="price-discount">-{product.discount}%</span>
          </div>
        )}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/5 transition-colors flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={handleAddToCart}
            className="bg-[#fff500] text-black p-2.5 hover:bg-[#e6dc00] transition-colors shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-200"
            title="Ajouter au panier"
          >
            <ShoppingCart size={18} />
          </button>
          <button
            className="bg-white text-black p-2.5 hover:bg-gray-100 transition-colors shadow-lg transform translate-y-2 group-hover:translate-y-0 transition-transform duration-300"
            title="Aperçu rapide"
            onClick={e => { e.preventDefault(); e.stopPropagation(); }}
          >
            <Eye size={18} />
          </button>
        </div>
      </div>

      <div className="p-3">
        <p className="text-xs text-gray-500 uppercase tracking-wide mb-1 font-medium">{product.brand || 'Edition Made'}</p>
        <h3 className="text-sm font-semibold text-black leading-snug mb-2 line-clamp-2">{product.name}</h3>

        <div className="flex items-center justify-between gap-2">
          <div className="flex items-baseline gap-2">
            <span className="price-current">{product.price} €</span>
            {product.originalPrice && (
              <span className="price-original">{product.originalPrice} €</span>
            )}
          </div>
          {product.stockCount && product.stockCount <= 3 && (
            <span className="text-red-600 text-xs font-bold">
              {product.stockCount} restant{product.stockCount > 1 ? 's' : ''}
            </span>
          )}
        </div>

        {product.rating && (
          <div className="flex items-center gap-1 mt-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map(star => (
                <span key={star} className={`text-xs ${star <= Math.round(product.rating!) ? 'text-[#fff500]' : 'text-gray-300'}`}>★</span>
              ))}
            </div>
            <span className="text-xs text-gray-500">({product.reviewCount})</span>
          </div>
        )}
      </div>
    </Link>
  );
}
