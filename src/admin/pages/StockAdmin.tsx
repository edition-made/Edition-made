import { useState, useEffect } from 'react';
import { Warehouse, AlertTriangle, Search, ChevronUp, ChevronDown, CreditCard as Edit2, Check, X } from 'lucide-react';
import { supabase, DbProduct } from '../../lib/supabase';

export default function StockAdmin() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStock, setFilterStock] = useState<'all' | 'low' | 'out'>('all');
  const [sortBy, setSortBy] = useState<'name' | 'stock' | 'category'>('stock');
  const [sortAsc, setSortAsc] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');

  useEffect(() => {
    supabase.from('products').select('*').order('name').then(({ data }) => {
      setProducts(data || []);
      setLoading(false);
    });
  }, []);

  const startEdit = (p: DbProduct) => {
    setEditingId(p.id);
    setEditValue(String(p.stock_count ?? 0));
  };

  const saveEdit = async (id: string) => {
    const val = parseInt(editValue);
    if (isNaN(val) || val < 0) return;
    const inStock = val > 0;
    await supabase.from('products').update({ stock_count: val, in_stock: inStock }).eq('id', id);
    setProducts(prev => prev.map(p => p.id === id ? { ...p, stock_count: val, in_stock: inStock } : p));
    setEditingId(null);
  };

  const cancelEdit = () => setEditingId(null);

  const toggle = (col: typeof sortBy) => {
    if (sortBy === col) setSortAsc(!sortAsc);
    else { setSortBy(col); setSortAsc(true); }
  };

  const filtered = products
    .filter(p => {
      const matchSearch = p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase());
      if (filterStock === 'out') return matchSearch && !p.in_stock;
      if (filterStock === 'low') return matchSearch && p.in_stock && (p.stock_count ?? 0) <= 3;
      return matchSearch;
    })
    .sort((a, b) => {
      let va: any, vb: any;
      if (sortBy === 'name') { va = a.name; vb = b.name; }
      else if (sortBy === 'category') { va = a.category; vb = b.category; }
      else { va = a.stock_count ?? 0; vb = b.stock_count ?? 0; }
      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

  const outCount = products.filter(p => !p.in_stock).length;
  const lowCount = products.filter(p => p.in_stock && (p.stock_count ?? 0) <= 3).length;

  const SortIcon = ({ col }: { col: typeof sortBy }) =>
    sortBy === col
      ? sortAsc ? <ChevronUp size={12} /> : <ChevronDown size={12} />
      : <ChevronDown size={12} className="opacity-30" />;

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Stock</h1>
          <p className="text-gray-500 text-sm">{products.length} produits</p>
        </div>
        <div className="flex gap-3">
          {outCount > 0 && (
            <div className="bg-red-900/30 border border-red-500/30 px-3 py-2 text-center">
              <p className="text-red-300 font-black text-lg leading-none">{outCount}</p>
              <p className="text-red-400 text-[10px]">rupture</p>
            </div>
          )}
          {lowCount > 0 && (
            <div className="bg-[#fff500]/10 border border-[#fff500]/30 px-3 py-2 text-center">
              <p className="text-[#fff500] font-black text-lg leading-none">{lowCount}</p>
              <p className="text-[#fff500]/70 text-[10px]">stock faible</p>
            </div>
          )}
        </div>
      </div>

      {(outCount > 0 || lowCount > 0) && (
        <div className="flex items-start gap-2 bg-[#fff500]/10 border border-[#fff500]/30 p-3 mb-5">
          <AlertTriangle size={14} className="text-[#fff500] flex-shrink-0 mt-0.5" />
          <p className="text-xs text-gray-300">
            {outCount > 0 && <><strong className="text-white">{outCount} produit{outCount > 1 ? 's' : ''}</strong> en rupture de stock. </>}
            {lowCount > 0 && <><strong className="text-white">{lowCount} produit{lowCount > 1 ? 's' : ''}</strong> avec un stock faible (≤ 3 unités).</>}
          </p>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-5">
        <div className="relative flex-1 min-w-48">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Rechercher un produit..."
            className="w-full bg-white/5 border border-white/15 text-white text-sm pl-8 pr-3 py-2 focus:outline-none focus:border-[#fff500] placeholder-gray-600" />
        </div>
        <div className="flex gap-1">
          {(['all', 'low', 'out'] as const).map(f => (
            <button key={f} onClick={() => setFilterStock(f)}
              className={`px-3 py-2 text-xs font-bold transition-colors ${filterStock === f ? 'bg-[#fff500] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {f === 'all' ? 'Tous' : f === 'low' ? 'Stock faible' : 'Rupture'}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <div className="bg-black/40 border border-white/10 overflow-hidden">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-white/10">
                <th className="text-left px-4 py-3">
                  <button onClick={() => toggle('name')} className="flex items-center gap-1 text-gray-400 font-bold uppercase tracking-wide hover:text-white">
                    Produit <SortIcon col="name" />
                  </button>
                </th>
                <th className="text-left px-4 py-3">
                  <button onClick={() => toggle('category')} className="flex items-center gap-1 text-gray-400 font-bold uppercase tracking-wide hover:text-white">
                    Catégorie <SortIcon col="category" />
                  </button>
                </th>
                <th className="text-center px-4 py-3">
                  <button onClick={() => toggle('stock')} className="flex items-center gap-1 text-gray-400 font-bold uppercase tracking-wide hover:text-white mx-auto">
                    Stock <SortIcon col="stock" />
                  </button>
                </th>
                <th className="text-center px-4 py-3 text-gray-400 font-bold uppercase tracking-wide">Statut</th>
                <th className="text-right px-4 py-3 text-gray-400 font-bold uppercase tracking-wide">Prix</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(p => {
                const stock = p.stock_count ?? 0;
                const isOut = !p.in_stock || stock === 0;
                const isLow = !isOut && stock <= 3;
                return (
                  <tr key={p.id} className="border-b border-white/5 hover:bg-white/2 transition-colors">
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        {p.images?.[0] && (
                          <img src={p.images[0]} alt="" className="w-8 h-8 object-cover flex-shrink-0 bg-white/5" />
                        )}
                        <span className="text-white font-medium line-clamp-1 max-w-48">{p.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-400">{p.category}</td>
                    <td className="px-4 py-3 text-center">
                      {editingId === p.id ? (
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number" min="0" value={editValue}
                            onChange={e => setEditValue(e.target.value)}
                            onKeyDown={e => { if (e.key === 'Enter') saveEdit(p.id); if (e.key === 'Escape') cancelEdit(); }}
                            className="w-16 bg-white/10 border border-[#fff500] text-white text-center text-xs py-1 focus:outline-none"
                            autoFocus
                          />
                          <button onClick={() => saveEdit(p.id)} className="text-green-400 hover:text-green-300"><Check size={13} /></button>
                          <button onClick={cancelEdit} className="text-gray-500 hover:text-white"><X size={13} /></button>
                        </div>
                      ) : (
                        <span className={`font-black text-sm ${isOut ? 'text-red-400' : isLow ? 'text-[#fff500]' : 'text-green-400'}`}>
                          {stock}
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`px-2 py-0.5 text-[10px] font-black border ${
                        isOut ? 'bg-red-900/30 text-red-300 border-red-500/30' :
                        isLow ? 'bg-[#fff500]/20 text-[#fff500] border-[#fff500]/30' :
                        'bg-green-500/20 text-green-300 border-green-500/30'
                      }`}>
                        {isOut ? 'Rupture' : isLow ? 'Faible' : 'En stock'}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-semibold">
                      {p.price.toLocaleString('fr-FR')} €
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button onClick={() => startEdit(p)} className="p-1.5 text-gray-500 hover:text-white hover:bg-white/10 transition-colors">
                        <Edit2 size={13} />
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-4 py-12 text-center text-gray-500">
                    <Warehouse size={32} className="mx-auto mb-2 text-gray-700" />
                    Aucun produit trouvé
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
