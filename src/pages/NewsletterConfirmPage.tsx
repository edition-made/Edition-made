import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { CheckCircle2, AlertCircle, Copy, Check, Loader } from 'lucide-react';

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; code: string; percent: number; firstName: string }
  | { kind: 'error'; message: string };

export default function NewsletterConfirmPage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    document.title = 'Confirmation de votre inscription | Edition Made';
    if (!token) { setState({ kind: 'error', message: 'Lien de confirmation invalide.' }); return; }
    fetch('/api/newsletter', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'confirm', token }),
    })
      .then(async res => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(data.error || 'Lien de confirmation invalide ou expiré.');
        try { localStorage.setItem('em_promo_code', data.code); } catch { /* ignoré */ }
        setState({ kind: 'ok', code: data.code, percent: data.percent, firstName: data.firstName || '' });
      })
      .catch(err => setState({ kind: 'error', message: err instanceof Error ? err.message : 'Une erreur est survenue.' }));
  }, [token]);

  const copy = async (code: string) => {
    try { await navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000); } catch { /* ignoré */ }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      {state.kind === 'loading' && <Loader size={32} className="animate-spin mx-auto text-gray-400" />}

      {state.kind === 'ok' && (
        <>
          <CheckCircle2 size={48} className="mx-auto text-green-600 mb-4" />
          <h1 className="font-display font-bold text-3xl mb-2">Inscription confirmée{state.firstName ? `, ${state.firstName}` : ''} !</h1>
          <p className="text-gray-600 mb-6">Voici votre code pour <strong>-{state.percent} % de plus sur votre premier achat</strong> :</p>
          <div className="inline-flex items-center gap-3 bg-black text-[#fff500] px-6 py-4 mb-3">
            <span className="font-black text-xl tracking-widest">{state.code}</span>
            <button onClick={() => copy(state.code)} aria-label="Copier le code" className="text-white hover:text-[#fff500]">
              {copied ? <Check size={18} /> : <Copy size={18} />}
            </button>
          </div>
          <p className="text-xs text-gray-500 mb-8">Il sera appliqué automatiquement à votre commande sur cet appareil. Une copie vous a aussi été envoyée par e-mail.</p>
          <Link to="/promotions" className="btn-primary">Découvrir les offres</Link>
        </>
      )}

      {state.kind === 'error' && (
        <>
          <AlertCircle size={48} className="mx-auto text-red-500 mb-4" />
          <h1 className="font-display font-bold text-2xl mb-2">Confirmation impossible</h1>
          <p className="text-gray-600 mb-6">{state.message}</p>
          <Link to="/" className="btn-primary">Retour à l'accueil</Link>
        </>
      )}
    </div>
  );
}
