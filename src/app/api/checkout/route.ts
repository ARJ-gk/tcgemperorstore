import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createClient } from "@/lib/supabase/server";
import { siteConfig } from "@/lib/config";

export const runtime = "nodejs";

// Countries Stripe will collect a shipping address for.
const SHIPPING_COUNTRIES: Stripe.Checkout.SessionCreateParams.ShippingAddressCollection.AllowedCountry[] =
  ["US", "CA", "GB", "AU", "DE", "FR", "NL", "IE", "NZ", "SG", "JP"];

type IncomingItem = { productId: string; quantity: number };

export async function POST(request: Request) {
  let body: { items?: IncomingItem[] };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const rawItems = (body.items ?? []).filter(
    (i) => i?.productId && Number.isInteger(i.quantity) && i.quantity > 0,
  );
  if (rawItems.length === 0) {
    return NextResponse.json({ error: "Your cart is empty" }, { status: 400 });
  }

  // Aggregate quantities per product so duplicate entries in the payload can't
  // each pass the per-product stock check independently (oversell bypass).
  const qtyByProduct = new Map<string, number>();
  for (const i of rawItems) {
    qtyByProduct.set(
      i.productId,
      (qtyByProduct.get(i.productId) ?? 0) + i.quantity,
    );
  }
  if (qtyByProduct.size > 100) {
    return NextResponse.json(
      { error: "Too many distinct items in cart." },
      { status: 400 },
    );
  }

  const supabase = await createClient();

  // Re-fetch every product server-side — never trust client-provided prices.
  const { data: products, error } = await supabase
    .from("products")
    .select("id, name, slug, price_cents, currency, stock, image_url, is_active")
    .in("id", [...qtyByProduct.keys()]);

  if (error) {
    return NextResponse.json({ error: "Could not load products" }, { status: 500 });
  }

  // A Stripe Checkout Session requires a single currency across all line items.
  const currencies = new Set((products ?? []).map((p) => p.currency));
  if (currencies.size > 1) {
    return NextResponse.json(
      { error: "All items must use the same currency." },
      { status: 409 },
    );
  }
  const currency = products?.[0]?.currency ?? siteConfig.currency;

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = [];
  for (const [productId, quantity] of qtyByProduct) {
    const product = products?.find((p) => p.id === productId);
    if (!product || !product.is_active) {
      return NextResponse.json(
        { error: `A product in your cart is no longer available.` },
        { status: 409 },
      );
    }
    if (product.stock < quantity) {
      return NextResponse.json(
        {
          error: `Only ${product.stock} of “${product.name}” left in stock.`,
        },
        { status: 409 },
      );
    }

    lineItems.push({
      quantity,
      price_data: {
        currency: product.currency,
        unit_amount: product.price_cents,
        product_data: {
          name: product.name,
          images: product.image_url ? [product.image_url] : undefined,
          metadata: { product_id: product.id },
        },
      },
    });
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const origin = siteConfig.url;

  try {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      currency,
      customer_email: user?.email,
      shipping_address_collection: { allowed_countries: SHIPPING_COUNTRIES },
      phone_number_collection: { enabled: true },
      billing_address_collection: "auto",
      allow_promotion_codes: true,
      metadata: {
        user_id: user?.id ?? "",
      },
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/cart`,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    // Log the real error server-side; return a generic message so we don't
    // reflect Stripe/config internals (e.g. key state) to the caller.
    console.error("checkout session create failed", err);
    return NextResponse.json(
      { error: "Could not create checkout session. Please try again." },
      { status: 500 },
    );
  }
}
