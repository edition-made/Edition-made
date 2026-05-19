import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2 } from 'lucide-react';
import { supabase, DbProduct } from '../../lib/supabase';
import ImageUpload from '../components/ImageUpload';
import { toSeoSlug } from '../../lib/imageUtils';

const CATEGORIES = [
  { value: 'canapes', label: 'Canapés' },
  { value: 'fauteuils-poufs', label: 'Fauteuils & Poufs' },
  { value: 'meubles', label: 'Meubles' },
  { value: 'tables', label: 'Tables' },
  { value: 'chaises-tabourets', label: 'Chaises & Tabourets' },
  { value: 'accessoires-decoration', label: 'Accessoires & Déco' },
  { value: 'literie', label: 'Literie' },
  { value: 'mobilier-exterieur', label: 'Mobilier extérieur' },
];

const SUBCATEGORIES: Record<string, { value: string; label: string }[]> = {
  canapes: [{ value: 'canapes-fixes', label: 'Canapés fixes' }, { value: 'convertibles', label: 'Convertibles' }],
  tables: [{ value: 'tables-basses', label: 'Tables basses' }, { value: 'tables-repas', label: 'Tables de repas' }],
  literie: [{ value: 'matelas', label: 'Matelas' }, { value: 'sommiers', label: 'Sommiers' }, { value: 'linge-de-lit', label: 'Linge de lit' }],
};

const emptyForm = {
  name: '', slug: '', category: 'canapes', subcategory: '', price: '', original_price: '',
  discount: '', images: [] as string[], badge: '', short_description: '', description: '',
  dimensions: '', material: '', colors: '', in_stock: true, stock_count: '0',
  is_new: false, is_featured: false, is_weekly_arrival: false,
  rating: '', review_count: '0', brand: 'Edition Made', tags: '',
};

