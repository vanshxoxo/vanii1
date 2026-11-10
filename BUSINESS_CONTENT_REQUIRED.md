# Little Loom: real business content required

This branch no longer supplies sample products, stock photographs, fallback product data, sample inventory, or fabricated product copy. Storefront products are read from published Supabase records and are only displayed when they have authorized gallery media, a description, material/fabric, care information, and complete variants with SKU, size, and colour. Incomplete products must remain drafts until verified.

## Current public database visibility

At the time of the latest audit, anonymous/public reads returned:

- Products: 0
- Media assets: 0
- Product-media links: 0
- Collections: 0
- Homepage sections: 0
- Banners: 0
- Active categories: 10

This describes only rows visible to the public API under current RLS. It does not prove there are no admin-only or draft rows. Confirm the private/admin view in Supabase before creating records. Do not overwrite existing records.

Migration `202611100004_catalog_intake_and_admin_tools.sql` adds three explicit owner-intake draft slots per active product-type category (18 across the six configured types). They are not sale listings: name, price, description, fabric/care information, photos, variants/SKUs, stock and age assignment remain unverified. The migration does not overwrite existing records and is pending application in the current checkout. Do not publish these slots until the owner replaces the intake name and supplies verified product information and authorized photos.

## Required information for each product

- Approved product name and URL slug
- Accurate customer-facing description
- Current price in INR and, only if real, compare-at price
- Product category and age group
- SKU for every sellable size/colour variant
- Exact available sizes and colour names (and verified colour swatch values if desired)
- Material/fabric composition and care instructions
- Actual stock on hand for each variant and any reserved quantities handled by inventory
- Publication approval/status and collection placement (including genuine new-arrival or bestseller data)
- Alt text for every photograph

## Required photography files and permissions

For each product, supply original high-resolution product photographs or files from a supplier/manufacturer that Little Loom is authorized to use. Include the product/variant mapping, gallery order, image alt text, and written license/permission or source. Do not send Pinterest screenshots or photos from other brands unless the rights holder has authorized their use. Once supplied and approved, the files can be uploaded to the configured ImageKit account and linked through the existing media tables.

Also supply authorized desktop/mobile hero photos, category/collection covers, campaign/editorial imagery, and any promotional-banner assets. Include the intended placement, campaign dates, CTA destination, and usage rights.

## Required business and policy content

- Approved Little Loom brand story and any marketing claims
- Actual published collections and product ordering
- Verified size guide measurements by garment/age
- Shipping regions, delivery terms, charges/thresholds, returns/refunds policy
- Business contact/support email, phone/WhatsApp, and physical/business details intended for publication
- Official social profile URLs
- Newsletter consent/confirmation behavior and sender setup
- Owner/admin email addresses and intended role assignments
- Verified payment configuration and webhook setup before enabling Razorpay; verified Shiprocket credentials/configuration before promising shipping functions

The database migration currently supplies initial shipping/COD setting values. Confirm those amounts and limits against Little Loom's actual policy before accepting orders; this cleanup did not alter existing database settings.

Do not publish price, stock, policy, campaign, or service claims until the business owner verifies them. Payment remains subject to server-side credential and webhook gates.
