import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect } from 'react';
import { StoreProvider } from './store';
import Header from './components/Header';
import Footer from './components/Footer';
import CartDrawer from './components/CartDrawer';
import SearchOverlay from './components/SearchOverlay';
import MobileNav from './components/MobileNav';
import ToastContainer from './components/Toast';
import HomePage from './pages/HomePage';
import ShopPage from './pages/ShopPage';
import ProductPage from './pages/ProductPage';
import CheckoutPage from './pages/CheckoutPage';
import WishlistPage from './pages/WishlistPage';
import PlaceholderPage from './pages/PlaceholderPage';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);
  return null;
}

function HandleHashScroll() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        setTimeout(() => el.scrollIntoView({ behavior: 'smooth' }), 100);
      }
    }
  }, [pathname, hash]);
  return null;
}

function PageTransition({ children }: { children: React.ReactNode }) {
  const { pathname } = useLocation();
  return (
    <div key={pathname} className="animate-fade-in">
      {children}
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <StoreProvider>
        <ScrollToTop />
        <HandleHashScroll />
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex-1">
            <PageTransition>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/shop" element={<ShopPage />} />
              <Route path="/product/:slug" element={<ProductPage />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/account" element={<PlaceholderPage title="Account" breadcrumb="Account" description="Sign in to track orders, save favorites, and check out faster. Account management is coming soon — this is a demo storefront." />} />
              <Route path="/contact" element={<PlaceholderPage title="Contact Us" breadcrumb="Contact" description="We'd love to hear from you. Email us at hello@littleloom.example and we'll get back to you within 24 hours. Contact form coming soon." />} />
              <Route path="/shipping" element={<PlaceholderPage title="Shipping & Returns" breadcrumb="Shipping & Returns" description="Free shipping on orders above ₹1,499. Standard delivery in 3–5 business days. Easy 7-day returns on unworn items with original tags." />} />
              <Route path="/size-guide" element={<PlaceholderPage title="Size Guide" breadcrumb="Size Guide" description="Find the perfect fit for your little one. Detailed measurement charts for every age group are coming soon." />} />
              <Route path="/faqs" element={<PlaceholderPage title="FAQs" breadcrumb="FAQs" description="Common questions about ordering, sizing, shipping, and returns. FAQ content coming soon." />} />
              <Route path="/privacy" element={<PlaceholderPage title="Privacy Policy" breadcrumb="Privacy Policy" description="Your privacy matters. Our full privacy policy detailing how we handle your data is coming soon." />} />
              <Route path="/terms" element={<PlaceholderPage title="Terms & Conditions" breadcrumb="Terms & Conditions" description="Our terms of service covering purchases, usage, and policies. Full terms coming soon." />} />
              <Route path="*" element={<HomePage />} />
            </Routes>
            </PageTransition>
          </main>
          <Footer />
        </div>
        <CartDrawer />
        <SearchOverlay />
        <MobileNav />
        <ToastContainer />
      </StoreProvider>
    </BrowserRouter>
  );
}
