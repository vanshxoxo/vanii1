# Business content required before publishing products

The preview assortment contains 18 proposed styles and indicative prices from the owner. None is a verified supplier product. Every row remains a draft until Little Loom confirms the information below. Editorial preview photographs are visual inspiration only and are not attached to product records.

## Required for each proposed style

- Confirm or replace the proposed product name and indicative price.
- Confirm the supplier/manufacturer and the actual garment or style reference.
- Supply an accurate product description and verified material/fabric composition.
- Supply care instructions from the supplier or garment label.
- Confirm intended age groups and actual offered sizes; do not rely on the catalogue's age suggestions.
- Enter measured garment dimensions, with units, for every offered size.
- Confirm each available colour and any approved swatch colour.
- Create the real SKU for each size/colour combination and enter the counted opening stock.
- Provide authorized product photographs, gallery order, useful alt text and the product/variant mapping. Photos must show the actual garment.
- Provide supplier/brand permission or the commercial license for every product image.
- Remove proposed/review markers only after these fields have been checked by the owner.

See [CATALOGUE_ASSORTMENT.md](CATALOGUE_ASSORTMENT.md) for the 18 proposed names, suggested prices, editorial visual assignments and owner-review age suggestions. A preview card's photo is not an exact item representation and cannot be used as a product gallery, checkout image or proof of stock.

## Required for storefront and fulfilment

- Owner-approved Little Loom brand story and any factual marketing claims.
- Confirmed collection names, product membership, and ordering. Bestseller and new-arrival labels require actual owner approval or sales data.
- Verified size guide content and any age/fit guidance.
- Shipping regions, rates, delivery commitments, returns/refund policy, and business contact information.
- Public support email, phone/WhatsApp, business details and official social profile URLs.
- Newsletter consent wording, confirmation behavior and sending service.
- Confirmed COD policy and limits before enabling COD.
- Preview payment test credentials and a verified webhook before test-mode payment checks. Live payment remains disabled until separately reviewed.
- Shiprocket credentials, pickup location and parcel defaults before shipment/tracking checks.

## ImageKit upload prerequisites

The admin uploader keeps ImageKit private credentials on the server and registers metadata in Supabase. Configure the existing `IMAGEKIT_URL_ENDPOINT`, `IMAGEKIT_PUBLIC_KEY` and server-only `IMAGEKIT_PRIVATE_KEY` in the Vercel Preview environment, and run migration 005 on a non-production Preview Supabase project before testing admin writes. Keep ImageKit private credentials and Supabase service-role credentials out of browser variables.

## Database safety

Migration 005 creates or updates only explicitly tagged `owner-intake` launch slots and leaves every proposal unpublished. It creates no variants, inventory, customer, order or payment records. Do not run it against Production; first establish a Preview Supabase project with independent data and credentials.
