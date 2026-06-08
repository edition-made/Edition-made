import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Truck, Store, ChevronDown, ChevronUp, AlertCircle, Loader } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY);

const steps = ['Livraison', 'Paiement', 'Confirmation'];

// ── Stripe Payment Form ────────────────────────────────────────────────────

interface PaymentFormProps {
  orderNumber: string;
  total: number;
  onBack: () => void;
}

function StripePaymentForm({ orderNumber, total, onBack }: PaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const [paying, setPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!stripe || !elements) return;

    setPaying(true);
    setError(null);

    const result = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/commande-confirmee?order_number=${orderNumber}`,
      },
      redirect: 'if_required',
    });

    if (result.error) {
      setError(result.error.message || 'Paiement refusé. Vérifiez vos informations.');
      setPaying(false);
      return;
    }

    // Paiement confirmé sans redirection (pas de 3DS)
    if (result.paymentIntent?.status === 'succeeded') {
      navigate(`/commande-confirmee?order_number=${orderNumber}&redirect_status=succeeded`);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="bg-white p-6">
      <h2 className="font-display font-bold text-xl mb-5">Paiement sécurisé</h2>

      <div className="mb-5">
        <PaymentElement
          options={{
            layout: 'tabs',
            fields: { billingDetails: { name: 'auto' } },
          }}
        />
      </div>

      {error && (
        <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 mb-4 text-sm">
          <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <div className="flex items-center gap-2 text-xs text-gray-400 mb-5">
        <Lock size={12} />
        Paiement 100 % sécurisé par Stripe. Vos données bancaires ne transitent jamais par nos serveurs.
      </div>

      <div className="flex gap-3">
        <button type="button" onClick={onBack} className="btn-outline">
          Retour
        </button>
        <button
          type="submit"
          disabled={!stripe || paying}
          className="btn-primary flex-1 justify-center disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {paying ? (
            <><Loader size={16} className="animate-spin" /> Traitement en cours…</>
          ) : (
            <><Lock size={16} /> Confirmer et payer {total.toFixed(2)} €</>
          )}
        </button>
      </div>
    </form>
  );
}

// ── Checkout principal ─────────────────────────────────────────────────────

export default function CheckoutPage() {
  const { items, totalPrice, clearCart } = useCart();
  const [step, setStep] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', zip: '', country: 'France',
  });
  const [summaryOpen, setSummaryOpen] = useState(false);

  // Stripe state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [piLoading, setPiLoading] = useState(false);
  const [piError, setPiError] = useState<string | null>(null);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleContinueToPayment = useCallback(async () => {
    setPiLoading(true);
    setPiError(null);

    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          customer: {
            firstName: form.firstName,
            lastName: form.lastName,
            email: form.email,
            phone: form.phone,
          },
          deliveryMode,
          address: form.address,
          city: form.city,
          zip: form.zip,
          items: items.map(i => ({
            productId: i.product.id,
            quantity: i.quantity,
            image: i.product.images?.[0] ?? '',
            selectedColor: i.selectedColor ?? '',
          })),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setPiError(data.error || 'Une erreur est survenue. Veuillez réessayer.');
        return;
      }

      setClientSecret(data.clientSecret);
      setOrderNumber(data.orderNumber);
      setStep(1);
    } catch {
      setPiError('Impossible de contacter le serveur de paiement. Vérifiez votre connexion.');
    } finally {
      setPiLoading(false);
    }
  }, [form, deliveryMode, items]);

  const stripeAppearance = {
    theme: 'stripe' as const,
    variables: {
      colorPrimary: '#000000',
      colorBackground: '#ffffff',
      colorText: '#111111',
      colorDanger: '#ef4444',
      borderRadius: '0px',
      fontFamily: 'system-ui, sans-serif',
    },
    rules: {
      '.Input': { border: '1px solid #d1d5db', boxShadow: 'none' },
      '.Input:focus': { border: '1px solid #000', boxShadow: 'none' },
      '.Label': { fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', letterSpacing: '0.05em', color: '#6b7280' },
    },
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center gap-2 mb-8">
          <Link to="/">
            <img
              src="https://bbzkudxpoglswakoyhyf.supabase.co/storage/v1/object/public/Image%20du%20site/EDITION_MADE_LOGO_SITE_WEB_MEUBLE_FRANCE_DESTOCKAGE_PARIS_SAINT_MAURICE_94410_LUXE_DESIGN.webp"
              alt="Edition Made"
              className="h-10 w-auto object-contain"
            />
          </Link>
          <span className="text-gray-300 mx-2">|</span>
          <span className="text-sm text-gray-600 font-medium">Commande sécurisée</span>
          <Lock size={14} className="text-gray-400" />
        </div>

        {/* Steps */}
        <div className="flex items-center gap-0 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center">
              <div className={`flex items-center gap-2 px-4 py-2 text-sm font-bold transition-colors ${
                i === step ? 'bg-black text-white' : i < step ? 'bg-[#fff500] text-black' : 'bg-gray-200 text-gray-500'
              }`}>
                <span className="w-5 h-5 flex items-center justify-center text-xs border border-current">
                  {i + 1}
                </span>
                {s}
              </div>
              {i < steps.length - 1 && <div className="w-6 h-0.5 bg-gray-300" />}
            </div>
          ))}
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Colonne principale */}
          <div className="lg:col-span-2">
            {/* ── Étape 0 : Livraison ─────────────────────────── */}
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
                    <p className="text-xs text-gray-500">5–10 jours ouvrés</p>
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
                  {[
                    { label: 'Prénom *', name: 'firstName', type: 'text' },
                    { label: 'Nom *', name: 'lastName', type: 'text' },
                    { label: 'Email *', name: 'email', type: 'email' },
                    { label: 'Téléphone *', name: 'phone', type: 'tel' },
                  ].map(field => (
                    <div key={field.name}>
                      <label className="text-xs font-semibold uppercase tracking-wide text-gray-600 mb-1 block">
                        {field.label}
                      </label>
                      <input
                        type={field.type}
                        name={field.name}
                        value={(form as Record<string, string>)[field.name]}
                        onChange={handleFormChange}
                        required
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                      />
                    </div>
                  ))}
                </div>

                {deliveryMode === 'delivery' && (
                  <>
                    <h3 className="font-bold text-base mb-4">Adresse de livraison</h3>
                    <div className="space-y-3">
                      <input
                        name="address"
                        value={form.address}
                        onChange={handleFormChange}
                        placeholder="Adresse *"
                        required
                        className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                      />
                      <div className="grid grid-cols-2 gap-4">
                        <input
                          name="zip"
                          value={form.zip}
                          onChange={handleFormChange}
                          placeholder="Code postal *"
                          required
                          className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                        />
                        <input
                          name="city"
                          value={form.city}
                          onChange={handleFormChange}
                          placeholder="Ville *"
                          required
                          className="w-full border border-gray-300 px-3 py-2.5 text-sm focus:outline-none focus:border-black"
                        />
                      </div>
                    </div>
                  </>
                )}

                {piError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 mt-4 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{piError}</span>
                  </div>
                )}

                <button
                  onClick={handleContinueToPayment}
                  disabled={piLoading || !form.firstName || !form.lastName || !form.email || !form.phone}
                  className="btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {piLoading
                    ? <><Loader size={16} className="animate-spin" /> Préparation du paiement…</>
                    : 'Continuer vers le paiement'
                  }
                </button>
              </div>
            )}

            {/* ── Étape 1 : Stripe Elements ───────────────────── */}
            {step === 1 && clientSecret && (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: stripeAppearance, locale: 'fr' }}
              >
                <StripePaymentForm
                  orderNumber={orderNumber!}
                  total={totalPrice}
                  onBack={() => setStep(0)}
                />
              </Elements>
            )}
          </div>

          {/* Récapitulatif */}
          <div>
            <div className="bg-white p-5 sticky top-24">
              <button
                className="w-full flex items-center justify-between font-bold text-base mb-0 md:mb-4 md:cursor-default"
                onClick={() => setSummaryOpen(o => !o)}
              >
                Votre commande
                <span className="md:hidden">{summaryOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}</span>
              </button>

              <div className={`${summaryOpen ? 'block' : 'hidden'} md:block`}>
                <div className="space-y-3 mb-4 mt-3">
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
    </div>
  );
}
