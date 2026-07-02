import Stripe from "stripe";

let cached: Stripe | null = null;

/**
 * Lazily construct the Stripe server client so that pages which don't touch
 * Stripe still work before the secret key is configured.
 */
export function getStripe(): Stripe {
  if (cached) return cached;

  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) {
    throw new Error(
      "STRIPE_SECRET_KEY is not set. Add your Stripe test secret key to .env.local.",
    );
  }

  cached = new Stripe(key, {
    // Omitting apiVersion uses the version pinned by the installed SDK.
    typescript: true,
    appInfo: { name: "TCG Emperor Store" },
  });
  return cached;
}
