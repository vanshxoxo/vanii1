import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCmsSection } from '../lib/cms';
import { departments } from '../data/storeNavigation';
import { Sparkles } from 'lucide-react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const newsletter = useCmsSection('newsletter');

  const handleSubscribe = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail)) {
      setError('Enter a valid email address.');
      return;
    }
    if (!supabase) {
      setError('Newsletter signup is temporarily unavailable.');
      return;
    }
    setError('');
    const { error: subscribeError } = await supabase.from('newsletter_subscribers').upsert(
      { email: normalizedEmail, status: 'pending', consented_at: new Date().toISOString() },
      { onConflict: 'email', ignoreDuplicates: true }
    );
    if (subscribeError) {
      setError('Newsletter signup could not be saved. Please try again shortly.');
      return;
    }
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="mt-20 bg-charcoal text-ivory border-t border-charcoal/20">
      {/* Top Newsletter & Concierge Strip */}
      <div className="border-b border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-8 px-4 py-12 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div className="max-w-xl">
            <span className="text-xs uppercase tracking-[0.24em] font-semibold text-clay flex items-center gap-1.5">
              <Sparkles size={13} />
              Private Dispatch & Curations
            </span>
            <h2 className="mt-2 font-serif text-3xl font-light text-ivory">
              {newsletter?.heading || 'Join the VJ Collection Circle'}
            </h2>
            <p className="mt-2 text-sm text-ivory/65 leading-relaxed">
              {newsletter?.body ||
                'Receive private previews of limited handloom drops, bridal jewellery collections, and seasonal curations.'}
            </p>
          </div>

          <form onSubmit={(event) => void handleSubscribe(event)} className="w-full lg:max-w-md">
            <div className="flex rounded-xl overflow-hidden border border-ivory/20 bg-white/5 p-1 focus-within:border-ivory/50">
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                autoComplete="email"
                placeholder="Enter your email address"
                aria-label="Email address"
                className="min-w-0 flex-1 bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/40 outline-none"
              />
              <button
                type="submit"
                className="bg-ivory px-5 py-3 text-xs font-semibold uppercase tracking-wider text-charcoal hover:bg-white rounded-lg transition-colors shrink-0"
              >
                Subscribe
              </button>
            </div>
            {error && <p role="alert" className="mt-2 text-xs text-rose-300">{error}</p>}
            {subscribed && (
              <p role="status" className="mt-2 text-xs text-emerald-300">
                Welcome to VJ Collection. Your invitation has been registered.
              </p>
            )}
          </form>
        </div>
      </div>

      {/* Main Multi-Column Directory */}
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-12">
          {/* Brand Philosophy */}
          <div className="lg:col-span-4 space-y-4">
            <Link to="/" className="inline-block">
              <span className="font-serif text-2xl font-light tracking-[0.2em] text-ivory">
                VJ COLLECTION
              </span>
            </Link>
            <p className="text-xs text-ivory/60 leading-relaxed max-w-sm">
              An umbrella luxury retail house devoted to Indian craftsmanship. Curating fine imitation jewellery, authentic unstitched salwar fabrics, sanctuary home beddings, and gentle organic clothing by Little Loom.
            </p>
            <div className="pt-2 text-xs text-ivory/45">
              <span>Authentic Handcrafted Living · Nationwide Insured Dispatch</span>
            </div>
          </div>

          {/* Departments */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-ivory/45">
              The Four Departments
            </h3>
            <ul className="space-y-2.5 text-xs text-ivory/70">
              {departments.map((dept) => (
                <li key={dept.id}>
                  <Link
                    to={dept.landingPath}
                    className="hover:text-white transition-colors flex items-center justify-between group"
                  >
                    <span>{dept.brand}</span>
                    <span className="text-[10px] text-ivory/40 uppercase tracking-widest group-hover:text-clay transition-colors">
                      Explore
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Client Concierge */}
          <div className="lg:col-span-3 space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-ivory/45">
              Client Concierge
            </h3>
            <ul className="space-y-2.5 text-xs text-ivory/70">
              <li>
                <Link to="/shipping" className="hover:text-white transition-colors">
                  Insured Shipping & Delivery
                </Link>
              </li>
              <li>
                <Link to="/size-guide" className="hover:text-white transition-colors">
                  Size & Measurement Guides
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-white transition-colors">
                  Artisan Concierge & Inquiries
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="hover:text-white transition-colors">
                  Frequently Asked Questions
                </Link>
              </li>
              <li>
                <Link to="/orders" className="hover:text-white transition-colors">
                  Track Existing Orders
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Standards */}
          <div className="lg:col-span-2 space-y-3">
            <h3 className="text-xs uppercase tracking-[0.2em] font-semibold text-ivory/45">
              Integrity & Terms
            </h3>
            <ul className="space-y-2.5 text-xs text-ivory/70">
              <li>
                <Link to="/privacy" className="hover:text-white transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link to="/terms" className="hover:text-white transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link to="/admin" className="hover:text-white transition-colors">
                  Admin Portal
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Rights & Badges */}
        <div className="mt-16 pt-8 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-ivory/40">
          <p>© {new Date().getFullYear()} VJ Collection & Little Loom. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <span>Insured Delivery Pan-India</span>
            <span>·</span>
            <span>Razorpay Secure 256-Bit Encryption</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
