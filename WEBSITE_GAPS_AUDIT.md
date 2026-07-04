# Website Gaps & Missing Features Audit — TCG Emperor Store

> Method: multi-agent audit (8 parallel finders across e-commerce dimensions:
> catalog/discovery, cart/checkout, accounts/auth, orders/fulfillment/email,
> admin/ops, trust/legal/content, correctness bugs, SEO/a11y/perf), with every
> finding independently verified against the actual code by an adversarial
> reviewer, then deduped and ranked. 59 raw findings → 57 verified → 53 after dedup.

## Executive summary

This storefront has a working browse-cart-Stripe-checkout-fulfillment spine, but it is missing several features a real money-handling, physical-goods TCG store cannot ship without. The most serious gaps are financial and operational: shipping is collected but never charged (every order ships free, including international), no sales tax/VAT is ever added, marking an order "refunded" in admin issues no actual Stripe refund, no transactional email is ever sent (yet the success page tells buyers a confirmation was emailed), and there is no tracking-number/shipping-notification capability at all. Layered on top are large discovery gaps (no catalog pagination on the public listing, no rarity/set/condition/price/in-stock filters, no product image gallery, no TCG-identity fields like card number/foil/grade despite "graded" being marketed), missing account self-service (no password reset, profile editing, address book, or deletion/export), thin admin operations (no order search/status filter, no category edit, no restock on cancel/refund), and broad SEO/a11y omissions (no sitemap, JSON-LD, canonicals, or skip link). Findings below are deduped and ranked by severity and commercial importance.

---

## 1. Core missing features (22)

### 1.1 Shipping is never charged — every order ships free

**Severity:** high

**Why it matters:** The cart shows 'Shipping — Calculated at checkout' and the session enables shipping_address_collection, but the Stripe session is created with no shipping_options/shipping_rate and no automatic shipping calc (src/app/api/checkout/route.ts:108-122; cart copy src/app/cart/page.tsx:148-151). amount_total is the product subtotal only. With 11 shipping countries allowed, the merchant absorbs 100% of postage on every domestic and cross-border order — direct, unbounded revenue loss — and the 'Calculated at checkout' label is a lie because nothing is ever calculated.

**Recommendation:** Add Stripe shipping_options to the session (pre-created shipping_rate IDs or inline shipping_rate_data fixed_amount tiers for domestic vs international), persist the shipping amount on the order, and surface it on the success page. If free shipping is truly intended, change the copy to 'Free shipping'.

### 1.2 No transactional email — success page falsely claims a confirmation was sent

**Severity:** high

**Why it matters:** There is zero email infrastructure (no resend/nodemailer/sendgrid dep, no send calls). fulfillOrder() in the Stripe webhook creates the order and decrements stock but emails nothing, and the checkout session sets no receipt_email/invoice_creation. Yet src/app/checkout/success/page.tsx:37-38,63-64 unconditionally tells buyers 'A confirmation has been sent to {email}.' Customers get no order confirmation, receipt, or order number; guests (user_id null) have no account page either, so they have NO record of their purchase. This generates support load ('did my order go through?') and undermines trust right after payment.

**Recommendation:** Add an email provider (e.g. Resend) and send an order-confirmation email from fulfillOrder() with order id, line items, totals, and shipping address. At minimum enable Stripe receipts via payment_intent_data.receipt_email/invoice_creation, and only render 'confirmation has been sent' once an email is actually dispatched.

### 1.3 No tracking number, carrier, or shipping notification — fulfillment is a status label only

**Severity:** high

**Why it matters:** The orders table has no tracking_number/carrier/shipped_at columns and the admin UI offers only a status dropdown (supabase/migrations/0001_initial_schema.sql; src/app/admin/orders/page.tsx; src/components/admin/order-status-select.tsx). Marking an order 'fulfilled' records nothing about how it shipped and emails the buyer nothing. Customers can never learn their package shipped or track it — the account page shows only a status badge. Post-purchase experience is effectively absent for a store shipping valuable physical cards.

