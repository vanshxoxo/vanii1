# Little Loom setup and integration status

The repository contains a Vite storefront and Supabase migrations. The configured production target is `vanii1` / `https://vanii1.vercel.app`. This checkout has no Supabase project URL or publishable key, and the connected Vercel account could not access project `vanii1`; therefore migrations, environment settings, and deployments have not been verified or changed from this checkout.

## Architecture

- Supabase PostgreSQL stores commerce data and media metadata. Image and video binaries live in ImageKit and are delivered through its CDN. Existing Cloudinary asset rows remain readable for backwards compatibility; the Cloudinary upload function has been removed.
- ImageKit uploads are authorized by Vercel `/api/imagekit-auth`, uploaded directly from the browser, verified and registered by `/api/imagekit-register`, and deleted through `/api/imagekit-delete`. All three routes require a signed-in owner/admin/media_manager and the user's bearer token. The ImageKit private key remains server-side. A deletion RPC prevents deleting shared media.
- Payments and shipping are implemented as Supabase Edge Functions. Razorpay payment remains unavailable until its credentials/webhook are configured. Shiprocket remains unavailable until its account settings are configured.
- The browser only uses the Supabase project URL and publishable key. Business data belongs in PostgreSQL, not localStorage.

## Database

Apply these migrations, in order, to the intended Supabase project: `202611090001_initial_commerce.sql`, `202611090002_production_commerce_extensions.sql`, and `202611090003_external_media_architecture.sql`. They have not been confirmed applied. Use Supabase Dashboard SQL Editor or `supabase link` followed by `supabase db push`; do not reset a database with existing data. Then create the first owner by promoting the intended existing auth user:

```sql
insert into public.admin_roles (user_id, role)
select id, 'owner' from auth.users where email = 'YOUR_ADMIN_EMAIL'
on conflict (user_id, role) do nothing;
```

The migrations define catalog, variants, inventory and reservations, customer accounts/addresses, orders/items, payments/refunds, media assets and product relationships, homepage content, admin roles and audit logs. Review SQL migration output and RLS policies in the target project after applying. Set Supabase Auth Site URL and redirect URLs for the actual preview and production domains.

## Environment configuration

Copy `.env.example` to `.env.local` for local work. Configure separate Preview and Production values in Vercel. Use Vercel **Config** for public configuration and **Secret** for private values. Do not create `VITE_SUPABASE_SECRET_KEY` or expose any secret in `VITE_*`.

| Runtime | Variables | Notes |
| --- | --- | --- |
| Browser (local/Vercel) | `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY` | Required; the project URL is not available in this checkout. `VITE_SUPABASE_ANON_KEY` is supported as a legacy public-key fallback. |
| Vercel API routes | `SUPABASE_URL` (or `VITE_SUPABASE_URL`), `SUPABASE_PUBLISHABLE_KEY` (or the public anon/publishable variants), `IMAGEKIT_URL_ENDPOINT`, `IMAGEKIT_PUBLIC_KEY`, `IMAGEKIT_PRIVATE_KEY` | ImageKit private key is a Vercel Secret. The user-supplied endpoint is `https://ik.imagekit.io/qtqsvefdx`; actual configured values were not auditable from this checkout. |
| Supabase Edge Functions | Automatically provided `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`; `SUPABASE_ENVIRONMENT`, `STOREFRONT_ORIGIN` | Set per Supabase project. Never copy the service-role key into Vercel browser configuration. |
| Razorpay Edge Functions | `RAZORPAY_KEY_ID`, `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`, `PAYMENTS_MODE`, `PAYMENTS_LIVE_ENABLED`, `PAYMENTS_LIVE_WEBHOOK_VERIFIED` | Keep unset/disabled until provider credentials and signed webhook are tested. Never use production live payments before verification. |
| Shiprocket Edge Function | `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION`, `SHIPROCKET_DEFAULT_WEIGHT_KG`, `SHIPROCKET_DEFAULT_LENGTH_CM`, `SHIPROCKET_DEFAULT_BREADTH_CM`, `SHIPROCKET_DEFAULT_HEIGHT_CM` | Values must come from the Shiprocket account and actual packed parcel measurements. |

Supabase project URL/key, Razorpay and Shiprocket credentials were not present locally and were not retrieved from Vercel. Do not substitute guessed values.

## Media handling

ImageKit's `f-auto` transformation negotiates modern formats supported by the client; width-specific `tr=w-...,q-80,f-auto` URLs provide responsive delivery and variants are generated on demand. The admin uses SHA-256 checksums to reuse existing assets. Supabase stores metadata and provider references only. Database backups do not contain original media: export originals and metadata, preserve file IDs/checksums/gallery ordering, and verify the new provider URLs before switching providers. Legacy Cloudinary references are retained as read-only delivery compatibility; no Cloudinary assets are deleted.

## Deployment and validation

The `vercel.json` SPA fallback supports direct storefront routes; Vercel `/api` functions provide the ImageKit endpoints. Configure Auth redirects for preview and production origins. Deploy the preview on a non-production branch only after project access and environment values are available. The repository's payment/shipping Edge Functions must be deployed to their corresponding Supabase project before those flows can be exercised.

Before launch, run `npm run typecheck`, `npm run lint`, `npm run build`; validate all three migrations and RLS in Supabase; verify ImageKit upload, duplicate reuse, responsive images, replacement and shared-reference deletion; and exercise checkout/shipping only with configured test credentials. This checkout cannot perform remote provider or database checks without the missing access.
