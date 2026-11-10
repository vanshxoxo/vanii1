-- Proposed Little Loom launch assortment. All records remain unpublished drafts.
-- No variants, SKUs, inventory, media, customers, orders, payments, or age-category
-- links are fabricated. Suggested ages are stored as review-only tags.

alter table public.products
  add column if not exists size_measurements text not null default '';

create or replace function public.validate_product_for_publish() returns trigger
language plpgsql security definer set search_path=public,pg_temp as $$
begin
 if new.status='published' then
  if new.price is null or new.price <= 0 then
   raise exception 'A published product needs a verified price greater than zero';
  end if;
  if new.tags && array['owner-intake','owner-review-required','proposed-name','proposed-price'] then
   raise exception 'Proposed launch information must be owner-verified before publication';
  end if;
  if nullif(trim(new.description),'') is null
     or (nullif(trim(new.material),'') is null and nullif(trim(new.fabric_composition),'') is null)
     or nullif(trim(new.care_instructions),'') is null
     or nullif(trim(new.size_measurements),'') is null then
   raise exception 'A published product needs verified description, fabric, care, and garment measurements';
  end if;
  if not exists(select 1 from public.product_categories pc join public.categories c on c.id=pc.category_id where pc.product_id=new.id and c.kind='product' and c.is_active)
     or not exists(select 1 from public.product_categories pc join public.categories c on c.id=pc.category_id where pc.product_id=new.id and c.kind='age' and c.is_active) then
   raise exception 'A published product needs an active product category and confirmed age group';
  end if;
  if not exists(
    select 1 from public.product_variants v
    join public.inventory i on i.variant_id=v.id
    where v.product_id=new.id and v.is_active and nullif(trim(v.sku),'') is not null
      and nullif(trim(v.size),'') is not null and nullif(trim(v.colour),'') is not null
  ) then
   raise exception 'A published product needs at least one complete variant, SKU, and inventory record';
  end if;
  if not exists(
    select 1 from public.product_media pm
    join public.media_assets ma on ma.id=pm.asset_id
    where pm.product_id=new.id and ma.provider='imagekit' and ma.purpose='product' and ma.lifecycle_status='active'
  ) then
   raise exception 'A published product needs an active ImageKit product photograph';
  end if;
 end if;
 return new;
end $$;

drop trigger if exists validate_product_publish on public.products;
create trigger validate_product_publish before insert or update of status on public.products
for each row execute function public.validate_product_for_publish();

do $$
declare
  item record;
  v_product_id uuid;
  v_category_id uuid;
  v_slug text;
  v_base_slug text;
  v_attempt integer;
  v_tags text[];
