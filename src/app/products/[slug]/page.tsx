import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ProductBuyBox } from "@/components/product-buy-box";
import { getProductBySlug } from "@/lib/queries";
import { formatPrice } from "@/lib/format";

type Params = Promise<{ slug: string }>;

export async function generateMetadata({
  params,
}: {
  params: Params;
}): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description ?? undefined,
    openGraph: product.image_url
      ? { images: [{ url: product.image_url }] }
      : undefined,
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Params;
}) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const specs = [
    ["Game", product.game],
    ["Set", product.set_name],
    ["Rarity", product.rarity],
    ["Condition", product.condition],
  ].filter(([, v]) => Boolean(v)) as [string, string][];

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      {/* Breadcrumb */}
      <nav className="mb-6 flex items-center gap-1 text-sm text-muted-foreground">
        <Link href="/products" className="hover:text-foreground">
          Shop
        </Link>
        {product.category && (
          <>
            <ChevronRight className="size-3.5" />
            <Link
              href={`/products?category=${product.category.slug}`}
              className="hover:text-foreground"
            >
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="size-3.5" />
        <span className="truncate text-foreground">{product.name}</span>
      </nav>

      <div className="grid gap-8 md:grid-cols-2">
        {/* Image */}
        <div className="relative aspect-[5/7] w-full max-w-md overflow-hidden rounded-xl border bg-muted">
          {product.image_url ? (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 40vw"
              className="object-cover"
              priority
            />
          ) : (
            <div className="flex h-full items-center justify-center text-muted-foreground">
              No image
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div className="space-y-2">
            {product.game && (
              <p className="text-sm font-medium text-muted-foreground">
                {product.game}
                {product.set_name ? ` · ${product.set_name}` : ""}
              </p>
            )}
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <div className="flex flex-wrap gap-2">
              {product.rarity && <Badge variant="secondary">{product.rarity}</Badge>}
              {product.condition && (
                <Badge variant="outline">{product.condition}</Badge>
              )}
            </div>
          </div>

          <p className="text-3xl font-bold tabular-nums">
            {formatPrice(product.price_cents, product.currency)}
          </p>

          <ProductBuyBox product={product} />

          {product.description && (
            <>
              <Separator />
              <div className="space-y-2">
                <h2 className="font-semibold">Description</h2>
                <p className="whitespace-pre-line text-sm text-muted-foreground">
                  {product.description}
                </p>
              </div>
            </>
          )}

          {specs.length > 0 && (
            <>
              <Separator />
              <dl className="grid grid-cols-2 gap-y-2 text-sm">
                {specs.map(([label, value]) => (
                  <div key={label} className="contents">
                    <dt className="text-muted-foreground">{label}</dt>
                    <dd className="font-medium">{value}</dd>
                  </div>
                ))}
              </dl>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
