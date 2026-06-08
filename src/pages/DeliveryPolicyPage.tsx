import { Truck, Clock, MapPin, Package, AlertCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function DeliveryPolicyPage() {
  return (
    <div className="bg-white">
      <div className="bg-black text-white py-12">
        <div className="max-w-screen-xl mx-auto px-4">
          <p className="text-xs text-gray-500 mb-2">
            <Link to="/" className="hover:text-white">Accueil</Link> / Politique de livraison
          </p>
          <h1 className="font-display font-bold text-4xl">Politique de livraison</h1>
          <p className="text-gray-400 mt-2 text-sm">Dernière mise à jour : juin 2026</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-14">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Zones de livraison */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <MapPin size={20} className="text-black" />
              </div>
              <h2 className="font-display font-bold text-xl">Zone de livraison</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Edition Made livre dans toute la <strong>France métropolitaine</strong> (hors Corse et DOM-TOM sauf accord préalable).
              Nous proposons également le <strong>retrait gratuit en magasin</strong> à notre showroom de Saint-Maurice (94).
            </p>
            <p className="text-gray-600 text-sm leading-relaxed">
              Pour toute livraison en Corse ou dans les DOM-TOM, contactez-nous au préalable pour un devis personnalisé.
            </p>
          </section>

          {/* Délais */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-black" />
              </div>
              <h2 className="font-display font-bold text-xl">Délais de livraison</h2>
            </div>
            <div className="space-y-3">
              <div className="border border-gray-200 p-4">
                <p className="font-bold text-sm mb-1">Livraison standard</p>
                <p className="text-gray-600 text-sm">5 à 10 jours ouvrés à compter de la confirmation de paiement. Ce délai peut varier selon votre localisation et la disponibilité du transporteur.</p>
              </div>
              <div className="border border-gray-200 p-4">
                <p className="font-bold text-sm mb-1">Retrait en magasin</p>
                <p className="text-gray-600 text-sm">Disponible dès le lendemain de la commande (sous réserve de disponibilité en stock). Vous serez contacté par email ou téléphone pour convenir d'un créneau.</p>
              </div>
              <div className="border border-gray-200 p-4">
                <p className="font-bold text-sm mb-1">Articles volumineux (canapés, meubles, matelas)</p>
                <p className="text-gray-600 text-sm">Les articles volumineux sont livrés par transporteur spécialisé avec livraison au pas de porte ou en option à l'étage selon le devis. Un délai de 7 à 15 jours ouvrés s'applique.</p>
              </div>
            </div>
          </section>

          {/* Frais */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <Truck size={20} className="text-black" />
              </div>
              <h2 className="font-display font-bold text-xl">Frais de livraison</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Les frais de livraison sont calculés en fonction du poids, des dimensions et de la destination de votre commande. Ils sont affichés clairement avant la validation de votre commande.
            </p>
            <div className="bg-[#fff500]/10 border border-[#fff500]/30 p-4">
              <p className="font-black text-sm">Retrait en magasin : GRATUIT</p>
              <p className="text-sm text-gray-600 mt-1">14 avenue des Canadiens, 94410 Saint-Maurice — Lun–Sam 10h–18h30, Dim 14h–18h30</p>
            </div>
          </section>

          {/* Réception */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <Package size={20} className="text-black" />
              </div>
              <h2 className="font-display font-bold text-xl">Réception de votre commande</h2>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                À la réception, vérifiez l'état de votre colis en présence du livreur avant de signer le bon de livraison.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                En cas de dommage visible (colis abîmé, déchiré), émettez des réserves écrites sur le bordereau de livraison et refusez le colis si nécessaire.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                Signalez tout problème dans les 48h suivant la réception à contact@editionmade.com avec photos à l'appui.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                Un numéro de suivi vous sera communiqué par email dès l'expédition de votre commande.
              </li>
            </ul>
          </section>

          {/* Cas particuliers */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <AlertCircle size={20} className="text-black" />
              </div>
              <h2 className="font-display font-bold text-xl">Cas particuliers</h2>
            </div>
            <ul className="space-y-3 text-sm text-gray-600">
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                <strong className="text-black">Absence lors de la livraison :</strong> Le transporteur laisse un avis de passage. Vous disposez généralement de 5 à 7 jours pour contacter le transporteur et convenir d'un nouveau créneau.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                <strong className="text-black">Adresse incorrecte :</strong> En cas d'adresse erronée fournie par le client, les frais de réacheminement restent à sa charge.
              </li>
              <li className="flex items-start gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-black mt-2 flex-shrink-0" />
                <strong className="text-black">Retard exceptionnel :</strong> En cas de retard dû à des circonstances exceptionnelles (intempéries, grève, etc.), Edition Made ne pourra être tenu responsable. Nous ferons tout notre possible pour vous informer.
              </li>
            </ul>
          </section>

          {/* Contact */}
          <section className="bg-black text-white p-6">
            <div className="flex items-center gap-3 mb-3">
              <Phone size={20} className="text-[#fff500]" />
              <h2 className="font-bold text-lg">Une question sur votre livraison ?</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Notre équipe est disponible du lundi au samedi de 10h à 18h30.</p>
            <div className="flex flex-wrap gap-3">
              <a href="tel:+33660222525" className="bg-[#fff500] text-black px-4 py-2 text-sm font-black hover:bg-[#e6dc00] transition-colors">
                06 60 22 25 25
              </a>
              <Link to="/contact" className="bg-white/10 text-white px-4 py-2 text-sm font-bold hover:bg-white/20 transition-colors">
                Formulaire de contact
              </Link>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}
