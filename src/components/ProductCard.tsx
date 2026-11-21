import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatINR } from '../data';
import { useStore } from '../useStore';
import { Heart, ShoppingBag } from 'lucide-react';
import { resolveDepartment } from '../data/storeNavigation';

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const { toggleWishlist, isWishlisted } = useStore();
  const wished = isWishlisted(product.id);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  const dept = (product.department || product.productType || 'kids');
  const deptInfo = resolveDepartment(dept);

  return (
    <div className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-charcoal/8 hover:border-charcoal/25 transition-all duration-300 hover:shadow-md">
      {/* Media Container */}
      <div className="relative overflow-hidden bg-ivory aspect-[4/5]">
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          <img
            src={product.images[0]}
            srcSet={product.imageSrcSets?.[0] || undefined}
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
            alt={product.imageAltTexts?.[0] || product.name}
            loading="lazy"
            className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
          />

          {product.images[1] && (
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <img
                src={product.images[1]}
                srcSet={product.imageSrcSets?.[1] || undefined}
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                alt={product.imageAltTexts?.[1] || `${product.name} alternate view`}
                loading="lazy"
                className="h-full w-full object-cover"
              />
            </div>
          )}
        </Link>

        {/* Top Badges */}
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1 items-start pointer-events-none">
          {deptInfo && (
            <span
              className="px-2 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider shadow-2xs"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                color: deptInfo.accentText,
                border: `1px solid ${deptInfo.accentBorder}`,
              }}
            >
              {deptInfo.brand}
            </span>
          )}

          {hasDiscount && (
            <span className="bg-charcoal text-ivory px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider">
              Sale
            </span>
          )}
        </div>

        {/* Wishlist Button */}
        <button
          onClick={(e) => {
            e.preventDefault();
            toggleWishlist(product.id, product.name);
          }}
          aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
          className={`absolute right-2.5 top-2.5 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-200 shadow-2xs ${
            wished
              ? 'bg-clay text-white'
              : 'bg-white/90 text-charcoal hover:bg-white hover:text-clay'
          }`}
        >
          <Heart size={14} fill={wished ? 'currentColor' : 'none'} />
        </button>

        {/* Quick Add Button */}
        {onQuickAdd && (
          <button
            onClick={(e) => {
              e.preventDefault();
              onQuickAdd(product);
            }}
            className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 bg-charcoal/95 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory opacity-100 translate-y-0 transition-all duration-300 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 focus-visible:opacity-100 hover:bg-charcoal"
          >
            <ShoppingBag size={13} />
            Quick Add
          </button>
        )}
      </div>

      {/* Info Section */}
      <div className="p-3.5 sm:p-4 flex flex-col flex-1 justify-between gap-2">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-charcoal-light">
            {product.category}
          </p>
          <h3 className="font-serif text-sm sm:text-base font-normal text-charcoal leading-snug line-clamp-1 mt-0.5">
            <Link to={`/product/${product.slug}`} className="hover:text-clay transition-colors">
              {product.name}
            </Link>
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-charcoal/5">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-charcoal">{formatINR(product.price)}</span>
            {hasDiscount && (
              <span className="text-xs text-charcoal-light line-through">
                {formatINR(product.originalPrice!)}
              </span>
            )}
          </div>

          {/* Color swatches */}
          {product.colors.length > 0 && (
            <div className="flex items-center gap-1">
              {product.colors.slice(0, 4).map((color) => (
                <span
                  key={color.name}
                  className="h-2 w-2 rounded-full border border-charcoal/15"
                  style={{ backgroundColor: color.hex }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[9px] text-charcoal-light font-medium">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
