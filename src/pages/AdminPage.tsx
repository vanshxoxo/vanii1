import { useCallback, useEffect, useMemo, useState, type ChangeEvent, type DragEvent, type FormEvent } from 'react';
import { Link } from 'react-router-dom';
import { supabase, isSupabaseConfigured, publicMediaUrl } from '../lib/supabase';
import Button from '../components/Button';
import AdminContentPage from './AdminContentPage';
import { formatINR } from '../data';
import { ageNavigation } from '../data/storeNavigation';

type Tab = 'overview' | 'products' | 'categories' | 'media' | 'homepage' | 'collections' | 'content' | 'customers' | 'roles' | 'orders' | 'settings';
type Status = 'loading' | 'signed-out' | 'denied' | 'ready' | 'unconfigured';
type ProductForm = { id?: string; name: string; slug: string; description: string; material: string; fabric_composition: string; care_instructions: string; size_measurements: string; price: string; compare_at_price: string; status: string; seo_title: string; seo_description: string; tags: string[] };
const emptyProduct: ProductForm = { name: '', slug: '', description: '', material: '', fabric_composition: '', care_instructions: '', size_measurements: '', price: '', compare_at_price: '', status: 'draft', seo_title: '', seo_description: '', tags: [] };
const purposes = ['product', 'collection', 'category', 'homepage_hero', 'campaign', 'brand_story', 'lookbook', 'video'];

