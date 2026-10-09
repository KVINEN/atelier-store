// Catalogue tables: categories, products and per-size stock.

import { relations, sql } from "drizzle-orm";
import {
  check,
  index,
  integer,
  jsonb,
  pgEnum,
  pgTable,
  primaryKey,
  text,
  timestamp,
} from "drizzle-orm/pg-core";

import type { ImageAsset } from "@/lib/images";

export const productBadge = pgEnum("product_badge", ["New", "Exclusive", "Limited"]);

/** Only `active` products are shown or sold; drafts and archived pieces are admin-only. */
export const productStatus = pgEnum("product_status", ["draft", "active", "archived"]);

/** Unisex pieces appear in both the women's and men's listings. */
export const productGender = pgEnum("product_gender", ["women", "men", "unisex"]);

export const categories = pgTable("categories", {
  id: integer().primaryKey().generatedAlwaysAsIdentity(),
  slug: text().notNull().unique(),
  name: text().notNull(),
  href: text().notNull(),
  imageSrc: text("image_src").notNull(),
  imageAlt: text("image_alt").notNull(),
  position: integer().notNull().default(0),
});

export const products = pgTable(
  "products",
  {
    id: integer().primaryKey().generatedAlwaysAsIdentity(),
    categoryId: integer("category_id")
      .notNull()
      .references(() => categories.id, { onDelete: "restrict" }),
    slug: text().notNull().unique(),
    sku: text().notNull().unique(),
    name: text().notNull(),
    description: text().notNull(),
    details: text().array().notNull().default(sql`'{}'::text[]`),
    /** Minor units (cents). */
    priceCents: integer("price_cents").notNull(),
    color: text().notNull(),
    colorCount: integer("color_count").notNull().default(1),
    badge: productBadge(),
    gender: productGender().notNull().default("unisex"),
    status: productStatus().notNull().default("active"),
    /** Ordered; the first image is the listing image. */
    images: jsonb().$type<ImageAsset[]>().notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow()
      .$onUpdate(() => new Date()),
  },
  (table) => [
    index("products_category_id_idx").on(table.categoryId),
    index("products_gender_idx").on(table.gender),
    index("products_status_idx").on(table.status),
    check("products_price_cents_check", sql`${table.priceCents} >= 0`),
  ],
);

// One row per product and size; one-size items have a single "One size" row.
export const stock = pgTable(
  "stock",
  {
    productId: integer("product_id")
      .notNull()
      .references(() => products.id, { onDelete: "cascade" }),
    size: text().notNull(),
    position: integer().notNull(),
    quantity: integer().notNull().default(0),
  },
  (table) => [
    primaryKey({ columns: [table.productId, table.size] }),
    check("stock_quantity_check", sql`${table.quantity} >= 0`),
  ],
);

export const categoriesRelations = relations(categories, ({ many }) => ({
  products: many(products),
}));

export const productsRelations = relations(products, ({ one, many }) => ({
  category: one(categories, {
    fields: [products.categoryId],
    references: [categories.id],
  }),
  stock: many(stock),
}));

export const stockRelations = relations(stock, ({ one }) => ({
  product: one(products, {
    fields: [stock.productId],
    references: [products.id],
  }),
}));
