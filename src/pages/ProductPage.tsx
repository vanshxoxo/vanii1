import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Heart,
  Minus,
  Plus,
  ShoppingBag,
  Ruler,
  Truck,
  RefreshCw,
  Check,
  ChevronDown,
  X,
  ArrowRight,
} from 'lucide-react';
import { getProductBySlug, getRelatedProducts, formatINR } from '../data';
import { useStore } from '../store';
import Button from '../components/Button';
import Breadcrumbs from '../components/ui';
import ProductCard from '../components/ProductCard';
import Reveal from '../components/Reveal';
import type { Product } from '../types';

export default function ProductPage() {
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();
  const product = slug ? getProductBySlug(slug) : undefined;

  const { addToCart, toggleWishlist, isWishlisted } = useStore();

  const [activeImage, setActiveImage] = useState(0);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState<{ color?: string; size?: string }>({});
  const [showSizeGuide, setShowSizeGuide] = useState(false);
  const [openSection, setOpenSection] = useState<string | null>('description');
  const [pincode, setPincode] = useState('');
  const [pincodeStatus, setPincodeStatus] = useState<'idle' | 'checking' | 'available' | 'invalid'>('idle');
  const [addedFeedback, setAddedFeedback] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setActiveImage(0);
    setSelectedColor(null);
    setSelectedSize(null);
    setQuantity(1);
    setErrors({});
    setPincode('');
    setPincodeStatus('idle');
  }, [slug]);

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-20 text-center">
        <h1 className="font-serif text-3xl text-ink mb-4">Product not found</h1>
        <p className="text-sm text-ink-soft mb-6">We couldn't find what you're looking for.</p>
        <Button variant="primary" onClick={() => navigate('/shop')}>
          Back to Shop
        </Button>
      </div>
    );
  }

  const wished = isWishlisted(product.id);
  const related = getRelatedProducts(product, 4);
  const hasDiscount = product.originalPrice && product.originalPrice > product.price;

  const handleAddToCart = () => {
    const newErrors: { color?: string; size?: string } = {};
    if (product.colors.length > 1 && !selectedColor) {
      newErrors.color = 'Please select a color';
    }
    if (product.sizes.length > 1 && !selectedSize) {
      newErrors.size = 'Please select a size';
    }
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    addToCart({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      price: product.price,
      image: product.images[0],
      color: selectedColor || product.colors[0].name,
      size: selectedSize || product.sizes[0],
      quantity,
    });
    setAddedFeedback(true);
    setTimeout(() => setAddedFeedback(false), 2000);
  };

  const handlePincodeCheck = () => {
    if (!/^\d{6}$/.test(pincode)) {
      setPincodeStatus('invalid');
      return;
    }
    setPincodeStatus('checking');
    setTimeout(() => {
      setPincodeStatus('available');
    }, 800);
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
                    <img src={img} alt={`${product.name} view ${i + 1}`} className="h-full w-full object-cover" />
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
                    alt={product.name}
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
                <span className="text-2xl font-medium text-ink">{formatINR(product.price)}</span>
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
                  <button
                    key={color.name}
                    onClick={() => {
                      setSelectedColor(color.name);
                      setErrors((prev) => ({ ...prev, color: undefined }));
                    }}
                    aria-label={color.name}
                    className={`relative h-9 w-9 rounded-full border-2 transition-all duration-200 ${
                      selectedColor === color.name
                        ? 'border-ink ring-2 ring-ink/15 scale-110'
                        : 'border-ink/10 hover:border-ink/30 hover:scale-105'
                    }`}
                    style={{ backgroundColor: color.hex }}
                    title={color.name}
                  />
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
                <button
                  onClick={() => setShowSizeGuide(true)}
                  className="flex items-center gap-1.5 text-xs text-ink-soft hover:text-ink transition-colors"
                >
                  <Ruler size={14} />
                  Size Guide
                </button>
              </div>
              <div className="flex flex-wrap gap-2">
                {product.sizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => {
                      setSelectedSize(size);
                      setErrors((prev) => ({ ...prev, size: undefined }));
                    }}
                    className={`min-w-[3rem] px-3 py-2.5 text-sm rounded-lg border transition-all duration-200 ${
                      selectedSize === size
                        ? 'border-ink bg-ink text-cream scale-105'
                        : 'border-ink/15 text-ink-soft hover:border-ink/40 hover:scale-105'
                    }`}
                  >
                    {size}
                  </button>
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

            {/* Delivery pincode */}
            <div className="mt-2 p-4 bg-cream rounded-xl border border-ink/8" style={fadeInStyle(0.35)}>
              <div className="flex items-center gap-2 mb-3">
                <Truck size={18} className="text-ink-soft" />
                <span className="text-sm font-medium text-ink">Check delivery</span>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={pincode}
                  onChange={(e) => {
                    setPincode(e.target.value.replace(/\D/g, '').slice(0, 6));
                    setPincodeStatus('idle');
                  }}
                  placeholder="Enter 6-digit pincode"
                  className="flex-1 px-3 py-2 text-sm bg-white border border-ink/15 rounded-lg outline-none focus:border-ink transition-colors"
                  aria-label="Delivery pincode"
                />
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handlePincodeCheck}
                  disabled={pincode.length !== 6 || pincodeStatus === 'checking'}
                >
                  {pincodeStatus === 'checking' ? 'Checking...' : 'Check'}
                </Button>
              </div>
              {pincodeStatus === 'available' && (
                <p className="mt-2 text-xs text-pistachio flex items-center gap-1.5 animate-slide-down">
                  <Check size={14} /> Delivery available to {pincode}. Estimated delivery in 3–5 days. (Demo)
                </p>
              )}
              {pincodeStatus === 'invalid' && (
                <p className="mt-2 text-xs text-peach animate-slide-down">
                  Please enter a valid 6-digit pincode.
                </p>
              )}
              <p className="mt-2 text-xs text-ink-light">
                This is a demo check — no real delivery estimates.
              </p>
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
              <Accordion
                title="Shipping & Returns"
                isOpen={openSection === 'shipping'}
                onToggle={() => setOpenSection(openSection === 'shipping' ? null : 'shipping')}
              >
                <div className="space-y-2 text-sm text-ink-soft">
                  <p className="flex items-start gap-2">
                    <Truck size={16} className="text-ink-light shrink-0 mt-0.5" />
                    Free shipping on orders above ₹1,499. Standard delivery in 3–5 business days.
                  </p>
                  <p className="flex items-start gap-2">
                    <RefreshCw size={16} className="text-ink-light shrink-0 mt-0.5" />
                    Easy 7-day returns. Items must be unworn with original tags.
                  </p>
                  <p className="text-xs text-ink-light mt-2">
                    This is a demo store — shipping and return policies are illustrative.
                  </p>
                </div>
              </Accordion>
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
      {showSizeGuide && <SizeGuideModal product={product} onClose={() => setShowSizeGuide(false)} />}
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

