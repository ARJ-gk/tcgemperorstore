"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import {
  Crown,
  LayoutDashboard,
  LogOut,
  Menu,
  Package,
  Search,
  User as UserIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CartSheet } from "@/components/cart/cart-sheet";
import { ModeToggle } from "@/components/mode-toggle";
import { createClient } from "@/lib/supabase/client";
import { siteConfig } from "@/lib/config";
import type { Category } from "@/lib/types";

type HeaderUser = { email: string | null; isAdmin: boolean } | null;

export function SiteHeader({
  user,
  categories,
}: {
  user: HeaderUser;
  categories: Category[];
}) {
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);

  async function signOut() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  function onSearch(formData: FormData) {
    const q = String(formData.get("q") ?? "").trim();
    router.push(q ? `/products?search=${encodeURIComponent(q)}` : "/products");
    setMobileOpen(false);
  }

  return (
    <header className="hairline-foil sticky top-0 z-40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="mx-auto flex h-16 max-w-6xl items-center gap-4 px-4">
        {/* Mobile menu */}
        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <Button variant="ghost" size="icon" className="md:hidden" aria-label="Menu">
              <Menu className="size-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle className="flex items-center gap-2">
                <Crown className="size-5 text-gold" /> {siteConfig.name}
              </SheetTitle>
            </SheetHeader>
            <nav className="flex flex-col gap-1 px-4">
              <Link
                href="/products"
                onClick={() => setMobileOpen(false)}
                className="rounded-md px-2 py-2 text-sm font-medium hover:bg-accent"
              >
                All products
              </Link>
              {categories.map((c) => (
                <Link
                  key={c.id}
                  href={`/products?category=${c.slug}`}
                  onClick={() => setMobileOpen(false)}
                  className="rounded-md px-2 py-2 text-sm hover:bg-accent"
                >
                  {c.name}
                </Link>
              ))}
            </nav>
          </SheetContent>
        </Sheet>

        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold">
          <Crown className="size-6 text-gold drop-shadow-[0_0_6px_var(--scene-glow)]" />
          <span className="hidden sm:inline">{siteConfig.name}</span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-1 md:flex">
          <Button asChild variant="ghost" size="sm">
            <Link href="/products">Shop</Link>
          </Button>
          {categories.slice(0, 4).map((c) => (
            <Button key={c.id} asChild variant="ghost" size="sm">
              <Link href={`/products?category=${c.slug}`}>{c.name}</Link>
            </Button>
          ))}
        </nav>

        {/* Search */}
        <form
          action={onSearch}
          className="relative ml-auto hidden max-w-xs flex-1 sm:block"
        >
          <Search className="pointer-events-none absolute left-2.5 top-2.5 size-4 text-muted-foreground" />
          <Input
            name="q"
            placeholder="Search cards…"
            className="pl-8"
            aria-label="Search products"
          />
        </form>

        <div className="ml-auto flex items-center gap-1 sm:ml-0">
          <ModeToggle />
          {/* Account */}
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account">
                  <UserIcon className="size-5" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="truncate">
                  {user.email ?? "Account"}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/account">
                    <Package className="size-4" /> My orders
                  </Link>
                </DropdownMenuItem>
                {user.isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin">
                      <LayoutDashboard className="size-4" /> Admin
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={signOut}>
                  <LogOut className="size-4" /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Button asChild variant="ghost" size="sm">
              <Link href="/login">Sign in</Link>
            </Button>
          )}

          <CartSheet />
        </div>
      </div>
    </header>
  );
}
