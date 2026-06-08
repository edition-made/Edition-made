import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  Search, ShoppingCart, Menu, X, ChevronDown, Phone, MapPin,
  Home, Tag, Sparkles, Sofa, Armchair, Star, Moon, Leaf, BookOpen, Store,
} from 'lucide-react';
import { useCart } from '../../context/CartContext';
import CartDrawer from './CartDrawer';

const navLinks = [
  {
    label: 'Accueil',
    href: '/',
    icon: <Home size={18} />,
  },
  {
    label: 'Promotions',
    href: '/promotions',
    icon: <Tag size={18} />,
    highlight: true,
  },
  {
    label: 'Arrivage',
    href: '/arrivage',
    icon: <Sparkles size={18} />,
    badge: 'Nouveau',
  },
  {
    label: 'Canapés',
    href: '/categorie/canapes',
    icon: <Sofa size={18} />,
    submenu: [
      { label: 'Canapés fixes', href: '/categorie/canapes/canapes-fixes' },
      { label: 'Convertibles', href: '/categorie/canapes/convertibles' },
    ],
  },
  {
    label: 'Fauteuils & Poufs',
    href: '/categorie/fauteuils-poufs',
    icon: <Armchair size={18} />,
  },
  {
    label: 'Meubles',
    href: '/categorie/meubles',
    icon: <img src="/meubles_icone.png" alt="Meubles" className="w-[18px] h-[18px] object-contain" />,
  },
  {
    label: 'Tables',
    href: '/categorie/tables',
    icon: <img src="/table_icone.png" alt="Tables" className="w-[18px] h-[18px] object-contain" />,
    submenu: [
      { label: 'Tables basses', href: '/categorie/tables/tables-basses' },
      { label: 'Tables de repas', href: '/categorie/tables/tables-repas' },
    ],
  },
  {
    label: 'Chaises',
    href: '/categorie/chaises-tabourets',
    icon: <img src="/chaise_icone.png" alt="Chaises" className="w-[18px] h-[18px] object-contain" />,
  },
  {
    label: 'Déco',
    href: '/categorie/accessoires-decoration',
    icon: <Star size={18} />,
  },
  {
    label: 'Literie',
    href: '/categorie/literie',
    icon: <Moon size={18} />,
    submenu: [
      { label: 'Matelas', href: '/categorie/literie/matelas' },
      { label: 'Sommiers', href: '/categorie/literie/sommiers' },
      { label: 'Linge de lit', href: '/categorie/literie/linge-de-lit' },
    ],
  },
  {
    label: 'Jardin',
    href: '/categorie/mobilier-exterieur',
    icon: <Leaf size={18} />,
  },
  {
    label: 'Blog',
    href: '/blog',
    icon: <BookOpen size={18} />,
  },
  {
    label: 'Magasin',
    href: '/magasin',
    icon: <Store size={18} />,
  },
];

