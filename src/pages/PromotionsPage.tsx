import { useState, useEffect } from 'react';
import { Flame, Tag } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dbProductToProduct } from '../lib/productUtils';
import ProductCard from '../components/ui/ProductCard';
import { Product } from '../types';

export default function PromotionsPage() {
  const [promoProducts, setPromoProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .gte('discount', 1)
      .order('discount', { ascending: false })
      .then(({ data }) => {
        setPromoProducts((data || []).map(dbProductToProduct));
        setLoading(false);
      });
  }, []);

  const maxDiscount = promoProducts.length > 0 ? Math.max(...promoProducts.map(p => p.discount || 0)) : 0;

  return (
    <div className="bg-white">
      <div className="bg-black text-white py-12">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Flame size={20} className="text-[#fff500]" />
                <span className="text-[#fff500] text-xs font-black uppercase tracking-wide">Déstockage permanent</span>
              </div>
              <h1 className="font-display font-bold text-4xl text-white mb-2">
                Promotions &amp; Outlet
              </h1>
              <p className="text-gray-400 text-sm">
                Mobilier haut de gamme à prix déstockés — Arrivages et bonnes affaires toute l'année
              </p>
            </div>
            <div className="flex gap-4">
              <div className="bg-[#fff500] p-4 text-center">
                <p className="font-black text-3xl text-black leading-none">-{maxDiscount}%</p>
                <p className="text-black text-xs font-bold">Maximum</p>
              </div>
              <div className="bg-white/10 p-4 text-center">
                <p className="font-black text-3xl text-white leading-none">{promoProducts.length}</p>
                <p className="text-gray-400 text-xs">Produits</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-[#fff500] py-3">
        <div className="max-w-screen-xl mx-auto px-4 flex flex-wrap items-center gap-4 text-sm font-bold">
          <Tag size={16} className="text-black" />
          <span>Tous ces produits sont en stock et disponibles</span>
          <span className="text-black/50">·</span>
          <span>Livraison France entière</span>
          <span className="text-black/50">·</span>
          <span>Retrait en magasin</span>
          <span className="text-black/50">·</span>
          <span>Paiement en plusieurs fois</span>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-10">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {promoProducts.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
        )}

        <div className="mt-14 bg-gray-50 p-8">
          <h2 className="font-display font-bold text-xl mb-3">Déstockage mobilier haut de gamme — Edition Made</h2>
          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl">
            Chez Edition Made, le déstockage est notre métier. Nous sélectionnons les meilleures pièces de mobilier et décoration haut de gamme pour vous les proposer à des prix d'usine exceptionnels. Canapés design, tables en bois massif, fauteuils premium, literie de qualité — tout est disponible avec des remises allant jusqu'à -60%.
          </p>
          <p className="text-sm text-gray-600 leading-relaxed max-w-3xl mt-3">
            Notre showroom de 500m² à Saint-Maurice (Val-de-Marne) vous accueille 7j/7 pour voir et tester chaque produit. Livraison France entière ou retrait gratuit en magasin. Paiement en plusieurs fois avec Alma.
          </p>
        </div>
      </div>
    </div>
  );
}
