import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatINR } from '../data';
import { useStore } from '../store';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const { toggleWishlist, isWishlisted } = useStore();
  const wished = isWishlisted(product.id);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  return (
    <div className="group flex flex-col">
      <div className="relative overflow-hidden bg-ivory">
        <Link to={`/product/${product.slug}`} className="block">
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          </div>
          {product.images[1] && (
            <div className="aspect-[3/4] overflow-hidden absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <img
                src={product.images[1]}
                alt={`${product.name} alternate view`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </Link>

        {/* Sale badge only — restrained */}
        {hasDiscount && (
          <span className="absolute left-0 top-0 bg-charcoal px-2.5 py-1 text-[10px] font-medium uppercase tracking-wider text-ivory">
            Sale
          </span>
        )}

        {/* Wishlist */}
        <button
          onClick={() => toggleWishlist(product.id, product.name)}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 ${
            wished
              ? 'bg-clay text-white'
              : 'bg-ivory/80 text-charcoal opacity-0 group-hover:opacity-100 hover:bg-ivory'
          }`}
        >
          <Heart size={15} fill={wished ? 'currentColor' : 'none'} />
        </button>

        {/* Quick add */}
        {onQuickAdd && (
          <button
            onClick={() => onQuickAdd(product)}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-2 bg-charcoal/95 py-3 text-xs font-medium text-ivory opacity-0 translate-y-2 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 hover:bg-charcoal"
          >
            Quick Add
          </button>
        )}
      </div>

      {/* Info — restrained, editorial */}
      <div className="mt-2.5 flex flex-col gap-0.5">
        <p className="text-[11px] text-charcoal-light tracking-wide">{product.category}</p>
        <h3 className="text-[13px] font-medium text-charcoal leading-snug">
          <Link to={`/product/${product.slug}`} className="hover:text-clay transition-colors">
            {product.name}
          </Link>
        </h3>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-[13px] font-medium text-charcoal">{formatINR(product.price)}</span>
          {hasDiscount && (
            <span className="text-xs text-charcoal-light line-through">{formatINR(product.originalPrice!)}</span>
          )}
        </div>
        {/* Color swatches */}
        <div className="mt-1 flex items-center gap-1">
          {product.colors.map((color) => (
            <span
              key={color.name}
              className="h-2.5 w-2.5 rounded-full border border-border"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
