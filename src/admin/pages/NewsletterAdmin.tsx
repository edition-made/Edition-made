import { useState, useEffect, useMemo, useCallback } from 'react';
import { Mail, Users, Send, Tag, Download, Trash2, Eye, Loader, CheckCircle2 } from 'lucide-react';

type Subscriber = {
  id: string; email: string; first_name: string; last_name: string; phone: string;
  status: 'pending' | 'confirmed' | 'unsubscribed'; promo_code: string | null;
  source: string; created_at: string; confirmed_at: string | null;
};
type Campaign = { id: string; subject: string; recipients_total: number; sent_count: number; created_at: string };

const statusLabel: Record<Subscriber['status'], { label: string; cls: string }> = {
  confirmed: { label: 'Confirmé', cls: 'bg-green-500/20 text-green-300 border border-green-500/30' },
  pending: { label: 'En attente', cls: 'bg-[#fff500]/20 text-[#fff500] border border-[#fff500]/30' },
  unsubscribed: { label: 'Désinscrit', cls: 'bg-gray-500/20 text-gray-400 border border-gray-500/30' },
};

const TEMPLATE = `<h1 style="font-size:24px;margin:0 0 12px;">Bonjour {{first_name}},</h1>
<p>Cette semaine chez Edition Made : de nouveaux arrivages à prix cassés !</p>
<p style="text-align:center;margin:28px 0;">
  <a href="https://editionmade.com/promotions" style="background:#fff500;color:#000;font-weight:bold;text-decoration:none;padding:14px 28px;display:inline-block;text-transform:uppercase;font-size:13px;">Voir les offres</a>
</p>
<p style="font-size:12px;color:#888;"><a href="{{unsubscribe_url}}" style="color:#888;">Se désinscrire</a></p>`;

const inputCls = 'w-full bg-white/5 border border-white/15 text-white text-sm px-3 py-2 focus:outline-none focus:border-[#fff500]';

