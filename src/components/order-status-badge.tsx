import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

const STYLES: Record<string, string> = {
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300",
  paid: "bg-blue-100 text-blue-800 dark:bg-blue-950 dark:text-blue-300",
  fulfilled:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300",
  cancelled: "bg-muted text-muted-foreground",
  refunded: "bg-red-100 text-red-800 dark:bg-red-950 dark:text-red-300",
  needs_review:
    "bg-orange-100 text-orange-800 dark:bg-orange-950 dark:text-orange-300",
};

export function OrderStatusBadge({ status }: { status: string }) {
  return (
    <Badge
      variant="secondary"
      className={cn("capitalize", STYLES[status] ?? "")}
    >
      {status.replace(/_/g, " ")}
    </Badge>
  );
}
