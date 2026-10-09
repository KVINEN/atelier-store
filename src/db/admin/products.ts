// Admin product reads and writes. Uncached; every caller must have passed
// requireAdmin(). Storefront reads stay in `@/db/queries/catalog`.

import "server-only";

import { and, asc, desc, eq, ilike, or, sql, type SQL } from "drizzle-orm";

import { db } from "@/db";
import { categories, orders, products, stock, stockMovements } from "@/db/schema";
import { ref } from "@/db/sql";
import type { ImageAsset } from "@/lib/images";

export type ProductStatus = (typeof products.status.enumValues)[number];
export type ProductBadge = (typeof products.badge.enumValues)[number];
export type ProductGender = (typeof products.gender.enumValues)[number];

export const PRODUCT_STATUSES = products.status.enumValues;
export const PRODUCT_BADGES = products.badge.enumValues;
export const PRODUCT_GENDERS = products.gender.enumValues;

export type ProductFields = {
  categoryId: number;
  sku: string;
  name: string;
  description: string;
  details: string[];
  priceCents: number;
  color: string;
  colorCount: number;
  badge: ProductBadge | null;
  gender: ProductGender;
  status: ProductStatus;
  images: ImageAsset[];
};

export async function listProducts(filters: {
  q?: string;
  status?: ProductStatus;
  categoryId?: number;
}) {
  const conditions: SQL[] = [];
  if (filters.status) conditions.push(eq(products.status, filters.status));
  if (filters.categoryId) conditions.push(eq(products.categoryId, filters.categoryId));
  if (filters.q) {
    const pattern = `%${filters.q.replace(/[\\%_]/g, "\\$&")}%`;
    conditions.push(
      or(ilike(products.name, pattern), ilike(products.sku, pattern), ilike(products.slug, pattern))!,
    );
  }

  return db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
      sku: products.sku,
      priceCents: products.priceCents,
      status: products.status,
      image: sql<ImageAsset | null>`${products.images}->0`,
      category: categories.name,
      totalStock: sql<number>`coalesce((select sum(quantity) from ${stock} where ${ref(stock.productId)} = ${ref(products.id)}), 0)::int`,
      sizes: sql<number>`(select count(*) from ${stock} where ${ref(stock.productId)} = ${ref(products.id)})::int`,
      updatedAt: products.updatedAt,
    })
    .from(products)
    .innerJoin(categories, eq(categories.id, products.categoryId))
    .where(and(...conditions))
    .orderBy(desc(products.updatedAt), desc(products.id));
}

export async function getProductForEdit(id: number) {
  return db.query.products.findFirst({
    where: eq(products.id, id),
    with: {
      category: { columns: { name: true } },
      stock: { orderBy: [asc(stock.position)] },
    },
  });
}

export async function getCategoryOptions() {
  return db
    .select({ id: categories.id, name: categories.name })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.id));
}

/**
 * Creates the product and its sizes atomically (neon-http has no interactive
 * transactions; `batch` runs as one). Opening stock is logged as a restock.
 */
export async function createProduct(
  fields: ProductFields & { slug: string },
  sizes: { size: string; quantity: number }[],
  actorId: string,
) {
  const sizeRows = sql.join(
    sizes.map((row, position) => sql`(${row.size}::text, ${position}::int, ${row.quantity}::int)`),
    sql`, `,
  );
  const productId = sql`(select id from ${products} where ${products.slug} = ${fields.slug})`;

  // Raw inserts with explicit columns: Drizzle's insert…select would also list
  // the identity column of stock_movements.
  await db.batch([
    db.insert(products).values(fields),
    db.execute(sql`
      insert into ${stock} (product_id, size, position, quantity)
      select ${productId}, v.size, v.position, v.quantity
      from (values ${sizeRows}) as v(size, position, quantity)
    `),
    db.execute(sql`
      insert into ${stockMovements} (product_id, size, delta, quantity_after, reason, actor_id, note)
      select product_id, size, quantity, quantity, 'restock'::stock_movement_reason, ${actorId}::text, 'Opening stock'
      from ${stock} where product_id = ${productId} and quantity > 0
    `),
  ]);

  const created = await db.query.products.findFirst({
    where: eq(products.slug, fields.slug),
    columns: { id: true },
  });
  return created!.id;
}

/** Everything except the slug, which is fixed once a product exists (URLs, bags and rails use it). */
export async function updateProduct(id: number, fields: ProductFields) {
  const [row] = await db
    .update(products)
    .set(fields)
    .where(eq(products.id, id))
    .returning({ slug: products.slug });
  return row;
}

export async function setProductStatus(id: number, status: ProductStatus) {
  const [row] = await db
    .update(products)
    .set({ status })
    .where(eq(products.id, id))
    .returning({ slug: products.slug });
  return row;
}

/** Whether any order (in any state) contains this product. */
export async function hasOrders(id: number) {
  const rows = await db.execute(sql`
    select 1 from ${orders}, jsonb_array_elements(${orders.items}) as item
    where (item->>'productId')::int = ${id}
    limit 1
  `);
  return rows.rows.length > 0;
}

/**
 * Hard delete, only for products that were never ordered: order history keeps
 * product ids, so anything that sold is archived instead. Returns the slug, or
 * undefined when the product doesn't exist or has orders.
 */
export async function deleteProduct(id: number) {
  const result = await db.execute<{ slug: string }>(sql`
    delete from ${products}
    where ${products.id} = ${id}
      and not exists (
        select 1 from ${orders}, jsonb_array_elements(${orders.items}) as item
        where (item->>'productId')::int = ${id}
      )
    returning ${products.slug}
  `);
  return result.rows[0]?.slug;
}
