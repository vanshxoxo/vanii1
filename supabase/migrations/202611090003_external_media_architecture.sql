-- Product and storefront media live in a dedicated CDN. PostgreSQL keeps references only.
alter table public.media_assets alter column provider set default 'cloudinary';
alter table public.media_assets add column if not exists provider_asset_id text;
alter table public.media_assets add column if not exists resource_type text not null default 'image' check(resource_type in ('image','video','raw'));
alter table public.media_assets add column if not exists delivery_url text;
alter table public.media_assets add column if not exists format text;
alter table public.media_assets add column if not exists derived_urls jsonb not null default '{}'::jsonb;
alter table public.media_assets add column if not exists lifecycle_status text not null default 'active' check(lifecycle_status in ('active','deleting'));
alter table public.media_assets alter column provider drop default;
alter table public.media_assets drop constraint if exists media_assets_provider_check;
alter table public.media_assets add constraint media_assets_provider_check check(provider in ('cloudinary','imagekit','external','supabase'));
alter table public.media_assets drop constraint if exists media_assets_check;
alter table public.media_assets add constraint media_assets_provider_location_check check(
 (provider in ('cloudinary','imagekit') and provider_asset_id is not null and delivery_url is not null and bucket_id is null and storage_path is null and external_url is null)
 or (provider='external' and (delivery_url is not null or external_url is not null) and bucket_id is null and storage_path is null)
 or (provider='supabase' and bucket_id is not null and storage_path is not null and external_url is null)
);
create unique index if not exists media_provider_asset_unique on public.media_assets(provider,provider_asset_id) where provider_asset_id is not null;
revoke delete on public.media_assets from authenticated,anon;
drop policy if exists "Media managers delete unreferenced assets" on public.media_assets;

create or replace function public.guard_media_reference() returns trigger
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare aid uuid; state text;
begin
 if tg_table_name in ('product_media','collection_media') then aid:=new.asset_id;
 elsif tg_table_name='categories' then aid:=new.image_asset_id;
 elsif tg_table_name='collections' then aid:=new.cover_asset_id;
 elsif tg_table_name in ('homepage_sections','banners') then
  if new.desktop_asset_id is not null then select lifecycle_status into state from public.media_assets where id=new.desktop_asset_id for key share; if state='deleting' then raise exception 'Media is being deleted and cannot be attached'; end if; end if;
  if new.mobile_asset_id is not null then select lifecycle_status into state from public.media_assets where id=new.mobile_asset_id for key share; if state='deleting' then raise exception 'Media is being deleted and cannot be attached'; end if; end if;
  return new;
 else return new; end if;
 if aid is not null then select lifecycle_status into state from public.media_assets where id=aid for key share; end if;
 if state='deleting' then
  raise exception 'Media is being deleted and cannot be attached';
 end if;
 return new;
end $$;
revoke all on function public.guard_media_reference() from public,anon,authenticated;
do $$ declare t text; begin
 foreach t in array array['product_media','collection_media','categories','collections','homepage_sections','banners'] loop
  execute format('drop trigger if exists guard_media_reference on public.%I',t);
  execute format('create trigger guard_media_reference before insert or update on public.%I for each row execute function public.guard_media_reference()',t);
 end loop;
end $$;

create or replace function public.claim_external_media_deletion(p_asset_id uuid)
returns table(provider text,provider_asset_id text,resource_type text)
language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
declare a public.media_assets%rowtype; refs bigint;
begin
 if current_setting('request.jwt.claim.role',true)<>'service_role' then raise exception 'Trusted media service only'; end if;
 select * into a from public.media_assets where id=p_asset_id for update;
 if not found then raise exception 'Media asset not found'; end if;
 select (select count(*) from public.product_media where asset_id=p_asset_id)
      + (select count(*) from public.collection_media where asset_id=p_asset_id)
      + (select count(*) from public.collections where cover_asset_id=p_asset_id)
      + (select count(*) from public.categories where image_asset_id=p_asset_id)
      + (select count(*) from public.homepage_sections where desktop_asset_id=p_asset_id or mobile_asset_id=p_asset_id)
      + (select count(*) from public.banners where desktop_asset_id=p_asset_id or mobile_asset_id=p_asset_id)
 into refs;
 if refs>0 then raise exception 'Media is still referenced and cannot be deleted'; end if;
 update public.media_assets set lifecycle_status='deleting' where id=p_asset_id;
 return query select a.provider,a.provider_asset_id,a.resource_type;
end $$;
revoke all on function public.claim_external_media_deletion(uuid) from public,anon,authenticated;
grant execute on function public.claim_external_media_deletion(uuid) to service_role;

create or replace function public.release_external_media_deletion(p_asset_id uuid)
returns void language plpgsql security definer set search_path=public,pg_temp set row_security=off as $$
begin
 if current_setting('request.jwt.claim.role',true)<>'service_role' then raise exception 'Trusted media service only'; end if;
 update public.media_assets set lifecycle_status='active' where id=p_asset_id and lifecycle_status='deleting';
end $$;
revoke all on function public.release_external_media_deletion(uuid) from public,anon,authenticated;
grant execute on function public.release_external_media_deletion(uuid) to service_role;

comment on table public.media_assets is 'Media metadata and provider references only. Product binaries and variants live in an external media provider/CDN.';
comment on column public.media_assets.derived_urls is 'Optional provider-generated thumbnail and responsive variant URLs; generated/delivered by the external media provider.';
