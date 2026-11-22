import { Link, useLocation } from 'react-router-dom';
import {
  Search,
  User,
  Heart,
  ShoppingBag,
  Menu,
  ChevronDown,
  ArrowRight,
  Sparkles,
  Gem,
  Shirt,
  Home,
  Baby,
} from 'lucide-react';
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
  const headerRef = useRef<HTMLElement>(null);
  const dropdownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const announcement = useCmsSection('announcement');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Close dropdown on route change
  useEffect(() => {
    setActiveDropdown(null);
  }, [location.pathname, location.search]);

  // Close on Escape key press
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setActiveDropdown(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleMouseEnter = (deptId: Department) => {
    if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
    setActiveDropdown(deptId);
  };

  const handleMouseLeave = () => {
    dropdownTimeoutRef.current = setTimeout(() => {
      setActiveDropdown(null);
    }, 180);
  };

  const isDeptActive = (deptId: Department) => {
    return (
      location.pathname === `/department/${deptId}` ||
      (location.pathname === '/shop' && location.search.includes(`department=${deptId}`))
    );
  };

  const getDeptColor = (deptId: Department) => {
    switch (deptId) {
      case 'jewellery':
        return '#C29F58';
      case 'women_suits':
        return '#B85D43';
      case 'home_textiles':
        return '#1B3B2B';
      case 'kids':
        return '#C87D65';
    }
  };

  return (
    <>
      {/* 1. Top Luxury Announcement Bar */}
      <div
        role="region"
        aria-label="VJ Collection Announcement"
        className="announcement-bar bg-espresso text-ivory/95 border-b border-espresso/20 select-none z-50 relative"
      >
        <div className="announcement-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <span key={copy} className="announcement-message font-normal">
              {announcement?.heading ||
                'COMPLIMENTARY INSURED PAN-INDIA DELIVERY ON ORDERS ABOVE ₹1,999 · HEIRLOOM JEWELLERY · UNSTITCHED HANDLOOM SUITS · SANCTUARY LIVING · LITTLE LOOM CHILDRENSWEAR'}
            </span>
          ))}
        </div>
      </div>

      {/* 2. Main Luxury Header */}
      <header
        ref={headerRef}
        className={`sticky top-0 z-50 bg-[#FAF8F5] transition-shadow duration-300 ${
          scrolled ? 'shadow-md border-b border-espresso/12' : 'border-b border-espresso/8'
        }`}
        onMouseLeave={handleMouseLeave}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Upper Nav Row: Quick Links, Master Brand Wordmark, Actions */}
          <div className="flex items-center justify-between h-20">
            {/* Left: Mobile Toggle & Desktop Editorial Links */}
            <div className="flex items-center gap-6 lg:flex-1">
              <button
                onClick={openMobileNav}
                aria-label="Open navigation menu"
                className="lg:hidden min-h-11 min-w-11 -ml-2 inline-flex items-center justify-center text-espresso hover:text-terracotta transition-colors"
              >
                <Menu size={22} />
              </button>

              <div className="hidden lg:flex items-center gap-7 text-[11px] uppercase tracking-[0.2em] font-medium text-espresso-soft">
                <Link
                  to="/shop"
                  className="hover:text-espresso transition-colors hover:underline underline-offset-4"
                >
                  Storefront Catalogue
                </Link>
                <Link
                  to="/#brand-story"
                  className="hover:text-espresso transition-colors hover:underline underline-offset-4"
                >
                  Our Heritage
                </Link>
              </div>
            </div>

            {/* Center: Grand VJ Collection Master Brand Identity */}
            <div className="flex flex-col items-center text-center">
              <Link to="/" className="group flex flex-col items-center">
                <span className="font-serif text-2xl sm:text-3xl lg:text-[30px] font-light tracking-[0.24em] text-espresso leading-none transition-colors group-hover:text-forest">
                  VJ COLLECTION
                </span>
                <span className="text-[9px] uppercase tracking-[0.32em] text-espresso-light font-medium mt-1.5 flex items-center gap-1.5">
                  <span>Jewellery</span>
                  <span className="text-brass">·</span>
                  <span>Suits & Fabrics</span>
                  <span className="text-brass">·</span>
                  <span>Living</span>
                  <span className="text-brass">·</span>
                  <span>Little Loom</span>
                </span>
              </Link>
            </div>

            {/* Right: Search, Account, Wishlist, Cart */}
            <div className="flex items-center gap-1 sm:gap-2.5 lg:flex-1 justify-end">
              <button
                onClick={openSearch}
                aria-label="Search all departments"
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full text-espresso hover:text-terracotta hover:bg-espresso/5 transition-colors"
              >
                <Search size={18} />
              </button>

              <Link
                to="/account"
                aria-label="My Account"
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full text-espresso hover:text-terracotta hover:bg-espresso/5 transition-colors hidden sm:inline-flex"
              >
                <User size={18} />
              </Link>

              <Link
                to="/wishlist"
                aria-label="My Wishlist"
                className="min-h-10 min-w-10 inline-flex items-center justify-center rounded-full text-espresso hover:text-terracotta hover:bg-espresso/5 transition-colors relative hidden sm:inline-flex"
              >
                <Heart size={18} />
                {wishlist.length > 0 && (
                  <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-terracotta text-[9px] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>

              <button
                onClick={openCart}
                aria-label="Shopping bag"
                className="min-h-10 px-3 sm:px-3.5 inline-flex items-center gap-2 rounded-full border border-espresso/15 bg-white text-espresso hover:border-espresso hover:bg-ivory transition-all shadow-xs"
              >
                <ShoppingBag size={17} />
                <span className="text-xs font-semibold uppercase tracking-wider hidden sm:inline">Bag</span>
                {cartCount > 0 && (
                  <span
                    key={cartPulse}
                    className="flex h-4 w-4 items-center justify-center rounded-full bg-espresso text-[9px] font-bold text-ivory animate-pulse-badge"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>

          {/* Lower Nav Row: Department Anchor Bar (Desktop) */}
          <nav className="hidden lg:flex items-center justify-center gap-10 xl:gap-14 py-2.5 border-t border-espresso/8">
            {departments.map((dept) => {
              const active = isDeptActive(dept.id);
              const isOpen = activeDropdown === dept.id;
              const deptColor = getDeptColor(dept.id);

              return (
                <div
                  key={dept.id}
                  className="relative py-1"
                  onMouseEnter={() => handleMouseEnter(dept.id)}
                >
                  <Link
                    to={dept.landingPath}
                    className={`inline-flex items-center gap-2 text-xs uppercase tracking-[0.2em] font-medium transition-all ${
                      active || isOpen
                        ? 'text-espresso font-semibold'
                        : 'text-espresso-soft hover:text-espresso'
                    }`}
                  >
                    {dept.id === 'jewellery' && <Gem size={13} style={{ color: deptColor }} />}
                    {dept.id === 'women_suits' && <Shirt size={13} style={{ color: deptColor }} />}
                    {dept.id === 'home_textiles' && <Home size={13} style={{ color: deptColor }} />}
                    {dept.id === 'kids' && <Baby size={13} style={{ color: deptColor }} />}
                    <span>{dept.brand}</span>
                    <ChevronDown
                      size={12}
                      className={`transition-transform duration-200 ${isOpen ? 'rotate-180 text-espresso' : 'text-espresso-light'}`}
                    />
                  </Link>

                  {/* Underline Indicator */}
                  <span
                    className={`absolute bottom-0 left-0 right-0 h-0.5 transition-all duration-300 ${
                      active
                        ? 'bg-espresso scale-x-100'
                        : isOpen
                        ? 'bg-brass scale-x-100'
                        : 'bg-transparent scale-x-0'
                    }`}
                  />
                </div>
              );
            })}
          </nav>
        </div>

        {/* 3. The Mega Menu Dropdown Panel (100% Solid Opaque Luxury Panel) */}
        {activeDropdown && (
          <div
            className="absolute left-0 right-0 top-full bg-[#FAF8F5] border-b border-espresso/15 shadow-2xl z-50 animate-slide-down"
            onMouseEnter={() => {
              if (dropdownTimeoutRef.current) clearTimeout(dropdownTimeoutRef.current);
            }}
            onMouseLeave={handleMouseLeave}
          >
            <div className="mx-auto max-w-7xl px-6 lg:px-8 py-8">
              {departments
                .filter((d) => d.id === activeDropdown)
                .map((dept) => {
                  const categories = getCategoriesForDepartment(dept.id);
                  const deptColor = getDeptColor(dept.id);

                  return (
                    <div key={dept.id} className="grid grid-cols-12 gap-8 items-start">
                      {/* Left: Department Editorial Spotlight Card (4 columns) */}
                      <div className="col-span-4 pr-6 border-r border-espresso/10">
                        <div className="relative overflow-hidden rounded-xl border border-espresso/10 aspect-[16/9] mb-4 bg-linen">
                          <img
                            src={dept.image}
                            alt={`${dept.brand} editorial banner`}
                            className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                          />
                          <div className="absolute top-2.5 left-2.5">
                            <span
                              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-semibold uppercase tracking-[0.18em] bg-[#FAF8F5]/95 text-espresso shadow-xs border border-espresso/10"
                            >
                              <Sparkles size={11} style={{ color: deptColor }} />
                              {dept.brand}
                            </span>
                          </div>
                        </div>

                        <h3 className="font-serif text-2xl font-light text-espresso leading-snug">
                          {dept.brand}
                        </h3>
                        <p className="mt-2 text-xs text-espresso-soft leading-relaxed">
                          {dept.description}
                        </p>

                        <div className="mt-5 flex flex-col gap-2">
                          <Link
                            to={dept.landingPath}
                            onClick={() => setActiveDropdown(null)}
                            className="inline-flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso p-2.5 rounded-lg bg-white border border-espresso/10 hover:border-espresso hover:bg-ivory transition-all shadow-xs"
                          >
                            <span>Explore {dept.brand} Showcase</span>
                            <ArrowRight size={14} />
                          </Link>
                          <Link
                            to={dept.path}
                            onClick={() => setActiveDropdown(null)}
                            className="inline-flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso-soft hover:text-espresso p-2.5 rounded-lg border border-espresso/10 hover:bg-white transition-colors"
                          >
                            <span>View All Products in {dept.brand}</span>
                            <ArrowRight size={14} />
                          </Link>
                        </div>
                      </div>

                      {/* Right: Curated Category Gallery (8 columns) */}
                      <div className="col-span-8">
                        <div className="flex items-center justify-between mb-4 pb-2 border-b border-espresso/8">
                          <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-espresso-light">
                            Shop by Category
                          </p>
                          <Link
                            to={dept.path}
                            onClick={() => setActiveDropdown(null)}
                            className="text-[11px] font-medium text-espresso hover:underline underline-offset-4"
                          >
                            Browse All &rarr;
                          </Link>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
                          {categories.map((cat) => (
                            <Link
                              key={cat.slug}
                              to={`/shop?department=${dept.id}&category=${encodeURIComponent(cat.slug)}`}
                              onClick={() => setActiveDropdown(null)}
                              className="group block rounded-xl border border-espresso/8 bg-white p-3 hover:border-espresso/30 hover:shadow-sm transition-all"
                            >
                              {cat.image && (
                                <div className="aspect-[4/3] rounded-lg overflow-hidden bg-linen mb-2.5 border border-espresso/6">
                                  <img
                                    src={cat.image}
                                    alt={cat.label}
                                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                    loading="lazy"
                                  />
                                </div>
                              )}
                              <h4 className="font-serif text-sm font-medium text-espresso group-hover:text-forest transition-colors leading-tight">
                                {cat.label}
                              </h4>
                              <p className="mt-1 text-[11px] text-espresso-soft line-clamp-2 leading-relaxed">
                                {cat.introduction}
                              </p>
                              <span className="mt-2 inline-flex items-center gap-1 text-[10px] uppercase font-semibold tracking-wider text-espresso/70 group-hover:text-espresso transition-colors">
                                View Collection <ArrowRight size={10} className="transition-transform group-hover:translate-x-0.5" />
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

      {/* 4. Backdrop Scrim (Prevents hero bleed-through and provides focused overlay) */}
      {activeDropdown && (
        <div
          className="fixed inset-0 top-[120px] bg-espresso/35 backdrop-blur-[2px] z-40 transition-opacity duration-300 pointer-events-auto"
          onClick={() => setActiveDropdown(null)}
          aria-hidden="true"
        />
      )}
    </>
  );
}
