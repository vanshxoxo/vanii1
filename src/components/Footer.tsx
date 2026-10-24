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
    <footer className="bg-charcoal text-ivory mt-16">
      {/* Newsletter — compact */}
      <div className="border-b border-ivory/10">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
          <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="max-w-sm">
              <h3 className="font-serif text-xl lg:text-2xl font-light leading-tight">
                Little notes, big little joy.
              </h3>
              <p className="mt-1.5 text-[13px] text-ivory/50 leading-relaxed">
                Join our list for early access to new arrivals and stories from the Little Loom world.
              </p>
            </div>
            <form onSubmit={handleSubscribe} className="w-full lg:w-auto lg:min-w-[360px]">
              <div className="flex flex-col sm:flex-row gap-2.5">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Your email address"
                  className="flex-1 px-4 py-2.5 bg-transparent border border-ivory/20 text-[13px] text-ivory placeholder-ivory/40 focus:border-ivory/50 outline-none transition-colors"
                  aria-label="Email address"
                />
                <button
                  type="submit"
                  className="px-5 py-2.5 bg-ivory text-charcoal text-[13px] font-medium hover:bg-ivory/90 transition-colors whitespace-nowrap"
                >
                  Subscribe
                </button>
              </div>
              {error && <p className="mt-2 text-xs text-clay">{error}</p>}
              {subscribed && (
                <p className="mt-2 text-xs text-ivory/60">
                  You're on the list! Welcome to the Little Loom family. (Demo confirmation)
                </p>
              )}
            </form>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10 lg:py-12">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-10">
          <div className="lg:col-span-1">
            <Link to="/" className="font-serif text-xl font-medium text-ivory">
              Little Loom
            </Link>
            <p className="mt-2.5 text-[13px] text-ivory/45 leading-relaxed max-w-xs">
              Tiny outfits. Big little energy. Premium kidswear for newborns to 4 years.
            </p>
            <a
              href="#"
              aria-label="Instagram"
              className="mt-3.5 inline-flex items-center gap-2 text-[13px] text-ivory/55 hover:text-ivory transition-colors"
              onClick={(e) => e.preventDefault()}
            >
              <Instagram size={16} />
              <span>@littleloom</span>
            </a>
          </div>

          {footerSections.map((section) => (
            <div key={section.title}>
              <h4 className="text-[11px] font-medium uppercase tracking-wider text-ivory/35 mb-3.5">
                {section.title}
              </h4>
              <ul className="flex flex-col gap-2">
                {section.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      to={link.href}
                      className="text-[13px] text-ivory/65 hover:text-ivory transition-colors"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="mt-10 pt-6 border-t border-ivory/10 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-ivory/35">
            © {new Date().getFullYear()} Little Loom. All rights reserved.
          </p>
          <div className="flex items-center gap-2">
            {['VISA', 'MC', 'UPI', 'RuPay'].map((method) => (
              <span
                key={method}
                className="px-2 py-1 text-[10px] font-medium text-ivory/40 border border-ivory/15"
              >
                {method}
              </span>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
