import { Link } from 'react-router-dom';
import { launchAssortment, formatProposedPrice } from '../data/launchAssortment';
import { SectionHeading } from './ui';

type Props = { title?: boolean; category?: string };

export default function LaunchPreviewGrid({ title = true, category }: Props) {
  const visibleProducts = category
    ? launchAssortment.filter((product) => product.category.toLowerCase() === category.toLowerCase() || product.categorySlug.toLowerCase() === category.toLowerCase())
    : launchAssortment;
  return (
    <div id="launch-assortment" className="rounded-2xl bg-[#f8f4f0] p-4 sm:p-6 lg:rounded-3xl lg:p-8">
      <div>
        <div className="mb-7 lg:mb-10">
          {title && <SectionHeading eyebrow="A first look" title={<>The launch <span className="italic">assortment</span></>} />}
          <p className="mt-3 max-w-2xl text-sm leading-6 text-ink-soft">A visual preview of proposed Little Loom styles. Names and indicative prices are awaiting owner approval; editorial photographs are inspiration only and do not depict the garments for sale.</p>
        </div>
        <div className="grid grid-cols-2 gap-x-3 gap-y-7 sm:grid-cols-3 sm:gap-x-5 lg:grid-cols-4 lg:gap-x-6 lg:gap-y-10 xl:grid-cols-5">
          {visibleProducts.map((item) => (
            <article key={item.key} className="min-w-0">
              <Link to={`/shop?category=${encodeURIComponent(item.category)}`} className="group block overflow-hidden rounded-xl bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-ink sm:rounded-2xl">
                <img src={item.image} alt="Editorial image used for visual inspiration; not product photography" loading="lazy" decoding="async" className="aspect-[4/5] w-full object-cover transition-transform duration-700 group-hover:scale-[1.035]" />
              </Link>
              <div className="mt-3 flex min-h-[108px] flex-col sm:mt-4">
                <p className="text-[9px] font-medium uppercase tracking-[0.18em] text-ink-light sm:text-[10px]">{item.category}</p>
                <h3 className="mt-1 font-serif text-base leading-snug text-ink sm:text-lg">{item.name}</h3>
                <p className="mt-1 text-xs text-ink-soft">{item.description}</p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-x-2 gap-y-1 pt-3">
                  <span className="text-sm font-medium tabular-nums text-ink">{formatProposedPrice(item.price)}</span>
                  <span className="rounded-full bg-white/80 px-2.5 py-1 text-[9px] font-medium uppercase tracking-[0.12em] text-ink-soft">Coming soon</span>
                </div>
              </div>
            </article>
          ))}
        </div>
        <p className="mt-8 border-t border-ink/10 pt-4 text-xs leading-5 text-ink-light">These are assortment proposals only. Product specifications, authorised product photographs, verified prices and stock will be added after owner review.</p>
      </div>
    </div>
  );
}
