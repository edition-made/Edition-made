import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock, ArrowRight } from 'lucide-react';
import { supabase, DbBlogPost } from '../lib/supabase';

type CatFilter = { id: string; label: string };

const CATEGORY_FILTERS: CatFilter[] = [
  { id: '', label: 'Tous' },
  { id: 'Conseils', label: 'Conseils' },
  { id: 'Inspiration', label: 'Inspiration' },
  { id: 'Bons plans', label: 'Bons plans' },
  { id: 'Actualités', label: 'Actualités' },
  { id: 'Tendances', label: 'Tendances' },
];

const CAT_COLORS: Record<string, string> = {
  Conseils: 'bg-amber-100 text-amber-800',
  Inspiration: 'bg-sky-100 text-sky-800',
  'Bons plans': 'bg-green-100 text-green-800',
  Actualités: 'bg-rose-100 text-rose-800',
  Tendances: 'bg-orange-100 text-orange-800',
};

export default function BlogPage() {
  const [posts, setPosts] = useState<DbBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('');

  useEffect(() => {
    const fetchPosts = async () => {
      setLoading(true);
      let q = supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .order('published_at', { ascending: false });
      if (activeCategory) q = q.eq('category', activeCategory);
      const { data } = await q;
      setPosts(data || []);
      setLoading(false);
    };
    fetchPosts();
  }, [activeCategory]);

  const featured = posts[0];
  const rest = posts.slice(1);

  return (
    <div className="bg-white">
      <div className="bg-black text-white py-12">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-4xl text-white mb-3">Blog Edition Made</h1>
          <p className="text-gray-400">Conseils déco, guides d'achat et tendances pour votre intérieur</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-12">
        <div className="flex gap-2 mb-10 flex-wrap">
          {CATEGORY_FILTERS.map(cat => (
            <button
              key={cat.id}
              onClick={() => setActiveCategory(cat.id)}
              className={`px-4 py-2 text-xs font-bold border transition-colors ${
                activeCategory === cat.id
                  ? 'bg-black text-white border-black'
                  : 'border-gray-300 hover:border-black'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
          </div>
        ) : posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg font-medium mb-2">Aucun article dans cette catégorie</p>
            <button onClick={() => setActiveCategory('')} className="text-sm underline hover:no-underline">
              Voir tous les articles
            </button>
          </div>
        ) : (
          <>
            {featured && (
              <Link
                to={`/blog/${featured.slug}`}
                className="group grid md:grid-cols-2 gap-8 mb-14 bg-gray-50 overflow-hidden hover:shadow-md transition-shadow"
              >
                <div className="aspect-video overflow-hidden">
                  <img
                    src={featured.cover_image}
                    alt={featured.title}
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div className="p-6 flex flex-col justify-center">
                  <span className={`inline-block text-[10px] font-black px-2 py-0.5 uppercase mb-3 ${CAT_COLORS[featured.category] || 'bg-[#fff500] text-black'}`}>
                    {featured.category} — À la une
                  </span>
                  <h2 className="font-display font-bold text-2xl text-black leading-tight mb-3 group-hover:underline">
                    {featured.title}
                  </h2>
                  <p className="text-sm text-gray-600 leading-relaxed mb-4">{featured.excerpt}</p>
                  <div className="flex items-center gap-3 text-xs text-gray-400">
                    <Clock size={12} />
                    <span>{featured.read_time} min de lecture</span>
                    <span>·</span>
                    <span>
                      {featured.published_at
                        ? new Date(featured.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                        : ''}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-sm font-bold mt-4 text-black group-hover:gap-2 transition-all">
                    Lire l'article <ArrowRight size={14} />
                  </div>
                </div>
              </Link>
            )}

            {rest.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rest.map(post => (
                  <Link key={post.id} to={`/blog/${post.slug}`} className="group">
                    <div className="overflow-hidden aspect-video bg-gray-100 mb-4">
                      <img
                        src={post.cover_image}
                        alt={post.title}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                    <span className={`inline-block text-[10px] font-black px-2 py-0.5 uppercase mb-2 ${CAT_COLORS[post.category] || 'bg-[#fff500] text-black'}`}>
                      {post.category}
                    </span>
                    <h3 className="font-bold text-base text-black leading-snug group-hover:underline mb-2">{post.title}</h3>
                    <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                    <div className="flex items-center gap-2 text-xs text-gray-400">
                      <Clock size={11} />
                      <span>{post.read_time} min</span>
                      <span>·</span>
                      <span>
                        {post.published_at
                          ? new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' })
                          : ''}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </>
        )}

        <div className="mt-16 bg-black text-white p-8 text-center">
          <h2 className="font-display font-bold text-2xl text-white mb-2">Conseils SEO — Mobilier haut de gamme pas cher</h2>
          <p className="text-gray-400 text-sm mb-6 max-w-2xl mx-auto">
            Edition Made est votre spécialiste du <strong className="text-white">déstockage mobilier haut de gamme</strong> en Île-de-France. Canapés, tables, fauteuils, literie — découvrez nos arrivages et promotions. Livraison France entière ou retrait dans notre showroom de 500m² à Saint-Maurice (94).
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {['déstockage meuble', 'mobilier haut de gamme pas cher', 'outlet mobilier Paris', 'canapé design pas cher', 'showroom meubles Saint-Maurice 94'].map(tag => (
              <span key={tag} className="bg-white/10 text-gray-400 text-xs px-3 py-1">#{tag}</span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
