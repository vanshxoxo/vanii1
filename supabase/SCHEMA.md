# Little Loom database schema

The three SQL files in `migrations/` are the source of truth. Apply them in timestamp order. This overview describes the entities, foreign-key ownership and access rules; it does not replace the migrations.

| Domain | Tables/views | Relationships and purpose |
| --- | --- | --- |
| Customers and addresses | `customers`, `customer_addresses`, `profiles` view | Customer profile key references `auth.users`; saved addresses are customer-owned; checkout writes a separate immutable `shipping_addresses` snapshot per order. |
| Catalog | `products`, `product_variants`, `categories`, `product_categories`, `product_sizes`, `product_colors`, `product_attributes`, `collections`, `collection_products` | Variants belong to products and have unique SKU/product-size-color combinations. Categories and collections are many-to-many through join tables. Product options are materialized from existing variant values at migration time. |
| Product media | `media_assets`, `product_media`, `collection_media`, `product_images` view | Metadata references external provider IDs, CDN URLs, hashes, dimensions, formats and responsive variants; binaries remain in ImageKit. Galleries preserve order, featured image, view and alt text. Foreign keys and locked reference checks protect shared media from deletion. Legacy Cloudinary rows remain supported. |
| Stock | `inventory`, `inventory_movements`, `stock_reservations` | One inventory row per variant; reservation rows are linked to order and variant; an inventory trigger records stock deltas. Checkout reserves stock atomically; payment/COD collection commits it; cancellation releases it. |
| Customers' active state | `carts`, `cart_items`, `wishlists`, `wishlist_items` | Carts and wishlist rows belong to one customer. Checkout idempotency key is stored in Postgres on the cart/order, not browser storage. |
| Orders | `orders`, `order_items`, `order_status_history` | Orders snapshot product/price/variant/address details; customer ownership is indexed; status changes are validated and recorded with actor/source. |
| Payments and refunds | `payments`, `payment_transactions`, `refunds`, `payment_webhook_events` | One payment per order in the current checkout flow; provider IDs are unique where present; transaction rows record state changes; refund requests use unique idempotency keys and cannot exceed captured amount. |
| Fulfillment | `shipments`, `shipping_details` view | One Shiprocket shipment per order in this version; stores provider order/shipment IDs, AWB, courier, status, tracking URL and minimal provider status data. |
| Store content | `homepage_sections`, `banners`, `promotional_content`, `campaigns`, `navigation_menus`, `navigation_menu_items`, `policies`, `faqs`, `newsletter_subscribers` | Published content can be read publicly; write access is role-gated. Newsletter is only recorded as pending; no marketing email service is connected. |
| Store configuration | `store_settings` | Public COD settings are visible to checkout; updates require admin role. COD starts disabled. |
| Administration | `admin_roles`, `permissions`, `role_permissions`, `admin_users`/`user_roles` views, `audit_logs` | Roles cover owner/admin/catalog/media/orders. Owner assignment cannot be performed by the client. Sensitive catalog/content/settings/role writes create audit rows. |

## Access model

- Anonymous users can read only published catalog and published content, and public storefront media. They cannot read customer, cart, order, payment, inventory, or admin tables.
- Authenticated customers can access only their own profile, saved addresses, cart, wishlist, orders, order lines, payment references, refunds and shipment status.
- Catalog, media and order-manager roles get their specific RLS policies. Admins inherit non-owner capabilities; only owners can grant or remove admin roles.
- Payment status and refund/shipping provider references are written by trusted Edge Functions or Postgres functions. Public and authenticated clients cannot directly insert or alter payment transaction rows.
- Storefront binaries are never uploaded to Supabase Storage. ImageKit upload authorization and server-side deletion require an owner/admin/media-manager role; delete requests lock the asset and reject any media still attached to products, collections, categories, homepage content or banners.

## Known boundaries

- Coupons/discount rules, tax calculation, automated return stock restocking, email delivery, and shipping event webhooks are not activated. Shipping creation and API polling are prepared; provider credentials/account configuration and end-to-end validation are still required.
- Store currency and shipping pricing are currently INR with existing server-side shipping thresholds. Change these policies before taking orders if they do not match actual business terms.
