export type AgeGroup = string;

export type Category = string;

export type Department = 'kids' | 'jewellery' | 'women_suits' | 'home_textiles';
export type ProductType = Department;

export interface ColorOption {
  name: string;
  hex?: string;
}

export interface JewellerySpecs {
  subcategory?: 'necklace_sets' | 'earrings' | 'rings' | string;
  material?: string;
  plating?: string;
  platingFinish?: string;
  pieceCount?: number | string;
  piecesCount?: number | string;
  color?: string;
  setContents?: string;
  careInstructions?: string;
  care?: string;
  earringType?: string;
  closureType?: string;
  ringSize?: string;
  isAdjustable?: boolean;
}

export interface WomenSuitsSpecs {
  fabricType?: 'Cotton' | 'Silk' | 'Organza' | 'Banarasi' | 'Rayon' | 'Wool' | string;
  color?: string;
  pattern?: string;
  suitPieces?: string;
  piecesIncluded?: string;
  topLength?: number | string;
  topLengthUnit?: 'meters' | 'yards' | string;
  bottomLength?: number | string;
  bottomLengthUnit?: 'meters' | 'yards' | string;
  lengthUnit?: string;
  dupattaIncluded?: boolean;
  dupattaFabric?: string;
  dupattaLength?: number | string;
  dupattaLengthUnit?: 'meters' | 'yards' | string;
  dupattaUnit?: string;
  washCare?: string;
}

export interface HomeTextilesSpecs {
  productType?: string;
  textileType?: 'bedsheet' | 'top_sheet' | 'pillow_cover' | string;
  bedSize?: 'Single' | 'Double' | 'Queen' | 'King' | string;
  length?: number | string;
  width?: number | string;
  dimensionUnit?: 'inches' | 'cm' | 'meters' | string;
  fabric?: string;
  color?: string;
  design?: string;
  pillowCoversCount?: number | string;
  pillowCoverDimensions?: string;
  packQuantity?: number | string;
  closureType?: string;
}

export interface ProductSpecifications {
  jewellery?: JewellerySpecs;
  womenSuits?: WomenSuitsSpecs;
  homeTextiles?: HomeTextilesSpecs;
  [key: string]: unknown;
}

export interface Product {
  id: string;
  slug: string;
  name: string;
  price: number;
  originalPrice?: number;
  category: Category;
  department?: Department;
  productType?: Department;
  specifications?: ProductSpecifications;
  ages: AgeGroup[];
  sizes: string[];
  colors: ColorOption[];
  images: string[];
  imageSrcSets?: string[];
  description: string;
  fabric: string;
  material?: string;
  care: string;
  sizeMeasurements?: string;
  isNew?: boolean;
  isBestseller?: boolean;
  tags?: string[];
  collections?: string[];
  variants?: ProductVariant[];
  inStock?: boolean;
  imageAltTexts?: string[];
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
  department?: Department;
  kind?: 'product' | 'age';
}
