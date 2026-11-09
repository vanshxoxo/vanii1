import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, ShoppingBag } from 'lucide-react';
import { useStore } from '../useStore';
import { formatINR } from '../data';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';

type PaymentMethod = 'razorpay' | 'cod';
type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = { key: string; amount: number; currency: string; name: string; order_id: string; description: string; prefill?: { email?: string }; handler: (result: RazorpayResult) => void; modal: { ondismiss: () => void } };
declare global { interface Window { Razorpay?: new (options: RazorpayOptions) => { open: () => void }; } }

const blankAddress = { recipient_name: '', phone: '', address_line_1: '', address_line_2: '', city: '', state: '', postal_code: '', country_code: 'IN' };
type SavedAddress = typeof blankAddress & { id: string; label: string; is_default: boolean };

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) { resolve(true); return; }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js'; script.async = true;
    script.onload = () => resolve(true); script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
}

export default function CheckoutPage() {
  const { cart, cartTotal, clearCart } = useStore();
  const [address, setAddress] = useState(blankAddress);
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [saveAddress, setSaveAddress] = useState(true);
  const [method, setMethod] = useState<PaymentMethod>('razorpay');
  const [codEnabled, setCodEnabled] = useState(false);
  const [codFee, setCodFee] = useState(0);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState(1490);
  const [standardShippingFee, setStandardShippingFee] = useState(99);
  const [userEmail, setUserEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (!supabase) return;
    void Promise.all([
      supabase.auth.getUser().then(async ({ data }) => {
        setUserEmail(data.user?.email || '');
        if (!data.user) return;
        const { data: addresses } = await supabase!.from('customer_addresses').select('id,label,recipient_name,phone,address_line_1,address_line_2,city,state,postal_code,country_code,is_default').eq('customer_id', data.user.id).order('is_default', { ascending: false }).order('created_at', { ascending: false });
        const rows = (addresses || []) as SavedAddress[];
        setSavedAddresses(rows);
        if (rows[0]) { setSelectedAddressId(rows[0].id); setAddress(rows[0]); }
      }),
      supabase.from('store_settings').select('setting_key,setting_value').in('setting_key', ['cod_enabled','cod_surcharge','free_shipping_threshold','standard_shipping_fee']).then(({ data }) => {
        const values = Object.fromEntries((data || []).map((row: any) => [row.setting_key, row.setting_value]));
        setCodEnabled(values.cod_enabled === true); setCodFee(Number(values.cod_surcharge || 0));
        setFreeShippingThreshold(Number(values.free_shipping_threshold ?? 1490)); setStandardShippingFee(Number(values.standard_shipping_fee ?? 99));
      }),
    ]);
  }, []);

  async function submit(event: FormEvent) {
    event.preventDefault(); setError(''); setMessage('');
    if (!supabase) { setError('Supabase has not been configured.'); return; }
    const client = supabase;
    if (!userEmail) { setError('Sign in or create an account before checkout.'); return; }
    if (cart.some((item) => !item.variantId)) { setError('One or more items need to be selected from the connected catalog again before checkout.'); return; }
    setBusy(true);
    try {
      const { data: checkoutKey, error: keyError } = await client.rpc('get_checkout_idempotency_key');
      if (keyError || typeof checkoutKey !== 'string') throw new Error(keyError?.message || 'A database checkout session could not be created.');
      const { data, error: checkoutError } = await client.functions.invoke('checkout', { body: { method, address, idempotency_key: checkoutKey } });
      if (checkoutError) throw new Error(checkoutError.message);
      if (data?.error) throw new Error(data.error);
      if (saveAddress) {
        const { data: authData } = await client.auth.getUser();
        if (authData.user) {
          const matching = savedAddresses.find((saved) => saved.recipient_name === address.recipient_name && saved.phone === address.phone && saved.address_line_1 === address.address_line_1 && saved.address_line_2 === address.address_line_2 && saved.city === address.city && saved.state === address.state && saved.postal_code === address.postal_code && saved.country_code === address.country_code);
          if (!matching) {
            const { data: saved, error: saveError } = await client.from('customer_addresses').insert({ ...address, customer_id: authData.user.id, label: 'Home' }).select('id,label,recipient_name,phone,address_line_1,address_line_2,city,state,postal_code,country_code,is_default').single();
            if (saveError) setMessage('Order started. Address could not be saved for future checkouts.');
            else if (saved) setSavedAddresses((current) => [saved as SavedAddress, ...current]);
          }
        }
      }
      if (method === 'cod') {
        clearCart();
        setMessage(`Order #${data.order_number} placed. Payment is due on delivery.`); return;
      }
      if (!await loadRazorpayScript() || !window.Razorpay) throw new Error('Razorpay Checkout could not be loaded. Your order is saved as pending; retry with the same checkout session.');
      const { data: userData } = await client.auth.getUser();
      const checkout = new window.Razorpay({
        key: data.key_id, amount: data.amount, currency: data.currency, name: 'Little Loom',
        order_id: data.razorpay_order_id, description: `Little Loom order ${data.order_number}`,
        prefill: { email: userData.user?.email || undefined },
        handler: async (result) => {
          const verification = await client.functions.invoke('verify-payment', { body: result });
          if (verification.error || verification.data?.error) { setError(verification.data?.error || verification.error?.message || 'Payment verification failed.'); setBusy(false); return; }
          clearCart();
          setMessage(`Payment confirmed for order #${data.order_number}.`); setBusy(false);
        },
        modal: { ondismiss: () => { setBusy(false); setMessage('Payment was not completed. Your order remains pending and can be retried from this checkout session.'); } },
      });
      checkout.open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout could not be completed.'); setBusy(false);
    }
  }

  if (cart.length === 0 && !message) {
    return <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center"><div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-6"><ShoppingBag size={28} className="text-ink-light" /></div><h1 className="font-serif text-3xl font-light text-ink mb-3">Your bag is empty</h1><p className="text-sm text-ink-soft mb-6">Add some little outfits before checking out.</p><Link to="/shop"><Button variant="primary" size="lg">Browse the Collection<ArrowRight size={16} /></Button></Link></div>;
  }

  return <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12"><Breadcrumbs items={[{ label: 'Checkout' }]} /><h1 className="mt-4 font-serif text-3xl lg:text-4xl font-light text-ink">Checkout</h1>
    {message && <p role="status" className="mt-5 bg-green-50 p-4 text-sm text-green-900">{message}</p>}
    {error && <p role="alert" className="mt-5 bg-red-50 p-4 text-sm text-red-800">{error}</p>}
    {!userEmail && <p className="mt-5 border border-ink/10 p-4 text-sm">Sign in to place this order. <Link to="/account" className="underline">Sign in or create account</Link></p>}
    {cart.length > 0 && <div className="mt-7 grid gap-8 lg:grid-cols-[1fr_380px]">
      <form onSubmit={(e) => void submit(e)} className="space-y-7">
        <fieldset className="space-y-3"><legend className="font-serif text-xl">Delivery address</legend>{savedAddresses.length > 0 && <label className="block text-sm">Saved address<select value={selectedAddressId} onChange={(e) => { const saved = savedAddresses.find((item) => item.id === e.target.value); setSelectedAddressId(e.target.value); if (saved) setAddress(saved); }} className="admin-input"><option value="">Enter a new address</option>{savedAddresses.map((saved) => <option key={saved.id} value={saved.id}>{saved.label} · {saved.address_line_1}, {saved.city}</option>)}</select></label>}<label className="block text-sm">Full name<input required autoComplete="name" value={address.recipient_name} onChange={(e) => { setSelectedAddressId(''); setAddress({ ...address, recipient_name: e.target.value }); }} className="admin-input" /></label><label className="block text-sm">Phone<input required autoComplete="tel" value={address.phone} onChange={(e) => { setSelectedAddressId(''); setAddress({ ...address, phone: e.target.value }); }} className="admin-input" /></label><label className="block text-sm">Address<input required autoComplete="address-line1" value={address.address_line_1} onChange={(e) => { setSelectedAddressId(''); setAddress({ ...address, address_line_1: e.target.value }); }} className="admin-input" /></label><label className="block text-sm">Apartment, suite, etc. (optional)<input autoComplete="address-line2" value={address.address_line_2} onChange={(e) => { setSelectedAddressId(''); setAddress({ ...address, address_line_2: e.target.value }); }} className="admin-input" /></label><div className="grid grid-cols-2 gap-3"><label className="text-sm">City<input required autoComplete="address-level2" value={address.city} onChange={(e) => { setSelectedAddressId(''); setAddress({ ...address, city: e.target.value }); }} className="admin-input" /></label><label className="text-sm">State<input required autoComplete="address-level1" value={address.state} onChange={(e) => { setSelectedAddressId(''); setAddress({ ...address, state: e.target.value }); }} className="admin-input" /></label><label className="text-sm">Postal code<input required autoComplete="postal-code" value={address.postal_code} onChange={(e) => { setSelectedAddressId(''); setAddress({ ...address, postal_code: e.target.value }); }} className="admin-input" /></label></div><label className="flex items-center gap-2 text-xs"><input type="checkbox" checked={saveAddress} onChange={(e) => setSaveAddress(e.target.checked)} />Save this address to my account</label></fieldset>
        <fieldset className="space-y-3"><legend className="font-serif text-xl">Payment method</legend><label className="flex items-start gap-3 border border-ink/10 p-4 text-sm"><input type="radio" checked={method === 'razorpay'} onChange={() => setMethod('razorpay')} /> <span><strong>Pay online</strong><span className="block text-xs text-ink-soft">Secure payment with Razorpay. Final amount is calculated by the server.</span></span></label>{codEnabled && <label className="flex items-start gap-3 border border-ink/10 p-4 text-sm"><input type="radio" checked={method === 'cod'} onChange={() => setMethod('cod')} /><span><strong>Cash on delivery</strong><span className="block text-xs text-ink-soft">Pay when your order arrives{codFee ? ` · ${formatINR(codFee)} COD fee` : ''}.</span></span></label>}</fieldset>
        <p className="flex items-center gap-2 text-xs text-ink-light"><Lock size={14} /> Payment details are handled by the payment provider and never stored here.</p>
        <Button type="submit" size="lg" disabled={busy || !userEmail}>{busy ? 'Preparing secure checkout…' : method === 'cod' ? 'Place COD order' : 'Continue to secure payment'}</Button>
      </form>
      <aside className="h-fit border border-ink/10"><h2 className="border-b border-ink/10 px-5 py-4 text-sm font-semibold">Order summary</h2><ul className="divide-y divide-ink/8">{cart.map((item) => <li key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-4 px-5 py-4"><img src={item.image} alt={item.name} className="h-16 w-14 rounded-lg object-cover" /><div className="min-w-0 flex-1"><p className="truncate text-sm font-medium">{item.name}</p><p className="mt-0.5 text-xs text-ink-light">{item.color} · {item.size} · Qty {item.quantity}</p></div><span className="text-sm">{formatINR(item.price*item.quantity)}</span></li>)}</ul><div className="space-y-2 border-t border-ink/10 px-5 py-4 text-sm"><div className="flex justify-between"><span>Estimated subtotal</span><span>{formatINR(cartTotal)}</span></div><div className="flex justify-between"><span>Estimated shipping</span><span>{cartTotal >= freeShippingThreshold ? 'Free' : formatINR(standardShippingFee)}</span></div><p className="border-t border-ink/10 pt-3 text-xs text-ink-light">Price, stock, shipping, and any COD fee are rechecked on the server.</p></div></aside>
    </div>}</div>;
}
