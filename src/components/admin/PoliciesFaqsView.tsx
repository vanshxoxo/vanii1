import { useState } from 'react';
import { HelpCircle, FileText, Save, Check, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface PoliciesFaqsViewProps {
  settings: Record<string, any>;
  onRefresh: () => Promise<void>;
}

export default function PoliciesFaqsView({ settings, onRefresh }: PoliciesFaqsViewProps) {
  const currentFaqs = settings['store_faqs'] || [
    {
      question: 'What materials do you use for Little Loom garments?',
      answer: 'We craft our clothing exclusively from 100% GOTS-certified organic cotton, linen blends, and natural wooden buttons with gentle non-toxic dyes.',
    },
    {
      question: 'How do I choose the right size for my child?',
      answer: 'Each product page includes our exact garment size measurement table with chest, waist, and length measurements in inches. If between sizes, we recommend sizing up for comfortable wear.',
    },
    {
      question: 'What is your shipping and return policy?',
      answer: 'We offer free delivery across India on orders above ₹1,499. Returns and exchanges are accepted within 7 days of delivery for unworn items with original tags intact.',
    },
  ];

  const currentPolicies = settings['store_policies'] || {
    shipping: 'Orders are dispatched within 24 to 48 hours. Standard courier transit takes 3-5 business days across major metro cities in India.',
    returns: 'Hassle-free 7-day exchange and return policy. Garments must be unwashed, unworn, and have all Little Loom hangtags attached.',
  };

  const [faqs, setFaqs] = useState<any[]>(currentFaqs);
  const [policies, setPolicies] = useState(currentPolicies);
  const [newQ, setNewQ] = useState('');
  const [newA, setNewA] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [notice, setNotice] = useState('');

  const addFaq = () => {
    if (!newQ.trim() || !newA.trim()) return;
    setFaqs([...faqs, { question: newQ.trim(), answer: newA.trim() }]);
    setNewQ('');
    setNewA('');
  };

  const deleteFaq = (index: number) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const saveAll = async () => {
    if (!supabase) return;
    setIsSaving(true);
    setNotice('');
    try {
      await Promise.all([
        supabase.from('store_settings').upsert({
          setting_key: 'store_faqs',
          setting_value: faqs,
          updated_at: new Date().toISOString(),
        }),
        supabase.from('store_settings').upsert({
          setting_key: 'store_policies',
          setting_value: policies,
          updated_at: new Date().toISOString(),
        }),
      ]);
      setNotice('Policies and FAQs saved successfully!');
      await onRefresh();
    } catch (err: any) {
      alert(`Error saving: ${err.message}`);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2">
        <div>
          <h2 className="font-serif text-2xl font-bold text-ink">Policies & FAQs</h2>
          <p className="text-xs text-ink-muted mt-0.5">
            Manage customer guidance, shipping information, and frequently asked questions
          </p>
        </div>
        <button
          onClick={saveAll}
          disabled={isSaving}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs self-start sm:self-auto"
        >
          <Save className="w-4 h-4" />
          <span>{isSaving ? 'Saving...' : 'Save All'}</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
          <Check className="w-4 h-4 text-emerald-600" />
          <span>{notice}</span>
        </div>
      )}

      {/* POLICIES SECTION */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-4">
        <h3 className="font-serif font-bold text-base text-ink flex items-center gap-2">
          <FileText className="w-4 h-4 text-clay" />
          <span>Store Delivery & Return Policies</span>
        </h3>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Shipping & Delivery Information
            </label>
            <textarea
              rows={3}
              value={policies.shipping}
              onChange={(e) => setPolicies({ ...policies, shipping: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
              Returns & Exchanges Information
            </label>
            <textarea
              rows={3}
              value={policies.returns}
              onChange={(e) => setPolicies({ ...policies, returns: e.target.value })}
              className="w-full px-3.5 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
            />
          </div>
        </div>
      </div>

      {/* FAQS SECTION */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-5">
        <h3 className="font-serif font-bold text-base text-ink flex items-center gap-2">
          <HelpCircle className="w-4 h-4 text-clay" />
          <span>Frequently Asked Questions</span>
        </h3>

        {/* Existing FAQs */}
        <div className="divide-y divide-[#E8E2D9]">
          {faqs.map((f, idx) => (
            <div key={idx} className="py-3.5 space-y-1">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-xs text-ink">{f.question}</span>
                <button
                  onClick={() => deleteFaq(idx)}
                  className="p-1 rounded text-ink-muted hover:text-rose-600 transition"
                  title="Remove FAQ"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-xs text-ink-muted">{f.answer}</p>
            </div>
          ))}
        </div>

        {/* Add New FAQ Form */}
        <div className="pt-4 border-t border-[#E8E2D9] space-y-3">
          <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
            Add New Question
          </span>
          <input
            type="text"
            placeholder="Question title..."
            value={newQ}
            onChange={(e) => setNewQ(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
          />
          <textarea
            rows={2}
            placeholder="Helpful answer..."
            value={newA}
            onChange={(e) => setNewA(e.target.value)}
            className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
          />
          <button
            onClick={addFaq}
            className="px-4 py-2 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-ink-soft transition"
          >
            + Add FAQ
          </button>
        </div>
      </div>
    </div>
  );
}
