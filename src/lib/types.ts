import type { Tables } from "@/lib/database.types";

export type Product = Tables<"products">;
export type Category = Tables<"categories">;
export type Order = Tables<"orders">;
export type OrderItem = Tables<"order_items">;
export type Profile = Tables<"profiles">;

export type ProductWithCategory = Product & {
  category: Pick<Category, "id" | "name" | "slug"> | null;
};

export type OrderWithItems = Order & {
  order_items: OrderItem[];
};

export const ORDER_STATUSES = [
  "pending",
  "paid",
  "fulfilled",
  "cancelled",
  "refunded",
  "needs_review",
] as const;

export type OrderStatus = (typeof ORDER_STATUSES)[number];