function fileSha256(file: File) {
  return file.arrayBuffer().then((buffer) => crypto.subtle.digest('SHA-256', buffer)).then((hash) =>
    [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join(''),
  );
}

function pendingProductApprovals(product: any): string[] {
  const missing: string[] = [];
  if (product.tags?.includes('owner-intake') || product.tags?.includes('owner-review-required') || product.tags?.includes('proposed-name') || /intake draft/i.test(product.name || '')) missing.push('owner-approved name');
  if (product.tags?.includes('proposed-price')) missing.push('verified price');
  if (product.price == null || Number(product.price) <= 0) missing.push('price');
  if (!product.description?.trim()) missing.push('description');
  if (!(product.material?.trim() || product.fabric_composition?.trim())) missing.push('fabric details');
  if (!product.care_instructions?.trim()) missing.push('care instructions');
  if (!product.size_measurements?.trim()) missing.push('garment measurements by size');
  const links = product.product_categories || [];
  const kinds = links.map((link: any) => (Array.isArray(link.categories) ? link.categories[0] : link.categories)?.kind);
  if (!kinds.includes('product')) missing.push('product category');
  if (!kinds.includes('age')) missing.push('age group');
  const variants = product.product_variants || [];
  const hasInventory = variants.length > 0 && variants.every((variant: any) => {
    const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
    return variant.is_active && String(variant.sku || '').trim() && String(variant.size || '').trim() && String(variant.colour || '').trim() && inventory && Number.isFinite(Number(inventory.quantity_on_hand));
  });
  if (!hasInventory) missing.push('verified sizes, colours, SKUs and stock');
  const assets = (product.product_media || []).map((link: any) => Array.isArray(link.media_assets) ? link.media_assets[0] : link.media_assets).filter(Boolean);
  if (!assets.some((asset: any) => asset.provider === 'imagekit' && asset.purpose === 'product' && asset.lifecycle_status === 'active')) missing.push('authorized ImageKit product photos');
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
  const [categoryForm, setCategoryForm] = useState<any>({ kind: 'product', name: '', slug: '', description: '', display_order: 0, is_active: true, image_asset_id: '' });
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [showProductPreview, setShowProductPreview] = useState(false);
  const [productForm, setProductForm] = useState<ProductForm>(emptyProduct);
  const [categoryIds, setCategoryIds] = useState<string[]>([]);
  const [variantForm, setVariantForm] = useState({ size: '', colour: '', colour_hex: '', sku: '', stock: '', price_override: '' });
  const [media, setMedia] = useState<any[]>([]);
  const [mediaSearch, setMediaSearch] = useState('');
  const [purpose, setPurpose] = useState('product');
  const [uploadState, setUploadState] = useState('');
  const [sections, setSections] = useState<any[]>([]);
  const [sectionForm, setSectionForm] = useState({ section_key: 'hero', section_type: 'hero', heading: '', body: '', cta_label: '', cta_href: '', desktop_asset_id: '', mobile_asset_id: '', is_published: false });
  const [collections, setCollections] = useState<any[]>([]);
  const [collectionForm, setCollectionForm] = useState<{ id?: string; name: string; slug: string; description: string; product_id: string; cover_asset_id: string; display_order: number; status: string }>({ name: '', slug: '', description: '', product_id: '', cover_asset_id: '', display_order: 0, status: 'draft' });
  const [settings, setSettings] = useState<Record<string, any>>({});

  const suggestedAgeLabels = useMemo(() => productForm.tags
    .filter((tag) => tag.startsWith('suggested-age-group:'))
    .map((tag) => tag.slice('suggested-age-group:'.length))
    .map((key) => ageNavigation.find((age) => age.key === key)?.label || key.replace(/-/g, ' ')), [productForm.tags]);
  const productPreviewImages = useMemo(() => gallery.flatMap((link) => {
    const asset = Array.isArray(link.media_assets) ? link.media_assets[0] : link.media_assets;
    if (!asset || asset.provider !== 'imagekit' || asset.purpose !== 'product' || asset.lifecycle_status !== 'active') return [];
    const url = publicMediaUrl(asset, 900);
    return url ? [{ url, alt: link.alt_text || productForm.name || 'Product photograph' }] : [];
  }), [gallery, productForm.name]);

  const report = (message: string) => { setNotice(message); setError(''); };
  const fail = (message: string) => { setError(message); setNotice(''); };

  const loadAdminData = useCallback(async () => {
    if (!supabase) return;
    const [p, c, m, h, cl, s, o, customerRows, roleRows, summary] = await Promise.all([
      supabase.from('products').select('*,product_variants(id,sku,size,colour,is_active,inventory(quantity_on_hand,quantity_reserved)),product_media(id,media_assets(id,provider,purpose,lifecycle_status)),product_categories(categories(id,kind))').order('updated_at', { ascending: false }),
      supabase.from('categories').select('*').order('display_order'),
      supabase.from('media_assets').select('*').order('created_at', { ascending: false }),
      supabase.from('homepage_sections').select('*').order('display_order'),
      supabase.from('collections').select('*').order('updated_at', { ascending: false }),
      supabase.from('store_settings').select('*'),
      supabase.from('orders').select('id,order_number,status,total,currency,payment_method,placed_at,order_items(product_name_snapshot,size_snapshot,colour_snapshot,quantity),payments(status,provider,refunds(status,amount)),shipments(status,awb_code,courier_name,tracking_url)').order('placed_at', { ascending: false }).limit(100),
      supabase.from('customers').select('id,email,full_name,phone,created_at').order('created_at', { ascending: false }).limit(500),
      supabase.from('admin_users').select('user_id,email,full_name,role').order('email'),
      supabase.rpc('admin_dashboard_summary'),
    ]);
    if (p.data) setProducts(p.data); if (c.data) setCategories(c.data); if (m.data) setMedia(m.data); if (h.data) setSections(h.data); if (cl.data) setCollections(cl.data); if (o.data) setOrders(o.data); if (customerRows.data) setCustomers(customerRows.data); if (roleRows.data) setAdminUsers(roleRows.data); if (summary.data) setDashboard(summary.data);
    if (s.data) setSettings(Object.fromEntries(s.data.map((row: any) => [row.setting_key, row.setting_value])));
  }, []);

  useEffect(() => {
    if (!supabase) return;
    let alive = true;
    async function checkAccess() {
      const { data: { user } } = await supabase!.auth.getUser();
      if (!alive) return;
      if (!user) { setAccess('signed-out'); return; }
      const { data: roles, error: roleError } = await supabase!.from('admin_roles').select('role').eq('user_id', user.id);
      if (!alive) return;
      if (roleError) { fail(roleError.message); setAccess('denied'); return; }
      if (!(roles || []).some((row: any) => ['owner', 'admin', 'catalog_manager', 'media_manager', 'order_manager'].includes(row.role))) { setAccess('denied'); return; }
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
    return () => { alive = false; };
  }, [loadAdminData]);

  async function selectProduct(id: string) {
    setSelectedProduct(id);
    setShowProductPreview(false);
    if (!id || !supabase) { setProductForm(emptyProduct); setVariants([]); setCategoryIds([]); setGallery([]); return; }
    const [product, variantRows, categoryRows, productGallery] = await Promise.all([
      supabase.from('products').select('*').eq('id', id).single(),
      supabase.from('product_variants').select('*,inventory(quantity_on_hand,quantity_reserved)').eq('product_id', id).order('size'),
      supabase.from('product_categories').select('category_id').eq('product_id', id),
      supabase.from('product_media').select('id,asset_id,display_order,is_primary,alt_text,view_label,media_assets(id,provider,purpose,lifecycle_status,delivery_url,external_url,resource_type,format,original_filename,width,height,file_size_bytes)').eq('product_id', id).order('display_order'),
    ]);
    if (product.error) { fail(product.error.message); return; }
    const p = product.data;
    setProductForm({ id, name: p.name, slug: p.slug, description: p.description || '', material: p.material || '', fabric_composition: p.fabric_composition || '', care_instructions: p.care_instructions || '', size_measurements: p.size_measurements || '', price: p.price == null ? '' : String(p.price), compare_at_price: p.compare_at_price == null ? '' : String(p.compare_at_price), status: p.status, seo_title: p.seo_title || '', seo_description: p.seo_description || '', tags: p.tags || [] });
    setVariants((variantRows.data || []).map((row: any) => ({ ...row, stock: row.inventory?.quantity_on_hand ?? 0 })));
    setCategoryIds((categoryRows.data || []).map((row: any) => row.category_id));
    setGallery(productGallery.data || []);
  }

  async function saveProduct(event: FormEvent) {
    event.preventDefault(); if (!supabase) return;
    setError(''); setNotice('');
    if (productForm.compare_at_price.trim() && (!productForm.price.trim() || Number(productForm.compare_at_price) < Number(productForm.price))) {
      fail('A compare-at price needs a verified base price and must be at least as high.'); return;
    }
    if (productForm.status === 'published') {
      const hasProductCategory = categoryIds.some((id) => categories.some((category) => category.id === id && category.kind === 'product'));
      const hasAgeCategory = categoryIds.some((id) => categories.some((category) => category.id === id && category.kind === 'age'));
      const hasCompleteVariants = variants.length > 0 && variants.every((variant) => {
        const inventory = Array.isArray(variant.inventory) ? variant.inventory[0] : variant.inventory;
        return String(variant.sku || '').trim() && String(variant.size || '').trim() && String(variant.colour || '').trim() && inventory && Number.isFinite(Number(inventory.quantity_on_hand));
      });
      const hasAuthorizedProductImage = gallery.some((link) => {
        const asset = Array.isArray(link.media_assets) ? link.media_assets[0] : link.media_assets;
        return asset?.provider === 'imagekit' && asset?.purpose === 'product' && asset?.lifecycle_status === 'active';
      });
      const requiresOwnerReview = ['owner-intake', 'owner-review-required', 'proposed-name', 'proposed-price'].some((tag) => productForm.tags.includes(tag));
      if (requiresOwnerReview || /intake draft/i.test(productForm.name) || !productForm.name.trim() || !productForm.description.trim() || !(productForm.material.trim() || productForm.fabric_composition.trim()) || !productForm.care_instructions.trim() || !productForm.size_measurements.trim() || !productForm.price.trim() || Number(productForm.price) <= 0 || !hasProductCategory || !hasAgeCategory || !hasCompleteVariants || !hasAuthorizedProductImage) {
        fail('Keep this product as a draft until its name, price, description, fabric, care, measurements, product and age categories, size and colour variants, SKUs, stock, and authorized ImageKit product photos are verified.'); return;
      }
    }
    const publishAfterSave = productForm.status === 'published';
    const payload = { name: productForm.name.trim(), slug: productForm.slug.trim(), description: productForm.description, material: productForm.material, fabric_composition: productForm.fabric_composition, care_instructions: productForm.care_instructions, size_measurements: productForm.size_measurements, price: productForm.price.trim() ? Number(productForm.price) : null, compare_at_price: productForm.compare_at_price ? Number(productForm.compare_at_price) : null, status: publishAfterSave ? 'draft' : productForm.status, seo_title: productForm.seo_title || null, seo_description: productForm.seo_description || null, tags: productForm.tags, published_at: null };
    const result = productForm.id ? await supabase.from('products').update(payload).eq('id', productForm.id).select('id').single() : await supabase.from('products').insert(payload).select('id').single();
    if (result.error) { fail(result.error.message); return; }
    const id = result.data.id;
    const removed = await supabase.from('product_categories').delete().eq('product_id', id);
    if (removed.error) { fail(removed.error.message); return; }
    if (categoryIds.length) {
      const linked = await supabase.from('product_categories').insert(categoryIds.map((category_id) => ({ product_id: id, category_id })));
      if (linked.error) { fail(linked.error.message); return; }
    }
    if (publishAfterSave) {
      const published = await supabase.from('products').update({ status: 'published', published_at: new Date().toISOString() }).eq('id', id).select('id').single();
      if (published.error) { fail(published.error.message); return; }
    }
    setSelectedProduct(id); setProductForm({ ...productForm, id });
    report('Product saved.'); await loadAdminData();
  }

  async function addVariant(event: FormEvent) {
    event.preventDefault(); if (!supabase || !selectedProduct) return;
    const { data, error: variantError } = await supabase.from('product_variants').insert({ product_id: selectedProduct, size: variantForm.size.trim(), colour: variantForm.colour.trim(), colour_hex: variantForm.colour_hex || null, sku: variantForm.sku.trim(), price_override: variantForm.price_override ? Number(variantForm.price_override) : null }).select('id').single();
    if (variantError) { fail(variantError.message); return; }
    const stock = await supabase.rpc('set_variant_stock', { p_variant_id: data.id, p_quantity: Number(variantForm.stock) });
    if (stock.error) { fail(stock.error.message); return; }
    setVariantForm({ size: '', colour: '', colour_hex: '', sku: '', stock: '', price_override: '' });
    report('Variant and opening stock saved.'); await selectProduct(selectedProduct);
  }

  async function saveVariant(variant: any) {
    if (!supabase) return;
    const { error: updateError } = await supabase.from('product_variants').update({ size: variant.size, colour: variant.colour, colour_hex: variant.colour_hex || null, sku: variant.sku, price_override: variant.price_override === '' ? null : Number(variant.price_override), is_active: variant.is_active }).eq('id', variant.id);
    if (updateError) { fail(updateError.message); return; }
    const { error: stockError } = await supabase.rpc('set_variant_stock', { p_variant_id: variant.id, p_quantity: Number(variant.stock) });
    if (stockError) { fail(stockError.message); return; }
    report(`Saved ${variant.sku}.`); await selectProduct(selectedProduct);
  }

  async function attachAsset() {
    if (!supabase || !selectedProduct || !galleryAssetId) return;
    const { error: insertError } = await supabase.from('product_media').insert({ product_id: selectedProduct, asset_id: galleryAssetId, display_order: gallery.length, is_primary: gallery.length === 0, alt_text: '', view_label: 'additional' });
    if (insertError) { fail(insertError.message); return; }
    setGalleryAssetId(''); report('Existing asset added to this product gallery.'); await selectProduct(selectedProduct);
  }

  async function saveGallery() {
    if (!supabase) return;
    if (gallery.length) {
      const clearPrimary = await supabase.from('product_media').update({ is_primary: false }).eq('product_id', selectedProduct);
      if (clearPrimary.error) { fail(clearPrimary.error.message); return; }
    }
    for (const [index, item] of gallery.entries()) {
      const { error: saveError } = await supabase.from('product_media').update({ display_order: index, is_primary: index === 0, alt_text: item.alt_text, view_label: item.view_label }).eq('id', item.id);
      if (saveError) { fail(saveError.message); return; }
    }
    report('Gallery order, primary image, and alt text saved.'); await selectProduct(selectedProduct);
  }

  async function removeGalleryLink(id: string) {
    if (!supabase) return;
    const { error: removeError } = await supabase.from('product_media').delete().eq('id', id);
    if (removeError) { fail(removeError.message); return; }
    report('Gallery link removed. The media asset was kept in the library.'); await selectProduct(selectedProduct);
  }

  async function replaceGalleryAsset(id: string, assetId: string) {
    if (!supabase || !assetId) return;
    const { error: replaceError } = await supabase.from('product_media').update({ asset_id: assetId }).eq('id', id);
    if (replaceError) { fail(replaceError.message); return; }
    report('Gallery image replaced. The previous media file remains in the shared library.');
    await selectProduct(selectedProduct);
  }

  async function saveCategory(event: FormEvent) {
    event.preventDefault(); if (!supabase) return;
    const payload = { ...categoryForm, image_asset_id: categoryForm.image_asset_id || null };
    const result = categoryForm.id ? await supabase.from('categories').update(payload).eq('id', categoryForm.id) : await supabase.from('categories').insert(payload);
    if (result.error) { fail(result.error.message); return; }
    report('Category saved.'); setCategoryForm({ kind: 'product', name: '', slug: '', description: '', display_order: 0, is_active: true, image_asset_id: '' }); await loadAdminData();
  }

  async function assignRole(event: FormEvent) {
    event.preventDefault();
    if (!supabase || !adminRoles.includes('owner') || !roleAssignment.user_id) return;
    const { error: assignError } = await supabase.from('admin_roles').insert(roleAssignment);
    if (assignError) { fail(assignError.message); return; }
    report('Role assigned.'); await loadAdminData();
  }

  async function removeRole(userId: string, role: string) {
    if (!supabase || !adminRoles.includes('owner') || role === 'owner') return;
    const { error: removeError } = await supabase.from('admin_roles').delete().eq('user_id', userId).eq('role', role);
    if (removeError) { fail(removeError.message); return; }
    report('Role removed.'); await loadAdminData();
  }

  const onFiles = async (files: FileList | File[]) => {
    if (!supabase) return;
    const list = Array.from(files);
    for (let i = 0; i < list.length; i++) {
      const file = list[i]; setUploadState(`Checking ${file.name} (${i + 1}/${list.length})…`);
      const isVideo = file.type.startsWith('video/');
      if (!/^(image\/(jpeg|png|webp|avif|gif)|video\/(mp4|webm))$/.test(file.type) || file.size > (isVideo ? 100 : 20) * 1024 * 1024) { fail(`${file.name}: use JPG, PNG, WebP, AVIF, GIF up to 20 MB, or MP4/WebM up to 100 MB.`); continue; }
      try {
        const checksum = await fileSha256(file);
        const { data: duplicate, error: duplicateError } = await supabase.from('media_assets').select('*').eq('checksum_sha256', checksum).maybeSingle();
        if (duplicateError) throw duplicateError;
        let asset = duplicate;
        if (!asset) {
          const { data: sessionData } = await supabase.auth.getSession();
          const accessToken = sessionData.session?.access_token;
          if (!accessToken) throw new Error('Your administrator session expired. Sign in again.');
          const authorization = await fetch('/api/imagekit-auth', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ purpose, mime_type: file.type, file_size_bytes: file.size }) });
          const auth = await authorization.json();
          if (!authorization.ok) throw new Error(auth.error || 'ImageKit upload could not be authorized.');
          setUploadState(`Uploading ${file.name} to ImageKit (${i + 1}/${list.length})…`);
          const extension = file.name.includes('.') ? file.name.split('.').pop()!.toLowerCase().replace(/[^a-z0-9]/g, '') : 'bin';
          const folder = purpose === 'product' ? '/little-loom/products' : purpose === 'category' ? '/little-loom/categories' : purpose === 'collection' ? '/little-loom/collections' : purpose === 'video' ? '/little-loom/videos' : '/little-loom/content';
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
          const response = await fetch('https://upload.imagekit.io/api/v1/files/upload', { method: 'POST', body: form });
          const uploaded = await response.json();
          if (!response.ok) {
            const { data: raced } = await supabase.from('media_assets').select('*').eq('checksum_sha256', checksum).maybeSingle();
            if (!raced) throw new Error(uploaded.message || 'ImageKit upload failed.');
            asset = raced;
          } else {
            const registered = await fetch('/api/imagekit-register', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ file_id: uploaded.fileId, checksum, filename: file.name, mime_type: file.type, purpose }) });
            const registration = await registered.json();
            if (!registered.ok || !registration.asset) throw new Error(registration.error || 'ImageKit uploaded the file but Supabase could not register its metadata.');
            asset = registration.asset;
          }
        }
        if (purpose === 'product' && selectedProduct) {
          const { data: existing } = await supabase.from('product_media').select('display_order').eq('product_id', selectedProduct).order('display_order', { ascending: false }).limit(1);
          const { error: linkError } = await supabase.from('product_media').upsert({ product_id: selectedProduct, asset_id: asset.id, display_order: (existing?.[0]?.display_order ?? -1) + 1, is_primary: !existing?.length, alt_text: file.name.replace(/\.[^.]+$/, ''), view_label: 'additional' }, { onConflict: 'product_id,asset_id,variant_id' });
          if (linkError) throw linkError;
        }
        report(duplicate ? `Reused existing asset for ${file.name}.` : `Uploaded ${file.name}.`);
      } catch (cause) { fail(cause instanceof Error ? cause.message : `Upload failed for ${file.name}.`); }
    }
    setUploadState(''); await loadAdminData();
    if (selectedProduct) await selectProduct(selectedProduct);
  };

  function handleDrop(event: DragEvent<HTMLDivElement>) { event.preventDefault(); void onFiles(event.dataTransfer.files); }
  function handleFileInput(event: ChangeEvent<HTMLInputElement>) { if (event.target.files) void onFiles(event.target.files); event.target.value = ''; }

  async function deleteMediaAsset(asset: any) {
    if (!supabase || !window.confirm(`Permanently delete ${asset.original_filename} from the media provider? Assets still used by products, banners or CMS cannot be deleted.`)) return;
    const { data: sessionData } = await supabase.auth.getSession();
    const accessToken = sessionData.session?.access_token;
    if (!accessToken) { fail('Your administrator session expired. Sign in again.'); return; }
    const response = await fetch('/api/imagekit-delete', { method: 'POST', headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' }, body: JSON.stringify({ asset_id: asset.id }) });
    const data = await response.json();
    if (!response.ok || data?.error) { fail(data?.error || 'Media deletion failed.'); return; }
    report('Media asset deleted from the provider and library.'); await loadAdminData();
  }

  async function saveSection(event: FormEvent) {
    event.preventDefault(); if (!supabase) return;
    const payload = { ...sectionForm, desktop_asset_id: sectionForm.desktop_asset_id || null, mobile_asset_id: sectionForm.mobile_asset_id || null, updated_by: (await supabase.auth.getUser()).data.user?.id };
    const { error: saveError } = await supabase.from('homepage_sections').upsert(payload, { onConflict: 'section_key' });
    if (saveError) { fail(saveError.message); return; }
    report('Homepage section saved.'); await loadAdminData();
  }

  async function createCollection(event: FormEvent) {
    event.preventDefault(); if (!supabase) return;
    const payload = { name: collectionForm.name.trim(), slug: collectionForm.slug.trim(), description: collectionForm.description, cover_asset_id: collectionForm.cover_asset_id || null, display_order: collectionForm.display_order, status: collectionForm.status, published_at: collectionForm.status === 'published' ? new Date().toISOString() : null };
    const { data, error: createError } = collectionForm.id
      ? await supabase.from('collections').update(payload).eq('id', collectionForm.id).select('id').single()
      : await supabase.from('collections').insert(payload).select('id').single();
    if (createError) { fail(createError.message); return; }
    if (collectionForm.product_id) {
      const link = await supabase.from('collection_products').upsert({ collection_id: data.id, product_id: collectionForm.product_id, display_order: 0 }, { onConflict: 'collection_id,product_id' });
      if (link.error) { fail(link.error.message); return; }
    }
    setCollectionForm({ name: '', slug: '', description: '', product_id: '', cover_asset_id: '', display_order: collections.length, status: 'draft' }); report('Collection saved.'); await loadAdminData();
  }

  async function updateSetting(key: string, value: any) {
    if (!supabase) return;
    const { error: saveError } = await supabase.from('store_settings').upsert({ setting_key: key, setting_value: value, is_public: true, updated_by: (await supabase.auth.getUser()).data.user?.id }, { onConflict: 'setting_key' });
    if (saveError) { fail(saveError.message); return; }
    setSettings((current) => ({ ...current, [key]: value })); report('Store setting saved.');
  }

  async function updateOrderStatus(orderId: string, status: string) {
    if (!supabase) return;
    const { error: updateError } = await supabase.from('orders').update({ status }).eq('id', orderId);
    if (updateError) { fail(updateError.message); return; }
    report('Order status updated.'); await loadAdminData();
  }

  async function recordCodCollection(orderId: string) {
    if (!supabase) return;
    const { error: collectionError } = await supabase.rpc('complete_cod_collection', { p_order_id: orderId });
    if (collectionError) { fail(collectionError.message); return; }
    report('COD collection recorded and inventory settled.'); await loadAdminData();
  }

  async function runShipmentAction(orderId: string, action: 'create' | 'track') {
    if (!supabase) return;
    const { data, error: shippingError } = await supabase.functions.invoke('shiprocket', { body: { order_id: orderId, action } });
    if (shippingError) { fail(shippingError.message); return; }
    if (data?.error) { fail(data.error); return; }
    report(action === 'create' ? 'Shiprocket shipment created.' : `Tracking updated: ${data.raw_status || data.status}.`);
    await loadAdminData();
  }

  async function refundOrder(orderId: string, orderNumber: number, total: number) {
    if (!supabase || !window.confirm(`Request a full refund of ${formatINR(total)} for order #${orderNumber}?`)) return;
    const { data, error: refundError } = await supabase.functions.invoke('refund-payment', { body: { order_id: orderId, amount_paise: Math.round(total * 100), reason: 'Full order refund', idempotency_key: crypto.randomUUID() } });
    if (refundError || data?.error) { fail(refundError?.message || data.error); return; }
    report(`Refund ${data.status || 'submitted'}; the order will update after Razorpay confirms it.`); await loadAdminData();
  }

  const filteredMedia = useMemo(() => media.filter((asset) => `${asset.original_filename} ${asset.purpose} ${asset.mime_type}`.toLowerCase().includes(mediaSearch.toLowerCase())), [media, mediaSearch]);
  const allAccess = adminRoles.some((role) => role === 'owner' || role === 'admin');
  const isOwner = adminRoles.includes('owner');
  const allowedTabs: Tab[] = allAccess ? ['overview','products','categories','media','homepage','collections','content','customers','orders','settings', ...(isOwner ? ['roles' as Tab] : [])] : [
    ...(adminRoles.includes('catalog_manager') ? ['products','categories','homepage','collections','content'] as Tab[] : []),
    ...(adminRoles.includes('media_manager') ? ['media'] as Tab[] : []),
    ...(adminRoles.includes('order_manager') ? ['orders','customers'] as Tab[] : []),
  ];

  if (access === 'unconfigured') return <AdminMessage title="Admin setup needed" body="Add your Supabase project URL and publishable key in .env.local, then apply the database migration." />;
  if (access === 'loading') return <AdminMessage title="Checking access" body="Verifying your administrator session…" />;
  if (access === 'signed-out') return <AdminMessage title="Sign in required" body="Sign in with an account granted an admin role to manage Little Loom." link />;
  if (access === 'denied') return <AdminMessage title="Admin access required" body="This account does not have a Little Loom admin role. Grant one from the Supabase SQL editor." />;

  const tabButton = (id: Tab, label: string) => <button key={id} onClick={() => setTab(id)} className={`border-b-2 px-3 py-3 text-sm whitespace-nowrap ${tab === id ? 'border-ink text-ink font-medium' : 'border-transparent text-ink-soft'}`}>{label}</button>;

  return (
    <main className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs uppercase tracking-[0.18em] text-ink-light">Little Loom</p><h1 className="mt-1 font-serif text-3xl">Store administration</h1></div><Link className="text-sm underline" to="/">View storefront</Link></div>
      <nav className="mt-6 flex gap-2 overflow-x-auto border-b border-ink/10">{allowedTabs.map((item) => tabButton(item, ({ overview: 'Overview', products: 'Products & variants', categories: 'Categories', media: 'Media library', homepage: 'Homepage CMS', collections: 'Collections', content: 'Policies, FAQs & banners', customers: 'Customers', roles: 'Team roles', orders: 'Orders', settings: 'Store settings' } as Record<Tab,string>)[item]))}</nav>
      {(error || notice) && <p role={error ? 'alert' : 'status'} className={`mt-4 p-3 text-sm ${error ? 'bg-red-50 text-red-800' : 'bg-green-50 text-green-900'}`}>{error || notice}</p>}

      {tab === 'overview' && <section className="mt-6 space-y-8">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{[
      ['Products', dashboard?.total_products], ['Published', dashboard?.published_products], ['Drafts needing review', dashboard?.draft_products], ['Active categories', dashboard?.active_categories],
          ['Available units', dashboard?.available_units], ['Out of stock variants', dashboard?.out_of_stock_variants], ['Orders', dashboard?.total_orders], ['Recognized revenue', dashboard?.recognized_revenue == null ? null : formatINR(Number(dashboard.recognized_revenue))],
        ].map(([label, value]) => <article key={String(label)} className="border border-ink/10 p-4"><p className="text-xs uppercase tracking-wider text-ink-light">{label}</p><p className="mt-2 font-serif text-2xl">{value == null ? '—' : value}</p></article>)}</div>
        <div className="grid gap-8 lg:grid-cols-2"><div><h2 className="font-serif text-xl">Categories</h2><ul className="mt-3 divide-y divide-ink/10">{categories.map((item) => <li key={item.id} className="flex justify-between py-2 text-sm"><span>{item.name}</span><span className="text-ink-light">{products.filter((product) => (product.product_categories || []).some((link: any) => (Array.isArray(link.categories) ? link.categories[0] : link.categories)?.id === item.id)).length} products</span></li>)}</ul></div><div><h2 className="font-serif text-xl">Recent activity</h2><ul className="mt-3 divide-y divide-ink/10">{(dashboard?.recent_activity || []).map((item: any, index: number) => <li key={`${item.record_id}-${index}`} className="py-2 text-xs"><span className="font-medium">{item.operation}</span> · {item.table_name} · {new Date(item.created_at).toLocaleString()}</li>)}</ul>{!dashboard?.recent_activity?.length && <p className="mt-2 text-sm text-ink-soft">No audit activity is recorded yet.</p>}</div></div>
      </section>}

      {tab === 'customers' && <section className="mt-6"><h2 className="font-serif text-xl">Customer accounts</h2><p className="mt-1 text-xs text-ink-light">Private contact details are shown only to authorized order managers and administrators.</p><div className="mt-4 overflow-x-auto"><table className="w-full min-w-[640px] border-collapse text-left text-sm"><thead><tr className="border-b border-ink/15 text-xs uppercase tracking-wider text-ink-light"><th className="py-3 pr-3">Customer</th><th className="py-3 pr-3">Email</th><th className="py-3 pr-3">Phone</th><th className="py-3">Joined</th></tr></thead><tbody>{customers.map((customer) => <tr key={customer.id} className="border-b border-ink/10"><td className="py-3 pr-3">{customer.full_name || 'Name not provided'}</td><td className="py-3 pr-3">{customer.email || 'Email unavailable'}</td><td className="py-3 pr-3">{customer.phone || '—'}</td><td className="py-3">{new Date(customer.created_at).toLocaleDateString()}</td></tr>)}</tbody></table></div>{!customers.length && <p className="mt-4 text-sm text-ink-soft">No customer profiles are visible to this account.</p>}</section>}

      {tab === 'roles' && isOwner && <section className="mt-6 grid gap-8 lg:grid-cols-[360px_1fr]"><form onSubmit={(e) => void assignRole(e)} className="space-y-4"><h2 className="font-serif text-xl">Assign team role</h2><p className="text-xs leading-5 text-ink-soft">Select an existing registered customer account. Only the owner can change team roles. Owner access must be provisioned securely by the database owner.</p><label className="block text-sm">Account<select required value={roleAssignment.user_id} onChange={(e) => setRoleAssignment({ ...roleAssignment, user_id: e.target.value })} className="admin-input"><option value="">Choose account…</option>{customers.map((item) => <option key={item.id} value={item.id}>{item.email || item.full_name || item.id}</option>)}</select></label><label className="block text-sm">Role<select value={roleAssignment.role} onChange={(e) => setRoleAssignment({ ...roleAssignment, role: e.target.value })} className="admin-input">{['admin','catalog_manager','media_manager','order_manager'].map((role) => <option key={role} value={role}>{role.replace('_',' ')}</option>)}</select></label><Button type="submit">Assign role</Button></form><div><h2 className="font-serif text-xl">Current team</h2><ul className="mt-3 divide-y divide-ink/10">{adminUsers.map((item, index) => <li key={`${item.user_id}-${item.role}-${index}`} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><span>{item.email || item.full_name || item.user_id} <span className="ml-2 text-xs text-ink-light">{item.role.replace('_',' ')}</span></span><button type="button" disabled={item.role === 'owner'} onClick={() => void removeRole(item.user_id, item.role)} className="text-xs underline disabled:opacity-40">{item.role === 'owner' ? 'Owner protected' : 'Remove role'}</button></li>)}</ul></div></section>}

      {tab === 'products' && <section className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]">
        <aside><p className="text-xs leading-5 text-ink-soft">Draft products stay unpublished until their verified product details, variants, stock, and authorized product photographs are complete.</p><label className="mt-3 block text-xs uppercase tracking-wider text-ink-soft">Products<select value={selectedProduct} onChange={(e) => void selectProduct(e.target.value)} className="mt-2 w-full border border-ink/15 bg-transparent p-3"><option value="">Create a product</option>{products.map((product) => <option key={product.id} value={product.id}>{product.name} · {product.status}{product.tags?.includes('owner-intake') ? ' · draft' : ''}</option>)}</select></label><div className="mt-4 space-y-1">{products.map((product) => { const missing = pendingProductApprovals(product); return <button key={product.id} onClick={() => void selectProduct(product.id)} className="block w-full border-b border-ink/5 py-2 text-left hover:underline"><span className="block truncate text-sm">{product.name}{product.tags?.includes('owner-intake') && <span className="ml-2 text-[9px] uppercase tracking-wider text-amber-800">Needs confirmation</span>}</span><span className="text-[10px] text-ink-light">{product.status} · {missing.length ? `${missing.length} approvals needed` : 'ready for review'}</span></button>; })}</div><p className="mt-4 text-[10px] leading-4 text-ink-light">Before publication, enter the owner-approved name and price; verified fabric, garment measurements by size and care; confirmed product and age categories; size, colour, SKU and stock details; and authorized product photographs uploaded to ImageKit.</p></aside>
        <div className="space-y-8">
          <form onSubmit={(e) => void saveProduct(e)} className="grid gap-4 sm:grid-cols-2">
            {(productForm.tags.includes('owner-intake') || productForm.tags.includes('owner-review-required')) && <div className="sm:col-span-2 border border-amber-700/20 bg-amber-50 p-3"><p className="text-sm font-medium">Product draft · unpublished</p><p className="mt-1 text-xs leading-5">The product name, price, supplier, sizes, colours, stock and photographs require owner verification. Editorial images are not product photos. Suggested age groups: {suggestedAgeLabels.length ? suggestedAgeLabels.join(', ') : 'none'} (product sizing is not confirmed).</p><div className="mt-3 grid gap-2 sm:grid-cols-2"><label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={!productForm.tags.includes('proposed-name')} onChange={(e) => setProductForm({ ...productForm, tags: e.target.checked ? productForm.tags.filter((tag) => tag !== 'proposed-name') : [...new Set([...productForm.tags, 'proposed-name'])] })} />I verified the product name.</label><label className="flex items-start gap-2 text-xs"><input type="checkbox" checked={!productForm.tags.includes('proposed-price')} onChange={(e) => setProductForm({ ...productForm, tags: e.target.checked ? productForm.tags.filter((tag) => tag !== 'proposed-price') : [...new Set([...productForm.tags, 'proposed-price'])] })} />I verified the price.</label></div><label className="mt-3 flex items-start gap-2 text-xs"><input type="checkbox" checked={productForm.tags.includes('owner-intake') || productForm.tags.includes('owner-review-required')} onChange={(e) => setProductForm({ ...productForm, tags: e.target.checked ? [...new Set([...productForm.tags, 'owner-intake', 'owner-review-required'])] : productForm.tags.filter((tag) => !['owner-intake', 'owner-review-required', 'approval-required'].includes(tag)) })} />Keep this item marked as owner-review draft until its actual details and authorized product photo are complete.</label></div>}
            <label className="text-sm">{productForm.tags.includes('proposed-name') ? 'Product name' : 'Product name'}<input required value={productForm.name} onChange={(e) => setProductForm({ ...productForm, name: e.target.value })} className="admin-input" /></label>
            <label className="text-sm">Slug<input required value={productForm.slug} onChange={(e) => setProductForm({ ...productForm, slug: e.target.value })} className="admin-input" /></label>
            <label className="text-sm">Price (INR)<input type="number" min="0.01" step="0.01" value={productForm.price} onChange={(e) => setProductForm({ ...productForm, price: e.target.value })} className="admin-input" />{productForm.tags.includes('proposed-price') && <span className="mt-1 block text-[10px] text-amber-800">Confirm this price with the owner before publication.</span>}</label>
            <label className="text-sm">Compare-at price<input type="number" min="0" step="0.01" value={productForm.compare_at_price} onChange={(e) => setProductForm({ ...productForm, compare_at_price: e.target.value })} className="admin-input" /></label>
            <label className="text-sm">Status<select value={productForm.status} onChange={(e) => setProductForm({ ...productForm, status: e.target.value })} className="admin-input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label>
            <label className="text-sm">Material<input value={productForm.material} onChange={(e) => setProductForm({ ...productForm, material: e.target.value })} className="admin-input" /></label>
            <label className="text-sm sm:col-span-2">Fabric composition<input value={productForm.fabric_composition} onChange={(e) => setProductForm({ ...productForm, fabric_composition: e.target.value })} className="admin-input" /></label>
            <label className="text-sm sm:col-span-2">Description<textarea rows={4} value={productForm.description} onChange={(e) => setProductForm({ ...productForm, description: e.target.value })} className="admin-input" /></label>
            <label className="text-sm sm:col-span-2">Care instructions<textarea rows={2} value={productForm.care_instructions} onChange={(e) => setProductForm({ ...productForm, care_instructions: e.target.value })} className="admin-input" /></label>
            <label className="text-sm sm:col-span-2">Verified garment measurements by size<textarea rows={3} value={productForm.size_measurements} onChange={(e) => setProductForm({ ...productForm, size_measurements: e.target.value })} className="admin-input" placeholder="Enter measured garment points and units for each size; do not use estimates." /><span className="mt-1 block text-[10px] text-ink-light">This field is required before publication. Enter actual measured values for each offered size.</span></label>
            <label className="text-sm">SEO title<input value={productForm.seo_title} onChange={(e) => setProductForm({ ...productForm, seo_title: e.target.value })} className="admin-input" /></label>
            <label className="text-sm">SEO description<input value={productForm.seo_description} onChange={(e) => setProductForm({ ...productForm, seo_description: e.target.value })} className="admin-input" /></label>
            <fieldset className="sm:col-span-2"><legend className="text-sm">Categories and age groups</legend><div className="mt-2 flex flex-wrap gap-3">{categories.filter((category) => category.is_active).map((category) => <label key={category.id} className="flex items-center gap-2 text-sm"><input type="checkbox" checked={categoryIds.includes(category.id)} onChange={(e) => setCategoryIds(e.target.checked ? [...categoryIds, category.id] : categoryIds.filter((id) => id !== category.id))} />{category.name} <span className="text-xs text-ink-light">{category.kind}</span></label>)}</div></fieldset>
            <div className="sm:col-span-2 flex flex-wrap gap-3"><Button type="submit">{productForm.id ? 'Save product' : 'Create product'}</Button><button type="button" onClick={() => setShowProductPreview((value) => !value)} className="min-h-10 border border-ink/20 px-4 text-sm text-ink hover:bg-ink/5">{showProductPreview ? 'Hide product page preview' : 'Preview product page'}</button></div>
          </form>

          {showProductPreview && <section aria-label="Admin-only product page preview" className="overflow-hidden rounded-2xl border border-ink/15 bg-white">
            <div className="border-b border-ink/10 bg-[#f8f4f0] px-4 py-3"><p className="text-xs font-semibold uppercase tracking-[0.15em] text-ink">Admin-only product page preview</p><p className="mt-1 text-[11px] text-ink-light">Shows the current form values; it does not save, publish, or enable purchasing.</p></div>
            <div className="grid gap-0 md:grid-cols-2">
              <div className="grid grid-cols-2 gap-2 bg-cream p-3 sm:p-4">
                {productPreviewImages.length ? productPreviewImages.map((image, index) => <img key={`${image.url}-${index}`} src={image.url} alt={image.alt} className={`aspect-[4/5] w-full rounded-lg object-cover ${index === 0 ? 'col-span-2 max-h-[560px]' : ''}`} loading="lazy" />) : <div className="col-span-2 flex aspect-[4/5] items-center justify-center rounded-lg bg-[#f4eee8] p-6 text-center text-sm text-ink-light">No active ImageKit product photograph is linked yet.</div>}
              </div>
              <div className="flex flex-col justify-center p-5 sm:p-8">
                <p className="text-[10px] uppercase tracking-[0.18em] text-ink-light">{categories.filter((category) => categoryIds.includes(category.id) && category.kind === 'product').map((category) => category.name).join(' · ') || 'Category not selected'}</p>
                <h2 className="mt-3 font-serif text-2xl text-ink sm:text-3xl">{productForm.name || 'Product name'}</h2>
                {productForm.price && <p className="mt-3 text-lg font-medium">{formatINR(Number(productForm.price))}{productForm.tags.includes('proposed-price') && <span className="ml-2 text-xs font-normal text-amber-800">Needs confirmation</span>}</p>}
                {productForm.description.trim() && <p className="mt-4 text-sm leading-6 text-ink-soft">{productForm.description}</p>}
                {variants.length > 0 && <div className="mt-5"><p className="text-xs text-ink-light">Saved variant options</p><div className="mt-2 flex flex-wrap gap-2">{[...new Set(variants.filter((variant) => variant.is_active).map((variant) => variant.size))].map((size) => <span key={size} className="border border-ink/15 px-3 py-1.5 text-xs">{size}</span>)}</div><p className="mt-2 text-xs text-ink-soft">{[...new Set(variants.filter((variant) => variant.is_active).map((variant) => variant.colour))].join(' · ')}</p></div>}
                <p className="mt-6 border-t border-ink/10 pt-4 text-xs text-ink-light">No cart, payment or inventory claim is shown in this admin preview.</p>
              </div>
            </div>
          </section>}

          {selectedProduct && <section className="border-t border-ink/10 pt-6"><h2 className="font-serif text-xl">Sizes, colours and stock</h2><form onSubmit={(e) => void addVariant(e)} className="mt-4 grid gap-3 sm:grid-cols-3">
            <label className="text-xs">Size<input required value={variantForm.size} onChange={(e) => setVariantForm({ ...variantForm, size: e.target.value })} className="admin-input" placeholder="2-3Y" /></label>
            <label className="text-xs">Colour<input required value={variantForm.colour} onChange={(e) => setVariantForm({ ...variantForm, colour: e.target.value })} className="admin-input" /></label>
            <label className="text-xs">Colour swatch (optional)<input value={variantForm.colour_hex} onChange={(e) => setVariantForm({ ...variantForm, colour_hex: e.target.value })} className="admin-input" placeholder="#RRGGBB" /></label>
            <label className="text-xs">SKU<input required value={variantForm.sku} onChange={(e) => setVariantForm({ ...variantForm, sku: e.target.value })} className="admin-input" /></label>
            <label className="text-xs">Opening stock<input required type="number" min="0" step="1" value={variantForm.stock} onChange={(e) => setVariantForm({ ...variantForm, stock: e.target.value })} className="admin-input" /></label>
            <label className="text-xs">Variant price override<input type="number" min="0" step="0.01" value={variantForm.price_override} onChange={(e) => setVariantForm({ ...variantForm, price_override: e.target.value })} className="admin-input" /></label>
            <div className="sm:col-span-3"><Button type="submit" size="sm">Add variant</Button></div>
          </form>
          <div className="mt-4 space-y-3">{variants.map((variant) => <VariantEditor key={variant.id} variant={variant} onChange={(next) => setVariants((rows) => rows.map((row) => row.id === next.id ? next : row))} onSave={() => void saveVariant(variant)} />)}</div>
          <div className="mt-8 border-t border-ink/10 pt-6"><div className="flex flex-wrap items-end justify-between gap-3"><div><h2 className="font-serif text-xl">Product gallery</h2><p className="mt-1 text-xs text-ink-light">Images are linked from the shared library; removing a link keeps the file.</p></div><div className="flex gap-2"><select value={galleryAssetId} onChange={(e) => setGalleryAssetId(e.target.value)} className="border border-ink/15 bg-transparent p-2 text-xs"><option value="">Reuse a library asset…</option>{media.map((asset) => <option key={asset.id} value={asset.id}>{asset.original_filename} · {asset.purpose}</option>)}</select><Button size="sm" onClick={() => void attachAsset()}>Attach</Button></div></div><div className="mt-4 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">{gallery.map((item, index) => { const asset = Array.isArray(item.media_assets) ? item.media_assets[0] : item.media_assets; return <GalleryEditor key={item.id} item={item} asset={asset} media={media.filter((row) => row.mime_type?.startsWith('image/') && !gallery.some((linked) => linked.id !== item.id && linked.asset_id === row.id))} index={index} count={gallery.length} onChange={(next) => setGallery((rows) => rows.map((row) => row.id === next.id ? next : row))} onReplace={(assetId) => void replaceGalleryAsset(item.id, assetId)} onMove={(direction) => setGallery((rows) => { const next = [...rows]; const target = index + direction; if (target < 0 || target >= next.length) return rows; [next[index], next[target]] = [next[target], next[index]]; return next; })} onRemove={() => void removeGalleryLink(item.id)} />; })}</div>{gallery.length > 0 && <Button className="mt-4" size="sm" onClick={() => void saveGallery()}>Save gallery order and alt text</Button>}</div>
          </section>}
        </div>
      </section>}

      {tab === 'categories' && <section className="mt-6 grid gap-8 lg:grid-cols-[1fr_1fr]"><form onSubmit={(e) => void saveCategory(e)} className="space-y-4"><h2 className="font-serif text-xl">{categoryForm.id ? 'Edit category' : 'Add category'}</h2><label className="block text-sm">Type<select value={categoryForm.kind} onChange={(e) => setCategoryForm({ ...categoryForm, kind: e.target.value })} className="admin-input"><option value="product">Product category</option><option value="age">Age group</option></select></label><label className="block text-sm">Name<input required value={categoryForm.name} onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })} className="admin-input" /></label><label className="block text-sm">Slug<input required value={categoryForm.slug} onChange={(e) => setCategoryForm({ ...categoryForm, slug: e.target.value })} className="admin-input" /></label><label className="block text-sm">Description<textarea value={categoryForm.description} onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })} className="admin-input" /></label><label className="block text-sm">Category image<select value={categoryForm.image_asset_id} onChange={(e) => setCategoryForm({ ...categoryForm, image_asset_id: e.target.value })} className="admin-input"><option value="">No image</option>{media.filter((asset) => asset.mime_type.startsWith('image/')).map((asset) => <option key={asset.id} value={asset.id}>{asset.original_filename} · {asset.purpose}</option>)}</select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={categoryForm.is_active} onChange={(e) => setCategoryForm({ ...categoryForm, is_active: e.target.checked })} />Active</label><Button type="submit">Save category</Button><button type="button" onClick={() => setCategoryForm({ kind: 'product', name: '', slug: '', description: '', display_order: categories.length, is_active: true, image_asset_id: '' })} className="ml-3 text-sm underline">New category</button></form><div><h2 className="font-serif text-xl">Configured categories</h2><ul className="mt-3 divide-y divide-ink/10">{categories.map((category) => <li key={category.id} className="flex items-center justify-between py-3 text-sm"><span>{category.name} <span className="text-xs text-ink-light">{category.kind} · {category.slug}</span></span><button onClick={() => setCategoryForm({ ...category, image_asset_id: category.image_asset_id || '' })} className="underline">Edit</button></li>)}</ul></div></section>}

      {tab === 'media' && <section className="mt-6">
        <div className="grid gap-4 sm:grid-cols-[1fr_220px]"><input value={mediaSearch} onChange={(e) => setMediaSearch(e.target.value)} placeholder="Search filename or purpose" className="admin-input" /><select value={purpose} onChange={(e) => setPurpose(e.target.value)} className="admin-input">{purposes.map((value) => <option key={value}>{value}</option>)}</select></div>
        {purpose === 'product' && <label className="mt-3 block max-w-sm text-xs">Attach uploaded assets to product<select value={selectedProduct} onChange={(e) => void selectProduct(e.target.value)} className="admin-input"><option value="">No product selected</option>{products.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>}
        <div onDragOver={(e) => e.preventDefault()} onDrop={handleDrop} className="mt-4 rounded border border-dashed border-ink/30 p-8 text-center"><p className="text-sm">Drop files here or choose files</p><p className="mt-1 text-xs text-ink-light">ImageKit originals stay external; images up to 20 MB and MP4/WebM videos up to 100 MB. SHA-256 checks reuse matching uploads.</p><label className="mt-4 inline-block cursor-pointer border border-ink px-4 py-2 text-sm">Choose multiple files<input type="file" multiple accept="image/jpeg,image/png,image/webp,image/avif,image/gif,video/mp4,video/webm" className="sr-only" onChange={handleFileInput} /></label>{uploadState && <p role="status" className="mt-3 text-xs">{uploadState}</p>}</div>
        <p className="mt-5 text-sm text-ink-soft">{filteredMedia.length} assets · {media.reduce((sum, row) => sum + Number(row.file_size_bytes || 0), 0).toLocaleString()} bytes total metadata</p>
        <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">{filteredMedia.map((asset) => <MediaCard key={asset.id} asset={asset} onCleanup={() => void deleteMediaAsset(asset)} onAltSave={async (alt) => { if (!supabase) return; const { error: saveError } = await supabase.from('media_assets').update({ alt_text: alt }).eq('id', asset.id); if (saveError) fail(saveError.message); else { report('Alt text saved.'); await loadAdminData(); } }} />)}</div>
      </section>}

      {tab === 'homepage' && <section className="mt-6 grid gap-8 lg:grid-cols-[280px_1fr]"><aside className="space-y-2">{sections.map((item) => <button key={item.id} onClick={() => setSectionForm({ section_key: item.section_key, section_type: item.section_type, heading: item.heading, body: item.body, cta_label: item.cta_label || '', cta_href: item.cta_href || '', desktop_asset_id: item.desktop_asset_id || '', mobile_asset_id: item.mobile_asset_id || '', is_published: item.is_published })} className="block w-full border-b border-ink/10 py-2 text-left text-sm">{item.section_key} · {item.is_published ? 'published' : 'draft'}</button>)}<button onClick={() => setSectionForm({ section_key: '', section_type: 'hero', heading: '', body: '', cta_label: '', cta_href: '', desktop_asset_id: '', mobile_asset_id: '', is_published: false })} className="text-sm underline">Add homepage section</button></aside><form onSubmit={(e) => void saveSection(e)} className="space-y-4"><h2 className="font-serif text-xl">Homepage content</h2><p className="text-xs leading-5 text-ink-soft">The built-in hero, campaign, brand story and fabric-detail photos stay visible until replaced by a published CMS section. To manage the fabric-detail section, use key <code>fabric-detail</code> and purpose <code>brand_story</code>; blank image fields keep the local default photo.</p><label className="block text-sm">Section key<input required value={sectionForm.section_key} onChange={(e) => setSectionForm({ ...sectionForm, section_key: e.target.value })} className="admin-input" /></label><label className="block text-sm">Purpose<select value={sectionForm.section_type} onChange={(e) => setSectionForm({ ...sectionForm, section_type: e.target.value })} className="admin-input">{['announcement','hero','featured_collections','new_arrivals','bestsellers','shop_the_look','brand_story','newsletter','campaign_banner'].map((v) => <option key={v}>{v}</option>)}</select></label><label className="block text-sm">Heading<input value={sectionForm.heading} onChange={(e) => setSectionForm({ ...sectionForm, heading: e.target.value })} className="admin-input" /></label><label className="block text-sm">Description<textarea rows={4} value={sectionForm.body} onChange={(e) => setSectionForm({ ...sectionForm, body: e.target.value })} className="admin-input" /></label><div className="grid gap-3 sm:grid-cols-2"><label className="text-sm">CTA label<input value={sectionForm.cta_label} onChange={(e) => setSectionForm({ ...sectionForm, cta_label: e.target.value })} className="admin-input" /></label><label className="text-sm">CTA destination<input value={sectionForm.cta_href} onChange={(e) => setSectionForm({ ...sectionForm, cta_href: e.target.value })} className="admin-input" /></label></div><label className="block text-sm">Desktop media asset<select value={sectionForm.desktop_asset_id} onChange={(e) => setSectionForm({ ...sectionForm, desktop_asset_id: e.target.value })} className="admin-input"><option value="">No asset selected</option>{media.map((asset) => <option key={asset.id} value={asset.id}>{asset.original_filename} · {asset.purpose}</option>)}</select></label><label className="block text-sm">Mobile media asset<select value={sectionForm.mobile_asset_id} onChange={(e) => setSectionForm({ ...sectionForm, mobile_asset_id: e.target.value })} className="admin-input"><option value="">Use desktop asset</option>{media.map((asset) => <option key={asset.id} value={asset.id}>{asset.original_filename} · {asset.purpose}</option>)}</select></label><label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={sectionForm.is_published} onChange={(e) => setSectionForm({ ...sectionForm, is_published: e.target.checked })} />Publish section</label><Button type="submit">Save section</Button></form></section>}

      {tab === 'collections' && <section className="mt-6 grid gap-8 lg:grid-cols-2"><form onSubmit={(e) => void createCollection(e)} className="space-y-4"><h2 className="font-serif text-xl">{collectionForm.id ? 'Edit collection' : 'Create collection'}</h2><label className="block text-sm">Name<input required value={collectionForm.name} onChange={(e) => setCollectionForm({ ...collectionForm, name: e.target.value })} className="admin-input" /></label><label className="block text-sm">Slug<input required value={collectionForm.slug} onChange={(e) => setCollectionForm({ ...collectionForm, slug: e.target.value })} className="admin-input" /></label><label className="block text-sm">Description<textarea value={collectionForm.description} onChange={(e) => setCollectionForm({ ...collectionForm, description: e.target.value })} className="admin-input" /></label><label className="block text-sm">Cover image<select value={collectionForm.cover_asset_id} onChange={(e) => setCollectionForm({ ...collectionForm, cover_asset_id: e.target.value })} className="admin-input"><option value="">No image selected</option>{media.filter((asset) => asset.mime_type?.startsWith('image/')).map((asset) => <option key={asset.id} value={asset.id}>{asset.original_filename}</option>)}</select></label><div className="grid gap-3 sm:grid-cols-2"><label className="block text-sm">Status<select value={collectionForm.status} onChange={(e) => setCollectionForm({ ...collectionForm, status: e.target.value })} className="admin-input"><option value="draft">Draft</option><option value="published">Published</option><option value="archived">Archived</option></select></label><label className="block text-sm">Homepage order<input type="number" min="0" value={collectionForm.display_order} onChange={(e) => setCollectionForm({ ...collectionForm, display_order: Number(e.target.value) })} className="admin-input" /></label></div><label className="block text-sm">Add or include product<select value={collectionForm.product_id} onChange={(e) => setCollectionForm({ ...collectionForm, product_id: e.target.value })} className="admin-input"><option value="">Keep current membership</option>{products.filter((item) => item.status === 'published').map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label><div className="flex flex-wrap gap-3"><Button type="submit">Save collection</Button>{collectionForm.id && <button type="button" onClick={() => setCollectionForm({ name: '', slug: '', description: '', product_id: '', cover_asset_id: '', display_order: collections.length, status: 'draft' })} className="text-sm underline">New collection</button>}</div></form><div><h2 className="font-serif text-xl">Collections</h2><ul className="mt-3 divide-y divide-ink/10">{collections.map((item) => <li key={item.id} className="py-3"><button type="button" onClick={() => setCollectionForm({ id: item.id, name: item.name, slug: item.slug, description: item.description || '', product_id: '', cover_asset_id: item.cover_asset_id || '', display_order: item.display_order || 0, status: item.status })} className="text-left text-sm underline">{item.name} <span className="text-ink-light">/{item.slug} · {item.status}</span></button></li>)}</ul></div></section>}

      {tab === 'content' && <AdminContentPage />}

      {tab === 'orders' && <section className="mt-6 space-y-3">{orders.map((order) => {
        const paymentStatus = order.payments?.[0]?.status;
        const nextStatuses = order.status === 'pending_payment' ? ['pending_payment', 'cancelled'] : order.status === 'paid' ? ['paid', 'processing'] : order.status === 'processing' ? ['processing', 'shipped'] : order.status === 'shipped' ? ['shipped', ...(paymentStatus === 'captured' ? ['delivered'] : [])] : [order.status];
        const shipment = order.shipments?.[0];
        return <article key={order.id} className="flex flex-wrap items-center justify-between gap-4 border border-ink/10 p-4"><div><h2 className="text-sm font-medium">Order #{order.order_number} · {formatINR(Number(order.total))}</h2><p className="mt-1 text-xs text-ink-light">{order.payment_method} · {paymentStatus || 'unpaid'} · {order.order_items?.length || 0} line items · {new Date(order.placed_at).toLocaleString()}</p>{shipment && <p className="mt-1 text-xs text-ink-soft">Shipment: {shipment.status}{shipment.awb_code ? ` · AWB ${shipment.awb_code}` : ''}{shipment.courier_name ? ` · ${shipment.courier_name}` : ''}</p>}</div><div className="flex flex-wrap items-center gap-2"><select aria-label={`Update order ${order.order_number} status`} value={order.status} onChange={(e) => void updateOrderStatus(order.id, e.target.value)} className="border border-ink/15 bg-transparent p-2 text-sm">{nextStatuses.map((status) => <option key={status} value={status}>{status.replace(/_/g,' ')}</option>)}</select>{order.payment_method === 'cod' && paymentStatus === 'pending_collection' && ['processing','shipped'].includes(order.status) && <Button size="sm" onClick={() => void recordCodCollection(order.id)}>Record COD collected</Button>}{order.payment_method === 'razorpay' && paymentStatus === 'captured' && order.status !== 'refunded' && <Button size="sm" variant="outline" onClick={() => void refundOrder(order.id, Number(order.order_number), Number(order.total))}>Refund</Button>}{!shipment && ['paid','processing'].includes(order.status) && <Button size="sm" onClick={() => void runShipmentAction(order.id, 'create')}>Create shipment</Button>}{shipment?.awb_code && <Button size="sm" variant="outline" onClick={() => void runShipmentAction(order.id, 'track')}>Refresh tracking</Button>}{shipment?.tracking_url && <a className="text-xs underline" href={shipment.tracking_url} target="_blank" rel="noreferrer">Track</a>}</div></article>;
      })}{!orders.length && <p className="text-sm text-ink-soft">No orders yet.</p>}</section>}

      {tab === 'settings' && <section className="mt-6 max-w-xl space-y-8"><div className="space-y-5"><h2 className="font-serif text-xl">Shipping and cash on delivery</h2><p className="text-sm text-ink-soft">Shipping fees are calculated again by the database when an order is placed. COD is disabled until enabled here. Razorpay remains unavailable until server credentials and a verified webhook are configured.</p><label className="block text-sm">Free shipping threshold (₹)<input type="number" min="0" step="1" value={settings.free_shipping_threshold ?? ''} onChange={(e) => setSettings({ ...settings, free_shipping_threshold: e.target.value })} onBlur={(e) => void updateSetting('free_shipping_threshold', Number(e.target.value))} className="admin-input" /></label><label className="block text-sm">Standard shipping fee (₹)<input type="number" min="0" step="0.01" value={settings.standard_shipping_fee ?? ''} onChange={(e) => setSettings({ ...settings, standard_shipping_fee: e.target.value })} onBlur={(e) => void updateSetting('standard_shipping_fee', Number(e.target.value))} className="admin-input" /></label><label className="flex items-center gap-3 text-sm"><input type="checkbox" checked={settings.cod_enabled === true} onChange={(e) => void updateSetting('cod_enabled', e.target.checked)} />Enable COD</label><label className="block text-sm">Additional COD charge (₹)<input type="number" min="0" step="0.01" value={settings.cod_surcharge ?? 0} onChange={(e) => setSettings({ ...settings, cod_surcharge: e.target.value })} onBlur={(e) => void updateSetting('cod_surcharge', Number(e.target.value))} className="admin-input" /></label><label className="block text-sm">Maximum COD order total (₹)<input type="number" min="0" step="1" value={settings.cod_order_limit ?? ''} onChange={(e) => setSettings({ ...settings, cod_order_limit: e.target.value })} onBlur={(e) => void updateSetting('cod_order_limit', Number(e.target.value))} className="admin-input" /></label></div><div className="space-y-4"><h2 className="font-serif text-xl">Customer support</h2>{[['support_email','Support email'],['support_phone','Support phone'],['support_whatsapp','WhatsApp number']].map(([key,label]) => <label key={key} className="block text-sm">{label}<input value={settings[key] ?? ''} onChange={(e) => setSettings({ ...settings, [key]: e.target.value })} onBlur={(e) => void updateSetting(key, e.target.value)} className="admin-input" /></label>)}</div><p className="text-xs text-ink-light">Razorpay keys must be set as Supabase Edge Function secrets. Never put private keys in VITE_* values.</p></section>}
    </main>
  );
}

