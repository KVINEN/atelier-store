import "server-only";

import Stripe from "stripe";

import { env } from "@/lib/env";

let client: Stripe | undefined;

/** Server-side Stripe client, created on first use so builds don't need the key. */
export function stripe() {
  client ??= new Stripe(env.STRIPE_SECRET_KEY);
  return client;
}
