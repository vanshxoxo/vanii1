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
import AccountPage from './pages/AccountPage';
import AdminPage from './pages/AdminPage';
import OrdersPage from './pages/OrdersPage';
import { ContactPage, FaqPage, PolicyPage } from './pages/StoreContentPage';

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
              <Route path="/account" element={<AccountPage />} />
              <Route path="/orders" element={<OrdersPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/contact" element={<ContactPage />} />
              <Route path="/shipping" element={<PolicyPage policyKey="shipping_returns" label="Shipping & Returns" />} />
              <Route path="/size-guide" element={<PolicyPage policyKey="size_guide" label="Size Guide" />} />
              <Route path="/faqs" element={<FaqPage />} />
              <Route path="/privacy" element={<PolicyPage policyKey="privacy" label="Privacy Policy" />} />
              <Route path="/terms" element={<PolicyPage policyKey="terms" label="Terms & Conditions" />} />
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