function AdminMessage({ title, body, link = false }: { title: string; body: string; link?: boolean }) {
  return <main className="mx-auto max-w-xl px-4 py-20 text-center"><h1 className="font-serif text-3xl">{title}</h1><p className="mt-3 text-sm text-ink-soft">{body}</p>{link && <Link to="/account" className="mt-5 inline-block underline">Sign in</Link>}</main>;
}

function GalleryEditor({ item, asset, media, index, count, onChange, onReplace, onMove, onRemove }: { item: any; asset: any; media: any[]; index: number; count: number; onChange: (item: any) => void; onReplace: (assetId: string) => void; onMove: (direction: number) => void; onRemove: () => void }) {
  const image = asset ? publicMediaUrl(asset, 400) : '';
  return <article className="border border-ink/10 p-3"><div className="flex aspect-[4/3] items-center justify-center bg-ink/5">{image && <img src={image} alt={item.alt_text} loading="lazy" className="h-full w-full object-cover" />}</div><p className="mt-2 truncate text-xs">{asset?.original_filename || 'Media asset'}</p><label className="mt-2 block text-xs">Replace with library image<select value="" onChange={(e) => onReplace(e.target.value)} className="admin-input"><option value="">Choose an image…</option>{media.filter((row) => row.id !== asset?.id).map((row) => <option key={row.id} value={row.id}>{row.original_filename}</option>)}</select></label><label className="mt-2 block text-xs">Image alt text<input value={item.alt_text} onChange={(e) => onChange({ ...item, alt_text: e.target.value })} className="admin-input" /></label><label className="mt-2 block text-xs">Gallery view<select value={item.view_label} onChange={(e) => onChange({ ...item, view_label: e.target.value })} className="admin-input">{['front','back','side','detail','lifestyle','additional'].map((view) => <option key={view}>{view}</option>)}</select></label><div className="mt-3 flex items-center justify-between text-xs"><span>{index === 0 ? 'Primary image' : `Image ${index + 1}`}</span><span className="flex gap-2"><button type="button" disabled={index === 0} onClick={() => onMove(-1)} aria-label="Move image earlier" className="underline disabled:opacity-30">↑</button><button type="button" disabled={index === count - 1} onClick={() => onMove(1)} aria-label="Move image later" className="underline disabled:opacity-30">↓</button><button type="button" onClick={onRemove} className="text-red-700 underline">Unlink</button></span></div></article>;
}

