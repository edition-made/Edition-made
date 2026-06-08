import { useState, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { supabase } from '../lib/supabase';

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  images: string[];
  category: string;
  in_stock: boolean;
}

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const query = searchParams.get('q') || '';
  const [input, setInput] = useState(query);
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const search = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('products')
        .select('id, name, slug, price, images, category, in_stock')
        .or(`name.ilike.%${query}%,category.ilike.%${query}%,description.ilike.%${query}%`)
        .eq('in_stock', true)
        .limit(24);
      setResults(data || []);
      setLoading(false);
    };
    search();
  }, [query]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim()) setSearchParams({ q: input.trim() });
  };

  return (
    <div className="bg-white min-h-screen">
      <div className="bg-black text-white py-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <h1 className="font-display font-bold text-3xl mb-6">Recherche</h1>
          <form onSubmit={handleSubmit} className="flex gap-2 max-w-xl">
            <input
              type="text"
              value={input}
              onChange={e => setInput(e.target.value)}
              placeholder="Rechercher un produit, une catégorie..."
              className="flex-1 bg-white/10 border border-white/20 text-white placeholder-gray-400 px-4 py-3 text-sm focus:outline-none focus:border-[#fff500]"
            />
            <button type="submit" className="bg-[#fff500] text-black px-6 py-3 font-black text-sm hover:bg-[#e6dc00] transition-colors flex items-center gap-2">
              <Search size={16} /> Rechercher
            </button>
          </form>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-10">
        {loading && (
          <div className="flex justify-center py-16">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        )}

        {!loading && query && results.length === 0 && (
          <div className="text-center py-16">
            <p className="text-gray-500 text-lg mb-2">Aucun résultat pour « {query} »</p>
            <p className="text-gray-400 text-sm mb-6">Essayez avec d'autres mots-clés ou parcourez nos catégories.</p>
            <Link to="/" className="btn-primary">Retour à l'accueil</Link>
          </div>
        )}

        {!loading && query && results.length > 0 && (
          <>
            <p className="text-sm text-gray-500 mb-6">
              <span className="font-bold text-black">{results.length}</span> résultat{results.length > 1 ? 's' : ''} pour « {query} »
            </p>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {results.map(product => (
                <Link
                  key={product.id}
                  to={`/produit/${product.slug}`}
                  className="group border border-gray-100 hover:border-black transition-colors overflow-hidden"
                >
                  <div className="aspect-square bg-gray-100 overflow-hidden">
                    {product.images?.[0] && (
                      <img
                        src={product.images[0]}
                        alt={product.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                    )}
                  </div>
                  <div className="p-3">
                    <p className="text-xs text-gray-400 mb-1">{product.category}</p>
                    <p className="text-sm font-semibold text-black line-clamp-2 group-hover:underline">{product.name}</p>
                    <p className="font-black text-base mt-1">{product.price.toFixed(2)} €</p>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}

        {!loading && !query && (
          <div className="text-center py-16">
            <Search size={48} className="text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500">Entrez un terme pour lancer la recherche.</p>
          </div>
        )}
      </div>
    </div>
  );
}
