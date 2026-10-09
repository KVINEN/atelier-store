"use server";

import { headers } from "next/headers";

import { createPendingOrder, getProductsForCheckout } from "@/db/queries/orders";
import type { OrderItem } from "@/db/schema";
import { auth } from "@/lib/auth";
import { env } from "@/lib/env";
import { MAX_QUANTITY, ONE_SIZE } from "@/lib/products";
import { stripe } from "@/lib/stripe";

export type CheckoutLine = { slug: string; size: string; quantity: number };

export type CheckoutSessionResult =
  | { type: "success"; clientSecret: string }
  | { type: "error"; message: string };

const CURRENCY = "usd";
const MAX_LINES = 50;
// Tags these sessions in the Stripe Dashboard.
const INTEGRATION_IDENTIFIER = "atelier-elements-checkout-mqtzhrkw";

function isValidLine(line: unknown): line is CheckoutLine {
  if (typeof line !== "object" || line === null) return false;
  const { slug, size, quantity } = line as Record<string, unknown>;
  return (
    typeof slug === "string" &&
    typeof size === "string" &&
    Number.isInteger(quantity) &&
    (quantity as number) >= 1 &&
    (quantity as number) <= MAX_QUANTITY
  );
}

/**
 * Prices and checks the bag against the database (the browser copy is only a
 * display snapshot), then opens a Checkout Session for the Payment Element.
 */
export async function createCheckoutSession(lines: CheckoutLine[]): Promise<CheckoutSessionResult> {
  if (!Array.isArray(lines) || lines.length === 0 || lines.length > MAX_LINES || !lines.every(isValidLine)) {
    return { type: "error", message: "Your bag is empty or couldn't be read. Please try again." };
  }

  const products = await getProductsForCheckout([...new Set(lines.map((line) => line.slug))]);
  const bySlug = new Map(products.map((product) => [product.slug, product]));

  const items: OrderItem[] = [];
  const unavailable: string[] = [];
  for (const line of lines) {
    const product = bySlug.get(line.slug);
    const stock = product?.stock.find((row) => row.size === line.size);
    if (!product || !stock || stock.quantity < line.quantity) {
      unavailable.push(product?.name ?? line.slug);
      continue;
    }
    items.push({
      productId: product.id,
      slug: product.slug,
      name: product.name,
      size: line.size,
      quantity: line.quantity,
      unitPriceCents: product.priceCents,
    });
  }
  if (unavailable.length > 0) {
    return {
      type: "error",
      message: `Not enough stock for: ${unavailable.join(", ")}. Please update your bag.`,
    };
  }

  const session = await auth.api.getSession({ headers: await headers() });
  const orderId = crypto.randomUUID();

  try {
    const checkout = await stripe().checkout.sessions.create({
      ui_mode: "elements",
      mode: "payment",
      integration_identifier: INTEGRATION_IDENTIFIER,
      line_items: items.map((item) => ({
        quantity: item.quantity,
        price_data: {
          currency: CURRENCY,
          unit_amount: item.unitPriceCents,
          product_data: {
            name: item.name,
            ...(item.size === ONE_SIZE ? {} : { description: `Size ${item.size}` }),
            images: [bySlug.get(item.slug)!.images[0].src],
            metadata: { slug: item.slug, size: item.size },
          },
        },
      })),
      shipping_address_collection: { allowed_countries: ["US"] },
      shipping_options: [
        {
          shipping_rate_data: {
            type: "fixed_amount",
            display_name: "Complimentary express shipping",
            fixed_amount: { amount: 0, currency: CURRENCY },
            delivery_estimate: {
              minimum: { unit: "business_day", value: 1 },
              maximum: { unit: "business_day", value: 2 },
            },
          },
        },
      ],
      ...(session ? { customer_email: session.user.email } : {}),
      client_reference_id: orderId,
      metadata: { order_id: orderId },
      return_url: `${env.APP_URL}/checkout/complete?session_id={CHECKOUT_SESSION_ID}`,
    });

    if (!checkout.client_secret) throw new Error("Checkout Session has no client secret");

    await createPendingOrder({
      id: orderId,
      stripeSessionId: checkout.id,
      userId: session?.user.id ?? null,
      email: session?.user.email ?? null,
      items,
      amountTotalCents: checkout.amount_total ?? 0,
      currency: CURRENCY,
    });

    return { type: "success", clientSecret: checkout.client_secret };
  } catch (error) {
    console.error("Failed to create Checkout Session", error);
    return { type: "error", message: "We couldn't start checkout. Please try again in a moment." };
  }
}