function VariantEditor({ variant, onChange, onSave }: { variant: any; onChange: (value: any) => void; onSave: () => void }) {
  return <div className="grid items-end gap-2 border-b border-ink/10 pb-3 sm:grid-cols-7"><label className="text-[11px]">Size<input value={variant.size} onChange={(e) => onChange({ ...variant, size: e.target.value })} className="admin-input" /></label><label className="text-[11px]">Colour<input value={variant.colour} onChange={(e) => onChange({ ...variant, colour: e.target.value })} className="admin-input" /></label><label className="text-[11px]">SKU<input value={variant.sku} onChange={(e) => onChange({ ...variant, sku: e.target.value })} className="admin-input" /></label><label className="text-[11px]">Price override<input type="number" value={variant.price_override ?? ''} onChange={(e) => onChange({ ...variant, price_override: e.target.value })} className="admin-input" /></label><label className="text-[11px]">Stock<input type="number" min={variant.inventory?.quantity_reserved || 0} value={variant.stock} onChange={(e) => onChange({ ...variant, stock: Number(e.target.value) })} className="admin-input" /></label><label className="flex items-center gap-1 text-[11px]"><input type="checkbox" checked={variant.is_active} onChange={(e) => onChange({ ...variant, is_active: e.target.checked })} />Active</label><Button size="sm" onClick={onSave}>Save</Button></div>;
}

