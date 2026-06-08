import { useState, useEffect } from 'react';
import { Package, ShoppingCart, Users, MessageSquare, TrendingUp, Euro, ArrowUp, ArrowDown, Warehouse } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { Link } from 'react-router-dom';

interface Stats {
  totalProducts: number;
  totalOrders: number;
  totalRevenue: number;
  pendingOrders: number;
  totalCustomers: number;
  newContacts: number;
  lowStock: number;
  publishedPosts: number;
}

export default function Dashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0, totalOrders: 0, totalRevenue: 0, pendingOrders: 0,
    totalCustomers: 0, newContacts: 0, lowStock: 0, publishedPosts: 0,
  });
  const [recentOrders, setRecentOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStats = async () => {
      const [products, orders, customers, contacts, blog] = await Promise.all([
        supabase.from('products').select('id, stock_count, in_stock', { count: 'exact' }),
        supabase.from('orders').select('id, total, status, created_at, customer_first_name, customer_last_name, order_number').order('created_at', { ascending: false }).limit(5),
        supabase.from('customers').select('id', { count: 'exact' }),
        supabase.from('contact_submissions').select('id', { count: 'exact' }).eq('status', 'new'),
        supabase.from('blog_posts').select('id', { count: 'exact' }).eq('published', true),
      ]);

      const allOrders = await supabase.from('orders').select('total, status');
      const totalRev = allOrders.data?.reduce((sum, o) => sum + (o.total || 0), 0) || 0;
      const pending = allOrders.data?.filter(o => o.status === 'pending').length || 0;
      const lowStk = products.data?.filter(p => (p.stock_count || 0) <= 3).length || 0;

      setStats({
        totalProducts: products.count || 0,
        totalOrders: allOrders.data?.length || 0,
        totalRevenue: totalRev,
        pendingOrders: pending,
        totalCustomers: customers.count || 0,
        newContacts: contacts.count || 0,
        lowStock: lowStk,
        publishedPosts: blog.count || 0,
      });
      setRecentOrders(orders.data || []);
      setLoading(false);
    };
    fetchStats();
  }, []);

  const statCards = [
    { label: 'Chiffre d\'affaires', value: `${stats.totalRevenue.toFixed(0)} €`, icon: <Euro size={20} />, color: 'bg-[#fff500]', textColor: 'text-black', href: '/admin/comptabilite' },
    { label: 'Commandes', value: stats.totalOrders, icon: <ShoppingCart size={20} />, color: 'bg-white/5', badge: stats.pendingOrders > 0 ? `${stats.pendingOrders} en attente` : null, href: '/admin/crm' },
    { label: 'Produits', value: stats.totalProducts, icon: <Package size={20} />, color: 'bg-white/5', badge: stats.lowStock > 0 ? `${stats.lowStock} stock bas` : null, href: '/admin/produits' },
    { label: 'Clients', value: stats.totalCustomers, icon: <Users size={20} />, color: 'bg-white/5', href: '/admin/crm' },
    { label: 'Nouveaux contacts', value: stats.newContacts, icon: <MessageSquare size={20} />, color: 'bg-white/5', badge: stats.newContacts > 0 ? 'Non lus' : null, href: '/admin/contacts' },
    { label: 'Blog publiés', value: stats.publishedPosts, icon: <TrendingUp size={20} />, color: 'bg-white/5', href: '/admin/blog' },
    { label: 'Stock critique', value: stats.lowStock, icon: <Warehouse size={20} />, color: stats.lowStock > 0 ? 'bg-red-900/30' : 'bg-white/5', href: '/admin/stock' },
  ];

  const statusConfig: Record<string, { label: string; color: string }> = {
    pending: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-300' },
    confirmed: { label: 'Confirmé', color: 'bg-blue-500/20 text-blue-300' },
    processing: { label: 'En préparation', color: 'bg-orange-500/20 text-orange-300' },
    shipped: { label: 'Expédié', color: 'bg-cyan-500/20 text-cyan-300' },
    delivered: { label: 'Livré', color: 'bg-green-500/20 text-green-300' },
    cancelled: { label: 'Annulé', color: 'bg-red-500/20 text-red-300' },
  };

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Tableau de bord</h1>
        <p className="text-gray-500 text-sm">Vue d'ensemble Edition Made</p>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {statCards.map((card, i) => (
              <Link key={i} to={card.href} className={`${card.color} border border-white/10 p-4 hover:border-[#fff500]/50 transition-colors group`}>
                <div className={`flex items-center justify-between mb-2 ${card.textColor || 'text-gray-300'}`}>
                  {card.icon}
                  {card.badge && <span className="bg-red-500 text-white text-[9px] font-black px-1.5 py-0.5">{card.badge}</span>}
                </div>
                <p className={`font-black text-2xl ${card.textColor || 'text-white'}`}>{card.value}</p>
                <p className={`text-xs mt-1 ${card.textColor ? 'text-black/70' : 'text-gray-500'}`}>{card.label}</p>
              </Link>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            <div className="bg-black/40 border border-white/10 p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-base text-white">Commandes récentes</h2>
                <Link to="/admin/crm" className="text-xs text-[#fff500] hover:underline">Voir tout</Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="text-gray-600 text-sm text-center py-4">Aucune commande</p>
              ) : (
                <div className="space-y-2">
                  {recentOrders.map(order => (
                    <div key={order.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                      <div>
                        <p className="text-xs font-bold text-white">{order.order_number}</p>
                        <p className="text-xs text-gray-500">{order.customer_first_name} {order.customer_last_name}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-black text-white">{order.total?.toFixed(2)} €</p>
                        <span className={`text-[9px] font-bold px-1.5 py-0.5 ${statusConfig[order.status]?.color || 'bg-gray-500/20 text-gray-300'}`}>
                          {statusConfig[order.status]?.label || order.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="bg-black/40 border border-white/10 p-5">
              <h2 className="font-bold text-base text-white mb-4">Raccourcis rapides</h2>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { label: 'Ajouter un produit', href: '/admin/produits/nouveau', color: 'bg-[#fff500] text-black' },
                  { label: 'Rédiger un article', href: '/admin/blog/nouveau', color: 'bg-white/10 text-white' },
                  { label: 'Voir les contacts', href: '/admin/contacts', color: 'bg-white/10 text-white' },
                  { label: 'Gérer le stock', href: '/admin/stock', color: 'bg-white/10 text-white' },
                  { label: 'Comptabilité', href: '/admin/comptabilite', color: 'bg-white/10 text-white' },
                  { label: 'Voir le site', href: '/', color: 'bg-white/10 text-white', target: '_blank' },
                ].map((item, i) => (
                  <Link
                    key={i}
                    to={item.href}
                    target={(item as any).target}
                    className={`${item.color} px-3 py-2.5 text-xs font-bold hover:opacity-90 transition-opacity`}
                  >
                    {item.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
