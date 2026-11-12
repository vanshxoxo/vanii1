import { useCallback, useEffect, useState, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured } from '../lib/supabase';
import AdminContentPage from './AdminContentPage';
import { formatINR } from '../data';
import AdminLayout from '../components/admin/AdminLayout';
import type { AdminSectionId } from '../components/admin/adminNav';
import DashboardOverview from '../components/admin/DashboardOverview';
import ProductList from '../components/admin/ProductList';
import ProductWizard from '../components/admin/ProductWizard';
import StockManager from '../components/admin/StockManager';
import MediaLibraryView from '../components/admin/MediaLibraryView';
import DiscountsView from '../components/admin/DiscountsView';
import SupportView from '../components/admin/SupportView';
import PoliciesFaqsView from '../components/admin/PoliciesFaqsView';
import AnalyticsView from '../components/admin/AnalyticsView';

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
  const [tab, setTab] = useState<AdminSectionId>('overview');
  const [notice, setNotice] = useState('');
  const [error, setError] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [userEmail, setUserEmail] = useState('');

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
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [collectionIds, setCollectionIds] = useState<string[]>([]);

  const [categoryForm, setCategoryForm] = useState<any>({
    kind: 'product',
    name: '',
    slug: '',
    description: '',
    display_order: 0,
    is_active: true,
    image_asset_id: '',
  });

  const [media, setMedia] = useState<any[]>([]);
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

  const isOwner = adminRoles.includes('owner');

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
    setIsRefreshing(true);
    try {
      const [p, c, m, h, cl, s, o, customerRows, roleRows, summary] = await Promise.all([
        supabase
          .from('products')
          .select(
            '*,product_variants(id,sku,size,colour,colour_hex,is_active,price_override,inventory(quantity_on_hand,quantity_reserved)),product_media(id,asset_id,variant_id,display_order,is_primary,alt_text,view_label,media_assets(id,provider,purpose,lifecycle_status,delivery_url,external_url,resource_type,format,original_filename,width,height,file_size_bytes)),product_categories(category_id,categories(id,kind,name)),collection_products(collection_id)'
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
      if (s.data)
        setSettings(
          Object.fromEntries(s.data.map((row: any) => [row.setting_key, row.setting_value]))
        );
    } finally {
      setIsRefreshing(false);
    }
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
      setUserEmail(user.email || '');
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
    setVariants(
      (variantRows.data || []).map((row: any) => ({
        ...row,
        stock: row.inventory?.quantity_on_hand ?? 0,
      }))
    );
    setCategoryIds((categoryRows.data || []).map((row: any) => row.category_id));
    setCollectionIds((collectionRows.data || []).map((row: any) => row.collection_id));
    setGallery(productGallery.data || []);
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
          const inventory = Array.isArray(variant.inventory)
            ? variant.inventory[0]
            : variant.inventory;
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
        return (
          asset?.provider === 'imagekit' &&
          asset?.purpose === 'product' &&
          asset?.lifecycle_status === 'active'
        );
      });
      const requiresOwnerReview = [
        'owner-intake',
        'owner-review-required',
        'proposed-name',
        'proposed-price',
      ].some((tag) => productForm.tags.includes(tag));
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
        .insert(
          collectionIds.map((collection_id) => ({
            product_id: id,
            collection_id,
            display_order: 0,
          }))
        );
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
    report('Product details and collections saved successfully.');
    await loadAdminData();
  }

  async function duplicateProduct(sourceId: string) {
    if (!supabase || !sourceId) return;
    let newProductId: string | null = null;
    try {
      const source = products.find((p) => p.id === sourceId);
      if (!source) throw new Error('Source product not found.');

      report(`Duplicating "${source.name}"...`);

      // 1. Fetch fresh source data
      const [prodRes, catRes, colRes, varRes, medRes] = await Promise.all([
        supabase.from('products').select('*').eq('id', sourceId).single(),
        supabase.from('product_categories').select('category_id').eq('product_id', sourceId),
        supabase.from('collection_products').select('collection_id').eq('product_id', sourceId),
        supabase.from('product_variants').select('*').eq('product_id', sourceId),
        supabase.from('product_media').select('*').eq('product_id', sourceId),
      ]);

      if (prodRes.error) throw new Error(`Could not fetch source product: ${prodRes.error.message}`);
      const fullSource = prodRes.data;

      const copySuffix = Math.random().toString(36).slice(2, 6).toLowerCase();
      const copyName = `${fullSource.name} (Copy)`;
      const copySlug = `${fullSource.slug}-copy-${copySuffix}`;

      // 2. Insert new draft product (status always starts as 'draft')
      const { data: newProd, error: insertError } = await supabase
        .from('products')
        .insert({
          name: copyName,
          slug: copySlug,
          description: fullSource.description || '',
          material: fullSource.material || '',
          fabric_composition: fullSource.fabric_composition || '',
          care_instructions: fullSource.care_instructions || '',
          size_measurements: fullSource.size_measurements || '',
          price: fullSource.price,
          compare_at_price: fullSource.compare_at_price,
          status: 'draft',
          seo_title: fullSource.seo_title || null,
          seo_description: fullSource.seo_description || null,
          tags: [...(fullSource.tags || []), 'duplicate-draft'],
          published_at: null,
        })
        .select('id')
        .single();

      if (insertError || !newProd)
        throw new Error(`Product creation failed: ${insertError?.message || 'Unknown'}`);
      newProductId = newProd.id;

      // 3. Clone category assignments
      const catLinks = catRes.data || [];
      if (catLinks.length > 0) {
        const { error: catErr } = await supabase
          .from('product_categories')
          .insert(catLinks.map((c: any) => ({ product_id: newProductId, category_id: c.category_id })));
        if (catErr) throw new Error(`Category assignment failed: ${catErr.message}`);
      }

      // 4. Clone collection assignments
      const colLinks = colRes.data || [];
      if (colLinks.length > 0) {
        const { error: colErr } = await supabase.from('collection_products').insert(
          colLinks.map((c: any) => ({
            product_id: newProductId,
            collection_id: c.collection_id,
            display_order: 0,
          }))
        );
        if (colErr) throw new Error(`Collection assignment failed: ${colErr.message}`);
      }

      // 5. Clone variants with ZERO stock & map old variant_id -> new variant_id
      const sourceVariants = varRes.data || [];
      const oldToNewVariantMap = new Map<string, string>();

      for (const v of sourceVariants) {
        const cleanSkuBase = v.sku.replace(/-CPY-[A-Za-z0-9]+$/i, '');
        const newSku = `${cleanSkuBase}-CPY-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;

        const { data: newV, error: vErr } = await supabase
          .from('product_variants')
          .insert({
            product_id: newProductId,
            size: v.size,
            colour: v.colour,
            colour_hex: v.colour_hex,
            sku: newSku,
            price_override: v.price_override,
            is_active: v.is_active,
          })
          .select('id')
          .single();

        if (vErr || !newV)
          throw new Error(`Variant creation failed for ${v.sku}: ${vErr?.message || 'Unknown'}`);
        oldToNewVariantMap.set(v.id, newV.id);

        // Explicitly set opening stock to 0 for duplicated variants (Never clone physical inventory)
        const { error: stockErr } = await supabase.rpc('set_variant_stock', {
          p_variant_id: newV.id,
          p_quantity: 0,
        });
        if (stockErr)
          throw new Error(`Zero stock initialization failed for ${newSku}: ${stockErr.message}`);
      }

      // 6. Clone product media and remap variant_id to the new variant
      const sourceMedia = medRes.data || [];
      if (sourceMedia.length > 0) {
        const remappedMedia = sourceMedia.map((m: any) => ({
          product_id: newProductId,
          asset_id: m.asset_id,
          display_order: m.display_order,
          is_primary: m.is_primary,
          alt_text: m.alt_text || '',
          view_label: m.view_label || 'additional',
          variant_id: m.variant_id ? oldToNewVariantMap.get(m.variant_id) || null : null,
        }));

        const { error: medErr } = await supabase.from('product_media').insert(remappedMedia);
        if (medErr) throw new Error(`Media gallery linking failed: ${medErr.message}`);
      }

      report(`Successfully duplicated "${fullSource.name}" as draft with 0 stock and remapped photos.`);
      await loadAdminData();
      if (newProductId) {
        await selectProduct(newProductId);
        setTab('add-product');
      }
    } catch (err: any) {
      if (newProductId) {
        await supabase.from('products').delete().eq('id', newProductId);
      }
      fail(`Duplication aborted: ${err.message}. Any partial product data was cleanly rolled back.`);
    }
  }

  async function deleteProduct(productId: string) {
    if (!supabase || !productId) return;
    const prod = products.find((p) => p.id === productId);

    // Safety check 1: Orders referencing product
    const { data: orderLines, error: orderCheckErr } = await supabase
      .from('order_items')
      .select('id')
      .eq('product_id', productId)
      .limit(1);

    if (orderCheckErr) {
      fail(`Could not verify product order history: ${orderCheckErr.message}`);
      return;
    }

    if (orderLines && orderLines.length > 0) {
      fail(
        `Product "${prod?.name || 'this item'}" cannot be deleted because it is referenced in past customer orders. Set its status to "Archived" instead to preserve accounting and customer order history.`
      );
      return;
    }

    // Safety check 2: Ledger movements
    const { data: prodVariants } = await supabase
      .from('product_variants')
      .select('id')
      .eq('product_id', productId);
    if (prodVariants && prodVariants.length > 0) {
      const vIds = prodVariants.map((v) => v.id);
      const { data: movements } = await supabase
        .from('inventory_movements')
        .select('id')
        .in('variant_id', vIds)
        .limit(1);
      if (movements && movements.length > 0) {
        fail(
          `Product "${prod?.name || 'this item'}" has variant inventory ledger movements on record. Set its status to "Archived" instead of deleting to maintain inventory audit trails.`
        );
        return;
      }
    }

    if (
      !window.confirm(
        `Permanently delete "${prod?.name || 'this product'}"? This removes its draft variants, category mappings, and gallery links. Media files in library will remain safe.`
      )
    )
      return;

    const { error: deleteError } = await supabase.from('products').delete().eq('id', productId);
    if (deleteError) {
      fail(`Could not delete product: ${deleteError.message}`);
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
    setTab('products');
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
    // handled inside wizard
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

  async function deleteVariant(variantId: string) {
    if (!supabase || !variantId) return;

    const [orderCheck, movementCheck, reservationCheck] = await Promise.all([
      supabase.from('order_items').select('id').eq('variant_id', variantId).limit(1),
      supabase.from('inventory_movements').select('id').eq('variant_id', variantId).limit(1),
      supabase.from('stock_reservations').select('order_id').eq('variant_id', variantId).limit(1),
    ]);

    const hasOrders = (orderCheck.data?.length ?? 0) > 0;
    const hasMovements = (movementCheck.data?.length ?? 0) > 0;
    const hasReservations = (reservationCheck.data?.length ?? 0) > 0;

    if (hasOrders || hasMovements || hasReservations) {
      fail(
        `Variant cannot be deleted because it has historical audit records (${
          hasOrders ? 'customer order line' : hasMovements ? 'inventory ledger movement' : 'active reservation'
        }). To remove it safely, uncheck "Active" and click Save.`
      );
      return;
    }

    if (!window.confirm(`Delete this variant? This action cannot be undone.`)) return;

    const { error: delError } = await supabase.from('product_variants').delete().eq('id', variantId);
    if (delError) {
      fail(`Could not delete variant: ${delError.message}`);
      return;
    }
    report(`Deleted variant.`);
    await selectProduct(selectedProduct);
  }

  async function generateMatrixFromWizard(
    sizes: string[],
    colours: { name: string; hex: string }[],
    defaultStock: number
  ) {
    if (!supabase || !selectedProduct) return;
    const existingCombos = new Set(variants.map((v) => `${v.size}:::${v.colour}`));
    const prefix = `LL-${productForm.slug.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8)}`;
    let created = 0;
    for (const col of colours) {
      for (const sz of sizes) {
        const comboKey = `${sz}:::${col.name}`;
        if (existingCombos.has(comboKey)) continue;

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
            p_quantity: defaultStock,
          });
          created++;
        }
      }
    }
    report(`Generated ${created} new size/colour variants with ${defaultStock} units opening stock.`);
    await selectProduct(selectedProduct);
  }

  async function uploadSingleFile(file: File, filePurpose: string) {
    if (!supabase) throw new Error('Supabase not configured.');
    const isVideo = file.type.startsWith('video/');
    if (
      !/^(image\/(jpeg|png|webp|avif|gif)|video\/(mp4|webm))$/.test(file.type) ||
      file.size > (isVideo ? 100 : 20) * 1024 * 1024
    ) {
      throw new Error(`${file.name}: use JPG, PNG, WebP, AVIF, GIF up to 20 MB.`);
    }
    const checksum = await fileSha256(file);
    const { data: duplicate } = await supabase
      .from('media_assets')
      .select('*')
      .eq('checksum_sha256', checksum)
      .maybeSingle();

    let asset = duplicate;
    if (!asset) {
      const { data: sessionData } = await supabase.auth.getSession();
      const accessToken = sessionData.session?.access_token;
      if (!accessToken) throw new Error('Administrator session expired. Sign in again.');

      const authorization = await fetch('/api/imagekit-auth', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ purpose: filePurpose, mime_type: file.type, file_size_bytes: file.size }),
      });
      const auth = await authorization.json();
      if (!authorization.ok) throw new Error(auth.error || 'ImageKit upload authorization failed.');

      const extension = file.name.includes('.')
        ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '')
        : 'bin';
      const folder =
        filePurpose === 'product'
          ? '/little-loom/products'
          : filePurpose === 'category'
          ? '/little-loom/categories'
          : filePurpose === 'collection'
          ? '/little-loom/collections'
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
            purpose: filePurpose,
          }),
        });
        const registration = await registered.json();
        if (!registered.ok || !registration.asset) {
          throw new Error(registration.error || 'Metadata registration failed.');
        }
        asset = registration.asset;
      }
    }
    await loadAdminData();
    return asset;
  }

  async function attachMediaToProduct(assetId: string, variantId?: string) {
    if (!supabase || !selectedProduct) return;
    const { data: existing } = await supabase
      .from('product_media')
      .select('display_order')
      .eq('product_id', selectedProduct)
      .order('display_order', { ascending: false })
      .limit(1);

    const { error: linkErr } = await supabase.from('product_media').upsert(
      {
        product_id: selectedProduct,
        asset_id: assetId,
        display_order: (existing?.[0]?.display_order ?? -1) + 1,
        is_primary: !existing?.length,
        alt_text: productForm.name || '',
        view_label: 'additional',
        variant_id: variantId || null,
      },
      { onConflict: 'product_id,asset_id,variant_id' }
    );
    if (linkErr) {
      fail(linkErr.message);
      return;
    }
    report('Photo linked to product gallery.');
    await selectProduct(selectedProduct);
  }

  async function removeProductMedia(linkId: string) {
    if (!supabase) return;
    const { error: delErr } = await supabase.from('product_media').delete().eq('id', linkId);
    if (delErr) {
      fail(delErr.message);
      return;
    }
    report('Photo removed from product gallery.');
    if (selectedProduct) await selectProduct(selectedProduct);
  }

  async function setPrimaryMedia(linkId: string) {
    if (!supabase || !selectedProduct) return;
    await supabase
      .from('product_media')
      .update({ is_primary: false })
      .eq('product_id', selectedProduct);
    const { error: setErr } = await supabase
      .from('product_media')
      .update({ is_primary: true })
      .eq('id', linkId);
    if (setErr) {
      fail(setErr.message);
      return;
    }
    report('Cover photo set.');
    await selectProduct(selectedProduct);
  }

  async function deleteMediaAsset(assetId: string) {
    if (!supabase) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) {
      fail('Administrator session expired. Sign in again.');
      return;
    }
    const response = await fetch('/api/imagekit-delete', {
      method: 'POST',
      headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ asset_id: assetId }),
    });
    const data = await response.json();
    if (!response.ok || data?.error) {
      fail(data?.error || 'Media deletion failed.');
      return;
    }
    report('Media asset deleted from provider.');
    await loadAdminData();
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const payload = {
      kind: categoryForm.kind,
      name: categoryForm.name.trim(),
      slug: categoryForm.slug.trim(),
      description: categoryForm.description,
      display_order: Number(categoryForm.display_order),
      is_active: categoryForm.is_active,
      image_asset_id: categoryForm.image_asset_id || null,
    };
    const { error: saveError } = categoryForm.id
      ? await supabase.from('categories').update(payload).eq('id', categoryForm.id)
      : await supabase.from('categories').insert(payload);
    if (saveError) {
      fail(saveError.message);
      return;
    }
    report('Category saved.');
    setCategoryForm({
      kind: 'product',
      name: '',
      slug: '',
      description: '',
      display_order: categories.length,
      is_active: true,
      image_asset_id: '',
    });
    await loadAdminData();
  }

  async function saveSection(event: FormEvent) {
    event.preventDefault();
    if (!supabase) return;
    const payload = {
      section_key: sectionForm.section_key.trim(),
      section_type: sectionForm.section_type,
      heading: sectionForm.heading,
      body: sectionForm.body,
      cta_label: sectionForm.cta_label || null,
      cta_href: sectionForm.cta_href || null,
      desktop_asset_id: sectionForm.desktop_asset_id || null,
      mobile_asset_id: sectionForm.mobile_asset_id || null,
      is_published: sectionForm.is_published,
      display_order: sections.length,
    };
    const { error: saveError } = await supabase
      .from('homepage_sections')
      .upsert(payload, { onConflict: 'section_key' });
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
      display_order: Number(collectionForm.display_order),
      status: collectionForm.status,
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
        {
          setting_key: key,
          setting_value: value,
          is_public: true,
          updated_by: (await supabase.auth.getUser()).data.user?.id,
        },
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
    const { error: collectionError } = await supabase.rpc('complete_cod_collection', {
      p_order_id: orderId,
    });
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
    report(
      action === 'create'
        ? 'Shiprocket shipment created.'
        : `Tracking updated: ${data.raw_status || data.status}.`
    );
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

  async function handleSignOut() {
    if (supabase) {
      await supabase.auth.signOut();
      setAccess('signed-out');
    }
  }

  if (access === 'unconfigured')
    return (
      <AdminMessage
        title="Admin setup needed"
        body="Add your Supabase project URL and publishable key in .env.local, then apply the database migration."
      />
    );
  if (access === 'loading')
    return <AdminMessage title="Checking access" body="Verifying your administrator session..." />;
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

  return (
    <AdminLayout
      currentSection={tab}
      onSelectSection={(sec) => {
        setTab(sec);
        if (sec === 'add-product' && selectedProduct) {
          // Keep current product or start fresh
        } else if (sec === 'add-product') {
          setSelectedProduct('');
          setProductForm(emptyProduct);
          setVariants([]);
          setGallery([]);
          setCategoryIds([]);
          setCollectionIds([]);
        }
      }}
      adminRoles={adminRoles}
      dashboardData={dashboard}
      onRefresh={loadAdminData}
      isRefreshing={isRefreshing}
      userEmail={userEmail}
      onSignOut={handleSignOut}
      notice={notice}
      error={error}
      onClearNotice={() => setNotice('')}
      onClearError={() => setError('')}
    >
      {/* 1. OVERVIEW */}
      {tab === 'overview' && (
        <DashboardOverview
          dashboard={dashboard}
          products={products}
          orders={orders}
          media={media}
          categories={categories}
          onNavigate={(sec) => setTab(sec)}
          onNewProduct={() => {
            setSelectedProduct('');
            setProductForm(emptyProduct);
            setVariants([]);
            setGallery([]);
            setCategoryIds([]);
            setCollectionIds([]);
            setTab('add-product');
          }}
        />
      )}

      {/* 2. ALL PRODUCTS */}
      {tab === 'products' && (
        <ProductList
          products={products}
          categories={categories}
          selectedProductId={selectedProduct}
          onSelectProduct={async (id) => {
            await selectProduct(id);
            setTab('add-product');
          }}
          onNewProduct={() => {
            setSelectedProduct('');
            setProductForm(emptyProduct);
            setVariants([]);
            setGallery([]);
            setCategoryIds([]);
            setCollectionIds([]);
            setTab('add-product');
          }}
          onDuplicateProduct={duplicateProduct}
          onDeleteProduct={deleteProduct}
          onQuickToggleStatus={quickToggleStatus}
        />
      )}

      {/* 3. ADD / EDIT PRODUCT WIZARD */}
      {tab === 'add-product' && (
        <ProductWizard
          productForm={productForm}
          setProductForm={setProductForm}
          categories={categories}
          categoryIds={categoryIds}
          setCategoryIds={setCategoryIds}
          collections={collections}
          collectionIds={collectionIds}
          setCollectionIds={setCollectionIds}
          variants={variants}
          setVariants={setVariants}
          gallery={gallery}
          media={media}
          onSaveProduct={saveProduct}
          onAddVariant={addVariant}
          onDeleteVariant={deleteVariant}
          onSaveVariant={saveVariant}
          onUploadFile={uploadSingleFile}
          onAttachMediaToProduct={attachMediaToProduct}
          onRemoveProductMedia={removeProductMedia}
          onSetPrimaryMedia={setPrimaryMedia}
          onGenerateMatrix={generateMatrixFromWizard}
          onQuickToggleStatus={quickToggleStatus}
          onBackToList={() => setTab('products')}
          pendingApprovals={pendingProductApprovals}
        />
      )}

      {/* 4. STOCK & SIZES */}
      {tab === 'stock' && (
        <StockManager
          products={products}
          onRefresh={loadAdminData}
          onSelectProduct={async (id) => {
            await selectProduct(id);
            setTab('add-product');
          }}
        />
      )}

      {/* 5. PHOTOS & UPLOADS */}
      {tab === 'media' && (
        <MediaLibraryView
          media={media}
          products={products}
          sections={sections}
          onUploadFile={uploadSingleFile}
          onDeleteAsset={deleteMediaAsset}
        />
      )}

      {/* 6. ORDERS */}
      {tab === 'orders' && (
        <section className="space-y-4 animate-fade-in max-w-5xl">
          <div className="pb-2">
            <h2 className="font-serif text-2xl font-bold text-ink">Customer Orders</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Review placed orders, update fulfillment statuses, track Shiprocket shipments, and record COD collections
            </p>
          </div>

          <div className="space-y-3">
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
                <article
                  key={order.id}
                  className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs flex flex-wrap items-center justify-between gap-4"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-serif font-bold text-base text-ink">
                        Order #{order.order_number}
                      </span>
                      <span className="font-serif font-bold text-base text-clay">
                        {formatINR(Number(order.total))}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-ink-muted">
                      {order.payment_method?.toUpperCase()} • {paymentStatus || 'unpaid'} •{' '}
                      {order.order_items?.length || 0} items •{' '}
                      {new Date(order.placed_at).toLocaleString()}
                    </p>
                    {shipment && (
                      <p className="mt-1 text-xs text-ink-soft">
                        Shipment: <strong>{shipment.status}</strong>
                        {shipment.awb_code ? ` | AWB: ${shipment.awb_code}` : ''}
                        {shipment.courier_name ? ` (${shipment.courier_name})` : ''}
                      </p>
                    )}
                  </div>

                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      aria-label={`Update order ${order.order_number} status`}
                      value={order.status}
                      onChange={(e) => void updateOrderStatus(order.id, e.target.value)}
                      className="px-3 py-1.5 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9] font-medium text-ink"
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
                        <button
                          onClick={() => void recordCodCollection(order.id)}
                          className="px-3 py-1.5 rounded-xl bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition"
                        >
                          Record COD collected
                        </button>
                      )}

                    {order.payment_method === 'razorpay' &&
                      paymentStatus === 'captured' &&
                      order.status !== 'refunded' && (
                        <button
                          onClick={() =>
                            void refundOrder(order.id, Number(order.order_number), Number(order.total))
                          }
                          className="px-3 py-1.5 rounded-xl border border-rose-200 bg-rose-50 text-rose-800 text-xs font-semibold hover:bg-rose-100 transition"
                        >
                          Refund
                        </button>
                      )}

                    {!shipment && ['paid', 'processing'].includes(order.status) && (
                      <button
                        onClick={() => void runShipmentAction(order.id, 'create')}
                        className="px-3 py-1.5 rounded-xl bg-ink text-white text-xs font-semibold hover:bg-ink-soft transition"
                      >
                        Create shipment
                      </button>
                    )}

                    {shipment?.awb_code && (
                      <button
                        onClick={() => void runShipmentAction(order.id, 'track')}
                        className="px-3 py-1.5 rounded-xl border border-[#E8E2D9] text-ink text-xs font-semibold hover:bg-[#FAF7F0] transition"
                      >
                        Refresh tracking
                      </button>
                    )}

                    {shipment?.tracking_url && (
                      <a
                        className="text-xs text-clay underline font-medium ml-1"
                        href={shipment.tracking_url}
                        target="_blank"
                        rel="noreferrer"
                      >
                        Track ↗
                      </a>
                    )}
                  </div>
                </article>
              );
            })}
            {!orders.length && (
              <div className="bg-white rounded-2xl border border-[#E8E2D9] p-12 text-center text-xs text-ink-muted">
                No customer orders placed yet.
              </div>
            )}
          </div>
        </section>
      )}

      {/* 7. CUSTOMERS */}
      {tab === 'customers' && (
        <section className="space-y-4 animate-fade-in max-w-5xl">
          <div className="pb-2">
            <h2 className="font-serif text-2xl font-bold text-ink">Customer Directory</h2>
            <p className="text-xs text-ink-muted mt-0.5">
              Registered customers and communication history
            </p>
          </div>

          <div className="bg-white rounded-2xl border border-[#E8E2D9] shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-[#FAF7F0] border-b border-[#E8E2D9] text-ink-muted uppercase tracking-wider font-semibold">
                  <tr>
                    <th className="py-3 px-4">Customer Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Joined Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E8E2D9]">
                  {customers.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FAF7F0]/60 transition">
                      <td className="py-3 px-4 font-semibold text-ink">
                        {c.full_name || 'Guest Customer'}
                      </td>
                      <td className="py-3 px-4 text-ink-soft">{c.email}</td>
                      <td className="py-3 px-4 text-ink-muted">{c.phone || '—'}</td>
                      <td className="py-3 px-4 text-ink-muted">
                        {new Date(c.created_at).toLocaleDateString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {!customers.length && (
                <div className="p-8 text-center text-xs text-ink-muted">No customers registered yet.</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 8. DISCOUNTS */}
      {tab === 'discounts' && <DiscountsView settings={settings} onRefresh={loadAdminData} />}

      {/* 9. CATEGORIES */}
      {tab === 'categories' && (
        <section className="grid gap-8 lg:grid-cols-2 animate-fade-in max-w-5xl">
          <form
            onSubmit={(e) => void saveCategory(e)}
            className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-4"
          >
            <h3 className="font-serif font-bold text-lg text-ink">
              {categoryForm.id ? 'Edit Category' : 'Create New Category'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Type
              </label>
              <select
                value={categoryForm.kind}
                onChange={(e) => setCategoryForm({ ...categoryForm, kind: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              >
                <option value="product">Product category (Rompers, Co-ords, etc.)</option>
                <option value="age">Age group (Newborn, Baby, Toddler, etc.)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Name *
              </label>
              <input
                required
                value={categoryForm.name}
                onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                URL Handle (Slug) *
              </label>
              <input
                required
                value={categoryForm.slug}
                onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={categoryForm.description}
                onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div className="flex items-center gap-2 pt-1">
              <input
                type="checkbox"
                id="cat-active"
                checked={categoryForm.is_active}
                onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })}
                className="w-4 h-4 rounded text-clay focus:ring-clay"
              />
              <label htmlFor="cat-active" className="text-xs font-medium text-ink cursor-pointer">
                Active in storefront navigation
              </label>
            </div>

            <div className="flex items-center gap-3 pt-3">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
              >
                Save Category
              </button>
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
                className="text-xs text-ink-muted hover:underline"
              >
                Clear form
              </button>
            </div>
          </form>

          {/* Configured Categories List */}
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-3">
            <h3 className="font-serif font-bold text-lg text-ink">Active Categories</h3>
            <div className="divide-y divide-[#E8E2D9]">
              {categories.map((c) => (
                <div key={c.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-ink">{c.name}</span>
                    <span className="text-[11px] text-ink-muted ml-2">
                      /{c.slug} • {c.kind}
                    </span>
                  </div>
                  <button
                    onClick={() => setCategoryForm(c)}
                    className="text-xs font-medium text-clay hover:underline"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 10. COLLECTIONS */}
      {tab === 'collections' && (
        <section className="grid gap-8 lg:grid-cols-2 animate-fade-in max-w-5xl">
          <form
            onSubmit={(e) => void createCollection(e)}
            className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-4"
          >
            <h3 className="font-serif font-bold text-lg text-ink">
              {collectionForm.id ? 'Edit Collection' : 'Create Collection'}
            </h3>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Collection Name *
              </label>
              <input
                required
                value={collectionForm.name}
                onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Slug *
              </label>
              <input
                required
                value={collectionForm.slug}
                onChange={(e) => setCollectionForm({ ...collectionForm, slug: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Description
              </label>
              <textarea
                rows={3}
                value={collectionForm.description}
                onChange={(e) =>
                  setCollectionForm({ ...collectionForm, description: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Status
                </label>
                <select
                  value={collectionForm.status}
                  onChange={(e) => setCollectionForm({ ...collectionForm, status: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
                >
                  <option value="draft">Draft</option>
                  <option value="published">Published</option>
                  <option value="archived">Archived</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Order Index
                </label>
                <input
                  type="number"
                  min="0"
                  value={collectionForm.display_order}
                  onChange={(e) =>
                    setCollectionForm({
                      ...collectionForm,
                      display_order: Number(e.target.value),
                    })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
                />
              </div>
            </div>

            <div className="pt-2">
              <button
                type="submit"
                className="px-4 py-2 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
              >
                Save Collection
              </button>
            </div>
          </form>

          {/* Collections List */}
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-3">
            <h3 className="font-serif font-bold text-lg text-ink">Active Collections</h3>
            <div className="divide-y divide-[#E8E2D9]">
              {collections.map((col) => (
                <div key={col.id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-ink">{col.name}</span>
                    <span className="text-[11px] text-ink-muted ml-2">
                      /{col.slug} • {col.status}
                    </span>
                  </div>
                  <button
                    onClick={() => setCollectionForm(col)}
                    className="text-xs font-medium text-clay hover:underline"
                  >
                    Edit
                  </button>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. HOMEPAGE CMS */}
      {tab === 'homepage' && (
        <section className="grid gap-8 lg:grid-cols-[280px_1fr] animate-fade-in max-w-5xl">
          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-5 shadow-2xs space-y-2">
            <h3 className="font-serif font-bold text-sm text-ink mb-2">Homepage Sections</h3>
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
                className="block w-full border-b border-[#E8E2D9] py-2 text-left text-xs font-medium text-ink hover:text-clay transition"
              >
                {item.section_key}{' '}
                <span className="text-[10px] text-ink-muted">
                  ({item.is_published ? 'live' : 'draft'})
                </span>
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
              className="text-xs text-clay font-semibold hover:underline pt-2 block"
            >
              + Add homepage section
            </button>
          </div>

          <form
            onSubmit={(e) => void saveSection(e)}
            className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-4"
          >
            <h3 className="font-serif font-bold text-lg text-ink">Homepage Content Editor</h3>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Section Key *
                </label>
                <input
                  required
                  value={sectionForm.section_key}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, section_key: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  Layout Type
                </label>
                <select
                  value={sectionForm.section_type}
                  onChange={(e) =>
                    setSectionForm({ ...sectionForm, section_type: e.target.value })
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
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
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Heading
              </label>
              <input
                value={sectionForm.heading}
                onChange={(e) => setSectionForm({ ...sectionForm, heading: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Body / Editorial Copy
              </label>
              <textarea
                rows={4}
                value={sectionForm.body}
                onChange={(e) => setSectionForm({ ...sectionForm, body: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  CTA Button Label
                </label>
                <input
                  value={sectionForm.cta_label}
                  onChange={(e) => setSectionForm({ ...sectionForm, cta_label: e.target.value })}
                  placeholder="e.g. Explore Collection"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                  CTA Link (Href)
                </label>
                <input
                  value={sectionForm.cta_href}
                  onChange={(e) => setSectionForm({ ...sectionForm, cta_href: e.target.value })}
                  placeholder="e.g. /category/baby"
                  className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="sec-publish"
                checked={sectionForm.is_published}
                onChange={(e) =>
                  setSectionForm({ ...sectionForm, is_published: e.target.checked })
                }
                className="w-4 h-4 rounded text-clay focus:ring-clay"
              />
              <label htmlFor="sec-publish" className="text-xs font-medium text-ink cursor-pointer">
                Publish on live storefront
              </label>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
            >
              Save Section
            </button>
          </form>
        </section>
      )}

      {/* 12. STORE CONTENT */}
      {tab === 'content' && <AdminContentPage />}

      {/* 13. POLICIES & FAQS */}
      {tab === 'policies-faqs' && (
        <PoliciesFaqsView settings={settings} onRefresh={loadAdminData} />
      )}

      {/* 14. BUSINESS ANALYTICS */}
      {tab === 'analytics' && (
        <AnalyticsView orders={orders} products={products} customers={customers} />
      )}

      {/* 15. CUSTOMER SUPPORT */}
      {tab === 'support' && <SupportView settings={settings} onRefresh={loadAdminData} />}

      {/* 16. STORE SETTINGS */}
      {tab === 'settings' && (
        <section className="bg-white rounded-2xl border border-[#E8E2D9] p-6 lg:p-8 shadow-2xs space-y-6 max-w-2xl animate-fade-in">
          <div>
            <h2 className="font-serif text-2xl font-bold text-ink">Shipping and Checkout Settings</h2>
            <p className="text-xs text-ink-muted mt-1">
              Configure free shipping threshold, delivery fees, and cash on delivery allowances
            </p>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Free shipping threshold (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.free_shipping_threshold ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, free_shipping_threshold: e.target.value })
                }
                onBlur={(e) => void updateSetting('free_shipping_threshold', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Standard shipping fee (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.standard_shipping_fee ?? ''}
                onChange={(e) =>
                  setSettings({ ...settings, standard_shipping_fee: e.target.value })
                }
                onBlur={(e) => void updateSetting('standard_shipping_fee', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>

            <div className="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                id="cod-enable"
                checked={settings.cod_enabled === true}
                onChange={(e) => void updateSetting('cod_enabled', e.target.checked)}
                className="w-4 h-4 rounded text-clay focus:ring-clay"
              />
              <label htmlFor="cod-enable" className="text-xs font-medium text-ink cursor-pointer">
                Enable Cash on Delivery (COD)
              </label>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Additional COD surcharge (₹)
              </label>
              <input
                type="number"
                min="0"
                step="0.01"
                value={settings.cod_surcharge ?? 0}
                onChange={(e) => setSettings({ ...settings, cod_surcharge: e.target.value })}
                onBlur={(e) => void updateSetting('cod_surcharge', Number(e.target.value))}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              />
            </div>
          </div>
        </section>
      )}

      {/* 17. TEAM ROLES (OWNER ONLY) */}
      {tab === 'roles' && isOwner && (
        <section className="grid gap-8 lg:grid-cols-[360px_1fr] animate-fade-in max-w-5xl">
          <form
            onSubmit={(e) => void assignRole(e)}
            className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-4"
          >
            <h3 className="font-serif font-bold text-lg text-ink">Assign Staff Role</h3>
            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Admin User
              </label>
              <select
                value={roleAssignment.user_id}
                onChange={(e) =>
                  setRoleAssignment({ ...roleAssignment, user_id: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              >
                <option value="">Select an account...</option>
                {adminUsers.map((u) => (
                  <option key={u.user_id} value={u.user_id}>
                    {u.email} ({u.full_name || 'Admin'})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-ink uppercase tracking-wider mb-1">
                Role Permission
              </label>
              <select
                value={roleAssignment.role}
                onChange={(e) => setRoleAssignment({ ...roleAssignment, role: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl bg-[#FAF7F0] border border-[#E8E2D9]"
              >
                <option value="catalog_manager">Catalog Manager</option>
                <option value="media_manager">Media Manager</option>
                <option value="order_manager">Order Manager</option>
                <option value="admin">Administrator</option>
              </select>
            </div>

            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
            >
              Grant Role
            </button>
          </form>

          <div className="bg-white rounded-2xl border border-[#E8E2D9] p-6 shadow-2xs space-y-3">
            <h3 className="font-serif font-bold text-lg text-ink">Active Team Members</h3>
            <div className="divide-y divide-[#E8E2D9]">
              {adminUsers.map((u) => (
                <div key={u.user_id} className="py-3 flex items-center justify-between">
                  <div>
                    <span className="font-semibold text-xs text-ink">{u.email}</span>
                    <span className="text-[11px] text-clay font-medium ml-2">
                      {u.role?.toUpperCase()}
                    </span>
                  </div>
                  {u.role !== 'owner' && (
                    <button
                      onClick={() => void removeRole(u.user_id, u.role)}
                      className="text-xs text-rose-700 hover:underline"
                    >
                      Revoke
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </AdminLayout>
  );
}

function AdminMessage({
  title,
  body,
  link = false,
}: {
  title: string;
  body: string;
  link?: boolean;
}) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20 text-center">
      <h1 className="font-serif text-3xl font-bold text-ink">{title}</h1>
      <p className="mt-3 text-sm text-ink-muted">{body}</p>
      {link && (
        <Link
          to="/account"
          className="mt-5 inline-block px-4 py-2 rounded-xl bg-clay text-white text-xs font-semibold hover:bg-[#b56e57] transition shadow-xs"
        >
          Sign in to Little Loom
        </Link>
      )}
    </main>
  );
}
