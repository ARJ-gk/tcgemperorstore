import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Simple server-rendered prev/next pagination for admin list pages.
 */
export function Pagination({
  basePath,
  page,
  pageSize,
  total,
}: {
  basePath: string;
  page: number;
  pageSize: number;
  total: number;
}) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  if (totalPages <= 1) return null;

  const href = (p: number) => `${basePath}?page=${p}`;

  return (
    <div className="flex items-center justify-between pt-2">
      <span className="text-sm text-muted-foreground">
        Page {page} of {totalPages}
      </span>
      <div className="flex gap-2">
        <Button
          asChild={page > 1}
          variant="outline"
          size="sm"
          disabled={page <= 1}
        >
          {page > 1 ? (
            <Link href={href(page - 1)}>
              <ChevronLeft className="size-4" /> Prev
            </Link>
          ) : (
            <span>
              <ChevronLeft className="size-4" /> Prev
            </span>
          )}
        </Button>
        <Button
          asChild={page < totalPages}
          variant="outline"
          size="sm"
          disabled={page >= totalPages}
        >
          {page < totalPages ? (
            <Link href={href(page + 1)}>
              Next <ChevronRight className="size-4" />
            </Link>
          ) : (
            <span>
              Next <ChevronRight className="size-4" />
            </span>
          )}
        </Button>
      </div>
    </div>
  );
}
