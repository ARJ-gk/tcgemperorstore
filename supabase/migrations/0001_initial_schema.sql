-- TCG Emperor Store — core schema
-- Profiles, catalog (categories/products), orders and order items,
-- plus helper functions and triggers.

-- Profiles: 1:1 with auth.users
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text,
  full_name text default '',
  is_admin boolean not null default false,
  created_at timestamptz not null default now()
);

-- Admin check helper (SECURITY DEFINER avoids RLS recursion on profiles)
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- Auto-create a profile row on signup
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'full_name', ''))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- generic updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = public
as $$
begin new.updated_at = now(); return new; end;
$$;

-- Categories
create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  created_at timestamptz not null default now()
);

-- Products
create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  description text,
  price_cents integer not null default 0 check (price_cents >= 0),
  currency text not null default 'usd',
  stock integer not null default 0 check (stock >= 0),
  image_url text,
  category_id uuid references public.categories(id) on delete set null,
  game text,
  set_name text,
  rarity text,
  condition text,
  is_active boolean not null default true,
  featured boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_category_idx on public.products(category_id);
create index if not exists products_active_idx on public.products(is_active);

drop trigger if exists products_set_updated_at on public.products;
create trigger products_set_updated_at
  before update on public.products
  for each row execute function public.set_updated_at();

-- Orders
create table if not exists public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  email text,
  status text not null default 'pending'
    check (status in ('pending','paid','fulfilled','cancelled','refunded')),
  total_cents integer not null default 0,
  currency text not null default 'usd',
  stripe_session_id text unique,
  stripe_payment_intent text,
  shipping_address jsonb,
  created_at timestamptz not null default now()
);
create index if not exists orders_user_idx on public.orders(user_id);

-- Order items (price snapshot at purchase time)
create table if not exists public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders(id) on delete cascade,
  product_id uuid references public.products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0)
);
create index if not exists order_items_order_idx on public.order_items(order_id);

-- Atomic stock decrement helper (called by the Stripe webhook via service role)
create or replace function public.decrement_stock(p_product_id uuid, p_qty integer)
returns void
language sql
security definer
set search_path = public
as $$
  update public.products
  set stock = greatest(stock - p_qty, 0)
  where id = p_product_id;
$$;

-- These SECURITY DEFINER functions are not meant to be called over REST RPC.
revoke execute on function public.handle_new_user() from public, anon, authenticated;
revoke execute on function public.decrement_stock(uuid, integer) from public, anon, authenticated;
grant execute on function public.decrement_stock(uuid, integer) to service_role;
