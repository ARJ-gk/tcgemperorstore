"use client";

import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export function DeleteButton({
  action,
  id,
  confirmText = "Delete this item? This cannot be undone.",
}: {
  action: (formData: FormData) => void | Promise<void>;
  id: string;
  confirmText?: string;
}) {
  return (
    <form
      action={action}
      onSubmit={(e) => {
        if (!window.confirm(confirmText)) e.preventDefault();
      }}
    >
      <input type="hidden" name="id" value={id} />
      <Button
        variant="ghost"
        size="icon"
        type="submit"
        className="text-muted-foreground hover:text-destructive"
        aria-label="Delete"
      >
        <Trash2 className="size-4" />
      </Button>
    </form>
  );
}
