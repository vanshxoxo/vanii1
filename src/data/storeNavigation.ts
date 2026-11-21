import type { Department } from '../types';

const editorial = '/images/editorial/version-b/';

export type LaunchAgeKey = 'newborn' | 'baby' | 'toddler' | 'little-kids';

export interface DepartmentCategory {
  slug: string;
  label: string;
  value: string;
  department: Department;
  introduction: string;
  image?: string;
  featured?: boolean;
}

export interface DepartmentInfo {
  id: Department;
  label: string;
  brand: string;
  tagline: string;
  path: string;
  landingPath: string;
  description: string;
  themeColor: string;
  heroHeading: string;
  heroSubheading: string;
  accentBg: string;
  accentBorder: string;
  accentText: string;
  highlights: { title: string; desc: string }[];
}

export const departments: DepartmentInfo[] = [
  {
    id: 'jewellery',
    label: 'Shop Jewellery',
    brand: 'VJ Jewellery',
    tagline: 'Necklace sets, earrings & handcrafted rings',
    path: '/shop?department=jewellery',
    landingPath: '/department/jewellery',
    description: 'Timeless heirloom craftsmanship in gold and silver plating with artisanal finishes, kundan, and polki stones.',
    themeColor: '#C5A059',
    heroHeading: 'Heirloom Splendour.\nModern Radiance.',
    heroSubheading: 'Exquisite bridal necklaces, chandelier earrings, and statement rings curated for celebration and everyday grandeur.',
    accentBg: '#FAF7EE',
    accentBorder: '#E5D8B8',
    accentText: '#8F6E28',
    highlights: [
      { title: 'Fine Artisanal Finish', desc: 'Crafted with premium high-micron plating and lustrous semi-precious stones.' },
      { title: 'Celebration & Bridal', desc: 'Curated sets designed to elevate wedding festivities and contemporary evening wear.' },
      { title: 'Skin Safe & Tested', desc: 'Hypoallergenic base alloys formulated for lightweight all-day comfort.' },
    ],
  },
  {
    id: 'women_suits',
    label: "Shop Women's Suits",
    brand: 'VJ Suits & Fabrics',
    tagline: 'Pure cotton, silk, organza & Banarasi weaves',
    path: '/shop?department=women_suits',
    landingPath: '/department/women-suits',
    description: 'Fine unstitched salwar suit lengths, pure breathable cottons, festive silks, and intricate Banarasi brocades with coordinating dupattas.',
    themeColor: '#B25E46',
    heroHeading: 'The Pure Weave.\nUnstitched Elegance.',
    heroSubheading: 'Authentic handloom textiles and premium unstitched 3-piece suit materials ready to be tailored to your grace.',
    accentBg: '#FDF6F3',
    accentBorder: '#EAD1C8',
    accentText: '#9A412A',
    highlights: [
      { title: 'Fabric Purity', desc: 'Guaranteed pure natural cottons, hand-woven silks, organza, and winter wools.' },
      { title: 'Complete 3-Piece Sets', desc: 'Generously measured top, bottom, and matching dupatta lengths.' },
      { title: 'Tailoring Freedom', desc: 'Unstitched fabric allows personalized silhouette fitting and custom styling.' },
    ],
  },
  {
    id: 'home_textiles',
    label: 'Shop Home Textiles',
    brand: 'VJ Living',
    tagline: 'Cotton bedsheets, single top sheets & pillow covers',
    path: '/shop?department=home_textiles',
    landingPath: '/department/living',
    description: 'Pure breathable cotton bedding, double bedsheet sets, 60×90 single top sheets (odhne wali chaddars), and designer pillow covers.',
    themeColor: '#3E5C76',
    heroHeading: 'Sanctuary Living.\nPure Cotton Comfort.',
    heroSubheading: 'Cool, breathable double and single bedsheets, 60×90 top sheets, and tailored pillow covers for restful everyday serenity.',
    accentBg: '#F3F6F8',
    accentBorder: '#C9D6DF',
    accentText: '#2C4961',
    highlights: [
      { title: '100% Breathable Cotton', desc: 'Skin-friendly natural fibers that stay cool and soften beautifully with every wash.' },
      { title: 'Confirmed 60 × 90 Chaddars', desc: 'Traditional single-bed top sheets measured to standard Indian dimensions.' },
      { title: 'Durable Color Fastness', desc: 'Artisanal vat and reactive dyes engineered to preserve vibrancy over years.' },
    ],
  },
  {
    id: 'kids',
    label: "Shop Children's Clothing",
    brand: 'Little Loom',
    tagline: 'Everyday handcrafted comfort for newborn to 6 years',
    path: '/shop?department=kids',
    landingPath: '/department/little-loom',
    description: 'Soft, GOTS-certified organic cotton rompers, dresses, and lounge sets created with love for babies and growing toddlers.',
    themeColor: '#C9826B',
    heroHeading: 'Small Humans.\nGentle Outfits.',
    heroSubheading: 'Mindful, cloud-soft everyday playwear and milestone pieces designed for freedom of movement and tender skin.',
    accentBg: '#FAF5F2',
    accentBorder: '#E8D4CC',
    accentText: '#9B543F',
    highlights: [
      { title: 'Organic Cotton Softness', desc: 'Hypoallergenic, breathable textiles gentle on the most delicate infant skin.' },
      { title: 'Growth-Minded Fit', desc: 'Generously tailored cuts that adapt gracefully through every developmental leap.' },
      { title: 'Tagless & Safe', desc: 'Flatlock seams and non-toxic dyes ensuring zero chafing or scratching.' },
    ],
  },
];

