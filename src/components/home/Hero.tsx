import { Link } from 'react-router-dom';
import { ArrowRight, Tag, Truck, Store } from 'lucide-react';

export default function Hero() {
  return (
    <section className="relative overflow-hidden bg-black min-h-[85vh] flex items-center">
      <img
        src="/hero.webp"
        alt="Showroom Edition Made"
        className="absolute inset-0 w-full h-full object-cover opacity-40"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-black via-black/80 to-transparent" />

      <div className="relative z-10 max-w-screen-xl mx-auto px-4 py-20 w-full">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 bg-[#fff500] text-black text-xs font-black px-3 py-1.5 uppercase tracking-wide mb-6 animate-fade-in">
            <Tag size={12} />
            Déstockage — Arrivages toute l'année
          </div>

          <h1 className="font-display font-bold text-white text-4xl md:text-5xl lg:text-6xl leading-tight mb-4 animate-slide-up">
            500m² de mobilier<br />
            <span className="text-[#fff500]">&amp; décoration</span><br />
            à prix d'usine
          </h1>

          <p className="text-gray-300 text-base md:text-lg mb-8 leading-relaxed animate-fade-in">
            Mobilier haut de gamme à <strong className="text-white">prix déstockés</strong> — jusqu'à <strong className="text-[#fff500]">-60%</strong> sur les grandes marques. Showroom ouvert 7j/7 à Saint-Maurice (94).
          </p>

          <div className="flex flex-wrap gap-3 mb-10 animate-slide-up">
            <Link to="/promotions" className="btn-primary text-base px-8 py-4">
              Découvrir les promotions <ArrowRight size={18} />
            </Link>
            <Link to="/categorie/canapes" className="btn-outline border-white text-white hover:bg-white hover:text-black text-base px-8 py-4">
              Acheter maintenant
            </Link>
          </div>

          <div className="flex flex-wrap gap-6">
            {[
              { icon: <Tag size={16} />, text: 'Jusqu\'à -60% sur tout' },
              { icon: <Truck size={16} />, text: 'Livraison France entière' },
              { icon: <Store size={16} />, text: 'Retrait en magasin' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm text-gray-300">
                <span className="text-[#fff500]">{item.icon}</span>
                {item.text}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-8 right-8 bg-[#fff500] p-4 shadow-2xl z-10 hidden lg:block">
        <p className="text-black font-black text-2xl leading-none">-50%</p>
        <p className="text-black text-xs font-bold">Sur les canapés</p>
      </div>
    </section>
  );
}
