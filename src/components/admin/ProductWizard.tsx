import React, { useState, useMemo, useEffect } from 'react';
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
import type { Department } from '../../types';

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

// DEPARTMENT CONFIGURATIONS & PRESETS
const DEPARTMENTS: { id: Department; label: string; icon: string; brand: string }[] = [
  { id: 'kids', label: "Children's Clothing", icon: '🧸', brand: 'Little Loom' },
  { id: 'jewellery', label: 'Jewellery', icon: '💎', brand: 'VJ Jewellery' },
  { id: 'women_suits', label: "Women's Suits", icon: '👗', brand: 'VJ Suits & Fabrics' },
  { id: 'home_textiles', label: 'Home Textiles', icon: '🛏️', brand: 'VJ Living' },
];

const PRESET_SIZES_BY_DEPT: Record<Department, string[]> = {
  kids: ['0-3M', '3-6M', '6-12M', '1-2Y', '2-3Y', '3-4Y', '4-5Y', '5-6Y'],
  jewellery: ['Standard Set', 'One Size', 'Size 6', 'Size 7', 'Size 8', 'Size 9', 'Adjustable'],
  women_suits: ['Unstitched Fabric Set', 'Standard (2.5m+2.5m)', '3-Piece Set'],
  home_textiles: ['Single Bed (60×90 in)', 'Double Bed (90×100 in)', 'Queen Bed', 'King Bed', 'Pack of 2', 'Pack of 4'],
};

