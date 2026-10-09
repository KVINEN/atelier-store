// Admin stock reads and writes. Uncached; every caller must have passed
// requireAdmin(). Each change and its stock_movements row are written in one
// statement, and changes are relative, so they never overwrite a sale the
// Stripe webhook records in between.

import "server-only";

import { and, asc, desc, eq, ilike, lte, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { categories, orders, products, stock, stockMovements, user } from "@/db/schema";
import { LOW_STOCK_THRESHOLD } from "@/lib/products";

export type MovementReason = (typeof stockMovements.reason.enumValues)[number];
/** Reasons an admin can pick; `sale` is written by the webhook only. */
export const ADJUSTMENT_REASONS = ["restock", "correction", "return"] as const satisfies MovementReason[];

export type InventoryFilter = "all" | "low" | "out";

export async function listInventory(filters: { filter: InventoryFilter; q?: string }) {
  const conditions: SQL[] = [];
  if (filters.filter === "low") conditions.push(lte(stock.quantity, LOW_STOCK_THRESHOLD));
  if (filters.filter === "out") conditions.push(eq(stock.quantity, 0));
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(or(ilike(products.name, pattern), ilike(products.sku, pattern))!);
  }

  return db
    .select({
      productId: products.id,
      name: products.name,
      sku: products.sku,
      status: products.status,
      category: categories.name,
      size: stock.size,
      quantity: stock.quantity,
    })
    .from(stock)
    .innerJoin(products, eq(products.id, stock.productId))
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...conditions))
    .orderBy(
      // Things that need attention first: live pieces, then lowest stock.
      sql`${products.status} <> 'active'`,
      asc(stock.quantity),
      asc(products.name),
      asc(stock.position),
    );
}

export async function listMovements(options: { productId?: number; limit?: number } = {}) {
  return db
    .select({
      id: stockMovements.id,
      productId: stockMovements.productId,
      productName: products.name,
      size: stockMovements.size,
      delta: stockMovements.delta,
      quantityAfter: stockMovements.quantityAfter,
      reason: stockMovements.reason,
      orderId: stockMovements.orderId,
      note: stockMovements.note,
      actor: user.name,
      createdAt: stockMovements.createdAt,
    })
    .from(stockMovements)
    .innerJoin(products, eq(products.id, stockMovements.productId))
    .leftJoin(user, eq(user.id, stockMovements.actorId))
    .where(options.productId ? eq(stockMovements.productId, options.productId) : undefined)
    .orderBy(desc(stockMovements.createdAt), desc(stockMovements.id))
    .limit(options.limit ?? 50);
}

/**
 * Adds `delta` (may be negative) to one size. With `expected`, applies only if
 * the quantity is still what the admin saw (a stock count). Returns the new
 * quantity, or null when the size is gone, it would go negative, or
 * `expected` no longer matches.
 */
export async function adjustStock(change: {
  productId: number;
  size: string;
  delta: number;
  reason: MovementReason;
  note: string | null;
  actorId: string;
  expected?: number;
}): Promise<number | null> {
  const expected = change.expected === undefined ? sql`true` : sql`quantity = ${change.expected}::int`;
  const result = await db.execute<{ quantity: number }>(sql`
    with changed as (
      update ${stock}
      set quantity = quantity + ${change.delta}::int
      where product_id = ${change.productId} and size = ${change.size}
        and quantity + ${change.delta}::int >= 0 and ${expected}
      returning product_id, size, quantity
    ),
    logged as (
      insert into ${stockMovements} (product_id, size, delta, quantity_after, reason, actor_id, note)
      select product_id, size, ${change.delta}::int, quantity, ${change.reason}::stock_movement_reason,
             ${change.actorId}, ${change.note}::text
      from changed where ${change.delta}::int <> 0
    )
    select quantity from changed
  `);
  return result.rows[0]?.quantity ?? null;
}

/** Adds a size at the end of the size list. Returns false if it already exists. */
export async function addSize(change: {
  productId: number;
  size: string;
  quantity: number;
  actorId: string;
}) {
  const result = await db.execute<{ size: string }>(sql`
    with added as (
      insert into ${stock} (product_id, size, position, quantity)
      select ${change.productId}::int, ${change.size}::text,
             coalesce((select max(position) + 1 from ${stock} where product_id = ${change.productId}), 0),
             ${change.quantity}::int
      on conflict do nothing
      returning product_id, size, quantity
    ),
    logged as (
      insert into ${stockMovements} (product_id, size, delta, quantity_after, reason, actor_id, note)
      select product_id, size, quantity, quantity, 'restock'::stock_movement_reason, ${change.actorId}, 'New size'
      from added where quantity > 0
    )
    select size from added
  `);
  return result.rows.length > 0;
}

export type RemoveSizeResult = "removed" | "has-stock" | "last-size" | "pending-orders" | "missing";

/**
 * Removes a size only when it's empty, isn't the product's last size, and no
 * unpaid checkout includes it (the webhook would otherwise have nothing to
 * decrement when that payment lands).
 */
export async function removeSize(productId: number, size: string): Promise<RemoveSizeResult> {
  const row = await db.query.stock.findFirst({
    where: and(eq(stock.productId, productId), eq(stock.size, size)),
  });
  if (!row) return "missing";
  if (row.quantity > 0) return "has-stock";

  const result = await db.execute<{ size: string }>(sql`
    delete from ${stock}
    where product_id = ${productId} and size = ${size} and quantity = 0
      and (select count(*) from ${stock} where product_id = ${productId}) > 1
      and not exists (
        select 1 from ${orders}, jsonb_array_elements(${orders.items}) as item
        where ${orders.status} = 'pending'
          and (item->>'productId')::int = ${productId} and item->>'size' = ${size}
      )
    returning size
  `);
  if (result.rows.length > 0) return "removed";

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(stock)
    .where(eq(stock.productId, productId));
  return count <= 1 ? "last-size" : "pending-orders";
}

/** Swaps a size with its neighbour in display order. */
export async function moveSize(productId: number, size: string, direction: "up" | "down") {
  const rows = await db
    .select({ size: stock.size, position: stock.position })
    .from(stock)
    .where(eq(stock.productId, productId))
    .orderBy(asc(stock.position), asc(stock.size));

  const index = rows.findIndex((row) => row.size === size);
  const other = rows[direction === "up" ? index - 1 : index + 1];
  if (index < 0 || !other) return;

  // Renumber everything so duplicate positions can't make the swap a no-op.
  const order = rows.map((row) => row.size);
  [order[index], order[order.indexOf(other.size)]] = [other.size, size];
  const cases = sql.join(
    order.map((name, position) => sql`when ${name} then ${position}::int`),
    sql` `,
  );
  await db.execute(sql`
    update ${stock} set position = case size ${cases} end
    where product_id = ${productId}
  `);
}
