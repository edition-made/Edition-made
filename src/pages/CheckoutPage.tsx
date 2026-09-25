import { useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Lock, Truck, Store, ChevronDown, ChevronUp, AlertCircle, Loader, CreditCard, CalendarDays } from 'lucide-react';
import { loadStripe } from '@stripe/stripe-js';
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js';
import { useCart } from '../context/CartContext';
import { getDeliveryCost } from '../lib/shipping';

const STRIPE_KEY = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string | undefined;
const stripePromise = STRIPE_KEY ? loadStripe(STRIPE_KEY) : null;

const steps = ['Livraison', 'Paiement', 'Confirmation'];

type AlmaPlan = {
  installmentsCount: number;
  customerTotalCostAmount: number;
  paymentPlan: Array<{ totalAmount: number; dueDate: number }>;
};

type CheckoutApiResponse = {
  error?: string;
  plans?: AlmaPlan[];
  clientSecret?: string;
  orderNumber?: string;
  redirectUrl?: string;
};

async function parseApiResponse(response: Response): Promise<CheckoutApiResponse> {
  const rawBody = await response.text();
  if (!rawBody.trim()) {
    throw new Error('Le serveur de paiement n\'a renvoyé aucune réponse. Veuillez réessayer.');
  }

  try {
    return JSON.parse(rawBody) as CheckoutApiResponse;
  } catch {
    throw new Error('La réponse du serveur de paiement est invalide. Veuillez réessayer.');
  }
}

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
      // Le webhook Stripe est l'unique source de vérité pour confirmer la
      // commande, décrémenter le stock et envoyer les emails.
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
  const { items, totalPrice } = useCart();
  const hasUnavailableItems = items.some(item => !item.product.inStock || item.product.stockCount === 0);
  const [step, setStep] = useState(0);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [form, setForm] = useState({
    firstName: '', lastName: '', email: '', phone: '',
    address: '', city: '', zip: '', country: 'France',
  });
  const [summaryOpen, setSummaryOpen] = useState(false);
  const deliveryCost = getDeliveryCost(totalPrice, deliveryMode);
  const orderTotal = totalPrice + deliveryCost;

  // Payment state
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState<'stripe' | 'alma' | null>(null);
  const [piLoading, setPiLoading] = useState(false);
  const [piError, setPiError] = useState<string | null>(null);
  const [almaLoading, setAlmaLoading] = useState(false);
  const [almaStarting, setAlmaStarting] = useState<number | null>(null);
  const [almaPlans, setAlmaPlans] = useState<AlmaPlan[]>([]);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const cartPayload = useCallback(() => items.map(i => ({
    productId: i.product.id,
    quantity: i.quantity,
    image: i.product.images?.[0] ?? '',
    selectedColor: i.selectedColor ?? '',
  })), [items]);

  const checkoutPayload = useCallback(() => ({
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
    items: cartPayload(),
  }), [form, deliveryMode, cartPayload]);

  const handleContinueToPayment = useCallback(async () => {
    if (hasUnavailableItems) {
      setPiError('Un produit de votre panier est épuisé. Retirez-le avant de continuer.');
      return;
    }

    setPiError(null);
    setStep(1);
    setSelectedPaymentMethod(null);
    setAlmaLoading(true);
    setAlmaPlans([]);

    try {
      const res = await fetch('/api/alma-eligibility', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ items: cartPayload(), deliveryMode }),
      });
      const data = await parseApiResponse(res);
      if (res.ok && Array.isArray(data.plans)) setAlmaPlans(data.plans);
    } catch {
      // Stripe reste disponible même si l'éligibilité Alma ne peut pas être chargée.
    } finally {
      setAlmaLoading(false);
    }
  }, [cartPayload, deliveryMode, hasUnavailableItems]);

  const prepareStripePayment = useCallback(async () => {
    setPiLoading(true);
    setPiError(null);
    try {
      const res = await fetch('/api/create-payment-intent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(checkoutPayload()),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Impossible de préparer le paiement par carte.');
      if (typeof data.clientSecret !== 'string' || typeof data.orderNumber !== 'string') {
        throw new Error('La réponse Stripe est incomplète. Veuillez réessayer.');
      }
      setClientSecret(data.clientSecret);
      setOrderNumber(data.orderNumber);
    } catch (error) {
      setPiError(error instanceof Error ? error.message : 'Impossible de contacter le serveur de paiement.');
    } finally {
      setPiLoading(false);
    }
  }, [checkoutPayload]);

  const startAlmaPayment = useCallback(async (installmentsCount: number) => {
    setAlmaStarting(installmentsCount);
    setPiError(null);
    try {
      const res = await fetch('/api/create-alma-payment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...checkoutPayload(), installmentsCount }),
      });
      const data = await parseApiResponse(res);
      if (!res.ok) throw new Error(data.error || 'Impossible de démarrer le paiement Alma.');
      if (typeof data.redirectUrl !== 'string') throw new Error('Lien de paiement Alma invalide.');
      window.location.assign(data.redirectUrl);
    } catch (error) {
      setPiError(error instanceof Error ? error.message : 'Impossible de contacter Alma.');
      setAlmaStarting(null);
    }
  }, [checkoutPayload]);

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
                  disabled={
                    hasUnavailableItems || !items.length || !form.firstName || !form.lastName ||
                    !form.email || !form.phone ||
                    (deliveryMode === 'delivery' && (!form.address || !form.city || !form.zip))
                  }
                  className="btn-primary mt-6 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continuer vers le paiement
                </button>
              </div>
            )}

            {/* ── Étape 1 : choix du moyen de paiement ────────── */}
            {step === 1 && !clientSecret && (
              <div className="bg-white p-6">
                <h2 className="font-display font-bold text-xl mb-2">Choisissez votre moyen de paiement</h2>
                <p className="text-sm text-gray-500 mb-6">Le montant et le stock seront vérifiés avant le paiement.</p>

                {piError && (
                  <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-3 mb-4 text-sm">
                    <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                    <span>{piError}</span>
                  </div>
                )}

                <div className="space-y-3">
                  <div className={`border-2 transition-colors ${selectedPaymentMethod === 'stripe' ? 'border-black' : 'border-gray-200'}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('stripe')}
                      disabled={almaStarting !== null || !stripePromise}
                      className="w-full p-5 text-left hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-pressed={selectedPaymentMethod === 'stripe'}
                    >
                      <span className="flex items-center gap-4">
                        <span className="w-11 h-11 bg-black text-white flex items-center justify-center flex-shrink-0">
                          <CreditCard size={20} />
                        </span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold">Carte bancaire</span>
                          <span className="block text-xs text-gray-500 mt-1">Paiement sécurisé par Stripe · CB, Visa, Mastercard</span>
                        </span>
                        <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'stripe' ? 'border-black' : 'border-gray-300'}`}>
                          {selectedPaymentMethod === 'stripe' && <span className="h-2.5 w-2.5 rounded-full bg-black" />}
                        </span>
                      </span>
                    </button>

                    {selectedPaymentMethod === 'stripe' && (
                      <div className="border-t border-gray-200 p-4">
                        <button
                          type="button"
                          onClick={prepareStripePayment}
                          disabled={piLoading || almaStarting !== null || !stripePromise}
                          className="btn-primary w-full justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                          {piLoading ? <><Loader size={16} className="animate-spin" /> Préparation…</> : <><CreditCard size={16} /> Continuer avec la carte</>}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className={`border-2 transition-colors ${selectedPaymentMethod === 'alma' ? 'border-[#e891a5]' : 'border-gray-200'}`}>
                    <button
                      type="button"
                      onClick={() => setSelectedPaymentMethod('alma')}
                      disabled={piLoading || almaStarting !== null}
                      className="w-full p-5 text-left hover:bg-pink-50/40 disabled:opacity-50 disabled:cursor-not-allowed"
                      aria-pressed={selectedPaymentMethod === 'alma'}
                    >
                      <span className="flex items-center gap-4">
                        <span className="w-11 h-11 bg-[#f4b6c2] text-white font-black text-xl flex items-center justify-center flex-shrink-0">A</span>
                        <span className="min-w-0 flex-1">
                          <span className="block font-bold">Paiement en plusieurs fois avec Alma</span>
                          <span className="block text-xs text-gray-500 mt-1">Paiement sécurisé en 3x ou 4x</span>
                        </span>
                        <span className={`h-5 w-5 rounded-full border-2 flex items-center justify-center ${selectedPaymentMethod === 'alma' ? 'border-[#d97990]' : 'border-gray-300'}`}>
                          {selectedPaymentMethod === 'alma' && <span className="h-2.5 w-2.5 rounded-full bg-[#d97990]" />}
                        </span>
                      </span>
                    </button>

                    {selectedPaymentMethod === 'alma' && (
                      <div className="border-t border-gray-200 p-4">
                        <p className="text-xs text-gray-500 mb-3">Choisissez votre nombre d’échéances. Vous serez ensuite redirigé vers Alma.</p>

                        {almaLoading && (
                          <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                            <Loader size={15} className="animate-spin" /> Vérification de l’éligibilité…
                          </div>
                        )}

                        {!almaLoading && almaPlans.length > 0 && (
                          <div className="grid sm:grid-cols-2 gap-2">
                            {almaPlans.map((plan) => {
                              const firstInstallment = plan.paymentPlan[0]?.totalAmount ?? Math.ceil(orderTotal * 100 / plan.installmentsCount);
                              return (
                                <button
                                  type="button"
                                  key={plan.installmentsCount}
                                  onClick={() => startAlmaPayment(plan.installmentsCount)}
                                  disabled={almaStarting !== null || piLoading}
                                  className="border-2 border-black px-4 py-3 text-left hover:bg-black hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                >
                                  <span className="flex items-center gap-2 font-bold text-sm">
                                    {almaStarting === plan.installmentsCount
                                      ? <Loader size={15} className="animate-spin" />
                                      : <CalendarDays size={15} />}
                                    Payer en {plan.installmentsCount}x
                                  </span>
                                  <span className="block text-xs opacity-70 mt-1">
                                    1re échéance estimée : {(firstInstallment / 100).toFixed(2)} €
                                  </span>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {!almaLoading && almaPlans.length === 0 && (
                          <div className="text-xs text-gray-500">
                            <p>Alma n’est pas disponible pour le montant ou la configuration de ce panier.</p>
                            <button type="button" onClick={handleContinueToPayment} className="mt-3 font-bold text-black underline underline-offset-4">
                              Vérifier à nouveau
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>

                <button type="button" onClick={() => setStep(0)} className="btn-outline mt-5">
                  Retour
                </button>
              </div>
            )}

            {/* ── Paiement carte : Stripe Elements ─────────────── */}
            {step === 1 && clientSecret && stripePromise && (
              <Elements
                stripe={stripePromise}
                options={{ clientSecret, appearance: stripeAppearance, locale: 'fr' }}
              >
                <StripePaymentForm
                  orderNumber={orderNumber!}
                  total={orderTotal}
                  onBack={() => {
                    setClientSecret(null);
                    setOrderNumber(null);
                    setStep(0);
                  }}
                />
              </Elements>
            )}
            {step === 1 && clientSecret && !stripePromise && (
              <div className="bg-white p-6">
                <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 p-4 text-sm">
                  <AlertCircle size={16} className="flex-shrink-0 mt-0.5" />
                  <span>Le module de paiement n'est pas configuré. Contactez-nous par téléphone ou WhatsApp pour finaliser votre commande.</span>
                </div>
                <button onClick={() => setStep(0)} className="btn-outline mt-4">Retour</button>
              </div>
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
                    <span className={deliveryCost === 0 ? 'text-gray-400' : 'font-semibold'}>
                      {deliveryCost === 0 ? 'Gratuit' : `${deliveryCost.toFixed(2)} €`}
                    </span>
                  </div>
                  <div className="flex justify-between font-black text-base">
                    <span>Total</span>
                    <span>{orderTotal.toFixed(2)} €</span>
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
