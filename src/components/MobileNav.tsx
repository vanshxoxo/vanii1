import { useState, useEffect } from 'react';
import { X, ChevronDown, ChevronRight, Gem, Shirt, Home, Baby, ArrowRight } from 'lucide-react';
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
        return <Gem size={16} className="text-[#C5A059]" />;
      case 'women_suits':
        return <Shirt size={16} className="text-[#B25E46]" />;
      case 'home_textiles':
        return <Home size={16} className="text-[#3E5C76]" />;
      case 'kids':
        return <Baby size={16} className="text-[#C9826B]" />;
    }
  };

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm animate-fade-in"
        onClick={closeMobileNav}
      />

      {/* Drawer */}
      <div className="absolute left-0 top-0 bottom-0 w-[88%] max-w-sm bg-ivory animate-slide-in-right flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-charcoal/10 bg-white">
          <div className="flex flex-col">
            <span className="font-serif text-lg tracking-[0.16em] font-light text-charcoal">VJ COLLECTION</span>
            <span className="text-[8px] uppercase tracking-[0.2em] text-charcoal-light">Master Retail House</span>
          </div>
          <button
            onClick={closeMobileNav}
            aria-label="Close menu"
            className="p-2 -mr-2 text-charcoal hover:text-clay transition-colors"
          >
            <X size={22} />
          </button>
        </div>

        {/* Scrollable Navigation Body */}
        <div className="flex-1 overflow-y-auto px-5 py-6">
          {/* Search Trigger */}
          <button
            onClick={() => {
              closeMobileNav();
              openSearch();
            }}
            className="w-full flex items-center justify-between px-4 py-2.5 rounded-xl border border-charcoal/15 bg-white text-xs text-charcoal-soft mb-6 shadow-xs hover:border-charcoal transition-colors"
          >
            <span>Search products across all departments…</span>
            <span className="text-[10px] uppercase font-bold text-clay">Search</span>
          </button>

          {/* Department Accordions */}
          <div className="mb-6">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-charcoal-light mb-3">
              Explore Departments
            </p>

            <div className="space-y-2">
              {departments.map((dept) => {
                const isOpen = openDept === dept.id;
                const categories = getCategoriesForDepartment(dept.id);
                return (
                  <div
                    key={dept.id}
                    className="rounded-xl border border-charcoal/10 bg-white overflow-hidden transition-all"
                  >
                    <button
                      onClick={() => toggleDept(dept.id)}
                      className="w-full flex items-center justify-between p-3.5 text-left text-sm font-medium text-charcoal"
                    >
                      <span className="flex items-center gap-2.5">
                        {getDeptIcon(dept.id)}
                        <span>{dept.brand}</span>
                      </span>
                      <ChevronDown
                        size={16}
                        className={`text-charcoal-light transition-transform duration-200 ${isOpen ? 'rotate-180 text-clay' : ''}`}
                      />
                    </button>

                    {isOpen && (
                      <div className="px-4 pb-4 pt-1 border-t border-charcoal/5 bg-ivory/50 space-y-2.5 animate-slide-down">
                        <p className="text-[11px] text-charcoal-soft leading-relaxed">{dept.tagline}</p>

                        <div className="pt-2 flex flex-col gap-1.5 border-t border-charcoal/8">
                          <Link
                            to={dept.landingPath}
                            onClick={closeMobileNav}
                            className="inline-flex items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider text-charcoal hover:text-clay"
                          >
                            <span>{dept.brand} Landing Page</span>
                            <ArrowRight size={13} />
                          </Link>
                          <Link
                            to={dept.path}
                            onClick={closeMobileNav}
                            className="inline-flex items-center justify-between py-1 text-xs font-semibold uppercase tracking-wider text-charcoal-soft hover:text-charcoal"
                          >
                            <span>View All Products</span>
                            <ArrowRight size={13} />
                          </Link>
                        </div>

                        {/* Department categories */}
                        <div className="pt-2 border-t border-charcoal/8">
                          <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-light mb-1.5">
                            Categories
                          </p>
                          <ul className="space-y-1">
                            {categories.map((cat) => (
                              <li key={cat.slug}>
                                <Link
                                  to={`/shop?department=${dept.id}&category=${encodeURIComponent(cat.slug)}`}
                                  onClick={closeMobileNav}
                                  className="block py-1 text-xs text-charcoal-soft hover:text-charcoal"
                                >
                                  {cat.label}
                                </Link>
                              </li>
                            ))}
                          </ul>
                        </div>

                        {/* Little Loom Age Links */}
                        {dept.id === 'kids' && (
                          <div className="pt-2 border-t border-charcoal/8">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-light mb-1.5">
                              Shop by Age
                            </p>
                            <div className="grid grid-cols-2 gap-1.5">
                              {ageNavigation.map((age) => (
                                <Link
                                  key={age.key}
                                  to={`/shop?department=kids&age=${encodeURIComponent(age.key)}`}
                                  onClick={closeMobileNav}
                                  className="text-[11px] p-1.5 rounded-md bg-white border border-charcoal/5 text-charcoal-soft hover:text-charcoal"
                                >
                                  {age.label} ({age.range})
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

          {/* Quick Store Links */}
          <div className="mb-6 pt-4 border-t border-charcoal/10">
            <p className="text-[10px] font-bold uppercase tracking-[0.22em] text-charcoal-light mb-2">
              Collections & Heritage
            </p>
            <ul className="space-y-2 text-sm text-charcoal-soft">
              <li>
                <Link
                  to="/shop"
                  onClick={closeMobileNav}
                  className="flex items-center justify-between py-1.5 hover:text-charcoal"
                >
                  <span>All Collections</span>
                  <ChevronRight size={14} />
                </Link>
              </li>
              <li>
                <Link
                  to="/#brand-story"
                  onClick={closeMobileNav}
                  className="flex items-center justify-between py-1.5 hover:text-charcoal"
                >
                  <span>Our Heritage & Craft</span>
                  <ChevronRight size={14} />
                </Link>
              </li>
              <li>
                <Link
                  to="/shipping"
                  onClick={closeMobileNav}
                  className="flex items-center justify-between py-1.5 hover:text-charcoal"
                >
                  <span>Shipping & Concierge</span>
                  <ChevronRight size={14} />
                </Link>
              </li>
            </ul>
          </div>

          {/* User Links */}
          <div className="pt-4 border-t border-charcoal/10 flex flex-col gap-2.5">
            <Link
              to="/wishlist"
              onClick={closeMobileNav}
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-charcoal/10 text-xs font-semibold uppercase tracking-wider text-charcoal hover:bg-ivory"
            >
              <span>Saved Wishlist</span>
              <ChevronRight size={14} />
            </Link>
            <Link
              to="/account"
              onClick={closeMobileNav}
              className="flex items-center justify-between p-3 rounded-xl bg-white border border-charcoal/10 text-xs font-semibold uppercase tracking-wider text-charcoal hover:bg-ivory"
            >
              <span>Account & Orders</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
