import { useMemo, useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { SlidersHorizontal, X, Check, ChevronDown, Package } from 'lucide-react';
import { products } from '../data';
import type { Product, AgeGroup, Category } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/ui';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import { useStore } from '../store';

const ALL_AGES: AgeGroup[] = ['Newborn', 'Baby', 'Toddler', 'Little Kids'];
const ALL_CATEGORIES: Category[] = ['Rompers', 'Co-ord Sets', 'Tees & Tops', 'Dresses', 'Bottoms', 'Sleepwear'];
const ALL_SIZES = ['0-3M', '3-6M', '6-12M', '12-18M', '1-2Y', '2-3Y', '3-4Y'];
const ALL_COLORS = [
  { name: 'Butter', hex: '#FFDA65' },
  { name: 'Peach', hex: '#F48B72' },
  { name: 'Sky', hex: '#8DC9E8' },
  { name: 'Pistachio', hex: '#B7D99A' },
  { name: 'Lilac', hex: '#B9A9E8' },
  { name: 'Cream', hex: '#FFF8EC' },
  { name: 'Ink', hex: '#25231F' },
];

type SortOption = 'featured' | 'price-low' | 'price-high' | 'newest';

export default function ShopPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { addToCart } = useStore();
  const [showFilters, setShowFilters] = useState(false);
  const [sortOpen, setSortOpen] = useState(false);
  const [sort, setSort] = useState<SortOption>('featured');

  // Read initial filters from URL
  const [selectedAges, setSelectedAges] = useState<Set<string>>(new Set());
  const [selectedCategories, setSelectedCategories] = useState<Set<string>>(new Set());
  const [selectedSizes, setSelectedSizes] = useState<Set<string>>(new Set());
  const [selectedColors, setSelectedColors] = useState<Set<string>>(new Set());
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 3000]);
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
    setPriceRange([0, 3000]);
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
    result = result.filter((p) => p.price >= priceRange[0] && p.price <= priceRange[1]);
    if (inStockOnly) {
      // All mock products are "in stock" — ready for future backend integration
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
        // featured: bestsellers first
        result.sort((a, b) => (b.isBestseller ? 1 : 0) - (a.isBestseller ? 1 : 0));
    }

    return result;
  }, [selectedAges, selectedCategories, selectedSizes, selectedColors, priceRange, inStockOnly, sort]);

  const activeFilterCount =
    selectedAges.size + selectedCategories.size + selectedSizes.size + selectedColors.size +
    (priceRange[0] > 0 || priceRange[1] < 3000 ? 1 : 0) + (inStockOnly ? 1 : 0);

  const handleQuickAdd = (product: Product) => {
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: product.colors[0].name,
      size: product.sizes[0],
      quantity: 1,
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
        {ALL_AGES.map((age) => (
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
        {ALL_CATEGORIES.map((cat) => (
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
          {ALL_SIZES.map((size) => (
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
          {ALL_COLORS.map((color) => (
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
            <span>₹{priceRange[1]}</span>
          </div>
          <input
            type="range"
            min={0}
            max={3000}
            step={100}
            value={priceRange[1]}
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
                Everyday favorites for tiny adventures — rompers, co-ord sets, dresses, and more, sized for newborns to 4 years.
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
