import { Link } from 'react-router-dom';
import { MapPin, Phone, Mail, Clock, Instagram, Facebook, ArrowRight } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-black text-white">
      <div className="max-w-screen-xl mx-auto px-4 pt-14 pb-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="mb-4">
              <img
                src="https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp"
                alt="Edition Made"
                className="h-14 w-auto object-contain"
                style={{ filter: 'brightness(0) invert(1)' }}
              />
            </div>
            <p className="text-sm text-gray-400 leading-relaxed mb-5">
              Mobilier haut de gamme à prix d'usine. 500m² de showroom à Saint-Maurice (94). Déstockage et arrivages toute l'année.
            </p>
            <div className="flex gap-3">
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-[#fff500] hover:text-black transition-colors flex items-center justify-center">
                <Instagram size={16} />
              </a>
              <a href="#" className="w-9 h-9 bg-white/10 hover:bg-[#fff500] hover:text-black transition-colors flex items-center justify-center">
                <Facebook size={16} />
              </a>
            </div>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4 text-[#fff500]">Catégories</h3>
            <ul className="space-y-2">
              {[
                { label: 'Canapés', href: '/categorie/canapes' },
                { label: 'Fauteuils & Poufs', href: '/categorie/fauteuils-poufs' },
                { label: 'Meubles', href: '/categorie/meubles' },
                { label: 'Tables', href: '/categorie/tables' },
                { label: 'Chaises & Tabourets', href: '/categorie/chaises-tabourets' },
                { label: 'Literie', href: '/categorie/literie' },
                { label: 'Mobilier extérieur', href: '/categorie/mobilier-exterieur' },
                { label: 'Accessoires & Déco', href: '/categorie/accessoires-decoration' },
              ].map(item => (
                <li key={item.href}>
                  <Link to={item.href} className="text-sm text-gray-400 hover:text-white hover:translate-x-1 transition-all flex items-center gap-1 group">
                    <ArrowRight size={12} className="opacity-0 group-hover:opacity-100 transition-opacity" />
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4 text-[#fff500]">Informations</h3>
            <ul className="space-y-2">
              {[
                { label: 'Promotions', href: '/promotions' },
                { label: 'Arrivage de la semaine', href: '/arrivage' },
                { label: 'Notre showroom', href: '/magasin' },
                { label: 'Blog déco & conseils', href: '/blog' },
                { label: 'Contact', href: '/contact' },
                { label: 'Politique de livraison', href: '/livraison' },
                { label: 'Politique de retour', href: '/retours' },
                { label: 'Mentions légales', href: '/mentions-legales' },
                { label: 'FAQ', href: '/faq' },
              ].map(item => (
                <li key={item.href}>
                  <Link to={item.href} className="text-sm text-gray-400 hover:text-white transition-colors">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-display font-bold text-sm uppercase tracking-wider mb-4 text-[#fff500]">Nous contacter</h3>
            <ul className="space-y-3 mb-6">
              <li className="flex items-start gap-3">
                <MapPin size={16} className="text-[#fff500] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">
                  14 avenue des Canadiens<br />
                  94410 Saint-Maurice<br />
                  Val-de-Marne (94)
                </span>
              </li>
              <li className="flex items-center gap-3">
                <Phone size={16} className="text-[#fff500] flex-shrink-0" />
                <a href="tel:+33660222525" className="text-sm text-gray-400 hover:text-white transition-colors">
                  06 60 22 25 25
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Mail size={16} className="text-[#fff500] flex-shrink-0" />
                <a href="mailto:contact@editionmade.fr" className="text-sm text-gray-400 hover:text-white transition-colors">
                  contact@editionmade.fr
                </a>
              </li>
              <li className="flex items-start gap-3">
                <Clock size={16} className="text-[#fff500] mt-0.5 flex-shrink-0" />
                <span className="text-sm text-gray-400">
                  Lun–Sam : 10h–19h<br />
                  Dim : 10h–17h
                </span>
              </li>
            </ul>
            <div>
              <h4 className="font-bold text-xs uppercase tracking-wider mb-2 text-gray-300">Newsletter</h4>
              <form className="flex gap-0" onSubmit={e => e.preventDefault()}>
                <input
                  type="email"
                  placeholder="Votre email"
                  className="flex-1 bg-white/10 border border-white/20 px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-[#fff500] min-w-0"
                />
                <button type="submit" className="bg-[#fff500] text-black px-3 py-2 text-xs font-black hover:bg-[#e6dc00] transition-colors whitespace-nowrap">
                  OK
                </button>
              </form>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 pt-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-xs text-gray-600">
            <p>© 2024 Edition Made — Tous droits réservés</p>
            <div className="flex flex-wrap justify-center gap-4">
              <span className="text-gray-500">Meuble haut de gamme pas cher</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-500">Déstockage mobilier Paris</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-500">Showroom Saint-Maurice 94</span>
              <span className="text-gray-600">|</span>
              <span className="text-gray-500">Prix d'usine Île-de-France</span>
            </div>
            <div className="flex items-center gap-3">
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a4/Mastercard_2019_logo.svg/800px-Mastercard_2019_logo.svg.png" alt="Mastercard" className="h-5 opacity-60" />
              <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/5/5e/Visa_Inc._logo.svg/800px-Visa_Inc._logo.svg.png" alt="Visa" className="h-4 opacity-60" />
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
