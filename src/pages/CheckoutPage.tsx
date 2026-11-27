import { useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Lock, ShoppingBag, ShieldCheck, Truck, CheckCircle2, AlertTriangle, RefreshCw } from 'lucide-react';
import { useStore } from '../useStore';
import { formatINR } from '../data';
import { supabase } from '../lib/supabase';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';

type PaymentMethod = 'razorpay' | 'cod';
type RazorpayResult = { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string };
type RazorpayOptions = {
  key: string;
  amount: number;
  currency: string;
  name: string;
  order_id: string;
  description: string;
  prefill?: { email?: string };
  handler: (result: RazorpayResult) => void;
  modal: { ondismiss: () => void };
};
declare global {
  interface Window {
    Razorpay?: new (options: RazorpayOptions) => { open: () => void };
  }
}

const blankAddress = {
  recipient_name: '',
  phone: '',
  address_line_1: '',
  address_line_2: '',
  city: '',
  state: '',
  postal_code: '',
  country_code: 'IN',
  delivery_instructions: '',
};
type SavedAddress = typeof blankAddress & { id: string; label: string; is_default: boolean };

function loadRazorpayScript() {
  return new Promise<boolean>((resolve) => {
    if (window.Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
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
  const [userEmail, setUserEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [message, setMessage] = useState('');
  const [serviceability, setServiceability] = useState<any>(null);
  const [checkingServiceability, setCheckingServiceability] = useState(false);

  // Live Carrier Serviceability Check
  useEffect(() => {
    if (!supabase || !/^\d{6}$/.test(address.postal_code.trim())) {
      setServiceability(null);
      return;
    }
    let alive = true;
    setCheckingServiceability(true);
    const timer = setTimeout(async () => {
      try {
        const { data, error: sErr } = await supabase!.functions.invoke('shiprocket', {
          body: {
            action: 'serviceability',
            pincode: address.postal_code.trim(),
            cod: method === 'cod',
          },
        });
        if (alive && !sErr && data) {
          setServiceability(data);
        }
      } catch {
        // silent fallback
      } finally {
        if (alive) setCheckingServiceability(false);
      }
    }, 500);

    return () => {
      alive = false;
      clearTimeout(timer);
    };
  }, [address.postal_code, method]);

  useEffect(() => {
    if (!supabase || cart.length === 0) return;
    void Promise.all([
      supabase.auth.getUser().then(async ({ data }) => {
        setUserEmail(data.user?.email || '');
        if (!data.user) return;
        const { data: addresses } = await supabase!
          .from('customer_addresses')
          .select('id,label,recipient_name,phone,address_line_1,address_line_2,city,state,postal_code,country_code,is_default')
          .eq('customer_id', data.user.id)
          .order('is_default', { ascending: false })
          .order('created_at', { ascending: false });
        const rows = (addresses || []) as SavedAddress[];
        setSavedAddresses(rows);
        if (rows[0]) {
          setSelectedAddressId(rows[0].id);
          setAddress(rows[0]);
        }
      }),
      supabase
        .from('store_settings')
        .select('setting_key,setting_value')
        .in('setting_key', ['cod_enabled', 'cod_surcharge'])
        .then(({ data }) => {
          const values = Object.fromEntries((data || []).map((row: any) => [row.setting_key, row.setting_value]));
          setCodEnabled(values.cod_enabled === true);
          setCodFee(Number(values.cod_surcharge || 0));
        }),
    ]);
  }, [cart.length]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    setError('');
    setMessage('');
    if (!supabase) {
      setError('Supabase has not been configured.');
      return;
    }
    const client = supabase;
    if (!userEmail) {
      setError('Sign in or create an account before checkout.');
      return;
    }
    if (cart.some((item) => !item.variantId)) {
      setError('One or more items need to be selected from the connected catalog again before checkout.');
      return;
    }
    setBusy(true);
    try {
      const { data: checkoutKey, error: keyError } = await client.rpc('get_checkout_idempotency_key');
      if (keyError || typeof checkoutKey !== 'string') {
        throw new Error(keyError?.message || 'A database checkout session could not be created.');
      }
      const { data, error: checkoutError } = await client.functions.invoke('checkout', {
        body: { method, address, idempotency_key: checkoutKey },
      });
      if (checkoutError) throw new Error(checkoutError.message);
      if (data?.error) throw new Error(data.error);

      if (saveAddress) {
        const { data: authData } = await client.auth.getUser();
        if (authData.user) {
          const matching = savedAddresses.find(
            (saved) =>
              saved.recipient_name === address.recipient_name &&
              saved.phone === address.phone &&
              saved.address_line_1 === address.address_line_1 &&
              saved.address_line_2 === address.address_line_2 &&
              saved.city === address.city &&
              saved.state === address.state &&
              saved.postal_code === address.postal_code &&
              saved.country_code === address.country_code
          );
          if (!matching) {
            const { data: saved, error: saveError } = await client
              .from('customer_addresses')
              .insert({ ...address, customer_id: authData.user.id, label: 'Home' })
              .select('id,label,recipient_name,phone,address_line_1,address_line_2,city,state,postal_code,country_code,is_default')
              .single();
            if (saveError) {
              setMessage('Order started. Address could not be saved for future checkouts.');
            } else if (saved) {
              setSavedAddresses((current) => [saved as SavedAddress, ...current]);
            }
          }
        }
      }

      if (method === 'cod') {
        clearCart();
        setMessage(`Order #${data.order_number} placed successfully. Payment is due upon delivery.`);
        return;
      }

      if (!(await loadRazorpayScript()) || !window.Razorpay) {
        throw new Error('Razorpay Checkout could not be loaded. Your order is pending; retry shortly.');
      }

      const { data: userData } = await client.auth.getUser();
      const checkout = new window.Razorpay({
        key: data.key_id,
        amount: data.amount,
        currency: data.currency,
        name: 'VJ Collection',
        order_id: data.razorpay_order_id,
        description: `VJ Collection Order #${data.order_number}`,
        prefill: { email: userData.user?.email || undefined },
        handler: async (result) => {
          const verification = await client.functions.invoke('verify-payment', { body: result });
          if (verification.error || verification.data?.error) {
            setError(verification.data?.error || verification.error?.message || 'Payment verification failed.');
            setBusy(false);
            return;
          }
          clearCart();
          setMessage(`Payment confirmed for order #${data.order_number}. Thank you for choosing VJ Collection.`);
          setBusy(false);
        },
        modal: {
          ondismiss: () => {
            setBusy(false);
            setMessage('Payment was not completed. Your order remains pending and can be resumed from this session.');
          },
        },
      });
      checkout.open();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Checkout could not be completed.');
      setBusy(false);
    }
  }

  const shippingFee = cartTotal >= 1999 ? 0 : 150;
  const orderFinalTotal = cartTotal + shippingFee + (method === 'cod' ? codFee : 0);

  if (cart.length === 0 && !message) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <div className="w-16 h-16 rounded-full bg-white border border-charcoal/10 flex items-center justify-center mx-auto mb-6 shadow-xs">
          <ShoppingBag size={28} className="text-charcoal-light" />
        </div>
        <h1 className="font-serif text-3xl font-light text-charcoal mb-3">Your Shopping Bag is Empty</h1>
        <p className="text-sm text-charcoal-soft mb-6 max-w-sm mx-auto">
          Add some curated pieces to your bag before proceeding to checkout.
        </p>
        <Link to="/shop">
          <Button variant="primary" size="lg">
            Explore All Collections <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8 py-8 lg:py-14">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'Shopping Bag', href: '/shop' }, { label: 'Secure Checkout' }]} />

      <div className="mt-6 flex flex-col gap-1">
        <span className="text-xs uppercase tracking-[0.24em] font-semibold text-clay">Encrypted Gateway</span>
        <h1 className="font-serif text-3xl sm:text-4xl font-light text-charcoal">Secure Checkout</h1>
      </div>

      {message && (
        <div role="status" className="mt-6 rounded-2xl bg-emerald-50 border border-emerald-200 p-5 text-sm text-emerald-900 flex items-start gap-3">
          <CheckCircle2 size={18} className="text-emerald-700 shrink-0 mt-0.5" />
          <span>{message}</span>
        </div>
      )}

      {error && (
        <div role="alert" className="mt-6 rounded-2xl bg-rose-50 border border-rose-200 p-5 text-sm text-rose-800">
          {error}
        </div>
      )}

      {cart.length > 0 && !userEmail && (
        <div className="mt-6 rounded-2xl bg-white border border-charcoal/15 p-5 text-sm text-charcoal flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
          <div>
            <p className="font-medium">Sign in to complete your purchase</p>
            <p className="text-xs text-charcoal-soft">Sign in or register to track this order and store your addresses.</p>
          </div>
          <Link to="/account">
            <Button variant="primary" size="sm">Sign In or Register</Button>
          </Link>
        </div>
      )}

      {cart.length > 0 && (
        <div className="mt-8 grid gap-10 lg:grid-cols-12 items-start">
          {/* Left Column: Delivery & Payment Details */}
          <div className="lg:col-span-7">
            <form onSubmit={(event) => void submit(event)} className="space-y-8">
              {/* Delivery Address Section */}
              <div className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-8 shadow-xs space-y-5">
                <div className="flex items-center justify-between pb-4 border-b border-charcoal/8">
                  <h2 className="font-serif text-xl font-medium text-charcoal">1. Delivery Address</h2>
                  <span className="text-xs text-charcoal-light">Step 1 of 2</span>
                </div>

                {savedAddresses.length > 0 && (
                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1.5">
                      Use Saved Address
                    </label>
                    <select
                      value={selectedAddressId}
                      onChange={(event) => {
                        const saved = savedAddresses.find((item) => item.id === event.target.value);
                        setSelectedAddressId(event.target.value);
                        if (saved) setAddress(saved);
                      }}
                      className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/50 text-charcoal focus:outline-charcoal"
                    >
                      <option value="">Enter a new address</option>
                      {savedAddresses.map((saved) => (
                        <option key={saved.id} value={saved.id}>
                          {saved.label} · {saved.address_line_1}, {saved.city}
                        </option>
                      ))}
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Recipient Full Name
                    </label>
                    <input
                      required
                      minLength={2}
                      autoComplete="name"
                      value={address.recipient_name}
                      onChange={(event) => {
                        setSelectedAddressId('');
                        setAddress({ ...address, recipient_name: event.target.value });
                      }}
                      placeholder="e.g. Priyanshu Sharma"
                      className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/50 text-charcoal focus:outline-charcoal"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Phone Number (for courier dispatch)
                    </label>
                    <input
                      required
                      minLength={7}
                      autoComplete="tel"
                      value={address.phone}
                      onChange={(event) => {
                        setSelectedAddressId('');
                        setAddress({ ...address, phone: event.target.value });
                      }}
                      placeholder="+91 98765 43210"
                      className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/50 text-charcoal focus:outline-charcoal"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Street Address & Building
                    </label>
                    <input
                      required
                      autoComplete="address-line1"
                      value={address.address_line_1}
                      onChange={(event) => {
                        setSelectedAddressId('');
                        setAddress({ ...address, address_line_1: event.target.value });
                      }}
                      placeholder="House/Flat number, building name, street"
                      className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/50 text-charcoal focus:outline-charcoal"
                    />
                  </div>

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Apartment / Suite / Landmark (Optional)
                    </label>
                    <input
                      autoComplete="address-line2"
                      value={address.address_line_2}
                      onChange={(event) => {
                        setSelectedAddressId('');
                        setAddress({ ...address, address_line_2: event.target.value });
                      }}
                      placeholder="Near landmark, sector, or floor"
                      className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/50 text-charcoal focus:outline-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      City
                    </label>
                    <input
                      required
                      autoComplete="address-level2"
                      value={address.city}
                      onChange={(event) => {
                        setSelectedAddressId('');
                        setAddress({ ...address, city: event.target.value });
                      }}
                      placeholder="e.g. New Delhi"
                      className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/50 text-charcoal focus:outline-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      State
                    </label>
                    <input
                      required
                      autoComplete="address-level1"
                      value={address.state}
                      onChange={(event) => {
                        setSelectedAddressId('');
                        setAddress({ ...address, state: event.target.value });
                      }}
                      placeholder="e.g. Delhi"
                      className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/50 text-charcoal focus:outline-charcoal"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Postal Code / PIN
                    </label>
                    <input
                      required
                      autoComplete="postal-code"
                      inputMode="numeric"
                      value={address.postal_code}
                      onChange={(event) => {
                        setSelectedAddressId('');
                        setAddress({ ...address, postal_code: event.target.value });
                      }}
                      placeholder="e.g. 110001"
                      className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/50 text-charcoal focus:outline-charcoal"
                    />
                    {checkingServiceability && (
                      <span className="text-[10px] text-charcoal-light flex items-center gap-1 mt-1">
                        <RefreshCw size={10} className="animate-spin text-clay" />
                        <span>Checking carrier serviceability...</span>
                      </span>
                    )}
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Country
                    </label>
                    <input
                      disabled
                      value="India (IN)"
                      className="w-full rounded-xl border border-charcoal/10 p-3 text-sm bg-charcoal/5 text-charcoal-light"
                    />
                  </div>

                  {serviceability && (
                    <div className="sm:col-span-2">
                      <div
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between gap-2 ${
                          serviceability.serviceable
                            ? 'bg-emerald-50 border-emerald-200 text-emerald-900'
                            : 'bg-rose-50 border-rose-200 text-rose-900'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {serviceability.serviceable ? (
                            <CheckCircle2 size={15} className="text-emerald-700 shrink-0" />
                          ) : (
                            <AlertTriangle size={15} className="text-rose-700 shrink-0" />
                          )}
                          <span>
                            {serviceability.serviceable
                              ? `PIN ${address.postal_code} is serviceable via ${serviceability.recommended_courier?.name || 'Carrier Partner'}. Delivery timeline: ${serviceability.recommended_courier?.estimated_delivery_days || '3-5 business days'}.`
                              : `PIN ${address.postal_code} is currently outside our direct delivery zone. Please verify your PIN.`}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="sm:col-span-2">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-charcoal mb-1">
                      Delivery Instructions (Optional)
                    </label>
                    <input
                      autoComplete="off"
                      value={address.delivery_instructions}
                      onChange={(event) => {
                        setAddress({ ...address, delivery_instructions: event.target.value });
                      }}
                      placeholder="e.g. Ring the bell, leave at reception, or call on arrival"
                      className="w-full rounded-xl border border-charcoal/20 p-3 text-sm bg-ivory/50 text-charcoal focus:outline-charcoal"
                    />
                  </div>
                </div>

                <label className="flex items-center gap-2 pt-2 text-xs text-charcoal-soft cursor-pointer">
                  <input
                    type="checkbox"
                    checked={saveAddress}
                    onChange={(event) => setSaveAddress(event.target.checked)}
                    className="accent-charcoal"
                  />
                  <span>Save this address to my account for future orders</span>
                </label>
              </div>

              {/* Payment Method Section */}
              <div className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-8 shadow-xs space-y-4">
                <div className="flex items-center justify-between pb-4 border-b border-charcoal/8">
                  <h2 className="font-serif text-xl font-medium text-charcoal">2. Payment Method</h2>
                  <span className="text-xs text-charcoal-light">Step 2 of 2</span>
                </div>

                <div className="space-y-3">
                  <label
                    className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                      method === 'razorpay'
                        ? 'border-charcoal bg-[#FAF7EE] shadow-2xs'
                        : 'border-charcoal/15 bg-white hover:border-charcoal/30'
                    }`}
                  >
                    <input
                      type="radio"
                      name="paymentMethod"
                      checked={method === 'razorpay'}
                      onChange={() => setMethod('razorpay')}
                      className="accent-charcoal mt-1"
                    />
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-serif text-base font-medium text-charcoal">
                          Pay Online via Razorpay
                        </span>
                        <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded-full">
                          Fast & Secure
                        </span>
                      </div>
                      <p className="text-xs text-charcoal-soft mt-1">
                        UPI (Google Pay, PhonePe, Paytm), Credit & Debit Cards, NetBanking, and Wallets.
                      </p>
                    </div>
                  </label>

                  {codEnabled && (
                    <label
                      className={`flex items-start gap-3.5 p-4 rounded-2xl border transition-all cursor-pointer ${
                        method === 'cod'
                          ? 'border-charcoal bg-[#FAF7EE] shadow-2xs'
                          : 'border-charcoal/15 bg-white hover:border-charcoal/30'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={method === 'cod'}
                        onChange={() => setMethod('cod')}
                        className="accent-charcoal mt-1"
                      />
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-serif text-base font-medium text-charcoal">
                            Cash on Delivery (COD)
                          </span>
                          {codFee > 0 && (
                            <span className="text-xs text-charcoal-soft">
                              (+{formatINR(codFee)} COD charge)
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-charcoal-soft mt-1">
                          Pay in cash or UPI when your shipment arrives at your doorstep.
                        </p>
                      </div>
                    </label>
                  )}
                </div>

                <div className="pt-3 flex items-center gap-2 text-xs text-charcoal-light">
                  <Lock size={13} className="shrink-0" />
                  <span>256-bit encrypted SSL checkout. Payment details are never stored on this server.</span>
                </div>
              </div>

              {/* Submit CTA */}
              <Button
                type="submit"
                size="lg"
                className="w-full py-4 text-xs font-semibold uppercase tracking-wider rounded-2xl"
                disabled={busy || !userEmail}
              >
                {busy
                  ? 'Initiating Secure Gateway…'
                  : method === 'cod'
                    ? `Place Cash on Delivery Order (${formatINR(orderFinalTotal)})`
                    : `Proceed to Pay ${formatINR(orderFinalTotal)}`}
              </Button>
            </form>
          </div>

          {/* Right Column: Order Summary */}
          <div className="lg:col-span-5 sticky top-28">
            <div className="rounded-3xl bg-white border border-charcoal/10 p-6 sm:p-7 shadow-xs space-y-5">
              <h2 className="font-serif text-xl font-medium text-charcoal pb-4 border-b border-charcoal/8">
                Order Summary ({cart.reduce((s, i) => s + i.quantity, 0)} Items)
              </h2>

              <ul className="divide-y divide-charcoal/8 max-h-72 overflow-y-auto custom-scroll pr-1">
                {cart.map((item) => (
                  <li key={`${item.productId}-${item.color}-${item.size}`} className="py-3 flex gap-3.5">
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-16 w-13 rounded-xl object-cover bg-ivory shrink-0"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="font-serif text-xs font-medium text-charcoal truncate">{item.name}</p>
                      <p className="text-[11px] text-charcoal-light">
                        {item.color} · Option: {item.size}
                      </p>
                      <p className="text-[11px] text-charcoal-soft mt-1">
                        Qty: {item.quantity} × {formatINR(item.price)}
                      </p>
                    </div>
                    <span className="text-xs font-semibold text-charcoal">
                      {formatINR(item.price * item.quantity)}
                    </span>
                  </li>
                ))}
              </ul>

              {/* Cost Calculations */}
              <div className="space-y-2 pt-4 border-t border-charcoal/8 text-xs text-charcoal-soft">
                <div className="flex justify-between">
                  <span>Bag Subtotal</span>
                  <span className="font-semibold text-charcoal">{formatINR(cartTotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Pan-India Insured Shipping</span>
                  <span>{shippingFee === 0 ? <strong className="text-emerald-800">FREE</strong> : formatINR(shippingFee)}</span>
                </div>
                {serviceability?.recommended_courier?.estimated_delivery_days && (
                  <div className="flex justify-between text-clay font-medium text-[11px]">
                    <span>Estimated Delivery</span>
                    <span>{serviceability.recommended_courier.estimated_delivery_days}</span>
                  </div>
                )}
                {method === 'cod' && codFee > 0 && (
                  <div className="flex justify-between">
                    <span>COD Convenience Surcharge</span>
                    <span>{formatINR(codFee)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-3 border-t border-charcoal/10 text-sm">
                  <span className="font-serif text-base font-semibold text-charcoal">Grand Total</span>
                  <span className="font-serif text-lg font-bold text-charcoal">{formatINR(orderFinalTotal)}</span>
                </div>
              </div>

              {/* Trust Signature */}
              <div className="rounded-2xl bg-ivory p-3.5 space-y-2 text-[11px] text-charcoal-soft border border-charcoal/5">
                <div className="flex items-center gap-2">
                  <Truck size={14} className="text-charcoal shrink-0" />
                  <span>Insured dispatch via trusted courier partners across India.</span>
                </div>
                <div className="flex items-center gap-2">
                  <ShieldCheck size={14} className="text-charcoal shrink-0" />
                  <span>All shipments tracked with real-time SMS and email updates.</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
