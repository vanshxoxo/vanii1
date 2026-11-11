const editorial = '/images/editorial/version-b/';

export type LaunchAgeKey = 'newborn' | 'baby' | 'toddler' | 'little-kids';

export const ageNavigation = [
  { key: 'newborn', label: 'Newborn', value: 'Newborn', range: '0–3 months', image: `${editorial}newborn.webp`, introduction: 'Explore Little Loom for newborns.' },
  { key: 'baby', label: 'Baby', value: 'Baby', range: '3–12 months', image: `${editorial}baby.webp`, introduction: 'Explore Little Loom for babies.' },
  { key: 'toddler', label: 'Toddler', value: 'Toddler', range: '1–2 years', image: `${editorial}toddler.webp`, introduction: 'Explore Little Loom for toddlers.' },
  { key: 'little-kids', label: 'Little Kids', value: 'Little Kids', range: '2–4 years', image: `${editorial}little-kids.webp`, introduction: 'Explore Little Loom for little kids.' },
] as const;

export const categoryNavigation = [
  { slug: 'rompers', label: 'Rompers', value: 'Rompers', image: `${editorial}category-rompers.webp`, introduction: 'Explore Little Loom rompers.' },
  { slug: 'co-ord-sets', label: 'Co-ord Sets', value: 'Co-ord Sets', image: `${editorial}category-coords.webp`, introduction: 'Explore Little Loom co-ord sets.' },
  { slug: 'tees-tops', label: 'Tees & Tops', value: 'Tees & Tops', image: `${editorial}category-tops.webp`, introduction: 'Explore Little Loom tees and tops.' },
  { slug: 'dresses', label: 'Dresses', value: 'Dresses', image: `${editorial}category-dresses.webp`, introduction: 'Explore Little Loom dresses.' },
  { slug: 'bottoms', label: 'Bottoms', value: 'Bottoms', image: `${editorial}category-bottoms.webp`, introduction: 'Explore Little Loom bottoms.' },
  { slug: 'sleepwear', label: 'Sleepwear', value: 'Sleepwear', image: `${editorial}category-sleepwear.webp`, introduction: 'Explore Little Loom sleepwear.' },
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
