import { useEffect, useState } from 'react';
import { supabase } from './supabase';

export type DayHours = { day: number; closed: boolean; open: string; close: string };

// Ordre d'affichage : lundi → dimanche (day suit Date.getDay() : 0 = dimanche)
export const WEEK_ORDER = [1, 2, 3, 4, 5, 6, 0];
const FULL_NAMES = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
const SHORT_NAMES = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];

export const dayName = (day: number) => FULL_NAMES[day];

export const DEFAULT_HOURS: DayHours[] = [
  ...[1, 2, 3, 4, 5, 6].map(day => ({ day, closed: false, open: '10:00', close: '18:30' })),
  { day: 0, closed: false, open: '14:00', close: '18:30' },
];

const fmtTime = (value: string) => value.replace(':', 'h');

export const dayLabel = (d: DayHours) => (d.closed ? 'Fermé' : `${fmtTime(d.open)} – ${fmtTime(d.close)}`);

export type HoursRow = { label: string; shortLabel: string; value: string; days: number[] };

// Regroupe les jours consécutifs ayant les mêmes horaires (ex : « Lun – Sam »)
export function groupHours(hours: DayHours[]): HoursRow[] {
  const byDay = new Map(hours.map(h => [h.day, h]));
  const rows: HoursRow[] = [];
  for (const day of WEEK_ORDER) {
    const current = byDay.get(day) ?? { day, closed: true, open: '', close: '' };
    const value = dayLabel(current);
    const last = rows[rows.length - 1];
    if (last && last.value === value) last.days.push(day);
    else rows.push({ label: '', shortLabel: '', value, days: [day] });
  }
  for (const row of rows) {
    const first = row.days[0];
    const end = row.days[row.days.length - 1];
    row.label = row.days.length === 1 ? FULL_NAMES[first] : `${SHORT_NAMES[first]} – ${SHORT_NAMES[end]}`;
    row.shortLabel = row.days.length === 1 ? SHORT_NAMES[first] : `${SHORT_NAMES[first]}–${SHORT_NAMES[end]}`;
  }
  return rows;
}

// « Lun–Sam : 10h00 – 18h30 » (une chaîne par ligne)
export const hoursLines = (hours: DayHours[]) => groupHours(hours).map(r => `${r.shortLabel} : ${r.value}`);

function sanitize(raw: unknown): DayHours[] | null {
  if (!Array.isArray(raw)) return null;
  const valid = raw.filter(
    (h): h is DayHours => !!h && Number.isInteger(h.day) && h.day >= 0 && h.day <= 6 && typeof h.closed === 'boolean'
      && typeof h.open === 'string' && typeof h.close === 'string',
  );
  return valid.length === 7 ? valid : null;
}

let cache: DayHours[] | null = null;
let inflight: Promise<DayHours[]> | null = null;

function loadHours(): Promise<DayHours[]> {
  if (cache) return Promise.resolve(cache);
  if (!inflight) {
    inflight = Promise.resolve(supabase.from('store_settings').select('hours').eq('id', 1).maybeSingle())
      .then(({ data }) => (cache = sanitize(data?.hours) ?? DEFAULT_HOURS))
      .catch(() => DEFAULT_HOURS)
      .finally(() => { inflight = null; });
  }
  return inflight;
}

export function useStoreHours() {
  const [hours, setHours] = useState<DayHours[]>(cache ?? DEFAULT_HOURS);
  useEffect(() => {
    let active = true;
    loadHours().then(h => { if (active) setHours(h); });
    return () => { active = false; };
  }, []);
  return { hours, rows: groupHours(hours), lines: hoursLines(hours) };
}
