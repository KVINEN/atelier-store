import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";

let client: Stripe | undefined;

/** Server-side Stripe client, created on first use so builds don't need the key. */
export function stripe() {
  client ??= new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}

/** Link to a payment in the Stripe Dashboard, in test or live mode to match the key. */
export function stripePaymentUrl(paymentIntentId: string) {
  const test = env.STRIPE_SECRET_KEY.startsWith("sk_test_") || env.STRIPE_SECRET_KEY.startsWith("rk_test_");
  return `https://dashboard.stripe.com/${test ? "test/" : ""}payments/${paymentIntentId}`;
}
