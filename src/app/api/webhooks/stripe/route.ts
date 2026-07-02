import { NextResponse } from "next/server";
import type Stripe from "stripe";
import { getStripe } from "@/lib/stripe/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { Json } from "@/lib/database.types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!webhookSecret) {
    return NextResponse.json(
      { error: "STRIPE_WEBHOOK_SECRET is not configured" },
      { status: 500 },
    );
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 400 });
  }

  const stripe = getStripe();
  const rawBody = await request.text();

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Invalid signature";
    return NextResponse.json(
      { error: `Webhook verification failed: ${message}` },
      { status: 400 },
    );
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;

    if (session.payment_status !== "paid") {
      return NextResponse.json({ received: true });
    }

    try {
      await fulfillOrder(stripe, session);
    } catch (err) {
      console.error("Order fulfillment failed:", err);
      // Return 500 so Stripe retries delivery.
      return NextResponse.json(
        { error: "Fulfillment failed" },
        { status: 500 },
      );
    }
  }

  return NextResponse.json({ received: true });
}

async function fulfillOrder(stripe: Stripe, session: Stripe.Checkout.Session) {
  const admin = createAdminClient();

  // Idempotency: this session may be delivered more than once.
  const { data: existing } = await admin
    .from("orders")
    .select("id")
    .eq("stripe_session_id", session.id)
    .maybeSingle();
  if (existing) return;

  const lineItems = await stripe.checkout.sessions.listLineItems(session.id, {
    expand: ["data.price.product"],
    limit: 100,
  });

  const items = lineItems.data.map((li) => {
    const product = li.price?.product as Stripe.Product | undefined;
    return {
      product_id: product?.metadata?.product_id ?? null,
      product_name: product?.name ?? li.description ?? "Item",
      quantity: li.quantity ?? 1,
      unit_price_cents: li.price?.unit_amount ?? 0,
    };
  });

  // The shipping address lives under different fields across Stripe API
  // versions (`shipping_details` -> `collected_information.shipping_details`).
  type ShippingLike = {
    name?: string | null;
    address?: Stripe.Address | null;
  } | null;
  const loose = session as unknown as {
    collected_information?: { shipping_details?: ShippingLike };
    shipping_details?: ShippingLike;
  };
  const shipping: ShippingLike =
    loose.collected_information?.shipping_details ??
    loose.shipping_details ??
    (session.customer_details
      ? {
          name: session.customer_details.name,
          address: session.customer_details.address,
        }
      : null);

  // metadata.user_id is set server-side by our checkout route, but validate it
  // is a UUID before writing it to a FK column (a bad value would loop retries).
  const rawUserId = session.metadata?.user_id;
  const userId =
    rawUserId &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      rawUserId,
    )
      ? rawUserId
      : null;

  const { data: order, error: orderError } = await admin
    .from("orders")
    .insert({
      user_id: userId,
      email: session.customer_details?.email ?? session.customer_email ?? null,
      status: "paid",
      total_cents: session.amount_total ?? 0,
      currency: session.currency ?? "usd",
      stripe_session_id: session.id,
      stripe_payment_intent:
        typeof session.payment_intent === "string"
          ? session.payment_intent
          : (session.payment_intent?.id ?? null),
      shipping_address: (shipping
        ? {
            name: shipping.name ?? session.customer_details?.name ?? null,
            phone: session.customer_details?.phone ?? null,
            address: shipping.address ?? null,
          }
        : null) as unknown as Json,
    })
    .select("id")
    .single();

  if (orderError || !order) {
    throw new Error(orderError?.message ?? "Failed to insert order");
  }

  const { error: itemsError } = await admin.from("order_items").insert(
    items.map((it) => ({
      order_id: order.id,
      product_id: it.product_id,
      product_name: it.product_name,
      quantity: it.quantity,
      unit_price_cents: it.unit_price_cents,
    })),
  );
  if (itemsError) throw new Error(itemsError.message);

  // Decrement stock atomically for each purchased product. decrement_stock
  // refuses (returns 0 rows) when stock is insufficient rather than clamping,
  // so we can flag any order we couldn't fully satisfy for manual review
  // instead of silently overselling.
  const decrements = await Promise.all(
    items
      .filter((it) => it.product_id)
      .map(async (it) => {
        const { data, error } = await admin.rpc("decrement_stock", {
          p_product_id: it.product_id as string,
          p_qty: it.quantity,
        });
        return { productId: it.product_id, ok: !error && (data ?? 0) > 0, error };
      }),
  );

  const problems = decrements.filter((d) => !d.ok);
  if (problems.length > 0) {
    console.error(
      "Order flagged needs_review (insufficient/failed stock decrement)",
      order.id,
      problems.map((p) => ({ productId: p.productId, error: p.error?.message })),
    );
    await admin
      .from("orders")
      .update({ status: "needs_review" })
      .eq("id", order.id);
  }
}
