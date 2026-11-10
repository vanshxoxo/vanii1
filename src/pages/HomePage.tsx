import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import { useCmsSection } from '../lib/cms';
import { useStore } from '../useStore';
import type { Product } from '../types';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import { SectionHeading } from '../components/ui';
import Reveal from '../components/Reveal';

const editorial = '/images/editorial/version-b/';

function agePhoto(label: string) {
  const value = label.toLowerCase();
  if (value.includes('newborn')) return `${editorial}newborn.webp`;
  if (value.includes('baby') || value.includes('infant')) return `${editorial}baby.webp`;
  if (value.includes('toddler')) return `${editorial}toddler.webp`;
  return `${editorial}little-kids.webp`;
}

function categoryPhoto(name: string, index: number) {
  const value = name.toLowerCase();
  if (value.includes('romper')) return `${editorial}category-rompers.webp`;
  if (value.includes('coord') || value.includes('set')) return `${editorial}category-coords.webp`;
  if (value.includes('tee') || value.includes('top')) return `${editorial}category-tops.webp`;
  if (value.includes('dress')) return `${editorial}category-dresses.webp`;
  if (value.includes('bottom')) return `${editorial}category-bottoms.webp`;
  if (value.includes('sleep') || value.includes('night')) return `${editorial}category-sleepwear.webp`;
  return [`${editorial}category-coords.webp`, `${editorial}category-rompers.webp`, `${editorial}category-bottoms.webp`][index % 3];
}

