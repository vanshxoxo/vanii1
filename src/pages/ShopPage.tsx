import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Check, ChevronDown, Package, Sparkles, Gem, Shirt, Home, Baby } from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import type { Product, AgeGroup, Department } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/ui';
import Button from '../components/Button';
import { useStore } from '../useStore';
import StoreNavigationTiles from '../components/StoreNavigationTiles';
import {
  resolveLaunchAge,
  resolveLaunchCategory,
  resolveDepartment,
  departments,
} from '../data/storeNavigation';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest';

function ShopPageBanner({
  eyebrow,
  title,
  introduction,
  activeDepartment,
}: {
  eyebrow: string;
  title: string;
  introduction: string;
  activeDepartment: Department | null;
}) {
  return (
    <section className="rounded-2xl bg-[#f4eee8] px-5 py-6 sm:px-8 sm:py-8 border border-ink/5 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.22em] text-peach flex items-center gap-1.5">
            <Sparkles size={13} />
            {eyebrow}
          </p>
          <h1 className="mt-2 font-serif text-3xl font-light leading-tight text-ink sm:text-4xl">{title}</h1>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-ink-soft">{introduction}</p>
        </div>
      </div>

      {/* Department Switcher Pills */}
      <div className="mt-6 pt-5 border-t border-ink/8 flex flex-wrap items-center gap-2">
        <Link
          to="/shop"
          className={`px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all duration-200 ${
            !activeDepartment
              ? 'bg-ink text-cream shadow-sm scale-105'
              : 'bg-white/80 text-ink-soft hover:bg-white hover:text-ink border border-ink/10'
          }`}
        >
          All Departments
        </Link>
        {departments.map((dept) => {
          const isSelected = activeDepartment === dept.id;
          return (
            <Link
              key={dept.id}
              to={`/shop?department=${dept.id}`}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium uppercase tracking-wider rounded-full transition-all duration-200 ${
                isSelected
                  ? 'bg-ink text-cream shadow-sm scale-105'
                  : 'bg-white/80 text-ink-soft hover:bg-white hover:text-ink border border-ink/10'
              }`}
            >
              {dept.id === 'jewellery' && <Gem size={12} className={isSelected ? 'text-amber-300' : 'text-amber-600'} />}
              {dept.id === 'women_suits' && <Shirt size={12} className={isSelected ? 'text-rose-200' : 'text-rose-600'} />}
              {dept.id === 'home_textiles' && <Home size={12} className={isSelected ? 'text-sky-200' : 'text-sky-600'} />}
              {dept.id === 'kids' && <Baby size={12} className={isSelected ? 'text-emerald-200' : 'text-emerald-600'} />}
              {dept.brand}
            </Link>
          );
        })}
      </div>
    </section>
  );
}

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>('featured');
  const { products, hasPublishedRecords, ages, categories, collections, loading: catalogLoading, error: catalogError } = useCatalog();

  const departmentParam = (searchParams.get('department') as Department) || '';
  const ageParam = searchParams.get('age') || '';
  const categoryParam = searchParams.get('category') || '';
  const collectionParam = searchParams.get('collection') || '';
  const searchQuery = searchParams.get('search') || '';

  const selectedLaunchAge = resolveLaunchAge(ageParam);
  const selectedLaunchCategory = resolveLaunchCategory(categoryParam);

  const actualAge = ages.find((age) => (selectedLaunchAge && resolveLaunchAge(age.label)?.key === selectedLaunchAge.key) || age.id.toLowerCase() === ageParam.toLowerCase());
  const actualCategory = categories.find((category) => (selectedLaunchCategory && resolveLaunchCategory(category.name)?.slug === selectedLaunchCategory.slug) || category.id.toLowerCase() === categoryParam.toLowerCase());
  const selectedCollection = collections.find((collection) => collection.slug.toLowerCase() === collectionParam.toLowerCase());

  // Determine active department: explicitly from query param or inferred from category
  const activeDepartment: Department | null =
    (departmentParam as Department) ||
    (actualCategory?.department as Department) ||
    (selectedLaunchCategory?.department as Department) ||
    null;

  const currentDeptInfo = resolveDepartment(activeDepartment);

  // Products belonging to the active department
  const deptProducts = useMemo(() => {
    if (!activeDepartment) return products;
    return products.filter((product) => (product.department || product.productType || 'kids') === activeDepartment);
  }, [products, activeDepartment]);

  const allSizes = useMemo(() => [...new Set(deptProducts.flatMap((product) => product.sizes))], [deptProducts]);
  const allColors = useMemo(() => [...new Map(deptProducts.flatMap((product) => product.colors.map((color) => [color.name, color] as const))).values()], [deptProducts]);
  const allAges: AgeGroup[] = ages.map((age) => age.id);

  // Categories belonging to active department
  const visibleCategories = useMemo(() => {
    if (!activeDepartment) return categories;
    return categories.filter((cat) => {
      const d = cat.department || resolveLaunchCategory(cat.name)?.department;
      return d === activeDepartment;
    });
  }, [categories, activeDepartment]);

  // Read initial filters from URL
  const [selectedAges, setSelectedAges] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, Number.MAX_SAFE_INTEGER]);
  const priceLimit = Math.ceil(Math.max(...deptProducts.map((product) => product.price), 0) / 100) * 100;
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
    if (activeDepartment) {
      setSearchParams({ department: activeDepartment });
    } else {
      setSearchParams({});
    }
  };

  const filtered = useMemo(() => {
    const collection = searchParams.get('collection');
    const search = (searchParams.get('search') || '').trim().toLowerCase();
    const newArrivalsOnly = searchParams.get('filter') === 'new';

    let result = deptProducts.filter((product) =>
      (!collection || product.collections?.includes(collection)) && (!newArrivalsOnly || product.isNew)
    );

    // Apply age filter only for kids department
    if (selectedAges.size > 0 && (!activeDepartment || activeDepartment === 'kids')) {
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

    result = result.filter((p) => p.price >= priceRange[0] && p.price <= Math.min(priceRange[1], priceLimit || Number.MAX_SAFE_INTEGER));

    if (inStockOnly) {
      result = result.filter((product) => product.inStock === true);
    }

    if (search) {
      result = result.filter((product) =>
        product.name.toLowerCase().includes(search) ||
        product.category.toLowerCase().includes(search) ||
        product.ages.some((age) => age.toLowerCase().includes(search)) ||
        product.tags?.some((tag) => tag.toLowerCase().includes(search))
      );
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
        // Already sorted by published_at from database
    }

    return result;
  }, [deptProducts, selectedAges, activeDepartment, selectedCategories, selectedSizes, selectedColors, priceRange, inStockOnly, sort, priceLimit, searchParams]);

  const activeFilterCount =
    ((!activeDepartment || activeDepartment === 'kids') ? selectedAges.size : 0) +
    selectedCategories.size +
    selectedSizes.size +
    selectedColors.size +
    (searchParams.get('collection') ? 1 : 0) +
    (searchParams.get('filter') === 'new' ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < Number.MAX_SAFE_INTEGER ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const ageLabel = actualAge?.label || selectedLaunchAge?.label;
  const categoryLabel = actualCategory?.name || selectedLaunchCategory?.label;

  // Department-aware Titles & Copy
  const pageTitle = collectionParam
    ? selectedCollection?.name || 'Collection'
    : categoryLabel && ageLabel
      ? `${categoryLabel} for ${ageLabel}`
      : categoryLabel || currentDeptInfo?.label?.replace('Shop ', '') || 'All Collections';

  const pageEyebrow = currentDeptInfo
    ? `${currentDeptInfo.brand} · ${currentDeptInfo.label}`
    : collectionParam
      ? 'Curated Collection'
      : categoryLabel && ageLabel
        ? `${ageLabel} · ${categoryLabel}`
        : 'Little Loom · VJ Collection';

  const pageIntroduction = collectionParam
    ? selectedCollection?.description || 'Browse the published pieces in this collection.'
    : categoryLabel && ageLabel
      ? `Browse published ${categoryLabel.toLowerCase()} for ${ageLabel}.`
      : categoryLabel
        ? actualCategory?.description || selectedLaunchCategory?.introduction || `Browse published ${categoryLabel.toLowerCase()}.`
        : currentDeptInfo
          ? currentDeptInfo.description
          : 'Browse our complete multi-category catalogue spanning fine jewellery, unstitched suits, home textiles, and handcrafted children’s clothing.';

  if (catalogLoading || catalogError || products.length === 0) {
    const unavailable = Boolean(catalogError);
    const catalogueNeedsReview = !catalogLoading && !unavailable && hasPublishedRecords;
    const genuinelyEmpty = !catalogLoading && !unavailable && !hasPublishedRecords;

    return (
      <main className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 lg:py-16">
        {catalogLoading || unavailable || catalogueNeedsReview ? (
          <>
            <ShopPageBanner
              eyebrow="Little Loom · VJ Collection"
              title={catalogLoading ? 'Loading the collection' : unavailable ? 'The catalogue is temporarily unavailable' : 'The published catalogue needs attention'}
              introduction={catalogLoading ? 'Products will appear here once the catalogue has loaded.' : unavailable ? 'Products could not be retrieved. Please try again shortly.' : 'No products are currently available to order.'}
              activeDepartment={activeDepartment}
            />
            <StoreNavigationTiles ages={ages} categories={categories} />
          </>
        ) : genuinelyEmpty ? (
          <>
            <ShopPageBanner
              eyebrow={pageEyebrow}
              title={pageTitle}
              introduction={pageIntroduction}
              activeDepartment={activeDepartment}
            />
            <p role="status" className="mt-8 rounded-xl border border-ink/10 bg-[#f8f4f0] p-6 text-sm text-ink-soft">
              No products are currently published in this selection.
            </p>
          </>
        ) : null}
      </main>
    );
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
      color: availableVariant?.colour ?? product.colors[0]?.name ?? 'Standard',
      size: availableVariant?.size ?? product.sizes[0] ?? 'Standard',
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
      {/* Age Filter (Only for Kids clothing or full store view) */}
      {(!activeDepartment || activeDepartment === 'kids') && allAges.length > 0 && (
        <FilterSection title="Age Group">
          {allAges.map((age) => (
            <FilterCheckbox
              key={age}
              label={age}
              checked={selectedAges.has(age)}
              onChange={() => toggleSet(selectedAges, age, setSelectedAges)}
            />
          ))}
        </FilterSection>
      )}

      {/* Category Filter */}
      {visibleCategories.length > 0 && (
        <FilterSection title="Category">
          {visibleCategories.map((cat) => (
            <FilterCheckbox
              key={cat.id}
              label={cat.name}
              checked={selectedCategories.has(cat.id)}
              onChange={() => toggleSet(selectedCategories, cat.id, setSelectedCategories)}
            />
          ))}
        </FilterSection>
      )}

      {/* Size / Cut / Dimension Filter */}
      {allSizes.length > 0 && (
        <FilterSection title={activeDepartment === 'jewellery' ? 'Ring Size / Option' : activeDepartment === 'home_textiles' ? 'Bed Size' : activeDepartment === 'women_suits' ? 'Length / Option' : 'Size'}>
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
      )}

      {/* Color Filter */}
      {allColors.length > 0 && (
        <FilterSection title="Color / Tone">
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
      )}

      {/* Price */}
      {priceLimit > 0 && (
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
      )}

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
          className="text-sm text-peach hover:text-ink transition-colors text-left font-medium"
        >
          Clear all filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Header */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
        <Breadcrumbs
          items={[
            { label: 'Shop', href: '/shop' },
            ...(currentDeptInfo ? [{ label: currentDeptInfo.brand, href: `/shop?department=${currentDeptInfo.id}` }] : []),
            ...(categoryLabel ? [{ label: categoryLabel }] : []),
          ]}
        />
        <div className="mt-5">
          <ShopPageBanner
            eyebrow={pageEyebrow}
            title={pageTitle}
            introduction={pageIntroduction}
            activeDepartment={activeDepartment}
          />
        </div>
      </div>

      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-4 lg:py-6">
        <div className="flex gap-8 lg:gap-12">
          {/* Desktop sidebar */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28">
              <div className="flex items-center gap-2 mb-6">
                <SlidersHorizontal size={18} className="text-ink" />
                <h2 className="text-sm font-semibold text-ink">Filter Catalogue</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-6 pb-4 border-b border-ink/8">
              <p className="text-sm text-ink-soft">
                Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                {currentDeptInfo && <span className="font-medium text-ink"> in {currentDeptInfo.brand}</span>}
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

            {/* Empty or Grid */}
            {deptProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 px-4 text-center rounded-2xl bg-[#faf6f2] border border-ink/5">
                <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mb-4">
                  {activeDepartment === 'jewellery' ? <Gem size={28} className="text-amber-600" /> :
                   activeDepartment === 'women_suits' ? <Shirt size={28} className="text-rose-600" /> :
                   activeDepartment === 'home_textiles' ? <Home size={28} className="text-sky-600" /> :
                   <Package size={28} className="text-ink-light" />}
                </div>
                <h3 className="font-serif text-2xl text-ink mb-2">
                  {currentDeptInfo ? `${currentDeptInfo.brand} Edit Coming Soon` : 'No Products Available'}
                </h3>
                <p className="text-sm text-ink-soft max-w-md mb-6 leading-relaxed">
                  {currentDeptInfo
                    ? `Our ${currentDeptInfo.brand} pieces are currently being curated and catalogued. You can add the first pieces in the Admin management suite.`
                    : 'No published products match this selection.'}
                </p>
                <div className="flex flex-wrap gap-3 justify-center">
                  <Link to="/shop">
                    <Button variant="outline" size="sm">Browse All Departments</Button>
                  </Link>
                  <Link to="/admin">
                    <Button variant="primary" size="sm">Open Admin Wizard</Button>
                  </Link>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mb-4">
                  <Package size={28} className="text-ink-light" />
                </div>
                <h3 className="font-serif text-xl text-ink mb-1">No products match your filters</h3>
                <p className="text-sm text-ink-soft mb-5">
                  Try clearing some filter options or selecting another category.
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

      {/* Department & Categories bottom directory */}
      {(!activeDepartment || activeDepartment === 'kids') && (
        <div id="shop-categories" className="mx-auto max-w-7xl scroll-mt-24 px-4 sm:px-6 lg:px-8 mt-12 mb-8">
          <StoreNavigationTiles ages={ages} categories={categories} showAges={!activeDepartment} />
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