const PRESET_COLOURS_BY_DEPT: Record<Department, { name: string; hex: string }[]> = {
  kids: [
    { name: 'Ivory', hex: '#FFFFF0' },
    { name: 'Oatmeal', hex: '#E3DAC9' },
    { name: 'Sage', hex: '#9CAF88' },
    { name: 'Terracotta', hex: '#E2725B' },
    { name: 'Dusty Rose', hex: '#DCAE96' },
    { name: 'Sky Blue', hex: '#87CEEB' },
    { name: 'Olive', hex: '#808000' },
    { name: 'Mustard', hex: '#FFDB58' },
  ],
  jewellery: [
    { name: 'Gold Plated', hex: '#D4AF37' },
    { name: 'Silver Plated', hex: '#C0C0C0' },
    { name: 'Rose Gold', hex: '#B76E79' },
    { name: 'Antique Gold', hex: '#996515' },
    { name: 'Oxidised Silver', hex: '#696969' },
    { name: 'Kundan Green', hex: '#2E8B57' },
    { name: 'Ruby Maroon', hex: '#800020' },
    { name: 'Pearl White', hex: '#FDFBF7' },
  ],
  women_suits: [
    { name: 'Mustard Yellow', hex: '#E1AD01' },
    { name: 'Rani Pink', hex: '#E0115F' },
    { name: 'Royal Blue', hex: '#4169E1' },
    { name: 'Bottle Green', hex: '#006A4E' },
    { name: 'Wine Maroon', hex: '#722F37' },
    { name: 'Pastel Peach', hex: '#FFDAB9' },
    { name: 'Ivory Cream', hex: '#FFFFF0' },
  ],
  home_textiles: [
    { name: 'Classic White', hex: '#FFFFFF' },
    { name: 'Natural Oatmeal', hex: '#E3DAC9' },
    { name: 'Indigo Blue', hex: '#264348' },
    { name: 'Sage Green', hex: '#9CAF88' },
    { name: 'Dusty Terracotta', hex: '#C9826B' },
    { name: 'Charcoal Grey', hex: '#36454F' },
  ],
};

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

  // Active department
  const currentDept: Department = productForm.product_type || 'kids';

  // Matrix Generator Local State
  const defaultSizes = PRESET_SIZES_BY_DEPT[currentDept] || PRESET_SIZES_BY_DEPT.kids;
  const defaultColours = PRESET_COLOURS_BY_DEPT[currentDept] || PRESET_COLOURS_BY_DEPT.kids;

  const [matrixSizes, setMatrixSizes] = useState<string[]>(defaultSizes.slice(0, 3));
  const [matrixColours, setMatrixColours] = useState<{ name: string; hex: string }[]>(defaultColours.slice(0, 2));
  const [customSizeInput, setCustomSizeInput] = useState('');
  const [customColorName, setCustomColorName] = useState('');
  const [customColorHex, setCustomColorHex] = useState('#D4AF37');
  const [matrixStockInput, setMatrixStockInput] = useState('10');
  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState(false);
  const [bulkStockValue, setBulkStockValue] = useState('15');

  // Update matrix options when department changes
  useEffect(() => {
    const dSizes = PRESET_SIZES_BY_DEPT[currentDept] || PRESET_SIZES_BY_DEPT.kids;
    const dColours = PRESET_COLOURS_BY_DEPT[currentDept] || PRESET_COLOURS_BY_DEPT.kids;
    setMatrixSizes(dSizes.slice(0, 3));
    setMatrixColours(dColours.slice(0, 2));
  }, [currentDept]);

  // Specifications helper
  const specs = productForm.specifications || {};
  const updateSpec = (key: string, value: any) => {
    setProductForm((prev: any) => ({
      ...prev,
      specifications: {
        ...(prev.specifications || {}),
        [key]: value,
      },
    }));
  };

  // Filter categories relevant to the selected department
  const filteredProductCategories = useMemo(() => {
    return categories.filter((c) => {
      if (c.kind !== 'product') return false;
      if (!c.department || c.department === 'kids') {
        return currentDept === 'kids';
      }
      return c.department === currentDept;
    });
  }, [categories, currentDept]);

  const ageCategories = useMemo(() => {
    return categories.filter((c) => c.kind === 'age');
  }, [categories]);

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

  // Add Custom Size to Matrix
  const handleAddCustomSize = () => {
    if (!customSizeInput.trim()) return;
    if (!matrixSizes.includes(customSizeInput.trim())) {
      setMatrixSizes([...matrixSizes, customSizeInput.trim()]);
    }
    setCustomSizeInput('');
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
    { num: 1, label: 'Details & Specs', heading: 'Product specifications and category' },
    { num: 2, label: 'Photos', heading: 'Add beautiful product photography' },
    { num: 3, label: 'Pricing & Sets', heading: 'Set price & showcase in collections' },
    { num: 4, label: 'Variants & Stock', heading: 'Options, sizes, colours & inventory' },
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
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[11px] font-semibold text-clay uppercase tracking-wider block">
                {productForm.id ? 'Editing Existing Product' : 'Creating New Product'}
              </span>
              <span className="text-[11px] font-bold px-2 py-0.2 rounded-full border bg-white border-[#E8E2D9] text-ink">
                {DEPARTMENTS.find((d) => d.id === currentDept)?.icon}{' '}
                {DEPARTMENTS.find((d) => d.id === currentDept)?.brand}
              </span>
            </div>
            <h2 className="font-serif text-2xl font-bold text-ink leading-tight">
              {productForm.name || 'Untitled Piece'}
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

      {/* DEPARTMENT SELECTOR SWITCHER PILL */}
      <div className="bg-[#FAF7F0] p-2 rounded-2xl border border-[#E8E2D9] flex flex-wrap items-center justify-between gap-2">
        <span className="text-xs font-semibold text-ink-muted pl-2">Department:</span>
        <div className="flex flex-wrap gap-1.5">
          {DEPARTMENTS.map((dept) => {
            const isSelected = currentDept === dept.id;
            return (
              <button
                key={dept.id}
                type="button"
                onClick={() => {
                  setProductForm((prev: any) => ({
                    ...prev,
                    product_type: dept.id,
                  }));
                }}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 ${
                  isSelected
                    ? 'bg-clay text-white shadow-xs'
                    : 'bg-white text-ink border border-[#E8E2D9] hover:border-clay/50'
                }`}
              >
                <span>{dept.icon}</span>
                <span>{dept.label}</span>
              </button>
            );
          })}
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

      {/* STEP 1: DETAILS & CATEGORY-SPECIFIC SPECIFICATIONS */}
      {currentStep === 1 && (
        <section className="bg-white rounded-2xl border border-[#E8E2D9] p-6 lg:p-8 shadow-xs space-y-6">
          <div className="border-b border-[#E8E2D9] pb-4 flex items-center justify-between">
            <div>
              <h3 className="font-serif text-xl font-bold text-ink">
                Step 1: {DEPARTMENTS.find((d) => d.id === currentDept)?.brand} Details
              </h3>
              <p className="text-xs text-ink-muted mt-1">
                Provide editorial name, description, categories, and tailored department specifications.
              </p>
            </div>
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
                  placeholder={
                    currentDept === 'jewellery'
                      ? 'e.g. Kundan Choker Necklace Set'
                      : currentDept === 'women_suits'
                      ? 'e.g. Chanderi Silk Zari Suit Set'
                      : currentDept === 'home_textiles'
                      ? 'e.g. Sanganeri Handblock Cotton Bedsheet'
                      : 'e.g. Everyday Cotton Romper'
                  }
                  value={productForm.name}
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-sm rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
                  required
                />
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

            {/* Description */}
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Product Description *
              </label>
              <textarea
                rows={3}
                placeholder="A thoughtful editorial description highlighting craftsmanship, materials, silhouette, and finish..."
                value={productForm.description}
                onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] focus:outline-none focus:border-clay"
              />
            </div>

            {/* Categories Selection */}
            <div className="space-y-3 pt-2">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Select {DEPARTMENTS.find((d) => d.id === currentDept)?.label} Category *
              </label>
              <div className="flex flex-wrap gap-2">
                {filteredProductCategories.length > 0 ? (
                  filteredProductCategories.map((c) => {
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
                  })
                ) : (
                  <span className="text-xs text-ink-muted">
                    No categories created yet for this department. Use the Categories tab to create one, or select any active category.
                  </span>
                )}
              </div>
            </div>

            {/* AGE GROUPS (ONLY FOR CHILDREN'S CLOTHING) */}
            {currentDept === 'kids' && (
              <div className="space-y-2 pt-2 border-t border-[#E8E2D9]">
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                  Target Age Group(s) *
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
            )}

            {/* ------------------------------------------------------------- */}
            {/* DEPARTMENT-SPECIFIC SPECIFICATIONS SECTION */}
            {/* ------------------------------------------------------------- */}

            {/* 1. JEWELLERY SPECIFICATIONS */}
            {currentDept === 'jewellery' && (
              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
                  <div className="flex items-center gap-2 text-ink font-serif font-bold text-base">
                    <span>💎</span>
                    <span>Jewellery Specifications</span>
                  </div>
                  <span className="text-[11px] text-ink-muted">Fields optional if unprovided</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {/* Jewellery Subcategory */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Jewellery Type
                    </label>
                    <select
                      value={specs.subcategory || 'necklace_sets'}
                      onChange={(e) => updateSpec('subcategory', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    >
                      <option value="necklace_sets">Necklace Set</option>
                      <option value="earrings">Earrings</option>
                      <option value="rings">Ring</option>
                    </select>
                  </div>

                  {/* Material */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Base Material
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Brass, Sterling Silver, Copper"
                      value={productForm.material || specs.material || ''}
                      onChange={(e) => {
                        setProductForm({ ...productForm, material: e.target.value });
                        updateSpec('material', e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    />
                  </div>

                  {/* Plating / Finish */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Plating / Finish
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 18K Gold Plated, Silver, Oxidised"
                      value={specs.platingFinish || ''}
                      onChange={(e) => updateSpec('platingFinish', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    />
                  </div>

                  {/* Fields for Necklace Sets */}
                  {(specs.subcategory === 'necklace_sets' || !specs.subcategory) && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Number of Pieces
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 2 (Necklace + Earrings)"
                          value={specs.piecesCount || ''}
                          onChange={(e) => updateSpec('piecesCount', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>
                      <div className="sm:col-span-2">
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Set Contents
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 1 Choker Necklace, 1 Pair Dangling Earrings, 1 Maang Tikka"
                          value={specs.setContents || ''}
                          onChange={(e) => updateSpec('setContents', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>
                    </>
                  )}

                  {/* Fields for Earrings */}
                  {specs.subcategory === 'earrings' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Earring Type
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Jhumkas, Studs, Chandbalis, Drops"
                          value={specs.earringType || ''}
                          onChange={(e) => updateSpec('earringType', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Closure Type
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Push Back, Screw Back, Fish Hook"
                          value={specs.closureType || ''}
                          onChange={(e) => updateSpec('closureType', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>
                    </>
                  )}

                  {/* Fields for Rings */}
                  {specs.subcategory === 'rings' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Ring Size
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 7, 8, or Adjustable"
                          value={specs.ringSize || ''}
                          onChange={(e) => updateSpec('ringSize', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>
                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Sizing Structure
                        </label>
                        <select
                          value={specs.isAdjustable ? 'adjustable' : 'fixed'}
                          onChange={(e) => updateSpec('isAdjustable', e.target.value === 'adjustable')}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        >
                          <option value="fixed">Fixed Size</option>
                          <option value="adjustable">Adjustable Band</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Jewellery Care Instructions */}
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Jewellery Care Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Wipe with clean cloth after use. Store in airtight zip lock pouch away from perfume and moisture."
                      value={productForm.care_instructions || specs.careInstructions || ''}
                      onChange={(e) => {
                        setProductForm({ ...productForm, care_instructions: e.target.value });
                        updateSpec('careInstructions', e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 2. WOMEN'S UNSTITCHED SUITS SPECIFICATIONS */}
            {currentDept === 'women_suits' && (
              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
                  <div className="flex items-center gap-2 text-ink font-serif font-bold text-base">
                    <span>👗</span>
                    <span>Women's Unstitched Suits & Fabrics</span>
                  </div>
                  <span className="text-[11px] text-ink-muted">All fabric lengths clearly specified with units</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {/* Fabric Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Fabric Type *
                    </label>
                    <select
                      value={specs.fabricType || 'Cotton'}
                      onChange={(e) => {
                        updateSpec('fabricType', e.target.value);
                        setProductForm({ ...productForm, fabric_composition: e.target.value, material: e.target.value });
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    >
                      <option value="Cotton">Pure Cotton</option>
                      <option value="Silk">Silk / Chanderi Silk</option>
                      <option value="Organza">Organza</option>
                      <option value="Banarasi">Banarasi Brocade / Zari</option>
                      <option value="Rayon">Rayon</option>
                      <option value="Wool">Pure Wool / Pashmina</option>
                      <option value="Other">Other Handloom</option>
                    </select>
                  </div>

                  {/* Pattern */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Pattern / Weave
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Floral Handblock, Zari Border, Bandhani"
                      value={specs.pattern || ''}
                      onChange={(e) => updateSpec('pattern', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    />
                  </div>

                  {/* Suit Pieces Included */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Pieces Included
                    </label>
                    <select
                      value={specs.suitPieces || '3-piece'}
                      onChange={(e) => updateSpec('suitPieces', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    >
                      <option value="3-piece">3 Piece (Top, Bottom & Dupatta)</option>
                      <option value="2-piece-bottom">2 Piece (Top & Bottom)</option>
                      <option value="2-piece-dupatta">2 Piece (Top & Dupatta)</option>
                    </select>
                  </div>

                  {/* Top Fabric Length with Unit */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Top (Kurta) Fabric Length
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.05"
                        placeholder="2.50"
                        value={specs.topLength ?? ''}
                        onChange={(e) => updateSpec('topLength', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                      />
                      <select
                        value={specs.topLengthUnit || 'meters'}
                        onChange={(e) => updateSpec('topLengthUnit', e.target.value)}
                        className="px-2 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                      >
                        <option value="meters">Meters</option>
                        <option value="yards">Yards</option>
                      </select>
                    </div>
                  </div>

                  {/* Bottom Fabric Length with Unit */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Bottom Fabric Length
                    </label>
                    <div className="flex gap-2">
                      <input
                        type="number"
                        step="0.05"
                        placeholder="2.50"
                        value={specs.bottomLength ?? ''}
                        onChange={(e) => updateSpec('bottomLength', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                      />
                      <select
                        value={specs.bottomLengthUnit || 'meters'}
                        onChange={(e) => updateSpec('bottomLengthUnit', e.target.value)}
                        className="px-2 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                      >
                        <option value="meters">Meters</option>
                        <option value="yards">Yards</option>
                      </select>
                    </div>
                  </div>

                  {/* Dupatta Toggle & Details */}
                  <div className="flex items-center gap-3 pt-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={specs.dupattaIncluded ?? true}
                        onChange={(e) => updateSpec('dupattaIncluded', e.target.checked)}
                        className="w-4 h-4 rounded text-clay focus:ring-clay"
                      />
                      <span className="text-xs font-semibold text-ink">Dupatta Included</span>
                    </label>
                  </div>

                  {(specs.dupattaIncluded ?? true) && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Dupatta Fabric
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pure Organza, Chiffon, Silk"
                          value={specs.dupattaFabric || ''}
                          onChange={(e) => updateSpec('dupattaFabric', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Dupatta Length
                        </label>
                        <div className="flex gap-2">
                          <input
                            type="number"
                            step="0.05"
                            placeholder="2.25"
                            value={specs.dupattaLength ?? ''}
                            onChange={(e) => updateSpec('dupattaLength', e.target.value)}
                            className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                          />
                          <select
                            value={specs.dupattaLengthUnit || 'meters'}
                            onChange={(e) => updateSpec('dupattaLengthUnit', e.target.value)}
                            className="px-2 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                          >
                            <option value="meters">Meters</option>
                            <option value="yards">Yards</option>
                          </select>
                        </div>
                      </div>
                    </>
                  )}

                  {/* Wash & Care */}
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Wash & Care Instructions *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Dry clean recommended for silk and organza. Gentle hand wash in cold water for cotton."
                      value={productForm.care_instructions || specs.washCare || ''}
                      onChange={(e) => {
                        setProductForm({ ...productForm, care_instructions: e.target.value });
                        updateSpec('washCare', e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 3. HOME TEXTILES SPECIFICATIONS */}
            {currentDept === 'home_textiles' && (
              <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-4">
                <div className="flex items-center justify-between border-b border-[#E8E2D9] pb-3">
                  <div className="flex items-center gap-2 text-ink font-serif font-bold text-base">
                    <span>🛏️</span>
                    <span>Home Textiles & Bedding Specifications</span>
                  </div>
                  <span className="text-[11px] text-ink-muted">Confirmed dimension units</span>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
                  {/* Textile Product Type */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Textile Item Type
                    </label>
                    <select
                      value={specs.textileType || 'bedsheet'}
                      onChange={(e) => updateSpec('textileType', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    >
                      <option value="bedsheet">Cotton Bedsheet</option>
                      <option value="top_sheet">Single Bed Top Sheet / Odhne Wali Chaddar</option>
                      <option value="pillow_cover">Pillow Covers</option>
                    </select>
                  </div>

                  {/* Bed Size */}
                  {specs.textileType === 'bedsheet' && (
                    <div>
                      <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                        Bed Size
                      </label>
                      <select
                        value={specs.bedSize || 'Double'}
                        onChange={(e) => updateSpec('bedSize', e.target.value)}
                        className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                      >
                        <option value="Single">Single Bed</option>
                        <option value="Double">Double Bed</option>
                        <option value="Queen">Queen Bed</option>
                        <option value="King">King Bed</option>
                      </select>
                    </div>
                  )}

                  {/* Fabric Composition */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Fabric Material *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100% Pure Cotton"
                      value={productForm.fabric_composition || specs.fabric || '100% Pure Cotton'}
                      onChange={(e) => {
                        setProductForm({ ...productForm, fabric_composition: e.target.value, material: e.target.value });
                        updateSpec('fabric', e.target.value);
                      }}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    />
                  </div>

                  {/* Dimensions: Length, Width, and Unit (CRITICAL FOR 60 x 90 SINGLE SHEET) */}
                  <div className="sm:col-span-2">
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Product Dimensions (Width × Length & Confirmed Unit) *
                    </label>
                    <div className="grid grid-cols-3 gap-2">
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted">W:</span>
                        <input
                          type="number"
                          placeholder={specs.textileType === 'top_sheet' ? '60' : '90'}
                          value={specs.width ?? ''}
                          onChange={(e) => updateSpec('width', e.target.value)}
                          className="w-full pl-7 pr-2 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>
                      <div className="relative">
                        <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[10px] text-ink-muted">L:</span>
                        <input
                          type="number"
                          placeholder={specs.textileType === 'top_sheet' ? '90' : '100'}
                          value={specs.length ?? ''}
                          onChange={(e) => updateSpec('length', e.target.value)}
                          className="w-full pl-7 pr-2 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>
                      <select
                        value={specs.dimensionUnit || 'inches'}
                        onChange={(e) => updateSpec('dimensionUnit', e.target.value)}
                        className="px-2 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9] font-medium"
                      >
                        <option value="inches">Inches (in)</option>
                        <option value="cm">Centimeters (cm)</option>
                        <option value="meters">Meters (m)</option>
                      </select>
                    </div>

                    {/* Verified 60x90 Note confirmation badge */}
                    {specs.textileType === 'top_sheet' && (
                      <span className="text-[11px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-lg block mt-2">
                        ✨ Handwritten spec verified: Single-bed top sheet stored as <strong>{specs.width || '60'} × {specs.length || '90'} {specs.dimensionUnit || 'inches'}</strong> in pure cotton.
                      </span>
                    )}
                  </div>

                  {/* Design / Pattern */}
                  <div>
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Design / Pattern
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Sanganeri Jaipuri Floral, Geometric Border"
                      value={specs.design || ''}
                      onChange={(e) => updateSpec('design', e.target.value)}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    />
                  </div>

                  {/* Bedsheet Pillow Covers */}
                  {specs.textileType === 'bedsheet' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Pillow Covers Included
                        </label>
                        <input
                          type="number"
                          placeholder="2"
                          value={specs.pillowCoversCount ?? ''}
                          onChange={(e) => updateSpec('pillowCoversCount', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Pillow Cover Dimensions
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. 18 × 28 inches (45 × 70 cm)"
                          value={specs.pillowCoverDimensions || ''}
                          onChange={(e) => updateSpec('pillowCoverDimensions', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>
                    </>
                  )}

                  {/* Pillow Cover Specific Fields */}
                  {specs.textileType === 'pillow_cover' && (
                    <>
                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Quantity per Pack
                        </label>
                        <input
                          type="text"
                          placeholder="e.g. Pack of 2"
                          value={specs.packQuantity || ''}
                          onChange={(e) => updateSpec('packQuantity', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                          Closure Type
                        </label>
                        <select
                          value={specs.closureType || 'Envelope / Flap'}
                          onChange={(e) => updateSpec('closureType', e.target.value)}
                          className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                        >
                          <option value="Envelope / Flap">Envelope / Flap</option>
                          <option value="Concealed Zipper">Concealed Zipper</option>
                          <option value="Button Closure">Button Closure</option>
                        </select>
                      </div>
                    </>
                  )}

                  {/* Care instructions */}
                  <div className="sm:col-span-2 md:col-span-3">
                    <label className="block text-[11px] font-bold text-ink uppercase tracking-wider mb-1">
                      Wash & Care Instructions
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Machine wash cold, gentle cycle. Warm iron if needed. Do not bleach."
                      value={productForm.care_instructions || ''}
                      onChange={(e) => setProductForm({ ...productForm, care_instructions: e.target.value })}
                      className="w-full px-3 py-2 text-xs rounded-xl bg-white border border-[#E8E2D9]"
                    />
                  </div>
                </div>
              </div>
            )}

            {/* 4. KIDSWEAR SPECIFICATIONS (GARMENT MEASUREMENTS TABLE) */}
            {currentDept === 'kids' && (
              <div className="space-y-4 pt-2 border-t border-[#E8E2D9]">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                      Fabric & Material *
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. 100% GOTS-Certified Organic Cotton"
                      value={productForm.material || productForm.fabric_composition || ''}
                      onChange={(e) => setProductForm({ ...productForm, material: e.target.value, fabric_composition: e.target.value })}
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

                {/* Garment Measurements & Presets */}
                <div className="space-y-2">
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
              </div>
            )}

            {/* Collapsed Advanced SEO & Tags */}
            <div className="pt-4 border-t border-[#E8E2D9]">
              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className="flex items-center gap-2 text-xs font-semibold text-ink-soft hover:text-ink transition"
              >
                <span>Optional Advanced SEO & Search Keywords</span>
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
                      placeholder="Title tag for search engines"
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
                      placeholder="Snippet for search results"
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
              Next: Upload editorial photography
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
                Upload photography via ImageKit. Assign photos to specific colours or set the primary storefront cover shot.
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
                Gallery ({gallery.length} photo{gallery.length === 1 ? '' : 's'})
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

            {/* Department-Tailored Editorial Badges */}
            <div className="pt-2 space-y-3">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                Editorial Badges & Tags
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { tag: 'new-arrival', label: '🌱 New Arrival' },
                  { tag: 'bestseller', label: '⭐ Bestseller' },
                  ...(currentDept === 'kids'
                    ? [
                        { tag: 'organic-cotton', label: '🌿 100% Organic' },
                        { tag: 'limited-edition', label: '✨ Limited Edition' },
                        { tag: 'seasonal-favourite', label: '☀️ Seasonal Favourite' },
                      ]
                    : currentDept === 'jewellery'
                    ? [
                        { tag: 'heirloom', label: '💎 Heirloom Collection' },
                        { tag: 'anti-tarnish', label: '✨ Anti-Tarnish Finish' },
                        { tag: 'festive-kundan', label: '👑 Festive Kundan' },
                      ]
                    : currentDept === 'women_suits'
                    ? [
                        { tag: 'pure-silk', label: '🪡 Pure Silk' },
                        { tag: 'organza-zari', label: '✨ Organza Zari' },
                        { tag: 'handloom-weave', label: '🧵 Handloom Weave' },
                      ]
                    : [
                        { tag: 'pure-cotton', label: '☁️ 100% Pure Cotton' },
                        { tag: 'hotel-luxury', label: '🏨 Hotel Luxury' },
                        { tag: 'handblock-print', label: '🎨 Handblock Print' },
                      ]),
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
              Select colours and {DEPARTMENTS.find((d) => d.id === currentDept)?.brand} sizes to generate full inventory combinations in 1 click, or add custom options.
            </p>
          </div>

          {/* BULK COMBINATION GENERATOR */}
          <div className="p-5 rounded-2xl bg-[#FAF7F0] border border-[#E8E2D9] space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-clay font-semibold text-xs tracking-wider uppercase">
                <Sparkles className="w-4 h-4" />
                <span>{DEPARTMENTS.find((d) => d.id === currentDept)?.brand} Combination Generator</span>
              </div>
              <span className="text-xs text-ink-muted">
                {matrixSizes.length} sizes × {matrixColours.length} colours ={' '}
                <strong>{matrixSizes.length * matrixColours.length} combinations</strong>
              </span>
            </div>

            {/* Sizing Chips */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                  1. Select Options / Sizes
                </label>
                <span className="text-[11px] text-ink-muted">Tailored for {DEPARTMENTS.find((d) => d.id === currentDept)?.label}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {(PRESET_SIZES_BY_DEPT[currentDept] || PRESET_SIZES_BY_DEPT.kids).map((sz) => {
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

              {/* Add Custom Size */}
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="text"
                  placeholder="Add custom size/option (e.g. Size 11, Double Bed, 3-Piece)"
                  value={customSizeInput}
                  onChange={(e) => setCustomSizeInput(e.target.value)}
                  className="px-3 py-1.5 text-xs rounded-xl bg-white border border-[#E8E2D9] focus:outline-none focus:border-clay w-64"
                />
                <button
                  type="button"
                  onClick={handleAddCustomSize}
                  className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-white border border-[#E8E2D9] hover:border-clay text-ink transition"
                >
                  + Add Option
                </button>
              </div>
            </div>

            {/* Colour Swatches */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider">
                2. Select Colour / Finish Palette
              </label>
              <div className="flex flex-wrap gap-2">
                {(PRESET_COLOURS_BY_DEPT[currentDept] || PRESET_COLOURS_BY_DEPT.kids).map((col) => {
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
              <div className="flex items-center gap-2 pt-1.5">
                <input
                  type="text"
                  placeholder="Custom colour/finish name (e.g. Antique Copper)"
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
                    ? '✨ Generate Combinations'
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
                <p>Use the combination generator above to create variants with zero or initial stock.</p>
              </div>
            ) : (
              <div className="bg-white rounded-xl border border-[#E8E2D9] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-[#FAF7F0] border-b border-[#E8E2D9] text-ink-muted uppercase tracking-wider font-semibold">
                      <tr>
                        <th className="py-2.5 px-3">Colour / Finish</th>
                        <th className="py-2.5 px-3">Size / Option</th>
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
              Check your product's customer card and verify every department safety and quality requirement before going live.
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
                    <span className="font-semibold text-clay">
                      {DEPARTMENTS.find((d) => d.id === currentDept)?.brand}
                    </span>
                    <span>{categoryIds.length > 0 ? 'Verified' : 'Uncategorized'}</span>
                  </div>

                  <h4 className="font-serif font-bold text-base text-ink leading-tight">
                    {productForm.name || 'Untitled Product'}
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
                  {DEPARTMENTS.find((d) => d.id === currentDept)?.brand} Launch Checklist
                </span>

                <div className="space-y-2">
                  {[
                    {
                      label: 'Product name and URL handle entered',
                      ok: Boolean(productForm.name?.trim() && productForm.slug?.trim()),
                    },
                    {
                      label: 'Product description provided',
                      ok: Boolean(productForm.description?.trim()),
                    },
                    ...(currentDept === 'kids'
                      ? [
                          {
                            label: 'Fabric details and care instructions',
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
                        ]
                      : [
                          {
                            label: 'Product category assigned',
                            ok: categoryIds.some((id) =>
                              categories.some((c) => c.id === id && c.kind === 'product')
                            ),
                          },
                        ]),
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
                      All quality, safety, and inventory checks have passed for this {DEPARTMENTS.find((d) => d.id === currentDept)?.brand} item.
                    </p>
                    <button
                      type="button"
                      onClick={(e) => {
                        setProductForm({ ...productForm, status: 'published' });
                        setIsSaving(true);
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
                      Please resolve the missing checklist items above before setting this item live. You can safely save your progress as a draft.
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
