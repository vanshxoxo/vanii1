import { X, ShoppingBag, Plus, Minus, Trash2, ArrowRight, Truck, ShieldCheck } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../useStore';
import { formatINR } from '../data';
import { useEffect } from 'react';
import Button from './Button';

const FREE_SHIPPING_THRESHOLD = 1999;

export default function CartDrawer() {
  const { cart, isCartOpen, closeCart, updateCartQuantity, removeFromCart, cartTotal } = useStore();

  useEffect(() => {
    if (isCartOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isCartOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeCart();
    };
    if (isCartOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCartOpen, closeCart]);

  if (!isCartOpen) return null;

  const totalItemCount = cart.reduce((s, i) => s + i.quantity, 0);
  const freeShippingQualified = cartTotal >= FREE_SHIPPING_THRESHOLD;
  const remainingForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - cartTotal);
  const shippingProgress = Math.min(100, Math.round((cartTotal / FREE_SHIPPING_THRESHOLD) * 100));

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-espresso/60 backdrop-blur-sm animate-fade-in"
        onClick={closeCart}
        aria-hidden="true"
      />

      {/* Drawer Panel */}
      <div className="relative w-full max-w-md bg-[#F6F2E9] animate-drawer-in flex flex-col shadow-2xl border-l border-espresso/15">
        {/* Drawer Header */}
        <div className="flex items-center justify-between px-6 h-18 border-b border-espresso/10 bg-white">
          <div className="flex items-center gap-2.5">
            <ShoppingBag size={18} className="text-espresso" />
            <span className="font-serif text-lg font-medium text-espresso">
              Shopping Bag ({totalItemCount})
            </span>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="p-2 -mr-2 text-espresso hover:text-terracotta transition-colors min-h-11 min-w-11 inline-flex items-center justify-center"
          >
            <X size={22} />
          </button>
        </div>

        {/* Free Shipping Progress Bar */}
        {cart.length > 0 && (
          <div className="px-6 py-3.5 bg-[#F8F4EC] border-b border-[#E5D6BD]/80 text-xs text-espresso">
            <div className="flex items-center justify-between font-medium">
              <span className="flex items-center gap-1.5">
                <Truck size={14} className="text-forest" />
                {freeShippingQualified ? (
                  <span className="font-semibold text-forest">
                    Complimentary Insured Shipping Unlocked!
                  </span>
                ) : (
                  <span>
                    Add <strong className="text-espresso">{formatINR(remainingForFreeShipping)}</strong> for Complimentary Pan-India Shipping
                  </span>
                )}
              </span>
              <span className="font-bold text-espresso">{shippingProgress}%</span>
            </div>
            <div className="mt-2 h-1.5 w-full rounded-full bg-espresso/10 overflow-hidden">
              <div
                className="h-full bg-forest transition-all duration-500 rounded-full"
                style={{ width: `${shippingProgress}%` }}
              />
            </div>
          </div>
        )}

        {/* Cart Items List */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-white border border-espresso/10 flex items-center justify-center shadow-xs">
              <ShoppingBag size={28} className="text-espresso-light" />
            </div>
            <div>
              <p className="font-serif text-2xl text-espresso font-light mb-1">Your Bag is Empty</p>
              <p className="text-xs text-espresso-soft max-w-xs mx-auto leading-relaxed">
                Discover our curated pieces across Fine Jewellery, Unstitched Suits, Living Bedding, and Little Loom.
              </p>
            </div>
            <Link to="/shop" onClick={closeCart} className="mt-2">
              <Button variant="forest" size="md">
                Explore Collections
              </Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto custom-scroll px-6 py-5">
              <ul className="flex flex-col gap-4">
                {cart.map((item, i) => (
                  <li
                    key={`${item.productId}-${item.color}-${item.size}`}
                    className="flex gap-4 p-3.5 rounded-2xl bg-white border border-espresso/8 shadow-xs animate-slide-up-fade"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    <Link to={`/product/${item.slug}`} onClick={closeCart} className="shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-20 rounded-xl object-cover bg-linen border border-espresso/6"
                      />
                    </Link>

                    <div className="flex flex-col flex-1 min-w-0 justify-between">
                      <div>
                        <div className="flex justify-between items-start gap-2">
                          <Link
                            to={`/product/${item.slug}`}
                            onClick={closeCart}
                            className="font-serif text-sm font-medium text-espresso hover:text-forest truncate transition-colors"
                          >
                            {item.name}
                          </Link>
                          <button
                            onClick={() => removeFromCart(item.productId, item.color, item.size)}
                            aria-label="Remove item"
                            className="text-espresso-light hover:text-terracotta transition-all p-1"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                        <p className="text-[11px] text-espresso-light mt-0.5">
                          {item.color} &middot; Option: {item.size}
                        </p>
                      </div>

                      <div className="flex items-center justify-between pt-2 mt-2 border-t border-espresso/6">
                        <div className="flex items-center border border-espresso/15 rounded-lg bg-linen">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.color, item.size, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="p-1.5 text-espresso hover:text-terracotta transition-colors active:scale-90"
                          >
                            <Minus size={13} />
                          </button>
                          <span className="px-2 text-xs font-semibold tabular-nums text-espresso">
                            {item.quantity}
                          </span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.color, item.size, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            disabled={item.quantity >= 99}
                            className="p-1.5 text-espresso hover:text-terracotta disabled:cursor-not-allowed disabled:opacity-40 transition-colors active:scale-90"
                          >
                            <Plus size={13} />
                          </button>
                        </div>

                        <span className="text-sm font-semibold text-espresso">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer Summary & Checkout CTA */}
            <div className="border-t border-espresso/10 px-6 py-5 bg-white shrink-0 space-y-3.5 shadow-lg">
              <div className="flex items-center justify-between">
                <span className="text-xs uppercase tracking-wider font-semibold text-espresso-soft">Subtotal</span>
                <span className="font-serif text-2xl font-light text-espresso">{formatINR(cartTotal)}</span>
              </div>
              <p className="text-[11px] text-espresso-light leading-relaxed">
                Pan-India insured shipping and taxes calculated securely at checkout.
              </p>

              <Link to="/checkout" onClick={closeCart} className="block">
                <Button variant="forest" size="lg" className="w-full group rounded-full py-4 shadow-sm">
                  <span>Proceed to Secure Checkout</span>
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>

              <div className="flex items-center justify-center gap-4 text-[10px] text-espresso-light pt-1">
                <span className="flex items-center gap-1"><ShieldCheck size={12} /> Insured Delivery</span>
                <span>&middot;</span>
                <span>Razorpay Encrypted</span>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
