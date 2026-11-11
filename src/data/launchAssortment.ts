import type { Product } from '../types';
import { ageNavigation, categoryNavigation, type LaunchAgeKey } from './storeNavigation';

export type LaunchProposal = {
  key: string;
  name: string;
  slug: string;
  category: string;
  categorySlug: string;
  ageSuggestions: LaunchAgeKey[];
  image: string;
};

const catalogPhoto = (id: string) => `/images/catalog-preview/pexels-kidswear-editorial-${id}.webp`;

// These owner-specified name/price proposals are not purchasable products.
// Local editorial photographs are category inspiration only, never exact item photos.
export const launchAssortment: LaunchProposal[] = [
  { key: 'soft-play-romper', slug: 'soft-play-romper', name: 'Soft Play Romper', category: 'Rompers', categorySlug: 'rompers', ageSuggestions: ['baby', 'toddler'], image: catalogPhoto('38543840') },
  { key: 'little-sun-romper', slug: 'little-sun-romper', name: 'Little Sun Romper', category: 'Rompers', categorySlug: 'rompers', ageSuggestions: ['baby', 'toddler'], image: catalogPhoto('33581402') },
  { key: 'everyday-snap-romper', slug: 'everyday-snap-romper', name: 'Everyday Snap Romper', category: 'Rompers', categorySlug: 'rompers', ageSuggestions: ['newborn', 'baby'], image: catalogPhoto('33253247') },
  { key: 'sunday-cotton-coord', slug: 'sunday-cotton-coord', name: 'Sunday Cotton Co-ord', category: 'Co-ord Sets', categorySlug: 'co-ord-sets', ageSuggestions: ['toddler', 'little-kids'], image: catalogPhoto('13627298') },
  { key: 'playday-tee-shorts-set', slug: 'playday-tee-shorts-set', name: 'Playday Tee & Shorts Set', category: 'Co-ord Sets', categorySlug: 'co-ord-sets', ageSuggestions: ['toddler', 'little-kids'], image: catalogPhoto('29562273') },
  { key: 'weekend-lounge-set', slug: 'weekend-lounge-set', name: 'Weekend Lounge Set', category: 'Co-ord Sets', categorySlug: 'co-ord-sets', ageSuggestions: ['baby', 'toddler'], image: catalogPhoto('31380756') },
  { key: 'everyday-cotton-tee', slug: 'everyday-cotton-tee', name: 'Everyday Cotton Tee', category: 'Tees & Tops', categorySlug: 'tees-tops', ageSuggestions: ['toddler', 'little-kids'], image: catalogPhoto('15443075') },
  { key: 'little-bloom-tee', slug: 'little-bloom-tee', name: 'Little Bloom Tee', category: 'Tees & Tops', categorySlug: 'tees-tops', ageSuggestions: ['toddler', 'little-kids'], image: catalogPhoto('37529058') },
  { key: 'peter-pan-collar-top', slug: 'peter-pan-collar-top', name: 'Peter Pan Collar Top', category: 'Tees & Tops', categorySlug: 'tees-tops', ageSuggestions: ['baby', 'toddler'], image: catalogPhoto('32234111') },
  { key: 'daisy-day-dress', slug: 'daisy-day-dress', name: 'Daisy Day Dress', category: 'Dresses', categorySlug: 'dresses', ageSuggestions: ['baby', 'toddler'], image: catalogPhoto('15967300') },
  { key: 'gathered-cotton-dress', slug: 'gathered-cotton-dress', name: 'Gathered Cotton Dress', category: 'Dresses', categorySlug: 'dresses', ageSuggestions: ['toddler', 'little-kids'], image: catalogPhoto('18279333') },
  { key: 'occasion-smock-dress', slug: 'occasion-smock-dress', name: 'Occasion Smock Dress', category: 'Dresses', categorySlug: 'dresses', ageSuggestions: ['toddler', 'little-kids'], image: catalogPhoto('7787255') },
  { key: 'easy-pull-on-pants', slug: 'easy-pull-on-pants', name: 'Easy Pull-on Pants', category: 'Bottoms', categorySlug: 'bottoms', ageSuggestions: ['baby', 'toddler'], image: catalogPhoto('32233627') },
  { key: 'everyday-cotton-shorts', slug: 'everyday-cotton-shorts', name: 'Everyday Cotton Shorts', category: 'Bottoms', categorySlug: 'bottoms', ageSuggestions: ['toddler', 'little-kids'], image: catalogPhoto('28490495') },
  { key: 'relaxed-joggers', slug: 'relaxed-joggers', name: 'Relaxed Joggers', category: 'Bottoms', categorySlug: 'bottoms', ageSuggestions: ['baby', 'toddler', 'little-kids'], image: catalogPhoto('13627298') },
  { key: 'cloud-cotton-pj-set', slug: 'cloud-cotton-pj-set', name: 'Cloud Cotton PJ Set', category: 'Sleepwear', categorySlug: 'sleepwear', ageSuggestions: ['baby', 'toddler'], image: catalogPhoto('31380756') },
  { key: 'little-moon-sleepsuit', slug: 'little-moon-sleepsuit', name: 'Little Moon Sleepsuit', category: 'Sleepwear', categorySlug: 'sleepwear', ageSuggestions: ['newborn', 'baby'], image: catalogPhoto('33253247') },
  { key: 'bedtime-two-piece-set', slug: 'bedtime-two-piece-set', name: 'Bedtime Two-Piece Set', category: 'Sleepwear', categorySlug: 'sleepwear', ageSuggestions: ['toddler', 'little-kids'], image: catalogPhoto('28490495') },
];

