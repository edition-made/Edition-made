import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { Check, Package, MapPin, Clock, ArrowRight, XCircle, Loader } from 'lucide-react';
import { supabase, DbOrder, DbOrderItem } from '../lib/supabase';
import { useCart } from '../context/CartContext';

export default function OrderSuccessPage() {
  const [searchParams] = useSearchParams();
  const { clearCart } = useCart();

  const orderNumber = searchParams.get('order_number');
  const redirectStatus = searchParams.get('redirect_status');

  const [order, setOrder] = useState<DbOrder | null>(null);
  const [items, setItems] = useState<DbOrderItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [cartCleared, setCartCleared] = useState(false);

  const isSuccess = redirectStatus === 'succeeded' || redirectStatus === null;

  useEffect(() => {
    if (!cartCleared && isSuccess) {
      clearCart();
      setCartCleared(true);
    }
  }, [isSuccess, clearCart, cartCleared]);

  useEffect(() => {
    if (!orderNumber) { setLoading(false); return; }

    const fetchOrder = async () => {
      const { data: orderData } = await supabase
        .from('orders')
        .select('*')
        .eq('order_number', orderNumber)
        .maybeSingle();

      if (orderData) {
        setOrder(orderData);
        const { data: itemsData } = await supabase
          .from('order_items')
          .select('*')
          .eq('order_id', orderData.id);
        setItems(itemsData || []);
      }
      setLoading(false);
    };

    fetchOrder();
  }, [orderNumber]);

  // ── Paiement échoué ────────────────────────────────────────────────────────
  if (redirectStatus === 'failed' || redirectStatus === 'canceled') {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-24 text-center">
        <div className="w-20 h-20 bg-red-100 mx-auto flex items-center justify-center mb-6">
          <XCircle size={36} className="text-red-500" />
        </div>
        <h1 className="font-display font-bold text-3xl mb-3">Paiement non abouti</h1>
        <p className="text-gray-600 mb-2">Votre paiement n'a pas pu être traité.</p>
        <p className="text-sm text-gray-500 mb-8">
          {redirectStatus === 'canceled'
            ? "Vous avez annulé le paiement."
            : "Votre carte a été refusée. Vérifiez vos informations et réessayez."}
        </p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/checkout" className="btn-primary">Réessayer</Link>
          <Link to="/panier" className="btn-outline">Retour au panier</Link>
        </div>
      </div>
    );
  }

  // ── Chargement ─────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader size={28} className="animate-spin text-gray-400" />
      </div>
    );
  }

  // ── Succès ─────────────────────────────────────────────────────────────────
  return (
    <div className="bg-white">
      <div className="bg-black text-white py-12">
        <div className="max-w-2xl mx-auto px-4 text-center">
          <div className="w-16 h-16 bg-[#fff500] mx-auto flex items-center justify-center mb-5">
            <Check size={28} className="text-black" />
          </div>
          <h1 className="font-display font-bold text-3xl text-white mb-2">
            Commande confirmée !
          </h1>
          {orderNumber && (
            <p className="text-gray-400 text-sm">
              Référence : <span className="text-[#fff500] font-bold">{orderNumber}</span>
            </p>
          )}
          <p className="text-gray-400 text-sm mt-1">
            Un email de confirmation vous a été envoyé.
          </p>
        </div>
      </div>

      <div className="max-w-2xl mx-auto px-4 py-10">
        {order && (
          <div className="space-y-6">
            {/* Récapitulatif commande */}
            {items.length > 0 && (
              <div className="border border-gray-100 p-6">
                <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                  <Package size={16} /> Votre commande
                </h2>
                <div className="space-y-3">
                  {items.map((item) => (
                    <div key={item.id} className="flex items-center gap-3">
                      {item.product_image && (
                        <div className="w-12 h-12 bg-gray-100 flex-shrink-0 overflow-hidden">
                          <img src={item.product_image} alt="" className="w-full h-full object-cover" />
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold line-clamp-1">{item.product_name}</p>
                        <p className="text-xs text-gray-500">Qté : {item.quantity}</p>
                      </div>
                      <span className="text-sm font-bold">
                        {parseFloat(String(item.total_price)).toFixed(2)} €
                      </span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-gray-100 mt-4 pt-4 flex justify-between font-black text-base">
                  <span>Total payé</span>
                  <span>{parseFloat(String(order.total)).toFixed(2)} €</span>
                </div>
              </div>
            )}

            {/* Livraison */}
            <div className="border border-gray-100 p-6">
              <h2 className="font-bold text-base mb-4 flex items-center gap-2">
                <MapPin size={16} /> Réception
              </h2>
              {order.delivery_mode === 'pickup' ? (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Retrait en magasin</span><br />
                  14 avenue des Canadiens, 94410 Saint-Maurice<br />
                  Lun–Sam 10h–19h · Dim 10h–17h
                </p>
              ) : (
                <p className="text-sm text-gray-600">
                  <span className="font-semibold">Livraison à domicile</span><br />
                  {order.delivery_address && <>{order.delivery_address}<br /></>}
                  {order.delivery_zip} {order.delivery_city}
                </p>
              )}
            </div>

            {/* Délai */}
            <div className="bg-gray-50 p-6 flex items-start gap-4">
              <Clock size={20} className="text-gray-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-sm mb-1">Et maintenant ?</p>
                <p className="text-sm text-gray-600">
                  Notre équipe vous contactera par email ou téléphone pour organiser{' '}
                  {order.delivery_mode === 'pickup' ? 'le retrait' : 'la livraison'} dans les 24–48h.
                </p>
              </div>
            </div>
          </div>
        )}

        <div className="flex flex-wrap gap-3 mt-8">
          <Link to="/" className="btn-primary">
            Retour à l'accueil <ArrowRight size={16} />
          </Link>
          <Link to="/contact" className="btn-outline">Nous contacter</Link>
        </div>
      </div>
    </div>
  );
}
