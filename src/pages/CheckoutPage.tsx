import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Check, Lock, Truck, Store, CreditCard, ChevronDown, ChevronUp } from 'lucide-react';
import { useCart } from '../context/CartContext';

const steps = ['Livraison', 'Paiement', 'Confirmation'];

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', zip: '', country: 'France',
  });
  const [orderPlaced, setOrderPlaced] = useState(false);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handlePlaceOrder = () => {
    setOrderPlaced(true);
    clearCart();
  };

  if (orderPlaced) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-[#fff500] mx-auto flex items-center justify-center mb-6">
          <Check size={36} className="text-black" />
        </div>
        <h1 className="font-display font-bold text-3xl mb-3">Commande confirmée !</h1>
        <p className="text-gray-600 mb-2">Merci pour votre commande. Un email de confirmation vous a été envoyé.</p>
        <p className="text-sm text-gray-500 mb-8">Notre équipe vous contactera pour organiser la livraison ou le retrait en magasin.</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/" className="btn-primary">Retour à l'accueil</Link>
          <Link to="/magasin" className="btn-outline">Voir notre showroom</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center gap-2 mb-8">
          <Link to="/" className="font-display font-bold text-xl">
            EDITION<span className="text-[#fff500] bg-black px-1 ml-0.5">MADE</span>
          </Link>
          <span className="text-gray-300 mx-2">|</span>
          <span className="text-sm text-gray-600 font-medium">Commande sécurisée</span>
          <Lock size={14} className="text-gray-400" />
        </div>

        <div className="flex items-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors ${i === step ? 'bg-black text-white' : i < step ? 'bg-[#fff500] text-black' : 'bg-gray-200 text-gray-500'}`}>
                {i < step ? <Check size={14} /> : <span className="w-5 h-5 flex items-center justify-center text-xs border border-current">{i + 1}</span>}
                {s}
              </div>
              {i < steps.length - 1 && <div className="w-6 h-0.5 bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2">
            {step === 0 && (
              <div className="bg-white p-6">
                <h2 className="font-display font-bold text-xl mb-5">Mode de réception</h2>

                <div className="grid grid-cols-2 gap-3 mb-6">
                  <button
                    onClick={() => setDeliveryMode('delivery')}
                    className={`p-4 border-2 text-left transition-colors ${deliveryMode === 'delivery' ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <Truck size={20} className="mb-2" />
                    <p className="font-bold text-sm">Livraison à domicile</p>
                    <p className="text-xs text-gray-500">5-10 jours ouvrés</p>
                  </button>
                  <button
                    onClick={() => setDeliveryMode('pickup')}
                    className={`p-4 border-2 text-left transition-colors ${deliveryMode === 'pickup' ? 'border-black' : 'border-gray-200 hover:border-gray-400'}`}
                  >
                    <Store size={20} className="mb-2" />
                    <p className="font-bold text-sm">Retrait en magasin</p>
                    <p className="text-xs text-gray-500">Saint-Maurice (94) — Gratuit</p>
                  </button>
                </div>

                <h3 className="font-bold text-base mb-4">Vos coordonnées</h3>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Prénom *</label>
                    <input name="firstName" value={form.firstName} onChange={handleFormChange} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Nom *</label>
                    <input name="lastName" value={form.lastName} onChange={handleFormChange} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Email *</label>
                    <input type="email" name="email" value={form.email} onChange={handleFormChange} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Téléphone *</label>
                    <input name="phone" value={form.phone} onChange={handleFormChange} className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                  </div>
                </div>

                {deliveryMode === 'delivery' && (
                  <>
                    <h3 className="font-bold text-base mb-4">Adresse de livraison</h3>
                    <div className="space-y-3">
                      <input name="address" value={form.address} onChange={handleFormChange} placeholder="Adresse *" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                      <div className="grid grid-cols-2 gap-4">
                        <input name="zip" value={form.zip} onChange={handleFormChange} placeholder="Code postal *" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                        <input name="city" value={form.city} onChange={handleFormChange} placeholder="Ville *" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                      </div>
                    </div>
                  </>
                )}

                <button onClick={() => setStep(1)} className="btn-black mt-6">
                  Continuer vers le paiement
                </button>
              </div>
            )}

            {step === 1 && (
              <div className="bg-white p-6">
                <h2 className="font-display font-bold text-xl mb-5">Paiement sécurisé</h2>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6">
                  {[
                    { label: 'Carte bancaire', sub: 'CB, Visa, Mastercard', icon: <CreditCard size={20} /> },
                    { label: '3x avec Alma', sub: `${Math.ceil(totalPrice / 3)} €/mois`, icon: <span className="font-black text-sm">3x</span> },
                    { label: '4x avec Alma', sub: `${Math.ceil(totalPrice / 4)} €/mois`, icon: <span className="font-black text-sm">4x</span> },
                  ].map((opt, i) => (
                    <button key={i} className={`p-4 border-2 text-left hover:border-black transition-colors ${i === 0 ? 'border-black' : 'border-gray-200'}`}>
                      <div className="mb-1">{opt.icon}</div>
                      <p className="font-bold text-sm">{opt.label}</p>
                      <p className="text-xs text-gray-500">{opt.sub}</p>
                    </button>
                  ))}
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Numéro de carte *</label>
                    <input placeholder="1234 5678 9012 3456" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">Expiration *</label>
                      <input placeholder="MM/AA" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                    </div>
                    <div>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">CVV *</label>
                      <input placeholder="123" className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black" />
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 mt-4 text-xs text-gray-500">
                  <Lock size={12} />
                  Paiement 100% sécurisé par Stripe. Vos données bancaires ne sont jamais stockées.
                </div>

                <div className="flex gap-3 mt-6">
                  <button onClick={() => setStep(0)} className="btn-outline">Retour</button>
                  <button onClick={handlePlaceOrder} className="btn-primary flex-1 justify-center">
                    <Lock size={16} /> Confirmer et payer {totalPrice.toFixed(2)} €
                  </button>
                </div>
              </div>
            )}
          </div>

          <div>
            <div className="bg-white p-5 sticky top-24">
              <h2 className="font-bold text-base mb-4">Votre commande</h2>
              <div className="space-y-3 mb-4">
                {items.map(item => (
                  <div key={item.product.id} className="flex items-center gap-3">
                    <div className="relative w-12 h-12 bg-gray-100 flex-shrink-0 overflow-hidden">
                      <img src={item.product.images[0]} alt="" className="w-full h-full object-cover" />
                      <span className="absolute -top-1 -right-1 bg-black text-white text-xs w-4 h-4 flex items-center justify-center font-bold">
                        {item.quantity}
                      </span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-semibold line-clamp-1">{item.product.name}</p>
                    </div>
                    <span className="text-xs font-black">{(item.product.price * item.quantity).toFixed(2)} €</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-gray-100 pt-3">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-gray-500">Sous-total</span>
                  <span className="font-semibold">{totalPrice.toFixed(2)} €</span>
                </div>
                <div className="flex justify-between text-sm mb-3">
                  <span className="text-gray-500">Livraison</span>
                  <span className="text-gray-400">{deliveryMode === 'pickup' ? 'Gratuit' : 'À calculer'}</span>
                </div>
                <div className="flex justify-between font-black text-base">
                  <span>Total</span>
                  <span>{totalPrice.toFixed(2)} €</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
