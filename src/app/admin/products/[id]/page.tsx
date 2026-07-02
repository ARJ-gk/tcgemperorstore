import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { updateProduct } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";
import { getCategories } from "@/lib/queries";

type Params = Promise<{ id: string }>;

export default async function EditProductPage({
  params,
}: {
  params: Params;
}) {
  const { id } = await params;
  const supabase = await createClient();

  const [{ data: product }, categories] = await Promise.all([
    supabase.from("products").select("*").eq("id", id).maybeSingle(),
    getCategories(),
  ]);

  if (!product) notFound();

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold">Edit product</h2>
      <ProductForm
        action={updateProduct.bind(null, id)}
        categories={categories}
        product={product}
        submitLabel="Save changes"
      />
    </div>
  );
}
