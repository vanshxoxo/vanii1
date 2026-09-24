import { X, ShoppingBag, Plus, Minus, Trash2 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useStore } from '../store';
import { formatINR } from '../data';
import { useEffect } from 'react';
import Button from './Button';

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

  if (!isCartOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={closeCart} />
      <div className="relative w-full max-w-md bg-cream animate-drawer-in flex flex-col shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-ink/10 shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingBag size={18} className="text-ink" />
            <span className="text-sm font-semibold text-ink">
              Your Bag ({cart.reduce((s, i) => s + i.quantity, 0)})
            </span>
          </div>
          <button
            onClick={closeCart}
            aria-label="Close cart"
            className="p-2 -mr-2 text-ink hover:text-peach hover:rotate-90 transition-all duration-300"
          >
            <X size={22} />
          </button>
        </div>

        {/* Items */}
        {cart.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center px-8 text-center gap-4 animate-scale-in">
            <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center">
              <ShoppingBag size={28} className="text-ink-light" />
            </div>
            <div>
              <p className="font-serif text-xl text-ink mb-1">Your bag is empty</p>
              <p className="text-sm text-ink-soft">Let's find some little outfits.</p>
            </div>
            <Link to="/shop" onClick={closeCart}>
              <Button variant="primary" size="md">Start Shopping</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto custom-scroll px-5 py-4">
              <ul className="flex flex-col gap-4">
                {cart.map((item, i) => (
                  <li
                    key={`${item.productId}-${item.color}-${item.size}`}
                    className="flex gap-3 animate-slide-up-fade"
                    style={{ animationDelay: `${i * 0.06}s` }}
                  >
                    <Link to={`/product/${item.slug}`} onClick={closeCart} className="shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="h-24 w-20 rounded-lg object-cover"
                      />
                    </Link>
                    <div className="flex flex-col flex-1 min-w-0">
                      <div className="flex justify-between gap-2">
                        <Link
                          to={`/product/${item.slug}`}
                          onClick={closeCart}
                          className="text-sm font-medium text-ink hover:text-peach truncate transition-colors"
                        >
                          {item.name}
                        </Link>
                        <button
                          onClick={() => removeFromCart(item.productId, item.color, item.size)}
                          aria-label="Remove item"
                          className="text-ink-light hover:text-peach shrink-0 transition-all hover:scale-110"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                      <p className="text-xs text-ink-light mt-0.5">
                        {item.color} · Size {item.size}
                      </p>
                      <div className="flex items-center justify-between mt-auto">
                        <div className="flex items-center border border-ink/15 rounded-md">
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.color, item.size, item.quantity - 1)
                            }
                            aria-label="Decrease quantity"
                            className="p-1.5 text-ink hover:text-peach transition-colors active:scale-90"
                          >
                            <Minus size={14} />
                          </button>
                          <span className="px-2 text-sm font-medium tabular-nums">{item.quantity}</span>
                          <button
                            onClick={() =>
                              updateCartQuantity(item.productId, item.color, item.size, item.quantity + 1)
                            }
                            aria-label="Increase quantity"
                            className="p-1.5 text-ink hover:text-peach transition-colors active:scale-90"
                          >
                            <Plus size={14} />
                          </button>
                        </div>
                        <span className="text-sm font-semibold text-ink">
                          {formatINR(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Footer */}
            <div className="border-t border-ink/10 px-5 py-4 shrink-0 space-y-3 animate-slide-up">
              <div className="flex items-center justify-between">
                <span className="text-sm text-ink-soft">Subtotal</span>
                <span className="text-base font-semibold text-ink">{formatINR(cartTotal)}</span>
              </div>
              <p className="text-xs text-ink-light">
                Shipping and taxes calculated at checkout. This is a demo store — no payment will be processed.
              </p>
              <Link to="/checkout" onClick={closeCart} className="block">
                <Button variant="primary" size="lg" className="w-full group">
                  Proceed to Checkout
                  <ShoppingBag size={16} className="transition-transform group-hover:rotate-12" />
                </Button>
              </Link>
              <button
                onClick={closeCart}
                className="w-full text-center text-sm text-ink-soft hover:text-ink transition-colors"
              >
                Continue Shopping
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
