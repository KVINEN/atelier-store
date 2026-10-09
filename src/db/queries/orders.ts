// Checkout and order reads/writes. Never cached: stock and order state must be
// current when charging and fulfilling.

import "server-only";

import { and, eq, inArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { orders, products, type OrderItem, type OrderShipping } from "@/db/schema";

/** Current price and per-size stock for the given products. */
export async function getProductsForCheckout(slugs: string[]) {
  if (slugs.length === 0) return [];
  return db.query.products.findMany({
    where: inArray(products.slug, slugs),
    columns: { id: true, slug: true, name: true, priceCents: true, images: true },
    with: { stock: { columns: { size: true, quantity: true } } },
  });
}

export async function createPendingOrder(order: {
  id: string;
  stripeSessionId: string;
  userId: string | null;
  email: string | null;
  items: OrderItem[];
  amountTotalCents: number;
  currency: string;
}) {
  await db.insert(orders).values(order);
}

export async function getOrderBySession(stripeSessionId: string) {
  return db.query.orders.findFirst({ where: eq(orders.stripeSessionId, stripeSessionId) });
}

/**
 * Marks a pending order paid and decrements its stock in one statement, so a
 * webhook delivered twice only fulfils once. Returns whether anything changed.
 */
export async function markOrderPaid(
  stripeSessionId: string,
  details: { email: string | null; shipping: OrderShipping | null; amountTotalCents: number },
): Promise<boolean> {
  const result = await db.execute<{ id: string }>(sql`
    with paid as (
      update ${orders}
      set status = 'paid',
          paid_at = now(),
          email = coalesce(${details.email}, ${orders.email}),
          shipping = ${details.shipping ? JSON.stringify(details.shipping) : null}::jsonb,
          amount_total_cents = ${details.amountTotalCents}
      where ${orders.stripeSessionId} = ${stripeSessionId} and ${orders.status} = 'pending'
      returning ${orders.id}, ${orders.items}
    ),
    lines as (
      select (item->>'productId')::int as product_id,
             item->>'size' as size,
             sum((item->>'quantity')::int) as quantity
      from paid, jsonb_array_elements(paid.items) as item
      group by 1, 2
    ),
    -- Data-modifying CTEs always run to completion, even when unreferenced.
    sold as (
      update stock
      set quantity = greatest(stock.quantity - lines.quantity, 0)
      from lines
      where stock.product_id = lines.product_id and stock.size = lines.size
    )
    select id from paid
  `);
  return result.rows.length > 0;
}

/** Moves a still-pending order to `failed` or `expired`. */
export async function closePendingOrder(stripeSessionId: string, status: "failed" | "expired") {
  await db
    .update(orders)
    .set({ status })
    .where(and(eq(orders.stripeSessionId, stripeSessionId), eq(orders.status, "pending")));
}