export default function HomePage() {
  const { addToCart } = useStore();
  const { products, ages, categories, collections, hero, error } = useCatalog();
  const campaign = useCmsSection('featured-campaign');
  const brandStory = useCmsSection('brand-story');
  const railRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const ageCards = ages.length > 0 ? ages : [
    { id: 'Newborn', label: 'Newborn', range: '', image: '', description: '' },
    { id: 'Baby', label: 'Baby', range: '', image: '', description: '' },
    { id: 'Toddler', label: 'Toddler', range: '', image: '', description: '' },
    { id: 'Little Kids', label: 'Little Kids', range: '', image: '', description: '' },
  ];
  const newArrivals = products.filter((product) => product.isNew).slice(0, 6);
  const featuredProducts = products.filter((product) => product.isBestseller).slice(0, 4);
  const heroLines = (hero?.heading || 'Small humans.\nBig outfits.').split('\n');
  const hasProducts = products.length > 0;
  const heroHref = hero?.ctaHref?.startsWith('/') ? hero.ctaHref : '/shop?filter=new';
  const heroDesktopImage = hero?.image || `${editorial}hero-desktop.webp`;
  const heroMobileImage = hero?.mobileImage || (hero?.image ? hero.image : `${editorial}hero-mobile.webp`);

  const handleQuickAdd = (product: Product) => {
    const variant = product.variants?.find((item) => item.available);
    if (product.variants?.length && !variant) return;
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: variant?.price ?? product.price,
      image: product.images[0],
      color: variant?.colour ?? product.colors[0]?.name ?? '',
      size: variant?.size ?? product.sizes[0] ?? '',
      quantity: 1,
      variantId: variant?.id,
    });
  };

  const scrollRail = (direction: 'left' | 'right') => {
    railRef.current?.scrollBy({ left: direction === 'right' ? 320 : -320, behavior: 'smooth' });
  };

  return (
    <div>
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid items-center gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:gap-14">
            <div className="order-2 flex flex-col gap-5 lg:order-1 lg:py-8">
              <span className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.25em] text-peach" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.55s ease-out, transform 0.55s cubic-bezier(0.16, 1, 0.3, 1)' }}>
                <Sparkles size={14} /> Little Loom
              </span>
              <h1 className="hero-headline font-serif font-light leading-[1.02] text-ink text-balance">
                <span className={`hero-line ${mounted ? 'is-visible' : ''}`}>{heroLines[0]}</span>
                {heroLines[1] && <span className={`hero-line italic ${mounted ? 'is-visible' : ''}`}>{heroLines[1]}</span>}
              </h1>
              <p className="max-w-md text-base leading-relaxed text-ink-soft lg:text-lg" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease-out 0.2s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s' }}>
                {hero?.body || 'Clothing and details shared by Little Loom.'}
              </p>
              <div className="mt-2 flex flex-col gap-3 sm:flex-row" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(20px)', transition: 'opacity 0.6s ease-out 0.3s, transform 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s' }}>
                {hasProducts ? <Link to={heroHref}><Button variant="primary" size="lg" className="group">{hero?.ctaLabel || 'Shop the collection'}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button></Link>
                  : <a href="#shop-by-age"><Button variant="primary" size="lg" className="group">Explore by age<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button></a>}
                <a href="#shop-by-category"><Button variant="outline" size="lg">Browse categories</Button></a>
              </div>
              {error && <p role="status" className="text-sm text-ink-soft">The published catalogue is temporarily unavailable.</p>}
              <p className="text-[10px] uppercase tracking-[0.14em] text-ink-soft">Editorial photograph · <a href="/images/editorial/SOURCES.md" target="_blank" rel="noreferrer" className="underline underline-offset-2">Pexels image credits</a></p>
            </div>

            <div className="hero-image order-1 relative lg:order-2" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.8s ease-out 0.12s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.12s' }}>
              <div className="aspect-[4/5] overflow-hidden rounded-xl bg-cream lg:aspect-[5/5.5] lg:rounded-2xl">
                <picture className="block h-full w-full"><source media="(max-width: 639px)" srcSet={heroMobileImage} /><img src={heroDesktopImage} alt={hero?.heading ? `Editorial image accompanying ${hero.heading}` : 'Pexels stock photograph of two children outdoors'} className="h-full w-full object-cover" fetchPriority="high" decoding="async" /></picture>
              </div>
              <span className="absolute bottom-4 left-4 bg-ivory/95 px-3 py-2 text-[10px] uppercase tracking-[0.16em] text-charcoal lg:bottom-6 lg:left-6">Pexels editorial</span>
            </div>
          </div>
        </div>
      </section>

      <section id="shop-by-age" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="Find their fit" title={<>Shop by <span className="italic">age</span></>} /></Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 lg:mt-12 lg:grid-cols-4 lg:gap-5">
            {ageCards.map((age, index) => <Reveal key={age.id} delay={index * 90}>
              <Link to={`/shop?age=${encodeURIComponent(age.id)}`} className="group relative block aspect-[3/4] overflow-hidden rounded-xl lg:rounded-2xl">
                <img src={age.image || agePhoto(age.label)} alt={`Editorial photograph for ${age.label}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent transition-opacity duration-300 group-hover:from-ink/80" />
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">{age.range && <p className="mb-0.5 text-xs text-cream/70">{age.range}</p>}<h2 className="font-serif text-xl font-medium text-cream lg:text-2xl">{age.label}</h2><span className="mt-1 inline-flex items-center gap-1 text-xs text-cream/70 transition-all group-hover:gap-2">Browse age group <ArrowRight size={12} /></span></div>
              </Link>
            </Reveal>)}
          </div>
          <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-ink-soft">Stock editorial images illustrate age groups; they are not Little Loom product photographs.</p>
        </div>
      </section>

      <section className="bg-cream py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><div className="mb-8 flex items-end justify-between gap-4 lg:mb-12">
            <SectionHeading eyebrow={newArrivals.length ? 'Just published' : 'Little Loom catalogue'} title={newArrivals.length ? <>New <span className="italic">arrivals</span></> : <>The published <span className="italic">collection</span></>} />
            {hasProducts && <div className="hidden items-center gap-2 sm:flex"><button onClick={() => scrollRail('left')} aria-label="Scroll products left" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-all hover:scale-110 hover:bg-ink hover:text-cream"><ArrowLeft size={18} /></button><button onClick={() => scrollRail('right')} aria-label="Scroll products right" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-all hover:scale-110 hover:bg-ink hover:text-cream"><ArrowRight size={18} /></button></div>}
          </div></Reveal>
          {hasProducts ? <>
            <div ref={railRef} className="no-scrollbar snap-x-mandatory -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 lg:gap-6">
              {(newArrivals.length ? newArrivals : products.slice(0, 6)).map((product, index) => <Reveal key={product.id} delay={index * 65} className="w-[260px] shrink-0 snap-start sm:w-[280px] lg:w-[300px]"><ProductCard product={product} onQuickAdd={handleQuickAdd} /></Reveal>)}
            </div>
            <div className="mt-7 text-center"><Link to={newArrivals.length ? '/shop?filter=new' : '/shop'}><Button variant="outline" size="md">View published products</Button></Link></div>
          </> : <div className="grid overflow-hidden rounded-2xl bg-[#f4eee8] lg:grid-cols-2">
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14"><p className="text-xs uppercase tracking-[0.2em] text-peach">Little Loom</p><h2 className="mt-3 font-serif text-3xl font-light leading-tight text-ink sm:text-4xl">No products are currently published</h2><p className="mt-4 max-w-md text-sm leading-7 text-ink-soft">Product listings and prices will appear here when they are published in the Little Loom catalogue.</p>{error && <p role="status" className="mt-3 text-sm text-ink-soft">The catalogue could not be reached just now.</p>}</div>
            <img src={`${editorial}category-rompers.webp`} alt="Pexels stock photograph of children outdoors; editorial only" loading="lazy" className="min-h-64 w-full object-cover sm:min-h-80" />
          </div>}
        </div>
      </section>

      <section id="editorial-campaign" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-10">
            <Reveal y={40} className="order-2 lg:order-1"><div className="relative flex min-h-[300px] flex-col justify-center overflow-hidden rounded-2xl bg-peach p-8 lg:min-h-[500px] lg:rounded-3xl lg:p-14">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" /><div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10" />
              <span className="relative mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-cream/70">{campaign?.heading || 'Little Loom · editorial'}</span>
              <h2 className="relative font-serif text-3xl font-light leading-[1.05] text-cream text-balance sm:text-4xl lg:text-5xl">{campaign?.heading || 'A little look at childhood.'}</h2>
              <p className="relative mt-5 max-w-md text-sm leading-relaxed text-cream/85 lg:text-base">{campaign?.body || 'These Pexels photographs set the visual mood. They do not represent specific Little Loom products or an active promotion.'}</p>
              {campaign?.cta_label && campaign.cta_href?.startsWith('/') && <Link to={campaign.cta_href} className="relative mt-7"><Button variant="primary" size="lg" className="group">{campaign.cta_label}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button></Link>}
            </div></Reveal>
            <Reveal y={40} delay={150} className="order-1 lg:order-2"><figure className="group relative min-h-[300px] overflow-hidden rounded-2xl lg:min-h-[500px] lg:rounded-3xl"><img src={campaign?.desktopImage || `${editorial}campaign.webp`} alt={campaign?.desktopImage ? (campaign.heading || 'Little Loom editorial campaign') : 'Pexels editorial photograph of two young children in soft daylight'} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /><figcaption className="absolute bottom-3 left-3 bg-ivory/95 px-3 py-2 text-[10px] uppercase tracking-[0.12em] text-charcoal">Pexels stock · editorial only</figcaption></figure></Reveal>
          </div>
        </div>
      </section>

      {categories.length > 0 && <section id="shop-by-category" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="Browse the wardrobe" title={<>Shop by <span className="italic">category</span></>} align="center" /></Reveal>
          <div className="mt-8 grid auto-rows-[200px] grid-cols-2 gap-3 lg:mt-12 lg:auto-rows-[280px] lg:grid-cols-4 lg:gap-5">
            {categories.map((category, index) => {
              const span = category.span === 'tall' || (category.span === 'normal' && index === 0) ? 'row-span-2' : category.span === 'wide' ? 'col-span-2' : '';
              return <Reveal key={category.id} delay={index * 70} className={span}>
                <Link to={`/shop?category=${encodeURIComponent(category.id)}`} className="group relative block h-full overflow-hidden rounded-xl lg:rounded-2xl">
                  <img src={category.image || categoryPhoto(category.name, index)} alt={`Editorial stock image for the ${category.name} category`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/5 to-transparent transition-opacity group-hover:from-ink/75" />
                  <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5"><h2 className="font-serif text-lg font-medium text-cream lg:text-2xl">{category.name}</h2><span className="mt-1 inline-flex items-center gap-1 text-xs text-cream/75">Browse category <ArrowRight size={12} /></span></div>
                </Link>
              </Reveal>;
            })}
          </div>
          <p className="mt-3 text-center text-[10px] uppercase tracking-[0.12em] text-ink-soft">Category cover photos are editorial Pexels stock, not product photographs.</p>
        </div>
      </section>}

      {collections.length > 0 && <section id="collections" className="bg-[#f8f4f0] py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Reveal><SectionHeading eyebrow="Published by Little Loom" title={<>The little <span className="italic">edits</span></>} align="center" /></Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
            {collections.map((collection, index) => <Reveal key={collection.id} delay={index * 90}><Link to={`/shop?collection=${encodeURIComponent(collection.slug)}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
              <img src={collection.image || [`${editorial}category-rompers.webp`, `${editorial}category-coords.webp`, `${editorial}brand-story.webp`][index % 3]} alt={collection.image ? collection.name : `Editorial image for ${collection.name}; not a product photograph`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5 text-cream lg:p-7"><h2 className="font-serif text-2xl lg:text-3xl">{collection.name}</h2>{collection.description && <p className="mt-2 text-sm text-cream/75">{collection.description}</p>}<span className="mt-3 inline-flex items-center gap-1 text-xs">Explore collection <ArrowRight size={12} /></span></div>
            </Link></Reveal>)}
          </div>
        </div>
      </section>}

      {featuredProducts.length > 0 && <section className="bg-cream py-16 lg:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Reveal><SectionHeading eyebrow="Published collection" title={<>Featured <span className="italic">pieces</span></>} link={{ label: 'Shop all published products', href: '/shop' }} /></Reveal><div className="mt-8 grid grid-cols-2 gap-4 lg:mt-12 lg:grid-cols-4 lg:gap-6">{featuredProducts.map((product, index) => <Reveal key={product.id} delay={index * 80}><ProductCard product={product} onQuickAdd={handleQuickAdd} /></Reveal>)}</div></div></section>}

      <section id="brand-story" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <Reveal y={40} className="lg:col-span-5"><div className="relative"><div className="aspect-[4/5] overflow-hidden rounded-2xl lg:rounded-3xl"><img src={brandStory?.desktopImage || `${editorial}brand-story.webp`} alt={brandStory?.desktopImage ? (brandStory.heading || 'Little Loom brand story') : 'Pexels editorial photograph of a parent and child outdoors'} loading="lazy" className="h-full w-full object-cover" /></div></div></Reveal>
          <Reveal y={40} delay={150} className="lg:col-span-6 lg:col-start-7"><div className="flex flex-col gap-5"><span className="text-xs font-semibold uppercase tracking-[0.25em] text-peach">{(brandStory?.content?.eyebrow as string) || 'Our world'}</span><h2 className="font-serif text-3xl font-light leading-[1.1] text-ink text-balance sm:text-4xl lg:text-5xl">{brandStory?.heading || 'A closer look at Little Loom.'}</h2><div className="space-y-4 text-sm leading-relaxed text-ink-soft lg:text-base"><p>{brandStory?.body || 'Browse the published catalogue for current product information, imagery and availability. Editorial photographs on this page are licensed stock images and do not depict Little Loom products.'}</p></div><Link to={hasProducts ? '/shop' : '#shop-by-age'} className="mt-2"><Button variant="outline" size="lg" className="group">{hasProducts ? 'View published products' : 'Browse by age'}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button></Link><a href="/images/editorial/SOURCES.md" target="_blank" rel="noreferrer" className="text-[10px] uppercase tracking-[0.12em] text-ink-soft underline underline-offset-2">Editorial image credits</a></div></Reveal>
        </div></div>
      </section>
    </div>
  );
}
