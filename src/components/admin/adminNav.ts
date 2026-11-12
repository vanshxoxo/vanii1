import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  Package,
  PlusCircle,
  Tags,
  Layers,
  Images,
  Boxes,
  ShoppingBag,
  Users,
  Percent,
  Home,
  FileText,
  HelpCircle,
  TrendingUp,
  Headphones,
  Settings,
  ShieldCheck,
} from 'lucide-react';

export type AdminSectionId =
  | 'overview'
  | 'products'
  | 'add-product'
  | 'categories'
  | 'collections'
  | 'media'
  | 'stock'
  | 'orders'
  | 'customers'
  | 'discounts'
  | 'homepage'
  | 'content'
  | 'policies-faqs'
  | 'analytics'
  | 'support'
  | 'settings'
  | 'roles';

export interface AdminNavItem {
  id: AdminSectionId;
  label: string;
  icon: ComponentType<{ className?: string }>;
  badge?: (data: any) => string | number | null;
  requiredRoles?: string[];
}

export interface AdminNavGroup {
  title: string;
  items: AdminNavItem[];
}

export const ADMIN_NAV_GROUPS: AdminNavGroup[] = [
  {
    title: 'WORKSPACE',
    items: [
      {
        id: 'overview',
        label: 'Overview',
        icon: LayoutDashboard,
      },
    ],
  },
  {
    title: 'PRODUCTS',
    items: [
      {
        id: 'products',
        label: 'All products',
        icon: Package,
        badge: (data) => (data?.total_products ? data.total_products : null),
      },
      {
        id: 'add-product',
        label: 'Add new product',
        icon: PlusCircle,
      },
      {
        id: 'categories',
        label: 'Categories',
        icon: Tags,
      },
      {
        id: 'collections',
        label: 'Collections',
        icon: Layers,
      },
      {
        id: 'media',
        label: 'Photos & uploads',
        icon: Images,
      },
      {
        id: 'stock',
        label: 'Stock & sizes',
        icon: Boxes,
        badge: (data) => (data?.out_of_stock_variants ? `! ${data.out_of_stock_variants}` : null),
      },
    ],
  },
  {
    title: 'SALES',
    items: [
      {
        id: 'orders',
        label: 'Orders',
        icon: ShoppingBag,
        badge: (data) => (data?.total_orders ? data.total_orders : null),
      },
      {
        id: 'customers',
        label: 'Customers',
        icon: Users,
      },
      {
        id: 'discounts',
        label: 'Discounts',
        icon: Percent,
      },
    ],
  },
  {
    title: 'WEBSITE',
    items: [
      {
        id: 'homepage',
        label: 'Homepage editor',
        icon: Home,
      },
      {
        id: 'content',
        label: 'Banners & promotional',
        icon: FileText,
      },
      {
        id: 'policies-faqs',
        label: 'Policies and FAQs',
        icon: HelpCircle,
      },
    ],
  },
  {
    title: 'BUSINESS',
    items: [
      {
        id: 'analytics',
        label: 'Analytics',
        icon: TrendingUp,
      },
      {
        id: 'support',
        label: 'Customer support',
        icon: Headphones,
      },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      {
        id: 'settings',
        label: 'Store settings',
        icon: Settings,
      },
      {
        id: 'roles',
        label: 'Team and access',
        icon: ShieldCheck,
        requiredRoles: ['owner'],
      },
    ],
  },
];
