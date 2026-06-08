import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Search, Pencil, Trash2, AlertCircle, Package,
  ChevronDown, ChevronRight, Armchair, BedDouble,
  UtensilsCrossed, Sparkles, LayoutGrid, Sun,
  GripVertical, Save, RotateCcw, Loader2,
} from 'lucide-react';
import { supabase, DbProduct } from '../../lib/supabase';

type CatNode = {
  id: string;
  label: string;
  icon: React.ReactNode;
  subs?: { id: string; label: string }[];
};

const CATEGORY_TREE: CatNode[] = [
  {
    id: 'canapes',
    label: 'Canapés',
    icon: <Armchair size={16} />,
    subs: [
      { id: 'canapes-fixes', label: 'Canapés fixes' },
      { id: 'convertibles', label: 'Convertibles' },
    ],
  },
  {
    id: 'fauteuils-poufs',
    label: 'Fauteuils & Poufs',
    icon: <img src="/chaise_icone.png" alt="" className="w-4 h-4 object-contain" />,
  },
  {
    id: 'meubles',
    label: 'Meubles',
    icon: <img src="/meubles_icone.png" alt="" className="w-4 h-4 object-contain" />,
  },
  {
    id: 'tables',
    label: 'Tables',
    icon: <img src="/table_icone.png" alt="" className="w-4 h-4 object-contain" />,
    subs: [
      { id: 'tables-basses', label: 'Tables basses' },
      { id: 'tables-repas', label: 'Tables de repas' },
    ],
  },
  {
    id: 'chaises-tabourets',
    label: 'Chaises & Tabourets',
    icon: <UtensilsCrossed size={16} />,
  },
  {
    id: 'literie',
    label: 'Literie',
    icon: <BedDouble size={16} />,
    subs: [
      { id: 'matelas', label: 'Matelas' },
      { id: 'sommiers', label: 'Sommiers' },
      { id: 'linge-de-lit', label: 'Linge de lit' },
    ],
  },
  {
    id: 'accessoires-decoration',
    label: 'Accessoires & Déco',
    icon: <Sparkles size={16} />,
  },
  {
    id: 'mobilier-exterieur',
    label: 'Mobilier extérieur',
    icon: <Sun size={16} />,
  },
];

const badgeColors: Record<string, string> = {
  promo: 'bg-[#fff500] text-black',
  new: 'bg-white/10 text-white border border-white/20',
  last: 'bg-red-600 text-white',
  bestseller: 'bg-gray-600 text-white',
};

