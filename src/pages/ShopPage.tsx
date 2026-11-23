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
    setSearchParams(activeDepartment ? { department: activeDepartment } : {});
  };

  // Filter and sort products
  const filtered = useMemo(() => {
    let result = [...deptProducts];

    // Filter by Age (strictly for Little Loom)
    if (selectedAges.size > 0 && (!activeDepartment || activeDepartment === 'kids')) {
      result = result.filter((product) => product.ages.some((age) => selectedAges.has(age)));
    }

    // Filter by Category
    if (selectedCategories.size > 0) {
      result = result.filter((product) => selectedCategories.has(product.category));
    }

    // Filter by Size
    if (selectedSizes.size > 0) {
      result = result.filter((product) => product.sizes.some((size) => selectedSizes.has(size)));
    }

    // Filter by Color
    if (selectedColors.size > 0) {
      result = result.filter((product) => product.colors.some((color) => selectedColors.has(color.name)));
    }

    // Filter by Fabric
    if (selectedFabrics.size > 0) {
      result = result.filter((product) => {
        const fab = product.specifications?.womenSuits?.fabricType || product.fabric;
        return fab && selectedFabrics.has(fab);
      });
    }

    // Filter by Price
    if (priceRange[0] > 0 || (priceRange[1] < Number.MAX_SAFE_INTEGER && priceLimit > 0)) {
      result = result.filter((product) => product.price >= priceRange[0] && product.price <= priceRange[1]);
    }

    // Filter by In-Stock
    if (inStockOnly) {
      result = result.filter((product) => product.inStock);
    }

    // Filter by Collection
    const coll = searchParams.get('collection');
    if (coll) {
      result = result.filter((product) => product.collections?.includes(coll));
    }

    // Filter by Free text Search
    const search = searchParams.get('search')?.toLowerCase().trim();
    if (search) {
      result = result.filter((p) =>
        p.name.toLowerCase().includes(search) ||
        p.category.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search) ||
        p.fabric.toLowerCase().includes(search)
      );
    }

    // Sort
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
        break;
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
                    ? 'border-espresso bg-espresso text-ivory shadow-xs'
                    : 'border-espresso/15 text-espresso-soft hover:border-espresso bg-white'
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
                    ? 'border-espresso ring-2 ring-forest/30 scale-110'
                    : 'border-espresso/15 hover:border-espresso hover:scale-105'
                }`}
                style={{ backgroundColor: color.hex || '#E5E5E5' }}
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
            <div className="flex items-center justify-between text-xs text-espresso-soft font-medium">
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
              className="w-full accent-forest"
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
          className="text-xs font-semibold uppercase tracking-wider text-terracotta hover:text-espresso transition-colors text-left pt-2 border-t border-espresso/10"
        >
          Reset All Filters ({activeFilterCount})
        </button>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F6F2E9]">
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
          className="mt-6 rounded-3xl p-6 sm:p-10 border border-espresso/10 shadow-xs"
          style={{ backgroundColor: currentDeptInfo?.accentBg || '#EDE7DE' }}
        >
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div>
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.26em] text-terracotta">
                <Sparkles size={13} />
                {pageEyebrow}
              </span>
              <h1 className="mt-2 font-serif text-3xl sm:text-5xl font-light text-espresso leading-tight">
                {pageTitle}
              </h1>
              <p className="mt-3 max-w-2xl text-sm sm:text-base leading-relaxed text-espresso-soft">
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
          <div className="mt-8 pt-6 border-t border-espresso/10 flex flex-wrap items-center gap-2">
            <Link
              to="/shop"
              className={`px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-full transition-all ${
                !activeDepartment
                  ? 'bg-espresso text-ivory shadow-xs'
                  : 'bg-white text-espresso-soft hover:bg-ivory hover:text-espresso border border-espresso/10'
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
                      ? 'bg-espresso text-ivory shadow-xs'
                      : 'bg-white text-espresso-soft hover:bg-ivory hover:text-espresso border border-espresso/10'
                  }`}
                >
                  {dept.id === 'jewellery' && <Gem size={13} className={isSelected ? 'text-brass' : 'text-brass'} />}
                  {dept.id === 'women_suits' && <Shirt size={13} className={isSelected ? 'text-terracotta' : 'text-terracotta'} />}
                  {dept.id === 'home_textiles' && <Home size={13} className={isSelected ? 'text-forest' : 'text-forest'} />}
                  {dept.id === 'kids' && <Baby size={13} className={isSelected ? 'text-[#C87D65]' : 'text-[#C87D65]'} />}
                  <span>{dept.brand}</span>
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
              <div className="flex items-center gap-2 pb-4 border-b border-espresso/10">
                <SlidersHorizontal size={17} className="text-espresso" />
                <h2 className="text-xs font-semibold uppercase tracking-wider text-espresso">Filter Catalogue</h2>
              </div>
              <FilterContent />
            </div>
          </aside>

          {/* Main Content Area */}
          <div className="flex-1 min-w-0">
            {/* Toolbar */}
            <div className="flex items-center justify-between gap-4 mb-8 pb-4 border-b border-espresso/10">
              <p className="text-xs font-medium uppercase tracking-wider text-espresso-soft">
                Showing {filtered.length} piece{filtered.length !== 1 ? 's' : ''}
                {currentDeptInfo && <span className="font-semibold text-espresso"> in {currentDeptInfo.brand}</span>}
              </p>

              <div className="flex items-center gap-3">
                {/* Mobile Filter Toggle Button */}
                <button
                  onClick={() => setShowFilters(true)}
                  className="lg:hidden flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-espresso/15 rounded-xl bg-white text-espresso shadow-xs"
                >
                  <SlidersHorizontal size={14} />
                  <span>Filters</span>
                  {activeFilterCount > 0 && (
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-forest text-ivory text-[9px] font-bold">
                      {activeFilterCount}
                    </span>
                  )}
                </button>

                {/* Sort Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setSortOpen(!sortOpen)}
                    className="flex items-center gap-2 px-3.5 py-2 text-xs font-semibold uppercase tracking-wider border border-espresso/15 rounded-xl bg-white text-espresso hover:border-espresso transition-colors shadow-xs"
                  >
                    <span>Sort: {sortLabels[sort]}</span>
                    <ChevronDown size={14} className={`transition-transform duration-200 ${sortOpen ? 'rotate-180' : ''}`} />
                  </button>
                  {sortOpen && (
                    <>
                      <div className="fixed inset-0 z-10" onClick={() => setSortOpen(false)} />
                      <div className="absolute right-0 top-full mt-1.5 z-20 bg-white border border-espresso/10 rounded-xl shadow-xl py-1 min-w-[210px] animate-scale-in">
                        {(Object.keys(sortLabels) as SortOption[]).map((option) => (
                          <button
                            key={option}
                            onClick={() => {
                              setSort(option);
                              setSortOpen(false);
                            }}
                            className="flex items-center justify-between w-full px-4 py-2.5 text-xs uppercase tracking-wider text-espresso hover:bg-linen transition-colors text-left"
                          >
                            <span>{sortLabels[option]}</span>
                            {sort === option && <Check size={14} className="text-forest" />}
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
              <div className="flex flex-col items-center justify-center py-20 px-6 text-center rounded-3xl bg-white border border-espresso/10 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-linen flex items-center justify-center mb-4">
                  <Package size={28} className="text-espresso-light" />
                </div>
                <span className="mb-2 text-[10px] font-semibold uppercase tracking-[0.28em] text-terracotta">
                  A new collection is on its way
                </span>
                <h3 className="font-serif text-2xl text-espresso">
                  {currentDeptInfo ? `${currentDeptInfo.brand} · Coming Soon` : 'No Products Found'}
                </h3>
                <p className="mt-2 text-sm text-espresso-soft max-w-md leading-relaxed">
                  {currentDeptInfo
                    ? `We are carefully preparing the first ${currentDeptInfo.brand} pieces. This collection will appear here as soon as products are approved and published.`
                    : 'No products match the selected filters. Try another department or clear your filters.'}
                </p>
                <div className="mt-6 flex flex-wrap gap-3 justify-center">
                  <Link to="/shop">
                    <Button variant="outline" size="sm">Explore Departments</Button>
                  </Link>
                </div>
              </div>
            ) : filtered.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center rounded-3xl bg-white border border-espresso/10 shadow-xs">
                <div className="w-16 h-16 rounded-full bg-linen flex items-center justify-center mb-4">
                  <Package size={28} className="text-espresso-light" />
                </div>
                <h3 className="font-serif text-xl text-espresso">No products match your current filters</h3>
                <p className="mt-2 text-xs text-espresso-soft max-w-sm mb-6">
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
            className="absolute inset-0 bg-espresso/60 backdrop-blur-sm animate-fade-in"
            onClick={() => setShowFilters(false)}
          />
          <div className="absolute right-0 top-0 bottom-0 w-[85%] max-w-sm bg-[#F6F2E9] animate-slide-in-right flex flex-col shadow-2xl border-l border-espresso/15">
            <div className="flex items-center justify-between px-6 h-18 border-b border-espresso/10 bg-white">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-espresso">Filter Catalogue</h2>
              <button onClick={() => setShowFilters(false)} aria-label="Close filters" className="p-2 -mr-2 text-espresso">
                <X size={22} />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto custom-scroll px-6 py-6">
              <FilterContent />
            </div>
            <div className="border-t border-espresso/10 px-6 py-4 bg-white">
              <Button variant="forest" size="lg" className="w-full" onClick={() => setShowFilters(false)}>
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
      <h3 className="text-[11px] font-semibold uppercase tracking-[0.24em] text-espresso-light mb-3">{title}</h3>
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
          checked ? 'bg-forest border-forest' : 'border-espresso/20 group-hover:border-espresso/40 bg-white'
        }`}
      >
        {checked && <Check size={11} className="text-ivory" />}
      </span>
      <span className={`text-xs ${checked ? 'text-espresso font-semibold' : 'text-espresso-soft'} group-hover:text-espresso transition-colors`}>
        {label}
      </span>
      <input type="checkbox" checked={checked} onChange={onChange} className="sr-only" />
    </label>
  );
}
