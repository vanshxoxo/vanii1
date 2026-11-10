import { useEffect, useState } from 'react';
import type { AgeInfo, CategoryInfo, Product } from '../types';
import { isSupabaseConfigured, publicMediaUrl, responsiveMediaSrcSet, supabase } from './supabase';

type RawAsset = { provider: 'cloudinary' | 'imagekit' | 'external' | 'supabase'; delivery_url: string | null; external_url: string | null; resource_type?: string };
export type StoreHero = { heading: string; body: string; image: string; mobileImage: string; ctaLabel: string; ctaHref: string };
export type StoreCollection = { id: string; name: string; slug: string; description: string; image: string };
type CatalogResult = { products: Product[]; ages: AgeInfo[]; categories: CategoryInfo[]; collections: StoreCollection[]; hero: StoreHero | null; loading: boolean; error: string | null };

const unavailable = !isSupabaseConfigured ? 'The store catalogue is unavailable because the Supabase connection is not configured.' : null;

export function useCatalog(): CatalogResult {
  const [result, setResult] = useState<CatalogResult>({ products: [], ages: [], categories: [], collections: [], hero: null, loading: Boolean(supabase), error: unavailable });

  useEffect(() => {
    if (!supabase) return;
    let cancelled = false;
    async function load() {
      const client = supabase!;
      const [productResponse, categoryResponse, heroResponse, collectionResponse] = await Promise.all([
        client.from('products').select('*,product_variants(id,sku,size,colour,colour_hex,price_override),product_media(id,asset_id,variant_id,display_order,is_primary,alt_text,view_label,media_assets(provider,delivery_url,external_url,resource_type)),product_categories(categories:categories(id,kind,name,slug,display_order,image_asset:media_assets(provider,delivery_url,external_url,resource_type))),collection_products(collections:collections(slug))').eq('status', 'published').order('published_at', { ascending: false }),
        client.from('categories').select('id,kind,name,slug,description,display_order,image_asset:media_assets(provider,delivery_url,external_url,resource_type)').eq('is_active', true).order('display_order'),
        client.from('homepage_sections').select('heading,body,cta_label,cta_href,desktop:media_assets!homepage_sections_desktop_asset_id_fkey(provider,delivery_url,external_url,resource_type),mobile:media_assets!homepage_sections_mobile_asset_id_fkey(provider,delivery_url,external_url,resource_type)').eq('section_key', 'hero').eq('is_published', true).maybeSingle(),
        client.from('collections').select('id,name,slug,description,cover:media_assets!collections_cover_asset_id_fkey(provider,delivery_url,external_url,resource_type)').eq('status', 'published').order('display_order'),
      ]);
      if (cancelled) return;
      const queryError = productResponse.error || categoryResponse.error;
      const variantIds = (productResponse.data || []).flatMap((row: any) => (row.product_variants || []).map((variant: any) => variant.id));
      const availabilityResponse = variantIds.length ? await supabase!.from('variant_availability').select('variant_id,is_available').in('variant_id', variantIds) : { data: [], error: null };
      const catalogError = queryError || availabilityResponse.error;
      if (catalogError) {
        setResult({ products: [], ages: [], categories: [], collections: [], hero: null, loading: false, error: catalogError.message });
        return;
      }

      const rows = productResponse.data || [];
      const availability = new Map((availabilityResponse.data || []).map((item: any) => [item.variant_id, item.is_available]));
      const products = rows.map((row: any) => {
        const relations = row.product_categories || [];
        const productCats = relations.map((item: any) => item.categories).filter(Boolean);
        const ageNames = productCats.filter((category: any) => category.kind === 'age').map((category: any) => category.name);
        const mainCategory = productCats.find((category: any) => category.kind === 'product')?.name || '';
        const variants = row.product_variants || [];
        const gallery = (row.product_media || []).sort((a: any, b: any) => a.display_order - b.display_order);
        const imagePairsByUrl = new Map<string, { url: string; srcSet: string; alt: string }>();
        gallery.forEach((entry: any) => {
          const asset = entry.media_assets as RawAsset | null;
          if (!asset) return;
          const url = publicMediaUrl(asset, 900);
          if (url && !imagePairsByUrl.has(url)) imagePairsByUrl.set(url, { url, srcSet: responsiveMediaSrcSet(asset) || '', alt: entry.alt_text || row.name });
        });
        const images = [...imagePairsByUrl.values()];
        const colors = [...new Map(variants.map((variant: any) => [variant.colour, { name: variant.colour, hex: variant.colour_hex || undefined }])).values()] as Product['colors'];
        const sizes = [...new Set(variants.map((variant: any) => variant.size))] as string[];
        const collections = (row.collection_products || []).map((entry: any) => entry.collections?.slug);
        return {
          id: row.id, slug: row.slug, name: row.name, description: row.description,
          price: Number(row.price), originalPrice: row.compare_at_price ? Number(row.compare_at_price) : undefined,
          category: mainCategory, ages: ageNames, sizes, colors,
          images: images.map((image) => image.url), imageSrcSets: images.map((image) => image.srcSet), imageAltTexts: images.map((image) => image.alt),
          fabric: row.fabric_composition || row.material || '', care: row.care_instructions || '',
          tags: row.tags || [], isNew: collections.includes('new-arrivals'),
          variants: variants.map((variant: any) => ({ id: variant.id, sku: variant.sku, size: variant.size, colour: variant.colour, price: Number(variant.price_override ?? row.price), available: availability.get(variant.id) === true })),
          inStock: variants.some((variant: any) => availability.get(variant.id) === true),
        } as Product;
      }).filter((product: Product) => product.price > 0 && product.category && product.ages.length > 0 && product.images.length > 0 && product.variants?.length && product.variants.every((variant) => variant.sku.trim() && variant.size.trim() && variant.colour.trim()) && product.description.trim() && product.fabric.trim() && product.care.trim());

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
      const collections = collectionResponse.error ? [] : (collectionResponse.data || []).map((row: any) => {
        const cover = Array.isArray(row.cover) ? row.cover[0] : row.cover;
        return { id: row.id, name: row.name, slug: row.slug, description: row.description, image: cover ? publicMediaUrl(cover as RawAsset, 800) : '' };
      });
      setResult({ products, ages, categories, collections, hero, loading: false, error: null });
    }
    void load().catch((cause) => {
      if (!cancelled) setResult({ products: [], ages: [], categories: [], collections: [], hero: null, loading: false, error: cause instanceof Error ? cause.message : 'The store catalogue could not be loaded.' });
    });
    return () => { cancelled = true; };
  }, []);

  return result;
}
