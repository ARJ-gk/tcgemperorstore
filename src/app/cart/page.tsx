"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Loader2, Lock, Minus, Plus, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { AmbientBackground } from "@/components/fx/ambient-background";
import { CardSilhouette } from "@/components/fx/card-silhouette";
import { useCart } from "@/lib/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatPrice } from "@/lib/format";

export default function CartPage() {
  const mounted = useHydrated();
  const [loading, setLoading] = useState(false);
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const totalCents = useCart((s) => s.totalCents);

  async function checkout() {
    setLoading(true);
    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            productId: i.productId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      window.location.href = data.url;
    } catch (err) {
      toast.error("Could not start checkout", {
        description: err instanceof Error ? err.message : undefined,
      });
      setLoading(false);
    }
  }

  if (!mounted) return null;

  if (items.length === 0) {
    return (
      <div className="relative isolate mx-auto flex max-w-6xl flex-col items-center gap-4 px-4 py-24 text-center">
        <AmbientBackground variant="glow" />
        <div
          aria-hidden
          className="relative flex h-28 w-44 items-center justify-center [perspective:700px]"
        >
          <CardSilhouette
            static
            className="relative w-20 [transform:rotateY(-18deg)_rotateX(6deg)]"
          />
          <CardSilhouette
            static
            className="relative -ml-8 w-20 opacity-50 [transform:rotateY(18deg)_rotateX(6deg)]"
          />
        </div>
        <h1 className="text-2xl font-bold">Your cart is empty</h1>
        <p className="text-muted-foreground">
          Find your next chase card in the shop.
        </p>
        <Button asChild size="lg">
          <Link href="/products">Browse products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="relative isolate mx-auto max-w-6xl px-4 py-8">
      <AmbientBackground variant="glow" />
      <h1 className="mb-6 text-3xl font-bold">Your cart</h1>
      <div className="grid gap-8 lg:grid-cols-[1fr_360px]">
        {/* Items */}
        <div className="divide-y rounded-lg border bg-card/50">
          {items.map((item) => (
            <div key={item.productId} className="flex gap-4 p-4">
              <Link
                href={`/products/${item.slug}`}
                className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md border bg-muted"
              >
                {item.imageUrl && (
                  <Image
                    src={item.imageUrl}
                    alt={item.name}
                    fill
                    sizes="80px"
                    className="object-cover"
                  />
                )}
              </Link>
              <div className="flex flex-1 flex-col">
                <Link
                  href={`/products/${item.slug}`}
                  className="font-medium hover:underline"
                >
                  {item.name}
                </Link>
                <span className="text-sm text-muted-foreground">
                  {formatPrice(item.priceCents, item.currency)} each
                </span>
                <div className="mt-auto flex items-center gap-3">
                  <div className="flex items-center rounded-md border">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 transition-transform duration-100 active:scale-90"
                      onClick={() =>
                        setQuantity(item.productId, item.quantity - 1)
                      }
                      aria-label="Decrease quantity"
                    >
                      <Minus className="size-3.5" />
                    </Button>
                    <span
                      key={item.quantity}
                      className="fx-motion w-8 text-center text-sm tabular-nums [animation:badge-pop_250ms_ease-out]"
                    >
                      {item.quantity}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="size-8 transition-transform duration-100 active:scale-90"
                      disabled={item.quantity >= item.stock}
                      onClick={() =>
                        setQuantity(item.productId, item.quantity + 1)
                      }
                      aria-label="Increase quantity"
                    >
                      <Plus className="size-3.5" />
                    </Button>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-muted-foreground"
                    onClick={() => removeItem(item.productId)}
                  >
                    <Trash2 className="size-4" /> Remove
                  </Button>
                </div>
              </div>
              <div className="font-semibold tabular-nums">
                {formatPrice(item.priceCents * item.quantity, item.currency)}
              </div>
            </div>
          ))}
        </div>

        {/* Summary */}
        <div className="glass-panel h-fit space-y-4 rounded-lg p-6 shadow-ambient lg:sticky lg:top-24">
          <h2 className="text-lg font-semibold">Order summary</h2>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Subtotal</span>
            <span className="tabular-nums">{formatPrice(totalCents())}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Shipping</span>
            <span className="text-muted-foreground">Calculated at checkout</span>
          </div>
          <Separator />
          <div className="flex justify-between font-semibold">
            <span>Total</span>
            <span className="tabular-nums">{formatPrice(totalCents())}</span>
          </div>
          <Button
            size="lg"
            className="btn-sheen fx-motion w-full"
            onClick={checkout}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="size-4 animate-spin" />
            ) : (
              <Lock className="size-4" />
            )}
            {loading ? "Redirecting…" : "Checkout with Stripe"}
          </Button>
          <p className="text-center text-xs text-muted-foreground">
            You&apos;ll enter shipping &amp; payment details securely on Stripe.
          </p>
        </div>
      </div>
    </div>
  );
}
