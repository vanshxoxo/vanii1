import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import { useCmsSection } from '../lib/cms';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';

function safeHref(href: string | null | undefined, fallback: string) {
  return href?.startsWith('/') ? href : fallback;
}

export default function HomePage() {
  const { products, ages, categories, collections, hero, loading, error } = useCatalog();
  const campaign = useCmsSection('featured-campaign');
  const brandStory = useCmsSection('brand-story');
  const newArrivals = products.filter((product) => product.isNew).slice(0, 6);
  const hasProducts = products.length > 0;

  return (
    <div>
      <section className="bg-[#f3efe9]">
        <div className={`mx-auto grid max-w-7xl items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-20 ${hero?.image ? '' : 'min-h-[420px] lg:min-h-[520px]'}`}>
          <div className="py-4 lg:py-10">
            <p className="text-xs font-medium uppercase tracking-[0.24em] text-ink-soft">Little Loom</p>
            <h1 className="mt-5 max-w-xl font-serif text-5xl font-light leading-[1.02] text-ink sm:text-6xl lg:text-7xl">
              {hero?.heading || 'Little Loom'}
            </h1>
            <p className="mt-5 max-w-lg text-base leading-7 text-ink-soft">
              {hero?.body || (loading ? 'Loading the published collection…' : error ? 'The published collection could not be loaded.' : hasProducts ? 'Explore the published Little Loom collection.' : 'No products are currently published. The collection will appear here when product details and authorized photography are ready.')}
            </p>
            {hasProducts && hero?.ctaLabel && <Link to={safeHref(hero.ctaHref, '/shop')} className="mt-7 inline-flex">
              <Button variant="primary" size="lg" className="group">{hero.ctaLabel}<ArrowRight size={16} className="transition-transform group-hover:translate-x-1" /></Button>
            </Link>}
            {error && <p role="status" className="mt-6 max-w-lg border-l-2 border-clay px-4 py-2 text-sm text-ink-soft">Store data could not be loaded. Please try again later.</p>}
          </div>
          {hero?.image && <picture className="block aspect-[4/5] overflow-hidden rounded-2xl bg-ivory lg:aspect-[5/4]">
            {hero.mobileImage && <source media="(max-width: 639px)" srcSet={hero.mobileImage} />}
            <img src={hero.image} alt={hero.heading || 'Little Loom'} fetchPriority="high" className="h-full w-full object-cover" />
          </picture>}
        </div>
      </section>

      {categories.length > 0 && <section id="shop-by-category" className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Browse</p><h2 className="mt-2 font-serif text-3xl font-light text-ink sm:text-4xl">Shop by category</h2></div>
          {hasProducts && <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-ink underline underline-offset-4">View the collection<ArrowRight size={15} /></Link>}
        </div>
        <div className="mt-7 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category) => <Link key={category.id} to={`/shop?category=${encodeURIComponent(category.id)}`} className="group flex min-h-24 items-center justify-between border border-ink/10 bg-white/50 px-5 py-4 transition-colors hover:bg-white">
            <span className="font-serif text-xl text-ink">{category.name}</span><ArrowRight size={18} className="text-ink-soft transition-transform group-hover:translate-x-1" />
          </Link>)}
        </div>
      </section>}

      {ages.length > 0 && <section id="shop-by-age" className="bg-[#f8f6f2] py-12 lg:py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Sizing</p><h2 className="mt-2 font-serif text-3xl font-light text-ink">Shop by age</h2>
          <div className="mt-6 flex flex-wrap gap-3">{ages.map((age) => <Link key={age.id} to={`/shop?age=${encodeURIComponent(age.id)}`} className="border border-ink/15 bg-white px-5 py-3 text-sm text-ink transition-colors hover:bg-ink hover:text-white">{age.label}</Link>)}</div>
        </div>
      </section>}

      {newArrivals.length > 0 && <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="flex items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Recently published</p><h2 className="mt-2 font-serif text-3xl font-light text-ink sm:text-4xl">New arrivals</h2></div><Link to="/shop?filter=new" className="text-sm underline underline-offset-4">View all</Link></div>
        <div className="mt-8 grid grid-cols-2 gap-4 lg:grid-cols-4 lg:gap-6">{newArrivals.map((product) => <ProductCard key={product.id} product={product} />)}</div>
      </section>}

      {collections.length > 0 && <section id="collections" className="bg-[#f8f6f2] py-14 lg:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8"><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Published</p><h2 className="mt-2 font-serif text-3xl font-light text-ink sm:text-4xl">Collections</h2>
          <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{collections.map((collection) => <Link key={collection.id} to={`/shop?collection=${encodeURIComponent(collection.slug)}`} className="group block">
            {collection.image && <div className="aspect-[4/3] overflow-hidden bg-white"><img src={collection.image} alt={collection.name} loading="lazy" className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.02]" /></div>}
            <h3 className="mt-3 font-serif text-2xl text-ink">{collection.name}</h3>{collection.description && <p className="mt-1 text-sm text-ink-soft">{collection.description}</p>}
          </Link>)}</div>
        </div>
      </section>}

      {campaign && (campaign.heading || campaign.body || campaign.desktopImage) && <section className="mx-auto max-w-7xl px-4 py-14 sm:px-6 lg:px-8 lg:py-20">
        <div className="grid overflow-hidden rounded-2xl bg-[#eee7df] lg:grid-cols-2">
          <div className="flex flex-col justify-center p-7 sm:p-10 lg:p-14"><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Little Loom</p>{campaign.heading && <h2 className="mt-3 font-serif text-3xl font-light text-ink sm:text-4xl">{campaign.heading}</h2>}{campaign.body && <p className="mt-4 max-w-lg text-sm leading-7 text-ink-soft">{campaign.body}</p>}{campaign.cta_label && <Link to={safeHref(campaign.cta_href, '/shop')} className="mt-6 inline-flex items-center gap-2 text-sm underline underline-offset-4">{campaign.cta_label}<ArrowRight size={15} /></Link>}</div>
          {campaign.desktopImage && <img src={campaign.desktopImage} alt={campaign.heading || 'Little Loom campaign'} loading="lazy" className="h-full min-h-64 w-full object-cover" />}
        </div>
      </section>}

      {brandStory && (brandStory.heading || brandStory.body || brandStory.desktopImage) && <section id="brand-story" className="bg-[#f8f6f2] py-14 lg:py-20">
        <div className="mx-auto grid max-w-7xl gap-8 px-4 sm:px-6 lg:grid-cols-2 lg:items-center lg:px-8">{brandStory.desktopImage && <img src={brandStory.desktopImage} alt={brandStory.heading || 'Little Loom'} loading="lazy" className="aspect-[4/3] w-full rounded-2xl object-cover" />}<div><p className="text-xs uppercase tracking-[0.2em] text-ink-soft">Little Loom</p>{brandStory.heading && <h2 className="mt-3 font-serif text-3xl font-light text-ink sm:text-4xl">{brandStory.heading}</h2>}{brandStory.body && <p className="mt-4 text-sm leading-7 text-ink-soft">{brandStory.body}</p>}</div></div>
      </section>}
    </div>
  );
}
