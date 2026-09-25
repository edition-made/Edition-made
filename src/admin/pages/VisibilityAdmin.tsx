import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Activity, AlertCircle, Bot, Eye, Globe2, Link as LinkIcon,
  Loader2, MousePointerClick, Search, Share2, Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Period = 7 | 30 | 90;
type CountRow = { name: string; views: number; visitors?: number; clicks?: number };
type DailyRow = { date: string; views: number; clicks: number };
type VisibilityStats = {
  page_views: number;
  clicks: number;
  visitors: number;
  sessions: number;
  sources: CountRow[];
  pages: CountRow[];
  click_targets: { name: string; clicks: number }[];
  daily: DailyRow[];
};

const EMPTY_STATS: VisibilityStats = {
  page_views: 0, clicks: 0, visitors: 0, sessions: 0,
  sources: [], pages: [], click_targets: [], daily: [],
};

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string }> = {
  google: { label: 'Google & recherche', icon: <Search size={16} />, color: 'bg-blue-500' },
  ai: { label: 'Intelligence artificielle', icon: <Bot size={16} />, color: 'bg-purple-500' },
  social: { label: 'Réseaux sociaux', icon: <Share2 size={16} />, color: 'bg-pink-500' },
  direct: { label: 'Accès direct', icon: <LinkIcon size={16} />, color: 'bg-[#fff500]' },
  other: { label: 'Autres sites', icon: <Globe2 size={16} />, color: 'bg-gray-500' },
};