export default function Header() {
  const { totalItems, openCart } = useCart();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeSubmenu, setActiveSubmenu] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const handleScroll = () => setIsScrolled(window.scrollY > 10);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/recherche?q=${encodeURIComponent(searchQuery)}`);
      setSearchOpen(false);
    }
  };

  return (
    <>
      <header className={`sticky-header bg-white border-b border-gray-200 z-50 ${isScrolled ? 'scrolled' : ''}`}>
        <div className="max-w-screen-xl mx-auto px-4">
          <div className="flex items-center justify-between h-20 gap-4">
            <Link to="/" className="flex-shrink-0">
              <img
                src="https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp"
                alt="Edition Made"
                className="h-12 w-auto object-contain"
              />
            </Link>

            <nav className="hidden xl:flex items-stretch h-full overflow-x-auto scrollbar-hide">
              {navLinks.map((link) => (
                <div
                  key={link.href}
                  className="relative flex items-stretch"
                  onMouseEnter={() => link.submenu && setActiveSubmenu(link.label)}
                  onMouseLeave={() => setActiveSubmenu(null)}
                >
                  <Link
                    to={link.href}
                    className={`
                      flex flex-col items-center justify-center gap-1 px-3 min-w-[60px] text-[10px] font-bold whitespace-nowrap transition-all duration-150 border-b-2
                      ${link.highlight
                        ? 'bg-[#fff500] text-black border-[#fff500]'
                        : 'text-gray-600 border-transparent hover:bg-[#fff500] hover:text-black hover:border-[#fff500]'
                      }
                    `}
                  >
                    <span className={link.highlight ? 'text-black' : 'text-gray-500 group-hover:text-black'}>
                      {link.icon}
                    </span>
                    <span className="flex items-center gap-0.5 leading-none text-center">
                      {link.label}
                      {link.submenu && <ChevronDown size={9} />}
                    </span>
                    {link.badge && (
                      <span className="absolute top-1.5 right-1 bg-black text-[#fff500] text-[8px] font-black px-1 leading-tight uppercase">
                        {link.badge}
                      </span>
                    )}
                  </Link>

                  {link.submenu && activeSubmenu === link.label && (
                    <div className="absolute top-full left-0 bg-white border border-gray-200 shadow-lg min-w-[200px] z-50 animate-fade-in">
                      {link.submenu.map(sub => (
                        <Link
                          key={sub.href}
                          to={sub.href}
                          className="block px-4 py-3 text-xs font-semibold text-gray-700 hover:bg-[#fff500] hover:text-black transition-colors border-b border-gray-50 last:border-0"
                        >
                          {sub.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </nav>

            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={() => setSearchOpen(!searchOpen)}
                className="p-2 hover:bg-[#fff500] transition-colors"
                aria-label="Rechercher"
              >
                <Search size={20} />
              </button>

              <a
                href="https://wa.me/33XXXXXXXXX"
                target="_blank"
                rel="noopener noreferrer"
                className="hidden md:flex items-center gap-1 text-xs font-semibold text-gray-700 hover:bg-[#fff500] p-2 transition-colors"
              >
                <Phone size={16} />
                <span className="hidden lg:block">WhatsApp</span>
              </a>

              <button
                onClick={openCart}
                className="relative p-2 hover:bg-[#fff500] transition-colors"
                aria-label="Panier"
              >
                <ShoppingCart size={20} />
                {totalItems > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 bg-[#fff500] text-black text-xs font-black w-5 h-5 flex items-center justify-center">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setMobileOpen(!mobileOpen)}
                className="xl:hidden p-2 hover:bg-[#fff500] transition-colors"
                aria-label="Menu"
              >
                {mobileOpen ? <X size={20} /> : <Menu size={20} />}
              </button>
            </div>
          </div>

          {searchOpen && (
            <div className="py-3 border-t border-gray-100 animate-slide-up">
              <form onSubmit={handleSearch} className="flex gap-2">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Rechercher un produit, une catégorie..."
                  className="flex-1 border border-gray-300 px-4 py-2 text-sm focus:outline-none focus:border-black"
                  autoFocus
                />
                <button type="submit" className="bg-black text-white px-4 py-2 text-sm font-bold hover:bg-gray-900 transition-colors">
                  Rechercher
                </button>
              </form>
            </div>
          )}
        </div>

        {mobileOpen && (
          <div className="xl:hidden border-t border-gray-200 bg-white max-h-[80vh] overflow-y-auto animate-slide-up">
            <nav className="flex flex-col">
              {navLinks.map((link) => (
                <div key={link.href}>
                  <Link
                    to={link.href}
                    onClick={() => setMobileOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 text-sm font-semibold border-b border-gray-100 transition-colors hover:bg-[#fff500] hover:text-black
                      ${link.highlight ? 'bg-[#fff500]' : ''}`}
                  >
                    <span className="text-gray-500">{link.icon}</span>
                    <span className="flex items-center gap-2">
                      {link.label}
                      {link.badge && (
                        <span className="bg-black text-white text-[9px] font-black px-1 py-0.5 uppercase">{link.badge}</span>
                      )}
                    </span>
                  </Link>
                  {link.submenu && link.submenu.map(sub => (
                    <Link
                      key={sub.href}
                      to={sub.href}
                      onClick={() => setMobileOpen(false)}
                      className="flex items-center px-10 py-2.5 text-xs font-medium text-gray-600 border-b border-gray-50 hover:bg-[#fff500] hover:text-black transition-colors"
                    >
                      — {sub.label}
                    </Link>
                  ))}
                </div>
              ))}
              <div className="px-4 py-4 flex flex-col gap-2">
                <a href="tel:+33XXXXXXXXX" className="flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors">
                  <Phone size={16} /> Appeler le showroom
                </a>
                <Link to="/contact" onClick={() => setMobileOpen(false)} className="flex items-center gap-2 text-sm font-semibold hover:text-gray-600 transition-colors">
                  <MapPin size={16} /> Voir le magasin
                </Link>
              </div>
            </nav>
          </div>
        )}
      </header>
      <CartDrawer />
    </>
  );
}
