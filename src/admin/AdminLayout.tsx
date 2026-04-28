import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard, Package, BookOpen, Users, MessageSquare,
  Warehouse, TrendingUp, LogOut, Menu, X, ChevronRight,
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
];

interface AdminLayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export default function AdminLayout({ children, onLogout }: AdminLayoutProps) {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const handleLogout = () => {
    adminLogout();
    onLogout();
  };

  return (
    <div className="min-h-screen bg-gray-950 flex">
      <aside className={`${sidebarOpen ? 'w-56' : 'w-14'} flex-shrink-0 bg-black border-r border-white/10 flex flex-col transition-all duration-200`}>
        <div className="flex items-center justify-between px-4 h-14 border-b border-white/10">
          {sidebarOpen && (
            <span className="font-display font-bold text-sm text-white">
              EDITION<span className="text-[#fff500]">MADE</span>
              <span className="text-gray-400 text-xs font-normal ml-1">Admin</span>
            </span>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-1.5 hover:bg-white/10 transition-colors text-gray-400 hover:text-white ml-auto"
          >
            {sidebarOpen ? <X size={16} /> : <Menu size={16} />}
          </button>
        </div>

        <nav className="flex-1 py-4 space-y-1 px-2">
          {navItems.map(item => {
            const active = location.pathname === item.href ||
              (item.href !== '/admin' && location.pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                to={item.href}
                title={!sidebarOpen ? item.label : undefined}
                className={`flex items-center gap-3 px-2 py-2.5 text-xs font-semibold transition-all duration-150 group
                  ${active
                    ? 'bg-[#fff500] text-black'
                    : 'text-gray-400 hover:bg-white/10 hover:text-white'
                  }`}
              >
                <span className="flex-shrink-0">{item.icon}</span>
                {sidebarOpen && <span className="truncate">{item.label}</span>}
                {sidebarOpen && active && <ChevronRight size={12} className="ml-auto" />}
              </Link>
            );
          })}
        </nav>

        <div className="p-2 border-t border-white/10">
          <button
            onClick={handleLogout}
            title={!sidebarOpen ? 'Déconnexion' : undefined}
            className="w-full flex items-center gap-3 px-2 py-2.5 text-xs font-semibold text-gray-500 hover:text-red-400 hover:bg-white/5 transition-colors"
          >
            <LogOut size={18} />
            {sidebarOpen && <span>Déconnexion</span>}
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-auto">
        <div className="min-h-screen">{children}</div>
      </main>
    </div>
  );
}
