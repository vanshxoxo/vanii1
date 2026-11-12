import React, { useState, useMemo } from 'react';
import {
  Boxes,
  Search,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface StockManagerProps {
  products: any[];
  onRefresh: () => Promise<void>;
  onSelectProduct: (productId: string) => void;
}

export default function StockManager({
  products,
  onRefresh,
  onSelectProduct,
}: StockManagerProps) {
  const [search, setSearch] = useState('');
  const [stockFilter, setStockFilter] = useState<'all' | 'low' | 'out'>('all');
  const [updatingVariantId, setUpdatingVariantId] = useState<string | null>(null);
  const [successNotice, setSuccessNotice] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  // Extract all variants with their parent product
  const allVariants = useMemo(() => {
    return products.flatMap((p) => {
      const vars = p.product_variants || [];
      return vars.map((v: any) => {
        const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
        const qty = inv ? Number(inv.quantity_on_hand) : 0;
        return {
          id: v.id,
          sku: v.sku,
          size: v.size,
          colour: v.colour,
          colour_hex: v.colour_hex,
          is_active: v.is_active,
          stock: qty,
          productId: p.id,
          productName: p.name,
          productSlug: p.slug,
          productStatus: p.status,
        };
      });
    });
  }, [products]);

  // Filtered variants
  const filteredVariants = useMemo(() => {
    return allVariants.filter((v) => {
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesSku = v.sku?.toLowerCase().includes(q);
        const matchesName = v.productName?.toLowerCase().includes(q);
        const matchesColor = v.colour?.toLowerCase().includes(q);
        const matchesSize = v.size?.toLowerCase().includes(q);
        if (!matchesSku && !matchesName && !matchesColor && !matchesSize) return false;
      }

      if (stockFilter === 'out' && v.stock > 0) return false;
      if (stockFilter === 'low' && (v.stock <= 0 || v.stock > 5)) return false;

      return true;
    });
  }, [allVariants, search, stockFilter]);

  const updateStock = async (variantId: string, newStock: number) => {
    if (!supabase) return;
    const qty = Math.max(0, newStock);
    setUpdatingVariantId(variantId);
    setSuccessNotice('');
    setErrorMessage('');
    try {
      const { error } = await supabase.rpc('set_variant_stock', {
        p_variant_id: variantId,
        p_quantity: qty,
      });
      if (error) throw error;
      setSuccessNotice(`Updated stock to ${qty}`);
      await onRefresh();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to update stock');
    } finally {
      setUpdatingVariantId(null);
    }
  };

  const totalOnHand = allVariants.reduce((sum, v) => sum + v.stock, 0);
  const outOfStockCount = allVariants.filter((v) => v.stock <= 0).length;
  const lowStockCount = allVariants.filter((v) => v.stock > 0 && v.stock <= 5).length;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* HEADER & SUMMARY */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Stock & Sizes</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Real-time physical inventory control across all garment variants and sizes
          </p>
        </div>
      </div>

      {/* METRIC PILLS */}
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
            Total Inventory On Hand
          </span>
          <div className="font-serif text-2xl font-bold text-ink mt-1">
            {totalOnHand} <span className="text-xs font-sans text-ink-muted">units</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">Across {allVariants.length} total SKUs</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <span className="text-[11px] font-semibold text-amber-800 uppercase tracking-wider">
            Low Stock Alerts (≤ 5)
          </span>
          <div className="font-serif text-2xl font-bold text-amber-700 mt-1">
            {lowStockCount} <span className="text-xs font-sans text-ink-muted">SKUs</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">Needs restocking soon</p>
        </div>

        <div className="p-4 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
          <span className="text-[11px] font-semibold text-rose-800 uppercase tracking-wider">
            Out of Stock (0)
          </span>
          <div className="font-serif text-2xl font-bold text-rose-700 mt-1">
            {outOfStockCount} <span className="text-xs font-sans text-ink-muted">SKUs</span>
          </div>
          <p className="text-[11px] text-ink-muted mt-0.5">Cannot be purchased online</p>
        </div>
      </div>

      {/* TOOLBAR */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-4 shadow-2xs flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="relative w-full sm:w-80">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-muted" />
          <input
            type="text"
            placeholder="Search by SKU, product name, colour, or size..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
          />
        </div>

        <div className="flex items-center gap-1.5 w-full sm:w-auto">
          {[
            { id: 'all', label: 'All Items' },
            { id: 'low', label: 'Low Stock (≤ 5)' },
            { id: 'out', label: 'Out of Stock (0)' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setStockFilter(tab.id as any)}
              className={`px-3 py-1.5 rounded-xl text-xs font-medium transition ${
                stockFilter === tab.id
                  ? 'bg-clay text-white font-semibold shadow-2xs'
                  : 'bg-[#FAF7F0] text-ink-soft hover:bg-[#F3EFE6]'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* NOTICES */}
      {successNotice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>{successNotice}</span>
        </div>
      )}
      {errorMessage && (
        <div className="p-3 bg-rose-50 border border-rose-200 text-rose-800 text-xs rounded-xl flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-rose-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      {/* VARIANTS INVENTORY TABLE */}
      {filteredVariants.length === 0 ? (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center text-xs text-ink-muted">
          <Boxes className="w-8 h-8 mx-auto text-ink-muted/40 mb-2" />
          <p className="font-medium text-ink">No matching variants found.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF7F0] border-b border-[#E8E2D9] text-ink-muted uppercase tracking-wider font-semibold">
                <tr>
                  <th className="py-3 px-4">Garment</th>
                  <th className="py-3 px-4">Colour & Swatch</th>
                  <th className="py-3 px-4">Size</th>
                  <th className="py-3 px-4">SKU</th>
                  <th className="py-3 px-4">Status</th>
                  <th className="py-3 px-4">Physical Stock</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E8E2D9]">
                {filteredVariants.map((v) => {
                  const isUpdating = updatingVariantId === v.id;
                  const isOut = v.stock <= 0;
                  const isLow = v.stock > 0 && v.stock <= 5;

                  return (
                    <tr key={v.id} className="hover:bg-[#FAF7F0]/60 transition">
                      <td className="py-3 px-4">
                        <button
                          onClick={() => onSelectProduct(v.productId)}
                          className="text-left font-serif font-bold text-ink hover:text-clay hover:underline block leading-tight"
                        >
                          {v.productName}
                        </button>
                        <span className="text-[10px] uppercase tracking-wider text-ink-muted">
                          {v.productStatus}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                            style={{ backgroundColor: v.colour_hex || '#FAF7F0' }}
                          />
                          <span className="font-medium text-ink">{v.colour}</span>
                        </div>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-semibold text-ink">
                        {v.size}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap font-mono text-ink-muted">
                        {v.sku}
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            isOut
                              ? 'bg-rose-100 text-rose-800'
                              : isLow
                              ? 'bg-amber-100 text-amber-800'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {isOut ? 'Out of Stock' : isLow ? 'Low Stock' : 'In Stock'}
                        </span>
                      </td>

                      <td className="py-3 px-4 whitespace-nowrap">
                        <div className="flex items-center gap-2">
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStock(v.id, v.stock - 5)}
                            className="px-2 py-1 rounded bg-[#FAF7F0] hover:bg-[#F3EFE6] border border-[#E8E2D9] font-bold text-ink"
                            title="Decrease by 5"
                          >
                            -5
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStock(v.id, v.stock - 1)}
                            className="px-2 py-1 rounded bg-[#FAF7F0] hover:bg-[#F3EFE6] border border-[#E8E2D9] font-bold text-ink"
                            title="Decrease by 1"
                          >
                            -1
                          </button>

                          <input
                            type="number"
                            min="0"
                            value={v.stock}
                            disabled={isUpdating}
                            onChange={(e) => {
                              const val = parseInt(e.target.value, 10);
                              if (!isNaN(val)) updateStock(v.id, val);
                            }}
                            className={`w-16 px-2 py-1 text-center font-bold rounded-lg border focus:outline-none focus:border-clay ${
                              isOut
                                ? 'bg-rose-50 text-rose-900 border-rose-200'
                                : 'bg-[#FAF7F0] text-ink border-[#E8E2D9]'
                            }`}
                          />

                          <button
                            disabled={isUpdating}
                            onClick={() => updateStock(v.id, v.stock + 1)}
                            className="px-2 py-1 rounded bg-[#FAF7F0] hover:bg-[#F3EFE6] border border-[#E8E2D9] font-bold text-ink"
                            title="Increase by 1"
                          >
                            +1
                          </button>
                          <button
                            disabled={isUpdating}
                            onClick={() => updateStock(v.id, v.stock + 5)}
                            className="px-2 py-1 rounded bg-[#FAF7F0] hover:bg-[#F3EFE6] border border-[#E8E2D9] font-bold text-ink"
                            title="Increase by 5"
                          >
                            +5
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
      )}
    </div>
  );
}
