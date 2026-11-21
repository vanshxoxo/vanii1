import type { Department } from '../types';

const editorial = '/images/editorial/version-b/';

export type LaunchAgeKey = 'newborn' | 'baby' | 'toddler' | 'little-kids';

export interface DepartmentInfo {
  id: Department;
  label: string;
  brand: string;
  tagline: string;
  path: string;
  description: string;
  themeColor: string;
}

export const departments: DepartmentInfo[] = [
  {
    id: 'jewellery',
    label: 'Shop Jewellery',
    brand: 'VJ Jewellery',
    tagline: 'Necklace sets, earrings & handcrafted rings',
    path: '/shop?department=jewellery',
    description: 'Timeless heirloom craftsmanship in gold and silver plating with artisanal finishes.',
    themeColor: '#B8860B',
  },
  {
    id: 'women_suits',
    label: "Shop Women's Suits",
    brand: "VJ Suits & Fabrics",
    tagline: 'Pure cotton, silk, organza & Banarasi weaves',
    path: '/shop?department=women_suits',
    description: 'Fine unstitched salwar suits with matching dupattas and uncompromised fabric purity.',
    themeColor: '#8B4513',
  },
  {
    id: 'home_textiles',
    label: 'Shop Home Textiles',
    brand: 'VJ Living',
    tagline: 'Cotton bedsheets, single top sheets & pillow covers',
    path: '/shop?department=home_textiles',
    description: 'Pure breathable cotton bedding, 60×90 odhne wali chaddars, and tailored pillow covers.',
    themeColor: '#4A6B82',
  },
  {
    id: 'kids',
    label: "Shop Children's Clothing",
    brand: 'Little Loom',
    tagline: 'Everyday handcrafted comfort for newborn to 6 years',
    path: '/shop?department=kids',
    description: 'Soft, GOTS-certified organic cotton rompers, dresses, and lounge sets for babies and toddlers.',
    themeColor: '#C9826B',
  },
];

export const ageNavigation = [
  { key: 'newborn', label: 'Newborn', value: 'Newborn', range: '0–3 months', image: `${editorial}newborn.webp`, introduction: 'Explore Little Loom for newborns.' },
  { key: 'baby', label: 'Baby', value: 'Baby', range: '3–12 months', image: `${editorial}baby.webp`, introduction: 'Explore Little Loom for babies.' },
  { key: 'toddler', label: 'Toddler', value: 'Toddler', range: '1–2 years', image: `${editorial}toddler.webp`, introduction: 'Explore Little Loom for toddlers.' },
  { key: 'little-kids', label: 'Little Kids', value: 'Little Kids', range: '2–4 years', image: `${editorial}little-kids.webp`, introduction: 'Explore Little Loom for little kids.' },
] as const;

export const kidsCategories = [
  { slug: 'rompers', label: 'Rompers', value: 'Rompers', department: 'kids' as Department, image: `${editorial}category-rompers.webp`, introduction: 'Explore Little Loom rompers.' },
  { slug: 'co-ord-sets', label: 'Co-ord Sets', value: 'Co-ord Sets', department: 'kids' as Department, image: `${editorial}category-coords.webp`, introduction: 'Explore Little Loom co-ord sets.' },
  { slug: 'tees-tops', label: 'Tees & Tops', value: 'Tees & Tops', department: 'kids' as Department, image: `${editorial}category-tops.webp`, introduction: 'Explore Little Loom tees and tops.' },
  { slug: 'dresses', label: 'Dresses', value: 'Dresses', department: 'kids' as Department, image: `${editorial}category-dresses.webp`, introduction: 'Explore Little Loom dresses.' },
  { slug: 'bottoms', label: 'Bottoms', value: 'Bottoms', department: 'kids' as Department, image: `${editorial}category-bottoms.webp`, introduction: 'Explore Little Loom bottoms.' },
  { slug: 'sleepwear', label: 'Sleepwear', value: 'Sleepwear', department: 'kids' as Department, image: `${editorial}category-sleepwear.webp`, introduction: 'Explore Little Loom sleepwear.' },
] as const;

