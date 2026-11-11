export type AgeGroup = string;

export type Category = string;

export interface ColorOption {
  name: string;
  hex?: string;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: Category;
  ages: AgeGroup[];
  sizes: string[];
  colors: ColorOption[];
  images: string[];
  imageSrcSets?: string[];
  description: string;
  fabric: string;
  care: string;
  sizeMeasurements?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  tags?: string[];
  collections?: string[];
  variants?: ProductVariant[];
  inStock?: boolean;
  imageAltTexts?: string[];
  /** Local-only catalogue preview product. Never persist as a database product. */
  isDemo?: boolean;
}

export interface ProductVariant {
  id: string;
  sku: string;
  size: string;
  colour: string;
  price?: number;
  available?: boolean;
}

export interface CartItem {
  productId: string;
  slug: string;
  name: string;
  price: number;
  image: string;
  color: string;
  size: string;
  quantity: number;
  variantId?: string;
  /** Demo items stay in the browser and must never reach checkout APIs. */
  isDemo?: boolean;
}

export interface AgeInfo {
  id: AgeGroup;
  label: string;
  range: string;
  image: string;
  description: string;
}

export interface CategoryInfo {
  id: Category;
  name: string;
  image: string;
  description?: string;
  span: 'tall' | 'wide' | 'normal';
}
