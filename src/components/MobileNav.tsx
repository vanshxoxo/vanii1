import { useState, useEffect } from 'react';
import { X, ChevronDown, Gem, Shirt, Home, Baby, ArrowRight, Search } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../useStore';
import { departments, getCategoriesForDepartment, ageNavigation } from '../data/storeNavigation';
import type { Department } from '../types';

export default function MobileNav() {
  const { isMobileNavOpen, closeMobileNav, openSearch } = useStore();
  const [openDept, setOpenDept] = useState<Department | null>(null);

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
      setOpenDept(null);
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  if (!isMobileNavOpen) return null;

  const toggleDept = (dept: Department) => {
    setOpenDept(openDept === dept ? null : dept);
  };

  const getDeptIcon = (id: Department) => {
    switch (id) {
      case 'jewellery':
        return <Gem size={17} className="text-brass" />;
      case 'women_suits':
        return <Shirt size={17} className="text-terracotta" />;
      case 'home_textiles':
        return <Home size={17} className="text-forest" />;
      case 'kids':
        return <Baby size={17} className="text-[#C87D65]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-espresso/60 backdrop-blur-sm animate-fade-in"
        onClick={closeMobileNav}
        aria-hidden="true"
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-[88%] max-w-sm bg-[#FAF8F5] animate-slide-in-right flex flex-col shadow-2xl border-r border-espresso/15">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 h-18 border-b border-espresso/10 bg-white">
          <div className="flex flex-col">
            <span className="font-serif text-lg tracking-[0.2em] font-light text-espresso">
              VJ COLLECTION
            </span>
            <span className="text-[8px] uppercase tracking-[0.26em] text-espresso-light font-medium">
              Flagship Retail House
            </span>
          </div>
          <button
            onClick={closeMobileNav}
            aria-label="Close menu"
            className="min-h-11 min-w-11 -mr-2 inline-flex items-center justify-center text-espresso hover:text-terracotta transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Instant Search Trigger */}
          <button
            onClick={() => {
              closeMobileNav();
              openSearch();
            }}
            className="w-full flex items-center justify-between px-4 py-3 rounded-xl border border-espresso/15 bg-white text-xs text-espresso-soft mb-6 shadow-xs hover:border-espresso transition-colors min-h-11"
          >
            <span className="flex items-center gap-2">
              <Search size={15} className="text-espresso-light" />
              <span>Search all 4 departments…</span>
            </span>
            <span className="text-[10px] uppercase font-bold text-terracotta tracking-wider">Search</span>
          </button>

          {/* Department Accordions */}
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.24em] text-espresso-light mb-3 px-1">
              Departments
            </p>

            <div className="space-y-2.5">
              {departments.map((dept) => {
                const isOpen = openDept === dept.id;
                const categories = getCategoriesForDepartment(dept.id);
                return (
                  <div
                    key={dept.id}
                    className="rounded-xl border border-espresso/10 bg-white overflow-hidden transition-all shadow-xs"
                  >
                    <button
                      onClick={() => toggleDept(dept.id)}
                      className="w-full flex items-center justify-between p-4 text-left text-sm font-medium text-espresso min-h-12"
                    >
                      <span className="flex items-center gap-3">
                        <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-linen">
                          {getDeptIcon(dept.id)}
                        </span>
                        <span className="font-serif text-base tracking-wide">{dept.brand}</span>
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-espresso-light transition-transform duration-200 ${isOpen ? 'rotate-180 text-terracotta' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-espresso/8 bg-linen/50 space-y-3 animate-slide-down">
                        <p className="text-[11px] text-espresso-soft leading-relaxed">{dept.description}</p>

                        <div className="pt-2 flex flex-col gap-2 border-t border-espresso/8">
                          <Link
                            to={dept.landingPath}
                            onClick={closeMobileNav}
                            className="inline-flex items-center justify-between py-1.5 px-2.5 rounded-lg bg-white text-xs font-semibold uppercase tracking-wider text-espresso border border-espresso/8 hover:text-terracotta shadow-xs"
                          >
                            <span>Explore {dept.brand}</span>
                            <ArrowRight size={13} />
                          </Link>
                          <Link
                            to={dept.path}
                            onClick={closeMobileNav}
                            className="inline-flex items-center justify-between py-1.5 px-2.5 rounded-lg text-xs font-semibold uppercase tracking-wider text-espresso-soft hover:text-espresso"
                          >
                            <span>Browse All Products</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>

                        {/* Department categories */}
                        <div className="pt-2 border-t border-espresso/8">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-espresso-light mb-2">
                            Categories
                          </p>
                          <ul className="space-y-1.5">
                            {categories.map((cat) => (
                              <li key={cat.slug}>
                                <Link
                                  to={`/shop?department=${dept.id}&category=${encodeURIComponent(cat.slug)}`}
                                  onClick={closeMobileNav}
                                  className="flex items-center justify-between py-1 px-1.5 text-xs text-espresso-soft hover:text-espresso rounded hover:bg-white"
                                >
                                  <span>{cat.label}</span>
                                  <ArrowRight size={11} className="text-espresso-light" />
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Little Loom Age Milestones */}
                        {dept.id === 'kids' && (
                          <div className="pt-2 border-t border-espresso/8">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-espresso-light mb-2">
                              Shop by Age Milestone
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {ageNavigation.map((age) => (
                                <Link
                                  key={age.key}
                                  to={`/shop?department=kids&age=${encodeURIComponent(age.key)}`}
                                  onClick={closeMobileNav}
                                  className="p-2 rounded-lg bg-white border border-espresso/8 text-[11px] text-espresso hover:border-espresso text-center"
                                >
                                  <span className="block font-medium">{age.label}</span>
                                  <span className="text-[9px] text-espresso-light">{age.range}</span>
                                </Link>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>

          {/* Editorial Quick Links */}
          <div className="pt-4 border-t border-espresso/10 space-y-2">
            <Link
              to="/shop"
              onClick={closeMobileNav}
              className="block py-2 text-xs font-semibold uppercase tracking-wider text-espresso hover:text-terracotta"
            >
              Full Store Catalogue
            </Link>
            <Link
              to="/#brand-story"
              onClick={closeMobileNav}
              className="block py-2 text-xs font-semibold uppercase tracking-wider text-espresso-soft hover:text-espresso"
            >
              Our Heritage & Craft
            </Link>
            <Link
              to="/account"
              onClick={closeMobileNav}
              className="block py-2 text-xs font-semibold uppercase tracking-wider text-espresso-soft hover:text-espresso"
            >
              My Account / Orders
            </Link>
            <Link
              to="/wishlist"
              onClick={closeMobileNav}
              className="block py-2 text-xs font-semibold uppercase tracking-wider text-espresso-soft hover:text-espresso"
            >
              Saved Wishlist
            </Link>
          </div>
        </div>

        {/* Footer info strip in mobile nav */}
        <div className="p-4 border-t border-espresso/10 bg-white text-center">
          <p className="text-[10px] uppercase tracking-widest text-espresso-light">
            VJ Collection &middot; Little Loom
          </p>
          <p className="text-[9px] text-espresso-light mt-0.5">Complimentary Insured Pan-India Shipping above ₹1,999</p>
        </div>
      </div>
    </div>
  );
}
