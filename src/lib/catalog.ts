import { useEffect, useState } from 'react';
import type { AgeInfo, CategoryInfo, Product } from '../types';
import { isSupabaseConfigured, publicMediaUrl, responsiveMediaSrcSet, supabase } from './supabase';
import { ageGroups as demoAges, categories as demoCategories, demoProducts, editorialImages, isDemoPreviewHost } from '../demoData';

type CatalogResult = { products: Product[]; ages: AgeInfo[]; categories: CategoryInfo[]; hero: { heading: string; body: string; image: string; mobileImage: string; ctaLabel: string; ctaHref: string } | null; loading: boolean; error: string | null };
type RawAsset = { provider: 'cloudinary' | 'imagekit' | 'external' | 'supabase'; delivery_url: string | null; external_url: string | null; resource_type?: string };

const demoHero = {
  heading: 'Small humans.\nBig outfits.',
  body: 'A little demo wardrobe for tiny adventures. These sample styles and images are for preview only.',
  image: editorialImages[0], mobileImage: editorialImages[3],
  ctaLabel: 'Shop Demo Styles', ctaHref: '/shop',
};

function demoCatalog(): Pick<CatalogResult, 'products' | 'ages' | 'categories' | 'hero'> {
  return { products: demoProducts, ages: demoAges, categories: demoCategories, hero: demoHero };
}

export function useCatalog(): CatalogResult {
  const [result, setResult] = useState<CatalogResult>({
    ...(isDemoPreviewHost() && !isSupabaseConfigured ? demoCatalog() : { products: [], ages: [], categories: [], hero: null }),
    loading: isSupabaseConfigured,
    error: isSupabaseConfigured || isDemoPreviewHost() ? null : 'Connect a Supabase project to load the product catalog.',
  });

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    async function load() {
      const [productResponse, categoryResponse, heroResponse] = await Promise.all([
        supabase!.from('products').select('*,product_variants(id,sku,size,colour,colour_hex,price_override),product_media(id,asset_id,variant_id,display_order,is_primary,alt_text,view_label,media_assets(provider,delivery_url,external_url,resource_type)),product_categories(categories:categories(id,kind,name,slug,display_order,image_asset:media_assets(provider,delivery_url,external_url,resource_type))),collection_products(collections:collections(slug))').eq('status', 'published').order('published_at', { ascending: false }),
        supabase!.from('categories').select('id,kind,name,slug,description,display_order,image_asset:media_assets(provider,delivery_url,external_url,resource_type)').eq('is_active', true).order('display_order'),
        supabase!.from('homepage_sections').select('heading,body,cta_label,cta_href,desktop:media_assets!homepage_sections_desktop_asset_id_fkey(provider,delivery_url,external_url,resource_type),mobile:media_assets!homepage_sections_mobile_asset_id_fkey(provider,delivery_url,external_url,resource_type)').eq('section_key', 'hero').eq('is_published', true).maybeSingle(),
      ]);
      if (cancelled) return;
      if (productResponse.error || categoryResponse.error) {
        if (isDemoPreviewHost()) {
          console.warn('Little Loom preview is using its demo catalog because the public Supabase catalog query failed.');
          setResult({ ...demoCatalog(), loading: false, error: null });
          return;
        }
        setResult((current) => ({ ...current, loading: false, error: productResponse.error?.message || categoryResponse.error?.message || 'Could not load catalog.' }));
        return;
      }
      const variantIds = (productResponse.data || []).flatMap((row: any) => (row.product_variants || []).map((variant: any) => variant.id));
      const availabilityResponse = variantIds.length ? await supabase!.from('variant_availability').select('variant_id,is_available').in('variant_id', variantIds) : { data: [], error: null };
      const availability = new Map((availabilityResponse.data || []).map((item: any) => [item.variant_id, item.is_available]));
      const products = (productResponse.data || []).map((row: any) => {
        const relations = row.product_categories || [];
        const productCats = relations.map((item: any) => item.categories).filter(Boolean);
        const ageNames = productCats.filter((category: any) => category.kind === 'age').map((category: any) => category.name);
        const mainCategory = productCats.find((category: any) => category.kind === 'product')?.name || 'Clothing';
        const variants = row.product_variants || [];
        const gallery = (row.product_media || []).sort((a: any, b: any) => a.display_order - b.display_order);
        const assetRows = gallery.map((entry: any) => entry.media_assets as RawAsset | null).filter(Boolean) as RawAsset[];
        const imagePairsByUrl = new Map<string, { url: string; srcSet: string }>();
        assetRows.forEach((asset) => {
          const url = publicMediaUrl(asset, 900);
          if (url && !imagePairsByUrl.has(url)) imagePairsByUrl.set(url, { url, srcSet: responsiveMediaSrcSet(asset) || '' });
        });
        const imagePairs = [...imagePairsByUrl.values()];
        const images = imagePairs.map((pair) => pair.url);
        const imageSrcSets = imagePairs.map((pair) => pair.srcSet);
        const colors = [...new Map(variants.map((variant: any) => [variant.colour, { name: variant.colour, hex: variant.colour_hex || '#B9A9E8' }])).values()] as Product['colors'];
        const sizes = [...new Set(variants.map((variant: any) => variant.size))] as string[];
        const collections = (row.collection_products || []).map((entry: any) => entry.collections?.slug);
        return {
          id: row.id, slug: row.slug, name: row.name, description: row.description,
          price: Number(row.price), originalPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
          category: mainCategory, ages: ageNames, sizes, colors, images, imageSrcSets,
          fabric: row.fabric_composition || row.material || '', care: row.care_instructions || '',
          tags: row.tags || [], isBestseller: collections.includes('bestsellers'), isNew: collections.includes('new-arrivals'),
          variants: variants.map((variant: any) => ({ id: variant.id, sku: variant.sku, size: variant.size, colour: variant.colour, price: Number(variant.price_override ?? row.price), available: availability.get(variant.id) === true })),
          inStock: variants.some((variant: any) => availability.get(variant.id) === true),
        } as Product;
      });
      const allCategories = categoryResponse.data || [];
      const ages = allCategories.filter((category: any) => category.kind === 'age').map((category: any) => ({
        id: category.name, label: category.name, range: '', image: category.image_asset ? publicMediaUrl(category.image_asset as RawAsset, 600) : '', description: category.description,
      })) as AgeInfo[];
      const categories = allCategories.filter((category: any) => category.kind === 'product').map((category: any) => ({
        id: category.name, name: category.name, image: category.image_asset ? publicMediaUrl(category.image_asset as RawAsset, 700) : '', span: 'normal',
      })) as CategoryInfo[];
      const heroData = heroResponse.data;
      const desktopAsset = Array.isArray(heroData?.desktop) ? heroData.desktop[0] : heroData?.desktop;
      const mobileAsset = Array.isArray(heroData?.mobile) ? heroData.mobile[0] : heroData?.mobile;
      const hero = heroData ? {
        heading: heroData.heading || '', body: heroData.body || '',
        image: desktopAsset ? publicMediaUrl(desktopAsset as RawAsset, 1400) : '',
        mobileImage: mobileAsset ? publicMediaUrl(mobileAsset as RawAsset, 800) : '',
        ctaLabel: heroData.cta_label || '', ctaHref: heroData.cta_href || '',
      } : null;
      if (products.length === 0 && isDemoPreviewHost()) {
        setResult({ ...demoCatalog(), loading: false, error: null });
        return;
      }
      setResult({ products, ages, categories, hero, loading: false, error: null });
    }
    void load();
    return () => { cancelled = true; };
  }, []);

  return result;
}
