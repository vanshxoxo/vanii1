export type AgeGroup = 'Newborn' | 'Baby' | 'Toddler' | 'Little Kids';

export type Category =
  | 'Rompers'
  | 'Co-ord Sets'
  | 'Tees & Tops'
  | 'Dresses'
  | 'Bottoms'
  | 'Sleepwear';

export interface ColorOption {
  name: string;
  hex: string;
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
  description: string;
  fabric: string;
  care: string;
  isNew?: boolean;
  isBestseller?: boolean;
  tags?: string[];
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
  span: 'tall' | 'wide' | 'normal';
}
