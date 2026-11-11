import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
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
        <div className="flex min-h-screen flex-col overflow-x-clip">
          <Header />
          <main className="flex-1">
            <PageTransition>
            <Routes>
              <Route path="/" element={<HomePage />} />
              {/* Keep /shop for existing shared links and support the Products URL used by navigation. */}
              <Route path="/products" element={<ShopPage />} />
              <Route path="/products/:slug" element={<ProductPage />} />
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
              <Route path="*" element={<NotFoundPage />} />
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

function NotFoundPage() {
  return (
    <section className="mx-auto flex min-h-[50vh] max-w-3xl flex-col items-center justify-center px-4 py-20 text-center">
      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-peach">Little Loom</p>
      <h1 className="mt-3 font-serif text-3xl font-light text-ink sm:text-4xl">We couldn’t find that page.</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-ink-soft">The address may have changed. Browse the current collection or return to the homepage.</p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/products" className="rounded-lg bg-ink px-5 py-3 text-sm font-medium text-cream hover:bg-ink/90">Browse products</Link>
        <Link to="/" className="rounded-lg border border-ink/15 px-5 py-3 text-sm font-medium text-ink hover:border-ink/40">Home</Link>
      </div>
    </section>
  );
}
