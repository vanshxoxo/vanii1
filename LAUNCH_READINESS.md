# Little Loom storefront status

Updated 11 November 2026.

## Current state

- The public storefront now displays products from published Supabase records only. The code-built 18-style catalogue, its product-page fallback, and its non-orderable cart flow have been removed.
- A read-only query against the public production catalogue returned **0 published products**. The 18 draft records previously reported by the owner were not modified or duplicated.
- The homepage keeps its editorial and category photography. Pexels files are clearly separated under `public/images/editorial/lifestyle/` and are not product photography.
- A product can be ordered only after a complete database record is published with a valid price, variants, SKU, stock, and authorized actual-product images. The publication trigger and RLS remain in place.
- Checkout code still depends on configured Supabase functions, verified payment settings, and COD policy. No live payment or order was tested in this cleanup.

## Vercel

- Current public Production domain: <https://vanii1.vercel.app/>.
- The deployment-specific `vanii1-cmi9mtb2u-ritubala47802-6400s-projects.vercel.app` address returns Vercel Authentication instead of the app to public requests.
- The Vercel app connector is not installed in the current Codex session, so deployment aliases and protection settings cannot be changed from here. Do not use the deployment-specific URL as the public storefront link.

## Remaining business inputs

Complete the existing drafts using [BUSINESS_CONTENT_REQUIRED.md](BUSINESS_CONTENT_REQUIRED.md). In particular, supply verified prices, real variant/SKU/stock data, and authorized photos of the actual garments. Do not publish editorial photographs as product photos or bypass database publication checks.

## Verification

- `npm run lint` — PASS.
- `npm run typecheck` — PASS.
- `npm run build` — PASS. Vite reported only the existing outdated Browserslist data advisory.
- Live checkout, product ordering, payment, and fulfillment — BLOCKED until a complete product is published and the configured order/payment services can be tested.
