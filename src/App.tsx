import { BrowserRouter, Routes, Route, Link, useLocation, Navigate } from 'react-router-dom';
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
import DepartmentLandingPage from './pages/DepartmentLandingPage';
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
        <div className="flex min-h-screen flex-col overflow-x-clip bg-ivory text-charcoal">
          <Header />
          <main className="flex-1">
            <PageTransition>
              <Routes>
                <Route path="/" element={<HomePage />} />
                {/* Department Landing Pages */}
                <Route path="/department/:departmentId" element={<DepartmentLandingPage />} />
                <Route path="/department" element={<Navigate to="/shop" replace />} />
                <Route path="/jewellery" element={<DepartmentLandingPage departmentId="jewellery" />} />
                <Route path="/suits" element={<DepartmentLandingPage departmentId="women_suits" />} />
                <Route path="/women_suits" element={<DepartmentLandingPage departmentId="women_suits" />} />
                <Route path="/women-suits" element={<DepartmentLandingPage departmentId="women_suits" />} />
                <Route path="/living" element={<DepartmentLandingPage departmentId="home_textiles" />} />
                <Route path="/home_textiles" element={<DepartmentLandingPage departmentId="home_textiles" />} />
                <Route path="/home-textiles" element={<DepartmentLandingPage departmentId="home_textiles" />} />
                <Route path="/little-loom" element={<DepartmentLandingPage departmentId="kids" />} />
                <Route path="/kids" element={<DepartmentLandingPage departmentId="kids" />} />

                {/* Catalog & Products */}
                <Route path="/products" element={<ShopPage />} />
                <Route path="/products/:slug" element={<ProductPage />} />
                <Route path="/shop" element={<ShopPage />} />
                <Route path="/product/:slug" element={<ProductPage />} />

                {/* Commerce Journey */}
                <Route path="/checkout" element={<CheckoutPage />} />
                <Route path="/wishlist" element={<WishlistPage />} />
                <Route path="/account" element={<AccountPage />} />
                <Route path="/orders" element={<OrdersPage />} />
                <Route path="/admin" element={<AdminPage />} />

                {/* Store Policies & Support */}
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
      <span className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">VJ Collection</span>
      <h1 className="mt-3 font-serif text-3xl font-light text-charcoal sm:text-4xl">Page Not Found</h1>
      <p className="mt-3 max-w-md text-sm leading-6 text-charcoal-soft">
        The destination you are looking for may have moved or been curated into a new department.
      </p>
      <div className="mt-6 flex flex-wrap justify-center gap-3">
        <Link to="/shop" className="rounded-xl bg-charcoal px-6 py-3 text-xs font-semibold uppercase tracking-wider text-ivory hover:bg-charcoal/90">
          Browse All Collections
        </Link>
        <Link to="/" className="rounded-xl border border-charcoal/20 px-6 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal hover:bg-white">
          Return to Homepage
        </Link>
      </div>
    </section>
  );
}