function MediaCard({ asset, onCleanup, onAltSave }: { asset: any; onCleanup: () => void; onAltSave: (alt: string) => void }) {
  const [alt, setAlt] = useState(asset.alt_text || '');
  const [refs, setRefs] = useState<number | null>(null);
  useEffect(() => {
    if (!supabase) return;
    void supabase.from('media_reference_counts').select('reference_count').eq('id', asset.id).single().then(({ data }) => setRefs(data ? Number(data.reference_count) : null));
  }, [asset.id]);
  const image = asset.mime_type.startsWith('image/') ? publicMediaUrl(asset, 150) : '';
  return <article className="overflow-hidden border border-ink/10">
    <div className="flex aspect-[4/3] items-center justify-center bg-ink/5">{image ? <img src={image} alt={alt} loading="lazy" className="h-full w-full object-cover" /> : <span className="text-xs">{asset.mime_type}</span>}</div>
    <div className="space-y-2 p-3"><p className="truncate text-sm font-medium" title={asset.original_filename}>{asset.original_filename}</p><p className="text-[11px] text-ink-light">{asset.provider} · {asset.resource_type} {asset.format ? `· ${asset.format}` : ''} · {asset.purpose} · {asset.width || '—'} × {asset.height || '—'} · {(Number(asset.file_size_bytes) / 1024).toFixed(0)} KB</p><label className="block text-xs">Alt text<input value={alt} onChange={(e) => setAlt(e.target.value)} className="admin-input" /></label><button onClick={() => onAltSave(alt)} className="text-xs underline">Save alt text</button><p className="text-xs">{refs === null ? 'Checking references…' : `${refs} references`}</p>{refs === 0 && <button onClick={onCleanup} className="text-xs text-red-800 underline">Delete external asset</button>}</div>
  </article>;
}
