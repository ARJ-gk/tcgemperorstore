import { Suspense } from "react";
import { Separator } from "@/components/ui/separator";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { OrderTrackingForm } from "@/components/admin/order-tracking-form";
import { OrdersToolbar } from "@/components/admin/orders-toolbar";
import { Pagination } from "@/components/admin/pagination";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { OrderItem, OrderStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";

const PAGE_SIZE = 25;

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ShippingAddress = {
  name?: string | null;
  phone?: string | null;
  address?: {
    line1?: string | null;
    line2?: string | null;
    city?: string | null;
    state?: string | null;
    postal_code?: string | null;
    country?: string | null;
  } | null;
} | null;

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; q?: string; status?: string }>;
}) {
  const { page: pageParam, q: qParam, status: statusParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;
  const status = ORDER_STATUSES.includes(statusParam as OrderStatus)
    ? (statusParam as OrderStatus)
    : undefined;
  const q = (qParam ?? "").trim();

  const supabase = await createClient();
  let query = supabase
    .from("orders")
    .select("*, order_items(*)", { count: "exact" });

  if (status) query = query.eq("status", status);
  if (q) {
    if (UUID_RE.test(q)) {
      query = query.eq("id", q);
    } else {
      // Same metacharacter neutralization as the catalog search — commas and
      // parens are PostgREST filter grammar.
      const safe = q.replace(/[,()*%\\]/g, " ").trim();
      if (safe) query = query.ilike("email", `%${safe}%`);
    }
  }

  const { data: orders, count } = await query
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  const filtered = Boolean(q || status);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="text-lg font-semibold">Orders ({count ?? 0})</h2>
        <Suspense>
          <OrdersToolbar />
        </Suspense>
      </div>

      {!orders || orders.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          {filtered ? "No orders match your filters." : "No orders yet."}
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const items = (order.order_items ?? []) as OrderItem[];
            const ship = order.shipping_address as ShippingAddress;
            const addr = ship?.address;
            return (
              <div key={order.id} className="rounded-lg border p-5">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">
                      #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(order.created_at)}
                    </p>
                    <p className="text-sm">{order.email ?? "guest"}</p>
                  </div>
                  <OrderStatusSelect orderId={order.id} status={order.status} />
                </div>

                <Separator className="my-4" />

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                      Items
                    </p>
                    <ul className="space-y-1 text-sm">
                      {items.map((it) => (
                        <li key={it.id} className="flex justify-between gap-4">
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
                  </div>
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                      Ship to
                    </p>
                    {ship ? (
                      <address className="text-sm not-italic text-muted-foreground">
                        {ship.name && <div>{ship.name}</div>}
                        {addr?.line1 && <div>{addr.line1}</div>}
                        {addr?.line2 && <div>{addr.line2}</div>}
                        {(addr?.city || addr?.state || addr?.postal_code) && (
                          <div>
                            {[addr?.city, addr?.state, addr?.postal_code]
                              .filter(Boolean)
                              .join(", ")}
                          </div>
                        )}
                        {addr?.country && <div>{addr.country}</div>}
                        {ship.phone && <div>{ship.phone}</div>}
                      </address>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        No shipping details.
                      </p>
                    )}
                  </div>
                </div>

                <Separator className="my-4" />
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="mb-1 text-xs font-medium uppercase text-muted-foreground">
                      Shipment tracking
                    </p>
                    <OrderTrackingForm
                      orderId={order.id}
                      carrier={order.carrier}
                      trackingNumber={order.tracking_number}
                    />
                  </div>
                  <div className="text-right">
                    <p className="text-xs text-muted-foreground">
                      {order.shipping_cents > 0 &&
                        `incl. ${formatPrice(order.shipping_cents, order.currency)} shipping`}
                      {order.tax_cents > 0 &&
                        ` · ${formatPrice(order.tax_cents, order.currency)} tax`}
                    </p>
                    <p className="font-semibold">
                      Total{" "}
                      <span className="tabular-nums">
                        {formatPrice(order.total_cents, order.currency)}
                      </span>
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Pagination
        basePath="/admin/orders"
        page={page}
        pageSize={PAGE_SIZE}
        total={count ?? 0}
        params={{ q: q || undefined, status }}
      />
    </div>
  );
}
