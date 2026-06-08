import { Link } from 'react-router-dom';
import { MapPin, Clock, Phone, Mail, Car, Bus, CheckCircle, ArrowRight } from 'lucide-react';

export default function ShowroomPage() {
  return (
    <div className="bg-white">
      <div className="bg-black text-white py-14">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-2 bg-[#fff500] text-black text-xs font-black px-3 py-1.5 uppercase tracking-wide mb-5">
            <MapPin size={12} /> Showroom — Saint-Maurice (94)
          </div>
          <h1 className="font-display font-bold text-4xl md:text-5xl text-white mb-4">
            Notre showroom de <span className="text-[#fff500]">500m²</span>
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto">
            Venez découvrir et tester nos meubles et décoration haut de gamme dans notre grand espace d'exposition à Saint-Maurice.
          </p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-14">
        <div className="grid lg:grid-cols-2 gap-12 mb-16">
          <div>
            <h2 className="section-title mb-4">Votre destination mobilier en Île-de-France</h2>
            <p className="text-gray-600 leading-relaxed mb-6">
              Notre showroom de 500m² est ouvert 7 jours sur 7 pour vous accueillir dans la meilleure expérience d'achat mobilier en Val-de-Marne. Découvrez des centaines de modèles exposés, testez le confort, comparez les matières et bénéficiez de conseils personnalisés de nos experts.
            </p>

            <div className="space-y-4 mb-8">
              {[
                '500m² entièrement dédiés au mobilier et à la décoration',
                'Produits haut de gamme à prix d\'usine et déstockés',
                'Arrivages réguliers — nouvelles pièces chaque semaine',
                'Départ immédiat possible sur de nombreux articles',
                'Conseils personnalisés par notre équipe d\'experts',
                'Retrait de commandes en ligne gratuit et rapide',
                'Parking gratuit sur place',
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-3">
                  <CheckCircle size={18} className="text-[#fff500] bg-black rounded-full flex-shrink-0" />
                  <span className="text-sm">{item}</span>
                </div>
              ))}
            </div>

            <Link to="/promotions" className="btn-primary">
              Voir les promotions en cours <ArrowRight size={16} />
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="aspect-square overflow-hidden bg-gray-100">
              <img
                src="https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Showroom Edition Made"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square overflow-hidden bg-gray-100 mt-8">
              <img
                src="https://images.pexels.com/photos/276583/pexels-photo-276583.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Showroom intérieur"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square overflow-hidden bg-gray-100">
              <img
                src="https://images.pexels.com/photos/1668860/pexels-photo-1668860.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Produits en exposition"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="aspect-square overflow-hidden bg-gray-100 mt-8">
              <img
                src="https://images.pexels.com/photos/2079249/pexels-photo-2079249.jpeg?auto=compress&cs=tinysrgb&w=600"
                alt="Meubles design"
                className="w-full h-full object-cover"
              />
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          <div className="bg-black text-white p-6">
            <MapPin size={24} className="text-[#fff500] mb-3" />
            <h3 className="font-display font-bold text-lg mb-3">Adresse</h3>
            <p className="text-gray-400 text-sm leading-relaxed">
              14 avenue des Canadiens<br />
              94410 Saint-Maurice<br />
              Val-de-Marne (94)<br />
              Île-de-France
            </p>
            <a
              href="https://maps.google.com/maps?q=14+avenue+des+Canadiens,+94410+Saint-Maurice,+France"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-[#fff500] text-xs font-bold mt-3 hover:text-white transition-colors"
            >
              Voir sur Google Maps <ArrowRight size={12} />
            </a>
          </div>

          <div className="bg-black text-white p-6">
            <Clock size={24} className="text-[#fff500] mb-3" />
            <h3 className="font-display font-bold text-lg mb-3">Horaires d'ouverture</h3>
            <div className="space-y-2 text-sm">
              {[
                { day: 'Lundi', hours: '10h00 – 18h30' },
                { day: 'Mardi', hours: '10h00 – 18h30' },
                { day: 'Mercredi', hours: '10h00 – 18h30' },
                { day: 'Jeudi', hours: '10h00 – 18h30' },
                { day: 'Vendredi', hours: '10h00 – 18h30' },
                { day: 'Samedi', hours: '10h00 – 18h30' },
                { day: 'Dimanche', hours: '14h00 – 18h30' },
              ].map(item => (
                <div key={item.day} className="flex justify-between">
                  <span className="text-gray-400">{item.day}</span>
                  <span className="text-white font-medium">{item.hours}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-black text-white p-6">
            <Phone size={24} className="text-[#fff500] mb-3" />
            <h3 className="font-display font-bold text-lg mb-3">Contact</h3>
            <div className="space-y-3 text-sm">
              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">Téléphone</p>
                <a href="tel:+33660222525" className="text-white hover:text-[#fff500] transition-colors">06 60 22 25 25</a>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">WhatsApp</p>
                <a href="https://wa.me/33660222525" className="text-white hover:text-[#fff500] transition-colors">Nous écrire sur WhatsApp</a>
              </div>
              <div>
                <p className="text-gray-400 text-xs uppercase mb-1">Email</p>
                <a href="mailto:contact@editionmade.com" className="text-white hover:text-[#fff500] transition-colors">contact@editionmade.com</a>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-gray-100 p-4 mb-16">
          <h3 className="font-bold text-lg mb-4 px-2">Comment nous trouver</h3>
          <div className="overflow-hidden">
            <iframe
              title="Edition Made — 14 avenue des Canadiens, Saint-Maurice"
              src="https://maps.google.com/maps?q=14+avenue+des+Canadiens,+94410+Saint-Maurice,+France&t=&z=15&ie=UTF8&iwloc=&output=embed"
              width="100%"
              height="400"
              style={{ border: 0, display: 'block' }}
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
            />
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {[
            { icon: <Car size={24} />, title: 'En voiture', desc: 'Parking gratuit sur place. Accès facile depuis le Boulevard Carnot et la N6.' },
            { icon: <Bus size={24} />, title: 'En transports', desc: 'RER A : Gare de Saint-Maur-Créteil. Bus lignes 107, 325.' },
            { icon: <MapPin size={24} />, title: 'À proximité', desc: 'Paris 12ème à 5 min, Vincennes à 5 min, Créteil à 10 min.' },
            { icon: <Clock size={24} />, title: 'Ouvert 7j/7', desc: 'Nous vous accueillons du lundi au dimanche, toute l\'année sauf jours fériés.' },
          ].map((item, i) => (
            <div key={i} className="text-center p-5 border border-gray-100">
              <div className="flex items-center justify-center text-black mb-3">{item.icon}</div>
              <h4 className="font-bold text-sm mb-2">{item.title}</h4>
              <p className="text-xs text-gray-500 leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