export const ageNavigation = [
  { key: 'newborn', label: 'Newborn', value: 'Newborn', range: '0–3 months', image: `${editorial}newborn.webp`, introduction: 'Explore Little Loom newborn essentials.' },
  { key: 'baby', label: 'Baby', value: 'Baby', range: '3–12 months', image: `${editorial}baby.webp`, introduction: 'Explore Little Loom for babies.' },
  { key: 'toddler', label: 'Toddler', value: 'Toddler', range: '1–2 years', image: `${editorial}toddler.webp`, introduction: 'Explore Little Loom for toddlers.' },
  { key: 'little-kids', label: 'Little Kids', value: 'Little Kids', range: '2–4 years', image: `${editorial}little-kids.webp`, introduction: 'Explore Little Loom for little kids.' },
] as const;

export const kidsCategories: DepartmentCategory[] = [
  { slug: 'rompers', label: 'Rompers & Sleepsuits', value: 'Rompers', department: 'kids', image: `${editorial}category-rompers.webp`, introduction: 'One-piece comfort for playtime and sleep.', featured: true },
  { slug: 'co-ord-sets', label: 'Co-ord Sets', value: 'Co-ord Sets', department: 'kids', image: `${editorial}category-coords.webp`, introduction: 'Matching tops and bottoms in soft breathable cotton.', featured: true },
  { slug: 'tees-tops', label: 'Tees & Tops', value: 'Tees & Tops', department: 'kids', image: `${editorial}category-tops.webp`, introduction: 'Everyday gentle tops with easy dressing necklines.' },
  { slug: 'dresses', label: 'Dresses & Frocks', value: 'Dresses', department: 'kids', image: `${editorial}category-dresses.webp`, introduction: 'Twirl-worthy dresses crafted for sunny afternoons.', featured: true },
  { slug: 'bottoms', label: 'Bottoms & Shorts', value: 'Bottoms', department: 'kids', image: `${editorial}category-bottoms.webp`, introduction: 'Gentle elasticated pants and bloomers.' },
  { slug: 'sleepwear', label: 'Sleepwear & Pyjamas', value: 'Sleepwear', department: 'kids', image: `${editorial}category-sleepwear.webp`, introduction: 'Restful, cloud-soft sleepwear for dreamy nights.' },
];

