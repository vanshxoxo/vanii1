import React, { useState } from 'react';
import {
  CreditCard,
  Truck,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Save,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PaymentShippingSettingsViewProps {
  settings: any;
  onRefresh: () => Promise<void> | void;
  initialTab?: 'payment' | 'shipping';
}

export default function PaymentShippingSettingsView({
  settings,
  onRefresh,
  initialTab = 'payment',
}: PaymentShippingSettingsViewProps) {
  const [activeTab, setActiveTab] = useState<'payment' | 'shipping'>(initialTab);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(
    settings?.free_shipping_threshold ? String(settings.free_shipping_threshold) : '1999'
  );
  const [standardDeliveryFee, setStandardDeliveryFee] = useState(
    settings?.standard_delivery_fee ? String(settings.standard_delivery_fee) : '150'
  );
  const [codFee, setCodFee] = useState(
    settings?.cod_fee ? String(settings.cod_fee) : '60'
  );
  const [pickupLocation, setPickupLocation] = useState(
    settings?.shiprocket_pickup_location || 'Primary'
  );
  const [isSaving, setIsSaving] = useState(false);
  const [feedback, setFeedback] = useState<{ message: string; type: 'success' | 'error' } | null>(null);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsSaving(true);
    setFeedback(null);
    try {
      const { error } = await supabase.from('store_settings').upsert({
        id: settings?.id || 1,
        free_shipping_threshold: Number(freeShippingThreshold) || 1999,
        standard_delivery_fee: Number(standardDeliveryFee) || 150,
        cod_fee: Number(codFee) || 60,
        shiprocket_pickup_location: pickupLocation || 'Primary',
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setFeedback({ message: 'Store checkout and delivery settings saved successfully.', type: 'success' });
      await onRefresh();
    } catch (err: any) {
      setFeedback({ message: err.message, type: 'error' });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl animate-fade-in">
      {/* HEADER & TAB SELECTOR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-[#E8E2D9]">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">
            {activeTab === 'payment' ? 'Payment Gateway Configuration' : 'Shipping & Logistics Configuration'}
          </h2>
          <p className="text-xs text-ink-muted mt-0.5">
            {activeTab === 'payment'
              ? 'Configure Razorpay API credentials, webhook endpoints, and transaction security'
              : 'Configure Shiprocket courier integration, pickup locations, packaging dimensions, and delivery rates'}
          </p>
        </div>

        <div className="flex items-center gap-1.5 p-1 bg-white rounded-xl border border-[#E8E2D9]">
          <button
            onClick={() => setActiveTab('payment')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'payment' ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5" />
            <span>Payment Settings</span>
          </button>
          <button
            onClick={() => setActiveTab('shipping')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
              activeTab === 'shipping' ? 'bg-clay text-white shadow-xs' : 'text-ink-muted hover:text-ink'
            }`}
          >
            <Truck className="w-3.5 h-3.5" />
            <span>Shipping Settings</span>
          </button>
        </div>
      </div>

      {/* FEEDBACK ALERT */}
      {feedback && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-2 border animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
              : 'bg-rose-50 border-rose-200 text-rose-900'
          }`}
        >
          <div className="flex items-center gap-2">
            {feedback.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{feedback.message}</span>
          </div>
          <button onClick={() => setFeedback(null)} className="font-bold p-1">
            ✕
          </button>
        </div>
      )}

      {/* 1. PAYMENT SETTINGS */}
      {activeTab === 'payment' && (
        <div className="space-y-6">
          {/* GATEWAY STATUS CARD */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-clay/10 text-clay flex items-center justify-center">
                  <CreditCard className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">Razorpay Payment Integration</h3>
                  <p className="text-xs text-ink-muted">UPI (GPay, PhonePe, Paytm), Debit/Credit Cards & Net Banking</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-700" />
                <span>HMAC Secured</span>
              </span>
            </div>

            <div className="grid sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Active Environment</span>
                <span className="font-semibold text-ink text-sm block">Preview Mode (Test API Active)</span>
                <p className="text-ink-muted leading-relaxed">
                  Real payment card details are never exposed to the browser. Keys are managed securely via Supabase Edge Function secrets.
                </p>
              </div>

              <div className="p-4 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-1.5">
                <span className="text-[10px] uppercase font-bold text-ink-muted block">Webhook Endpoint</span>
                <span className="font-mono text-[11px] text-clay block break-all">
                  https://ctcphbbfycvqdipcqhbi.supabase.co/functions/v1/razorpay-webhook
                </span>
                <p className="text-ink-muted leading-relaxed">
                  Configured with HMAC SHA-256 signature verification and idempotent event tracking.
                </p>
              </div>
            </div>

            {/* SECURITY GUIDELINES */}
            <div className="p-4 rounded-2xl border border-amber-200 bg-amber-50/60 text-xs text-amber-900 space-y-1.5">
              <div className="flex items-center gap-2 font-bold">
                <Lock className="w-4 h-4 text-amber-800" />
                <span>Server-Side Secret Key Policy:</span>
              </div>
              <p className="leading-relaxed">
                In adherence to PCI-DSS standards, <code className="bg-amber-100 px-1 py-0.5 rounded">RAZORPAY_KEY_SECRET</code> and <code className="bg-amber-100 px-1 py-0.5 rounded">RAZORPAY_WEBHOOK_SECRET</code> are never stored in client code or frontend variables. When ready to accept live customer funds, update your production secrets in Supabase Edge Functions with <code className="bg-amber-100 px-1 py-0.5 rounded">rzp_live_...</code> credentials.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. SHIPPING SETTINGS */}
      {activeTab === 'shipping' && (
        <form onSubmit={handleSaveSettings} className="space-y-6">
          {/* SHIPROCKET STATUS CARD */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#E8E2D9]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-clay/10 text-clay flex items-center justify-center">
                  <Truck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-serif text-lg font-bold text-ink">Shiprocket Logistics Gateway</h3>
                  <p className="text-xs text-ink-muted">Automated AWB assignment, courier pickup scheduling & live tracking</p>
                </div>
              </div>

              <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-sky-50 text-sky-800 border border-sky-200">
                <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                <span>Modular Provider</span>
              </span>
            </div>

            <div className="space-y-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">
                  Primary Pickup Location Name (as registered in Shiprocket)
                </label>
                <input
                  type="text"
                  value={pickupLocation}
                  onChange={(e) => setPickupLocation(e.target.value)}
                  placeholder="e.g. Primary / Warehouse 1"
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-clay"
                  required
                />
                <span className="text-[10px] text-ink-muted mt-1 block">
                  Must match the exact pickup address nickname configured in your Shiprocket account settings.
                </span>
              </div>
            </div>
          </div>

          {/* STORE DELIVERY RATES CARD */}
          <div className="bg-white rounded-3xl border border-[#E8E2D9] p-6 shadow-xs space-y-4">
            <h3 className="font-serif text-base font-bold text-ink">Storefront Delivery & COD Rates</h3>
            <p className="text-xs text-ink-muted">
              Configure checkout thresholds and shipping fees applied to customer orders
            </p>

            <div className="grid sm:grid-cols-3 gap-4 text-xs">
              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">
                  Free Shipping Minimum (₹)
                </label>
                <input
                  type="number"
                  value={freeShippingThreshold}
                  onChange={(e) => setFreeShippingThreshold(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-clay"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">
                  Standard Shipping Fee (₹)
                </label>
                <input
                  type="number"
                  value={standardDeliveryFee}
                  onChange={(e) => setStandardDeliveryFee(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-clay"
                  required
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold uppercase text-ink-muted mb-1">
                  Cash on Delivery Fee (₹)
                </label>
                <input
                  type="number"
                  value={codFee}
                  onChange={(e) => setCodFee(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-[#E8E2D9] text-xs focus:outline-hidden focus:border-clay"
                  required
                />
              </div>
            </div>

            <div className="pt-2 flex justify-end">
              <button
                type="submit"
                disabled={isSaving}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition disabled:opacity-50 shadow-xs"
              >
                <Save className="w-3.5 h-3.5" />
                <span>{isSaving ? 'Saving Settings...' : 'Save Shipping Settings'}</span>
              </button>
            </div>
          </div>
        </form>
      )}
    </div>
  );
}
