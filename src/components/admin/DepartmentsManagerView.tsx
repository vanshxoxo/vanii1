import React from 'react';
import { PlusCircle, ExternalLink, CheckCircle2, Clock } from 'lucide-react';
import type { Department } from '../../types';

interface DepartmentsManagerViewProps {
  products: any[];
  categories: any[];
  onNavigateToNewProduct: (dept: Department) => void;
  onFilterProductsByDept: (dept: Department) => void;
}

const DEPARTMENTS: {
  id: Department;
  name: string;
  brand: string;
  icon: string;
  desc: string;
  path: string;
  accentClass: string;
}[] = [
  {
    id: 'jewellery',
    name: 'Fine Jewellery',
    brand: 'VJ Jewellery',
    icon: '💎',
    desc: 'Necklace sets, kundan & polki, jhumkas, statement earrings & rings with precious finishes',
    path: '/department/jewellery',
    accentClass: 'bg-amber-50 text-amber-900 border-amber-200',
  },
  {
    id: 'women_suits',
    name: "Women's Suits & Fabrics",
    brand: 'VJ Suits & Fabrics',
    icon: '👗',
    desc: "Unstitched suit fabrics in pure cotton, Varanasi silk, Chanderi, organza, Banarasi zari, rayon & wool",
    path: '/department/women_suits',
    accentClass: 'bg-rose-50 text-rose-900 border-rose-200',
  },
  {
    id: 'home_textiles',
    name: 'Home Bedding & Textiles',
    brand: 'VJ Living',
    icon: '🛏️',
    desc: 'Premium cotton double & single bedsheet sets, folded cotton chaddars, and decorative pillow covers',
    path: '/department/home_textiles',
    accentClass: 'bg-sky-50 text-sky-900 border-sky-200',
  },
  {
    id: 'kids',
    name: "Children's Handcrafted Clothing",
    brand: 'Little Loom',
    icon: '🧸',
    desc: 'Cotton rompers, co-ord sets, dresses, tees, bottoms & organic sleepwear for ages 0–6',
    path: '/department/kids',
    accentClass: 'bg-orange-50 text-orange-900 border-orange-200',
  },
];

export default function DepartmentsManagerView({
  products,
  categories,
  onNavigateToNewProduct,
  onFilterProductsByDept,
}: DepartmentsManagerViewProps) {
  return (
    <div className="space-y-6 max-w-6xl animate-fade-in">
      {/* HEADER */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9]">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Department Management</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Monitor catalogue density, Coming Soon triggers, and category assignments across all four storefront branches
          </p>
        </div>
      </div>

      {/* DEPARTMENT CARDS GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        {DEPARTMENTS.map((dept) => {
          const deptProducts = products.filter((p) => (p.product_type || 'kids') === dept.id);
          const published = deptProducts.filter((p) => p.status === 'published');
          const drafts = deptProducts.filter((p) => p.status === 'draft');
          const isComingSoon = published.length === 0;

          const deptCategories = categories.filter((c) => {
            if (c.kind !== 'product') return false;
            if (dept.id === 'kids') return !c.department || c.department === 'kids';
            return c.department === dept.id;
          });

          return (
            <div
              key={dept.id}
              className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs flex flex-col justify-between space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <span className="text-3xl">{dept.icon}</span>
                    <div>
                      <span className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded-full border ${dept.accentClass}`}>
                        {dept.brand}
                      </span>
                      <h3 className="font-serif text-xl font-bold text-ink mt-1">{dept.name}</h3>
                    </div>
                  </div>

                  <span
                    className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold border ${
                      isComingSoon
                        ? 'bg-amber-50 text-amber-900 border-amber-200'
                        : 'bg-emerald-50 text-emerald-900 border-emerald-200'
                    }`}
                  >
                    {isComingSoon ? (
                      <>
                        <Clock className="w-3.5 h-3.5 text-amber-700" /> Coming Soon
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-700" /> Active Catalogue
                      </>
                    )}
                  </span>
                </div>

                <p className="text-xs text-ink-muted leading-relaxed">{dept.desc}</p>

                {/* METRICS ROW */}
                <div className="grid grid-cols-3 gap-2 p-3 bg-[#FAF7F0] rounded-2xl border border-[#E8E2D9] text-center text-xs">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-muted block">Total Items</span>
                    <span className="font-serif text-lg font-bold text-ink">{deptProducts.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-emerald-700 block">Published</span>
                    <span className="font-serif text-lg font-bold text-emerald-700">{published.length}</span>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-ink-muted block">Drafts</span>
                    <span className="font-serif text-lg font-bold text-ink">{drafts.length}</span>
                  </div>
                </div>

                {/* CATEGORIES CHIPS */}
                <div className="space-y-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted block">
                    Assigned Categories ({deptCategories.length})
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {deptCategories.map((cat) => (
                      <span
                        key={cat.id}
                        className="px-2.5 py-1 rounded-lg bg-white border border-[#E8E2D9] text-[11px] font-medium text-ink"
                      >
                        {cat.name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* ACTION BUTTONS */}
              <div className="flex items-center justify-between gap-3 pt-3 border-t border-[#E8E2D9]">
                <button
                  type="button"
                  onClick={() => onNavigateToNewProduct(dept.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
                >
                  <PlusCircle className="w-3.5 h-3.5" />
                  <span>Add Product</span>
                </button>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => onFilterProductsByDept(dept.id)}
                    className="px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-xs font-semibold text-ink hover:border-clay transition"
                  >
                    View in Catalog
                  </button>
                  <a
                    href={dept.path}
                    target="_blank"
                    rel="noreferrer"
                    className="p-2 rounded-xl border border-[#E8E2D9] text-ink-muted hover:text-ink hover:border-ink transition"
                    title="Open Storefront Page"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