function SizeGuideModal({ product, onClose }: { product: Product; onClose: () => void }) {
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    const handleEsc = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handleEsc);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleEsc);
    };
  }, [onClose]);

  const sizeChart: Record<string, { height: string; weight: string }> = {
    '0-3M': { height: '50–58 cm', weight: '3–5 kg' },
    '3-6M': { height: '58–65 cm', weight: '5–7 kg' },
    '6-12M': { height: '65–75 cm', weight: '7–9 kg' },
    '12-18M': { height: '75–82 cm', weight: '9–11 kg' },
    '1-2Y': { height: '80–88 cm', weight: '10–12 kg' },
    '2-3Y': { height: '88–96 cm', weight: '12–14 kg' },
    '3-4Y': { height: '96–104 cm', weight: '14–16 kg' },
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm animate-fade-in" onClick={onClose} />
      <div className="relative bg-cream rounded-2xl max-w-lg w-full max-h-[85vh] overflow-y-auto animate-bounce-in p-6 lg:p-8 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="font-serif text-2xl font-light text-ink">Size Guide</h2>
          <button
            onClick={onClose}
            aria-label="Close size guide"
            className="p-2 -mr-2 text-ink hover:text-peach hover:rotate-90 transition-all duration-300"
          >
            <X size={22} />
          </button>
        </div>
        <p className="text-sm text-ink-soft mb-5">
          Available sizes for {product.name}: {product.sizes.join(', ')}
        </p>
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-ink/15">
              <th className="text-left py-3 font-medium text-ink">Size</th>
              <th className="text-left py-3 font-medium text-ink">Height</th>
              <th className="text-left py-3 font-medium text-ink">Weight</th>
            </tr>
          </thead>
          <tbody>
            {product.sizes.map((size, i) => (
              <tr
                key={size}
                className="border-b border-ink/8 animate-slide-up-fade"
                style={{ animationDelay: `${i * 0.05}s` }}
              >
                <td className="py-3 font-medium text-ink">{size}</td>
                <td className="py-3 text-ink-soft">{sizeChart[size]?.height || '—'}</td>
                <td className="py-3 text-ink-soft">{sizeChart[size]?.weight || '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="mt-5 text-xs text-ink-light">
          When in between sizes, we recommend sizing up for longer wear. This is a general guide — actual fit may vary by style.
        </p>
      </div>
    </div>
  );
}
