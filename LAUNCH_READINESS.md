# Little Loom Preview launch readiness

Audit scope: branch `codex/imagekit-client-preview`; repository source and migrations inspected locally. This checkout has no project credentials or authenticated Supabase/Vercel access. Accordingly, static checks are distinguishable from live service checks below. No Production settings/data were changed.

## Results

| Area | Status | Evidence / next action |
|---|---|---|
| Frontend Supabase configuration | **BLOCKED** | App reads `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY` (legacy anon-key fallback exists). No local values are present to test a connection. Set both in Vercel Preview Config. |
| Supabase server credentials | **PASS (code inspection)** | Edge Functions use Supabase-provided `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and server-only `SUPABASE_SERVICE_ROLE_KEY`. No service-role key is referenced by `src/` or exposed through a `VITE_` setting. Live presence/rotation cannot be checked here. |
| ImageKit configuration and secret handling | **PASS (code inspection); BLOCKED (upload test)** | `/api/imagekit-auth`, `/api/imagekit-register`, `/api/imagekit-delete` use the `IMAGEKIT_*` names; private key is read only in server API code. Routes require a signed-in user with `owner`, `admin`, or `media_manager` role and same-origin requests. No Preview credentials/session are available to upload and verify. |
| Preview API origin | **PASS (code check); BLOCKED (deployed test)** | Supabase Edge Function CORS now allows only exact comma-separated `STOREFRONT_ORIGINS` (or the legacy single origin); Production is the fallback only when neither is set. Set the Preview origin in the Supabase function secret and deploy these function changes before browser calls. |
| Migrations 001–003 | **BLOCKED (live validation)** | Filenames and dependent SQL were inspected in order: `202611090001_initial_commerce.sql`, `202611090002_production_commerce_extensions.sql`, `202611090003_external_media_architecture.sql`. Owner previously reported 001–003 applied; no database connection is available to verify schema, grants or RLS. |
| Migration 004 | **BLOCKED (apply and validate)** | `202611100004_catalog_intake_and_admin_tools.sql` is present in the branch but was not confirmed applied. It allows incomplete draft intake, adds `admin_dashboard_summary()`, and creates labeled unpublished intake records. Apply only after review, then verify with Supabase SQL Editor; never publish those drafts as real products. |
| Database identifiers | **PASS (static comparison)** | Queried table, column, relationship and RPC names in the frontend and Edge Functions against migrations 001–004. Main paths include products, variants, inventory, categories, collections, homepage sections, product media, media assets, orders, payments and role views/RPCs. Static matching does not substitute for PostgREST schema-cache/RLS verification. |
| First owner and role boundaries | **BLOCKED (live authorization test)** | Migrations expose role checks but no self-service owner grant. `ADMIN_SETUP.md` provides a one-time SQL Editor bootstrap requiring exact confirmed auth email+UUID and aborting if an owner already exists. Test owner access and non-owner denial after bootstrap. |
| Storefront catalog and CMS | **BLOCKED (live data test)** | Source is database-driven; no static product fallback is used. Editorial Pexels files are local assets and remain editorial/category imagery, not product photos. Current public visibility in `BUSINESS_CONTENT_REQUIRED.md` is a prior audit snapshot, not a current database query. Populate only approved records/media, then verify product and editorial reads. |
| Admin create/edit, variants, stock, categories, media, collections, homepage, orders | **BLOCKED (live role/session test)** | UI and database operations are implemented. No signed-in owner/manager session or Preview deployment access was available to perform writes or verify RLS. Use `ADMIN_SETUP.md`, then run the role matrix before handling real orders. |
| Cart, wishlist, customer accounts, addresses and checkout validation | **BLOCKED (live session test)** | Application paths and database-backed operations exist, but no Preview Supabase credentials/session were available for an end-to-end customer test. |
| Razorpay payment/refund | **BLOCKED (intentionally gated)** | Code checks Preview test mode and test key prefix; live mode requires Production environment, live key prefix, explicit enable flag and verified webhook flag. Do not enable live payment. No credentials or webhook test were available. |
| COD | **BLOCKED (policy confirmation)** | Database RPC reads `cod_enabled`, limits and surcharge from `store_settings`; defaults fail closed if unavailable. Owner must confirm business policy and actual setting values before enabling or accepting COD. |
| Shiprocket | **BLOCKED (business setup)** | Function requires server-side credentials and pickup/parcel settings; no Preview credentials or pickup details were available. No shipping/tracking claim is verified. |
| Local desktop homepage | **PASS (direct browser check)** | Opened the local Vite build and confirmed the hero, editorial imagery, age navigation, empty-catalog state, brand story, newsletter and footer rendered. No real product cards are expected without configured Supabase data. This is not the deployed Preview. |
| Deployed Preview and mobile layout | **BLOCKED** | The latest Vercel Preview is protected by SSO and the connected Vercel account cannot access its project/deployment. No deployed browser console/network, actual product pages, image requests or 375px mobile check could be performed. |

## Environment variables by runtime

**Vercel Preview Config:**

- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `IMAGEKIT_URL_ENDPOINT`
- `IMAGEKIT_PUBLIC_KEY`

**Vercel Preview Secret:**

- `IMAGEKIT_PRIVATE_KEY`

**Supabase Edge Function platform-provided values:** `SUPABASE_URL`, `SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` (server only). Do not place the service-role key in Vercel frontend variables or any `VITE_` setting.

**Supabase Edge Function secrets by feature:**

- Required browser origin configuration: `STOREFRONT_ORIGINS` (exact Preview URL; comma-separated exact origins if multiple environments share this project). `STOREFRONT_ORIGIN` remains a legacy single-origin fallback.
- Payments, only for a separately configured Preview test flow: `SUPABASE_ENVIRONMENT=preview`, `PAYMENTS_MODE=test`, `RAZORPAY_KEY_ID` (`rzp_test_…`), `RAZORPAY_KEY_SECRET`, `RAZORPAY_WEBHOOK_SECRET`; live-enable flags stay false.
- Shipping, only after business setup: `SHIPROCKET_EMAIL`, `SHIPROCKET_PASSWORD`, `SHIPROCKET_PICKUP_LOCATION`, `SHIPROCKET_DEFAULT_WEIGHT_KG`, `SHIPROCKET_DEFAULT_LENGTH_CM`, `SHIPROCKET_DEFAULT_BREADTH_CM`, `SHIPROCKET_DEFAULT_HEIGHT_CM`.

Never print secret values. No environment values were available to verify in this checkout or through Vercel access.

## Next actions

1. Apply migration 004 to the intended Supabase project after reviewing its safe, unpublished intake behavior; verify all four migrations in SQL Editor.
2. Set the exact Preview origin in the Supabase function secret `STOREFRONT_ORIGINS`, deploy the changed Edge Functions, and configure Preview Vercel Config/Secret variables.
3. Bootstrap the verified owner using `ADMIN_SETUP.md`; sign in and run owner, catalog manager, media manager, order manager, customer and anonymous access checks.
4. Supply and approve real product data, variants, prices, stock, policies and authorized product photography per `BUSINESS_CONTENT_REQUIRED.md`. Keep incomplete products as drafts.
5. Only after actual COD policy confirmation, decide whether to enable COD. Keep online payments locked until a Preview test credential/webhook end-to-end test passes. Configure Shiprocket only after pickup setup is supplied.
6. Restore authorized access to the existing Vercel project, remove Preview SSO protection temporarily or provide a testable authenticated route/session, then test homepage, product galleries, cart, account and 375px layout on the actual deployment.

## Local checks

| Requested check | Status | Result |
|---|---|---|
| `npm run lint` | **PASS** | Exit code 0. |
| `npm run typecheck` | **PASS** | Exit code 0. |
| `npm run build` | **PASS** | Vite production build completed. It emitted only the existing outdated Browserslist database notice. |
| `git diff --check` | **PASS** | No whitespace errors. |
| SQL migration execution/policy validation | **BLOCKED** | No SQL client, project connection or Supabase credentials are available in this checkout. |

These checks do not prove live database, ImageKit upload, deployed browser, payment or shipping behavior.
