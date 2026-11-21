import { X, Search as SearchIcon, ArrowRight, Sparkles, Gem, Shirt, Home, Baby } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../useStore';
import { formatINR } from '../data';
import { useCatalog } from '../lib/catalog';
import { useEffect, useMemo, useRef, useState } from 'react';
import { departments, resolveDepartment } from '../data/storeNavigation';
import type { Department } from '../types';

export default function SearchOverlay() {
  const { products } = useCatalog();
  const { isSearchOpen, closeSearch } = useStore();
  const [query, setQuery] = useState('');
  const [selectedDept, setSelectedDept] = useState<Department | 'all'>('all');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
      setSelectedDept('all');
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isSearchOpen]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeSearch();
    };
    if (isSearchOpen) window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isSearchOpen, closeSearch]);

  const results = useMemo(() => {
    if (!query.trim() && selectedDept === 'all') return [];
    const q = query.toLowerCase().trim();

    return products
      .filter((p) => {
        const matchesDept = selectedDept === 'all' || (p.department || p.productType || 'kids') === selectedDept;
        if (!matchesDept) return false;
        if (!q) return true;

        const matchesName = p.name.toLowerCase().includes(q);
        const matchesCategory = p.category.toLowerCase().includes(q);
        const matchesDeptName = (p.department || '').toLowerCase().includes(q);
        const matchesFabric = (p.fabric || '').toLowerCase().includes(q);
        const matchesAges = p.ages.some((a) => a.toLowerCase().includes(q));
        const matchesTags = p.tags?.some((t) => t.toLowerCase().includes(q));

        return matchesName || matchesCategory || matchesDeptName || matchesFabric || matchesAges || matchesTags;
      })
      .slice(0, 8);
  }, [query, selectedDept, products]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-charcoal/60 backdrop-blur-md animate-fade-in"
        onClick={closeSearch}
      />

      {/* Search Sheet */}
      <div className="relative bg-ivory animate-slide-up max-h-[85vh] overflow-y-auto border-b border-charcoal/15 shadow-2xl">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 py-7">
          {/* Top Bar */}
          <div className="flex items-center justify-between pb-4 border-b border-charcoal/10">
            <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-clay flex items-center gap-1.5">
              <Sparkles size={13} />
              Search VJ Collection Flagship
            </span>
            <button
              onClick={closeSearch}
              aria-label="Close search"
              className="p-2 -mr-2 text-charcoal hover:text-clay transition-colors"
            >
              <X size={22} />
            </button>
          </div>

          {/* Search Input */}
          <div className="relative mt-6">
            <SearchIcon size={22} className="absolute left-0 top-1/2 -translate-y-1/2 text-charcoal-light" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search necklace sets, unstitched suits, cotton bedsheets, rompers..."
              className="w-full pl-9 pr-4 py-3.5 text-base sm:text-xl bg-transparent border-b-2 border-charcoal/20 focus:border-charcoal outline-none transition-colors font-serif placeholder:font-sans placeholder:text-sm sm:placeholder:text-base placeholder:text-charcoal-light text-charcoal"
            />
          </div>

          {/* Department Filter Pills */}
          <div className="mt-5 flex flex-wrap items-center gap-2">
            <span className="text-[11px] uppercase tracking-wider font-semibold text-charcoal-light mr-1">
              Filter by:
            </span>
            <button
              onClick={() => setSelectedDept('all')}
              className={`px-3 py-1 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                selectedDept === 'all'
                  ? 'bg-charcoal text-ivory shadow-xs'
                  : 'bg-white text-charcoal-soft border border-charcoal/15 hover:border-charcoal'
              }`}
            >
              All Departments
            </button>
            {departments.map((dept) => {
              const active = selectedDept === dept.id;
              return (
                <button
                  key={dept.id}
                  onClick={() => setSelectedDept(dept.id)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs uppercase tracking-wider font-semibold transition-all ${
                    active
                      ? 'bg-charcoal text-ivory shadow-xs'
                      : 'bg-white text-charcoal-soft border border-charcoal/15 hover:border-charcoal'
                  }`}
                >
                  {dept.id === 'jewellery' && <Gem size={11} className={active ? 'text-amber-300' : 'text-[#C5A059]'} />}
                  {dept.id === 'women_suits' && <Shirt size={11} className={active ? 'text-rose-200' : 'text-[#B25E46]'} />}
                  {dept.id === 'home_textiles' && <Home size={11} className={active ? 'text-sky-200' : 'text-[#3E5C76]'} />}
                  {dept.id === 'kids' && <Baby size={11} className={active ? 'text-orange-200' : 'text-[#C9826B]'} />}
                  <span>{dept.brand.replace('VJ ', '')}</span>
                </button>
              );
            })}
          </div>

          {/* Results Section */}
          {query.trim() && (
            <div className="mt-8 pt-6 border-t border-charcoal/10">
              {results.length === 0 ? (
                <div className="py-12 text-center">
                  <p className="font-serif text-xl text-charcoal">No pieces matching "{query}"</p>
                  <p className="mt-2 text-xs text-charcoal-soft max-w-sm mx-auto">
                    Try searching for "necklace", "cotton suit", "silk", "bedsheet", or "romper".
                  </p>
                </div>
              ) : (
                <>
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs uppercase tracking-wider font-semibold text-charcoal-light">
                      Found {results.length} piece{results.length > 1 ? 's' : ''}
                    </p>
                    <Link
                      to={`/shop?search=${encodeURIComponent(query)}`}
                      onClick={closeSearch}
                      className="text-xs font-semibold uppercase tracking-wider text-clay hover:text-charcoal inline-flex items-center gap-1"
                    >
                      View in full shop <ArrowRight size={13} />
                    </Link>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {results.map((product) => {
                      const dept = resolveDepartment(product.department || product.productType || 'kids');
                      return (
                        <Link
                          key={product.id}
                          to={`/product/${product.slug}`}
                          onClick={closeSearch}
                          className="flex items-center gap-4 p-3 rounded-2xl bg-white border border-charcoal/10 hover:border-charcoal/30 hover:shadow-xs transition-all"
                        >
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-18 w-14 rounded-xl object-cover bg-ivory shrink-0"
                          />
                          <div className="flex-1 min-w-0">
                            {dept && (
                              <span className="text-[10px] font-semibold uppercase tracking-wider text-clay block">
                                {dept.brand}
                              </span>
                            )}
                            <p className="font-serif text-sm font-medium text-charcoal truncate mt-0.5">
                              {product.name}
                            </p>
                            <p className="text-xs text-charcoal-light">{product.category}</p>
                            <p className="text-xs font-semibold text-charcoal mt-1">
                              {formatINR(product.price)}
                            </p>
                          </div>
                          <ArrowRight size={16} className="text-charcoal-light shrink-0" />
                        </Link>
                      );
                    })}
                  </div>
                </>
              )}
            </div>
          )}

          {/* Popular Search Suggestions (when input is empty) */}
          {!query.trim() && (
            <div className="mt-8 pt-6 border-t border-charcoal/10">
              <p className="text-xs uppercase tracking-wider font-semibold text-charcoal-light mb-3">
                Trending Inquiries
              </p>
              <div className="flex flex-wrap gap-2">
                {[
                  'Necklace Sets',
                  'Kundan Earrings',
                  'Artisanal Rings',
                  'Pure Cotton Suits',
                  'Banarasi Suits',
                  'Double Bedsheets',
                  '60x90 Chaddars',
                  'Pillow Covers',
                  'Organic Rompers',
                  'Newborn Gift Sets',
                ].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3.5 py-1.5 text-xs rounded-full bg-white border border-charcoal/15 text-charcoal-soft hover:text-charcoal hover:border-charcoal transition-colors"
                  >
                    {term}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
