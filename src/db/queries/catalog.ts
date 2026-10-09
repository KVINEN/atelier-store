"use cache";

// Catalogue reads for the storefront. Every export is cached and tagged
// "catalog", so results are part of the prerendered static shell.

import "server-only";

import { asc, desc, eq, inArray, ne, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Category } from "@/lib/catalog";
import type { Product } from "@/lib/products";

const productWith = {
  category: { columns: { slug: true, name: true, href: true } },
  stock: { orderBy: (stock, { asc }) => [asc(stock.position)] },
} satisfies NonNullable<Parameters<typeof db.query.products.findMany>[0]>["with"];

type ProductRow = NonNullable<
  Awaited<ReturnType<typeof db.query.products.findFirst<{ with: typeof productWith }>>>
>;

function toProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    sku: row.sku,
    name: row.name,
    category: row.category,
    price: row.priceCents / 100,
    color: row.color,
    colors: row.colorCount,
    badge: row.badge ?? undefined,
    description: row.description,
    details: row.details,
    variants: row.stock.map(({ size, quantity }) => ({ size, stock: quantity })),
    images: row.images,
  };
}

function catalog() {
  cacheTag("catalog");
  cacheLife("hours");
}

export async function getCategories(): Promise<Category[]> {
  catalog();
  const rows = await db.query.categories.findMany({
    orderBy: [asc(categories.position), asc(categories.id)],
  });
  return rows.map(({ slug, name, href, imageSrc, imageAlt }) => ({
    slug,
    name,
    href,
    image: { src: imageSrc, alt: imageAlt },
  }));
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  catalog();
  const row = await db.query.products.findFirst({
    where: eq(products.slug, slug),
    with: productWith,
  });
  return row ? toProduct(row) : undefined;
}

export async function getProductSlugs(): Promise<string[]> {
  catalog();
  const rows = await db.select({ slug: products.slug }).from(products);
  return rows.map((row) => row.slug);
}

/** Products in the order the slugs are given; unknown slugs are skipped. */
export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  catalog();
  if (slugs.length === 0) return [];
  const rows = await db.query.products.findMany({
    where: inArray(products.slug, slugs),
    with: productWith,
  });
  const bySlug = new Map(rows.map((row) => [row.slug, toProduct(row)]));
  return slugs.flatMap((slug) => bySlug.get(slug) ?? []);
}

/** Same-category pieces first, then the rest of the catalogue. */
export async function getRelatedProducts(
  slug: string,
  categorySlug: string,
  limit = 6,
): Promise<Product[]> {
  catalog();
  const categoryId = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.slug, categorySlug));
  const rows = await db.query.products.findMany({
    where: ne(products.slug, slug),
    orderBy: [desc(sql`${products.categoryId} = (${categoryId})`), asc(products.id)],
    limit,
    with: productWith,
  });
  return rows.map(toProduct);
}
