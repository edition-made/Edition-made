import { useState, useEffect } from 'react';
import { Save, Check, Copy } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { DayHours, DEFAULT_HOURS, WEEK_ORDER, dayName, groupHours } from '../../lib/storeHours';

const inputCls = 'bg-white/5 border border-white/15 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#fff500] disabled:opacity-40';

export default function StoreHoursAdmin() {
  const [hours, setHours] = useState<DayHours[]>(DEFAULT_HOURS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('store_settings').select('hours').eq('id', 1).maybeSingle().then(({ data }) => {
      if (Array.isArray(data?.hours) && data.hours.length === 7) setHours(data.hours as DayHours[]);
      setLoading(false);
    });
  }, []);

  const update = (day: number, patch: Partial<DayHours>) =>
    setHours(prev => prev.map(h => (h.day === day ? { ...h, ...patch } : h)));
  const get = (day: number) => hours.find(h => h.day === day) ?? DEFAULT_HOURS.find(h => h.day === day)!;

  const copyMondayToWeek = () => {
    const monday = get(1);
    setHours(prev => prev.map(h => (h.day >= 2 && h.day <= 6 ? { ...h, closed: monday.closed, open: monday.open, close: monday.close } : h)));
  };

  const save = async () => {
    setError('');
    const bad = hours.find(h => !h.closed && (!h.open || !h.close || h.close <= h.open));
    if (bad) { setError(`${dayName(bad.day)} : l'heure de fermeture doit être après l'heure d'ouverture.`); return; }
    setSaving(true);
    const { error: err } = await supabase.from('store_settings').upsert({ id: 1, hours, updated_at: new Date().toISOString() });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-40"><div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" /></div>;
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Horaires du magasin</h1>
        <p className="text-gray-500 text-sm">Affichés sur la page d'accueil, le pied de page, les pages Magasin et Contact.</p>
      </div>

      <div className="space-y-2">
        {WEEK_ORDER.map(day => {
          const h = get(day);
          return (
            <div key={day} className="flex flex-wrap items-center gap-3 border border-white/10 bg-black/40 px-4 py-3">
              <span className="w-24 text-white text-sm font-semibold">{dayName(day)}</span>
              <label className="flex items-center gap-2 text-xs text-gray-400 cursor-pointer">
                <input type="checkbox" checked={h.closed} onChange={e => update(day, { closed: e.target.checked })} className="accent-[#fff500]" />
                Fermé
              </label>
              <input type="time" value={h.open} disabled={h.closed} onChange={e => update(day, { open: e.target.value })} className={inputCls} style={{ colorScheme: 'dark' }} />
              <span className="text-gray-500 text-sm">à</span>
              <input type="time" value={h.close} disabled={h.closed} onChange={e => update(day, { close: e.target.value })} className={inputCls} style={{ colorScheme: 'dark' }} />
            </div>
          );
        })}
      </div>

      <button type="button" onClick={copyMondayToWeek} className="mt-3 flex items-center gap-2 text-xs text-gray-400 hover:text-white">
        <Copy size={14} /> Copier les horaires du lundi sur mardi → samedi
      </button>

      <div className="mt-6 border border-white/10 bg-white/5 p-4">
        <p className="text-[11px] font-black uppercase tracking-widest text-gray-500 mb-2">Aperçu sur le site</p>
        {groupHours(hours).map(r => (
          <p key={r.label} className="text-sm text-gray-200 flex justify-between max-w-xs"><span>{r.label}</span><span className="font-semibold">{r.value}</span></p>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mt-4">{error}</p>}
      <button onClick={save} disabled={saving} className="btn-primary mt-5 disabled:opacity-60">
        {saved ? <Check size={16} /> : <Save size={16} />}
        {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
      </button>
    </div>
  );
}
