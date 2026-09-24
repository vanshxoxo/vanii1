import { Link } from 'react-router-dom';
import { ShoppingBag, ArrowRight, Lock } from 'lucide-react';
import { useStore } from '../store';
import { formatINR } from '../data';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';

export default function CheckoutPage() {
  const { cart, cartTotal } = useStore();

  if (cart.length === 0) {
    return (
      <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mx-auto mb-6">
          <ShoppingBag size={28} className="text-ink-light" />
        </div>
        <h1 className="font-serif text-3xl font-light text-ink mb-3">Your bag is empty</h1>
        <p className="text-sm text-ink-soft mb-6">Add some little outfits before checking out.</p>
        <Link to="/shop">
          <Button variant="primary" size="lg">
            Browse the Collection
            <ArrowRight size={16} />
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Checkout' }]} />
      <h1 className="mt-4 font-serif text-3xl lg:text-4xl font-light text-ink">Checkout</h1>

      <div className="mt-8 p-6 lg:p-8 bg-cream rounded-2xl border border-ink/8 text-center">
        <div className="w-14 h-14 rounded-full bg-butter flex items-center justify-center mx-auto mb-4">
          <Lock size={24} className="text-ink" />
        </div>
        <h2 className="font-serif text-xl text-ink mb-2">Checkout coming soon</h2>
        <p className="text-sm text-ink-soft max-w-md mx-auto leading-relaxed">
          This is a demo store. Payment processing and order fulfillment are not yet connected.
          A real Indian payment gateway and shipping integration will be added here.
        </p>
      </div>

      {/* Order summary */}
      <div className="mt-6 border border-ink/10 rounded-2xl overflow-hidden">
        <div className="px-5 py-4 border-b border-ink/10 bg-ink/[0.02]">
          <h2 className="text-sm font-semibold text-ink">Order Summary</h2>
        </div>
        <ul className="divide-y divide-ink/8">
          {cart.map((item) => (
            <li key={`${item.productId}-${item.color}-${item.size}`} className="flex gap-4 px-5 py-4">
              <img src={item.image} alt={item.name} className="h-16 w-14 rounded-lg object-cover" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-ink truncate">{item.name}</p>
                <p className="text-xs text-ink-light mt-0.5">
                  {item.color} · Size {item.size} · Qty {item.quantity}
                </p>
              </div>
              <span className="text-sm font-semibold text-ink">{formatINR(item.price * item.quantity)}</span>
            </li>
          ))}
        </ul>
        <div className="px-5 py-4 border-t border-ink/10 space-y-2">
          <div className="flex justify-between text-sm text-ink-soft">
            <span>Subtotal</span>
            <span>{formatINR(cartTotal)}</span>
          </div>
          <div className="flex justify-between text-sm text-ink-soft">
            <span>Shipping</span>
            <span>{cartTotal >= 1490 ? 'Free' : formatINR(99)}</span>
          </div>
          <div className="flex justify-between text-base font-semibold text-ink pt-2 border-t border-ink/8">
            <span>Total</span>
            <span>{formatINR(cartTotal + (cartTotal >= 1490 ? 0 : 99))}</span>
          </div>
        </div>
      </div>

      <div className="mt-6 flex justify-between gap-4">
        <Link to="/shop">
          <Button variant="ghost" size="md">Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
