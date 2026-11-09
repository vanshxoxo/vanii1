-- Additive production extensions. Run after 202611090001_initial_commerce.sql.
create table if not exists public.product_sizes (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 size_name text not null, display_order int not null default 0, is_active boolean not null default true,
 unique(product_id,size_name)
);
create table if not exists public.product_colors (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 color_name text not null, color_hex text check(color_hex is null or color_hex ~ '^#[0-9A-Fa-f]{6}$'), display_order int not null default 0, is_active boolean not null default true,
 unique(product_id,color_name)
);
create table if not exists public.product_attributes (
 id uuid primary key default gen_random_uuid(), product_id uuid not null references public.products(id) on delete cascade,
 attribute_key text not null, attribute_value jsonb not null, is_public boolean not null default true, display_order int not null default 0,
 unique(product_id,attribute_key)
);
insert into public.product_sizes(product_id,size_name)
select distinct product_id,size from public.product_variants on conflict(product_id,size_name) do nothing;
insert into public.product_colors(product_id,color_name,color_hex)
select distinct product_id,colour,colour_hex from public.product_variants on conflict(product_id,color_name) do nothing;
create table if not exists public.order_status_history (
 id uuid primary key default gen_random_uuid(), order_id uuid not null references public.orders(id) on delete cascade,
 from_status text, to_status text not null, changed_by uuid references auth.users(id) on delete set null,
 source text not null default 'storefront', note text, created_at timestamptz not null default now()
);

