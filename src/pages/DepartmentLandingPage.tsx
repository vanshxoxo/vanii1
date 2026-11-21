import { useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowRight, Sparkles, ShieldCheck, Truck, Gem, Shirt, Home, Baby, CheckCircle2 } from 'lucide-react';
import { useCatalog } from '../lib/catalog';
import type { Department } from '../types';
import ProductCard from '../components/ProductCard';
import Breadcrumbs from '../components/ui';
import Button from '../components/Button';
import Reveal from '../components/Reveal';
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
        return <Gem size={28} className="text-[#C5A059]" />;
      case 'women_suits':
        return <Shirt size={28} className="text-[#B25E46]" />;
      case 'home_textiles':
        return <Home size={28} className="text-[#3E5C76]" />;
      case 'kids':
        return <Baby size={28} className="text-[#C9826B]" />;
    }
  };

  return (
    <div className="min-h-screen">
      {/* Editorial Hero Banner */}
      <section
        className="relative overflow-hidden border-b border-charcoal/10"
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

          <div className="mt-8 grid items-center gap-8 lg:grid-cols-12 lg:gap-12">
            <div className="lg:col-span-7">
              <span
                className="inline-flex items-center gap-2 rounded-full px-3.5 py-1 text-xs font-semibold uppercase tracking-[0.22em]"
                style={{
                  backgroundColor: 'white',
                  color: deptInfo.accentText,
                  border: `1px solid ${deptInfo.accentBorder}`,
                }}
              >
                <Sparkles size={13} />
                VJ Collection · {deptInfo.brand}
              </span>

              <h1 className="mt-5 font-serif text-4xl font-light leading-[1.08] text-charcoal sm:text-5xl lg:text-6xl text-balance whitespace-pre-line">
                {deptInfo.heroHeading}
              </h1>

              <p className="mt-5 max-w-xl text-base leading-relaxed text-charcoal-soft lg:text-lg">
                {deptInfo.heroSubheading}
              </p>

              <div className="mt-8 flex flex-wrap gap-3">
                <Link to={deptInfo.path}>
                  <Button variant="primary" size="lg" className="group">
                    Shop Full {deptInfo.brand}
                    <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <a href="#categories">
                  <Button variant="outline" size="lg">
                    Browse Categories
                  </Button>
                </a>
              </div>
            </div>

            {/* Department Feature Graphic / Highlights Card */}
            <div className="lg:col-span-5">
              <div
                className="rounded-3xl p-6 sm:p-8 shadow-sm backdrop-blur-sm"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.85)',
                  border: `1px solid ${deptInfo.accentBorder}`,
                }}
              >
                <div className="flex items-center gap-3 pb-5 border-b border-charcoal/10">
                  <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white shadow-xs">
                    {getDeptIcon(deptInfo.id)}
                  </div>
                  <div>
                    <h2 className="font-serif text-lg font-medium text-charcoal">{deptInfo.brand} Standards</h2>
                    <p className="text-xs text-charcoal-light">Master Craftsmanship & Purity Guarantee</p>
                  </div>
                </div>

                <div className="mt-5 space-y-4">
                  {deptInfo.highlights.map((h, i) => (
                    <div key={i} className="flex gap-3">
                      <CheckCircle2 size={18} className="shrink-0 mt-0.5 text-charcoal" />
                      <div>
                        <h3 className="text-xs font-semibold uppercase tracking-wider text-charcoal">{h.title}</h3>
                        <p className="text-xs text-charcoal-soft mt-0.5 leading-relaxed">{h.desc}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="mt-6 pt-5 border-t border-charcoal/10 flex items-center justify-between text-xs text-charcoal-soft">
                  <span className="flex items-center gap-1.5"><Truck size={14} /> Pan-India Insured Dispatch</span>
                  <span className="flex items-center gap-1.5"><ShieldCheck size={14} /> 100% Genuine</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Category Navigation Showcase */}
      <section id="categories" className="py-16 lg:py-20 bg-ivory">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-4 border-b border-charcoal/10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Curated Edits</span>
                <h2 className="mt-2 font-serif text-3xl font-light text-charcoal sm:text-4xl">
                  Explore by <span className="italic">Category</span>
                </h2>
              </div>
              <Link
                to={deptInfo.path}
                className="text-xs font-semibold uppercase tracking-wider text-charcoal hover:text-clay inline-flex items-center gap-1 transition-colors"
              >
                View all in {deptInfo.brand} <ArrowRight size={14} />
              </Link>
            </div>
          </Reveal>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {deptCategories.map((cat, idx) => (
              <Reveal key={cat.slug} delay={idx * 60}>
                <Link
                  to={`/shop?department=${deptInfo.id}&category=${encodeURIComponent(cat.slug)}`}
                  className="group relative flex flex-col justify-between overflow-hidden rounded-2xl border border-charcoal/10 bg-white p-7 transition-all duration-300 hover:-translate-y-1 hover:border-charcoal/30 hover:shadow-lg"
                >
                  <div>
                    <span className="text-[11px] font-semibold uppercase tracking-widest text-charcoal-light">
                      {deptInfo.brand} · 0{idx + 1}
                    </span>
                    <h3 className="mt-3 font-serif text-2xl font-light text-charcoal group-hover:text-clay transition-colors">
                      {cat.label}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-charcoal-soft">
                      {cat.introduction}
                    </p>
                  </div>

                  <div className="mt-6 pt-4 border-t border-charcoal/8 flex items-center justify-between text-xs font-medium text-charcoal group-hover:text-clay transition-colors">
                    <span>Browse Collection</span>
                    <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>

          {/* Children's Age Navigation if Little Loom */}
          {deptInfo.id === 'kids' && (
            <div className="mt-16">
              <Reveal>
                <div className="mb-6">
                  <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Fit & Age</span>
                  <h3 className="mt-1 font-serif text-2xl font-light text-charcoal">Shop by Age Milestone</h3>
                </div>
              </Reveal>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:gap-5">
                {ageNavigation.map((age, i) => (
                  <Reveal key={age.key} delay={i * 80}>
                    <Link
                      to={`/shop?department=kids&age=${encodeURIComponent(age.key)}`}
                      className="group relative block aspect-[3/4] overflow-hidden rounded-2xl"
                    >
                      <img
                        src={age.image}
                        alt={age.label}
                        className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-charcoal/80 via-charcoal/20 to-transparent" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 text-ivory">
                        <p className="text-[10px] text-ivory/70 uppercase tracking-widest">{age.range}</p>
                        <h4 className="font-serif text-lg font-medium">{age.label}</h4>
                      </div>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>
          )}
        </div>
      </section>

      {/* Featured Department Products Showcase */}
      <section className="py-16 lg:py-24 bg-[#FAF7F0] border-t border-charcoal/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <Reveal>
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
              <div>
                <span className="text-xs font-semibold uppercase tracking-[0.2em] text-clay">Curated Catalog</span>
                <h2 className="mt-2 font-serif text-3xl font-light text-charcoal sm:text-4xl">
                  {deptInfo.brand} <span className="italic">Collection</span>
                </h2>
              </div>
              <Link to={deptInfo.path}>
                <Button variant="outline" size="md">
                  View All Products ({deptProducts.length})
                </Button>
              </Link>
            </div>
          </Reveal>

          {catalogLoading ? (
            <div className="py-20 text-center text-sm text-charcoal-light">Loading collection…</div>
          ) : deptProducts.length === 0 ? (
            <div className="rounded-3xl border border-charcoal/10 bg-white p-12 text-center max-w-xl mx-auto shadow-xs">
              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-ivory mb-4">
                {getDeptIcon(deptInfo.id)}
              </div>
              <h3 className="font-serif text-2xl font-light text-charcoal">The Inaugural {deptInfo.brand} Edit</h3>
              <p className="mt-3 text-sm text-charcoal-soft leading-relaxed">
                Pieces for our {deptInfo.brand} department are currently being photographed and catalogued for publication. Check back shortly or browse other departments.
              </p>
              <div className="mt-6 flex flex-wrap gap-3 justify-center">
                <Link to="/shop">
                  <Button variant="outline" size="sm">Browse Full Catalogue</Button>
                </Link>
                <Link to="/admin">
                  <Button variant="primary" size="sm">Add Product in Admin</Button>
                </Link>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {deptProducts.slice(0, 8).map((product, i) => (
                <Reveal key={product.id} delay={i * 60}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Cross-Department Navigation Bar */}
      <section className="py-12 border-t border-charcoal/10 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <p className="text-center text-xs font-semibold uppercase tracking-[0.25em] text-charcoal-light mb-6">
            Discover Other Departments at VJ Collection
          </p>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {departments.map((dept) => {
              const isCurrent = dept.id === deptInfo.id;
              return (
                <Link
                  key={dept.id}
                  to={dept.landingPath}
                  className={`p-4 rounded-xl border transition-all text-center ${
                    isCurrent
                      ? 'border-charcoal bg-charcoal text-ivory pointer-events-none'
                      : 'border-charcoal/10 bg-ivory hover:border-charcoal/30 hover:bg-white text-charcoal'
                  }`}
                >
                  <p className="font-serif text-base">{dept.brand}</p>
                  <p className={`text-[11px] mt-0.5 ${isCurrent ? 'text-ivory/70' : 'text-charcoal-light'}`}>
                    {dept.tagline.split(',')[0]}
                  </p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>
    </div>
  );
}
