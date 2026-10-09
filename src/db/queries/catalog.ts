"use cache";

// Catalogue reads for the storefront. Every export is cached and tagged
// "catalog", so results are part of the prerendered static shell. Only
// `active` products are ever returned; admin reads live in `./admin`.

import "server-only";

import { and, asc, desc, eq, ilike, inArray, ne, or, sql } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { categories, products } from "@/db/schema";
import type { Category } from "@/lib/catalog";
import type { Gender, Product } from "@/lib/products";

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
    gender: row.gender,
    description: row.description,
    details: row.details,
    variants: row.stock.map(({ size, quantity }) => ({ size, stock: quantity })),
    images: row.images,
  };
}

const isActive = eq(products.status, "active");

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

/** A category and its products in catalogue order, or `undefined`. */
export async function getCategoryWithProducts(
  slug: string,
): Promise<{ category: Category; products: Product[] } | undefined> {
  catalog();
  const row = await db.query.categories.findFirst({
    where: eq(categories.slug, slug),
    with: {
      products: { where: isActive, orderBy: [asc(products.id)], with: productWith },
    },
  });
  if (!row) return undefined;
  const { name, href, imageSrc, imageAlt } = row;
  return {
    category: { slug, name, href, image: { src: imageSrc, alt: imageAlt } },
    products: row.products.map(toProduct),
  };
}

export async function getProduct(slug: string): Promise<Product | undefined> {
  catalog();
  const row = await db.query.products.findFirst({
    where: and(eq(products.slug, slug), isActive),
    with: productWith,
  });
  return row ? toProduct(row) : undefined;
}

export async function getProductSlugs(): Promise<string[]> {
  catalog();
  const rows = await db.select({ slug: products.slug }).from(products).where(isActive);
  return rows.map((row) => row.slug);
}

/** Products in the order the slugs are given; unknown slugs are skipped. */
export async function getProductsBySlugs(slugs: string[]): Promise<Product[]> {
  catalog();
  if (slugs.length === 0) return [];
  const rows = await db.query.products.findMany({
    where: and(inArray(products.slug, slugs), isActive),
    with: productWith,
  });
  const bySlug = new Map(rows.map((row) => [row.slug, toProduct(row)]));
  return slugs.flatMap((slug) => bySlug.get(slug) ?? []);
}

/** Pieces for one gender, including unisex pieces, in catalogue order. */
export async function getProductsByGender(
  gender: Exclude<Gender, "unisex">,
): Promise<Product[]> {
  catalog();
  const rows = await db.query.products.findMany({
    where: and(inArray(products.gender, [gender, "unisex"]), isActive),
    orderBy: [asc(products.id)],
    with: productWith,
  });
  return rows.map(toProduct);
}

/** Case-insensitive match on name, description, colour or category name. */
export async function searchProducts(query: string, limit = 48): Promise<Product[]> {
  catalog();
  const terms = query.trim().split(/\s+/).filter(Boolean);
  if (terms.length === 0) return [];

  const matchingCategories = (pattern: string) =>
    db.select({ id: categories.id }).from(categories).where(ilike(categories.name, pattern));
  const rows = await db.query.products.findMany({
    // Every term must match at least one field.
    where: and(
      isActive,
      ...terms.map((term) => {
        const pattern = `%${term.replace(/[\\%_]/g, "\\$&")}%`;
        return or(
          ilike(products.name, pattern),
          ilike(products.description, pattern),
          ilike(products.color, pattern),
          inArray(products.categoryId, matchingCategories(pattern)),
        );
      }),
    ),
    orderBy: [asc(products.id)],
    limit,
    with: productWith,
  });
  return rows.map(toProduct);
}

/** Newest first; ties (rows seeded together) fall back to insertion order. */
export async function getLatestProducts(limit = 24): Promise<Product[]> {
  catalog();
  const rows = await db.query.products.findMany({
    where: isActive,
    orderBy: [desc(products.createdAt), desc(products.id)],
    limit,
    with: productWith,
  });
  return rows.map(toProduct);
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
    where: and(ne(products.slug, slug), isActive),
    orderBy: [desc(sql`${products.categoryId} = (${categoryId})`), asc(products.id)],
    limit,
    with: productWith,
  });
  return rows.map(toProduct);
}
