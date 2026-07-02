import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { CategoryForm } from "@/components/admin/category-form";
import { DeleteButton } from "@/components/admin/delete-button";
import { deleteCategory } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";

export default async function AdminCategoriesPage() {
  const supabase = await createClient();
  const { data: categories } = await supabase
    .from("categories")
    .select("*, products(count)")
    .order("name", { ascending: true });

  return (
    <div className="space-y-6">
      <CategoryForm />

      <div className="rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Slug</TableHead>
              <TableHead className="text-right">Products</TableHead>
              <TableHead className="w-[80px] text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {(categories ?? []).map((c) => {
              const count =
                (c.products as { count: number }[] | null)?.[0]?.count ?? 0;
              return (
                <TableRow key={c.id}>
                  <TableCell className="font-medium">{c.name}</TableCell>
                  <TableCell className="text-muted-foreground">
                    {c.slug}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">
                    {count}
                  </TableCell>
                  <TableCell>
                    <div className="flex justify-end">
                      <DeleteButton
                        action={deleteCategory}
                        id={c.id}
                        confirmText={`Delete “${c.name}”? Products will be uncategorised.`}
                      />
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
            {(categories ?? []).length === 0 && (
              <TableRow>
                <TableCell
                  colSpan={4}
                  className="py-10 text-center text-muted-foreground"
                >
                  No categories yet.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
