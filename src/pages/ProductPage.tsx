import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Ruler,
  ChevronDown,
  ArrowRight,
} from 'lucide-react';
import { formatINR } from '../data';
import { useCatalog } from '../lib/catalog';
import { useStore } from '../useStore';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const { products, loading: catalogLoading } = useCatalog();
  const product = products.find((item) => item.slug === slug);

  const { addToCart, toggleWishlist, isWishlisted } = useStore();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<{ color?: string; size?: string }>({});
  const [openSection, setOpenSection] = useState<string | null>('description');
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setActiveImage(0);
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
    setErrors({});
  }, [slug]);

  if (!product && catalogLoading) {
    return <div className="mx-auto max-w-7xl px-4 py-24 text-center text-sm text-ink-soft">Loading product…</div>;
  }
  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-serif text-3xl text-ink mb-4">Product unavailable</h1>
        <p className="text-sm text-ink-soft mb-6">This product is not currently published.</p>
        <Button variant="primary" onClick={() => navigate('/shop')}>
          Back to Shop
        </Button>
      </div>
    );
  }

  const wished = isWishlisted(product.id);
  const related = products.filter((item) => item.id !== product.id && item.category === product.category).concat(products.filter((item) => item.id !== product.id && item.category !== product.category)).slice(0, 4);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;
  const availableDefaultColor = product.colors.find((color) =>
    product.variants?.some((variant) => variant.colour === color.name && variant.available)
  )?.name;
  const chosenColor = selectedColor || availableDefaultColor || product.colors[0]?.name;
  const chosenSize = selectedSize || product.sizes[0];
  const selectedVariant = product.variants?.find((variant) => variant.colour === chosenColor && variant.size === chosenSize);
  const displayPrice = selectedVariant?.price ?? product.price;

  const handleAddToCart = () => {
    const newErrors: { color?: string; size?: string } = {};
    if (product.colors.length > 1 && !selectedColor) {
      newErrors.color = 'Please select a color';
    }
    if (product.sizes.length > 1 && !selectedSize) {
      newErrors.size = 'Please select a size';
    }
    if (product.variants?.length && (!selectedVariant || !selectedVariant.available)) {
      newErrors.size = 'This size and colour combination is currently unavailable';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: displayPrice,
      image: product.images[0],
      color: chosenColor,
      size: chosenSize,
      quantity,
      variantId: selectedVariant?.id,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const fadeInStyle = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(20px)',
    transition: `all 0.5s ease-out ${delay}s`,
  });

  return (
    <div className="min-h-screen">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        <Breadcrumbs
          items={[
            { label: 'Shop', href: '/shop' },
            { label: product.category, href: `/shop?category=${encodeURIComponent(product.category)}` },
            { label: product.name },
          ]}
        />

        <div className="mt-6 grid lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Gallery */}
          <div className="flex flex-col-reverse lg:flex-row gap-4" style={fadeInStyle(0)}>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex lg:flex-col gap-2 lg:gap-3 overflow-x-auto no-scrollbar lg:overflow-visible">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`shrink-0 h-16 w-14 lg:h-20 lg:w-16 overflow-hidden rounded-lg border-2 transition-all duration-300 ${
                      activeImage === i ? 'border-ink scale-105' : 'border-transparent opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={img} alt={product.imageAltTexts?.[i] || `${product.name} view ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
            {/* Main image */}
            <div className="flex-1 relative overflow-hidden rounded-2xl bg-cream/60 group">
              <div className="aspect-[4/5] relative">
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    srcSet={product.imageSrcSets?.[i] || undefined}
                    sizes="(max-width: 1024px) 100vw, 60vw"
                    alt={product.imageAltTexts?.[i] || product.name}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      activeImage === i ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
              </div>
              {hasDiscount && (
                <span className="absolute top-4 left-4 bg-peach px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-white rounded animate-slide-down">
                  Sale
                </span>
              )}
            </div>
          </div>

          {/* Details */}
          <div className="flex flex-col gap-5 lg:py-2">
            <div style={fadeInStyle(0.1)}>
              <p className="text-xs font-semibold uppercase tracking-wider text-peach mb-2">
                {product.category}
              </p>
              <h1 className="font-serif text-3xl lg:text-4xl font-light text-ink leading-tight">
                {product.name}
              </h1>
              <div className="mt-3 flex items-center gap-3">
                <span className="text-2xl font-medium text-ink">{formatINR(displayPrice)}</span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-ink-light line-through">
                      {formatINR(product.originalPrice!)}
                    </span>
                    <span className="text-xs font-semibold text-peach">
                      Save {formatINR(product.originalPrice! - product.price)}
                    </span>
                  </>
                )}
              </div>
            </div>

            {/* Color selector */}
            <div style={fadeInStyle(0.15)}>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-sm font-medium text-ink">
                  Color {selectedColor && <span className="text-ink-light font-normal">· {selectedColor}</span>}
                </label>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => (
                  (() => {
                    const disabled = Boolean(product.variants?.length) && !product.variants?.some((variant) => variant.colour === color.name && variant.available);
                    return (
                  <button
                    key={color.name}
                    disabled={disabled}
                    onClick={() => {
                      setSelectedColor(color.name);
                      if (selectedSize && product.variants?.length && !product.variants.some((variant) => variant.colour === color.name && variant.size === selectedSize && variant.available)) setSelectedSize(null);
                      setErrors((prev) => ({ ...prev, color: undefined }));
                    }}
                    aria-label={color.name}
                    className={`relative h-9 w-9 rounded-full border-2 transition-all duration-200 ${
                      chosenColor === color.name
                        ? 'border-ink ring-2 ring-ink/15 scale-110'
                        : 'border-ink/10 hover:border-ink/30 hover:scale-105'
                    } ${disabled ? 'cursor-not-allowed opacity-30' : ''}`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
                    );
                  })()
                ))}
              </div>
              {errors.color && <p className="mt-1.5 text-xs text-peach animate-slide-down">{errors.color}</p>}
            </div>

            {/* Size selector */}
            <div style={fadeInStyle(0.2)}>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-sm font-medium text-ink">
                  Size {selectedSize && <span className="text-ink-light font-normal">· {selectedSize}</span>}
                </label>
                <Link to="/size-guide" className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors">
                  <Ruler size={14} /> Size Guide
                </Link>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  (() => {
                    const disabled = Boolean(product.variants?.length) && !product.variants?.some((variant) => variant.size === size && (!chosenColor || variant.colour === chosenColor) && variant.available);
                    return (
                  <button
                    key={size}
                    disabled={disabled}
                    onClick={() => {
                      setSelectedSize(size);
                      setErrors((prev) => ({ ...prev, size: undefined }));
                    }}
                    className={`min-w-[3rem] px-3 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
                      selectedSize === size
                        ? 'border-ink bg-ink text-cream scale-105'
                        : 'border-ink/15 text-ink-soft hover:border-ink/40 hover:scale-105'
                    } ${disabled ? 'cursor-not-allowed opacity-30 line-through' : ''}`}
                  >
                    {size}
                  </button>
                    );
                  })()
                ))}
              </div>
              {errors.size && <p className="mt-1.5 text-xs text-peach animate-slide-down">{errors.size}</p>}
            </div>

            {/* Quantity */}
            <div style={fadeInStyle(0.25)}>
              <label className="text-sm font-medium text-ink mb-2.5 block">Quantity</label>
              <div className="inline-flex items-center border border-ink/15 rounded-lg">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-2.5 text-ink hover:text-peach disabled:opacity-30 transition-all active:scale-90"
                  disabled={quantity <= 1}
                >
                  <Minus size={16} />
                </button>
                <span className="px-4 text-sm font-medium tabular-nums">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="p-2.5 text-ink hover:text-peach transition-all active:scale-90"
                  disabled={quantity >= 99}
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 mt-2" style={fadeInStyle(0.3)}>
              <Button
                variant="primary"
                size="lg"
                className="flex-1 group"
                onClick={handleAddToCart}
                disabled={Boolean(product.variants?.length) && !product.inStock}
              >
                <ShoppingBag size={18} className={addedFeedback ? 'animate-wiggle' : ''} />
                {addedFeedback ? 'Added to Bag!' : 'Add to Bag'}
              </Button>
              <button
                onClick={() => toggleWishlist(product.id, product.name)}
                aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`flex h-12 w-12 items-center justify-center rounded-lg border transition-all duration-300 ${
                  wished
                    ? 'border-peach bg-peach text-white scale-105'
                    : 'border-ink/15 text-ink hover:border-ink/30 hover:scale-105'
                }`}
              >
                <Heart
                  size={20}
                  fill={wished ? 'currentColor' : 'none'}
                  className={wished ? 'animate-wiggle' : ''}
                />
              </button>
            </div>


            {/* Accordions */}
            <div className="mt-2 border-t border-ink/8" style={fadeInStyle(0.4)}>
              <Accordion
                title="Product Description"
                isOpen={openSection === 'description'}
                onToggle={() => setOpenSection(openSection === 'description' ? null : 'description')}
              >
                <p className="text-sm text-ink-soft leading-relaxed">{product.description}</p>
              </Accordion>
              <Accordion
                title="Fabric & Care"
                isOpen={openSection === 'fabric'}
                onToggle={() => setOpenSection(openSection === 'fabric' ? null : 'fabric')}
              >
                <div className="space-y-3 text-sm text-ink-soft">
                  <div>
                    <span className="font-medium text-ink">Fabric: </span>
                    {product.fabric}
                  </div>
                  <div>
                    <span className="font-medium text-ink">Care: </span>
                    {product.care}
                  </div>
                </div>
              </Accordion>
              {product.sizeMeasurements?.trim() && <Accordion
                title="Garment measurements"
                isOpen={openSection === 'measurements'}
                onToggle={() => setOpenSection(openSection === 'measurements' ? null : 'measurements')}
              >
                <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{product.sizeMeasurements}</p>
              </Accordion>}
            </div>
          </div>
        </div>

        {/* Related products */}
        {related.length > 0 && (
          <div className="mt-16 lg:mt-24">
            <Reveal>
              <div className="flex items-end justify-between gap-4 mb-8">
                <h2 className="font-serif text-2xl lg:text-3xl font-light text-ink">
                  You may also <span className="italic">like</span>
                </h2>
                <Link
                  to={`/shop?category=${encodeURIComponent(product.category)}`}
                  className="text-sm text-ink-soft hover:text-ink flex items-center gap-1 transition-colors"
                >
                  More in {product.category} <ArrowRight size={14} />
                </Link>
              </div>
            </Reveal>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 100}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Size guide modal */}
    </div>
  );
}

function Accordion({
  title,
  children,
  isOpen,
  onToggle,
}: {
  title: string;
  children: React.ReactNode;
  isOpen: boolean;
  onToggle: () => void;
}) {
  return (
    <div className="border-b border-ink/8">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-ink">{title}</span>
        <ChevronDown
          size={18}
          className={`text-ink-light transition-transform duration-300 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        <div>
          <div className="pb-4">{children}</div>
        </div>
      </div>
    </div>
  );
}
