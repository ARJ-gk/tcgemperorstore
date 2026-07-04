"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Stripe from "stripe";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { getStripe } from "@/lib/stripe/server";
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

export async function updateOrderStatus(
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const status = String(formData.get("status")) as OrderStatus;
  if (!ORDER_STATUSES.includes(status)) return { error: "Unknown status" };

  // Admin verified above — the service-role client lets this action call the
  // restock_order RPC, which is deliberately not executable by regular users.
  const admin = createAdminClient();
  const { data: order } = await admin
    .from("orders")
    .select("id, status, stripe_payment_intent")
    .eq("id", id)
    .maybeSingle();
  if (!order) return { error: "Order not found" };
  if (order.status === status) return;

  // The money has already been returned — reopening the order would desync
  // Stripe, order status, and stock.
  if (order.status === "refunded") {
    return { error: "Refunded orders cannot change status." };
  }

  if (status === "refunded" && order.stripe_payment_intent) {
    try {
      await getStripe().refunds.create({
        payment_intent: order.stripe_payment_intent,
        reason: "requested_by_customer",
      });
    } catch (err) {
      // Already refunded in the Stripe Dashboard — safe to record locally.
      const alreadyRefunded =
        err instanceof Stripe.errors.StripeError &&
        err.code === "charge_already_refunded";
      if (!alreadyRefunded) {
        console.error("Stripe refund failed for order", id, err);
        return { error: "Stripe refund failed — order status not changed." };
      }
    }
  }

  // Stock was only decremented for orders that reached paid/fulfilled.
  // needs_review means some decrements were refused, so restocking those
  // blindly would inflate inventory — reconcile them manually instead.
  // restock_order is idempotent (restocked_at stamp), so racing the
  // charge.refunded webhook is harmless.
  if (
    (status === "cancelled" || status === "refunded") &&
    (order.status === "paid" || order.status === "fulfilled")
  ) {
    const { error } = await admin.rpc("restock_order", { p_order_id: id });
    if (error) return { error: `Restock failed: ${error.message}` };
  }

  const { error } = await admin
    .from("orders")
    .update({
      status,
      ...(status === "refunded"
        ? { refunded_at: new Date().toISOString() }
        : {}),
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/admin");
  revalidatePath("/account");
}

export async function updateOrderTracking(
  formData: FormData,
): Promise<ActionState> {
  await requireAdmin();
  const id = String(formData.get("id"));
  const carrier = str(formData.get("carrier"));
  const trackingNumber = str(formData.get("tracking_number"));
  if ((carrier?.length ?? 0) > 100 || (trackingNumber?.length ?? 0) > 100) {
    return { error: "Carrier / tracking number is too long." };
  }

  const supabase = await createClient();
  const { data: order } = await supabase
    .from("orders")
    .select("shipped_at")
    .eq("id", id)
    .maybeSingle();
  if (!order) return { error: "Order not found" };

  const { error } = await supabase
    .from("orders")
    .update({
      carrier,
      tracking_number: trackingNumber,
      // Stamp the ship date the first time a tracking number is recorded
      // (edits keep the original date; clearing the number clears it).
      shipped_at: trackingNumber
        ? (order.shipped_at ?? new Date().toISOString())
        : null,
    })
    .eq("id", id);
  if (error) return { error: error.message };

  revalidatePath("/admin/orders");
  revalidatePath("/account");
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
