import { useState, useEffect } from 'react';
import { Save, ExternalLink, Check } from 'lucide-react';
import { supabase, DbWhatnotSettings } from '../../lib/supabase';

const inputCls = 'w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#fff500]';

// ISO (UTC) -> valeur "datetime-local" dans le fuseau du navigateur
function toLocalInput(iso?: string | null): string {
  if (!iso) return '';
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function WhatnotAdmin() {
  const [enabled, setEnabled] = useState(false);
  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [start, setStart] = useState('');
  const [end, setEnd] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    supabase.from('whatnot_settings').select('*').eq('id', 1).maybeSingle().then(({ data }) => {
      const s = data as DbWhatnotSettings | null;
      if (s) {
        setEnabled(s.enabled);
        setUrl(s.url);
        setTitle(s.title);
        setDescription(s.description);
        setStart(toLocalInput(s.event_start));
        setEnd(toLocalInput(s.event_end));
      }
      setLoading(false);
    });
  }, []);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (enabled && !/^https?:\/\//i.test(url.trim())) {
      setError('Le lien doit commencer par https:// pour activer le pop-up.');
      return;
    }
    if (start && end && new Date(end) <= new Date(start)) {
      setError("La date de fin doit être après la date de début.");
      return;
    }
    setSaving(true);
    const { error: err } = await supabase.from('whatnot_settings').upsert({
      id: 1,
      enabled,
      url: url.trim(),
      title: title.trim(),
      description: description.trim(),
      event_start: start ? new Date(start).toISOString() : null,
      event_end: end ? new Date(end).toISOString() : null,
      updated_at: new Date().toISOString(),
    });
    setSaving(false);
    if (err) { setError(err.message); return; }
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-40">
        <div className="w-8 h-8 border-2 border-[#fff500] border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Whatnot</h1>
        <p className="text-gray-500 text-sm">Pop-up affiché sur le site pour rediriger les clients vers votre live Whatnot.</p>
      </div>

      <form onSubmit={save} className="space-y-5">
        <label className="flex items-center justify-between gap-4 p-4 border border-white/10 bg-black/40 cursor-pointer">
          <div>
            <p className="text-white font-semibold text-sm">Activer le pop-up</p>
            <p className="text-gray-500 text-xs">{enabled ? 'Visible par les visiteurs du site' : 'Masqué sur le site'}</p>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={enabled}
            onClick={() => setEnabled(v => !v)}
            className={`relative w-12 h-6 transition-colors ${enabled ? 'bg-[#fff500]' : 'bg-white/15'}`}
          >
            <span className={`absolute top-0.5 w-5 h-5 transition-all ${enabled ? 'left-6 bg-black' : 'left-0.5 bg-gray-400'}`} />
          </button>
        </label>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">Lien Whatnot (URL)</label>
          <input type="url" value={url} onChange={e => setUrl(e.target.value)} placeholder="https://www.whatnot.com/..." className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">Titre du pop-up</label>
          <input type="text" value={title} onChange={e => setTitle(e.target.value)} maxLength={90} className={inputCls} />
        </div>

        <div>
          <label className="block text-xs font-semibold text-gray-400 mb-1">Mini description</label>
          <textarea value={description} onChange={e => setDescription(e.target.value)} maxLength={220} rows={3}
            placeholder="Ex : Retrouvez nos meubles à prix cassés en live, enchères dès 1 € !" className={inputCls} />
          <p className="text-right text-[11px] text-gray-600">{description.length}/220</p>
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Début du live (date et heure)</label>
            <input type="datetime-local" value={start} onChange={e => setStart(e.target.value)} className={inputCls} style={{ colorScheme: 'dark' }} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Fin (optionnel)</label>
            <input type="datetime-local" value={end} onChange={e => setEnd(e.target.value)} className={inputCls} style={{ colorScheme: 'dark' }} />
          </div>
        </div>
        <p className="text-xs text-gray-600 -mt-2">
          Le pop-up disparaît automatiquement après la date de fin (ou 3 h après le début si aucune fin n'est indiquée). Sans date, il reste affiché tant qu'il est activé.
        </p>

        {error && <p className="text-red-400 text-sm">{error}</p>}

        <div className="flex items-center gap-3">
          <button type="submit" disabled={saving} className="btn-primary disabled:opacity-60">
            {saved ? <Check size={16} /> : <Save size={16} />}
            {saving ? 'Enregistrement…' : saved ? 'Enregistré' : 'Enregistrer'}
          </button>
          {url && (
            <a href={url} target="_blank" rel="noopener noreferrer" className="text-gray-400 hover:text-white text-xs inline-flex items-center gap-1">
              <ExternalLink size={14} /> Tester le lien
            </a>
          )}
        </div>
      </form>
    </div>
  );
}
