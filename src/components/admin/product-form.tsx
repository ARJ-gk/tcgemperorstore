"use client";

import { useActionState, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { ActionState } from "@/app/admin/actions";
import type { Category, Product } from "@/lib/types";

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  categories: Category[];
  product?: Product;
  submitLabel: string;
};

export function ProductForm({
  action,
  categories,
  product,
  submitLabel,
}: Props) {
  const [state, formAction, pending] = useActionState(action, undefined);
  const [preview, setPreview] = useState<string | null>(
    product?.image_url ?? null,
  );

  return (
    <form action={formAction} className="space-y-6">
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-4">
          <Field label="Name" htmlFor="name">
            <Input id="name" name="name" defaultValue={product?.name} required />
          </Field>
          <Field label="Slug" htmlFor="slug" hint="Auto-generated if left blank">
            <Input id="slug" name="slug" defaultValue={product?.slug} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Price (USD)" htmlFor="price">
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                min="0"
                defaultValue={
                  product ? (product.price_cents / 100).toFixed(2) : ""
                }
                required
              />
            </Field>
            <Field label="Stock" htmlFor="stock">
              <Input
                id="stock"
                name="stock"
                type="number"
                min="0"
                defaultValue={product?.stock ?? 0}
                required
              />
            </Field>
          </div>
          <Field label="Category" htmlFor="category_id">
            <Select
              name="category_id"
              defaultValue={product?.category_id ?? "none"}
            >
              <SelectTrigger id="category_id">
                <SelectValue placeholder="Select a category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">None</SelectItem>
                {categories.map((c) => (
                  <SelectItem key={c.id} value={c.id}>
                    {c.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>
          <Field label="Description" htmlFor="description">
            <Textarea
              id="description"
              name="description"
              rows={4}
              defaultValue={product?.description ?? ""}
            />
          </Field>
        </div>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Game" htmlFor="game">
              <Input id="game" name="game" defaultValue={product?.game ?? ""} />
            </Field>
            <Field label="Set" htmlFor="set_name">
              <Input
                id="set_name"
                name="set_name"
                defaultValue={product?.set_name ?? ""}
              />
            </Field>
            <Field label="Rarity" htmlFor="rarity">
              <Input
                id="rarity"
                name="rarity"
                defaultValue={product?.rarity ?? ""}
              />
            </Field>
            <Field label="Condition" htmlFor="condition">
              <Input
                id="condition"
                name="condition"
                defaultValue={product?.condition ?? ""}
              />
            </Field>
          </div>

          <Field
            label="Image URL"
            htmlFor="image_url"
            hint="Or upload a file below"
          >
            <Input
              id="image_url"
              name="image_url"
              defaultValue={product?.image_url ?? ""}
              onChange={(e) => setPreview(e.target.value || null)}
            />
          </Field>
          <Field label="Upload image" htmlFor="image">
            <Input
              id="image"
              name="image"
              type="file"
              accept="image/*"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) setPreview(URL.createObjectURL(f));
              }}
            />
          </Field>

          {preview && (
            <div className="relative aspect-[5/7] w-32 overflow-hidden rounded-md border bg-muted">
              <Image
                src={preview}
                alt="Preview"
                fill
                sizes="128px"
                className="object-cover"
                unoptimized
              />
            </div>
          )}

          <div className="flex flex-col gap-2 pt-2">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="is_active"
                defaultChecked={product ? product.is_active : true}
                className="size-4 accent-primary"
              />
              Active (visible in store)
            </label>
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                name="featured"
                defaultChecked={product?.featured ?? false}
                className="size-4 accent-primary"
              />
              Featured on homepage
            </label>
          </div>
        </div>
      </div>

      {state?.error && (
        <p className="text-sm text-destructive">{state.error}</p>
      )}

      <div className="flex gap-3">
        <Button type="submit" disabled={pending}>
          {pending && <Loader2 className="size-4 animate-spin" />}
          {submitLabel}
        </Button>
        <Button asChild variant="outline" type="button">
          <Link href="/admin/products">Cancel</Link>
        </Button>
      </div>
    </form>
  );
}

function Field({
  label,
  htmlFor,
  hint,
  children,
}: {
  label: string;
  htmlFor: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}
