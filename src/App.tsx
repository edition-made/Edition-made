import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import TopBar from './components/layout/TopBar';
import Header from './components/layout/Header';
import Footer from './components/layout/Footer';
import HomePage from './pages/HomePage';
import CategoryPage from './pages/CategoryPage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import CheckoutPage from './pages/CheckoutPage';
import ShowroomPage from './pages/ShowroomPage';
import BlogPage from './pages/BlogPage';
import BlogPostPage from './pages/BlogPostPage';
import ContactPage from './pages/ContactPage';
import PromotionsPage from './pages/PromotionsPage';
import ArrivagePage from './pages/ArrivagePage';
import FAQPage from './pages/FAQPage';
import AdminApp from './admin/AdminApp';
import WhatsAppButton from './components/ui/WhatsAppButton';

function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex flex-col min-h-screen">
      <TopBar />
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <WhatsAppButton />
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/admin/*" element={<AdminApp />} />
          <Route path="/" element={<Layout><HomePage /></Layout>} />
          <Route path="/promotions" element={<Layout><PromotionsPage /></Layout>} />
          <Route path="/arrivage" element={<Layout><ArrivagePage /></Layout>} />
          <Route path="/categorie/:slug" element={<Layout><CategoryPage /></Layout>} />
          <Route path="/categorie/:slug/:sub" element={<Layout><CategoryPage /></Layout>} />
          <Route path="/produit/:slug" element={<Layout><ProductPage /></Layout>} />
          <Route path="/panier" element={<Layout><CartPage /></Layout>} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/magasin" element={<Layout><ShowroomPage /></Layout>} />
          <Route path="/blog" element={<Layout><BlogPage /></Layout>} />
          <Route path="/blog/:slug" element={<Layout><BlogPostPage /></Layout>} />
          <Route path="/contact" element={<Layout><ContactPage /></Layout>} />
          <Route path="/faq" element={<Layout><FAQPage /></Layout>} />
          <Route path="*" element={<Layout><NotFound /></Layout>} />
        </Routes>
      </CartProvider>
    </BrowserRouter>
  );
}

function NotFound() {
  return (
    <div className="max-w-screen-xl mx-auto px-4 py-24 text-center">
      <h1 className="font-display font-bold text-6xl mb-4">404</h1>
      <p className="text-gray-500 text-lg mb-6">Cette page n'existe pas</p>
      <a href="/" className="btn-primary">Retour à l'accueil</a>
    </div>
  );
}
