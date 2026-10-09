// Stock audit trail: one row per change to a stock quantity, written in the
// same statement as the change itself.

import { index, integer, pgEnum, pgTable, text, timestamp } from "drizzle-orm/pg-core";

import { user } from "./auth";
import { products } from "./catalog";
import { orders } from "./orders";

export const stockMovementReason = pgEnum("stock_movement_reason", [
  "sale",
  "restock",
  "correction",
  "return",
]);

export const stockMovements = pgTable(
  "stock_movements",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text().notNull(),
    /** Signed change in units. */
    delta: integer().notNull(),
    /** Quantity after the change. */
    quantityAfter: integer("quantity_after").notNull(),
    reason: stockMovementReason().notNull(),
    orderId: text("order_id").references(() => orders.id, { onDelete: "set null" }),
    actorId: text("actor_id").references(() => user.id, { onDelete: "set null" }),
    note: text(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (table) => [
    index("stock_movements_product_id_idx").on(table.productId),
    index("stock_movements_created_at_idx").on(table.createdAt),
  ],
);
