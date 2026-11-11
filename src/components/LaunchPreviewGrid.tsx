import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { launchAssortment, formatProposedPrice, toLaunchDemoProduct } from '../data/launchAssortment';
import { ageNavigation, resolveLaunchAge, resolveLaunchCategory, type LaunchAgeKey } from '../data/storeNavigation';

type PreviewSort = 'featured' | 'price-low' | 'price-high';

type Props = {
  category?: string;
  age?: string;
  search?: string;
  sort?: PreviewSort;
  onSearchChange?: (value: string) => void;
  onSortChange?: (value: PreviewSort) => void;
};

export default function LaunchPreviewGrid({ category, age, search = '', sort = 'featured', onSearchChange, onSortChange }: Props) {
  const activeCategory = resolveLaunchCategory(category);
  const activeAge = resolveLaunchAge(age);
  const visibleProducts = useMemo(() => {
    const query = search.trim().toLowerCase();
    const hasCategoryFilter = Boolean(category?.trim());
    const hasAgeFilter = Boolean(age?.trim());
    const products = launchAssortment.filter((product) => {
      const categoryMatches = !hasCategoryFilter || Boolean(activeCategory && product.categorySlug === activeCategory.slug);
      const ageMatches = !hasAgeFilter || Boolean(activeAge && product.ageSuggestions.includes(activeAge.key as LaunchAgeKey));
      const suggestedAgeLabels = product.ageSuggestions.map((key) => ageNavigation.find((entry) => entry.key === key)?.label || '').join(' ').toLowerCase();
      const searchMatches = !query || product.name.toLowerCase().includes(query) || product.category.toLowerCase().includes(query) || suggestedAgeLabels.includes(query);
      return categoryMatches && ageMatches && searchMatches;
    });

    if (sort === 'price-low') return products.sort((a, b) => a.price - b.price);
    if (sort === 'price-high') return products.sort((a, b) => b.price - a.price);
    return products;
  }, [activeAge, activeCategory, age, category, search, sort]);

  return (
    <section aria-label="Temporary Little Loom demo catalogue">
      <div className="mb-5 rounded-xl border border-ink/10 bg-[#f8f4f0] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-peach">Temporary demo storefront</p>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-ink-soft sm:text-sm sm:leading-6">
          These 18 catalogue styles are for preview only. Names and prices are indicative until supplier details are confirmed. The photographs are editorial inspiration, not exact product photos; sizes and colours on product pages are sample interface choices, and no real inventory is represented.
        </p>
      </div>
      <div className="mb-5 flex flex-col gap-3 border-y border-ink/10 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-soft">{visibleProducts.length} temporary demo style{visibleProducts.length === 1 ? '' : 's'}</p>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          {onSearchChange && <label className="sr-only" htmlFor="launch-preview-search">Search proposed styles</label>}
          {onSearchChange && <input id="launch-preview-search" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search styles" className="min-h-10 rounded-lg border border-ink/15 bg-transparent px-3 text-sm outline-none focus:border-ink" />}
          {onSortChange && <label className="flex items-center gap-2 text-xs text-ink-soft">Sort
            <select value={sort} onChange={(event) => onSortChange(event.target.value as PreviewSort)} className="min-h-10 rounded-lg border border-ink/15 bg-cream px-3 text-sm text-ink">
              <option value="featured">Featured</option>
              <option value="price-low">Price: low to high</option>
              <option value="price-high">Price: high to low</option>
            </select>
          </label>}
        </div>
      </div>

      {visibleProducts.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 xl:grid-cols-5">
        {visibleProducts.map((item) => {
          const productUrl = `/products/${toLaunchDemoProduct(item).slug}`;
          return <article key={item.key} className="min-w-0">
            <div className="relative overflow-hidden rounded-xl bg-cream sm:rounded-2xl">
              <Link to={productUrl} aria-label={`View temporary demo style ${item.name}`} className="block">
                <img src={item.image} alt={`Editorial clothing inspiration for ${item.name}; not an exact product photo`} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-[1.025]" />
              </Link>
              <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-ivory/95 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-ink sm:left-3 sm:top-3">Demo only</span>
            </div>
            <div className="mt-3 flex min-h-[112px] flex-col sm:mt-4">
              <Link to={`/shop?category=${encodeURIComponent(item.category)}`} className="text-[9px] font-medium uppercase tracking-[0.18em] text-ink-light hover:text-ink sm:text-[10px]">{item.category}</Link>
              <h2 className="mt-1 font-serif text-base leading-snug text-ink sm:text-lg"><Link to={productUrl} className="hover:underline">{item.name}</Link></h2>
              <div className="mt-auto flex items-end justify-between gap-2 pt-3">
                <span className="text-sm font-medium tabular-nums text-ink">{formatProposedPrice(item.price)}</span>
                <span className="text-[9px] uppercase tracking-[0.12em] text-ink-light">Proposed price</span>
              </div>
              <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                {item.ageSuggestions.map((ageKey) => {
                  const suggestedAge = ageNavigation.find((entry) => entry.key === ageKey);
                  if (!suggestedAge) return null;
                  return <Link key={ageKey} to={`/shop?age=${encodeURIComponent(suggestedAge.value)}&category=${encodeURIComponent(item.category)}`} className="text-[10px] text-ink-soft underline decoration-ink/20 underline-offset-2 hover:text-ink">{suggestedAge.label}</Link>;
                })}
              </div>
              <Link to={productUrl} className="mt-3 inline-flex min-h-10 items-center text-xs font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                View product details
              </Link>
            </div>
          </article>;
        })}
      </div> : <div className="rounded-2xl bg-[#f8f4f0] px-5 py-12 text-center">
        <h2 className="font-serif text-xl text-ink">No styles match this selection</h2>
        <p className="mt-2 text-sm text-ink-soft">Try another search or browse the full assortment.</p>
        <Link to="/shop" className="mt-4 inline-flex text-sm underline underline-offset-4">View all preview styles</Link>
      </div>}
    </section>
  );
}
