import { useEffect, useState } from 'react';
import Breadcrumbs from '../components/ui';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import { Sparkles, Mail, Phone, MessageSquare } from 'lucide-react';

type Faq = { id: string; category: string; question: string; answer_markdown: string };
type Policy = { id: string; title: string; body_markdown: string; updated_at: string };

export function FaqPage() {
  const [rows, setRows] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase
      .from('faqs')
      .select('id,category,question,answer_markdown')
      .eq('is_published', true)
      .order('display_order')
      .then(({ data, error: queryError }) => {
        setRows(data || []);
        setError(queryError?.message || '');
        setLoading(false);
      });
  }, []);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 min-h-[70vh]">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Frequently Asked Questions' }]} />
      <div className="mt-6 pb-6 border-b border-charcoal/10">
        <span className="text-xs uppercase tracking-[0.24em] font-semibold text-clay flex items-center gap-1.5">
          <Sparkles size={13} />
          Customer Concierge
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-5xl font-light text-charcoal">Frequently Asked Questions</h1>
      </div>

      {loading && <p className="mt-8 text-sm text-charcoal-light">Loading concierge questions…</p>}
      {error && <p role="alert" className="mt-8 text-sm text-rose-800">{error}</p>}
      {!isSupabaseConfigured && (
        <p className="mt-8 text-sm text-charcoal-soft">Store content will appear after Supabase is connected.</p>
      )}
      {!loading && !error && rows.length === 0 && isSupabaseConfigured && (
        <p className="mt-8 text-sm text-charcoal-soft">No published FAQs at this time. Please contact our concierge directly.</p>
      )}

      <div className="mt-8 divide-y divide-charcoal/10 rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-8 shadow-xs">
        {rows.map((item) => (
          <details key={item.id} className="py-4 first:pt-0 last:pb-0 group">
            <summary className="cursor-pointer font-serif text-base font-medium text-charcoal hover:text-clay transition-colors list-none flex items-center justify-between">
              <span>{item.question}</span>
              <span className="text-xs font-bold text-charcoal-light group-open:rotate-45 transition-transform">+</span>
            </summary>
            <p className="mt-3 whitespace-pre-wrap text-xs sm:text-sm leading-relaxed text-charcoal-soft bg-ivory/50 p-4 rounded-xl border border-charcoal/5">
              {item.answer_markdown}
            </p>
          </details>
        ))}
      </div>
    </main>
  );
}

export function PolicyPage({ policyKey, label }: { policyKey: string; label: string }) {
  const [row, setRow] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase
      .from('policies')
      .select('id,title,body_markdown,updated_at')
      .eq('policy_key', policyKey)
      .eq('is_published', true)
      .maybeSingle()
      .then(({ data, error: queryError }) => {
        setRow(data);
        setError(queryError?.message || '');
        setLoading(false);
      });
  }, [policyKey]);

  return (
    <main className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 min-h-[70vh]">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label }]} />
      <div className="mt-6 pb-6 border-b border-charcoal/10">
        <span className="text-xs uppercase tracking-[0.24em] font-semibold text-clay flex items-center gap-1.5">
          <Sparkles size={13} />
          Store Guidelines
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-5xl font-light text-charcoal">{row?.title || label}</h1>
      </div>

      {loading && <p className="mt-8 text-sm text-charcoal-light">Loading policy document…</p>}
      {error && <p role="alert" className="mt-8 text-sm text-rose-800">{error}</p>}
      {!isSupabaseConfigured && (
        <p className="mt-8 text-sm text-charcoal-soft">Published store policy will appear after Supabase is connected.</p>
      )}
      {!loading && !error && !row && isSupabaseConfigured && (
        <p className="mt-8 text-sm text-charcoal-soft">This policy has not been published yet.</p>
      )}
      {row && (
        <article className="mt-8 whitespace-pre-wrap text-sm leading-8 text-charcoal-soft rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-10 shadow-xs">
          {row.body_markdown}
        </article>
      )}
    </main>
  );
}

export function ContactPage() {
  const [details, setDetails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return;
    }
    void supabase
      .from('store_settings')
      .select('setting_key,setting_value')
      .in('setting_key', ['support_email', 'support_phone', 'support_whatsapp'])
      .then(({ data }) => {
        const values = Object.fromEntries(
          (data || []).map((item) => [item.setting_key, String(item.setting_value).replace(/^"|"$/g, '')])
        );
        setDetails(values);
        setLoading(false);
      });
  }, []);

  return (
    <main className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 min-h-[70vh]">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Client Concierge & Contact' }]} />
      <div className="mt-6 pb-6 border-b border-charcoal/10">
        <span className="text-xs uppercase tracking-[0.24em] font-semibold text-clay flex items-center gap-1.5">
          <Sparkles size={13} />
          Dedicated Support
        </span>
        <h1 className="mt-2 font-serif text-3xl sm:text-5xl font-light text-charcoal">
          Contact VJ Collection
        </h1>
        <p className="mt-2 text-sm text-charcoal-soft">
          Our client concierge is pleased to assist with custom sizing inquiries, bridal jewellery appointments, fabric consultations, and order updates.
        </p>
      </div>

      {loading && <p className="mt-8 text-sm text-charcoal-light">Loading concierge details…</p>}

      {!loading && !details.support_email && !details.support_phone && !details.support_whatsapp && (
        <p className="mt-8 text-sm text-charcoal-soft">
          Contact channels are being configured. Please email us or check back shortly.
        </p>
      )}

      <div className="mt-8 space-y-4">
        {details.support_email && (
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-charcoal/10 shadow-xs">
            <div className="h-11 w-11 rounded-xl bg-ivory flex items-center justify-center text-charcoal shrink-0">
              <Mail size={20} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-light">Email Concierge</p>
              <a className="font-serif text-base text-charcoal hover:text-clay" href={`mailto:${details.support_email}`}>
                {details.support_email}
              </a>
            </div>
          </div>
        )}

        {details.support_phone && (
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-charcoal/10 shadow-xs">
            <div className="h-11 w-11 rounded-xl bg-ivory flex items-center justify-center text-charcoal shrink-0">
              <Phone size={20} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-light">Direct Assistance</p>
              <a className="font-serif text-base text-charcoal hover:text-clay" href={`tel:${details.support_phone}`}>
                {details.support_phone}
              </a>
            </div>
          </div>
        )}

        {details.support_whatsapp && (
          <div className="flex items-center gap-4 p-5 rounded-2xl bg-white border border-charcoal/10 shadow-xs">
            <div className="h-11 w-11 rounded-xl bg-ivory flex items-center justify-center text-charcoal shrink-0">
              <MessageSquare size={20} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-wider text-charcoal-light">WhatsApp Concierge</p>
              <a
                className="font-serif text-base text-charcoal hover:text-clay"
                href={`https://wa.me/${details.support_whatsapp.replace(/\D/g, '')}`}
                target="_blank"
                rel="noreferrer"
              >
                Chat on WhatsApp (+{details.support_whatsapp})
              </a>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
