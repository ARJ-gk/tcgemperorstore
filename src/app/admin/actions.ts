"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/auth";
import type { OrderStatus } from "@/lib/types";
import { ORDER_STATUSES } from "@/lib/types";

export type ActionState = { error?: string } | undefined;

async function requireAdmin() {
  if (!(await isAdmin())) redirect("/login?next=/admin");
}

function slugify(input: string): string {
  const slug = input
    .toLowerCase()
    .trim()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 80)
    .replace(/^-+|-+$/g, "");
  // Names made entirely of non-ASCII chars (e.g. 遊戯王) or emoji slugify to ""
  // — fall back to a unique slug so the NOT NULL UNIQUE column never collides.
  return slug || `item-${crypto.randomUUID().slice(0, 8)}`;
}

function dollarsToCents(value: FormDataEntryValue | null): number {
  const n = Number.parseFloat(String(value ?? "0"));
  return Number.isFinite(n) ? Math.round(n * 100) : 0;
}

function str(value: FormDataEntryValue | null): string | null {
  const s = String(value ?? "").trim();
  return s.length ? s : null;
}

async function maybeUploadImage(
  formData: FormData,
): Promise<string | null | undefined> {
  const file = formData.get("image");
  if (file instanceof File && file.size > 0) {
    if (!file.type.startsWith("image/")) {
      throw new Error("Only image files can be uploaded.");
    }
    const supabase = await createClient();
    const rawExt = file.name.includes(".")
      ? file.name.split(".").pop()!.toLowerCase()
      : "jpg";
    const ext = /^(jpe?g|png|webp|gif|avif)$/.test(rawExt) ? rawExt : "jpg";
    const path = `products/${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage
      .from("product-images")
      .upload(path, file, { contentType: file.type, upsert: false });
    if (error) throw new Error(`Image upload failed: ${error.message}`);
    const {
      data: { publicUrl },
    } = supabase.storage.from("product-images").getPublicUrl(path);
    return publicUrl;
  }
  // No file uploaded — fall back to the URL field (may be empty string).
  return undefined;
}

function buildProductPayload(formData: FormData) {
  const name = str(formData.get("name"));
  if (!name) return { error: "Name is required" as const };

  const slug = slugify(str(formData.get("slug")) ?? name);
  const categoryId = str(formData.get("category_id"));

  return {
    values: {
      name,
      slug,
      description: str(formData.get("description")),
      price_cents: dollarsToCents(formData.get("price")),
      stock: Math.max(
        0,
        Number.parseInt(String(formData.get("stock") ?? "0"), 10) || 0,
      ),
      category_id: categoryId === "none" ? null : categoryId,
      game: str(formData.get("game")),
      set_name: str(formData.get("set_name")),
      rarity: str(formData.get("rarity")),
      condition: str(formData.get("condition")),
      is_active: formData.get("is_active") === "on",
      featured: formData.get("featured") === "on",
    },
  };
}

export async function createProduct(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = buildProductPayload(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  let imageUrl: string | null | undefined;
  try {
    imageUrl = await maybeUploadImage(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Image upload failed" };
  }

  const { error } = await supabase.from("products").insert({
    ...parsed.values,
    image_url: imageUrl ?? str(formData.get("image_url")),
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function updateProduct(
  id: string,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const parsed = buildProductPayload(formData);
  if ("error" in parsed) return parsed;

  const supabase = await createClient();
  let imageUrl: string | null | undefined;
  try {
    imageUrl = await maybeUploadImage(formData);
  } catch (e) {
    return { error: e instanceof Error ? e.message : "Image upload failed" };
  }
  // Keep existing image unless a new file was uploaded or the URL field changed.
  const urlField = str(formData.get("image_url"));

  const { error } = await supabase
    .from("products")
    .update({
      ...parsed.values,
      image_url: imageUrl ?? urlField,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/products");
  revalidatePath(`/admin/products/${id}`);
  revalidatePath("/products");
  revalidatePath("/");
  redirect("/admin/products");
}

export async function deleteProduct(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("products").delete().eq("id", id);
  revalidatePath("/admin/products");
  revalidatePath("/products");
  revalidatePath("/");
}

export async function updateOrderStatus(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return;

  const supabase = await createClient();
  await supabase.from("orders").update({ status }).eq("id", id);
  revalidatePath("/admin/orders");
}

export async function createCategory(
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const name = str(formData.get("name"));
  if (!name) return { error: "Name is required" };
  const slug = slugify(str(formData.get("slug")) ?? name);

  const supabase = await createClient();
  const { error } = await supabase.from("categories").insert({
    name,
    slug,
    description: str(formData.get("description")),
  });
  if (error) return { error: error.message };

  revalidatePath("/admin/categories");
  revalidatePath("/");
  return { error: undefined };
}

export async function deleteCategory(formData: FormData): Promise<void> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const supabase = await createClient();
  await supabase.from("categories").delete().eq("id", id);
  revalidatePath("/admin/categories");
  revalidatePath("/");
}