**Recommendation:** Add tracking_number/carrier/shipped_at columns, an admin input to capture tracking on the transition to 'fulfilled', a shipping-notification email with the tracking link, and surface tracking on the account order view.

### 1.4 No order search or status filter in admin

**Severity:** high

**Why it matters:** src/app/admin/orders/page.tsx:33-37 fetches all orders by created_at, 25/page, with no search by order id/customer email and no status filter. Operators cannot pull 'paid orders awaiting fulfillment', locate a specific customer's order, or find the needs_review orders the webhook flags — making the escalation path effectively invisible. Fulfillment and support become impractical at any real volume.

**Recommendation:** Add searchParams-driven status filter (.eq('status', ...)) and a search box (order-id prefix / email ilike via .or), and surface a needs_review count/badge on the dashboard and nav.

### 1.5 No password reset / forgot-password flow

**Severity:** medium

**Why it matters:** src/components/auth-form.tsx only calls signInWithPassword; there is no 'Forgot password?' link, no resetPasswordForEmail route, and no update-password page (grep for reset/forgot/updateUser finds only unrelated error-boundary reset()). Any user who forgets their password is permanently locked out of their account and order history with no self-serve recovery — a universally expected auth feature.

**Recommendation:** Add a 'Forgot password?' link to a /forgot-password page calling supabase.auth.resetPasswordForEmail(email, { redirectTo: '/auth/callback?next=/account/update-password' }), plus an update-password page (behind the recovery session) calling supabase.auth.updateUser({ password }). The existing /auth/callback already exchanges the recovery code.

### 1.6 No sales tax / VAT is ever collected

**Severity:** medium

**Why it matters:** The checkout session is created without automatic_tax:{enabled:true} and without tax_rates (src/app/api/checkout/route.ts:108-122). For a store collecting addresses in US/CA/GB/DE/FR etc., no sales tax, GST, or VAT is added to any order; amount_total is purely pre-tax subtotal. This is a tax-compliance liability (US economic nexus, EU/UK VAT) and customers are never shown or charged tax.

**Recommendation:** Enable Stripe Tax via automatic_tax:{enabled:true} (with product tax codes/origin address configured) or attach explicit tax_rates, and surface the tax line on the success page.

### 1.7 Core catalog filters missing — rarity, set, condition, price range, in-stock

**Severity:** medium

**Why it matters:** ProductFilters supports only categorySlug, game, search, sort (src/lib/queries.ts:5) and the toolbar exposes just category pills + a game select. The products table already stores rarity, set_name, condition, price_cents, stock and the UI shows them as badges, yet none are filterable, there is no price-range filter, and no 'in stock only' toggle — so sold-out cards interleave with buyable ones. On a TCG store, shoppers cannot narrow by the attributes that actually matter, turning search into browse-by-scroll and hurting conversion.

**Recommendation:** Extend ProductFilters with rarity, setName, condition, minPrice/maxPrice, inStock; add .eq/.gte/.lte/.gt('stock',0) clauses in getProducts; and add facet controls + price slider + in-stock toggle to ProductsToolbar (enumerate distinct values as getGames() does).

### 1.8 Public /products listing has no pagination and shows a truncated count

**Severity:** medium

**Why it matters:** getProducts() (src/lib/queries.ts:12-63) never calls .limit()/.range()/count, and src/app/products/page.tsx renders every row in one grid with no pages, load-more, or infinite scroll, while showing products.length as the total. Pagination was added to the ADMIN lists only. Large catalogs ship the full result set plus all images at once and, if Supabase's db-max-rows cap is configured, SKUs beyond it become silently unreachable; the shopper-facing product count can also be wrong.

**Recommendation:** Add page/limit (or cursor) to ProductFilters/getProducts via .range(from,to) plus a count:'exact' head query for the total, and render pagination controls (or infinite scroll) with an accurate total count.

### 1.9 Single product image only — no gallery, multiple images, or zoom

**Severity:** medium

**Why it matters:** products has a single nullable image_url and the PDP shows exactly one object-cover image with no thumbnails, gallery, or zoom. Trading cards are a condition-sensitive, high-trust purchase — buyers need front/back and zoom to verify centering/condition/grading before buying. Absence reduces confidence and increases condition-dispute returns. object-cover also crops card art.

