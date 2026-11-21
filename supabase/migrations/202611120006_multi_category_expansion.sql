-- Multi-category commerce expansion: Jewellery, Women's Unstitched Suits, Home Textiles, Children's Clothing.
-- Non-destructive; preserves existing products, variants, orders, inventory and RLS policies.

-- 1. Extend products with product_type and specifications JSONB
alter table public.products
  add column if not exists product_type text not null default 'kids'
  check (product_type in ('kids', 'jewellery', 'women_suits', 'home_textiles'));

alter table public.products
  add column if not exists specifications jsonb not null default '{}'::jsonb;

-- 2. Extend categories with department column
alter table public.categories
  add column if not exists department text not null default 'kids'
  check (department in ('kids', 'jewellery', 'women_suits', 'home_textiles'));

-- 3. Ensure existing categories are marked as kids department
update public.categories set department = 'kids' where department is null or department = 'kids';

-- 4. Seed new department categories (safe insert on conflict)
insert into public.categories (kind, department, name, slug, description, display_order, is_active)
values
  -- Jewellery
  ('product', 'jewellery', 'Necklace Sets', 'necklace-sets', 'Handcrafted necklace sets, chokers and matching earrings', 10, true),
  ('product', 'jewellery', 'Earrings', 'earrings', 'Studs, jhumkas, drops, chandbalis and statement earrings', 11, true),
  ('product', 'jewellery', 'Rings', 'rings', 'Artisanal rings in fixed and adjustable sizes', 12, true),

  -- Women's Unstitched Suits
  ('product', 'women_suits', 'Women''s Unstitched Suits', 'womens-unstitched-suits', 'Curated unstitched 2-piece and 3-piece salwar suit fabrics', 20, true),
  ('product', 'women_suits', 'Cotton Suits', 'cotton-suits', 'Breathable pure cotton unstitched suit sets for everyday and occasion wear', 21, true),
  ('product', 'women_suits', 'Silk Suits', 'silk-suits', 'Lustrous festive pure and blended silk suit lengths', 22, true),
  ('product', 'women_suits', 'Organza Suits', 'organza-suits', 'Delicate, sheer organza suits with artisanal embroidery', 23, true),
  ('product', 'women_suits', 'Banarasi Suits', 'banarasi-suits', 'Heritage Banarasi brocade and zari woven suit sets', 24, true),
  ('product', 'women_suits', 'Rayon Suits', 'rayon-suits', 'Fluid, soft-drape rayon unstitched fabrics', 25, true),
  ('product', 'women_suits', 'Wool Suits', 'wool-suits', 'Warm, elegant pure wool and pashmina-blend winter suit fabrics', 26, true),

  -- Home Textiles
  ('product', 'home_textiles', 'Cotton Bedsheets', 'cotton-bedsheets', 'Pure cotton bedsheets crafted for cool, restful sleep', 30, true),
  ('product', 'home_textiles', 'Double Bedsheets with Pillow Covers', 'double-bedsheets-pillow-covers', 'Generously sized double bedsheets with matching pillow covers', 31, true),
  ('product', 'home_textiles', 'Single Bedsheets with Pillow', 'single-bedsheets-pillow', 'Single bedsheets with matching pillow cover', 32, true),
  ('product', 'home_textiles', 'Pillow Covers', 'pillow-covers', 'Artisanal pillow covers with envelope and zipper closures', 33, true),
  ('product', 'home_textiles', 'Single Bed Top Sheets / Chaddars', 'single-bed-top-sheets', 'Pure cotton single-bed top sheets and odhne wali chaddars', 34, true)
on conflict (slug) do update set
  department = excluded.department,
  description = excluded.description,
  is_active = true;

-- 5. Update product publish validation trigger to accommodate all four departments
create or replace function public.validate_product_for_publish() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
declare
  v_prod_type text;
begin
  if new.status = 'published' then
    v_prod_type := coalesce(new.product_type, 'kids');

    -- Common validation across all product types:
    if new.price is null or new.price <= 0 then
      raise exception 'A published product needs a verified price greater than zero';
    end if;

    if new.tags && array['owner-intake','owner-review-required','proposed-name','proposed-price'] then
      raise exception 'Proposed launch information must be owner-verified before publication';
    end if;

    if nullif(trim(new.name), '') is null then
      raise exception 'A published product needs a verified product name';
    end if;

    if nullif(trim(new.description), '') is null then
      raise exception 'A published product needs a verified description';
    end if;

    -- Department-specific validation:
    if v_prod_type = 'kids' then
      -- Children's clothing requires verified fabric, care, size measurements, product category, and age group
      if (nullif(trim(new.material), '') is null and nullif(trim(new.fabric_composition), '') is null)
         or nullif(trim(new.care_instructions), '') is null
         or nullif(trim(new.size_measurements), '') is null then
        raise exception 'A published children''s clothing item needs verified description, fabric, care, and garment measurements';
      end if;

      if not exists(
        select 1 from public.product_categories pc
        join public.categories c on c.id = pc.category_id
        where pc.product_id = new.id and c.kind = 'product' and c.is_active
      ) or not exists(
        select 1 from public.product_categories pc
        join public.categories c on c.id = pc.category_id
        where pc.product_id = new.id and c.kind = 'age' and c.is_active
      ) then
        raise exception 'A published children''s clothing item needs an active product category and confirmed age group';
      end if;

    else
      -- Non-kids categories (jewellery, women_suits, home_textiles):
      -- Require an active product category, but DO NOT require an age category or kids garment measurements.
      if not exists(
        select 1 from public.product_categories pc
        join public.categories c on c.id = pc.category_id
        where pc.product_id = new.id and c.kind = 'product' and c.is_active
      ) then
        raise exception 'A published product needs at least one active product category';
      end if;
    end if;

    -- Common variant and inventory validation:
    if not exists(
      select 1 from public.product_variants v
      join public.inventory i on i.variant_id = v.id
      where v.product_id = new.id and v.is_active
        and nullif(trim(v.sku), '') is not null
        and nullif(trim(v.size), '') is not null
        and nullif(trim(v.colour), '') is not null
    ) then
      raise exception 'A published product needs at least one complete variant, SKU, and inventory record';
    end if;

    -- Common media validation:
    if not exists(
      select 1 from public.product_media pm
      join public.media_assets ma on ma.id = pm.asset_id
      where pm.product_id = new.id and ma.provider = 'imagekit'
        and ma.purpose = 'product' and ma.lifecycle_status = 'active'
    ) then
      raise exception 'A published product needs an active ImageKit product photograph';
    end if;
  end if;

  return new;
end $$;

drop trigger if exists validate_product_publish on public.products;
create trigger validate_product_publish before insert or update of status on public.products
for each row execute function public.validate_product_for_publish();
