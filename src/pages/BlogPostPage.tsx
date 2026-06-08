import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Clock, ArrowLeft, ArrowRight, Tag, ChevronDown } from 'lucide-react';
import { supabase, DbBlogPost } from '../lib/supabase';
import { blogPosts as mockPosts } from '../data/blog';
import { BlogPost } from '../types';

function toDb(p: BlogPost): DbBlogPost {
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

const FAQ_BY_CATEGORY: Record<string, { q: string; a: string }[]> = {
  Conseils: [
    { q: 'Où acheter des meubles haut de gamme pas chers en Île-de-France ?', a: 'Edition Made, showroom de 500 m² à Saint-Maurice (94), propose des meubles haut de gamme en déstockage jusqu\'à -60%. Retrait sur place ou livraison France entière.' },
    { q: 'Comment bien choisir ses meubles ?', a: 'Il faut considérer les dimensions de votre espace, le style de décoration, la qualité des matériaux et votre budget. N\'hésitez pas à visiter notre showroom pour vous faire conseiller par nos experts.' },
    { q: 'Proposez-vous des conseils en aménagement intérieur ?', a: 'Oui, notre équipe en showroom vous accompagne dans le choix des meubles adaptés à votre espace. Contactez-nous par téléphone, WhatsApp ou via notre formulaire de contact.' },
  ],
  'Bons plans': [
    { q: 'Comment profiter des meilleures promotions chez Edition Made ?', a: 'Visitez régulièrement notre page Arrivages et Promotions pour ne manquer aucune offre. Les arrivages changent fréquemment et les stocks sont limités. Abonnez-vous à notre newsletter.' },
    { q: 'Y a-t-il des soldes ou des périodes de déstockage particulières ?', a: 'Chez Edition Made, les prix déstockage sont permanents — pas besoin d\'attendre les soldes. De plus, nous organisons régulièrement des opérations spéciales avec des remises supplémentaires annoncées sur nos réseaux sociaux.' },
    { q: 'Peut-on négocier les prix en magasin ?', a: 'Nos prix sont déjà les plus bas du marché grâce à notre modèle de déstockage. Pour les achats en volume ou les projets d\'aménagement complets, contactez notre équipe pour étudier votre projet.' },
  ],
  Inspiration: [
    { q: 'Où trouver de l\'inspiration pour décorer son intérieur ?', a: 'Parcourez notre blog et nos réseaux sociaux pour des idées décoration. Visitez aussi notre showroom où nos espaces sont mis en scène pour vous inspirer avec des associations de meubles et d\'accessoires.' },
    { q: 'Comment mélanger les styles de décoration ?', a: 'La clé est de choisir un style dominant et d\'y ajouter des touches d\'autres styles. Nos conseillers en showroom peuvent vous aider à créer un intérieur cohérent et personnalisé à partir de nos produits en stock.' },
    { q: 'Quelles sont les tendances déco actuelles ?', a: 'Les styles naturels (bois, rotin, lin), le minimalisme japandi et les couleurs terreuses sont très tendances. Visitez nos arrivages réguliers pour découvrir les nouvelles pièces qui correspondent à ces tendances.' },
  ],
  Tendances: [
    { q: 'Quelles tendances mobilier dominent en 2026 ?', a: 'Le mobilier en matériaux naturels (chêne, rotin, marbre), les lignes épurées du style scandinave et les pièces multifonctionnelles pour les petits espaces sont très prisés. Découvrez notre sélection en showroom.' },
    { q: 'Comment intégrer les nouvelles tendances sans se ruiner ?', a: 'Le déstockage est idéal pour adopter les tendances à prix réduit. Edition Made renouvelle régulièrement ses stocks avec des pièces dans l\'air du temps, achetées directement auprès des fabricants.' },
    { q: 'Le mobilier haut de gamme se démode-t-il vite ?', a: 'Le mobilier de qualité conçu avec des matériaux nobles (bois massif, cuir véritable, métal) est intemporel. Il traverse les tendances et constitue un investissement durable pour votre intérieur.' },
  ],
  Actualités: [
    { q: 'Comment être informé des nouveaux arrivages Edition Made ?', a: 'Inscrivez-vous à notre newsletter depuis le bas de la page d\'accueil et suivez-nous sur Instagram et Facebook pour être alerté en temps réel de nos nouvelles réceptions.' },
    { q: 'Edition Made propose-t-il des événements spéciaux ?', a: 'Oui, nous organisons régulièrement des portes ouvertes, ventes privées et opérations déstockage exceptionnelles. Restez connecté à nos réseaux sociaux et newsletter pour être invité en priorité.' },
    { q: 'Peut-on commander en ligne et se faire livrer ?', a: 'Oui, notre boutique en ligne permet de commander et de se faire livrer partout en France métropolitaine. Le paiement est sécurisé par Stripe avec possibilité de payer en 3x ou 4x sans frais dès 100€.' },
  ],
};

const DEFAULT_FAQ = [
  { q: 'Comment acheter chez Edition Made ?', a: 'Vous pouvez acheter directement sur notre site en ligne avec livraison France entière, ou visiter notre showroom de 500 m² à Saint-Maurice (94) pour voir les produits en vrai. Paiement sécurisé par carte ou en 3x/4x sans frais.' },
  { q: 'Quelle est la politique de retour ?', a: 'Vous bénéficiez de 14 jours pour retourner votre commande à compter de la réception. Le produit doit être en parfait état et dans son emballage d\'origine. Consultez notre page Politique de retour pour tous les détails.' },
  { q: 'Les produits sont-ils neufs ?', a: 'Oui, tous nos produits sont neufs. Il s\'agit de fins de série, surplus de production ou collections discontinuées achetées directement aux fabricants — jamais d\'occasion ni de reconditionnés.' },
];

function BlogFAQ({ category }: { category: string }) {
  const [open, setOpen] = useState<number | null>(null);
  const items = FAQ_BY_CATEGORY[category] || DEFAULT_FAQ;

  return (
    <div className="border-t border-gray-100 py-12 bg-white">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-display font-bold text-2xl text-black mb-6">Questions fréquentes</h2>
          <div className="space-y-2">
            {items.map((faq, i) => (
              <div key={i} className="border border-gray-200">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-sm text-black pr-4">{faq.q}</span>
                  <ChevronDown size={16} className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`} />
                </button>
                {open === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

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

      if (data) {
        setPost(data);
        const { data: otherData } = await supabase
          .from('blog_posts').select('*').eq('published', true).neq('slug', slug).limit(3);
        setOthers(otherData && otherData.length > 0 ? otherData : mockPosts.filter(p => p.slug !== slug).slice(0, 3).map(toDb));
      } else {
        const mock = mockPosts.find(p => p.slug === slug);
        if (!mock) { setNotFound(true); setLoading(false); return; }
        setPost(toDb(mock));
        setOthers(mockPosts.filter(p => p.slug !== slug).slice(0, 3).map(toDb));
      }
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
              className="prose prose-sm max-w-none text-gray-700 leading-relaxed [&>h2]:font-display [&>h2]:font-bold [&>h2]:text-xl [&>h2]:text-black [&>h2]:mt-10 [&>h2]:mb-3 [&>h3]:font-bold [&>h3]:text-base [&>h3]:text-black [&>h3]:mt-6 [&>h3]:mb-2 [&>p]:mb-4 [&>ul]:space-y-2 [&>ul]:pl-4 [&>ul]:list-disc [&>img]:w-full [&>img]:object-cover [&>img]:my-4 [&_a]:text-black [&_a]:font-semibold [&_a]:underline [&_a:hover]:text-[#d4bc00] [&_strong]:text-black"
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

      {/* ── Articles recommandés en bas de page ── */}
      {/* ── FAQ article ── */}
      <BlogFAQ category={post.category} />

      {others.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 py-12">
          <div className="max-w-screen-xl mx-auto px-4">
            <h2 className="font-display font-bold text-2xl text-black mb-8 text-center">
              Ces articles pourraient vous intéresser
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {others.slice(0, 3).map(other => (
                <Link
                  key={other.id}
                  to={`/blog/${other.slug}`}
                  className="group bg-white overflow-hidden hover:shadow-md transition-shadow"
                >
                  <div className="aspect-video overflow-hidden">
                    <img
                      src={other.cover_image}
                      alt={other.title}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  </div>
                  <div className="p-4">
                    <span className={`inline-block text-[9px] font-black px-2 py-0.5 uppercase mb-2 ${CAT_COLORS[other.category] || 'bg-[#fff500] text-black'}`}>
                      {other.category}
                    </span>
                    <h3 className="font-bold text-sm text-black leading-snug group-hover:underline mb-2 line-clamp-2">
                      {other.title}
                    </h3>
                    <p className="text-xs text-gray-500 line-clamp-2 mb-3">{other.excerpt}</p>
                    <div className="flex items-center gap-1 text-xs font-bold text-black group-hover:gap-2 transition-all">
                      Lire l'article <ArrowRight size={12} />
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
