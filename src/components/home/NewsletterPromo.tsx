import { useState } from 'react';
import { Gift, MailCheck, Loader } from 'lucide-react';

export default function NewsletterPromo() {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [consent, setConsent] = useState(false);
  const [website, setWebsite] = useState(''); // honeypot : doit rester vide
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!consent) { setError('Cochez la case pour recevoir votre code et nos offres.'); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'subscribe', firstName, lastName, email, phone, consent, website, source: 'home' }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data.error || 'Une erreur est survenue.');
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="bg-[#fff500]" aria-labelledby="newsletter-promo-title">
      <div className="max-w-screen-xl mx-auto px-4 py-10 md:py-12 grid md:grid-cols-2 gap-8 items-center">
        <div>
          <div className="inline-flex items-center gap-2 bg-black text-[#fff500] text-xs font-black px-3 py-1.5 uppercase tracking-wide mb-4">
            <Gift size={14} /> Offre de bienvenue
          </div>
          <h2 id="newsletter-promo-title" className="font-display font-bold text-3xl md:text-4xl text-black leading-tight">
            -5 % de plus pour votre premier achat
          </h2>
          <p className="text-black/70 mt-3 text-sm md:text-base">
            Inscrivez-vous, confirmez votre e-mail et recevez votre code promo immédiatement. Cumulable avec nos prix déjà cassés,
            plus l'accès en avant-première à nos arrivages.
          </p>
        </div>

        {sent ? (
          <div className="bg-black text-white p-6 text-center">
            <MailCheck size={36} className="mx-auto text-[#fff500] mb-3" />
            <p className="font-bold text-lg mb-1">Vérifiez votre boîte mail</p>
            <p className="text-sm text-gray-300">
              Un e-mail de confirmation vient d'être envoyé à <strong>{email}</strong>. Cliquez sur le lien pour recevoir votre code -5 %.
              Pensez à regarder dans vos courriers indésirables.
            </p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-black p-5 md:p-6 space-y-3">
            <div className="grid sm:grid-cols-2 gap-3">
              <input
                type="text" required value={firstName} onChange={e => setFirstName(e.target.value)}
                placeholder="Prénom" autoComplete="given-name" maxLength={60}
                className="w-full bg-white px-3 py-3 text-sm text-black focus:outline-none"
              />
              <input
                type="text" required value={lastName} onChange={e => setLastName(e.target.value)}
                placeholder="Nom" autoComplete="family-name" maxLength={60}
                className="w-full bg-white px-3 py-3 text-sm text-black focus:outline-none"
              />
            </div>
            <input
              type="tel" required value={phone} onChange={e => setPhone(e.target.value)}
              placeholder="Téléphone" autoComplete="tel" maxLength={30}
              className="w-full bg-white px-3 py-3 text-sm text-black focus:outline-none"
            />
            <input
              type="email" required value={email} onChange={e => setEmail(e.target.value)}
              placeholder="Adresse e-mail" autoComplete="email" maxLength={254}
              className="w-full bg-white px-3 py-3 text-sm text-black focus:outline-none"
            />
            {/* Honeypot anti-robots */}
            <input
              type="text" tabIndex={-1} autoComplete="off" value={website} onChange={e => setWebsite(e.target.value)}
              aria-hidden="true" className="absolute left-[-9999px] w-px h-px opacity-0"
            />
            <label className="flex items-start gap-2 text-xs text-gray-300 cursor-pointer">
              <input type="checkbox" checked={consent} onChange={e => setConsent(e.target.checked)} className="mt-0.5 accent-[#fff500]" />
              <span>
                J'accepte de recevoir les offres et actualités d'Edition Made par e-mail. Désinscription possible à tout moment.
              </span>
            </label>
            {error && <p className="text-red-400 text-xs">{error}</p>}
            <button type="submit" disabled={loading} className="btn-primary w-full justify-center disabled:opacity-60">
              {loading ? <><Loader size={16} className="animate-spin" /> Envoi…</> : 'Recevoir mon code -5 %'}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
