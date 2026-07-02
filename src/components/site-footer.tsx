import Link from "next/link";
import { Crown } from "lucide-react";
import { siteConfig } from "@/lib/config";

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t bg-muted/30">
      <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 sm:grid-cols-2 md:grid-cols-4">
        <div className="space-y-2">
          <Link href="/" className="flex items-center gap-2 font-bold">
            <Crown className="size-5 text-primary" />
            {siteConfig.name}
          </Link>
          <p className="text-sm text-muted-foreground">{siteConfig.description}</p>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Shop</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              <Link href="/products" className="hover:text-foreground">
                All products
              </Link>
            </li>
            <li>
              <Link href="/products?category=pokemon" className="hover:text-foreground">
                Pokémon
              </Link>
            </li>
            <li>
              <Link href="/products?category=magic" className="hover:text-foreground">
                Magic: The Gathering
              </Link>
            </li>
            <li>
              <Link href="/products?category=yugioh" className="hover:text-foreground">
                Yu-Gi-Oh!
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Account</h3>
          <ul className="space-y-1 text-sm text-muted-foreground">
            <li>
              <Link href="/account" className="hover:text-foreground">
                My orders
              </Link>
            </li>
            <li>
              <Link href="/login" className="hover:text-foreground">
                Sign in
              </Link>
            </li>
            <li>
              <Link href="/cart" className="hover:text-foreground">
                Cart
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <h3 className="mb-2 text-sm font-semibold">Support</h3>
          <p className="text-sm text-muted-foreground">
            Payments are securely processed by Stripe. All cards are inspected and
            graded before shipping.
          </p>
        </div>
      </div>
      <div className="border-t py-4">
        <p className="mx-auto max-w-6xl px-4 text-xs text-muted-foreground">
          © {new Date().getFullYear()} {siteConfig.name}. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