create table if not exists public.banners (
 id uuid primary key default gen_random_uuid(), name text not null, placement text not null check(placement in ('home','shop','announcement','campaign')),
 desktop_asset_id uuid references public.media_assets(id) on delete set null, mobile_asset_id uuid references public.media_assets(id) on delete set null,
 heading text not null default '', body text not null default '', cta_label text, cta_href text,
 status text not null default 'draft' check(status in ('draft','scheduled','published','archived')),
 starts_at timestamptz, ends_at timestamptz, display_order int not null default 0,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.promotional_content (
 id uuid primary key default gen_random_uuid(), name text not null, promo_type text not null check(promo_type in ('campaign','announcement','offer')),
 body text not null default '', coupon_code text, starts_at timestamptz, ends_at timestamptz,
 status text not null default 'draft' check(status in ('draft','scheduled','published','archived')),
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.navigation_menus (
 id uuid primary key default gen_random_uuid(), menu_key text not null unique, name text not null,
 is_published boolean not null default false, updated_at timestamptz not null default now()
);
create table if not exists public.navigation_menu_items (
 id uuid primary key default gen_random_uuid(), menu_id uuid not null references public.navigation_menus(id) on delete cascade,
 parent_id uuid references public.navigation_menu_items(id) on delete cascade, label text not null, href text not null,
 display_order int not null default 0, is_published boolean not null default true
);
create table if not exists public.policies (
 id uuid primary key default gen_random_uuid(), policy_key text not null unique, title text not null,
 body_markdown text not null default '', is_published boolean not null default false,
 published_at timestamptz, updated_at timestamptz not null default now()
);
create table if not exists public.faqs (
 id uuid primary key default gen_random_uuid(), category text not null default 'general', question text not null,
 answer_markdown text not null, display_order int not null default 0, is_published boolean not null default false,
 created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.permissions (
 permission_key text primary key, description text not null
);
create table if not exists public.role_permissions (
 role text not null check(role in ('owner','admin','catalog_manager','media_manager','order_manager')),
 permission_key text not null references public.permissions(permission_key) on delete cascade,
 primary key(role,permission_key)
);
create table if not exists public.audit_logs (
 id bigint generated always as identity primary key, table_name text not null, record_id text,
 operation text not null check(operation in ('INSERT','UPDATE','DELETE')),
 actor_id uuid references auth.users(id) on delete set null, old_record jsonb, new_record jsonb,
 created_at timestamptz not null default now()
);
create index if not exists audit_logs_created_idx on public.audit_logs(created_at desc);
create index if not exists order_status_history_order_idx on public.order_status_history(order_id,created_at desc);
create index if not exists shipping_details_order_idx on public.shipments(order_id,created_at desc);
create index if not exists stock_reservations_status_expiry_idx on public.stock_reservations(status,expires_at);
alter table public.payment_transactions drop constraint if exists payment_transactions_provider_provider_transaction_id_key;

-- Existing entities are exposed under common storefront terminology without duplicating rows.
create or replace view public.profiles with (security_invoker=true) as select * from public.customers;
create or replace view public.user_roles with (security_invoker=true) as select id,user_id,role,created_at from public.admin_roles;
create or replace view public.admin_users with (security_invoker=true) as
 select c.id as user_id,c.email,c.full_name,r.role from public.customers c join public.admin_roles r on r.user_id=c.id;
create or replace view public.product_images with (security_invoker=true) as select * from public.product_media;
create or replace view public.shipping_details with (security_invoker=true) as
 select id,order_id,provider,provider_order_id,shipment_id,awb_code,courier_name,status,tracking_url,raw_status,provider_payload,created_at,updated_at from public.shipments;
grant select on public.profiles,public.user_roles,public.admin_users,public.product_images,public.shipping_details to authenticated;
grant select on public.profiles,public.product_images to anon;

do $$ declare t text; begin
 foreach t in array array['stock_reservations','shipping_addresses','shipments','order_status_history','payment_transactions','refunds','product_sizes','product_colors','product_attributes','banners','promotional_content','navigation_menus','navigation_menu_items','policies','faqs','permissions','role_permissions','audit_logs'] loop
  execute format('alter table public.%I enable row level security',t);
 end loop;
end $$;

create policy "Public product size options" on public.product_sizes for select to anon,authenticated using(is_active and exists(select 1 from public.products p where p.id=product_id and p.status='published') or public.has_role('catalog_manager'));
create policy "Catalog managers manage product sizes" on public.product_sizes for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Public product color options" on public.product_colors for select to anon,authenticated using(is_active and exists(select 1 from public.products p where p.id=product_id and p.status='published') or public.has_role('catalog_manager'));
create policy "Catalog managers manage product colors" on public.product_colors for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Public product attributes" on public.product_attributes for select to anon,authenticated using((is_public and exists(select 1 from public.products p where p.id=product_id and p.status='published')) or public.has_role('catalog_manager'));
create policy "Catalog managers manage product attributes" on public.product_attributes for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));

create policy "Customers read own stock reservations" on public.stock_reservations for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=(select auth.uid()) or public.has_role('order_manager'))));
create policy "Customers read own shipping addresses" on public.shipping_addresses for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=(select auth.uid()) or public.has_role('order_manager'))));
create policy "Customers read own shipments" on public.shipments for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=(select auth.uid()) or public.has_role('order_manager'))));
create policy "Order managers manage shipments" on public.shipments for all to authenticated using(public.has_role('order_manager')) with check(public.has_role('order_manager'));
create policy "Customers read own order status history" on public.order_status_history for select to authenticated using(exists(select 1 from public.orders o where o.id=order_id and (o.customer_id=(select auth.uid()) or public.has_role('order_manager'))));
create policy "Customers read own payment transactions" on public.payment_transactions for select to authenticated using(exists(select 1 from public.payments p join public.orders o on o.id=p.order_id where p.id=payment_id and (o.customer_id=(select auth.uid()) or public.has_role('order_manager'))));
create policy "Customers read own refunds" on public.refunds for select to authenticated using(exists(select 1 from public.payments p join public.orders o on o.id=p.order_id where p.id=payment_id and (o.customer_id=(select auth.uid()) or public.has_role('order_manager'))));
revoke insert,update,delete on public.refunds from authenticated;

create policy "Published banners public" on public.banners for select to anon,authenticated using((status='published' and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now())) or public.has_role('catalog_manager'));
create policy "Catalog managers manage banners" on public.banners for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published promotional content public" on public.promotional_content for select to anon,authenticated using((status='published' and (starts_at is null or starts_at<=now()) and (ends_at is null or ends_at>now())) or public.has_role('catalog_manager'));
create policy "Catalog managers manage promotional content" on public.promotional_content for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published navigation public" on public.navigation_menus for select to anon,authenticated using(is_published or public.has_role('catalog_manager'));
create policy "Catalog managers manage navigation" on public.navigation_menus for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published navigation items public" on public.navigation_menu_items for select to anon,authenticated using(is_published and exists(select 1 from public.navigation_menus m where m.id=menu_id and m.is_published) or public.has_role('catalog_manager'));
create policy "Catalog managers manage navigation items" on public.navigation_menu_items for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published policies public" on public.policies for select to anon,authenticated using(is_published or public.has_role('catalog_manager'));
create policy "Catalog managers manage policies" on public.policies for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Published FAQs public" on public.faqs for select to anon,authenticated using(is_published or public.has_role('catalog_manager'));
create policy "Catalog managers manage FAQs" on public.faqs for all to authenticated using(public.has_role('catalog_manager')) with check(public.has_role('catalog_manager'));
create policy "Admins read permissions" on public.permissions for select to authenticated using(public.has_role('admin'));
create policy "Admins manage role permissions" on public.role_permissions for all to authenticated using(public.has_role('admin')) with check(public.has_role('admin'));
create policy "Owners read audit logs" on public.audit_logs for select to authenticated using(public.has_role('owner') or public.has_role('admin'));

