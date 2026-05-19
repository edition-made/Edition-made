import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Flame, ArrowRight } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { dbProductToProduct } from '../../lib/productUtils';
import { products as mockProducts } from '../../data/products';
import ProductCard from '../ui/ProductCard';
import { Product } from '../../types';

export default function PromoSection() {
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    supabase
      .from('products')
      .select('*')
      .eq('in_stock', true)
      .gte('discount', 40)
      .order('discount', { ascending: false })
      .limit(8)
      .then(({ data }) => {
        if (data && data.length > 0) {
          setProducts(data.map(dbProductToProduct));
        } else {
          setProducts(mockProducts.filter(p => p.discount && p.discount >= 40).slice(0, 8));
        }
      });
  }, []);

  if (products.length === 0) return null;

  return (
    <section className="py-14 bg-white">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="bg-black text-white px-6 py-4 flex items-center justify-between mb-8 -mx-4 md:mx-0">
          <div className="flex items-center gap-3">
            <Flame size={22} className="text-[#fff500]" />
            <span className="font-display font-bold text-xl">Promotions en cours</span>
            <span className="bg-[#fff500] text-black text-xs font-black px-2 py-1 ml-2">
              Jusqu'à -60%
            </span>
          </div>
          <Link to="/promotions" className="flex items-center gap-1 text-sm font-bold text-[#fff500] hover:text-white transition-colors">
            Tout voir <ArrowRight size={14} />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {products.map(product => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>

        <div className="mt-8 text-center">
          <Link to="/promotions" className="btn-black">
            Voir toutes les promotions <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
}
