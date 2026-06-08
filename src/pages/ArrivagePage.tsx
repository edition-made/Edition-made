import { useState, useEffect } from 'react';
import { Sparkles, Calendar } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dbProductToProduct } from '../lib/productUtils';
import ProductCard from '../components/ui/ProductCard';
import { Product } from '../types';

export default function ArrivagePage() {
  const [arrivals, setArrivals] = useState<Product[]>([]);
  const [others, setOthers] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      const fetchWithFallback = async (eq_field: string, eq_val: boolean, lim?: number) => {
        let q = supabase.from('products').select('*').eq(eq_field, eq_val).eq('in_stock', true);
        if (lim) q = q.limit(lim);
        let { data, error } = await q.order('sort_order', { ascending: true, nullsFirst: false });
        if (error) {
          const qf = supabase.from('products').select('*').eq(eq_field, eq_val).eq('in_stock', true);
          ({ data } = await (lim ? qf.limit(lim) : qf).order('created_at', { ascending: false }));
        }
        return data || [];
      };

      const [arrivalData, othersData] = await Promise.all([
        fetchWithFallback('is_weekly_arrival', true),
        fetchWithFallback('is_weekly_arrival', false, 8),
      ]);

      setArrivals(arrivalData.map(dbProductToProduct));
      setOthers(othersData.map(dbProductToProduct));
      setLoading(false);
    };
    fetchData();
  }, []);

  return (
    <div className="bg-white">
      <div className="bg-black text-white py-12">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles size={20} className="text-[#fff500]" />
            <span className="text-[#fff500] text-xs font-black uppercase tracking-wide">Chaque semaine de nouvelles pièces</span>
          </div>
          <h1 className="font-display font-bold text-4xl text-white mb-2">Arrivage de la semaine</h1>
          <p className="text-gray-400 text-sm">Découvrez nos nouvelles références, disponibles en quantités limitées</p>
          <div className="flex items-center gap-2 mt-3 text-xs text-gray-400">
            <Calendar size={14} />
            <span>Mis à jour le {new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}</span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="bg-[#fff500] p-4 mb-8 flex flex-wrap items-center gap-2 text-sm font-bold">
          <Sparkles size={16} />
          <span>Ces articles viennent d'arriver en stock</span>
          <span className="text-black/50">·</span>
          <span>Quantités limitées</span>
          <span className="text-black/50">·</span>
          <span>Premier arrivé, premier servi</span>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {arrivals.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>

            {others.length > 0 && (
              <div className="mt-14 border-t border-gray-100 pt-10">
                <h2 className="font-display font-bold text-2xl mb-6">D'autres bonnes affaires à voir</h2>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  {others.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
