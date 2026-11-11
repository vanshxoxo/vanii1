import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Check, ChevronDown, Package, ArrowRight } from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import type { Product, AgeGroup, Category } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/ui';
import Button from '../components/Button';
import { useStore } from '../useStore';
import StoreNavigationTiles from '../components/StoreNavigationTiles';
import { categoryNavigation, resolveLaunchAge, resolveLaunchCategory } from '../data/storeNavigation';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest';

function ShopPageBanner({ eyebrow, title, introduction }: { eyebrow: string; title: string; introduction: string }) {
  return <section className="rounded-xl bg-[#f4eee8] px-5 py-5 sm:px-7 sm:py-6">
    <p className="text-xs font-medium uppercase tracking-[0.2em] text-peach">{eyebrow}</p>
    <h1 className="mt-2 font-serif text-3xl font-light leading-tight text-ink sm:text-4xl">{title}</h1>
    <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">{introduction}</p>
  </section>;
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>('featured');
  const { products, hasPublishedRecords, ages, categories, collections, loading: catalogLoading, error: catalogError } = useCatalog();
  const ageParam = searchParams.get('age') || '';
  const categoryParam = searchParams.get('category') || '';
  const collectionParam = searchParams.get('collection') || '';
  const searchQuery = searchParams.get('search') || '';
  const selectedLaunchAge = resolveLaunchAge(ageParam);
  const selectedLaunchCategory = resolveLaunchCategory(categoryParam);
  const actualAge = ages.find((age) => (selectedLaunchAge && resolveLaunchAge(age.label)?.key === selectedLaunchAge.key) || age.id.toLowerCase() === ageParam.toLowerCase());
  const actualCategory = categories.find((category) => (selectedLaunchCategory && resolveLaunchCategory(category.name)?.slug === selectedLaunchCategory.slug) || category.id.toLowerCase() === categoryParam.toLowerCase());
  const selectedCollection = collections.find((collection) => collection.slug.toLowerCase() === collectionParam.toLowerCase());
  const allSizes = [...new Set(products.flatMap((product) => product.sizes))];
  const allColors = [...new Map(products.flatMap((product) => product.colors.map((color) => [color.name, color] as const))).values()];
  const allAges: AgeGroup[] = ages.map((age) => age.id);
  const allCategories: Category[] = categories.map((category) => category.id);

  // Read initial filters from URL
  const [selectedAges, setSelectedAges] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Number.MAX_SAFE_INTEGER]);
  const priceLimit = Math.ceil(Math.max(...products.map((product) => product.price), 0) / 100) * 100;
  const [inStockOnly, setInStockOnly] = useState(false);

  // Sync from URL params on mount and when they change
  useEffect(() => {
    const age = searchParams.get('age');
    const category = searchParams.get('category');
    const filter = searchParams.get('filter');
    const sortParam = searchParams.get('sort');

    setSelectedAges(age ? new Set([age]) : new Set());
    setSelectedCategories(category ? new Set([category]) : new Set());
    if (filter === 'new') setSort('newest');
    else if (sortParam === 'price-low' || sortParam === 'price-high') setSort(sortParam);
    else setSort('featured');
  }, [searchParams]);

  const toggleSet = (set: Set<string>, value: string, setter: (s: Set<string>) => void) => {
    const next = new Set(set);
    if (next.has(value)) next.delete(value);
    else next.add(value);
    setter(next);
  };

  const clearAll = () => {
    setSelectedAges(new Set());
    setSelectedCategories(new Set());
    setSelectedSizes(new Set());
    setSelectedColors(new Set());
    setPriceRange([0, Number.MAX_SAFE_INTEGER]);
    setInStockOnly(false);
    setSearchParams({});
  };

  const filtered = useMemo(() => {
    const collection = searchParams.get('collection');
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const newArrivalsOnly = searchParams.get('filter') === 'new';
    let result = products.filter((product) =>
      (!collection || product.collections?.includes(collection)) && (!newArrivalsOnly || product.isNew)
    );

    if (selectedAges.size > 0) {
      result = result.filter((product) => product.ages.some((productAge) => [...selectedAges].some((selectedAge) => {
        const productAgeKey = resolveLaunchAge(productAge)?.key;
        const selectedAgeKey = resolveLaunchAge(selectedAge)?.key;
        return (productAgeKey && selectedAgeKey) ? productAgeKey === selectedAgeKey : productAge.toLowerCase() === selectedAge.toLowerCase();
      })));
    }
    if (selectedCategories.size > 0) {
      result = result.filter((product) => [...selectedCategories].some((selectedCategory) => {
        const productCategorySlug = resolveLaunchCategory(product.category)?.slug;
        const selectedCategorySlug = resolveLaunchCategory(selectedCategory)?.slug;
        return (productCategorySlug && selectedCategorySlug) ? productCategorySlug === selectedCategorySlug : product.category.toLowerCase() === selectedCategory.toLowerCase();
      }));
    }
    if (selectedSizes.size > 0) {
      result = result.filter((p) => p.sizes.some((s) => selectedSizes.has(s)));
    }
    if (selectedColors.size > 0) {
      result = result.filter((p) => p.colors.some((c) => selectedColors.has(c.name)));
    }
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= Math.min(priceRange[1], priceLimit));
    if (inStockOnly) {
      result = result.filter((product) => product.inStock === true);
    }
    if (search) result = result.filter((product) =>
      product.name.toLowerCase().includes(search) ||
      product.category.toLowerCase().includes(search) ||
      product.ages.some((age) => age.toLowerCase().includes(search)) ||
      product.tags?.some((tag) => tag.toLowerCase().includes(search))
    );

    switch (sort) {
      case 'price-low':
        result.sort((a, b) => a.price - b.price);
        break;
      case 'price-high':
        result.sort((a, b) => b.price - a.price);
        break;
      case 'newest':
        result.sort((a, b) => (b.isNew ? 1 : 0) - (a.isNew ? 1 : 0));
        break;
      default:
        // Products arrive ordered by published_at from the database.
    }

    return result;
  }, [products, selectedAges, selectedCategories, selectedSizes, selectedColors, priceRange, inStockOnly, sort, priceLimit, searchParams]);

  const activeFilterCount =
    selectedAges.size + selectedCategories.size + selectedSizes.size + selectedColors.size + (searchParams.get('collection') ? 1 : 0) +
    (searchParams.get('filter') === 'new' ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < Number.MAX_SAFE_INTEGER ? 1 : 0) + (inStockOnly ? 1 : 0) + (searchQuery ? 1 : 0);

  const activeAge = selectedLaunchAge || resolveLaunchAge(actualAge?.label);
  const ageLabel = actualAge?.label || selectedLaunchAge?.label;
  const categoryLabel = actualCategory?.name || selectedLaunchCategory?.label;
  const pageTitle = collectionParam
    ? selectedCollection?.name || 'Collection'
    : categoryLabel && ageLabel
      ? `${categoryLabel} for ${ageLabel}`
      : categoryLabel || ageLabel || 'The Little Loom edit';
  const pageIntroduction = collectionParam
    ? selectedCollection?.description || 'Browse the published pieces in this collection.'
    : categoryLabel && ageLabel
      ? `Browse published ${categoryLabel.toLowerCase()} for ${ageLabel}.`
      : categoryLabel
        ? actualCategory?.description || selectedLaunchCategory?.introduction || 'Browse the published pieces in this category.'
        : ageLabel
          ? activeAge?.introduction || actualAge?.description || `Browse published styles for ${ageLabel}.`
          : 'Browse the styles currently available from Little Loom.';
  const ageSuggestedCategories = activeAge
    ? categoryNavigation.filter((category) => products.some((product) =>
        product.ages.some((age) => resolveLaunchAge(age)?.key === activeAge.key) &&
        resolveLaunchCategory(product.category)?.slug === category.slug
      ))
    : [];

  if (catalogLoading || catalogError || products.length === 0) {
    const unavailable = Boolean(catalogError);
    const catalogueNeedsReview = !catalogLoading && !unavailable && hasPublishedRecords;
    const genuinelyEmpty = !catalogLoading && !unavailable && !hasPublishedRecords;
    return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
      {catalogLoading || unavailable || catalogueNeedsReview ? <>
        <ShopPageBanner
          eyebrow="Little Loom · Shop"
          title={catalogLoading ? 'Loading the collection' : unavailable ? 'The catalogue is temporarily unavailable' : 'The published catalogue needs attention'}
          introduction={catalogLoading ? 'Products will appear here once the catalogue has loaded.' : unavailable ? 'Products could not be retrieved. Please try again shortly.' : 'No products are currently available to order.'}
        />
        <StoreNavigationTiles ages={ages} categories={categories} />
      </> : collectionParam ? <>
        <ShopPageBanner eyebrow="Published collection" title={pageTitle} introduction={pageIntroduction} />
        <p role="status" className="mt-8 rounded-xl bg-[#f8f4f0] p-5 text-sm text-ink-soft">{selectedCollection ? 'No published products are currently assigned to this collection.' : 'This collection could not be found.'}</p>
        <Link to="/shop" className="mt-5 inline-flex items-center gap-2 text-sm underline underline-offset-4">Browse the full shop<ArrowRight size={15} /></Link>
      </> : genuinelyEmpty ? <>
        <ShopPageBanner
          eyebrow={categoryLabel && ageLabel ? `${ageLabel} · ${categoryLabel}` : categoryLabel ? 'Category edit' : ageLabel ? `${activeAge?.range || actualAge?.range || ''} · age edit` : 'Little Loom · Shop'}
          title={pageTitle}
          introduction={pageIntroduction}
        />
        {(categoryLabel || ageLabel) && <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          {(categoryLabel || ageLabel) && <Link to="/shop#shop-categories" className="underline underline-offset-4">Browse all categories</Link>}
        </div>}
        {ageSuggestedCategories.length > 0 && <nav aria-label={`Categories suggested for ${ageLabel}`} className="mt-5 flex flex-wrap gap-2">
          {ageSuggestedCategories.map((category) => {
            const databaseCategory = categories.find((item) => resolveLaunchCategory(item.name)?.slug === category.slug);
            const isSelected = (selectedLaunchCategory || resolveLaunchCategory(actualCategory?.name))?.slug === category.slug;
            return <Link key={category.slug} to={`/shop?age=${encodeURIComponent(actualAge?.id || activeAge?.value || ageLabel || '')}&category=${encodeURIComponent(databaseCategory?.id || category.value)}`} className={`rounded-full border px-3 py-1.5 text-xs ${isSelected ? 'border-ink bg-ink text-cream' : 'border-ink/15 text-ink-soft hover:border-ink/40'}`}>{category.label}</Link>;
          })}
        </nav>}
        <p role="status" className="mt-8 rounded-xl border border-ink/10 bg-[#f8f4f0] p-5 text-sm text-ink-soft">No products are currently available in this selection.</p>
        {!categoryLabel && !ageLabel && !searchQuery && <div id="shop-categories" className="scroll-mt-24"><StoreNavigationTiles ages={ages} categories={categories} /></div>}
        {categoryLabel && <div id="shop-categories" className="mt-16 scroll-mt-24"><StoreNavigationTiles ages={ages} categories={categories} showAges={false} /></div>}
      </> : null}
    </main>;
  }

  const handleQuickAdd = (product: Product) => {
    const availableVariant = product.variants?.find((variant) => variant.available);
    if (product.variants?.length && !availableVariant) return;
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: availableVariant?.price ?? product.price,
      image: product.images[0],
      color: availableVariant?.colour ?? product.colors[0].name,
      size: availableVariant?.size ?? product.sizes[0],
      quantity: 1,
      variantId: availableVariant?.id,
    });
  };

  const sortLabels: Record<SortOption, string> = {
    featured: 'Featured',
    'price-low': 'Price: Low to High',
    'price-high': 'Price: High to Low',
    newest: 'Newest First',
  };

  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      {/* Age */}
      <FilterSection title="Age">
        {allAges.map((age) => (
          <FilterCheckbox
            key={age}
            label={age}
            checked={selectedAges.has(age)}
            onChange={() => toggleSet(selectedAges, age, setSelectedAges)}
          />
        ))}
      </FilterSection>

      {/* Category */}
      <FilterSection title="Category">
        {allCategories.map((cat) => (
          <FilterCheckbox
            key={cat}
            label={cat}
            checked={selectedCategories.has(cat)}
            onChange={() => toggleSet(selectedCategories, cat, setSelectedCategories)}
          />
        ))}
      </FilterSection>

      {/* Size */}
      <FilterSection title="Size">
        <div className="flex flex-wrap gap-2">
          {allSizes.map((size) => (
            <button
              key={size}
              onClick={() => toggleSet(selectedSizes, size, setSelectedSizes)}
              className={`px-3 py-1.5 text-xs rounded-md border transition-all ${
                selectedSizes.has(size)
                  ? 'border-ink bg-ink text-cream'
                  : 'border-ink/15 text-ink-soft hover:border-ink/40'
              }`}
            >
              {size}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Color */}
      <FilterSection title="Color">
        <div className="flex flex-wrap gap-2.5">
          {allColors.map((color) => (
            <button
              key={color.name}
              onClick={() => toggleSet(selectedColors, color.name, setSelectedColors)}
              aria-label={color.name}
              className={`relative h-7 w-7 rounded-full border-2 transition-all ${
                selectedColors.has(color.name)
                  ? 'border-ink ring-2 ring-ink/15'
                  : 'border-ink/10 hover:border-ink/30'
              }`}
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </FilterSection>

      {/* Price */}
      <FilterSection title="Price">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between text-xs text-ink-soft">
            <span>₹{priceRange[0]}</span>
            <span>₹{Math.min(priceRange[1], priceLimit)}</span>
          </div>
          <input
            type="range"
            min={0}
            max={priceLimit}
            step={100}
            value={Math.min(priceRange[1], priceLimit)}
            onChange={(e) => setPriceRange([priceRange[0], Number(e.target.value)])}
            className="w-full accent-ink"
            aria-label="Maximum price"
          />
        </div>
      </FilterSection>

      {/* Availability */}
      <FilterSection title="Availability">
        <FilterCheckbox
          label="In stock only"
          checked={inStockOnly}
          onChange={() => setInStockOnly(!inStockOnly)}
        />
      </FilterSection>

      {activeFilterCount > 0 && (
        <button
          onClick={clearAll}
          className="text-sm text-peach hover:text-ink transition-colors text-left"
        >
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-12">
        <Breadcrumbs items={[{ label: 'Shop' }]} />
        <div className="mt-5"><ShopPageBanner
          eyebrow={collectionParam ? 'Published collection' : categoryLabel && ageLabel ? `${ageLabel} · ${categoryLabel}` : categoryLabel ? 'Published category' : ageLabel ? `${activeAge?.range || actualAge?.range || ''} · published age edit` : 'Little Loom · Shop'}
          title={pageTitle}
          introduction={collectionParam ? pageIntroduction : categoryLabel && ageLabel ? `Browse published ${categoryLabel.toLowerCase()} for ${ageLabel}.` : categoryLabel ? actualCategory?.description || `Browse published ${categoryLabel.toLowerCase()} styles from Little Loom.` : ageLabel ? `Browse published styles for ${ageLabel}. Final fit follows the product measurements.` : 'Browse the products currently published by Little Loom.'}
        /></div>
        {(categoryLabel || ageLabel) && <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
          <Link to="/shop#shop-categories" className="underline underline-offset-4">Browse all categories</Link>
          {ageLabel && <span className="text-xs text-ink-light">See each published product for its confirmed sizing and availability.</span>}
        </div>}
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <div className="flex gap-8 lg:gap-12">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-60 shrink-0">
            <div className="sticky top-28">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal size={18} className="text-ink" />
                <h2 className="text-sm font-semibold text-ink">Filters</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-ink/8">
              <p className="text-sm text-ink-soft">
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
              </p>
              <div className="flex items-center gap-3">
                {/* Mobile filter button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-3 py-2 text-sm border border-ink/15 rounded-lg text-ink"
                >
                  <SlidersHorizontal size={16} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-5 w-5 items-center justify-center rounded-full bg-ink text-cream text-[10px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-2 px-3 py-2 text-sm border border-ink/15 rounded-lg text-ink hover:border-ink/30 transition-colors"
                  >
                    Sort: {sortLabels[sort]}
                    <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                      <div className="absolute right-0 top-full mt-1 z-20 bg-cream border border-ink/10 rounded-lg shadow-lg py-1 min-w-[200px] animate-scale-in">
                        {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSort(option);
                              setSortOpen(false);
                            }}
                            className="flex items-center justify-between w-full px-3 py-2 text-sm text-ink hover:bg-ink/5 transition-colors"
                          >
                            {sortLabels[option]}
                            {sort === option && <Check size={14} className="text-peach" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Grid */}
            {filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mb-4">
                  <Package size={28} className="text-ink-light" />
                </div>
                <h3 className="font-serif text-xl text-ink mb-1">No products found</h3>
                <p className="text-sm text-ink-soft mb-5">
                  Try adjusting your filters to see more results.
                </p>
                <Button variant="outline" size="md" onClick={clearAll}>
                  Clear All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {filtered.map((product, i) => (
                  <div
                    key={product.id}
                    className="animate-slide-up-fade"
                    style={{ animationDelay: `${Math.min(i * 0.05, 0.4)}s` }}
                  >
                    <ProductCard product={product} onQuickAdd={handleQuickAdd} />
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile filter drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={() => setShowFilters(false)} />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-cream animate-slide-in-right flex flex-col">
            <div className="flex items-center justify-between px-5 h-16 border-b border-ink/10 shrink-0">
              <h2 className="text-sm font-semibold text-ink">Filters</h2>
              <button onClick={() => setShowFilters(false)} aria-label="Close filters" className="p-2 -mr-2">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll px-5 py-6">
              <FilterContent />
            </div>
            <div className="border-t border-ink/10 px-5 py-4 shrink-0">
              <Button variant="primary" size="lg" className="w-full" onClick={() => setShowFilters(false)}>
                Show {filtered.length} Results
              </Button>
            </div>
          </div>
        </div>
      )}
      <div id="shop-categories" className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8">
        <StoreNavigationTiles ages={ages} categories={categories} showAges={false} />
      </div>
    </div>
  );
}

function FilterSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-ink-light mb-3">{title}</h3>
      {children}
    </div>
  );
}

function FilterCheckbox({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: () => void;
}) {
  return (
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer group">
      <span
        className={`flex h-4 w-4 items-center justify-center rounded border transition-all ${
          checked ? 'bg-ink border-ink' : 'border-ink/20 group-hover:border-ink/40'
        }`}
      >
        {checked && <Check size={11} className="text-cream" />}
      </span>
      <span className={`text-sm ${checked ? 'text-ink font-medium' : 'text-ink-soft'} group-hover:text-ink transition-colors`}>
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}