const sampleSizesByAge: Record<LaunchAgeKey, string[]> = {
  newborn: ['NB', '0–3M', '3–6M'],
  baby: ['3–6M', '6–12M', '12–18M'],
  toddler: ['1–2Y', '2–3Y', '3–4Y'],
  'little-kids': ['2–3Y', '3–4Y', '4–5Y'],
};

/**
 * Creates a browser-only preview from an owner-intake style. It is not a
 * database product and carries no price, variants, or stock claim.
 */
export function toLaunchPreviewProduct(item: LaunchProposal): Product {
  const category = categoryNavigation.find((entry) => entry.slug === item.categorySlug);
  const gallery = [...new Set([
    item.image,
    category?.image,
    '/images/editorial/version-b/brand-story.webp',
  ].filter((value): value is string => Boolean(value)))];
  const sizes = [...new Set(item.ageSuggestions.flatMap((age) => sampleSizesByAge[age]))];
  const ages = item.ageSuggestions.flatMap((key) => {
    const label = ageNavigation.find((age) => age.key === key)?.label;
    return label ? [label] : [];
  });

  return {
    id: `preview:${item.key}`,
    slug: `preview-${item.slug}`,
    name: item.name,
    price: 0,
    category: item.category,
    ages,
    sizes,
    colors: [
      { name: 'Natural', hex: '#e9dfd1' },
      { name: 'Sage', hex: '#aab29b' },
      { name: 'Blush', hex: '#d7aaa1' },
    ],
    images: gallery,
    imageAltTexts: gallery.map(() => `Editorial clothing inspiration for ${item.name}; not a photograph of this exact product`),
    description: 'This proposed style is unavailable while supplier details are being confirmed.',
    fabric: 'Awaiting supplier confirmation.',
    care: 'Awaiting supplier confirmation.',
    isPreviewOnly: true,
    tags: ['unreleased-style', 'owner-intake'],
  };
}

export const launchPreviewProducts = launchAssortment.map(toLaunchPreviewProduct);

export function findLaunchPreviewProduct(slug?: string) {
  return launchPreviewProducts.find((product) => product.slug === slug);
}