**Recommendation:** Introduce an images array (product_images table or text[] column), render a thumbnail gallery on the PDP, add click-to-zoom/lightbox, and use object-contain for card art.

### 1.10 Missing TCG-specific attributes: card number, foil/holo, grading

**Severity:** medium

**Why it matters:** The products schema has game, set_name, rarity, condition only — no card_number, no foil/finish flag, and no grading fields (company + grade, e.g. PSA 10). The homepage markets cards as 'inspected, graded and shipped' but there is no data model to record or display a grade, and graded slabs use a different vocabulary than raw-card condition. Card identity/value cannot be represented, graded inventory can't be listed accurately despite being advertised, and duplicate names across sets are ambiguous.

**Recommendation:** Add card_number, finish/foil, and grading fields (graded boolean, grading_company, grade) to products; surface them in the PDP spec list and product card; and make them searchable/filterable.

### 1.11 No related / recommended products on the product detail page

**Severity:** medium

**Why it matters:** The PDP renders image/specs/description/buy-box but has no 'related', 'more from this set', or 'you may also like' section, and no such query exists in queries.ts. A shopper arriving via search or an external link hits a dead end — zero cross-sell, lower AOV, no path to browse similar cards.

**Recommendation:** Add a getRelatedProducts(product) query (same category or set_name, excluding current id, is_active, limited) and render a related-products grid at the bottom of the PDP.

### 1.12 No legal policy pages (Privacy, Terms, Refund/Return, Shipping)

**Severity:** medium

**Why it matters:** No routes exist for Privacy, Terms, Refund/Return, or Shipping policy, and site-footer.tsx has no legal links. Stripe's terms require merchants to publish a refund/return policy and terms; consumer law and card-network rules require them too. Their absence exposes the operator to chargebacks and Stripe account review, and leaves customers with no stated recourse before paying.

**Recommendation:** Add static routes src/app/privacy, /terms, /returns, /shipping with real policy copy and link them from a 'Legal' column in the footer.

### 1.13 No Contact page or contact information anywhere

**Severity:** medium

**Why it matters:** There is no /contact route and no email/phone/address anywhere; the footer 'Support' column (site-footer.tsx:61-67) is static prose with no channel. A store selling physical inventory with no way to reach the seller is a major trust/support gap, and business contact info is a Stripe/consumer-law expectation. Customers with order/shipping/refund problems have nowhere to turn.

**Recommendation:** Add src/app/contact/page.tsx with a support email and/or contact form plus business name/address, and link it in the footer Support section and header.

### 1.14 No profile editing (name/email/password) despite DB support

**Severity:** medium

**Why it matters:** src/app/account/page.tsx renders only an order list. There is no UI to change full_name (even though migration 0004 grants UPDATE(full_name)), account email, or password while signed in. The full_name captured at signup can never be corrected — basic account self-service is absent.

**Recommendation:** Add an account settings section with a form updating profiles.full_name and offering email/password changes via supabase.auth.updateUser. The DB grant already exists.

### 1.15 No saved address book — shipping address re-entered every order

**Severity:** medium

**Why it matters:** There is no addresses table or address-book UI. Stripe collects the address fresh on every checkout and stores it only as a per-order JSONB snapshot (orders.shipping_address), which the account page never displays. Repeat buyers must re-enter their address each purchase and can never review where a past order shipped.

**Recommendation:** Add a public.addresses table (user_id FK, own-rows RLS) with account UI to manage saved addresses, surface stored shipping_address on order detail, and optionally prefill Stripe from a default address.

### 1.16 No account deletion or personal-data export (GDPR/CCPA)

**Severity:** medium

**Why it matters:** There is no self-serve account deletion or data export. The store holds PII (profiles, orders.shipping_address) but nothing lets a user request erasure (needs service-role auth.admin.deleteUser) or retrieve their data — a right-to-erasure/right-to-access compliance and trust gap.

