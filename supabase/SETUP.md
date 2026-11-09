# Little Loom production setup

This repository is prepared for the existing Vercel project `vanii1` and the production domain `https://vanii1.vercel.app`. No Supabase, Razorpay, Shiprocket account has been connected, no secret is committed, and this repository has not been deployed.

## Architecture and project state

- The Vite/React storefront is deployed as a static app on Vercel. `vercel.json` rewrites application routes to `index.html` so direct navigation and refresh work. Supabase Postgres stores commerce records and media references; Cloudinary stores and delivers product images, banners and videos. Browser storage is not used for business records. Guest cart changes are in-memory only. Customers must sign in to check out.
- Server-side payment, shipping and media handlers are Supabase Edge Functions. Vercel does not need an `/api` secret-bearing route. The browser only receives the Supabase URL and publishable key. The Supabase service-role key, Cloudinary credentials, Razorpay keys, and Shiprocket credentials must never be placed in a `VITE_*` variable.
- `202611090001_initial_commerce.sql` creates the base catalog, auth, carts, orders, inventory and payment model. `202611090002_production_commerce_extensions.sql` adds editorial content, policies, FAQs, permissions, role permissions and audit logging. `202611090003_external_media_architecture.sql` adds external media lifecycle controls and safe deletion. Apply all three in timestamp order.
- Existing equivalent structures are reused: `customers` backs the `profiles` view; `admin_roles` backs `user_roles`/`admin_users`; `product_media` backs the `product_images` view; `shipments` backs the `shipping_details` view. These aliases do not copy rows.

## Database schema overview

| Area | Tables and relationships |
| --- | --- |
| Accounts | `customers` references `auth.users`; `customer_addresses` and `wishlists` belong to a customer; `wishlist_items` links products. |
| Catalog | `products` has variants, categories, sizes, colors, attributes, gallery media, and collection membership. `product_variants` has an inventory row and movement history. |
| Inventory | `inventory` stores on-hand/reserved totals; `inventory_movements` audits stock changes; `stock_reservations` ties each checkout hold to an order and variant. |
| Orders | `orders` owns immutable `order_items`, a `shipping_addresses` snapshot, status history, payment, and shipping records. Customer/order ownership is enforced with RLS. |
| Payments | `payments` stores provider status and references; `payment_transactions` stores status events; `refunds` has an idempotency key and provider reference; `payment_webhook_events` deduplicates webhook deliveries. |
| Shipping | `shipments` stores Shiprocket order/shipment IDs, AWB, status, courier and tracking URL. `shipping_details` is a compatibility view. |
| Media | `media_assets` stores Cloudinary public IDs, secure URLs, dimensions, format, checksum and generated variant references. `product_media` links multiple shared media files to products with gallery order and featured image state. No media binaries are stored in Postgres or Supabase Storage. |
| Content | `homepage_sections`, `banners`, `promotional_content`, `navigation_menus`/`navigation_menu_items`, `policies`, `faqs`, `collections`, and `campaigns`. |
| Administration | `admin_roles`, `permissions`, `role_permissions`, and `audit_logs`. Role assignment is protected from storefront self-escalation. |

Every table containing customer, order, inventory, payment, or admin data has row-level security. Public catalog reads are limited to published records. Payment/refund state changes use server functions. Order staff can update only the order status column, with transition checks in Postgres.

## Supabase project and migrations

1. Create a Supabase project in the intended data region. Use separate Supabase projects for Preview and Production so test keys and test orders cannot reach production data.
2. In **Project Settings → API**, copy the project URL and publishable key (older projects may label it `anon/public`). Put only those browser-safe values into local `.env.local` and Vercel's `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. Apply all three SQL files in `supabase/migrations/` in timestamp order from the SQL editor, or use the Supabase CLI (`supabase link` then `supabase db push`). Do not use a database reset command on production. Verify all migrations complete before adding frontend environment variables.
4. Create the first customer account at `/account`, then promote that account to owner in the Supabase SQL editor:

