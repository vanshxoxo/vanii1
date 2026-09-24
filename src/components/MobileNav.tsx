import { X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { useEffect } from 'react';

export default function MobileNav() {
  const { isMobileNavOpen, closeMobileNav } = useStore();

  useEffect(() => {
    if (isMobileNavOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileNavOpen]);

  if (!isMobileNavOpen) return null;

  const navLinks = [
    { label: 'New In', href: '/shop?filter=new' },
    { label: 'Clothing', href: '/shop' },
    { label: 'Shop by Age', href: '/#shop-by-age' },
    { label: 'Collections', href: '/shop' },
    { label: 'Our Story', href: '/#brand-story' },
  ];

  const ageLinks = [
    { label: 'Newborn (0–3M)', href: '/shop?age=Newborn' },
    { label: 'Baby (3–12M)', href: '/shop?age=Baby' },
    { label: 'Toddler (1–2Y)', href: '/shop?age=Toddler' },
    { label: 'Little Kids (2–4Y)', href: '/shop?age=Little+Kids' },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={closeMobileNav}
      />
      <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-cream animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink/10">
          <span className="font-serif text-xl font-medium">Little Loom</span>
          <button onClick={closeMobileNav} aria-label="Close menu" className="p-2 -mr-2">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-6">
          <ul className="flex flex-col gap-1">
            {navLinks.map((link) => (
              <li key={link.label}>
                <Link
                  to={link.href}
                  onClick={closeMobileNav}
                  className="flex items-center justify-between py-3.5 text-base font-medium text-ink border-b border-ink/5"
                >
                  {link.label}
                  <ChevronRight size={18} className="text-ink-light" />
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-6">
            <p className="text-xs font-semibold uppercase tracking-wider text-ink-light mb-3">Shop by Age</p>
            <ul className="flex flex-col gap-1">
              {ageLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    onClick={closeMobileNav}
                    className="block py-2.5 text-sm text-ink-soft hover:text-ink"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mt-6 flex flex-col gap-3">
            <Link to="/wishlist" onClick={closeMobileNav} className="text-sm text-ink-soft hover:text-ink">
              Wishlist
            </Link>
            <Link to="/account" onClick={closeMobileNav} className="text-sm text-ink-soft hover:text-ink">
              Account
            </Link>
          </div>
        </nav>
      </div>
    </div>
  );
}
