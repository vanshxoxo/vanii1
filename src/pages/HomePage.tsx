import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Sparkles } from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import { useCmsSection } from '../lib/cms';
import { useStore } from '../useStore';
import type { Product } from '../types';
import ProductCard from '../components/ProductCard';
import LaunchPreviewGrid from '../components/LaunchPreviewGrid';
import Button from '../components/Button';
import { SectionHeading } from '../components/ui';
import Reveal from '../components/Reveal';
import { ageNavigation, categoryNavigation, resolveLaunchAge } from '../data/storeNavigation';

const editorial = '/images/editorial/version-b/';

const homeCategories = categoryNavigation.map((item) => ({ name: item.label, photo: item.image }));

const pexelsEditorialPhotos = [
  'pexels-kidswear-editorial-29562273.webp', 'pexels-kidswear-editorial-32234111.webp',
  'pexels-kidswear-editorial-32233627.webp', 'pexels-kidswear-editorial-15443075.webp',
  'pexels-kidswear-editorial-13627298.webp', 'pexels-kidswear-editorial-15967300.webp',
  'pexels-kidswear-editorial-33581402.webp', 'pexels-kidswear-editorial-30111516.webp',
  'pexels-kidswear-editorial-18279333.webp', 'pexels-kidswear-editorial-33253247.webp',
  'pexels-kidswear-editorial-31380756.webp', 'pexels-kidswear-editorial-37529058.webp',
  'pexels-kidswear-editorial-38543840.webp', 'pexels-kidswear-editorial-7787255.webp',
  'pexels-kidswear-editorial-28490495.webp',
];

