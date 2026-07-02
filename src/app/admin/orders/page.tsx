import { Separator } from "@/components/ui/separator";
import { OrderStatusSelect } from "@/components/admin/order-status-select";
import { Pagination } from "@/components/admin/pagination";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatPrice } from "@/lib/format";
import type { OrderItem } from "@/lib/types";

const PAGE_SIZE = 25;

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
  searchParams: Promise<{ page?: string }>;
}) {
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, Number.parseInt(pageParam ?? "1", 10) || 1);
  const from = (page - 1) * PAGE_SIZE;

  const supabase = await createClient();
  const { data: orders, count } = await supabase
    .from("orders")
    .select("*, order_items(*)", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, from + PAGE_SIZE - 1);

  return (
    <div className="space-y-4">
      <h2 className="text-lg font-semibold">Orders ({count ?? 0})</h2>

      {!orders || orders.length === 0 ? (
        <div className="rounded-lg border border-dashed py-16 text-center text-muted-foreground">
          No orders yet.
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

      <Pagination
        basePath="/admin/orders"
        page={page}
        pageSize={PAGE_SIZE}
        total={count ?? 0}
      />
    </div>
  );
}
