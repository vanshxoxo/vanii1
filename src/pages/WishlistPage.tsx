import { Link } from 'react-router-dom';
import { Heart } from 'lucide-react';
import { useStore } from '../store';
import { products } from '../data';
import ProductCard from '../components/ProductCard';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';

export default function WishlistPage() {
  const { wishlist } = useStore();
  const wishlistedProducts = products.filter((p) => wishlist.includes(p.id));

  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8 lg:py-12">
      <Breadcrumbs items={[{ label: 'Wishlist' }]} />
      <h1 className="mt-4 font-serif text-3xl lg:text-4xl font-light text-ink">
        My <span className="italic">Wishlist</span>
      </h1>

      {wishlistedProducts.length === 0 ? (
        <div className="mt-12 flex flex-col items-center justify-center text-center py-16">
          <div className="w-16 h-16 rounded-full bg-ink/5 flex items-center justify-center mb-4">
            <Heart size={28} className="text-ink-light" />
          </div>
          <h2 className="font-serif text-xl text-ink mb-2">No favorites yet</h2>
          <p className="text-sm text-ink-soft mb-6">
            Tap the heart on any product to save it here.
          </p>
          <Link to="/shop">
            <Button variant="primary" size="md">Browse the Collection</Button>
          </Link>
        </div>
      ) : (
        <div className="mt-8 grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          {wishlistedProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}
    </div>
  );
}