export default function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'nouveau';
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!isNew && id) {
      supabase.from('products').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({
            name: data.name || '',
            slug: data.slug || '',
            category: data.category || 'canapes',
            subcategory: data.subcategory || '',
            price: String(data.price || ''),
            original_price: String(data.original_price || ''),
            discount: String(data.discount || ''),
            images: data.images || [],
            badge: data.badge || '',
            short_description: data.short_description || '',
            description: data.description || '',
            dimensions: data.dimensions || '',
            material: data.material || '',
            colors: (data.colors || []).join(', '),
            in_stock: data.in_stock ?? true,
            stock_count: String(data.stock_count || 0),
            is_new: data.is_new || false,
            is_featured: data.is_featured || false,
            is_weekly_arrival: data.is_weekly_arrival || false,
            rating: String(data.rating || ''),
            review_count: String(data.review_count || 0),
            brand: data.brand || 'Edition Made',
            tags: (data.tags || []).join(', '),
          });
        }
        setLoading(false);
      });
    }
  }, [id, isNew]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    const checked = (e.target as HTMLInputElement).checked;
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
      ...(name === 'name' && isNew ? { slug: toSeoSlug(value) } : {}),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      name: form.name,
      slug: form.slug,
      category: form.category,
      subcategory: form.subcategory || null,
      price: parseFloat(form.price) || 0,
      original_price: form.original_price ? parseFloat(form.original_price) : null,
      discount: form.discount ? parseInt(form.discount) : null,
      images: form.images,
      badge: form.badge || null,
      short_description: form.short_description,
      description: form.description,
      dimensions: form.dimensions,
      material: form.material,
      colors: form.colors ? form.colors.split(',').map(c => c.trim()).filter(Boolean) : [],
      in_stock: form.in_stock,
      stock_count: parseInt(form.stock_count) || 0,
      is_new: form.is_new,
      is_featured: form.is_featured,
      is_weekly_arrival: form.is_weekly_arrival,
      rating: form.rating ? parseFloat(form.rating) : null,
      review_count: parseInt(form.review_count) || 0,
      brand: form.brand,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      updated_at: new Date().toISOString(),
    };

    let err;
    if (isNew) {
      const res = await supabase.from('products').insert(payload);
      err = res.error;
    } else {
      const res = await supabase.from('products').update(payload).eq('id', id);
      err = res.error;
    }

    if (err) {
      setError(err.message);
      setSaving(false);
    } else {
      navigate('/admin/produits');
    }
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const Input = ({ label, name, type = 'text', required = false, placeholder = '' }: any) => (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">
        {label}{required && <span className="text-[#fff500] ml-0.5">*</span>}
      </label>
      <input
        type={type}
        name={name}
        value={(form as any)[name]}
        onChange={handleChange}
        required={required}
        placeholder={placeholder}
        className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500] placeholder-gray-600"
      />
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/produits" className="text-gray-500 hover:text-white transition-colors">
          <ArrowLeft size={20} />
        </Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">
            {isNew ? 'Nouveau produit' : 'Modifier le produit'}
          </h1>
          {!isNew && <p className="text-gray-500 text-xs">{form.slug}</p>}
        </div>
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          <div className="bg-black/40 border border-white/10 p-5">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Informations principales</h2>
            <div className="space-y-4">
              <Input label="Nom du produit" name="name" required />
              <Input label="Slug SEO (auto-généré)" name="slug" required placeholder="nom-du-produit" />
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">Description courte</label>
                <textarea name="short_description" value={form.short_description} onChange={handleChange} rows={2} className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500] resize-none placeholder-gray-600" />
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">Description complète</label>
                <textarea name="description" value={form.description} onChange={handleChange} rows={5} className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500] resize-none" />
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-5">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Catégorie</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">Catégorie <span className="text-[#fff500]">*</span></label>
                <select name="category" value={form.category} onChange={handleChange} className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500]">
                  {CATEGORIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">Sous-catégorie</label>
                <select name="subcategory" value={form.subcategory} onChange={handleChange} className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500]">
                  <option value="">Aucune</option>
                  {(SUBCATEGORIES[form.category] || []).map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
                </select>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-5">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Prix & Promotion</h2>
            <div className="grid grid-cols-3 gap-4">
              <Input label="Prix actuel (€)" name="price" type="number" required />
              <Input label="Prix original (€)" name="original_price" type="number" placeholder="0" />
              <Input label="Remise (%)" name="discount" type="number" placeholder="0" />
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-5">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Caractéristiques</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input label="Dimensions" name="dimensions" placeholder="L 200 x P 90 x H 80 cm" />
                <Input label="Matière" name="material" placeholder="Tissu, bois, métal..." />
              </div>
              <Input label="Couleurs (séparées par virgule)" name="colors" placeholder="Gris, Beige, Noir..." />
              <Input label="Tags (séparés par virgule)" name="tags" placeholder="canapé, design, salon..." />
              <div className="grid grid-cols-2 gap-4">
                <Input label="Marque" name="brand" />
                <Input label="Note (ex: 4.8)" name="rating" type="number" placeholder="4.8" />
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-5">
            <ImageUpload
              bucket="product-images"
              value={form.images}
              onChange={images => setForm(prev => ({ ...prev, images }))}
              maxFiles={8}
              prefix={form.name || 'produit'}
              label="Photos du produit (glisser-déposer — auto WebP SEO)"
            />
          </div>
        </div>

        <div className="space-y-5">
          <div className="bg-black/40 border border-white/10 p-5">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Stock</h2>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <input type="checkbox" name="in_stock" id="in_stock" checked={form.in_stock} onChange={handleChange} className="accent-[#fff500] w-4 h-4" />
                <label htmlFor="in_stock" className="text-sm text-white font-medium">En stock</label>
              </div>
              <Input label="Quantité en stock" name="stock_count" type="number" />
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-5">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Badge produit</h2>
            <select name="badge" value={form.badge} onChange={handleChange} className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500]">
              <option value="">Aucun badge</option>
              <option value="promo">Promo</option>
              <option value="new">Nouvel arrivage</option>
              <option value="last">Dernière pièce</option>
              <option value="bestseller">Best seller</option>
            </select>
          </div>

          <div className="bg-black/40 border border-white/10 p-5">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Mise en avant</h2>
            <div className="space-y-3">
              {[
                { name: 'is_new', label: 'Nouveau produit' },
                { name: 'is_featured', label: 'Produit vedette (homepage)' },
                { name: 'is_weekly_arrival', label: 'Arrivage de la semaine' },
              ].map(item => (
                <div key={item.name} className="flex items-center gap-3">
                  <input type="checkbox" name={item.name} id={item.name} checked={(form as any)[item.name]} onChange={handleChange} className="accent-[#fff500] w-4 h-4" />
                  <label htmlFor={item.name} className="text-sm text-white">{item.label}</label>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-5">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Avis clients</h2>
            <div className="space-y-3">
              <Input label="Note moyenne" name="rating" type="number" placeholder="4.8" />
              <Input label="Nombre d'avis" name="review_count" type="number" />
            </div>
          </div>

          {error && (
            <div className="bg-red-900/30 border border-red-500/30 p-3 text-red-300 text-xs">{error}</div>
          )}

          <button
            type="submit"
            disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#fff500] text-black font-bold py-3 text-sm uppercase tracking-wide hover:bg-[#e6dc00] transition-colors disabled:opacity-50"
          >
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Enregistrement...' : isNew ? 'Créer le produit' : 'Enregistrer les modifications'}
          </button>
        </div>
      </form>
    </div>
  );
}
