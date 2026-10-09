// Admin order reads and fulfilment writes. Uncached; every caller must have
// passed requireAdmin(). Payment state (status, refunded_cents) is never set
// here: it comes from the Stripe webhook.

import "server-only";

import { and, desc, eq, ilike, inArray, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { orders, stockMovements, user } from "@/db/schema";
import { ref } from "@/db/sql";

export type OrderView = "to-fulfil" | "paid" | "pending" | "closed" | "refunded" | "all";

export const ORDER_VIEWS: { value: OrderView; label: string }[] = [
  { value: "to-fulfil", label: "To fulfil" },
  { value: "paid", label: "Paid" },
  { value: "refunded", label: "Refunded" },
  { value: "pending", label: "Awaiting payment" },
  { value: "closed", label: "Failed / expired" },
  { value: "all", label: "All" },
];

const PAGE_SIZE = 50;

function viewCondition(view: OrderView): SQL | undefined {
  switch (view) {
    case "to-fulfil":
      return and(eq(orders.status, "paid"), eq(orders.fulfillmentStatus, "unfulfilled"));
    case "paid":
      return eq(orders.status, "paid");
    case "pending":
      return eq(orders.status, "pending");
    case "closed":
      return inArray(orders.status, ["failed", "expired"]);
    case "refunded":
      return sql`${orders.refundedCents} > 0`;
    case "all":
      return undefined;
  }
}

export async function listOrders(filters: { view: OrderView; q?: string; page?: number }) {
  const conditions: (SQL | undefined)[] = [viewCondition(filters.view)];
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      or(
        ilike(orders.email, pattern),
        ilike(orders.id, pattern),
        sql`${orders.shipping}->>'name' ilike ${pattern}`,
      ),
    );
  }
  const page = Math.max(1, filters.page ?? 1);

  const rows = await db
    .select({
      id: orders.id,
      email: orders.email,
      customerName: sql<string | null>`${orders.shipping}->>'name'`,
      status: orders.status,
      fulfillmentStatus: orders.fulfillmentStatus,
      amountTotalCents: orders.amountTotalCents,
      refundedCents: orders.refundedCents,
      items: sql<number>`(select coalesce(sum((item->>'quantity')::int), 0) from jsonb_array_elements(${ref(orders.items)}) as item)::int`,
      createdAt: orders.createdAt,
      paidAt: orders.paidAt,
    })
    .from(orders)
    .where(and(...conditions))
    .orderBy(desc(orders.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  return { rows: rows.slice(0, PAGE_SIZE), page, hasMore: rows.length > PAGE_SIZE };
}

export async function getOrder(id: string) {
  const order = await db.query.orders.findFirst({ where: eq(orders.id, id) });
  if (!order) return undefined;

  const [account, movements] = await Promise.all([
    order.userId
      ? db.query.user.findFirst({
          where: eq(user.id, order.userId),
          columns: { id: true, name: true, email: true },
        })
      : undefined,
    db
      .select()
      .from(stockMovements)
      .where(eq(stockMovements.orderId, id))
      .orderBy(desc(stockMovements.createdAt)),
  ]);
  return { ...order, account, movements };
}

/** Paid, not cancelled or delivered → shipped. Also used to correct tracking details. */
export async function markShipped(id: string, carrier: string, trackingNumber: string) {
  const [row] = await db
    .update(orders)
    .set({
      fulfillmentStatus: "shipped",
      carrier,
      trackingNumber,
      shippedAt: sql`coalesce(${orders.shippedAt}, now())`,
    })
    .where(
      and(
        eq(orders.id, id),
        eq(orders.status, "paid"),
        inArray(orders.fulfillmentStatus, ["unfulfilled", "shipped"]),
      ),
    )
    .returning({ id: orders.id });
  return Boolean(row);
}

export async function markDelivered(id: string) {
  const [row] = await db
    .update(orders)
    .set({ fulfillmentStatus: "delivered", deliveredAt: sql`now()` })
    .where(and(eq(orders.id, id), eq(orders.fulfillmentStatus, "shipped")))
    .returning({ id: orders.id });
  return Boolean(row);
}

/** Only paid orders that haven't shipped can be cancelled; the refund is issued separately via Stripe. */
export async function markCancelled(id: string) {
  const [row] = await db
    .update(orders)
    .set({ fulfillmentStatus: "cancelled", cancelledAt: sql`now()` })
    .where(
      and(eq(orders.id, id), eq(orders.status, "paid"), eq(orders.fulfillmentStatus, "unfulfilled")),
    )
    .returning({ id: orders.id });
  return Boolean(row);
}

export async function setAdminNote(id: string, note: string | null) {
  await db.update(orders).set({ adminNote: note }).where(eq(orders.id, id));
}

/** Backfills the payment intent for orders paid before it was recorded. */
export async function setPaymentIntent(id: string, paymentIntentId: string) {
  await db
    .update(orders)
    .set({ stripePaymentIntentId: paymentIntentId })
    .where(and(eq(orders.id, id), sql`${orders.stripePaymentIntentId} is null`));
}

/**
 * Puts a paid order's items back into stock, at most once (guarded by
 * restocked_at in the same statement). Sizes or products deleted since are
 * skipped. Returns whether anything was restocked.
 */
export async function restockOrder(id: string, actorId: string) {
  const result = await db.execute<{ id: string }>(sql`
    with marked as (
      update ${orders} set restocked_at = now()
      where ${orders.id} = ${id} and ${orders.status} = 'paid' and ${orders.restockedAt} is null
      returning ${orders.id}, ${orders.items}
    ),
    lines as (
      select (item->>'productId')::int as product_id, item->>'size' as size,
             sum((item->>'quantity')::int)::int as quantity
      from marked, jsonb_array_elements(marked.items) as item
      group by 1, 2
    ),
    returned as (
      update stock set quantity = stock.quantity + lines.quantity
      from lines
      where stock.product_id = lines.product_id and stock.size = lines.size
      returning stock.product_id, stock.size, lines.quantity as delta, stock.quantity as after
    ),
    logged as (
      insert into ${stockMovements} (product_id, size, delta, quantity_after, reason, order_id, actor_id, note)
      select product_id, size, delta, after, 'return'::stock_movement_reason, (select id from marked),
             ${actorId}::text, 'Order restocked'
      from returned
    )
    select id from marked
  `);
  return result.rows.length > 0;
}