**Recommendation:** Add an authenticated 'Delete my account' server route using the admin client (auth.admin.deleteUser) with confirmation, plus a data-export endpoint returning the user's profile + orders.

### 1.17 Categories cannot be edited, only created and deleted

**Severity:** medium

**Why it matters:** actions.ts has createCategory and deleteCategory but no updateCategory; the categories page shows only a delete button. Fixing a typo, changing a slug, or adding a description requires deleting (which uncategorises every product) and recreating — basic taxonomy maintenance is impossible without collateral damage.

**Recommendation:** Add an updateCategory server action and an inline edit form so name, slug, and description can be changed in place.

### 1.18 No product search, category filter, or stock sort in admin catalog

**Severity:** medium

**Why it matters:** src/app/admin/products/page.tsx:32-36 is a flat table by created_at, 50/page, with no search, no category/game filter, no active-vs-hidden filter, and no stock/price sort. Card stores carry thousands of SKUs, so editing or locating a single card is a paging exercise and low/zero-stock products cannot be surfaced.

**Recommendation:** Add a name/slug search input and filter controls (category, active state, in/out of stock) wired to searchParams, plus sortable stock/price columns.

### 1.19 No customer management and no UI to grant/revoke admin

**Severity:** medium

**Why it matters:** There is no admin surface for the profiles table — operators cannot list customers, view a customer's orders/contact info, or promote/demote admins. README documents the only admin-promotion path as raw SQL in the Supabase console. RLS already lets admins read/update all profiles, so the capability exists at the data layer but has no UI, forcing DB console access to onboard staff (a security anti-pattern).

**Recommendation:** Add an /admin/customers page listing profiles with order history and a guarded server-action toggle for is_admin (via service role or a widened column grant).

### 1.20 No bulk operations or CSV import/export for catalog or orders

**Severity:** medium

**Why it matters:** All catalog editing is one record at a time; there is no multi-select, no bulk activate/deactivate/delete, no bulk price/stock adjust, and no CSV import/export of products or orders. Onboarding a new set (hundreds of cards), running a sale, or reconciling inventory must be done record-by-record — a core operational gap for a real store.

**Recommendation:** Add row selection with bulk activate/deactivate/delete and bulk stock/price server actions, plus CSV import (create/update by slug) and export of products and orders.

### 1.21 Search is a plain unindexed ILIKE with no relevance ranking and a narrow field set

**Severity:** medium

**Why it matters:** Search does ILIKE '%q%' over name/description/set_name only (src/lib/queries.ts:34-42); game, rarity, condition (and any future card_number) are not searched, so 'Pokemon' won't match by game. There is no pg_trgm/tsvector GIN index, so every query is a leading-wildcard sequential scan with no relevance ordering (falls back to created_at) and no typo tolerance — slow and low-quality as the catalog grows.

**Recommendation:** Add a pg_trgm GIN index (or a generated tsvector column + GIN + websearch_to_tsquery) over name/set_name/game/card_number, search those columns, and order by relevance (similarity or ts_rank).

### 1.22 No inventory management page — dashboard widget only, hardcoded threshold, no alerts

**Severity:** medium

**Why it matters:** The only low-stock signal is a dashboard panel querying lte('stock',3) limited to 5 rows (src/app/admin/page.tsx:23-28). The threshold 3 is hardcoded (not in config), only the 5 lowest show, there is no dedicated inventory page listing everything below threshold, no per-product reorder point, and no zero-stock alert. If more than 5 items are low, the rest are hidden until a customer hits an out-of-stock checkout error.

**Recommendation:** Add an inventory page listing all products at/below a configurable threshold with quick stock-edit, distinguish 0-stock from low, and optionally notify when stock crosses the reorder point.

---

## 2. Bugs & mistakes in existing code (10)

### 2.1 Marking an order 'refunded'/'cancelled' issues no Stripe refund and no refund webhook syncs status

**Severity:** high · **Where:** `src/app/admin/actions.ts:169-178 (updateOrderStatus); src/app/api/webhooks/stripe/route.ts`

