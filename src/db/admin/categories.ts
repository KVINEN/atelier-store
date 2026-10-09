// Admin category reads and writes. Uncached; every caller must have passed
// requireAdmin().

import "server-only";

import { asc, eq, sql } from "drizzle-orm";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import { ref } from "@/db/sql";

export type CategoryFields = {
  name: string;
  imageSrc: string;
  imageAlt: string;
};

export async function listCategories() {
  return db
    .select({
      id: categories.id,
      slug: categories.slug,
      name: categories.name,
      href: categories.href,
      imageSrc: categories.imageSrc,
      imageAlt: categories.imageAlt,
      position: categories.position,
      products: sql<number>`(select count(*) from ${products} where ${ref(products.categoryId)} = ${ref(categories.id)})::int`,
      activeProducts: sql<number>`(select count(*) from ${products} where ${ref(products.categoryId)} = ${ref(categories.id)} and ${ref(products.status)} = 'active')::int`,
    })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.id));
}

export async function getCategory(id: number) {
  return db.query.categories.findFirst({ where: eq(categories.id, id) });
}

/** New categories go last. The slug (and its /categories/<slug> URL) is fixed once created. */
export async function createCategory(fields: CategoryFields & { slug: string }) {
  const [row] = await db
    .insert(categories)
    .values({
      ...fields,
      href: `/categories/${fields.slug}`,
      position: sql`coalesce((select max(${categories.position}) + 1 from ${categories}), 0)`,
    })
    .returning({ id: categories.id });
  return row.id;
}

export async function updateCategory(id: number, fields: CategoryFields) {
  const [row] = await db
    .update(categories)
    .set(fields)
    .where(eq(categories.id, id))
    .returning({ id: categories.id });
  return row;
}

/** Only empty categories can be deleted (products reference them with ON DELETE RESTRICT). */
export async function deleteCategory(id: number) {
  const result = await db.execute<{ id: number }>(sql`
    delete from ${categories}
    where ${categories.id} = ${id}
      and not exists (select 1 from ${products} where ${products.categoryId} = ${id})
    returning ${categories.id}
  `);
  return result.rows.length > 0;
}

/** Swaps a category with its neighbour in the storefront order. */
export async function moveCategory(id: number, direction: "up" | "down") {
  const rows = await db
    .select({ id: categories.id })
    .from(categories)
    .orderBy(asc(categories.position), asc(categories.id));

  const order = rows.map((row) => row.id);
  const index = order.indexOf(id);
  const target = direction === "up" ? index - 1 : index + 1;
  if (index < 0 || target < 0 || target >= order.length) return;

  [order[index], order[target]] = [order[target], order[index]];
  const cases = sql.join(
    order.map((categoryId, position) => sql`when ${categoryId}::int then ${position}::int`),
    sql` `,
  );
  await db.execute(sql`update ${categories} set position = case id ${cases} end`);
}