begin
  perform pg_advisory_xact_lock(hashtext('littleloom-launch-assortment-005'));

  for item in
    select * from (values
      ('soft-play-romper','rompers',1,'Soft Play Romper',799::numeric,'baby','A relaxed everyday silhouette for little moments.'),
      ('little-sun-romper','rompers',2,'Little Sun Romper',999::numeric,'toddler','A bright, easygoing look for the first assortment.'),
      ('everyday-snap-romper','rompers',3,'Everyday Snap Romper',899::numeric,'newborn','A simple one-piece concept with a familiar feel.'),
      ('sunday-cotton-coord','co-ord-sets',1,'Sunday Cotton Co-ord',1499::numeric,'toddler','An easy two-piece idea for unhurried days.'),
      ('playday-tee-shorts-set','co-ord-sets',2,'Playday Tee & Shorts Set',1299::numeric,'little-kids','A playful pairing proposed for everyday dressing.'),
      ('weekend-lounge-set','co-ord-sets',3,'Weekend Lounge Set',1599::numeric,'baby','A laid-back set concept for slower weekends.'),
      ('everyday-cotton-tee','tees-tops',1,'Everyday Cotton Tee',499::numeric,'toddler','A considered staple for a small everyday wardrobe.'),
      ('little-bloom-tee','tees-tops',2,'Little Bloom Tee',599::numeric,'toddler','A cheerful top concept with a gentle point of view.'),
      ('peter-pan-collar-top','tees-tops',3,'Peter Pan Collar Top',699::numeric,'baby','A classic collar idea for a more dressed-up day.'),
      ('daisy-day-dress','dresses',1,'Daisy Day Dress',1199::numeric,'toddler','A bright dress concept for days out and about.'),
      ('gathered-cotton-dress','dresses',2,'Gathered Cotton Dress',1399::numeric,'baby','A softly gathered silhouette proposed for the range.'),
      ('occasion-smock-dress','dresses',3,'Occasion Smock Dress',1699::numeric,'little-kids','A special-day dress concept with a timeless shape.'),
      ('easy-pull-on-pants','bottoms',1,'Easy Pull-on Pants',699::numeric,'toddler','A straightforward bottomwear idea for little wardrobes.'),
      ('everyday-cotton-shorts','bottoms',2,'Everyday Cotton Shorts',599::numeric,'little-kids','A simple shorts concept for warm-weather outfits.'),
      ('relaxed-joggers','bottoms',3,'Relaxed Joggers',899::numeric,'toddler','An easy jogger silhouette proposed for everyday wear.'),
      ('cloud-cotton-pj-set','sleepwear',1,'Cloud Cotton PJ Set',1199::numeric,'baby','A two-piece sleepwear idea for a quieter end to the day.'),
      ('little-moon-sleepsuit','sleepwear',2,'Little Moon Sleepsuit',899::numeric,'newborn','A one-piece sleepwear concept for the proposed range.'),
      ('bedtime-two-piece-set','sleepwear',3,'Bedtime Two-Piece Set',1099::numeric,'little-kids','A calm two-piece idea for a little bedtime routine.')
    ) as assortment(proposal_key,category_slug,slot,product_name,proposed_price,suggested_age,proposed_description)
  loop
    select id into v_category_id from public.categories where kind='product' and slug=item.category_slug and is_active;
    if v_category_id is null then
      raise exception 'Required active product category % is missing', item.category_slug;
    end if;

    -- A previous run is recognized and left untouched so later owner edits survive.
    select id into v_product_id from public.products
      where tags @> array['launch-proposal:' || item.proposal_key]
      limit 1;
    if v_product_id is not null then
      continue;
    end if;

    -- Reuse only the explicitly owner-intake-tagged slot for this category/position.
    select id into v_product_id from public.products
      where tags @> array['owner-intake']
        and slug='owner-intake-' || item.category_slug || '-' || lpad(item.slot::text,2,'0')
      limit 1;

    v_base_slug := item.proposal_key;
    v_slug := v_base_slug;
    v_attempt := 0;
    while exists(select 1 from public.products where slug=v_slug and id is distinct from v_product_id) loop
      v_attempt := v_attempt + 1;
      v_slug := v_base_slug || '-launch-' || v_attempt::text;
    end loop;

    v_tags := array[
      'owner-intake','approval-required','owner-review-required','proposed-name','proposed-price',
      'launch-proposal:' || item.proposal_key,'suggested-age-group:' || item.suggested_age,
      'missing:verified-material','missing:verified-measurements','missing:verified-sizes',
      'missing:verified-colours','missing:sku','missing:stock','missing:authorized-product-photos','missing:verified-care'
    ];

    if v_product_id is not null then
      update public.products set
        name=item.product_name, slug=v_slug, description=item.proposed_description,
        material='', fabric_composition='', care_instructions='', size_measurements='',
        price=item.proposed_price, compare_at_price=null, currency='INR', status='draft',
        published_at=null, tags=(select array(select distinct unnest(coalesce(tags,'{}') || v_tags)))
      where id=v_product_id and tags @> array['owner-intake'];
    else
      v_attempt := 0;
      v_slug := v_base_slug;
      while exists(select 1 from public.products where slug=v_slug) loop
        v_attempt := v_attempt + 1;
        v_slug := v_base_slug || '-launch-' || v_attempt::text;
      end loop;
      insert into public.products(name,slug,description,material,fabric_composition,care_instructions,size_measurements,price,compare_at_price,currency,status,tags)
      values(item.product_name,v_slug,item.proposed_description,'','','', '',item.proposed_price,null,'INR','draft',v_tags)
      returning id into v_product_id;
    end if;

    delete from public.product_categories pc
      using public.categories c
      where pc.product_id=v_product_id and pc.category_id=c.id and c.kind='product' and c.id<>v_category_id;
    insert into public.product_categories(product_id,category_id) values(v_product_id,v_category_id)
      on conflict(product_id,category_id) do nothing;
  end loop;
end $$;
