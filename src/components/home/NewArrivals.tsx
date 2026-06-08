import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { dbProductToProduct } from '../../lib/productUtils';
import ProductCard from '../ui/ProductCard';
import { Product } from '../../types';

export default function NewArrivals() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const fetchArrivals = async () => {
      const filters = { is_weekly_arrival: true, in_stock: true };
      let { data, error } = await supabase
        .from('products').select('*')
        .eq('is_weekly_arrival', filters.is_weekly_arrival)
        .eq('in_stock', filters.in_stock)
        .order('sort_order', { ascending: true, nullsFirst: false })
        .limit(8);
      if (error) {
        ({ data } = await supabase
          .from('products').select('*')
          .eq('is_weekly_arrival', filters.is_weekly_arrival)
          .eq('in_stock', filters.in_stock)
          .order('created_at', { ascending: false })
          .limit(8));
      }
      if (data && data.length > 0) setProducts(data.map(dbProductToProduct));
      else setProducts([]);
    };
    fetchArrivals();
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-14 bg-[#dad5c7]/20">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="flex items-center justify-between mb-8">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="bg-black text-[#fff500] text-xs font-black px-2 py-1 uppercase flex items-center gap-1">
                <Sparkles size={11} /> Arrivage de la semaine
              </span>
            </div>
            <h2 className="section-title">Nouveautés &amp; Arrivages</h2>
            <p className="text-gray-500 text-sm mt-1">Des nouvelles pièces arrivent chaque semaine. En quantités limitées.</p>
          </div>
          <Link to="/arrivage" className="hidden md:flex items-center gap-1 text-sm font-bold border-b border-black hover:border-gray-400 hover:text-gray-500 transition-colors">
            Voir tout <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 flex justify-center md:hidden">
          <Link to="/arrivage" className="btn-outline">
            Voir tout l'arrivage <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
