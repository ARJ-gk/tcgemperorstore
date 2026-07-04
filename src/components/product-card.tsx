import Image from "next/image";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { AddToCartButton } from "@/components/add-to-cart-button";
import { HoloCard } from "@/components/fx/holo-card";
import { formatPrice, rarityIsFoil } from "@/lib/format";
import type { ProductWithCategory } from "@/lib/types";

export function ProductCard({ product }: { product: ProductWithCategory }) {
  const lowStock = product.stock > 0 && product.stock <= 3;

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border bg-card shadow-ambient transition-shadow duration-300 hover:shadow-lift">
      <HoloCard rarity={product.rarity} className="rounded-t-lg">
        <Link
          href={`/products/${product.slug}`}
          className="relative block aspect-[5/7] overflow-hidden bg-muted"
        >
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className="object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
          <div className="absolute left-2 top-2 flex flex-col gap-1">
            {product.rarity &&
              (rarityIsFoil(product.rarity) ? (
                <Badge className="border-transparent bg-[linear-gradient(100deg,var(--holo-violet),var(--holo-magenta))] text-white shadow-sm">
                  {product.rarity}
                </Badge>
              ) : (
                <Badge variant="secondary" className="backdrop-blur">
                  {product.rarity}
                </Badge>
              ))}
            {product.stock <= 0 && <Badge variant="destructive">Sold out</Badge>}
            {lowStock && <Badge variant="outline" className="bg-background/80 backdrop-blur">Only {product.stock} left</Badge>}
          </div>
        </Link>
      </HoloCard>

      <div className="flex flex-1 flex-col gap-2 p-3">
        <div className="flex-1">
          {(product.game || product.category) && (
            <p className="text-xs text-muted-foreground">
              {product.game ?? product.category?.name}
              {product.set_name ? ` · ${product.set_name}` : ""}
            </p>
          )}
          <Link
            href={`/products/${product.slug}`}
            className="line-clamp-2 text-sm font-medium hover:underline"
          >
            {product.name}
          </Link>
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="font-semibold tabular-nums">
            {formatPrice(product.price_cents, product.currency)}
          </span>
          <AddToCartButton product={product} size="sm" label="Add" />
        </div>
      </div>
    </div>
  );
}
