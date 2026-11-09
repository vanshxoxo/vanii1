import { useEffect, useState } from 'react';
import Breadcrumbs from '../components/ui';
import { supabase, isSupabaseConfigured } from '../lib/supabase';

type Faq = { id: string; category: string; question: string; answer_markdown: string };
type Policy = { id: string; title: string; body_markdown: string; updated_at: string };

export function FaqPage() {
  const [rows, setRows] = useState<Faq[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    void supabase.from('faqs').select('id,category,question,answer_markdown').eq('is_published', true).order('display_order')
      .then(({ data, error: queryError }) => { setRows(data || []); setError(queryError?.message || ''); setLoading(false); });
  }, []);
  return <main className="mx-auto max-w-4xl px-4 py-12"><Breadcrumbs items={[{ label: 'FAQs' }]} /><h1 className="mt-4 font-serif text-4xl">Frequently asked questions</h1>{loading && <p className="mt-6">Loading…</p>}{error && <p role="alert" className="mt-6 text-red-800">{error}</p>}{!isSupabaseConfigured && <p className="mt-6 text-ink-soft">Store content will appear after Supabase is connected.</p>}{!loading && !error && rows.length === 0 && isSupabaseConfigured && <p className="mt-6 text-ink-soft">No published FAQs yet.</p>}<div className="mt-8 divide-y divide-ink/15">{rows.map((item) => <details key={item.id} className="py-4"><summary className="cursor-pointer font-medium">{item.question}</summary><p className="mt-3 whitespace-pre-wrap text-sm leading-7 text-ink-soft">{item.answer_markdown}</p></details>)}</div></main>;
}

export function PolicyPage({ policyKey, label }: { policyKey: string; label: string }) {
  const [row, setRow] = useState<Policy | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    void supabase.from('policies').select('id,title,body_markdown,updated_at').eq('policy_key', policyKey).eq('is_published', true).maybeSingle()
      .then(({ data, error: queryError }) => { setRow(data); setError(queryError?.message || ''); setLoading(false); });
  }, [policyKey]);
  return <main className="mx-auto max-w-4xl px-4 py-12"><Breadcrumbs items={[{ label }]} /><h1 className="mt-4 font-serif text-4xl">{row?.title || label}</h1>{loading && <p className="mt-6">Loading…</p>}{error && <p role="alert" className="mt-6 text-red-800">{error}</p>}{!isSupabaseConfigured && <p className="mt-6 text-ink-soft">Published store policy will appear after Supabase is connected.</p>}{!loading && !error && !row && isSupabaseConfigured && <p className="mt-6 text-ink-soft">This policy has not been published yet.</p>}{row && <article className="mt-8 whitespace-pre-wrap text-sm leading-8 text-ink-soft">{row.body_markdown}</article>}</main>;
}

export function ContactPage() {
  const [details, setDetails] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!supabase) { setLoading(false); return; }
    void supabase.from('store_settings').select('setting_key,setting_value').in('setting_key', ['support_email','support_phone','support_whatsapp'])
      .then(({ data }) => {
        const values = Object.fromEntries((data || []).map((item) => [item.setting_key, String(item.setting_value).replace(/^"|"$/g, '')]));
        setDetails(values); setLoading(false);
      });
  }, []);
  return <main className="mx-auto max-w-3xl px-4 py-12"><Breadcrumbs items={[{ label: 'Contact' }]} /><h1 className="mt-4 font-serif text-4xl">Contact Little Loom</h1>{loading && <p className="mt-6 text-sm text-ink-soft">Loading contact details…</p>}{!loading && !details.support_email && !details.support_phone && !details.support_whatsapp && <p className="mt-6 text-sm text-ink-soft">Contact information is being set up. Please check back soon.</p>}<div className="mt-8 space-y-3 text-sm">{details.support_email && <p>Email: <a className="underline" href={`mailto:${details.support_email}`}>{details.support_email}</a></p>}{details.support_phone && <p>Phone: <a className="underline" href={`tel:${details.support_phone}`}>{details.support_phone}</a></p>}{details.support_whatsapp && <p><a className="underline" href={`https://wa.me/${details.support_whatsapp.replace(/\D/g, '')}`}>Message us on WhatsApp</a></p>}</div></main>;
}
