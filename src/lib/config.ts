export const siteConfig = {
  name: "TCG Emperor",
  shortName: "TCG Emperor",
  description:
    "Premium trading card game singles, sealed product & accessories. Pokémon, Magic, Yu-Gi-Oh! and more.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "usd",
  shipping: {
    // Orders at or above this subtotal get the standard rate free.
    freeStandardThresholdCents: 7500,
    // Stripe Checkout offers every option to every customer regardless of
    // destination country; per-country pricing needs a custom checkout flow.
    options: [
      { name: "Standard Shipping", amountCents: 499, minDays: 3, maxDays: 5 },
      { name: "Express Shipping", amountCents: 1499, minDays: 1, maxDays: 2 },
      {
        name: "International Shipping",
        amountCents: 1999,
        minDays: 7,
        maxDays: 14,
      },
    ],
  },
} as const;

export function absoluteUrl(path = ""): string {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
