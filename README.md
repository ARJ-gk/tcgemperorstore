# TCG Emperor Store

A production-ready e-commerce storefront for trading card games (Pokémon, Magic,
Yu-Gi-Oh! and more), built with **Next.js 16 (App Router)**, **Supabase**
(Postgres + Auth + Storage) and **Stripe** Checkout.

## Features

- 🛍️ **Storefront** — home, product listing with search + filters, product detail pages
- 🛒 **Cart** — client-side, persisted to `localStorage`, works for guests
- 💳 **Stripe Checkout** — hosted checkout with shipping collection; prices are always re-validated server-side
- 🔔 **Webhooks** — orders are created from the Stripe webhook (the correct, resilient pattern)
- 👤 **Accounts** — Supabase email/password auth, guest checkout, order history
- 🛠️ **Admin panel** — dashboard, product CRUD with image upload, order management, categories (role-gated)
- 🔒 **Row-Level Security** on every table; service role used only in the webhook

## Tech stack

| Area | Choice |
|------|--------|
| Framework | Next.js 16 (App Router, React 19) |
| Styling | Tailwind CSS v4 + shadcn/ui (Radix) |
| Database / Auth / Storage | Supabase (Postgres 17) |
| Payments | Stripe Checkout + Webhooks |
| State (cart) | Zustand |
| Hosting | Vercel (recommended) |

## What's already provisioned

A dedicated Supabase project (**TCG Emperor Store**) has been created with the full
schema, RLS policies, a `product-images` storage bucket, and sample products. The
public URL and anon key are already in `.env.local`.

A **test admin** account is seeded for you:

- Email: `admin@tcgemperor.test`
- Password: `Admin123!`

> Change or remove this account before going live (see _Admin access_ below).

## Getting started

### 1. Install

```bash
npm install
```

### 2. Configure environment

`.env.local` already has the Supabase URL + anon key. You must still add three secrets:

| Variable | Where to get it | Used for |
|----------|-----------------|----------|
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase Dashboard → Project Settings → API → `service_role` | Webhook writing orders (bypasses RLS) |
| `STRIPE_SECRET_KEY` | https://dashboard.stripe.com/test/apikeys | Creating checkout sessions |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | same page | Client-side Stripe |
| `STRIPE_WEBHOOK_SECRET` | `stripe listen` output (local) or Dashboard webhook (prod) | Verifying webhook signatures |

See `.env.example` for the full list.

### 3. Run

```bash
npm run dev
```

Open http://localhost:3000.

## Testing checkout locally

Stripe can't reach `localhost`, so forward webhooks with the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

Copy the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET` in `.env.local`, then
restart `npm run dev`.

Now go through checkout and pay with the Stripe **test card**:

```
4242 4242 4242 4242   ·   any future expiry   ·   any CVC   ·   any ZIP
```

After paying you'll land on `/checkout/success`, and the webhook will create the
order (visible under `/account` and `/admin/orders`) and decrement stock.

## Admin access

The admin panel lives at `/admin` and is gated on `profiles.is_admin`.

- Sign in with the seeded admin above, **or**
- Make your own account an admin: sign up at `/signup`, then in the Supabase SQL editor run:

  ```sql
  update public.profiles set is_admin = true where email = 'you@example.com';
  ```

## Database

SQL lives in [`supabase/`](./supabase):

- `migrations/0001_initial_schema.sql` — tables, functions, triggers
- `migrations/0002_rls_policies.sql` — Row-Level Security
- `migrations/0003_storage.sql` — product-images bucket + policies
- `seed.sql` — sample catalog

Regenerate TypeScript types after schema changes:

```bash
npx supabase gen types typescript --project-id <ref> > src/lib/database.types.ts
```

## Project structure

```
src/
  app/
    (storefront)      page.tsx, products/, cart/, checkout/, account/
    admin/            dashboard, products, orders, categories + server actions
    api/checkout      creates the Stripe Checkout session (server-validated)
    api/webhooks/stripe  turns paid sessions into orders
    auth/callback     email-confirmation / OAuth code exchange
  components/         UI, storefront + admin components
  lib/
    supabase/         browser, server & admin (service-role) clients
    stripe/           lazy Stripe server client
    queries.ts        catalog data access
    cart-store.ts     Zustand cart
    auth.ts           getUser / getProfile / isAdmin
```

## Deploying to Vercel

1. Push this repo to GitHub and import it in Vercel.
2. Add all variables from `.env.example` in the Vercel project settings
   (set `NEXT_PUBLIC_SITE_URL` to your deployed URL).
3. In the [Stripe Dashboard → Webhooks](https://dashboard.stripe.com/webhooks),
   add an endpoint `https://your-domain/api/webhooks/stripe` listening for
   `checkout.session.completed`, and put its signing secret in `STRIPE_WEBHOOK_SECRET`.
4. Deploy.

## Going live

- Swap Stripe **test** keys for **live** keys and use the live webhook secret.
- Remove/rotate the seeded test admin account.
- Add your real products (and real images) via `/admin`.
