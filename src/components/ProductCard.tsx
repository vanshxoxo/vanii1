import { Link } from 'react-router-dom';
import type { Product } from '../types';
import { formatINR } from '../data';
import { useStore } from '../useStore';
import { Heart, ShoppingBag, Sparkles } from 'lucide-react';
import { resolveDepartment } from '../data/storeNavigation';
import { useState } from 'react';

interface ProductCardProps {
  product: Product;
  onQuickAdd?: (product: Product) => void;
}

export default function ProductCard({ product, onQuickAdd }: ProductCardProps) {
  const { toggleWishlist, isWishlisted } = useStore();
  const wished = isWishlisted(product.id);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const [imageError, setImageError] = useState(false);

  const dept = product.department || product.productType || 'kids';
  const deptInfo = resolveDepartment(dept);

  return (
    <div className="group flex flex-col h-full bg-white rounded-2xl overflow-hidden border border-espresso/10 hover:border-espresso/30 transition-all duration-300 hover:shadow-lg">
      {/* Media Container with Department Micro-Interactions */}
      <div className={`relative overflow-hidden bg-linen aspect-[4/5] ${
        dept === 'jewellery' ? 'jewellery-glint' : dept === 'women_suits' ? 'textile-glide' : ''
      }`}>
        <Link to={`/product/${product.slug}`} className="block h-full w-full">
          {product.images?.[0] && !imageError ? (
            <img
              src={product.images[0]}
              srcSet={product.imageSrcSets?.[0] || undefined}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              alt={product.imageAltTexts?.[0] || product.name}
              loading="lazy"
              onError={() => setImageError(true)}
              className="h-full w-full object-cover transition-transform duration-700 ease-out group-hover:scale-105"
            />
          ) : (
            <div className="h-full w-full flex flex-col items-center justify-center p-4 bg-linen text-center">
              <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white text-espresso-soft mb-2 shadow-xs">
                <Sparkles size={16} />
              </span>
              <p className="font-serif text-xs text-espresso-soft font-medium">{product.name}</p>
              <p className="text-[10px] text-espresso-light uppercase tracking-wider mt-1">{deptInfo?.brand || 'VJ Collection'}</p>
            </div>
          )}

          {product.images?.[1] && !imageError && (
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
        <div className="absolute left-3 top-3 flex flex-col gap-1 items-start pointer-events-none">
          {deptInfo && (
            <span
              className="px-2.5 py-0.5 rounded-full text-[9px] font-semibold uppercase tracking-wider shadow-xs"
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
            <span className="bg-espresso text-ivory px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs">
              Special
            </span>
          )}

          {/* Stock Status Badge */}
          {product.inStock ? (
            <span className="bg-emerald-700/90 text-white px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs">
              In Stock
            </span>
          ) : (
            <span className="bg-espresso/85 text-ivory px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider shadow-xs">
              Out of Stock
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
          className={`absolute right-3 top-3 flex h-8 w-8 items-center justify-center rounded-full transition-all duration-300 shadow-xs ${
            wished
              ? 'bg-terracotta text-white scale-110'
              : 'bg-white/90 text-espresso hover:bg-white hover:text-terracotta'
          }`}
        >
          <Heart size={14} fill={wished ? 'currentColor' : 'none'} />
        </button>

        {/* Quick Add Button or Out of Stock indicator */}
        {product.inStock ? (
          onQuickAdd && (
            <button
              onClick={(e) => {
                e.preventDefault();
                onQuickAdd(product);
              }}
              className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1.5 bg-espresso/95 py-2.5 text-xs font-semibold uppercase tracking-wider text-ivory opacity-100 translate-y-0 transition-all duration-300 sm:opacity-0 sm:translate-y-2 sm:group-hover:opacity-100 sm:group-hover:translate-y-0 focus-visible:opacity-100 hover:bg-forest"
            >
              <ShoppingBag size={13} />
              <span>Quick Bag</span>
            </button>
          )
        ) : (
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center gap-1 bg-espresso/80 py-2 text-[10px] font-bold uppercase tracking-wider text-ivory/80 select-none">
            <span>Out of Stock</span>
          </div>
        )}
      </div>

      {/* Info Section */}
      <div className="p-4 flex flex-col flex-1 justify-between gap-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-wider font-semibold text-espresso-light">
            {product.category}
          </p>
          <h3 className="font-serif text-sm sm:text-base font-normal text-espresso leading-snug line-clamp-1 mt-0.5">
            <Link to={`/product/${product.slug}`} className="hover:text-forest transition-colors">
              {product.name}
            </Link>
          </h3>
        </div>

        <div className="flex items-center justify-between pt-2.5 border-t border-espresso/8">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-espresso">{formatINR(product.price)}</span>
            {hasDiscount && (
              <span className="text-xs text-espresso-light line-through">
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
                  className="h-2.5 w-2.5 rounded-full border border-espresso/15 shadow-2xs"
                  style={{ backgroundColor: color.hex || '#E5E5E5' }}
                  title={color.name}
                />
              ))}
              {product.colors.length > 4 && (
                <span className="text-[9px] text-espresso-light font-medium">+{product.colors.length - 4}</span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
