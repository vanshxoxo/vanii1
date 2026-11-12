import {
  PlusCircle,
  Images,
  ShoppingBag,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Home,
  Circle,
} from 'lucide-react';
import { formatINR } from '../../data';
import type { AdminSectionId } from './adminNav';

interface DashboardOverviewProps {
  dashboard?: any;
  products: any[];
  orders: any[];
  media: any[];
  categories: any[];
  onNavigate: (section: AdminSectionId) => void;
  onNewProduct: () => void;
}

export default function DashboardOverview({
  products,
  orders,
  media,
  categories,
  onNavigate,
  onNewProduct,
}: DashboardOverviewProps) {
  // Compute real store stats
  const totalProducts = products.length;
  const publishedProducts = products.filter((p) => p.status === 'published').length;
  const draftProducts = products.filter((p) => p.status === 'draft').length;
  const reviewProducts = products.filter((p) => p.status === 'needs_review' || p.tags?.includes('owner-review-required')).length;

  const allVariants = products.flatMap((p) => p.product_variants || []);
  const totalVariants = allVariants.length;
  const variantsWithStock = allVariants.filter((v) => {
    const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
    return inv && Number(inv.quantity_on_hand) > 0;
  }).length;
  const outOfStockVariants = allVariants.filter((v) => {
    const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
    return !inv || Number(inv.quantity_on_hand) <= 0;
  }).length;

  const totalMediaAssets = media.length;
  const productPhotosCount = media.filter((m) => m.purpose === 'product').length;

  // Calculate Onboarding Checklist Steps
  const checklist = [
    {
      id: 'step-1',
      title: '1. Add your first product details',
      description: 'Create a product draft with a gentle name, fabric description, and care details.',
      isComplete: totalProducts > 0,
      action: () => onNewProduct(),
      actionLabel: totalProducts > 0 ? 'Add another' : 'Add first product',
    },
    {
      id: 'step-2',
      title: '2. Upload beautiful product photos',
      description: 'Upload high-resolution editorial photos through ImageKit to showcase the garment.',
      isComplete: productPhotosCount > 0,
      action: () => onNavigate('media'),
      actionLabel: productPhotosCount > 0 ? 'View photos' : 'Upload photos',
    },
    {
      id: 'step-3',
      title: '3. Add sizes and colours',
      description: 'Generate baby and toddler size combinations with signature hues like Ivory and Sage.',
      isComplete: totalVariants > 0,
      action: () => onNavigate('products'),
      actionLabel: totalVariants > 0 ? 'Review sizes' : 'Configure sizes',
    },
    {
      id: 'step-4',
      title: '4. Enter prices and physical stock',
      description: 'Assign fair prices and verified inventory counts on hand to prevent overselling.',
      isComplete: variantsWithStock > 0,
      action: () => onNavigate('stock'),
      actionLabel: variantsWithStock > 0 ? 'Manage stock' : 'Enter stock',
    },
    {
      id: 'step-5',
      title: '5. Review and publish to storefront',
      description: 'Run through quality checks and turn your first creation live for customer orders.',
      isComplete: publishedProducts > 0,
      action: () => onNavigate('products'),
      actionLabel: publishedProducts > 0 ? 'View live items' : 'Publish product',
    },
  ];

  const completedSteps = checklist.filter((item) => item.isComplete).length;
  const progressPercent = Math.round((completedSteps / checklist.length) * 100);
  const isFullySetup = publishedProducts > 0 && completedSteps === 5;

  // Real Sales & Orders Metrics
  const grossSales = orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
  const pendingOrders = orders.filter((o) => o.status === 'placed' || o.status === 'confirmed').length;

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 1. BEGINNER ONBOARDING CHECKLIST ("Let's get Little Loom ready for customers") */}
      {!isFullySetup && (
        <section className="bg-white rounded-2xl border border-[#E8E2D9] p-6 lg:p-8 shadow-xs relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-gradient-to-br from-cream/60 via-clay/10 to-transparent rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-6 border-b border-[#E8E2D9]">
              <div>
                <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cream text-clay text-xs font-semibold tracking-wide uppercase mb-2">
                  <Sparkles className="w-3.5 h-3.5" />
                  Store Setup Guide
                </div>
                <h2 className="font-serif text-2xl lg:text-3xl font-bold text-ink tracking-tight">
                  Let's get Little Loom ready for customers.
                </h2>
                <p className="text-sm text-ink-muted mt-1 max-w-2xl">
                  Follow these 5 simple steps to launch your first handcrafted collection. We will verify every detail so your store looks effortlessly thoughtful.
                </p>
              </div>

              {/* Progress Ring / Bar */}
              <div className="sm:text-right shrink-0">
                <div className="text-2xl font-serif font-bold text-clay">
                  {progressPercent}%
                </div>
                <p className="text-xs text-ink-muted">
                  {completedSteps} of {checklist.length} completed
                </p>
              </div>
            </div>

            {/* Visual Progress Bar */}
            <div className="w-full bg-[#FAF7F0] h-2 rounded-full overflow-hidden my-6 border border-[#E8E2D9]">
              <div
                className="h-full bg-gradient-to-r from-clay to-[#a65b46] transition-all duration-500 rounded-full"
                style={{ width: `${progressPercent}%` }}
              />
            </div>

            {/* Checklist Items */}
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5 pt-2">
              {checklist.map((step, idx) => (
                <div
                  key={step.id}
                  className={`p-4 rounded-xl border transition-all flex flex-col justify-between ${
                    step.isComplete
                      ? 'bg-emerald-50/40 border-emerald-200/80'
                      : 'bg-[#FAF7F0] border-[#E8E2D9] hover:border-clay/50'
                  }`}
                >
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-[11px] font-bold text-ink-muted">STEP 0{idx + 1}</span>
                      {step.isComplete ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      ) : (
                        <Circle className="w-4 h-4 text-ink-muted/50" />
                      )}
                    </div>
                    <h3 className="font-semibold text-xs text-ink leading-snug">
                      {step.title.replace(/^\d+\.\s*/, '')}
                    </h3>
                    <p className="text-[11px] text-ink-muted line-clamp-2 leading-relaxed">
                      {step.description}
                    </p>
                  </div>

                  <button
                    onClick={step.action}
                    className={`mt-4 w-full py-1.5 px-2.5 rounded-lg text-xs font-semibold flex items-center justify-center gap-1 transition ${
                      step.isComplete
                        ? 'bg-emerald-100/70 hover:bg-emerald-200/70 text-emerald-800'
                        : 'bg-white hover:bg-clay hover:text-white text-ink border border-[#E8E2D9] shadow-2xs'
                    }`}
                  >
                    <span>{step.actionLabel}</span>
                    <ArrowRight className="w-3 h-3" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 2. PROMINENT QUICK ACTIONS */}
      <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <button
          onClick={onNewProduct}
          className="p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-clay hover:shadow-md transition text-left group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-cream text-clay flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
              <PlusCircle className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink">Add a Product</h3>
            <p className="text-xs text-ink-muted mt-0.5">Guided 5-step clothing creator</p>
          </div>
          <ArrowRight className="w-4 h-4 text-clay opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => onNavigate('media')}
          className="p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-clay hover:shadow-md transition text-left group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#EAF2F8] text-[#2B6CB0] flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
              <Images className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink">Photos & Uploads</h3>
            <p className="text-xs text-ink-muted mt-0.5">Manage ImageKit media assets</p>
          </div>
          <ArrowRight className="w-4 h-4 text-clay opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => onNavigate('orders')}
          className="p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-clay hover:shadow-md transition text-left group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#E8F5E9] text-[#2E7D32] flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink">Manage Orders</h3>
            <p className="text-xs text-ink-muted mt-0.5">
              {pendingOrders > 0 ? `${pendingOrders} order(s) to fulfill` : 'Check customer purchases'}
            </p>
          </div>
          <ArrowRight className="w-4 h-4 text-clay opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>

        <button
          onClick={() => onNavigate('homepage')}
          className="p-5 rounded-2xl bg-white border border-[#E8E2D9] hover:border-clay hover:shadow-md transition text-left group flex items-start justify-between"
        >
          <div>
            <div className="w-10 h-10 rounded-xl bg-[#FFF3E0] text-[#E65100] flex items-center justify-center group-hover:scale-105 transition-transform mb-3">
              <Home className="w-5 h-5" />
            </div>
            <h3 className="font-serif font-bold text-base text-ink">Edit Homepage</h3>
            <p className="text-xs text-ink-muted mt-0.5">Update hero & featured stories</p>
          </div>
          <ArrowRight className="w-4 h-4 text-clay opacity-0 group-hover:opacity-100 transition-opacity" />
        </button>
      </section>

      {/* 3. REAL STORE PERFORMANCE METRICS */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="font-serif text-lg font-bold text-ink">Store Overview</h2>
          <span className="text-xs text-ink-muted">Live database telemetry</span>
        </div>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Gross Sales</span>
            <div className="font-serif text-2xl font-bold text-ink mt-2">
              {formatINR(grossSales)}
            </div>
            <p className="text-xs text-ink-muted mt-1">
              From {orders.length} total customer orders
            </p>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Product Catalog</span>
            <div className="font-serif text-2xl font-bold text-ink mt-2">
              {publishedProducts}{' '}
              <span className="text-sm font-sans font-normal text-ink-muted">/ {totalProducts} total</span>
            </div>
            <div className="flex items-center gap-2 text-xs text-ink-muted mt-1">
              <span className="text-emerald-700 font-medium">{publishedProducts} live</span>
              <span>•</span>
              <span className="text-amber-700 font-medium">{draftProducts} draft</span>
              {reviewProducts > 0 && (
                <>
                  <span>•</span>
                  <span className="text-clay font-medium">{reviewProducts} review</span>
                </>
              )}
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Stock & Variants</span>
            <div className="font-serif text-2xl font-bold text-ink mt-2">
              {totalVariants}{' '}
              <span className="text-sm font-sans font-normal text-ink-muted">combinations</span>
            </div>
            <div className="flex items-center gap-2 text-xs mt-1">
              <span className="text-emerald-700 font-medium">{variantsWithStock} ready</span>
              <span>•</span>
              <span className={outOfStockVariants > 0 ? 'text-rose-600 font-bold' : 'text-ink-muted'}>
                {outOfStockVariants} out of stock
              </span>
            </div>
          </div>

          <div className="p-5 rounded-2xl bg-white border border-[#E8E2D9] shadow-2xs">
            <span className="text-xs font-semibold text-ink-muted uppercase tracking-wider">Media Library</span>
            <div className="font-serif text-2xl font-bold text-ink mt-2">
              {totalMediaAssets}{' '}
              <span className="text-sm font-sans font-normal text-ink-muted">assets</span>
            </div>
            <p className="text-xs text-ink-muted mt-1">
              {productPhotosCount} verified product photos on ImageKit
            </p>
          </div>
        </div>
      </section>

      {/* 4. RECENT ORDERS & CATALOG BREAKDOWN */}
      <div className="grid gap-6 lg:grid-cols-3">
        {/* Recent Orders */}
        <section className="lg:col-span-2 bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs">
          <div className="flex items-center justify-between pb-4 border-b border-[#E8E2D9]">
            <div>
              <h3 className="font-serif text-base font-bold text-ink">Recent Orders</h3>
              <p className="text-xs text-ink-muted">Latest customer purchases</p>
            </div>
            <button
              onClick={() => onNavigate('orders')}
              className="text-xs font-semibold text-clay hover:underline flex items-center gap-1"
            >
              <span>View all</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          {orders.length === 0 ? (
            <div className="py-12 text-center text-ink-muted">
              <ShoppingBag className="w-8 h-8 mx-auto text-ink-muted/50 mb-2" />
              <p className="text-sm font-medium">No customer orders placed yet.</p>
              <p className="text-xs mt-1">Orders will appear here as soon as customers checkout.</p>
            </div>
          ) : (
            <div className="divide-y divide-[#E8E2D9]/70 overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="text-ink-muted uppercase tracking-wider">
                    <th className="py-3 px-2 font-semibold">Order</th>
                    <th className="py-3 px-2 font-semibold">Items</th>
                    <th className="py-3 px-2 font-semibold">Total</th>
                    <th className="py-3 px-2 font-semibold">Status</th>
                    <th className="py-3 px-2 font-semibold">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]/50">
                  {orders.slice(0, 5).map((order) => (
                    <tr key={order.id} className="hover:bg-[#FAF7F0] transition">
                      <td className="py-3 px-2 font-mono font-medium text-ink">
                        #{order.order_number}
                      </td>
                      <td className="py-3 px-2 text-ink-soft">
                        {order.order_items?.length || 0} items
                      </td>
                      <td className="py-3 px-2 font-semibold text-ink">
                        {formatINR(Number(order.total) || 0)}
                      </td>
                      <td className="py-3 px-2">
                        <span
                          className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-semibold uppercase tracking-wider ${
                            order.status === 'delivered'
                              ? 'bg-emerald-100 text-emerald-800'
                              : order.status === 'cancelled'
                              ? 'bg-rose-100 text-rose-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {order.status}
                        </span>
                      </td>
                      <td className="py-3 px-2 text-ink-muted">
                        {new Date(order.placed_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        {/* Categories & Collections Summary */}
        <section className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
            <div>
              <h3 className="font-serif text-base font-bold text-ink">Store Structure</h3>
              <p className="text-xs text-ink-muted">Categories & Taxonomy</p>
            </div>
            <button
              onClick={() => onNavigate('categories')}
              className="text-xs font-semibold text-clay hover:underline"
            >
              Edit
            </button>
          </div>

          <div className="space-y-3">
            <div>
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Garment Types ({categories.filter((c) => c.kind === 'product').length})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {categories
                  .filter((c) => c.kind === 'product')
                  .slice(0, 8)
                  .map((cat) => (
                    <span
                      key={cat.id}
                      className="px-2.5 py-1 rounded-lg text-xs bg-[#FAF7F0] border border-[#E8E2D9] text-ink"
                    >
                      {cat.name}
                    </span>
                  ))}
              </div>
            </div>

            <div className="pt-2">
              <span className="text-[11px] font-semibold text-ink-muted uppercase tracking-wider">
                Age Groups ({categories.filter((c) => c.kind === 'age').length})
              </span>
              <div className="flex flex-wrap gap-1.5 mt-2">
                {categories
                  .filter((c) => c.kind === 'age')
                  .map((cat) => (
                    <span
                      key={cat.id}
                      className="px-2.5 py-1 rounded-lg text-xs bg-cream/60 border border-cream text-ink font-medium"
                    >
                      {cat.name}
                    </span>
                  ))}
              </div>
            </div>

            <div className="pt-4 border-t border-[#E8E2D9]">
              <div className="p-3 bg-[#FAF7F0] rounded-xl flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-ink">Need to update banners?</p>
                  <p className="text-[11px] text-ink-muted">Edit hero imagery & lookbook</p>
                </div>
                <button
                  onClick={() => onNavigate('homepage')}
                  className="px-2.5 py-1 rounded-lg bg-clay text-white text-xs font-semibold hover:bg-clay/90 transition shadow-2xs"
                >
                  Configure
                </button>
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
