import React from 'react';
import {
  CheckCircle2,
  Circle,
  ArrowRight,
  Package,
  Images,
  Boxes,
  Truck,
  CreditCard,
  Store,
  Sparkles,
} from 'lucide-react';
import type { AdminSectionId } from './adminNav';

interface GettingStartedViewProps {
  products: any[];
  orders?: any[];
  settings: any;
  onNavigate: (section: AdminSectionId) => void;
}

export default function GettingStartedView({
  products,
  settings,
  onNavigate,
}: GettingStartedViewProps) {
  const publishedCount = products.filter((p) => p.status === 'published').length;
  const hasProducts = products.length > 0;
  const hasPublished = publishedCount > 0;
  const hasImages = products.some((p) => p.product_media && p.product_media.length > 0);
  const hasStock = products.some((p) => {
    return (p.product_variants || []).some((v: any) => {
      const inv = Array.isArray(v.inventory) ? v.inventory[0] : v.inventory;
      return Number(inv?.quantity_on_hand) > 0;
    });
  });

  const steps = [
    {
      id: 'step-1',
      title: 'Add your first collection piece',
      description: 'Create a piece for Jewellery, Suits & Fabrics, Living, or Little Loom.',
      done: hasProducts,
      actionLabel: hasProducts ? 'View Products' : 'Add Product',
      section: (hasProducts ? 'products' : 'add-product') as AdminSectionId,
      icon: Package,
    },
    {
      id: 'step-2',
      title: 'Upload high-resolution editorial imagery',
      description: 'Attach front, drape, detail, and lifestyle photos using ImageKit.',
      done: hasImages,
      actionLabel: 'Media Library',
      section: 'media' as AdminSectionId,
      icon: Images,
    },
    {
      id: 'step-3',
      title: 'Configure sizes, colours & inventory stock',
      description: 'Generate variant combinations and assign starting physical quantities.',
      done: hasStock,
      actionLabel: 'Manage Stock',
      section: 'stock' as AdminSectionId,
      icon: Boxes,
    },
    {
      id: 'step-4',
      title: 'Publish items to activate storefront departments',
      description: 'Ensure prices and descriptions are verified. Once published, Coming Soon automatically switches to active catalogue.',
      done: hasPublished,
      actionLabel: 'Catalog List',
      section: 'products' as AdminSectionId,
      icon: Store,
    },
    {
      id: 'step-5',
      title: 'Verify shipping and delivery rules',
      description: 'Set your free shipping threshold, standard delivery rate, and Shiprocket connection.',
      done: Boolean(settings?.free_shipping_threshold),
      actionLabel: 'Shipping Settings',
      section: 'shipping-settings' as AdminSectionId,
      icon: Truck,
    },
    {
      id: 'step-6',
      title: 'Verify Razorpay payments (Test/Live mode)',
      description: 'Check payment credentials, active webhook verification, and UPI/Cards checkout.',
      done: true,
      actionLabel: 'Payment Settings',
      section: 'payment-settings' as AdminSectionId,
      icon: CreditCard,
    },
  ];

  const completedSteps = steps.filter((s) => s.done).length;
  const progressPercent = Math.round((completedSteps / steps.length) * 100);

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* HEADER BANNER */}
      <div className="rounded-3xl bg-white border border-[#E8E2D9] p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-clay/10 text-clay text-[10px] font-bold uppercase tracking-wider mb-2">
              <Sparkles className="w-3 h-3" />
              <span>Owner Onboarding</span>
            </div>
            <h1 className="font-serif text-2xl sm:text-3xl font-bold text-ink">
              Welcome to VJ Collection Studio
            </h1>
            <p className="text-xs text-ink-muted mt-1 max-w-xl leading-relaxed">
              This interactive guide helps you set up, verify, and operate your luxury storefront across Jewellery, Suits & Fabrics, Living, and Little Loom without needing technical assistance.
            </p>
          </div>

          <div className="text-right sm:border-l sm:border-[#E8E2D9] sm:pl-6 shrink-0">
            <span className="text-2xl font-serif font-bold text-ink">{progressPercent}%</span>
            <span className="text-[11px] text-ink-muted block uppercase tracking-wider">Completed</span>
            <span className="text-xs font-semibold text-clay mt-0.5 block">
              {completedSteps} of {steps.length} Tasks Ready
            </span>
          </div>
        </div>

        {/* Progress Bar */}
        <div className="w-full bg-[#FAF7F0] border border-[#E8E2D9] h-2 rounded-full mt-6 overflow-hidden">
          <div
            className="bg-clay h-full transition-all duration-500 rounded-full"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
      </div>

      {/* CHECKLIST ITEMS */}
      <div className="space-y-3">
        {steps.map((step, idx) => {
          const Icon = step.icon;
          return (
            <div
              key={step.id}
              className={`rounded-2xl border p-5 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white ${
                step.done ? 'border-[#E8E2D9]' : 'border-clay/30 shadow-xs'
              }`}
            >
              <div className="flex items-start gap-4">
                <div className="mt-0.5">
                  {step.done ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-600 shrink-0" />
                  ) : (
                    <Circle className="w-5 h-5 text-ink-muted shrink-0" />
                  )}
                </div>

                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <Icon className="w-3.5 h-3.5 text-clay shrink-0" />
                    <span className="text-[10px] font-bold uppercase tracking-wider text-ink-muted">
                      Step {idx + 1}
                    </span>
                    <h3 className={`font-serif text-base font-bold ${step.done ? 'text-ink' : 'text-clay'}`}>
                      {step.title}
                    </h3>
                  </div>
                  <p className="text-xs text-ink-muted leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>

              <button
                onClick={() => onNavigate(step.section)}
                className={`inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-semibold transition shrink-0 ${
                  step.done
                    ? 'border border-[#E8E2D9] text-ink hover:border-clay hover:bg-[#FAF7F0]'
                    : 'bg-clay text-white hover:bg-[#b56e57] shadow-xs'
                }`}
              >
                <span>{step.actionLabel}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* STORE LAUNCH ADVICE */}
      <div className="rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] p-5 text-xs text-ink-muted flex items-start gap-3">
        <Store className="w-5 h-5 text-clay shrink-0 mt-0.5" />
        <div className="space-y-1 leading-relaxed">
          <p className="font-semibold text-ink">Storefront Availability Note:</p>
          <p>
            Any department with zero published items automatically renders an editorial "Coming Soon" card with its own brand identity. When you publish your first product in that department, the live customer catalogue activates immediately.
          </p>
        </div>
      </div>
    </div>
  );
}
