import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Activity, AlertCircle, Bot, Eye, Globe2, Link as LinkIcon,
  Clock, Loader2, MousePointerClick, Search, Share2, Users,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

type Period = 1 | 7 | 30 | 90;
type Granularity = 'day' | 'hour';
type CountRow = { name: string; views: number; visitors?: number; clicks?: number };
type SourceKey = 'google' | 'ai' | 'social' | 'direct' | 'other';
type SourceCounts = Partial<Record<SourceKey, number>>;
type DailyRow = SourceCounts & { date: string; views: number; clicks: number };
type HourlyRow = SourceCounts & { slot: string; views: number; clicks: number };
type SourceDetailRow = { source: string; name: string; views: number; visitors: number };
type BucketRow = { views: number; clicks: number };
type VisibilityStats = {
  page_views: number;
  clicks: number;
  visitors: number;
  sessions: number;
  sources: CountRow[];
  pages: CountRow[];
  click_targets: { name: string; clicks: number }[];
  daily: DailyRow[];
  hourly: HourlyRow[];
  hours: (BucketRow & { hour: number })[];
  weekdays: (BucketRow & { weekday: number })[];
  source_details: SourceDetailRow[];
};

const EMPTY_STATS: VisibilityStats = {
  page_views: 0, clicks: 0, visitors: 0, sessions: 0,
  sources: [], pages: [], click_targets: [], daily: [],
  hourly: [], hours: [], weekdays: [], source_details: [],
};

const SOURCE_CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; hex: string }> = {
  google: { label: 'Google & recherche', icon: <Search size={16} />, color: 'bg-blue-500', hex: '#3b82f6' },
  ai: { label: 'Intelligence artificielle', icon: <Bot size={16} />, color: 'bg-purple-500', hex: '#a855f7' },
  social: { label: 'Réseaux sociaux', icon: <Share2 size={16} />, color: 'bg-pink-500', hex: '#ec4899' },
  direct: { label: 'Accès direct', icon: <LinkIcon size={16} />, color: 'bg-[#fff500]', hex: '#fff500' },
  other: { label: 'Autres sites', icon: <Globe2 size={16} />, color: 'bg-gray-500', hex: '#9ca3af' },
};

function formatPage(path: string) {
  if (path === '/') return 'Accueil';
  return decodeURIComponent(path).replace(/^\//, '').replace(/-/g, ' ').replace(/\//g, ' › ');
}


const SOURCE_KEYS: SourceKey[] = ['google', 'ai', 'social', 'direct', 'other'];
const SERIES: { key: 'views' | SourceKey; label: string; hex: string }[] = [
  { key: 'views', label: 'Total', hex: '#ffffff' },
  ...SOURCE_KEYS.map(key => ({ key, label: SOURCE_CONFIG[key].label, hex: SOURCE_CONFIG[key].hex })),
];
const WEEKDAYS = ['Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi', 'Dimanche'];

type ChartPoint = { label: string; short: string; values: Record<'views' | SourceKey, number>; clicks: number };

// Date / heure de Paris au format ISO, alignée sur la base (Europe/Paris).
function parisSlot(date: Date): { day: string; hour: string } {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: 'Europe/Paris', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', hourCycle: 'h23',
    }).formatToParts(date).map(part => [part.type, part.value]),
  );
  return { day: `${parts.year}-${parts.month}-${parts.day}`, hour: parts.hour };
}

function toValues(row?: SourceCounts & { views?: number }): Record<'views' | SourceKey, number> {
  return {
    views: row?.views ?? 0, google: row?.google ?? 0, ai: row?.ai ?? 0,
    social: row?.social ?? 0, direct: row?.direct ?? 0, other: row?.other ?? 0,
  };
}

