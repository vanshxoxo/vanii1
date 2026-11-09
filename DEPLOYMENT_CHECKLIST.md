# Little Loom deployment checklist

## Before customer use

- [ ] Upgrade the Vercel Hobby project to a plan permitted for commercial use.
- [ ] Create separate Supabase Preview and Production projects.
- [ ] Apply migrations `202611090001`, `202611090002`, and `202611090003` in timestamp order in each project.
- [ ] Confirm RLS is enabled, create the first owner, configure Supabase email confirmation/reset URLs, and verify mail delivery.
- [ ] Configure Vercel's Production Branch as `main`, production domain `https://vanii1.vercel.app`, Vite build `npm run build`, output `dist`, and SPA refresh rewrite.
- [ ] Add the Preview and Production Supabase URL/publishable-key variables to the matching Vercel environments. Keep service-role and provider secrets server-side.
- [ ] Set exact per-project `STOREFRONT_ORIGIN` and the corresponding `SUPABASE_ENVIRONMENT` Edge Function secret.
- [ ] Set Cloudinary secrets in Supabase Edge Function secrets for each environment and deploy the `media` function.
- [ ] Create/publish actual product catalog, sizes, colors, Cloudinary product media, inventory, categories, policies, FAQs, homepage sections and banners.
- [ ] Verify signed upload, provider-side optimized variants, CDN delivery, duplicate reuse, gallery editing and unreferenced-only deletion. No storefront media bucket is needed in Supabase Storage.

## Payment and fulfillment rehearsal

- [ ] Configure Razorpay test keys/webhook in Preview and deploy checkout, verification, webhook and refund functions.
- [ ] Test paid, failed, duplicate callback, duplicate webhook, webhook replay, partial refund, full refund, COD and COD collection.
- [ ] Verify stock holds, commit/release movements, order status history, payment transactions and idempotency.
- [ ] Configure Shiprocket API account, pickup location and actual parcel dimensions in Preview secrets.
- [ ] Test shipment creation, duplicate request protection, AWB assignment, tracking refresh and delivered state.
- [ ] Schedule `select public.expire_stale_payment_orders();` every 10 minutes; verify it releases stale unpaid reservations and does not expire COD orders.
- [ ] Test customer-to-customer isolation, manager permissions, owner-only role grants, and referenced-media delete protection.
- [ ] Run `npm run lint`, `npm run typecheck`, `npm run build`, then test the complete Preview journey on desktop and mobile.

## Production readiness

- [ ] Confirm Vercel plan is eligible for commercial store traffic and configure usage alerts/limits.
- [ ] Configure production Shiprocket credentials and validate pickup address, packaging, COD remittance, return handling and tracking.
- [ ] Configure production Razorpay live credentials and register the signed webhook endpoint for `payment.captured`, `payment.failed`, `refund.processed`, and `refund.failed`.
- [ ] Verify signed production webhook deliveries and reconcile them against stored events before enabling live payments.
- [ ] Keep `PAYMENTS_LIVE_ENABLED` and `PAYMENTS_LIVE_WEBHOOK_VERIFIED` false until the preceding checks pass.
- [ ] Review production backup/restore, Supabase logs, admin audit logs, customer support contact details, legal policies, shipping/return promises and refund handling.
- [ ] Review the Vercel Production deployment preview; promote only after owner approval. Do not deploy automatically from this checklist.
