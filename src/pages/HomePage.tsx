import { useEffect, useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  Gem,
  Shirt,
  Home,
  Baby,
  ShieldCheck,
  Truck,
  Award,
  Layers,
} from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import { useStore } from '../useStore';
import type { Department, Product } from '../types';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import { departments, ageNavigation } from '../data/storeNavigation';

const editorial = '/images/editorial/version-b/';

export default function HomePage() {
  const { addToCart } = useStore();
  const { products, hero, loading: catalogLoading } = useCatalog();
  const [mounted, setMounted] = useState(false);
  const [activeArrivalsDept, setActiveArrivalsDept] = useState<Department | 'all'>('all');

  useEffect(() => setMounted(true), []);

  // Department-filtered arrivals
  const filteredArrivals = useMemo(() => {
    if (activeArrivalsDept === 'all') {
      const news = products.filter((p) => p.isNew);
      return news.length > 0 ? news.slice(0, 8) : products.slice(0, 8);
    }
    const deptProducts = products.filter((p) => (p.department || p.productType || 'kids') === activeArrivalsDept);
    const deptNews = deptProducts.filter((p) => p.isNew);
    return deptNews.length > 0 ? deptNews.slice(0, 8) : deptProducts.slice(0, 8);
  }, [products, activeArrivalsDept]);

  const handleQuickAdd = (product: Product) => {
    const variant = product.variants?.find((item) => item.available);
    if (product.variants?.length && !variant) return;
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: variant?.price ?? product.price,
      image: product.images[0],
      color: variant?.colour ?? product.colors[0]?.name ?? 'Standard',
      size: variant?.size ?? product.sizes[0] ?? 'Standard',
      quantity: 1,
      variantId: variant?.id,
    });
  };

  return (
    <div className="space-y-0">
      {/* 1. Grand Editorial Hero Campaign */}
      <section className="relative overflow-hidden bg-[#F8F5EE] border-b border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Left Narrative Column */}
            <div
              className="lg:col-span-7 flex flex-col justify-center"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(16px)',
                transition: 'opacity 0.8s ease-out, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1)',
              }}
            >
              <div className="flex items-center gap-2">
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-ivory">
                  <Sparkles size={13} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.26em] text-clay">
                  The Indian Luxury Flagship
                </span>
              </div>

              <h1 className="mt-6 font-serif text-4xl sm:text-6xl lg:text-7xl font-light leading-[1.04] text-charcoal tracking-tight text-balance">
                The Art of <span className="italic font-normal">Modern Living</span> & Adornment.
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-charcoal-soft">
                {hero?.body ||
                  'VJ Collection unites four distinct worlds of artisanal Indian luxury: Heirloom Jewellery, Unstitched Salwar Weaves, Sanctuary Home Bedding, and Mindful Childrenswear by Little Loom.'}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
                <Link to="/shop">
                  <Button variant="primary" size="lg" className="w-full sm:w-auto group">
                    Explore All Collections
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="#departments">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    Browse 4 Departments
                  </Button>
                </a>
              </div>

              {/* Trust Signature */}
              <div className="mt-12 pt-8 border-t border-charcoal/10 grid grid-cols-3 gap-4 text-xs text-charcoal-soft">
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-base text-charcoal font-medium">4 Departments</span>
                  <span className="text-[11px]">One Luxury House</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-base text-charcoal font-medium">100% Genuine</span>
                  <span className="text-[11px]">Artisanal Purity</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-base text-charcoal font-medium">Pan-India</span>
                  <span className="text-[11px]">Insured Shipping</span>
                </div>
              </div>
            </div>

            {/* Right Visual Composition */}
            <div
              className="lg:col-span-5"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.9s ease-out 0.15s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
              }}
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative border box */}
                <div className="absolute -inset-3 rounded-3xl border border-charcoal/15 -rotate-1 pointer-events-none" />

                <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-charcoal/10">
                  <img
                    src={`${editorial}hero-desktop.webp`}
                    alt="VJ Collection & Little Loom editorial"
                    className="aspect-[4/5] w-full object-cover"
                    fetchPriority="high"
                  />

                  {/* Floating Luxury Tag */}
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-4 backdrop-blur-md border border-charcoal/10 shadow-lg">
                    <p className="text-[10px] uppercase font-bold tracking-[0.2em] text-clay">
                      Editorial Curation
                    </p>
                    <p className="font-serif text-base text-charcoal mt-0.5">
                      The Festive & Everyday Handloom Edits
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Four Departments Showcase */}
      <section id="departments" className="py-20 lg:py-28 bg-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.24em] text-clay">
                <Sparkles size={14} /> Four Distinct Worlds
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-light text-charcoal">
                The VJ Collection <span className="italic">Departments</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-charcoal-soft leading-relaxed">
                Step into each dedicated department, curated with singular dedication to craftsmanship, material integrity, and timeless aesthetic beauty.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {departments.map((dept, index) => (
              <Reveal key={dept.id} delay={index * 80}>
                <Link
                  to={dept.landingPath}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-charcoal/10 bg-white p-7 transition-all duration-500 hover:-translate-y-2 hover:border-charcoal/30 hover:shadow-xl"
                  style={{ backgroundColor: dept.accentBg }}
                >
                  <div>
                    <div className="flex items-center justify-between pb-4 border-b border-charcoal/8">
                      <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-charcoal transition-transform group-hover:scale-110">
                        {dept.id === 'jewellery' && <Gem size={22} className="text-[#C5A059]" />}
                        {dept.id === 'women_suits' && <Shirt size={22} className="text-[#B25E46]" />}
                        {dept.id === 'home_textiles' && <Home size={22} className="text-[#3E5C76]" />}
                        {dept.id === 'kids' && <Baby size={22} className="text-[#C9826B]" />}
                      </span>
                      <span className="text-[11px] font-semibold uppercase tracking-widest text-charcoal-light">
                        0{index + 1}
                      </span>
                    </div>

                    <h3 className="mt-6 font-serif text-2xl font-light text-charcoal group-hover:text-clay transition-colors">
                      {dept.brand}
                    </h3>
                    <p className="mt-1 text-xs font-medium uppercase tracking-wider text-clay">
                      {dept.tagline.split(',')[0]}
                    </p>
                    <p className="mt-3.5 text-xs text-charcoal-soft leading-relaxed">
                      {dept.description}
                    </p>
                  </div>

                  <div className="mt-8 pt-4 border-t border-charcoal/10 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-charcoal group-hover:text-clay transition-colors">
                    <span>Explore Department</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* 3. Cross-Department New Arrivals Showcase */}
      <section className="py-20 lg:py-28 bg-[#F5F1E8] border-y border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10 pb-6 border-b border-charcoal/10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-clay">Just Published</span>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-light text-charcoal">
                  New Arrivals Across <span className="italic">Departments</span>
                </h2>
              </div>

              {/* Department Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-white/70 rounded-full border border-charcoal/10 shadow-xs">
                <button
                  onClick={() => setActiveArrivalsDept('all')}
                  className={`px-3.5 py-1.5 text-xs uppercase tracking-wider rounded-full transition-all ${
                    activeArrivalsDept === 'all'
                      ? 'bg-charcoal text-ivory font-semibold shadow-xs'
                      : 'text-charcoal-soft hover:text-charcoal'
                  }`}
                >
                  All
                </button>
                {departments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveArrivalsDept(d.id)}
                    className={`px-3.5 py-1.5 text-xs uppercase tracking-wider rounded-full transition-all ${
                      activeArrivalsDept === d.id
                        ? 'bg-charcoal text-ivory font-semibold shadow-xs'
                        : 'text-charcoal-soft hover:text-charcoal'
                    }`}
                  >
                    {d.brand.replace('VJ ', '')}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Products Grid / Rail */}
          {catalogLoading ? (
            <div className="py-16 text-center text-sm text-charcoal-light">Loading curated pieces…</div>
          ) : filteredArrivals.length === 0 ? (
            <div className="rounded-2xl border border-charcoal/10 bg-white p-10 text-center max-w-md mx-auto">
              <p className="font-serif text-xl text-charcoal">New Releases Underway</p>
              <p className="mt-2 text-xs text-charcoal-soft">
                New products for this department are being added through our admin management suite.
              </p>
              <Link to="/shop" className="mt-4 inline-block">
                <Button variant="outline" size="sm">Browse Full Catalogue</Button>
              </Link>
            </div>
          ) : (
            <>
              <div
                className="no-scrollbar snap-x-mandatory -mx-4 flex gap-5 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-6"
              >
                {filteredArrivals.map((product, idx) => (
                  <Reveal
                    key={product.id}
                    delay={idx * 60}
                    className="w-[260px] shrink-0 snap-start sm:w-[280px] lg:w-auto"
                  >
                    <ProductCard product={product} onQuickAdd={handleQuickAdd} />
                  </Reveal>
                ))}
              </div>
              <div className="mt-10 text-center">
                <Link to="/shop">
                  <Button variant="outline" size="lg">
                    View Complete Storefront Catalogue ({products.length} Products)
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. Feature Editorial 1: VJ Jewellery */}
      <section className="py-20 lg:py-28 bg-white border-b border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal y={40} className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-[#FAF7EE] border border-[#E5D8B8]">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#8F6E28]">
                  <Gem size={14} /> VJ Jewellery Feature
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-charcoal leading-[1.08] text-balance">
                  Heirloom Radiance for Contemporary Celebrations.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-charcoal-soft">
                  Discover handcrafted necklace sets, statement chandelier jhumkas, and tailored rings. Finished in premium gold and silver micron plating, each piece is designed for weddings, festive galas, and treasured heirloom collections.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/department/jewellery">
                    <Button variant="primary" size="lg" className="group">
                      Explore VJ Jewellery
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/shop?department=jewellery">
                    <Button variant="outline" size="lg">
                      Shop All Jewellery
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal y={40} delay={120} className="lg:col-span-6 order-1 lg:order-2">
              <div className="overflow-hidden rounded-3xl border border-charcoal/10 shadow-lg aspect-[4/3] sm:aspect-[16/11] bg-ivory">
                <img
                  src={`${editorial}category-rompers.webp`}
                  alt="Fine jewellery and celebration edit"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. Feature Editorial 2: VJ Suits & Fabrics */}
      <section className="py-20 lg:py-28 bg-[#FDF8F5] border-b border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal y={40} className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-charcoal/10 shadow-lg aspect-[4/3] sm:aspect-[16/11] bg-white">
                <img
                  src={`${editorial}category-coords.webp`}
                  alt="Pure woven unstitched suits and dupattas"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>

            <Reveal y={40} delay={120} className="lg:col-span-6">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#EAD1C8]">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#9A412A]">
                  <Shirt size={14} /> VJ Suits & Fabrics
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-charcoal leading-[1.08] text-balance">
                  The Purity of Unstitched Weaves.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-charcoal-soft">
                  Experience pure cotton, handloom silk, organza, Banarasi brocades, rayon, and winter wools. Complete 3-piece suit materials accompanied by artisan-crafted dupattas ready to be tailored to your distinct silhouette.
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/department/women-suits">
                    <Button variant="primary" size="lg" className="group">
                      Explore Suits & Fabrics
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/shop?department=women_suits">
                    <Button variant="outline" size="lg">
                      Browse Unstitched Suits
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. Feature Editorial 3: VJ Living */}
      <section className="py-20 lg:py-28 bg-[#F4F7F9] border-b border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal y={40} className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#C9D6DF]">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#2C4961]">
                  <Home size={14} /> VJ Living · Home Textiles
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-charcoal leading-[1.08] text-balance">
                  Sanctuary Linens & 60 × 90 Chaddars.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-charcoal-soft">
                  Natural, skin-friendly cotton bedding designed for restorative sleep. Discover single and double bedsheet sets with matching pillow covers, alongside our signature 60 × 90 single-bed top sheets (*odhne wali chaddars*).
                </p>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/department/living">
                    <Button variant="primary" size="lg" className="group">
                      Explore VJ Living
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/shop?department=home_textiles">
                    <Button variant="outline" size="lg">
                      Shop Bedding & Linen
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal y={40} delay={120} className="lg:col-span-6 order-1 lg:order-2">
              <div className="overflow-hidden rounded-3xl border border-charcoal/10 shadow-lg aspect-[4/3] sm:aspect-[16/11] bg-white">
                <img
                  src={`${editorial}category-sleepwear.webp`}
                  alt="Pure cotton home bedding and living textiles"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. Feature Editorial 4: Little Loom Children's Clothing */}
      <section className="py-20 lg:py-28 bg-[#FAF6F2] border-b border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <Reveal y={40} className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-charcoal/10 shadow-lg aspect-[4/3] sm:aspect-[16/11] bg-white">
                <img
                  src={`${editorial}category-dresses.webp`}
                  alt="Little Loom organic childrenswear"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>

            <Reveal y={40} delay={120} className="lg:col-span-6">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#E8D4CC]">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.24em] text-[#9B543F]">
                  <Baby size={14} /> Little Loom · Children's Clothing
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-charcoal leading-[1.08] text-balance">
                  Gentle Beginnings. Soft Organic Comfort.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-charcoal-soft">
                  Retaining its dedicated, lovingly curated character within VJ Collection, Little Loom creates cloud-soft playwear, rompers, and occasion outfits for newborns to 6 years.
                </p>

                {/* Shop by Age Milestone Links */}
                <div className="mt-6 pt-5 border-t border-charcoal/8">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-charcoal-light mb-2">
                    Browse by Age Milestone
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ageNavigation.map((age) => (
                      <Link
                        key={age.key}
                        to={`/shop?department=kids&age=${encodeURIComponent(age.key)}`}
                        className="px-3 py-1.5 rounded-full text-xs bg-ivory border border-charcoal/10 text-charcoal hover:border-charcoal hover:bg-white transition-all"
                      >
                        {age.label} ({age.range})
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3">
                  <Link to="/department/little-loom">
                    <Button variant="primary" size="lg" className="group">
                      Explore Little Loom
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/shop?department=kids">
                    <Button variant="outline" size="lg">
                      Shop Kidswear
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 8. Master Brand Heritage Story */}
      <section id="brand-story" className="py-20 lg:py-28 bg-white border-b border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal y={40} className="lg:col-span-5">
              <div className="relative">
                <div className="aspect-[4/5] overflow-hidden rounded-3xl shadow-xl border border-charcoal/10">
                  <img
                    src={`${editorial}brand-story.webp`}
                    alt="VJ Collection craftsmanship and heritage"
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                </div>
                {/* Accent Badge */}
                <div className="absolute -bottom-6 -right-6 hidden sm:flex h-28 w-28 items-center justify-center rounded-full bg-charcoal text-ivory p-4 text-center shadow-xl">
                  <p className="font-serif text-[11px] leading-snug tracking-wider uppercase">
                    Authentic Craftsmanship
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal y={40} delay={140} className="lg:col-span-7">
              <div className="flex flex-col gap-5">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-clay">
                  Our Legacy & Promise
                </span>
                <h2 className="font-serif text-3xl sm:text-5xl font-light leading-[1.08] text-charcoal text-balance">
                  Rooted in Indian Heritage, Tailored for the Modern Lifestyle.
                </h2>
                <div className="space-y-4 text-sm sm:text-base leading-relaxed text-charcoal-soft">
                  <p>
                    VJ Collection emerged from an uncompromising devotion to India's magnificent textile traditions, heirloom adornment techniques, and everyday living arts.
                  </p>
                  <p>
                    From our hand-finished necklace sets and certified pure cotton unstitched suits to cool single-bed chaddars and softest organic infant rompers, every piece celebrates material purity and honest value.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-3 gap-6 pt-6 mt-2 border-t border-charcoal/10">
                  <div>
                    <h3 className="font-serif text-2xl text-charcoal">100%</h3>
                    <p className="text-xs text-charcoal-light mt-0.5">Pure Verified Fibers</p>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-charcoal">4 Departments</h3>
                    <p className="text-xs text-charcoal-light mt-0.5">One Seamless Checkout</p>
                  </div>
                  <div>
                    <h3 className="font-serif text-2xl text-charcoal">Pan-India</h3>
                    <p className="text-xs text-charcoal-light mt-0.5">Insured Safe Transit</p>
                  </div>
                </div>

                <div className="mt-4">
                  <Link to="/shop">
                    <Button variant="primary" size="lg" className="group">
                      Browse The Complete Flagship
                      <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 9. Client Reassurance & Trust Pillars */}
      <section className="py-14 bg-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-charcoal/8 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ivory text-charcoal">
                <Truck size={22} />
              </div>
              <div>
                <h3 className="font-serif text-base text-charcoal font-medium">Pan-India Express</h3>
                <p className="text-xs text-charcoal-soft mt-0.5">Complimentary above ₹1,999</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-charcoal/8 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ivory text-charcoal">
                <ShieldCheck size={22} />
              </div>
              <div>
                <h3 className="font-serif text-base text-charcoal font-medium">Authenticity Assured</h3>
                <p className="text-xs text-charcoal-soft mt-0.5">Verified materials & specs</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-charcoal/8 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ivory text-charcoal">
                <Award size={22} />
              </div>
              <div>
                <h3 className="font-serif text-base text-charcoal font-medium">Artisanal Finish</h3>
                <p className="text-xs text-charcoal-soft mt-0.5">Handloom & fine plating</p>
              </div>
            </div>

            <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-charcoal/8 shadow-xs">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-ivory text-charcoal">
                <Layers size={22} />
              </div>
              <div>
                <h3 className="font-serif text-base text-charcoal font-medium">Transparent Pricing</h3>
                <p className="text-xs text-charcoal-soft mt-0.5">Direct value, zero gimmicks</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
