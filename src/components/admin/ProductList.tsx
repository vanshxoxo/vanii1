import React, { useState, useMemo } from 'react';
import {
  Package,
  PlusCircle,
  Search,
  Copy,
  Trash2,
  ExternalLink,
  Edit,
  CheckCircle2,
  LayoutGrid,
  List as ListIcon,
} from 'lucide-react';
import { formatINR } from '../../data';
import { publicMediaUrl } from '../../lib/supabase';

interface ProductListProps {
  products: any[];
  categories: any[];
  selectedProductId: string;
  onSelectProduct: (id: string) => Promise<void> | void;
  onNewProduct: () => void;
  onDuplicateProduct: (id: string) => Promise<void> | void;
  onDeleteProduct: (id: string) => Promise<void> | void;
  onQuickToggleStatus?: (status: 'draft' | 'archived') => Promise<void> | void;
}

export default function ProductList({
  products,
  categories,
  selectedProductId,
  onSelectProduct,
  onNewProduct,
  onDuplicateProduct,
  onDeleteProduct,
}: ProductListProps) {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'review' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'in_stock' | 'low_stock' | 'out_of_stock'>('all');
  const [viewMode, setViewMode] = useState<'table' | 'grid'>('table');
  const [isDuplicatingId, setIsDuplicatingId] = useState<string | null>(null);

  // Filtered Products
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Text Search (name, slug, tags, SKUs)
      if (search.trim()) {
        const query = search.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesSlug = p.slug?.toLowerCase().includes(query);
        const matchesTags = p.tags?.some((t: string) => t.toLowerCase().includes(query));
        const matchesSku = p.product_variants?.some((v: any) => v.sku?.toLowerCase().includes(query));
        if (!matchesName && !matchesSlug && !matchesTags && !matchesSku) return false;
      }

      // 2. Status Filter
      if (statusFilter === 'published' && p.status !== 'published') return false;
      if (statusFilter === 'draft' && p.status !== 'draft') return false;
      if (statusFilter === 'archived' && p.status !== 'archived') return false;
      if (statusFilter === 'review') {
        const needsReview =
          p.status === 'needs_review' ||
          p.tags?.includes('owner-review-required') ||
          p.tags?.includes('owner-intake');
        if (!needsReview) return false;
      }

      // 3. Category Filter
      if (categoryFilter) {
        const hasCategory = p.product_categories?.some(
          (pc: any) =>
            pc.categories?.id === categoryFilter ||
            pc.category_id === categoryFilter
        );
        if (!hasCategory) return false;
      }

      // 4. Stock Filter
      if (stockFilter !== 'all') {
        const variants = p.product_variants || [];
        const totalStock = variants.reduce((sum: number, v: any) => {
          const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
          return sum + (Number(inv?.quantity_on_hand) || 0);
        }, 0);

        if (stockFilter === 'out_of_stock' && totalStock > 0) return false;
        if (stockFilter === 'low_stock' && (totalStock <= 0 || totalStock > 10)) return false;
        if (stockFilter === 'in_stock' && totalStock <= 0) return false;
      }

      return true;
    });
  }, [products, search, statusFilter, categoryFilter, stockFilter]);

  const handleDuplicate = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    setIsDuplicatingId(id);
    try {
      await onDuplicateProduct(id);
    } finally {
      setIsDuplicatingId(null);
    }
  };

  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    await onDeleteProduct(id);
  };

  const getProductImage = (p: any) => {
    const mediaLinks = p.product_media || [];
    const primary = mediaLinks.find((l: any) => l.is_primary) || mediaLinks[0];
    if (primary) {
      const asset = Array.isArray(primary.media_assets) ? primary.media_assets[0] : primary.media_assets;
      if (asset) return publicMediaUrl(asset, 240);
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* TOP HEADER & ACTION */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">All Products</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage, publish, duplicate, and monitor inventory for your kidswear catalog
          </p>
        </div>
        <button
          onClick={onNewProduct}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs shrink-0"
        >
          <PlusCircle className="w-4 h-4" />
          <span>Add New Product</span>
        </button>
      </div>

      {/* FILTER & SEARCH TOOLBAR */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 shadow-2xs space-y-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Search Bar */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
            <input
              type="text"
              placeholder="Search by name, SKU, tag, or slug..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay focus:ring-1 focus:ring-clay/30"
            />
          </div>

          {/* View Toggle */}
          <div className="flex items-center gap-1 bg-[#FAF7F0] p-1 rounded-xl border border-[#E8E2D9] self-start md:self-auto shrink-0">
            <button
              onClick={() => setViewMode('table')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                viewMode === 'table' ? 'bg-white text-ink shadow-2xs' : 'text-ink-muted hover:text-ink'
              }`}
              title="Table view"
            >
              <ListIcon className="w-4 h-4" />
              <span className="hidden sm:inline">Table</span>
            </button>
            <button
              onClick={() => setViewMode('grid')}
              className={`p-1.5 rounded-lg text-xs font-medium flex items-center gap-1.5 transition ${
                viewMode === 'grid' ? 'bg-white text-ink shadow-2xs' : 'text-ink-muted hover:text-ink'
              }`}
              title="Grid view"
            >
              <LayoutGrid className="w-4 h-4" />
              <span className="hidden sm:inline">Cards</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-[#E8E2D9]/60">
          <div className="flex items-center gap-1 overflow-x-auto pb-1 max-w-full">
            {(
              [
                { id: 'all', label: 'All Items' },
                { id: 'published', label: 'Live' },
                { id: 'draft', label: 'Draft' },
                { id: 'review', label: 'Needs Review' },
                { id: 'archived', label: 'Archived' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                  statusFilter === tab.id
                    ? 'bg-ink text-white font-semibold'
                    : 'bg-[#FAF7F0] text-ink-muted hover:text-ink hover:bg-[#F3EFE6]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="h-4 w-[1px] bg-[#E8E2D9] hidden sm:block" />

          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-[#FAF7F0] border border-[#E8E2D9] text-ink focus:outline-none focus:border-clay"
          >
            <option value="">All Categories</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name} ({c.kind})
              </option>
            ))}
          </select>

          {/* Stock Dropdown */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value as any)}
            className="px-2.5 py-1.5 rounded-lg text-xs bg-[#FAF7F0] border border-[#E8E2D9] text-ink focus:outline-none focus:border-clay"
          >
            <option value="all">All Inventory</option>
            <option value="in_stock">In Stock</option>
            <option value="low_stock">Low Stock (≤ 10)</option>
            <option value="out_of_stock">Out of Stock</option>
          </select>

          <span className="ml-auto text-xs text-ink-muted">
            Showing <strong className="text-ink">{filteredProducts.length}</strong> of{' '}
            {products.length}
          </span>
        </div>
      </div>

      {/* PRODUCTS DISPLAY (TABLE OR GRID) */}
      {filteredProducts.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center space-y-3">
          <Package className="w-10 h-10 mx-auto text-ink-muted/40" />
          <h3 className="font-serif text-lg font-bold text-ink">No matching products found</h3>
          <p className="text-xs text-ink-muted max-w-sm mx-auto">
            Try adjusting your search criteria or filters, or add a brand new handcrafted garment.
          </p>
          <button
            onClick={onNewProduct}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Create New Product</span>
          </button>
        </div>
      ) : viewMode === 'table' ? (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#E8E2D9] text-ink-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Price</th>
                  <th className="py-3 px-4">Inventory & Variants</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredProducts.map((p) => {
                  const imgUrl = getProductImage(p);
                  const variants = p.product_variants || [];
                  const totalStock = variants.reduce((sum: number, v: any) => {
                    const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
                    return sum + (Number(inv?.quantity_on_hand) || 0);
                  }, 0);
                  const isSelected = selectedProductId === p.id;
                  const isDuplicating = isDuplicatingId === p.id;

                  return (
                    <tr
                      key={p.id}
                      onClick={() => onSelectProduct(p.id)}
                      className={`hover:bg-[#FAF7F0]/80 transition cursor-pointer ${
                        isSelected ? 'bg-cream/40' : ''
                      }`}
                    >
                      {/* Product Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-14 rounded-lg bg-[#FAF7F0] border border-[#E8E2D9] overflow-hidden flex items-center justify-center shrink-0">
                            {imgUrl ? (
                              <img
                                src={imgUrl}
                                alt={p.name}
                                className="w-full h-full object-cover object-center"
                              />
                            ) : (
                              <Package className="w-5 h-5 text-ink-muted/50" />
                            )}
                          </div>
                          <div>
                            <span className="font-serif font-bold text-sm text-ink block leading-tight">
                              {p.name}
                            </span>
                            <span className="text-[11px] font-mono text-ink-muted block mt-0.5">
                              /{p.slug}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span
                          className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider ${
                            p.status === 'published'
                              ? 'bg-emerald-100 text-emerald-800'
                              : p.status === 'archived'
                              ? 'bg-slate-100 text-slate-700'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {p.status === 'published' && <CheckCircle2 className="w-3 h-3" />}
                          {p.status}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-ink">
                          {p.price ? formatINR(Number(p.price)) : '—'}
                        </div>
                        {p.compare_at_price && Number(p.compare_at_price) > Number(p.price) && (
                          <div className="text-[11px] text-ink-muted line-through">
                            {formatINR(Number(p.compare_at_price))}
                          </div>
                        )}
                      </td>

                      {/* Stock & Variants */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span className="font-medium text-ink">
                            {variants.length} variant{variants.length === 1 ? '' : 's'}
                          </span>
                          <span>•</span>
                          <span
                            className={`font-semibold ${
                              totalStock <= 0
                                ? 'text-rose-600'
                                : totalStock <= 10
                                ? 'text-amber-600'
                                : 'text-emerald-700'
                            }`}
                          >
                            {totalStock <= 0 ? 'Out of stock' : `${totalStock} in stock`}
                          </span>
                        </div>
                      </td>

                      {/* Quick Action Buttons */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div
                          className="flex items-center justify-end gap-1.5"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => onSelectProduct(p.id)}
                            className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-[#FAF7F0] border border-transparent hover:border-[#E8E2D9] transition"
                            title="Edit product in wizard"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          <button
                            onClick={(e) => handleDuplicate(e, p.id)}
                            disabled={isDuplicating}
                            className="p-1.5 rounded-lg text-ink-soft hover:text-clay hover:bg-cream/40 border border-transparent hover:border-cream transition"
                            title="Duplicate product (zero initial stock)"
                          >
                            <Copy className={`w-3.5 h-3.5 ${isDuplicating ? 'animate-pulse' : ''}`} />
                          </button>

                          {p.status === 'published' && (
                            <a
                              href={`/product/${p.slug}`}
                              target="_blank"
                              rel="noreferrer"
                              className="p-1.5 rounded-lg text-ink-soft hover:text-ink hover:bg-[#FAF7F0] border border-transparent hover:border-[#E8E2D9] transition"
                              title="View on storefront"
                            >
                              <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                          )}

                          <button
                            onClick={(e) => handleDelete(e, p.id)}
                            className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition"
                            title="Delete draft (guarded against orders)"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* GRID CARDS VIEW */
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredProducts.map((p) => {
            const imgUrl = getProductImage(p);
            const variants = p.product_variants || [];
            const totalStock = variants.reduce((sum: number, v: any) => {
              const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
              return sum + (Number(inv?.quantity_on_hand) || 0);
            }, 0);
            const isSelected = selectedProductId === p.id;

            return (
              <div
                key={p.id}
                onClick={() => onSelectProduct(p.id)}
                className={`bg-white rounded-2xl border transition shadow-2xs hover:shadow-md cursor-pointer flex flex-col justify-between overflow-hidden ${
                  isSelected ? 'border-clay ring-1 ring-clay' : 'border-[#E8E2D9] hover:border-clay/60'
                }`}
              >
                <div>
                  <div className="relative aspect-[4/5] bg-[#FAF7F0] overflow-hidden">
                    {imgUrl ? (
                      <img
                        src={imgUrl}
                        alt={p.name}
                        className="w-full h-full object-cover object-center"
                      />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted/50">
                        <Package className="w-8 h-8 mb-1" />
                        <span className="text-[11px]">No photo</span>
                      </div>
                    )}

                    <div className="absolute top-2.5 left-2.5">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs ${
                          p.status === 'published'
                            ? 'bg-emerald-500/90 text-white'
                            : p.status === 'archived'
                            ? 'bg-slate-700/90 text-white'
                            : 'bg-amber-500/90 text-white'
                        }`}
                      >
                        {p.status}
                      </span>
                    </div>

                    <div className="absolute bottom-2.5 right-2.5">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold backdrop-blur-md shadow-xs ${
                          totalStock <= 0
                            ? 'bg-rose-500/90 text-white'
                            : 'bg-white/90 text-ink'
                        }`}
                      >
                        {totalStock <= 0 ? 'Out of stock' : `${totalStock} in stock`}
                      </span>
                    </div>
                  </div>

                  <div className="p-4 space-y-1">
                    <h3 className="font-serif font-bold text-sm text-ink truncate leading-tight">
                      {p.name}
                    </h3>
                    <div className="flex items-center justify-between text-xs pt-1">
                      <span className="font-semibold text-ink">
                        {p.price ? formatINR(Number(p.price)) : '—'}
                      </span>
                      <span className="text-[11px] text-ink-muted">
                        {variants.length} variant{variants.length === 1 ? '' : 's'}
                      </span>
                    </div>
                  </div>
                </div>

                <div
                  className="px-4 py-2.5 border-t border-[#E8E2D9] bg-[#FAF7F0] flex items-center justify-between"
                  onClick={(e) => e.stopPropagation()}
                >
                  <button
                    onClick={() => onSelectProduct(p.id)}
                    className="text-xs font-semibold text-clay hover:underline flex items-center gap-1"
                  >
                    <Edit className="w-3.5 h-3.5" />
                    <span>Edit</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={(e) => handleDuplicate(e, p.id)}
                      className="p-1 rounded text-ink-muted hover:text-clay"
                      title="Duplicate product"
                    >
                      <Copy className="w-3.5 h-3.5" />
                    </button>
                    <button
                      onClick={(e) => handleDelete(e, p.id)}
                      className="p-1 rounded text-ink-muted hover:text-rose-600"
                      title="Delete draft"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
