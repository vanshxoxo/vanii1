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
  ShieldCheck,
  Truck,
  RotateCcw,
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
    return (
      <div className="mx-auto max-w-7xl px-4 py-28 text-center text-sm text-espresso-light">
        Loading product details…
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-24 text-center">
        <h1 className="font-serif text-3xl text-espresso mb-4">Piece Currently Unavailable</h1>
        <p className="text-sm text-espresso-soft mb-6">
          This piece is not currently published in the catalog.
        </p>
        <Button variant="forest" onClick={() => navigate('/shop')}>
          Browse All Collections
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
    ? product.category.toLowerCase().includes('ring') || specs?.jewellery?.ringSize
      ? 'Ring Size'
      : 'Option / Style'
    : isWomenSuits
      ? 'Suit Cut / Length'
      : isHomeTextiles
        ? 'Bed Size / Dimensions'
        : 'Size';

  const handleAddToCart = () => {
    const newErrors: { color?: string; size?: string } = {};
    if (product.colors.length > 1 && !selectedColor) {
      newErrors.color = 'Please select a colour/finish option';
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
    setTimeout(() => setAddedFeedback(false), 2200);
  };

  const fadeInStyle = (delay: number) => ({
    opacity: mounted ? 1 : 0,
    transform: mounted ? 'translateY(0)' : 'translateY(16px)',
    transition: `all 0.5s ease-out ${delay}s`,
  });

  return (
    <div className="min-h-screen pb-24 lg:pb-16 bg-[#F6F2E9]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 lg:py-8">
        {/* Breadcrumb Hierarchy */}
        <Breadcrumbs
          items={[
            { label: 'Home', href: '/' },
            { label: 'Shop', href: '/shop' },
            ...(deptInfo ? [{ label: deptInfo.brand, href: deptInfo.landingPath }] : []),
            { label: product.category, href: `/shop?department=${productDept}&category=${encodeURIComponent(product.category)}` },
            { label: product.name },
          ]}
        />

        <div className="mt-8 grid lg:grid-cols-12 gap-10 lg:gap-14">
          {/* Left: Gallery Column */}
          <div className="lg:col-span-7 flex flex-col-reverse sm:flex-row gap-4" style={fadeInStyle(0)}>
            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex sm:flex-col gap-2.5 overflow-x-auto no-scrollbar sm:overflow-visible shrink-0">
                {product.images.map((img, i) => (
                  <button
                    key={i}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-16 sm:h-24 sm:w-20 rounded-xl overflow-hidden border-2 transition-all duration-200 ${
                      activeImage === i
                        ? 'border-forest scale-105 shadow-xs'
                        : 'border-transparent opacity-60 hover:opacity-100 bg-white'
                    }`}
                  >
                    <img
                      src={img}
                      alt={product.imageAltTexts?.[i] || `${product.name} view ${i + 1}`}
                      className="h-full w-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Main Stage Image */}
            <div className="flex-1 relative overflow-hidden rounded-3xl bg-white border border-espresso/10 shadow-xs group">
              <div className="aspect-[4/5] relative bg-linen">
                {product.images.map((img, i) => (
                  <img
                    key={i}
                    src={img}
                    srcSet={product.imageSrcSets?.[i] || undefined}
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    alt={product.imageAltTexts?.[i] || product.name}
                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-500 ${
                      activeImage === i ? 'opacity-100' : 'opacity-0'
                    }`}
                  />
                ))}
              </div>

              {/* Department Tag on Image */}
              {deptInfo && (
                <span
                  className="absolute top-4 left-4 rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-wider backdrop-blur-md shadow-xs"
                  style={{
                    backgroundColor: 'rgba(255, 255, 255, 0.94)',
                    color: deptInfo.accentText,
                    border: `1px solid ${deptInfo.accentBorder}`,
                  }}
                >
                  {deptInfo.brand}
                </span>
              )}
            </div>
          </div>

          {/* Right: Sticky Information Column */}
          <div className="lg:col-span-5 flex flex-col gap-6 lg:py-2">
            <div style={fadeInStyle(0.08)}>
              <div className="flex items-center gap-2 mb-2">
                <span className="text-[11px] font-semibold uppercase tracking-[0.24em] text-terracotta">
                  {deptInfo?.brand || 'VJ Collection'}
                </span>
                <span className="text-espresso-light">&middot;</span>
                <span className="text-[11px] font-medium uppercase tracking-wider text-espresso-light">
                  {product.category}
                </span>
              </div>

              <h1 className="font-serif text-3xl sm:text-4xl font-light text-espresso leading-tight">
                {product.name}
              </h1>

              {/* Pricing Display */}
              <div className="mt-4 flex items-baseline gap-3">
                <span className="text-2xl sm:text-3xl font-semibold text-espresso">
                  {formatINR(displayPrice)}
                </span>
                {hasDiscount && (
                  <>
                    <span className="text-base text-espresso-light line-through">
                      {formatINR(product.originalPrice!)}
                    </span>
                    <span className="text-xs font-semibold text-terracotta px-2 py-0.5 rounded-full bg-terracotta-soft">
                      Save {formatINR(product.originalPrice! - product.price)}
                    </span>
                  </>
                )}
              </div>
              <p className="mt-1 text-xs text-espresso-light">Inclusive of all taxes &middot; Complimentary insured shipping above ₹1,999</p>
            </div>

            {/* Colour / Finish Selector */}
            <div style={fadeInStyle(0.14)} className="pt-2 border-t border-espresso/8">
              <label className="text-xs font-semibold uppercase tracking-wider text-espresso block mb-2.5">
                {isJewellery ? 'Finish / Tone' : 'Colour'}{' '}
                {selectedColor && <span className="text-espresso-soft font-normal">&middot; {selectedColor}</span>}
              </label>

              <div className="flex flex-wrap gap-2.5">
                {product.colors.map((color) => {
                  const disabled =
                    Boolean(product.variants?.length) &&
                    !product.variants?.some((variant) => variant.colour === color.name && variant.available);
                  return (
                    <button
                      key={color.name}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedColor(color.name);
                        if (
                          selectedSize &&
                          product.variants?.length &&
                          !product.variants.some(
                            (variant) => variant.colour === color.name && variant.size === selectedSize && variant.available
                          )
                        ) {
                          setSelectedSize(null);
                        }
                        setErrors((prev) => ({ ...prev, color: undefined }));
                      }}
                      aria-label={color.name}
                      className={`relative h-9 w-9 rounded-full border-2 transition-all duration-200 ${
                        chosenColor === color.name
                          ? 'border-forest ring-2 ring-forest/25 scale-110 shadow-xs'
                          : 'border-espresso/15 hover:border-espresso/40 hover:scale-105'
                      } ${disabled ? 'cursor-not-allowed opacity-30' : ''}`}
                      style={{ backgroundColor: color.hex || '#E5E5E5' }}
                      title={color.name}
                    />
                  );
                })}
              </div>
              {errors.color && <p className="mt-1.5 text-xs text-terracotta animate-slide-down">{errors.color}</p>}
            </div>

            {/* Size / Dimension / Option Selector */}
            <div style={fadeInStyle(0.18)} className="pt-2 border-t border-espresso/8">
              <div className="flex items-center justify-between mb-2.5">
                <label className="text-xs font-semibold uppercase tracking-wider text-espresso">
                  {sizeLabel}{' '}
                  {selectedSize && <span className="text-espresso-soft font-normal">&middot; {selectedSize}</span>}
                </label>
                {isKids && (
                  <Link
                    to="/size-guide"
                    className="flex items-center gap-1.5 text-xs text-terracotta hover:text-espresso transition-colors font-medium"
                  >
                    <Ruler size={13} /> Size Guide
                  </Link>
                )}
              </div>

              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => {
                  const disabled =
                    Boolean(product.variants?.length) &&
                    !product.variants?.some(
                      (variant) => variant.size === size && (!chosenColor || variant.colour === chosenColor) && variant.available
                    );
                  return (
                    <button
                      key={size}
                      disabled={disabled}
                      onClick={() => {
                        setSelectedSize(size);
                        setErrors((prev) => ({ ...prev, size: undefined }));
                      }}
                      className={`min-w-[3.25rem] px-3.5 py-2 text-xs font-semibold uppercase tracking-wider rounded-xl border transition-all duration-200 ${
                        selectedSize === size
                          ? 'border-forest bg-forest text-ivory shadow-xs scale-105'
                          : 'border-espresso/15 text-espresso hover:border-espresso bg-white'
                      } ${disabled ? 'cursor-not-allowed opacity-30 line-through' : ''}`}
                    >
                      {size}
                    </button>
                  );
                })}
              </div>
              {errors.size && <p className="mt-1.5 text-xs text-terracotta animate-slide-down">{errors.size}</p>}
            </div>

            {/* Quantity Stepper */}
            <div style={fadeInStyle(0.22)} className="pt-2 border-t border-espresso/8">
              <label className="text-xs font-semibold uppercase tracking-wider text-espresso block mb-2">
                Quantity
              </label>
              <div className="inline-flex items-center border border-espresso/15 rounded-xl bg-white shadow-2xs">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  aria-label="Decrease quantity"
                  className="p-2.5 text-espresso hover:text-terracotta disabled:opacity-30 transition-all active:scale-90"
                  disabled={quantity <= 1}
                >
                  <Minus size={15} />
                </button>
                <span className="px-4 text-xs font-semibold tabular-nums text-espresso">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  aria-label="Increase quantity"
                  className="p-2.5 text-espresso hover:text-terracotta transition-all active:scale-90"
                  disabled={quantity >= 99}
                >
                  <Plus size={15} />
                </button>
              </div>
            </div>

            {/* Primary Action Buttons */}
            <div className="flex gap-3 pt-2" style={fadeInStyle(0.26)}>
              <Button
                variant="forest"
                size="lg"
                magnetic
                className="flex-1 group py-4 rounded-full shadow-sm"
                onClick={handleAddToCart}
                disabled={Boolean(product.variants?.length) && !product.inStock}
              >
                <ShoppingBag size={18} className={addedFeedback ? 'animate-wiggle' : ''} />
                <span>{addedFeedback ? 'Added to Bag!' : 'Add to Shopping Bag'}</span>
              </Button>
              <button
                onClick={() => toggleWishlist(product.id, product.name)}
                aria-label={wished ? 'Remove from wishlist' : 'Add to wishlist'}
                className={`flex h-12 w-12 items-center justify-center rounded-full border transition-all duration-300 ${
                  wished
                    ? 'border-terracotta bg-terracotta text-white shadow-xs'
                    : 'border-espresso/15 bg-white text-espresso hover:border-espresso'
                }`}
              >
                <Heart size={19} fill={wished ? 'currentColor' : 'none'} className={wished ? 'animate-wiggle' : ''} />
              </button>
            </div>

            {/* Delivery & Trust Highlights */}
            <div className="rounded-2xl bg-white p-4 border border-espresso/10 space-y-2.5 text-xs text-espresso-soft shadow-xs">
              <div className="flex items-center gap-2.5">
                <Truck size={15} className="text-forest shrink-0" />
                <span>Complimentary Pan-India Insured Dispatch on orders above ₹1,999.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <ShieldCheck size={15} className="text-forest shrink-0" />
                <span>100% genuine certified {deptInfo?.brand || 'artisan'} quality.</span>
              </div>
              <div className="flex items-center gap-2.5">
                <RotateCcw size={15} className="text-forest shrink-0" />
                <span>Transparent exchanges and dedicated WhatsApp client concierge.</span>
              </div>
            </div>

            {/* Dynamic Product Specification Accordions */}
            <div className="border-t border-espresso/10 pt-2" style={fadeInStyle(0.32)}>
              {/* Product Narrative / Description */}
              <Accordion
                title="Product Narrative & Details"
                isOpen={openSection === 'description'}
                onToggle={() => setOpenSection(openSection === 'description' ? null : 'description')}
              >
                <p className="text-xs sm:text-sm text-espresso-soft leading-relaxed">{product.description}</p>
              </Accordion>

              {/* Jewellery Specifications */}
              {isJewellery && (specs?.jewellery || product.fabric || product.care) && (
                <Accordion
                  title="Jewellery Specifications & Plating"
                  isOpen={openSection === 'jewellery-specs'}
                  onToggle={() => setOpenSection(openSection === 'jewellery-specs' ? null : 'jewellery-specs')}
                >
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    {(specs?.jewellery?.material || product.fabric) && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Base Material</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs?.jewellery?.material || product.fabric}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.plating && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Plating / Finish</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.jewellery.plating}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.pieceCount && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Set Pieces</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.jewellery.pieceCount} Pieces Included</dd>
                      </div>
                    )}
                    {specs?.jewellery?.setContents && (
                      <div className="sm:col-span-2">
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Contents</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.jewellery.setContents}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.earringType && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Earring Style</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.jewellery.earringType}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.closureType && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Closure Type</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.jewellery.closureType}</dd>
                      </div>
                    )}
                    {specs?.jewellery?.ringSize && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Ring Fit</dt>
                        <dd className="font-medium text-espresso mt-0.5">
                          {specs.jewellery.ringSize} ({specs.jewellery.isAdjustable ? 'Adjustable Size' : 'Fixed Size'})
                        </dd>
                      </div>
                    )}
                    {(specs?.jewellery?.care || product.care) && (
                      <div className="sm:col-span-2 pt-2 border-t border-espresso/6">
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Care & Handling</dt>
                        <dd className="text-espresso-soft mt-0.5 leading-relaxed">{specs?.jewellery?.care || product.care}</dd>
                      </div>
                    )}
                  </dl>
                </Accordion>
              )}

              {/* Women's Unstitched Suits Specifications */}
              {isWomenSuits && (specs?.womenSuits || product.fabric || product.care) && (
                <Accordion
                  title="Fabric Purity & Cut Measurements"
                  isOpen={openSection === 'suits-specs'}
                  onToggle={() => setOpenSection(openSection === 'suits-specs' ? null : 'suits-specs')}
                >
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    {(specs?.womenSuits?.fabricType || product.fabric) && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Fabric Quality</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs?.womenSuits?.fabricType || product.fabric}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.pattern && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Weave & Pattern</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.womenSuits.pattern}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.piecesIncluded && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Suit Pieces</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.womenSuits.piecesIncluded}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.topLength && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Top (Kurta) Fabric</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.womenSuits.topLength} {specs.womenSuits.lengthUnit || 'meters'}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.bottomLength && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Bottom Fabric</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.womenSuits.bottomLength} {specs.womenSuits.lengthUnit || 'meters'}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.dupattaIncluded !== undefined && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Dupatta Included</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.womenSuits.dupattaIncluded ? 'Yes' : 'No'}</dd>
                      </div>
                    )}
                    {specs?.womenSuits?.dupattaIncluded && (specs?.womenSuits?.dupattaFabric || specs?.womenSuits?.dupattaLength) && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Dupatta Specifications</dt>
                        <dd className="font-medium text-espresso mt-0.5">
                          {[specs.womenSuits.dupattaFabric, specs.womenSuits.dupattaLength ? `${specs.womenSuits.dupattaLength} ${specs.womenSuits.dupattaUnit || specs.womenSuits.lengthUnit || 'meters'}` : null].filter(Boolean).join(' · ')}
                        </dd>
                      </div>
                    )}
                    {(specs?.womenSuits?.washCare || product.care) && (
                      <div className="sm:col-span-2 pt-2 border-t border-espresso/6">
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Wash & Care</dt>
                        <dd className="text-espresso-soft mt-0.5 leading-relaxed">{specs?.womenSuits?.washCare || product.care}</dd>
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
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-3 text-xs">
                    {specs?.homeTextiles?.productType && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Product Classification</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.homeTextiles.productType}</dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.bedSize && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Bed Size</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.homeTextiles.bedSize}</dd>
                      </div>
                    )}
                    {(specs?.homeTextiles?.length || specs?.homeTextiles?.width) && (
                      <div className="sm:col-span-2">
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">
                          Dimensions {specs.homeTextiles.unitConfirmed ? '(Confirmed Unit)' : '(Handwritten Specification)'}
                        </dt>
                        <dd className="font-medium text-espresso mt-0.5 flex flex-wrap items-center gap-2">
                          <span>
                            {specs.homeTextiles.length || '90'} &times; {specs.homeTextiles.width || '60'}
                            {specs.homeTextiles.unitConfirmed && specs.homeTextiles.dimensionUnit && specs.homeTextiles.dimensionUnit !== 'pending_confirmation'
                              ? ` ${specs.homeTextiles.dimensionUnit}`
                              : ' (Unit pending owner confirmation)'}
                          </span>
                          {!specs.homeTextiles.unitConfirmed && (
                            <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded bg-amber-50 text-amber-800 border border-amber-200">
                              Unit Awaiting Verification
                            </span>
                          )}
                        </dd>
                      </div>
                    )}
                    {(specs?.homeTextiles?.fabric || product.fabric) && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Fabric Purity</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs?.homeTextiles?.fabric || product.fabric}</dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.design && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Design / Print</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.homeTextiles.design}</dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.pillowCoversCount !== undefined && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Pillow Covers</dt>
                        <dd className="font-medium text-espresso mt-0.5">
                          {specs.homeTextiles.pillowCoversCount} Included
                          {specs.homeTextiles.pillowCoverDimensions ? ` (${specs.homeTextiles.pillowCoverDimensions})` : ''}
                        </dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.packQuantity && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Pack Quantity</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.homeTextiles.packQuantity} Pack</dd>
                      </div>
                    )}
                    {specs?.homeTextiles?.closureType && (
                      <div>
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Closure Type</dt>
                        <dd className="font-medium text-espresso mt-0.5">{specs.homeTextiles.closureType}</dd>
                      </div>
                    )}
                    {product.care && (
                      <div className="sm:col-span-2 pt-2 border-t border-espresso/6">
                        <dt className="font-semibold uppercase tracking-wider text-espresso-light">Care & Laundering</dt>
                        <dd className="text-espresso-soft mt-0.5 leading-relaxed">{product.care}</dd>
                      </div>
                    )}
                  </dl>
                </Accordion>
              )}

              {/* Kids Clothing Fabric & Measurements */}
              {isKids && (product.fabric || product.care) && (
                <Accordion
                  title="Organic Fabric & Tender Care"
                  isOpen={openSection === 'fabric'}
                  onToggle={() => setOpenSection(openSection === 'fabric' ? null : 'fabric')}
                >
                  <div className="space-y-2 text-xs text-espresso-soft">
                    {product.fabric && (
                      <div>
                        <span className="font-semibold uppercase tracking-wider text-espresso">Fabric: </span>
                        {product.fabric}
                      </div>
                    )}
                    {product.care && (
                      <div>
                        <span className="font-semibold uppercase tracking-wider text-espresso">Care: </span>
                        {product.care}
                      </div>
                    )}
                  </div>
                </Accordion>
              )}

              {isKids && product.sizeMeasurements?.trim() && (
                <Accordion
                  title="Garment Measurements"
                  isOpen={openSection === 'measurements'}
                  onToggle={() => setOpenSection(openSection === 'measurements' ? null : 'measurements')}
                >
                  <p className="whitespace-pre-line text-xs leading-relaxed text-espresso-soft">{product.sizeMeasurements}</p>
                </Accordion>
              )}
            </div>
          </div>
        </div>

        {/* Related Products */}
        {related.length > 0 && (
          <div className="mt-20 lg:mt-28 pt-12 border-t border-espresso/10">
            <Reveal>
              <div className="flex items-end justify-between gap-4 mb-8">
                <div>
                  <span className="text-xs font-semibold uppercase tracking-[0.24em] text-terracotta">Curated Pairings</span>
                  <h2 className="mt-1 font-serif text-2xl lg:text-3xl font-light text-espresso">
                    You May Also <span className="italic font-normal">Admire</span>
                  </h2>
                </div>
                <Link
                  to={`/shop?department=${productDept}&category=${encodeURIComponent(product.category)}`}
                  className="text-xs font-semibold uppercase tracking-wider text-espresso hover:text-forest inline-flex items-center gap-1 transition-colors"
                >
                  <span>More in {product.category}</span>
                  <ArrowRight size={13} />
                </Link>
              </div>
            </Reveal>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
              {related.map((p, i) => (
                <Reveal key={p.id} delay={i * 80}>
                  <ProductCard product={p} />
                </Reveal>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Mobile Sticky Add to Bag Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 lg:hidden bg-[#F6F2E9]/98 backdrop-blur-md border-t border-espresso/12 p-3.5 flex items-center justify-between gap-4 shadow-xl">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] uppercase font-bold text-terracotta truncate">{product.name}</p>
          <p className="text-base font-semibold text-espresso">{formatINR(displayPrice)}</p>
        </div>
        <Button
          variant="forest"
          size="md"
          className="px-6 py-3 text-xs font-semibold uppercase tracking-wider rounded-full shrink-0 shadow-xs"
          onClick={handleAddToCart}
          disabled={Boolean(product.variants?.length) && !product.inStock}
        >
          <span>{addedFeedback ? 'Added!' : 'Add to Bag'}</span>
        </Button>
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
    <div className="border-b border-espresso/8">
      <button
        onClick={onToggle}
        className="flex w-full items-center justify-between py-4 text-left group"
        aria-expanded={isOpen}
      >
        <span className="text-xs font-semibold uppercase tracking-wider text-espresso group-hover:text-forest transition-colors">
          {title}
        </span>
        <ChevronDown
          size={16}
          className={`text-espresso-light transition-transform duration-300 ${isOpen ? 'rotate-180 text-forest' : ''}`}
        />
      </button>
      <div className={`accordion-content ${isOpen ? 'open' : ''}`}>
        <div>
          <div className="pb-5 pt-1">{children}</div>
        </div>
      </div>
    </div>
  );
}
