import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import {
  ArrowRight,
  Sparkles,
  ShieldCheck,
  Truck,
  Gem,
  Shirt,
  Home,
  Baby,
} from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import type { Department } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/ui';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
import TiltCard from '../components/TiltCard';
import {
  departments,
  resolveDepartment,
  getCategoriesForDepartment,
  ageNavigation,
} from '../data/storeNavigation';

interface DepartmentLandingPageProps {
  departmentId?: Department;
}

export default function DepartmentLandingPage({ departmentId: propDeptId }: DepartmentLandingPageProps) {
  const { departmentId: paramDeptId } = useParams<{ departmentId: string }>();
  const activeId = (propDeptId || paramDeptId || 'jewellery') as Department;
  const deptInfo = resolveDepartment(activeId) || departments[0];

  const { products, loading: catalogLoading } = useCatalog();

  const deptCategories = useMemo(() => getCategoriesForDepartment(deptInfo.id), [deptInfo.id]);

  const deptProducts = useMemo(() => {
    return products.filter((p) => (p.department || p.productType || 'kids') === deptInfo.id);
  }, [products, deptInfo.id]);

  const getDeptIcon = (id: Department) => {
    switch (id) {
      case 'jewellery':
        return <Gem size={26} className="text-brass" />;
      case 'women_suits':
        return <Shirt size={26} className="text-terracotta" />;
      case 'home_textiles':
        return <Home size={26} className="text-forest" />;
      case 'kids':
        return <Baby size={26} className="text-[#C87D65]" />;
    }
  };

  const getButtonVariant = (id: Department) => {
    switch (id) {
      case 'jewellery':
        return 'brass';
      case 'women_suits':
        return 'terracotta';
      case 'home_textiles':
        return 'forest';
      case 'kids':
        return 'primary';
    }
  };

  return (
    <div className="min-h-screen bg-[#F6F2E9]">
      {/* 1. Editorial Hero Banner */}
      <section
        className="relative overflow-hidden border-b border-espresso/10"
        style={{ backgroundColor: deptInfo.accentBg }}
      >
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
          <Breadcrumbs
            items={[
              { label: 'Home', href: '/' },
              { label: 'Departments', href: '/shop' },
              { label: deptInfo.brand },
            ]}
          />

          <div className="mt-8 grid items-center gap-12 lg:grid-cols-12 lg:gap-16">
            {/* Left Narrative */}
            <div className="lg:col-span-7">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.24em]"
                style={{
                  backgroundColor: 'white',
                  color: deptInfo.accentText,
                  border: `1px solid ${deptInfo.accentBorder}`,
                }}
              >
                <Sparkles size={13} />
                VJ Collection · {deptInfo.brand}
              </span>

              <h1 className="mt-5 font-serif text-4xl font-light leading-[1.06] text-espresso sm:text-5xl lg:text-6xl text-balance whitespace-pre-line">
                {deptInfo.heroHeading}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-espresso-soft lg:text-lg">
                {deptInfo.heroSubheading}
              </p>

              <div className="mt-8 flex flex-wrap gap-3.5">
                <Link to={deptInfo.path}>
                  <Button variant={getButtonVariant(deptInfo.id)} size="lg" className="group">
                    <span>Shop Full {deptInfo.brand}</span>
                    <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="#categories">
                  <Button variant="outline" size="lg">
                    Browse Categories
                  </Button>
                </a>
              </div>

              {/* Department Standards Checklist */}
              <div className="mt-10 pt-6 border-t border-espresso/10 grid grid-cols-1 sm:grid-cols-3 gap-4">
                {deptInfo.highlights.map((h, i) => (
                  <div key={i} className="flex flex-col gap-1">
                    <span className="text-xs font-semibold uppercase tracking-wider text-espresso">
                      {h.title}
                    </span>
                    <span className="text-[11px] text-espresso-soft leading-relaxed">
                      {h.desc}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Right Editorial Image */}
            <div className="lg:col-span-5">
              <div className="relative mx-auto max-w-md lg:max-w-none">
                <div className="absolute -inset-2.5 rounded-3xl border border-espresso/12 -rotate-1 pointer-events-none" />
                <div className="relative overflow-hidden rounded-2xl bg-white shadow-xl border border-espresso/10 aspect-[4/3] sm:aspect-[16/11]">
                  <img
                    src={deptInfo.image}
                    alt={`${deptInfo.brand} editorial presentation`}
                    className="h-full w-full object-cover transition-transform duration-700 hover:scale-105"
                    fetchPriority="high"
                  />
                  <div className="absolute bottom-4 left-4 right-4 rounded-xl bg-white/95 p-3.5 backdrop-blur-md border border-espresso/10 shadow-xs">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-linen">
                        {getDeptIcon(deptInfo.id)}
                      </div>
                      <div>
                        <p className="font-serif text-sm font-medium text-espresso">{deptInfo.brand}</p>
                        <p className="text-[10px] text-espresso-light">{deptInfo.tagline}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Curated Category Showcase (With Authentic Editorial Images) */}
      <section id="categories" className="py-20 lg:py-24 bg-[#F6F2E9]">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-4 border-b border-espresso/10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-terracotta">
                  Curated Edits
                </span>
                <h2 className="mt-2 font-serif text-3xl font-light text-espresso sm:text-4xl">
                  Explore by <span className="italic font-normal">Category</span>
                </h2>
              </div>
              <Link
                to={deptInfo.path}
                className="text-xs font-semibold uppercase tracking-wider text-espresso hover:text-terracotta inline-flex items-center gap-1 transition-colors"
              >
                <span>View all in {deptInfo.brand}</span>
                <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deptCategories.map((cat, idx) => (
              <Reveal key={cat.slug} delay={idx * 60}>
                <TiltCard maxTilt={2.5} className="h-full">
                  <Link
                    to={`/shop?department=${deptInfo.id}&category=${encodeURIComponent(cat.slug)}`}
                    className="group block h-full rounded-2xl border border-espresso/10 bg-white p-5 transition-all duration-300 hover:border-espresso/30 hover:shadow-lg"
                  >
                    {cat.image && (
                      <div className="aspect-[16/10] rounded-xl overflow-hidden bg-linen mb-4 border border-espresso/8">
                        <img
                          src={cat.image}
                          alt={cat.label}
                          className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                    )}

                    <span className="text-[10px] font-semibold uppercase tracking-widest text-espresso-light">
                      {deptInfo.brand} &middot; 0{idx + 1}
                    </span>
                    <h3 className="mt-1 font-serif text-xl font-medium text-espresso group-hover:text-forest transition-colors">
                      {cat.label}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-espresso-soft line-clamp-2">
                      {cat.introduction}
                    </p>

                    <div className="mt-4 pt-3 border-t border-espresso/8 flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-espresso/70 group-hover:text-espresso transition-colors">
                      <span>Explore Edit</span>
                      <ArrowRight size={13} className="transition-transform group-hover:translate-x-1" />
                    </div>
                  </Link>
                </TiltCard>
              </Reveal>
            ))}
          </div>

          {/* Children's Age Navigation if Little Loom */}
          {deptInfo.id === 'kids' && (
            <div className="mt-20 pt-16 border-t border-espresso/10">
              <Reveal>
                <div className="mb-8">
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-terracotta">
                    Fit & Development
                  </span>
                  <h3 className="mt-1 font-serif text-3xl font-light text-espresso">
                    Shop by Age Milestone
                  </h3>
                </div>
              </Reveal>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4 lg:gap-6">
                {ageNavigation.map((age, i) => (
                  <Reveal key={age.key} delay={i * 80}>
                    <Link
                      to={`/shop?department=kids&age=${encodeURIComponent(age.key)}`}
                      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl border border-espresso/10 shadow-xs"
                    >
                      <img
                        src={age.image}
                        alt={age.label}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-espresso/80 via-espresso/25 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-5 text-ivory">
                        <p className="text-[10px] text-ivory/80 uppercase tracking-widest font-medium">
                          {age.range}
                        </p>
                        <h4 className="font-serif text-xl font-medium mt-0.5">{age.label}</h4>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3. Featured Department Products Showcase */}
      <section className="py-20 lg:py-28 bg-[#EDE7DE] border-t border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-12 pb-4 border-b border-espresso/10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.24em] text-terracotta">
                  Catalogue
                </span>
                <h2 className="mt-2 font-serif text-3xl font-light text-espresso sm:text-4xl">
                  {deptInfo.brand} <span className="italic font-normal">Edits</span>
                </h2>
              </div>
              <Link to={deptInfo.path}>
                <Button variant="outline" size="md">
                  View All ({deptProducts.length} Pieces)
                </Button>
              </Link>
            </div>
          </Reveal>

          {catalogLoading ? (
            <div className="py-20 text-center text-sm text-espresso-light">
              Loading {deptInfo.brand} collection…
            </div>
          ) : deptProducts.length === 0 ? (
            <div className="rounded-3xl border border-espresso/10 bg-white p-12 text-center max-w-xl mx-auto shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-linen mb-4 text-espresso">
                {getDeptIcon(deptInfo.id)}
              </div>
              <span className="text-[10px] font-semibold uppercase tracking-[0.28em] text-terracotta">A new collection is on its way</span>
              <h3 className="mt-2 font-serif text-2xl font-light text-espresso">
                {deptInfo.brand} · Coming Soon
              </h3>
              <p className="mt-3 text-sm text-espresso-soft leading-relaxed max-w-md mx-auto">
                We are preparing the first pieces for this department. The catalogue will appear here automatically once products are approved and published.
              </p>
              <div className="mt-6 flex justify-center">
                <Link to="/shop">
                  <Button variant="outline" size="md">Explore All Departments</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4">
              {deptProducts.map((product, idx) => (
                <Reveal key={product.id} delay={idx * 50}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* 4. Verified Service Strip */}
      <section className="py-12 bg-white border-t border-espresso/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left">
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <Truck size={20} className="text-forest shrink-0" />
              <div>
                <h4 className="font-serif text-sm font-medium text-espresso">Complimentary Shipping</h4>
                <p className="text-[11px] text-espresso-soft">Insured Pan-India delivery on orders above ₹1,999</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <ShieldCheck size={20} className="text-forest shrink-0" />
              <div>
                <h4 className="font-serif text-sm font-medium text-espresso">Guaranteed Purity</h4>
                <p className="text-[11px] text-espresso-soft">100% verified authentic materials & high-micron plating</p>
              </div>
            </div>
            <div className="flex items-center gap-3.5 justify-center sm:justify-start">
              <Sparkles size={20} className="text-forest shrink-0" />
              <div>
                <h4 className="font-serif text-sm font-medium text-espresso">Master Craftsmanship</h4>
                <p className="text-[11px] text-espresso-soft">Handcrafted with care across specialized ateliers</p>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
