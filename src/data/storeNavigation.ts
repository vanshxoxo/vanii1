import type { Department } from '../types';

const editorial = '/images/editorial/version-b/';
const vjEditorial = '/images/editorial/vj/';

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
  image: string;
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
    themeColor: '#B08A52',
    image: `${vjEditorial}jewellery-hero.jpg`,
    heroHeading: 'Heirloom Splendour.\nArtisanal Adornment.',
    heroSubheading: 'Exquisite bridal necklaces, chandelier earrings, and statement rings curated for celebration, tradition, and generational keep.',
    accentBg: '#F8F4EC',
    accentBorder: '#E5D6BD',
    accentText: '#8E6C3A',
    highlights: [
      { title: 'Artisanal Kundan & Polki', desc: 'Crafted with premium high-micron plating and lustrous semi-precious stones.' },
      { title: 'Festive & Celebration', desc: 'Curated sets designed to elevate wedding festivities and contemporary evening wear.' },
      { title: 'Skin-Tested Alloys', desc: 'Hypoallergenic base alloys formulated for lightweight all-day celebration comfort.' },
    ],
  },
  {
    id: 'women_suits',
    label: "Shop Women's Suits",
    brand: 'VJ Suits & Fabrics',
    tagline: 'Pure cotton, silk, organza, Banarasi, rayon & wool',
    path: '/shop?department=women_suits',
    landingPath: '/department/women_suits',
    description: 'Ladies unstitched salwar suit materials, pure breathable cottons, festive silks, sheer organza, Banarasi brocades, rayon, and winter wools with coordinating dupattas.',
    themeColor: '#B96F55',
    image: `${vjEditorial}suits-hero.jpg`,
    heroHeading: 'The Pure Weave.\nUnstitched Salwar Suits.',
    heroSubheading: 'Authentic handloom textiles and ladies unstitched 3-piece suit materials ready to be tailored to your personalized grace.',
    accentBg: '#FAF1ED',
    accentBorder: '#E6C6BC',
    accentText: '#97553F',
    highlights: [
      { title: 'Six Signature Fabrics', desc: 'Guaranteed pure natural cotton, mulberry silk, sheer organza, Banarasi zari, fluid rayon, and winter wool.' },
      { title: 'Complete 3-Piece Sets', desc: 'Generously measured top, bottom, and matching dupatta lengths for full tailoring freedom.' },
      { title: 'Tailoring Freedom', desc: 'Unstitched yardage allows personalized silhouette fitting, custom necklines, and sleeve styling.' },
    ],
  },
  {
    id: 'home_textiles',
    label: 'Shop Home Textiles',
    brand: 'VJ Living',
    tagline: 'Cotton bedsheets, single top sheets & pillow covers',
    path: '/shop?department=home_textiles',
    landingPath: '/department/home_textiles',
    description: 'Pure breathable cotton bedding, double bedsheet sets with pillow covers, single bedsheets with pillow, 60×90 top sheets (odhne wali chaddars), and pillow covers.',
    themeColor: '#263D32',
    image: `${vjEditorial}living-hero.jpg`,
    heroHeading: 'Sanctuary Living.\nPure Cotton Bedding.',
    heroSubheading: 'Cool, breathable double bedsheets with pillow covers, single bedsheets, 60×90 top sheets, and tailored pillow covers for restful serenity.',
    accentBg: '#EDF2EE',
    accentBorder: '#CAD6CE',
    accentText: '#263D32',
    highlights: [
      { title: '100% Breathable Cotton', desc: 'Skin-friendly natural fibers that stay cool and soften beautifully with every wash.' },
      { title: 'Handwritten 60 × 90 Chaddar', desc: 'Single-bed top sheets recorded as 60 × 90; dimension and unit stored separately for owner verification.' },
      { title: 'Tailored Pillow Covers', desc: 'Coordinated pillow pairs with deep envelope closures designed for lasting durability.' },
    ],
  },
  {
    id: 'kids',
    label: "Shop Children's Clothing",
    brand: 'Little Loom',
    tagline: 'Everyday handcrafted comfort for newborn to 6 years',
    path: '/shop?department=kids',
    landingPath: '/department/kids',
    description: 'Soft, organic cotton rompers, dresses, and lounge sets created with mindful love for babies and growing toddlers.',
    themeColor: '#A7AD97',
    image: `${editorial}hero-desktop.webp`,
    heroHeading: 'Small Humans.\nGentle Outfits.',
    heroSubheading: 'Mindful, cloud-soft everyday playwear and milestone pieces designed for freedom of movement and tender skin.',
    accentBg: '#F3F5F0',
    accentBorder: '#D8DCD1',
    accentText: '#5A634C',
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
  { slug: 'necklace-sets', label: 'Necklace Sets & Chokers', value: 'Necklace Sets', department: 'jewellery', image: `${vjEditorial}jewellery-necklace.jpg`, introduction: 'Artisanal kundan, polki, and gemstone necklace sets with matching earrings.', featured: true },
  { slug: 'earrings', label: 'Earrings, Jhumkas & Studs', value: 'Earrings', department: 'jewellery', image: `${vjEditorial}jewellery-earrings.jpg`, introduction: 'From delicate everyday hoops and studs to grand statement jhumkas.', featured: true },
  { slug: 'rings', label: 'Artisanal Rings', value: 'Rings', department: 'jewellery', image: `${vjEditorial}jewellery-rings.jpg`, introduction: 'Handcrafted rings in adjustable and tailored fixed sizes.', featured: true },
];

