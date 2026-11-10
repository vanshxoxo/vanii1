-- Safe catalog intake scaffolding. These are explicitly incomplete, unpublished
-- owner-intake records. No prices, SKUs, variants, inventory or media are made up.

alter table public.products alter column price drop not null;
alter table public.products drop constraint if exists products_price_check;
alter table public.products add constraint products_price_check check (price is null or price >= 0);
alter table public.products drop constraint if exists products_compare_at_price_check;
alter table public.products add constraint products_compare_at_price_check
  check (compare_at_price is null or (price is not null and compare_at_price >= price));
alter table public.products drop constraint if exists products_published_price_required;
alter table public.products add constraint products_published_price_required
  check (status <> 'published' or price > 0);

with slots as (
  select c.id as category_id, c.name, c.slug, n.slot
  from public.categories c
  cross join generate_series(1, 3) as n(slot)
  where c.kind = 'product' and c.is_active
)
insert into public.products(name, slug, description, material, fabric_composition, care_instructions, price, status, tags)
select s.name || ' · Intake draft ' || lpad(s.slot::text, 2, '0'),
       'owner-intake-' || s.slug || '-' || lpad(s.slot::text, 2, '0'),
       '', '', '', '', null, 'draft',
       array['owner-intake', 'approval-required', 'missing:product-name', 'missing:price',
             'missing:description', 'missing:material', 'missing:care', 'missing:photographs',
             'missing:variants', 'missing:sku', 'missing:stock', 'missing:age-group']
from slots s
on conflict (slug) do nothing;

insert into public.product_categories(product_id, category_id)
select p.id, c.id
from public.products p
join public.categories c on c.kind='product'
  and p.slug like 'owner-intake-' || c.slug || '-__'
where p.tags @> array['owner-intake']
  and right(p.slug, 2) in ('01','02','03')
on conflict (product_id, category_id) do nothing;

create or replace function public.admin_dashboard_summary() returns jsonb
language plpgsql stable security definer set search_path=public,pg_temp set row_security=off as $$
declare result jsonb;
begin
  if not public.has_role('admin') then raise exception 'Admin access required'; end if;
  select jsonb_build_object(
    'total_products', (select count(*) from public.products),
    'published_products', (select count(*) from public.products where status='published'),
    'draft_products', (select count(*) from public.products where status='draft'),
    'active_categories', (select count(*) from public.categories where is_active),
    'available_units', (select coalesce(sum(i.quantity_on_hand-i.quantity_reserved),0) from public.inventory i join public.product_variants v on v.id=i.variant_id where v.is_active),
    'out_of_stock_variants', (select count(*) from public.inventory i join public.product_variants v on v.id=i.variant_id where v.is_active and i.quantity_on_hand<=i.quantity_reserved),
    'total_orders', (select count(*) from public.orders),
    'recognized_revenue', (select coalesce(sum(case when p.status in ('captured','refunded') and p.verified_at is not null then p.amount when p.status='collected' and o.payment_method='cod' then p.amount else 0 end),0) - coalesce((select sum(r.amount) from public.refunds r where r.status='processed'),0)
      from public.payments p join public.orders o on o.id=p.order_id
    ),
    'recent_activity', coalesce((select jsonb_agg(jsonb_build_object('table_name',a.table_name,'record_id',a.record_id,'operation',a.operation,'created_at',a.created_at) order by a.created_at desc)
      from (select table_name,record_id,operation,created_at from public.audit_logs order by created_at desc limit 8) a), '[]'::jsonb)
  ) into result;
  return result;
end $$;
revoke all on function public.admin_dashboard_summary() from public, anon;
grant execute on function public.admin_dashboard_summary() to authenticated;

