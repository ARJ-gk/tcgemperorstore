import { ProductForm } from "@/components/admin/product-form";
import { createProduct } from "@/app/admin/actions";
import { getCategories } from "@/lib/queries";

export default async function NewProductPage() {
  const categories = await getCategories();

  return (
    <div className="max-w-3xl space-y-4">
      <h2 className="text-lg font-semibold">New product</h2>
      <ProductForm
        action={createProduct}
        categories={categories}
        submitLabel="Create product"
      />
    </div>
  );
}
