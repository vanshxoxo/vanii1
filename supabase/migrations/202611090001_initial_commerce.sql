-- Little Loom commerce foundation for a new Supabase project. Non-destructive; no DROP/RESET.
create extension if not exists pgcrypto with schema extensions;

create table if not exists public.admin_roles (
 id uuid primary key default gen_random_uuid(),
 user_id uuid not null references auth.users(id) on delete cascade,
 role text not null check (role in ('owner','admin','catalog_manager','media_manager','order_manager')),
 created_at timestamptz not null default now(), unique(user_id,role)
);
create or replace function public.has_role(wanted text) returns boolean
language sql stable security definer set search_path=public,pg_temp set row_security=off as $$
 select exists(select 1 from public.admin_roles where user_id=(select auth.uid()) and (role='owner' or (role='admin' and wanted<>'owner') or role=wanted))
$$;
create or replace function public.set_updated_at() returns trigger
language plpgsql set search_path=public,pg_temp as $$ begin new.updated_at=now(); return new; end $$;

create table if not exists public.customers (
 id uuid primary key references auth.users(id) on delete cascade, email text, full_name text, phone text,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create or replace function public.create_customer_profile() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 insert into public.customers(id,email,full_name) values(new.id,new.email,nullif(new.raw_user_meta_data->>'full_name',''))
 on conflict(id) do update set email=excluded.email;
 return new;
end $$;
drop trigger if exists on_auth_user_created_customer on auth.users;
create trigger on_auth_user_created_customer after insert on auth.users for each row execute function public.create_customer_profile();

create table if not exists public.categories (
 id uuid primary key default gen_random_uuid(), parent_id uuid references public.categories(id) on delete set null,
 kind text not null check(kind in ('product','age')), name text not null, slug text not null unique,
 description text not null default '', display_order int not null default 0, is_active boolean not null default true,
 image_asset_id uuid, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.collections (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 description text not null default '', status text not null default 'draft' check(status in ('draft','published','archived')),
 seo_title text, seo_description text, cover_asset_id uuid, display_order int not null default 0,
 published_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.products (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 description text not null default '', material text not null default '', fabric_composition text not null default '',
 care_instructions text not null default '', price numeric(12,2) not null check(price>=0),
 compare_at_price numeric(12,2) check(compare_at_price is null or compare_at_price>=price),
 currency char(3) not null default 'INR', status text not null default 'draft' check(status in ('draft','published','archived')),
 seo_title text, seo_description text, tags text[] not null default '{}', published_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.product_categories (
 product_id uuid not null references public.products(id) on delete cascade,
 category_id uuid not null references public.categories(id) on delete restrict,
 primary key(product_id,category_id)
);
create table if not exists public.product_variants (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 sku text not null unique, size text not null, colour text not null,
 colour_hex text check(colour_hex is null or colour_hex ~ '^#[0-9A-Fa-f]{6}$'),
 price_override numeric(12,2) check(price_override is null or price_override>=0),
 is_active boolean not null default true, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(id,product_id), unique(product_id,size,colour)
);
create table if not exists public.inventory (
 variant_id uuid primary key references public.product_variants(id) on delete cascade,
 quantity_on_hand int not null default 0 check(quantity_on_hand>=0),
 quantity_reserved int not null default 0 check(quantity_reserved between 0 and quantity_on_hand),
 updated_at timestamptz not null default now()
);
create table if not exists public.inventory_movements (
 id uuid primary key default gen_random_uuid(), variant_id uuid not null references public.product_variants(id) on delete restrict,
 quantity_delta int not null check(quantity_delta<>0), reason text not null, reference_id uuid,
 created_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now()
);
create or replace function public.ensure_variant_inventory() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin insert into public.inventory(variant_id) values(new.id) on conflict(variant_id) do nothing; return new; end $$;
drop trigger if exists create_inventory_for_variant on public.product_variants;
create trigger create_inventory_for_variant after insert on public.product_variants for each row execute function public.ensure_variant_inventory();

create or replace function public.record_inventory_change() returns trigger
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare delta int;
begin
 if tg_op='INSERT' then delta:=new.quantity_on_hand; else delta:=new.quantity_on_hand-old.quantity_on_hand; end if;
 if delta<>0 then
  insert into public.inventory_movements(variant_id,quantity_delta,reason,created_by)
  values(new.variant_id,delta,case when tg_op='INSERT' then 'opening stock' when auth.role()='service_role' then 'paid order deduction' else 'stock adjustment' end,auth.uid());
 end if;
 return new;
end $$;
drop trigger if exists inventory_stock_audit on public.inventory;
create trigger inventory_stock_audit after insert or update of quantity_on_hand on public.inventory for each row execute function public.record_inventory_change();

create table if not exists public.media_assets (
 id uuid primary key default gen_random_uuid(), provider text not null default 'cloudinary' check(provider in ('cloudinary','imagekit','external','supabase')),
 provider_asset_id text, resource_type text not null default 'image' check(resource_type in ('image','video','raw')),
 delivery_url text, format text, bucket_id text, storage_path text, external_url text, original_filename text not null, mime_type text not null,
 file_size_bytes bigint not null default 0 check(file_size_bytes>=0), width int check(width is null or width>0),
 height int check(height is null or height>0), duration_seconds numeric(10,2) check(duration_seconds is null or duration_seconds>=0),
 checksum_sha256 text, derived_urls jsonb not null default '{}'::jsonb, lifecycle_status text not null default 'active' check(lifecycle_status in ('active','deleting')),
 alt_text text not null default '',
 purpose text not null check(purpose in ('product','collection','category','homepage_hero','campaign','brand_story','lookbook','video','placeholder')),
 uploaded_by uuid references auth.users(id) on delete set null,
 cleanup_requested_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 check((provider in ('cloudinary','imagekit') and provider_asset_id is not null and delivery_url is not null and bucket_id is null and storage_path is null and external_url is null)
    or (provider='external' and (delivery_url is not null or external_url is not null) and bucket_id is null and storage_path is null)
    or (provider='supabase' and bucket_id is not null and storage_path is not null and external_url is null)),
 unique(bucket_id,storage_path)
);
create index if not exists media_checksum_idx on public.media_assets(checksum_sha256) where checksum_sha256 is not null;
create unique index if not exists media_checksum_unique on public.media_assets(checksum_sha256) where checksum_sha256 is not null;
alter table public.categories drop constraint if exists categories_image_asset_id_fkey;
alter table public.categories add constraint categories_image_asset_id_fkey foreign key(image_asset_id) references public.media_assets(id) on delete set null;
alter table public.collections drop constraint if exists collections_cover_asset_id_fkey;
alter table public.collections add constraint collections_cover_asset_id_fkey foreign key(cover_asset_id) references public.media_assets(id) on delete set null;

create table if not exists public.product_media (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 asset_id uuid not null references public.media_assets(id) on delete restrict, variant_id uuid,
 view_label text not null default 'additional' check(view_label in ('front','back','side','detail','lifestyle','additional')),
 display_order int not null default 0, is_primary boolean not null default false, alt_text text not null default '',
 created_at timestamptz not null default now(),
 foreign key(variant_id,product_id) references public.product_variants(id,product_id) on delete cascade
);
create unique index if not exists product_media_unique on public.product_media(product_id,asset_id,coalesce(variant_id,'00000000-0000-0000-0000-000000000000'::uuid));
create unique index if not exists product_primary_image_unique on public.product_media(product_id) where is_primary and variant_id is null;
create index if not exists product_media_order_idx on public.product_media(product_id,display_order);
create or replace function public.validate_product_for_publish() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.status='published' and (not exists(select 1 from public.product_variants v where v.product_id=new.id and v.is_active)
    or not exists(select 1 from public.product_media pm where pm.product_id=new.id)) then
  raise exception 'A published product needs an active variant and at least one gallery image';
 end if;
 return new;
end $$;
drop trigger if exists validate_product_publish on public.products;
create trigger validate_product_publish before insert or update of status on public.products for each row execute function public.validate_product_for_publish();
create table if not exists public.collection_products (
 collection_id uuid not null references public.collections(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade,
 display_order int not null default 0, created_at timestamptz not null default now(), primary key(collection_id,product_id)
);
create table if not exists public.collection_media (
 collection_id uuid not null references public.collections(id) on delete cascade,
 asset_id uuid not null references public.media_assets(id) on delete restrict,
 display_order int not null default 0, alt_text text not null default '', primary key(collection_id,asset_id)
);

create table if not exists public.customer_addresses (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete cascade,
 label text not null default 'Home', recipient_name text not null, phone text not null,
 address_line_1 text not null, address_line_2 text not null default '', city text not null, state text not null,
 postal_code text not null, country_code char(2) not null default 'IN', is_default boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists customer_default_address_unique on public.customer_addresses(customer_id) where is_default;
create table if not exists public.carts (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null references public.customers(id) on delete cascade,
 checkout_idempotency_key uuid not null default gen_random_uuid(),
 status text not null default 'active' check(status in ('active','converted','abandoned')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create unique index if not exists customer_active_cart_unique on public.carts(customer_id) where status='active';
create table if not exists public.cart_items (
 id uuid primary key default gen_random_uuid(), cart_id uuid not null references public.carts(id) on delete cascade,
 variant_id uuid not null references public.product_variants(id) on delete restrict,
 quantity int not null check(quantity between 1 and 99), created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(), unique(cart_id,variant_id)
);
create table if not exists public.orders (
 id uuid primary key default gen_random_uuid(), order_number bigint generated always as identity unique,
 customer_id uuid not null references public.customers(id) on delete restrict,
 idempotency_key text not null unique, payment_method text not null default 'razorpay' check(payment_method in ('razorpay','cod')),
 status text not null default 'pending_payment' check(status in ('pending_payment','paid','processing','shipped','delivered','cancelled','refunded')),
 currency char(3) not null default 'INR', subtotal numeric(12,2) not null default 0 check(subtotal>=0),
 shipping_total numeric(12,2) not null default 0 check(shipping_total>=0), cod_fee numeric(12,2) not null default 0 check(cod_fee>=0), tax_total numeric(12,2) not null default 0 check(tax_total>=0),
 total numeric(12,2) not null default 0 check(total>=0), shipping_address_snapshot jsonb not null,
 customer_email_snapshot text not null, placed_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.order_items (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 variant_id uuid references public.product_variants(id) on delete set null, product_id uuid references public.products(id) on delete set null,
 product_name_snapshot text not null, product_slug_snapshot text not null, sku_snapshot text not null,
 size_snapshot text not null, colour_snapshot text not null, unit_price numeric(12,2) not null check(unit_price>=0),
 quantity int not null check(quantity between 1 and 99), line_total numeric(12,2) not null check(line_total>=0)
);
create table if not exists public.stock_reservations (
 order_id uuid not null references public.orders(id) on delete cascade,
 variant_id uuid not null references public.product_variants(id) on delete restrict,
 quantity int not null check(quantity between 1 and 99),
 status text not null default 'reserved' check(status in ('reserved','committed','released')),
 expires_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 primary key(order_id,variant_id)
);
create table if not exists public.shipping_addresses (
 id uuid primary key default gen_random_uuid(), order_id uuid not null unique references public.orders(id) on delete cascade,
 recipient_name text not null, phone text not null, address_line_1 text not null, address_line_2 text not null default '',
 city text not null, state text not null, postal_code text not null, country_code char(2) not null default 'IN', created_at timestamptz not null default now()
);
create table if not exists public.shipments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 provider text not null default 'shiprocket', provider_order_id text, shipment_id text, awb_code text, courier_name text,
 status text not null default 'pending' check(status in ('pending','created','pickup_scheduled','in_transit','out_for_delivery','delivered','exception','cancelled','returned')),
 tracking_url text, raw_status text, provider_payload jsonb not null default '{}', creation_started_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(provider,shipment_id), unique(provider,awb_code)
);
create unique index if not exists shipment_one_provider_per_order on public.shipments(order_id,provider);
create table if not exists public.order_status_history (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 from_status text, to_status text not null, changed_by uuid references auth.users(id) on delete set null,
 source text not null default 'storefront', note text, created_at timestamptz not null default now()
);
create table if not exists public.payments (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete restrict,
 provider text not null default 'unconfigured', provider_payment_id text,
 status text not null default 'pending' check(status in ('pending','pending_collection','authorized','captured','collected','failed','refunded')),
 provider_order_id text,
 amount numeric(12,2) not null check(amount>=0), currency char(3) not null default 'INR',
 verified_at timestamptz, provider_payload jsonb not null default '{}',
 provider_order_creation_started_at timestamptz,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(provider,provider_payment_id)
);
create unique index if not exists payments_one_per_order on public.payments(order_id);
create table if not exists public.payment_transactions (
 id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id) on delete restrict,
 provider text not null, provider_transaction_id text, transaction_type text not null check(transaction_type in ('authorization','capture','failure','refund','adjustment')),
 status text not null, amount numeric(12,2) not null check(amount>=0), currency char(3) not null default 'INR',
 provider_payload jsonb not null default '{}', created_at timestamptz not null default now()
);
create table if not exists public.refunds (
 id uuid primary key default gen_random_uuid(), payment_id uuid not null references public.payments(id) on delete restrict,
 provider_refund_id text unique, idempotency_key text not null unique, provider_request_started_at timestamptz,
 amount numeric(12,2) not null check(amount>0), status text not null default 'pending' check(status in ('pending','processed','failed')),
 reason text, requested_by uuid references auth.users(id) on delete set null, provider_payload jsonb not null default '{}',
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.wishlists (
 id uuid primary key default gen_random_uuid(), customer_id uuid not null unique references public.customers(id) on delete cascade,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.wishlist_items (
 wishlist_id uuid not null references public.wishlists(id) on delete cascade,
 product_id uuid not null references public.products(id) on delete cascade, created_at timestamptz not null default now(),
 primary key(wishlist_id,product_id)
);
create table if not exists public.campaigns (
 id uuid primary key default gen_random_uuid(), name text not null, slug text not null unique,
 status text not null default 'draft' check(status in ('draft','scheduled','published','archived')),
 starts_at timestamptz, ends_at timestamptz, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.homepage_sections (
 id uuid primary key default gen_random_uuid(), section_key text not null unique,
 section_type text not null check(section_type in ('announcement','hero','featured_collections','new_arrivals','bestsellers','shop_the_look','brand_story','newsletter','campaign_banner')),
 heading text not null default '', body text not null default '', cta_label text, cta_href text,
 desktop_asset_id uuid references public.media_assets(id) on delete set null,
 mobile_asset_id uuid references public.media_assets(id) on delete set null,
 campaign_id uuid references public.campaigns(id) on delete set null, content jsonb not null default '{}',
 display_order int not null default 0, is_published boolean not null default false,
 updated_by uuid references auth.users(id) on delete set null, created_at timestamptz not null default now(),
 updated_at timestamptz not null default now()
);
create table if not exists public.newsletter_subscribers (
 id uuid primary key default gen_random_uuid(), email text not null unique,
 status text not null default 'pending' check(status in ('pending','subscribed','unsubscribed')),
 consented_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.store_settings (
 setting_key text primary key, setting_value jsonb not null default 'null', is_public boolean not null default false,
 updated_at timestamptz not null default now(), updated_by uuid references auth.users(id) on delete set null
);
create table if not exists public.payment_webhook_events (
 id uuid primary key default gen_random_uuid(), provider text not null, event_id text not null,
 event_type text not null, received_at timestamptz not null default now(), processed_at timestamptz,
 unique(provider,event_id)
);
insert into public.store_settings(setting_key,setting_value,is_public) values
 ('cod_enabled','false',true),('cod_surcharge','0',true),('cod_order_limit','10000',true),
 ('free_shipping_threshold','1490',true),('standard_shipping_fee','99',true)
on conflict(setting_key) do nothing;

create index if not exists product_status_published_idx on public.products(status,published_at desc);
create index if not exists variant_product_active_idx on public.product_variants(product_id,is_active);
create index if not exists orders_customer_date_idx on public.orders(customer_id,placed_at desc);
create index if not exists collection_products_order_idx on public.collection_products(collection_id,display_order);
create index if not exists homepage_section_order_idx on public.homepage_sections(is_published,display_order);
do $$ declare t text; begin
 foreach t in array array['customers','categories','collections','products','product_variants','inventory','media_assets','customer_addresses','carts','cart_items','orders','payments','wishlists','campaigns','homepage_sections','newsletter_subscribers','store_settings','stock_reservations','shipments','refunds'] loop
  execute format('drop trigger if exists set_updated_at on public.%I',t);
  execute format('create trigger set_updated_at before update on public.%I for each row execute function public.set_updated_at()',t);
 end loop;
end $$;

insert into public.categories(kind,name,slug,display_order) values
 ('age','Newborn','newborn',1),('age','Baby','baby',2),('age','Toddler','toddler',3),('age','Little Kids','little-kids',4),
 ('product','Rompers','rompers',1),('product','Co-ord Sets','co-ord-sets',2),('product','Tees & Tops','tees-tops',3),
 ('product','Dresses','dresses',4),('product','Bottoms','bottoms',5),('product','Sleepwear','sleepwear',6)
on conflict(slug) do nothing;

do $$ declare t text; begin
 foreach t in array array['admin_roles','customers','categories','collections','products','product_categories','product_variants','inventory','inventory_movements','media_assets','product_media','collection_products','collection_media','customer_addresses','carts','cart_items','orders','order_items','payments','wishlists','wishlist_items','campaigns','homepage_sections','newsletter_subscribers','store_settings','payment_webhook_events'] loop
  execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;

create policy "Owner reads and manages admin roles" on public.admin_roles for all to authenticated using(public.has_role('owner')) with check(public.has_role('owner'));
create policy "Users read own admin role" on public.admin_roles for select to authenticated using(user_id=(select auth.uid()));
create policy "Customers read own profile" on public.customers for select to authenticated using(id=(select auth.uid()) or public.has_role('order_manager'));
create policy "Customers update own profile" on public.customers for update to authenticated using(id=(select auth.uid())) with check(id=(select auth.uid()));
create policy "Orders managers manage profiles" on public.customers for all to authenticated using(public.has_role('order_manager')) with check(public.has_role('order_manager'));
create policy "Active categories public" on public.categories for select to anon,authenticated using(is_active or public.has_role('catalog_manager'));
create policy "Catalog managers manage categories" on public.categories for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published collections public" on public.collections for select to anon,authenticated using(status='published' or public.has_role('catalog_manager'));
create policy "Catalog managers manage collections" on public.collections for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published products public" on public.products for select to anon,authenticated using(status='published' or public.has_role('catalog_manager'));
create policy "Catalog managers manage products" on public.products for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published product categories public" on public.product_categories for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='published') or public.has_role('catalog_manager'));
create policy "Catalog managers manage product categories" on public.product_categories for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published variants public" on public.product_variants for select to anon,authenticated using((is_active and exists(select 1 from public.products p where p.id=product_id and p.status='published')) or public.has_role('catalog_manager'));
create policy "Catalog managers manage variants" on public.product_variants for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Catalog managers read inventory" on public.inventory for select to authenticated using(public.has_role('catalog_manager'));
create policy "Catalog managers read movements" on public.inventory_movements for select to authenticated using(public.has_role('catalog_manager'));
create policy "Published assets public" on public.media_assets for select to anon,authenticated using(
 public.has_role('media_manager') or public.has_role('catalog_manager') or
 exists(select 1 from public.categories ca where ca.image_asset_id=public.media_assets.id and ca.is_active) or
 exists(select 1 from public.product_media pm join public.products p on p.id=pm.product_id where pm.asset_id=public.media_assets.id and p.status='published') or
 exists(select 1 from public.collections c where c.cover_asset_id=public.media_assets.id and c.status='published') or
 exists(select 1 from public.collection_media cm join public.collections c on c.id=cm.collection_id where cm.asset_id=public.media_assets.id and c.status='published') or
 exists(select 1 from public.homepage_sections h where (h.desktop_asset_id=public.media_assets.id or h.mobile_asset_id=public.media_assets.id) and h.is_published));
create policy "Media managers read assets" on public.media_assets for select to authenticated using(public.has_role('media_manager'));
create policy "Media managers add assets" on public.media_assets for insert to authenticated with check(public.has_role('media_manager'));
create policy "Media managers update assets" on public.media_assets for update to authenticated using(public.has_role('media_manager')) with check(public.has_role('media_manager'));
create or replace function public.media_reference_count(p_asset_id uuid) returns bigint
language plpgsql stable security definer set search_path=public,pg_temp set row_security=off as $$
begin
 if not public.has_role('media_manager') then raise exception 'Media manager permission required'; end if;
 return (select count(*) from public.product_media where asset_id=p_asset_id)
      + (select count(*) from public.collection_media where asset_id=p_asset_id)
      + (select count(*) from public.collections where cover_asset_id=p_asset_id)
      + (select count(*) from public.categories where image_asset_id=p_asset_id)
      + (select count(*) from public.homepage_sections where desktop_asset_id=p_asset_id or mobile_asset_id=p_asset_id);
end $$;
revoke all on function public.media_reference_count(uuid) from public,anon;
grant execute on function public.media_reference_count(uuid) to authenticated;
create policy "Media managers delete unreferenced assets" on public.media_assets for delete to authenticated using(public.has_role('media_manager') and public.media_reference_count(id)=0);
create policy "Published product gallery public" on public.product_media for select to anon,authenticated using(exists(select 1 from public.products p where p.id=product_id and p.status='published') or public.has_role('media_manager'));
create policy "Media managers manage product gallery" on public.product_media for all to authenticated using(public.has_role('media_manager')) with check(public.has_role('media_manager'));
create policy "Catalog managers manage product gallery" on public.product_media for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published collection products public" on public.collection_products for select to anon,authenticated using(exists(select 1 from public.collections c join public.products p on p.id=product_id where c.id=collection_id and c.status='published' and p.status='published') or public.has_role('catalog_manager'));
create policy "Catalog managers manage collection products" on public.collection_products for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published collection media public" on public.collection_media for select to anon,authenticated using(exists(select 1 from public.collections c where c.id=collection_id and c.status='published') or public.has_role('media_manager'));
create policy "Media managers manage collection media" on public.collection_media for all to authenticated using(public.has_role('media_manager')) with check(public.has_role('media_manager'));
create policy "Customers manage own addresses" on public.customer_addresses for all to authenticated using(customer_id=(select auth.uid())) with check(customer_id=(select auth.uid()));
create policy "Customers manage own carts" on public.carts for all to authenticated using(customer_id=(select auth.uid())) with check(customer_id=(select auth.uid()));
create policy "Customers manage own cart items" on public.cart_items for all to authenticated using(exists(select 1 from public.carts c where c.id=cart_id and c.customer_id=(select auth.uid()))) with check(exists(select 1 from public.carts c where c.id=cart_id and c.customer_id=(select auth.uid())));
create policy "Customers read own orders" on public.orders for select to authenticated using(customer_id=(select auth.uid()) or public.has_role('order_manager'));
create policy "Order managers update orders" on public.orders for update to authenticated using(public.has_role('order_manager')) with check(
 status not in ('paid','processing','shipped','delivered') or
 exists(select 1 from public.payments p where p.order_id=public.orders.id and p.status='captured' and p.verified_at is not null) or
 (payment_method='cod' and status in ('processing','shipped') and exists(select 1 from public.payments p where p.order_id=public.orders.id and p.status='pending_collection')) or
 (payment_method='cod' and status='delivered' and exists(select 1 from public.payments p where p.order_id=public.orders.id and p.status='collected'))
);
revoke update on public.orders from authenticated;
grant update(status) on public.orders to authenticated;
create or replace function public.enforce_order_state_transition() returns trigger
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
begin
 if new.status=old.status or current_setting('request.jwt.claim.role',true)='service_role' then return new; end if;
 if old.status='pending_payment' and new.status='cancelled' then return new; end if;
 if old.status='pending_payment' and new.status='processing' and new.payment_method='cod' and exists(select 1 from public.payments p where p.order_id=old.id and p.status='pending_collection') then return new; end if;
 if old.status='paid' and new.status='processing' then return new; end if;
 if old.status='processing' and new.status='shipped' then return new; end if;
 if old.status='shipped' and new.status='delivered' and exists(select 1 from public.payments p where p.order_id=old.id and p.status in ('captured','collected')) then return new; end if;
 if old.status='processing' and new.status='delivered' and old.payment_method='cod' and exists(select 1 from public.payments p where p.order_id=old.id and p.status='collected') then return new; end if;
 raise exception 'Unsupported order status transition';
end $$;
drop trigger if exists enforce_order_state_transition on public.orders;
create trigger enforce_order_state_transition before update of status on public.orders for each row execute function public.enforce_order_state_transition();
create or replace function public.handle_order_cancellation() returns trigger
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare item record;
begin
 if new.status='cancelled' and old.status<>'cancelled' then
  if old.status not in ('pending_payment','processing') or exists(select 1 from public.payments p where p.order_id=old.id and p.status in ('captured','collected')) then
   raise exception 'This order cannot be cancelled through the unpaid-order workflow';
  end if;
  for item in select variant_id,quantity from public.order_items where order_id=old.id and variant_id is not null loop
   update public.inventory set quantity_reserved=greatest(0,quantity_reserved-item.quantity) where variant_id=item.variant_id;
  update public.stock_reservations set status='released',updated_at=now() where order_id=old.id and variant_id=item.variant_id and status='reserved';
  end loop;
  update public.payments set status='failed' where order_id=old.id and status in ('pending','pending_collection','authorized');
 end if;
 return new;
end $$;
drop trigger if exists release_stock_on_order_cancel on public.orders;
create trigger release_stock_on_order_cancel before update of status on public.orders for each row execute function public.handle_order_cancellation();

create or replace function public.complete_cod_collection(p_order_id uuid) returns void
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare item record;
begin
 if not public.has_role('order_manager') then raise exception 'Order manager permission required'; end if;
 if not exists(select 1 from public.orders o join public.payments p on p.order_id=o.id where o.id=p_order_id and o.payment_method='cod' and o.status in ('processing','shipped') and p.status='pending_collection') then
  raise exception 'COD order is not ready for collection confirmation';
 end if;
 for item in select variant_id,quantity from public.order_items where order_id=p_order_id and variant_id is not null loop
  update public.inventory set quantity_on_hand=quantity_on_hand-item.quantity,quantity_reserved=quantity_reserved-item.quantity where variant_id=item.variant_id;
  update public.stock_reservations set status='committed',updated_at=now() where order_id=p_order_id and variant_id=item.variant_id and status='reserved';
 end loop;
 update public.payments set status='collected',verified_at=now(),provider_payload=jsonb_build_object('method','cash_on_delivery','recorded_by',auth.uid()) where order_id=p_order_id and status='pending_collection';
 update public.orders set status='delivered' where id=p_order_id;
end $$;
revoke all on function public.complete_cod_collection(uuid) from public,anon;
grant execute on function public.complete_cod_collection(uuid) to authenticated;
create policy "Customers read own order items" on public.order_items for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=(select auth.uid()) or public.has_role('order_manager'))));
create policy "Customers read own payments" on public.payments for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and o.customer_id=(select auth.uid())) or public.has_role('order_manager'));
create policy "Order managers read payments" on public.payments for select to authenticated using(public.has_role('order_manager'));
create policy "Customers manage own wishlist" on public.wishlists for all to authenticated using(customer_id=(select auth.uid())) with check(customer_id=(select auth.uid()));
create policy "Customers manage own wishlist items" on public.wishlist_items for all to authenticated using(exists(select 1 from public.wishlists w where w.id=wishlist_id and w.customer_id=(select auth.uid()))) with check(exists(select 1 from public.wishlists w where w.id=wishlist_id and w.customer_id=(select auth.uid())));
create policy "Published campaigns public" on public.campaigns for select to anon,authenticated using(status='published' or public.has_role('catalog_manager'));
create policy "Catalog managers manage campaigns" on public.campaigns for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published homepage public" on public.homepage_sections for select to anon,authenticated using(is_published or public.has_role('catalog_manager'));
create policy "Catalog managers manage homepage" on public.homepage_sections for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Public newsletter subscribe only" on public.newsletter_subscribers for insert to anon,authenticated with check(status='pending');
create policy "Order managers manage newsletter" on public.newsletter_subscribers for all to authenticated using(public.has_role('order_manager')) with check(public.has_role('order_manager'));
create policy "Public read public settings" on public.store_settings for select to anon,authenticated using(is_public or public.has_role('admin'));
create policy "Admins manage store settings" on public.store_settings for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));

create or replace view public.variant_availability with (security_invoker=false) as
select v.id as variant_id, (i.quantity_on_hand-i.quantity_reserved)>0 as is_available
from public.product_variants v join public.products p on p.id=v.product_id
join public.inventory i on i.variant_id=v.id
where v.is_active and p.status='published';
grant select on public.variant_availability to anon,authenticated;


-- Customer checkout reserves inventory and snapshots live catalog data; payment remains pending.
create or replace function public.place_order_from_active_cart(p_address jsonb,p_idempotency_key text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid(); c uuid; cart_key uuid; o uuid; it record; available int; unit numeric(12,2); v_subtotal numeric(12,2):=0; v_ship numeric(12,2);
begin
 if u is null then raise exception 'Authentication required'; end if;
 if p_idempotency_key is null or length(p_idempotency_key)<16 or length(p_idempotency_key)>100 then raise exception 'Valid idempotency key required'; end if;
 perform pg_advisory_xact_lock(hashtextextended(u::text||p_idempotency_key,0));
 select id into o from public.orders where customer_id=u and idempotency_key=p_idempotency_key;
 if o is not null then return o; end if;
 if jsonb_typeof(p_address)<>'object' or not(p_address ?& array['recipient_name','phone','address_line_1','city','state','postal_code','country_code']) then raise exception 'Complete shipping address required'; end if;
 if exists(select 1 from unnest(array['recipient_name','phone','address_line_1','city','state','postal_code','country_code']) as fields(field_name) where coalesce(trim(p_address->>field_name),'')='') then raise exception 'Complete shipping address required'; end if;
 select id,checkout_idempotency_key into c,cart_key from public.carts where customer_id=u and status='active' for update;
 if c is null or not exists(select 1 from public.cart_items where cart_id=c) then raise exception 'Active cart is empty'; end if;
 if cart_key::text<>p_idempotency_key then raise exception 'Checkout key expired. Refresh the checkout and try again.'; end if;
 if exists(select 1 from public.cart_items ci join public.product_variants v on v.id=ci.variant_id join public.products p on p.id=v.product_id where ci.cart_id=c and (not v.is_active or p.status<>'published')) then raise exception 'Cart contains unavailable products'; end if;
 insert into public.orders(customer_id,idempotency_key,shipping_address_snapshot,customer_email_snapshot)
 select u,p_idempotency_key,p_address,coalesce(email,'') from public.customers where id=u returning id into o;
 insert into public.shipping_addresses(order_id,recipient_name,phone,address_line_1,address_line_2,city,state,postal_code,country_code)
 values(o,p_address->>'recipient_name',p_address->>'phone',p_address->>'address_line_1',coalesce(p_address->>'address_line_2',''),p_address->>'city',p_address->>'state',p_address->>'postal_code',coalesce(p_address->>'country_code','IN'));
 for it in
  select ci.variant_id,ci.quantity,v.product_id,v.sku,v.size,v.colour,v.price_override,p.name,p.slug,p.price
  from public.cart_items ci join public.product_variants v on v.id=ci.variant_id join public.products p on p.id=v.product_id
  where ci.cart_id=c order by v.id
 loop
  select quantity_on_hand-quantity_reserved into available from public.inventory where variant_id=it.variant_id for update;
  if available is null or available<it.quantity then raise exception 'Insufficient stock for SKU %',it.sku; end if;
  unit:=coalesce(it.price_override,it.price);
  update public.inventory set quantity_reserved=quantity_reserved+it.quantity where variant_id=it.variant_id;
  insert into public.stock_reservations(order_id,variant_id,quantity,status,expires_at) values(o,it.variant_id,it.quantity,'reserved',now()+interval '30 minutes');
  insert into public.order_items(order_id,variant_id,product_id,product_name_snapshot,product_slug_snapshot,sku_snapshot,size_snapshot,colour_snapshot,unit_price,quantity,line_total)
  values(o,it.variant_id,it.product_id,it.name,it.slug,it.sku,it.size,it.colour,unit,it.quantity,unit*it.quantity);
  v_subtotal:=v_subtotal+unit*it.quantity;
 end loop;
 v_ship:=case when v_subtotal>=coalesce((select setting_value::text::numeric from public.store_settings where setting_key='free_shipping_threshold'),1490)
              then 0 else coalesce((select setting_value::text::numeric from public.store_settings where setting_key='standard_shipping_fee'),99) end;
 update public.orders set subtotal=v_subtotal,shipping_total=v_ship,total=v_subtotal+v_ship where id=o;
 insert into public.payments(order_id,amount) values(o,v_subtotal+v_ship);
 update public.carts set status='converted' where id=c;
 return o;
end $$;
revoke all on function public.place_order_from_active_cart(jsonb,text) from public,anon;
grant execute on function public.place_order_from_active_cart(jsonb,text) to authenticated;

create or replace function public.get_checkout_idempotency_key() returns text
language plpgsql stable security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid(); result text;
begin
 if u is null then raise exception 'Authentication required'; end if;
 select idempotency_key into result from public.orders where customer_id=u and status='pending_payment' order by placed_at desc limit 1;
 if result is not null then return result; end if;
 select checkout_idempotency_key::text into result from public.carts where customer_id=u and status='active';
 return result;
end $$;
revoke all on function public.get_checkout_idempotency_key() from public,anon;
grant execute on function public.get_checkout_idempotency_key() to authenticated;

create or replace function public.place_cod_order(p_address jsonb,p_idempotency_key text) returns uuid
language plpgsql security definer set search_path=public,pg_temp as $$
declare u uuid:=auth.uid(); o uuid; cod_ok boolean; cod_limit numeric(12,2); cod_charge numeric(12,2);
begin
 if u is null then raise exception 'Authentication required'; end if;
 select coalesce((select setting_value::text::boolean from public.store_settings where setting_key='cod_enabled'),false),
        coalesce((select setting_value::text::numeric from public.store_settings where setting_key='cod_order_limit'),10000),
        coalesce((select setting_value::text::numeric from public.store_settings where setting_key='cod_surcharge'),0)
 into cod_ok,cod_limit,cod_charge;
 if not cod_ok then raise exception 'Cash on delivery is currently unavailable'; end if;
 o:=public.place_order_from_active_cart(p_address,p_idempotency_key);
 if exists(select 1 from public.orders where id=o and payment_method='cod') then return o; end if;
 if exists(select 1 from public.orders where id=o and payment_method<>'cod') then raise exception 'Checkout was already started with a different payment method'; end if;
 if (select total from public.orders where id=o)+cod_charge>cod_limit then raise exception 'Order total exceeds the cash on delivery limit'; end if;
 update public.payments set provider='cod',status='pending_collection',amount=amount+cod_charge where order_id=o;
 update public.orders set payment_method='cod',status='processing',cod_fee=cod_charge,total=total+cod_charge where id=o;
 return o;
end $$;
revoke all on function public.place_cod_order(jsonb,text) from public,anon;
grant execute on function public.place_cod_order(jsonb,text) to authenticated;

create or replace function public.set_variant_stock(p_variant_id uuid,p_quantity int) returns void
language plpgsql security definer set search_path=public,pg_temp as $$
declare reserved int;
begin
 if not public.has_role('catalog_manager') then raise exception 'Catalog manager permission required'; end if;
 if p_quantity<0 then raise exception 'Stock cannot be negative'; end if;
 select quantity_reserved into reserved from public.inventory where variant_id=p_variant_id for update;
 if reserved is null then raise exception 'Variant inventory not found'; end if;
 if p_quantity<reserved then raise exception 'Stock cannot be set below reserved quantity'; end if;
 update public.inventory set quantity_on_hand=p_quantity where variant_id=p_variant_id;
end $$;
revoke all on function public.set_variant_stock(uuid,int) from public,anon;
grant execute on function public.set_variant_stock(uuid,int) to authenticated;

create or replace function public.claim_razorpay_order_creation(p_order_id uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
declare claimed uuid;
begin
 if current_setting('request.jwt.claim.role',true)<>'service_role' then raise exception 'Trusted payment service only'; end if;
 update public.payments set provider='razorpay',provider_order_creation_started_at=now()
 where order_id=p_order_id and provider='unconfigured' and provider_order_id is null
   and provider_order_creation_started_at is null
 returning order_id into claimed;
 return claimed is not null;
end $$;
revoke all on function public.claim_razorpay_order_creation(uuid) from public,anon,authenticated;
grant execute on function public.claim_razorpay_order_creation(uuid) to service_role;

-- Only a verified provider webhook, called with service_role credentials, can mark an order paid.
create or replace function public.confirm_payment_from_webhook(p_order uuid,p_provider text,p_payment_id text,p_payload jsonb default '{}') returns void
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if current_setting('request.jwt.claim.role',true)<>'service_role' then raise exception 'Trusted payment webhook only'; end if;
 if exists(select 1 from public.payments where order_id=p_order and status='captured' and provider_payment_id=p_payment_id) then return; end if;
 if not exists(select 1 from public.orders where id=p_order and status='pending_payment') then raise exception 'Order is no longer awaiting payment'; end if;
 update public.payments set provider=p_provider,provider_payment_id=p_payment_id,status='captured',verified_at=now(),provider_payload=p_payload
 where order_id=p_order and status in ('pending','authorized','failed') and (provider_order_id is null or provider_order_id=p_payload->>'order_id');
 if not found then raise exception 'Pending payment not found'; end if;
 update public.orders set status='paid' where id=p_order and status='pending_payment';
 update public.inventory i set quantity_on_hand=i.quantity_on_hand-oi.quantity,quantity_reserved=i.quantity_reserved-oi.quantity
 from public.order_items oi where oi.order_id=p_order and oi.variant_id=i.variant_id;
end $$;
revoke all on function public.confirm_payment_from_webhook(uuid,text,text,jsonb) from public,anon,authenticated;
grant execute on function public.confirm_payment_from_webhook(uuid,text,text,jsonb) to service_role;

create or replace view public.media_reference_counts with (security_invoker=false) as
select m.id,m.original_filename,m.file_size_bytes,m.checksum_sha256,
 public.media_reference_count(m.id) as reference_count
from public.media_assets m where public.has_role('media_manager');
grant select on public.media_reference_counts to authenticated;

create or replace function public.expire_stale_payment_orders() returns integer
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare affected integer;
begin
 update public.orders o set status='cancelled'
 where o.status='pending_payment'
   and exists(select 1 from public.stock_reservations r where r.order_id=o.id and r.status='reserved' and r.expires_at<=now())
   and exists(select 1 from public.payments p where p.order_id=o.id and p.provider<>'cod' and p.status in ('pending','failed','authorized'));
 get diagnostics affected=row_count;
 return affected;
end $$;
revoke all on function public.expire_stale_payment_orders() from public,anon,authenticated;
grant execute on function public.expire_stale_payment_orders() to service_role;
