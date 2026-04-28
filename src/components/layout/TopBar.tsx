import { Truck, Store, CreditCard, Star, ChevronRight } from 'lucide-react';

const items = [
  { icon: <Truck size={14} />, text: 'Livraison France entière' },
  { icon: <Store size={14} />, text: 'Retrait gratuit en magasin' },
  { icon: <CreditCard size={14} />, text: 'Paiement en plusieurs fois avec Alma' },
  { icon: <Star size={14} />, text: 'Arrivage de la semaine' },
  { icon: <Truck size={14} />, text: 'Prix d\'usine toute l\'année' },
  { icon: <Store size={14} />, text: '500m² de showroom à Saint-Maurice' },
];

export default function TopBar() {
  return (
    <div className="bg-black text-white overflow-hidden">
      <div className="marquee-wrapper py-2">
        <div className="marquee-content">
          {[...items, ...items].map((item, i) => (
            <span key={i} className="inline-flex items-center gap-1.5 mx-8 text-xs font-medium">
              <span className="text-[#fff500]">{item.icon}</span>
              {item.text}
              <ChevronRight size={10} className="text-[#fff500]" />
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