export default function ProductsAdmin() {
  const [products, setProducts] = useState<DbProduct[]>([]);
  const [originalOrder, setOriginalOrder] = useState<DbProduct[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [activeCat, setActiveCat] = useState<string>('');
  const [activeSub, setActiveSub] = useState<string>('');
  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [deleting, setDeleting] = useState<string | null>(null);

  // Drag & drop state
  const [dragIdx, setDragIdx] = useState<number | null>(null);
  const [dragOverIdx, setDragOverIdx] = useState<number | null>(null);
  const [orderChanged, setOrderChanged] = useState(false);
  const [saving, setSaving] = useState(false);
  const dragNode = useRef<HTMLTableRowElement | null>(null);

  useEffect(() => {
    supabase.from('products').select('category, subcategory').then(({ data }) => {
      if (!data) return;
      const c: Record<string, number> = { '': data.length };
      data.forEach(p => {
        c[p.category] = (c[p.category] || 0) + 1;
        if (p.subcategory) c[p.subcategory] = (c[p.subcategory] || 0) + 1;
      });
      setCounts(c);
    });
  }, []);

  const buildBaseQuery = (withSortOrder: boolean) => {
    let q = supabase.from('products').select('*');
    q = withSortOrder
      ? q.order('sort_order', { ascending: true, nullsFirst: false })
      : q.order('created_at', { ascending: false });
    if (activeSub) q = q.eq('subcategory', activeSub);
    else if (activeCat) q = q.eq('category', activeCat);
    if (search) q = q.ilike('name', `%${search}%`);
    return q;
  };

  const fetchProducts = async () => {
    setLoading(true);

    let { data, error } = await buildBaseQuery(true);
    if (error) {
      // sort_order column doesn't exist yet — fall back to created_at
      ({ data } = await buildBaseQuery(false));
    }

    const list = data || [];
    setProducts(list);
    setOriginalOrder(list);
    setOrderChanged(false);
    setLoading(false);
  };

  useEffect(() => { fetchProducts(); }, [search, activeCat, activeSub]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer ce produit ? Cette action est irréversible.')) return;
    setDeleting(id);
    await supabase.from('products').delete().eq('id', id);
    setProducts(prev => prev.filter(p => p.id !== id));
    setCounts(prev => ({ ...prev, '': (prev[''] || 1) - 1 }));
    setDeleting(null);
  };

  // ── Drag & drop ────────────────────────────────────────────────
  const handleDragStart = (e: React.DragEvent<HTMLTableRowElement>, idx: number) => {
    dragNode.current = e.currentTarget;
    setDragIdx(idx);
    e.dataTransfer.effectAllowed = 'move';
    // Small delay so the dragged element renders before ghost image is captured
    setTimeout(() => { if (dragNode.current) dragNode.current.style.opacity = '0.4'; }, 0);
  };

  const handleDragOver = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';
    if (dragOverIdx !== idx) setDragOverIdx(idx);
  };

  const handleDrop = (e: React.DragEvent, idx: number) => {
    e.preventDefault();
    if (dragIdx === null || dragIdx === idx) return;
    const reordered = [...products];
    const [moved] = reordered.splice(dragIdx, 1);
    reordered.splice(idx, 0, moved);
    setProducts(reordered);
    setDragIdx(null);
    setDragOverIdx(null);
    setOrderChanged(true);
    if (dragNode.current) dragNode.current.style.opacity = '';
    dragNode.current = null;
  };

  const handleDragEnd = () => {
    if (dragNode.current) dragNode.current.style.opacity = '';
    dragNode.current = null;
    setDragIdx(null);
    setDragOverIdx(null);
  };

  const saveOrder = async () => {
    setSaving(true);
    await Promise.all(
      products.map((p, i) =>
        supabase.from('products').update({ sort_order: (i + 1) * 10 }).eq('id', p.id)
      )
    );
    setOriginalOrder([...products]);
    setOrderChanged(false);
    setSaving(false);
  };

  const cancelOrder = () => {
    setProducts([...originalOrder]);
    setOrderChanged(false);
  };
  // ──────────────────────────────────────────────────────────────

  const selectCat = (catId: string) => {
    if (activeCat === catId && !activeSub) setActiveCat('');
    else { setActiveCat(catId); setActiveSub(''); }
  };

  const selectSub = (subId: string, catId: string) => {
    setActiveCat(catId);
    setActiveSub(activeSub === subId ? '' : subId);
  };

  const toggleExpand = (catId: string) =>
    setExpanded(prev => ({ ...prev, [catId]: !prev[catId] }));

  const currentLabel = activeSub
    ? CATEGORY_TREE.flatMap(c => c.subs || []).find(s => s.id === activeSub)?.label
    : activeCat
    ? CATEGORY_TREE.find(c => c.id === activeCat)?.label
    : 'Tous les produits';

  const canReorder = !search;

  return (
    <div className="flex h-screen overflow-hidden">
      {/* ── Sidebar ── */}
      <aside className="w-56 flex-shrink-0 bg-black/60 border-r border-white/10 flex flex-col overflow-y-auto">
        <div className="px-3 pt-5 pb-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Catalogue</p>
        </div>

        <button
          onClick={() => { setActiveCat(''); setActiveSub(''); }}
          className={`flex items-center justify-between px-3 py-2.5 text-xs font-semibold transition-colors mx-2 mb-1 ${
            !activeCat ? 'bg-[#fff500] text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
          }`}
        >
          <span className="flex items-center gap-2">
            <LayoutGrid size={15} /> Tous les produits
          </span>
          <span className={`text-[10px] font-black px-1.5 py-0.5 ${!activeCat ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'}`}>
            {counts[''] || 0}
          </span>
        </button>

        <div className="px-2 space-y-0.5 pb-4">
          {CATEGORY_TREE.map(cat => {
            const hasSubs = cat.subs && cat.subs.length > 0;
            const isCatActive = activeCat === cat.id && !activeSub;
            const isExpanded = expanded[cat.id];

            return (
              <div key={cat.id}>
                <div className={`flex items-center gap-1 ${isCatActive ? 'bg-[#fff500]' : ''}`}>
                  <button
                    onClick={() => selectCat(cat.id)}
                    className={`flex-1 flex items-center gap-2 px-2 py-2.5 text-xs font-semibold transition-colors text-left ${
                      isCatActive ? 'text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <span className={`flex-shrink-0 ${isCatActive ? 'opacity-80' : ''}`}>{cat.icon}</span>
                    <span className="truncate">{cat.label}</span>
                    <span className={`ml-auto text-[10px] font-black px-1.5 py-0.5 flex-shrink-0 ${isCatActive ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-500'}`}>
                      {counts[cat.id] || 0}
                    </span>
                  </button>
                  {hasSubs && (
                    <button
                      onClick={() => toggleExpand(cat.id)}
                      className={`p-2 flex-shrink-0 transition-colors ${isCatActive ? 'text-black/60 hover:text-black' : 'text-gray-600 hover:text-white'}`}
                    >
                      {isExpanded ? <ChevronDown size={12} /> : <ChevronRight size={12} />}
                    </button>
                  )}
                </div>

                {hasSubs && isExpanded && (
                  <div className="ml-4 mt-0.5 space-y-0.5 border-l border-white/10 pl-2">
                    {cat.subs!.map(sub => {
                      const isSubActive = activeSub === sub.id;
                      return (
                        <button
                          key={sub.id}
                          onClick={() => selectSub(sub.id, cat.id)}
                          className={`w-full flex items-center justify-between px-2 py-2 text-[11px] font-semibold transition-colors ${
                            isSubActive ? 'bg-[#fff500]/20 text-[#fff500]' : 'text-gray-500 hover:bg-white/5 hover:text-white'
                          }`}
                        >
                          <span className="truncate">{sub.label}</span>
                          <span className={`text-[10px] font-black px-1 ${isSubActive ? 'text-[#fff500]' : 'text-gray-600'}`}>
                            {counts[sub.id] || 0}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="flex-1 overflow-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">{currentLabel}</h1>
            <p className="text-gray-500 text-sm">{products.length} produit{products.length !== 1 ? 's' : ''}</p>
          </div>
          <Link
            to="/admin/produits/nouveau"
            className="flex items-center gap-2 bg-[#fff500] text-black px-4 py-2.5 text-sm font-bold hover:bg-[#e6dc00] transition-colors flex-shrink-0"
          >
            <Plus size={16} /> Ajouter un produit
          </Link>
        </div>

        {/* Ordre modifié — banner */}
        {orderChanged && (
          <div className="flex items-center justify-between bg-[#fff500]/10 border border-[#fff500]/40 px-4 py-3 mb-4">
            <p className="text-[#fff500] text-xs font-bold">
              Ordre modifié — non sauvegardé
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={cancelOrder}
                className="flex items-center gap-1.5 text-gray-400 hover:text-white text-xs px-3 py-1.5 border border-white/20 hover:border-white/40 transition-colors"
              >
                <RotateCcw size={12} /> Annuler
              </button>
              <button
                onClick={saveOrder}
                disabled={saving}
                className="flex items-center gap-1.5 bg-[#fff500] text-black text-xs font-bold px-3 py-1.5 hover:bg-[#e6dc00] transition-colors disabled:opacity-50"
              >
                {saving ? <Loader2 size={12} className="animate-spin" /> : <Save size={12} />}
                {saving ? 'Sauvegarde...' : 'Sauvegarder l\'ordre'}
              </button>
            </div>
          </div>
        )}

        {/* Search */}
        <div className="relative mb-5 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full bg-white/5 border border-white/15 text-white text-sm pl-9 pr-3 py-2 focus:outline-none focus:border-[#fff500] placeholder-gray-600"
          />
        </div>

        {search && (
          <p className="text-gray-600 text-xs mb-3 flex items-center gap-1">
            <GripVertical size={12} /> Désactivez la recherche pour réorganiser l'ordre d'affichage.
          </p>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-16">
            <Package size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">Aucun produit dans cette catégorie</p>
            <Link to="/admin/produits/nouveau" className="inline-flex items-center gap-1 text-[#fff500] text-sm hover:underline">
              <Plus size={14} /> Ajouter un produit
            </Link>
          </div>
        ) : (
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-left">
                  <th className="w-8 px-2 py-3" title={canReorder ? 'Glisser pour réordonner' : 'Désactivez la recherche pour réordonner'}>
                    <GripVertical size={14} className={canReorder ? 'text-gray-500' : 'text-gray-700'} />
                  </th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Produit</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Prix</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Stock</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Badge</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {products.map((product, idx) => {
                  const stock = product.stock_count ?? 0;
                  const isLow = product.in_stock && stock <= 3;
                  const catNode = CATEGORY_TREE.find(c => c.id === product.category);
                  const subLabel = catNode?.subs?.find(s => s.id === product.subcategory)?.label;
                  const isDragging = dragIdx === idx;
                  const isDragOver = dragOverIdx === idx && dragIdx !== idx;

                  return (
                    <tr
                      key={product.id}
                      draggable={canReorder}
                      onDragStart={canReorder ? e => handleDragStart(e, idx) : undefined}
                      onDragOver={canReorder ? e => handleDragOver(e, idx) : undefined}
                      onDrop={canReorder ? e => handleDrop(e, idx) : undefined}
                      onDragEnd={canReorder ? handleDragEnd : undefined}
                      className={`transition-colors group ${
                        isDragOver
                          ? 'border-t-2 border-t-[#fff500] bg-[#fff500]/5'
                          : isDragging
                          ? 'bg-white/10'
                          : 'hover:bg-white/3'
                      }`}
                    >
                      <td className="px-2 py-3">
                        <div className={`flex items-center justify-center ${canReorder ? 'cursor-grab active:cursor-grabbing' : 'cursor-default'}`}>
                          <GripVertical size={14} className={canReorder ? 'text-gray-500 group-hover:text-gray-300' : 'text-gray-700'} />
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gray-800 flex-shrink-0 overflow-hidden">
                            {product.images?.[0] ? (
                              <img src={product.images[0]} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <Package size={14} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-xs truncate max-w-48">{product.name}</p>
                            <p className="text-gray-600 text-[10px] font-mono">{product.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-col gap-0.5">
                          <span className="flex items-center gap-1 text-gray-300 text-[11px] font-semibold">
                            <span className="opacity-60">{catNode?.icon}</span>
                            {catNode?.label || product.category}
                          </span>
                          {subLabel && <span className="text-[10px] text-gray-500 pl-5">{subLabel}</span>}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-black text-white text-sm">{product.price} €</span>
                        {product.original_price && (
                          <span className="text-gray-600 text-[10px] line-through ml-1.5">{product.original_price} €</span>
                        )}
                        {product.discount && (
                          <span className="block text-[#fff500] text-[10px] font-bold">-{product.discount}%</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1">
                          {isLow && <AlertCircle size={11} className="text-[#fff500]" />}
                          <span className={`text-xs font-semibold ${product.in_stock ? (isLow ? 'text-[#fff500]' : 'text-green-400') : 'text-red-400'}`}>
                            {product.in_stock ? `${stock}` : '0'}
                          </span>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {product.badge && (
                          <span className={`text-[10px] font-black px-2 py-0.5 uppercase ${badgeColors[product.badge] || 'bg-gray-700 text-white'}`}>
                            {product.badge}
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <Link
                            to={`/admin/produits/${product.id}`}
                            className="p-1.5 text-gray-400 hover:text-[#fff500] hover:bg-white/10 transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={13} />
                          </Link>
                          <button
                            onClick={() => handleDelete(product.id)}
                            disabled={deleting === product.id}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors disabled:opacity-50"
                            title="Supprimer"
                          >
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
