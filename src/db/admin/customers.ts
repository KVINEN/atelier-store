// Admin customer reads. Uncached; every caller must have passed requireAdmin().

import "server-only";

import { desc, ilike, or, sql } from "drizzle-orm";

import { db } from "@/db";
import { orders, user } from "@/db/schema";
import { ref } from "@/db/sql";

const PAGE_SIZE = 50;

/** Registered accounts with their paid order count and net spend. */
export async function listCustomers(filters: { q?: string; page?: number }) {
  const pattern = filters.q ? `%${filters.q.replace(/[\\%_]/g, "\\$&")}%` : undefined;
  const page = Math.max(1, filters.page ?? 1);

  const paid = sql`${ref(orders.userId)} = ${ref(user.id)} and ${ref(orders.status)} = 'paid'`;
  const rows = await db
    .select({
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
      createdAt: user.createdAt,
      orders: sql<number>`(select count(*) from ${orders} where ${paid})::int`,
      spentCents: sql<number>`(select coalesce(sum(${ref(orders.amountTotalCents)} - ${ref(orders.refundedCents)}), 0) from ${orders} where ${paid})::int`,
      lastOrderAt: sql<string | null>`(select max(${ref(orders.paidAt)}) from ${orders} where ${paid})`,
    })
    .from(user)
    .where(pattern ? or(ilike(user.name, pattern), ilike(user.email, pattern)) : undefined)
    .orderBy(desc(user.createdAt))
    .limit(PAGE_SIZE + 1)
    .offset((page - 1) * PAGE_SIZE);

  return { rows: rows.slice(0, PAGE_SIZE), page, hasMore: rows.length > PAGE_SIZE };
}
