import { useEffect, useState, type FormEvent } from 'react';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';

type Faq = { id: string; category: string; question: string; answer_markdown: string; display_order: number; is_published: boolean };
type Policy = { id: string; policy_key: string; title: string; body_markdown: string; is_published: boolean };
type Asset = { id: string; original_filename: string };
type Banner = { id: string; name: string; placement: string; heading: string; body: string; cta_label: string | null; cta_href: string | null; desktop_asset_id: string | null; mobile_asset_id: string | null; status: string; display_order: number };

const blankFaq = { category: 'general', question: '', answer_markdown: '', display_order: 0, is_published: false };
const blankPolicy = { policy_key: '', title: '', body_markdown: '', is_published: false };
const blankBanner = { name: '', placement: 'home', heading: '', body: '', cta_label: '', cta_href: '', desktop_asset_id: '', mobile_asset_id: '', status: 'draft', display_order: 0 };

export default function AdminContentPage() {
  const [faqs, setFaqs] = useState<Faq[]>([]);
  const [policies, setPolicies] = useState<Policy[]>([]);
  const [banners, setBanners] = useState<Banner[]>([]);
  const [assets, setAssets] = useState<Asset[]>([]);
  const [faqForm, setFaqForm] = useState<Faq>(blankFaq as Faq);
  const [policyForm, setPolicyForm] = useState<Policy>(blankPolicy as Policy);
  const [bannerForm, setBannerForm] = useState<Banner>(blankBanner as Banner);
  const [status, setStatus] = useState('');
  const [error, setError] = useState('');

  async function load() {
    if (!supabase) return;
    const [faqRows, policyRows, bannerRows, assetRows] = await Promise.all([
      supabase.from('faqs').select('*').order('display_order'),
      supabase.from('policies').select('*').order('policy_key'),
      supabase.from('banners').select('*').order('display_order'),
      supabase.from('media_assets').select('id,original_filename').order('created_at', { ascending: false }).limit(300),
    ]);
    if (faqRows.error || policyRows.error || bannerRows.error || assetRows.error) { setError('One or more content tables could not be loaded. Check the catalog-manager role and latest migration.'); return; }
    setFaqs(faqRows.data || []); setPolicies(policyRows.data || []); setBanners(bannerRows.data || []); setAssets(assetRows.data || []);
  }

  useEffect(() => { void load(); }, []);

  async function saveFaq(event: FormEvent) {
    event.preventDefault(); if (!supabase) return;
    const result = faqForm.id ? await supabase.from('faqs').update(faqForm).eq('id', faqForm.id) : await supabase.from('faqs').insert(faqForm);
    if (result.error) { setError(result.error.message); return; }
    setFaqForm(blankFaq as Faq); setStatus('FAQ saved.'); setError(''); await load();
  }

  async function savePolicy(event: FormEvent) {
    event.preventDefault(); if (!supabase) return;
    const payload = { policy_key: policyForm.policy_key.trim().toLowerCase().replace(/\s+/g, '_'), title: policyForm.title.trim(), body_markdown: policyForm.body_markdown, is_published: policyForm.is_published, published_at: policyForm.is_published ? new Date().toISOString() : null };
    const result = await supabase.from('policies').upsert(payload, { onConflict: 'policy_key' });
    if (result.error) { setError(result.error.message); return; }
    setPolicyForm(blankPolicy as Policy); setStatus('Policy saved.'); setError(''); await load();
  }

  async function saveBanner(event: FormEvent) {
    event.preventDefault(); if (!supabase) return;
    const payload = { ...bannerForm, cta_label: bannerForm.cta_label || null, cta_href: bannerForm.cta_href || null, desktop_asset_id: bannerForm.desktop_asset_id || null, mobile_asset_id: bannerForm.mobile_asset_id || null };
    const result = bannerForm.id ? await supabase.from('banners').update(payload).eq('id', bannerForm.id) : await supabase.from('banners').insert(payload);
    if (result.error) { setError(result.error.message); return; }
    setBannerForm(blankBanner as Banner); setStatus('Banner saved.'); setError(''); await load();
  }

  const message = error || status;
  return <section className="mt-6 space-y-10">
    {message && <p role={error ? 'alert' : 'status'} className={`p-3 text-sm ${error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-900'}`}>{message}</p>}
    <div className="grid gap-8 lg:grid-cols-2">
      <form onSubmit={(event) => void saveFaq(event)} className="space-y-3 border border-ink/10 p-4"><h2 className="font-serif text-xl">FAQs</h2><label className="block text-sm">Category<input required value={faqForm.category} onChange={(e) => setFaqForm({ ...faqForm, category: e.target.value })} className="admin-input" /></label><label className="block text-sm">Question<input required value={faqForm.question} onChange={(e) => setFaqForm({ ...faqForm, question: e.target.value })} className="admin-input" /></label><label className="block text-sm">Answer<textarea required rows={4} value={faqForm.answer_markdown} onChange={(e) => setFaqForm({ ...faqForm, answer_markdown: e.target.value })} className="admin-input" /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={faqForm.is_published} onChange={(e) => setFaqForm({ ...faqForm, is_published: e.target.checked })} />Published</label><Button type="submit">Save FAQ</Button><ul className="divide-y divide-ink/10">{faqs.map((item) => <li key={item.id} className="flex justify-between gap-3 py-2 text-xs"><span>{item.question} · {item.is_published ? 'published' : 'draft'}</span><button type="button" onClick={() => setFaqForm(item)} className="underline">Edit</button></li>)}</ul></form>
      <form onSubmit={(event) => void savePolicy(event)} className="space-y-3 border border-ink/10 p-4"><h2 className="font-serif text-xl">Policies and size guide</h2><label className="block text-sm">Key<input required placeholder="privacy, terms, shipping_returns, size_guide" value={policyForm.policy_key} onChange={(e) => setPolicyForm({ ...policyForm, policy_key: e.target.value })} className="admin-input" /></label><label className="block text-sm">Title<input required value={policyForm.title} onChange={(e) => setPolicyForm({ ...policyForm, title: e.target.value })} className="admin-input" /></label><label className="block text-sm">Content<textarea required rows={7} value={policyForm.body_markdown} onChange={(e) => setPolicyForm({ ...policyForm, body_markdown: e.target.value })} className="admin-input" /></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={policyForm.is_published} onChange={(e) => setPolicyForm({ ...policyForm, is_published: e.target.checked })} />Published</label><Button type="submit">Save policy</Button><ul className="divide-y divide-ink/10">{policies.map((item) => <li key={item.id} className="flex justify-between gap-3 py-2 text-xs"><span>{item.policy_key} · {item.is_published ? 'published' : 'draft'}</span><button type="button" onClick={() => setPolicyForm(item)} className="underline">Edit</button></li>)}</ul></form>
    </div>
    <form onSubmit={(event) => void saveBanner(event)} className="grid gap-4 border border-ink/10 p-4 lg:grid-cols-2"><h2 className="font-serif text-xl lg:col-span-2">Banner management</h2><label className="text-sm">Name<input required value={bannerForm.name} onChange={(e) => setBannerForm({ ...bannerForm, name: e.target.value })} className="admin-input" /></label><label className="text-sm">Placement<select value={bannerForm.placement} onChange={(e) => setBannerForm({ ...bannerForm, placement: e.target.value })} className="admin-input">{['home','shop','announcement','campaign'].map((item) => <option key={item}>{item}</option>)}</select></label><label className="text-sm">Heading<input value={bannerForm.heading} onChange={(e) => setBannerForm({ ...bannerForm, heading: e.target.value })} className="admin-input" /></label><label className="text-sm">Call-to-action href<input value={bannerForm.cta_href || ''} onChange={(e) => setBannerForm({ ...bannerForm, cta_href: e.target.value })} className="admin-input" /></label><label className="text-sm">Desktop asset<select value={bannerForm.desktop_asset_id || ''} onChange={(e) => setBannerForm({ ...bannerForm, desktop_asset_id: e.target.value })} className="admin-input"><option value="">No image</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.original_filename}</option>)}</select></label><label className="text-sm">Mobile asset<select value={bannerForm.mobile_asset_id || ''} onChange={(e) => setBannerForm({ ...bannerForm, mobile_asset_id: e.target.value })} className="admin-input"><option value="">Use desktop</option>{assets.map((asset) => <option key={asset.id} value={asset.id}>{asset.original_filename}</option>)}</select></label><label className="text-sm">Body<textarea rows={3} value={bannerForm.body} onChange={(e) => setBannerForm({ ...bannerForm, body: e.target.value })} className="admin-input" /></label><label className="text-sm">Status<select value={bannerForm.status} onChange={(e) => setBannerForm({ ...bannerForm, status: e.target.value })} className="admin-input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><div><Button type="submit">Save banner</Button></div><ul className="divide-y divide-ink/10 lg:col-span-2">{banners.map((item) => <li key={item.id} className="flex justify-between py-2 text-xs"><span>{item.name} · {item.placement} · {item.status}</span><button type="button" onClick={() => setBannerForm(item)} className="underline">Edit</button></li>)}</ul></form>
  </section>;
}
