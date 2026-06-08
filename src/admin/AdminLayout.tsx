import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, BookOpen, Users, MessageSquare,
  Warehouse, TrendingUp, LogOut, Menu, X, ChevronRight, LayoutGrid,
} from 'lucide-react';
import { adminLogout } from './AdminAuth';

const navItems = [
  { href: '/admin', label: 'Tableau de bord', icon: <LayoutDashboard size={18} /> },
  { href: '/admin/produits', label: 'Produits', icon: <Package size={18} /> },
  { href: '/admin/blog', label: 'Blog', icon: <BookOpen size={18} /> },
  { href: '/admin/crm', label: 'CRM / Commandes', icon: <Users size={18} /> },
  { href: '/admin/contacts', label: 'Contacts', icon: <MessageSquare size={18} /> },
  { href: '/admin/stock', label: 'Stock', icon: <Warehouse size={18} /> },
  { href: '/admin/comptabilite', label: 'Comptabilité', icon: <TrendingUp size={18} /> },
  { href: '/admin/categories', label: 'Photos catégories', icon: <LayoutGrid size={18} /> },
];

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const [desktopOpen, setDesktopOpen] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Ferme le drawer mobile à chaque changement de page
  useEffect(() => { setMobileOpen(false); }, [location.pathname]);

  // Empêche le scroll du body quand le drawer est ouvert
  useEffect(() => {
    document.body.style.overflow = mobileOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  const handleLogout = () => { adminLogout(); onLogout(); };

  const NavLinks = ({ onClick }: { onClick?: () => void }) => (
    <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
      {navItems.map(item => {
        const active = location.pathname === item.href ||
          (item.href !== '/admin' && location.pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            to={item.href}
            onClick={onClick}
            className={`flex items-center gap-3 px-3 py-3 text-sm font-semibold transition-all duration-150 rounded-lg
              ${active
                ? 'bg-[#fff500] text-black'
                : 'text-gray-400 hover:bg-white/10 hover:text-white'
              }`}
          >
            <span className="flex-shrink-0">{item.icon}</span>
            <span className="truncate">{item.label}</span>
            {active && <ChevronRight size={14} className="ml-auto flex-shrink-0" />}
          </Link>
        );
      })}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-950 flex flex-col md:flex-row">

      {/* ── MOBILE : top bar ── */}
      <header className="md:hidden flex items-center justify-between px-4 h-14 bg-black border-b border-white/10 flex-shrink-0 sticky top-0 z-30">
        <span className="font-display font-bold text-base text-white">
          EDITION<span className="text-[#fff500]">MADE</span>
          <span className="text-gray-400 text-xs font-normal ml-1">Admin</span>
        </span>
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
          aria-label="Ouvrir le menu"
        >
          <Menu size={22} />
        </button>
      </header>

      {/* ── MOBILE : overlay backdrop ── */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* ── MOBILE : drawer latéral ── */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-72 bg-black border-r border-white/10 flex flex-col
        transform transition-transform duration-300 ease-in-out md:hidden
        ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10 flex-shrink-0">
          <div className="flex items-center gap-1.5 min-w-0">
            <img
              src="https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp"
              alt="Edition Made"
              className="h-6 w-auto object-contain brightness-0 invert flex-shrink-0"
            />
            <span className="text-gray-400 text-xs font-normal">Admin</span>
          </div>
          <button
            onClick={() => setMobileOpen(false)}
            className="p-2 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
            aria-label="Fermer le menu"
          >
            <X size={18} />
          </button>
        </div>

        <NavLinks onClick={() => setMobileOpen(false)} />

        <div className="p-3 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-3 text-sm font-semibold text-gray-500 hover:text-red-400 hover:bg-white/5 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span>Déconnexion</span>
          </button>
        </div>
      </div>

      {/* ── DESKTOP : sidebar fixe ── */}
      <aside className={`
        hidden md:flex flex-col flex-shrink-0 bg-black border-r border-white/10
        transition-all duration-200
        ${desktopOpen ? 'w-56' : 'w-14'}
      `}>
        <div className="flex items-center justify-between px-3 h-14 border-b border-white/10 flex-shrink-0">
          {desktopOpen && (
            <div className="flex items-center gap-1.5 min-w-0">
              <img
                src="https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp"
                alt="Edition Made"
                className="h-6 w-auto object-contain brightness-0 invert flex-shrink-0"
              />
              <span className="text-gray-400 text-xs font-normal">Admin</span>
            </div>
          )}
          <button
            onClick={() => setDesktopOpen(!desktopOpen)}
            className="p-1.5 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white ml-auto flex-shrink-0"
          >
            {desktopOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map(item => {
            const active = location.pathname === item.href ||
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                title={!desktopOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-2 py-2.5 text-xs font-semibold transition-all duration-150 rounded
                  ${active
                    ? 'bg-[#fff500] text-black'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {desktopOpen && <span className="truncate">{item.label}</span>}
                {desktopOpen && active && <ChevronRight size={12} className="ml-auto flex-shrink-0" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-white/10 flex-shrink-0">
          <button
            onClick={handleLogout}
            title={!desktopOpen ? 'Déconnexion' : undefined}
            className="w-full flex items-center gap-3 px-2 py-2.5 text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-white/5 rounded transition-colors"
          >
            <LogOut size={18} />
            {desktopOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      {/* ── Contenu principal ── */}
      <main className="flex-1 overflow-auto min-h-0">
        <div className="min-h-full">{children}</div>
      </main>
    </div>
  );
}
