import { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { getConsent, setConsent } from '../../lib/analytics';

export default function CookieBanner() {
  const { pathname } = useLocation();
  const [choice, setChoice] = useState(getConsent());

  if (choice || pathname.startsWith('/admin')) return null;

  const decide = (value: 'granted' | 'denied') => {
    setConsent(value);
    setChoice(value);
  };

  return (
    <div className="fixed inset-x-0 bottom-0 z-[80] bg-black text-white border-t border-white/15 p-4" role="dialog" aria-label="Cookies">
      <div className="max-w-screen-xl mx-auto flex flex-col md:flex-row md:items-center gap-3 md:gap-6">
        <p className="text-xs md:text-sm text-gray-300 flex-1">
          Nous utilisons des cookies de mesure d'audience (Google Analytics) pour améliorer le site. Aucune donnée n'est utilisée à des fins publicitaires.
          Vous pouvez refuser sans conséquence sur votre navigation.
        </p>
        <div className="flex gap-2 flex-shrink-0">
          <button onClick={() => decide('denied')} className="flex-1 md:flex-none px-4 py-2 text-xs font-bold border border-white/30 hover:bg-white/10">
            Refuser
          </button>
          <button onClick={() => decide('granted')} className="flex-1 md:flex-none px-4 py-2 text-xs font-black bg-[#fff500] text-black hover:bg-[#e6dc00]">
            Accepter
          </button>
        </div>
      </div>
    </div>
  );
}
