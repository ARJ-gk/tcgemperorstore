import Link from "next/link";
import { ArrowRight, PackageCheck, ShieldCheck, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ProductCard } from "@/components/product-card";
import { CardSilhouette } from "@/components/fx/card-silhouette";
import { HeroScene } from "@/components/fx/hero-scene";
import { getCategories, getFeaturedProducts } from "@/lib/queries";

const CATEGORY_ACCENTS: Record<string, string> = {
  pokemon: "from-amber-500/20 to-red-500/20",
  magic: "from-blue-500/20 to-purple-500/20",
  yugioh: "from-indigo-500/20 to-sky-500/20",
  sealed: "from-emerald-500/20 to-teal-500/20",
};

export default async function HomePage() {
  const [featured, categories] = await Promise.all([
    getFeaturedProducts(8),
    getCategories(),
  ]);

  const heroBlocks = "fx-rise fx-motion";

  return (
    <div>
      {/* Hero */}
      <section className="relative isolate overflow-hidden border-b">
        <HeroScene />
        <div className="relative z-10 mx-auto flex max-w-6xl flex-col items-center gap-6 px-4 py-24 text-center md:py-28">
          <div
            className={`${heroBlocks} glass-panel inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs text-muted-foreground`}
          >
            <Sparkles className="size-3.5 text-primary" />
            Authentic singles, sealed product &amp; supplies
          </div>
          <h1
            className={`${heroBlocks} max-w-3xl text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl`}
            style={{ animationDelay: "90ms" }}
          >
            Rule your collection with{" "}
            <span className="text-foil fx-motion">TCG Emperor</span>
          </h1>
          <p
            className={`${heroBlocks} max-w-xl text-lg text-muted-foreground`}
            style={{ animationDelay: "180ms" }}
          >
            Premium Pokémon, Magic: The Gathering and Yu-Gi-Oh! cards — inspected,
            graded and shipped with care. Secure checkout powered by Stripe.
          </p>
          <div
            className={`${heroBlocks} flex flex-wrap justify-center gap-3`}
            style={{ animationDelay: "270ms" }}
          >
            <Button asChild size="lg" className="btn-sheen fx-motion">
              <Link href="/products">
                Shop all products <ArrowRight className="size-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/products?category=pokemon">Browse Pokémon</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Trust badges */}
      <section className="border-b bg-muted/30">
        <div className="mx-auto grid max-w-6xl gap-4 px-4 py-6 sm:grid-cols-3">
          {[
            { icon: ShieldCheck, title: "Secure payments", desc: "Stripe-encrypted checkout" },
            { icon: PackageCheck, title: "Carefully packed", desc: "Sleeved & toploaded" },
            { icon: Sparkles, title: "Authentic cards", desc: "Inspected & graded" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-center gap-3">
              <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Icon className="size-5" />
              </div>
              <div>
                <p className="text-sm font-medium">{title}</p>
                <p className="text-xs text-muted-foreground">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="mx-auto max-w-6xl px-4 py-12">
          <h2 className="mb-6 text-2xl font-bold">Shop by game</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map((c) => (
              <Link
                key={c.id}
                href={`/products?category=${c.slug}`}
                className={`group relative flex h-32 flex-col justify-end overflow-hidden rounded-lg border bg-gradient-to-br p-4 transition-all duration-300 hover:-translate-y-1 hover:shadow-lift ${
                  CATEGORY_ACCENTS[c.slug] ?? "from-primary/10 to-background"
                }`}
              >
                <CardSilhouette
                  static
                  className="absolute -right-2 -top-4 w-14 rotate-12 opacity-0 transition-all duration-500 group-hover:-translate-y-1 group-hover:opacity-100"
                />
                <span className="text-lg font-semibold">{c.name}</span>
                <span className="inline-flex items-center gap-1 text-sm text-muted-foreground">
                  Shop now{" "}
                  <ArrowRight className="size-3.5 transition-transform group-hover:translate-x-1" />
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Featured */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-2xl font-bold">Featured cards</h2>
          <Button asChild variant="ghost" size="sm">
            <Link href="/products">
              View all <ArrowRight className="size-4" />
            </Link>
          </Button>
        </div>
        {featured.length > 0 ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p, i) => (
              <div
                key={p.id}
                className="fx-rise fx-motion"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <ProductCard product={p} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-muted-foreground">
            No featured products yet. Add some from the admin panel.
          </p>
        )}
      </section>
    </div>
  );
}
