import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { MailX, AlertCircle } from 'lucide-react';

export default function NewsletterUnsubscribePage() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'done' | 'error'>('idle');
  const [message, setMessage] = useState('');

  useEffect(() => { document.title = 'Désinscription | Edition Made'; }, []);

  const unsubscribe = async () => {
    setStatus('loading');
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'unsubscribe', token }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Lien de désinscription invalide.');
      setStatus('done');
    } catch (err) {
      setMessage(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setStatus('error');
    }
  };

  return (
    <div className="max-w-xl mx-auto px-4 py-16 text-center">
      {status === 'done' ? (
        <>
          <MailX size={48} className="mx-auto text-gray-500 mb-4" />
          <h1 className="font-display font-bold text-3xl mb-2">Vous êtes désinscrit(e)</h1>
          <p className="text-gray-600 mb-6">Vous ne recevrez plus nos newsletters.</p>
          <Link to="/" className="btn-primary">Retour à l'accueil</Link>
        </>
      ) : (
        <>
          {status === 'error' && <AlertCircle size={40} className="mx-auto text-red-500 mb-3" />}
          <h1 className="font-display font-bold text-3xl mb-2">Se désinscrire de la newsletter</h1>
          <p className="text-gray-600 mb-6">{status === 'error' ? message : 'Confirmez-vous ne plus vouloir recevoir nos offres par e-mail ?'}</p>
          <button onClick={unsubscribe} disabled={!token || status === 'loading'} className="btn-primary disabled:opacity-60">
            {status === 'loading' ? 'Désinscription…' : 'Me désinscrire'}
          </button>
        </>
      )}
    </div>
  );
}
