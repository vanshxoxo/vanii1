import { Link } from 'react-router-dom';
import { Instagram } from 'lucide-react';
import { useState } from 'react';

export default function Footer() {
  const [email, setEmail] = useState('');
  const [subscribed, setSubscribed] = useState(false);
  const [error, setError] = useState('');

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError('Please enter a valid email address.');
      return;
    }
    setError('');
    setSubscribed(true);
    setEmail('');
  };

  const footerSections = [
    {
      title: 'Shop',
      links: [
        { label: 'New Arrivals', href: '/shop?filter=new' },
        { label: 'Rompers', href: '/shop?category=Rompers' },
        { label: 'Co-ord Sets', href: '/shop?category=Co-ord+Sets' },
        { label: 'Dresses', href: '/shop?category=Dresses' },
        { label: 'Sleepwear', href: '/shop?category=Sleepwear' },
      ],
    },
    {
      title: 'Help & Support',
      links: [
        { label: 'Contact', href: '/contact' },
        { label: 'Shipping & Returns', href: '/shipping' },
        { label: 'Size Guide', href: '/size-guide' },
        { label: 'FAQs', href: '/faqs' },
      ],
    },
    {
      title: 'About Little Loom',
      links: [
        { label: 'Our Story', href: '/#brand-story' },
        { label: 'Collections', href: '/shop' },
        { label: 'Privacy Policy', href: '/privacy' },
        { label: 'Terms & Conditions', href: '/terms' },
      ],
    },
  ];

  return (
    <footer className="bg-ink text-cream mt-20">
      {/* Newsletter */}
      <div className="border-b border-cream/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-8">
            <div className="max-w-md">
              <h3 className="font-serif text-2xl lg:text-3xl font-light leading-tight">
                Little notes, big little joy.
              </h3>
              <p className="mt-2 text-sm text-cream/60">
                Join our list for early access to new arrivals and stories from the Little Loom world.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="w-full lg:w-auto lg:min-w-[400px]">
              <div className="flex flex-col sm:flex-row gap-3">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-4 py-3 bg-transparent border border-cream/20 rounded-lg text-sm text-cream placeholder-cream/40 focus:border-cream/50 outline-none transition-colors"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  className="px-6 py-3 bg-butter text-ink text-sm font-medium rounded-lg hover:brightness-95 transition-all whitespace-nowrap"
                >
                  Subscribe
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-peach">{error}</p>}
              {subscribed && (
                <p className="mt-2 text-xs text-pistachio">
                  You're on the list! Welcome to the Little Loom family. (Demo confirmation)
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-12 lg:py-16">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12">
          {/* Brand */}
          <div className="lg:col-span-1">
            <Link to="/" className="font-serif text-2xl font-medium text-cream">
              Little Loom
            </Link>
            <p className="mt-3 text-sm text-cream/50 leading-relaxed max-w-xs">
              Tiny outfits. Big little energy. Premium kidswear for newborns to 4 years.
            </p>
            <a
              href="#"
              aria-label="Instagram"
              className="mt-4 inline-flex items-center gap-2 text-sm text-cream/60 hover:text-cream transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <Instagram size={18} />
              <span>@littleloom</span>
            </a>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-xs font-semibold uppercase tracking-wider text-cream/40 mb-4">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-2.5">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-sm text-cream/70 hover:text-cream transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        {/* Bottom bar */}
        <div className="mt-12 pt-8 border-t border-cream/10 flex flex-col sm:flex-row items-center justify-between gap-4">
          <p className="text-xs text-cream/40">
            © {new Date().getFullYear()} Little Loom. All rights reserved.
          </p>
          <div className="flex items-center gap-3">
            <span className="text-xs text-cream/40">We accept</span>
            <div className="flex items-center gap-2">
              {['VISA', 'MC', 'UPI', 'RuPay'].map((method) => (
                <span
                  key={method}
                  className="px-2 py-1 text-[10px] font-medium text-cream/50 border border-cream/15 rounded"
                >
                  {method}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