create or replace function public.track_order_status_change() returns trigger
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
begin
 if tg_op='INSERT' then
  insert into public.order_status_history(order_id,to_status,changed_by,source) values(new.id,new.status,auth.uid(),case when auth.role()='service_role' then 'system' else 'checkout' end);
 elsif new.status is distinct from old.status then
  insert into public.order_status_history(order_id,from_status,to_status,changed_by,source)
  values(new.id,old.status,new.status,auth.uid(),case when auth.role()='service_role' then 'system' else 'admin' end);
 end if;
 return new;
end $$;
drop trigger if exists order_status_history_trigger on public.orders;
create trigger order_status_history_trigger after insert or update of status on public.orders for each row execute function public.track_order_status_change();

create or replace function public.audit_sensitive_changes() returns trigger
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare old_json jsonb; new_json jsonb; row_id text;
begin
 if tg_op<>'INSERT' then old_json:=to_jsonb(old); row_id:=coalesce(old_json->>'id',old_json->>'setting_key',old_json->>'variant_id'); end if;
 if tg_op<>'DELETE' then new_json:=to_jsonb(new); row_id:=coalesce(new_json->>'id',new_json->>'setting_key',new_json->>'variant_id',row_id); end if;
 insert into public.audit_logs(table_name,record_id,operation,actor_id,old_record,new_record)
 values(tg_table_name,row_id,tg_op,auth.uid(),old_json,new_json);
 if tg_op='DELETE' then return old; end if;
 return new;
end $$;
do $$ declare t text; begin
 foreach t in array array['products','product_variants','inventory','categories','collections','media_assets','homepage_sections','store_settings','banners','policies','faqs','navigation_menus','admin_roles'] loop
  execute format('drop trigger if exists audit_sensitive_change on public.%I',t);
  execute format('create trigger audit_sensitive_change after insert or update or delete on public.%I for each row execute function public.audit_sensitive_changes()',t);
 end loop;
end $$;

create or replace function public.record_payment_transaction() returns trigger
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare local_payment_id uuid; local_kind text;
begin
 if new.status is not distinct from old.status then return new; end if;
 select id into local_payment_id from public.payments where order_id=new.order_id;
 local_kind:=case new.status when 'captured' then 'capture' when 'failed' then 'failure' when 'refunded' then 'refund' when 'authorized' then 'authorization' else 'adjustment' end;
 insert into public.payment_transactions(payment_id,provider,provider_transaction_id,transaction_type,status,amount,currency,provider_payload)
 values(local_payment_id,new.provider,new.provider_payment_id,local_kind,new.status,new.amount,new.currency,new.provider_payload);
 return new;
end $$;
drop trigger if exists payment_transaction_audit on public.payments;
create trigger payment_transaction_audit after update of status on public.payments for each row execute function public.record_payment_transaction();

create or replace function public.claim_shiprocket_shipment(p_order_id uuid) returns jsonb
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare shipment_row public.shipments%rowtype; inserted_id uuid;
begin
 if current_setting('request.jwt.claim.role',true)<>'service_role' then raise exception 'Trusted shipping service only'; end if;
 if not exists(select 1 from public.orders o join public.payments p on p.order_id=o.id
   where o.id=p_order_id and (p.status='captured' or (o.payment_method='cod' and p.status='pending_collection'))
   and o.status in ('paid','processing','shipped')) then raise exception 'Order is not eligible for shipment'; end if;
 insert into public.shipments(order_id,provider,status,creation_started_at) values(p_order_id,'shiprocket','pending',now())
 on conflict(order_id,provider) do nothing returning id into inserted_id;
 if inserted_id is not null then return jsonb_build_object('id',inserted_id,'claimed',true); end if;
 select * into shipment_row from public.shipments where order_id=p_order_id and provider='shiprocket';
 return jsonb_build_object('id',shipment_row.id,'claimed',false);
end $$;
revoke all on function public.claim_shiprocket_shipment(uuid) from public,anon,authenticated;
grant execute on function public.claim_shiprocket_shipment(uuid) to service_role;

