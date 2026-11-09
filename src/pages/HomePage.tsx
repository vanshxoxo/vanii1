import { Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Sparkles } from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import { useCmsSection } from '../lib/cms';
import { useStore } from '../useStore';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import { SectionHeading } from '../components/ui';
import Reveal from '../components/Reveal';
import type { Product } from '../types';

export default function HomePage() {
  const { addToCart } = useStore();
  const { products, ages: ageGroups, categories, hero } = useCatalog();
  const campaign = useCmsSection('featured-campaign');
  const brandStory = useCmsSection('brand-story');
  const railRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const newArrivals = products.filter((p) => p.isNew).slice(0, 6);
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 4);
  const heroLines = hero?.heading ? hero.heading.split('\n') : ['Small humans.', 'Big outfits.'];
  const heroHref = hero?.ctaHref?.startsWith('/') ? hero.ctaHref : '/shop?filter=new';
  const campaignHref = campaign?.cta_href?.startsWith('/') ? campaign.cta_href : '/shop';

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

  const scrollRail = (dir: 'left' | 'right') => {
    if (!railRef.current) return;
    const amount = 320;
    railRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <div>
      {/* A. HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 sm:py-10 lg:py-12">
          <div className="grid lg:grid-cols-[0.9fr_1.1fr] gap-8 lg:gap-14 items-center">
            {/* Text column */}
            <div className="order-2 lg:order-1 flex flex-col gap-5 lg:py-8">
              <span
                className="text-xs font-semibold uppercase tracking-[0.25em] text-peach flex items-center gap-2"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                  transition: 'opacity 0.55s ease-out, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)',
                }}
              >
                <Sparkles size={14} />
                New Season · Autumn 2026
              </span>
              <h1 className="hero-headline font-serif font-light leading-[1.02] text-ink text-balance">
                <span className={`hero-line ${mounted ? 'is-visible' : ''}`}>{heroLines[0]}</span>
                {heroLines[1] && <span className={`hero-line italic ${mounted ? 'is-visible' : ''}`}>{heroLines[1]}</span>}
              </h1>
              <p
                className="text-base lg:text-lg text-ink-soft leading-relaxed max-w-md"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.6s ease-out 0.35s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.35s',
                }}
              >
                {hero?.body || 'Everyday favorites for tiny adventures. Comfortable, expressive clothing made for little moments that feel big.'}
              </p>
              <div
                className="flex flex-col sm:flex-row gap-3 mt-2"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'opacity 0.6s ease-out 0.45s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.45s',
                }}
              >
                <Link to={heroHref}>
                  <Button variant="primary" size="lg" className="group">
                    {hero?.ctaLabel || 'Shop New Arrivals'}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Link to="/shop">
                  <Button variant="outline" size="lg">
                    Explore the Collection
                  </Button>
                </Link>
              </div>
            </div>

            {/* Image column */}
            <div
              className="order-1 lg:order-2 relative"
              style={{
                opacity: mounted ? 1 : 0,
                transform: mounted ? 'translateY(0)' : 'translateY(12px)',
                transition: 'opacity 0.8s ease-out 0.12s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.12s',
              }}
            >
              <div className="hero-image aspect-[4/5] lg:aspect-[5/5.5] overflow-hidden rounded-xl lg:rounded-2xl relative">
                <picture className="block h-full w-full">
                {hero?.mobileImage && <source media="(max-width: 639px)" srcSet={hero.mobileImage} />}
                {hero?.image && <img src={hero.image} alt={hero.heading || 'Little Loom collection'} className="h-full w-full object-cover" fetchPriority="high" decoding="async" />}
                </picture>
              </div>
              <span className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6 bg-ivory/95 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-charcoal">Autumn 2026</span>
            </div>
          </div>
        </div>
      </section>

      {/* B. SHOP BY AGE */}
      <section id="shop-by-age" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Find their fit"
              title={<>Shop by <span className="italic">age</span></>}
              description="From first days to first steps to full-on adventures — clothing sized for every little stage."
            />
          </Reveal>
          <div className="mt-8 lg:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5">
            {ageGroups.map((age, i) => (
              <Reveal key={age.id} delay={i * 100}>
                <Link
                  to={`/shop?age=${encodeURIComponent(age.id)}`}
                  className="group relative overflow-hidden rounded-xl lg:rounded-2xl aspect-[3/4] block"
                >
                  <img
                    src={age.image}
                    alt={age.label}
                    className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent transition-opacity duration-300 group-hover:from-ink/80" />
                  <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">
                    <p className="text-xs text-cream/70 mb-0.5">{age.range}</p>
                    <h3 className="font-serif text-xl lg:text-2xl font-medium text-cream">{age.label}</h3>
                    <span className="inline-flex items-center gap-1 text-xs text-cream/60 mt-1 opacity-0 group-hover:opacity-100 group-hover:gap-2 transition-all duration-300">
                      Shop now <ArrowRight size={12} />
                    </span>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* C. NEW ARRIVALS */}
      <section className="py-16 lg:py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex items-end justify-between gap-4 mb-8 lg:mb-12">
              <SectionHeading
                eyebrow="Just landed"
                title={<>New <span className="italic">arrivals</span></>}
              />
              <div className="flex items-center gap-2">
                <button
                  onClick={() => scrollRail('left')}
                  aria-label="Scroll left"
                  className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink hover:text-cream transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={() => scrollRail('right')}
                  aria-label="Scroll right"
                  className="hidden sm:flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink hover:bg-ink hover:text-cream transition-all duration-300 hover:scale-110 active:scale-95"
                >
                  <ArrowRight size={18} />
                </button>
              </div>
            </div>
          </Reveal>
          <div
            ref={railRef}
            className="flex gap-4 lg:gap-6 overflow-x-auto no-scrollbar snap-x-mandatory -mx-4 px-4 sm:mx-0 sm:px-0 pb-4"
          >
            {newArrivals.map((product, i) => (
              <div
                key={product.id}
                className="shrink-0 w-[260px] sm:w-[280px] lg:w-[300px] snap-start"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                  transition: `all 0.5s ease-out ${0.3 + i * 0.08}s`,
                }}
              >
                <ProductCard product={product} onQuickAdd={handleQuickAdd} />
              </div>
            ))}
          </div>
          <div className="mt-8 text-center sm:hidden">
            <Link to="/shop?filter=new">
              <Button variant="outline" size="md">
                View All New Arrivals
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* D. EDITORIAL CAMPAIGN */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-stretch">
            <Reveal y={40} className="order-2 lg:order-1">
              <div className="bg-peach rounded-2xl lg:rounded-3xl p-8 lg:p-14 flex flex-col justify-center min-h-[300px] lg:min-h-[500px] relative overflow-hidden">
                {/* Decorative circles */}
                <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10" />
                <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full bg-white/10" />
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-cream/70 mb-4 relative">
                  {campaign?.heading || 'The Everyday Edit'}
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light leading-[1.05] text-cream text-balance relative">
                  {campaign?.heading || 'Made for messy mornings & magic afternoons.'}
                </h2>
                <p className="mt-5 text-sm lg:text-base text-cream/80 leading-relaxed max-w-md relative">
                  {campaign?.body || 'Pieces that keep up with every little moment — from breakfast spills to bedtime stories.'}
                </p>
                <Link to={campaignHref} className="mt-7 relative">
                  <Button variant="primary" size="lg" className="group">
                    {campaign?.cta_label || 'Meet the Everyday Edit'}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Reveal>
            <Reveal y={40} delay={150} className="order-1 lg:order-2">
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden min-h-[300px] lg:min-h-[500px] group">
                {campaign?.desktopImage && <img src={campaign.desktopImage} alt={campaign.heading || 'Little Loom campaign'} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" loading="lazy" />}
                <div className="absolute inset-0 bg-gradient-to-t from-ink/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              </div>
            </Reveal>
          </div>
        </div>
      </section>

      {/* E. SHOP BY CATEGORY */}
      <section className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Browse the wardrobe"
              title={<>Shop by <span className="italic">category</span></>}
              align="center"
            />
          </Reveal>
          <div className="mt-8 lg:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-3 lg:gap-5 auto-rows-[200px] lg:auto-rows-[280px]">
            {categories.map((cat, idx) => {
              const spanClass =
                cat.span === 'tall'
                  ? 'row-span-2'
                  : cat.span === 'wide'
                  ? 'col-span-2'
                  : '';
              return (
                <Reveal
                  key={cat.id}
                  delay={idx * 80}
                  className={spanClass + (idx === 0 ? ' col-span-2 row-span-1 lg:col-span-1 lg:row-span-2' : '')}
                >
                  <Link
                    to={`/shop?category=${encodeURIComponent(cat.id)}`}
                    className={`group relative overflow-hidden rounded-xl lg:rounded-2xl block h-full`}
                  >
                    {cat.image && <img src={cat.image} alt={cat.name} className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />}
                    <div className="absolute inset-0 bg-gradient-to-t from-ink/50 via-transparent to-transparent transition-opacity duration-300 group-hover:from-ink/70" />
                    <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5 transform transition-transform duration-300 group-hover:-translate-y-1">
                      <h3 className="font-serif text-lg lg:text-2xl font-medium text-cream">{cat.name}</h3>
                      <span className="inline-flex items-center gap-1 text-xs text-cream/70 mt-1 group-hover:gap-2 transition-all duration-300">
                        Shop now <ArrowRight size={12} />
                      </span>
                    </div>
                  </Link>
                </Reveal>
              );
            })}
          </div>
        </div>
      </section>

      {/* F. BESTSELLERS */}
      <section className="py-16 lg:py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Loved by little loomers"
              title={<>Best<span className="italic">sellers</span></>}
              link={{ label: 'Shop All', href: '/shop' }}
            />
          </Reveal>
          <div className="mt-8 lg:mt-12 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            {bestsellers.map((product, i) => (
              <Reveal key={product.id} delay={i * 100}>
                <ProductCard product={product} onQuickAdd={handleQuickAdd} />
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* G. BRAND STORY */}
      <section id="brand-story" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-12 gap-8 lg:gap-12 items-center">
            <Reveal y={40} className="lg:col-span-5">
              <div className="relative">
                <div className="aspect-[4/5] overflow-hidden rounded-2xl lg:rounded-3xl">
                  {brandStory?.desktopImage && <img src={brandStory.desktopImage} alt={brandStory.heading || 'Little Loom brand story'} className="h-full w-full object-cover" />}
                </div>
                <div className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 bg-butter rounded-2xl px-5 py-4 shadow-md rotate-3 animate-float">
                  <p className="font-serif text-2xl lg:text-3xl font-medium text-ink">est. 2026</p>
                </div>
              </div>
            </Reveal>
            <Reveal y={40} delay={150} className="lg:col-span-6 lg:col-start-7">
              <div className="flex flex-col gap-5">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-peach">
                  {brandStory?.content?.eyebrow as string || 'Our Story'}
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.1] text-ink text-balance">
                  {brandStory?.heading || 'A little more wonder in every day.'}
                </h2>
                <div className="space-y-4 text-sm lg:text-base text-ink-soft leading-relaxed">
                  {brandStory?.body ? <p>{brandStory.body}</p> : <>
                  <p>
                    Little Loom began with a simple idea: children's clothing should be as expressive and
                    full of life as the little humans who wear it. We design pieces that feel good, move
                    freely, and bring a little spark of joy to everyday moments.
                  </p>
                  <p>
                    From the first morning stretch to the last bedtime story, our outfits are made to keep
                    up with the messy, magical, wonderfully ordinary days of growing up. Comfortable fabrics,
                    thoughtful details, and colors that feel like play.
                  </p></>}
                </div>
                <Link to="/shop" className="mt-2">
                  <Button variant="outline" size="lg" className="group">
                    Discover Our Collection
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Reveal>
          </div>
        </div>
      </section>

    </div>
  );
}