// Série complète sans trou : les jours / heures sans visite valent 0.
function buildTimeline(stats: VisibilityStats, period: Period, granularity: Granularity): ChartPoint[] {
  const now = Date.now();
  if (granularity === 'hour') {
    const bySlot = new Map(stats.hourly.map(row => [row.slot, row]));
    return Array.from({ length: period * 24 }, (_, index) => {
      const { day, hour } = parisSlot(new Date(now - (period * 24 - 1 - index) * 3600 * 1000));
      const row = bySlot.get(`${day}T${hour}`);
      const date = new Date(`${day}T12:00:00`);
      return {
        label: `${date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: '2-digit' })} · ${hour}h`,
        short: hour === '00' || index === 0
          ? `${date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' })} ${hour}h`
          : `${hour}h`,
        values: toValues(row), clicks: row?.clicks ?? 0,
      };
    });
  }
  const byDay = new Map(stats.daily.map(row => [row.date, row]));
  return Array.from({ length: period }, (_, index) => {
    const { day } = parisSlot(new Date(now - (period - 1 - index) * 24 * 3600 * 1000));
    const row = byDay.get(day);
    const date = new Date(`${day}T12:00:00`);
    return {
      label: date.toLocaleDateString('fr-FR', { weekday: 'long', day: '2-digit', month: 'long' }),
      short: date.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
      values: toValues(row), clicks: row?.clicks ?? 0,
    };
  });
}

function niceMax(value: number) {
  if (value <= 4) return 4;
  const magnitude = 10 ** Math.floor(Math.log10(value));
  const step = [1, 2, 5, 10].find(factor => value <= factor * magnitude)! * magnitude;
  return Math.ceil(value / (step / 4)) * (step / 4);
}

const CHART = { width: 640, height: 240, left: 36, right: 12, top: 12, bottom: 26 };