export const womenSuitsCategories: DepartmentCategory[] = [
  { slug: 'womens-unstitched-suits', label: "All Unstitched Suits", value: "Women's Unstitched Suits", department: 'women_suits', image: `${vjEditorial}suits-fabrics.jpg`, introduction: 'Complete 3-piece unstitched salwar suit fabrics with coordinating dupattas.', featured: true },
  { slug: 'cotton-suits', label: 'Pure Cotton Suits', value: 'Cotton Suits', department: 'women_suits', image: `${vjEditorial}suits-cotton.jpg`, introduction: 'All-day breathable pure cotton unstitched sets with soft dupattas.', featured: true },
  { slug: 'silk-suits', label: 'Festive Silk Suits', value: 'Silk Suits', department: 'women_suits', image: `${vjEditorial}suits-silk.jpg`, introduction: 'Lustrous mulberry, tussar, and chanderi silk fabric sets.', featured: true },
  { slug: 'organza-suits', label: 'Organza Suits', value: 'Organza Suits', department: 'women_suits', image: `${vjEditorial}suits-organza.jpg`, introduction: 'Ethereal sheer organza dress materials with artisanal threadwork.' },
  { slug: 'banarasi-suits', label: 'Banarasi Brocade Suits', value: 'Banarasi Suits', department: 'women_suits', image: `${vjEditorial}suits-banarasi.jpg`, introduction: 'Heritage Banarasi weaves featuring rich zari floral motifs.', featured: true },
  { slug: 'rayon-suits', label: 'Soft Rayon Suits', value: 'Rayon Suits', department: 'women_suits', image: `${vjEditorial}suits-rayon.jpg`, introduction: 'Fluid, effortless-drape rayon suit lengths.' },
  { slug: 'wool-suits', label: 'Winter Woollen Suits', value: 'Wool Suits', department: 'women_suits', image: `${vjEditorial}suits-wool.jpg`, introduction: 'Warm, cozy woollen unstitched suits for cool seasons.' },
];

