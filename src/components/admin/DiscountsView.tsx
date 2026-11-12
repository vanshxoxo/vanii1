import { useState } from 'react';
import { Check, Save, Sparkles } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface DiscountsViewProps {
  settings: Record<string, any>;
  onRefresh: () => Promise<void>;
}

export default function DiscountsView({ settings, onRefresh }: DiscountsViewProps) {
  const currentDiscounts = settings['active_promotions'] || [
    { code: 'WELCOME10', discountPercent: 10, description: '10% off on first order', minOrder: 999, isActive: true },
    { code: 'LOOMSUMMER', discountPercent: 15, description: 'Summer organic collection discount', minOrder: 1999, isActive: true },
  ];

  const [promos, setPromos] = useState<any[]>(currentDiscounts);
  const [newCode, setNewCode] = useState('');
  const [newPercent, setNewPercent] = useState('10');
  const [newDesc, setNewDesc] = useState('');
  const [newMinOrder, setNewMinOrder] = useState('999');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const addPromo = () => {
    if (!newCode.trim()) return;
    const cleanCode = newCode.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');
    const entry = {
      code: cleanCode,
      discountPercent: parseInt(newPercent, 10) || 10,
      description: newDesc.trim() || `${newPercent}% promotional discount`,
      minOrder: parseInt(newMinOrder, 10) || 0,
      isActive: true,
    };
    setPromos([...promos, entry]);
    setNewCode('');
    setNewDesc('');
  };

  const togglePromo = (index: number) => {
    const updated = [...promos];
    updated[index].isActive = !updated[index].isActive;
    setPromos(updated);
  };

  const deletePromo = (index: number) => {
    setPromos(promos.filter((_, i) => i !== index));
  };

  const saveToSettings = async () => {
    if (!supabase) return;
    setIsSaving(true);
    setNotice('');
    try {
      const { error } = await supabase.from('store_settings').upsert({
        setting_key: 'active_promotions',
        setting_value: promos,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setNotice('Promotions saved successfully!');
      await onRefresh();
    } catch (err: any) {
      alert(`Error saving discounts: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Store Discounts & Promo Codes</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Configure welcome coupons and seasonal discounts applied at checkout
          </p>
        </div>
        <button
          onClick={saveToSettings}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Changes'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* CREATE NEW COUPON */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs space-y-4">
        <h3 className="font-serif font-bold text-sm text-ink flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-clay" />
          <span>Create New Promo Code</span>
        </h3>

        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Coupon Code
            </label>
            <input
              type="text"
              placeholder="e.g. FESTIVE20"
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              className="w-full px-3 py-2 text-xs font-mono font-bold rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] uppercase"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Discount (%)
            </label>
            <input
              type="number"
              min="1"
              max="90"
              value={newPercent}
              onChange={(e) => setNewPercent(e.target.value)}
              className="w-full px-3 py-2 text-xs font-semibold rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Min. Order (₹)
            </label>
            <input
              type="number"
              value={newMinOrder}
              onChange={(e) => setNewMinOrder(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
            />
          </div>

          <div>
            <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
              Short Description
            </label>
            <input
              type="text"
              placeholder="e.g. 20% off festive styles"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
            />
          </div>
        </div>

        <button
          onClick={addPromo}
          className="px-4 py-2 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-ink-soft transition"
        >
          + Add Promo Code
        </button>
      </div>

      {/* ACTIVE COUPONS LIST */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs space-y-3">
        <h3 className="font-serif font-bold text-sm text-ink">Active Store Coupons</h3>

        <div className="divide-y divide-[#E8E2D9]">
          {promos.map((p, idx) => (
            <div key={idx} className="py-3 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-cream flex items-center justify-center font-bold font-mono text-clay">
                  %
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-ink">{p.code}</span>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-semibold">
                      {p.discountPercent}% OFF
                    </span>
                  </div>
                  <p className="text-xs text-ink-muted mt-0.5">
                    {p.description} • Min order ₹{p.minOrder || 0}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => togglePromo(idx)}
                  className={`px-3 py-1 text-xs rounded-lg font-medium border transition ${
                    p.isActive
                      ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                  }`}
                >
                  {p.isActive ? 'Active' : 'Paused'}
                </button>
                <button
                  onClick={() => deletePromo(idx)}
                  className="p-1.5 rounded-lg text-ink-muted hover:text-rose-600 hover:bg-rose-50 transition text-xs"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
