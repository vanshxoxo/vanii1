import { createContext, useContext, useEffect, useState, useCallback, type ReactNode } from 'react';
import type { CartItem } from './types';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'wishlist';
}

interface StoreContextValue {
  cart: CartItem[];
  wishlist: string[];
  toasts: Toast[];
  isCartOpen: boolean;
  isSearchOpen: boolean;
  isMobileNavOpen: boolean;
  cartCount: number;
  cartTotal: number;
  cartPulse: number;
  addToCart: (item: CartItem) => void;
  updateCartQuantity: (productId: string, color: string, size: string, quantity: number) => void;
  removeFromCart: (productId: string, color: string, size: string) => void;
  toggleWishlist: (productId: string, productName?: string) => void;
  isWishlisted: (productId: string) => boolean;
  openCart: () => void;
  closeCart: () => void;
  openSearch: () => void;
  closeSearch: () => void;
  openMobileNav: () => void;
  closeMobileNav: () => void;
  dismissToast: (id: number) => void;
}

const StoreContext = createContext<StoreContextValue | undefined>(undefined);

const CART_KEY = 'littleloom_cart';
const WISHLIST_KEY = 'littleloom_wishlist';

function loadFromStorage<T>(key: string, fallback: T): T {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch {
    // ignore
  }
  return fallback;
}

let toastId = 0;

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => loadFromStorage(CART_KEY, []));
  const [wishlist, setWishlist] = useState<string[]>(() => loadFromStorage(WISHLIST_KEY, []));
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartPulse, setCartPulse] = useState(0);

  useEffect(() => {
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    localStorage.setItem(WISHLIST_KEY, JSON.stringify(wishlist));
  }, [wishlist]);

  const pushToast = useCallback((message: string, type: Toast['type'] = 'success') => {
    const id = ++toastId;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToCart = useCallback((item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.productId === item.productId && i.color === item.color && i.size === item.size
      );
      if (existing) {
        return prev.map((i) =>
          i.productId === item.productId && i.color === item.color && i.size === item.size
            ? { ...i, quantity: i.quantity + item.quantity }
            : i
        );
      }
      return [...prev, item];
    });
    setCartPulse((p) => p + 1);
    pushToast(`${item.name} added to bag`, 'success');
    setIsCartOpen(true);
  }, [pushToast]);

  const updateCartQuantity = useCallback((productId: string, color: string, size: string, quantity: number) => {
    if (quantity <= 0) {
      setCart((prev) => prev.filter((i) => !(i.productId === productId && i.color === color && i.size === size)));
      return;
    }
    setCart((prev) =>
      prev.map((i) =>
        i.productId === productId && i.color === color && i.size === size
          ? { ...i, quantity }
          : i
      )
    );
  }, []);

  const removeFromCart = useCallback((productId: string, color: string, size: string) => {
    setCart((prev) => prev.filter((i) => !(i.productId === productId && i.color === color && i.size === size)));
  }, []);

  const toggleWishlist = useCallback((productId: string, productName?: string) => {
    setWishlist((prev) => {
      if (prev.includes(productId)) {
        pushToast(`${productName || 'Item'} removed from wishlist`, 'wishlist');
        return prev.filter((id) => id !== productId);
      }
      pushToast(`${productName || 'Item'} saved to wishlist`, 'wishlist');
      return [...prev, productId];
    });
  }, [pushToast]);

  const isWishlisted = useCallback((productId: string) => wishlist.includes(productId), [wishlist]);

  const cartCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartTotal = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const value: StoreContextValue = {
    cart,
    wishlist,
    toasts,
    isCartOpen,
    isSearchOpen,
    isMobileNavOpen,
    cartCount,
    cartTotal,
    cartPulse,
    addToCart,
    updateCartQuantity,
    removeFromCart,
    toggleWishlist,
    isWishlisted,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
    openSearch: () => setIsSearchOpen(true),
    closeSearch: () => setIsSearchOpen(false),
    openMobileNav: () => setIsMobileNavOpen(true),
    closeMobileNav: () => setIsMobileNavOpen(false),
    dismissToast,
  };

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore() {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error('useStore must be used within StoreProvider');
  return ctx;
}
