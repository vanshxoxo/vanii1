import { useState } from 'react';
import { Mail, Phone, MessageSquare, Clock, Save, Check } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SupportViewProps {
  settings: Record<string, any>;
  onRefresh: () => Promise<void>;
}

export default function SupportView({ settings, onRefresh }: SupportViewProps) {
  const currentSupport = settings['customer_support'] || {
    email: 'care@littleloom.in',
    phone: '+91 98765 43210',
    whatsapp: '+91 98765 43210',
    hours: 'Monday to Saturday, 10:00 AM – 6:00 PM IST',
    response_sla: 'Within 2 to 4 business hours',
  };

  const [form, setForm] = useState(currentSupport);
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const saveSettings = async () => {
    if (!supabase) return;
    setIsSaving(true);
    setNotice('');
    try {
      const { error } = await supabase.from('store_settings').upsert({
        setting_key: 'customer_support',
        setting_value: form,
        updated_at: new Date().toISOString(),
      });
      if (error) throw error;
      setNotice('Customer support settings updated successfully!');
      await onRefresh();
    } catch (err: any) {
      alert(`Error saving support details: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Customer Support Channels</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Configure contact information and live assistance links displayed across the store and order emails
          </p>
        </div>
        <button
          onClick={saveSettings}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save Settings'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-5">
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-clay" />
              <span>Customer Care Email</span>
            </label>
            <input
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <MessageSquare className="w-3.5 h-3.5 text-emerald-600" />
              <span>WhatsApp Support Number</span>
            </label>
            <input
              type="text"
              value={form.whatsapp}
              onChange={(e) => setForm({ ...form, whatsapp: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
            />
            <span className="text-[11px] text-ink-muted mt-1 block">
              Includes country code, e.g. +91 98765 43210
            </span>
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Phone className="w-3.5 h-3.5 text-clay" />
              <span>Helpline Phone Number</span>
            </label>
            <input
              type="text"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-clay" />
              <span>Operating Hours</span>
            </label>
            <input
              type="text"
              value={form.hours}
              onChange={(e) => setForm({ ...form, hours: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Expected Response Time SLA
            </label>
            <input
              type="text"
              value={form.response_sla}
              onChange={(e) => setForm({ ...form, response_sla: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
