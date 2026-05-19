import { useState, useEffect } from 'react';
import { Users, ShoppingCart, ChevronDown, ChevronUp, Package, Truck, Store } from 'lucide-react';
import { supabase, DbOrder, DbCustomer, DbOrderItem } from '../../lib/supabase';

type Tab = 'orders' | 'customers';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'];

const statusConfig: Record<string, { label: string; color: string }> = {
  pending: { label: 'En attente', color: 'bg-yellow-500/20 text-yellow-300 border border-yellow-500/30' },
  confirmed: { label: 'Confirmé', color: 'bg-blue-500/20 text-blue-300 border border-blue-500/30' },
  processing: { label: 'En préparation', color: 'bg-orange-500/20 text-orange-300 border border-orange-500/30' },
  shipped: { label: 'Expédié', color: 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' },
  delivered: { label: 'Livré', color: 'bg-green-500/20 text-green-300 border border-green-500/30' },
  cancelled: { label: 'Annulé', color: 'bg-red-500/20 text-red-300 border border-red-500/30' },
  refunded: { label: 'Remboursé', color: 'bg-gray-500/20 text-gray-300 border border-gray-500/30' },
};

export default function CRMAdmin() {
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [customers, setCustomers] = useState<DbCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedOrder, setExpandedOrder] = useState<string | null>(null);
  const [orderItems, setOrderItems] = useState<Record<string, DbOrderItem[]>>({});
  const [filterStatus, setFilterStatus] = useState('');

  const fetchOrders = async () => {
    let q = supabase.from('orders').select('*').order('created_at', { ascending: false });
    if (filterStatus) q = q.eq('status', filterStatus);
    const { data } = await q;
    setOrders(data || []);
  };

  const fetchCustomers = async () => {
    const { data } = await supabase.from('customers').select('*').order('created_at', { ascending: false });
    setCustomers(data || []);
  };

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      await Promise.all([fetchOrders(), fetchCustomers()]);
      setLoading(false);
    };
    load();
  }, [filterStatus]);

  const expandOrder = async (orderId: string) => {
    if (expandedOrder === orderId) { setExpandedOrder(null); return; }
    if (!orderItems[orderId]) {
      const { data } = await supabase.from('order_items').select('*').eq('order_id', orderId);
      setOrderItems(prev => ({ ...prev, [orderId]: data || [] }));
    }
    setExpandedOrder(orderId);
  };

  const updateOrderStatus = async (orderId: string, status: string) => {
    await supabase.from('orders').update({ status, updated_at: new Date().toISOString() }).eq('id', orderId);
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
  };

  return (
    <div className="p-6">
      <h1 className="font-display font-bold text-2xl text-white mb-6">CRM</h1>

      <div className="flex gap-1 mb-6 border-b border-white/10">
        {([['orders', 'Commandes', ShoppingCart], ['customers', 'Clients', Users]] as const).map(([t, label, Icon]) => (
          <button key={t} onClick={() => setTab(t)}
            className={`flex items-center gap-2 px-5 py-2.5 text-sm font-bold transition-colors ${tab === t ? 'text-[#fff500] border-b-2 border-[#fff500]' : 'text-gray-500 hover:text-white'}`}>
            <Icon size={15} /> {label}
            {t === 'orders' && <span className="bg-white/10 text-gray-400 text-[10px] px-1.5 py-0.5">{orders.length}</span>}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : tab === 'orders' ? (
        <>
          <div className="flex gap-3 mb-4">
            <select value={filterStatus} onChange={e => setFilterStatus(e.target.value)}
              className="bg-white/5 border border-white/15 text-gray-300 text-sm px-3 py-2 focus:outline-none focus:border-[#fff500]">
              <option value="">Tous les statuts</option>
              {STATUS_OPTIONS.map(s => <option key={s} value={s}>{statusConfig[s]?.label || s}</option>)}
            </select>
          </div>

          {orders.length === 0 ? (
            <div className="text-center py-16">
              <ShoppingCart size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Aucune commande</p>
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map(order => (
                <div key={order.id} className="bg-black/40 border border-white/10 overflow-hidden hover:border-white/20 transition-colors">
                  <div
                    className="flex items-center gap-4 p-4 cursor-pointer"
                    onClick={() => expandOrder(order.id)}
                  >
                    <div className="flex-1 min-w-0 grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div>
                        <p className="text-[#fff500] text-xs font-black">{order.order_number}</p>
                        <p className="text-white text-sm font-semibold">{order.customer_first_name} {order.customer_last_name}</p>
                        <p className="text-gray-500 text-[10px]">{order.customer_email}</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase">Mode</p>
                        <div className="flex items-center gap-1 text-xs text-white">
                          {order.delivery_mode === 'pickup' ? <Store size={12} /> : <Truck size={12} />}
                          {order.delivery_mode === 'pickup' ? 'Retrait' : 'Livraison'}
                        </div>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase">Total</p>
                        <p className="font-black text-white">{order.total?.toFixed(2)} €</p>
                      </div>
                      <div>
                        <p className="text-gray-400 text-[10px] uppercase mb-1">Statut</p>
                        <select
                          value={order.status}
                          onChange={e => { e.stopPropagation(); updateOrderStatus(order.id, e.target.value); }}
                          onClick={e => e.stopPropagation()}
                          className={`text-[10px] font-bold px-2 py-1 border-0 focus:outline-none focus:ring-1 focus:ring-[#fff500] ${statusConfig[order.status]?.color || ''} bg-transparent`}
                        >
                          {STATUS_OPTIONS.map(s => <option key={s} value={s} className="bg-gray-900">{statusConfig[s]?.label || s}</option>)}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 text-gray-500 text-xs flex-shrink-0">
                      <span>{new Date(order.created_at).toLocaleDateString('fr-FR')}</span>
                      {expandedOrder === order.id ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                    </div>
                  </div>

                  {expandedOrder === order.id && (
                    <div className="border-t border-white/10 p-4 bg-white/3">
                      <div className="grid md:grid-cols-2 gap-6 mb-4">
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Informations client</p>
                          <div className="space-y-1 text-xs text-gray-300">
                            <p>{order.customer_first_name} {order.customer_last_name}</p>
                            <p>{order.customer_email}</p>
                            {order.customer_phone && <p>{order.customer_phone}</p>}
                            {order.delivery_address && <p>{order.delivery_address}, {order.delivery_zip} {order.delivery_city}</p>}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Résumé financier</p>
                          <div className="space-y-1 text-xs">
                            <div className="flex justify-between text-gray-400"><span>Sous-total</span><span>{order.subtotal?.toFixed(2)} €</span></div>
                            <div className="flex justify-between text-gray-400"><span>Livraison</span><span>{order.delivery_cost?.toFixed(2)} €</span></div>
                            <div className="flex justify-between text-white font-black border-t border-white/10 pt-1 mt-1"><span>Total</span><span>{order.total?.toFixed(2)} €</span></div>
                          </div>
                        </div>
                      </div>
                      {orderItems[order.id] && (
                        <div>
                          <p className="text-xs font-bold text-gray-400 uppercase mb-2">Articles commandés</p>
                          <div className="space-y-2">
                            {orderItems[order.id].map(item => (
                              <div key={item.id} className="flex items-center gap-3 bg-white/5 p-2">
                                {item.product_image && <img src={item.product_image} alt="" className="w-10 h-10 object-cover bg-gray-800" />}
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-semibold text-white truncate">{item.product_name}</p>
                                  {item.selected_color && <p className="text-[10px] text-gray-500">{item.selected_color}</p>}
                                </div>
                                <div className="text-right text-xs flex-shrink-0">
                                  <p className="text-gray-400">{item.quantity} × {item.unit_price?.toFixed(2)} €</p>
                                  <p className="font-black text-white">{item.total_price?.toFixed(2)} €</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </>
      ) : (
        <div>
          {customers.length === 0 ? (
            <div className="text-center py-16">
              <Users size={40} className="text-gray-700 mx-auto mb-3" />
              <p className="text-gray-500">Aucun client</p>
            </div>
          ) : (
            <div className="border border-white/10 overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-white/5 border-b border-white/10 text-left">
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Client</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Contact</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Localisation</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Commandes</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Total dépensé</th>
                    <th className="px-4 py-3 text-xs font-bold text-gray-400 uppercase tracking-wide">Depuis</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {customers.map(customer => (
                    <tr key={customer.id} className="hover:bg-white/3 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-[#fff500] flex items-center justify-center text-black font-black text-xs flex-shrink-0">
                            {customer.first_name[0]}{customer.last_name[0]}
                          </div>
                          <span className="text-white text-xs font-semibold">{customer.first_name} {customer.last_name}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        <div>{customer.email}</div>
                        {customer.phone && <div>{customer.phone}</div>}
                      </td>
                      <td className="px-4 py-3 text-gray-400 text-xs">
                        {customer.zip && customer.city ? `${customer.zip} ${customer.city}` : '—'}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className="text-white font-black text-sm">{customer.total_orders}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className="text-[#fff500] font-black text-sm">{customer.total_spent?.toFixed(2)} €</span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs">
                        {new Date(customer.created_at).toLocaleDateString('fr-FR')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
