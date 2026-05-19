import { useState, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ShoppingCart, Truck, Store, CreditCard, Star, ChevronDown, ChevronUp, Shield, Check, X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { dbProductToProduct } from '../lib/productUtils';
import { products as mockProducts } from '../data/products';
import { useCart } from '../context/CartContext';
import ProductCard from '../components/ui/ProductCard';
import { Product } from '../types';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const { addItem } = useCart();
  const [product, setProduct] = useState<Product | null>(null);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [quantity, setQuantity] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);
  const [descExpanded, setDescExpanded] = useState(false);
  const [deliveryMode, setDeliveryMode] = useState<'delivery' | 'pickup'>('delivery');
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [lightboxIndex, setLightboxIndex] = useState(0);

  useEffect(() => {
    if (!slug) return;
    setLoading(true);
    setSelectedImage(0);
    const fetchProduct = async () => {
      const { data } = await supabase
        .from('products')
        .select('*')
        .eq('slug', slug)
        .maybeSingle();
      let p;
      if (data) {
        p = dbProductToProduct(data);
      } else {
        const mock = mockProducts.find(m => m.slug === slug);
        if (!mock) { setProduct(null); setLoading(false); return; }
        p = mock;
      }
      setProduct(p);
      setSelectedColor(p.colors?.[0]);

      const { data: simData } = await supabase
        .from('products')
        .select('*')
        .eq('category', p.category)
        .neq('slug', slug)
        .limit(4);
      if (simData && simData.length > 0) {
        setSimilarProducts(simData.map(dbProductToProduct));
      } else {
        setSimilarProducts(mockProducts.filter(m => m.category === p.category && m.slug !== slug).slice(0, 4));
      }
      setLoading(false);
    };
    fetchProduct();
  }, [slug]);

  const openLightbox = (index: number) => {
    setLightboxIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = useCallback(() => setLightboxOpen(false), []);

  const lightboxPrev = useCallback(() => {
    setLightboxIndex(i => (i - 1 + (product?.images.length ?? 1)) % (product?.images.length ?? 1));
  }, [product]);

  const lightboxNext = useCallback(() => {
    setLightboxIndex(i => (i + 1) % (product?.images.length ?? 1));
  }, [product]);

  useEffect(() => {
    if (!lightboxOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeLightbox();
      if (e.key === 'ArrowLeft') lightboxPrev();
      if (e.key === 'ArrowRight') lightboxNext();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [lightboxOpen, closeLightbox, lightboxPrev, lightboxNext]);

  const handleAddToCart = () => {
    if (!product) return;
    addItem(product, quantity, selectedColor);
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2500);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="w-8 h-8 border-2 border-black border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="max-w-screen-xl mx-auto px-4 py-20 text-center">
        <h1 className="text-2xl font-bold mb-4">Produit introuvable</h1>
        <Link to="/" className="btn-primary">Retour à l'accueil</Link>
      </div>
    );
  }

  return (
    <div className="bg-white">
      <div className="max-w-screen-xl mx-auto px-4 py-6">
        <div className="text-xs text-gray-400 mb-4 flex items-center gap-1 flex-wrap">
          <Link to="/" className="hover:text-black">Accueil</Link>
          <span>/</span>
          <Link to={`/categorie/${product.category}`} className="hover:text-black capitalize">{product.category.replace(/-/g, ' ')}</Link>
          <span>/</span>
          <span className="text-black">{product.name}</span>
        </div>

        <div className="grid lg:grid-cols-2 gap-10 mb-16">
          <div>
            <div
              className="aspect-square bg-gray-50 overflow-hidden relative mb-3 cursor-zoom-in group"
              onClick={() => openLightbox(selectedImage)}
            >
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
              />
              {product.discount && (
                <div className="absolute top-4 right-4 bg-black text-[#fff500] text-lg font-black px-3 py-1.5">
                  -{product.discount}%
                </div>
              )}
              <div className="absolute bottom-3 right-3 bg-white/80 backdrop-blur-sm p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                <ZoomIn size={18} className="text-black" />
              </div>
            </div>
            {product.images.length > 1 && (
              <div className="flex gap-2">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedImage(i)}
                    className={`w-16 h-16 bg-gray-50 overflow-hidden border-2 transition-colors ${selectedImage === i ? 'border-black' : 'border-transparent hover:border-gray-300'}`}
                  >
                    <img src={img} alt="" className="w-full h-full object-contain" />
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">{product.brand}</p>
            <h1 className="font-display font-bold text-2xl md:text-3xl text-black mb-3 leading-tight">{product.name}</h1>

            {product.rating && (
              <div className="flex items-center gap-2 mb-4">
                <div className="flex">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star key={s} size={16} className={`${s <= Math.round(product.rating!) ? 'text-[#fff500] fill-[#fff500]' : 'text-gray-300 fill-gray-300'}`} />
                  ))}
                </div>
                <span className="text-sm font-bold">{product.rating}</span>
                <span className="text-sm text-gray-400">({product.reviewCount} avis)</span>
              </div>
            )}

            <div className="flex items-baseline gap-3 mb-2">
              <span className="text-3xl font-black text-black">{product.price} €</span>
              {product.originalPrice && (
                <>
                  <span className="text-lg text-gray-400 line-through">{product.originalPrice} €</span>
                  <span className="bg-[#fff500] text-black text-sm font-black px-2 py-0.5">
                    -{product.discount}%
                  </span>
                </>
              )}
            </div>
            {product.originalPrice && (
              <p className="text-sm text-green-600 font-bold mb-4">
                Vous économisez {product.originalPrice - product.price} €
              </p>
            )}

            <p className="text-sm text-gray-600 leading-relaxed mb-5">{product.shortDescription}</p>

            {product.colors && product.colors.length > 0 && (
              <div className="mb-5">
                <p className="font-bold text-sm mb-2">Couleur : <span className="font-normal text-gray-600">{selectedColor}</span></p>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-xs font-semibold border-2 transition-colors ${selectedColor === color ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="mb-5">
              <p className="font-bold text-sm mb-2">Mode de réception</p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setDeliveryMode('delivery')}
                  className={`flex items-center gap-2 p-3 border-2 text-sm font-semibold transition-colors ${deliveryMode === 'delivery' ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <Truck size={16} /> Livraison à domicile
                </button>
                <button
                  onClick={() => setDeliveryMode('pickup')}
                  className={`flex items-center gap-2 p-3 border-2 text-sm font-semibold transition-colors ${deliveryMode === 'pickup' ? 'border-black bg-black text-white' : 'border-gray-200 hover:border-gray-400'}`}
                >
                  <Store size={16} /> Retrait en magasin
                </button>
              </div>
            </div>

            <div className="flex gap-2 mb-5">
              <div className="flex items-center border border-gray-300">
                <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-lg font-bold">−</button>
                <span className="w-12 text-center font-bold">{quantity}</span>
                <button onClick={() => setQuantity(quantity + 1)} className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 text-lg font-bold">+</button>
              </div>
              <button
                onClick={handleAddToCart}
                className={`flex-1 flex items-center justify-center gap-2 py-3 font-bold text-sm uppercase tracking-wide transition-all ${addedToCart ? 'bg-green-500 text-white' : 'bg-[#fff500] text-black hover:bg-[#e6dc00]'}`}
              >
                {addedToCart ? <><Check size={18} /> Ajouté au panier</> : <><ShoppingCart size={18} /> Ajouter au panier</>}
              </button>
            </div>

            {product.stockCount && product.stockCount <= 5 && (
              <div className="bg-red-50 border border-red-200 px-4 py-2 mb-4">
                <p className="text-red-700 text-sm font-bold">
                  ⚠ Plus que {product.stockCount} en stock — Commandez vite !
                </p>
              </div>
            )}

            <div className="bg-[#fff500]/15 border border-[#fff500] p-4 mb-5">
              <div className="flex items-center gap-2 mb-1">
                <CreditCard size={16} />
                <span className="font-bold text-sm">Paiement en plusieurs fois avec Alma</span>
              </div>
              <p className="text-xs text-gray-600">
                Payez en 3x ({Math.ceil(product.price / 3)} €/mois) ou 4x ({Math.ceil(product.price / 4)} €/mois) sans frais
              </p>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-gray-600">
                <Truck size={15} className="text-black" />
                <span>Livraison France entière — délai 5-10 jours ouvrés</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Store size={15} className="text-black" />
                <span>Retrait gratuit en magasin — Saint-Maurice (94)</span>
              </div>
              <div className="flex items-center gap-2 text-gray-600">
                <Shield size={15} className="text-black" />
                <span>Garantie satisfaction — retour 14 jours</span>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-gray-100 pt-10 mb-16">
          <div className="grid md:grid-cols-3 gap-8">
            <div className="md:col-span-2">
              <h2 className="font-display font-bold text-xl mb-4">Description</h2>
              <div className={`text-sm text-gray-600 leading-relaxed overflow-hidden transition-all ${descExpanded ? 'max-h-none' : 'max-h-24'}`}>
                <p>{product.description}</p>
              </div>
              <button
                onClick={() => setDescExpanded(!descExpanded)}
                className="flex items-center gap-1 text-sm font-bold mt-2 hover:text-gray-500 transition-colors"
              >
                {descExpanded ? <><ChevronUp size={14} /> Voir moins</> : <><ChevronDown size={14} /> Voir plus</>}
              </button>
            </div>
            <div>
              <h2 className="font-display font-bold text-xl mb-4">Caractéristiques</h2>
              <table className="w-full text-sm">
                <tbody className="divide-y divide-gray-100">
                  {product.dimensions && (
                    <tr>
                      <td className="py-2 font-semibold text-gray-500 pr-4">Dimensions</td>
                      <td className="py-2 text-black">{product.dimensions}</td>
                    </tr>
                  )}
                  {product.material && (
                    <tr>
                      <td className="py-2 font-semibold text-gray-500 pr-4">Matière</td>
                      <td className="py-2 text-black">{product.material}</td>
                    </tr>
                  )}
                  <tr>
                    <td className="py-2 font-semibold text-gray-500 pr-4">Marque</td>
                    <td className="py-2 text-black">{product.brand}</td>
                  </tr>
                  <tr>
                    <td className="py-2 font-semibold text-gray-500 pr-4">Disponibilité</td>
                    <td className="py-2">
                      <span className={`font-bold ${product.inStock ? 'text-green-600' : 'text-red-600'}`}>
                        {product.inStock ? 'En stock' : 'Épuisé'}
                      </span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {similarProducts.length > 0 && (
          <div>
            <h2 className="font-display font-bold text-2xl mb-6">Vous aimerez aussi</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {similarProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </div>
        )}
      </div>

      {lightboxOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          onClick={closeLightbox}
        >
          <button
            className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors p-2"
            onClick={closeLightbox}
          >
            <X size={28} />
          </button>

          {product.images.length > 1 && (
            <>
              <button
                className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors p-3 bg-white/10 hover:bg-white/20"
                onClick={e => { e.stopPropagation(); lightboxPrev(); }}
              >
                <ChevronLeft size={28} />
              </button>
              <button
                className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:text-gray-300 transition-colors p-3 bg-white/10 hover:bg-white/20"
                onClick={e => { e.stopPropagation(); lightboxNext(); }}
              >
                <ChevronRight size={28} />
              </button>
            </>
          )}

          <div
            className="max-w-4xl max-h-[85vh] w-full px-16 flex items-center justify-center"
            onClick={e => e.stopPropagation()}
          >
            <img
              src={product.images[lightboxIndex]}
              alt={product.name}
              className="max-w-full max-h-[85vh] object-contain"
            />
          </div>

          {product.images.length > 1 && (
            <div className="absolute bottom-6 flex gap-2">
              {product.images.map((_, i) => (
                <button
                  key={i}
                  onClick={e => { e.stopPropagation(); setLightboxIndex(i); }}
                  className={`w-2 h-2 rounded-full transition-colors ${i === lightboxIndex ? 'bg-white' : 'bg-white/40 hover:bg-white/70'}`}
                />
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
