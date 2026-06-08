import { RotateCcw, Clock, CheckCircle, XCircle, Phone } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function ReturnPolicyPage() {
  return (
    <div className="bg-white">
      <div className="bg-black text-white py-12">
        <div className="max-w-screen-xl mx-auto px-4">
          <p className="text-xs text-gray-500 mb-2">
            <Link to="/" className="hover:text-white">Accueil</Link> / Politique de retour
          </p>
          <h1 className="font-display font-bold text-4xl">Politique de retour</h1>
          <p className="text-gray-400 mt-2 text-sm">Dernière mise à jour : juin 2026</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-14">
        <div className="max-w-3xl mx-auto space-y-12">

          {/* Droit de rétractation */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <Clock size={20} className="text-black" />
              </div>
              <h2 className="font-display font-bold text-xl">Droit de rétractation — 14 jours</h2>
            </div>
            <div className="bg-[#fff500]/10 border border-[#fff500]/30 p-5 mb-4">
              <p className="font-black text-base mb-1">Vous disposez de 14 jours pour changer d'avis.</p>
              <p className="text-sm text-gray-700">
                Conformément aux articles L221-18 et suivants du Code de la consommation, vous bénéficiez d'un délai de <strong>14 jours calendaires</strong> à compter de la réception de votre commande pour exercer votre droit de rétractation, sans avoir à justifier votre décision ni à payer de pénalité.
              </p>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              Pour exercer ce droit, vous devez nous notifier votre décision par écrit avant l'expiration du délai de 14 jours, par email à <a href="mailto:contact@editionmade.com" className="font-semibold text-black underline">contact@editionmade.com</a> ou via notre <Link to="/contact" className="font-semibold text-black underline">formulaire de contact</Link>, en précisant votre numéro de commande.
            </p>
          </section>

          {/* Conditions */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <CheckCircle size={20} className="text-black" />
              </div>
              <h2 className="font-display font-bold text-xl">Conditions de retour</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-4">
              Pour être accepté, le retour doit respecter les conditions suivantes :
            </p>
            <ul className="space-y-3">
              {[
                'Le produit doit être retourné dans son emballage d\'origine ou un emballage équivalent protégeant le bien.',
                'Le produit doit être en parfait état, non utilisé, non endommagé, complet (avec tous ses accessoires et documents).',
                'Le retour doit être effectué dans les 14 jours suivant votre notification de rétractation.',
                'Le produit ne doit pas avoir été assemblé (pour les produits livrés en kit).',
                'Les articles personnalisés ou fabriqués sur mesure sont exclus du droit de rétractation.',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <CheckCircle size={16} className="text-green-500 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Articles non remboursables */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-red-100 flex items-center justify-center flex-shrink-0">
                <XCircle size={20} className="text-red-500" />
              </div>
              <h2 className="font-display font-bold text-xl">Exclusions du droit de rétractation</h2>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed mb-3">
              Conformément à l'article L221-28 du Code de la consommation, certains produits ne peuvent pas faire l'objet d'un retour :
            </p>
            <ul className="space-y-2">
              {[
                'Produits personnalisés ou fabriqués selon les spécifications du client',
                'Produits susceptibles de se détériorer ou de se périmer rapidement',
                'Produits descellés après livraison qui ne peuvent être renvoyés pour des raisons d\'hygiène (ex. : linge de lit déballé)',
                'Articles dont le sceau de protection a été retiré',
              ].map((item, i) => (
                <li key={i} className="flex items-start gap-3 text-sm text-gray-600">
                  <XCircle size={14} className="text-red-400 flex-shrink-0 mt-0.5" />
                  {item}
                </li>
              ))}
            </ul>
          </section>

          {/* Procédure */}
          <section>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-[#fff500] flex items-center justify-center flex-shrink-0">
                <RotateCcw size={20} className="text-black" />
              </div>
              <h2 className="font-display font-bold text-xl">Procédure de retour</h2>
            </div>
            <ol className="space-y-4">
              {[
                { step: '1', title: 'Notifiez-nous', desc: 'Envoyez un email à contact@editionmade.com avec votre numéro de commande et la raison du retour dans le délai de 14 jours.' },
                { step: '2', title: 'Confirmation', desc: 'Notre équipe vous répond sous 48h avec les instructions de retour et l\'adresse d\'expédition.' },
                { step: '3', title: 'Renvoi du colis', desc: 'Renvoyez le produit soigneusement emballé à l\'adresse indiquée. Les frais de retour sont à la charge du client sauf en cas de produit défectueux ou erreur de notre part.' },
                { step: '4', title: 'Remboursement', desc: 'Dès réception et vérification du retour (sous 5 à 7 jours ouvrés), nous procédons au remboursement intégral du prix du produit par le même moyen de paiement que celui utilisé lors de l\'achat, sous 14 jours maximum.' },
              ].map((s) => (
                <li key={s.step} className="flex gap-4">
                  <div className="w-8 h-8 bg-black text-[#fff500] font-black text-sm flex items-center justify-center flex-shrink-0">
                    {s.step}
                  </div>
                  <div>
                    <p className="font-bold text-sm mb-1">{s.title}</p>
                    <p className="text-sm text-gray-600">{s.desc}</p>
                  </div>
                </li>
              ))}
            </ol>
          </section>

          {/* Produits défectueux */}
          <section className="border border-gray-200 p-6">
            <h2 className="font-display font-bold text-lg mb-3">Produit défectueux ou erreur de commande</h2>
            <p className="text-sm text-gray-600 leading-relaxed">
              Si vous recevez un produit défectueux, endommagé lors du transport ou ne correspondant pas à votre commande, contactez-nous dans les <strong>48h suivant la réception</strong> avec des photos à l'appui. Dans ce cas, les frais de retour sont entièrement à notre charge et vous bénéficiez d'un remboursement complet ou d'un échange, selon votre préférence.
            </p>
          </section>

          {/* Contact */}
          <section className="bg-black text-white p-6">
            <div className="flex items-center gap-3 mb-3">
              <Phone size={20} className="text-[#fff500]" />
              <h2 className="font-bold text-lg">Besoin d'aide pour un retour ?</h2>
            </div>
            <p className="text-gray-400 text-sm mb-4">Notre équipe SAV est disponible du lundi au samedi de 10h à 18h30.</p>
            <div className="flex flex-wrap gap-3">
              <a href="mailto:contact@editionmade.com" className="bg-[#fff500] text-black px-4 py-2 text-sm font-black hover:bg-[#e6dc00] transition-colors">
                contact@editionmade.com
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