export const jewelleryCategories = [
  { slug: 'necklace-sets', label: 'Necklace Sets', value: 'Necklace Sets', department: 'jewellery' as Department, introduction: 'Handcrafted necklace sets and chokers.' },
  { slug: 'earrings', label: 'Earrings', value: 'Earrings', department: 'jewellery' as Department, introduction: 'Studs, jhumkas, drops and hoops.' },
  { slug: 'rings', label: 'Rings', value: 'Rings', department: 'jewellery' as Department, introduction: 'Artisanal rings in fixed and adjustable sizes.' },
] as const;

export const womenSuitsCategories = [
  { slug: 'womens-unstitched-suits', label: "Women's Unstitched Suits", value: "Women's Unstitched Suits", department: 'women_suits' as Department, introduction: 'Curated unstitched 2-piece and 3-piece salwar suit fabrics.' },
  { slug: 'cotton-suits', label: 'Cotton Suits', value: 'Cotton Suits', department: 'women_suits' as Department, introduction: 'Pure breathable cotton unstitched suit sets.' },
  { slug: 'silk-suits', label: 'Silk Suits', value: 'Silk Suits', department: 'women_suits' as Department, introduction: 'Lustrous festive pure and blended silk suit lengths.' },
  { slug: 'organza-suits', label: 'Organza Suits', value: 'Organza Suits', department: 'women_suits' as Department, introduction: 'Delicate organza suits with artisanal embroidery.' },
  { slug: 'banarasi-suits', label: 'Banarasi Suits', value: 'Banarasi Suits', department: 'women_suits' as Department, introduction: 'Heritage Banarasi brocade and zari suit sets.' },
  { slug: 'rayon-suits', label: 'Rayon Suits', value: 'Rayon Suits', department: 'women_suits' as Department, introduction: 'Fluid, soft-drape rayon suit fabrics.' },
  { slug: 'wool-suits', label: 'Wool Suits', value: 'Wool Suits', department: 'women_suits' as Department, introduction: 'Warm winter unstitched woollen suits.' },
] as const;

export const homeTextilesCategories = [
  { slug: 'cotton-bedsheets', label: 'Cotton Bedsheets', value: 'Cotton Bedsheets', department: 'home_textiles' as Department, introduction: 'Pure cotton bedsheets crafted for cool sleep.' },
  { slug: 'double-bedsheets-pillow-covers', label: 'Double Bedsheets with Pillow Covers', value: 'Double Bedsheets with Pillow Covers', department: 'home_textiles' as Department, introduction: 'Double bedsheet sets with matching pillow covers.' },
  { slug: 'single-bedsheets-pillow', label: 'Single Bedsheets with Pillow', value: 'Single Bedsheets with Pillow', department: 'home_textiles' as Department, introduction: 'Single bedsheets with matching pillow cover.' },
  { slug: 'pillow-covers', label: 'Pillow Covers', value: 'Pillow Covers', department: 'home_textiles' as Department, introduction: 'Artisanal pillow covers with fine closures.' },
  { slug: 'single-bed-top-sheets', label: 'Single Bed Top Sheets / Chaddars', value: 'Single Bed Top Sheets / Chaddars', department: 'home_textiles' as Department, introduction: 'Single bed cotton top sheets and odhne wali chaddars.' },
] as const;

export const allDepartmentCategories = [
  ...kidsCategories,
  ...jewelleryCategories,
  ...womenSuitsCategories,
  ...homeTextilesCategories,
];

// Preserved for backward compatibility
export const categoryNavigation = kidsCategories;

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
  return allDepartmentCategories.find((category) => slug === category.slug || slug === filterSlug(category.label));
}

export function resolveDepartment(value?: string | null): DepartmentInfo | undefined {
  if (!value) return undefined;
  const clean = value.toLowerCase().replace(/[^a-z0-9_]/g, '');
  return departments.find((d) => d.id === clean || filterSlug(d.label) === filterSlug(value));
}