export const jewelleryCategories: DepartmentCategory[] = [
  { slug: 'necklace-sets', label: 'Necklace Sets & Chokers', value: 'Necklace Sets', department: 'jewellery', introduction: 'Artisanal kundan, polki, and gemstone necklace sets with matching earrings.', featured: true },
  { slug: 'earrings', label: 'Earrings, Jhumkas & Studs', value: 'Earrings', department: 'jewellery', introduction: 'From delicate everyday hoops and studs to grand statement jhumkas.', featured: true },
  { slug: 'rings', label: 'Artisanal Rings', value: 'Rings', department: 'jewellery', introduction: 'Handcrafted rings in adjustable and tailored fixed sizes.', featured: true },
];

export const womenSuitsCategories: DepartmentCategory[] = [
  { slug: 'womens-unstitched-suits', label: "All Unstitched Suits", value: "Women's Unstitched Suits", department: 'women_suits', introduction: 'Complete 3-piece unstitched salwar suit fabrics with coordinating dupattas.', featured: true },
  { slug: 'cotton-suits', label: 'Pure Cotton Suits', value: 'Cotton Suits', department: 'women_suits', introduction: 'All-day breathable pure cotton unstitched sets with soft dupattas.', featured: true },
  { slug: 'silk-suits', label: 'Festive Silk Suits', value: 'Silk Suits', department: 'women_suits', introduction: 'Lustrous mulberry, tussar, and chanderi silk fabric sets.', featured: true },
  { slug: 'organza-suits', label: 'Organza Suits', value: 'Organza Suits', department: 'women_suits', introduction: 'Ethereal sheer organza dress materials with artisanal threadwork.' },
  { slug: 'banarasi-suits', label: 'Banarasi Brocade Suits', value: 'Banarasi Suits', department: 'women_suits', introduction: 'Heritage Banarasi weaves featuring rich zari floral motifs.', featured: true },
  { slug: 'rayon-suits', label: 'Soft Rayon Suits', value: 'Rayon Suits', department: 'women_suits', introduction: 'Fluid, effortless-drape rayon suit lengths.' },
  { slug: 'wool-suits', label: 'Winter Woollen Suits', value: 'Wool Suits', department: 'women_suits', introduction: 'Warm, cozy woollen unstitched suits for cool seasons.' },
];

export const homeTextilesCategories: DepartmentCategory[] = [
  { slug: 'cotton-bedsheets', label: 'Pure Cotton Bedsheets', value: 'Cotton Bedsheets', department: 'home_textiles', introduction: 'Crisp, breathable natural cotton bedsheets for tranquil sleep.', featured: true },
  { slug: 'double-bedsheets-pillow-covers', label: 'Double Bedsheets with Pillows', value: 'Double Bedsheets with Pillow Covers', department: 'home_textiles', introduction: 'King and Queen double bed sets with matching tailored pillow covers.', featured: true },
  { slug: 'single-bedsheets-pillow', label: 'Single Bedsheets with Pillow', value: 'Single Bedsheets with Pillow', department: 'home_textiles', introduction: 'Comfortable single bedsheets paired with matching pillow covers.' },
  { slug: 'single-bed-top-sheets', label: '60 × 90 Top Sheets (Chaddars)', value: 'Single Bed Top Sheets / Chaddars', department: 'home_textiles', introduction: 'Handcrafted single-bed top sheets and odhne wali chaddars in pure cotton.', featured: true },
  { slug: 'pillow-covers', label: 'Pillow Cover Pairs', value: 'Pillow Covers', department: 'home_textiles', introduction: 'Tailored pillow covers with envelope and zipper closures.' },
];

export const allDepartmentCategories: DepartmentCategory[] = [
  ...jewelleryCategories,
  ...womenSuitsCategories,
  ...homeTextilesCategories,
  ...kidsCategories,
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
  return departments.find((d) => d.id === clean || filterSlug(d.label) === filterSlug(value) || filterSlug(d.brand) === filterSlug(value));
}

export function getCategoriesForDepartment(deptId: Department): DepartmentCategory[] {
  switch (deptId) {
    case 'jewellery':
      return jewelleryCategories;
    case 'women_suits':
      return womenSuitsCategories;
    case 'home_textiles':
      return homeTextilesCategories;
    case 'kids':
      return kidsCategories;
    default:
      return [];
  }
}
