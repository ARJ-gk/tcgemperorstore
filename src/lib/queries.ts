import { createClient } from "@/lib/supabase/server";
import type { Category, Product, ProductWithCategory } from "@/lib/types";

export type ProductFilters = {
  categorySlug?: string;
  game?: string;
  search?: string;
  sort?: "newest" | "price-asc" | "price-desc" | "name";
};

/** Public catalog listing with optional filters. Only active products. */
export async function getProducts(
  filters: ProductFilters = {},
): Promise<ProductWithCategory[]> {
  const supabase = await createClient();

  let query = supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .eq("is_active", true);

  if (filters.categorySlug) {
    const { data: cat } = await supabase
      .from("categories")
      .select("id")
      .eq("slug", filters.categorySlug)
      .single();
    if (cat) query = query.eq("category_id", cat.id);
    else return [];
  }

  if (filters.game) query = query.eq("game", filters.game);

  if (filters.search) {
    // Neutralize PostgREST `or()` metacharacters (comma/parens are the filter
    // grammar's delimiters; `*` `%` `\` are wildcard/escape) so a crafted
    // search term cannot alter the filter structure.
    const q = filters.search.replace(/[,()*%\\]/g, " ").trim();
    if (q) {
      query = query.or(
        `name.ilike.%${q}%,description.ilike.%${q}%,set_name.ilike.%${q}%`,
      );
    }
  }

  switch (filters.sort) {
    case "price-asc":
      query = query.order("price_cents", { ascending: true });
      break;
    case "price-desc":
      query = query.order("price_cents", { ascending: false });
      break;
    case "name":
      query = query.order("name", { ascending: true });
      break;
    default:
      query = query.order("created_at", { ascending: false });
  }

  const { data, error } = await query;
  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

export async function getFeaturedProducts(
  limit = 4,
): Promise<ProductWithCategory[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .eq("is_active", true)
    .eq("featured", true)
    .order("created_at", { ascending: false })
    .limit(limit);
  if (error) throw error;
  return (data ?? []) as ProductWithCategory[];
}

export async function getProductBySlug(
  slug: string,
): Promise<ProductWithCategory | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("*, category:categories(id, name, slug)")
    .eq("slug", slug)
    .eq("is_active", true)
    .maybeSingle();
  return (data as ProductWithCategory | null) ?? null;
}

export async function getCategories(): Promise<Category[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("categories")
    .select("*")
    .order("name", { ascending: true });
  return data ?? [];
}

/** Distinct non-null game values for the filter UI. */
export async function getGames(): Promise<string[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("products")
    .select("game")
    .eq("is_active", true)
    .not("game", "is", null);
  const games = new Set<string>();
  (data ?? []).forEach((r) => r.game && games.add(r.game));
  return [...games].sort();
}

export type { Product };