function EvolutionChart({ points, hidden }: { points: ChartPoint[]; hidden: Set<string> }) {
  const [hover, setHover] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const visible = SERIES.filter(serie => !hidden.has(serie.key));
  const innerWidth = CHART.width - CHART.left - CHART.right;
  const innerHeight = CHART.height - CHART.top - CHART.bottom;
  const max = niceMax(Math.max(1, ...points.flatMap(point => visible.map(serie => point.values[serie.key]))));
  const x = (index: number) => CHART.left + (points.length === 1 ? innerWidth / 2 : (index / (points.length - 1)) * innerWidth);
  const y = (value: number) => CHART.top + innerHeight - (value / max) * innerHeight;
  const tickEvery = Math.max(1, Math.ceil(points.length / 7));

  const handleMove = (clientX: number) => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect || !points.length) return;
    const position = ((clientX - rect.left) / rect.width) * CHART.width;
    const index = points.length === 1 ? 0 : Math.round(((position - CHART.left) / innerWidth) * (points.length - 1));
    setHover(Math.min(points.length - 1, Math.max(0, index)));
  };

  const hovered = hover !== null ? points[hover] : null;
  const hoverLeft = hover !== null ? (x(hover) / CHART.width) * 100 : 0;

  return (
    <div className="relative" onMouseLeave={() => setHover(null)}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${CHART.width} ${CHART.height}`}
        className="h-auto w-full touch-pan-y select-none"
        role="img"
        aria-label="Évolution des visites par provenance"
        onMouseMove={event => handleMove(event.clientX)}
        onTouchMove={event => handleMove(event.touches[0].clientX)}
      >
        {[0, 1, 2, 3, 4].map(tick => {
          const value = (max / 4) * tick;
          return (
            <g key={tick}>
              <line x1={CHART.left} x2={CHART.width - CHART.right} y1={y(value)} y2={y(value)} stroke="rgba(255,255,255,0.08)" />
              <text x={CHART.left - 6} y={y(value) + 3} textAnchor="end" fontSize="9" fill="#6b7280">{Math.round(value)}</text>
            </g>
          );
        })}
        {points.map((point, index) => index % tickEvery === 0 && (
          <text key={index} x={x(index)} y={CHART.height - 8} textAnchor="middle" fontSize="9" fill="#6b7280">{point.short}</text>
        ))}
        {hover !== null && <line x1={x(hover)} x2={x(hover)} y1={CHART.top} y2={CHART.top + innerHeight} stroke="rgba(255,255,255,0.3)" strokeDasharray="3 3" />}
        {visible.map(serie => (
          <g key={serie.key}>
            <polyline
              fill="none" stroke={serie.hex} strokeWidth={serie.key === 'views' ? 2.5 : 1.75}
              strokeLinejoin="round" strokeLinecap="round"
              points={points.map((point, index) => `${x(index)},${y(point.values[serie.key])}`).join(' ')}
            />
            {(points.length <= 31 || hover !== null) && points.map((point, index) => (points.length <= 31 || index === hover) && (
              <circle key={index} cx={x(index)} cy={y(point.values[serie.key])} r={index === hover ? 4 : 2.5} fill={serie.hex} />
            ))}
          </g>
        ))}
      </svg>
      {hovered && (
        <div
          className="pointer-events-none absolute top-2 z-10 min-w-[170px] border border-white/10 bg-black/95 p-2.5 text-[11px] shadow-xl"
          style={{ left: `${hoverLeft}%`, transform: hoverLeft > 60 ? 'translateX(calc(-100% - 10px))' : 'translateX(10px)' }}
        >
          <p className="mb-1.5 font-bold capitalize text-white">{hovered.label}</p>
          {visible.map(serie => (
            <p key={serie.key} className="flex items-center justify-between gap-4 text-gray-300">
              <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full" style={{ background: serie.hex }} />{serie.label}</span>
              <strong className="text-white">{hovered.values[serie.key]}</strong>
            </p>
          ))}
          <p className="mt-1.5 border-t border-white/10 pt-1.5 text-gray-500">{hovered.clicks} clics</p>
        </div>
      )}
    </div>
  );
}

function BucketBars({ items, color }: { items: { label: string; title: string; views: number; clicks: number }[]; color: string }) {
  const max = Math.max(1, ...items.map(item => item.views));
  const peak = items.reduce((best, item) => (item.views > best.views ? item : best), items[0]);
  return (
    <>
      <div className="flex h-40 items-end gap-1 border-b border-white/10 pt-4">
        {items.map(item => (
          <div key={item.title} className="group relative flex h-full min-w-0 flex-1 items-end">
            <div
              className={`w-full transition-opacity group-hover:opacity-75 ${item.views === peak.views && item.views > 0 ? 'ring-1 ring-white' : ''}`}
              style={{ height: `${item.views ? Math.max(3, (item.views / max) * 100) : 0}%`, background: color }}
            />
            <div className="pointer-events-none absolute bottom-full left-1/2 z-10 mb-2 hidden -translate-x-1/2 whitespace-nowrap bg-white px-2 py-1 text-[10px] font-bold text-black group-hover:block">
              {item.title} · {item.views} vues · {item.clicks} clics
            </div>
          </div>
        ))}
      </div>
      <div className="mt-1 flex gap-1">
        {items.map(item => <span key={item.title} className="min-w-0 flex-1 truncate text-center text-[9px] text-gray-600">{item.label}</span>)}
      </div>
      {peak.views > 0 && <p className="mt-3 text-xs text-gray-500">Pic d'affluence : <strong className="text-white">{peak.title}</strong> ({peak.views} vues)</p>}
    </>
  );
}

export default function VisibilityAdmin() {
  const [period, setPeriod] = useState<Period>(30);
  const [granularity, setGranularity] = useState<Granularity>('day');
  const [hidden, setHidden] = useState<Set<string>>(new Set());
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

  // 24 h : toujours heure par heure. Jusqu'à 7 jours : au choix. Au-delà : par jour.
  const effectiveGranularity: Granularity = period === 1 ? 'hour' : period === 7 ? granularity : 'day';
  const timeline = useMemo(
    () => buildTimeline(stats, period, effectiveGranularity),
    [stats, period, effectiveGranularity],
  );
  const hourBuckets = useMemo(() => Array.from({ length: 24 }, (_, hour) => {
    const row = stats.hours.find(item => item.hour === hour);
    return { label: hour % 3 === 0 ? `${hour}h` : '', title: `${String(hour).padStart(2, '0')}h–${String(hour + 1).padStart(2, '0')}h`, views: row?.views ?? 0, clicks: row?.clicks ?? 0 };
  }), [stats.hours]);
  const weekdayBuckets = useMemo(() => WEEKDAYS.map((name, index) => {
    const row = stats.weekdays.find(item => item.weekday === index + 1);
    return { label: name.slice(0, 3), title: name, views: row?.views ?? 0, clicks: row?.clicks ?? 0 };
  }), [stats.weekdays]);
  const toggleSeries = (key: string) => setHidden(current => {
    const next = new Set(current);
    if (next.has(key)) next.delete(key); else next.add(key);
    return next;
  });
  const maxPage = useMemo(() => Math.max(1, ...stats.pages.map(page => page.views)), [stats.pages]);
  const maxClick = useMemo(() => Math.max(1, ...stats.click_targets.map(target => target.clicks)), [stats.click_targets]);
  const clickRate = stats.page_views > 0 ? Math.round((stats.clicks / stats.page_views) * 100) : 0;

  const cards = [
    { label: 'Pages vues', value: stats.page_views, icon: <Eye size={20} />, hint: period === 1 ? 'Dernières 24 h' : `Sur ${period} jours` },
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
          {([1, 7, 30, 90] as Period[]).map(value => (
            <button
              key={value}
              type="button"
              onClick={() => setPeriod(value)}
              className={`px-3 py-2 text-xs font-bold transition-colors ${period === value ? 'bg-[#fff500] text-black' : 'text-gray-400 hover:text-white'}`}
            >
              {value === 1 ? '24 h' : `${value} jours`}
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
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h2 className="font-bold text-white">Évolution des visites</h2>
                {period === 7 && (
                  <div className="flex bg-white/5 p-0.5 text-[11px] font-bold">
                    {([['day', 'Par jour'], ['hour', 'Par heure']] as [Granularity, string][]).map(([value, label]) => (
                      <button
                        key={value} type="button" onClick={() => setGranularity(value)}
                        className={`px-2.5 py-1 transition-colors ${granularity === value ? 'bg-[#fff500] text-black' : 'text-gray-400 hover:text-white'}`}
                      >{label}</button>
                    ))}
                  </div>
                )}
              </div>
              <div className="mb-4 flex flex-wrap gap-2">
                {SERIES.map(serie => {
                  const off = hidden.has(serie.key);
                  return (
                    <button
                      key={serie.key} type="button" onClick={() => toggleSeries(serie.key)} aria-pressed={!off}
                      className={`flex items-center gap-1.5 border px-2 py-1 text-[11px] font-semibold transition-opacity ${off ? 'border-white/10 text-gray-600 opacity-60' : 'border-white/20 text-gray-200'}`}
                    >
                      <i className="inline-block h-2 w-2 rounded-full" style={{ background: off ? '#4b5563' : serie.hex }} />
                      {serie.label}
                    </button>
                  );
                })}
              </div>
              {stats.page_views > 0
                ? <EvolutionChart points={timeline} hidden={hidden} />
                : <p className="py-16 text-center text-sm text-gray-600">Les premières visites apparaîtront ici.</p>}
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
              {stats.source_details.some(detail => detail.source !== 'direct') && (
                <div className="mt-6 border-t border-white/10 pt-4">
                  <h3 className="mb-3 text-xs font-bold uppercase tracking-wider text-gray-500">Détail des sources</h3>
                  <ul className="space-y-1.5">
                    {stats.source_details.filter(detail => detail.source !== 'direct').slice(0, 10).map(detail => (
                      <li key={`${detail.source}-${detail.name}`} className="flex items-center justify-between gap-3 text-xs">
                        <span className="flex min-w-0 items-center gap-2 text-gray-300">
                          <i className="inline-block h-2 w-2 flex-shrink-0 rounded-full" style={{ background: (SOURCE_CONFIG[detail.source] || SOURCE_CONFIG.other).hex }} />
                          <span className="truncate">{detail.name}</span>
                        </span>
                        <span className="flex-shrink-0 font-bold text-white">{detail.views} <span className="font-normal text-gray-600">vues</span></span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </section>
          </div>

          <div className="mb-6 grid gap-6 lg:grid-cols-5">
            <section className="border border-white/10 bg-black/40 p-5 lg:col-span-3">
              <h2 className="mb-4 flex items-center gap-2 font-bold text-white"><Clock size={16} className="text-gray-400" />Horaires de visite <span className="text-xs font-normal text-gray-600">(heure de Paris)</span></h2>
              {stats.page_views > 0 ? <BucketBars items={hourBuckets} color="#fff500" /> : <p className="py-12 text-center text-sm text-gray-600">Aucune donnée pour le moment.</p>}
            </section>
            <section className="border border-white/10 bg-black/40 p-5 lg:col-span-2">
              <h2 className="mb-4 font-bold text-white">Jours de la semaine</h2>
              {stats.page_views > 0 ? <BucketBars items={weekdayBuckets} color="#3b82f6" /> : <p className="py-12 text-center text-sm text-gray-600">Aucune donnée pour le moment.</p>}
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
