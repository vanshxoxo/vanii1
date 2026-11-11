import { createContext, useEffect, useState, useCallback, useRef, type ReactNode } from 'react';
import type { CartItem } from './types';
import { publicMediaUrl, supabase } from './lib/supabase';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'info' | 'wishlist';
}
export interface StoreContextValue {
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
  clearCart: () => void;
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

export const StoreContext = createContext<StoreContextValue | undefined>(undefined);

let toastId = 0;

const previewCartStorageKey = 'little-loom:preview-cart:v1';
const previewWishlistStorageKey = 'little-loom:preview-wishlist:v1';

function readPreviewCart(): CartItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(previewCartStorageKey) || 'null');
    if (!Array.isArray(value)) return [];
    return value.filter((item): item is CartItem => Boolean(
      item && typeof item === 'object' && item.isPreviewOnly === true &&
      typeof item.productId === 'string' && item.productId.startsWith('preview:') &&
      typeof item.slug === 'string' && typeof item.name === 'string' &&
      Number.isFinite(item.price) && Number(item.price) >= 0 &&
      typeof item.image === 'string' && typeof item.color === 'string' &&
      typeof item.size === 'string' && Number.isFinite(item.quantity) && Number(item.quantity) > 0
    )).map((item) => ({ ...item, quantity: Math.min(99, Math.max(1, Math.floor(item.quantity))) }));
  } catch {
    return [];
  }
}

function readPreviewWishlist(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const value: unknown = JSON.parse(window.localStorage.getItem(previewWishlistStorageKey) || 'null');
    return Array.isArray(value) ? [...new Set(value.filter((id): id is string => typeof id === 'string' && /^preview:[a-z0-9-]+$/.test(id)))] : [];
  } catch {
    return [];
  }
}

