// Orders: one row per Stripe Checkout Session. Created as `pending` when the
// session is created, and moved on by the Stripe webhook only.

import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const orderStatus = pgEnum("order_status", ["pending", "paid", "failed", "expired"]);

/** Snapshot of a bag line at the price charged. */
export type OrderItem = {
  productId: number;
  slug: string;
  name: string;
  size: string;
  quantity: number;
  /** Minor units (cents). */
  unitPriceCents: number;
};

export type OrderShipping = {
  name: string | null;
  address: {
    line1: string | null;
    line2: string | null;
    city: string | null;
    state: string | null;
    postalCode: string | null;
    country: string | null;
  };
};

export const orders = pgTable(
  "orders",
  {
    id: text().primaryKey(),
    stripeSessionId: text("stripe_session_id").notNull().unique(),
    userId: text("user_id").references(() => user.id, { onDelete: "set null" }),
    status: orderStatus().notNull().default("pending"),
    email: text(),
    items: jsonb().$type<OrderItem[]>().notNull(),
    /** Minor units (cents). */
    amountTotalCents: integer("amount_total_cents").notNull(),
    currency: text().notNull(),
    shipping: jsonb().$type<OrderShipping>(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    check("orders_amount_total_cents_check", sql`${table.amountTotalCents} >= 0`),
  ],
);
