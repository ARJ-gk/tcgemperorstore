import Link from "next/link";
import { DollarSign, Package, ShoppingBag, TriangleAlert } from "lucide-react";
import { OrderStatusBadge } from "@/components/order-status-badge";
import { createClient } from "@/lib/supabase/server";
import { formatDateTime, formatPrice } from "@/lib/format";

export default async function AdminDashboard() {
  const supabase = await createClient();

  const [{ count: productCount }, { count: orderCount }, paidOrders, recent, lowStock] =
    await Promise.all([
      supabase.from("products").select("*", { count: "exact", head: true }),
      supabase.from("orders").select("*", { count: "exact", head: true }),
      supabase
        .from("orders")
        .select("total_cents")
        .in("status", ["paid", "fulfilled"]),
      supabase
        .from("orders")
        .select("id, created_at, status, total_cents, currency, email")
        .order("created_at", { ascending: false })
        .limit(5),
      supabase
        .from("products")
        .select("id, name, stock")
        .lte("stock", 3)
        .order("stock", { ascending: true })
        .limit(5),
    ]);

  const revenue = (paidOrders.data ?? []).reduce(
    (sum, o) => sum + (o.total_cents ?? 0),
    0,
  );

  const stats = [
    {
      label: "Revenue (paid)",
      value: formatPrice(revenue),
      icon: DollarSign,
    },
    { label: "Orders", value: orderCount ?? 0, icon: ShoppingBag },
    { label: "Products", value: productCount ?? 0, icon: Package },
  ];

  return (
    <div className="space-y-8">
      <div className="grid gap-4 sm:grid-cols-3">
        {stats.map(({ label, value, icon: Icon }) => (
          <div key={label} className="rounded-lg border p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{label}</span>
              <Icon className="size-4 text-muted-foreground" />
            </div>
            <p className="mt-2 text-2xl font-bold tabular-nums">{value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent orders */}
        <div className="rounded-lg border">
          <div className="flex items-center justify-between border-b px-5 py-3">
            <h2 className="font-semibold">Recent orders</h2>
            <Link href="/admin/orders" className="text-sm text-primary">
              View all
            </Link>
          </div>
          <div className="divide-y">
            {(recent.data ?? []).length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                No orders yet.
              </p>
            )}
            {(recent.data ?? []).map((o) => (
              <Link
                key={o.id}
                href="/admin/orders"
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/50"
              >
                <div>
                  <p className="text-sm font-medium">
                    #{o.id.slice(0, 8).toUpperCase()}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDateTime(o.created_at)} · {o.email ?? "guest"}
                  </p>
                </div>
                <div className="flex items-center gap-3">
                  <OrderStatusBadge status={o.status} />
                  <span className="text-sm font-medium tabular-nums">
                    {formatPrice(o.total_cents, o.currency)}
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* Low stock */}
        <div className="rounded-lg border">
          <div className="flex items-center gap-2 border-b px-5 py-3">
            <TriangleAlert className="size-4 text-amber-500" />
            <h2 className="font-semibold">Low stock</h2>
          </div>
          <div className="divide-y">
            {(lowStock.data ?? []).length === 0 && (
              <p className="px-5 py-6 text-sm text-muted-foreground">
                All products are well stocked.
              </p>
            )}
            {(lowStock.data ?? []).map((p) => (
              <Link
                key={p.id}
                href={`/admin/products/${p.id}`}
                className="flex items-center justify-between px-5 py-3 hover:bg-muted/50"
              >
                <span className="text-sm">{p.name}</span>
                <span className="text-sm font-medium tabular-nums">
                  {p.stock} left
                </span>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