updateOrderStatus only runs orders.update({ status }); it never calls stripe.refunds.create() or cancels the PaymentIntent, even though orders.stripe_payment_intent is stored for exactly this. Selecting 'refunded' changes a DB label while the customer's card is never credited and the dashboard revenue metric drops the order. Conversely the webhook handles only checkout.session.completed — there is no charge.refunded/refund.updated/charge.dispute.created handler — so a refund issued from the Stripe dashboard never syncs back and the order stays 'paid'. Money movement and order status are decoupled in both directions, risking chargebacks, double-refunds, and mis-fulfillment.

**Fix:** Make the refund/cancel transition call stripe.refunds.create({ payment_intent }) and persist status only on Stripe success; add charge.refunded/charge.dispute.created webhook handlers to keep DB status authoritative; notify the customer.

### 2.2 Stock is never restored when an order is cancelled or refunded

**Severity:** medium · **Where:** `src/app/admin/actions.ts:169-178 (updateOrderStatus)`

Stock is decremented at fulfillment via the decrement_stock RPC (src/app/api/webhooks/stripe/route.ts:159-169), but updateOrderStatus only writes the status column when an admin moves an order to 'cancelled' or 'refunded' — it never increments products.stock back for the order_items, and no restock/increment_stock path exists anywhere. Every cancellation/refund permanently under-counts inventory, causing false out-of-stock states, blocked future sales, and a skewed low-stock dashboard (recoverable only by a manual stock edit).

**Fix:** On transition into cancelled/refunded (when previously paid/fulfilled), add an atomic increment_stock RPC re-adding each order_item quantity, guarded by a stock_settled flag to prevent double-restocking on repeated status toggles.

### 2.3 Async/delayed payment success is never handled — those paid orders vanish and stock never decrements

**Severity:** medium · **Where:** `src/app/api/webhooks/stripe/route.ts:37-55`

The webhook processes only checkout.session.completed and returns early when payment_status !== 'paid'. For delayed methods (ACH/bank debits), completed fires while unpaid, so the early return skips order creation; the later checkout.session.async_payment_succeeded is NOT handled (nor is async_payment_failed). The success page even has a 'Payment processing' branch, showing the flow is anticipated but dropped server-side. Any async payment that later confirms produces no order row, no order_items, and no stock decrement — the customer is charged but the order silently disappears. (Trigger requires a delayed method enabled in the Stripe dashboard; card default is synchronous.)

**Fix:** Handle checkout.session.async_payment_succeeded (run the same fulfillOrder path) and async_payment_failed (notify/mark failed); use a switch over event.type instead of a single-event if.

### 2.4 needs_review orders raise no alert and expose an internal status to customers

**Severity:** medium · **Where:** `src/app/api/webhooks/stripe/route.ts:170-180; src/components/order-status-badge.tsx`

When stock can't be satisfied, fulfillOrder() sets status='needs_review' and only console.errors — there is no admin email/alert, so a paid, unfulfillable order sits unnoticed until someone scans the orders list (and there is no filter to find it). Separately, needs_review is a full ORDER_STATUSES member rendered by OrderStatusBadge on the customer-facing account page, so a buyer sees a confusing internal 'Needs review' badge on their own order with no explanation of the problem or next steps.

**Fix:** Send an operator alert (email/Slack) when an order is flagged needs_review, and map needs_review to a customer-friendly label (e.g. 'Processing') on the account page (or exclude it from customer rendering) while notifying the buyer appropriately.

### 2.5 Cart never re-validates stock/availability; checkout rejection is not actionable

**Severity:** medium · **Where:** `src/app/cart/page.tsx; src/lib/cart-store.ts:13; src/app/api/checkout/route.ts:71-84`

The cart stores a stock snapshot captured at add-to-cart time and never refreshes it, so a sold-out/inactive/reduced item still shows as available and the +/- cap uses the stale value. The server correctly re-validates at checkout and returns a specific 409 (e.g. 'Only N of X left'), but the client only shows a generic toast title and never marks, updates, or highlights the offending line item, so the user cannot tell which item to fix and abandons the cart.

