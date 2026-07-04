-- Payments & operations: persist shipping/tax breakdown, support real refunds
-- with stock restoration.

-- Shipping and tax collected by Stripe Checkout (total_cents already includes
-- both; these columns preserve the breakdown for display and reporting).
alter table public.orders
  add column if not exists shipping_cents integer not null default 0,
  add column if not exists tax_cents integer not null default 0,
  add column if not exists refunded_at timestamptz,
  add column if not exists restocked_at timestamptz;

-- Return purchased quantities to stock when an order is cancelled or refunded.
-- Idempotent: the restocked_at stamp is claimed atomically, so concurrent or
-- repeated calls (admin action + refund webhook) restock at most once.
create or replace function public.restock_order(p_order_id uuid)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed integer;
begin
  update public.orders
    set restocked_at = now()
    where id = p_order_id and restocked_at is null;
  get diagnostics claimed = row_count;
  if claimed = 0 then
    return false;
  end if;

  update public.products p
    set stock = p.stock + oi.qty
    from (
      select product_id, sum(quantity)::integer as qty
      from public.order_items
      where order_id = p_order_id and product_id is not null
      group by product_id
    ) oi
    where p.id = oi.product_id;

  return true;
end;
$$;

-- Like decrement_stock, only the service role may call this (the admin server
-- action verifies is_admin() first, then uses the service-role client).
revoke execute on function public.restock_order(uuid) from public, anon, authenticated;
grant execute on function public.restock_order(uuid) to service_role;
