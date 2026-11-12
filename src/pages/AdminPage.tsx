import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import {
  Plus,
  Copy,
  Trash2,
  Search,
  CheckCircle2,
  AlertTriangle,
  Eye,
  RefreshCw,
  Sparkles,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';
import { supabase, isSupabaseConfigured, publicMediaUrl } from '../lib/supabase';
import Button from '../components/Button';
import AdminContentPage from './AdminContentPage';
import { formatINR } from '../data';
import { ageNavigation } from '../data/storeNavigation';

type Tab =
  | 'overview'
  | 'products'
  | 'categories'
  | 'media'
  | 'homepage'
  | 'collections'
  | 'content'
  | 'customers'
  | 'roles'
  | 'orders'
  | 'settings';
type Status = 'loading' | 'signed-out' | 'denied' | 'ready' | 'unconfigured';
type ProductForm = {
  id?: string;
  name: string;
  slug: string;
  description: string;
  material: string;
  fabric_composition: string;
  care_instructions: string;
  size_measurements: string;
  price: string;
  compare_at_price: string;
  status: string;
  seo_title: string;
  seo_description: string;
  tags: string[];
};

const emptyProduct: ProductForm = {
  name: '',
  slug: '',
  description: '',
  material: '',
  fabric_composition: '',
  care_instructions: '',
  size_measurements: '',
  price: '',
  compare_at_price: '',
  status: 'draft',
  seo_title: '',
  seo_description: '',
  tags: [],
};

const purposes = [
  'product',
  'collection',
  'category',
  'homepage_hero',
  'campaign',
  'brand_story',
  'lookbook',
  'video',
];

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

const MEASUREMENT_TEMPLATES = {
  romper: `Size | Chest (in) | Length (in) | Inseam (in)
0-3M | 17" | 14.0" | 6.0"
3-6M | 18" | 15.5" | 7.0"
6-12M | 19" | 17.0" | 8.0"
1-2Y | 20" | 18.5" | 9.5"
2-3Y | 21" | 20.0" | 11.0"
3-4Y | 22" | 21.5" | 12.5"
(Measurements taken flat across garment)`,
  coord: `Size | Chest (in) | Top Length (in) | Waist (in) | Bottom Length (in)
0-3M | 17" | 10.5" | 15" | 11.0"
3-6M | 18" | 11.5" | 16" | 12.5"
6-12M | 19" | 12.5" | 17" | 14.0"
1-2Y | 20" | 14.0" | 18" | 16.0"
2-3Y | 21" | 15.0" | 19" | 18.0"
3-4Y | 22" | 16.0" | 20" | 20.0"
(Measurements taken flat across garment)`,
  dress: `Size | Chest (in) | Dress Length (in) | Shoulder (in)
0-3M | 17" | 13.5" | 6.5"
3-6M | 18" | 15.0" | 7.0"
6-12M | 19" | 16.5" | 7.5"
1-2Y | 20" | 18.0" | 8.0"
2-3Y | 21" | 20.0" | 8.5"
3-4Y | 22" | 22.0" | 9.0"
(Measurements taken flat across garment)`,
  tee: `Size | Chest (in) | Tee Length (in) | Shoulder (in)
0-3M | 17" | 10.5" | 6.5"
3-6M | 18" | 11.5" | 7.0"
6-12M | 19" | 12.5" | 7.5"
1-2Y | 20" | 14.0" | 8.0"
2-3Y | 21" | 15.0" | 8.5"
3-4Y | 22" | 16.0" | 9.0"
(Measurements taken flat across garment)`,
};

function fileSha256(file: File) {
  return file
    .arrayBuffer()
    .then((buffer) => crypto.subtle.digest('SHA-256', buffer))
    .then((hash) =>
      [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join('')
    );
}

function pendingProductApprovals(product: any): string[] {
  const missing: string[] = [];
  if (
    product.tags?.includes('owner-intake') ||
    product.tags?.includes('owner-review-required') ||
    product.tags?.includes('proposed-name') ||
    /intake draft/i.test(product.name || '')
  )
    missing.push('owner-approved name');
  if (product.tags?.includes('proposed-price')) missing.push('verified price');
  if (product.price == null || Number(product.price) <= 0) missing.push('price');
  if (!product.description?.trim()) missing.push('description');
  if (!(product.material?.trim() || product.fabric_composition?.trim()))
    missing.push('fabric details');
  if (!product.care_instructions?.trim()) missing.push('care instructions');
  if (!product.size_measurements?.trim()) missing.push('garment measurements by size');
  const links = product.product_categories || [];
  const kinds = links.map(
    (link: any) => (Array.isArray(link.categories) ? link.categories[0] : link.categories)?.kind
  );
  if (!kinds.includes('product')) missing.push('product category');
  if (!kinds.includes('age')) missing.push('age group');
  const variants = product.product_variants || [];
  const hasInventory =
    variants.length > 0 &&
    variants.every((variant: any) => {
      const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
      return (
        variant.is_active &&
        String(variant.sku || '').trim() &&
        String(variant.size || '').trim() &&
        String(variant.colour || '').trim() &&
        inventory &&
        Number.isFinite(Number(inventory.quantity_on_hand))
      );
    });
  if (!hasInventory) missing.push('verified sizes, colours, SKUs and stock');
  const assets = (product.product_media || [])
    .map((link: any) =>
      Array.isArray(link.media_assets) ? link.media_assets[0] : link.media_assets
    )
    .filter(Boolean);
  if (
    !assets.some(
      (asset: any) =>
        asset.provider === 'imagekit' &&
        asset.purpose === 'product' &&
        asset.lifecycle_status === 'active'
    )
  )
    missing.push('authorized ImageKit product photos');
  return missing;
}

export default function AdminPage() {
  const [access, setAccess] = useState<Status>(isSupabaseConfigured ? 'loading' : 'unconfigured');
  const [tab, setTab] = useState<Tab>('overview');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [products, setProducts] = useState<any[]>([]);
  const [orders, setOrders] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [dashboard, setDashboard] = useState<any>(null);
  const [roleAssignment, setRoleAssignment] = useState({ user_id: '', role: 'catalog_manager' });
  const [adminRoles, setAdminRoles] = useState<string[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [variants, setVariants] = useState<any[]>([]);
  const [gallery, setGallery] = useState<any[]>([]);
  const [galleryAssetId, setGalleryAssetId] = useState('');
  const [categoryForm, setCategoryForm] = useState<any>({
    kind: 'product',
    name: '',
    slug: '',
    description: '',
    display_order: 0,
    is_active: true,
    image_asset_id: '',
  });
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showProductPreview, setShowProductPreview] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);
  const [variantForm, setVariantForm] = useState({
    size: '',
    colour: '',
    colour_hex: '',
    sku: '',
    stock: '',
    price_override: '',
  });

  // Product List Search & Filters
  const [productSearch, setProductSearch] = useState('');
  const [productStatusFilter, setProductStatusFilter] = useState<'all' | 'draft' | 'published' | 'review' | 'archived'>('all');
  const [productCategoryFilter, setProductCategoryFilter] = useState('');

  // Bulk Variant Matrix Generator state
  const [showVariantGenerator, setShowVariantGenerator] = useState(false);
  const [matrixSizes, setMatrixSizes] = useState<string[]>(['0-3M', '3-6M', '6-12M', '1-2Y', '2-3Y']);
  const [matrixColours, setMatrixColours] = useState<{ name: string; hex: string }[]>([
    { name: 'Ivory', hex: '#FFFFF0' },
    { name: 'Sage', hex: '#9CAF88' },
  ]);
  const [matrixCustomColor, setMatrixCustomColor] = useState('');
  const [matrixCustomHex, setMatrixCustomHex] = useState('#E2725B');
  const [matrixSkuPrefix, setMatrixSkuPrefix] = useState('');
  const [matrixDefaultStock, setMatrixDefaultStock] = useState('10');
  const [isGeneratingMatrix, setIsGeneratingMatrix] = useState(false);

  const [media, setMedia] = useState<any[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [purpose, setPurpose] = useState('product');
  const [uploadState, setUploadState] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [sectionForm, setSectionForm] = useState({
    section_key: 'hero',
    section_type: 'hero',
    heading: '',
    body: '',
    cta_label: '',
    cta_href: '',
    desktop_asset_id: '',
    mobile_asset_id: '',
    is_published: false,
  });
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionForm, setCollectionForm] = useState<{
    id?: string;
    name: string;
    slug: string;
    description: string;
    product_id: string;
    cover_asset_id: string;
    display_order: number;
    status: string;
  }>({
    name: '',
    slug: '',
    description: '',
    product_id: '',
    cover_asset_id: '',
    display_order: 0,
    status: 'draft',
  });
  const [settings, setSettings] = useState<Record<string, any>>({});

  const suggestedAgeLabels = useMemo(
    () =>
      productForm.tags
        .filter((tag) => tag.startsWith('suggested-age-group:'))
        .map((tag) => tag.slice('suggested-age-group:'.length))
        .map(
          (key) => ageNavigation.find((age) => age.key === key)?.label || key.replace(/-/g, ' ')
        ),
    [productForm.tags]
  );

  const productPreviewImages = useMemo(
    () =>
      gallery.flatMap((link) => {
        const asset = Array.isArray(link.media_assets) ? link.media_assets[0] : link.media_assets;
        if (
          !asset ||
          asset.provider !== 'imagekit' ||
          asset.purpose !== 'product' ||
          asset.lifecycle_status !== 'active'
        )
          return [];
        const url = publicMediaUrl(asset, 900);
        return url ? [{ url, alt: link.alt_text || productForm.name || 'Product photograph' }] : [];
      }),
    [gallery, productForm.name]
  );

  const report = (message: string) => {
    setNotice(message);
    setError('');
  };
  const fail = (message: string) => {
    setError(message);
    setNotice('');
  };

  const loadAdminData = useCallback(async () => {
    if (!supabase) return;
    const [p, c, m, h, cl, s, o, customerRows, roleRows, summary] = await Promise.all([
      supabase
        .from('products')
        .select(
          '*,product_variants(id,sku,size,colour,colour_hex,is_active,price_override,inventory(quantity_on_hand,quantity_reserved)),product_media(id,variant_id,media_assets(id,provider,purpose,lifecycle_status)),product_categories(categories(id,kind,name)),collection_products(collection_id)'
        )
        .order('updated_at', { ascending: false }),
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('media_assets').select('*').order('created_at', { ascending: false }),
      supabase.from('homepage_sections').select('*').order('display_order'),
      supabase.from('collections').select('*').order('updated_at', { ascending: false }),
      supabase.from('store_settings').select('*'),
      supabase
        .from('orders')
        .select(
          'id,order_number,status,total,currency,payment_method,placed_at,order_items(product_name_snapshot,size_snapshot,colour_snapshot,quantity),payments(status,provider,refunds(status,amount)),shipments(status,awb_code,courier_name,tracking_url)'
        )
        .order('placed_at', { ascending: false })
        .limit(100),
      supabase
        .from('customers')
        .select('id,email,full_name,phone,created_at')
        .order('created_at', { ascending: false })
        .limit(500),
      supabase.from('admin_users').select('user_id,email,full_name,role').order('email'),
      supabase.rpc('admin_dashboard_summary'),
    ]);
    if (p.data) setProducts(p.data);
    if (c.data) setCategories(c.data);
    if (m.data) setMedia(m.data);
    if (h.data) setSections(h.data);
    if (cl.data) setCollections(cl.data);
    if (o.data) setOrders(o.data);
    if (customerRows.data) setCustomers(customerRows.data);
    if (roleRows.data) setAdminUsers(roleRows.data);
    if (summary.data) setDashboard(summary.data);
    if (s.data) setSettings(Object.fromEntries(s.data.map((row: any) => [row.setting_key, row.setting_value])));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    async function checkAccess() {
      const {
        data: { user },
      } = await supabase!.auth.getUser();
      if (!alive) return;
      if (!user) {
        setAccess('signed-out');
        return;
      }
      const { data: roles, error: roleError } = await supabase!
        .from('admin_roles')
        .select('role')
        .eq('user_id', user.id);
      if (!alive) return;
      if (roleError) {
        fail(roleError.message);
        setAccess('denied');
        return;
      }
      if (
        !(roles || []).some((row: any) =>
          ['owner', 'admin', 'catalog_manager', 'media_manager', 'order_manager'].includes(row.role)
        )
      ) {
        setAccess('denied');
        return;
      }
      const roleNames = (roles || []).map((row: any) => row.role as string);
      setAdminRoles(roleNames);
      if (roleNames.some((role) => role === 'owner' || role === 'admin')) setTab('overview');
      else if (roleNames.includes('catalog_manager')) setTab('products');
      else if (roleNames.includes('media_manager')) setTab('media');
      else setTab('orders');
      setAccess('ready');
      await loadAdminData();
    }
    void checkAccess();
    return () => {
      alive = false;
    };
  }, [loadAdminData]);

  async function selectProduct(id: string) {
    setSelectedProduct(id);
    setShowProductPreview(false);
    setShowVariantGenerator(false);
    if (!id || !supabase) {
      setProductForm(emptyProduct);
      setVariants([]);
      setCategoryIds([]);
      setCollectionIds([]);
      setGallery([]);
      return;
    }
    const [product, variantRows, categoryRows, collectionRows, productGallery] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase
        .from('product_variants')
        .select('*,inventory(quantity_on_hand,quantity_reserved)')
        .eq('product_id', id)
        .order('size'),
      supabase.from('product_categories').select('category_id').eq('product_id', id),
      supabase.from('collection_products').select('collection_id').eq('product_id', id),
      supabase
        .from('product_media')
        .select(
          'id,asset_id,variant_id,display_order,is_primary,alt_text,view_label,media_assets(id,provider,purpose,lifecycle_status,delivery_url,external_url,resource_type,format,original_filename,width,height,file_size_bytes)'
        )
        .eq('product_id', id)
        .order('display_order'),
    ]);
    if (product.error) {
      fail(product.error.message);
      return;
    }
    const p = product.data;
    setProductForm({
      id,
      name: p.name,
      slug: p.slug,
      description: p.description || '',
      material: p.material || '',
      fabric_composition: p.fabric_composition || '',
      care_instructions: p.care_instructions || '',
      size_measurements: p.size_measurements || '',
      price: p.price == null ? '' : String(p.price),
      compare_at_price: p.compare_at_price == null ? '' : String(p.compare_at_price),
      status: p.status,
      seo_title: p.seo_title || '',
      seo_description: p.seo_description || '',
      tags: p.tags || [],
    });
    setVariants((variantRows.data || []).map((row: any) => ({ ...row, stock: row.inventory?.quantity_on_hand ?? 0 })));
    setCategoryIds((categoryRows.data || []).map((row: any) => row.category_id));
    setCollectionIds((collectionRows.data || []).map((row: any) => row.collection_id));
    setGallery(productGallery.data || []);

    // Set initial SKU prefix suggestion for matrix generator
    const prefix = `LL-${p.slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`;
    setMatrixSkuPrefix(prefix);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    setError('');
    setNotice('');
    if (
      productForm.compare_at_price.trim() &&
      (!productForm.price.trim() || Number(productForm.compare_at_price) < Number(productForm.price))
    ) {
      fail('A compare-at price needs a verified base price and must be at least as high.');
      return;
    }
    if (productForm.status === 'published') {
      const hasProductCategory = categoryIds.some((id) =>
        categories.some((category) => category.id === id && category.kind === 'product')
      );
      const hasAgeCategory = categoryIds.some((id) =>
        categories.some((category) => category.id === id && category.kind === 'age')
      );
      const hasCompleteVariants =
        variants.length > 0 &&
        variants.every((variant) => {
          const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
          return (
            String(variant.sku || '').trim() &&
            String(variant.size || '').trim() &&
            String(variant.colour || '').trim() &&
            inventory &&
            Number.isFinite(Number(inventory.quantity_on_hand))
          );
        });
      const hasAuthorizedProductImage = gallery.some((link) => {
        const asset = Array.isArray(link.media_assets) ? link.media_assets[0] : link.media_assets;
        return asset?.provider === 'imagekit' && asset?.purpose === 'product' && asset?.lifecycle_status === 'active';
      });
      const requiresOwnerReview = ['owner-intake', 'owner-review-required', 'proposed-name', 'proposed-price'].some(
        (tag) => productForm.tags.includes(tag)
      );
      if (
        requiresOwnerReview ||
        /intake draft/i.test(productForm.name) ||
        !productForm.name.trim() ||
        !productForm.description.trim() ||
        !(productForm.material.trim() || productForm.fabric_composition.trim()) ||
        !productForm.care_instructions.trim() ||
        !productForm.size_measurements.trim() ||
        !productForm.price.trim() ||
        Number(productForm.price) <= 0 ||
        !hasProductCategory ||
        !hasAgeCategory ||
        !hasCompleteVariants ||
        !hasAuthorizedProductImage
      ) {
        fail(
          'Keep this product as a draft until its name, price, description, fabric, care, measurements, product and age categories, size and colour variants, SKUs, stock, and authorized ImageKit product photos are verified.'
        );
        return;
      }
    }
    const publishAfterSave = productForm.status === 'published';
    const payload = {
      name: productForm.name.trim(),
      slug: productForm.slug.trim(),
      description: productForm.description,
      material: productForm.material,
      fabric_composition: productForm.fabric_composition,
      care_instructions: productForm.care_instructions,
      size_measurements: productForm.size_measurements,
      price: productForm.price.trim() ? Number(productForm.price) : null,
      compare_at_price: productForm.compare_at_price ? Number(productForm.compare_at_price) : null,
      status: publishAfterSave ? 'draft' : productForm.status,
      seo_title: productForm.seo_title || null,
      seo_description: productForm.seo_description || null,
      tags: productForm.tags,
      published_at: null,
    };
    const result = productForm.id
      ? await supabase.from('products').update(payload).eq('id', productForm.id).select('id').single()
      : await supabase.from('products').insert(payload).select('id').single();
    if (result.error) {
      fail(result.error.message);
      return;
    }
    const id = result.data.id;

    // Sync categories
    const removedCats = await supabase.from('product_categories').delete().eq('product_id', id);
    if (removedCats.error) {
      fail(removedCats.error.message);
      return;
    }
    if (categoryIds.length) {
      const linked = await supabase
        .from('product_categories')
        .insert(categoryIds.map((category_id) => ({ product_id: id, category_id })));
      if (linked.error) {
        fail(linked.error.message);
        return;
      }
    }

    // Sync collections
    const removedCols = await supabase.from('collection_products').delete().eq('product_id', id);
    if (removedCols.error) {
      fail(removedCols.error.message);
      return;
    }
    if (collectionIds.length) {
      const linkedCols = await supabase
        .from('collection_products')
        .insert(collectionIds.map((collection_id) => ({ product_id: id, collection_id, display_order: 0 })));
      if (linkedCols.error) {
        fail(linkedCols.error.message);
        return;
      }
    }

    if (publishAfterSave) {
      const published = await supabase
        .from('products')
        .update({ status: 'published', published_at: new Date().toISOString() })
        .eq('id', id)
        .select('id')
        .single();
      if (published.error) {
        fail(published.error.message);
        return;
      }
    }
    setSelectedProduct(id);
    setProductForm({ ...productForm, id });
    report('Product and collection mappings saved.');
    await loadAdminData();
  }

  async function duplicateProduct(sourceId: string) {
    if (!supabase || !sourceId) return;
    try {
      const source = products.find((p) => p.id === sourceId);
      if (!source) return;
      const copySuffix = Math.random().toString(36).slice(2, 6);
      const copyName = `${source.name} (Copy)`;
      const copySlug = `${source.slug}-copy-${copySuffix}`;
      const payload = {
        name: copyName,
        slug: copySlug,
        description: source.description || '',
        material: source.material || '',
        fabric_composition: source.fabric_composition || '',
        care_instructions: source.care_instructions || '',
        size_measurements: source.size_measurements || '',
        price: source.price,
        compare_at_price: source.compare_at_price,
        status: 'draft',
        seo_title: source.seo_title || null,
        seo_description: source.seo_description || null,
        tags: [...(source.tags || []), 'duplicate-draft'],
      };
      const { data: newProd, error: insertError } = await supabase
        .from('products')
        .insert(payload)
        .select('id')
        .single();
      if (insertError) throw insertError;

      // Copy categories
      const { data: catLinks } = await supabase
        .from('product_categories')
        .select('category_id')
        .eq('product_id', sourceId);
      if (catLinks && catLinks.length > 0) {
        await supabase
          .from('product_categories')
          .insert(catLinks.map((c: any) => ({ product_id: newProd.id, category_id: c.category_id })));
      }

      // Copy collections
      const { data: colLinks } = await supabase
        .from('collection_products')
        .select('collection_id')
        .eq('product_id', sourceId);
      if (colLinks && colLinks.length > 0) {
        await supabase
          .from('collection_products')
          .insert(colLinks.map((c: any) => ({ product_id: newProd.id, collection_id: c.collection_id, display_order: 0 })));
      }

      // Copy variants
      const { data: sourceVariants } = await supabase
        .from('product_variants')
        .select('*,inventory(quantity_on_hand)')
        .eq('product_id', sourceId);
      if (sourceVariants && sourceVariants.length > 0) {
        for (const v of sourceVariants) {
          const newSku = `${v.sku}-CPY-${Math.random().toString(36).slice(2, 5).toUpperCase()}`;
          const { data: newV } = await supabase
            .from('product_variants')
            .insert({
              product_id: newProd.id,
              size: v.size,
              colour: v.colour,
              colour_hex: v.colour_hex,
              sku: newSku,
              price_override: v.price_override,
              is_active: v.is_active,
            })
            .select('id')
            .single();
          if (newV) {
            const qty = v.inventory?.quantity_on_hand ?? 0;
            await supabase.rpc('set_variant_stock', { p_variant_id: newV.id, p_quantity: qty });
          }
        }
      }

      // Copy media links
      const { data: sourceMedia } = await supabase.from('product_media').select('*').eq('product_id', sourceId);
      if (sourceMedia && sourceMedia.length > 0) {
        await supabase.from('product_media').insert(
          sourceMedia.map((m: any) => ({
            product_id: newProd.id,
            asset_id: m.asset_id,
            display_order: m.display_order,
            is_primary: m.is_primary,
            alt_text: m.alt_text,
            view_label: m.view_label,
            variant_id: null,
          }))
        );
      }

      report(`Duplicated "${source.name}" as new draft.`);
      await loadAdminData();
      await selectProduct(newProd.id);
    } catch (err: any) {
      fail(err.message || 'Product duplication failed.');
    }
  }

  async function deleteProduct(productId: string) {
    if (!supabase || !productId) return;
    const prod = products.find((p) => p.id === productId);
    if (
      !window.confirm(
        `Permanently delete "${prod?.name || 'this product'}"? This removes all variants, category mappings, and gallery links. Media files in library will remain safe.`
      )
    )
      return;
    const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);
    if (deleteError) {
      fail(deleteError.message);
      return;
    }
    report(`Deleted "${prod?.name || 'Product'}".`);
    setSelectedProduct('');
    setProductForm(emptyProduct);
    setVariants([]);
    setGallery([]);
    setCategoryIds([]);
    setCollectionIds([]);
    await loadAdminData();
  }

  async function quickToggleStatus(newStatus: 'draft' | 'archived') {
    if (!supabase || !selectedProduct) return;
    const { error: updateError } = await supabase
      .from('products')
      .update({ status: newStatus })
      .eq('id', selectedProduct);
    if (updateError) {
      fail(updateError.message);
      return;
    }
    report(`Product status set to ${newStatus}.`);
    await loadAdminData();
    await selectProduct(selectedProduct);
  }

  async function addVariant(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !selectedProduct) return;
    const { data, error: variantError } = await supabase
      .from('product_variants')
      .insert({
        product_id: selectedProduct,
        size: variantForm.size.trim(),
        colour: variantForm.colour.trim(),
        colour_hex: variantForm.colour_hex || null,
        sku: variantForm.sku.trim(),
        price_override: variantForm.price_override ? Number(variantForm.price_override) : null,
      })
      .select('id')
      .single();
    if (variantError) {
      fail(variantError.message);
      return;
    }
    const stock = await supabase.rpc('set_variant_stock', {
      p_variant_id: data.id,
      p_quantity: Number(variantForm.stock),
    });
    if (stock.error) {
      fail(stock.error.message);
      return;
    }
    setVariantForm({ size: '', colour: '', colour_hex: '', sku: '', stock: '', price_override: '' });
    report('Variant and opening stock saved.');
    await selectProduct(selectedProduct);
  }

  async function generateVariantMatrix() {
    if (!supabase || !selectedProduct) return;
    if (matrixSizes.length === 0 || matrixColours.length === 0) {
      fail('Select at least one size and one colour to generate combinations.');
      return;
    }
    setIsGeneratingMatrix(true);
    let createdCount = 0;
    try {
      const existingCombinations = new Set(variants.map((v) => `${v.size}:::${v.colour}`));
      const prefix = matrixSkuPrefix.trim() || `LL-${productForm.slug.toUpperCase().slice(0, 8)}`;
      const defaultStockNum = Math.max(0, parseInt(matrixDefaultStock, 10) || 0);

      for (const col of matrixColours) {
        for (const sz of matrixSizes) {
          const comboKey = `${sz}:::${col.name}`;
          if (existingCombinations.has(comboKey)) continue;

          const sizeCode = sz.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
          const colourCode = col.name.replace(/[^A-Za-z0-9]/g, '').toUpperCase().slice(0, 3);
          const generatedSku = `${prefix}-${colourCode}-${sizeCode}`;

          const { data: newV, error: vError } = await supabase
            .from('product_variants')
            .insert({
              product_id: selectedProduct,
              size: sz,
              colour: col.name,
              colour_hex: col.hex || null,
              sku: generatedSku,
              price_override: null,
              is_active: true,
            })
            .select('id')
            .single();

          if (!vError && newV) {
            await supabase.rpc('set_variant_stock', {
              p_variant_id: newV.id,
              p_quantity: defaultStockNum,
            });
            createdCount++;
          }
        }
      }
      report(`Generated ${createdCount} new size/colour variants with ${defaultStockNum} units opening stock each.`);
      setShowVariantGenerator(false);
      await selectProduct(selectedProduct);
    } catch (err: any) {
      fail(err.message || 'Variant matrix generation failed.');
    } finally {
      setIsGeneratingMatrix(false);
    }
  }

  async function saveVariant(variant: any) {
    if (!supabase) return;
    const { error: updateError } = await supabase
      .from('product_variants')
      .update({
        size: variant.size,
        colour: variant.colour,
        colour_hex: variant.colour_hex || null,
        sku: variant.sku,
        price_override: variant.price_override === '' ? null : Number(variant.price_override),
        is_active: variant.is_active,
      })
      .eq('id', variant.id);
    if (updateError) {
      fail(updateError.message);
      return;
    }
    const { error: stockError } = await supabase.rpc('set_variant_stock', {
      p_variant_id: variant.id,
      p_quantity: Number(variant.stock),
    });
    if (stockError) {
      fail(stockError.message);
      return;
    }
    report(`Saved ${variant.sku}.`);
    await selectProduct(selectedProduct);
  }

  async function deleteVariant(variantId: string, sku: string) {
    if (!supabase || !variantId) return;
    if (!window.confirm(`Delete variant ${sku}? This also unlinks its inventory.`)) return;
    const { error: delError } = await supabase.from('product_variants').delete().eq('id', variantId);
    if (delError) {
      fail(delError.message);
      return;
    }
    report(`Deleted variant ${sku}.`);
    await selectProduct(selectedProduct);
  }

  async function attachAsset() {
    if (!supabase || !selectedProduct || !galleryAssetId) return;
    const { error: insertError } = await supabase.from('product_media').insert({
      product_id: selectedProduct,
      asset_id: galleryAssetId,
      display_order: gallery.length,
      is_primary: gallery.length === 0,
      alt_text: '',
      view_label: 'additional',
      variant_id: null,
    });
    if (insertError) {
      fail(insertError.message);
      return;
    }
    setGalleryAssetId('');
    report('Existing asset added to this product gallery.');
    await selectProduct(selectedProduct);
  }

  async function saveGallery() {
    if (!supabase) return;
    if (gallery.length) {
      const clearPrimary = await supabase
        .from('product_media')
        .update({ is_primary: false })
        .eq('product_id', selectedProduct);
      if (clearPrimary.error) {
        fail(clearPrimary.error.message);
        return;
      }
    }
    for (const [index, item] of gallery.entries()) {
      const { error: saveError } = await supabase
        .from('product_media')
        .update({
          display_order: index,
          is_primary: index === 0,
          alt_text: item.alt_text,
          view_label: item.view_label,
          variant_id: item.variant_id || null,
        })
        .eq('id', item.id);
      if (saveError) {
        fail(saveError.message);
        return;
      }
    }
    report('Gallery order, primary image, variant mappings, and alt text saved.');
    await selectProduct(selectedProduct);
  }

  async function removeGalleryLink(id: string) {
    if (!supabase) return;
    const { error: removeError } = await supabase.from('product_media').delete().eq('id', id);
    if (removeError) {
      fail(removeError.message);
      return;
    }
    report('Gallery link removed. The media asset was kept in the library.');
    await selectProduct(selectedProduct);
  }

  async function replaceGalleryAsset(id: string, assetId: string) {
    if (!supabase || !assetId) return;
    const { error: replaceError } = await supabase
      .from('product_media')
      .update({ asset_id: assetId })
      .eq('id', id);
    if (replaceError) {
      fail(replaceError.message);
      return;
    }
    report('Gallery image replaced. Previous media file remains in the library.');
    await selectProduct(selectedProduct);
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const payload = { ...categoryForm, image_asset_id: categoryForm.image_asset_id || null };
    const result = categoryForm.id
      ? await supabase.from('categories').update(payload).eq('id', categoryForm.id)
      : await supabase.from('categories').insert(payload);
    if (result.error) {
      fail(result.error.message);
      return;
    }
    report('Category saved.');
    setCategoryForm({
      kind: 'product',
      name: '',
      slug: '',
      description: '',
      display_order: 0,
      is_active: true,
      image_asset_id: '',
    });
    await loadAdminData();
  }

  async function assignRole(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !adminRoles.includes('owner') || !roleAssignment.user_id) return;
    const { error: assignError } = await supabase.from('admin_roles').insert(roleAssignment);
    if (assignError) {
      fail(assignError.message);
      return;
    }
    report('Role assigned.');
    await loadAdminData();
  }

  async function removeRole(userId: string, role: string) {
    if (!supabase || !adminRoles.includes('owner') || role === 'owner') return;
    const { error: removeError } = await supabase
      .from('admin_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', role);
    if (removeError) {
      fail(removeError.message);
      return;
    }
    report('Role removed.');
    await loadAdminData();
  }

  const onFiles = async (files: FileList | File[]) => {
    if (!supabase) return;
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      const file = list[i];
      setUploadState(`Checking ${file.name} (${i + 1}/${list.length})…`);
      const isVideo = file.type.startsWith('video/');
      if (
        !/^(image\/(jpeg|png|webp|avif|gif)|video\/(mp4|webm))$/.test(file.type) ||
        file.size > (isVideo ? 100 : 20) * 1024 * 1024
      ) {
        fail(`${file.name}: use JPG, PNG, WebP, AVIF, GIF up to 20 MB, or MP4/WebM up to 100 MB.`);
        continue;
      }
      try {
        const checksum = await fileSha256(file);
        const { data: duplicate, error: duplicateError } = await supabase
          .from('media_assets')
          .select('*')
          .eq('checksum_sha256', checksum)
          .maybeSingle();
        if (duplicateError) throw duplicateError;
        let asset = duplicate;
        if (!asset) {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          if (!accessToken) throw new Error('Your administrator session expired. Sign in again.');
          const authorization = await fetch('/api/imagekit-auth', {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ purpose, mime_type: file.type, file_size_bytes: file.size }),
          });
          const auth = await authorization.json();
          if (!authorization.ok)
            throw new Error(auth.error || 'ImageKit upload could not be authorized.');
          setUploadState(`Uploading ${file.name} to ImageKit (${i + 1}/${list.length})…`);
          const extension = file.name.includes('.')
            ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
            : 'bin';
          const folder =
            purpose === 'product'
              ? '/little-loom/products'
              : purpose === 'category'
                ? '/little-loom/categories'
                : purpose === 'collection'
                  ? '/little-loom/collections'
                  : purpose === 'video'
                    ? '/little-loom/videos'
                    : '/little-loom/content';
          const form = new FormData();
          form.append('file', file);
          form.append('fileName', `${checksum}.${extension}`);
          form.append('folder', folder);
          form.append('useUniqueFileName', 'false');
          form.append('overwriteFile', 'false');
          form.append('token', auth.token);
          form.append('expire', String(auth.expire));
          form.append('signature', auth.signature);
          form.append('publicKey', auth.publicKey);
          const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
            method: 'POST',
            body: form,
          });
          const uploaded = await response.json();
          if (!response.ok) {
            const { data: raced } = await supabase
              .from('media_assets')
              .select('*')
              .eq('checksum_sha256', checksum)
              .maybeSingle();
            if (!raced) throw new Error(uploaded.message || 'ImageKit upload failed.');
            asset = raced;
          } else {
            const registered = await fetch('/api/imagekit-register', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${accessToken}`,
                'Content-Type': 'application/json',
              },
              body: JSON.stringify({
                file_id: uploaded.fileId,
                checksum,
                filename: file.name,
                mime_type: file.type,
                purpose,
              }),
            });
            const registration = await registered.json();
            if (!registered.ok || !registration.asset)
              throw new Error(
                registration.error || 'ImageKit uploaded the file but Supabase could not register its metadata.'
              );
            asset = registration.asset;
          }
        }
        if (purpose === 'product' && selectedProduct) {
          const { data: existing } = await supabase
            .from('product_media')
            .select('display_order')
            .eq('product_id', selectedProduct)
            .order('display_order', { ascending: false })
            .limit(1);
          const { error: linkError } = await supabase.from('product_media').upsert(
            {
              product_id: selectedProduct,
              asset_id: asset.id,
              display_order: (existing?.[0]?.display_order ?? -1) + 1,
              is_primary: !existing?.length,
              alt_text: file.name.replace(/\.[^.]+$/, ''),
              view_label: 'additional',
              variant_id: null,
            },
            { onConflict: 'product_id,asset_id,variant_id' }
          );
          if (linkError) throw linkError;
        }
        report(duplicate ? `Reused existing asset for ${file.name}.` : `Uploaded ${file.name}.`);
      } catch (cause) {
        fail(cause instanceof Error ? cause.message : `Upload failed for ${file.name}.`);
      }
    }
    setUploadState('');
    await loadAdminData();
    if (selectedProduct) await selectProduct(selectedProduct);
  };

  function handleDrop(event: DragEvent<HTMLDivElement>) {
    event.preventDefault();
    void onFiles(event.dataTransfer.files);
  }
  function handleFileInput(event: ChangeEvent<HTMLInputElement>) {
    if (event.target.files) void onFiles(event.target.files);
    event.target.value = '';
  }

  async function deleteMediaAsset(asset: any) {
    if (
      !supabase ||
      !window.confirm(
        `Permanently delete ${asset.original_filename} from the media provider? Assets still used by products, banners or CMS cannot be deleted.`
      )
    )
      return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      fail('Your administrator session expired. Sign in again.');
      return;
    }
    const response = await fetch('/api/imagekit-delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: asset.id }),
    });
    const data = await response.json();
    if (!response.ok || data?.error) {
      fail(data?.error || 'Media deletion failed.');
      return;
    }
    report('Media asset deleted from the provider and library.');
    await loadAdminData();
  }

  async function saveSection(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const payload = {
      ...sectionForm,
      desktop_asset_id: sectionForm.desktop_asset_id || null,
      mobile_asset_id: sectionForm.mobile_asset_id || null,
      updated_by: (await supabase.auth.getUser()).data.user?.id,
    };
    const { error: saveError } = await supabase.from('homepage_sections').upsert(payload, {
      onConflict: 'section_key',
    });
    if (saveError) {
      fail(saveError.message);
      return;
    }
    report('Homepage section saved.');
    await loadAdminData();
  }

  async function createCollection(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const payload = {
      name: collectionForm.name.trim(),
      slug: collectionForm.slug.trim(),
      description: collectionForm.description,
      cover_asset_id: collectionForm.cover_asset_id || null,
      display_order: collectionForm.display_order,
      status: collectionForm.status,
      published_at: collectionForm.status === 'published' ? new Date().toISOString() : null,
    };
    const { data, error: createError } = collectionForm.id
      ? await supabase.from('collections').update(payload).eq('id', collectionForm.id).select('id').single()
      : await supabase.from('collections').insert(payload).select('id').single();
    if (createError) {
      fail(createError.message);
      return;
    }
    if (collectionForm.product_id) {
      const link = await supabase
        .from('collection_products')
        .upsert(
          { collection_id: data.id, product_id: collectionForm.product_id, display_order: 0 },
          { onConflict: 'collection_id,product_id' }
        );
      if (link.error) {
        fail(link.error.message);
        return;
      }
    }
    setCollectionForm({
      name: '',
      slug: '',
      description: '',
      product_id: '',
      cover_asset_id: '',
      display_order: collections.length,
      status: 'draft',
    });
    report('Collection saved.');
    await loadAdminData();
  }

  async function updateSetting(key: string, value: any) {
    if (!supabase) return;
    const { error: saveError } = await supabase
      .from('store_settings')
      .upsert(
        { setting_key: key, setting_value: value, is_public: true, updated_by: (await supabase.auth.getUser()).data.user?.id },
        { onConflict: 'setting_key' }
      );
    if (saveError) {
      fail(saveError.message);
      return;
    }
    setSettings((current) => ({ ...current, [key]: value }));
    report('Store setting saved.');
  }

  async function updateOrderStatus(orderId: string, status: string) {
    if (!supabase) return;
    const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (updateError) {
      fail(updateError.message);
      return;
    }
    report('Order status updated.');
    await loadAdminData();
  }

  async function recordCodCollection(orderId: string) {
    if (!supabase) return;
    const { error: collectionError } = await supabase.rpc('complete_cod_collection', { p_order_id: orderId });
    if (collectionError) {
      fail(collectionError.message);
      return;
    }
    report('COD collection recorded and inventory settled.');
    await loadAdminData();
  }

  async function runShipmentAction(orderId: string, action: 'create' | 'track') {
    if (!supabase) return;
    const { data, error: shippingError } = await supabase.functions.invoke('shiprocket', {
      body: { order_id: orderId, action },
    });
    if (shippingError) {
      fail(shippingError.message);
      return;
    }
    if (data?.error) {
      fail(data.error);
      return;
    }
    report(action === 'create' ? 'Shiprocket shipment created.' : `Tracking updated: ${data.raw_status || data.status}.`);
    await loadAdminData();
  }

  async function refundOrder(orderId: string, orderNumber: number, total: number) {
    if (!supabase || !window.confirm(`Request a full refund of ${formatINR(total)} for order #${orderNumber}?`))
      return;
    const { data, error: refundError } = await supabase.functions.invoke('refund-payment', {
      body: {
        order_id: orderId,
        amount_paise: Math.round(total * 100),
        reason: 'Full order refund',
        idempotency_key: crypto.randomUUID(),
      },
    });
    if (refundError || data?.error) {
      fail(refundError?.message || data.error);
      return;
    }
    report(`Refund ${data.status || 'submitted'}; the order will update after Razorpay confirms it.`);
    await loadAdminData();
  }

  // Filtered Products for Catalog Sidebar
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // Search filter
      if (productSearch.trim()) {
        const query = productSearch.toLowerCase();
        const matchesName = p.name?.toLowerCase().includes(query);
        const matchesSlug = p.slug?.toLowerCase().includes(query);
        const matchesTag = (p.tags || []).some((t: string) => t.toLowerCase().includes(query));
        const matchesSku = (p.product_variants || []).some((v: any) => v.sku?.toLowerCase().includes(query));
        if (!matchesName && !matchesSlug && !matchesTag && !matchesSku) return false;
      }
      // Status filter
      if (productStatusFilter === 'published' && p.status !== 'published') return false;
      if (productStatusFilter === 'draft' && p.status !== 'draft') return false;
      if (productStatusFilter === 'archived' && p.status !== 'archived') return false;
      if (productStatusFilter === 'review') {
        const missing = pendingProductApprovals(p);
        if (missing.length === 0 && p.status === 'published') return false;
      }
      // Category filter
      if (productCategoryFilter) {
        const inCat = (p.product_categories || []).some(
          (c: any) => (Array.isArray(c.categories) ? c.categories[0] : c.categories)?.id === productCategoryFilter
        );
        if (!inCat) return false;
      }
      return true;
    });
  }, [products, productSearch, productStatusFilter, productCategoryFilter]);

  const productCounts = useMemo(() => {
    return {
      all: products.length,
      published: products.filter((p) => p.status === 'published').length,
      draft: products.filter((p) => p.status === 'draft').length,
      review: products.filter((p) => pendingProductApprovals(p).length > 0).length,
      archived: products.filter((p) => p.status === 'archived').length,
    };
  }, [products]);

  const filteredMedia = useMemo(
    () =>
      media.filter((asset) =>
        `${asset.original_filename} ${asset.purpose} ${asset.mime_type}`
          .toLowerCase()
          .includes(mediaSearch.toLowerCase())
      ),
    [media, mediaSearch]
  );

  const allAccess = adminRoles.some((role) => role === 'owner' || role === 'admin');
  const isOwner = adminRoles.includes('owner');
  const allowedTabs: Tab[] = allAccess
    ? [
        'overview',
        'products',
        'categories',
        'media',
        'homepage',
        'collections',
        'content',
        'customers',
        'orders',
        'settings',
        ...(isOwner ? (['roles'] as Tab[]) : []),
      ]
    : [
        ...(adminRoles.includes('catalog_manager')
          ? (['products', 'categories', 'homepage', 'collections', 'content'] as Tab[])
          : []),
        ...(adminRoles.includes('media_manager') ? (['media'] as Tab[]) : []),
        ...(adminRoles.includes('order_manager') ? (['orders', 'customers'] as Tab[]) : []),
      ];

  if (access === 'unconfigured')
    return (
      <AdminMessage
        title="Admin setup needed"
        body="Add your Supabase project URL and publishable key in .env.local, then apply the database migration."
      />
    );
  if (access === 'loading')
    return <AdminMessage title="Checking access" body="Verifying your administrator session…" />;
  if (access === 'signed-out')
    return (
      <AdminMessage
        title="Sign in required"
        body="Sign in with an account granted an admin role to manage Little Loom."
        link
      />
    );
  if (access === 'denied')
    return (
      <AdminMessage
        title="Admin access required"
        body="This account does not have a Little Loom admin role. Grant one from the Supabase SQL editor."
      />
    );

  const tabButton = (id: Tab, label: string) => (
    <button
      key={id}
      onClick={() => setTab(id)}
      className={`border-b-2 px-3 py-3 text-sm whitespace-nowrap transition-colors ${
        tab === id ? 'border-ink text-ink font-semibold' : 'border-transparent text-ink-soft hover:text-ink'
      }`}
    >
      {label}
    </button>
  );

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex flex-wrap items-end justify-between gap-4 border-b border-ink/10 pb-4">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-ink-light">Little Loom Management</p>
          <h1 className="mt-1 font-serif text-3xl font-normal text-ink">Store Administration</h1>
        </div>
        <div className="flex items-center gap-3">
          <Link
            className="inline-flex items-center gap-1.5 rounded border border-ink/20 px-3 py-1.5 text-xs text-ink hover:bg-ink/5"
            to="/"
            target="_blank"
          >
            <Eye className="h-3.5 w-3.5" /> View storefront
          </Link>
          <button
            onClick={() => void loadAdminData()}
            className="inline-flex items-center gap-1.5 rounded border border-ink/20 px-3 py-1.5 text-xs text-ink hover:bg-ink/5"
            title="Reload data"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Refresh
          </button>
        </div>
      </div>

      {/* Tabs */}
      <nav className="mt-4 flex gap-2 overflow-x-auto border-b border-ink/10">
        {allowedTabs.map((item) =>
          tabButton(
            item,
            ({
              overview: 'Overview',
              products: 'Products & variants',
              categories: 'Categories',
              media: 'Media library',
              homepage: 'Homepage CMS',
              collections: 'Collections',
              content: 'Policies, FAQs & banners',
              customers: 'Customers',
              roles: 'Team roles',
              orders: 'Orders',
              settings: 'Store settings',
            } as Record<Tab, string>)[item]
          )
        )}
      </nav>

      {/* Notice / Error banners */}
      {(error || notice) && (
        <div
          role={error ? 'alert' : 'status'}
          className={`mt-4 flex items-center justify-between rounded p-3 text-sm ${
            error ? 'bg-red-50 text-red-800 border border-red-200' : 'bg-emerald-50 text-emerald-900 border border-emerald-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {error ? <AlertTriangle className="h-4 w-4 shrink-0" /> : <CheckCircle2 className="h-4 w-4 shrink-0" />}
            <span>{error || notice}</span>
          </div>
          <button onClick={() => { setError(''); setNotice(''); }} className="text-xs underline ml-4 opacity-70 hover:opacity-100">
            Dismiss
          </button>
        </div>
      )}

      {/* OVERVIEW TAB */}
      {tab === 'overview' && (
        <section className="mt-6 space-y-8">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ['Products', dashboard?.total_products],
              ['Published', dashboard?.published_products],
              ['Drafts needing review', dashboard?.draft_products],
              ['Active categories', dashboard?.active_categories],
              ['Available units', dashboard?.available_units],
              ['Out of stock variants', dashboard?.out_of_stock_variants],
              ['Orders', dashboard?.total_orders],
              [
                'Recognized revenue',
                dashboard?.recognized_revenue == null ? null : formatINR(Number(dashboard.recognized_revenue)),
              ],
            ].map(([label, value]) => (
              <article key={String(label)} className="border border-ink/10 p-4 bg-white/50 rounded">
                <p className="text-xs uppercase tracking-wider text-ink-light">{label}</p>
                <p className="mt-2 font-serif text-2xl font-normal">{value == null ? '—' : value}</p>
              </article>
            ))}
          </div>
          <div className="grid gap-8 lg:grid-cols-2">
            <div>
              <h2 className="font-serif text-xl">Active Categories</h2>
              <ul className="mt-3 divide-y divide-ink/10">
                {categories.map((item) => (
                  <li key={item.id} className="flex justify-between py-2 text-sm">
                    <span>
                      {item.name} <span className="text-xs text-ink-light font-mono">({item.kind})</span>
                    </span>
                    <span className="text-ink-light">
                      {
                        products.filter((product) =>
                          (product.product_categories || []).some(
                            (link: any) =>
                              (Array.isArray(link.categories) ? link.categories[0] : link.categories)?.id === item.id
                          )
                        ).length
                      }{' '}
                      products
                    </span>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h2 className="font-serif text-xl">Recent Audit Activity</h2>
              <ul className="mt-3 divide-y divide-ink/10">
                {(dashboard?.recent_activity || []).map((item: any, index: number) => (
                  <li key={`${item.record_id}-${index}`} className="py-2 text-xs">
                    <span className="font-medium text-ink">{item.operation}</span> · {item.table_name} ·{' '}
                    {new Date(item.created_at).toLocaleString()}
                  </li>
                ))}
              </ul>
              {!dashboard?.recent_activity?.length && (
                <p className="mt-2 text-sm text-ink-soft">No audit activity recorded yet.</p>
              )}
            </div>
          </div>
        </section>
      )}

      {/* CUSTOMERS TAB */}
      {tab === 'customers' && (
        <section className="mt-6">
          <h2 className="font-serif text-xl">Customer accounts</h2>
          <p className="mt-1 text-xs text-ink-light">
            Private contact details are shown only to authorized order managers and administrators.
          </p>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full min-w-[640px] border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-ink/15 text-xs uppercase tracking-wider text-ink-light">
                  <th className="py-3 pr-3">Customer</th>
                  <th className="py-3 pr-3">Email</th>
                  <th className="py-3 pr-3">Phone</th>
                  <th className="py-3">Joined</th>
                </tr>
              </thead>
              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id} className="border-b border-ink/10">
                    <td className="py-3 pr-3">{customer.full_name || 'Name not provided'}</td>
                    <td className="py-3 pr-3">{customer.email || 'Email unavailable'}</td>
                    <td className="py-3 pr-3">{customer.phone || '—'}</td>
                    <td className="py-3">{new Date(customer.created_at).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!customers.length && <p className="mt-4 text-sm text-ink-soft">No customer profiles are visible to this account.</p>}
        </section>
      )}

      {/* TEAM ROLES TAB */}
      {tab === 'roles' && isOwner && (
        <section className="mt-6 grid gap-8 lg:grid-cols-[360px_1fr]">
          <form onSubmit={(e) => void assignRole(e)} className="space-y-4">
            <h2 className="font-serif text-xl">Assign team role</h2>
            <p className="text-xs leading-5 text-ink-soft">
              Select an existing registered customer account. Only the owner can change team roles. Owner access must be provisioned securely in Supabase SQL Editor.
            </p>
            <label className="block text-sm">
              Account
              <select
                required
                value={roleAssignment.user_id}
                onChange={(e) => setRoleAssignment({ ...roleAssignment, user_id: e.target.value })}
                className="admin-input"
              >
                <option value="">Choose account…</option>
                {customers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.email || item.full_name || item.id}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Role
              <select
                value={roleAssignment.role}
                onChange={(e) => setRoleAssignment({ ...roleAssignment, role: e.target.value })}
                className="admin-input"
              >
                {['admin', 'catalog_manager', 'media_manager', 'order_manager'].map((role) => (
                  <option key={role} value={role}>
                    {role.replace('_', ' ')}
                  </option>
                ))}
              </select>
            </label>
            <Button type="submit">Assign role</Button>
          </form>
          <div>
            <h2 className="font-serif text-xl">Current team</h2>
            <ul className="mt-3 divide-y divide-ink/10">
              {adminUsers.map((item, index) => (
                <li
                  key={`${item.user_id}-${item.role}-${index}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"
                >
                  <span>
                    {item.email || item.full_name || item.user_id}{' '}
                    <span className="ml-2 text-xs text-ink-light uppercase tracking-wider">{item.role.replace('_', ' ')}</span>
                  </span>
                  <button
                    type="button"
                    disabled={item.role === 'owner'}
                    onClick={() => void removeRole(item.user_id, item.role)}
                    className="text-xs underline disabled:opacity-40"
                  >
                    {item.role === 'owner' ? 'Owner protected' : 'Remove role'}
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* PRODUCTS & VARIANTS TAB */}
      {tab === 'products' && (
        <section className="mt-6 grid gap-8 lg:grid-cols-[320px_1fr]">
          {/* SIDEBAR: Product List, Search, Filters & Quick Actions */}
          <aside className="border-r border-ink/10 pr-6 space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="font-serif text-lg font-medium">Catalogue ({products.length})</h2>
              <button
                type="button"
                onClick={() => void selectProduct('')}
                className="inline-flex items-center gap-1 rounded bg-ink px-2.5 py-1 text-xs font-medium text-white hover:bg-ink/90"
              >
                <Plus className="h-3 w-3" /> New
              </button>
            </div>

            {/* Search Input */}
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-3.5 w-3.5 text-ink-light" />
              <input
                type="text"
                placeholder="Search name, SKU, tag…"
                value={productSearch}
                onChange={(e) => setProductSearch(e.target.value)}
                className="admin-input !pl-8 text-xs"
              />
              {productSearch && (
                <button
                  type="button"
                  onClick={() => setProductSearch('')}
                  className="absolute right-2.5 top-2.5 text-xs text-ink-light hover:text-ink"
                >
                  ×
                </button>
              )}
            </div>

            {/* Status Filter Tabs */}
            <div className="grid grid-cols-5 gap-1 text-[10px] uppercase tracking-wider text-center">
              {[
                { key: 'all', label: 'All', count: productCounts.all },
                { key: 'published', label: 'Live', count: productCounts.published },
                { key: 'draft', label: 'Draft', count: productCounts.draft },
                { key: 'review', label: 'Review', count: productCounts.review },
                { key: 'archived', label: 'Arch', count: productCounts.archived },
              ].map((btn) => (
                <button
                  key={btn.key}
                  type="button"
                  onClick={() => setProductStatusFilter(btn.key as any)}
                  className={`rounded py-1 px-0.5 border ${
                    productStatusFilter === btn.key
                      ? 'bg-ink text-white border-ink font-semibold'
                      : 'border-ink/15 text-ink-soft hover:bg-ink/5'
                  }`}
                >
                  <div>{btn.label}</div>
                  <div className="opacity-80 font-mono">{btn.count}</div>
                </button>
              ))}
            </div>

            {/* Category Filter */}
            <select
              value={productCategoryFilter}
              onChange={(e) => setProductCategoryFilter(e.target.value)}
              className="admin-input text-xs"
            >
              <option value="">All Categories & Ages</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name} ({c.kind})
                </option>
              ))}
            </select>

            {/* Product List */}
            <div className="max-h-[640px] overflow-y-auto divide-y divide-ink/10 pr-1 space-y-1">
              {filteredProducts.map((product) => {
                const missing = pendingProductApprovals(product);
                const isSelected = selectedProduct === product.id;
                return (
                  <button
                    key={product.id}
                    onClick={() => void selectProduct(product.id)}
                    className={`block w-full p-2.5 text-left rounded transition-colors ${
                      isSelected
                        ? 'bg-ink/10 border-l-4 border-ink font-medium'
                        : 'hover:bg-ink/5 border-l-4 border-transparent'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="truncate text-xs text-ink font-medium">{product.name}</span>
                      <span
                        className={`text-[9px] uppercase px-1.5 py-0.5 rounded font-mono ${
                          product.status === 'published'
                            ? 'bg-emerald-100 text-emerald-800'
                            : product.status === 'archived'
                              ? 'bg-gray-100 text-gray-700'
                              : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {product.status}
                      </span>
                    </div>
                    <div className="mt-1 flex items-center justify-between text-[11px] text-ink-light">
                      <span>{product.price ? formatINR(Number(product.price)) : 'No price'}</span>
                      {missing.length > 0 ? (
                        <span className="text-amber-800 font-medium">⚠️ {missing.length} missing</span>
                      ) : (
                        <span className="text-emerald-700 font-medium">Ready</span>
                      )}
                    </div>
                  </button>
                );
              })}
              {filteredProducts.length === 0 && (
                <p className="p-4 text-center text-xs text-ink-soft">No matching products found.</p>
              )}
            </div>
          </aside>

          {/* MAIN COLUMN: Product Form, Variant Management & Media Gallery */}
          <div className="space-y-8">
            {/* Top Action Bar for Selected Product */}
            {selectedProduct && (
              <div className="flex flex-wrap items-center justify-between gap-3 bg-[#faf7f4] border border-ink/15 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <span
                    className={`text-[10px] uppercase font-bold px-2 py-0.5 rounded ${
                      productForm.status === 'published'
                        ? 'bg-emerald-600 text-white'
                        : productForm.status === 'archived'
                          ? 'bg-gray-600 text-white'
                          : 'bg-amber-600 text-white'
                    }`}
                  >
                    {productForm.status}
                  </span>
                  <span className="text-sm font-serif font-medium">{productForm.name || 'Untitled Product'}</span>
                  {productForm.slug && (
                    <span className="text-xs text-ink-light font-mono">/{productForm.slug}</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => void duplicateProduct(selectedProduct)}
                    className="inline-flex items-center gap-1 rounded border border-ink/20 bg-white px-2.5 py-1.5 text-xs text-ink hover:bg-ink/5"
                    title="Duplicate product as draft"
                  >
                    <Copy className="h-3.5 w-3.5" /> Duplicate
                  </button>
                  {productForm.status === 'published' ? (
                    <button
                      type="button"
                      onClick={() => void quickToggleStatus('draft')}
                      className="inline-flex items-center gap-1 rounded border border-amber-300 bg-amber-50 px-2.5 py-1.5 text-xs text-amber-900 hover:bg-amber-100"
                    >
                      Unpublish (Draft)
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => void quickToggleStatus('archived')}
                      className="inline-flex items-center gap-1 rounded border border-ink/20 bg-white px-2.5 py-1.5 text-xs text-ink hover:bg-ink/5"
                    >
                      Archive
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => void deleteProduct(selectedProduct)}
                    className="inline-flex items-center gap-1 rounded border border-red-200 bg-red-50 px-2.5 py-1.5 text-xs text-red-800 hover:bg-red-100"
                    title="Delete product permanently"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            )}

            {/* PRODUCT EDIT FORM */}
            <form onSubmit={(e) => void saveProduct(e)} className="grid gap-4 sm:grid-cols-2">
              {(productForm.tags.includes('owner-intake') ||
                productForm.tags.includes('owner-review-required')) && (
                <div className="sm:col-span-2 border border-amber-700/20 bg-amber-50 p-3 rounded">
                  <p className="text-sm font-medium text-amber-900">Owner Verification Checklist</p>
                  <p className="mt-1 text-xs leading-5 text-amber-800">
                    Product name, price, supplier, sizes, colours, stock and ImageKit photographs require verification.
                    Suggested age groups: {suggestedAgeLabels.length ? suggestedAgeLabels.join(', ') : 'none'}.
                  </p>
                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <label className="flex items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!productForm.tags.includes('proposed-name')}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            tags: e.target.checked
                              ? productForm.tags.filter((tag) => tag !== 'proposed-name')
                              : [...new Set([...productForm.tags, 'proposed-name'])],
                          })
                        }
                      />
                      I verified the product name.
                    </label>
                    <label className="flex items-start gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={!productForm.tags.includes('proposed-price')}
                        onChange={(e) =>
                          setProductForm({
                            ...productForm,
                            tags: e.target.checked
                              ? productForm.tags.filter((tag) => tag !== 'proposed-price')
                              : [...new Set([...productForm.tags, 'proposed-price'])],
                          })
                        }
                      />
                      I verified the selling price.
                    </label>
                  </div>
                </div>
              )}

              <label className="text-sm">
                Product name
                <input
                  required
                  value={productForm.name}
                  onChange={(e) => {
                    const name = e.target.value;
                    const slug = !productForm.id
                      ? name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')
                      : productForm.slug;
                    setProductForm({ ...productForm, name, slug });
                  }}
                  className="admin-input"
                  placeholder="e.g. Organic Cotton Waffle Romper"
                />
              </label>

              <label className="text-sm">
                URL Slug
                <input
                  required
                  value={productForm.slug}
                  onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. organic-cotton-waffle-romper"
                />
              </label>

              <label className="text-sm">
                Selling Price (INR ₹)
                <input
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={productForm.price}
                  onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                  className="admin-input"
                  placeholder="999"
                />
              </label>

              <label className="text-sm">
                Compare-at Price (MRP ₹, optional)
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={productForm.compare_at_price}
                  onChange={(e) => setProductForm({ ...productForm, compare_at_price: e.target.value })}
                  className="admin-input"
                  placeholder="1499"
                />
              </label>

              <label className="text-sm">
                Status
                <select
                  value={productForm.status}
                  onChange={(e) => setProductForm({ ...productForm, status: e.target.value })}
                  className="admin-input font-medium"
                >
                  <option value="draft">Draft (Unpublished)</option>
                  <option value="published">Published (Visible on storefront)</option>
                  <option value="archived">Archived</option>
                </select>
              </label>

              <label className="text-sm">
                Primary Material
                <input
                  value={productForm.material}
                  onChange={(e) => setProductForm({ ...productForm, material: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. 100% GOTS Certified Organic Cotton"
                />
              </label>

              <label className="text-sm sm:col-span-2">
                Fabric composition & weave details
                <input
                  value={productForm.fabric_composition}
                  onChange={(e) => setProductForm({ ...productForm, fabric_composition: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. 210 GSM breathable waffle knit, nickel-free brass crotch snaps"
                />
              </label>

              <label className="text-sm sm:col-span-2">
                Description
                <textarea
                  rows={4}
                  value={productForm.description}
                  onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                  className="admin-input"
                  placeholder="Detailed editorial garment description for parents..."
                />
              </label>

              <label className="text-sm sm:col-span-2">
                Care instructions
                <textarea
                  rows={2}
                  value={productForm.care_instructions}
                  onChange={(e) => setProductForm({ ...productForm, care_instructions: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. Machine wash cold inside out with gentle detergent. Tumble dry low or line dry in shade."
                />
              </label>

              {/* Garment Measurements by Size + Presets */}
              <div className="sm:col-span-2 space-y-2">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <label className="text-sm font-medium">Verified garment measurements by size (Required for publication)</label>
                  <div className="flex flex-wrap items-center gap-1.5 text-xs">
                    <span className="text-ink-light text-[11px]">Insert Preset:</span>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, size_measurements: MEASUREMENT_TEMPLATES.romper })}
                      className="rounded border border-ink/20 px-2 py-0.5 hover:bg-ink/5"
                    >
                      Romper
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, size_measurements: MEASUREMENT_TEMPLATES.coord })}
                      className="rounded border border-ink/20 px-2 py-0.5 hover:bg-ink/5"
                    >
                      Co-ord
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, size_measurements: MEASUREMENT_TEMPLATES.dress })}
                      className="rounded border border-ink/20 px-2 py-0.5 hover:bg-ink/5"
                    >
                      Dress
                    </button>
                    <button
                      type="button"
                      onClick={() => setProductForm({ ...productForm, size_measurements: MEASUREMENT_TEMPLATES.tee })}
                      className="rounded border border-ink/20 px-2 py-0.5 hover:bg-ink/5"
                    >
                      Tee / Top
                    </button>
                  </div>
                </div>
                <textarea
                  rows={4}
                  value={productForm.size_measurements}
                  onChange={(e) => setProductForm({ ...productForm, size_measurements: e.target.value })}
                  className="admin-input font-mono text-xs"
                  placeholder="Size | Chest (in) | Length (in)..."
                />
              </div>

              <label className="text-sm">
                SEO title
                <input
                  value={productForm.seo_title}
                  onChange={(e) => setProductForm({ ...productForm, seo_title: e.target.value })}
                  className="admin-input"
                  placeholder="e.g. Organic Cotton Baby Romper | Little Loom"
                />
              </label>

              <label className="text-sm">
                SEO description
                <input
                  value={productForm.seo_description}
                  onChange={(e) => setProductForm({ ...productForm, seo_description: e.target.value })}
                  className="admin-input"
                  placeholder="Meta description for search engines..."
                />
              </label>

              {/* Product Categories & Age Groups */}
              <fieldset className="sm:col-span-2 border border-ink/10 rounded p-3 bg-white/40">
                <legend className="text-sm font-medium px-1">Categories & Age Groups</legend>
                <div className="grid gap-4 sm:grid-cols-2 mt-2">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-light mb-2">Product Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {categories
                        .filter((category) => category.kind === 'product' && category.is_active)
                        .map((category) => (
                          <label key={category.id} className="inline-flex items-center gap-1.5 text-xs bg-ink/5 px-2.5 py-1 rounded cursor-pointer hover:bg-ink/10">
                            <input
                              type="checkbox"
                              checked={categoryIds.includes(category.id)}
                              onChange={(e) =>
                                setCategoryIds(
                                  e.target.checked
                                    ? [...categoryIds, category.id]
                                    : categoryIds.filter((id) => id !== category.id)
                                )
                              }
                            />
                            {category.name}
                          </label>
                        ))}
                    </div>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-ink-light mb-2">Age Groups</p>
                    <div className="flex flex-wrap gap-2">
                      {categories
                        .filter((category) => category.kind === 'age' && category.is_active)
                        .map((category) => (
                          <label key={category.id} className="inline-flex items-center gap-1.5 text-xs bg-ink/5 px-2.5 py-1 rounded cursor-pointer hover:bg-ink/10">
                            <input
                              type="checkbox"
                              checked={categoryIds.includes(category.id)}
                              onChange={(e) =>
                                setCategoryIds(
                                  e.target.checked
                                    ? [...categoryIds, category.id]
                                    : categoryIds.filter((id) => id !== category.id)
                                )
                              }
                            />
                            {category.name}
                          </label>
                        ))}
                    </div>
                  </div>
                </div>
              </fieldset>

              {/* Collections Membership */}
              <fieldset className="sm:col-span-2 border border-ink/10 rounded p-3 bg-white/40">
                <legend className="text-sm font-medium px-1">Collections (Curations & Rails)</legend>
                <div className="flex flex-wrap gap-2 mt-2">
                  {collections.map((col) => (
                    <label key={col.id} className="inline-flex items-center gap-1.5 text-xs bg-ink/5 px-2.5 py-1 rounded cursor-pointer hover:bg-ink/10">
                      <input
                        type="checkbox"
                        checked={collectionIds.includes(col.id)}
                        onChange={(e) =>
                          setCollectionIds(
                            e.target.checked
                              ? [...collectionIds, col.id]
                              : collectionIds.filter((id) => id !== col.id)
                          )
                        }
                      />
                      {col.name} <span className="text-[10px] text-ink-light">({col.slug})</span>
                    </label>
                  ))}
                  {collections.length === 0 && (
                    <p className="text-xs text-ink-soft">No collections created yet. Use the Collections tab to add rails.</p>
                  )}
                </div>
              </fieldset>

              {/* Form Submit & Preview Buttons */}
              <div className="sm:col-span-2 flex flex-wrap items-center gap-3 pt-2">
                <Button type="submit">{productForm.id ? 'Save Product Changes' : 'Create Product'}</Button>
                <button
                  type="button"
                  onClick={() => setShowProductPreview((v) => !v)}
                  className="min-h-10 border border-ink/20 px-4 text-sm text-ink hover:bg-ink/5 rounded inline-flex items-center gap-2"
                >
                  <Eye className="h-4 w-4" /> {showProductPreview ? 'Hide Storefront Preview' : 'Preview Storefront Page'}
                </button>
              </div>
            </form>

            {/* PRODUCT LIVE PREVIEW */}
            {showProductPreview && (
              <section aria-label="Admin-only product page preview" className="overflow-hidden rounded-2xl border border-ink/15 bg-white">
                <div className="border-b border-ink/10 bg-[#f8f4f0] px-4 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink">Storefront Product Page Preview</p>
                    <p className="mt-0.5 text-[11px] text-ink-light">Live presentation rendered exactly as customers see it.</p>
                  </div>
                  <span className="text-xs bg-ink/5 px-2 py-1 rounded font-mono">{productForm.status}</span>
                </div>
                <div className="grid gap-0 md:grid-cols-2">
                  <div className="grid grid-cols-2 gap-2 bg-cream p-4">
                    {productPreviewImages.length ? (
                      productPreviewImages.map((image, index) => (
                        <img
                          key={`${image.url}-${index}`}
                          src={image.url}
                          alt={image.alt}
                          className={`aspect-[4/5] w-full rounded-lg object-cover ${index === 0 ? 'col-span-2 max-h-[560px]' : ''}`}
                          loading="lazy"
                        />
                      ))
                    ) : (
                      <div className="col-span-2 flex aspect-[4/5] items-center justify-center rounded-lg bg-[#f4eee8] p-6 text-center text-sm text-ink-light">
                        No active ImageKit product photograph linked yet.
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col justify-center p-6 sm:p-8">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-ink-light">
                      {categories
                        .filter((c) => categoryIds.includes(c.id) && c.kind === 'product')
                        .map((c) => c.name)
                        .join(' · ') || 'Category not selected'}
                    </p>
                    <h2 className="mt-2 font-serif text-2xl text-ink sm:text-3xl">{productForm.name || 'Product name'}</h2>
                    {productForm.price && (
                      <div className="mt-3 flex items-baseline gap-2">
                        <span className="text-xl font-medium text-ink">{formatINR(Number(productForm.price))}</span>
                        {productForm.compare_at_price && (
                          <span className="text-sm line-through text-ink-light">{formatINR(Number(productForm.compare_at_price))}</span>
                        )}
                      </div>
                    )}
                    {productForm.description.trim() && (
                      <p className="mt-4 text-sm leading-6 text-ink-soft">{productForm.description}</p>
                    )}
                    {variants.length > 0 && (
                      <div className="mt-5 space-y-3">
                        <div>
                          <p className="text-xs font-medium text-ink-light uppercase tracking-wider">Available Sizes</p>
                          <div className="mt-1.5 flex flex-wrap gap-1.5">
                            {[...new Set(variants.filter((v) => v.is_active).map((v) => v.size))].map((size) => (
                              <span key={size} className="border border-ink/20 px-3 py-1 text-xs rounded">
                                {size}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div>
                          <p className="text-xs font-medium text-ink-light uppercase tracking-wider">Colours</p>
                          <div className="mt-1.5 flex flex-wrap gap-2">
                            {[...new Map(variants.filter((v) => v.is_active).map((v) => [v.colour, v])).values()].map((v) => (
                              <span key={v.colour} className="inline-flex items-center gap-1.5 text-xs text-ink-soft border border-ink/15 px-2.5 py-1 rounded">
                                {v.colour_hex && (
                                  <span className="h-3 w-3 rounded-full border border-black/10" style={{ backgroundColor: v.colour_hex }} />
                                )}
                                {v.colour}
                              </span>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </section>
            )}

            {/* SIZES, COLOURS & STOCK MANAGEMENT */}
            {selectedProduct && (
              <section className="border-t border-ink/10 pt-6 space-y-6">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <h2 className="font-serif text-xl font-medium">Sizes, Colours & Stock</h2>
                    <p className="text-xs text-ink-light">
                      Each variant has its own SKU, inventory count, and optional variant-specific photography.
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => setShowVariantGenerator((v) => !v)}
                    className="inline-flex items-center gap-1.5 rounded border border-ink/20 px-3 py-1.5 text-xs text-ink hover:bg-ink/5"
                  >
                    <Sparkles className="h-3.5 w-3.5 text-amber-600" />
                    {showVariantGenerator ? 'Close Generator' : 'Bulk Variant Matrix Generator'}
                  </button>
                </div>

                {/* BULK VARIANT MATRIX GENERATOR */}
                {showVariantGenerator && (
                  <div className="border border-amber-600/30 bg-amber-50/40 p-4 rounded-lg space-y-4">
                    <div className="flex items-center justify-between">
                      <p className="text-sm font-semibold text-ink flex items-center gap-1.5">
                        <Sparkles className="h-4 w-4 text-amber-700" /> Bulk Kidswear Variant Generator
                      </p>
                      <span className="text-xs text-ink-light">Quick combinations</span>
                    </div>

                    {/* Sizes Selection */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-light mb-1.5">Select Sizes</p>
                      <div className="flex flex-wrap gap-1.5">
                        {STANDARD_KIDS_SIZES.map((sz) => (
                          <button
                            key={sz}
                            type="button"
                            onClick={() =>
                              setMatrixSizes((current) =>
                                current.includes(sz) ? current.filter((s) => s !== sz) : [...current, sz]
                              )
                            }
                            className={`rounded px-2.5 py-1 text-xs border transition-colors ${
                              matrixSizes.includes(sz)
                                ? 'bg-ink text-white border-ink font-medium'
                                : 'bg-white text-ink border-ink/20 hover:bg-ink/5'
                            }`}
                          >
                            {sz}
                          </button>
                        ))}
                      </div>
                    </div>

                    {/* Colours Selection */}
                    <div>
                      <p className="text-xs font-semibold uppercase tracking-wider text-ink-light mb-1.5">Select Colours</p>
                      <div className="flex flex-wrap gap-1.5">
                        {PRESET_COLOURS.map((col) => {
                          const isSel = matrixColours.some((c) => c.name === col.name);
                          return (
                            <button
                              key={col.name}
                              type="button"
                              onClick={() =>
                                setMatrixColours((current) =>
                                  isSel ? current.filter((c) => c.name !== col.name) : [...current, col]
                                )
                              }
                              className={`inline-flex items-center gap-1.5 rounded px-2.5 py-1 text-xs border transition-colors ${
                                isSel
                                  ? 'bg-ink text-white border-ink font-medium'
                                  : 'bg-white text-ink border-ink/20 hover:bg-ink/5'
                              }`}
                            >
                              <span className="h-2.5 w-2.5 rounded-full border border-black/15" style={{ backgroundColor: col.hex }} />
                              {col.name}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Custom colour adder */}
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      <input
                        type="text"
                        placeholder="Custom colour name"
                        value={matrixCustomColor}
                        onChange={(e) => setMatrixCustomColor(e.target.value)}
                        className="admin-input !w-44 !text-xs !py-1"
                      />
                      <input
                        type="color"
                        value={matrixCustomHex}
                        onChange={(e) => setMatrixCustomHex(e.target.value)}
                        className="h-7 w-9 cursor-pointer rounded border border-ink/20 p-0.5"
                        title="Pick colour swatch"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          if (matrixCustomColor.trim() && !matrixColours.some((c) => c.name === matrixCustomColor.trim())) {
                            setMatrixColours([...matrixColours, { name: matrixCustomColor.trim(), hex: matrixCustomHex }]);
                            setMatrixCustomColor('');
                          }
                        }}
                        className="rounded border border-ink/20 bg-white px-2.5 py-1 text-xs hover:bg-ink/5"
                      >
                        Add Colour
                      </button>
                    </div>

                    {/* SKU Prefix & Opening Stock */}
                    <div className="grid gap-3 sm:grid-cols-3 pt-2">
                      <label className="text-xs">
                        SKU Prefix
                        <input
                          value={matrixSkuPrefix}
                          onChange={(e) => setMatrixSkuPrefix(e.target.value)}
                          className="admin-input font-mono !text-xs"
                          placeholder="e.g. LL-ROMP"
                        />
                      </label>
                      <label className="text-xs">
                        Opening stock per variant
                        <input
                          type="number"
                          min="0"
                          value={matrixDefaultStock}
                          onChange={(e) => setMatrixDefaultStock(e.target.value)}
                          className="admin-input !text-xs"
                        />
                      </label>
                      <div className="flex items-end">
                        <Button
                          type="button"
                          size="sm"
                          disabled={isGeneratingMatrix || matrixSizes.length === 0 || matrixColours.length === 0}
                          onClick={() => void generateVariantMatrix()}
                        >
                          {isGeneratingMatrix
                            ? 'Creating...'
                            : `Generate ${matrixSizes.length * matrixColours.length} Variants`}
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* SINGLE VARIANT ADD FORM */}
                <form onSubmit={(e) => void addVariant(e)} className="grid gap-3 sm:grid-cols-7 bg-[#faf7f4] p-3 rounded border border-ink/15 items-end">
                  <label className="text-xs">
                    Size
                    <input
                      required
                      value={variantForm.size}
                      onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })}
                      className="admin-input !text-xs"
                      placeholder="e.g. 2-3Y"
                    />
                  </label>
                  <label className="text-xs">
                    Colour
                    <input
                      required
                      value={variantForm.colour}
                      onChange={(e) => setVariantForm({ ...variantForm, colour: e.target.value })}
                      className="admin-input !text-xs"
                      placeholder="e.g. Sage"
                    />
                  </label>
                  <label className="text-xs">
                    Swatch Hex
                    <input
                      value={variantForm.colour_hex}
                      onChange={(e) => setVariantForm({ ...variantForm, colour_hex: e.target.value })}
                      className="admin-input !text-xs font-mono"
                      placeholder="#9CAF88"
                    />
                  </label>
                  <label className="text-xs">
                    SKU
                    <input
                      required
                      value={variantForm.sku}
                      onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })}
                      className="admin-input !text-xs font-mono"
                      placeholder="LL-ROM-SAG-23"
                    />
                  </label>
                  <label className="text-xs">
                    Opening Stock
                    <input
                      required
                      type="number"
                      min="0"
                      step="1"
                      value={variantForm.stock}
                      onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })}
                      className="admin-input !text-xs"
                      placeholder="15"
                    />
                  </label>
                  <label className="text-xs">
                    Price Override
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={variantForm.price_override}
                      onChange={(e) => setVariantForm({ ...variantForm, price_override: e.target.value })}
                      className="admin-input !text-xs"
                      placeholder="Optional"
                    />
                  </label>
                  <div>
                    <Button type="submit" size="sm" className="w-full">
                      Add
                    </Button>
                  </div>
                </form>

                {/* EXISTING VARIANTS LIST */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs text-ink-light px-1">
                    <span>{variants.length} Variants Configured</span>
                    <span>Total Units: {variants.reduce((sum, v) => sum + (Number(v.stock) || 0), 0)}</span>
                  </div>
                  {variants.map((variant) => (
                    <VariantEditor
                      key={variant.id}
                      variant={variant}
                      onChange={(next) =>
                        setVariants((rows) => rows.map((row) => (row.id === next.id ? next : row)))
                      }
                      onSave={() => void saveVariant(variant)}
                      onDelete={() => void deleteVariant(variant.id, variant.sku)}
                    />
                  ))}
                  {variants.length === 0 && (
                    <p className="p-4 text-center text-xs text-ink-soft bg-ink/[0.02] rounded border border-ink/10">
                      No variants added yet. Use the Bulk Generator above or add sizes individually.
                    </p>
                  )}
                </div>

                {/* PRODUCT GALLERY */}
                <div className="mt-8 border-t border-ink/10 pt-6 space-y-4">
                  <div className="flex flex-wrap items-end justify-between gap-3">
                    <div>
                      <h2 className="font-serif text-xl font-medium">Product Gallery</h2>
                      <p className="mt-1 text-xs text-ink-light">
                        Assign images to specific colours/variants, reorder views, and manage alt text.
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <select
                        value={galleryAssetId}
                        onChange={(e) => setGalleryAssetId(e.target.value)}
                        className="border border-ink/15 bg-transparent p-2 text-xs rounded max-w-xs"
                      >
                        <option value="">Reuse from Library…</option>
                        {media.map((asset) => (
                          <option key={asset.id} value={asset.id}>
                            {asset.original_filename} · {asset.purpose}
                          </option>
                        ))}
                      </select>
                      <Button size="sm" onClick={() => void attachAsset()}>
                        Attach
                      </Button>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                    {gallery.map((item, index) => {
                      const asset = Array.isArray(item.media_assets)
                        ? item.media_assets[0]
                        : item.media_assets;
                      return (
                        <GalleryEditor
                          key={item.id}
                          item={item}
                          asset={asset}
                          media={media.filter(
                            (row) =>
                              row.mime_type?.startsWith('image/') &&
                              !gallery.some((linked) => linked.id !== item.id && linked.asset_id === row.id)
                          )}
                          variants={variants}
                          index={index}
                          count={gallery.length}
                          onChange={(next) =>
                            setGallery((rows) => rows.map((row) => (row.id === next.id ? next : row)))
                          }
                          onReplace={(assetId) => void replaceGalleryAsset(item.id, assetId)}
                          onMove={(direction) =>
                            setGallery((rows) => {
                              const next = [...rows];
                              const target = index + direction;
                              if (target < 0 || target >= next.length) return rows;
                              [next[index], next[target]] = [next[target], next[index]];
                              return next;
                            })
                          }
                          onRemove={() => void removeGalleryLink(item.id)}
                        />
                      );
                    })}
                  </div>

                  {gallery.length > 0 && (
                    <Button className="mt-4" size="sm" onClick={() => void saveGallery()}>
                      Save Gallery Order & Mappings
                    </Button>
                  )}
                </div>
              </section>
            )}
          </div>
        </section>
      )}

      {/* CATEGORIES TAB */}
      {tab === 'categories' && (
        <section className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]">
          <form onSubmit={(e) => void saveCategory(e)} className="space-y-4">
            <h2 className="font-serif text-xl">{categoryForm.id ? 'Edit category' : 'Add category'}</h2>
            <label className="block text-sm">
              Type
              <select
                value={categoryForm.kind}
                onChange={(e) => setCategoryForm({ ...categoryForm, kind: e.target.value })}
                className="admin-input"
              >
                <option value="product">Product category</option>
                <option value="age">Age group</option>
              </select>
            </label>
            <label className="block text-sm">
              Name
              <input
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Slug
              <input
                required
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Category image
              <select
                value={categoryForm.image_asset_id}
                onChange={(e) => setCategoryForm({ ...categoryForm, image_asset_id: e.target.value })}
                className="admin-input"
              >
                <option value="">No image</option>
                {media
                  .filter((asset) => asset.mime_type.startsWith('image/'))
                  .map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.original_filename} · {asset.purpose}
                    </option>
                  ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={categoryForm.is_active}
                onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
              />
              Active
            </label>
            <Button type="submit">Save category</Button>
            <button
              type="button"
              onClick={() =>
                setCategoryForm({
                  kind: 'product',
                  name: '',
                  slug: '',
                  description: '',
                  display_order: categories.length,
                  is_active: true,
                  image_asset_id: '',
                })
              }
              className="ml-3 text-sm underline"
            >
              New category
            </button>
          </form>
          <div>
            <h2 className="font-serif text-xl">Configured categories</h2>
            <ul className="mt-3 divide-y divide-ink/10">
              {categories.map((category) => (
                <li key={category.id} className="flex items-center justify-between py-3 text-sm">
                  <span>
                    {category.name}{' '}
                    <span className="text-xs text-ink-light">
                      {category.kind} · {category.slug}
                    </span>
                  </span>
                  <button
                    onClick={() =>
                      setCategoryForm({ ...category, image_asset_id: category.image_asset_id || '' })
                    }
                    className="underline text-xs"
                  >
                    Edit
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* MEDIA TAB */}
      {tab === 'media' && (
        <section className="mt-6">
          <div className="grid gap-4 sm:grid-cols-[1fr_220px]">
            <input
              value={mediaSearch}
              onChange={(e) => setMediaSearch(e.target.value)}
              placeholder="Search filename or purpose"
              className="admin-input"
            />
            <select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="admin-input">
              {purposes.map((value) => (
                <option key={value}>{value}</option>
              ))}
            </select>
          </div>
          {purpose === 'product' && (
            <label className="mt-3 block max-w-sm text-xs">
              Attach uploaded assets to product
              <select
                value={selectedProduct}
                onChange={(e) => void selectProduct(e.target.value)}
                className="admin-input"
              >
                <option value="">No product selected</option>
                {products.map((item) => (
                  <option key={item.id} value={item.id}>
                    {item.name}
                  </option>
                ))}
              </select>
            </label>
          )}
          <div
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            className="mt-4 rounded border border-dashed border-ink/30 p-8 text-center bg-cream/30"
          >
            <p className="text-sm font-medium">Drop files here or choose files</p>
            <p className="mt-1 text-xs text-ink-light">
              ImageKit originals stay external; images up to 20 MB and MP4/WebM videos up to 100 MB. SHA-256 checks reuse matching uploads.
            </p>
            <label className="mt-4 inline-block cursor-pointer rounded border border-ink bg-white px-4 py-2 text-sm hover:bg-ink/5">
              Choose multiple files
              <input
                type="file"
                multiple
                accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm"
                className="sr-only"
                onChange={handleFileInput}
              />
            </label>
            {uploadState && <p role="status" className="mt-3 text-xs font-mono">{uploadState}</p>}
          </div>
          <p className="mt-5 text-sm text-ink-soft">
            {filteredMedia.length} assets ·{' '}
            {media.reduce((sum, row) => sum + Number(row.file_size_bytes || 0), 0).toLocaleString()} bytes total metadata
          </p>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {filteredMedia.map((asset) => (
              <MediaCard
                key={asset.id}
                asset={asset}
                onCleanup={() => void deleteMediaAsset(asset)}
                onAltSave={async (alt) => {
                  if (!supabase) return;
                  const { error: saveError } = await supabase
                    .from('media_assets')
                    .update({ alt_text: alt })
                    .eq('id', asset.id);
                  if (saveError) fail(saveError.message);
                  else {
                    report('Alt text saved.');
                    await loadAdminData();
                  }
                }}
              />
            ))}
          </div>
        </section>
      )}

      {/* HOMEPAGE CMS TAB */}
      {tab === 'homepage' && (
        <section className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-2">
            {sections.map((item) => (
              <button
                key={item.id}
                onClick={() =>
                  setSectionForm({
                    section_key: item.section_key,
                    section_type: item.section_type,
                    heading: item.heading,
                    body: item.body,
                    cta_label: item.cta_label || '',
                    cta_href: item.cta_href || '',
                    desktop_asset_id: item.desktop_asset_id || '',
                    mobile_asset_id: item.mobile_asset_id || '',
                    is_published: item.is_published,
                  })
                }
                className="block w-full border-b border-ink/10 py-2 text-left text-sm"
              >
                {item.section_key} · {item.is_published ? 'published' : 'draft'}
              </button>
            ))}
            <button
              onClick={() =>
                setSectionForm({
                  section_key: '',
                  section_type: 'hero',
                  heading: '',
                  body: '',
                  cta_label: '',
                  cta_href: '',
                  desktop_asset_id: '',
                  mobile_asset_id: '',
                  is_published: false,
                })
              }
              className="text-sm underline"
            >
              Add homepage section
            </button>
          </aside>
          <form onSubmit={(e) => void saveSection(e)} className="space-y-4">
            <h2 className="font-serif text-xl">Homepage content</h2>
            <p className="text-xs leading-5 text-ink-soft">
              The built-in hero, campaign, brand story and fabric-detail photos stay visible until replaced by a published CMS section.
            </p>
            <label className="block text-sm">
              Section key
              <input
                required
                value={sectionForm.section_key}
                onChange={(e) => setSectionForm({ ...sectionForm, section_key: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Purpose
              <select
                value={sectionForm.section_type}
                onChange={(e) => setSectionForm({ ...sectionForm, section_type: e.target.value })}
                className="admin-input"
              >
                {[
                  'announcement',
                  'hero',
                  'featured_collections',
                  'new_arrivals',
                  'bestsellers',
                  'shop_the_look',
                  'brand_story',
                  'newsletter',
                  'campaign_banner',
                ].map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Heading
              <input
                value={sectionForm.heading}
                onChange={(e) => setSectionForm({ ...sectionForm, heading: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                rows={4}
                value={sectionForm.body}
                onChange={(e) => setSectionForm({ ...sectionForm, body: e.target.value })}
                className="admin-input"
              />
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="text-sm">
                CTA label
                <input
                  value={sectionForm.cta_label}
                  onChange={(e) => setSectionForm({ ...sectionForm, cta_label: e.target.value })}
                  className="admin-input"
                />
              </label>
              <label className="text-sm">
                CTA destination
                <input
                  value={sectionForm.cta_href}
                  onChange={(e) => setSectionForm({ ...sectionForm, cta_href: e.target.value })}
                  className="admin-input"
                />
              </label>
            </div>
            <label className="block text-sm">
              Desktop media asset
              <select
                value={sectionForm.desktop_asset_id}
                onChange={(e) => setSectionForm({ ...sectionForm, desktop_asset_id: e.target.value })}
                className="admin-input"
              >
                <option value="">No asset selected</option>
                {media.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.original_filename} · {asset.purpose}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm">
              Mobile media asset
              <select
                value={sectionForm.mobile_asset_id}
                onChange={(e) => setSectionForm({ ...sectionForm, mobile_asset_id: e.target.value })}
                className="admin-input"
              >
                <option value="">Use desktop asset</option>
                {media.map((asset) => (
                  <option key={asset.id} value={asset.id}>
                    {asset.original_filename} · {asset.purpose}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={sectionForm.is_published}
                onChange={(e) => setSectionForm({ ...sectionForm, is_published: e.target.checked })}
              />
              Publish section
            </label>
            <Button type="submit">Save section</Button>
          </form>
        </section>
      )}

      {/* COLLECTIONS TAB */}
      {tab === 'collections' && (
        <section className="mt-6 grid gap-8 lg:grid-cols-2">
          <form onSubmit={(e) => void createCollection(e)} className="space-y-4">
            <h2 className="font-serif text-xl">{collectionForm.id ? 'Edit collection' : 'Create collection'}</h2>
            <label className="block text-sm">
              Name
              <input
                required
                value={collectionForm.name}
                onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Slug
              <input
                required
                value={collectionForm.slug}
                onChange={(e) => setCollectionForm({ ...collectionForm, slug: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Description
              <textarea
                value={collectionForm.description}
                onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Cover image
              <select
                value={collectionForm.cover_asset_id}
                onChange={(e) => setCollectionForm({ ...collectionForm, cover_asset_id: e.target.value })}
                className="admin-input"
              >
                <option value="">No image selected</option>
                {media
                  .filter((asset) => asset.mime_type?.startsWith('image/'))
                  .map((asset) => (
                    <option key={asset.id} value={asset.id}>
                      {asset.original_filename}
                    </option>
                  ))}
              </select>
            </label>
            <div className="grid gap-3 sm:grid-cols-2">
              <label className="block text-sm">
                Status
                <select
                  value={collectionForm.status}
                  onChange={(e) => setCollectionForm({ ...collectionForm, status: e.target.value })}
                  className="admin-input"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </label>
              <label className="block text-sm">
                Homepage order
                <input
                  type="number"
                  min="0"
                  value={collectionForm.display_order}
                  onChange={(e) => setCollectionForm({ ...collectionForm, display_order: Number(e.target.value) })}
                  className="admin-input"
                />
              </label>
            </div>
            <label className="block text-sm">
              Add product to collection
              <select
                value={collectionForm.product_id}
                onChange={(e) => setCollectionForm({ ...collectionForm, product_id: e.target.value })}
                className="admin-input"
              >
                <option value="">Choose product…</option>
                {products
                  .filter((item) => item.status === 'published')
                  .map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name}
                    </option>
                  ))}
              </select>
            </label>
            <div className="flex flex-wrap gap-3">
              <Button type="submit">Save collection</Button>
              {collectionForm.id && (
                <button
                  type="button"
                  onClick={() =>
                    setCollectionForm({
                      name: '',
                      slug: '',
                      description: '',
                      product_id: '',
                      cover_asset_id: '',
                      display_order: collections.length,
                      status: 'draft',
                    })
                  }
                  className="text-sm underline"
                >
                  New collection
                </button>
              )}
            </div>
          </form>
          <div>
            <h2 className="font-serif text-xl">Collections</h2>
            <ul className="mt-3 divide-y divide-ink/10">
              {collections.map((item) => (
                <li key={item.id} className="py-3">
                  <button
                    type="button"
                    onClick={() =>
                      setCollectionForm({
                        id: item.id,
                        name: item.name,
                        slug: item.slug,
                        description: item.description || '',
                        product_id: '',
                        cover_asset_id: item.cover_asset_id || '',
                        display_order: item.display_order || 0,
                        status: item.status,
                      })
                    }
                    className="text-left text-sm underline"
                  >
                    {item.name}{' '}
                    <span className="text-ink-light">
                      /{item.slug} · {item.status}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* CONTENT TAB */}
      {tab === 'content' && <AdminContentPage />}

      {/* ORDERS TAB */}
      {tab === 'orders' && (
        <section className="mt-6 space-y-3">
          {orders.map((order) => {
            const paymentStatus = order.payments?.[0]?.status;
            const nextStatuses =
              order.status === 'pending_payment'
                ? ['pending_payment', 'cancelled']
                : order.status === 'paid'
                  ? ['paid', 'processing']
                  : order.status === 'processing'
                    ? ['processing', 'shipped']
                    : order.status === 'shipped'
                      ? ['shipped', ...(paymentStatus === 'captured' ? ['delivered'] : [])]
                      : [order.status];
            const shipment = order.shipments?.[0];
            return (
              <article key={order.id} className="flex flex-wrap items-center justify-between gap-4 border border-ink/10 p-4 rounded bg-white">
                <div>
                  <h2 className="text-sm font-medium">
                    Order #{order.order_number} · {formatINR(Number(order.total))}
                  </h2>
                  <p className="mt-1 text-xs text-ink-light">
                    {order.payment_method} · {paymentStatus || 'unpaid'} · {order.order_items?.length || 0} items ·{' '}
                    {new Date(order.placed_at).toLocaleString()}
                  </p>
                  {shipment && (
                    <p className="mt-1 text-xs text-ink-soft">
                      Shipment: {shipment.status}
                      {shipment.awb_code ? ` · AWB ${shipment.awb_code}` : ''}
                      {shipment.courier_name ? ` · ${shipment.courier_name}` : ''}
                    </p>
                  )}
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    aria-label={`Update order ${order.order_number} status`}
                    value={order.status}
                    onChange={(e) => void updateOrderStatus(order.id, e.target.value)}
                    className="border border-ink/15 bg-transparent p-2 text-sm rounded"
                  >
                    {nextStatuses.map((status) => (
                      <option key={status} value={status}>
                        {status.replace(/_/g, ' ')}
                      </option>
                    ))}
                  </select>
                  {order.payment_method === 'cod' &&
                    paymentStatus === 'pending_collection' &&
                    ['processing', 'shipped'].includes(order.status) && (
                      <Button size="sm" onClick={() => void recordCodCollection(order.id)}>
                        Record COD collected
                      </Button>
                    )}
                  {order.payment_method === 'razorpay' &&
                    paymentStatus === 'captured' &&
                    order.status !== 'refunded' && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => void refundOrder(order.id, Number(order.order_number), Number(order.total))}
                      >
                        Refund
                      </Button>
                    )}
                  {!shipment && ['paid', 'processing'].includes(order.status) && (
                    <Button size="sm" onClick={() => void runShipmentAction(order.id, 'create')}>
                      Create shipment
                    </Button>
                  )}
                  {shipment?.awb_code && (
                    <Button size="sm" variant="outline" onClick={() => void runShipmentAction(order.id, 'track')}>
                      Refresh tracking
                    </Button>
                  )}
                  {shipment?.tracking_url && (
                    <a className="text-xs underline ml-2" href={shipment.tracking_url} target="_blank" rel="noreferrer">
                      Track
                    </a>
                  )}
                </div>
              </article>
            );
          })}
          {!orders.length && <p className="text-sm text-ink-soft">No orders yet.</p>}
        </section>
      )}

      {/* SETTINGS TAB */}
      {tab === 'settings' && (
        <section className="mt-6 max-w-xl space-y-8">
          <div className="space-y-5">
            <h2 className="font-serif text-xl">Shipping and cash on delivery</h2>
            <p className="text-sm text-ink-soft">
              Shipping fees are calculated by the database when an order is placed. COD is disabled until enabled here. Razorpay remains unavailable until server credentials and a verified webhook are configured.
            </p>
            <label className="block text-sm">
              Free shipping threshold (₹)
              <input
                type="number"
                min="0"
                step="1"
                value={settings.free_shipping_threshold ?? ''}
                onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })}
                onBlur={(e) => void updateSetting('free_shipping_threshold', Number(e.target.value))}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Standard shipping fee (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.standard_shipping_fee ?? ''}
                onChange={(e) => setSettings({ ...settings, standard_shipping_fee: e.target.value })}
                onBlur={(e) => void updateSetting('standard_shipping_fee', Number(e.target.value))}
                className="admin-input"
              />
            </label>
            <label className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={settings.cod_enabled === true}
                onChange={(e) => void updateSetting('cod_enabled', e.target.checked)}
              />
              Enable COD (Cash on Delivery)
            </label>
            <label className="block text-sm">
              Additional COD surcharge (₹)
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.cod_surcharge ?? 0}
                onChange={(e) => setSettings({ ...settings, cod_surcharge: e.target.value })}
                onBlur={(e) => void updateSetting('cod_surcharge', Number(e.target.value))}
                className="admin-input"
              />
            </label>
            <label className="block text-sm">
              Maximum COD order limit (₹)
              <input
                type="number"
                min="0"
                step="1"
                value={settings.cod_order_limit ?? ''}
                onChange={(e) => setSettings({ ...settings, cod_order_limit: e.target.value })}
                onBlur={(e) => void updateSetting('cod_order_limit', Number(e.target.value))}
                className="admin-input"
              />
            </label>
          </div>
          <div className="space-y-4">
            <h2 className="font-serif text-xl">Customer support contacts</h2>
            {[
              ['support_email', 'Support email'],
              ['support_phone', 'Support phone'],
              ['support_whatsapp', 'WhatsApp number'],
            ].map(([key, label]) => (
              <label key={key} className="block text-sm">
                {label}
                <input
                  value={settings[key] ?? ''}
                  onChange={(e) => setSettings({ ...settings, [key]: e.target.value })}
                  onBlur={(e) => void updateSetting(key, e.target.value)}
                  className="admin-input"
                />
              </label>
            ))}
          </div>
          <p className="text-xs text-ink-light">
            Razorpay keys must be set as Supabase Edge Function secrets. Never put private keys in VITE_* values.
          </p>
        </section>
      )}
    </main>
  );
}

function AdminMessage({ title, body, link = false }: { title: string; body: string; link?: boolean }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-3xl">{title}</h1>
      <p className="mt-3 text-sm text-ink-soft">{body}</p>
      {link && (
        <Link to="/account" className="mt-5 inline-block underline text-sm font-medium">
          Sign in
        </Link>
      )}
    </main>
  );
}

function GalleryEditor({
  item,
  asset,
  media,
  variants,
  index,
  count,
  onChange,
  onReplace,
  onMove,
  onRemove,
}: {
  item: any;
  asset: any;
  media: any[];
  variants: any[];
  index: number;
  count: number;
  onChange: (item: any) => void;
  onReplace: (assetId: string) => void;
  onMove: (direction: number) => void;
  onRemove: () => void;
}) {
  const image = asset ? publicMediaUrl(asset, 400) : '';
  const variantOptions = useMemo(() => {
    // Unique colours or variant labels
    return variants.map((v) => ({
      id: v.id,
      label: `${v.colour} (${v.size}) · ${v.sku}`,
    }));
  }, [variants]);

  return (
    <article className="border border-ink/10 p-3 rounded bg-white">
      <div className="flex aspect-[4/3] items-center justify-center bg-ink/5 rounded overflow-hidden">
        {image && <img src={image} alt={item.alt_text} loading="lazy" className="h-full w-full object-cover" />}
      </div>
      <p className="mt-2 truncate text-xs font-medium" title={asset?.original_filename}>
        {asset?.original_filename || 'Media asset'}
      </p>

      {/* Variant Specific Assignment */}
      <label className="mt-2 block text-xs">
        Assign to colour / variant
        <select
          value={item.variant_id || ''}
          onChange={(e) => onChange({ ...item, variant_id: e.target.value || null })}
          className="admin-input !text-xs !py-1"
        >
          <option value="">All colours (General)</option>
          {variantOptions.map((opt) => (
            <option key={opt.id} value={opt.id}>
              {opt.label}
            </option>
          ))}
        </select>
      </label>

      <label className="mt-2 block text-xs">
        Replace with library image
        <select
          value=""
          onChange={(e) => onReplace(e.target.value)}
          className="admin-input !text-xs !py-1"
        >
          <option value="">Choose an image…</option>
          {media
            .filter((row) => row.id !== asset?.id)
            .map((row) => (
              <option key={row.id} value={row.id}>
                {row.original_filename}
              </option>
            ))}
        </select>
      </label>

      <label className="mt-2 block text-xs">
        Image alt text
        <input
          value={item.alt_text}
          onChange={(e) => onChange({ ...item, alt_text: e.target.value })}
          className="admin-input !text-xs !py-1"
          placeholder="Descriptive alt text for SEO"
        />
      </label>

      <label className="mt-2 block text-xs">
        Gallery view
        <select
          value={item.view_label}
          onChange={(e) => onChange({ ...item, view_label: e.target.value })}
          className="admin-input !text-xs !py-1"
        >
          {['front', 'back', 'side', 'detail', 'lifestyle', 'additional'].map((view) => (
            <option key={view}>{view}</option>
          ))}
        </select>
      </label>

      <div className="mt-3 flex items-center justify-between text-xs pt-1 border-t border-ink/10">
        <span className="font-medium text-ink-soft">
          {index === 0 ? '★ Primary image' : `Image ${index + 1}`}
        </span>
        <span className="flex items-center gap-2">
          <button
            type="button"
            disabled={index === 0}
            onClick={() => onMove(-1)}
            aria-label="Move image earlier"
            className="p-1 rounded hover:bg-ink/5 disabled:opacity-30"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </button>
          <button
            type="button"
            disabled={index === count - 1}
            onClick={() => onMove(1)}
            aria-label="Move image later"
            className="p-1 rounded hover:bg-ink/5 disabled:opacity-30"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </button>
          <button type="button" onClick={onRemove} className="text-red-700 hover:text-red-900 text-xs font-medium ml-1">
            Unlink
          </button>
        </span>
      </div>
    </article>
  );
}

function VariantEditor({
  variant,
  onChange,
  onSave,
  onDelete,
}: {
  variant: any;
  onChange: (value: any) => void;
  onSave: () => void;
  onDelete: () => void;
}) {
  const stockNum = Number(variant.stock) || 0;
  const stockBadge =
    stockNum === 0 ? (
      <span className="text-[10px] bg-red-100 text-red-800 px-1.5 py-0.5 rounded font-mono font-medium">Out</span>
    ) : stockNum < 5 ? (
      <span className="text-[10px] bg-amber-100 text-amber-800 px-1.5 py-0.5 rounded font-mono font-medium">Low: {stockNum}</span>
    ) : (
      <span className="text-[10px] bg-emerald-100 text-emerald-800 px-1.5 py-0.5 rounded font-mono font-medium">{stockNum} in stock</span>
    );

  return (
    <div className="grid items-end gap-2 border border-ink/10 bg-white p-3 rounded sm:grid-cols-8">
      <label className="text-[11px]">
        Size
        <input
          value={variant.size}
          onChange={(e) => onChange({ ...variant, size: e.target.value })}
          className="admin-input !text-xs !py-1"
        />
      </label>
      <label className="text-[11px]">
        Colour
        <input
          value={variant.colour}
          onChange={(e) => onChange({ ...variant, colour: e.target.value })}
          className="admin-input !text-xs !py-1"
        />
      </label>
      <label className="text-[11px]">
        SKU
        <input
          value={variant.sku}
          onChange={(e) => onChange({ ...variant, sku: e.target.value })}
          className="admin-input !text-xs !py-1 font-mono"
        />
      </label>
      <label className="text-[11px]">
        Price Override
        <input
          type="number"
          value={variant.price_override ?? ''}
          onChange={(e) => onChange({ ...variant, price_override: e.target.value })}
          className="admin-input !text-xs !py-1"
          placeholder="Default"
        />
      </label>
      <label className="text-[11px]">
        <span className="flex items-center justify-between">
          Stock {stockBadge}
        </span>
        <input
          type="number"
          min={variant.inventory?.quantity_reserved || 0}
          value={variant.stock}
          onChange={(e) => onChange({ ...variant, stock: Number(e.target.value) })}
          className="admin-input !text-xs !py-1"
        />
      </label>
      <div className="flex items-center gap-1 pb-2">
        <label className="flex items-center gap-1 text-[11px] cursor-pointer">
          <input
            type="checkbox"
            checked={variant.is_active}
            onChange={(e) => onChange({ ...variant, is_active: e.target.checked })}
          />
          Active
        </label>
      </div>
      <div>
        <Button size="sm" onClick={onSave} className="w-full">
          Save
        </Button>
      </div>
      <div>
        <button
          type="button"
          onClick={onDelete}
          className="w-full rounded border border-red-200 bg-red-50 py-1.5 text-xs text-red-800 hover:bg-red-100 flex items-center justify-center gap-1"
          title="Delete variant"
        >
          <Trash2 className="h-3 w-3" />
        </button>
      </div>
    </div>
  );
}

function MediaCard({
  asset,
  onCleanup,
  onAltSave,
}: {
  asset: any;
  onCleanup: () => void;
  onAltSave: (alt: string) => void;
}) {
  const [alt, setAlt] = useState(asset.alt_text || '');
  const [refs, setRefs] = useState<number | null>(null);
  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from('media_reference_counts')
      .select('reference_count')
      .eq('id', asset.id)
      .single()
      .then(({ data }) => setRefs(data ? Number(data.reference_count) : null));
  }, [asset.id]);
  const image = asset.mime_type.startsWith('image/') ? publicMediaUrl(asset, 150) : '';
  return (
    <article className="overflow-hidden border border-ink/10 rounded bg-white">
      <div className="flex aspect-[4/3] items-center justify-center bg-ink/5">
        {image ? (
          <img src={image} alt={alt} loading="lazy" className="h-full w-full object-cover" />
        ) : (
          <span className="text-xs text-ink-light font-mono">{asset.mime_type}</span>
        )}
      </div>
      <div className="space-y-2 p-3">
        <p className="truncate text-sm font-medium" title={asset.original_filename}>
          {asset.original_filename}
        </p>
        <p className="text-[11px] text-ink-light">
          {asset.provider} · {asset.resource_type} {asset.format ? `· ${asset.format}` : ''} · {asset.purpose} ·{' '}
          {asset.width || '—'} × {asset.height || '—'} · {(Number(asset.file_size_bytes) / 1024).toFixed(0)} KB
        </p>
        <label className="block text-xs">
          Alt text
          <input value={alt} onChange={(e) => setAlt(e.target.value)} className="admin-input !text-xs !py-1" />
        </label>
        <button onClick={() => onAltSave(alt)} className="text-xs underline text-ink hover:text-ink-soft">
          Save alt text
        </button>
        <p className="text-xs text-ink-light">
          {refs === null ? 'Checking references…' : `${refs} references`}
        </p>
        {refs === 0 && (
          <button onClick={onCleanup} className="text-xs text-red-800 underline hover:text-red-950 font-medium">
            Delete external asset
          </button>
        )}
      </div>
    </article>
  );
}
