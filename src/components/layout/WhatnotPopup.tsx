import { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { X, CalendarClock, ArrowRight } from 'lucide-react';
import { supabase, DbWhatnotSettings } from '../../lib/supabase';

const DISMISS_KEY = 'em_whatnot_dismissed';
const DEFAULT_DURATION_MS = 3 * 60 * 60 * 1000;
const SHOW_DELAY_MS = 2500;

function readDismissed(): string | null {
  try { return localStorage.getItem(DISMISS_KEY); } catch { return null; }
}

function formatEvent(iso: string) {
  const d = new Date(iso);
  const day = d.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }).replace(':', 'h');
  return { day, time };
}

function countdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  const d = Math.floor(s / 86400);
  const h = Math.floor((s % 86400) / 3600);
  const m = Math.floor((s % 3600) / 60);
  if (d > 0) return `${d}j ${h}h ${m}min`;
  if (h > 0) return `${h}h ${m}min`;
  return `${m}min ${s % 60}s`;
}

export default function WhatnotPopup() {
  const { pathname } = useLocation();
  const [settings, setSettings] = useState<DbWhatnotSettings | null>(null);
  const [visible, setVisible] = useState(false);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    supabase.from('whatnot_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      if (data) setSettings(data as DbWhatnotSettings);
    });
  }, []);

  const start = settings?.event_start ? new Date(settings.event_start).getTime() : null;
  const end = settings?.event_end
    ? new Date(settings.event_end).getTime()
    : start !== null ? start + DEFAULT_DURATION_MS : null;
  const expired = end !== null && now > end;
  const isLive = start !== null && now >= start && !expired;
  const hidden = pathname.startsWith('/admin') || pathname.startsWith('/checkout');
  // Se ré-affiche à chaque modification des réglages dans l'admin
  const dismissToken = settings?.updated_at ?? '';
  const eligible = !!settings && settings.enabled && /^https?:\/\//i.test(settings.url) && !expired
    && readDismissed() !== dismissToken && !hidden;

  useEffect(() => {
    if (!eligible) { setVisible(false); return; }
    const t = setTimeout(() => setVisible(true), SHOW_DELAY_MS);
    return () => clearTimeout(t);
  }, [eligible]);

  useEffect(() => {
    if (!visible) return;
    const i = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(i);
  }, [visible]);

  const close = () => {
    setVisible(false);
    try { localStorage.setItem(DISMISS_KEY, dismissToken); } catch { /* ignoré */ }
  };

  if (!visible || !settings || !eligible) return null;

  const when = settings.event_start ? formatEvent(settings.event_start) : null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm" onClick={close} role="dialog" aria-modal="true" aria-label={settings.title}>
      <div className="relative w-full max-w-md bg-white overflow-hidden shadow-2xl animate-[fadeIn_.25s_ease-out]" onClick={e => e.stopPropagation()}>
        <button onClick={close} aria-label="Fermer" className="absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white z-10">
          <X size={18} />
        </button>

        <div className="bg-black px-6 pt-8 pb-6 flex flex-col items-center">
          <img src="/whatnot-logo.png" alt="Whatnot" className="h-14 w-auto rounded-lg" />
          {isLive ? (
            <span className="mt-4 inline-flex items-center gap-2 bg-red-600 text-white text-xs font-black px-3 py-1 uppercase tracking-wide">
              <span className="w-2 h-2 rounded-full bg-white animate-pulse" /> En direct maintenant
            </span>
          ) : (
            <span className="mt-4 bg-[#fff500] text-black text-xs font-black px-3 py-1 uppercase tracking-wide">Prix cassés · Live</span>
          )}
        </div>

        <div className="px-6 py-6 text-center">
          <h2 className="font-display font-bold text-xl text-black leading-tight mb-2">{settings.title}</h2>
          {settings.description && <p className="text-gray-600 text-sm mb-4">{settings.description}</p>}

          {when && !isLive && (
            <div className="border border-black/10 bg-gray-50 px-4 py-3 mb-5">
              <p className="flex items-center justify-center gap-2 text-sm font-bold text-black capitalize">
                <CalendarClock size={16} /> {when.day} à {when.time}
              </p>
              {start !== null && start > now && (
                <p className="text-xs text-gray-500 mt-1">Début dans <span className="font-bold text-black">{countdown(start - now)}</span></p>
              )}
            </div>
          )}

          <a href={settings.url} target="_blank" rel="noopener noreferrer" onClick={close} className="btn-primary w-full justify-center">
            {isLive ? 'Rejoindre le live' : 'Voir sur Whatnot'} <ArrowRight size={16} />
          </a>
          <button onClick={close} className="mt-3 text-xs text-gray-400 hover:text-gray-600">Non merci</button>
        </div>
      </div>
    </div>
  );
}
