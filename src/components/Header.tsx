import { Link, useLocation } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu } from 'lucide-react';
import { useStore } from '../useStore';
import { useEffect, useState } from 'react';
import { useCmsSection } from '../lib/cms';

export default function Header() {
  const { cartCount, wishlist, openCart, openSearch, openMobileNav, cartPulse } = useStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const announcement = useCmsSection('announcement');

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'Latest', href: '/shop?filter=new' },
    { label: 'Shop', href: '/shop' },
    { label: 'By Age', href: '/#shop-by-age' },
    { label: 'Collections', href: '/shop' },
    { label: 'Our World', href: '/#brand-story' },
  ];

  const isActive = (href: string) => {
    if (href.includes('#')) return false;
    return location.pathname === href.split('?')[0];
  };

  return (
    <>
      {/* Announcement bar — slim, dark, centered */}
      <div role="region" aria-label="Announcement" className="announcement-bar bg-charcoal text-ivory">
        <div className="announcement-track" aria-hidden="true">
          {[0, 1].map((copy) => (
            <span key={copy} className="announcement-message">
              {announcement?.heading || "LITTLE OUTFITS FOR LIFE'S BIGGEST LITTLE ADVENTURES"}
            </span>
          ))}
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-40 bg-ivory/95 backdrop-blur-md transition-all duration-300 ${
          scrolled ? 'border-b border-border shadow-sm' : 'border-b border-border/50'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14 lg:h-16">
            {/* Left: mobile menu + wordmark */}
            <div className="flex items-center gap-3 lg:flex-1">
              <button
                onClick={openMobileNav}
                aria-label="Open menu"
                className="lg:hidden min-h-11 min-w-11 -ml-2 inline-flex items-center justify-center text-charcoal hover:text-clay transition-colors"
              >
                <Menu size={22} />
              </button>
              <Link to="/" className="group">
                <span className="font-serif text-xl lg:text-2xl font-medium tracking-tight text-charcoal transition-colors group-hover:text-clay">
                  Little Loom
                </span>
              </Link>
            </div>

            {/* Center: desktop nav — one line, never wraps */}
            <nav className="hidden lg:flex items-center gap-5 xl:gap-7">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-[13px] font-medium tracking-wide whitespace-nowrap transition-colors hover:text-clay relative group focus-visible:outline focus-visible:outline-1 focus-visible:outline-offset-4 ${
                    isActive(link.href) ? 'text-clay' : 'text-charcoal'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1.5 left-0 right-0 h-px bg-clay transition-all duration-300 ${
                      isActive(link.href)
                        ? 'opacity-100 scale-x-100'
                        : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              ))}
            </nav>

            {/* Right: actions */}
            <div className="flex items-center gap-0.5 sm:gap-1 lg:flex-1 justify-end">
              <button
                onClick={openSearch}
                aria-label="Search"
                className="min-h-11 min-w-11 inline-flex items-center justify-center text-charcoal hover:text-clay transition-colors"
              >
                <Search size={19} />
              </button>
              <Link
                to="/account"
                aria-label="Account"
                className="min-h-11 min-w-11 inline-flex items-center justify-center text-charcoal hover:text-clay transition-colors hidden sm:flex"
              >
                <User size={19} />
              </Link>
              <Link
                to="/wishlist"
                aria-label="Wishlist"
                className="min-h-11 min-w-11 inline-flex items-center justify-center text-charcoal hover:text-clay transition-colors relative hidden sm:flex"
              >
                <Heart size={19} />
                {wishlist.length > 0 && (
                  <span className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-clay text-[8px] font-bold text-white">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <button
                onClick={openCart}
                aria-label="Shopping bag"
                className="min-h-11 min-w-11 inline-flex items-center justify-center text-charcoal hover:text-clay transition-colors relative"
              >
                <ShoppingBag size={19} />
                {cartCount > 0 && (
                  <span
                    key={cartPulse}
                    className="absolute right-0.5 top-0.5 flex h-3.5 w-3.5 items-center justify-center rounded-full bg-clay text-[8px] font-bold text-white animate-pulse-badge"
                  >
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>
      </header>
    </>
  );
}
