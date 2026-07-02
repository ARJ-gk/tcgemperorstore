# QA & Security Audit — TCG Emperor Store

Audit method: automated multi-agent review (5 QA + 5 security dimensions) with
adversarial verification of every finding and a completeness critic, plus
ESLint, TypeScript, `next build`, and Supabase security/performance advisors.
All confirmed findings below have been **fixed and re-verified**.

## Result

| Severity | Found | Fixed |
|----------|:----:|:----:|
| Critical | 1 | ✅ |
| High | 2 | ✅ |
| Medium | 3 | ✅ |
| Low | 6 | ✅ |
| Extra (critic gaps) | 3 | ✅ |

Final state: ESLint ✅ · TypeScript ✅ · `next build` ✅ (no warnings) ·
Supabase advisors ✅ (only intentional/config items remain — see bottom).

---

## Critical

**1. Privilege escalation — any user could make themselves admin.**
RLS on `profiles` scoped the *row* a user could update but not the *columns*, and
the `authenticated` role had table-wide UPDATE. A logged-in user could `PATCH`
their own row setting `is_admin = true` (directly via PostgREST, bypassing app
code) and gain full admin. **Fix:** revoked column-level UPDATE on `profiles`
from `anon`/`authenticated` and granted only `full_name`; `is_admin` can no longer
be changed via the API. Verified: `has_column_privilege('authenticated', …, 'is_admin', 'UPDATE') = false`.

## High

**2. Checkout oversell via duplicate line items.** `/api/checkout` validated
stock per raw array entry; the same `productId` split across entries each passed
`stock >= qty` independently. **Fix:** quantities are now aggregated per product
before validation (and a 100-distinct-item cap added). Verified: 3+3 of a
stock-3 product now returns `409 "Only 3 left"`.

**3. Empty slug for non-ASCII names.** `slugify()` stripped all non-ASCII, so a
Japanese/emoji-only product name produced `slug = ""` → unreachable URL and a
unique-constraint failure on the *second* one. **Fix:** fallback to a unique
`item-<random>` slug when slugification is empty.

## Medium

**4. PostgREST filter injection in product search.** The search term was
interpolated raw into a Supabase `.or()` filter; a comma/paren changed the filter
structure or crashed the page. **Fix:** metacharacters are stripped before the
query. Verified: `?search=Charizard, VMAX)(` returns 200.

**5. Webhook oversell under concurrency / silent clamp.** `decrement_stock`
clamped to 0, hiding oversell when two paid orders raced for the last unit.
**Fix:** the function now refuses (no-op) when stock is insufficient and returns
rows-affected; the webhook flags such orders `needs_review` instead of silently
overselling, and no longer swallows RPC errors.

**6. Open redirect after login.** The `next` param was passed to
`router.push()` / redirect without validation. **Fix:** a `safeNext()` helper
only permits same-origin relative paths (rejects `//`, `\`, absolute URLs), used
in the auth form and the auth callback.

## Low

7. Admin lists fetched all rows (PostgREST 1000-row cap) → **server-side pagination** added to products & orders.
8. `--font-sans` was self-referential so **Geist never applied** → fixed to `var(--font-geist-sans)`.
9. **No error boundaries** → added `error.tsx` + `global-error.tsx`.
10. **Dark mode was dead** (palette but no provider) → added `next-themes` provider + header toggle.
11. **No security headers** → added `X-Frame-Options`, `CSP frame-ancestors`, `nosniff`, `Referrer-Policy`, `Permissions-Policy`.
12. **Checkout leaked raw error text** → returns a generic message; real error logged server-side.

## Extra hardening (from the completeness critic)

- Logged-in customers can now see orders they placed **as a guest**, matched on their verified account email (RLS policy).
- The webhook **validates `user_id` is a UUID** before writing it.
- Admin image upload now **validates content-type and extension**.
- Checkout enforces a **single currency** and a cart-size cap.
- DB perf: indexed the `order_items.product_id` FK; wrapped `auth.*` calls in RLS as `(select …)` so they evaluate once per query; consolidated duplicate profile policies.

All schema changes are in [`supabase/migrations/0004_security_hardening_v2.sql`](supabase/migrations/0004_security_hardening_v2.sql).

## False positives (correctly dismissed)

Three "mixed-currency cart" findings were dismissed — every product is USD by
construction (DB default, no currency field in the admin form), so the case is
unreachable through the app. A defensive single-currency guard was still added.

## Remaining — one dashboard toggle (yours to flip)

**Enable leaked-password protection** (checks new passwords against
HaveIBeenPwned): Supabase Dashboard → Authentication → Policies →
"Leaked password protection". Not code — a one-click setting.

The `is_admin()` function stays callable by signed-in users **by design** — RLS
policies call it, and it only ever returns the caller's own admin flag.
