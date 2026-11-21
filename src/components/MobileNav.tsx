import { X, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../useStore';
import { useEffect } from 'react';
import { useCatalog } from '../lib/catalog';

export default function MobileNav() {
  const { isMobileNavOpen, closeMobileNav } = useStore();
  const { ages } = useCatalog();

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

  const departmentLinks = [
    { label: 'Shop All Products', href: '/shop', icon: '✨' },
    { label: 'Shop Jewellery', href: '/shop?department=jewellery', icon: '💎' },
    { label: "Shop Women's Suits", href: '/shop?department=women_suits', icon: '👗' },
    { label: 'Shop Home Textiles', href: '/shop?department=home_textiles', icon: '🛏️' },
    { label: "Shop Children's Clothing", href: '/shop?department=kids', icon: '🧸' },
  ];

  const navLinks = [
    { label: 'Latest Arrivals', href: '/shop?filter=new' },
    { label: 'Collections', href: '/shop' },
    { label: 'Our World', href: '/#brand-story' },
  ];

  const ageLinks = ages.length > 0 ? ages.map((age) => ({ id: age.id, label: age.label })) : [
    { id: 'Newborn', label: 'Newborn' }, { id: 'Baby', label: 'Baby' },
    { id: 'Toddler', label: 'Toddler' }, { id: 'Little Kids', label: 'Little Kids' },
  ];

  return (
    <div className="fixed inset-0 z-50 lg:hidden">
      <div
        className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in"
        onClick={closeMobileNav}
      />
      <div className="absolute left-0 top-0 bottom-0 w-[85%] max-w-sm bg-cream animate-slide-in-right flex flex-col">
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink/10">
          <div className="flex items-baseline gap-1.5">
            <span className="font-serif text-xl font-medium">Little Loom</span>
            <span className="text-[10px] uppercase font-bold text-clay tracking-wider">· VJ</span>
          </div>
          <button onClick={closeMobileNav} aria-label="Close menu" className="p-2 -mr-2">
            <X size={22} />
          </button>
        </div>

        <nav className="flex-1 overflow-y-auto px-5 py-6">
          <div className="mb-4">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-light mb-2">Shop Departments</p>
            <ul className="flex flex-col gap-1">
              {departmentLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    onClick={closeMobileNav}
                    className="flex items-center justify-between py-2.5 text-sm font-semibold text-ink border-b border-ink/5 hover:text-clay transition"
                  >
                    <span className="flex items-center gap-2">
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </span>
                    <ChevronRight size={16} className="text-ink-light" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div className="mb-4 pt-2">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-light mb-2">Explore</p>
            <ul className="flex flex-col gap-1">
              {navLinks.map((link) => (
                <li key={link.label}>
                  <Link
                    to={link.href}
                    onClick={closeMobileNav}
                    className="flex items-center justify-between py-2 text-sm text-ink-soft hover:text-ink"
                  >
                    {link.label}
                    <ChevronRight size={16} className="text-ink-light" />
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {ageLinks.length > 0 && <div className="mt-4 pt-3 border-t border-ink/5">
            <p className="text-[11px] font-bold uppercase tracking-wider text-ink-light mb-2">Kids Age Groups</p>
            <ul className="flex flex-col gap-1">
              {ageLinks.map((age) => (
                <li key={age.id}>
                  <Link
                    to={`/shop?department=kids&age=${encodeURIComponent(age.id)}`}
                    onClick={closeMobileNav}
                    className="block py-1.5 text-xs text-ink-soft hover:text-ink"
                  >
                    {age.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>}

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
