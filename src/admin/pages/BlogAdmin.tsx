import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, BookOpen, LayoutGrid,
  Lightbulb, Tag, Sparkles, Clock, Search, Calendar,
} from 'lucide-react';
import { supabase, DbBlogPost } from '../../lib/supabase';

type CatNode = {
  id: string;
  label: string;
  icon: React.ReactNode;
  color: string;
};

const CATEGORIES: CatNode[] = [
  { id: 'Conseils', label: 'Conseils', icon: <Lightbulb size={15} />, color: 'text-amber-400' },
  { id: 'Inspiration', label: 'Inspiration', icon: <Sparkles size={15} />, color: 'text-sky-400' },
  { id: 'Bons plans', label: 'Bons plans', icon: <Tag size={15} />, color: 'text-green-400' },
  { id: 'Actualités', label: 'Actualités', icon: <Calendar size={15} />, color: 'text-rose-400' },
  { id: 'Tendances', label: 'Tendances', icon: <Clock size={15} />, color: 'text-orange-400' },
];

const getCatNode = (cat: string) => CATEGORIES.find(c => c.id === cat);

export default function BlogAdmin() {
  const [posts, setPosts] = useState<DbBlogPost[]>([]);
  const [counts, setCounts] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft'>('all');
  const [search, setSearch] = useState('');

  useEffect(() => {
    supabase.from('blog_posts').select('category, published').then(({ data }) => {
      if (!data) return;
      const c: Record<string, number> = { '': data.length };
      data.forEach(p => { c[p.category] = (c[p.category] || 0) + 1; });
      setCounts(c);
    });
  }, []);

  const fetchPosts = async () => {
    setLoading(true);
    let q = supabase.from('blog_posts').select('*').order('created_at', { ascending: false });
    if (activeCategory) q = q.eq('category', activeCategory);
    if (statusFilter === 'published') q = q.eq('published', true);
    if (statusFilter === 'draft') q = q.eq('published', false);
    if (search) q = q.ilike('title', `%${search}%`);
    const { data } = await q;
    setPosts(data || []);
    setLoading(false);
  };

  useEffect(() => { fetchPosts(); }, [activeCategory, statusFilter, search]);

  const handleDelete = async (id: string) => {
    if (!confirm('Supprimer cet article ? Cette action est irréversible.')) return;
    await supabase.from('blog_posts').delete().eq('id', id);
    setPosts(prev => prev.filter(p => p.id !== id));
    setCounts(prev => ({ ...prev, '': Math.max(0, (prev[''] || 1) - 1) }));
  };

  const togglePublish = async (post: DbBlogPost) => {
    const update = { published: !post.published, published_at: !post.published ? new Date().toISOString() : null };
    await supabase.from('blog_posts').update(update).eq('id', post.id);
    setPosts(prev => prev.map(p => p.id === post.id ? { ...p, ...update } : p));
  };

  const publishedCount = Object.values(posts).filter(p => p.published).length;

  return (
    <div className="flex h-screen overflow-hidden">
      <aside className="w-56 flex-shrink-0 bg-black/60 border-r border-white/10 flex flex-col overflow-y-auto">
        <div className="px-3 pt-5 pb-2">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Catégories</p>
        </div>

        <div className="px-2 space-y-0.5 mb-4">
          <button
            onClick={() => setActiveCategory('')}
            className={`w-full flex items-center justify-between px-2 py-2.5 text-xs font-semibold transition-colors ${
              !activeCategory ? 'bg-[#fff500] text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
            }`}
          >
            <span className="flex items-center gap-2">
              <LayoutGrid size={15} />
              Tous les articles
            </span>
            <span className={`text-[10px] font-black px-1.5 py-0.5 ${!activeCategory ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-400'}`}>
              {counts[''] || 0}
            </span>
          </button>

          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(isActive ? '' : cat.id)}
                className={`w-full flex items-center justify-between px-2 py-2.5 text-xs font-semibold transition-colors ${
                  isActive ? 'bg-[#fff500] text-black' : 'text-gray-400 hover:bg-white/10 hover:text-white'
                }`}
              >
                <span className="flex items-center gap-2">
                  <span className={isActive ? 'opacity-70' : cat.color}>{cat.icon}</span>
                  {cat.label}
                </span>
                <span className={`text-[10px] font-black px-1.5 py-0.5 ${isActive ? 'bg-black/20 text-black' : 'bg-white/10 text-gray-500'}`}>
                  {counts[cat.id] || 0}
                </span>
              </button>
            );
          })}
        </div>

        <div className="px-3 pt-3 pb-2 border-t border-white/10">
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-2">Statut</p>
        </div>

        <div className="px-2 space-y-0.5 pb-4">
          {([
            { id: 'all', label: 'Tous' },
            { id: 'published', label: 'Publiés' },
            { id: 'draft', label: 'Brouillons' },
          ] as const).map(s => (
            <button
              key={s.id}
              onClick={() => setStatusFilter(s.id)}
              className={`w-full flex items-center px-2 py-2 text-xs font-semibold transition-colors ${
                statusFilter === s.id ? 'text-[#fff500]' : 'text-gray-500 hover:text-white hover:bg-white/5'
              }`}
            >
              <span className={`w-1.5 h-1.5 rounded-full mr-2 ${
                s.id === 'published' ? 'bg-green-400' : s.id === 'draft' ? 'bg-gray-600' : 'bg-white/20'
              }`} />
              {s.label}
            </button>
          ))}
        </div>
      </aside>

      <div className="flex-1 overflow-auto p-6">
        <div className="flex items-center justify-between mb-5">
          <div>
            <h1 className="font-display font-bold text-2xl text-white">
              {activeCategory || 'Blog'}
            </h1>
            <p className="text-gray-500 text-sm">
              {posts.length} article{posts.length !== 1 ? 's' : ''}
              {publishedCount > 0 && ` — ${publishedCount} publié${publishedCount !== 1 ? 's' : ''}`}
            </p>
          </div>
          <Link
            to="/admin/blog/nouveau"
            className="flex items-center gap-2 bg-[#fff500] text-black px-4 py-2.5 text-sm font-bold hover:bg-[#e6dc00] transition-colors flex-shrink-0"
          >
            <Plus size={16} /> Rédiger un article
          </Link>
        </div>

        <div className="relative mb-5 max-w-sm">
          <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un article..."
            className="w-full bg-white/5 border border-white/15 text-white text-sm pl-9 pr-3 py-2 focus:outline-none focus:border-[#fff500] placeholder-gray-600"
          />
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-40">
            <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-16">
            <BookOpen size={40} className="text-gray-700 mx-auto mb-3" />
            <p className="text-gray-500 mb-3">Aucun article dans cette catégorie</p>
            <Link to="/admin/blog/nouveau" className="inline-flex items-center gap-1 text-[#fff500] text-sm hover:underline">
              <Plus size={14} /> Rédiger un article
            </Link>
          </div>
        ) : (
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-white/5 border-b border-white/10 text-left">
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Article</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Catégorie</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Lecture</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Date</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Statut</th>
                  <th className="px-4 py-3 text-[10px] font-black text-gray-400 uppercase tracking-widest">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {posts.map(post => {
                  const catNode = getCatNode(post.category);
                  return (
                    <tr key={post.id} className="hover:bg-white/3 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-10 bg-gray-800 flex-shrink-0 overflow-hidden">
                            {post.cover_image ? (
                              <img src={post.cover_image} alt="" className="w-full h-full object-cover" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center text-gray-600">
                                <BookOpen size={14} />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-white text-xs truncate max-w-60">{post.title}</p>
                            <p className="text-gray-600 text-[10px] truncate max-w-60">{post.excerpt}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {catNode ? (
                          <span className={`flex items-center gap-1.5 text-[11px] font-semibold ${catNode.color}`}>
                            {catNode.icon}
                            {catNode.label}
                          </span>
                        ) : (
                          <span className="text-gray-500 text-xs">{post.category}</span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-xs">{post.read_time} min</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-gray-400 text-xs">
                          {post.published_at
                            ? new Date(post.published_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' })
                            : '—'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`text-[10px] font-black px-2 py-0.5 ${post.published ? 'bg-green-500/20 text-green-300' : 'bg-gray-700 text-gray-400'}`}>
                          {post.published ? 'Publié' : 'Brouillon'}
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            onClick={() => togglePublish(post)}
                            className={`p-1.5 transition-colors ${post.published ? 'text-green-400 hover:text-gray-400' : 'text-gray-600 hover:text-green-400'} hover:bg-white/10`}
                            title={post.published ? 'Dépublier' : 'Publier'}
                          >
                            {post.published ? <Eye size={13} /> : <EyeOff size={13} />}
                          </button>
                          <Link
                            to={`/admin/blog/${post.id}`}
                            className="p-1.5 text-gray-400 hover:text-[#fff500] hover:bg-white/10 transition-colors"
                            title="Modifier"
                          >
                            <Pencil size={13} />
                          </Link>
                          <button
                            onClick={() => handleDelete(post.id)}
                            className="p-1.5 text-gray-400 hover:text-red-400 hover:bg-white/10 transition-colors"
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
