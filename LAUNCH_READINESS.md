# Little Loom launch assortment readiness

Branch: `codex/little-loom-launch-catalogue`

Base: `5caa98b31183dee6c39a351e1a89dc6ee3cfc09c` (`origin/main` at branch creation)

Scope: proposed first assortment and zero-catalogue storefront preview. Production code settings and business data were not changed.

## Results

| Area | Status | Evidence and next action |
|---|---|---|
| Proposed assortment | **PASS (local implementation)** | 18 owner-provided proposed names and indicative prices are listed in `CATALOGUE_ASSORTMENT.md`. Migration 005 tags each as a draft requiring owner review. No variants, SKUs, stock, material, sizes, garment measurements, care facts, product photographs, orders or customer data are fabricated. |
| Storefront empty state | **PASS (local browser check)** | Homepage and `/shop` show the clearly labeled 18-style visual preview only when Supabase successfully returns zero published products. A failed/unavailable catalogue request uses the separate error state and does not show proposal cards. Cards are non-purchasable and route to categories, not fictional product details. |
| Proposal images | **PASS (local browser check)** | All 18 card images loaded from local editorial assets; all 30 editorial/catalog-preview asset URLs returned image responses. Images are explicitly described as inspiration, not as photographs of the proposed items. Source/licensing credits stay in `public/images/catalog-preview/SOURCES.md`. |
| Navigation and responsive layout | **PASS (local browser check)** | Six categories and four age paths render; category paths filter to three proposals each. Age paths clearly state that sizing/age assignment is unverified. Checked at 1440px and 375px: no horizontal overflow. |
| Product records in a live database | **BLOCKED (no Preview database access)** | No database credentials/session were available. No migration was executed and no Supabase data was read or written. For a separate Preview database, verify migrations 001–004 then apply 005 in order; never use Production for this proposal seed. |
| Admin product verification | **PASS (static/local implementation); BLOCKED (live owner test)** | Admin now marks proposal fields and review requirements, supports entering verified product facts/variants/opening stock/authorized ImageKit photos, and saves as draft before publication. SQL publication checks require verified facts, measurements, active product and age categories, complete variant/SKU/inventory, and an active ImageKit product photograph. Live role/RLS enforcement and database trigger behavior remain untested until migration 005 is applied to an isolated Preview database and a verified owner account signs in. |
| Environment and secret handling | **PASS (code inspection); BLOCKED (Preview configuration check)** | `.env.example` lists browser `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`, plus ImageKit endpoint/public key and server-only `IMAGEKIT_PRIVATE_KEY`. No local environment values were present. Private ImageKit credentials are not read from browser code. Configure and verify these in the existing project's Preview environment. |
| Supabase migration application | **BLOCKED** | Local source includes migrations 001–005. This change adds `202611110005_launch_assortment_proposals.sql`; it was not executed or validated against a connected database. Confirm the target is an isolated Preview database, check applied status for 001–004, then apply 005. |
| Vercel Preview build | **PASS (GitHub deployment status); BLOCKED (live-site inspection)** | Vercel reported “Deployment has completed” for commit `833244e9e3868856b24ec5cfb75b75983a24927e`. Its status links to [the Vercel deployment record](https://vercel.com/ritubala47802-6400s-projects/vanii1/E4WChnXw24o8dwLrgBNXzFS45Q6V), but the connected Vercel API returns no matching project and a 404 for the deployment; the browser asks for Vercel login. No stable Preview hostname was exposed, so the deployed homepage/images could not be checked. No duplicate project was created. Restore access to the existing Vercel project and verify the public Preview URL and homepage before opening a PR. |
| Pull request | **NOT OPENED** | The build status succeeded, but the actual Preview website could not be opened and visually verified. Open a PR to `main` only after the existing Vercel Preview is accessible and passes its storefront checks. Do not merge as part of this task. |
| Production/payment safety | **PASS (scope)** | No Production deployment, Production data, live payment configuration, or real order was changed or created. |

## Automated checks

| Check | Result |
|---|---|
| `npm run lint` | **PASS** |
| `npm run typecheck` | **PASS** |
| `npm run build` | **PASS**; existing Browserslist data notice only |
| `git diff --check` | **PASS** |
| SQL execution / policy validation | **BLOCKED**; no database connection |

## Next actions

1. Restore Vercel access to the existing `vanii1` project/team; do not create another project. Set the Preview environment variables shown in `.env.example` without replacing valid values.
2. Provide an isolated Preview Supabase project/database. Confirm migrations 001–004 there, then execute migration 005 after review. Keep Production data untouched.
3. Bootstrap or identify the verified first owner using `ADMIN_SETUP.md`; sign in and verify owner, non-owner, and anonymous access boundaries.
4. Owner-review the proposed names/prices. Supply accurate garment details, sizes, colorways, measured dimensions, SKUs, counted stock, age guidance, and authorized photographs per `BUSINESS_CONTENT_REQUIRED.md`. Keep every item unpublished until complete.
5. Verify admin writes, ImageKit uploads, actual published product loading, category filtering, and 375px layout on the real Preview deployment. Open the PR only after those Preview checks pass.
