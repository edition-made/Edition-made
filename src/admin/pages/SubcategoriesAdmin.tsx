import { useMemo, useState } from 'react';
import { ExternalLink, Loader2, Plus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { categories } from '../../data/categories';
import { notifySubcategoriesChanged, useSubcategories } from '../../hooks/useSubcategories';
import { toSeoSlug } from '../../lib/imageUtils';
import { supabase } from '../../lib/supabase';

export default function SubcategoriesAdmin() {
  const { subcategories, loading, error: loadError, refresh } = useSubcategories();
  const [parentSlug, setParentSlug] = useState(categories[0].slug);
  const [name, setName] = useState('');
  const [slug, setSlug] = useState('');
  const [sortOrder, setSortOrder] = useState('10');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const grouped = useMemo(() => categories.map(category => ({
    category,
    items: subcategories.filter(item => item.parentSlug === category.slug),
  })), [subcategories]);

  const handleNameChange = (value: string) => {
    setName(value);
    setSlug(toSeoSlug(value));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const cleanName = name.trim();
    const cleanSlug = toSeoSlug(slug);
    if (!cleanName || !cleanSlug) return;

    setSaving(true);
    setMessage(null);
    const { error } = await supabase.from('subcategories').insert({
      parent_slug: parentSlug,
      name: cleanName,
      slug: cleanSlug,
      sort_order: Math.max(0, Number.parseInt(sortOrder, 10) || 0),
    });

    if (error) {
      setMessage({
        type: 'error',
        text: error.code === '23505'
          ? 'Cette sous-catégorie existe déjà dans cette catégorie.'
          : 'Création impossible. Vérifiez que la migration Supabase a été appliquée.',
      });
    } else {
      setName('');
      setSlug('');
      setMessage({ type: 'success', text: 'Sous-catégorie ajoutée à la navigation.' });
      notifySubcategoriesChanged();
      await refresh();
    }
    setSaving(false);
  };

  const handleDelete = async (id: string, subcategoryName: string, subcategorySlug: string) => {
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('subcategory', subcategorySlug);
    const productWarning = count
      ? ` ${count} produit${count > 1 ? 's sont' : ' est'} encore rattaché${count > 1 ? 's' : ''} à cette sous-catégorie.`
      : '';
    if (!window.confirm(`Supprimer « ${subcategoryName} » de la navigation ?${productWarning}`)) return;

    setMessage(null);
    const { error } = await supabase.from('subcategories').delete().eq('id', id);
    if (error) {
      setMessage({ type: 'error', text: 'Suppression impossible. Veuillez réessayer.' });
      return;
    }
    setMessage({ type: 'success', text: 'Sous-catégorie supprimée de la navigation.' });
    notifySubcategoriesChanged();
    await refresh();
  };

  return (
    <div className="p-6">
      <div className="flex flex-wrap items-start justify-between gap-4 mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Sous-catégories</h1>
          <p className="text-sm text-gray-500 mt-1">Les modifications sont automatiquement reprises dans la navbar et les fiches produit.</p>
        </div>
        <Link to="/" target="_blank" className="inline-flex items-center gap-2 text-xs font-bold text-[#fff500] hover:underline">
          Voir la navbar <ExternalLink size={14} />
        </Link>
      </div>

      {(loadError || message) && (
        <div className={`mb-5 border px-4 py-3 text-sm ${
          loadError || message?.type === 'error'
            ? 'border-red-500/40 bg-red-500/10 text-red-300'
            : 'border-green-500/40 bg-green-500/10 text-green-300'
        }`}>
          {loadError ? 'La table des sous-catégories n’est pas encore disponible. Appliquez la migration Supabase.' : message?.text}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-black/40 border border-white/10 p-5 mb-7">
        <h2 className="text-sm font-bold uppercase tracking-wide text-gray-300 mb-4">Ajouter une sous-catégorie</h2>
        <div className="grid md:grid-cols-4 gap-4">
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Catégorie parente
            <select value={parentSlug} onChange={event => setParentSlug(event.target.value)} className="mt-1.5 w-full bg-[#1c1c1c] border border-white/15 text-white px-3 py-2.5 normal-case">
              {categories.map(category => <option key={category.slug} value={category.slug}>{category.name}</option>)}
            </select>
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Nom
            <input value={name} onChange={event => handleNameChange(event.target.value)} required placeholder="Ex. Tables consoles" className="mt-1.5 w-full bg-white/5 border border-white/15 text-white px-3 py-2.5 normal-case placeholder-gray-600" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Slug URL
            <input value={slug} onChange={event => setSlug(toSeoSlug(event.target.value))} required placeholder="tables-consoles" className="mt-1.5 w-full bg-white/5 border border-white/15 text-white px-3 py-2.5 normal-case placeholder-gray-600" />
          </label>
          <label className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Position
            <input type="number" min="0" value={sortOrder} onChange={event => setSortOrder(event.target.value)} className="mt-1.5 w-full bg-white/5 border border-white/15 text-white px-3 py-2.5 normal-case" />
          </label>
        </div>
        <button type="submit" disabled={saving || !name.trim() || !slug} className="mt-4 inline-flex items-center gap-2 bg-[#fff500] text-black px-4 py-2.5 text-sm font-black disabled:opacity-50">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Ajouter la sous-catégorie
        </button>
      </form>

      {loading ? (
        <div className="h-40 flex items-center justify-center"><Loader2 className="animate-spin text-[#fff500]" /></div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-4">
          {grouped.map(({ category, items }) => (
            <section key={category.slug} className="bg-black/40 border border-white/10 p-4">
              <div className="flex items-center justify-between mb-3">
                <h2 className="font-bold text-white">{category.name}</h2>
                <span className="text-[11px] text-gray-500">{items.length} sous-catégorie{items.length > 1 ? 's' : ''}</span>
              </div>
              {items.length === 0 ? (
                <p className="text-xs text-gray-600 py-3">Aucune sous-catégorie.</p>
              ) : (
                <div className="space-y-2">
                  {items.map(item => (
                    <div key={item.id} className="flex items-center gap-3 bg-white/5 border border-white/10 px-3 py-2.5">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-white truncate">{item.name}</p>
                        <p className="text-[11px] text-gray-500 truncate">/{category.slug}/{item.slug} · position {item.sortOrder}</p>
                      </div>
                      <button type="button" onClick={() => handleDelete(item.id, item.name, item.slug)} className="p-2 text-gray-500 hover:text-red-400 hover:bg-red-500/10" aria-label={`Supprimer ${item.name}`}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