export const homeTextilesCategories: DepartmentCategory[] = [
  { slug: 'cotton-bedsheets', label: 'Pure Cotton Bedsheets', value: 'Cotton Bedsheets', department: 'home_textiles', image: `${vjEditorial}living-bedsheet.jpg`, introduction: 'Crisp, breathable natural cotton bedsheets for tranquil sleep.', featured: true },
  { slug: 'double-bedsheets-pillow-covers', label: 'Double Bedsheets with Pillow Covers', value: 'Double Bedsheets with Pillow Covers', department: 'home_textiles', image: `${vjEditorial}living-double-bedsheet.jpg`, introduction: 'Double bed sets paired with matching tailored pillow covers.', featured: true },
  { slug: 'single-bedsheets-pillow', label: 'Single Bedsheets with Pillow', value: 'Single Bedsheets with Pillow', department: 'home_textiles', image: `${vjEditorial}living-single-bedsheet.jpg`, introduction: 'Comfortable single bedsheets paired with matching pillow cover.', featured: true },
  { slug: 'single-bed-top-sheets', label: 'Single Bed Top Sheets / Chaddars (60 × 90)', value: 'Single Bed Top Sheets / Chaddars', department: 'home_textiles', image: `${vjEditorial}living-chaddar.jpg`, introduction: 'Handcrafted single-bed top sheets / odhne wali chaddars in pure cotton (handwritten specification 60 × 90; unit awaiting owner confirmation).', featured: true },
  { slug: 'pillow-covers', label: 'Separate Pillow Covers', value: 'Pillow Covers', department: 'home_textiles', image: `${vjEditorial}living-pillows.jpg`, introduction: 'Separate tailored pillow covers with durable envelope closures.', featured: true },
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

export function getCanonicalDepartmentId(value?: string | null): Department | undefined {
  if (!value) return undefined;
  const lower = value.trim().toLowerCase();
  // Exact canonical IDs
  if (lower === 'jewellery' || lower === 'women_suits' || lower === 'home_textiles' || lower === 'kids') {
    return lower as Department;
  }
  const slug = filterSlug(lower);
  const aliases: Record<string, Department> = {
    // VJ Jewellery
    jewellery: 'jewellery',
    jewelry: 'jewellery',
    'vj-jewellery': 'jewellery',
    'vj_jewellery': 'jewellery',
    jewel: 'jewellery',
    // VJ Suits & Fabrics
    suits: 'women_suits',
    'women-suits': 'women_suits',
    women_suits: 'women_suits',
    'womens-suits': 'women_suits',
    womens_suits: 'women_suits',
    'vj-suits-fabrics': 'women_suits',
    'vj_suits_fabrics': 'women_suits',
    'ladies-suits': 'women_suits',
    'salwar-suits': 'women_suits',
    'unstitched-suits': 'women_suits',
    fabrics: 'women_suits',
    fabric: 'women_suits',
    // VJ Living
    living: 'home_textiles',
    'vj-living': 'home_textiles',
    'vj_living': 'home_textiles',
    'home-textiles': 'home_textiles',
    home_textiles: 'home_textiles',
    'bed-sheets': 'home_textiles',
    bedsheets: 'home_textiles',
    bedding: 'home_textiles',
    textiles: 'home_textiles',
    // Little Loom
    'little-loom': 'kids',
    little_loom: 'kids',
    littleloom: 'kids',
    kids: 'kids',
    kid: 'kids',
    childrenswear: 'kids',
    'childrens-clothing': 'kids',
    children: 'kids',
  };

  if (aliases[lower]) return aliases[lower];
  if (aliases[slug]) return aliases[slug];
  const underscoreSlug = lower.replace(/[^a-z0-9_]/g, '');
  if (aliases[underscoreSlug]) return aliases[underscoreSlug];
  return undefined;
}

export function resolveDepartment(value?: string | null): DepartmentInfo | undefined {
  if (!value) return undefined;
  const canonicalId = getCanonicalDepartmentId(value);
  if (canonicalId) {
    return departments.find((d) => d.id === canonicalId);
  }
  const slug = filterSlug(value);
  return departments.find(
    (department) =>
      department.id === value ||
      filterSlug(department.label) === slug ||
      filterSlug(department.brand) === slug
  );
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
