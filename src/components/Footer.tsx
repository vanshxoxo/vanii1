import { useState } from 'react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useCmsSection } from '../lib/cms';
import { useCatalog } from '../lib/catalog';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');
  const newsletter = useCmsSection('newsletter');
  const { categories, collections } = useCatalog();

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
    const { error: subscribeError } = await supabase.from('newsletter_subscribers').upsert({ email: normalizedEmail, status: 'pending', consented_at: new Date().toISOString() }, { onConflict: 'email', ignoreDuplicates: true });
    if (subscribeError) {
      setError('Newsletter signup could not be saved. Please try again later.');
      return;
    }
    setSubscribed(true);
    setEmail('');
  };

  return (
    <footer className="mt-16 bg-charcoal text-ivory">
      <div className="border-b border-ivory/10">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 px-4 py-9 sm:px-6 lg:flex-row lg:items-center lg:px-8">
          <div>
            <h2 className="font-serif text-2xl font-light">{newsletter?.heading || 'Newsletter'}</h2>
            <p className="mt-1 max-w-md text-sm text-ivory/60">{newsletter?.body || 'Subscribe to receive updates from Little Loom.'}</p>
          </div>
          <form onSubmit={(event) => void handleSubscribe(event)} className="w-full lg:max-w-md">
            <div className="flex gap-2"><input type="email" value={email} onChange={(event) => setEmail(event.target.value)} required autoComplete="email" placeholder="Email address" aria-label="Email address" className="min-w-0 flex-1 border border-ivory/20 bg-transparent px-4 py-3 text-sm text-ivory placeholder:text-ivory/40" /><button type="submit" className="bg-ivory px-5 text-sm font-medium text-charcoal hover:bg-white">Subscribe</button></div>
            {error && <p role="alert" className="mt-2 text-xs text-clay">{error}</p>}
            {subscribed && <p role="status" className="mt-2 text-xs text-ivory/70">Your signup request has been received.</p>}
          </form>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 py-9 sm:px-6 lg:px-8">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          <div><Link to="/" className="font-serif text-xl">Little Loom</Link></div>
          <div><h3 className="text-xs uppercase tracking-[0.18em] text-ivory/45">Shop</h3><ul className="mt-3 space-y-2 text-sm text-ivory/70"><li><Link to="/shop" className="hover:text-white">All published products</Link></li>{categories.map((category) => <li key={category.id}><Link to={`/shop?category=${encodeURIComponent(category.id)}`} className="hover:text-white">{category.name}</Link></li>)}</ul></div>
          {collections.length > 0 && <div><h3 className="text-xs uppercase tracking-[0.18em] text-ivory/45">Collections</h3><ul className="mt-3 space-y-2 text-sm text-ivory/70">{collections.map((collection) => <li key={collection.id}><Link to={`/shop?collection=${encodeURIComponent(collection.slug)}`} className="hover:text-white">{collection.name}</Link></li>)}</ul></div>}
          <div><h3 className="text-xs uppercase tracking-[0.18em] text-ivory/45">Information</h3><ul className="mt-3 space-y-2 text-sm text-ivory/70"><li><Link to="/contact" className="hover:text-white">Contact</Link></li><li><Link to="/shipping" className="hover:text-white">Shipping & returns</Link></li><li><Link to="/privacy" className="hover:text-white">Privacy</Link></li><li><Link to="/terms" className="hover:text-white">Terms</Link></li></ul></div>
        </div>
        <p className="mt-8 border-t border-ivory/10 pt-5 text-xs text-ivory/40">© {new Date().getFullYear()} Little Loom</p>
      </div>
    </footer>
  );
}
