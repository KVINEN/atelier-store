// Loads the placeholder catalogue into the database: `npm run db:seed`.
// Insert-only: rows that already exist (by slug) are left alone, so re-running
// never overwrites what admins have edited or live stock levels.
//
// Builds its own client because `src/db/index.ts` is `server-only`.

import { neon } from "@neondatabase/serverless";
import { config } from "dotenv";
import { drizzle } from "drizzle-orm/neon-http";

import * as schema from "../src/db/schema";
import { seedCategories, seedProducts } from "../src/db/seed-data";

config({ path: [".env.local", ".env"], quiet: true });

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not set");
}

const db = drizzle({ client: neon(process.env.DATABASE_URL), schema });
const { categories, products, stock } = schema;

async function main() {
  const insertedCategories = await db
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
    .onConflictDoNothing({ target: categories.slug })
    .returning({ id: categories.id });

  const categoryIds = new Map(
    (await db.select({ id: categories.id, name: categories.name }).from(categories)).map((row) => [
      row.name,
      row.id,
    ]),
  );

  const insertedProducts = await db
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
    .onConflictDoNothing()
    .returning({ id: products.id, slug: products.slug });

  // Stock only for products created just now; existing quantities are live data.
  const productIds = new Map(insertedProducts.map((row) => [row.slug, row.id]));
  const stockRows = seedProducts.flatMap((product) => {
    const productId = productIds.get(product.slug);
    if (!productId) return [];
    return product.variants.map((variant, position) => ({
      productId,
      size: variant.size,
      position,
      quantity: variant.stock,
    }));
  });

  if (stockRows.length > 0) {
    await db.insert(stock).values(stockRows).onConflictDoNothing();
  }

  console.log(
    `Inserted ${insertedCategories.length} categories, ${insertedProducts.length} products, ${stockRows.length} stock rows.`,
  );
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
