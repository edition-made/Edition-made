import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, ShoppingBag, Users, Euro, ArrowUpRight, ArrowDownRight } from 'lucide-react';
import { supabase, DbOrder } from '../../lib/supabase';

type PeriodKey = '7d' | '30d' | '90d' | '365d';

const PERIODS: { key: PeriodKey; label: string }[] = [
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '3 mois' },
  { key: '365d', label: '12 mois' },
];

const PERIOD_DAYS: Record<PeriodKey, number> = { '7d': 7, '30d': 30, '90d': 90, '365d': 365 };

function daysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString();
}

function formatEur(n: number) {
  return n.toLocaleString('fr-FR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + ' €';
}

export default function AccountingAdmin() {
  const [period, setPeriod] = useState<PeriodKey>('30d');
  const [orders, setOrders] = useState<DbOrder[]>([]);
  const [prevOrders, setPrevOrders] = useState<DbOrder[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const days = PERIOD_DAYS[period];
    const from = daysAgo(days);
    const prevFrom = daysAgo(days * 2);

    Promise.all([
      supabase.from('orders').select('*').gte('created_at', from).neq('status', 'cancelled').neq('status', 'refunded'),
      supabase.from('orders').select('*').gte('created_at', prevFrom).lt('created_at', from).neq('status', 'cancelled').neq('status', 'refunded'),
    ]).then(([curr, prev]) => {
      setOrders(curr.data || []);
      setPrevOrders(prev.data || []);
      setLoading(false);
    });
  }, [period]);

  const revenue = orders.reduce((s, o) => s + o.total, 0);
  const prevRevenue = prevOrders.reduce((s, o) => s + o.total, 0);
  const revenueChange = prevRevenue ? ((revenue - prevRevenue) / prevRevenue) * 100 : 0;

  const orderCount = orders.length;
  const prevOrderCount = prevOrders.length;
  const orderChange = prevOrderCount ? ((orderCount - prevOrderCount) / prevOrderCount) * 100 : 0;

  const avgOrder = orderCount ? revenue / orderCount : 0;
  const prevAvgOrder = prevOrderCount ? prevRevenue / prevOrderCount : 0;
  const avgChange = prevAvgOrder ? ((avgOrder - prevAvgOrder) / prevAvgOrder) * 100 : 0;

  const deliveryRevenue = orders.filter(o => o.delivery_mode === 'delivery').reduce((s, o) => s + o.delivery_cost, 0);
  const paidOrders = orders.filter(o => o.payment_status === 'paid').length;
  const pendingOrders = orders.filter(o => o.payment_status === 'pending').length;

  const byStatus: Record<string, { count: number; total: number }> = {};
  orders.forEach(o => {
    if (!byStatus[o.status]) byStatus[o.status] = { count: 0, total: 0 };
    byStatus[o.status].count++;
    byStatus[o.status].total += o.total;
  });

  const byPayment: Record<string, number> = {};
  orders.forEach(o => {
    byPayment[o.payment_method] = (byPayment[o.payment_method] || 0) + o.total;
  });

  const days = PERIOD_DAYS[period];
  const byDay: Record<string, number> = {};
  orders.forEach(o => {
    const d = new Date(o.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' });
    byDay[d] = (byDay[d] || 0) + o.total;
  });
  const chartEntries = Object.entries(byDay).slice(-14);
  const chartMax = Math.max(...chartEntries.map(([, v]) => v), 1);

  const statusLabels: Record<string, string> = {
    pending: 'En attente', confirmed: 'Confirmé', processing: 'En préparation',
    shipped: 'Expédié', delivered: 'Livré',
  };

  const Stat = ({ label, value, prev, icon, money = false }: {
    label: string; value: number; prev: number; icon: React.ReactNode; money?: boolean;
  }) => {
    const change = prev ? ((value - prev) / prev) * 100 : 0;
    const up = change >= 0;
    return (
      <div className="bg-black/40 border border-white/10 p-5">
        <div className="flex items-center justify-between mb-3">
          <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">{label}</span>
          <span className="text-gray-600">{icon}</span>
        </div>
        <p className="font-black text-2xl text-white mb-1">
          {money ? formatEur(value) : value.toLocaleString('fr-FR')}
        </p>
        {prev > 0 && (
          <div className={`flex items-center gap-1 text-xs font-semibold ${up ? 'text-green-400' : 'text-red-400'}`}>
            {up ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}
            {Math.abs(change).toFixed(1)}% vs période précédente
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-display font-bold text-2xl text-white">Comptabilité</h1>
          <p className="text-gray-500 text-sm">Analyse financière et performance</p>
        </div>
        <div className="flex gap-1">
          {PERIODS.map(p => (
            <button key={p.key} onClick={() => { setLoading(true); setPeriod(p.key); }}
              className={`px-3 py-2 text-xs font-bold transition-colors ${period === p.key ? 'bg-[#fff500] text-black' : 'bg-white/5 text-gray-400 hover:bg-white/10'}`}>
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-40">
          <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
        </div>
      ) : (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Stat label="Chiffre d'affaires" value={revenue} prev={prevRevenue} icon={<Euro size={18} />} money />
            <Stat label="Commandes" value={orderCount} prev={prevOrderCount} icon={<ShoppingBag size={18} />} />
            <Stat label="Panier moyen" value={avgOrder} prev={prevAvgOrder} icon={<TrendingUp size={18} />} money />
            <div className="bg-black/40 border border-white/10 p-5">
              <div className="flex items-center justify-between mb-3">
                <span className="text-gray-400 text-xs font-semibold uppercase tracking-wide">Livraisons</span>
                <span className="text-gray-600"><Users size={18} /></span>
              </div>
              <p className="font-black text-2xl text-white mb-1">{formatEur(deliveryRevenue)}</p>
              <p className="text-xs text-gray-500">revenus frais de port</p>
            </div>
          </div>

          {chartEntries.length > 0 && (
            <div className="bg-black/40 border border-white/10 p-5 mb-6">
              <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">
                Revenus par jour ({days <= 30 ? 'derniers 14 jours' : 'sélection'})
              </h2>
              <div className="flex items-end gap-1 h-32">
                {chartEntries.map(([day, val]) => (
                  <div key={day} className="flex-1 flex flex-col items-center gap-1 group relative">
                    <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-black border border-white/20 px-1.5 py-0.5 text-[10px] text-white whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity z-10">
                      {formatEur(val)}
                    </div>
                    <div
                      className="w-full bg-[#fff500] hover:bg-[#e6dc00] transition-colors"
                      style={{ height: `${(val / chartMax) * 100}%`, minHeight: val > 0 ? '4px' : '0' }}
                    />
                    <span className="text-[9px] text-gray-600 -rotate-45 origin-top-left translate-y-2">{day}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="grid lg:grid-cols-3 gap-4 mb-6">
            <div className="bg-black/40 border border-white/10 p-5">
              <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Statuts commandes</h2>
              <div className="space-y-2">
                {Object.entries(byStatus).map(([status, { count, total }]) => (
                  <div key={status} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400">{statusLabels[status] || status}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-gray-500">{count}x</span>
                      <span className="text-xs font-semibold text-white">{formatEur(total)}</span>
                    </div>
                  </div>
                ))}
                {Object.keys(byStatus).length === 0 && <p className="text-gray-600 text-xs">Aucune commande</p>}
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 p-5">
              <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Modes de paiement</h2>
              <div className="space-y-2">
                {Object.entries(byPayment).map(([method, total]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 capitalize">{method}</span>
                    <span className="text-xs font-semibold text-white">{formatEur(total)}</span>
                  </div>
                ))}
                {Object.keys(byPayment).length === 0 && <p className="text-gray-600 text-xs">Aucune commande</p>}
              </div>
            </div>

            <div className="bg-black/40 border border-white/10 p-5">
              <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">État des paiements</h2>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400" />
                    <span className="text-xs text-gray-400">Payés</span>
                  </div>
                  <span className="text-xs font-black text-green-400">{paidOrders}</span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-[#fff500]" />
                    <span className="text-xs text-gray-400">En attente</span>
                  </div>
                  <span className="text-xs font-black text-[#fff500]">{pendingOrders}</span>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-400 font-semibold">CA encaissé estimé</span>
                    <span className="text-sm font-black text-white">
                      {formatEur(orders.filter(o => o.payment_status === 'paid').reduce((s, o) => s + o.total, 0))}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="bg-black/40 border border-white/10 p-5">
            <h2 className="font-bold text-sm text-gray-300 uppercase tracking-wide mb-4">Dernières commandes</h2>
            {orders.length === 0 ? (
              <p className="text-gray-600 text-sm text-center py-6">Aucune commande sur cette période</p>
            ) : (
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="text-left py-2 text-gray-500 font-semibold">N°</th>
                    <th className="text-left py-2 text-gray-500 font-semibold">Client</th>
                    <th className="text-left py-2 text-gray-500 font-semibold">Date</th>
                    <th className="text-left py-2 text-gray-500 font-semibold">Paiement</th>
                    <th className="text-right py-2 text-gray-500 font-semibold">Total</th>
                  </tr>
                </thead>
                <tbody>
                  {orders.slice(0, 10).map(o => (
                    <tr key={o.id} className="border-b border-white/5">
                      <td className="py-2.5 text-gray-400 font-mono">{o.order_number}</td>
                      <td className="py-2.5 text-white">{o.customer_first_name} {o.customer_last_name}</td>
                      <td className="py-2.5 text-gray-400">{new Date(o.created_at).toLocaleDateString('fr-FR')}</td>
                      <td className="py-2.5">
                        <span className={`px-1.5 py-0.5 text-[10px] font-black ${
                          o.payment_status === 'paid' ? 'bg-green-500/20 text-green-300' :
                          o.payment_status === 'pending' ? 'bg-[#fff500]/20 text-[#fff500]' :
                          'bg-red-900/30 text-red-300'
                        }`}>
                          {o.payment_status === 'paid' ? 'Payé' : o.payment_status === 'pending' ? 'Attente' : o.payment_status}
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-black text-white">{formatEur(o.total)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}
    </div>
  );
}
