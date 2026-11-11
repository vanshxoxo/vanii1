import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { launchAssortment, toLaunchPreviewProduct } from '../data/launchAssortment';
import { ageNavigation, resolveLaunchAge, resolveLaunchCategory, type LaunchAgeKey } from '../data/storeNavigation';

type Props = {
  category?: string;
  age?: string;
  search?: string;
  onSearchChange?: (value: string) => void;
};

export default function LaunchPreviewGrid({ category, age, search = '', onSearchChange }: Props) {
  const activeCategory = resolveLaunchCategory(category);
  const activeAge = resolveLaunchAge(age);
  const visibleStyles = useMemo(() => {
    const query = search.trim().toLowerCase();
    const hasCategoryFilter = Boolean(category?.trim());
    const hasAgeFilter = Boolean(age?.trim());
    return launchAssortment.filter((style) => {
      const categoryMatches = !hasCategoryFilter || Boolean(activeCategory && style.categorySlug === activeCategory.slug);
      const ageMatches = !hasAgeFilter || Boolean(activeAge && style.ageSuggestions.includes(activeAge.key as LaunchAgeKey));
      const suggestedAgeLabels = style.ageSuggestions.map((key) => ageNavigation.find((entry) => entry.key === key)?.label || '').join(' ').toLowerCase();
      const searchMatches = !query || style.name.toLowerCase().includes(query) || style.category.toLowerCase().includes(query) || suggestedAgeLabels.includes(query);
      return categoryMatches && ageMatches && searchMatches;
    });
  }, [activeAge, activeCategory, age, category, search]);

  return (
    <section aria-label="Little Loom styles under review">
      <div className="mb-5 rounded-xl border border-ink/10 bg-[#f8f4f0] p-4 sm:p-5">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-peach">Collection in review</p>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-ink-soft sm:text-sm sm:leading-6">
          Supplier details, pricing, sizing and exact product photographs are still being confirmed. These styles are not available to order yet.
        </p>
      </div>
      <div className="mb-5 flex flex-col gap-3 border-y border-ink/10 py-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-xs text-ink-soft">{visibleStyles.length} proposed style{visibleStyles.length === 1 ? '' : 's'}</p>
        {onSearchChange && <label className="sr-only" htmlFor="launch-preview-search">Search proposed styles</label>}
        {onSearchChange && <input id="launch-preview-search" type="search" value={search} onChange={(event) => onSearchChange(event.target.value)} placeholder="Search proposed styles" className="min-h-10 rounded-lg border border-ink/15 bg-transparent px-3 text-sm outline-none focus:border-ink" />}
      </div>

      {visibleStyles.length ? <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 xl:grid-cols-5">
        {visibleStyles.map((item) => {
          const productUrl = `/products/${toLaunchPreviewProduct(item).slug}`;
          return <article key={item.key} className="min-w-0">
            <div className="relative overflow-hidden rounded-xl bg-cream sm:rounded-2xl">
              <Link to={productUrl} aria-label={`View proposed style ${item.name}`} className="block">
                <img src={item.image} alt={`Editorial clothing inspiration for ${item.name}; not an exact product photo`} loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover transition-transform duration-700 hover:scale-[1.025]" />
              </Link>
              <span className="pointer-events-none absolute left-2 top-2 rounded-full bg-ivory/95 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-ink sm:left-3 sm:top-3">Under review</span>
            </div>
            <div className="mt-3 flex min-h-[112px] flex-col sm:mt-4">
              <Link to={`/shop?category=${encodeURIComponent(item.category)}`} className="text-[9px] font-medium uppercase tracking-[0.18em] text-ink-light hover:text-ink sm:text-[10px]">{item.category}</Link>
              <h2 className="mt-1 font-serif text-base leading-snug text-ink sm:text-lg"><Link to={productUrl} className="hover:underline">{item.name}</Link></h2>
              <p className="mt-3 text-xs text-ink-light">Price to be confirmed</p>
              <div className="mt-2 flex flex-wrap gap-x-2 gap-y-1">
                {item.ageSuggestions.map((ageKey) => {
                  const suggestedAge = ageNavigation.find((entry) => entry.key === ageKey);
                  if (!suggestedAge) return null;
                  return <Link key={ageKey} to={`/shop?age=${encodeURIComponent(suggestedAge.value)}&category=${encodeURIComponent(item.category)}`} className="text-[10px] text-ink-soft underline decoration-ink/20 underline-offset-2 hover:text-ink">{suggestedAge.label}</Link>;
                })}
              </div>
              <Link to={productUrl} className="mt-3 inline-flex min-h-10 items-center text-xs font-medium text-ink underline decoration-ink/25 underline-offset-4 hover:decoration-ink">
                View style details
              </Link>
            </div>
          </article>;
        })}
      </div> : <div className="rounded-2xl bg-[#f8f4f0] px-5 py-12 text-center">
        <h2 className="font-serif text-xl text-ink">No proposed styles match this selection</h2>
        <p className="mt-2 text-sm text-ink-soft">Try another search or browse the full collection.</p>
        <Link to="/shop" className="mt-4 inline-flex text-sm underline underline-offset-4">View all proposed styles</Link>
      </div>}
    </section>
  );
}
