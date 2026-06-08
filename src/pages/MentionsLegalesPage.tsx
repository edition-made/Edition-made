import { Link } from 'react-router-dom';

export default function MentionsLegalesPage() {
  return (
    <div className="bg-white">
      <div className="bg-black text-white py-12">
        <div className="max-w-screen-xl mx-auto px-4">
          <p className="text-xs text-gray-500 mb-2">
            <Link to="/" className="hover:text-white">Accueil</Link> / Mentions légales
          </p>
          <h1 className="font-display font-bold text-4xl">Mentions légales</h1>
          <p className="text-gray-400 mt-2 text-sm">Dernière mise à jour : juin 2026</p>
        </div>
      </div>

      <div className="max-w-screen-xl mx-auto px-4 py-14">
        <div className="max-w-3xl mx-auto space-y-10 text-sm text-gray-700 leading-relaxed">

          <section>
            <h2 className="font-display font-bold text-xl text-black mb-4">1. Éditeur du site</h2>
            <div className="border border-gray-200 p-5 space-y-1">
              <p><strong>Raison sociale :</strong> Edition Made</p>
              <p><strong>Forme juridique :</strong> Entreprise individuelle / SARL (à compléter)</p>
              <p><strong>SIRET :</strong> (à compléter)</p>
              <p><strong>Siège social :</strong> 14 avenue des Canadiens, 94410 Saint-Maurice, Val-de-Marne (94)</p>
              <p><strong>Téléphone :</strong> <a href="tel:+33660222525" className="text-black font-semibold">06 60 22 25 25</a></p>
              <p><strong>Email :</strong> <a href="mailto:contact@editionmade.com" className="text-black font-semibold">contact@editionmade.com</a></p>
              <p><strong>Site web :</strong> <a href="https://editionmade.com" className="text-black font-semibold">https://editionmade.com</a></p>
              <p><strong>Directeur de la publication :</strong> (nom du responsable)</p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-black mb-4">2. Hébergeur</h2>
            <div className="border border-gray-200 p-5 space-y-1">
              <p><strong>Hébergeur :</strong> Netlify, Inc.</p>
              <p><strong>Adresse :</strong> 44 Montgomery Street, Suite 300, San Francisco, California 94104, USA</p>
              <p><strong>Site web :</strong> <a href="https://www.netlify.com" target="_blank" rel="noopener noreferrer" className="text-black font-semibold">www.netlify.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-black mb-4">3. Conception & développement</h2>
            <div className="border border-gray-200 p-5 space-y-1">
              <p><strong>Agence :</strong> <a href="https://webfityou.com/" target="_blank" rel="noopener noreferrer" className="font-bold underline text-black hover:text-gray-600 transition-colors">WebFitYou</a></p>
              <p><strong>Site web :</strong> <a href="https://webfityou.com/" target="_blank" rel="noopener noreferrer" className="text-black font-semibold">https://webfityou.com</a></p>
            </div>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-black mb-4">4. Propriété intellectuelle</h2>
            <p>
              L'ensemble du contenu de ce site internet (textes, images, graphismes, logo, icônes, sons, logiciels…) est la propriété exclusive d'Edition Made, à l'exception des marques, logos ou contenus appartenant à d'autres sociétés partenaires ou auteurs.
            </p>
            <p className="mt-3">
              Toute reproduction, représentation, modification, publication, adaptation de tout ou partie des éléments du site, quel que soit le moyen ou le procédé utilisé, est interdite, sauf autorisation écrite préalable d'Edition Made.
            </p>
            <p className="mt-3">
              Toute exploitation non autorisée du site ou de l'un quelconque des éléments qu'il contient sera considérée comme constitutive d'une contrefaçon et poursuivie conformément aux dispositions des articles L.335-2 et suivants du Code de Propriété Intellectuelle.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-black mb-4">5. Protection des données personnelles (RGPD)</h2>
            <p>
              Edition Made respecte la réglementation en vigueur applicable au traitement des données à caractère personnel, et notamment le Règlement (UE) 2016/679 du Parlement européen et du Conseil du 27 avril 2016 (RGPD).
            </p>
            <p className="mt-3"><strong>Données collectées :</strong> lors d'une commande ou d'une prise de contact, nous collectons les données suivantes : nom, prénom, adresse email, numéro de téléphone, adresse postale, historique de commandes.</p>
            <p className="mt-3"><strong>Finalités :</strong> traitement des commandes, envoi de confirmations, service après-vente, amélioration de l'expérience client.</p>
            <p className="mt-3"><strong>Conservation :</strong> les données sont conservées pendant la durée nécessaire à l'exécution du contrat et au respect des obligations légales (3 ans pour les données clients, 10 ans pour les documents comptables).</p>
            <p className="mt-3"><strong>Vos droits :</strong> conformément au RGPD, vous disposez d'un droit d'accès, de rectification, d'effacement, de portabilité et d'opposition concernant vos données personnelles. Pour exercer ces droits, contactez-nous à <a href="mailto:contact@editionmade.com" className="font-semibold text-black underline">contact@editionmade.com</a>.</p>
            <p className="mt-3">
              Vous pouvez également introduire une réclamation auprès de la <a href="https://www.cnil.fr" target="_blank" rel="noopener noreferrer" className="font-semibold text-black underline">CNIL</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-black mb-4">6. Cookies</h2>
            <p>
              Ce site utilise des cookies techniques nécessaires à son bon fonctionnement ainsi que des cookies analytiques pour mesurer l'audience (de manière anonyme). En naviguant sur ce site, vous acceptez l'utilisation de ces cookies conformément à notre politique de confidentialité.
            </p>
            <p className="mt-3">
              Vous pouvez paramétrer ou désactiver les cookies à tout moment via les paramètres de votre navigateur. La désactivation des cookies peut affecter certaines fonctionnalités du site.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-black mb-4">7. Paiement en ligne</h2>
            <p>
              Les transactions de paiement en ligne sont gérées par <strong>Stripe Inc.</strong>, une solution de paiement sécurisée certifiée PCI-DSS. Edition Made ne stocke jamais les données bancaires de ses clients. Toutes les transactions sont chiffrées et sécurisées.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-black mb-4">8. Droit applicable et juridiction</h2>
            <p>
              Les présentes mentions légales sont soumises au droit français. En cas de litige et à défaut de résolution amiable, les tribunaux français seront compétents.
            </p>
            <p className="mt-3">
              Pour tout différend relatif à un achat en ligne, vous pouvez recourir à la plateforme de règlement des litiges en ligne de la Commission européenne : <a href="https://ec.europa.eu/consumers/odr" target="_blank" rel="noopener noreferrer" className="font-semibold text-black underline">https://ec.europa.eu/consumers/odr</a>.
            </p>
          </section>

          <section>
            <h2 className="font-display font-bold text-xl text-black mb-4">9. Limitation de responsabilité</h2>
            <p>
              Edition Made met tout en œuvre pour proposer un site fiable et à jour. Cependant, Edition Made ne peut être tenu responsable des erreurs typographiques ou inexactitudes pouvant apparaître sur le site, des dommages directs ou indirects résultant de l'utilisation du site, ou encore d'indisponibilités temporaires du site pour des raisons de maintenance ou de force majeure.
            </p>
          </section>

        </div>
      </div>
    </div>
  );
}
