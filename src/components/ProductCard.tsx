import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatINR } from '../data';
import { useStore } from '../store';
import { Heart, Plus } from 'lucide-react';

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
      <div className="relative overflow-hidden rounded-lg bg-cream/60 transition-shadow duration-300 group-hover:shadow-lg">
        <Link to={`/product/${product.slug}`} className="block">
          <div className="aspect-[3/4] overflow-hidden">
            <img
              src={product.images[0]}
              alt={product.name}
              loading="lazy"
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-110"
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

        {/* Badges */}
        <div className="absolute left-3 top-3 flex flex-col gap-1.5">
          {product.isNew && (
            <span className="bg-butter px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-ink rounded animate-slide-down">
              New
            </span>
          )}
          {hasDiscount && (
            <span className="bg-peach px-2.5 py-1 text-[10px] font-semibold uppercase tracking-wider text-white rounded animate-slide-down" style={{ animationDelay: '0.1s' }}>
              Sale
            </span>
          )}
        </div>

        {/* Wishlist */}
        <button
          onClick={() => toggleWishlist(product.id, product.name)}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full transition-all duration-300 ${
            wished
              ? 'bg-peach text-white scale-100'
              : 'bg-white/80 text-ink opacity-0 group-hover:opacity-100 hover:bg-white hover:scale-110'
          }`}
        >
          <Heart
            size={16}
            fill={wished ? 'currentColor' : 'none'}
            className={wished ? 'animate-wiggle' : ''}
          />
        </button>

        {/* Quick add */}
        {onQuickAdd && (
          <button
            onClick={() => onQuickAdd(product)}
            className="absolute bottom-3 left-3 right-3 flex items-center justify-center gap-2 bg-ink py-2.5 text-xs font-medium text-white opacity-0 translate-y-3 transition-all duration-300 group-hover:opacity-100 group-hover:translate-y-0 rounded hover:bg-ink/90 active:scale-95"
          >
            <Plus size={14} />
            Quick Add
          </button>
        )}
      </div>

      {/* Info */}
      <div className="mt-3 flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-medium text-ink leading-tight">
            <Link to={`/product/${product.slug}`} className="hover:text-peach transition-colors">
              {product.name}
            </Link>
          </h3>
        </div>
        <p className="text-xs text-ink-light">{product.category}</p>
        <div className="mt-0.5 flex items-center gap-2">
          <span className="text-sm font-semibold text-ink">{formatINR(product.price)}</span>
          {hasDiscount && (
            <span className="text-xs text-ink-light line-through">{formatINR(product.originalPrice!)}</span>
          )}
        </div>
        {/* Color dots */}
        <div className="mt-1.5 flex items-center gap-1.5">
          {product.colors.map((color) => (
            <span
              key={color.name}
              className="h-3 w-3 rounded-full border border-ink/10 transition-transform hover:scale-125"
              style={{ backgroundColor: color.hex }}
              title={color.name}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