**Fix:** Re-fetch live stock/price/is_active for cart items on cart mount and reconcile the store; on a 409, return per-product error detail and highlight/update the specific offending line items instead of one opaque toast.

### 2.6 Cart subtotal/total displayed can differ from what Stripe charges (stale price snapshot)

**Severity:** low · **Where:** `src/lib/cart-store.ts:6-15,75; src/app/api/checkout/route.ts:86-98`

CartItem persists a priceCents snapshot and the cart total is computed from it, while the checkout route re-fetches live price_cents and builds Stripe line items from that. If a product's price changes while the item sits in the persisted localStorage cart, the cart page's Subtotal/Total will not match the Stripe checkout amount. Stripe still charges the correct authoritative price (no financial loss), but on a price increase the mismatch can read as a bait-and-switch and erode trust.

**Fix:** Refresh cart item prices from the server when the cart is displayed (same reconciliation as the stock re-validation fix) so the on-site total matches the server-authoritative checkout price.

### 2.7 'My orders' page shows every customer's orders to admins

**Severity:** low · **Where:** `src/app/account/page.tsx:20-23`

The account page queries orders with select('*, order_items(*)') and no user scoping, relying entirely on RLS. But orders_select_own_or_admin (0004_security_hardening_v2.sql:26-31) returns ALL rows when is_admin() is true, so when an admin opens /account ('My orders', 'Signed in as {email}') the page lists every customer's orders — emails, totals, items — mislabeled as the admin's own. Impact is limited to already-privileged admins (no customer can see others' orders), so this is a mislabeling/PII-context defect, not an authorization leak.

**Fix:** Scope the query explicitly to the signed-in user (e.g. .or(`user_id.eq.${user.id},email.eq.${user.email}`)) instead of leaning on RLS for row selection.

### 2.8 Cart subtotal/total always formatted as USD, ignoring item currency

**Severity:** low · **Where:** `src/app/cart/page.tsx:146,155; src/components/cart/cart-sheet.tsx:137; src/lib/cart-store.ts:75`

Line items render with item.currency, but the subtotal/total call formatPrice(totalCents()) with no currency argument, so formatPrice falls back to its 'usd' default; totalCents() also blindly sums priceCents across all items regardless of currency. products carries a currency column (default 'usd'), so any non-USD or mixed-currency cart would show the wrong symbol and a nonsensical combined amount. Currently latent because currency is not exposed in the admin form and the seed uses only usd (a differing currency needs direct DB insertion).

**Fix:** Derive currency from the cart items (use the first item's currency and prevent mixing currencies in one cart) and pass it into formatPrice(totalCents(), currency).

### 2.9 Paid orders flagged needs_review are excluded from dashboard revenue

**Severity:** low · **Where:** `src/app/admin/page.tsx:14-17,31-34`

Dashboard revenue sums total_cents only for status in ['paid','fulfilled']. But the webhook flips a successfully-paid order to needs_review whenever it cannot fully decrement stock (webhook route.ts:172-182). Those orders were charged (payment_status 'paid' is required to reach fulfillment) yet are omitted, so reported revenue silently understates captured payments for exactly the orders that most need attention.

**Fix:** Include needs_review in the revenue query (or base revenue on Stripe-captured amount) and/or surface a separate needs_review count on the dashboard.

### 2.10 Product search is unavailable on mobile

**Severity:** low · **Where:** `src/components/site-header.tsx:79-97,120-131`

The search form is wrapped in 'hidden max-w-xs flex-1 sm:block', so it does not render below the sm breakpoint, and the mobile navigation Sheet contains only category links with no search input (even though onSearch already calls setMobileOpen(false) as if a mobile search field were expected). Mobile visitors — the largest traffic segment — can only browse by category, with no way to search for a specific card.

**Fix:** Add a search input inside the mobile menu Sheet (reusing the onSearch handler) or make the header search visible on small screens.

---

## 3. Other gaps (SEO, accessibility, trust, UX) (21)

| Severity | Category | Gap | Recommendation |
|---|---|---|---|
| medium | seo | No Product JSON-LD structured data on PDPs | generateMetadata sets title/description/OG only; no schema.org Product exists (grep application/ld+json returns none). Render a <script type='application/ld+json'> Product object with name, image, description, and offers { price, priceCurrency, availability from stock, url } to enable price/availability rich results. (src/app/products/[slug]/page.tsx:14-29) |
| medium | seo | No sitemap.xml | No src/app/sitemap.ts and no generateStaticParams, so crawlers rely on internal links only, slowing/limiting product-page indexing. Add src/app/sitemap.ts (MetadataRoute.Sitemap) emitting /, /products, one entry per published product (query slugs + lastModified), and category URLs, using siteConfig.url. |
| medium | seo | No canonical URLs — filterable /products URLs create duplicate content | No page sets metadata.alternates.canonical. category/game/search/sort params make the same grid reachable at many URLs, splitting ranking signals; PDPs also lack a self-canonical. Add alternates.canonical to product detail generateMetadata (absoluteUrl(`/products/${slug}`)) and a /products canonical that ignores sort/search params. |
| medium | accessibility | No skip-to-content link for keyboard/screen-reader users | layout.tsx renders the full header before <main> with no skip link and no target id/tabindex, failing WCAG 2.4.1 (Bypass Blocks). Add a visually-hidden-until-focused skip link as the first body child (href='#main-content') and give <main id='main-content' tabIndex={-1}>. (src/app/layout.tsx:51-62) |
| low | seo-merchandising | Category description and dedicated category landing pages never surfaced | categories.description is never displayed; navigation only produces filtered /products?category=slug URLs with no /category/[slug] landing page, per-category metadata, or intro, and the header just shows 'Shop' when a category is active. Add /category/[slug] routes (name + description + filtered grid + metadata) or at minimum show the active category's name/description as the /products heading. |
| low | seo | No robots.txt or per-page noindex on private routes | No src/app/robots.ts and no robots metadata on /admin, /account, /cart, /checkout/success. Add robots.ts allowing the public site, disallowing /admin, /account, /cart, /checkout, /api, referencing the sitemap, plus robots:{index:false} on those transactional pages. (Sensitive routes are auth-gated, so this is hygiene, not a content leak.) |
| low | seo-pwa | No web app manifest / PWA metadata and missing icon set | No app/manifest.ts, only favicon.ico (no icon/apple-icon/opengraph-image), and siteConfig.shortName is unused. Add src/app/manifest.ts using siteConfig name/shortName/description with icons and theme_color, plus app/icon and app/apple-icon assets. |
| low | seo | Root layout defines no default Open Graph / Twitter card metadata | Root metadata sets title/description/metadataBase but no openGraph/twitter and there is no opengraph-image, so sharing the homepage or any non-product page yields a bare, image-less preview. Add default openGraph (type website, siteName, url, static opengraph-image) and twitter.card='summary_large_image'; set openGraph.type on product pages. (src/app/layout.tsx:22-29) |
| low | ux-performance | Product detail route has no loading skeleton | The list route has loading.tsx but /products/[slug] has none, so navigating to a product on a slow network appears to hang while getProductBySlug awaits. Add src/app/products/[slug]/loading.tsx with an image + text skeleton mirroring the detail layout. |
| low | orders-fulfillment | No invoice or receipt document is generated for any order | The checkout session sets no invoice_creation and no receipt_email, and the app generates no invoice/receipt, so (combined with no email) customers get no downloadable/emailed proof of purchase. Enable Stripe invoice_creation/receipt_email or generate an invoice linked from the account order view. (src/app/api/checkout/route.ts:104-121) |
| low | accounts | No order detail view or shipping info in order history | Order line items render inline, but there is no per-order detail route and the captured shipping_address, phone, payment status, and receipt are never shown. Add /account/orders/[id] (RLS already scopes order_items) showing shipping_address, status, and item breakdown, linked from each order card. (src/app/account/page.tsx:44-90) |
| low | ux | Auth callback errors are silently swallowed on the login page | On code-exchange failure, auth/callback redirects to /login?error=auth_callback, but AuthForm reads only the 'next' param and the login page renders no error banner, so a failed email confirmation looks like a plain reload. Read the 'error' param and render a message like 'We couldn't sign you in from that link. Please try again.' (src/app/auth/callback/route.ts:22; src/components/auth-form.tsx:15-16) |
| low | admin-ux | Order status changes apply instantly with no confirm and don't revalidate the dashboard | OrderStatusSelect fires updateOrderStatus on change with no confirmation (a misclick can set refunded/cancelled) and no audit trail, and updateOrderStatus revalidates only /admin/orders so the dashboard tiles go stale. Confirm destructive transitions, record who/when (audit log), and revalidatePath('/admin') too. (src/components/admin/order-status-select.tsx:26-36; src/app/admin/actions.ts:169-178) |
| low | admin-ops | Replacing a product image orphans the old file and enforces no size limit | maybeUploadImage always uploads to a fresh UUID and never removes the previous object on replace/delete, so the bucket accumulates orphans; it validates only file.type.startsWith('image/') with no max-size check. Delete the prior object on replace/product-delete and reject oversized files before upload. (src/app/admin/actions.ts:41-66,124-157) |
| low | admin-analytics | Dashboard analytics are thin | The dashboard shows only lifetime revenue, order count, and product count — no today/this-month time series, no AOV, no best-sellers, and no per-status breakdown. Add time-bucketed revenue, AOV, top products (aggregate order_items), and status counts. (src/app/admin/page.tsx:10-34) |
| low | trust-conversion | No customer reviews or product ratings | No reviews/ratings table or PDP review section exists, so there is no social proof on product pages. Add a product_reviews table (RLS limiting writes to buyers) with a review list + star average + submission form on the PDP, or at minimum curated testimonials. |
| low | trust-content | No About or FAQ page | No /about or /faq routes, though the footer gestures at trust copy ('inspected and graded before shipping'). Add src/app/about and src/app/faq (seller story, grading/authenticity, shipping times, condition, payment) and link them in the footer. |
| low | trust-navigation | Footer Support section is dead text with no links; no social links | The footer's Support column is a static paragraph with zero links while other columns link out, and there are no social links anywhere (existing links all resolve — the problem is missing, not broken, links). Replace it with a real link list (Contact, FAQ, Shipping, Returns, Privacy, Terms) once those pages exist, and optionally add social profiles. (src/components/site-footer.tsx:61-67) |
| low | trust-legal | No cookie/privacy notice | Supabase auth-session cookies are set (server.ts/middleware.ts) with no privacy or cookie policy anywhere. These are strictly-necessary cookies (consent-exempt) and there is no non-essential tracking, so a blocking consent banner is not legally required — but a privacy/cookie policy page describing cookie use should exist for an e-commerce store handling PII. Add it (can live in the Privacy page). |
| low | marketing-retention | No newsletter / email signup | No email-capture form or subscribers table anywhere (an enhancement, not a broken promise — the README does not commit to it). For a collectibles store where restock/drop alerts matter, add a footer newsletter signup storing emails (Supabase 'subscribers' table or an email provider). |
| low | discovery-ux | No share action on the product detail page | The PDP has breadcrumbs/buy-box/specs and OG metadata but no in-page share/copy-link control, missing an organic-sharing opportunity for individual cards. Add a small share button near the title (Web Share API with clipboard-copy fallback). |

---

## Suggested priority order

1. **Money & compliance first** — charge shipping, enable Stripe Tax, wire real Stripe refunds (+ stock restore), handle `async_payment_succeeded`.
2. **Close the post-purchase loop** — order confirmation email, tracking numbers + shipping notification, order detail view.
3. **Unblock customers** — password reset, profile editing, legal/contact pages (also required by card networks & Stripe ToS).
4. **Unblock the operator** — admin order search/status filter, needs_review alerting, category edit, inventory view.
5. **Grow conversion** — catalog filters + public pagination, image gallery, TCG attributes, related products, SEO (sitemap, JSON-LD, canonicals).
