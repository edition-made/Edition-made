import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { SlidersHorizontal, X, ChevronDown, ChevronUp } from 'lucide-react';
import { categories } from '../data/categories';
import { supabase } from '../lib/supabase';
import { dbProductToProduct } from '../lib/productUtils';
import ProductCard from '../components/ui/ProductCard';
import { Product } from '../types';

const sortOptions = [
  { value: 'promo', label: 'Meilleures promotions' },
  { value: 'price_asc', label: 'Prix croissant' },
  { value: 'price_desc', label: 'Prix décroissant' },
  { value: 'newest', label: 'Nouveautés' },
  { value: 'rating', label: 'Mieux notés' },
];

export default function CategoryPage() {
  const { slug } = useParams<{ slug: string }>();
  const [sortBy, setSortBy] = useState('promo');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 5000]);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedBadges, setSelectedBadges] = useState<string[]>([]);
  const [allProducts, setAllProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const category = categories.find(c => c.slug === slug);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    supabase
      .from('products')
      .select('*')
      .eq('category', slug)
      .eq('in_stock', true)
      .then(({ data }) => {
        setAllProducts((data || []).map(dbProductToProduct));
        setLoading(false);
      });
  }, [slug]);

  const categoryProducts = useMemo(() => {
    let filtered = allProducts;

    if (selectedBadges.length > 0) {
      filtered = filtered.filter(p => p.badge && selectedBadges.includes(p.badge));
    }

    filtered = filtered.filter(p => p.price >= priceRange[0] && p.price <= priceRange[1]);

    switch (sortBy) {
      case 'promo': return [...filtered].sort((a, b) => (b.discount || 0) - (a.discount || 0));
      case 'price_asc': return [...filtered].sort((a, b) => a.price - b.price);
      case 'price_desc': return [...filtered].sort((a, b) => b.price - a.price);
      case 'newest': return [...filtered].sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
      case 'rating': return [...filtered].sort((a, b) => (b.rating || 0) - (a.rating || 0));
      default: return filtered;
    }
  }, [allProducts, sortBy, priceRange, selectedBadges]);

  if (!category) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Catégorie introuvable</h1>
        <Link to="/" className="btn-primary">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="bg-black text-white py-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-xs text-gray-400 mb-2 flex items-center gap-1">
            <Link to="/" className="hover:text-white">Accueil</Link>
            <span>/</span>
            <span className="text-white">{category.name}</span>
          </div>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-2">{category.name}</h1>
          {category.description && (
            <p className="text-gray-400 text-sm">{category.description}</p>
          )}
          <div className="flex items-center gap-4 mt-4">
            <span className="bg-[#fff500] text-black text-xs font-black px-2 py-1">
              {categoryProducts.length} produits
            </span>
            <span className="text-gray-400 text-xs">Prix d'usine — Jusqu'à -60%</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {category.subcategories && category.subcategories.length > 0 && (
          <div className="flex gap-2 mb-6 flex-wrap">
            <Link
              to={`/categorie/${category.slug}`}
              className="px-4 py-2 bg-black text-white text-xs font-bold hover:bg-gray-900 transition-colors"
            >
              Tout voir
            </Link>
            {category.subcategories.map(sub => (
              <Link
                key={sub.id}
                to={`/categorie/${category.slug}/${sub.slug}`}
                className="px-4 py-2 border border-gray-300 text-xs font-semibold hover:border-black hover:bg-black hover:text-white transition-colors"
              >
                {sub.name}
              </Link>
            ))}
          </div>
        )}

        <div className="flex items-center justify-between gap-4 mb-6">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 border border-gray-300 px-4 py-2 text-sm font-semibold hover:border-black transition-colors"
          >
            <SlidersHorizontal size={16} />
            Filtrer
            {showFilters ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>

          <div className="flex items-center gap-3 ml-auto">
            <span className="text-sm text-gray-500 hidden sm:block">{categoryProducts.length} résultats</span>
            <select
              value={sortBy}
              onChange={e => setSortBy(e.target.value)}
              className="border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:border-black"
            >
              {sortOptions.map(opt => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
          </div>
        </div>

        {showFilters && (
          <div className="bg-gray-50 p-5 mb-6 grid grid-cols-1 md:grid-cols-3 gap-6 animate-slide-up">
            <div>
              <h3 className="font-bold text-sm mb-3 uppercase tracking-wide">Badge produit</h3>
              <div className="flex flex-wrap gap-2">
                {[
                  { value: 'promo', label: 'Promo' },
                  { value: 'new', label: 'Nouvel arrivage' },
                  { value: 'last', label: 'Dernière pièce' },
                  { value: 'bestseller', label: 'Best seller' },
                ].map(badge => (
                  <button
                    key={badge.value}
                    onClick={() => setSelectedBadges(prev =>
                      prev.includes(badge.value) ? prev.filter(b => b !== badge.value) : [...prev, badge.value]
                    )}
                    className={`px-3 py-1 text-xs font-bold border transition-colors ${
                      selectedBadges.includes(badge.value)
                        ? 'bg-black text-white border-black'
                        : 'border-gray-300 hover:border-black'
                    }`}
                  >
                    {badge.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-bold text-sm mb-3 uppercase tracking-wide">Prix maximum</h3>
              <input
                type="range"
                min={0}
                max={5000}
                step={50}
                value={priceRange[1]}
                onChange={e => setPriceRange([priceRange[0], Number(e.target.value)])}
                className="w-full accent-black"
              />
              <div className="flex justify-between text-xs text-gray-500 mt-1">
                <span>0 €</span>
                <span className="font-bold text-black">{priceRange[1]} €</span>
              </div>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => { setSelectedBadges([]); setPriceRange([0, 5000]); }}
                className="flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors border-b border-transparent hover:border-black"
              >
                <X size={14} /> Réinitialiser les filtres
              </button>
            </div>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : categoryProducts.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">Aucun produit trouvé avec ces filtres.</p>
            <button onClick={() => { setSelectedBadges([]); setPriceRange([0, 5000]); }} className="btn-outline">
              Réinitialiser les filtres
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {categoryProducts.map(product => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}

        {category.description && (
          <div className="mt-14 pt-10 border-t border-gray-100">
            <h2 className="font-display font-bold text-xl mb-3">{category.name} à prix d'usine — Edition Made</h2>
            <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
              Découvrez notre sélection de {category.name.toLowerCase()} haut de gamme à prix déstockés.
              Chez Edition Made, nous proposons du mobilier premium sélectionné avec soin, disponible en quantités limitées.
              Notre showroom de 500m² à Saint-Maurice (Val-de-Marne) vous permet de voir et tester chaque produit.
              Livraison France entière ou retrait gratuit en magasin. Paiement en plusieurs fois avec Alma.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
