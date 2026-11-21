import { Link, useLocation } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu, ChevronDown, ArrowRight, Sparkles, Gem, Shirt, Home, Baby } from 'lucide-react';
import { useStore } from '../useStore';
import { useEffect, useState, useRef } from 'react';
import { useCmsSection } from '../lib/cms';
import { departments, getCategoriesForDepartment } from '../data/storeNavigation';
import type { Department } from '../types';

export default function Header() {
  const { cartCount, wishlist, openCart, openSearch, openMobileNav, cartPulse } = useStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [activeDropdown, setActiveDropdown] = useState<Department | null>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const announcement = useCmsSection('announcement');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 15);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
  }, [location.pathname, location.search]);

  const handleMouseEnter = (deptId: Department) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(deptId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 150);
  };

  const isDeptActive = (deptId: Department) => {
    return (
      location.pathname === `/department/${deptId}` ||
      (location.pathname === '/shop' && location.search.includes(`department=${deptId}`))
    );
  };

  return (
    <>
      {/* Top Luxury Announcement Ticker */}
      <div
        role="region"
        aria-label="VJ Collection Announcement"
        className="announcement-bar bg-charcoal text-ivory border-b border-ivory/10"
      >
        <div className="announcement-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <span key={copy} className="announcement-message tracking-[0.2em] font-light">
              {announcement?.heading ||
                'COMPLIMENTARY INSURED PAN-INDIA DELIVERY ON ORDERS ABOVE ₹1,999 · ARTISANAL WEAVES, FINE JEWELLERY & LUXURY BEDDING · VJ COLLECTION PRESENTS LITTLE LOOM'}
            </span>
          ))}
        </div>
      </div>

      {/* Main Luxury Header */}
      <header
        className={`sticky top-0 z-40 bg-ivory/95 backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'border-b border-charcoal/10 shadow-sm py-2' : 'border-b border-charcoal/8 py-3'
        }`}
        onMouseLeave={handleMouseLeave}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            {/* Left: Mobile Toggle & Desktop Quick Links */}
            <div className="flex items-center gap-4 lg:flex-1">
              <button
                onClick={openMobileNav}
                aria-label="Open navigation menu"
                className="lg:hidden min-h-11 min-w-11 -ml-2 inline-flex items-center justify-center text-charcoal hover:text-clay transition-colors"
              >
                <Menu size={22} />
              </button>

              <div className="hidden lg:flex items-center gap-6 text-xs uppercase tracking-widest text-charcoal-soft">
                <Link
                  to="/shop"
                  className="hover:text-charcoal transition-colors hover:underline underline-offset-4"
                >
                  All Collections
                </Link>
                <Link
                  to="/#brand-story"
                  className="hover:text-charcoal transition-colors hover:underline underline-offset-4"
                >
                  Heritage
                </Link>
              </div>
            </div>

            {/* Center: Grand Master Brand Identity */}
            <div className="flex flex-col items-center text-center">
              <Link to="/" className="group flex flex-col items-center">
                <span className="font-serif text-2xl sm:text-3xl lg:text-[32px] font-light tracking-[0.22em] text-charcoal transition-colors group-hover:text-clay leading-tight">
                  VJ COLLECTION
                </span>
                <span className="text-[9px] uppercase tracking-[0.28em] text-charcoal-light font-medium mt-0.5">
                  Jewellery · Suits & Fabrics · Living · Little Loom
                </span>
              </Link>
            </div>

            {/* Right: Search, Account, Wishlist, Cart */}
            <div className="flex items-center gap-1 sm:gap-2 lg:flex-1 justify-end">
              <button
                onClick={openSearch}
                aria-label="Search all departments"
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full text-charcoal hover:text-clay hover:bg-charcoal/5 transition-colors"
              >
                <Search size={18} />
              </button>

              <Link
                to="/account"
                aria-label="My Account"
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full text-charcoal hover:text-clay hover:bg-charcoal/5 transition-colors hidden sm:inline-flex"
              >
                <User size={18} />
              </Link>

              <Link
                to="/wishlist"
                aria-label="My Wishlist"
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full text-charcoal hover:text-clay hover:bg-charcoal/5 transition-colors relative hidden sm:inline-flex"
              >
                <Heart size={18} />
                {wishlist.length > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-clay text-[9px] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <button
                onClick={openCart}
                aria-label="Shopping bag"
                className="min-h-10 px-2.5 sm:px-3 inline-flex items-center gap-2 rounded-full border border-charcoal/15 bg-white/80 text-charcoal hover:border-charcoal hover:bg-white transition-all shadow-xs"
              >
                <ShoppingBag size={17} />
                <span className="text-xs font-medium hidden sm:inline">Bag</span>
                {cartCount > 0 && (
                  <span
                    key={cartPulse}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-charcoal text-[9px] font-bold text-cream animate-pulse-badge"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Department Bar (Desktop primary navigation) */}
          <nav className="hidden lg:flex items-center justify-center gap-8 xl:gap-12 pt-3 mt-2 border-t border-charcoal/8">
            {departments.map((dept) => {
              const active = isDeptActive(dept.id);
              return (
                <div
                  key={dept.id}
                  className="relative py-1"
                  onMouseEnter={() => handleMouseEnter(dept.id)}
                >
                  <Link
                    to={dept.landingPath}
                    className={`inline-flex items-center gap-1.5 text-xs uppercase tracking-[0.18em] font-medium transition-all ${
                      active || activeDropdown === dept.id
                        ? 'text-charcoal font-semibold'
                        : 'text-charcoal-soft hover:text-charcoal'
                    }`}
                  >
                    {dept.id === 'jewellery' && <Gem size={13} className="text-[#C5A059]" />}
                    {dept.id === 'women_suits' && <Shirt size={13} className="text-[#B25E46]" />}
                    {dept.id === 'home_textiles' && <Home size={13} className="text-[#3E5C76]" />}
                    {dept.id === 'kids' && <Baby size={13} className="text-[#C9826B]" />}
                    <span>{dept.brand}</span>
                    <ChevronDown size={12} className={`transition-transform duration-200 ${activeDropdown === dept.id ? 'rotate-180' : ''}`} />
                  </Link>

                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 ${
                      active
                        ? 'bg-charcoal scale-x-100'
                        : activeDropdown === dept.id
                          ? 'bg-charcoal/40 scale-x-100'
                          : 'bg-transparent scale-x-0'
                    }`}
                  />
                </div>
              );
            })}
          </nav>
        </div>

        {/* Mega Menu Dropdown */}
        {activeDropdown && (
          <div
            className="absolute left-0 right-0 top-full bg-white/98 backdrop-blur-md border-b border-charcoal/10 shadow-xl transition-all duration-300 animate-slide-down"
            onMouseEnter={() => {
              if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="mx-auto max-w-7xl px-6 py-8">
              {departments
                .filter((d) => d.id === activeDropdown)
                .map((dept) => {
                  const categories = getCategoriesForDepartment(dept.id);
                  return (
                    <div key={dept.id} className="grid grid-cols-12 gap-8 items-start">
                      {/* Left: Department Overview & Landing CTA */}
                      <div className="col-span-4 pr-6 border-r border-charcoal/10">
                        <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-clay flex items-center gap-1.5">
                          <Sparkles size={12} />
                          Department Edit
                        </span>
                        <h3 className="mt-2 font-serif text-2xl font-light text-charcoal">{dept.brand}</h3>
                        <p className="mt-2 text-xs text-charcoal-soft leading-relaxed">{dept.description}</p>

                        <div className="mt-6 flex flex-col gap-2.5">
                          <Link
                            to={dept.landingPath}
                            className="inline-flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-charcoal hover:text-clay p-2.5 rounded-lg bg-ivory border border-charcoal/8 transition-colors"
                          >
                            <span>Explore {dept.brand} Landing</span>
                            <ArrowRight size={14} />
                          </Link>
                          <Link
                            to={dept.path}
                            className="inline-flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-charcoal-soft hover:text-charcoal p-2.5 rounded-lg border border-charcoal/8 hover:bg-ivory transition-colors"
                          >
                            <span>Browse All Products in {dept.brand}</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>

                      {/* Right: Curated Category Links */}
                      <div className="col-span-8">
                        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal-light mb-4">
                          Shop by Category
                        </p>
                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {categories.map((cat) => (
                            <Link
                              key={cat.slug}
                              to={`/shop?department=${dept.id}&category=${encodeURIComponent(cat.slug)}`}
                              className="group block p-3.5 rounded-xl border border-charcoal/5 bg-ivory/60 hover:bg-white hover:border-charcoal/20 hover:shadow-xs transition-all"
                            >
                              <h4 className="font-serif text-base font-medium text-charcoal group-hover:text-clay transition-colors">
                                {cat.label}
                              </h4>
                              <p className="mt-1 text-[11px] text-charcoal-soft leading-snug line-clamp-2">
                                {cat.introduction}
                              </p>
                              <span className="mt-2.5 inline-flex items-center gap-1 text-[11px] font-medium text-charcoal/70 group-hover:text-charcoal transition-colors">
                                View collection <ArrowRight size={11} className="transition-transform group-hover:translate-x-0.5" />
                              </span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        )}
      </header>
    </>
  );
}
