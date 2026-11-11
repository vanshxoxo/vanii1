# Product information required for publication

The database contains 18 existing draft product records. They must be completed and verified before they can appear in the public catalogue. The live storefront reads published Supabase records only; a public catalogue read currently returns zero published products. No records were added or changed by this storefront cleanup.

The licensed Pexels photographs under `public/images/editorial/` are used only as editorial and category artwork. They are not photographs of the products and must never be linked to product listings, variants, or checkout.

## Confirm for each existing product

- Correct product name and supplier/manufacturer reference.
- Accurate description, material composition, and care instructions.
- Actual selling price in INR.
- Intended age groups, offered sizes, and measured garment dimensions.
- Available colours and approved swatches.
- A unique SKU for each size/colour combination.
- Counted opening stock for each variant.
- Authorized photographs of the actual garment, gallery order, alt text, and product/variant mapping.
- Evidence that Little Loom may commercially use each product photograph.

Complete these values in the admin product editor. Keep each record unpublished until the publication checks pass; do not bypass the database validation trigger or RLS.

## Confirm before accepting orders

- Shipping regions, charges, delivery estimates, returns/refunds, and public business contact details.
- COD availability, any surcharge, and order limits.
- Razorpay credentials and webhook settings in the correct Vercel environment; keep online payments disabled until an end-to-end verification succeeds.
- Shiprocket credentials, pickup location, and parcel defaults before shipping or tracking is represented as operational.
