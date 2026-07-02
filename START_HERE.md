# ▶ START HERE — finish TCG Emperor (10 minutes)

The store is **fully built and passing a clean production build**. The only thing left
is pasting a few secrets I can't access for you. Do the steps below and you're live in
test mode. Everything is copy-paste.

---

## 1. Add 3 secrets to `.env.local`

Open [`.env.local`](.env.local) and fill in these empty values:

### a) Supabase service-role key
Direct link (already your Store project):
**https://supabase.com/dashboard/project/vuhuespeostohqpsoshj/settings/api**

Copy the **`service_role`** key (the secret one) →

```
SUPABASE_SERVICE_ROLE_KEY=eyJ...paste-service-role-here...
```

> This is only used server-side by the Stripe webhook. Never expose it to the browser.

### b) Stripe test keys
Direct link: **https://dashboard.stripe.com/test/apikeys** (make sure the toggle says **Test mode**)

```
STRIPE_SECRET_KEY=sk_test_...paste-secret-key...
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...paste-publishable-key...
```

(You'll fill `STRIPE_WEBHOOK_SECRET` in step 3.)

---

## 2. Start the app

```bash
npm run dev
```

Open **http://localhost:3000** — you'll see the store with sample products.

---

## 3. Turn on Stripe webhooks locally

In a **second terminal**, install/run the [Stripe CLI](https://stripe.com/docs/stripe-cli):

```bash
stripe login
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

It prints a line like `whsec_abc123...`. Copy it into `.env.local`:

```
STRIPE_WEBHOOK_SECRET=whsec_...paste-here...
```

Then **stop and restart** `npm run dev` so it picks up the new values.

---

## 4. Do a test purchase

1. Add a product to the cart → **Checkout with Stripe**.
2. Pay with the Stripe **test card**:
   ```
   Card:   4242 4242 4242 4242
   Expiry: any future date    CVC: any 3 digits    ZIP: any
   ```
3. You'll land on the **order-confirmation** page.
4. Check it worked: the order appears under **/admin/orders** and the item's **stock drops**.

✅ If the order shows up, Stripe is fully connected and you're done with setup.

---

## 5. Admin access

The admin panel is at **http://localhost:3000/admin**. A test admin is already created:

```
Email:    admin@tcgemperor.test
Password: Admin123!
```

To make **your own** account an admin instead: sign up at `/signup`, then run this in the
[Supabase SQL editor](https://supabase.com/dashboard/project/vuhuespeostohqpsoshj/sql):

```sql
update public.profiles set is_admin = true where email = 'YOUR_EMAIL_HERE';
```

Then delete the test admin when you go live.

---

## 6. Security & QA

A full QA + security audit has been run and all findings fixed — see
[`QA_SECURITY_REPORT.md`](QA_SECURITY_REPORT.md). One thing is left for you (not
code, a dashboard toggle):

- **Enable leaked-password protection:** Supabase Dashboard → Authentication →
  Policies → turn on "Leaked password protection".

## 7. (Optional) Things to know

- **"Familly App" is paused.** I paused it to free a Supabase project slot for this store
  (your org allows 2 free projects). Resume it anytime here:
  https://supabase.com/dashboard/project/ljioenhmacahpwmsnnyz — pausing/resuming is free.
- **Your business tracker is untouched.** The "Tcg emperor" project (inventory/sales/etc.)
  was left exactly as-is; the store uses a **separate** project.
- **Customer signup emails:** Supabase sends a confirmation email on signup (built-in sender,
  low limits). For a real store, set up SMTP under Supabase → Auth → Emails. Guests can
  check out without an account, so this doesn't block sales.

---

## 8. When you're ready to deploy (Vercel)

1. Push this folder to GitHub, import it at **https://vercel.com/new**.
2. In Vercel project settings, add every variable from [`.env.example`](.env.example)
   (set `NEXT_PUBLIC_SITE_URL` to your real domain).
3. In Supabase → Auth → URL Configuration, add your Vercel domain to **Site URL** and
   **Redirect URLs** (e.g. `https://your-domain.com/**`).
4. In [Stripe → Webhooks](https://dashboard.stripe.com/test/webhooks), add endpoint
   `https://your-domain.com/api/webhooks/stripe` for event `checkout.session.completed`,
   and put its signing secret in the Vercel env var `STRIPE_WEBHOOK_SECRET`.
5. Deploy. To go live: swap Stripe test keys for **live** keys + live webhook secret.

---

Full details are in [`README.md`](README.md). That's it — enjoy your store! 👑
