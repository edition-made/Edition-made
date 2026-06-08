import { useState } from 'react';
import { ChevronDown } from 'lucide-react';

const faqs = [
  {
    q: 'Qu\'est-ce qu\'Edition Made ?',
    a: 'Edition Made est un spécialiste du déstockage et outlet de mobilier haut de gamme situé à Saint-Maurice (94), en Île-de-France. Nous proposons des meubles, canapés, tables, fauteuils et literie de grandes marques à des prix d\'usine — jusqu\'à -60% par rapport aux prix de vente conseillés.',
  },
  {
    q: 'Comment fonctionne le déstockage mobilier ?',
    a: 'Nous achetons des fins de séries, surplus de fabrication et collections discontinuées directement auprès des fabricants et importateurs. Ces produits sont neufs, en parfait état, mais vendus à prix réduit car ils ne font plus partie du catalogue actif. Les arrivages changent régulièrement.',
  },
  {
    q: 'Puis-je visiter le showroom avant d\'acheter ?',
    a: 'Absolument. Notre showroom de 500 m² est ouvert du lundi au samedi de 10h à 18h30 et le dimanche de 14h à 18h30 au 14 avenue des Canadiens, 94410 Saint-Maurice. Vous pouvez voir, toucher et tester tous les produits exposés.',
  },
  {
    q: 'Livrez-vous partout en France ?',
    a: 'Oui, nous livrons dans toute la France métropolitaine. La livraison est estimée sous 5 à 10 jours ouvrés selon votre localisation. Vous pouvez aussi choisir le retrait gratuit en magasin à Saint-Maurice (94).',
  },
  {
    q: 'Quels modes de paiement acceptez-vous ?',
    a: 'Nous acceptons les cartes bancaires (Visa, Mastercard, CB) via Stripe, avec paiement 100% sécurisé. Nous proposons également le paiement en 3x ou 4x sans frais dès 100€ avec Alma. En magasin, le règlement en espèces est possible dans la limite légale.',
  },
  {
    q: 'Quelle est votre politique de retour ?',
    a: 'Vous disposez de 14 jours à compter de la réception de votre commande pour exercer votre droit de rétractation, conformément à la législation française. Le produit doit être retourné dans son état d\'origine. Consultez notre page Politique de retour pour les détails.',
  },
  {
    q: 'Comment contacter le service client ?',
    a: 'Par téléphone ou WhatsApp au 06 60 22 25 25 (lun–sam 10h–18h30), par email à contact@editionmade.com, ou directement en showroom. Notre équipe répond sous 24h en semaine.',
  },
];

export default function HomeFAQ() {
  const [open, setOpen] = useState<number | null>(null);

  return (
    <section className="py-16 bg-white border-t border-gray-100">
      <div className="max-w-screen-xl mx-auto px-4">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <p className="text-xs font-black uppercase tracking-widest text-[#d4bc00] mb-2">Questions fréquentes</p>
            <h2 className="font-display font-bold text-3xl text-black">Tout savoir sur Edition Made</h2>
          </div>

          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div key={i} className="border border-gray-200 overflow-hidden">
                <button
                  onClick={() => setOpen(open === i ? null : i)}
                  className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-gray-50 transition-colors"
                >
                  <span className="font-bold text-sm text-black pr-4">{faq.q}</span>
                  <ChevronDown
                    size={16}
                    className={`flex-shrink-0 text-gray-400 transition-transform duration-200 ${open === i ? 'rotate-180' : ''}`}
                  />
                </button>
                {open === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-gray-600 leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
