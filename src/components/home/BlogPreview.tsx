import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Clock } from 'lucide-react';
import { supabase, DbBlogPost } from '../../lib/supabase';
import { blogPosts as mockPosts } from '../../data/blog';
import { BlogPost } from '../../types';
import SectionHeader from '../ui/SectionHeader';

function toDbPost(p: BlogPost): DbBlogPost {
  return {
    id: p.id, title: p.title, slug: p.slug, excerpt: p.excerpt,
    content: p.content || '', cover_image: p.image, category: p.category,
    author: p.author, published: true, published_at: p.date,
    read_time: p.readTime, tags: p.tags,
    seo_title: '', seo_description: '', seo_keywords: '',
    og_image: '', canonical_url: '', created_at: p.date, updated_at: p.date,
  };
}

const CAT_COLORS: Record<string, string> = {
  Conseils: 'bg-amber-100 text-amber-800',
  Inspiration: 'bg-sky-100 text-sky-800',
  'Bons plans': 'bg-green-100 text-green-800',
  Actualités: 'bg-rose-100 text-rose-800',
  Tendances: 'bg-orange-100 text-orange-800',
};

export default function BlogPreview() {
  const [posts, setPosts] = useState<DbBlogPost[]>([]);

  useEffect(() => {
    supabase
      .from('blog_posts')
      .select('id, title, slug, excerpt, cover_image, category, read_time, published_at')
      .eq('published', true)
      .order('published_at', { ascending: false })
      .limit(3)
      .then(({ data }) => {
        if (data && data.length > 0) setPosts(data as DbBlogPost[]);
        else setPosts(mockPosts.slice(0, 3).map(toDbPost));
      });
  }, []);

  if (posts.length === 0) return null;

  return (
    <section className="py-14 bg-white">
      <div className="max-w-screen-xl mx-auto px-4">
        <SectionHeader
          title="Conseils & Inspiration"
          subtitle="Astuces déco, guides d'achat et tendances pour votre intérieur"
          linkHref="/blog"
          linkLabel="Tous les articles"
        />

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {posts.map(post => (
            <Link key={post.id} to={`/blog/${post.slug}`} className="group block">
              <div className="overflow-hidden aspect-video bg-gray-100 mb-4">
                <img
                  src={post.cover_image}
                  alt={post.title}
                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
              <div>
                <span className={`inline-block text-[10px] font-black px-2 py-0.5 uppercase mb-2 ${CAT_COLORS[post.category] || 'bg-[#fff500] text-black'}`}>
                  {post.category}
                </span>
                <h3 className="font-bold text-base text-black leading-snug group-hover:underline mb-2">
                  {post.title}
                </h3>
                <p className="text-sm text-gray-500 line-clamp-2 mb-3">{post.excerpt}</p>
                <div className="flex items-center gap-3 text-xs text-gray-400">
                  <Clock size={12} />
                  <span>{post.read_time} min de lecture</span>
                  {post.published_at && (
                    <>
                      <span>·</span>
                      <span>{new Date(post.published_at).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</span>
                    </>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
