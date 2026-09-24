import { Link, useLocation } from 'react-router-dom';
import { Search, User, Heart, ShoppingBag, Menu } from 'lucide-react';
import { useStore } from '../store';
import { useEffect, useState } from 'react';

export default function Header() {
  const { cartCount, wishlist, openCart, openSearch, openMobileNav, cartPulse } = useStore();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener('scroll', onScroll);
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const navLinks = [
    { label: 'New In', href: '/shop?filter=new' },
    { label: 'Clothing', href: '/shop' },
    { label: 'Shop by Age', href: '/#shop-by-age' },
    { label: 'Collections', href: '/shop' },
    { label: 'Our Story', href: '/#brand-story' },
  ];

  const isActive = (href: string) => {
    if (href.includes('#')) return false;
    return location.pathname === href.split('?')[0];
  };

  return (
    <>
      {/* Announcement bar */}
      <div className="bg-ink text-cream py-2.5 overflow-hidden">
        <div className="flex animate-marquee whitespace-nowrap">
          {Array.from({ length: 6 }).map((_, i) => (
            <span key={i} className="mx-8 text-xs tracking-[0.15em] uppercase font-light">
              Little outfits for life's biggest little adventures
            </span>
          ))}
        </div>
      </div>

      {/* Main header */}
      <header
        className={`sticky top-0 z-40 bg-cream/95 backdrop-blur-md border-b transition-all duration-300 ${
          scrolled ? 'border-ink/10 shadow-sm' : 'border-ink/8'
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 lg:h-20">
            {/* Mobile menu button */}
            <button
              onClick={openMobileNav}
              aria-label="Open menu"
              className="lg:hidden p-2 -ml-2 text-ink hover:scale-110 transition-transform"
            >
              <Menu size={22} />
            </button>

            {/* Logo */}
            <Link to="/" className="flex items-center lg:items-baseline lg:flex-1 group">
              <span className="font-serif text-2xl lg:text-3xl font-medium tracking-tight text-ink transition-transform group-hover:scale-[1.02] origin-left">
                Little Loom
              </span>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-8 flex-1 justify-center">
              {navLinks.map((link) => (
                <Link
                  key={link.label}
                  to={link.href}
                  className={`text-sm font-medium transition-colors hover:text-peach relative group ${
                    isActive(link.href) ? 'text-peach' : 'text-ink'
                  }`}
                >
                  {link.label}
                  <span
                    className={`absolute -bottom-1 left-0 right-0 h-0.5 bg-peach rounded-full transition-all duration-300 ${
                      isActive(link.href) ? 'opacity-100 scale-x-100' : 'opacity-0 scale-x-0 group-hover:opacity-100 group-hover:scale-x-100'
                    }`}
                  />
                </Link>
              ))}
            </nav>

            {/* Actions */}
            <div className="flex items-center gap-1 sm:gap-3 lg:flex-1 justify-end">
              <button
                onClick={openSearch}
                aria-label="Search"
                className="p-2 text-ink hover:text-peach hover:scale-110 transition-all"
              >
                <Search size={20} />
              </button>
              <Link
                to="/account"
                aria-label="Account"
                className="p-2 text-ink hover:text-peach hover:scale-110 transition-all hidden sm:block"
              >
                <User size={20} />
              </Link>
              <Link
                to="/wishlist"
                aria-label="Wishlist"
                className="p-2 text-ink hover:text-peach hover:scale-110 transition-all relative hidden sm:block"
              >
                <Heart size={20} />
                {wishlist.length > 0 && (
                  <span className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-peach text-[9px] font-bold text-white animate-bounce-in">
                    {wishlist.length}
                  </span>
                )}
              </Link>
              <button
                onClick={openCart}
                aria-label="Shopping bag"
                className="p-2 text-ink hover:text-peach hover:scale-110 transition-all relative"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && (
                  <span
                    key={cartPulse}
                    className="absolute -right-0.5 -top-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-peach text-[9px] font-bold text-white animate-pulse-badge"
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
