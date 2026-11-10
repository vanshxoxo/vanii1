import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Check, ChevronDown, Package, ArrowRight } from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import type { Product, AgeGroup, Category } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/ui';
import Button from '../components/Button';
import { useStore } from '../useStore';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>('featured');
  const { products, ages, categories, loading: catalogLoading, error: catalogError } = useCatalog();
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

    setSelectedAges(age ? new Set([age]) : new Set());
    setSelectedCategories(category ? new Set([category]) : new Set());
    if (filter === 'new') setSort('newest');
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
    let result = [...products];

    if (selectedAges.size > 0) {
      result = result.filter((p) => p.ages.some((a) => selectedAges.has(a)));
    }
    if (selectedCategories.size > 0) {
      result = result.filter((p) => selectedCategories.has(p.category));
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
  }, [products, selectedAges, selectedCategories, selectedSizes, selectedColors, priceRange, inStockOnly, sort, priceLimit]);

  const activeFilterCount =
    selectedAges.size + selectedCategories.size + selectedSizes.size + selectedColors.size +
    (priceRange[0] > 0 || priceRange[1] < Number.MAX_SAFE_INTEGER ? 1 : 0) + (inStockOnly ? 1 : 0);

  if (catalogLoading || catalogError || products.length === 0) {
    const unavailable = Boolean(catalogError);
    return <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-20">
      <div className="grid overflow-hidden rounded-2xl bg-[#f4eee8] lg:grid-cols-2">
        <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-16">
          <p className="text-xs font-medium uppercase tracking-[0.22em] text-peach">Little Loom · Shop</p>
          <h1 className="mt-3 font-serif text-3xl font-light leading-tight text-ink sm:text-4xl">{catalogLoading ? 'Loading the published collection' : unavailable ? 'The catalogue is unavailable' : 'No products are currently published'}</h1>
          <p className="mt-4 max-w-lg text-sm leading-7 text-ink-soft">{catalogLoading ? 'Published products will appear here once the catalogue has loaded.' : unavailable ? 'We could not retrieve the published catalogue just now. Please try again shortly.' : 'Product listings and prices will appear here when they are published in the Little Loom catalogue.'}</p>
          {!catalogLoading && <Link to="/" className="mt-7 inline-flex items-center gap-2 self-start text-sm underline underline-offset-4">Return to Little Loom<ArrowRight size={15} /></Link>}
        </div>
        <img src="/images/editorial/version-b/category-rompers.webp" alt="Editorial Pexels photograph of children outdoors; this image is not a product listing" loading="eager" className="min-h-72 w-full object-cover lg:min-h-[440px]" />
      </div>
      <p className="mt-3 text-center text-[10px] uppercase tracking-[0.12em] text-ink-soft">Editorial photograph · Pexels · not a Little Loom product image</p>
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
      <div className="border-b border-ink/8">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
          <Breadcrumbs items={[{ label: 'Shop' }]} />
          <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <h1 className="font-serif text-3xl lg:text-4xl font-light text-ink">
                The Collection
              </h1>
              <p className="mt-2 text-sm text-ink-soft max-w-lg">
                Browse the products currently published by Little Loom.
              </p>
            </div>
          </div>
        </div>
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
