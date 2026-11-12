import React, { useState, useMemo } from 'react';
import {
  Sparkles,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Upload,
  Image as ImageIcon,
  Trash2,
  Star,
  ChevronDown,
  ChevronUp,
  Boxes,
  Save,
  Check,
} from 'lucide-react';
import { formatINR } from '../../data';
import { publicMediaUrl } from '../../lib/supabase';

interface ProductWizardProps {
  productForm: any;
  setProductForm: React.Dispatch<React.SetStateAction<any>>;
  categories: any[];
  categoryIds: string[];
  setCategoryIds: React.Dispatch<React.SetStateAction<string[]>>;
  collections: any[];
  collectionIds: string[];
  setCollectionIds: React.Dispatch<React.SetStateAction<string[]>>;
  variants: any[];
  setVariants?: React.Dispatch<React.SetStateAction<any[]>>;
  gallery: any[];
  media?: any[];
  onSaveProduct: (e: React.FormEvent) => Promise<void>;
  onAddVariant?: (e: React.FormEvent) => Promise<void>;
  onDeleteVariant: (variantId: string) => Promise<void>;
  onSaveVariant: (variant: any) => Promise<void>;
  onUploadFile: (file: File, purpose: string) => Promise<any>;
  onAttachMediaToProduct: (assetId: string, variantId?: string) => Promise<void>;
  onRemoveProductMedia: (linkId: string) => Promise<void>;
  onSetPrimaryMedia: (linkId: string) => Promise<void>;
  onGenerateMatrix: (sizes: string[], colours: { name: string; hex: string }[], defaultStock: number) => Promise<void>;
  onQuickToggleStatus: (status: 'draft' | 'archived') => Promise<void>;
  onBackToList: () => void;
  pendingApprovals: (prod: any) => string[];
}

