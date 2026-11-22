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
  RotateCcw,
  CheckCircle2,
} from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import { useStore } from '../useStore';
import type { Department, Product } from '../types';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import { departments, ageNavigation } from '../data/storeNavigation';

const vjEditorial = '/images/editorial/vj/';
const kidsEditorial = '/images/editorial/version-b/';

export default function HomePage() {
  const { addToCart } = useStore();
  const { products, hero, loading: catalogLoading } = useCatalog();
  const [mounted, setMounted] = useState(false);
  const [activeArrivalsDept, setActiveArrivalsDept] = useState<Department | 'all'>('all');
  const [newsletterEmail, setNewsletterEmail] = useState('');
  const [newsletterSubscribed, setNewsletterSubscribed] = useState(false);

  useEffect(() => setMounted(true), []);

  // Department-filtered arrivals from real catalogue
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

  const handleNewsletterSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newsletterEmail.trim()) {
      setNewsletterSubscribed(true);
      setNewsletterEmail('');
    }
  };

  return (
    <div className="space-y-0 bg-[#FAF8F5]">
      {/* 1. Grand Editorial Hero Campaign (Asymmetric Luxury Composition) */}
      <section className="relative overflow-hidden bg-[#FAF8F5] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-20 lg:px-8 lg:py-24">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
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
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-forest text-ivory">
                  <Sparkles size={12} />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">
                  The Indian Luxury Retail House
                </span>
              </div>

              <h1 className="mt-6 font-serif text-4xl sm:text-6xl lg:text-[68px] font-light leading-[1.04] text-espresso tracking-tight text-balance">
                Artisanal Living, <br />
                <span className="italic font-normal">Heirloom Adornment</span> & Textile Grace.
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-espresso-soft">
                {hero?.body ||
                  'VJ Collection unites four distinct worlds of curated Indian craft: Heirloom Jewellery in kundan and polki, pure unstitched Salwar Weaves, Sanctuary Home Bedding with 60×90 chaddars, and mindful childrenswear by Little Loom.'}
              </p>

              <div className="mt-8 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
                <Link to="/shop">
                  <Button variant="forest" size="lg" magnetic className="w-full sm:w-auto group">
                    <span>Explore Storefront</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="#departments">
                  <Button variant="outline" size="lg" className="w-full sm:w-auto">
                    The 4 Departments
                  </Button>
                </a>
              </div>

              {/* Verified Brand Trust Signature */}
              <div className="mt-12 pt-8 border-t border-espresso/10 grid grid-cols-3 gap-6 text-xs text-espresso-soft">
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-base text-espresso font-medium">4 Departments</span>
                  <span className="text-[11px]">One Master Retail House</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-base text-espresso font-medium">100% Verified</span>
                  <span className="text-[11px]">Artisanal Textile Purity</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-base text-espresso font-medium">Pan-India</span>
                  <span className="text-[11px]">Insured Free Above ₹1,999</span>
                </div>
              </div>
            </div>

            {/* Right Visual Composition (Authentic Editorial Photography) */}
            <div
              className="lg:col-span-5"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.9s ease-out 0.15s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
              }}
            >
              <div className="relative mx-auto max-w-md lg:max-w-none">
                {/* Decorative border frame with subtle tilt */}
                <div className="absolute -inset-3 rounded-3xl border border-espresso/12 -rotate-1 pointer-events-none" />

                <div className="relative overflow-hidden rounded-2xl bg-linen shadow-xl border border-espresso/10 aspect-[4/5]">
                  <img
                    src={`${vjEditorial}master-hero.jpg`}
                    alt="VJ Collection Indian luxury editorial showcase"
                    className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                    fetchPriority="high"
                  />

                  {/* Floating Editorial Card */}
                  <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-white/95 p-4 backdrop-blur-md border border-espresso/10 shadow-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] uppercase font-bold tracking-[0.24em] text-terracotta">
                        Editorial Edition
                      </p>
                      <span className="text-[10px] uppercase tracking-wider text-espresso-light">Autumn / Festive</span>
                    </div>
                    <p className="font-serif text-base text-espresso mt-1 font-medium">
                      The Handloom Weaves & Heirloom Adornment
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Four Distinct Departments (Asymmetric Editorial Entrance) */}
      <section id="departments" className="py-20 lg:py-28 bg-[#F4EFEA] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
                <Sparkles size={13} /> Four Distinct Worlds
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-light text-espresso">
                The VJ Collection <span className="italic font-normal">Departments</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-espresso-soft leading-relaxed">
                Step into each dedicated world, united by master craftsmanship, material integrity, and a singular aesthetic vision for modern Indian living.
              </p>
            </div>
          </Reveal>

          {/* Asymmetric 4-Department Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6">
            {/* Dept 1: VJ Jewellery (Large Feature - 6 cols) */}
            <Reveal className="lg:col-span-6 flex flex-col">
              <Link
                to="/department/jewellery"
                className="group relative flex-1 flex flex-col justify-between overflow-hidden rounded-2xl border border-espresso/10 bg-[#FAF6EE] p-8 sm:p-10 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:border-brass"
              >
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-espresso/10">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-brass">
                      <Gem size={22} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-brass">
                      Department 01
                    </span>
                  </div>

                  <h3 className="mt-6 font-serif text-3xl font-light text-espresso group-hover:text-forest transition-colors">
                    VJ Jewellery
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-brass">
                    Heirloom Kundan, Polki & Fine Artisanal Sets
                  </p>
                  <p className="mt-4 text-sm text-espresso-soft leading-relaxed">
                    Bridal choker necklaces, chandelier jhumkas, and handcrafted rings in premium gold and silver micron plating, designed for celebration and generational keep.
                  </p>

                  <div className="mt-6 relative overflow-hidden rounded-xl aspect-[16/9] border border-espresso/8 bg-linen">
                    <img
                      src={`${vjEditorial}jewellery-hero.jpg`}
                      alt="VJ Jewellery showcase"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-espresso/10 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso group-hover:text-forest transition-colors">
                  <span>Enter VJ Jewellery</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </Reveal>

            {/* Dept 2: VJ Suits & Fabrics (Large Feature - 6 cols) */}
            <Reveal delay={100} className="lg:col-span-6 flex flex-col">
              <Link
                to="/department/women-suits"
                className="group relative flex-1 flex flex-col justify-between overflow-hidden rounded-2xl border border-espresso/10 bg-[#FAF3EF] p-8 sm:p-10 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:border-terracotta"
              >
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-espresso/10">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-terracotta">
                      <Shirt size={22} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-terracotta">
                      Department 02
                    </span>
                  </div>

                  <h3 className="mt-6 font-serif text-3xl font-light text-espresso group-hover:text-terracotta transition-colors">
                    VJ Suits & Fabrics
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                    Pure Cotton, Handloom Silk, Organza & Banarasi
                  </p>
                  <p className="mt-4 text-sm text-espresso-soft leading-relaxed">
                    Unstitched 3-piece salwar suit fabrics accompanied by coordinating artisanal dupattas, providing tailoring freedom for your personalized silhouette.
                  </p>

                  <div className="mt-6 relative overflow-hidden rounded-xl aspect-[16/9] border border-espresso/8 bg-linen">
                    <img
                      src={`${vjEditorial}suits-hero.jpg`}
                      alt="VJ Suits & Fabrics pure weave"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-espresso/10 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso group-hover:text-terracotta transition-colors">
                  <span>Enter Suits & Fabrics</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </Reveal>

            {/* Dept 3: VJ Living (6 cols) */}
            <Reveal delay={150} className="lg:col-span-6 flex flex-col">
              <Link
                to="/department/living"
                className="group relative flex-1 flex flex-col justify-between overflow-hidden rounded-2xl border border-espresso/10 bg-[#F3F6F4] p-8 sm:p-10 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:border-forest"
              >
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-espresso/10">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-forest">
                      <Home size={22} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-forest">
                      Department 03
                    </span>
                  </div>

                  <h3 className="mt-6 font-serif text-3xl font-light text-espresso group-hover:text-forest transition-colors">
                    VJ Living
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-forest">
                    Pure Cotton Bedsheets & 60 × 90 Chaddars
                  </p>
                  <p className="mt-4 text-sm text-espresso-soft leading-relaxed">
                    Cool, breathable cotton double bedsheets with matching pillow covers, and confirmed 60 × 90 single-bed top sheets (*odhne wali chaddars*) for peaceful sleep.
                  </p>

                  <div className="mt-6 relative overflow-hidden rounded-xl aspect-[16/9] border border-espresso/8 bg-linen">
                    <img
                      src={`${vjEditorial}living-hero.jpg`}
                      alt="VJ Living cotton sanctuary bedding"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-espresso/10 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso group-hover:text-forest transition-colors">
                  <span>Enter VJ Living</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </Reveal>

            {/* Dept 4: Little Loom (6 cols) */}
            <Reveal delay={200} className="lg:col-span-6 flex flex-col">
              <Link
                to="/department/little-loom"
                className="group relative flex-1 flex flex-col justify-between overflow-hidden rounded-2xl border border-espresso/10 bg-[#FAF4EF] p-8 sm:p-10 transition-all duration-500 hover:-translate-y-1.5 hover:shadow-xl hover:border-[#C87D65]"
              >
                <div>
                  <div className="flex items-center justify-between pb-6 border-b border-espresso/10">
                    <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs text-[#C87D65]">
                      <Baby size={22} />
                    </span>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-[#C87D65]">
                      Department 04
                    </span>
                  </div>

                  <h3 className="mt-6 font-serif text-3xl font-light text-espresso group-hover:text-forest transition-colors">
                    Little Loom
                  </h3>
                  <p className="mt-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-[#C87D65]">
                    Mindful Childrenswear for Newborn to 6 Years
                  </p>
                  <p className="mt-4 text-sm text-espresso-soft leading-relaxed">
                    Retaining its dedicated, lovingly curated character within VJ Collection, Little Loom crafts cloud-soft organic playwear, rompers, and occasion outfits.
                  </p>

                  <div className="mt-6 relative overflow-hidden rounded-xl aspect-[16/9] border border-espresso/8 bg-linen">
                    <img
                      src={`${kidsEditorial}hero-desktop.webp`}
                      alt="Little Loom organic childrenswear"
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>

                <div className="mt-8 pt-4 border-t border-espresso/10 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso group-hover:text-[#C87D65] transition-colors">
                  <span>Enter Little Loom</span>
                  <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                </div>
              </Link>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. Cross-Department Curated Arrivals (Real Catalogue Data) */}
      <section className="py-20 lg:py-28 bg-[#FAF8F5] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-12 pb-6 border-b border-espresso/10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
                  Curated Catalog Releases
                </span>
                <h2 className="mt-2 font-serif text-3xl sm:text-4xl font-light text-espresso">
                  New Arrivals Across <span className="italic font-normal">Departments</span>
                </h2>
              </div>

              {/* Department Selector Filter Pills */}
              <div className="flex flex-wrap items-center gap-1.5 p-1 bg-linen rounded-full border border-espresso/10 shadow-xs">
                <button
                  onClick={() => setActiveArrivalsDept('all')}
                  className={`px-4 py-2 text-xs uppercase tracking-wider rounded-full transition-all ${
                    activeArrivalsDept === 'all'
                      ? 'bg-espresso text-ivory font-semibold shadow-xs'
                      : 'text-espresso-soft hover:text-espresso'
                  }`}
                >
                  All (4)
                </button>
                {departments.map((d) => (
                  <button
                    key={d.id}
                    onClick={() => setActiveArrivalsDept(d.id)}
                    className={`px-4 py-2 text-xs uppercase tracking-wider rounded-full transition-all ${
                      activeArrivalsDept === d.id
                        ? 'bg-espresso text-ivory font-semibold shadow-xs'
                        : 'text-espresso-soft hover:text-espresso'
                    }`}
                  >
                    {d.brand.replace('VJ ', '')}
                  </button>
                ))}
              </div>
            </div>
          </Reveal>

          {/* Product Cards Rail */}
          {catalogLoading ? (
            <div className="py-20 text-center text-sm text-espresso-light">
              Loading curated pieces from store catalogue…
            </div>
          ) : filteredArrivals.length === 0 ? (
            <div className="rounded-2xl border border-espresso/10 bg-white p-12 text-center max-w-lg mx-auto shadow-xs">
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-linen text-espresso mb-4">
                <Sparkles size={20} />
              </span>
              <p className="font-serif text-2xl text-espresso font-light">New Assortment Underway</p>
              <p className="mt-2 text-xs text-espresso-soft leading-relaxed">
                Products for this department are being published through our verified intake workflow. Browse all active collections or explore our department showcases.
              </p>
              <div className="mt-6 flex justify-center gap-3">
                <Link to="/shop">
                  <Button variant="primary" size="md">
                    Explore Storefront
                  </Button>
                </Link>
                <a href="#departments">
                  <Button variant="outline" size="md">
                    Department Showcases
                  </Button>
                </a>
              </div>
            </div>
          ) : (
            <>
              <div className="no-scrollbar snap-x-mandatory -mx-4 flex gap-6 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 lg:grid lg:grid-cols-4 lg:gap-6">
                {filteredArrivals.map((product, idx) => (
                  <Reveal
                    key={product.id}
                    delay={idx * 60}
                    className="w-[270px] shrink-0 snap-start sm:w-[290px] lg:w-auto"
                  >
                    <ProductCard product={product} onQuickAdd={handleQuickAdd} />
                  </Reveal>
                ))}
              </div>
              <div className="mt-12 text-center">
                <Link to="/shop">
                  <Button variant="outline" size="lg">
                    View Complete Catalogue ({products.length} Verified Pieces)
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. Art-Directed Editorial Feature 1: VJ Jewellery */}
      <section className="py-20 lg:py-28 bg-[#FAF6EE] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal y={30} className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#E6D7B4] shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-brass">
                  <Gem size={14} /> VJ Jewellery Spotlight
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-espresso leading-[1.08] text-balance">
                  Heirloom Radiance for Contemporary Celebrations.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-espresso-soft">
                  Handcrafted necklace sets, chandelier jhumkas, and tailored rings. Finished in high-micron gold and silver plating with artisanal kundan and polki stones, each piece is designed for weddings, festive galas, and treasured heirloom collections.
                </p>

                {/* Vignette Categories */}
                <div className="mt-6 pt-5 border-t border-espresso/8 grid grid-cols-3 gap-3 text-center">
                  <Link
                    to="/shop?department=jewellery&category=necklace-sets"
                    className="p-3 rounded-xl bg-linen hover:bg-[#FAF6EE] transition-colors border border-espresso/6"
                  >
                    <span className="font-serif text-sm font-medium text-espresso block">Necklaces</span>
                    <span className="text-[10px] text-espresso-light">Chokers & Sets</span>
                  </Link>
                  <Link
                    to="/shop?department=jewellery&category=earrings"
                    className="p-3 rounded-xl bg-linen hover:bg-[#FAF6EE] transition-colors border border-espresso/6"
                  >
                    <span className="font-serif text-sm font-medium text-espresso block">Earrings</span>
                    <span className="text-[10px] text-espresso-light">Jhumkas & Studs</span>
                  </Link>
                  <Link
                    to="/shop?department=jewellery&category=rings"
                    className="p-3 rounded-xl bg-linen hover:bg-[#FAF6EE] transition-colors border border-espresso/6"
                  >
                    <span className="font-serif text-sm font-medium text-espresso block">Rings</span>
                    <span className="text-[10px] text-espresso-light">Tailored & Fixed</span>
                  </Link>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
                  <Link to="/department/jewellery">
                    <Button variant="brass" size="lg" className="group w-full sm:w-auto">
                      <span>Explore VJ Jewellery</span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/shop?department=jewellery">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Shop All Jewellery
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal y={30} delay={120} className="lg:col-span-6 order-1 lg:order-2">
              <div className="overflow-hidden rounded-3xl border border-espresso/12 shadow-xl aspect-[4/3] sm:aspect-[16/11] bg-linen">
                <img
                  src={`${vjEditorial}jewellery-necklace.jpg`}
                  alt="Fine handcrafted kundan necklace set"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. Art-Directed Editorial Feature 2: VJ Suits & Fabrics */}
      <section className="py-20 lg:py-28 bg-[#FAF3EF] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal y={30} className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-espresso/12 shadow-xl aspect-[4/3] sm:aspect-[16/11] bg-linen">
                <img
                  src={`${vjEditorial}suits-fabrics.jpg`}
                  alt="Pure woven unstitched suits and dupattas"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>

            <Reveal y={30} delay={120} className="lg:col-span-6">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#ECCDC4] shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
                  <Shirt size={14} /> VJ Suits & Fabrics Spotlight
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-espresso leading-[1.08] text-balance">
                  The Purity of Unstitched Weaves.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-espresso-soft">
                  Experience pure breathable cotton, festive handloom silk, sheer organza, rich Banarasi brocades with zari motifs, fluid rayon, and cozy winter wools. Every set features generous top, bottom, and artisan-crafted dupatta lengths ready to be tailored to your distinct grace.
                </p>

                {/* Fabric Type Badges */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {['Pure Cotton', 'Mulberry Silk', 'Banarasi Zari', 'Organza Sheer', 'Rayon', 'Winter Wool'].map((fabric) => (
                    <span
                      key={fabric}
                      className="px-3 py-1 rounded-full text-xs bg-linen border border-espresso/8 text-espresso font-medium"
                    >
                      {fabric}
                    </span>
                  ))}
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
                  <Link to="/department/women-suits">
                    <Button variant="terracotta" size="lg" className="group w-full sm:w-auto">
                      <span>Explore Suits & Fabrics</span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/shop?department=women_suits">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Browse Unstitched Sets
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. Art-Directed Editorial Feature 3: VJ Living */}
      <section className="py-20 lg:py-28 bg-[#F3F6F4] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal y={30} className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#D0DDD4] shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-forest">
                  <Home size={14} /> VJ Living · Home Sanctuary
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-espresso leading-[1.08] text-balance">
                  Sanctuary Linens & 60 × 90 Chaddars.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-espresso-soft">
                  Natural, skin-friendly cotton bedding designed for peaceful rest. Discover double bedsheet sets with matching tailored pillow covers, alongside our signature 60 × 90 single-bed top sheets (*odhne wali chaddars*) measured to standard Indian dimensions.
                </p>

                {/* Confirmed Specifications Card */}
                <div className="mt-6 p-4 rounded-xl bg-linen border border-espresso/8">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest mb-1">
                    <CheckCircle2 size={15} /> Confirmed 60 × 90 Single Top Sheet Standard
                  </div>
                  <p className="text-xs text-espresso-soft leading-relaxed">
                    100% pure cotton, measured in inches (60 in &times; 90 in), breathable summer and trans-seasonal weave that softens with every wash.
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
                  <Link to="/department/living">
                    <Button variant="forest" size="lg" className="group w-full sm:w-auto">
                      <span>Explore VJ Living</span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/shop?department=home_textiles">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Shop Bedding & Linen
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>

            <Reveal y={30} delay={120} className="lg:col-span-6 order-1 lg:order-2">
              <div className="overflow-hidden rounded-3xl border border-espresso/12 shadow-xl aspect-[4/3] sm:aspect-[16/11] bg-linen">
                <img
                  src={`${vjEditorial}living-chaddar.jpg`}
                  alt="Pure cotton home bedding and single top sheet"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. Art-Directed Editorial Feature 4: Little Loom */}
      <section className="py-20 lg:py-28 bg-[#FAF4EF] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal y={30} className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-espresso/12 shadow-xl aspect-[4/3] sm:aspect-[16/11] bg-linen">
                <img
                  src={`${kidsEditorial}newborn.webp`}
                  alt="Little Loom organic childrenswear"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>

            <Reveal y={30} delay={120} className="lg:col-span-6">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#EBD7CD] shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#C87D65]">
                  <Baby size={14} /> Little Loom · Children's Clothing
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-espresso leading-[1.08] text-balance">
                  Gentle Beginnings. Soft Organic Comfort.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-espresso-soft">
                  Retaining its dedicated, lovingly curated character within VJ Collection, Little Loom crafts cloud-soft playwear, rompers, and occasion outfits for newborns to 6 years with hypoallergenic organic cotton and non-scratch finishes.
                </p>

                {/* Shop by Age Milestone Links */}
                <div className="mt-6 pt-5 border-t border-espresso/8">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-espresso-light mb-2.5">
                    Browse by Age Milestone
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {ageNavigation.map((age) => (
                      <Link
                        key={age.key}
                        to={`/shop?department=kids&age=${encodeURIComponent(age.key)}`}
                        className="px-3.5 py-1.5 rounded-full text-xs bg-linen border border-espresso/10 text-espresso hover:border-espresso hover:bg-white transition-all"
                      >
                        {age.label} ({age.range})
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
                  <Link to="/department/little-loom">
                    <Button variant="primary" size="lg" className="group w-full sm:w-auto">
                      <span>Explore Little Loom</span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/shop?department=kids">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Shop Children's Clothing
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 8. The VJ Collection Heritage & Four Worlds Story */}
      <section id="brand-story" className="py-24 lg:py-32 bg-[#FAF8F5] border-b border-espresso/10">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <Reveal>
            <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.3em] text-terracotta">
              Our Heritage & Philosophy
            </span>
            <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-espresso leading-[1.12]">
              Four Worlds of Indian Craft, <br />
              <span className="italic font-normal">One Master Retail House</span>.
            </h2>
            <div className="mt-8 space-y-5 text-sm sm:text-base leading-relaxed text-espresso-soft max-w-2xl mx-auto">
              <p>
                VJ Collection was established with a singular devotion: bringing together the authentic craftsmanship of Indian textiles, jewellery, and home living under one elevated roof.
              </p>
              <p>
                From the intricate kundan settings of royal jewellery to the rhythmic clack of wooden looms weaving unstitched salwar suits and cool 60&times;90 cotton bedding, our pieces honour generational craft while embracing modern aesthetics.
              </p>
              <p>
                And within this house, Little Loom preserves its special soul—creating gentle, pure cotton clothing for the smallest members of our families.
              </p>
            </div>

            <div className="mt-12 flex flex-wrap justify-center gap-4">
              <Link to="/shop">
                <Button variant="forest" size="lg">
                  Explore Full Catalogue
                </Button>
              </Link>
              <Link to="/contact">
                <Button variant="outline" size="lg">
                  Contact Our Concierge
                </Button>
              </Link>
            </div>
          </Reveal>
        </div>
      </section>

      {/* 9. Verified Client Service & Delivery Standards */}
      <section className="py-14 bg-white border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linen text-espresso">
                <Truck size={20} />
              </span>
              <div>
                <h4 className="font-serif text-base font-medium text-espresso">Insured Pan-India Delivery</h4>
                <p className="mt-1 text-xs text-espresso-soft leading-relaxed">
                  Complimentary tracked and insured dispatch on all orders above ₹1,999 across India.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linen text-espresso">
                <ShieldCheck size={20} />
              </span>
              <div>
                <h4 className="font-serif text-base font-medium text-espresso">100% Genuine Quality</h4>
                <p className="mt-1 text-xs text-espresso-soft leading-relaxed">
                  Every fabric length, jewellery finish, and bedsheet weave is quality-verified before dispatch.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linen text-espresso">
                <Sparkles size={20} />
              </span>
              <div>
                <h4 className="font-serif text-base font-medium text-espresso">Artisanal Craftsmanship</h4>
                <p className="mt-1 text-xs text-espresso-soft leading-relaxed">
                  Direct partnership with skilled Indian weavers, kundan artisans, and textile craftspeople.
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-linen text-espresso">
                <RotateCcw size={20} />
              </span>
              <div>
                <h4 className="font-serif text-base font-medium text-espresso">Dedicated Assistance</h4>
                <p className="mt-1 text-xs text-espresso-soft leading-relaxed">
                  Direct WhatsApp concierge support for sizing questions, fabric lengths, and bridal orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Refined Newsletter Subscription Strip */}
      <section className="py-16 bg-[#FAF4EF] border-b border-espresso/10">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
            The VJ Collection Journal
          </span>
          <h3 className="mt-2 font-serif text-2xl sm:text-3xl font-light text-espresso">
            Be the First to Experience New Releases
          </h3>
          <p className="mt-2 text-xs sm:text-sm text-espresso-soft leading-relaxed max-w-lg mx-auto">
            Receive private preview invitations for limited festive fabric weaves, heirloom jewellery editions, and seasonal bedding launches.
          </p>

          {newsletterSubscribed ? (
            <div className="mt-6 p-4 rounded-xl bg-white border border-[#ECCDC4] text-xs font-medium text-espresso shadow-xs">
              Thank you for subscribing to the VJ Collection Journal. We look forward to sharing our finest edits with you.
            </div>
          ) : (
            <form onSubmit={handleNewsletterSubmit} className="mt-6 flex flex-col sm:flex-row gap-2.5 max-w-md mx-auto">
              <input
                type="email"
                required
                value={newsletterEmail}
                onChange={(e) => setNewsletterEmail(e.target.value)}
                placeholder="Enter your email address"
                className="flex-1 px-4 py-3 rounded-full border border-espresso/20 bg-white text-xs text-espresso outline-none focus:border-espresso transition-colors placeholder:text-espresso-light"
              />
              <Button type="submit" variant="forest" size="md">
                Subscribe
              </Button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
