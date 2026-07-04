"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Minus, Plus, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/types";

export function ProductBuyBox({ product }: { product: Product }) {
  const [qty, setQty] = useState(1);
  const addItem = useCart((s) => s.addItem);
  const router = useRouter();
  const outOfStock = product.stock <= 0;

  function add(redirect = false) {
    addItem(
      {
        productId: product.id,
        slug: product.slug,
        name: product.name,
        priceCents: product.price_cents,
        currency: product.currency,
        imageUrl: product.image_url,
        stock: product.stock,
      },
      qty,
    );
    if (redirect) {
      router.push("/cart");
    } else {
      toast.success("Added to cart", { description: product.name });
    }
  }

  if (outOfStock) {
    return (
      <Button size="lg" disabled className="w-full">
        Sold out
      </Button>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <span className="text-sm font-medium">Quantity</span>
        <div className="flex items-center rounded-md border">
          <Button
            variant="ghost"
            size="icon"
            className="size-9 transition-transform duration-100 active:scale-90"
            onClick={() => setQty((q) => Math.max(1, q - 1))}
            aria-label="Decrease quantity"
          >
            <Minus className="size-4" />
          </Button>
          <span
            key={qty}
            className="fx-motion w-10 text-center tabular-nums [animation:badge-pop_250ms_ease-out]"
          >
            {qty}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="size-9 transition-transform duration-100 active:scale-90"
            disabled={qty >= product.stock}
            onClick={() => setQty((q) => Math.min(product.stock, q + 1))}
            aria-label="Increase quantity"
          >
            <Plus className="size-4" />
          </Button>
        </div>
        <span className="text-sm text-muted-foreground">
          {product.stock} in stock
        </span>
      </div>

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          size="lg"
          className="btn-sheen fx-motion flex-1"
          onClick={() => add(false)}
        >
          <ShoppingCart className="size-4" /> Add to cart
        </Button>
        <Button
          size="lg"
          variant="secondary"
          className="flex-1"
          onClick={() => add(true)}
        >
          Buy now
        </Button>
      </div>
    </div>
  );
}
