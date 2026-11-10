import { Link } from 'react-router-dom';
import { ArrowRight } from 'lucide-react';
import { ageNavigation, categoryNavigation } from '../data/storeNavigation';
import { SectionHeading } from './ui';
import type { AgeInfo, CategoryInfo } from '../types';

type Props = { ages?: AgeInfo[]; categories?: CategoryInfo[] };

export default function StoreNavigationTiles({ ages = [], categories = [] }: Props) {
  return (
    <div className="mt-12 space-y-12 sm:mt-16 sm:space-y-16">
      <section aria-label="Shop by age">
        <SectionHeading eyebrow="Find their fit" title={<>Shop by <span className="italic">age</span></>} />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4 lg:gap-5">
          {ageNavigation.map((item) => {
            const actual = ages.find((age) => age.label.toLowerCase() === item.label.toLowerCase());
            return <Link key={item.label} to={`/shop?age=${encodeURIComponent(actual?.id || item.value)}`} className="group relative block aspect-[3/4] overflow-hidden rounded-xl bg-cream sm:rounded-2xl">
              <img src={actual?.image || item.image} alt={`${item.label} clothing editorial`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-ink/10 to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-cream sm:p-5"><span className="font-serif text-lg sm:text-2xl">{item.label}</span><span className="mt-1 flex items-center gap-1 text-[10px] text-cream/75 sm:text-xs">Explore age group <ArrowRight size={12} /></span></div>
            </Link>;
          })}
        </div>
      </section>
      <section aria-label="Shop by category">
        <SectionHeading eyebrow="Browse the wardrobe" title={<>Shop by <span className="italic">category</span></>} />
        <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6 lg:gap-5">
          {categoryNavigation.map((item) => {
            const actual = categories.find((category) => category.name.toLowerCase() === item.label.toLowerCase());
            return <Link key={item.label} to={`/shop?category=${encodeURIComponent(actual?.id || item.value)}`} className="group relative block aspect-[4/5] overflow-hidden rounded-xl bg-cream sm:rounded-2xl">
              <img src={actual?.image || item.image} alt={`${item.label} clothing editorial`} loading="lazy" className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.04]" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink/70 via-transparent to-transparent" />
              <div className="absolute inset-x-0 bottom-0 p-3 text-cream sm:p-4"><span className="font-serif text-base sm:text-lg">{item.label}</span><span className="mt-1 flex items-center gap-1 text-[10px] text-cream/75 sm:text-xs">Explore category <ArrowRight size={12} /></span></div>
            </Link>;
          })}
        </div>
      </section>
    </div>
  );
}
