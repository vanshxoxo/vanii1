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
import TiltCard from '../components/TiltCard';
import { departments, ageNavigation } from '../data/storeNavigation';

const vjEditorial = '/images/editorial/vj/';
const kidsEditorial = '/images/editorial/version-b/';

export default function HomePage() {
  const { addToCart } = useStore();
  const { products, hero, loading: catalogLoading } = useCatalog();
  const [mounted, setMounted] = useState(false);
  const [activeArrivalsDept, setActiveArrivalsDept] = useState<Department | 'all'>('all');
  const [selectedFabricTab, setSelectedFabricTab] = useState<'cotton' | 'silk' | 'banarasi' | 'organza' | 'wool'>('silk');
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
    <div className="space-y-0 bg-[#F6F2E9]">
      {/* 1. Grand Editorial Hero Campaign (Asymmetric Luxury Composition) */}
      <section className="relative overflow-hidden bg-[#F6F2E9] border-b border-espresso/10">
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
                  <Sparkles size={12} className="brand-sparkle" />
                </span>
                <span className="text-[11px] font-semibold uppercase tracking-[0.28em] text-terracotta">
                  Four Indian Craft Traditions · One Retail House
                </span>
              </div>

              <h1 className="mt-6 font-serif text-4xl sm:text-6xl lg:text-[66px] font-light leading-[1.04] text-espresso tracking-tight text-balance">
                Heirloom Adornment, <br />
                <span className="italic font-normal">Unstitched Silks</span> & Sanctuary Living.
              </h1>

              <p className="mt-6 max-w-xl text-base sm:text-lg leading-relaxed text-espresso-soft">
                {hero?.body ||
                  'VJ Collection unites four distinct worlds of Indian craft: Bridal Jewellery in handcrafted kundan and polki, ladies unstitched Salwar Suits in silk and handloom cotton, Sanctuary Bedding with handwritten 60×90 top sheets, and gentle childrenswear by Little Loom.'}
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

              {/* Verified Brand Integrity Signature */}
              <div className="mt-12 pt-8 border-t border-espresso/10 grid grid-cols-3 gap-6 text-xs text-espresso-soft">
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-base text-espresso font-medium">4 Departments</span>
                  <span className="text-[11px]">Jewellery · Suits · Living · Kids</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-base text-espresso font-medium">Handloom Purity</span>
                  <span className="text-[11px]">Pure Silks & Combed Cottons</span>
                </div>
                <div className="flex flex-col gap-1">
                  <span className="font-serif text-base text-espresso font-medium">Insured Dispatch</span>
                  <span className="text-[11px]">Complimentary Above ₹1,999</span>
                </div>
              </div>
            </div>

            {/* Right Visual Composition (TiltCard with Authentic Editorial Photography) */}
            <div
              className="lg:col-span-5"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                transition: 'opacity 0.9s ease-out 0.15s, transform 0.9s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
              }}
            >
              <TiltCard maxTilt={3.5} className="mx-auto max-w-md lg:max-w-none">
                <div className="relative">
                  {/* Decorative fine border frame */}
                  <div className="absolute -inset-3 rounded-3xl border border-espresso/12 -rotate-1 pointer-events-none" />

                  <div className="relative overflow-hidden rounded-2xl bg-linen shadow-xl border border-espresso/10 aspect-[4/5] textile-glide">
                    <img
                      src={`${vjEditorial}master-hero.jpg`}
                      alt="VJ Collection Indian luxury editorial showcase"
                      className="h-full w-full object-cover transition-transform duration-1000 hover:scale-105"
                      fetchPriority="high"
                    />

                    {/* Editorial Card Note */}
                    <div className="absolute bottom-5 left-5 right-5 rounded-xl bg-white/95 p-4 backdrop-blur-md border border-espresso/10 shadow-lg">
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] uppercase font-bold tracking-[0.24em] text-terracotta">
                          VJ Collection Atelier
                        </p>
                        <span className="text-[10px] uppercase tracking-wider text-espresso-light">Autumn & Festive</span>
                      </div>
                      <p className="font-serif text-base text-espresso mt-1 font-medium">
                        The Handloom Silks & Heirloom Adornment
                      </p>
                    </div>
                  </div>
                </div>
              </TiltCard>
            </div>
          </div>
        </div>
      </section>

      {/* 2. The Four Distinct Departments (Asymmetric Editorial Magazine Layout) */}
      <section id="departments" className="py-20 lg:py-28 bg-[#EDE7DE] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-16">
              <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
                <Sparkles size={13} className="brand-sparkle" /> The Four Departments
              </span>
              <h2 className="mt-3 font-serif text-3xl sm:text-5xl font-light text-espresso">
                Step into Our <span className="italic font-normal">Dedicated Worlds</span>
              </h2>
              <p className="mt-4 text-sm sm:text-base text-espresso-soft leading-relaxed">
                Each department is anchored by genuine artisanal materials, specialized tailoring options, and dedicated customer service.
              </p>
            </div>
          </Reveal>

          {/* Asymmetric 4-Department Layout (7/5 and 5/7 columns for high editorial visual interest) */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch">
            {/* Dept 1: VJ Jewellery (Editorial Lead - 7 cols) */}
            <Reveal className="lg:col-span-7 flex flex-col">
              <TiltCard maxTilt={2.5} className="h-full">
                <Link
                  to="/department/jewellery"
                  className="group relative flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-[#E5D6BD] bg-[#F8F4EC] p-8 sm:p-10 transition-all duration-500 hover:shadow-xl hover:border-brass"
                >
                  <div>
                    <div className="flex items-center justify-between pb-6 border-b border-espresso/10">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-brass">
                          <Gem size={20} />
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-brass block">
                            Department 01
                          </span>
                          <span className="text-xs text-espresso-soft">Heirloom Adornment</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-serif italic text-brass font-medium">
                        Kundan, Polki & Semi-Precious
                      </span>
                    </div>

                    <h3 className="mt-6 font-serif text-3xl sm:text-4xl font-light text-espresso group-hover:text-brass transition-colors">
                      VJ Jewellery
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-brass">
                      Necklace Sets · Chandelier Earrings · Artisanal Rings
                    </p>
                    <p className="mt-3.5 text-sm text-espresso-soft leading-relaxed max-w-xl">
                      Bridal choker necklaces, chandelier jhumkas, and handcrafted rings in premium gold and silver micron plating, designed for celebration and generational keep.
                    </p>

                    <div className="mt-6 relative overflow-hidden rounded-xl aspect-[16/9] border border-espresso/8 bg-linen jewellery-glint">
                      <img
                        src={`${vjEditorial}jewellery-hero.jpg`}
                        alt="VJ Jewellery handcrafted bridal set"
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                        loading="lazy"
                      />
                    </div>
                  </div>

                  <div className="mt-8 pt-4 border-t border-espresso/10 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso group-hover:text-brass transition-colors">
                    <span>Explore VJ Jewellery Collection</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </TiltCard>
            </Reveal>

            {/* Dept 2: VJ Suits & Fabrics (Textile Lead - 5 cols) */}
            <Reveal delay={100} className="lg:col-span-5 flex flex-col">
              <TiltCard maxTilt={2.5} className="h-full">
                <Link
                  to="/department/women_suits"
                  className="group relative flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-[#E6C6BC] bg-[#FAF1ED] p-8 transition-all duration-500 hover:shadow-xl hover:border-terracotta"
                >
                  <div>
                    <div className="flex items-center justify-between pb-6 border-b border-espresso/10">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-terracotta">
                          <Shirt size={20} />
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-terracotta block">
                            Department 02
                          </span>
                          <span className="text-xs text-espresso-soft">Ladies' Salwar Fabrics</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-serif italic text-terracotta font-medium">
                        6 Signature Weaves
                      </span>
                    </div>

                    <h3 className="mt-6 font-serif text-3xl font-light text-espresso group-hover:text-terracotta transition-colors">
                      VJ Suits & Fabrics
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-terracotta">
                      Pure Cotton · Silk · Organza · Banarasi · Rayon · Wool
                    </p>
                    <p className="mt-3.5 text-sm text-espresso-soft leading-relaxed">
                      Complete unstitched 3-piece salwar suit fabrics accompanied by coordinating dupattas, providing full tailoring freedom for your personal silhouette.
                    </p>

                    <div className="mt-6 relative overflow-hidden rounded-xl aspect-[16/10] border border-espresso/8 bg-linen textile-glide">
                      <img
                        src={`${vjEditorial}suits-hero.jpg`}
                        alt="VJ Suits & Fabrics unstitched handloom yardage"
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
              </TiltCard>
            </Reveal>

            {/* Dept 3: VJ Living (Interior Sanctuary - 5 cols) */}
            <Reveal delay={150} className="lg:col-span-5 flex flex-col">
              <TiltCard maxTilt={2.5} className="h-full">
                <Link
                  to="/department/home_textiles"
                  className="group relative flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-[#CAD6CE] bg-[#EDF2EE] p-8 transition-all duration-500 hover:shadow-xl hover:border-forest"
                >
                  <div>
                    <div className="flex items-center justify-between pb-6 border-b border-espresso/10">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-forest">
                          <Home size={20} />
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-forest block">
                            Department 03
                          </span>
                          <span className="text-xs text-espresso-soft">Home Sanctuary</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-serif italic text-forest font-medium">
                        Pure Cotton Bedding
                      </span>
                    </div>

                    <h3 className="mt-6 font-serif text-3xl font-light text-espresso group-hover:text-forest transition-colors">
                      VJ Living
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-forest">
                      Double Bedsheets · Single Bedsheets · 60 × 90 Chaddars · Pillow Covers
                    </p>
                    <p className="mt-3.5 text-sm text-espresso-soft leading-relaxed">
                      Cool, breathable double bedsheet sets with matching pillow covers, and traditional 60 × 90 single-bed top sheets (*odhne wali chaddars*) in pure cotton.
                    </p>

                    <div className="mt-6 relative overflow-hidden rounded-xl aspect-[16/10] border border-espresso/8 bg-linen">
                      <img
                        src={`${vjEditorial}living-hero.jpg`}
                        alt="VJ Living pure cotton bedding sanctuary"
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
              </TiltCard>
            </Reveal>

            {/* Dept 4: Little Loom (Gentle Nursery - 7 cols) */}
            <Reveal delay={200} className="lg:col-span-7 flex flex-col">
              <TiltCard maxTilt={2.5} className="h-full">
                <Link
                  to="/department/kids"
                  className="group relative flex flex-col justify-between h-full overflow-hidden rounded-2xl border border-[#D8DCD1] bg-[#F3F5F0] p-8 sm:p-10 transition-all duration-500 hover:shadow-xl hover:border-[#6B735B]"
                >
                  <div>
                    <div className="flex items-center justify-between pb-6 border-b border-espresso/10">
                      <div className="flex items-center gap-3">
                        <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-white shadow-xs text-[#6B735B] playful-sway">
                          <Baby size={20} />
                        </span>
                        <div>
                          <span className="text-[10px] font-bold uppercase tracking-[0.24em] text-[#6B735B] block">
                            Department 04
                          </span>
                          <span className="text-xs text-espresso-soft">Children's Clothing</span>
                        </div>
                      </div>
                      <span className="text-[11px] font-serif italic text-[#6B735B] font-medium">
                        Newborn to 6 Years
                      </span>
                    </div>

                    <h3 className="mt-6 font-serif text-3xl sm:text-4xl font-light text-espresso group-hover:text-[#6B735B] transition-colors">
                      Little Loom
                    </h3>
                    <p className="mt-1 text-xs font-semibold uppercase tracking-[0.18em] text-[#6B735B]">
                      Organic Cotton Rompers · Co-ords · Dresses · Sleepwear
                    </p>
                    <p className="mt-3.5 text-sm text-espresso-soft leading-relaxed max-w-xl">
                      Preserving its dedicated, tender soul within VJ Collection, Little Loom crafts cloud-soft organic playwear and milestone pieces with tagless flatlock seams.
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

                  <div className="mt-8 pt-4 border-t border-espresso/10 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso group-hover:text-[#6B735B] transition-colors">
                    <span>Enter Little Loom Store</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </TiltCard>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 3. Cross-Department Curated Arrivals (Real Catalogue Data) */}
      <section className="py-20 lg:py-28 bg-[#F6F2E9] border-b border-espresso/10">
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
                    View Complete Catalogue ({products.length} Pieces)
                  </Button>
                </Link>
              </div>
            </>
          )}
        </div>
      </section>

      {/* 4. Editorial Feature 1: VJ Jewellery (Salon Gallery Composition) */}
      <section className="py-20 lg:py-28 bg-[#F8F4EC] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal y={30} className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#E5D6BD] shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-brass">
                  <Gem size={14} /> VJ Jewellery · Heirloom Atelier
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-espresso leading-[1.08] text-balance">
                  Kundan Splendour & Polki Radiance.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-espresso-soft">
                  Handcrafted necklace sets, chandelier jhumkas, and tailored rings. Finished in high-micron gold and silver plating with artisanal stones, each piece is designed for weddings, festive galas, and treasured heirloom collections.
                </p>

                {/* Subcategory Links */}
                <div className="mt-6 pt-5 border-t border-espresso/8 grid grid-cols-3 gap-3 text-center">
                  <Link
                    to="/shop?department=jewellery&category=necklace-sets"
                    className="p-3 rounded-xl bg-[#F8F4EC] hover:bg-linen transition-colors border border-espresso/6"
                  >
                    <span className="font-serif text-sm font-medium text-espresso block">Necklaces</span>
                    <span className="text-[10px] text-espresso-light">Chokers & Sets</span>
                  </Link>
                  <Link
                    to="/shop?department=jewellery&category=earrings"
                    className="p-3 rounded-xl bg-[#F8F4EC] hover:bg-linen transition-colors border border-espresso/6"
                  >
                    <span className="font-serif text-sm font-medium text-espresso block">Earrings</span>
                    <span className="text-[10px] text-espresso-light">Jhumkas & Studs</span>
                  </Link>
                  <Link
                    to="/shop?department=jewellery&category=rings"
                    className="p-3 rounded-xl bg-[#F8F4EC] hover:bg-linen transition-colors border border-espresso/6"
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

            {/* Asymmetrical Salon Imagery */}
            <Reveal y={30} delay={120} className="lg:col-span-6 order-1 lg:order-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="overflow-hidden rounded-2xl border border-espresso/12 shadow-lg aspect-[4/5] bg-linen jewellery-glint col-span-2 sm:col-span-1">
                  <img
                    src={`${vjEditorial}jewellery-necklace.jpg`}
                    alt="Handcrafted kundan necklace set"
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    loading="lazy"
                  />
                </div>
                <div className="flex flex-col gap-4">
                  <div className="overflow-hidden rounded-2xl border border-espresso/12 shadow-md aspect-[4/3] bg-linen jewellery-glint">
                    <img
                      src={`${vjEditorial}jewellery-earrings.jpg`}
                      alt="Intricate gold chandelier jhumkas"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-espresso/12 shadow-md aspect-[4/3] bg-linen jewellery-glint">
                    <img
                      src={`${vjEditorial}jewellery-rings.jpg`}
                      alt="Statement polki and gemstone ring"
                      className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                      loading="lazy"
                    />
                  </div>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 5. Editorial Feature 2: VJ Suits & Fabrics (Textile Atelier Composition) */}
      <section className="py-20 lg:py-28 bg-[#FAF1ED] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal y={30} className="lg:col-span-6">
              <div className="overflow-hidden rounded-3xl border border-espresso/12 shadow-xl aspect-[4/3] sm:aspect-[16/11] bg-linen textile-glide">
                <img
                  src={
                    selectedFabricTab === 'cotton'
                      ? `${vjEditorial}suits-cotton.jpg`
                      : selectedFabricTab === 'silk'
                      ? `${vjEditorial}suits-silk.jpg`
                      : selectedFabricTab === 'banarasi'
                      ? `${vjEditorial}suits-banarasi.jpg`
                      : selectedFabricTab === 'organza'
                      ? `${vjEditorial}suits-organza.jpg`
                      : selectedFabricTab === 'wool'
                      ? `${vjEditorial}suits-wool.jpg`
                      : `${vjEditorial}suits-fabrics.jpg`
                  }
                  alt="Pure woven unstitched salwar suits and dupattas"
                  className="h-full w-full object-cover transition-all duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>

            <Reveal y={30} delay={120} className="lg:col-span-6">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#E6C6BC] shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-terracotta">
                  <Shirt size={14} /> VJ Suits & Fabrics · The Pure Weave
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-espresso leading-[1.08] text-balance">
                  Ladies' Unstitched Salwar Suits.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-espresso-soft">
                  Pure breathable cotton, festive handloom silk, sheer organza, rich Banarasi brocades with zari motifs, fluid rayon, and cozy winter wools. Every set features generous top, bottom, and artisan-crafted dupatta lengths ready to be tailored to your distinct grace.
                </p>

                {/* Fabric Type Selector Tabs */}
                <div className="mt-6 pt-4 border-t border-espresso/8">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-espresso-light mb-2.5">
                    Select Fabric Composition to Preview
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {([
                      { key: 'cotton', label: 'Pure Cotton' },
                      { key: 'silk', label: 'Chanderi Silk' },
                      { key: 'banarasi', label: 'Banarasi Zari' },
                      { key: 'organza', label: 'Organza Sheer' },
                      { key: 'wool', label: 'Winter Wool' },
                    ] as const).map((fab) => (
                      <button
                        key={fab.key}
                        onClick={() => setSelectedFabricTab(fab.key)}
                        className={`px-3 py-1 rounded-full text-xs transition-all ${
                          selectedFabricTab === fab.key
                            ? 'bg-terracotta text-white font-medium shadow-xs'
                            : 'bg-[#FAF1ED] text-espresso hover:bg-[#EDE7DE] border border-espresso/8'
                        }`}
                      >
                        {fab.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Tailoring Specs Callout */}
                <div className="mt-6 p-3.5 rounded-xl bg-[#FAF1ED] border border-espresso/8 text-xs text-espresso-soft">
                  <div className="flex items-center gap-2 text-espresso font-semibold uppercase tracking-wider mb-1">
                    <CheckCircle2 size={14} className="text-terracotta" /> Standard 3-Piece Fabric Measurements
                  </div>
                  <p>Top: 2.50 Meters &middot; Bottom: 2.50 Meters &middot; Coordinated Dupatta: 2.25 Meters</p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
                  <Link to="/department/women_suits">
                    <Button variant="terracotta" size="lg" className="group w-full sm:w-auto">
                      <span>Explore Suits & Fabrics</span>
                      <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                    </Button>
                  </Link>
                  <Link to="/shop?department=women_suits">
                    <Button variant="outline" size="lg" className="w-full sm:w-auto">
                      Browse All Unstitched Sets
                    </Button>
                  </Link>
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 6. Editorial Feature 3: VJ Living (Sanctuary Bedding with 60x90 Chaddar Note) */}
      <section className="py-20 lg:py-28 bg-[#EDF2EE] border-b border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            <Reveal y={30} className="lg:col-span-6 order-2 lg:order-1">
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#CAD6CE] shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-forest">
                  <Home size={14} /> VJ Living · Home Sanctuary
                </span>

                <h2 className="mt-4 font-serif text-3xl sm:text-5xl font-light text-espresso leading-[1.08] text-balance">
                  Sanctuary Linens & 60 × 90 Chaddars.
                </h2>

                <p className="mt-5 text-sm sm:text-base leading-relaxed text-espresso-soft">
                  Natural, skin-friendly cotton bedding designed for peaceful rest. Discover double bedsheet sets with matching tailored pillow covers, single bedsheets with pillow, separate pillow covers, and traditional 60 × 90 single-bed top sheets (*odhne wali chaddars*).
                </p>

                {/* Handwritten 60x90 Specification Callout (Store Owner Verification Note) */}
                <div className="mt-6 p-4 rounded-xl bg-[#EDF2EE] border border-forest/15">
                  <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-forest mb-1.5">
                    <CheckCircle2 size={15} /> Single-Bed Top Sheet (*Odhne Wali Chaddar*)
                  </div>
                  <p className="text-xs text-espresso-soft leading-relaxed">
                    100% pure combed cotton. Recorded from client handwritten specifications as <strong>60 &times; 90</strong> (measurement unit stored separately and flagged for owner confirmation before final packaging).
                  </p>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
                  <Link to="/department/home_textiles">
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
                  alt="Pure cotton home bedding and single top sheet chaddar"
                  className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                  loading="lazy"
                />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* 7. Editorial Feature 4: Little Loom (Gentle Beginnings) */}
      <section className="py-20 lg:py-28 bg-[#F3F5F0] border-b border-espresso/10">
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
              <div className="rounded-3xl p-8 sm:p-12 lg:p-14 bg-white border border-[#D8DCD1] shadow-sm">
                <span className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.28em] text-[#6B735B]">
                  <Baby size={14} className="playful-sway" /> Little Loom · Children's Clothing
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
                        className="px-3.5 py-1.5 rounded-full text-xs bg-[#F3F5F0] border border-espresso/10 text-espresso hover:border-espresso hover:bg-white transition-all"
                      >
                        {age.label} ({age.range})
                      </Link>
                    ))}
                  </div>
                </div>

                <div className="mt-8 flex flex-col sm:flex-row gap-3.5">
                  <Link to="/department/kids">
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
      <section id="brand-story" className="py-24 lg:py-32 bg-[#F6F2E9] border-b border-espresso/10">
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
                From the intricate kundan settings of royal jewellery to the rhythmic clack of wooden looms weaving ladies unstitched salwar suits and cool 60&times;90 cotton bedding, our pieces honour generational craft while embracing modern aesthetics.
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
                  Every fabric length, jewellery finish, and bedsheet weave is quality-inspected before dispatch.
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
                <h4 className="font-serif text-base font-medium text-espresso">Dedicated Concierge</h4>
                <p className="mt-1 text-xs text-espresso-soft leading-relaxed">
                  Direct WhatsApp concierge support for sizing questions, fabric lengths, and bridal orders.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 10. Refined Newsletter Subscription Strip */}
      <section className="py-16 bg-[#EDE7DE] border-b border-espresso/10">
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
            <div className="mt-6 p-4 rounded-xl bg-white border border-[#E6C6BC] text-xs font-medium text-espresso shadow-xs">
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
