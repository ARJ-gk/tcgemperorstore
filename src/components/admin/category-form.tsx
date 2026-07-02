"use client";

import { useActionState } from "react";
import { Loader2, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createCategory } from "@/app/admin/actions";

export function CategoryForm() {
  const [state, formAction, pending] = useActionState(createCategory, undefined);

  return (
    <form action={formAction} className="space-y-3 rounded-lg border p-4">
      <p className="font-medium">Add category</p>
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="space-y-1.5">
          <Label htmlFor="cat-name">Name</Label>
          <Input id="cat-name" name="name" required />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-slug">Slug</Label>
          <Input id="cat-slug" name="slug" placeholder="auto" />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="cat-desc">Description</Label>
          <Input id="cat-desc" name="description" />
        </div>
      </div>
      {state?.error && <p className="text-sm text-destructive">{state.error}</p>}
      <Button type="submit" disabled={pending}>
        {pending ? (
          <Loader2 className="size-4 animate-spin" />
        ) : (
          <Plus className="size-4" />
        )}
        Add category
      </Button>
    </form>
  );
}
