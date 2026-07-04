"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { Minus, Plus, ShoppingCart, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
  SheetFooter,
} from "@/components/ui/sheet";
import { useCart } from "@/lib/cart-store";
import { useHydrated } from "@/lib/use-hydrated";
import { formatPrice } from "@/lib/format";

export function CartSheet() {
  const [open, setOpen] = useState(false);
  const mounted = useHydrated();
  const items = useCart((s) => s.items);
  const setQuantity = useCart((s) => s.setQuantity);
  const removeItem = useCart((s) => s.removeItem);
  const totalCents = useCart((s) => s.totalCents);

  // Avoid hydration mismatch: cart lives in localStorage.
  const count = mounted ? items.reduce((n, i) => n + i.quantity, 0) : 0;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Cart">
          <ShoppingCart className="size-5" />
          {count > 0 && (
            // key remount replays the pop on every quantity change; count is
            // client-only state so there's no hydration mismatch.
            <Badge
              key={count}
              className="fx-motion absolute -right-1 -top-1 size-5 justify-center rounded-full p-0 text-[10px] tabular-nums [animation:badge-pop_300ms_ease-out]"
            >
              {count}
            </Badge>
          )}
        </Button>
      </SheetTrigger>

      <SheetContent className="flex w-full flex-col gap-0 sm:max-w-md">
        <SheetHeader>
          <SheetTitle>Your cart {count > 0 && `(${count})`}</SheetTitle>
        </SheetHeader>

        {!mounted || items.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center gap-3 px-6 text-center">
            <ShoppingCart className="size-10 text-muted-foreground" />
            <p className="text-muted-foreground">Your cart is empty.</p>
            <Button asChild variant="secondary" onClick={() => setOpen(false)}>
              <Link href="/products">Browse products</Link>
            </Button>
          </div>
        ) : (
          <>
            <div className="flex-1 space-y-4 overflow-y-auto px-4 py-2">
              {items.map((item) => (
                <div key={item.productId} className="flex gap-3">
                  <div className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md border bg-muted">
                    {item.imageUrl && (
                      <Image
                        src={item.imageUrl}
                        alt={item.name}
                        fill
                        sizes="56px"
                        className="object-cover"
                      />
                    )}
                  </div>
                  <div className="flex flex-1 flex-col">
                    <Link
                      href={`/products/${item.slug}`}
                      onClick={() => setOpen(false)}
                      className="line-clamp-2 text-sm font-medium hover:underline"
                    >
                      {item.name}
                    </Link>
                    <span className="text-sm text-muted-foreground">
                      {formatPrice(item.priceCents, item.currency)}
                    </span>
                    <div className="mt-auto flex items-center gap-2">
                      <div className="flex items-center rounded-md border">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          onClick={() =>
                            setQuantity(item.productId, item.quantity - 1)
                          }
                          aria-label="Decrease quantity"
                        >
                          <Minus className="size-3" />
                        </Button>
                        <span className="w-6 text-center text-sm tabular-nums">
                          {item.quantity}
                        </span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="size-7"
                          disabled={item.quantity >= item.stock}
                          onClick={() =>
                            setQuantity(item.productId, item.quantity + 1)
                          }
                          aria-label="Increase quantity"
                        >
                          <Plus className="size-3" />
                        </Button>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="size-7 text-muted-foreground"
                        onClick={() => removeItem(item.productId)}
                        aria-label="Remove item"
                      >
                        <Trash2 className="size-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="text-sm font-medium tabular-nums">
                    {formatPrice(item.priceCents * item.quantity, item.currency)}
                  </div>
                </div>
              ))}
            </div>

            <Separator />
            <SheetFooter className="gap-3">
              <div className="flex items-center justify-between text-base font-semibold">
                <span>Subtotal</span>
                <span className="tabular-nums">{formatPrice(totalCents())}</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Shipping &amp; taxes calculated at checkout.
              </p>
              <Button asChild size="lg" onClick={() => setOpen(false)}>
                <Link href="/cart">View cart &amp; checkout</Link>
              </Button>
            </SheetFooter>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