async function api<T>(payload: Record<string, unknown>): Promise<T> {
  const res = await fetch('/api/newsletter-admin', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', 'x-admin-password': import.meta.env.VITE_ADMIN_PASSWORD || '' },
    body: JSON.stringify(payload),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Erreur ${res.status}`);
  return data as T;
}

type Tab = 'subs' | 'compose' | 'history' | 'promo';
type PromoSettings = { promo_enabled: boolean; promo_percent: number; promo_mode: 'unique' | 'fixed'; fixed_code: string };

export default function NewsletterAdmin() {
  const [tab, setTab] = useState<Tab>('subs');
  const [subs, setSubs] = useState<Subscriber[]>([]);
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [filter, setFilter] = useState<'' | Subscriber['status']>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const [subject, setSubject] = useState('');
  const [html, setHtml] = useState(TEMPLATE);
  const [testTo, setTestTo] = useState('');
  const [busy, setBusy] = useState('');
  const [info, setInfo] = useState('');
  const [promo, setPromo] = useState<PromoSettings>({ promo_enabled: true, promo_percent: 5, promo_mode: 'unique', fixed_code: '' });
  const [percentInput, setPercentInput] = useState('5');

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const data = await api<{ subscribers: Subscriber[]; campaigns: Campaign[] }>({ action: 'list' });
      setSubs(data.subscribers);
      setCampaigns(data.campaigns);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de chargement');
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => { load(); }, [load]);
  useEffect(() => {
    api<{ settings: PromoSettings }>({ action: 'get-settings' })
      .then(({ settings }) => { setPromo(settings); setPercentInput(String(settings.promo_percent)); })
      .catch(() => { /* valeurs par défaut */ });
  }, []);

  const savePromo = async () => {
    setError(''); setInfo(''); setBusy('promo');
    try {
      const r = await api<{ settings: PromoSettings }>({ action: 'save-settings', ...promo, promo_percent: Number(percentInput.replace(',', '.')) });
      setPromo(r.settings); setPercentInput(String(r.settings.promo_percent));
      setInfo('Réglages du code promo enregistrés.');
    } catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
    finally { setBusy(''); }
  };

  const confirmed = useMemo(() => subs.filter(s => s.status === 'confirmed').length, [subs]);
  const visible = filter ? subs.filter(s => s.status === filter) : subs;

  const exportCsv = () => {
    const rows = [['email', 'prenom', 'nom', 'telephone', 'statut', 'code_promo', 'inscrit_le']]
      .concat(visible.map(s => [s.email, s.first_name, s.last_name, s.phone, s.status, s.promo_code || '', s.created_at]));
    const csv = rows.map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(';')).join('\n');
    const url = URL.createObjectURL(new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' }));
    const a = document.createElement('a');
    a.href = url; a.download = 'abonnes-newsletter.csv'; a.click();
    URL.revokeObjectURL(url);
  };

  const remove = async (s: Subscriber) => {
    if (!confirm(`Supprimer définitivement ${s.email} ?`)) return;
    try { await api({ action: 'delete', id: s.id }); setSubs(prev => prev.filter(x => x.id !== s.id)); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
  };

  const sendTest = async () => {
    setError(''); setInfo(''); setBusy('test');
    try { await api({ action: 'send-test', to: testTo, subject, html }); setInfo(`Test envoyé à ${testTo}.`); }
    catch (err) { setError(err instanceof Error ? err.message : 'Erreur'); }
    finally { setBusy(''); }
  };

  const sendCampaign = async () => {
    if (!subject.trim() || !html.trim()) { setError('Sujet et contenu HTML requis.'); return; }
    if (!confirm(`Envoyer « ${subject} » à ${confirmed} abonné(s) confirmé(s) ? Cette action est irréversible.`)) return;
    setError(''); setInfo(''); setBusy('send');
    const campaignId = crypto.randomUUID();
    let offset = 0;
    try {
      for (;;) {
        const r = await api<{ sent: number; next: number; total: number; done: boolean }>({ action: 'send-campaign', campaignId, subject, html, offset });
        offset = r.next;
        setInfo(`Envoi en cours… ${r.next}/${r.total}`);
        if (r.done || r.sent === 0) break;
      }
      setInfo(`Newsletter envoyée à ${offset} abonné(s).`);
      load();
    } catch (err) {
      setError(`${err instanceof Error ? err.message : 'Erreur'} (${offset} envoyés avant l'interruption)`);
    } finally { setBusy(''); }
  };

  const previewDoc = html.split('{{first_name}}').join('Prénom').split('{{unsubscribe_url}}').join('#');
  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: 'subs', label: 'Abonnés', icon: <Users size={14} /> },
    { id: 'compose', label: 'Écrire une newsletter', icon: <Mail size={14} /> },
    { id: 'history', label: 'Historique', icon: <Send size={14} /> },
    { id: 'promo', label: 'Code promo', icon: <Tag size={14} /> },
  ];

  return (
    <div className="p-6 max-w-5xl">
      <div className="mb-6">
        <h1 className="font-display font-bold text-2xl text-white">Newsletter</h1>
        <p className="text-gray-500 text-sm">
          {confirmed} abonné{confirmed !== 1 ? 's' : ''} confirmé{confirmed !== 1 ? 's' : ''} · {subs.length} inscription{subs.length !== 1 ? 's' : ''} au total
        </p>
      </div>

      <div className="flex gap-1 mb-6 border-b border-white/10">
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)}
            className={`flex items-center gap-2 px-4 py-2 text-xs font-semibold ${tab === t.id ? 'bg-[#fff500] text-black' : 'text-gray-400 hover:text-white'}`}>
            {t.icon}{t.label}
          </button>
        ))}
      </div>

      {error && <p className="text-red-400 text-sm mb-4">{error}</p>}
      {info && <p className="text-green-400 text-sm mb-4 flex items-center gap-2"><CheckCircle2 size={14} />{info}</p>}

      {tab === 'subs' && (loading ? (
        <div className="flex justify-center h-32 items-center"><Loader className="animate-spin text-[#fff500]" /></div>
      ) : (
        <>
          <div className="flex items-center justify-between mb-3 gap-3">
            <select value={filter} onChange={e => setFilter(e.target.value as typeof filter)} className="bg-white/5 border border-white/15 text-gray-300 text-sm px-3 py-2">
              <option value="">Tous</option>
              <option value="confirmed">Confirmés</option>
              <option value="pending">En attente</option>
              <option value="unsubscribed">Désinscrits</option>
            </select>
            <button onClick={exportCsv} className="flex items-center gap-2 text-xs text-gray-300 hover:text-white border border-white/15 px-3 py-2">
              <Download size={14} /> Exporter CSV
            </button>
          </div>
          <div className="overflow-x-auto border border-white/10">
            <table className="w-full text-sm text-left">
              <thead className="bg-white/5 text-gray-400 text-xs uppercase">
                <tr><th className="p-3">Prénom</th><th className="p-3">Nom</th><th className="p-3">E-mail</th><th className="p-3">Téléphone</th><th className="p-3">Statut</th><th className="p-3">Code promo</th><th className="p-3">Inscrit le</th><th /></tr>
              </thead>
              <tbody>
                {visible.map(s => (
                  <tr key={s.id} className="border-t border-white/10 text-gray-300">
                    <td className="p-3">{s.first_name}</td>
                    <td className="p-3">{s.last_name || '—'}</td>
                    <td className="p-3">{s.email}</td>
                    <td className="p-3">{s.phone || '—'}</td>
                    <td className="p-3"><span className={`text-[11px] px-2 py-0.5 ${statusLabel[s.status].cls}`}>{statusLabel[s.status].label}</span></td>
                    <td className="p-3 font-mono text-xs">{s.promo_code || '—'}</td>
                    <td className="p-3 whitespace-nowrap">{new Date(s.created_at).toLocaleDateString('fr-FR')}</td>
                    <td className="p-3"><button onClick={() => remove(s)} aria-label="Supprimer" className="text-gray-500 hover:text-red-400"><Trash2 size={14} /></button></td>
                  </tr>
                ))}
                {visible.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-gray-500">Aucun abonné</td></tr>}
              </tbody>
            </table>
          </div>
        </>
      ))}

      {tab === 'compose' && (
        <div className="grid lg:grid-cols-2 gap-6">
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Objet de l'e-mail</label>
              <input value={subject} onChange={e => setSubject(e.target.value)} className={inputCls} placeholder="Ex : Nouveaux arrivages à prix cassés" />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Contenu HTML</label>
              <textarea value={html} onChange={e => setHtml(e.target.value)} rows={16} className={`${inputCls} font-mono text-xs`} spellCheck={false} />
              <p className="text-[11px] text-gray-600 mt-1">
                Variables : <code>{'{{first_name}}'}</code> (prénom) et <code>{'{{unsubscribe_url}}'}</code> (lien de désinscription, ajouté automatiquement s'il manque).
              </p>
            </div>
            <div className="flex gap-2">
              <input value={testTo} onChange={e => setTestTo(e.target.value)} placeholder="Votre e-mail pour un test" className={inputCls} />
              <button onClick={sendTest} disabled={!testTo || !subject || busy !== ''} className="px-4 text-xs font-bold border border-white/20 text-white disabled:opacity-40 whitespace-nowrap">
                {busy === 'test' ? '…' : 'Envoyer un test'}
              </button>
            </div>
            <button onClick={sendCampaign} disabled={busy !== '' || confirmed === 0} className="btn-primary disabled:opacity-50">
              <Send size={16} /> {busy === 'send' ? 'Envoi en cours…' : `Envoyer à ${confirmed} abonné${confirmed !== 1 ? 's' : ''}`}
            </button>
          </div>
          <div>
            <p className="flex items-center gap-2 text-xs font-semibold text-gray-400 mb-1"><Eye size={14} /> Aperçu</p>
            <iframe title="Aperçu" sandbox="" srcDoc={`<body style="font-family:Arial,sans-serif;padding:16px;">${previewDoc}</body>`} className="w-full h-[480px] bg-white border border-white/10" />
          </div>
        </div>
      )}

      {tab === 'promo' && (
        <div className="max-w-xl space-y-5">
          <label className="flex items-center justify-between gap-4 p-4 border border-white/10 bg-black/40">
            <div>
              <p className="text-white font-semibold text-sm">Offre de bienvenue active</p>
              <p className="text-gray-500 text-xs">Si désactivée, aucun code n'est envoyé ni accepté au paiement.</p>
            </div>
            <input type="checkbox" checked={promo.promo_enabled} onChange={e => setPromo({ ...promo, promo_enabled: e.target.checked })} className="w-5 h-5 accent-[#fff500]" />
          </label>

          <div>
            <label className="block text-xs font-semibold text-gray-400 mb-1">Remise (%) sur le premier achat</label>
            <input value={percentInput} onChange={e => setPercentInput(e.target.value)} inputMode="decimal" className={inputCls} />
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-400 mb-2">Type de code</p>
            <div className="grid sm:grid-cols-2 gap-3">
              {([['unique', 'Code unique par inscrit', 'Généré automatiquement (ex : BIENVENUE5-K7M2PQ), utilisable une seule fois.'],
                 ['fixed', 'Code fixe pour tous', 'Un seul code que vous choisissez, utilisable une fois par adresse e-mail.']] as const).map(([value, title, desc]) => (
                <button key={value} type="button" onClick={() => setPromo({ ...promo, promo_mode: value })}
                  className={`text-left p-3 border ${promo.promo_mode === value ? 'border-[#fff500] bg-[#fff500]/5' : 'border-white/10 bg-black/40'}`}>
                  <p className="text-white text-sm font-semibold">{title}</p>
                  <p className="text-gray-500 text-xs mt-1">{desc}</p>
                </button>
              ))}
            </div>
          </div>

          {promo.promo_mode === 'fixed' && (
            <div>
              <label className="block text-xs font-semibold text-gray-400 mb-1">Code fixe</label>
              <input value={promo.fixed_code} onChange={e => setPromo({ ...promo, fixed_code: e.target.value.toUpperCase() })} placeholder="Ex : BIENVENUE5" className={`${inputCls} uppercase tracking-widest`} />
            </div>
          )}

          <button onClick={savePromo} disabled={busy !== ''} className="btn-primary disabled:opacity-50">
            {busy === 'promo' ? 'Enregistrement…' : 'Enregistrer'}
          </button>
          <p className="text-[11px] text-gray-600">Les codes uniques déjà envoyés restent valables et suivent le pourcentage actuel.</p>
        </div>
      )}

      {tab === 'history' && (
        <div className="space-y-2">
          {campaigns.length === 0 && <p className="text-gray-500 text-sm">Aucune newsletter envoyée.</p>}
          {campaigns.map(c => (
            <div key={c.id} className="flex items-center justify-between border border-white/10 bg-black/40 p-4">
              <div>
                <p className="text-white text-sm font-semibold">{c.subject}</p>
                <p className="text-gray-500 text-xs">{new Date(c.created_at).toLocaleString('fr-FR')}</p>
              </div>
              <span className="text-xs text-gray-300">{c.sent_count}/{c.recipients_total} envoyés</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
