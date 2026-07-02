import Link from "next/link";
import { Crown } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center gap-4 px-4 py-24 text-center">
      <Crown className="size-10 text-primary" />
      <h1 className="text-4xl font-bold">404</h1>
      <p className="text-muted-foreground">
        We couldn&apos;t find that page. It may have sold out or moved.
      </p>
      <div className="flex gap-3">
        <Button asChild>
          <Link href="/products">Browse the shop</Link>
        </Button>
        <Button asChild variant="outline">
          <Link href="/">Go home</Link>
        </Button>
      </div>
    </div>
  );
}
