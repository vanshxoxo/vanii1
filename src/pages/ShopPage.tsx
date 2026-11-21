import { useMemo, useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  SlidersHorizontal,
  X,
  Check,
  ChevronDown,
  Package,
  Sparkles,
  Gem,
  Shirt,
  Home,
  Baby,
} from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import type { Product, AgeGroup, Department } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/ui';
import Button from '../components/Button';
import { useStore } from '../useStore';
import {
  resolveLaunchAge,
  resolveLaunchCategory,
  resolveDepartment,
  departments,
} from '../data/storeNavigation';

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>('featured');
  const { products, ages, categories, collections } = useCatalog();

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

  // Context-aware size and color extraction
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

  // Fabric types for suits department
  const suitFabricTypes = useMemo(() => {
    if (activeDepartment !== 'women_suits') return [];
    const fabrics = deptProducts.map((p) => p.specifications?.womenSuits?.fabricType || p.fabric).filter(Boolean);
    return [...new Set(fabrics)] as string[];
  }, [deptProducts, activeDepartment]);

  // Read initial filters from URL
  const [selectedAges, setSelectedAges] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [selectedFabrics, setSelectedFabrics] = useState<Set<string>>(new Set());
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
    setSelectedFabrics(new Set());
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

    // Context-aware age filter: only for kids
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

    if (selectedFabrics.size > 0) {
      result = result.filter((p) => {
        const f = p.specifications?.womenSuits?.fabricType || p.fabric;
        return f && selectedFabrics.has(f);
      });
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
        // Preserves published order
    }

    return result;
  }, [deptProducts, selectedAges, activeDepartment, selectedCategories, selectedSizes, selectedColors, selectedFabrics, priceRange, inStockOnly, sort, priceLimit, searchParams]);

  const activeFilterCount =
    ((!activeDepartment || activeDepartment === 'kids') ? selectedAges.size : 0) +
    selectedCategories.size +
    selectedSizes.size +
    selectedColors.size +
    selectedFabrics.size +
    (searchParams.get('collection') ? 1 : 0) +
    (searchParams.get('filter') === 'new' ? 1 : 0) +
    (priceRange[0] > 0 || priceRange[1] < Number.MAX_SAFE_INTEGER ? 1 : 0) +
    (inStockOnly ? 1 : 0) +
    (searchQuery ? 1 : 0);

  const ageLabel = actualAge?.label || selectedLaunchAge?.label;
  const categoryLabel = actualCategory?.name || selectedLaunchCategory?.label;

  const pageTitle = collectionParam
    ? selectedCollection?.name || 'Collection'
    : categoryLabel && ageLabel
      ? `${categoryLabel} for ${ageLabel}`
      : categoryLabel || currentDeptInfo?.brand || 'All Collections';

  const pageEyebrow = currentDeptInfo
    ? `${currentDeptInfo.brand} · ${currentDeptInfo.label}`
    : collectionParam
      ? 'Curated Collection'
      : categoryLabel && ageLabel
        ? `${ageLabel} · ${categoryLabel}`
        : 'VJ Collection Flagship';

  const pageIntroduction = collectionParam
    ? selectedCollection?.description || 'Browse published pieces in this curated collection.'
    : categoryLabel && ageLabel
      ? `Browse published ${categoryLabel.toLowerCase()} for ${ageLabel}.`
      : categoryLabel
        ? actualCategory?.description || selectedLaunchCategory?.introduction || `Browse published ${categoryLabel.toLowerCase()}.`
        : currentDeptInfo
          ? currentDeptInfo.description
          : 'Discover our complete multi-category catalogue across Fine Jewellery, Women’s Unstitched Suits, Living Home Bedding, and Little Loom Childrenswear.';

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
    featured: 'Curated Order',
    'price-low': 'Price: Low to High',
    'price-high': 'Price: High to Low',
    newest: 'Newest Releases',
  };

  const FilterContent = () => (
    <div className="flex flex-col gap-6">
      {/* Age Filter (Strictly for Kids department) */}
      {(!activeDepartment || activeDepartment === 'kids') && allAges.length > 0 && (
        <FilterSection title="Age Milestone">
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

      {/* Fabrics Filter (for Women's Suits) */}
      {suitFabricTypes.length > 0 && (
        <FilterSection title="Fabric Composition">
          {suitFabricTypes.map((fabric) => (
            <FilterCheckbox
              key={fabric}
              label={fabric}
              checked={selectedFabrics.has(fabric)}
              onChange={() => toggleSet(selectedFabrics, fabric, setSelectedFabrics)}
            />
          ))}
        </FilterSection>
      )}

      {/* Size / Fit / Dimension Filter */}
      {allSizes.length > 0 && (
        <FilterSection
          title={
            activeDepartment === 'jewellery'
              ? 'Ring Size / Style'
              : activeDepartment === 'home_textiles'
                ? 'Bed Dimensions'
                : activeDepartment === 'women_suits'
                  ? 'Suit Cut / Option'
                  : 'Size'
          }
        >
          <div className="flex flex-wrap gap-2">
            {allSizes.map((size) => (
              <button
                key={size}
                onClick={() => toggleSet(selectedSizes, size, setSelectedSizes)}
                className={`px-3 py-1.5 text-xs rounded-lg border transition-all ${
                  selectedSizes.has(size)
                    ? 'border-charcoal bg-charcoal text-ivory shadow-xs'
                    : 'border-charcoal/15 text-charcoal-soft hover:border-charcoal/40 bg-white'
                }`}
              >
                {size}
              </button>
            ))}
          </div>
        </FilterSection>
      )}

      {/* Color / Tone Swatches */}
      {allColors.length > 0 && (
        <FilterSection title={activeDepartment === 'jewellery' ? 'Finish / Tone' : 'Colour'}>
          <div className="flex flex-wrap gap-2.5">
            {allColors.map((color) => (
              <button
                key={color.name}
                onClick={() => toggleSet(selectedColors, color.name, setSelectedColors)}
                aria-label={color.name}
                className={`relative h-7 w-7 rounded-full border-2 transition-all ${
                  selectedColors.has(color.name)
                    ? 'border-charcoal ring-2 ring-charcoal/20 scale-110'
                    : 'border-charcoal/15 hover:border-charcoal/40 hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex }}
                title={color.name}
              />
            ))}
          </div>
        </FilterSection>
      )}

      {/* Price Slider */}
      {priceLimit > 0 && (
        <FilterSection title="Price Filter">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between text-xs text-charcoal-soft font-medium">
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
              className="w-full accent-charcoal"
              aria-label="Maximum price"
            />
          </div>
        </FilterSection>
      )}

      {/* In Stock Filter */}
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
          className="text-xs font-semibold uppercase tracking-wider text-clay hover:text-charcoal transition-colors text-left pt-2 border-t border-charcoal/10"
        >
          Reset All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen">
      {/* Top Breadcrumb & Hero Header */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            ...(currentDeptInfo ? [{ label: currentDeptInfo.brand, href: currentDeptInfo.landingPath }] : []),
            ...(categoryLabel ? [{ label: categoryLabel }] : []),
          ]}
        />

        {/* Editorial Shop Header */}
        <div
          className="mt-6 rounded-3xl p-6 sm:p-10 border border-charcoal/10 shadow-xs"
          style={{ backgroundColor: currentDeptInfo?.accentBg || '#F8F5EE' }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-clay">
                <Sparkles size={13} />
                {pageEyebrow}
              </span>
              <h1 className="mt-2 font-serif text-3xl sm:text-5xl font-light text-charcoal leading-tight">
                {pageTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-charcoal-soft">
                {pageIntroduction}
              </p>
            </div>

            {currentDeptInfo && (
              <div className="shrink-0">
                <Link to={currentDeptInfo.landingPath}>
                  <Button variant="outline" size="sm">
                    View {currentDeptInfo.brand} Editorial
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Department Switcher Pills */}
          <div className="mt-8 pt-6 border-t border-charcoal/10 flex flex-wrap items-center gap-2">
            <Link
              to="/shop"
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-full transition-all ${
                !activeDepartment
                  ? 'bg-charcoal text-ivory shadow-xs'
                  : 'bg-white/80 text-charcoal-soft hover:bg-white hover:text-charcoal border border-charcoal/10'
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
                  className={`inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-full transition-all ${
                    isSelected
                      ? 'bg-charcoal text-ivory shadow-xs'
                      : 'bg-white/80 text-charcoal-soft hover:bg-white hover:text-charcoal border border-charcoal/10'
                  }`}
                >
                  {dept.id === 'jewellery' && <Gem size={13} className={isSelected ? 'text-amber-300' : 'text-[#C5A059]'} />}
                  {dept.id === 'women_suits' && <Shirt size={13} className={isSelected ? 'text-rose-200' : 'text-[#B25E46]'} />}
                  {dept.id === 'home_textiles' && <Home size={13} className={isSelected ? 'text-sky-200' : 'text-[#3E5C76]'} />}
                  {dept.id === 'kids' && <Baby size={13} className={isSelected ? 'text-orange-200' : 'text-[#C9826B]'} />}
                  {dept.brand}
                </Link>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Grid & Filters */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6">
        <div className="flex gap-10 lg:gap-12">
          {/* Desktop Sidebar Filters */}
          <aside className="hidden lg:block w-64 shrink-0">
            <div className="sticky top-28 space-y-6">
              <div className="flex items-center gap-2 pb-4 border-b border-charcoal/10">
                <SlidersHorizontal size={17} className="text-charcoal" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal">Filter Catalog</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-charcoal/10">
              <p className="text-xs font-medium uppercase tracking-wider text-charcoal-soft">
                Showing {filtered.length} product{filtered.length !== 1 ? 's' : ''}
                {currentDeptInfo && <span className="font-semibold text-charcoal"> in {currentDeptInfo.brand}</span>}
              </p>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-charcoal/15 rounded-xl bg-white text-charcoal"
                >
                  <SlidersHorizontal size={14} />
                  Filters
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-charcoal text-ivory text-[9px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-charcoal/15 rounded-xl bg-white text-charcoal hover:border-charcoal transition-colors"
                  >
                    Sort: {sortLabels[sort]}
                    <ChevronDown size={14} className={`transition-transform ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                      <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-charcoal/10 rounded-xl shadow-xl py-1 min-w-[210px] animate-scale-in">
                        {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSort(option);
                              setSortOpen(false);
                            }}
                            className="flex items-center justify-between w-full px-4 py-2.5 text-xs uppercase tracking-wider text-charcoal hover:bg-ivory transition-colors text-left"
                          >
                            <span>{sortLabels[option]}</span>
                            {sort === option && <Check size={14} className="text-clay" />}
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>

            {/* Product Grid or Clean Empty State */}
            {deptProducts.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-3xl bg-white border border-charcoal/10">
                <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mb-4">
                  <Package size={28} className="text-charcoal-light" />
                </div>
                <h3 className="font-serif text-2xl text-charcoal">
                  {currentDeptInfo ? `${currentDeptInfo.brand} Edit Underway` : 'No Products Currently Published'}
                </h3>
                <p className="mt-2 text-sm text-charcoal-soft max-w-md leading-relaxed">
                  {currentDeptInfo
                    ? `Pieces for ${currentDeptInfo.brand} are being curated. You can publish initial pieces through the admin management suite.`
                    : 'No products match the selected filters.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <Link to="/shop">
                    <Button variant="outline" size="sm">Browse All Departments</Button>
                  </Link>
                  <Link to="/admin">
                    <Button variant="primary" size="sm">Open Admin Wizard</Button>
                  </Link>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-white border border-charcoal/10">
                <div className="w-16 h-16 rounded-full bg-ivory flex items-center justify-center mb-4">
                  <Package size={28} className="text-charcoal-light" />
                </div>
                <h3 className="font-serif text-xl text-charcoal">No products match your current filters</h3>
                <p className="mt-2 text-xs text-charcoal-soft max-w-sm mb-6">
                  Try clearing some filter criteria or selecting another category to view available pieces.
                </p>
                <Button variant="outline" size="md" onClick={clearAll}>
                  Reset All Filters
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 lg:gap-6">
                {filtered.map((product) => (
                  <ProductCard key={product.id} product={product} onQuickAdd={handleQuickAdd} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Mobile Filters Drawer */}
      {showFilters && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-ivory animate-slide-in-right flex flex-col shadow-2xl">
            <div className="flex items-center justify-between px-5 h-16 border-b border-charcoal/10 bg-white">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-charcoal">Filter Catalog</h2>
              <button onClick={() => setShowFilters(false)} aria-label="Close filters" className="p-2 -mr-2">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll px-5 py-6">
              <FilterContent />
            </div>
            <div className="border-t border-charcoal/10 px-5 py-4 bg-white">
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
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.2em] text-charcoal-light mb-3">{title}</h3>
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
          checked ? 'bg-charcoal border-charcoal' : 'border-charcoal/20 group-hover:border-charcoal/40 bg-white'
        }`}
      >
        {checked && <Check size={11} className="text-ivory" />}
      </span>
      <span className={`text-xs ${checked ? 'text-charcoal font-semibold' : 'text-charcoal-soft'} group-hover:text-charcoal transition-colors`}>
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}
