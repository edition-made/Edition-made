import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft, ArrowRight, Tag } from 'lucide-react';
import { supabase, DbBlogPost } from '../lib/supabase';

const CAT_COLORS: Record<string, string> = {
  Conseils: 'bg-amber-100 text-amber-800',
  Inspiration: 'bg-sky-100 text-sky-800',
  'Bons plans': 'bg-green-100 text-green-800',
  Actualités: 'bg-rose-100 text-rose-800',
  Tendances: 'bg-orange-100 text-orange-800',
};

export default function BlogPostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<DbBlogPost | null>(null);
  const [others, setOthers] = useState<DbBlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    if (!slug) return;
    const fetchPost = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('slug', slug)
        .eq('published', true)
        .maybeSingle();

      if (!data) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      setPost(data);

      const { data: otherData } = await supabase
        .from('blog_posts')
        .select('*')
        .eq('published', true)
        .neq('slug', slug)
        .limit(3);

      setOthers(otherData || []);
      setLoading(false);
    };
    fetchPost();
  }, [slug]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || !post) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Article introuvable</h1>
        <Link to="/blog" className="btn-primary">Retour au blog</Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="bg-black text-white py-10">
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="text-xs text-gray-400 mb-3 flex items-center gap-1">
            <Link to="/" className="hover:text-white">Accueil</Link>
            <span>/</span>
            <Link to="/blog" className="hover:text-white">Blog</Link>
            <span>/</span>
            <span className="text-gray-300 line-clamp-1">{post.title}</span>
          </div>
          <span className={`inline-block text-xs font-black px-2 py-0.5 uppercase mb-3 ${CAT_COLORS[post.category] || 'bg-[#fff500] text-black'}`}>
            {post.category}
          </span>
          <h1 className="font-display font-bold text-3xl md:text-4xl text-white mb-4 max-w-3xl">{post.title}</h1>
          <div className="flex items-center gap-4 text-sm text-gray-400">
            <span>{post.author}</span>
            <span>·</span>
            <Clock size={14} />
            <span>{post.read_time} min de lecture</span>
            <span>·</span>
            <span>
              {post.published_at
                ? new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })
                : ''}
            </span>
          </div>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-10">
        <div className="grid lg:grid-cols-3 gap-12">
          <article className="lg:col-span-2">
            <div className="aspect-video overflow-hidden bg-gray-100 mb-8">
              <img src={post.cover_image} alt={post.title} className="w-full h-full object-cover" />
            </div>
            <div
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed [&>h2]:font-display [&>h2]:font-bold [&>h2]:text-xl [&>h2]:text-black [&>h2]:mt-8 [&>h2]:mb-3 [&>p]:mb-4 [&>ul]:space-y-2 [&>ul]:pl-4 [&>ul]:list-disc"
              dangerouslySetInnerHTML={{ __html: post.content }}
            />
            {post.tags && post.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t border-gray-100">
                {post.tags.map(tag => (
                  <span key={tag} className="flex items-center gap-1 bg-gray-100 text-gray-600 text-xs px-3 py-1">
                    <Tag size={11} /> {tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-8">
              <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-black transition-colors">
                <ArrowLeft size={14} /> Retour au blog
              </Link>
            </div>
          </article>

          <aside>
            <div className="bg-black text-white p-5 mb-6">
              <p className="text-[#fff500] font-black text-sm uppercase mb-2">Bon plan</p>
              <h3 className="font-display font-bold text-lg mb-2">Nos promotions en cours</h3>
              <p className="text-gray-400 text-xs mb-4">Jusqu'à -60% sur le mobilier haut de gamme. Arrivages toute l'année.</p>
              <Link to="/promotions" className="btn-primary text-xs">
                Voir les promos <ArrowRight size={14} />
              </Link>
            </div>

            {others.length > 0 && (
              <div className="space-y-4">
                <h3 className="font-display font-bold text-base">Autres articles</h3>
                {others.map(other => (
                  <Link key={other.id} to={`/blog/${other.slug}`} className="group flex gap-3 hover:opacity-80 transition-opacity">
                    <div className="w-16 h-16 bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img src={other.cover_image} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div>
                      <p className="text-xs font-semibold text-black line-clamp-2 group-hover:underline">{other.title}</p>
                      <p className="text-xs text-gray-400 mt-1">{other.read_time} min</p>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </aside>
        </div>
      </div>
    </div>
  );
}
