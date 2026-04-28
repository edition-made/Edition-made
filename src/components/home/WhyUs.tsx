import { Truck, Store, Tag, RefreshCw, Shield, CreditCard, Star, Package } from 'lucide-react';

const reasons = [
  {
    icon: <Tag size={24} />,
    title: 'Prix d\'usine',
    desc: 'Mobilier haut de gamme à prix déstockés, jusqu\'à -60% toute l\'année.',
  },
  {
    icon: <Store size={24} />,
    title: '500m² de showroom',
    desc: 'Venez tester et voir nos produits dans notre grand showroom de Saint-Maurice (94).',
  },
  {
    icon: <Truck size={24} />,
    title: 'Livraison France entière',
    desc: 'Livraison à domicile partout en France. Retrait en magasin gratuit.',
  },
  {
    icon: <RefreshCw size={24} />,
    title: 'Arrivages réguliers',
    desc: 'De nouvelles références arrivent chaque semaine. Quantités limitées.',
  },
  {
    icon: <Shield size={24} />,
    title: 'Qualité garantie',
    desc: 'Nous sélectionnons uniquement des produits haut de gamme. Satisfaction garantie.',
  },
  {
    icon: <CreditCard size={24} />,
    title: 'Paiement en plusieurs fois',
    desc: 'Paiement fractionné avec Alma. 3x ou 4x sans frais dès 100€.',
  },
  {
    icon: <Star size={24} />,
    title: 'Bonnes affaires toute l\'année',
    desc: 'Déstockage permanent. Trouvez toujours de bonnes affaires chez Edition Made.',
  },
  {
    icon: <Package size={24} />,
    title: 'Stock disponible',
    desc: 'Produits en stock pour une livraison ou un retrait rapide.',
  },
];

export default function WhyUs() {
  return (
    <section className="py-14 bg-black text-white">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="text-center mb-10">
          <h2 className="font-display font-bold text-3xl md:text-4xl text-white mb-2">
            Pourquoi choisir <span className="text-[#fff500]">Edition Made</span> ?
          </h2>
          <p className="text-gray-400 text-sm">Le meilleur du mobilier haut de gamme, au meilleur prix</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {reasons.map((reason, i) => (
            <div
              key={i}
              className="group p-5 border border-white/10 hover:border-[#fff500] transition-all duration-300 hover:bg-white/5"
            >
              <div className="text-[#fff500] mb-3 group-hover:scale-110 transition-transform duration-300">
                {reason.icon}
              </div>
              <h3 className="font-bold text-sm text-white mb-2">{reason.title}</h3>
              <p className="text-xs text-gray-400 leading-relaxed">{reason.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
