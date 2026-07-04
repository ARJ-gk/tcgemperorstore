"use client";

import { useState, useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { updateOrderStatus } from "@/app/admin/actions";
import { ORDER_STATUSES } from "@/lib/types";

export function OrderStatusSelect({
  orderId,
  status,
}: {
  orderId: string;
  status: string;
}) {
  const [pending, startTransition] = useTransition();
  // Bump to remount the Select (reset to the server status) when a change fails.
  const [resetKey, setResetKey] = useState(0);

  return (
    <div className="flex items-center gap-2">
      <Select
        key={resetKey}
        defaultValue={status}
        onValueChange={(value) => {
          startTransition(async () => {
            const result = await updateOrderStatus(
              (() => {
                const fd = new FormData();
                fd.set("id", orderId);
                fd.set("status", value);
                return fd;
              })(),
            );
            if (result?.error) {
              toast.error("Could not update order", {
                description: result.error,
              });
              setResetKey((k) => k + 1);
            } else if (value === "refunded") {
              toast.success("Order refunded", {
                description: "The Stripe refund was issued and stock restored.",
              });
            }
          });
        }}
      >
        <SelectTrigger className="w-[150px] capitalize">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {ORDER_STATUSES.map((s) => (
            <SelectItem key={s} value={s} className="capitalize">
              {s.replace(/_/g, " ")}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {pending && <Loader2 className="size-4 animate-spin text-muted-foreground" />}
    </div>
  );
}
