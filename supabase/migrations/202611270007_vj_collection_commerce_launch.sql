-- VJ Collection Commerce Launch Migration
-- Phase 3, 5, 7, 8: Returns, Cancellations, Notifications, Delivery Telemetry, and Finance RPCs

-- 1. RETURN & CANCELLATION REQUESTS
create table if not exists public.return_requests (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete restrict,
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_item_id uuid references public.order_items(id) on delete set null,
  request_type text not null default 'return' check (request_type in ('return', 'exchange', 'cancellation')),
  reason text not null,
  customer_notes text,
  status text not null default 'requested' check (status in ('requested', 'approved', 'rejected', 'pickup_scheduled', 'received', 'inspected', 'refund_initiated', 'completed', 'cancelled')),
  admin_notes text,
  refund_amount numeric(12,2) default 0,
  return_awb text,
  return_courier text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_return_requests_order on public.return_requests(order_id);
create index if not exists idx_return_requests_customer on public.return_requests(customer_id);
create index if not exists idx_return_requests_status on public.return_requests(status);

alter table public.return_requests enable row level security;

-- Customers can view their own return requests
create policy "Customers can view their own returns"
  on public.return_requests
  for select
  using (auth.uid() = customer_id);

-- Customers can insert return requests for their own orders
create policy "Customers can submit return requests"
  on public.return_requests
  for insert
  with check (auth.uid() = customer_id);

-- Staff with order management can view all returns
create policy "Staff can view all returns"
  on public.return_requests
  for select
  using (
    exists (
      select 1 from public.admin_roles
      where user_id = auth.uid()
        and role in ('owner', 'admin', 'order_manager')
    )
  );

-- Staff with order management can update returns
create policy "Staff can update returns"
  on public.return_requests
  for update
  using (
    exists (
      select 1 from public.admin_roles
      where user_id = auth.uid()
        and role in ('owner', 'admin', 'order_manager')
    )
  );

-- Trigger updated_at
drop trigger if exists set_return_requests_updated_at on public.return_requests;
create trigger set_return_requests_updated_at
  before update on public.return_requests
  for each row execute function public.set_updated_at();

-- 2. TRANSACTIONAL CUSTOMER NOTIFICATIONS
create table if not exists public.customer_notifications (
  id uuid primary key default gen_random_uuid(),
  customer_id uuid not null references public.customers(id) on delete cascade,
  order_id uuid references public.orders(id) on delete set null,
  event_type text not null,
  title text not null,
  message text not null,
  channel text not null default 'in_app' check (channel in ('in_app', 'email', 'sms', 'whatsapp')),
  delivery_status text not null default 'sent' check (delivery_status in ('pending', 'sent', 'failed')),
  metadata jsonb default '{}'::jsonb,
  read_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_customer_notifications_cust on public.customer_notifications(customer_id, created_at desc);
create index if not exists idx_customer_notifications_order on public.customer_notifications(order_id);

alter table public.customer_notifications enable row level security;

create policy "Customers can view their own notifications"
  on public.customer_notifications
  for select
  using (auth.uid() = customer_id);

create policy "Customers can update read status on own notifications"
  on public.customer_notifications
  for update
  using (auth.uid() = customer_id)
  with check (auth.uid() = customer_id);

create policy "Staff can view notifications"
  on public.customer_notifications
  for select
  using (
    exists (
      select 1 from public.admin_roles
      where user_id = auth.uid()
        and role in ('owner', 'admin', 'order_manager')
    )
  );

-- 3. CUSTOMER RETURN REQUEST RPC
create or replace function public.request_order_return(
  p_order_id uuid,
  p_request_type text,
  p_reason text,
  p_customer_notes text default null,
  p_order_item_id uuid default null
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_order record;
  v_return_id uuid;
  v_existing uuid;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;

  select id, customer_id, status, total, payment_method, placed_at
  into v_order
  from public.orders
  where id = p_order_id and customer_id = v_uid;

  if not found then
    raise exception 'Order not found or does not belong to you.';
  end if;

  if p_request_type = 'cancellation' then
    if v_order.status not in ('pending_payment', 'paid', 'processing') then
      raise exception 'Order #% cannot be cancelled as it is already %.', v_order.id, v_order.status;
    end if;
  elsif p_request_type in ('return', 'exchange') then
    if v_order.status <> 'delivered' then
      raise exception 'Returns and exchanges can only be requested after the order has been delivered.';
    end if;
  else
    raise exception 'Invalid request type: %', p_request_type;
  end if;

  -- Check for existing active return request
  select id into v_existing
  from public.return_requests
  where order_id = p_order_id
    and request_type = p_request_type
    and status not in ('rejected', 'cancelled');

  if v_existing is not null then
    return v_existing;
  end if;

  insert into public.return_requests (
    order_id,
    customer_id,
    order_item_id,
    request_type,
    reason,
    customer_notes,
    status,
    refund_amount
  )
  values (
    p_order_id,
    v_uid,
    p_order_item_id,
    p_request_type,
    trim(p_reason),
    nullif(trim(p_customer_notes), ''),
    'requested',
    v_order.total
  )
  returning id into v_return_id;

  -- Record customer notification
  insert into public.customer_notifications (
    customer_id,
    order_id,
    event_type,
    title,
    message,
    metadata
  )
  values (
    v_uid,
    p_order_id,
    case when p_request_type = 'cancellation' then 'cancellation_requested' else 'return_requested' end,
    case when p_request_type = 'cancellation' then 'Cancellation Request Received' else 'Return Request Received' end,
    'Your ' || p_request_type || ' request for order #' || p_order_id || ' has been submitted and is under review.',
    jsonb_build_object('return_id', v_return_id, 'reason', p_reason)
  );

  return v_return_id;
end;
$$;

grant execute on function public.request_order_return to authenticated;

-- 4. ADMIN RETURN PROCESSING RPC
create or replace function public.admin_process_return(
  p_return_id uuid,
  p_action text, -- 'approve', 'reject', 'schedule_pickup', 'mark_received', 'complete'
  p_admin_notes text default null,
  p_return_awb text default null,
  p_return_courier text default null
)
returns boolean
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_is_staff boolean;
  v_req record;
  v_new_status text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Authentication required.';
  end if;

  select exists(
    select 1 from public.admin_roles
    where user_id = v_uid and role in ('owner', 'admin', 'order_manager')
  ) into v_is_staff;

  if not v_is_staff then
    raise exception 'Permission denied. Staff role required.';
  end if;

  select * into v_req
  from public.return_requests
  where id = p_return_id;

  if not found then
    raise exception 'Return request not found.';
  end if;

  if p_action = 'approve' then
    v_new_status := 'approved';
    if v_req.request_type = 'cancellation' then
      -- Auto-cancel the order
      update public.orders set status = 'cancelled' where id = v_req.order_id;
      v_new_status := 'completed';
    end if;
  elsif p_action = 'reject' then
    v_new_status := 'rejected';
  elsif p_action = 'schedule_pickup' then
    v_new_status := 'pickup_scheduled';
  elsif p_action = 'mark_received' then
    v_new_status := 'received';
  elsif p_action = 'complete' then
    v_new_status := 'completed';
  else
    raise exception 'Unknown action: %', p_action;
  end if;

  update public.return_requests
  set
    status = v_new_status,
    admin_notes = coalesce(nullif(trim(p_admin_notes), ''), admin_notes),
    return_awb = coalesce(nullif(trim(p_return_awb), ''), return_awb),
    return_courier = coalesce(nullif(trim(p_return_courier), ''), return_courier),
    updated_at = now()
  where id = p_return_id;

  -- Create customer notification
  insert into public.customer_notifications (
    customer_id,
    order_id,
    event_type,
    title,
    message,
    metadata
  )
  values (
    v_req.customer_id,
    v_req.order_id,
    'return_' || v_new_status,
    case
      when v_new_status = 'approved' then 'Request Approved'
      when v_new_status = 'rejected' then 'Request Rejected'
      when v_new_status = 'pickup_scheduled' then 'Return Pickup Scheduled'
      when v_new_status = 'received' then 'Return Package Received'
      when v_new_status = 'completed' then 'Return Completed'
      else 'Return Status Updated'
    end,
    'Your ' || v_req.request_type || ' request for order #' || v_req.order_id || ' status is now: ' || v_new_status || '.' ||
    case when p_admin_notes is not null then ' Note: ' || p_admin_notes else '' end,
    jsonb_build_object('return_id', p_return_id, 'status', v_new_status, 'awb', p_return_awb)
  );

  return true;
end;
$$;

grant execute on function public.admin_process_return to authenticated;

-- 5. ADMIN FINANCIAL & DELIVERY TELEMETRY RPCS
create or replace function public.admin_get_financial_summary()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_is_staff boolean;
  v_result jsonb;
begin
  v_uid := auth.uid();
  select exists(
    select 1 from public.admin_roles
    where user_id = v_uid and role in ('owner', 'admin', 'finance_manager', 'order_manager')
  ) into v_is_staff;

  if not v_is_staff then
    raise exception 'Permission denied.';
  end if;

  select jsonb_build_object(
    'total_revenue', coalesce(sum(case when p.status = 'captured' then p.amount else 0 end), 0),
    'pending_revenue', coalesce(sum(case when p.status = 'pending' then p.amount else 0 end), 0),
    'total_refunded', coalesce(sum(case when r.status = 'processed' then r.amount else 0 end), 0),
    'captured_payments_count', count(distinct case when p.status = 'captured' then p.id end),
    'pending_payments_count', count(distinct case when p.status = 'pending' then p.id end),
    'refunds_count', count(distinct case when r.status = 'processed' then r.id end),
    'cod_orders_count', count(distinct case when o.payment_method = 'cod' then o.id end),
    'prepaid_orders_count', count(distinct case when o.payment_method = 'razorpay' then o.id end),
    'cod_total', coalesce(sum(case when o.payment_method = 'cod' and o.status not in ('cancelled') then o.total else 0 end), 0),
    'prepaid_total', coalesce(sum(case when o.payment_method = 'razorpay' and p.status = 'captured' then o.total else 0 end), 0)
  ) into v_result
  from public.orders o
  left join public.payments p on p.order_id = o.id
  left join public.refunds r on r.payment_id = p.id;

  return v_result;
end;
$$;

grant execute on function public.admin_get_financial_summary to authenticated;

create or replace function public.admin_get_delivery_summary()
returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_uid uuid;
  v_is_staff boolean;
  v_result jsonb;
begin
  v_uid := auth.uid();
  select exists(
    select 1 from public.admin_roles
    where user_id = v_uid and role in ('owner', 'admin', 'order_manager')
  ) into v_is_staff;

  if not v_is_staff then
    raise exception 'Permission denied.';
  end if;

  select jsonb_build_object(
    'awaiting_dispatch', count(distinct case when o.status in ('paid', 'processing') and s.id is null then o.id end),
    'created', count(distinct case when s.status = 'created' then s.id end),
    'pickup_scheduled', count(distinct case when s.status = 'pickup_scheduled' then s.id end),
    'in_transit', count(distinct case when s.status = 'in_transit' then s.id end),
    'out_for_delivery', count(distinct case when s.status = 'out_for_delivery' then s.id end),
    'delivered', count(distinct case when s.status = 'delivered' then s.id end),
    'returned_rto', count(distinct case when s.status in ('returned', 'cancelled') then s.id end),
    'exceptions', count(distinct case when s.status = 'exception' then s.id end),
    'total_shipments', count(distinct s.id)
  ) into v_result
  from public.orders o
  left join public.shipments s on s.order_id = o.id;

  return v_result;
end;
$$;

grant execute on function public.admin_get_delivery_summary to authenticated;