export function StoreProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(readPreviewCart);
  const [wishlist, setWishlist] = useState<string[]>(readPreviewWishlist);
  const cartRef = useRef(cart);
  const wishlistRef = useRef(wishlist);
  cartRef.current = cart;
  wishlistRef.current = wishlist;
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isMobileNavOpen, setIsMobileNavOpen] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [cartPulse, setCartPulse] = useState(0);
  const [userId, setUserId] = useState<string | null>(null);
  const userIdRef = useRef<string | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);
  const activeCartId = useRef<string | null>(null);
  const skipPreviewClearSync = useRef(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      if (cart.length > 0 && cart.every((item) => item.isPreviewOnly)) {
        window.localStorage.setItem(previewCartStorageKey, JSON.stringify(cart));
      } else {
        window.localStorage.removeItem(previewCartStorageKey);
      }
    } catch {
      // The preview cart still works in memory when browser storage is disabled.
    }
  }, [cart]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      const previewItems = wishlist.filter((id) => id.startsWith('preview:'));
      if (previewItems.length) window.localStorage.setItem(previewWishlistStorageKey, JSON.stringify(previewItems));
      else window.localStorage.removeItem(previewWishlistStorageKey);
    } catch {
      // The preview wishlist still works in memory when browser storage is disabled.
    }
  }, [wishlist]);

  useEffect(() => {
    if (!supabase) return;
    const applyUser = (nextId: string | null) => {
      if (userIdRef.current && userIdRef.current !== nextId) { setCart([]); setWishlist([]); }
      userIdRef.current = nextId;
      setUserId(nextId);
    };
    void supabase.auth.getSession().then(({ data }) => applyUser(data.session?.user.id || null));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => applyUser(session?.user.id || null));
    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!supabase || !userId) { setRemoteReady(false); activeCartId.current = null; return; }
    const customerId = userId;
    let alive = true;
    setRemoteReady(false);
    async function loadCustomerState() {
      const { data: cartRow } = await supabase!.from('carts').select('id').eq('customer_id', customerId).eq('status', 'active').maybeSingle();
      let cartId = cartRow?.id as string | undefined;
      if (!cartId) {
        const { data } = await supabase!.from('carts').insert({ customer_id: customerId }).select('id').single();
        cartId = data?.id;
      }
      if (!cartId) { if (alive) setRemoteReady(true); return; }
      activeCartId.current = cartId;
      const { data: currentItems } = await supabase!.from('cart_items').select('variant_id,quantity').eq('cart_id', cartId);
      if (cartRef.current.length) {
        for (const item of cartRef.current) {
          if (!item.variantId) continue;
          const current = currentItems?.find((row: any) => row.variant_id === item.variantId);
          await supabase!.from('cart_items').upsert({ cart_id: cartId, variant_id: item.variantId, quantity: Math.min(99, item.quantity + Number(current?.quantity || 0)) }, { onConflict: 'cart_id,variant_id' });
        }
      }
      const { data: rows, error } = await supabase!.from('cart_items').select('variant_id,quantity,product_variants(size,colour,product_id,products(id,slug,name,price,product_media(display_order,media_assets(provider,delivery_url,external_url,resource_type))))').eq('cart_id', cartId);
      if (!error && alive) {
        const merged: CartItem[] = (rows || []).flatMap((row: any) => {
          const variant = row.product_variants; const product = variant?.products;
          if (!variant || !product) return [];
          const imageRow = (product.product_media || []).sort((a: any, b: any) => a.display_order - b.display_order)[0];
          const image = imageRow?.media_assets ? publicMediaUrl(imageRow.media_assets, 600) : '';
          return [{ productId: product.id, slug: product.slug, name: product.name, price: Number(product.price), image, color: variant.colour, size: variant.size, quantity: row.quantity, variantId: row.variant_id }];
        });
        const localPreviewItems = cartRef.current.filter((item) => item.isPreviewOnly);
        // Local style previews never replace or mix with the customer's saved database cart.
        setCart(localPreviewItems.length ? localPreviewItems : merged);
      }

      const { data: wishlistRow } = await supabase!.from('wishlists').upsert({ customer_id: customerId }, { onConflict: 'customer_id' }).select('id').single();
      if (wishlistRow?.id) {
        const { data: saved } = await supabase!.from('wishlist_items').select('product_id').eq('wishlist_id', wishlistRow.id);
        let ids = (saved || []).map((row: any) => row.product_id as string);
        const localPreviewWishlist = wishlistRef.current.filter((id) => id.startsWith('preview:'));
        if (wishlistRef.current.length) {
          const toAdd = wishlistRef.current.filter((id) => !id.startsWith('preview:') && !ids.includes(id));
          if (toAdd.length) await supabase!.from('wishlist_items').upsert(toAdd.map((product_id) => ({ wishlist_id: wishlistRow.id, product_id })), { onConflict: 'wishlist_id,product_id' });
          ids = [...new Set([...ids, ...wishlistRef.current.filter((id) => !id.startsWith('preview:')), ...localPreviewWishlist])];
        }
        if (alive) setWishlist(ids);
      }
      if (alive) setRemoteReady(true);
    }
    void loadCustomerState();
    return () => { alive = false; };
  }, [userId]);

  useEffect(() => {
    if (!supabase || !userId || !remoteReady) return;
    if (cart.some((item) => item.isPreviewOnly)) return;
    if (cart.length === 0 && skipPreviewClearSync.current) {
      skipPreviewClearSync.current = false;
      return;
    }
    if (cart.length > 0) skipPreviewClearSync.current = false;
    let alive = true;
    void (async () => {
      let cartId = activeCartId.current;
      const { data: existingCart } = await supabase!.from('carts').select('id').eq('customer_id', userId).eq('status', 'active').maybeSingle();
      if (existingCart?.id) cartId = existingCart.id;
      else {
        const { data: created } = await supabase!.from('carts').insert({ customer_id: userId }).select('id').single();
        cartId = created?.id || null;
      }
      if (!alive || !cartId) return;
      activeCartId.current = cartId;
      const items = cart.filter((item) => item.variantId).map((item) => ({ cart_id: cartId!, variant_id: item.variantId!, quantity: item.quantity }));
      if (items.length) await supabase!.from('cart_items').upsert(items, { onConflict: 'cart_id,variant_id' });
      const keep = items.map((item) => item.variant_id);
      const { data: existing } = await supabase!.from('cart_items').select('id,variant_id').eq('cart_id', cartId);
      const remove = (existing || []).filter((row: any) => !keep.includes(row.variant_id)).map((row: any) => row.id);
      if (remove.length) await supabase!.from('cart_items').delete().in('id', remove);
    })();
    return () => { alive = false; };
  }, [cart, userId, remoteReady]);

  useEffect(() => {
    if (!supabase || !userId || !remoteReady) return;
    void (async () => {
      const { data: row } = await supabase!.from('wishlists').upsert({ customer_id: userId }, { onConflict: 'customer_id' }).select('id').single();
      if (!row?.id) return;
      const persistentWishlist = wishlist.filter((id) => !id.startsWith('preview:'));
      if (persistentWishlist.length) await supabase!.from('wishlist_items').upsert(persistentWishlist.map((product_id) => ({ wishlist_id: row.id, product_id })), { onConflict: 'wishlist_id,product_id' });
      const { data: existing } = await supabase!.from('wishlist_items').select('product_id').eq('wishlist_id', row.id);
      const remove = (existing || []).map((item: any) => item.product_id).filter((id: string) => !persistentWishlist.includes(id));
      if (remove.length) await supabase!.from('wishlist_items').delete().eq('wishlist_id', row.id).in('product_id', remove);
    })();
  }, [wishlist, userId, remoteReady]);

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
    const isMixedCart = cartRef.current.some((current) => Boolean(current.isPreviewOnly) !== Boolean(item.isPreviewOnly));
    if (isMixedCart) {
      pushToast('Styles under review and published products use separate bags. Remove the current items before switching.', 'info');
      return;
    }
    setCart((prev) => {
      const existing = prev.find(
        (i) => i.variantId && item.variantId ? i.variantId === item.variantId : i.productId === item.productId && i.color === item.color && i.size === item.size
      );
      if (existing) {
        return prev.map((i) =>
          (i.variantId && item.variantId ? i.variantId === item.variantId : i.productId === item.productId && i.color === item.color && i.size === item.size)
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

  const clearCart = useCallback(() => {
    if (cartRef.current.some((item) => item.isPreviewOnly)) skipPreviewClearSync.current = true;
    setCart([]);
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
    clearCart,
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
