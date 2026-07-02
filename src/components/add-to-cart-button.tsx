"use client";

import { ShoppingCart } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-store";
import type { Product } from "@/lib/types";

type Props = {
  product: Pick<
    Product,
    "id" | "slug" | "name" | "price_cents" | "currency" | "image_url" | "stock"
  >;
  quantity?: number;
  className?: string;
  size?: "sm" | "default" | "lg";
  variant?: "default" | "secondary" | "outline";
  label?: string;
};

export function AddToCartButton({
  product,
  quantity = 1,
  className,
  size = "default",
  variant = "default",
  label = "Add to cart",
}: Props) {
  const addItem = useCart((s) => s.addItem);
  const outOfStock = product.stock <= 0;

  return (
    <Button
      className={className}
      size={size}
      variant={variant}
      disabled={outOfStock}
      onClick={() => {
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
          quantity,
        );
        toast.success("Added to cart", { description: product.name });
      }}
    >
      <ShoppingCart className="size-4" />
      {outOfStock ? "Out of stock" : label}
    </Button>
  );
}
