import { MapPin, Clock, Phone, Navigation, ExternalLink } from 'lucide-react';

const DIRECTIONS_URL =
  'https://www.google.com/maps/dir/?api=1&destination=14+avenue+des+Canadiens,+94410+Saint-Maurice,+France&travelmode=driving';

const GMAPS_URL =
  'https://www.google.com/maps/place/14+avenue+des+Canadiens,+94410+Saint-Maurice';

const EMBED_URL =
  'https://maps.google.com/maps?q=14+avenue+des+Canadiens,+94410+Saint-Maurice,+France&t=&z=16&ie=UTF8&iwloc=&output=embed';

export default function StoreMapSection() {
  return (
    <section className="bg-black">
      {/* Bandeau titre */}
      <div className="max-w-screen-xl mx-auto px-4 pt-14 pb-8">
        <div className="flex flex-col md:flex-row md:items-end md:justify-between gap-4 mb-10">
          <div>
            <p className="text-xs font-black uppercase tracking-widest text-[#fff500] mb-2">
              Venez nous voir
            </p>
            <h2 className="font-display font-bold text-3xl md:text-4xl text-white leading-tight">
              Notre showroom<br className="hidden md:block" /> à Saint-Maurice (94)
            </h2>
          </div>
          <a
            href={DIRECTIONS_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 bg-[#fff500] text-black font-black text-sm px-6 py-3 hover:bg-[#e6dc00] transition-colors self-start md:self-auto flex-shrink-0"
          >
            <Navigation size={16} />
            Obtenir l'itinéraire
          </a>
        </div>

        {/* Layout map + infos */}
        <div className="grid lg:grid-cols-5 gap-0 border border-white/10">

          {/* Carte */}
          <div className="lg:col-span-3 relative min-h-[300px] md:min-h-[420px]">
            <iframe
              title="Edition Made — Showroom Saint-Maurice"
              src={EMBED_URL}
              width="100%"
              height="100%"
              style={{ border: 0, minHeight: 300, display: 'block' }}
              allowFullScreen={false}
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              className="w-full h-full"
            />
            {/* Overlay coin bas-gauche avec badge adresse */}
            <div className="absolute bottom-4 left-4 bg-black/90 backdrop-blur-sm border border-white/10 px-3 py-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[#fff500] flex-shrink-0 animate-pulse" />
              <span className="text-white text-xs font-bold">14 av. des Canadiens — 94410 Saint-Maurice</span>
            </div>
          </div>

          {/* Informations */}
          <div className="lg:col-span-2 bg-white/5 p-7 flex flex-col gap-6">

            {/* Adresse */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <MapPin size={18} className="text-black" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Adresse</p>
                <p className="text-white font-semibold text-sm leading-relaxed">
                  14 avenue des Canadiens<br />
                  94410 Saint-Maurice<br />
                  Val-de-Marne (94)
                </p>
                <a
                  href={GMAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[#fff500] text-xs font-bold mt-2 hover:underline"
                >
                  Voir sur Google Maps <ExternalLink size={11} />
                </a>
              </div>
            </div>

            <div className="border-t border-white/10" />

            {/* Horaires */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <Clock size={18} className="text-black" />
              </div>
              <div className="w-full">
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-2">Horaires d'ouverture</p>
                <div className="space-y-1.5">
                  {[
                    { jours: 'Lun – Sam', heures: '10h00 – 18h30', today: [1,2,3,4,5,6].includes(new Date().getDay()) },
                    { jours: 'Dimanche', heures: '14h00 – 18h30', today: new Date().getDay() === 0 },
                  ].map((row) => (
                    <div key={row.jours} className="flex items-center justify-between">
                      <span className={`text-xs ${row.today ? 'text-[#fff500] font-bold' : 'text-gray-400'}`}>
                        {row.jours}
                        {row.today && <span className="ml-1.5 text-[8px] font-black bg-[#fff500] text-black px-1 py-0.5 uppercase tracking-wide">Ouvert</span>}
                      </span>
                      <span className={`text-xs font-semibold ${row.today ? 'text-white' : 'text-gray-300'}`}>{row.heures}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="border-t border-white/10" />

            {/* Téléphone */}
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <Phone size={18} className="text-black" />
              </div>
              <div>
                <p className="text-xs font-black uppercase tracking-widest text-gray-400 mb-1">Téléphone</p>
                <a
                  href="tel:+33660222525"
                  className="text-white font-semibold text-sm hover:text-[#fff500] transition-colors"
                >
                  06 60 22 25 25
                </a>
              </div>
            </div>

            <div className="border-t border-white/10" />

            {/* CTA itinéraire */}
            <a
              href={DIRECTIONS_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 bg-[#fff500] text-black font-black text-sm py-4 hover:bg-[#e6dc00] transition-colors mt-auto"
            >
              <Navigation size={16} />
              Lancer la navigation
            </a>
          </div>
        </div>

        {/* Indication transports */}
        <div className="mt-4 flex flex-wrap gap-3">
          {[
            '🚗 Parking gratuit sur place',
            '🚇 RER A — Joinville-le-Pont (10 min à pied)',
            '🚌 Bus 108 — Arrêt Les Canadiens',
          ].map((info) => (
            <span key={info} className="text-xs text-gray-400 bg-white/5 border border-white/10 px-3 py-1.5">
              {info}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
