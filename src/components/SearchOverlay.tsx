import { X, Search as SearchIcon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { products, formatINR } from '../data';
import { useEffect, useMemo, useRef, useState } from 'react';

export default function SearchOverlay() {
  const { isSearchOpen, closeSearch } = useStore();
  const [query, setQuery] = useState('');
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = 'hidden';
      setTimeout(() => inputRef.current?.focus(), 100);
    } else {
      document.body.style.overflow = '';
      setQuery('');
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
    if (!query.trim()) return [];
    const q = query.toLowerCase();
    return products
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          p.category.toLowerCase().includes(q) ||
          p.tags?.some((t) => t.toLowerCase().includes(q))
      )
      .slice(0, 6);
  }, [query]);

  if (!isSearchOpen) return null;

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={closeSearch} />
      <div className="relative bg-cream animate-slide-up max-h-[80vh] overflow-y-auto">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between mb-6">
            <span className="text-xs font-semibold uppercase tracking-wider text-ink-light">Search</span>
            <button onClick={closeSearch} aria-label="Close search" className="p-2 -mr-2 text-ink hover:text-peach">
              <X size={22} />
            </button>
          </div>

          <div className="relative">
            <SearchIcon size={20} className="absolute left-0 top-1/2 -translate-y-1/2 text-ink-light" />
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search for outfits, categories, ages..."
              className="w-full pl-8 pr-4 py-3 text-base bg-transparent border-b-2 border-ink/15 focus:border-ink outline-none transition-colors font-serif"
            />
          </div>

          {query.trim() && (
            <div className="mt-6">
              {results.length === 0 ? (
                <p className="text-sm text-ink-soft py-8 text-center">
                  No results for "{query}". Try searching for "romper", "dress", or "sleep".
                </p>
              ) : (
                <>
                  <p className="text-xs text-ink-light mb-3">
                    {results.length} result{results.length > 1 ? 's' : ''}
                  </p>
                  <ul className="flex flex-col gap-1">
                    {results.map((product) => (
                      <li key={product.id}>
                        <Link
                          to={`/product/${product.slug}`}
                          onClick={closeSearch}
                          className="flex items-center gap-4 p-2 rounded-lg hover:bg-ink/5 transition-colors"
                        >
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="h-16 w-14 rounded-md object-cover"
                          />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-ink truncate">{product.name}</p>
                            <p className="text-xs text-ink-light">{product.category}</p>
                          </div>
                          <span className="text-sm font-semibold text-ink">{formatINR(product.price)}</span>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </>
              )}
            </div>
          )}

          {!query.trim() && (
            <div className="mt-6">
              <p className="text-xs text-ink-light mb-3">Popular searches</p>
              <div className="flex flex-wrap gap-2">
                {['Rompers', 'Co-ord Sets', 'Dresses', 'Sleepwear', 'Newborn', 'Toddler'].map((term) => (
                  <button
                    key={term}
                    onClick={() => setQuery(term)}
                    className="px-3 py-1.5 text-sm bg-ink/5 text-ink-soft rounded-full hover:bg-ink/10 transition-colors"
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
