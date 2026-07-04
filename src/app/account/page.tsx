import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Package, Truck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { AmbientBackground } from "@/components/fx/ambient-background";
import { createClient } from "@/lib/supabase/server";
import { getUser } from "@/lib/auth";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { OrderItem } from "@/lib/types";

export const metadata: Metadata = { title: "My orders" };

export default async function AccountPage() {
  const user = await getUser();
  if (!user) redirect("/login?next=/account");

  const supabase = await createClient();
  const { data: orders } = await supabase
    .from("orders")
    .select("*, order_items(*)")
    .order("created_at", { ascending: false });

  return (
    <div className="relative isolate mx-auto max-w-3xl px-4 py-8">
      <AmbientBackground variant="glow" />
      <div className="mb-6">
        <h1 className="text-3xl font-bold">My orders</h1>
        <p className="text-muted-foreground">Signed in as {user.email}</p>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-lg border border-dashed py-20 text-center">
          <Package className="size-10 text-muted-foreground" />
          <p className="text-lg font-medium">No orders yet</p>
          <p className="text-muted-foreground">
            When you place an order it will show up here.
          </p>
          <Button asChild>
            <Link href="/products">Start shopping</Link>
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = (order.order_items ?? []) as OrderItem[];
            return (
              <div
                key={order.id}
                className="rounded-lg border bg-card p-5 shadow-ambient transition-shadow hover:shadow-lift"
              >
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <p className="font-medium">
                      Order{" "}
                      <span className="font-mono text-sm">
                        #{order.id.slice(0, 8).toUpperCase()}
                      </span>
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </p>
                  </div>
                  {/* needs_review is an internal ops flag on an order the
                      customer successfully paid for — show it as paid. */}
                  <OrderStatusBadge
                    status={
                      order.status === "needs_review" ? "paid" : order.status
                    }
                  />
                </div>
                {order.tracking_number && (
                  <p className="mt-2 flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Truck className="size-4" />
                    Shipped{order.shipped_at &&
                      ` ${formatDateTime(order.shipped_at)}`}
                    {order.carrier && ` via ${order.carrier}`} — tracking{" "}
                    <span className="font-medium text-foreground">
                      {order.tracking_number}
                    </span>
                  </p>
                )}
                <Separator className="my-4" />
                <ul className="space-y-2">
                  {items.map((it) => (
                    <li
                      key={it.id}
                      className="flex justify-between gap-4 text-sm"
                    >
                      <span>
                        {it.quantity} × {it.product_name}
                      </span>
                      <span className="tabular-nums">
                        {formatPrice(
                          it.unit_price_cents * it.quantity,
                          order.currency,
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
                <Separator className="my-4" />
                <div className="flex justify-between font-semibold">
                  <span>Total</span>
                  <span className="tabular-nums">
                    {formatPrice(order.total_cents, order.currency)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
