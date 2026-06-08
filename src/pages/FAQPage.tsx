import { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

const faqs = [
  {
    q: 'Qu\'est-ce que le déstockage mobilier chez Edition Made ?',
    a: 'Chez Edition Made, le déstockage mobilier consiste à proposer des meubles et articles de décoration haut de gamme à des prix très réduits — souvent jusqu\'à -60% par rapport aux prix de vente habituels. Ces remises sont rendues possibles par des fins de collections, des surstocks ou des arrivages spéciaux. La qualité des produits reste intacte.',
  },
  {
    q: 'Comment fonctionne la livraison ?',
    a: 'Nous livrons partout en France métropolitaine. Les délais de livraison sont généralement de 5 à 10 jours ouvrés selon votre localisation. Le montant des frais de livraison est calculé lors du checkout en fonction de votre adresse et du volume des articles commandés.',
  },
  {
    q: 'Puis-je retirer ma commande en magasin ?',
    a: 'Oui, le retrait en magasin est gratuit. Vous pouvez venir récupérer votre commande dans notre showroom de 500m² à Saint-Maurice (Val-de-Marne). Nous vous contacterons dès que votre commande est prête, généralement sous 48h.',
  },
  {
    q: 'Est-il possible de payer en plusieurs fois ?',
    a: 'Oui ! Nous proposons le paiement fractionné avec Alma. Vous pouvez payer en 3x ou 4x sans frais dès 100€ d\'achat. L\'option est disponible lors du checkout.',
  },
  {
    q: 'Quelle est la politique de retour ?',
    a: 'Vous disposez de 14 jours après la réception de votre commande pour exercer votre droit de rétractation. Les articles doivent être retournés dans leur état d\'origine. Les frais de retour sont à la charge du client sauf en cas de produit défectueux.',
  },
  {
    q: 'Les produits sont-ils garantis ?',
    a: 'Oui, tous nos produits bénéficient d\'une garantie légale de conformité de 2 ans. Certains produits peuvent bénéficier d\'une garantie constructeur supplémentaire.',
  },
  {
    q: 'Comment savoir si un produit est disponible ?',
    a: 'La disponibilité de chaque produit est indiquée sur la fiche produit. Certains articles en déstockage sont disponibles en quantités très limitées. N\'hésitez pas à nous contacter par téléphone ou WhatsApp pour confirmer la disponibilité d\'un article.',
  },
  {
    q: 'Puis-je visiter le showroom avant d\'acheter ?',
    a: 'Absolument ! Notre showroom de 500m² à Saint-Maurice est ouvert du lundi au samedi de 10h à 19h et le dimanche de 10h à 17h. Vous pouvez y voir et tester tous nos produits exposés, et certains articles peuvent être emportés directement.',
  },
  {
    q: 'Proposez-vous des conseils d\'aménagement ?',
    a: 'Oui, notre équipe de conseillers est disponible en magasin pour vous aider à choisir les meubles adaptés à votre espace et votre style. N\'hésitez pas à nous contacter par email ou téléphone pour un conseil personnalisé.',
  },
  {
    q: 'Comment contacter le service client ?',
    a: 'Vous pouvez nous contacter par téléphone au 06 60 22 25 25 (du lundi au samedi de 10h à 19h), par WhatsApp, par email à contact@editionmade.com, ou directement en vous rendant dans notre showroom.',
  },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(0);

  return (
    <div className="bg-white">
      <div className="bg-black text-white py-12">
        <div className="max-w-screen-xl mx-auto px-4 text-center">
          <h1 className="font-display font-bold text-4xl text-white mb-3">FAQ — Questions fréquentes</h1>
          <p className="text-gray-400">Tout ce que vous devez savoir sur Edition Made et nos services</p>
        </div>
      </div>

      <div className="max-w-3xl mx-auto px-4 py-14">
        <div className="space-y-2">
          {faqs.map((faq, i) => (
            <div key={i} className="border border-gray-200 overflow-hidden">
              <button
                onClick={() => setOpen(open === i ? null : i)}
                className="w-full flex items-center justify-between p-5 text-left hover:bg-gray-50 transition-colors"
              >
                <span className="font-semibold text-sm pr-4">{faq.q}</span>
                {open === i ? <ChevronUp size={18} className="flex-shrink-0" /> : <ChevronDown size={18} className="flex-shrink-0" />}
              </button>
              {open === i && (
                <div className="px-5 pb-5 text-sm text-gray-600 leading-relaxed border-t border-gray-100 pt-4 animate-slide-up">
                  {faq.a}
                </div>
              )}
            </div>
          ))}
        </div>

        <div className="mt-12 bg-black text-white p-8 text-center">
          <h2 className="font-display font-bold text-xl mb-2">Vous ne trouvez pas votre réponse ?</h2>
          <p className="text-gray-400 text-sm mb-5">Notre équipe est disponible pour répondre à toutes vos questions</p>
          <div className="flex flex-wrap justify-center gap-3">
            <a href="tel:+33660222525" className="btn-primary">Appeler le showroom</a>
            <a href="https://wa.me/33660222525" className="btn-outline border-white text-white hover:bg-white hover:text-black">WhatsApp</a>
          </div>
        </div>
      </div>
    </div>
  );
}
