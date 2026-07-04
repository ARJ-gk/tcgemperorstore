import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { CheckCircle2, Clock } from "lucide-react";
import type Stripe from "stripe";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { ClearCart } from "@/components/clear-cart";
import { getStripe } from "@/lib/stripe/server";
import { formatPrice } from "@/lib/format";

export const metadata: Metadata = { title: "Order confirmed" };

type SearchParams = Promise<{ session_id?: string }>;

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const { session_id } = await searchParams;
  if (!session_id) redirect("/");

  let session: Stripe.Checkout.Session | null = null;
  try {
    session = await getStripe().checkout.sessions.retrieve(session_id, {
      expand: ["line_items"],
    });
  } catch {
    session = null;
  }

  if (!session) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-2xl font-bold">We couldn&apos;t find that order</h1>
        <p className="mt-2 text-muted-foreground">
          If you were charged, your order was still recorded — signed-in
          customers can find it under “My orders”.
        </p>
        <Button asChild className="mt-6">
          <Link href="/products">Continue shopping</Link>
        </Button>
      </div>
    );
  }

  const paid = session.payment_status === "paid";
  const lineItems = session.line_items?.data ?? [];

  return (
    <div className="mx-auto max-w-lg px-4 py-16">
      {paid && <ClearCart />}
      <div className="flex flex-col items-center gap-3 text-center">
        {paid ? (
          <CheckCircle2 className="size-14 text-emerald-500" />
        ) : (
          <Clock className="size-14 text-amber-500" />
        )}
        <h1 className="text-3xl font-bold">
          {paid ? "Thank you for your order!" : "Payment processing"}
        </h1>
        <p className="text-muted-foreground">
          {paid
            ? `Payment received for ${session.customer_details?.email ?? "your email"} — keep this page or your Stripe receipt as confirmation.`
            : "Your payment is still processing. This page will reflect it shortly."}
        </p>
      </div>

      <div className="mt-8 rounded-xl border p-6">
        <h2 className="mb-4 font-semibold">Order summary</h2>
        <ul className="space-y-3">
          {lineItems.map((li) => (
            <li key={li.id} className="flex justify-between gap-4 text-sm">
              <span>
                {li.quantity} × {li.description}
              </span>
              <span className="tabular-nums">
                {formatPrice(li.amount_total, session!.currency ?? "usd")}
              </span>
            </li>
          ))}
        </ul>
        <Separator className="my-4" />
        <div className="space-y-1.5 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">
              {formatPrice(
                session.amount_subtotal ?? 0,
                session.currency ?? "usd",
              )}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Shipping</span>
            <span className="tabular-nums">
              {formatPrice(
                session.total_details?.amount_shipping ?? 0,
                session.currency ?? "usd",
              )}
            </span>
          </div>
          {(session.total_details?.amount_tax ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Tax</span>
              <span className="tabular-nums">
                {formatPrice(
                  session.total_details?.amount_tax ?? 0,
                  session.currency ?? "usd",
                )}
              </span>
            </div>
          )}
          {(session.total_details?.amount_discount ?? 0) > 0 && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Discount</span>
              <span className="tabular-nums">
                −
                {formatPrice(
                  session.total_details?.amount_discount ?? 0,
                  session.currency ?? "usd",
                )}
              </span>
            </div>
          )}
        </div>
        <Separator className="my-4" />
        <div className="flex justify-between font-semibold">
          <span>Total</span>
          <span className="tabular-nums">
            {formatPrice(session.amount_total ?? 0, session.currency ?? "usd")}
          </span>
        </div>
      </div>

      <div className="mt-6 flex justify-center gap-3">
        <Button asChild variant="outline">
          <Link href="/products">Continue shopping</Link>
        </Button>
        <Button asChild>
          <Link href="/account">View my orders</Link>
        </Button>
      </div>
    </div>
  );
}
