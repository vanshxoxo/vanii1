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
import type { Department } from '../types';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import { resolveDepartment } from '../data/storeNavigation';

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
  const related = products
    .filter((item) => item.id !== product.id && item.category === product.category)
    .concat(products.filter((item) => item.id !== product.id && item.category !== product.category))
    .slice(0, 4);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  const availableDefaultColor = product.colors.find((color) =>
    product.variants?.some((variant) => variant.colour === color.name && variant.available)
  )?.name;
  const chosenColor = selectedColor || availableDefaultColor || product.colors[0]?.name;
  const chosenSize = selectedSize || product.sizes[0];
  const selectedVariant = product.variants?.find((variant) => variant.colour === chosenColor && variant.size === chosenSize);
  const displayPrice = selectedVariant?.price ?? product.price;

  const productDept: Department = (product.department || product.productType || 'kids') as Department;
  const deptInfo = resolveDepartment(productDept);
  const specs = product.specifications;

  const isJewellery = productDept === 'jewellery';
  const isWomenSuits = productDept === 'women_suits';
  const isHomeTextiles = productDept === 'home_textiles';
  const isKids = productDept === 'kids' || !productDept;

  const sizeLabel = isJewellery
    ? (product.category.toLowerCase().includes('ring') || specs?.jewellery?.ringSize ? 'Ring Size' : 'Option / Style')
    : isWomenSuits
      ? 'Suit Cut / Length'
      : isHomeTextiles
        ? 'Bed Size / Dimensions'
        : 'Size';

  const handleAddToCart = () => {
    const newErrors: { color?: string; size?: string } = {};
    if (product.colors.length > 1 && !selectedColor) {
      newErrors.color = 'Please select an option';
    }
    if (product.sizes.length > 1 && !selectedSize) {
      newErrors.size = `Please select a ${sizeLabel.toLowerCase()}`;
    }
    if (product.variants?.length && (!selectedVariant || !selectedVariant.available)) {
      newErrors.size = 'This option combination is currently unavailable';
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
            ...(deptInfo ? [{ label: deptInfo.brand, href: `/shop?department=${deptInfo.id}` }] : []),
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
              <div className="flex items-center gap-2 mb-2">
                {deptInfo && (
                  <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-ink-light">
                    {deptInfo.brand} ·
                  </span>
                )}
                <span className="text-xs font-semibold uppercase tracking-wider text-peach">
                  {product.category}
                </span>
              </div>
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
                  {isJewellery ? 'Finish / Tone' : 'Colour'}{' '}
                  {selectedColor && <span className="text-ink-light font-normal">· {selectedColor}</span>}
                </label>
              </div>
              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => {
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
                })}
              </div>
              {errors.color && <p className="mt-1.5 text-xs text-peach animate-slide-down">{errors.color}</p>}
            </div>

            {/* Size / Cut / Dimension selector */}
            <div style={fadeInStyle(0.2)}>
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-sm font-medium text-ink">
                  {sizeLabel}{' '}
                  {selectedSize && <span className="text-ink-light font-normal">· {selectedSize}</span>}
                </label>
                {isKids && (
                  <Link to="/size-guide" className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors">
                    <Ruler size={14} /> Size Guide
                  </Link>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const disabled = Boolean(product.variants?.length) && !product.variants?.some((variant) => variant.size === size && (!chosenColor || variant.colour === chosenColor) && variant.available);
                  return (
                    <button
                      key={size}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedSize(size);
                        setErrors((prev) => ({ ...prev, size: undefined }));
                      }}
                      className={`min-w-[3rem] px-3.5 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-ink bg-ink text-cream scale-105 shadow-sm'
                          : 'border-ink/15 text-ink-soft hover:border-ink/40 hover:scale-105'
                      } ${disabled ? 'cursor-not-allowed opacity-30 line-through' : ''}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {errors.size && <p className="mt-1.5 text-xs text-peach animate-slide-down">{errors.size}</p>}
            </div>

            {/* Quantity */}
            <div style={fadeInStyle(0.25)}>
              <label className="text-sm font-medium text-ink mb-2.5 block">Quantity</label>
              <div className="inline-flex items-center border border-ink/15 rounded-lg bg-white/50">
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

            {/* Dynamic Department Accordions */}
            <div className="mt-2 border-t border-ink/8" style={fadeInStyle(0.4)}>
              {/* Product Description */}
              <Accordion
                title="Product Description"
                isOpen={openSection === 'description'}
                onToggle={() => setOpenSection(openSection === 'description' ? null : 'description')}
              >
                <p className="text-sm text-ink-soft leading-relaxed">{product.description}</p>
              </Accordion>

              {/* Jewellery Specifications */}
              {isJewellery && (specs?.jewellery || product.fabric || product.care) && (
                <Accordion
                  title="Jewellery Specifications & Care"
                  isOpen={openSection === 'jewellery-specs'}
                  onToggle={() => setOpenSection(openSection === 'jewellery-specs' ? null : 'jewellery-specs')}
                >
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                    {(specs?.jewellery?.material || product.fabric) && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Base Material</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs?.jewellery?.material || product.fabric}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.plating && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Plating / Finish</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.jewellery.plating}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.pieceCount && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Set Pieces</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.jewellery.pieceCount} Pieces Included</dd>
                      </div>
                    )}
                    {specs?.jewellery?.setContents && (
                      <div className="sm:col-span-2">
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Contents</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.jewellery.setContents}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.earringType && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Earring Style</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.jewellery.earringType}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.closureType && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Closure Type</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.jewellery.closureType}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.ringSize && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Ring Fit</dt>
                        <dd className="font-medium text-ink mt-0.5">
                          {specs.jewellery.ringSize} ({specs.jewellery.isAdjustable ? 'Adjustable Size' : 'Fixed Size'})
                        </dd>
                      </div>
                    )}
                    {(specs?.jewellery?.care || product.care) && (
                      <div className="sm:col-span-2 mt-1 pt-2 border-t border-ink/5">
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Care & Handling</dt>
                        <dd className="text-ink-soft mt-0.5 leading-relaxed">{specs?.jewellery?.care || product.care}</dd>
                      </div>
                    )}
                  </dl>
                </Accordion>
              )}

              {/* Women's Unstitched Suits Specifications */}
              {isWomenSuits && (specs?.womenSuits || product.fabric || product.care) && (
                <Accordion
                  title="Fabric Details & Cut Measurements"
                  isOpen={openSection === 'suits-specs'}
                  onToggle={() => setOpenSection(openSection === 'suits-specs' ? null : 'suits-specs')}
                >
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                    {(specs?.womenSuits?.fabricType || product.fabric) && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Fabric Quality</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs?.womenSuits?.fabricType || product.fabric}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.pattern && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Weave & Pattern</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.womenSuits.pattern}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.piecesIncluded && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Pieces Included</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.womenSuits.piecesIncluded}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.topLength && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Top (Kurta) Fabric</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.womenSuits.topLength} {specs.womenSuits.lengthUnit || 'meters'}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.bottomLength && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Bottom Fabric</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.womenSuits.bottomLength} {specs.womenSuits.lengthUnit || 'meters'}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.dupattaIncluded !== undefined && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Dupatta Included</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.womenSuits.dupattaIncluded ? 'Yes' : 'No'}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.dupattaIncluded && (specs?.womenSuits?.dupattaFabric || specs?.womenSuits?.dupattaLength) && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Dupatta Specifications</dt>
                        <dd className="font-medium text-ink mt-0.5">
                          {[specs.womenSuits.dupattaFabric, specs.womenSuits.dupattaLength ? `${specs.womenSuits.dupattaLength} ${specs.womenSuits.dupattaUnit || specs.womenSuits.lengthUnit || 'meters'}` : null].filter(Boolean).join(' · ')}
                        </dd>
                      </div>
                    )}
                    {(specs?.womenSuits?.washCare || product.care) && (
                      <div className="sm:col-span-2 mt-1 pt-2 border-t border-ink/5">
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Wash & Care</dt>
                        <dd className="text-ink-soft mt-0.5 leading-relaxed">{specs?.womenSuits?.washCare || product.care}</dd>
                      </div>
                    )}
                  </dl>
                </Accordion>
              )}

              {/* Home Textiles Specifications */}
              {isHomeTextiles && (specs?.homeTextiles || product.fabric || product.care) && (
                <Accordion
                  title="Bedding Dimensions & Specifications"
                  isOpen={openSection === 'textiles-specs'}
                  onToggle={() => setOpenSection(openSection === 'textiles-specs' ? null : 'textiles-specs')}
                >
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2.5 text-sm">
                    {specs?.homeTextiles?.productType && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Product Classification</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.homeTextiles.productType}</dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.bedSize && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Bed Size</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.homeTextiles.bedSize}</dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.length && specs?.homeTextiles?.width && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Dimensions (Confirmed Unit)</dt>
                        <dd className="font-medium text-ink mt-0.5">
                          {specs.homeTextiles.length} × {specs.homeTextiles.width} {specs.homeTextiles.dimensionUnit || 'inches'}
                        </dd>
                      </div>
                    )}
                    {(specs?.homeTextiles?.fabric || product.fabric) && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Fabric Purity</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs?.homeTextiles?.fabric || product.fabric}</dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.design && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Design / Print</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.homeTextiles.design}</dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.pillowCoversCount !== undefined && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Pillow Covers</dt>
                        <dd className="font-medium text-ink mt-0.5">
                          {specs.homeTextiles.pillowCoversCount} Included
                          {specs.homeTextiles.pillowCoverDimensions ? ` (${specs.homeTextiles.pillowCoverDimensions})` : ''}
                        </dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.packQuantity && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Pack Quantity</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.homeTextiles.packQuantity} Pack</dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.closureType && (
                      <div>
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Closure Type</dt>
                        <dd className="font-medium text-ink mt-0.5">{specs.homeTextiles.closureType}</dd>
                      </div>
                    )}
                    {product.care && (
                      <div className="sm:col-span-2 mt-1 pt-2 border-t border-ink/5">
                        <dt className="text-xs uppercase tracking-wider text-ink-light">Care & Laundering</dt>
                        <dd className="text-ink-soft mt-0.5 leading-relaxed">{product.care}</dd>
                      </div>
                    )}
                  </dl>
                </Accordion>
              )}

              {/* Kids Clothing Fabric & Care */}
              {isKids && (product.fabric || product.care) && (
                <Accordion
                  title="Fabric & Care"
                  isOpen={openSection === 'fabric'}
                  onToggle={() => setOpenSection(openSection === 'fabric' ? null : 'fabric')}
                >
                  <div className="space-y-3 text-sm text-ink-soft">
                    {product.fabric && (
                      <div>
                        <span className="font-medium text-ink">Fabric: </span>
                        {product.fabric}
                      </div>
                    )}
                    {product.care && (
                      <div>
                        <span className="font-medium text-ink">Care: </span>
                        {product.care}
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {/* Kids Garment Measurements */}
              {isKids && product.sizeMeasurements?.trim() && (
                <Accordion
                  title="Garment measurements"
                  isOpen={openSection === 'measurements'}
                  onToggle={() => setOpenSection(openSection === 'measurements' ? null : 'measurements')}
                >
                  <p className="whitespace-pre-line text-sm leading-relaxed text-ink-soft">{product.sizeMeasurements}</p>
                </Accordion>
              )}
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
        className="flex w-full items-center justify-between py-4 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-sm font-medium text-ink group-hover:text-peach transition-colors">{title}</span>
        <ChevronDown
          size={18}
          className={`text-ink-light transition-transform duration-300 ${isOpen ? 'rotate-180 text-peach' : ''}`}
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
