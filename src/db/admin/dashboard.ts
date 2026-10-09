// Dashboard figures. Uncached; every caller must have passed requireAdmin().
// "Revenue" is paid order totals net of refunds. Order counts and best sellers
// leave out cancelled orders (their revenue is already refunded). Days are UTC.

import "server-only";

import { and, asc, desc, eq, lte, notInArray, sql } from "drizzle-orm";

import { db } from "@/db";
import { orders, products, stock, user } from "@/db/schema";
import { ref } from "@/db/sql";
import { LOW_STOCK_THRESHOLD } from "@/lib/products";

export const DASHBOARD_DAYS = 30;

export async function getSalesSummary() {
  const current = sql`${orders.paidAt} >= now() - make_interval(days => ${DASHBOARD_DAYS})`;
  const previous = sql`${orders.paidAt} >= now() - make_interval(days => ${DASHBOARD_DAYS * 2})
    and ${orders.paidAt} < now() - make_interval(days => ${DASHBOARD_DAYS})`;
  const net = sql`${orders.amountTotalCents} - ${orders.refundedCents}`;
  const counted = sql`${orders.fulfillmentStatus} <> 'cancelled'`;

  const [row] = await db
    .select({
      revenue: sql<number>`coalesce(sum(${net}) filter (where ${current}), 0)::int`,
      previousRevenue: sql<number>`coalesce(sum(${net}) filter (where ${previous}), 0)::int`,
      orders: sql<number>`(count(*) filter (where ${current} and ${counted}))::int`,
      previousOrders: sql<number>`(count(*) filter (where ${previous} and ${counted}))::int`,
      refunds: sql<number>`coalesce(sum(${orders.refundedCents}) filter (where ${current}), 0)::int`,
      toFulfil: sql<number>`(count(*) filter (where ${orders.fulfillmentStatus} = 'unfulfilled'))::int`,
    })
    .from(orders)
    .where(eq(orders.status, "paid"));

  const [accounts] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(user)
    .where(sql`${user.createdAt} >= now() - make_interval(days => ${DASHBOARD_DAYS})`);

  return { ...row, newCustomers: accounts.count };
}

/** One entry per UTC day, oldest first, including days with no sales. */
export async function getDailyRevenue() {
  const result = await db.execute<{ day: string; revenue: number; orders: number }>(sql`
    select to_char(days.day, 'YYYY-MM-DD') as day,
           coalesce(sum(${orders.amountTotalCents} - ${orders.refundedCents}), 0)::int as revenue,
           (count(${orders.id}) filter (where ${orders.fulfillmentStatus} <> 'cancelled'))::int as orders
    from generate_series(
           (now() at time zone 'utc')::date - ${DASHBOARD_DAYS - 1}::int,
           (now() at time zone 'utc')::date,
           interval '1 day'
         ) as days(day)
    left join ${orders}
      on ${orders.status} = 'paid' and (${orders.paidAt} at time zone 'utc')::date = days.day
    group by days.day
    order by days.day
  `);
  return result.rows;
}

export async function getTopProducts(limit = 5) {
  const result = await db.execute<{ productId: number; name: string; units: number; revenue: number }>(sql`
    select (item->>'productId')::int as "productId",
           max(item->>'name') as name,
           sum((item->>'quantity')::int)::int as units,
           sum((item->>'quantity')::int * (item->>'unitPriceCents')::int)::int as revenue
    from ${orders}, jsonb_array_elements(${orders.items}) as item
    where ${orders.status} = 'paid' and ${orders.fulfillmentStatus} <> 'cancelled'
      and ${orders.paidAt} >= now() - make_interval(days => ${DASHBOARD_DAYS})
    group by 1
    order by units desc, revenue desc
    limit ${limit}
  `);
  return result.rows;
}

export async function getRecentOrders(limit = 8) {
  return db
    .select({
      id: orders.id,
      email: orders.email,
      customerName: sql<string | null>`${orders.shipping}->>'name'`,
      status: orders.status,
      fulfillmentStatus: orders.fulfillmentStatus,
      amountTotalCents: orders.amountTotalCents,
      refundedCents: orders.refundedCents,
      createdAt: orders.createdAt,
    })
    .from(orders)
    .where(notInArray(orders.status, ["failed", "expired"]))
    .orderBy(desc(orders.createdAt))
    .limit(limit);
}

/** Sizes of live products at or below the low-stock threshold, emptiest first. */
export async function getLowStock(limit = 8) {
  return db
    .select({ productId: products.id, name: products.name, size: stock.size, quantity: stock.quantity })
    .from(stock)
    .innerJoin(products, eq(products.id, stock.productId))
    .where(and(eq(products.status, "active"), lte(stock.quantity, LOW_STOCK_THRESHOLD)))
    .orderBy(asc(stock.quantity), asc(products.name))
    .limit(limit);
}

export async function getCatalogueSummary() {
  const [row] = await db
    .select({
      active: sql<number>`(count(*) filter (where ${products.status} = 'active'))::int`,
      draft: sql<number>`(count(*) filter (where ${products.status} = 'draft'))::int`,
      archived: sql<number>`(count(*) filter (where ${products.status} = 'archived'))::int`,
      soldOut: sql<number>`(count(*) filter (where ${products.status} = 'active' and not exists (
        select 1 from ${stock} where ${ref(stock.productId)} = ${ref(products.id)} and ${ref(stock.quantity)} > 0
      )))::int`,
    })
    .from(products);
  return row;
}