create or replace function public.request_refund(p_payment_id uuid,p_amount numeric,p_reason text,p_idempotency_key text,p_actor uuid) returns uuid
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare payment_row public.payments%rowtype; refund_id uuid; already_reserved numeric(12,2);
begin
 if current_setting('request.jwt.claim.role',true)<>'service_role' then raise exception 'Trusted refund service only'; end if;
 if p_amount<=0 or p_idempotency_key is null or length(p_idempotency_key)<16 or length(p_idempotency_key)>100 then raise exception 'Valid refund amount and idempotency key required'; end if;
 select id into refund_id from public.refunds where idempotency_key=p_idempotency_key;
 if refund_id is not null then return refund_id; end if;
 select * into payment_row from public.payments where id=p_payment_id for update;
 if payment_row.id is null or payment_row.status<>'captured' then raise exception 'Only captured payments can be refunded'; end if;
 select id into refund_id from public.refunds where idempotency_key=p_idempotency_key;
 if refund_id is not null then return refund_id; end if;
 select coalesce(sum(amount),0) into already_reserved from public.refunds where payment_id=p_payment_id and status in ('pending','processed');
 if p_amount>payment_row.amount-already_reserved then raise exception 'Refund amount exceeds the remaining captured amount'; end if;
 insert into public.refunds(payment_id,amount,reason,idempotency_key,requested_by)
 values(p_payment_id,p_amount,nullif(trim(p_reason),''),p_idempotency_key,p_actor) returning id into refund_id;
 return refund_id;
end $$;
revoke all on function public.request_refund(uuid,numeric,text,text,uuid) from public,anon,authenticated;
grant execute on function public.request_refund(uuid,numeric,text,text,uuid) to service_role;

create or replace function public.claim_refund_provider_request(p_refund_id uuid) returns boolean
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if current_setting('request.jwt.claim.role',true)<>'service_role' then raise exception 'Trusted refund service only'; end if;
 update public.refunds set provider_request_started_at=now() where id=p_refund_id and status='pending' and provider_refund_id is null and provider_request_started_at is null;
 return found;
end $$;
revoke all on function public.claim_refund_provider_request(uuid) from public,anon,authenticated;
grant execute on function public.claim_refund_provider_request(uuid) to service_role;

create or replace function public.media_reference_count(p_asset_id uuid) returns bigint
language plpgsql stable security definer set search_path=public,pg_temp set row_security=off as $$
begin
 if not public.has_role('media_manager') then raise exception 'Media manager permission required'; end if;
 return (select count(*) from public.product_media where asset_id=p_asset_id)
      + (select count(*) from public.collection_media where asset_id=p_asset_id)
      + (select count(*) from public.collections where cover_asset_id=p_asset_id)
      + (select count(*) from public.categories where image_asset_id=p_asset_id)
      + (select count(*) from public.homepage_sections where desktop_asset_id=p_asset_id or mobile_asset_id=p_asset_id)
      + (select count(*) from public.banners where desktop_asset_id=p_asset_id or mobile_asset_id=p_asset_id);
end $$;

drop trigger if exists set_updated_at on public.banners;
create trigger set_updated_at before update on public.banners for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.promotional_content;
create trigger set_updated_at before update on public.promotional_content for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.navigation_menus;
create trigger set_updated_at before update on public.navigation_menus for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.policies;
create trigger set_updated_at before update on public.policies for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.faqs;
create trigger set_updated_at before update on public.faqs for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.refunds;
create trigger set_updated_at before update on public.refunds for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.shipments;
create trigger set_updated_at before update on public.shipments for each row execute function public.set_updated_at();
drop trigger if exists set_updated_at on public.stock_reservations;
create trigger set_updated_at before update on public.stock_reservations for each row execute function public.set_updated_at();

insert into public.permissions(permission_key,description) values
 ('catalog.manage','Create and edit product catalog'),('media.manage','Upload and manage media assets'),
 ('orders.manage','Review orders, fulfill shipments and record COD collection'),('store.settings','Manage store settings'),('roles.manage','Manage admin roles and permissions')
on conflict(permission_key) do nothing;
insert into public.role_permissions(role,permission_key) values
 ('owner','catalog.manage'),('owner','media.manage'),('owner','orders.manage'),('owner','store.settings'),('owner','roles.manage'),
 ('admin','catalog.manage'),('admin','media.manage'),('admin','orders.manage'),('admin','store.settings'),
 ('catalog_manager','catalog.manage'),('media_manager','media.manage'),('order_manager','orders.manage')
on conflict do nothing;
