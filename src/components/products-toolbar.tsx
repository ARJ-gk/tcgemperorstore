"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import type { Category } from "@/lib/types";

const SORTS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "name", label: "Name A–Z" },
];

export function ProductsToolbar({
  categories,
  games,
}: {
  categories: Category[];
  games: string[];
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();

  const currentCategory = sp.get("category") ?? "";
  const currentGame = sp.get("game") ?? "";
  const currentSort = sp.get("sort") ?? "newest";

  function update(next: Record<string, string | undefined>) {
    const params = new URLSearchParams(sp.toString());
    for (const [key, value] of Object.entries(next)) {
      if (value) params.set(key, value);
      else params.delete(key);
    }
    router.push(`${pathname}?${params.toString()}`);
  }

  return (
    <div className="mb-6 space-y-4">
      {/* Category pills */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => update({ category: undefined })}
          className={cn(
            "rounded-full border px-3 py-1 text-sm transition-colors",
            !currentCategory
              ? "border-primary bg-primary text-primary-foreground"
              : "hover:bg-accent",
          )}
        >
          All
        </button>
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => update({ category: c.slug })}
            className={cn(
              "rounded-full border px-3 py-1 text-sm transition-colors",
              currentCategory === c.slug
                ? "border-primary bg-primary text-primary-foreground"
                : "hover:bg-accent",
            )}
          >
            {c.name}
          </button>
        ))}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        {games.length > 0 && (
          <Select
            value={currentGame || "all"}
            onValueChange={(v) => update({ game: v === "all" ? undefined : v })}
          >
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="All games" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All games</SelectItem>
              {games.map((g) => (
                <SelectItem key={g} value={g}>
                  {g}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Select value={currentSort} onValueChange={(v) => update({ sort: v })}>
          <SelectTrigger className="ml-auto w-[190px]">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SORTS.map((s) => (
              <SelectItem key={s.value} value={s.value}>
                {s.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </div>
  );
}
