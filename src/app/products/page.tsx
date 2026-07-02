import type { Metadata } from "next";
import { Suspense } from "react";
import { ProductCard } from "@/components/product-card";
import { ProductsToolbar } from "@/components/products-toolbar";
import {
  getCategories,
  getGames,
  getProducts,
  type ProductFilters,
} from "@/lib/queries";

export const metadata: Metadata = {
  title: "Shop",
  description: "Browse trading card game singles, sealed product and accessories.",
};

type SearchParams = Promise<{
  category?: string;
  game?: string;
  search?: string;
  sort?: string;
}>;

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const sp = await searchParams;
  const filters: ProductFilters = {
    categorySlug: sp.category,
    game: sp.game,
    search: sp.search,
    sort: (sp.sort as ProductFilters["sort"]) ?? "newest",
  };

  const [products, categories, games] = await Promise.all([
    getProducts(filters),
    getCategories(),
    getGames(),
  ]);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8">
      <div className="mb-2">
        <h1 className="text-3xl font-bold">
          {sp.search ? `Results for “${sp.search}”` : "Shop"}
        </h1>
        <p className="text-muted-foreground">
          {products.length} {products.length === 1 ? "product" : "products"}
        </p>
      </div>

      <Suspense>
        <ProductsToolbar categories={categories} games={games} />
      </Suspense>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
          {products.map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      ) : (
        <div className="rounded-lg border border-dashed py-20 text-center">
          <p className="text-lg font-medium">No products found</p>
          <p className="text-muted-foreground">
            Try a different category or search term.
          </p>
        </div>
      )}
    </div>
  );
}
