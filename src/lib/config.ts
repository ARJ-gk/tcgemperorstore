export const siteConfig = {
  name: "TCG Emperor",
  shortName: "TCG Emperor",
  description:
    "Premium trading card game singles, sealed product & accessories. Pokémon, Magic, Yu-Gi-Oh! and more.",
  url: process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000",
  currency: "usd",
} as const;

export function absoluteUrl(path = ""): string {
  const base = siteConfig.url.replace(/\/$/, "");
  return `${base}${path.startsWith("/") ? path : `/${path}`}`;
}