function formatPage(path: string) {
  if (path === '/') return 'Accueil';
  return decodeURIComponent(path).replace(/^\//, '').replace(/-/g, ' ').replace(/\//g, ' › ');
}

export default function VisibilityAdmin() {
  const [period, setPeriod] = useState<Period>(30);
  const [stats, setStats] = useState<VisibilityStats>(EMPTY_STATS);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchStats = useCallback(async () => {
    setLoading(true);
    setError('');
    const since = new Date(Date.now() - period * 24 * 60 * 60 * 1000).toISOString();
    const { data, error: fetchError } = await supabase.rpc('get_visibility_stats', { p_since: since });

    if (fetchError) {
      setError('Les statistiques ne sont pas encore configurées. Appliquez les migrations Supabase puis rechargez cette page.');
      setStats(EMPTY_STATS);
    } else {
      setStats({ ...EMPTY_STATS, ...(data as VisibilityStats) });
    }
    setLoading(false);
  }, [period]);

  useEffect(() => { void fetchStats(); }, [fetchStats]);

  const maxDaily = useMemo(() => Math.max(1, ...stats.daily.map(day => day.views)), [stats.daily]);
  const maxPage = useMemo(() => Math.max(1, ...stats.pages.map(page => page.views)), [stats.pages]);
  const maxClick = useMemo(() => Math.max(1, ...stats.click_targets.map(target => target.clicks)), [stats.click_targets]);
  const clickRate = stats.page_views > 0 ? Math.round((stats.clicks / stats.page_views) * 100) : 0;

  const cards = [
    { label: 'Pages vues', value: stats.page_views, icon: <Eye size={20} />, hint: `Sur ${period} jours` },
    { label: 'Visiteurs uniques', value: stats.visitors, icon: <Users size={20} />, hint: `${stats.sessions} sessions` },
    { label: 'Clics', value: stats.clicks, icon: <MousePointerClick size={20} />, hint: `${clickRate} clics / 100 vues` },
    { label: 'Pages par session', value: stats.sessions ? (stats.page_views / stats.sessions).toFixed(1) : '0', icon: <Activity size={20} />, hint: 'Engagement moyen' },
  ];

  return (
    <div className="p-4 md:p-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-white">Visibilité</h1>
          <p className="mt-1 text-sm text-gray-500">Audience, provenance et clics sur le site</p>
        </div>
        <div className="flex bg-white/5 p-1">
          {([7, 30, 90] as Period[]).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`px-3 py-2 text-xs font-bold transition-colors ${period === value ? 'bg-[#fff500] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              {value} jours
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-6 flex items-start gap-2 border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300" role="alert">
          <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="flex h-56 items-center justify-center"><Loader2 size={28} className="animate-spin text-[#fff500]" /></div>
      ) : (
        <>
          <div className="mb-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
            {cards.map(card => (
              <div key={card.label} className="border border-white/10 bg-black/40 p-4">
                <div className="mb-3 flex items-center justify-between text-gray-400">
                  {card.icon}
                  <span className="text-[10px] text-gray-600">{card.hint}</span>
                </div>
                <p className="text-2xl font-black text-white">{card.value.toLocaleString('fr-FR')}</p>
                <p className="mt-1 text-xs text-gray-500">{card.label}</p>
              </div>
            ))}
          </div>

          <div className="mb-6 grid gap-6 xl:grid-cols-5">
            <section className="border border-white/10 bg-black/40 p-5 xl:col-span-3">
              <h2 className="mb-5 font-bold text-white">Évolution des visites</h2>
              {stats.daily.length ? (
                <div className="flex h-52 items-end gap-1.5 border-b border-white/10 pt-4">
                  {stats.daily.map((day, index) => (
                    <div key={day.date} className="group relative flex h-full min-w-0 flex-1 items-end">
                      <div
                        className="w-full min-h-1 bg-[#fff500] transition-opacity hover:opacity-75"
                        style={{ height: `${Math.max(3, (day.views / maxDaily) * 100)}%` }}
                      />
                      <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 text-[10px] font-bold text-black group-hover:block">
                        {new Date(`${day.date}T12:00:00`).toLocaleDateString('fr-FR')} · {day.views} vues · {day.clicks} clics
                      </div>
                      {(index === 0 || index === stats.daily.length - 1) && (
                        <span className="absolute top-full mt-2 text-[9px] text-gray-600 first:left-0">
                          {new Date(`${day.date}T12:00:00`).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })}
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              ) : <p className="py-16 text-center text-sm text-gray-600">Les premières visites apparaîtront ici.</p>}
            </section>

            <section className="border border-white/10 bg-black/40 p-5 xl:col-span-2">
              <h2 className="mb-5 font-bold text-white">Provenance des visiteurs</h2>
              <div className="space-y-4">
                {stats.sources.map(source => {
                  const config = SOURCE_CONFIG[source.name] || SOURCE_CONFIG.other;
                  const share = stats.page_views ? Math.round((source.views / stats.page_views) * 100) : 0;
                  return (
                    <div key={source.name}>
                      <div className="mb-1.5 flex items-center justify-between text-xs">
                        <span className="flex items-center gap-2 font-semibold text-gray-300">{config.icon}{config.label}</span>
                        <span className="font-black text-white">{share}%</span>
                      </div>
                      <div className="h-2 overflow-hidden bg-white/5"><div className={`h-full ${config.color}`} style={{ width: `${share}%` }} /></div>
                      <p className="mt-1 text-[10px] text-gray-600">{source.views} vues · {source.visitors || 0} visiteurs</p>
                    </div>
                  );
                })}
                {!stats.sources.length && <p className="py-10 text-center text-sm text-gray-600">Aucune source enregistrée.</p>}
              </div>
            </section>
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <section className="border border-white/10 bg-black/40 p-5">
              <h2 className="mb-4 font-bold text-white">Pages les plus visibles</h2>
              <div className="space-y-3">
                {stats.pages.slice(0, 10).map((page, index) => (
                  <div key={page.name}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-gray-300"><strong className="mr-2 text-gray-600">{index + 1}</strong>{formatPage(page.name)}</span>
                      <span className="flex-shrink-0 font-bold text-white">{page.views} vues</span>
                    </div>
                    <div className="h-1 bg-white/5"><div className="h-full bg-[#fff500]" style={{ width: `${(page.views / maxPage) * 100}%` }} /></div>
                  </div>
                ))}
                {!stats.pages.length && <p className="py-8 text-center text-sm text-gray-600">Aucune page consultée.</p>}
              </div>
            </section>

            <section className="border border-white/10 bg-black/40 p-5">
              <h2 className="mb-4 font-bold text-white">Éléments les plus cliqués</h2>
              <div className="space-y-3">
                {stats.click_targets.slice(0, 10).map((target, index) => (
                  <div key={`${target.name}-${index}`}>
                    <div className="mb-1 flex items-center justify-between gap-3 text-xs">
                      <span className="truncate text-gray-300"><strong className="mr-2 text-gray-600">{index + 1}</strong>{formatPage(target.name)}</span>
                      <span className="flex-shrink-0 font-bold text-white">{target.clicks} clics</span>
                    </div>
                    <div className="h-1 bg-white/5"><div className="h-full bg-blue-500" style={{ width: `${(target.clicks / maxClick) * 100}%` }} /></div>
                  </div>
                ))}
                {!stats.click_targets.length && <p className="py-8 text-center text-sm text-gray-600">Aucun clic enregistré.</p>}
              </div>
            </section>
          </div>
        </>
      )}
    </div>
  );
}
