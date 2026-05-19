import { Link } from 'react-router-dom';
import { Trash2, Plus, Minus, ShoppingBag, ArrowRight, Truck, Store, Tag } from 'lucide-react';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const { items, removeItem, updateQuantity, totalPrice, clearCart } = useCart();

  if (items.length === 0) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-24 text-center">
        <ShoppingBag size={64} className="text-gray-200 mx-auto mb-6" />
        <h1 className="font-display font-bold text-2xl mb-3">Votre panier est vide</h1>
        <p className="text-gray-500 text-sm mb-8">Découvrez nos promotions et bonnes affaires</p>
        <div className="flex flex-wrap justify-center gap-3">
          <Link to="/promotions" className="btn-primary">Voir les promotions <ArrowRight size={16} /></Link>
          <Link to="/" className="btn-outline">Retour à l'accueil</Link>
        </div>
      </div>
    );
  }

  const savings = items.reduce((sum, item) => {
    if (item.product.originalPrice) {
      return sum + (item.product.originalPrice - item.product.price) * item.quantity;
    }
    return sum;
  }, 0);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="max-w-screen-xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="font-display font-bold text-2xl md:text-3xl">Mon panier</h1>
          <button onClick={clearCart} className="text-sm text-gray-500 hover:text-black transition-colors border-b border-transparent hover:border-black">
            Vider le panier
          </button>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {items.map(item => (
              <div key={`${item.product.id}-${item.selectedColor}`} className="bg-white p-4 flex gap-4">
                <Link to={`/produit/${item.product.slug}`} className="w-24 h-24 bg-gray-100 flex-shrink-0 overflow-hidden">
                  <img src={item.product.images[0]} alt={item.product.name} className="w-full h-full object-cover" />
                </Link>
                <div className="flex-1 min-w-0">
                  <Link to={`/produit/${item.product.slug}`} className="font-semibold text-sm hover:underline line-clamp-2">{item.product.name}</Link>
                  {item.selectedColor && (
                    <p className="text-xs text-gray-500 mt-0.5">Couleur : {item.selectedColor}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="font-black text-base">{item.product.price} €</span>
                    {item.product.originalPrice && (
                      <span className="text-xs text-gray-400 line-through">{item.product.originalPrice} €</span>
                    )}
                    {item.product.discount && (
                      <span className="bg-[#fff500] text-black text-xs font-black px-1">-{item.product.discount}%</span>
                    )}
                  </div>
                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center border border-gray-200">
                      <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100">
                        <Minus size={12} />
                      </button>
                      <span className="w-10 text-center text-sm font-semibold">{item.quantity}</span>
                      <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="w-8 h-8 flex items-center justify-center hover:bg-gray-100">
                        <Plus size={12} />
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="font-black text-sm">{(item.product.price * item.quantity).toFixed(2)} €</span>
                      <button onClick={() => removeItem(item.product.id)} className="text-gray-400 hover:text-red-500 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="space-y-4">
            <div className="bg-white p-5">
              <h2 className="font-display font-bold text-lg mb-4">Résumé de commande</h2>
              <div className="space-y-3 text-sm mb-4">
                <div className="flex justify-between">
                  <span className="text-gray-600">Sous-total</span>
                  <span className="font-semibold">{totalPrice.toFixed(2)} €</span>
                </div>
                {savings > 0 && (
                  <div className="flex justify-between text-green-600">
                    <span>Économies réalisées</span>
                    <span className="font-bold">-{savings.toFixed(2)} €</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-gray-600">Livraison</span>
                  <span className="text-gray-500">Calculée au checkout</span>
                </div>
              </div>
              <div className="border-t border-gray-100 pt-3 mb-4">
                <div className="flex justify-between">
                  <span className="font-black text-base">Total</span>
                  <span className="font-black text-xl">{totalPrice.toFixed(2)} €</span>
                </div>
              </div>
              <Link to="/checkout" className="btn-black w-full justify-center mb-3">
                Commander <ArrowRight size={16} />
              </Link>
              <div className="bg-[#fff500]/20 border border-[#fff500] p-3 text-center">
                <p className="text-xs font-semibold">3x sans frais à partir de {Math.ceil(totalPrice / 3).toFixed(2)} €/mois avec Alma</p>
              </div>
            </div>

            <div className="bg-white p-4 space-y-3">
              <div className="flex items-center gap-3 text-sm">
                <Truck size={16} className="text-black flex-shrink-0" />
                <span className="text-gray-600">Livraison France entière</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Store size={16} className="text-black flex-shrink-0" />
                <span className="text-gray-600">Retrait gratuit en magasin</span>
              </div>
              <div className="flex items-center gap-3 text-sm">
                <Tag size={16} className="text-black flex-shrink-0" />
                <span className="text-gray-600">Retours sous 14 jours</span>
              </div>
            </div>

            <div className="bg-white p-4">
              <h3 className="font-bold text-sm mb-2">Code promo</h3>
              <div className="flex gap-2">
                <input type="text" placeholder="Votre code..." className="flex-1 border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:border-black" />
                <button className="bg-black text-white px-4 py-2 text-xs font-bold hover:bg-gray-900 transition-colors">Appliquer</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
