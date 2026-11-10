import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, Loader } from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Suggestion = {
  id: string;
  name: string;
  slug: string;
  price: number;
  original_price?: number | null;
  images: string[] | null;
  category: string;
  in_stock: boolean;
};

const MIN_CHARS = 2;
const MAX_SUGGESTIONS = 6;

// Retire les caractères qui cassent la syntaxe des filtres PostgREST
const cleanTerm = (term: string) => term.replace(/[%,()*\\]/g, '');

interface SearchSuggestProps {
  onDone: () => void;
  autoFocus?: boolean;
}

export default function SearchSuggest({ onDone, autoFocus }: SearchSuggestProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<Suggestion[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapRef = useRef<HTMLDivElement>(null);
  const requestId = useRef(0);

  // Recherche avec délai (debounce) ; seule la dernière requête met à jour la liste
  useEffect(() => {
    const terms = query.trim().split(/\s+/).map(cleanTerm).filter(Boolean);
    if (query.trim().length < MIN_CHARS || terms.length === 0) {
      setResults([]); setLoading(false); setActive(-1);
      return;
    }
    setLoading(true);
    const id = ++requestId.current;
    const timer = setTimeout(async () => {
      let q = supabase
        .from('products')
        .select('id, name, slug, price, original_price, images, category, in_stock')
        .order('in_stock', { ascending: false })
        .order('sort_order', { ascending: true, nullsFirst: false })
        .limit(MAX_SUGGESTIONS);
      for (const term of terms) q = q.ilike('name', `%${term}%`);
      const { data } = await q;
      if (id !== requestId.current) return;
      setResults((data as Suggestion[]) || []);
      setLoading(false);
      setActive(-1);
    }, 200);
    return () => clearTimeout(timer);
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (wrapRef.current && !wrapRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const goToProduct = (slug: string) => {
    setOpen(false);
    onDone();
    navigate(`/produit/${slug}`);
  };

  const goToSearch = () => {
    const q = query.trim();
    if (!q) return;
    setOpen(false);
    onDone();
    navigate(`/recherche?q=${encodeURIComponent(q)}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setOpen(true);
      setActive(i => (results.length ? (i + 1) % results.length : -1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive(i => (results.length ? (i <= 0 ? results.length - 1 : i - 1) : -1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (active >= 0 && results[active]) goToProduct(results[active].slug);
    else goToSearch();
  };

  const showPanel = open && query.trim().length >= MIN_CHARS;

  return (
    <div ref={wrapRef} className="relative">
      <form onSubmit={onSubmit} className="flex gap-2" role="search">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />
          <input
            type="search"
            value={query}
            onChange={e => { setQuery(e.target.value); setOpen(true); }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            placeholder="Rechercher un produit (ex : table jack, canapé…)"
            className="w-full border border-gray-300 pl-9 pr-9 py-2 text-sm focus:outline-none focus:border-black"
            autoFocus={autoFocus}
            autoComplete="off"
            role="combobox"
            aria-expanded={showPanel}
            aria-controls="search-suggestions"
          />
          {loading && <Loader size={14} className="absolute right-3 top-1/2 -translate-y-1/2 animate-spin text-gray-400" />}
        </div>
        <button type="submit" className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-900 transition-colors">
          Rechercher
        </button>
      </form>

      {showPanel && (
        <div
          id="search-suggestions"
          role="listbox"
          className="absolute left-0 right-0 top-full mt-1 z-[70] bg-white border border-gray-200 shadow-2xl max-h-[70vh] overflow-y-auto"
        >
          {results.length === 0 && !loading && (
            <p className="px-4 py-4 text-sm text-gray-500">Aucun produit trouvé pour « {query.trim()} ».</p>
          )}
          {results.map((p, i) => (
            <button
              key={p.id}
              type="button"
              role="option"
              aria-selected={i === active}
              onMouseEnter={() => setActive(i)}
              onClick={() => goToProduct(p.slug)}
              className={`flex w-full items-center gap-3 px-3 py-2.5 text-left border-b border-gray-100 last:border-b-0 ${i === active ? 'bg-[#fff500]/40' : 'hover:bg-gray-50'}`}
            >
              <span className="h-14 w-14 flex-shrink-0 overflow-hidden bg-gray-100">
                {p.images?.[0] && <img src={p.images[0]} alt="" loading="lazy" className="h-full w-full object-cover" />}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-black line-clamp-2">{p.name}</span>
                <span className="block text-xs text-gray-500 capitalize">{p.category.replace(/-/g, ' ')}</span>
              </span>
              <span className="flex-shrink-0 text-right">
                <span className="block text-sm font-black">{Number(p.price).toFixed(2).replace('.', ',')} €</span>
                {!p.in_stock && <span className="block text-[10px] font-bold uppercase text-red-600">Épuisé</span>}
                {p.in_stock && p.original_price && Number(p.original_price) > Number(p.price) && (
                  <span className="block text-[11px] text-gray-400 line-through">{Number(p.original_price).toFixed(2).replace('.', ',')} €</span>
                )}
              </span>
            </button>
          ))}
          {results.length > 0 && (
            <button type="button" onClick={goToSearch} className="w-full px-4 py-3 text-sm font-bold text-center bg-gray-50 hover:bg-[#fff500] transition-colors">
              Voir tous les résultats pour « {query.trim()} »
            </button>
          )}
        </div>
      )}
    </div>
  );
}
