-- Post-audit hardening.

-- CRITICAL: prevent privilege escalation via profiles.is_admin.
-- RLS scoped the row but not the column, so the authenticated role could
-- PATCH its own row and set is_admin = true. Column privileges fix this
-- independently of RLS.
revoke update on public.profiles from anon, authenticated;
grant update (full_name) on public.profiles to authenticated;

-- Consolidate + optimize profiles policies (dedupe permissive UPDATE policies;
-- wrap auth.* in (select ...) so it is evaluated once per query, not per row).
drop policy if exists "profiles_update_own" on public.profiles;
drop policy if exists "profiles_update_admin" on public.profiles;
drop policy if exists "profiles_select_own_or_admin" on public.profiles;

create policy "profiles_select_own_or_admin" on public.profiles
  for select using (id = (select auth.uid()) or (select public.is_admin()));
create policy "profiles_update_own_or_admin" on public.profiles
  for update using (id = (select auth.uid()) or (select public.is_admin()))
  with check (id = (select auth.uid()) or (select public.is_admin()));

-- Orders / order_items: optimize auth.* calls AND let a logged-in customer see
-- orders they placed as a guest, matched on their verified account email.
drop policy if exists "orders_select_own_or_admin" on public.orders;
drop policy if exists "orders_admin_update" on public.orders;
create policy "orders_select_own_or_admin" on public.orders
  for select using (
    user_id = (select auth.uid())
    or email = (select auth.email())
    or (select public.is_admin())
  );
create policy "orders_admin_update" on public.orders
  for update using ((select public.is_admin()));

drop policy if exists "order_items_select_own_or_admin" on public.order_items;
create policy "order_items_select_own_or_admin" on public.order_items
  for select using (
    exists (
      select 1 from public.orders o
      where o.id = order_id
        and (
          o.user_id = (select auth.uid())
          or o.email = (select auth.email())
          or (select public.is_admin())
        )
    )
  );

-- Performance: index the previously-unindexed FK.
create index if not exists order_items_product_idx on public.order_items(product_id);

-- Oversell-safe stock decrement: refuse (no-op) instead of clamping to 0,
-- and return rows-updated (0 = insufficient stock) so the webhook can flag it.
drop function if exists public.decrement_stock(uuid, integer);
create function public.decrement_stock(p_product_id uuid, p_qty integer)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  rows_updated integer;
begin
  update public.products
    set stock = stock - p_qty
    where id = p_product_id and stock >= p_qty;
  get diagnostics rows_updated = row_count;
  return rows_updated;
end;
$$;
revoke execute on function public.decrement_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.decrement_stock(uuid, integer) to service_role;

-- Allow the webhook to flag orders it could not fully satisfy from stock.
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
  check (status in ('pending','paid','fulfilled','cancelled','refunded','needs_review'));
