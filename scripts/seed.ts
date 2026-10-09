// Loads the placeholder catalogue into the database: `npm run db:seed`.
// Idempotent; re-running updates existing rows in place by slug.
//
// Builds its own client because `src/db/index.ts` is `server-only`.

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { getTableColumns, sql, type Table } from "drizzle-orm";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../src/db/schema";
import { seedCategories, seedProducts } from "../src/db/seed-data";

config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const db = drizzle({ client: neon(process.env.DATABASE_URL), schema });
const { categories, products, stock } = schema;

// On conflict, take the incoming value for every listed column. `set` is
// keyed by field name, so unknown keys would be silently dropped.
function excluded<T extends Table>(table: T, fields: (keyof T["_"]["columns"] & string)[]) {
  const columns = getTableColumns(table);
  return Object.fromEntries(
    fields.map((field) => [field, sql.raw(`excluded."${columns[field].name}"`)]),
  );
}

async function main() {
  const categoryRows = await db
    .insert(categories)
    .values(
      seedCategories.map((category, position) => ({
        slug: category.slug,
        name: category.name,
        href: category.href,
        imageSrc: category.image.src,
        imageAlt: category.image.alt,
        position,
      })),
    )
    .onConflictDoUpdate({
      target: categories.slug,
      set: excluded(categories, ["name", "href", "imageSrc", "imageAlt", "position"]),
    })
    .returning({ id: categories.id, name: categories.name });

  const categoryIds = new Map(categoryRows.map((row) => [row.name, row.id]));

  const productRows = await db
    .insert(products)
    .values(
      seedProducts.map((product) => {
        const categoryId = categoryIds.get(product.category);
        if (!categoryId) throw new Error(`Unknown category: ${product.category}`);
        return {
          categoryId,
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          description: product.description,
          details: product.details,
          priceCents: Math.round(product.price * 100),
          color: product.color,
          colorCount: product.colors,
          badge: product.badge ?? null,
          gender: product.gender,
          images: product.images,
        };
      }),
    )
    .onConflictDoUpdate({
      target: products.slug,
      set: {
        ...excluded(products, [
          "categoryId",
          "sku",
          "name",
          "description",
          "details",
          "priceCents",
          "color",
          "colorCount",
          "badge",
          "gender",
          "images",
        ]),
        updatedAt: sql`now()`,
      },
    })
    .returning({ id: products.id, slug: products.slug });

  const productIds = new Map(productRows.map((row) => [row.slug, row.id]));

  const stockRows = seedProducts.flatMap((product) =>
    product.variants.map((variant, position) => ({
      productId: productIds.get(product.slug)!,
      size: variant.size,
      position,
      quantity: variant.stock,
    })),
  );

  await db
    .insert(stock)
    .values(stockRows)
    .onConflictDoUpdate({
      target: [stock.productId, stock.size],
      set: excluded(stock, ["position", "quantity"]),
    });

  console.log(
    `Seeded ${categoryRows.length} categories, ${productRows.length} products, ${stockRows.length} stock rows.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
