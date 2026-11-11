# Little Loom admin setup

## First owner (one-time, Supabase SQL Editor)

The migrations do not promote a user automatically. `admin_roles` has RLS: a signed-in user can read only their own role, and only an existing owner can manage role grants. There is intentionally no callable “make me owner” function. Bootstrap the first owner directly in the Supabase SQL Editor while signed in as a trusted project database administrator.

1. Have the intended owner create and verify their account through Little Loom authentication.
2. Confirm the account email in **Supabase → Authentication → Users**. Use the account’s verified email and immutable user UUID below. Never use a customer account or an email supplied by an untrusted requester.
3. Replace both placeholders in this block and run it once. It aborts if the email does not match exactly one auth user or if an owner already exists. The transaction creates no other role grants.

```sql
begin;
do $bootstrap$
declare
  intended_email text := lower('OWNER_VERIFIED_EMAIL_HERE');
  intended_user_id text := 'OWNER_AUTH_USER_UUID_HERE';
  matched_user_id uuid;
begin
  if intended_email = 'owner_verified_email_here'
     or intended_user_id = 'OWNER_AUTH_USER_UUID_HERE' then
    raise exception 'Replace both first-owner placeholders before running this block';
  end if;

  select id into matched_user_id
  from auth.users
  where lower(email) = intended_email and id = intended_user_id::uuid
    and email_confirmed_at is not null;

  if matched_user_id is null then
    raise exception 'No confirmed auth user matches both the supplied email and UUID';
  end if;

  if exists (select 1 from public.admin_roles where role = 'owner') then
    raise exception 'An owner already exists; do not bootstrap another owner';
  end if;

  insert into public.admin_roles(user_id, role)
  values (matched_user_id, 'owner');
end
$bootstrap$;
commit;
```

4. Sign out and sign back in as that account. Open `/admin`; verify the admin dashboard and role-specific controls load. Confirm the browser Network panel shows successful reads under the signed-in session. Do not share session tokens or screenshots containing customer data.
5. In the admin **Team** area, assign only the needed roles to individually verified team accounts. `owner` is deliberately unavailable in the UI. Remove access promptly when no longer needed.

If SQL errors or an owner already exists, stop. Check `select user_id, role from public.admin_roles where role='owner';` in the SQL Editor and use the existing owner workflow. Do not add a second owner to work around an error.

## Role capability summary

- **owner**: all capabilities; only role that can grant/revoke roles.
- **admin**: administrative dashboard and permitted non-owner administration; does not satisfy `has_role('owner')`.
- **catalog_manager**: products, variants, inventory, categories, collections and homepage content.
- **media_manager**: ImageKit upload authorization, metadata registration and safe media deletion.
- **order_manager**: customer/order operations, shipment creation and refund workflows.

Roles are additive. A catalog manager who also needs to upload/delete media must receive `media_manager` as a separate grant. The ImageKit Vercel routes validate the bearer session against Supabase and check `admin_roles` server-side; browser code never receives the ImageKit private key.

## Preview configuration

### Launch proposal migration

The first-assortment proposal migration is `supabase/migrations/202611110005_launch_assortment_proposals.sql`. It is idempotent and intentionally leaves all proposed items unpublished. Before applying it, confirm the target Supabase project is isolated Preview and check which migrations have actually been applied. If this is a fresh Preview database, apply migrations 001, 002, 003, 004, then 005 in filename order. If migrations 001–004 are already recorded as applied, apply only 005. Do not run this proposal seed against Production. Migration 005 does not create variants, inventory, product media, orders, payments or customer records.

After applying it, sign in as the verified owner and confirm the items are tagged for owner review and have `draft` status. Add verified supplier data, complete variants and inventory, attach authorized ImageKit product photos, then publish. Editorial preview photos are not product photos and must not be attached to these records.

Configure these in the **Preview** environment of the existing Vercel project, without replacing valid values in other environments:

- Config: `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`
- Config: `IMAGEKIT_URL_ENDPOINT`, `IMAGEKIT_PUBLIC_KEY`
- Secret: `IMAGEKIT_PRIVATE_KEY`

For Supabase Edge Functions, the Supabase platform supplies `SUPABASE_URL`, `SUPABASE_ANON_KEY`, and `SUPABASE_SERVICE_ROLE_KEY`; do not copy the service-role key into Vercel or any `VITE_` variable. Preview calls to checkout/payment/shipping functions require the exact Preview origin in the Supabase function secret `STOREFRONT_ORIGINS` (comma-separated exact origins, no paths or wildcards). For a single Preview domain, set only that domain; add `https://vanii1.vercel.app` only when the same Supabase project is intentionally serving Production too. `STOREFRONT_ORIGIN` remains supported as a legacy single-origin value.

Payments and shipping remain gated. Keep Razorpay secrets unset and `PAYMENTS_LIVE_ENABLED=false`; leave COD disabled until the owner verifies the policy and database settings. Do not configure Shiprocket until the account credentials, pickup location and parcel defaults are confirmed.