```sql
insert into public.admin_roles (user_id, role)
select id, 'owner' from auth.users where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id, role) do nothing;
```

5. In **Authentication → URL Configuration**, set Site URL to `https://vanii1.vercel.app` and add `https://vanii1.vercel.app/**`, `https://*.vercel.app/**`, and `http://localhost:5173/**` to Redirect URLs. Keep the production redirect list to domains you control.
6. Set up email confirmation, password reset templates and the production sender before opening signup to customers. Confirm reset links return to `/account`.

## External media storage and CDN

Cloudinary and ImageKit both document server-generated upload authentication, CDN delivery, resizing and automatic format optimization. Cloudinary was selected for this first adapter because its signed direct-upload flow lets the existing admin upload large originals to the provider without routing binary files through Postgres, Supabase Storage or a serverless request body. ImageKit remains a viable alternate provider; the storefront uses a provider-neutral media URL function so it can be added behind the same metadata contract. [Cloudinary signed upload docs](https://cloudinary.com/documentation/client_side_uploading), [ImageKit upload auth docs](https://imagekit.io/docs/integration/javascript), [ImageKit optimization docs](https://imagekit.io/docs/image-optimization).

Cloudinary is the dedicated original-file store and CDN for product images, banners and videos. Supabase stores metadata and stable provider references only; media binaries are never written to Postgres or Supabase Storage. Admins request signed upload authorization from the `media` Edge Function, then upload directly to Cloudinary. The API secret remains server-side. The Edge Function verifies Cloudinary's asset metadata before recording the media row. SHA-256 checks avoid repeat uploads; deterministic public IDs avoid concurrent duplicates. Admins can reuse assets across products, reorder galleries, set featured images and replace gallery links. Deleting a product removes its gallery relationship only. Provider deletion locks and rechecks product, category, collection, CMS and banner references before deleting an unshared asset.

Cloudinary `f_auto,q_auto` delivery negotiates WebP/AVIF where supported, and width-specific CDN URLs generate/cache responsive sizes and thumbnail crops on demand. [Cloudinary signed uploads](https://cloudinary.com/documentation/client_side_uploading), [responsive image delivery](https://cloudinary.com/documentation/responsive_html), [server-side asset deletion](https://cloudinary.com/documentation/delete_assets).

No Cloudinary account or credentials are assumed. When ready, set `MEDIA_PROVIDER=cloudinary`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` as Supabase Edge Function secrets separately in Preview and Production. Do not set these in Vercel's browser environment. Back up original media and preserve provider IDs, checksums, delivery URLs and gallery references separately: database backups alone cannot restore media binaries. Before a provider change, export originals and metadata, copy files to the new provider, verify checksums and gallery links, then switch provider settings/URLs. Storefront components use a provider abstraction so galleries do not depend on Cloudinary URL syntax.

## Vercel project `vanii1`

1. Check that Vercel's connected repository is the intended Little Loom GitHub repository, Production Branch is `main`, and the production domain is `https://vanii1.vercel.app`. The app uses Vite's `dist` output; no custom build command is needed (`npm run build`).
2. Configure **Preview** to use the separate Preview Supabase project and its publishable key. Configure **Production** to use the Production Supabase URL/key. Do not add service-role, Cloudinary, Razorpay, or Shiprocket secrets to Vercel browser variables.
3. `vercel.json` contains the single-page app fallback and static asset cache policy. The Supabase redirects/CORS origin and Edge Function secrets are configured in each matching Supabase project.
4. Validate Preview first using test credentials and a non-production catalog. Review the Vercel deployment, build output, direct-route refreshes (`/shop`, `/account`, `/orders`, `/admin`), and browser network errors. Promote via the existing Vercel workflow only after your approval. No deploy command is included here.

**Plan requirement:** Vercel documents the Hobby plan as personal/non-commercial use only; its terms restrict commercial use. A store taking orders is commercial use, so move `vanii1` to an eligible commercial Vercel plan before production sales. Do not treat this as a code setting. [Vercel Hobby plan](https://vercel.com/docs/plans/hobby), [Vercel fair-use guidelines](https://vercel.com/docs/limits/fair-use-guidelines).

## Environment variables

Copy the browser-safe `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` from `.env.example` into local `.env.local` and Vercel. `.env.*` is ignored by Git except `.env.example`. Add the following as **Supabase Edge Function secrets**, separately for Preview and Production:

| Group | Variables | Notes |
| --- | --- | --- |
| Application | `SUPABASE_ENVIRONMENT`, `STOREFRONT_ORIGIN` | Use `preview` and the exact preview hostname for Preview; `production` and `https://vanii1.vercel.app` for Production. |
| Cloudinary | `MEDIA_PROVIDER`, `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` | Supabase Edge Function secrets only. Never expose them to Vercel/browser code. |
| Razorpay | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PAYMENTS_MODE`, `PAYMENTS_LIVE_ENABLED`, `PAYMENTS_LIVE_WEBHOOK_VERIFIED` | Preview uses test keys and `PAYMENTS_MODE=test`. Production remains locked until the production live key ID, secret and verified webhook flags are set. |
| Shiprocket | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION`, `SHIPROCKET_DEFAULT_WEIGHT_KG`, `SHIPROCKET_DEFAULT_LENGTH_CM`, `SHIPROCKET_DEFAULT_BREADTH_CM`, `SHIPROCKET_DEFAULT_HEIGHT_CM` | Use an API user and an already configured pickup location. Validate default parcel dimensions against actual packed products. |
| Supabase runtime | `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` | Supabase Edge Functions provide these. Do not copy the service-role key to Vercel client settings or source files. |

`SUPABASE_ENVIRONMENT=production`, `PAYMENTS_MODE=live`, `PAYMENTS_LIVE_ENABLED=true`, and `PAYMENTS_LIVE_WEBHOOK_VERIFIED=true` are intentionally not safe defaults. Never copy Preview/test secrets into Production or use a Razorpay test key in Production.

## Razorpay payments, refunds and webhooks

1. Create a Razorpay test key pair and test webhook secret in the Razorpay dashboard, and enter them only in Preview Supabase Edge Function secrets. Keep `PAYMENTS_MODE=test` and `SUPABASE_ENVIRONMENT=preview`.
2. Deploy functions with the Supabase CLI: `supabase functions deploy checkout`, `supabase functions deploy verify-payment`, `supabase functions deploy razorpay-webhook`, `supabase functions deploy refund-payment`, `supabase functions deploy shiprocket`, and `supabase functions deploy media`.
3. Register the Preview webhook to `https://YOUR_PREVIEW_PROJECT_REF.supabase.co/functions/v1/razorpay-webhook`, select `payment.captured`, `payment.failed`, `refund.processed`, and `refund.failed`, and copy its webhook secret into that same project's secrets. `verify_jwt=false` is set only for the webhook endpoint, which validates Razorpay's HMAC against the raw request body.
4. Test order creation, duplicate submits, abandoned checkout, failed payment then retry, captured payment via both callback and webhook, replayed webhook event, full/partial refund and refund webhook. Inventory is reserved in Postgres, revalidated at checkout and committed only after captured payment; failed unpaid reservations can be expired by scheduling `select public.expire_stale_payment_orders();` every 10 minutes through Supabase Cron. Do not schedule this in a database that does not have the migration applied.
5. Only after production credentials are configured, the live webhook is registered, signed events are verified and full end-to-end checks pass should Production payment flags be enabled. Keep flags false until then.

The browser callback is not proof of payment. The server verifies Razorpay signature and fetches the payment status; `payment.captured` is also verified through the signed webhook. Event writes are idempotent. The refund API claims each refund request once and records a provider reference; ambiguous timeout requests require reconciliation before another request. A full refund updates order/payment status after Razorpay confirms it. Refunded inventory is not automatically returned to sellable stock; inspect and restock it through the inventory manager.

## Shiprocket setup

1. Create a Shiprocket API user, configure pickup origin and verify serviceability, return address, parcel dimensions and COD remittance in Shiprocket first.
2. Add the Shiprocket credentials, pickup name and checked parcel defaults to Supabase Edge Function secrets. Never put them in Vercel `VITE_*` variables.
3. Deploy `supabase functions deploy shiprocket`. The admin order screen creates one Shiprocket order per eligible paid/COD order, assigns an AWB and stores provider IDs. Both customer order history and admin can request tracking; tracking status is persisted. An ambiguous order-creation timeout is held for reconciliation to prevent duplicate Shiprocket orders.
4. Configure Shiprocket tracking webhooks in its dashboard only after confirming its current event/authentication contract for your account. Until then, the signed-in customer or order manager can refresh tracking through the API. The tracking endpoint uses the official `GET /v1/external/courier/track/awb/{awb_code}` API. [Shiprocket API documentation](https://apidocs.shiprocket.in/).

Shiprocket calls are not live-tested in this repository. Check order fields, pickup name, package measurements, tax/HSN requirements, courier serviceability, AWB generation and tracking with a sandbox/test order before using this for real parcels.

## Run locally and test the shopping flow

1. Install dependencies with `npm ci` and copy browser-safe values to `.env.local`.
2. Run `npm run dev` and open the Vite URL. Supabase Auth redirect URLs must include the local origin.
3. Add Cloudinary secrets to Supabase Edge Function secrets and deploy `media`. Seed product categories, products, variants, images and inventory using `/admin`. Product images/videos upload to Cloudinary; only metadata and references persist in Supabase.
4. Create a customer account, verify email, sign in, browse/search/filter published products, choose an available size/color, add to cart/wishlist, and refresh the page. Signed-in cart and wishlist should come back from Postgres.
5. Add an address and complete Preview Razorpay test checkout. Verify order ownership/history, order status history, payment transaction record, stock reservation and inventory movements. Repeat with a failed payment, webhook replay, COD order and COD collection.
6. In admin, edit product/category/media/CMS/policy/FAQ content; verify changes on the storefront, adjust stock, create a shipment, refresh tracking, and request a test refund. Verify users cannot access another customer's order or make their own account an admin.
7. Test database rules using separate customer, catalog-manager, media-manager, order-manager and owner accounts. Verify anonymous users can only read published catalog/content and public media. Test customer upload paths cannot cross user IDs.

No local Supabase CLI, Postgres server, Razorpay account, Shiprocket account, or credentials were available during preparation, so these integration checks remain to be run in the user's configured Preview project.

## Deployment checklist

- [ ] Move Vercel Hobby to a commercial plan before using the store for financial gain.
- [ ] Create separate Supabase Preview and Production projects; apply migrations `001`, `002`, and `003` to each in timestamp order.
- [ ] Create the first owner, set Auth mail/redirects, and test customer access and admin role separation.
- [ ] Configure Vercel Production Branch `main`, domain, output/build and environment variables; confirm direct route refresh.
- [ ] Add the actual catalog, product sizes/colors/attributes, media, inventory, policies, FAQs and homepage content.
- [ ] Configure Cloudinary secrets in Supabase Edge Function secrets and test signed uploads, deduplication, responsive CDN delivery, gallery reuse and reference-protected deletion.
- [ ] Configure Razorpay test secrets in Preview; test failure, duplicate, webhook, refund and inventory flows.
- [ ] Configure Shiprocket API user, pickup location, parcel values and test shipment/tracking.
- [ ] Schedule stale payment order expiration and verify reserved stock is released.
- [ ] Configure Production live secrets/webhooks only after a complete approved test cycle.
- [ ] Review Vercel Preview and production variables, database backups, logging, policies and operational returns/refunds process.
- [ ] Promote/redeploy Production only after review and explicit approval; this repository was not deployed by this task.
