import type { ComponentType } from 'react';
import {
  LayoutDashboard,
  CheckCircle2,
  Package,
  PlusCircle,
  Tags,
  Layers,
  Images,
  Boxes,
  ShoppingBag,
  Users,
  Percent,
  Clock,
  Truck,
  Navigation,
  Compass,
  RotateCcw,
  CreditCard,
  RefreshCw,
  FileSpreadsheet,
  BarChart3,
  Home,
  Store,
  FileText,
  HelpCircle,
  TrendingUp,
  Headphones,
  Bell,
  Settings,
  Wallet,
  PackageCheck,
  ShieldCheck,
} from 'lucide-react';

export type AdminSectionId =
  // WORKSPACE
  | 'overview'
  | 'getting-started'
  // PRODUCTS
  | 'products'
  | 'add-product'
  | 'categories'
  | 'collections'
  | 'media'
  | 'stock'
  // SALES
  | 'orders'
  | 'customers'
  | 'discounts'
  | 'abandoned-checkouts'
  // DELIVERY
  | 'shipping-dashboard'
  | 'shipments'
  | 'tracking'
  | 'returns'
  // FINANCE
  | 'payments'
  | 'refunds'
  | 'transactions'
  | 'sales-reports'
  // WEBSITE
  | 'homepage'
  | 'departments'
  | 'content'
  | 'policies-faqs'
  // BUSINESS
  | 'analytics'
  | 'support'
  | 'notifications'
  // SETTINGS
  | 'settings'
  | 'payment-settings'
  | 'shipping-settings'
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
      {
        id: 'getting-started',
        label: 'Getting Started',
        icon: CheckCircle2,
      },
    ],
  },
  {
    title: 'PRODUCTS',
    items: [
      {
        id: 'products',
        label: 'All Products',
        icon: Package,
        badge: (data) => (data?.total_products ? data.total_products : null),
      },
      {
        id: 'add-product',
        label: 'Add Product',
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
        label: 'Photos & Uploads',
        icon: Images,
      },
      {
        id: 'stock',
        label: 'Stock & Sizes',
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
      {
        id: 'abandoned-checkouts',
        label: 'Abandoned Checkouts',
        icon: Clock,
      },
    ],
  },
  {
    title: 'DELIVERY',
    items: [
      {
        id: 'shipping-dashboard',
        label: 'Shipping Dashboard',
        icon: Truck,
      },
      {
        id: 'shipments',
        label: 'Shipments',
        icon: Navigation,
      },
      {
        id: 'tracking',
        label: 'Live Tracking',
        icon: Compass,
      },
      {
        id: 'returns',
        label: 'Returns & RTO',
        icon: RotateCcw,
      },
    ],
  },
  {
    title: 'FINANCE',
    items: [
      {
        id: 'payments',
        label: 'Payments',
        icon: CreditCard,
      },
      {
        id: 'refunds',
        label: 'Refunds',
        icon: RefreshCw,
      },
      {
        id: 'transactions',
        label: 'Transactions',
        icon: FileSpreadsheet,
      },
      {
        id: 'sales-reports',
        label: 'Sales Reports',
        icon: BarChart3,
      },
    ],
  },
  {
    title: 'WEBSITE',
    items: [
      {
        id: 'homepage',
        label: 'Homepage Editor',
        icon: Home,
      },
      {
        id: 'departments',
        label: 'Department Management',
        icon: Store,
      },
      {
        id: 'content',
        label: 'Banners & Promotional',
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
        label: 'Customer Support',
        icon: Headphones,
      },
      {
        id: 'notifications',
        label: 'Notifications',
        icon: Bell,
      },
    ],
  },
  {
    title: 'SETTINGS',
    items: [
      {
        id: 'settings',
        label: 'Store Settings',
        icon: Settings,
      },
      {
        id: 'payment-settings',
        label: 'Payment Settings',
        icon: Wallet,
      },
      {
        id: 'shipping-settings',
        label: 'Shipping Settings',
        icon: PackageCheck,
      },
      {
        id: 'roles',
        label: 'Team & Access',
        icon: ShieldCheck,
        requiredRoles: ['owner', 'admin'],
      },
    ],
  },
];
