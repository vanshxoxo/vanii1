const editorial = '/images/editorial/version-b/';

export type LaunchAgeKey = 'newborn' | 'baby' | 'toddler' | 'little-kids';

export const ageNavigation = [
  { key: 'newborn', label: 'Newborn', value: 'Newborn', range: '0–3 months', image: `${editorial}newborn.webp`, introduction: 'A preview of styles suggested for this age group. Final sizing and fit will follow actual garment measurements.' },
  { key: 'baby', label: 'Baby', value: 'Baby', range: '3–12 months', image: `${editorial}baby.webp`, introduction: 'Browse styles suggested for this age group. Final sizing and fit will follow actual garment measurements.' },
  { key: 'toddler', label: 'Toddler', value: 'Toddler', range: '1–2 years', image: `${editorial}toddler.webp`, introduction: 'Browse styles suggested for this age group. Final sizing and fit will follow actual garment measurements.' },
  { key: 'little-kids', label: 'Little Kids', value: 'Little Kids', range: '2–4 years', image: `${editorial}little-kids.webp`, introduction: 'Browse styles suggested for this age group. Final sizing and fit will follow actual garment measurements.' },
] as const;

export const categoryNavigation = [
  { slug: 'rompers', label: 'Rompers', value: 'Rompers', image: `${editorial}category-rompers.webp`, introduction: 'Explore the proposed one-piece edit, with editorial images for visual inspiration.' },
  { slug: 'co-ord-sets', label: 'Co-ord Sets', value: 'Co-ord Sets', image: `${editorial}category-coords.webp`, introduction: 'Explore the proposed coordinated looks, with editorial images for visual inspiration.' },
  { slug: 'tees-tops', label: 'Tees & Tops', value: 'Tees & Tops', image: `${editorial}category-tops.webp`, introduction: 'Explore the proposed tops edit, with editorial images for visual inspiration.' },
  { slug: 'dresses', label: 'Dresses', value: 'Dresses', image: `${editorial}category-dresses.webp`, introduction: 'Explore the proposed dress edit, with editorial images for visual inspiration.' },
  { slug: 'bottoms', label: 'Bottoms', value: 'Bottoms', image: `${editorial}category-bottoms.webp`, introduction: 'Explore the proposed bottoms edit, with editorial images for visual inspiration.' },
  { slug: 'sleepwear', label: 'Sleepwear', value: 'Sleepwear', image: `${editorial}category-sleepwear.webp`, introduction: 'Explore the proposed sleepwear edit, with editorial images for visual inspiration.' },
] as const;

function filterSlug(value: string) {
  return value.normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

export function resolveLaunchAge(value?: string | null) {
  if (!value) return undefined;
  const slug = filterSlug(value);
  return ageNavigation.find((age) => slug === age.key || slug === filterSlug(age.label) || slug.startsWith(`${age.key}-`));
}

export function resolveLaunchCategory(value?: string | null) {
  if (!value) return undefined;
  const slug = filterSlug(value);
  return categoryNavigation.find((category) => slug === category.slug || slug === filterSlug(category.label));
}
