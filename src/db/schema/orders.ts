// Orders: one row per Stripe Checkout Session. Payment state (`status`,
// `refunded_cents`) is moved on by the Stripe webhook only; fulfilment state is
// managed by admins.

import { sql } from "drizzle-orm";
import { check, index, integer, jsonb, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";

export const orderStatus = pgEnum("order_status", ["pending", "paid", "failed", "expired"]);

export const fulfillmentStatus = pgEnum("fulfillment_status", [
  "unfulfilled",
  "shipped",
  "delivered",
  "cancelled",
]);

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
    stripePaymentIntentId: text("stripe_payment_intent_id").unique(),
    /** Total refunded so far, mirrored from Stripe's charge.refunded. Minor units. */
    refundedCents: integer("refunded_cents").notNull().default(0),
    fulfillmentStatus: fulfillmentStatus("fulfillment_status").notNull().default("unfulfilled"),
    carrier: text(),
    trackingNumber: text("tracking_number"),
    adminNote: text("admin_note"),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    shippedAt: timestamp("shipped_at", { withTimezone: true }),
    deliveredAt: timestamp("delivered_at", { withTimezone: true }),
    cancelledAt: timestamp("cancelled_at", { withTimezone: true }),
    /** Set once when the items go back into stock; guards against restocking twice. */
    restockedAt: timestamp("restocked_at", { withTimezone: true }),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("orders_user_id_idx").on(table.userId),
    index("orders_status_created_at_idx").on(table.status, table.createdAt),
    check("orders_amount_total_cents_check", sql`${table.amountTotalCents} >= 0`),
    check(
      "orders_refunded_cents_check",
      sql`${table.refundedCents} >= 0 and ${table.refundedCents} <= ${table.amountTotalCents}`,
    ),
  ],
);
