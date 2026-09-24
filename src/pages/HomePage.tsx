import { Link } from 'react-router-dom';
import { useRef, useEffect, useState } from 'react';
import { ArrowRight, ArrowLeft, Heart, Sparkles } from 'lucide-react';
import { products, ageGroups, categories, editorialImages, formatINR } from '../data';
import { useStore } from '../store';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import { SectionHeading } from '../components/ui';
import Reveal from '../components/Reveal';
import type { Product } from '../types';

export default function HomePage() {
  const { addToCart } = useStore();
  const railRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  const newArrivals = products.filter((p) => p.isNew).slice(0, 6);
  const bestsellers = products.filter((p) => p.isBestseller).slice(0, 4);

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

  const scrollRail = (dir: 'left' | 'right') => {
    if (!railRef.current) return;
    const amount = 320;
    railRef.current.scrollBy({ left: dir === 'right' ? amount : -amount, behavior: 'smooth' });
  };

  return (
    <div>
      {/* A. HERO */}
      <section className="relative overflow-hidden">
        {/* Decorative floating shapes */}
        <div className="absolute top-20 right-10 w-32 h-32 rounded-full bg-butter/30 blur-3xl pointer-events-none animate-float-slow" />
        <div className="absolute bottom-10 left-10 w-40 h-40 rounded-full bg-peach/20 blur-3xl pointer-events-none animate-float" />

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-6 lg:pt-10 relative">
          <div className="grid lg:grid-cols-2 gap-6 lg:gap-10 items-center">
            {/* Text column */}
            <div className="order-2 lg:order-1 flex flex-col gap-6 lg:pr-8">
              <span
                className="text-xs font-semibold uppercase tracking-[0.25em] text-peach flex items-center gap-2"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.5s ease-out',
                }}
              >
                <Sparkles size={14} />
                New Season · Autumn 2026
              </span>
              <h1
                className="font-serif text-5xl sm:text-6xl lg:text-7xl xl:text-8xl font-light leading-[0.95] text-ink text-balance"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(30px)',
                  transition: 'all 0.7s cubic-bezier(0.16, 1, 0.3, 1) 0.1s',
                }}
              >
                Small humans.
                <br />
                <span className="italic">Big outfits.</span>
              </h1>
              <p
                className="text-base lg:text-lg text-ink-soft leading-relaxed max-w-md"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.6s ease-out 0.25s',
                }}
              >
                Everyday favorites for tiny adventures. Comfortable, expressive clothing made for little moments that feel big.
              </p>
              <div
                className="flex flex-col sm:flex-row gap-3 mt-2"
                style={{
                  opacity: mounted ? 1 : 0,
                  transform: mounted ? 'translateY(0)' : 'translateY(20px)',
                  transition: 'all 0.6s ease-out 0.4s',
                }}
              >
                <Link to="/shop?filter=new">
                  <Button variant="primary" size="lg" className="group">
                    Shop New Arrivals
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
                transform: mounted ? 'scale(1)' : 'scale(0.95)',
                transition: 'all 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.15s',
              }}
            >
              <div className="aspect-[4/5] lg:aspect-[5/6] overflow-hidden rounded-2xl lg:rounded-3xl relative">
                <img
                  src="https://images.pexels.com/photos/16949145/pexels-photo-16949145.jpeg?auto=compress&cs=tinysrgb&h=1000&w=800"
                  alt="Children wearing Little Loom outfits"
                  className="h-full w-full object-cover"
                />
              </div>
              {/* Floating price badge */}
              <div className="absolute bottom-4 left-4 lg:bottom-6 lg:left-6 bg-cream/95 backdrop-blur-sm rounded-xl px-4 py-3 shadow-lg animate-float">
                <p className="text-xs text-ink-light">Starting at</p>
                <p className="text-lg font-serif font-medium text-ink">{formatINR(690)}</p>
              </div>
              {/* Floating "New" badge */}
              <div className="absolute top-4 right-4 lg:top-6 lg:right-6 bg-butter rounded-full h-16 w-16 lg:h-20 lg:w-20 flex items-center justify-center shadow-lg animate-float-slow rotate-12">
                <span className="font-serif text-xs lg:text-sm font-medium text-ink text-center leading-tight">
                  New<br />Drop
                </span>
              </div>
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
                  The Everyday Edit
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl xl:text-6xl font-light leading-[1.05] text-cream text-balance relative">
                  Made for messy mornings &amp; magic afternoons.
                </h2>
                <p className="mt-5 text-sm lg:text-base text-cream/80 leading-relaxed max-w-md relative">
                  Pieces that keep up with every little moment — from breakfast spills to bedtime stories.
                </p>
                <Link to="/shop" className="mt-7 relative">
                  <Button variant="secondary" size="lg" className="group">
                    Meet the Everyday Edit
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
              </div>
            </Reveal>
            <Reveal y={40} delay={150} className="order-1 lg:order-2">
              <div className="relative rounded-2xl lg:rounded-3xl overflow-hidden min-h-[300px] lg:min-h-[500px] group">
                <img
                  src="https://images.pexels.com/photos/4982526/pexels-photo-4982526.jpeg?auto=compress&cs=tinysrgb&h=800&w=700"
                  alt="Children playing outdoors in Little Loom clothing"
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
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
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110"
                    />
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
                  <img
                    src="https://images.pexels.com/photos/1652116/pexels-photo-1652116.jpeg?auto=compress&cs=tinysrgb&h=800&w=600"
                    alt="Children enjoying the outdoors"
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="absolute -top-4 -right-4 lg:-top-6 lg:-right-6 bg-butter rounded-2xl px-5 py-4 shadow-md rotate-3 animate-float">
                  <p className="font-serif text-2xl lg:text-3xl font-medium text-ink">est. 2026</p>
                </div>
              </div>
            </Reveal>
            <Reveal y={40} delay={150} className="lg:col-span-6 lg:col-start-7">
              <div className="flex flex-col gap-5">
                <span className="text-xs font-semibold uppercase tracking-[0.25em] text-peach">
                  Our Story
                </span>
                <h2 className="font-serif text-3xl sm:text-4xl lg:text-5xl font-light leading-[1.1] text-ink text-balance">
                  A little more <span className="italic">wonder</span> in every day.
                </h2>
                <div className="space-y-4 text-sm lg:text-base text-ink-soft leading-relaxed">
                  <p>
                    Little Loom began with a simple idea: children's clothing should be as expressive and
                    full of life as the little humans who wear it. We design pieces that feel good, move
                    freely, and bring a little spark of joy to everyday moments.
                  </p>
                  <p>
                    From the first morning stretch to the last bedtime story, our outfits are made to keep
                    up with the messy, magical, wonderfully ordinary days of growing up. Comfortable fabrics,
                    thoughtful details, and colors that feel like play.
                  </p>
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

      {/* H. INSTAGRAM / COMMUNITY */}
      <section className="py-16 lg:py-24 bg-cream">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <SectionHeading
              eyebrow="Community"
              title={<>Little Loom, <span className="italic">out in the wild</span></>}
              description="Tag us to be featured. This is a placeholder grid — no real handles or testimonials."
              align="center"
            />
          </Reveal>
          <div className="mt-8 lg:mt-12 grid grid-cols-3 lg:grid-cols-6 gap-2 lg:gap-3">
            {editorialImages.map((img, i) => (
              <Reveal key={i} delay={i * 60}>
                <div className="group relative overflow-hidden rounded-lg aspect-square">
                  <img
                    src={img}
                    alt={`Community photo ${i + 1}`}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-ink/0 group-hover:bg-ink/20 transition-colors duration-300 flex items-center justify-center">
                    <Heart
                      size={20}
                      className="text-white opacity-0 group-hover:opacity-100 transition-all duration-300 scale-50 group-hover:scale-100"
                      fill="currentColor"
                    />
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}
