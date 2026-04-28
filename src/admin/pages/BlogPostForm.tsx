import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { ArrowLeft, Save, Loader2, Info } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import ImageUpload from '../components/ImageUpload';
import { toSeoSlug } from '../../lib/imageUtils';

const CATEGORIES = ['Conseils', 'Inspiration', 'Bons plans', 'Actualités', 'Guide'];

const emptyForm = {
  title: '', slug: '', excerpt: '', content: '', cover_image: [] as string[],
  category: 'Conseils', author: 'Équipe Edition Made', published: false,
  read_time: '5', tags: '',
  seo_title: '', seo_description: '', seo_keywords: '', og_image: [] as string[], canonical_url: '',
};

export default function BlogPostForm() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isNew = id === 'nouveau';
  const [form, setForm] = useState(emptyForm);
  const [loading, setLoading] = useState(!isNew);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [activeTab, setActiveTab] = useState<'content' | 'seo'>('content');

  useEffect(() => {
    if (!isNew && id) {
      supabase.from('blog_posts').select('*').eq('id', id).single().then(({ data }) => {
        if (data) {
          setForm({
            title: data.title || '',
            slug: data.slug || '',
            excerpt: data.excerpt || '',
            content: data.content || '',
            cover_image: data.cover_image ? [data.cover_image] : [],
            category: data.category || 'Conseils',
            author: data.author || 'Équipe Edition Made',
            published: data.published || false,
            read_time: String(data.read_time || 5),
            tags: (data.tags || []).join(', '),
            seo_title: data.seo_title || '',
            seo_description: data.seo_description || '',
            seo_keywords: data.seo_keywords || '',
            og_image: data.og_image ? [data.og_image] : [],
            canonical_url: data.canonical_url || '',
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
      ...(name === 'title' && isNew ? { slug: toSeoSlug(value), seo_title: value } : {}),
      ...(name === 'excerpt' && isNew ? { seo_description: value.slice(0, 160) } : {}),
    }));
  };

  const seoTitleLen = form.seo_title.length;
  const seoDescLen = form.seo_description.length;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError('');

    const payload = {
      title: form.title,
      slug: form.slug,
      excerpt: form.excerpt,
      content: form.content,
      cover_image: form.cover_image[0] || '',
      category: form.category,
      author: form.author,
      published: form.published,
      published_at: form.published ? new Date().toISOString() : null,
      read_time: parseInt(form.read_time) || 5,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      seo_title: form.seo_title,
      seo_description: form.seo_description,
      seo_keywords: form.seo_keywords,
      og_image: form.og_image[0] || form.cover_image[0] || '',
      canonical_url: form.canonical_url,
      updated_at: new Date().toISOString(),
    };

    let err;
    if (isNew) {
      const res = await supabase.from('blog_posts').insert(payload);
      err = res.error;
    } else {
      const res = await supabase.from('blog_posts').update(payload).eq('id', id);
      err = res.error;
    }

    if (err) { setError(err.message); setSaving(false); }
    else navigate('/admin/blog');
  };

  if (loading) return (
    <div className="flex items-center justify-center h-40">
      <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const Input = ({ label, name, type = 'text', placeholder = '', hint = '' }: any) => (
    <div>
      <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">{label}</label>
      <input type={type} name={name} value={(form as any)[name]} onChange={handleChange} placeholder={placeholder}
        className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500] placeholder-gray-600" />
      {hint && <p className="text-gray-600 text-[10px] mt-1">{hint}</p>}
    </div>
  );

  return (
    <div className="p-6">
      <div className="flex items-center gap-4 mb-6">
        <Link to="/admin/blog" className="text-gray-500 hover:text-white transition-colors"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="font-display font-bold text-2xl text-white">{isNew ? 'Nouvel article' : 'Modifier l\'article'}</h1>
          {!isNew && <p className="text-gray-500 text-xs">{form.slug}</p>}
        </div>
      </div>

      <div className="flex gap-1 mb-6 border-b border-white/10">
        {(['content', 'seo'] as const).map(tab => (
          <button key={tab} onClick={() => setActiveTab(tab)}
            className={`px-5 py-2.5 text-sm font-bold transition-colors ${activeTab === tab ? 'text-[#fff500] border-b-2 border-[#fff500]' : 'text-gray-500 hover:text-white'}`}>
            {tab === 'content' ? 'Contenu' : 'SEO & Méta'}
          </button>
        ))}
      </div>

      <form onSubmit={handleSubmit} className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-5">
          {activeTab === 'content' && (
            <>
              <div className="bg-black/40 border border-white/10 p-5 space-y-4">
                <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide">Contenu de l'article</h2>
                <Input label="Titre de l'article *" name="title" />
                <Input label="Slug SEO (auto-généré)" name="slug" placeholder="titre-de-l-article" />
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">Résumé / Extrait</label>
                  <textarea name="excerpt" value={form.excerpt} onChange={handleChange} rows={2}
                    className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500] resize-none"
                    placeholder="Résumé court de l'article..." />
                </div>
                <div>
                  <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">Contenu complet</label>
                  <textarea name="content" value={form.content} onChange={handleChange} rows={20}
                    className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500] resize-y font-mono"
                    placeholder="Rédigez le contenu de votre article (HTML ou texte)..." />
                </div>
              </div>

              <div className="bg-black/40 border border-white/10 p-5">
                <ImageUpload
                  bucket="blog-images"
                  value={form.cover_image}
                  onChange={imgs => setForm(prev => ({ ...prev, cover_image: imgs, og_image: prev.og_image.length ? prev.og_image : imgs }))}
                  maxFiles={1}
                  prefix={form.title || 'article'}
                  label="Photo de couverture (glisser-déposer — auto WebP SEO)"
                />
              </div>
            </>
          )}

          {activeTab === 'seo' && (
            <div className="bg-black/40 border border-white/10 p-5 space-y-5">
              <div className="flex items-start gap-2 bg-[#fff500]/10 border border-[#fff500]/30 p-3 rounded">
                <Info size={14} className="text-[#fff500] flex-shrink-0 mt-0.5" />
                <p className="text-xs text-gray-300">
                  Un bon SEO on-page : titre 50–60 caractères, méta description 140–160 caractères, mots-clés pertinents séparés par virgule.
                </p>
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">
                  Titre SEO (balise &lt;title&gt;)
                  <span className={`ml-2 text-[10px] ${seoTitleLen > 60 ? 'text-red-400' : seoTitleLen > 45 ? 'text-[#fff500]' : 'text-green-400'}`}>
                    {seoTitleLen}/60
                  </span>
                </label>
                <input name="seo_title" value={form.seo_title} onChange={handleChange}
                  placeholder="Titre optimisé pour Google (50-60 car.)"
                  className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500] placeholder-gray-600" />
              </div>

              <div>
                <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">
                  Méta description
                  <span className={`ml-2 text-[10px] ${seoDescLen > 160 ? 'text-red-400' : seoDescLen > 130 ? 'text-[#fff500]' : 'text-green-400'}`}>
                    {seoDescLen}/160
                  </span>
                </label>
                <textarea name="seo_description" value={form.seo_description} onChange={handleChange} rows={3}
                  placeholder="Description affichée dans les résultats Google (140-160 car.)"
                  className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500] resize-none placeholder-gray-600" />
              </div>

              <Input
                label="Mots-clés SEO (séparés par virgule)"
                name="seo_keywords"
                placeholder="meuble haut de gamme, déstockage mobilier, canapé design..."
                hint="Utilisez 5 à 10 mots-clés principaux liés à l'article"
              />

              <Input
                label="URL canonique"
                name="canonical_url"
                placeholder="https://editionmade.fr/blog/titre-article"
                hint="Laisser vide pour utiliser l'URL par défaut"
              />

              <div className="bg-black/40 border border-white/10 p-5">
                <ImageUpload
                  bucket="blog-images"
                  value={form.og_image}
                  onChange={imgs => setForm(prev => ({ ...prev, og_image: imgs }))}
                  maxFiles={1}
                  prefix={`og-${form.title || 'article'}`}
                  label="Image Open Graph (réseaux sociaux) — 1200x630px recommandé"
                />
              </div>

              <div className="bg-black/20 border border-white/5 p-4">
                <p className="text-[10px] font-bold text-gray-400 uppercase mb-2">Aperçu Google</p>
                <div className="space-y-0.5">
                  <p className="text-[#8ab4f8] text-sm">{form.seo_title || form.title || 'Titre de l\'article'}</p>
                  <p className="text-[#4d8c57] text-xs">editionmade.fr › blog › {form.slug || 'slug-article'}</p>
                  <p className="text-gray-400 text-xs leading-relaxed">{form.seo_description || form.excerpt || 'Description de l\'article...'}</p>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="space-y-5">
          <div className="bg-black/40 border border-white/10 p-5 space-y-4">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide">Publication</h2>
            <div className="flex items-center gap-3">
              <input type="checkbox" name="published" id="published" checked={form.published} onChange={handleChange} className="accent-[#fff500] w-4 h-4" />
              <label htmlFor="published" className="text-sm text-white font-medium">Publier l'article</label>
            </div>
            <div>
              <label className="text-xs font-semibold uppercase tracking-wide text-gray-400 mb-1.5 block">Catégorie</label>
              <select name="category" value={form.category} onChange={handleChange} className="w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2.5 focus:outline-none focus:border-[#fff500]">
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <Input label="Auteur" name="author" />
            <Input label="Temps de lecture (min)" name="read_time" type="number" />
            <Input label="Tags (séparés par virgule)" name="tags" placeholder="déco, mobilier, conseils..." />
          </div>

          {error && <div className="bg-red-900/30 border border-red-500/30 p-3 text-red-300 text-xs">{error}</div>}

          <button type="submit" disabled={saving}
            className="w-full flex items-center justify-center gap-2 bg-[#fff500] text-black font-bold py-3 text-sm uppercase tracking-wide hover:bg-[#e6dc00] transition-colors disabled:opacity-50">
            {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
            {saving ? 'Enregistrement...' : isNew ? 'Créer l\'article' : 'Enregistrer'}
          </button>
        </div>
      </form>
    </div>
  );
}
