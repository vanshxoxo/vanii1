import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import { useCmsSection } from '../lib/cms';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';

function safeHref(href: string | null | undefined, fallback: string) {
  return href?.startsWith('/') ? href : fallback;
}

function ageImage(label: string) {
  const value = label.toLowerCase();
  if (value.includes('newborn') || value.includes('new born')) return '/images/editorial/newborn.webp';
  if (value.includes('baby') || value.includes('infant')) return '/images/editorial/baby.webp';
  if (value.includes('toddler')) return '/images/editorial/toddler.webp';
  if (value.includes('little kid') || value.includes('kids') || value.includes('child')) return '/images/editorial/little-kids.webp';
  return '/images/editorial/editorial-reading.webp';
}

export default function HomePage() {
  const { products, ages, categories, collections, hero, loading, error } = useCatalog();
  const campaign = useCmsSection('featured-campaign');
  const brandStory = useCmsSection('brand-story');
  const newArrivals = products.filter((product) => product.isNew).slice(0, 6);
  const hasProducts = products.length > 0;
  const ageCards = ages.length > 0 ? ages : [
    { id: 'Newborn', label: 'Newborn', range: '', image: '', description: '' },
    { id: 'Baby', label: 'Baby', range: '', image: '', description: '' },
    { id: 'Toddler', label: 'Toddler', range: '', image: '', description: '' },
    { id: 'Little Kids', label: 'Little Kids', range: '', image: '', description: '' },
  ];
  const heroImage = hero?.image || '/images/editorial/hero-desktop.webp';
  const heroMobileImage = hero?.mobileImage || (hero?.image ? hero.image : '/images/editorial/hero-mobile.webp');

  return (
    <div>
      <section className="relative isolate min-h-[610px] overflow-hidden bg-[#e9e5e1] sm:min-h-[680px] lg:min-h-[720px]">
        <picture className="absolute inset-0 -z-20 block h-full w-full">
          <source media="(max-width: 639px)" srcSet={heroMobileImage} />
          <img src={heroImage} alt={hero?.heading ? `Editorial image for ${hero.heading}` : 'Pexels stock photograph of child fashion models'} fetchPriority="high" className="h-full w-full object-cover object-center" />
        </picture>
        <div className="absolute inset-0 -z-10 bg-gradient-to-r from-[#f7f3ed]/95 via-[#f7f3ed]/75 to-[#f7f3ed]/5 sm:from-[#f7f3ed]/90 sm:via-[#f7f3ed]/55 sm:to-transparent" />
        <div className="mx-auto flex min-h-[610px] max-w-7xl items-end px-5 pb-14 pt-36 sm:min-h-[680px] sm:px-8 sm:pb-16 lg:min-h-[720px] lg:items-center lg:px-10 lg:py-20">
          <div className="max-w-xl">
            <p className="text-[11px] font-medium uppercase tracking-[0.25em] text-ink-soft">Little Loom</p>
            <h1 className="mt-5 max-w-lg font-serif text-5xl font-light leading-[1.02] text-ink sm:text-6xl lg:text-7xl">{hero?.heading || 'Made for little days'}</h1>
            <p className="mt-5 max-w-md text-base leading-7 text-ink-soft sm:text-lg">{hero?.body || 'A world of childhood, seen through the clothes we wear and the moments we keep.'}</p>
            <div className="mt-7 flex flex-wrap items-center gap-4">
              {hasProducts ? <Link to={safeHref(hero?.ctaHref, '/shop')}><Button variant="primary" size="lg" className="group">{hero?.ctaLabel || 'Shop the collection'}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button></Link>
                : ageCards.length > 0 && <a href="#shop-by-age"><Button variant="primary" size="lg" className="group">Explore by age<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button></a>}
              {error && <span role="status" className="text-sm text-ink-soft">Store catalogue is temporarily unavailable.</span>}
              {!error && !loading && !hasProducts && <span className="text-sm text-ink-soft">The published catalogue will appear here.</span>}
            </div>
            <p className="mt-8 text-[10px] uppercase tracking-[0.13em] text-ink-soft/80">Editorial photograph · <a href="/images/editorial/SOURCES.md" target="_blank" rel="noreferrer" className="underline underline-offset-2">Pexels image credits</a></p>
          </div>
        </div>
      </section>

      {ageCards.length > 0 && <section id="shop-by-age" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Browse by age</p><h2 className="mt-2 font-serif text-3xl font-light text-ink sm:text-4xl">Shop by age</h2></div>
          {hasProducts && <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-ink underline underline-offset-4">View all products<ArrowRight size={15} /></Link>}
        </div>
        <div className="mt-7 grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-4">
          {ageCards.map((age) => <Link key={age.id} to={`/shop?age=${encodeURIComponent(age.id)}`} className="group relative block overflow-hidden bg-[#eee9e3]">
            <div className="aspect-[4/5] overflow-hidden"><img src={age.image || ageImage(age.label)} alt={`Editorial photograph for ${age.label}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" /></div>
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/55 to-transparent px-4 pb-4 pt-14 text-white sm:px-5 sm:pb-5"><span className="font-serif text-xl sm:text-2xl">{age.label}</span><ArrowRight size={17} className="mb-1 transition-transform group-hover:translate-x-1" /></div>
          </Link>)}
        </div>
        <p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-ink-soft">Editorial stock photography · images illustrate age groups and are not Little Loom product photographs.</p>
      </section>}

      {categories.length > 0 && <section id="shop-by-category" className="bg-[#f8f6f2] py-14 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Browse</p><h2 className="mt-2 font-serif text-3xl font-light text-ink sm:text-4xl">Shop by category</h2></div>
            {hasProducts && <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-ink underline underline-offset-4">View the collection<ArrowRight size={15} /></Link>}
          </div>
          <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => <Link key={category.id} to={`/shop?category=${encodeURIComponent(category.id)}`} className="group flex min-h-24 items-center justify-between border border-ink/10 bg-white/70 px-5 py-4 transition-colors hover:bg-white"><span className="font-serif text-xl text-ink">{category.name}</span><ArrowRight size={18} className="text-ink-soft transition-transform group-hover:translate-x-1" /></Link>)}
          </div>
        </div>
      </section>}

      {newArrivals.length > 0 && <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Recently published</p><h2 className="mt-2 font-serif text-3xl font-light text-ink sm:text-4xl">New arrivals</h2></div><Link to="/shop?filter=new" className="text-sm underline underline-offset-4">View all</Link></div>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>}

      <section className="bg-[#eee9e3] py-12 sm:py-16 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:px-6 lg:grid-cols-[1.35fr_0.65fr] lg:items-stretch lg:px-8">
          <figure className="relative overflow-hidden bg-[#ded6ca]"><img src="/images/editorial/editorial-reading.webp" alt="Children reading together outdoors in natural light" loading="lazy" className="h-full min-h-72 w-full object-cover sm:min-h-96" /><figcaption className="absolute bottom-3 left-3 bg-white/90 px-3 py-2 text-[10px] uppercase tracking-[0.1em] text-ink-soft">A moment in childhood · Pexels editorial</figcaption></figure>
          <div className="flex flex-col justify-between bg-[#f7f4ef] p-6 sm:p-9 lg:p-10"><div><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Little Loom, in focus</p><h2 className="mt-3 font-serif text-3xl font-light leading-tight text-ink sm:text-4xl">Small details. Everyday moments.</h2><p className="mt-4 text-sm leading-7 text-ink-soft">Explore the published collections and the pieces currently available from Little Loom.</p></div><img src="/images/editorial/fabric-detail.webp" alt="Close-up of softly woven natural fabric" loading="lazy" className="mt-8 aspect-[1.5/1] w-full object-cover" /></div>
        </div>
        <p className="mx-auto mt-3 max-w-7xl px-4 text-[10px] uppercase tracking-[0.12em] text-ink-soft sm:px-6 lg:px-8">Editorial stock photographs · Pexels · not representations of Little Loom products.</p>
      </section>

      {collections.length > 0 && <section id="collections" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Published</p><h2 className="mt-2 font-serif text-3xl font-light text-ink sm:text-4xl">Collections</h2>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{collections.map((collection, index) => <Link key={collection.id} to={`/shop?collection=${encodeURIComponent(collection.slug)}`} className="group block">
          <div className="aspect-[4/3] overflow-hidden bg-[#eee9e3]"><img src={collection.image || (index % 2 ? '/images/editorial/clothing-detail.webp' : '/images/editorial/fabric-detail.webp')} alt={collection.image ? collection.name : `Editorial textile image for ${collection.name}`} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" /></div>
          <h3 className="mt-3 font-serif text-2xl text-ink">{collection.name}</h3>{collection.description && <p className="mt-1 text-sm text-ink-soft">{collection.description}</p>}
        </Link>)}</div><p className="mt-3 text-[10px] uppercase tracking-[0.12em] text-ink-soft">Collection imagery is editorial and does not depict specific products.</p>
      </section>}

      {campaign && (campaign.heading || campaign.body || campaign.desktopImage) && <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20"><div className="grid overflow-hidden rounded-2xl bg-[#eee7df] lg:grid-cols-2"><div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14"><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Little Loom</p>{campaign.heading && <h2 className="mt-3 font-serif text-3xl font-light text-ink sm:text-4xl">{campaign.heading}</h2>}{campaign.body && <p className="mt-4 max-w-lg text-sm leading-7 text-ink-soft">{campaign.body}</p>}{campaign.cta_label && <Link to={safeHref(campaign.cta_href, '/shop')} className="mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-4">{campaign.cta_label}<ArrowRight size={15} /></Link>}</div>{campaign.desktopImage && <img src={campaign.desktopImage} alt={campaign.heading || 'Little Loom campaign'} loading="lazy" className="h-full min-h-64 w-full object-cover" />}</div></section>}

      <section id="brand-story" className="bg-[#f8f6f2] py-14 lg:py-20"><div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8"><img src={brandStory?.desktopImage || '/images/editorial/clothing-detail.webp'} alt={brandStory?.desktopImage ? (brandStory.heading || 'Little Loom brand story') : 'Children’s clothes hanging in warm sunlight'} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" /><div><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Little Loom</p><h2 className="mt-3 font-serif text-3xl font-light text-ink sm:text-4xl">{brandStory?.heading || 'A closer look at Little Loom'}</h2><p className="mt-4 text-sm leading-7 text-ink-soft">{brandStory?.body || 'Browse the current collection and discover the details shared for each published piece.'}</p><p className="mt-5 text-[10px] uppercase tracking-[0.12em] text-ink-soft">Editorial photograph · Pexels · not a product image.</p></div></div></section>
    </div>
  );
}
