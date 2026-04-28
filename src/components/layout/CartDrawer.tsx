import { Link } from 'react-router-dom';
import { X, Plus, Minus, Trash2, ShoppingBag, ArrowRight } from 'lucide-react';
import { useCart } from '../../context/CartContext';

export default function CartDrawer() {
  const { items, isCartOpen, closeCart, removeItem, updateQuantity, totalPrice, totalItems } = useCart();

  if (!isCartOpen) return null;

  return (
    <>
      <div
        className="fixed inset-0 bg-black/40 z-50 animate-fade-in"
        onClick={closeCart}
      />
      <div className="fixed top-0 right-0 h-full w-full max-w-md bg-white z-50 shadow-2xl flex flex-col animate-slide-in-right">
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-200">
          <div className="flex items-center gap-2">
            <ShoppingBag size={20} />
            <h2 className="font-display font-bold text-lg">Mon panier</h2>
            {totalItems > 0 && (
              <span className="bg-[#fff500] text-black text-xs font-black px-2 py-0.5">{totalItems}</span>
            )}
          </div>
          <button onClick={closeCart} className="p-2 hover:bg-gray-100 transition-colors">
            <X size={20} />
          </button>
        </div>

        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <ShoppingBag size={48} className="text-gray-300" />
            <h3 className="font-bold text-lg">Votre panier est vide</h3>
            <p className="text-sm text-gray-500">Découvrez nos promotions et bonnes affaires</p>
            <Link to="/promotions" onClick={closeCart} className="btn-primary">
              Voir les promotions
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4">
              {items.map((item) => (
                <div key={`${item.product.id}-${item.selectedColor}`} className="flex gap-3">
                  <div className="w-20 h-20 bg-gray-100 flex-shrink-0 overflow-hidden">
                    <img
                      src={item.product.images[0]}
                      alt={item.product.name}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h4 className="text-sm font-semibold text-black line-clamp-2">{item.product.name}</h4>
                    {item.selectedColor && (
                      <p className="text-xs text-gray-500 mt-0.5">{item.selectedColor}</p>
                    )}
                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center border border-gray-200">
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity - 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Minus size={12} />
                        </button>
                        <span className="w-8 text-center text-sm font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.product.id, item.quantity + 1)}
                          className="w-7 h-7 flex items-center justify-center hover:bg-gray-100 transition-colors"
                        >
                          <Plus size={12} />
                        </button>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-black text-sm">{(item.product.price * item.quantity).toFixed(2)} €</span>
                        <button
                          onClick={() => removeItem(item.product.id)}
                          className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="border-t border-gray-200 p-5 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600">Sous-total</span>
                <span className="font-black text-lg">{totalPrice.toFixed(2)} €</span>
              </div>
              <div className="bg-[#fff500]/20 border border-[#fff500] p-3">
                <p className="text-xs font-semibold text-center">
                  Paiement en 3x sans frais avec <span className="font-black">Alma</span> dès 100€
                </p>
              </div>
              <Link
                to="/checkout"
                onClick={closeCart}
                className="btn-black w-full justify-center"
              >
                Commander <ArrowRight size={16} />
              </Link>
              <Link
                to="/panier"
                onClick={closeCart}
                className="btn-outline w-full justify-center"
              >
                Voir le panier
              </Link>
            </div>
          </>
        )}
      </div>
    </>
  );
}
