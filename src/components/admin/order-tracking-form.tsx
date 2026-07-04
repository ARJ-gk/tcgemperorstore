"use client";

import { useTransition } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { updateOrderTracking } from "@/app/admin/actions";

export function OrderTrackingForm({
  orderId,
  carrier,
  trackingNumber,
}: {
  orderId: string;
  carrier: string | null;
  trackingNumber: string | null;
}) {
  const [pending, startTransition] = useTransition();

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("id", orderId);
    startTransition(async () => {
      const result = await updateOrderTracking(fd);
      if (result?.error) {
        toast.error("Could not save tracking", { description: result.error });
      } else {
        toast.success("Tracking saved");
      }
    });
  }

  return (
    <form onSubmit={onSubmit} className="flex flex-wrap items-center gap-2">
      <Input
        name="carrier"
        defaultValue={carrier ?? ""}
        placeholder="Carrier (e.g. USPS)"
        className="h-8 w-36 text-sm"
        maxLength={100}
      />
      <Input
        name="tracking_number"
        defaultValue={trackingNumber ?? ""}
        placeholder="Tracking number"
        className="h-8 w-52 text-sm"
        maxLength={100}
      />
      <Button type="submit" variant="outline" size="sm" disabled={pending}>
        {pending && <Loader2 className="size-3.5 animate-spin" />}
        Save
      </Button>
    </form>
  );
}