export default function HomePage() {
  const { addToCart } = useStore();
  const { products, hasPublishedRecords, ages, categories, collections, hero, loading: catalogLoading, error } = useCatalog();
  const campaign = useCmsSection('featured-campaign');
  const brandStory = useCmsSection('brand-story');
  const fabricDetail = useCmsSection('fabric-detail');
  const railRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  const ageCards = ageNavigation.map((age) => {
    const actual = ages.find((item) => resolveLaunchAge(item.label)?.key === age.key);
    return { ...age, id: actual?.id || age.value, image: actual?.image || age.image };
  });
  const newArrivals = products.filter((product) => product.isNew).slice(0, 6);
  const featuredProducts = products.filter((product) => product.isBestseller).slice(0, 4);
  const heroLines = (hero?.heading || 'Small humans.\nBig outfits.').split('\n');
  const hasProducts = products.length > 0;
  const heroHref = hero?.ctaHref?.startsWith('/') ? hero.ctaHref : '/shop?filter=new';
  const heroDesktopImage = hero?.image || `${editorial}hero-desktop.webp`;
  const heroMobileImage = hero?.mobileImage || `${editorial}hero-mobile.webp`;

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
      <section className="relative overflow-hidden bg-[#f5f0e9]">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
          <div className="grid items-stretch gap-4 sm:gap-6 lg:grid-cols-[0.9fr_1.1fr] lg:gap-10">
            <div className="order-2 flex flex-col justify-center rounded-2xl bg-ivory px-6 py-8 sm:px-10 sm:py-10 lg:order-1 lg:rounded-3xl lg:px-12 lg:py-14" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(18px)', transition: 'opacity 0.7s ease-out, transform 0.7s cubic-bezier(0.16, 1, 0.3, 1)' }}>
              <span className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-[0.25em] text-peach sm:text-xs"><Sparkles size={14} /> Little Loom</span>
              <h1 className="hero-headline mt-5 font-serif font-light leading-[0.98] text-ink text-balance">
                <span className={`hero-line ${mounted ? 'is-visible' : ''}`}>{heroLines[0]}</span>
                {heroLines[1] && <span className={`hero-line italic ${mounted ? 'is-visible' : ''}`}>{heroLines[1]}</span>}
              </h1>
              <p className="mt-5 max-w-md text-sm leading-relaxed text-ink-soft sm:text-base lg:text-lg">
                {hero?.body || 'Clothing and details shared by Little Loom.'}
              </p>
              <div className="mt-7 flex flex-col gap-3 sm:flex-row">
                <Link to={hasProducts ? heroHref : '#shop-by-age'}><Button variant="primary" size="lg" className="group w-full sm:w-auto">{hero?.ctaLabel || (hasProducts ? 'Shop the collection' : 'Explore by age')}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button></Link>
                <a href="#shop-by-category"><Button variant="outline" size="lg" className="w-full sm:w-auto">Browse categories</Button></a>
              </div>
              {error && <p role="status" className="mt-4 text-xs text-ink-soft">The published catalogue is temporarily unavailable.</p>}
            </div>
            <div className="hero-image order-1 overflow-hidden rounded-2xl bg-cream lg:order-2 lg:rounded-3xl" style={{ opacity: mounted ? 1 : 0, transform: mounted ? 'translateY(0)' : 'translateY(12px)', transition: 'opacity 0.8s ease-out 0.12s, transform 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.12s' }}>
              <picture className="block aspect-[4/3] w-full sm:aspect-[16/10] lg:aspect-auto lg:h-full lg:min-h-[580px]">
                <source media="(max-width: 639px)" srcSet={heroMobileImage} />
                <img src={heroDesktopImage} alt="Children outdoors in everyday clothing" className="h-full w-full object-cover" fetchPriority="high" decoding="async" />
              </picture>
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
                <img src={age.image} alt={`${age.label} clothing collection`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent transition-opacity duration-300 group-hover:from-ink/80" />
                <div className="absolute bottom-0 left-0 right-0 p-4 lg:p-5">{age.range && <p className="mb-0.5 text-xs text-cream/70">{age.range}</p>}<h2 className="font-serif text-xl font-medium text-cream lg:text-2xl">{age.label}</h2><span className="mt-1 inline-flex items-center gap-1 text-xs text-cream/70 transition-all group-hover:gap-2">Browse age group <ArrowRight size={12} /></span></div>
              </Link>
            </Reveal>)}
          </div>
        </div>
      </section>

      <section className="bg-cream py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><div className="mb-8 flex items-end justify-between gap-4 lg:mb-12">
            <SectionHeading eyebrow={newArrivals.length ? 'Just published' : hasProducts ? 'Little Loom catalogue' : 'Little Loom'} title={newArrivals.length ? <>New <span className="italic">arrivals</span></> : hasProducts ? <>The published <span className="italic">collection</span></> : catalogLoading || error || hasPublishedRecords ? <>The Little Loom <span className="italic">wardrobe</span></> : <>The first <span className="italic">edit</span></>} />
            {hasProducts && <div className="hidden items-center gap-2 sm:flex"><button onClick={() => scrollRail('left')} aria-label="Scroll products left" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-all hover:scale-110 hover:bg-ink hover:text-cream"><ArrowLeft size={18} /></button><button onClick={() => scrollRail('right')} aria-label="Scroll products right" className="flex h-10 w-10 items-center justify-center rounded-full border border-ink/15 text-ink transition-all hover:scale-110 hover:bg-ink hover:text-cream"><ArrowRight size={18} /></button></div>}
          </div></Reveal>
          {hasProducts ? <>
            <div ref={railRef} className="no-scrollbar snap-x-mandatory -mx-4 flex gap-4 overflow-x-auto px-4 pb-4 sm:mx-0 sm:px-0 lg:gap-6">
              {(newArrivals.length ? newArrivals : products.slice(0, 6)).map((product, index) => <Reveal key={product.id} delay={index * 65} className="w-[260px] shrink-0 snap-start sm:w-[280px] lg:w-[300px]"><ProductCard product={product} onQuickAdd={handleQuickAdd} /></Reveal>)}
            </div>
            <div className="mt-7 text-center"><Link to={newArrivals.length ? '/shop?filter=new' : '/shop'}><Button variant="outline" size="md">View published products</Button></Link></div>
          </> : catalogLoading ? <div role="status" className="rounded-2xl bg-[#f4eee8] p-7 text-sm text-ink-soft sm:p-10">Loading the published Little Loom catalogue…</div> : error || hasPublishedRecords ? <><div className="grid overflow-hidden rounded-2xl bg-[#f4eee8] lg:grid-cols-2">
            <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14"><p className="text-xs uppercase tracking-[0.2em] text-peach">Little Loom</p><h2 className="mt-3 font-serif text-3xl font-light leading-tight text-ink sm:text-4xl">The catalogue is temporarily unavailable</h2><p role="status" className="mt-4 max-w-md text-sm leading-7 text-ink-soft">Published products could not be loaded. Browse the editorial categories below while the catalogue connection is restored.</p></div>
            <img src={`${editorial}category-rompers.webp`} alt="Children in relaxed everyday clothing" loading="lazy" className="min-h-64 w-full object-cover sm:min-h-80" />
          </div><div className="mt-7"><LaunchPreviewGrid /></div></> : <LaunchPreviewGrid />}
        </div>
      </section>

      <section id="editorial-campaign" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-stretch gap-6 lg:grid-cols-2 lg:gap-10">
            <Reveal y={40} className="order-2 lg:order-1"><div className="relative flex min-h-[300px] flex-col justify-center overflow-hidden rounded-2xl bg-peach p-8 lg:min-h-[500px] lg:rounded-3xl lg:p-14">
              <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10" /><div className="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-white/10" />
              <span className="relative mb-4 text-xs font-semibold uppercase tracking-[0.25em] text-cream/70">{(campaign?.content?.eyebrow as string) || 'Little Loom'}</span>
              <h2 className="relative font-serif text-3xl font-light leading-[1.05] text-cream text-balance sm:text-4xl lg:text-5xl">{campaign?.heading || 'A little look at childhood.'}</h2>
              <p className="relative mt-5 max-w-md text-sm leading-relaxed text-cream/85 lg:text-base">{campaign?.body || 'Small moments, softly remembered.'}</p>
              {campaign?.cta_label && campaign.cta_href?.startsWith('/') && <Link to={campaign.cta_href} className="relative mt-7"><Button variant="primary" size="lg" className="group">{campaign.cta_label}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button></Link>}
            </div></Reveal>
            <Reveal y={40} delay={150} className="order-1 lg:order-2"><figure className="group relative min-h-[300px] overflow-hidden rounded-2xl lg:min-h-[500px] lg:rounded-3xl"><picture className="absolute inset-0 block"><source media="(max-width: 639px)" srcSet={campaign?.mobileImage || `${editorial}campaign.webp`} /><img src={campaign?.desktopImage || `${editorial}campaign.webp`} alt="Children sharing a quiet moment outdoors" loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" /></picture></figure></Reveal>
          </div>
        </div>
      </section>

      <section id="shop-by-category" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="Browse the wardrobe" title={<>Shop by <span className="italic">category</span></>} align="center" /></Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:mt-12 lg:gap-5">
            {homeCategories.map((item, index) => {
              const category = categories.find((entry) => entry.name.toLowerCase() === item.name.toLowerCase());
              return <Reveal key={item.name} delay={index * 70}>
                <Link to={`/shop?category=${encodeURIComponent(category?.id || item.name)}`} className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-cream lg:rounded-2xl">
                  <img src={category?.image || item.photo} alt={`${item.name} clothing collection`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110" />
                  <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-ink/5 to-transparent transition-opacity group-hover:from-ink/75" />
                  <div className="absolute inset-x-0 bottom-0 p-4 lg:p-5"><h2 className="font-serif text-lg font-medium text-cream lg:text-2xl">{item.name}</h2><span className="mt-1 inline-flex items-center gap-1 text-xs text-cream/75">Browse category <ArrowRight size={12} /></span></div>
                </Link>
              </Reveal>;
            })}
          </div>
        </div>
      </section>

      {collections.length > 0 && <section id="collections" className="bg-[#f8f4f0] py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Reveal><SectionHeading eyebrow="Published by Little Loom" title={<>The little <span className="italic">edits</span></>} align="center" /></Reveal>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-3 lg:gap-6">
            {collections.map((collection, index) => <Reveal key={collection.id} delay={index * 90}><Link to={`/shop?collection=${encodeURIComponent(collection.slug)}`} className="group relative block aspect-[4/5] overflow-hidden rounded-2xl bg-cream">
              <img src={collection.image || [`${editorial}category-rompers.webp`, `${editorial}category-coords.webp`, `${editorial}brand-story.webp`][index % 3]} alt={collection.image ? collection.name : `${collection.name} collection`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/65 via-transparent to-transparent" /><div className="absolute inset-x-0 bottom-0 p-5 text-cream lg:p-7"><h2 className="font-serif text-2xl lg:text-3xl">{collection.name}</h2>{collection.description && <p className="mt-2 text-sm text-cream/75">{collection.description}</p>}<span className="mt-3 inline-flex items-center gap-1 text-xs">Explore collection <ArrowRight size={12} /></span></div>
            </Link></Reveal>)}
          </div>
        </div>
      </section>}

      {featuredProducts.length > 0 && <section className="bg-cream py-16 lg:py-24"><div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><Reveal><SectionHeading eyebrow="Published collection" title={<>Featured <span className="italic">pieces</span></>} link={{ label: 'Shop all published products', href: '/shop' }} /></Reveal><div className="mt-8 grid grid-cols-2 gap-4 lg:mt-12 lg:grid-cols-4 lg:gap-6">{featuredProducts.map((product, index) => <Reveal key={product.id} delay={index * 80}><ProductCard product={product} onQuickAdd={handleQuickAdd} /></Reveal>)}</div></div></section>}

      <section id="brand-story" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><div className="grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
          <Reveal y={40} className="lg:col-span-5"><div className="relative"><div className="aspect-[4/5] overflow-hidden rounded-2xl lg:rounded-3xl"><picture className="block h-full w-full"><source media="(max-width: 639px)" srcSet={brandStory?.mobileImage || `${editorial}brand-story.webp`} /><img src={brandStory?.desktopImage || `${editorial}brand-story.webp`} alt="A child in comfortable everyday clothing" loading="lazy" className="h-full w-full object-cover" /></picture></div></div></Reveal>
          <Reveal y={40} delay={150} className="lg:col-span-6 lg:col-start-7"><div className="flex flex-col gap-5"><span className="text-xs font-semibold uppercase tracking-[0.25em] text-peach">{(brandStory?.content?.eyebrow as string) || 'Our world'}</span><h2 className="font-serif text-3xl font-light leading-[1.1] text-ink text-balance sm:text-4xl lg:text-5xl">{brandStory?.heading || 'A closer look at Little Loom.'}</h2><div className="space-y-4 text-sm leading-relaxed text-ink-soft lg:text-base"><p>{brandStory?.body || 'A thoughtful little world of clothing, details and everyday moments.'}</p></div><Link to={hasProducts ? '/shop' : '#shop-by-age'} className="mt-2"><Button variant="outline" size="lg" className="group">{hasProducts ? 'View published products' : 'Browse by age'}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button></Link></div></Reveal>
        </div></div>
      </section>

      <section id="fabric-detail" className="bg-[#efe9e1] py-16 lg:py-24">
        <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8">
          <Reveal className="order-2 lg:order-1">
            <p className="text-xs font-semibold uppercase tracking-[0.25em] text-peach">{(fabricDetail?.content?.eyebrow as string) || 'A closer look'}</p>
            <h2 className="mt-4 font-serif text-3xl font-light leading-tight text-ink text-balance sm:text-4xl lg:text-5xl">{fabricDetail?.heading || 'Little details, in focus.'}</h2>
            <p className="mt-5 max-w-lg text-sm leading-7 text-ink-soft lg:text-base">{fabricDetail?.body || 'A quiet study of fabric, texture and thoughtful details.'}</p>
          </Reveal>
          <Reveal y={35} delay={120} className="order-1 lg:order-2">
            <figure className="relative overflow-hidden rounded-2xl lg:rounded-3xl">
              <picture className="block aspect-[5/4] w-full"><source media="(max-width: 639px)" srcSet={fabricDetail?.mobileImage || `${editorial}fabric-detail.webp`} /><img src={fabricDetail?.desktopImage || `${editorial}fabric-detail.webp`} alt="Soft fabric and stitching detail" loading="lazy" className="h-full w-full object-cover" /></picture>
            </figure>
          </Reveal>
        </div>
      </section>

      <section id="editorial-image-archive" className="py-16 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal><SectionHeading eyebrow="Little Loom" title={<>A little visual <span className="italic">world</span></>} align="center" /></Reveal>
          <div className="mt-8 grid grid-cols-2 gap-3 sm:mt-10 sm:grid-cols-3 sm:gap-4 lg:grid-cols-5 lg:gap-5">
            {pexelsEditorialPhotos.map((filename, index) => <Reveal key={filename} delay={(index % 5) * 45}>
              <figure className="group overflow-hidden rounded-xl bg-cream lg:rounded-2xl">
                <img src={`/images/catalog-preview/${filename}`} alt="Children in everyday clothing" loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-105" />
              </figure>
            </Reveal>)}
          </div>
        </div>
      </section>
    </div>
  );
}