const STANDARD_KIDS_SIZES = ['0-3M', '3-6M', '6-12M', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y'];
const PRESET_COLOURS = [
  { name: 'Ivory', hex: '#FFFFF0' },
  { name: 'Oatmeal', hex: '#E3DAC9' },
  { name: 'Sage', hex: '#9CAF88' },
  { name: 'Terracotta', hex: '#E2725B' },
  { name: 'Dusty Rose', hex: '#DCAE96' },
  { name: 'Sky Blue', hex: '#87CEEB' },
  { name: 'Olive', hex: '#808000' },
  { name: 'Mustard', hex: '#FFDB58' },
];

const MEASUREMENT_TEMPLATES: Record<string, string> = {
  romper: `Size | Chest (in) | Length (in) | Inseam (in)
0-3M | 17 | 14.0 | 6.0
3-6M | 18 | 15.5 | 7.0
6-12M | 19 | 17.0 | 8.0
1-2Y | 20 | 18.5 | 9.5
2-3Y | 21 | 20.0 | 11.0
3-4Y | 22 | 21.5 | 12.5
(Measurements taken flat across garment in inches)`,
  coord: `Size | Chest (in) | Top Length (in) | Waist (in) | Bottom Length (in)
0-3M | 17 | 10.5 | 15 | 11.0
3-6M | 18 | 11.5 | 16 | 12.5
6-12M | 19 | 12.5 | 17 | 14.0
1-2Y | 20 | 14.0 | 18 | 16.0
2-3Y | 21 | 15.0 | 19 | 18.0
3-4Y | 22 | 16.0 | 20 | 20.0
(Measurements taken flat across garment in inches)`,
  dress: `Size | Chest (in) | Dress Length (in) | Shoulder (in)
0-3M | 17 | 13.5 | 6.5
3-6M | 18 | 15.0 | 7.0
6-12M | 19 | 16.5 | 7.5
1-2Y | 20 | 18.0 | 8.0
2-3Y | 21 | 20.0 | 8.5
3-4Y | 22 | 22.0 | 9.0
(Measurements taken flat across garment in inches)`,
  tee: `Size | Chest (in) | Tee Length (in) | Shoulder (in)
0-3M | 17 | 10.5 | 6.5
3-6M | 18 | 11.5 | 7.0
6-12M | 19 | 12.5 | 7.5
1-2Y | 20 | 14.0 | 8.0
2-3Y | 21 | 15.0 | 8.5
3-4Y | 22 | 16.0 | 9.0
(Measurements taken flat across garment in inches)`,
};

export default function ProductWizard({
  productForm,
  setProductForm,
  categories,
  categoryIds,
  setCategoryIds,
  collections,
  collectionIds,
  setCollectionIds,
  variants,
  gallery,
  onSaveProduct,
  onDeleteVariant,
  onSaveVariant,
  onUploadFile,
  onAttachMediaToProduct,
  onRemoveProductMedia,
  onSetPrimaryMedia,
  onGenerateMatrix,
  onQuickToggleStatus,
  onBackToList,
  pendingApprovals,
}: ProductWizardProps) {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3 | 4 | 5>(1);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [uploadProgress, setUploadProgress] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  // Matrix Generator Local State
  const [matrixSizes, setMatrixSizes] = useState<string[]>(['0-3M', '3-6M', '6-12M', '1-2Y', '2-3Y']);
  const [matrixColours, setMatrixColours] = useState<{ name: string; hex: string }[]>([
    { name: 'Ivory', hex: '#FFFFF0' },
    { name: 'Sage', hex: '#9CAF88' },
  ]);
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#C9826B');
  const [matrixStockInput, setMatrixStockInput] = useState('10');
  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState(false);
  const [bulkStockValue, setBulkStockValue] = useState('15');

  const productCategories = useMemo(
    () => categories.filter((c) => c.kind === 'product'),
    [categories]
  );
  const ageCategories = useMemo(
    () => categories.filter((c) => c.kind === 'age'),
    [categories]
  );

  // Auto-generate slug when name changes and product has no existing ID
  const handleNameChange = (name: string) => {
    const slug = name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '')
      .replace(/\s+/g, '-');
    setProductForm((prev: any) => ({
      ...prev,
      name,
      slug: prev.id ? prev.slug : slug,
    }));
  };

  // Toggle category
  const toggleCategory = (id: string) => {
    setCategoryIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle collection
  const toggleCollection = (id: string) => {
    setCollectionIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  // Toggle Tag
  const toggleTag = (tag: string) => {
    const existing = productForm.tags || [];
    const updated = existing.includes(tag)
      ? existing.filter((t: string) => t !== tag)
      : [...existing, tag];
    setProductForm({ ...productForm, tags: updated });
  };

  // Handle Photo Upload
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadProgress(`Uploading ${files.length} photo(s)...`);
    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        setUploadProgress(`Uploading "${file.name}" (${i + 1}/${files.length})...`);
        const asset = await onUploadFile(file, 'product');
        if (asset && productForm.id) {
          await onAttachMediaToProduct(asset.id);
        }
      }
      setUploadProgress('');
    } catch (err: any) {
      setUploadProgress(`Upload error: ${err.message}`);
    }
  };

  // Trigger Matrix Generator
  const handleRunMatrixGenerator = async () => {
    setIsGeneratingMatrix(true);
    try {
      const stock = parseInt(matrixStockInput, 10) || 0;
      await onGenerateMatrix(matrixSizes, matrixColours, stock);
    } finally {
      setIsGeneratingMatrix(false);
    }
  };

  // Add Custom Color to Matrix
  const handleAddCustomColor = () => {
    if (!customColorName.trim()) return;
    if (!matrixColours.some((c) => c.name.toLowerCase() === customColorName.trim().toLowerCase())) {
      setMatrixColours([...matrixColours, { name: customColorName.trim(), hex: customColorHex }]);
    }
    setCustomColorName('');
  };

  // Bulk Apply Stock to all variants
  const handleApplyBulkStock = async () => {
    const newStock = parseInt(bulkStockValue, 10);
    if (isNaN(newStock) || newStock < 0) return;
    for (const v of variants) {
      await onSaveVariant({ ...v, stock: newStock });
    }
  };

  // Validation Check for Step 5
  const missingItems = useMemo(() => {
    return pendingApprovals({
      ...productForm,
      product_categories: categoryIds.map((id) => ({
        categories: categories.find((c) => c.id === id),
      })),
      product_variants: variants.map((v) => ({
        ...v,
        inventory: { quantity_on_hand: v.stock ?? 0 },
      })),
      product_media: gallery,
    });
  }, [productForm, categoryIds, categories, variants, gallery, pendingApprovals]);

  const canPublish = missingItems.length === 0;

  // Primary cover image
  const primaryMedia = useMemo(() => {
    return gallery.find((g) => g.is_primary) || gallery[0];
  }, [gallery]);

  const coverUrl = useMemo(() => {
    if (!primaryMedia) return null;
    const asset = Array.isArray(primaryMedia.media_assets)
      ? primaryMedia.media_assets[0]
      : primaryMedia.media_assets;
    return asset ? publicMediaUrl(asset, 800) : null;
  }, [primaryMedia]);

  const discountPercent = useMemo(() => {
    const p = Number(productForm.price);
    const m = Number(productForm.compare_at_price);
    if (p > 0 && m > p) {
      return Math.round(((m - p) / m) * 100);
    }
    return 0;
  }, [productForm.price, productForm.compare_at_price]);

  // Steps definition
  const steps = [
    { num: 1, label: 'Details', heading: 'Tell us about this clothing item' },
    { num: 2, label: 'Photos', heading: 'Add beautiful product photos' },
    { num: 3, label: 'Pricing & Sets', heading: 'Set price & showcase in collections' },
    { num: 4, label: 'Sizes & Stock', heading: 'Sizes, colours & physical inventory' },
    { num: 5, label: 'Publish', heading: 'Review and publish to storefront' },
  ];

  return (
    <div className="space-y-6 animate-fade-in max-w-5xl mx-auto">
      {/* TOP WIZARD BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-[#E8E2D9]">
        <div className="flex items-center gap-3">
          <button
            onClick={onBackToList}
            className="p-2 rounded-xl text-ink-muted hover:text-ink hover:bg-white border border-[#E8E2D9] transition"
            title="Return to product list"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[11px] font-semibold text-clay uppercase tracking-wider block">
              {productForm.id ? 'Editing Existing Product' : 'Creating New Product'}
            </span>
            <h2 className="font-serif text-2xl font-bold text-ink leading-tight">
              {productForm.name || 'Untitled Garment'}
            </h2>
          </div>
        </div>

        {/* Global Save Draft & Quick Status */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {productForm.id && (
            <button
              onClick={() => onQuickToggleStatus(productForm.status === 'archived' ? 'draft' : 'archived')}
              className="px-3 py-2 text-xs font-semibold rounded-xl bg-white border border-[#E8E2D9] text-ink-soft hover:text-ink transition"
            >
              {productForm.status === 'archived' ? 'Restore to Draft' : 'Archive'}
            </button>
          )}

          <button
            onClick={(e) => {
              setIsSaving(true);
              onSaveProduct(e).finally(() => setIsSaving(false));
            }}
            disabled={isSaving}
            className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-xl bg-ink text-white hover:bg-ink-soft transition shadow-2xs"
          >
            <Save className={`w-3.5 h-3.5 ${isSaving ? 'animate-spin' : ''}`} />
            <span>Save Draft</span>
          </button>
        </div>
      </div>

      {/* STEP NAVIGATION PROGRESS BAR */}
      <div className="bg-white rounded-2xl border border-[#E8E2D9] p-3 shadow-2xs">
        <div className="grid grid-cols-5 gap-1 sm:gap-2">
          {steps.map((s) => {
            const isCurrent = currentStep === s.num;
            const isCompleted = currentStep > s.num;

            return (
              <button
                key={s.num}
                onClick={() => setCurrentStep(s.num as any)}
                className={`flex flex-col sm:flex-row items-center sm:items-center justify-center gap-1.5 sm:gap-2 p-2 sm:px-3 sm:py-2.5 rounded-xl transition text-center sm:text-left ${
                  isCurrent
                    ? 'bg-clay text-white font-semibold shadow-xs'
                    : isCompleted
                    ? 'bg-[#FAF7F0] text-emerald-800 hover:bg-[#F3EFE6]'
                    : 'text-ink-muted hover:bg-[#FAF7F0] hover:text-ink'
                }`}
              >
                <div
                  className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                    isCurrent
                      ? 'bg-white text-clay'
                      : isCompleted
                      ? 'bg-emerald-600 text-white'
                      : 'bg-[#E8E2D9] text-ink-muted'
                  }`}
                >
                  {isCompleted ? <Check className="w-3 h-3" /> : s.num}
                </div>
                <span className="text-xs truncate hidden md:inline">{s.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* STEP 1: PRODUCT DETAILS */}
      {currentStep === 1 && (
        <section className="bg-white rounded-2xl border border-[#E8E2D9] p-6 lg:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D9] pb-4">
            <h3 className="font-serif text-xl font-bold text-ink">
              Step 1: Tell us about this clothing item
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Give your garment a gentle editorial name, descriptions, category assignments, and accurate measurements.
            </p>
          </div>

          <div className="space-y-5">
            {/* Name & Slug */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  placeholder="e.g. Everyday Cotton Romper"
                  value={productForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
                  required
                />
                <span className="text-[11px] text-ink-muted mt-1 block">
                  Example: <em>Everyday Cotton Romper</em>, <em>Linen Breeze Co-ord</em>
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  URL Handle (Slug) *
                </label>
                <div className="flex items-center">
                  <span className="px-3 py-2.5 text-xs text-ink-muted bg-[#F3EFE6] border border-r-0 border-[#E8E2D9] rounded-l-xl">
                    /product/
                  </span>
                  <input
                    type="text"
                    value={productForm.slug}
                    onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                    className="w-full px-3.5 py-2.5 text-sm rounded-r-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Categories & Age Groups */}
            <div className="grid gap-6 sm:grid-cols-2 pt-2">
              {/* Product Categories */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                  Clothing Category *
                </label>
                <div className="flex flex-wrap gap-2">
                  {productCategories.map((c) => {
                    const isChecked = categoryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCategory(c.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                          isChecked
                            ? 'bg-clay text-white border-clay shadow-2xs font-semibold'
                            : 'bg-[#FAF7F0] text-ink-soft border-[#E8E2D9] hover:border-clay/50'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Age Categories */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                  Age Group *
                </label>
                <div className="flex flex-wrap gap-2">
                  {ageCategories.map((c) => {
                    const isChecked = categoryIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleCategory(c.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                          isChecked
                            ? 'bg-clay text-white border-clay shadow-2xs font-semibold'
                            : 'bg-[#FAF7F0] text-ink-soft border-[#E8E2D9] hover:border-clay/50'
                        }`}
                      >
                        {c.name}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Description & Fabric Details */}
            <div className="grid gap-4 sm:grid-cols-2 pt-2">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Product Description *
                </label>
                <textarea
                  rows={4}
                  placeholder="A thoughtful description highlighting the softness, silhouette, and breathability..."
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
                />
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Fabric & Material *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100% GOTS-Certified Organic Cotton"
                    value={productForm.material}
                    onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                    Care Instructions *
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Machine wash cold, gentle cycle with mild detergent. Tumble dry low."
                    value={productForm.care_instructions}
                    onChange={(e) => setProductForm({ ...productForm, care_instructions: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
                  />
                </div>
              </div>
            </div>

            {/* Garment Measurements & Presets */}
            <div className="pt-2 space-y-2">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <label className="text-xs font-semibold text-ink uppercase tracking-wider">
                  Size & Garment Measurements Table *
                </label>
                <div className="flex items-center gap-1.5 text-xs text-ink-muted">
                  <span>Quick Templates:</span>
                  {Object.keys(MEASUREMENT_TEMPLATES).map((key) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() =>
                        setProductForm({
                          ...productForm,
                          size_measurements: MEASUREMENT_TEMPLATES[key],
                        })
                      }
                      className="px-2 py-0.5 rounded-md bg-[#FAF7F0] hover:bg-cream text-clay border border-[#E8E2D9] capitalize font-medium transition"
                    >
                      {key}
                    </button>
                  ))}
                </div>
              </div>

              <textarea
                rows={5}
                value={productForm.size_measurements}
                onChange={(e) => setProductForm({ ...productForm, size_measurements: e.target.value })}
                placeholder="Size | Chest | Length..."
                className="w-full font-mono text-xs px-3.5 py-2.5 rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
              />
            </div>

            {/* Collapsed Advanced SEO & Tags */}
            <div className="pt-4 border-t border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink transition"
              >
                <span>Optional Advanced SEO & Storefront Tags</span>
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              {showAdvanced && (
                <div className="grid gap-4 sm:grid-cols-2 pt-4 animate-fade-in">
                  <div>
                    <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                      SEO Meta Title
                    </label>
                    <input
                      type="text"
                      placeholder="Title tag for Google search"
                      value={productForm.seo_title || ''}
                      onChange={(e) => setProductForm({ ...productForm, seo_title: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-ink-muted uppercase tracking-wider mb-1">
                      SEO Meta Description
                    </label>
                    <input
                      type="text"
                      placeholder="Brief snippet for search results"
                      value={productForm.seo_description || ''}
                      onChange={(e) => setProductForm({ ...productForm, seo_description: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Step 1 Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[#E8E2D9]">
            <span className="text-xs text-ink-muted">
              Next: Upload editorial photos
            </span>
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
            >
              <span>Continue to Photos</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 2: PRODUCT PHOTOS */}
      {currentStep === 2 && (
        <section className="bg-white rounded-2xl border border-[#E8E2D9] p-6 lg:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D9] pb-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
            <div>
              <h3 className="font-serif text-xl font-bold text-ink">
                Step 2: Add beautiful product photos
              </h3>
              <p className="text-xs text-ink-muted mt-1">
                Upload editorial photography via ImageKit. Assign photos to specific colours or set the primary cover shot.
              </p>
            </div>
            {!productForm.id && (
              <span className="text-xs text-amber-700 bg-amber-50 px-3 py-1 rounded-xl border border-amber-200">
                Tip: Save draft first so uploaded photos attach automatically.
              </span>
            )}
          </div>

          {/* Upload Dropzone */}
          <div className="border-2 border-dashed border-[#E8E2D9] hover:border-clay/60 bg-[#FAF7F0] rounded-2xl p-8 text-center transition">
            <Upload className="w-8 h-8 mx-auto text-clay mb-2" />
            <p className="font-serif font-bold text-sm text-ink">
              Drag and drop product photos here, or browse files
            </p>
            <p className="text-xs text-ink-muted mt-1">
              Supports high-resolution JPEG, PNG, and WebP images. Delivered fast via ImageKit.
            </p>
            <label className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-[#E8E2D9] hover:border-clay text-ink text-xs font-semibold cursor-pointer shadow-2xs transition">
              <span>Choose Files</span>
              <input
                type="file"
                multiple
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </label>
            {uploadProgress && (
              <p className="text-xs font-medium text-clay mt-3 animate-pulse">{uploadProgress}</p>
            )}
          </div>

          {/* Gallery Thumbnails */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Garment Gallery ({gallery.length} photo{gallery.length === 1 ? '' : 's'})
              </span>
              <span className="text-xs text-ink-muted">
                Star a photo to set it as the storefront cover
              </span>
            </div>

            {gallery.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F0] rounded-xl border border-[#E8E2D9] text-xs text-ink-muted">
                No photos attached yet. Upload photos above to display them here.
              </div>
            ) : (
              <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
                {gallery.map((item) => {
                  const asset = Array.isArray(item.media_assets)
                    ? item.media_assets[0]
                    : item.media_assets;
                  if (!asset) return null;
                  const url = publicMediaUrl(asset, 400);

                  return (
                    <div
                      key={item.id}
                      className={`group relative rounded-xl border overflow-hidden bg-[#FAF7F0] flex flex-col justify-between transition ${
                        item.is_primary ? 'border-clay ring-2 ring-clay/40 shadow-xs' : 'border-[#E8E2D9]'
                      }`}
                    >
                      <div className="relative aspect-square">
                        <img
                          src={url}
                          alt={item.alt_text || 'Product photograph'}
                          className="w-full h-full object-cover"
                        />
                        {item.is_primary && (
                          <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-clay text-white text-[10px] font-bold shadow-xs flex items-center gap-1">
                            <Star className="w-3 h-3 fill-white" />
                            <span>Cover</span>
                          </div>
                        )}
                      </div>

                      <div className="p-2.5 bg-white space-y-2 border-t border-[#E8E2D9]">
                        {/* Variant / Colour Association */}
                        <div className="space-y-1">
                          <label className="text-[10px] font-bold text-ink-muted uppercase">
                            Linked Variant / Colour
                          </label>
                          <select
                            value={item.variant_id || ''}
                            onChange={async (e) => {
                              const vId = e.target.value || null;
                              await onAttachMediaToProduct(item.asset_id, vId || undefined);
                            }}
                            className="w-full text-xs p-1 rounded-lg border border-[#E8E2D9] bg-[#FAF7F0] text-ink"
                          >
                            <option value="">All colours (General)</option>
                            {variants.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.colour} ({v.size})
                              </option>
                            ))}
                          </select>
                        </div>

                        {/* Action buttons */}
                        <div className="flex items-center justify-between pt-1">
                          {!item.is_primary && (
                            <button
                              type="button"
                              onClick={() => onSetPrimaryMedia(item.id)}
                              className="text-[11px] font-semibold text-clay hover:underline flex items-center gap-1"
                            >
                              <Star className="w-3 h-3" />
                              <span>Set cover</span>
                            </button>
                          )}
                          <button
                            type="button"
                            onClick={() => onRemoveProductMedia(item.id)}
                            className="ml-auto p-1 rounded text-ink-muted hover:text-rose-600 transition"
                            title="Remove photo from product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Step 2 Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => setCurrentStep(1)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-ink-soft hover:text-ink border border-[#E8E2D9] text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Details</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
            >
              <span>Continue to Pricing & Sets</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 3: PRICE & COLLECTIONS */}
      {currentStep === 3 && (
        <section className="bg-white rounded-2xl border border-[#E8E2D9] p-6 lg:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D9] pb-4">
            <h3 className="font-serif text-xl font-bold text-ink">
              Step 3: Set price & showcase in collections
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Specify pricing, optional MRP / compare-at discount, curated collections, and customer badges.
            </p>
          </div>

          <div className="space-y-6">
            {/* Price & Compare-at Price */}
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Selling Price (INR ₹) *
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="990"
                    value={productForm.price}
                    onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm font-semibold rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
                    required
                  />
                </div>
                <span className="text-[11px] text-ink-muted mt-1 block">
                  Amount charged to the customer at checkout
                </span>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Compare-at Price / MRP (Optional ₹)
                </label>
                <div className="relative">
                  <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-sm font-semibold text-ink-muted">
                    ₹
                  </span>
                  <input
                    type="number"
                    placeholder="1290"
                    value={productForm.compare_at_price}
                    onChange={(e) => setProductForm({ ...productForm, compare_at_price: e.target.value })}
                    className="w-full pl-8 pr-3.5 py-2.5 text-sm font-semibold rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
                  />
                </div>
                {discountPercent > 0 && (
                  <span className="text-[11px] font-semibold text-emerald-700 mt-1 block">
                    ✨ Customer saves {discountPercent}% off MRP
                  </span>
                )}
              </div>
            </div>

            {/* Curated Collections */}
            <div className="pt-2 space-y-3">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Include in Curated Collections
              </label>
              <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                {collections.map((col) => {
                  const isChecked = collectionIds.includes(col.id);
                  return (
                    <button
                      key={col.id}
                      type="button"
                      onClick={() => toggleCollection(col.id)}
                      className={`p-3.5 rounded-xl border text-left transition flex items-center justify-between ${
                        isChecked
                          ? 'bg-cream/60 border-clay shadow-2xs'
                          : 'bg-[#FAF7F0] border-[#E8E2D9] hover:border-clay/50'
                      }`}
                    >
                      <div>
                        <span className="font-serif font-bold text-sm text-ink block">
                          {col.name}
                        </span>
                        <span className="text-[11px] text-ink-muted block mt-0.5">
                          {col.description || 'Curated seasonal grouping'}
                        </span>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-md flex items-center justify-center shrink-0 ${
                          isChecked ? 'bg-clay text-white' : 'border border-[#E8E2D9] bg-white'
                        }`}
                      >
                        {isChecked && <Check className="w-3.5 h-3.5" />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Storefront Badges */}
            <div className="pt-2 space-y-3">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Editorial Badges & Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: 'new-arrival', label: '🌱 New Arrival' },
                  { tag: 'bestseller', label: '⭐ Bestseller' },
                  { tag: 'organic-cotton', label: '🌿 100% Organic' },
                  { tag: 'limited-edition', label: '✨ Limited Edition' },
                  { tag: 'seasonal-favourite', label: '☀️ Seasonal Favourite' },
                ].map(({ tag, label }) => {
                  const hasTag = productForm.tags?.includes(tag);
                  return (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => toggleTag(tag)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        hasTag
                          ? 'bg-ink text-white border-ink shadow-2xs font-semibold'
                          : 'bg-[#FAF7F0] text-ink-soft border-[#E8E2D9] hover:border-ink/40'
                      }`}
                    >
                      {label}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Step 3 Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => setCurrentStep(2)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-ink-soft hover:text-ink border border-[#E8E2D9] text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Photos</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
            >
              <span>Continue to Sizes & Stock</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 4: SIZES, COLOURS & STOCK */}
      {currentStep === 4 && (
        <section className="bg-white rounded-2xl border border-[#E8E2D9] p-6 lg:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D9] pb-4">
            <h3 className="font-serif text-xl font-bold text-ink">
              Step 4: Sizes, colours & physical inventory
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Select colours and baby/toddler sizes to generate full inventory combinations in 1 click, or add custom SKUs.
            </p>
          </div>

          {/* BULK COMBINATION GENERATOR */}
          <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-clay font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="w-4 h-4" />
                <span>Bulk Combination Generator</span>
              </div>
              <span className="text-xs text-ink-muted">
                {matrixSizes.length} sizes × {matrixColours.length} colours ={' '}
                <strong>{matrixSizes.length * matrixColours.length} combinations</strong>
              </span>
            </div>

            {/* Size Chips */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                1. Select Garment Sizes
              </label>
              <div className="flex flex-wrap gap-2">
                {STANDARD_KIDS_SIZES.map((sz) => {
                  const isChecked = matrixSizes.includes(sz);
                  return (
                    <button
                      key={sz}
                      type="button"
                      onClick={() =>
                        setMatrixSizes((prev) =>
                          prev.includes(sz) ? prev.filter((s) => s !== sz) : [...prev, sz]
                        )
                      }
                      className={`px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        isChecked
                          ? 'bg-clay text-white border-clay shadow-2xs font-semibold'
                          : 'bg-white text-ink border-[#E8E2D9] hover:border-clay/50'
                      }`}
                    >
                      {sz}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Colour Swatches */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                2. Select Colour Palette
              </label>
              <div className="flex flex-wrap gap-2">
                {PRESET_COLOURS.map((col) => {
                  const isChecked = matrixColours.some((c) => c.name === col.name);
                  return (
                    <button
                      key={col.name}
                      type="button"
                      onClick={() =>
                        setMatrixColours((prev) =>
                          isChecked
                            ? prev.filter((c) => c.name !== col.name)
                            : [...prev, col]
                        )
                      }
                      className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium border transition ${
                        isChecked
                          ? 'bg-white border-clay text-ink font-semibold shadow-2xs ring-1 ring-clay'
                          : 'bg-white text-ink-muted border-[#E8E2D9] hover:border-ink/30'
                      }`}
                    >
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: col.hex }}
                      />
                      <span>{col.name}</span>
                    </button>
                  );
                })}
              </div>

              {/* Add Custom Colour */}
              <div className="flex items-center gap-2 pt-2">
                <input
                  type="text"
                  placeholder="Custom colour name (e.g. Honey)"
                  value={customColorName}
                  onChange={(e) => setCustomColorName(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E8E2D9] focus:outline-none focus:border-clay"
                />
                <input
                  type="color"
                  value={customColorHex}
                  onChange={(e) => setCustomColorHex(e.target.value)}
                  className="w-8 h-8 rounded-lg border border-[#E8E2D9] cursor-pointer bg-white p-0.5"
                  title="Pick hex colour"
                />
                <button
                  type="button"
                  onClick={handleAddCustomColor}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#E8E2D9] hover:border-clay text-ink transition"
                >
                  + Add colour
                </button>
              </div>
            </div>

            {/* Opening Stock & Generate Button */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3 border-t border-[#E8E2D9]">
              <div className="flex items-center gap-2">
                <label className="text-xs font-semibold text-ink">
                  Default opening stock for each combination:
                </label>
                <input
                  type="number"
                  min="0"
                  value={matrixStockInput}
                  onChange={(e) => setMatrixStockInput(e.target.value)}
                  className="w-16 px-2 py-1 text-xs font-semibold text-center rounded-lg bg-white border border-[#E8E2D9]"
                />
              </div>

              <button
                type="button"
                onClick={handleRunMatrixGenerator}
                disabled={isGeneratingMatrix || !productForm.id}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] disabled:opacity-50 transition shadow-xs"
              >
                <Sparkles className={`w-3.5 h-3.5 ${isGeneratingMatrix ? 'animate-spin' : ''}`} />
                <span>
                  {productForm.id
                    ? '✨ Generate All Combinations'
                    : 'Save Draft First to Generate'}
                </span>
              </button>
            </div>
          </div>

          {/* INVENTORY TABLE */}
          <div className="space-y-3 pt-2">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider">
                Variant Inventory ({variants.length} SKU{variants.length === 1 ? '' : 's'})
              </span>

              {/* Bulk Quick Stock Setter */}
              {variants.length > 0 && (
                <div className="flex items-center gap-1.5 text-xs">
                  <span className="text-ink-muted">Set all stock to:</span>
                  <input
                    type="number"
                    min="0"
                    value={bulkStockValue}
                    onChange={(e) => setBulkStockValue(e.target.value)}
                    className="w-14 px-2 py-1 text-xs text-center rounded-lg bg-[#FAF7F0] border border-[#E8E2D9]"
                  />
                  <button
                    type="button"
                    onClick={handleApplyBulkStock}
                    className="px-2.5 py-1 text-xs font-semibold rounded-lg bg-white border border-[#E8E2D9] hover:border-clay text-ink transition"
                  >
                    Apply All
                  </button>
                </div>
              )}
            </div>

            {variants.length === 0 ? (
              <div className="p-8 text-center bg-[#FAF7F0] rounded-xl border border-[#E8E2D9] text-xs text-ink-muted space-y-2">
                <Boxes className="w-8 h-8 mx-auto text-ink-muted/40" />
                <p className="font-medium text-ink">No sizes or colours added yet.</p>
                <p>Use the combination generator above to create variants in 1 click.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F0] border-b border-[#E8E2D9] text-ink-muted uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Colour</th>
                        <th className="py-2.5 px-3">Size</th>
                        <th className="py-2.5 px-3">SKU</th>
                        <th className="py-2.5 px-3">Stock on Hand</th>
                        <th className="py-2.5 px-3">Active</th>
                        <th className="py-2.5 px-3 text-right">Delete</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#E8E2D9]">
                      {variants.map((v) => {
                        const currentStock = v.stock ?? 0;
                        return (
                          <tr key={v.id} className="hover:bg-[#FAF7F0]/60 transition">
                            {/* Colour */}
                            <td className="py-2.5 px-3 font-medium text-ink">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                                  style={{ backgroundColor: v.colour_hex || '#FAF7F0' }}
                                />
                                <span>{v.colour}</span>
                              </div>
                            </td>

                            {/* Size */}
                            <td className="py-2.5 px-3 font-semibold text-ink">
                              {v.size}
                            </td>

                            {/* SKU */}
                            <td className="py-2.5 px-3 font-mono text-ink-muted">
                              {v.sku}
                            </td>

                            {/* Stock with quick +/- buttons */}
                            <td className="py-2.5 px-3">
                              <div className="flex items-center gap-1.5">
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSaveVariant({ ...v, stock: Math.max(0, currentStock - 1) })
                                  }
                                  className="w-6 h-6 rounded bg-[#FAF7F0] border border-[#E8E2D9] hover:bg-[#F3EFE6] font-bold text-ink"
                                >
                                  -
                                </button>
                                <input
                                  type="number"
                                  min="0"
                                  value={currentStock}
                                  onChange={(e) =>
                                    onSaveVariant({
                                      ...v,
                                      stock: Math.max(0, parseInt(e.target.value, 10) || 0),
                                    })
                                  }
                                  className="w-14 px-1.5 py-1 text-center font-semibold rounded bg-[#FAF7F0] border border-[#E8E2D9]"
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    onSaveVariant({ ...v, stock: currentStock + 1 })
                                  }
                                  className="w-6 h-6 rounded bg-[#FAF7F0] border border-[#E8E2D9] hover:bg-[#F3EFE6] font-bold text-ink"
                                >
                                  +
                                </button>
                              </div>
                            </td>

                            {/* Active Toggle */}
                            <td className="py-2.5 px-3">
                              <input
                                type="checkbox"
                                checked={v.is_active}
                                onChange={(e) =>
                                  onSaveVariant({ ...v, is_active: e.target.checked })
                                }
                                className="w-4 h-4 rounded text-clay focus:ring-clay"
                              />
                            </td>

                            {/* Delete */}
                            <td className="py-2.5 px-3 text-right">
                              <button
                                type="button"
                                onClick={() => onDeleteVariant(v.id)}
                                className="p-1 rounded text-ink-muted hover:text-rose-600 transition"
                                title="Delete variant"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}
          </div>

          {/* Step 4 Actions */}
          <div className="flex items-center justify-between pt-6 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => setCurrentStep(3)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-ink-soft hover:text-ink border border-[#E8E2D9] text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Pricing</span>
            </button>
            <button
              type="button"
              onClick={() => setCurrentStep(5)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
            >
              <span>Continue to Final Review</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* STEP 5: REVIEW & PUBLISH */}
      {currentStep === 5 && (
        <section className="bg-white rounded-2xl border border-[#E8E2D9] p-6 lg:p-8 shadow-xs space-y-8">
          <div className="border-b border-[#E8E2D9] pb-4">
            <h3 className="font-serif text-xl font-bold text-ink">
              Step 5: Review and publish to storefront
            </h3>
            <p className="text-xs text-ink-muted mt-1">
              Check your garment's storefront card and verify every safety and quality requirement before going live.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-2">
            {/* STOREFRONT PREVIEW CARD */}
            <div className="space-y-3">
              <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                Storefront Customer View
              </span>
              <div className="max-w-sm mx-auto bg-[#FAF7F0] rounded-2xl border border-[#E8E2D9] overflow-hidden shadow-sm">
                <div className="relative aspect-[4/5] bg-white overflow-hidden">
                  {coverUrl ? (
                    <img
                      src={coverUrl}
                      alt={productForm.name}
                      className="w-full h-full object-cover object-center"
                    />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-ink-muted/50">
                      <ImageIcon className="w-10 h-10 mb-2" />
                      <span className="text-xs">No cover photo selected</span>
                    </div>
                  )}

                  {discountPercent > 0 && (
                    <div className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-clay text-white text-[11px] font-bold shadow-xs">
                      {discountPercent}% OFF
                    </div>
                  )}
                </div>

                <div className="p-4 space-y-2 bg-white">
                  <div className="flex items-center justify-between text-[11px] text-ink-muted uppercase tracking-wider">
                    <span>Little Loom</span>
                    <span>{categoryIds.length > 0 ? 'Verified' : 'Uncategorized'}</span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-ink leading-tight">
                    {productForm.name || 'Everyday Cotton Romper'}
                  </h4>

                  <div className="flex items-baseline gap-2 pt-1">
                    <span className="font-serif font-bold text-base text-ink">
                      {productForm.price ? formatINR(Number(productForm.price)) : '₹—'}
                    </span>
                    {productForm.compare_at_price && (
                      <span className="text-xs text-ink-muted line-through">
                        {formatINR(Number(productForm.compare_at_price))}
                      </span>
                    )}
                  </div>

                  {/* Size Chips Preview */}
                  <div className="flex flex-wrap gap-1 pt-2">
                    {variants.slice(0, 5).map((v) => (
                      <span
                        key={v.id}
                        className="px-2 py-0.5 rounded text-[10px] font-medium bg-[#FAF7F0] border border-[#E8E2D9] text-ink"
                      >
                        {v.size}
                      </span>
                    ))}
                    {variants.length > 5 && (
                      <span className="text-[10px] text-ink-muted self-center">
                        +{variants.length - 5} more
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* QUALITY CHECKLIST & PUBLISH ACTIONS */}
            <div className="space-y-6">
              <div className="space-y-3">
                <span className="text-xs font-semibold text-ink uppercase tracking-wider block">
                  Storefront Launch Checklist
                </span>

                <div className="space-y-2">
                  {[
                    {
                      label: 'Product name and URL handle',
                      ok: Boolean(productForm.name?.trim() && productForm.slug?.trim()),
                    },
                    {
                      label: 'Fabric material and care instructions',
                      ok: Boolean(
                        (productForm.material?.trim() || productForm.fabric_composition?.trim()) &&
                          productForm.care_instructions?.trim()
                      ),
                    },
                    {
                      label: 'Garment measurements table by size',
                      ok: Boolean(productForm.size_measurements?.trim()),
                    },
                    {
                      label: 'Category and Age group assigned',
                      ok:
                        categoryIds.some((id) =>
                          categories.some((c) => c.id === id && c.kind === 'product')
                        ) &&
                        categoryIds.some((id) =>
                          categories.some((c) => c.id === id && c.kind === 'age')
                        ),
                    },
                    {
                      label: 'Selling price entered',
                      ok: Boolean(productForm.price && Number(productForm.price) > 0),
                    },
                    {
                      label: 'Authorized ImageKit product photo uploaded',
                      ok: gallery.some((g) => {
                        const a = Array.isArray(g.media_assets) ? g.media_assets[0] : g.media_assets;
                        return a?.provider === 'imagekit' && a?.purpose === 'product' && a?.lifecycle_status === 'active';
                      }),
                    },
                    {
                      label: 'Active variants with SKUs and verified stock',
                      ok:
                        variants.length > 0 &&
                        variants.every((v) => v.is_active && v.sku && v.size && v.colour && (v.stock ?? 0) >= 0),
                    },
                    {
                      label: 'No owner review or intake hold tags',
                      ok: !['owner-intake', 'owner-review-required', 'proposed-name', 'proposed-price'].some(
                        (tag) => productForm.tags?.includes(tag)
                      ),
                    },
                  ].map((check, i) => (
                    <div
                      key={i}
                      className={`flex items-center gap-2.5 p-2.5 rounded-xl text-xs font-medium border ${
                        check.ok
                          ? 'bg-emerald-50/60 border-emerald-200 text-emerald-900'
                          : 'bg-[#FAF7F0] border-[#E8E2D9] text-ink-muted'
                      }`}
                    >
                      {check.ok ? (
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0" />
                      )}
                      <span>{check.label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* PUBLISH OR DRAFT DECISION BOX */}
              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-4">
                {canPublish ? (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs">
                      <Sparkles className="w-4 h-4" />
                      <span>Ready for Customer Orders!</span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      All quality, safety, and inventory checks have passed. Publishing will make this item immediately visible and shoppable on the storefront.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        setProductForm({ ...productForm, status: 'published' });
                        setIsSaving(true);
                        // Save with published status
                        setTimeout(() => {
                          onSaveProduct(e).finally(() => setIsSaving(false));
                        }, 50);
                      }}
                      disabled={isSaving}
                      className="w-full py-3 px-4 rounded-xl bg-emerald-700 hover:bg-emerald-800 text-white font-semibold text-sm transition shadow-sm flex items-center justify-center gap-2"
                    >
                      <Sparkles className="w-4 h-4" />
                      <span>🚀 Publish Product to Storefront</span>
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-amber-800 font-semibold text-xs">
                      <AlertTriangle className="w-4 h-4" />
                      <span>Missing Requirements Before Publishing</span>
                    </div>
                    <p className="text-xs text-ink-muted">
                      Please resolve the missing checklist items above before setting this garment live. You can safely save your progress as a draft.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        setProductForm({ ...productForm, status: 'draft' });
                        setIsSaving(true);
                        onSaveProduct(e).finally(() => setIsSaving(false));
                      }}
                      disabled={isSaving}
                      className="w-full py-3 px-4 rounded-xl bg-ink hover:bg-ink-soft text-white font-semibold text-xs transition shadow-2xs flex items-center justify-center gap-2"
                    >
                      <Save className="w-4 h-4" />
                      <span>Save as Draft</span>
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Step 5 Back Action */}
          <div className="pt-4 border-t border-[#E8E2D9]">
            <button
              type="button"
              onClick={() => setCurrentStep(4)}
              className="inline-flex items-center gap-2 px-4 py-2 rounded-xl text-ink-soft hover:text-ink border border-[#E8E2D9] text-xs font-semibold transition"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Back to Sizes & Stock</span>
            </button>
          </div>
        </section>
      )}
    </div>
  );
}
