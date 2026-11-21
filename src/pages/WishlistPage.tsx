import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Sparkles } from 'lucide-react';
import { useStore } from '../useStore';
import { useCatalog } from '../lib/catalog';
import type { Product } from '../types';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';
import { departments } from '../data/storeNavigation';

export default function WishlistPage() {
  const { products } = useCatalog();
  const { wishlist, addToCart } = useStore();
  const wishlistedProducts = products.filter((product) => wishlist.includes(product.id));

  const handleQuickAdd = (product: Product) => {
    const variant = product.variants?.find((item) => item.available);
    if (product.variants?.length && !variant) return;
    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: variant?.price ?? product.price,
      image: product.images[0],
      color: variant?.colour ?? product.colors[0]?.name ?? 'Standard',
      size: variant?.size ?? product.sizes[0] ?? 'Standard',
      quantity: 1,
      variantId: variant?.id,
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-14 min-h-[70vh]">
      <Breadcrumbs items={[{ label: 'Home', href: '/' }, { label: 'My Saved Wishlist' }]} />

      <div className="mt-6 flex flex-col md:flex-row md:items-end justify-between gap-4 pb-6 border-b border-charcoal/10">
        <div>
          <span className="text-xs uppercase tracking-[0.24em] font-semibold text-clay flex items-center gap-1.5">
            <Sparkles size={13} /> Saved Curations
          </span>
          <h1 className="mt-2 font-serif text-3xl sm:text-5xl font-light text-charcoal">
            My <span className="italic">Wishlist</span>
          </h1>
        </div>
        <p className="text-xs uppercase tracking-wider text-charcoal-light font-medium">
          {wishlistedProducts.length} saved piece{wishlistedProducts.length !== 1 ? 's' : ''}
        </p>
      </div>

      {wishlistedProducts.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-20 rounded-3xl bg-white border border-charcoal/10 shadow-xs max-w-2xl mx-auto p-8">
          <div className="w-16 h-16 rounded-full bg-ivory border border-charcoal/10 flex items-center justify-center mb-4">
            <Heart size={26} className="text-charcoal-light" />
          </div>
          <h2 className="font-serif text-2xl text-charcoal mb-2">No Saved Favorites Yet</h2>
          <p className="text-sm text-charcoal-soft mb-8 max-w-md leading-relaxed">
            Tap the heart icon on any piece while exploring Jewellery, Suits & Fabrics, Home Textiles, or Little Loom to curate your personal collection here.
          </p>

          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-charcoal-light mb-4">
            Discover Our Departments
          </p>
          <div className="flex flex-wrap gap-2.5 justify-center mb-6">
            {departments.map((d) => (
              <Link
                key={d.id}
                to={d.landingPath}
                className="px-4 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl border border-charcoal/15 bg-ivory text-charcoal hover:border-charcoal hover:bg-white transition-all"
              >
                {d.brand}
              </Link>
            ))}
          </div>

          <Link to="/shop">
            <Button variant="primary" size="md">
              Browse Complete Flagship <ArrowRight size={14} />
            </Button>
          </Link>
        </div>
      ) : (
        <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} onQuickAdd={handleQuickAdd} />
          ))}
        </div>
      )}
    </div>
  );
}
