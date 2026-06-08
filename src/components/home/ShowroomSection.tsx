import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, ArrowRight, CheckCircle } from 'lucide-react';

export default function ShowroomSection() {
  return (
    <section className="py-14 bg-[#dad5c7]/15">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="grid lg:grid-cols-2 gap-10 items-center">
          <div>
            <div className="inline-flex items-center gap-2 bg-black text-[#fff500] text-xs font-black px-3 py-1.5 uppercase tracking-wide mb-5">
              <MapPin size={12} /> Showroom
            </div>
            <h2 className="section-title mb-4">
              Visitez nos <span className="text-[#fff500] bg-black px-1">500m²</span> d'exposition
            </h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Venez découvrir notre showroom de 500m² à Saint-Maurice (Val-de-Marne). Testez, touchez, essayez nos meubles et profitez de conseils personnalisés. Certains produits sont disponibles pour un départ immédiat.
            </p>

            <ul className="space-y-3 mb-7">
              {[
                '500m² de mobilier et décoration en exposition',
                'Produits disponibles pour départ immédiat',
                'Conseils personnalisés par nos experts',
                'Bonnes affaires exclusives en magasin',
                'Retrait de commandes en ligne gratuit',
              ].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-sm">
                  <CheckCircle size={16} className="text-[#fff500] bg-black rounded-full flex-shrink-0" />
                  <span>{item}</span>
                </li>
              ))}
            </ul>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-7 bg-white p-4">
              <div className="flex items-start gap-2">
                <MapPin size={16} className="text-[#fff500] bg-black p-0.5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs uppercase mb-1">Adresse</p>
                  <p className="text-xs text-gray-600">Saint-Maurice<br />Val-de-Marne (94)</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Clock size={16} className="text-[#fff500] bg-black p-0.5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs uppercase mb-1">Horaires</p>
                  <p className="text-xs text-gray-600">Lun–Sam : 10h–19h<br />Dim : 10h–17h</p>
                </div>
              </div>
              <div className="flex items-start gap-2">
                <Phone size={16} className="text-[#fff500] bg-black p-0.5 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-bold text-xs uppercase mb-1">Contact</p>
                  <p className="text-xs text-gray-600">06 60 22 25 25</p>
                </div>
              </div>
            </div>

            <Link to="/magasin" className="btn-black">
              Voir le showroom <ArrowRight size={16} />
            </Link>
          </div>

          <div className="relative">
            <div className="aspect-[4/3] overflow-hidden">
              <img
                src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Showroom Edition Made"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -bottom-4 -left-4 bg-[#fff500] p-5 shadow-xl">
              <p className="font-display font-black text-3xl text-black leading-none">500m²</p>
              <p className="text-black text-xs font-bold mt-1">d'exposition</p>
            </div>
            <div className="absolute -top-4 -right-4 bg-black text-white p-4 shadow-xl">
              <p className="font-black text-lg text-[#fff500] leading-none">Ouvert</p>
              <p className="text-white text-xs mt-1">7j/7</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
