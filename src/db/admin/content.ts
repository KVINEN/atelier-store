// Admin reads and writes for editable storefront content. Uncached; every
// caller must have passed requireAdmin().

import "server-only";

import { eq, inArray } from "drizzle-orm";

import { db } from "@/db";
import { products, siteContent } from "@/db/schema";
import type { ImageAsset } from "@/lib/images";
import {
  contentKeys,
  DEFAULT_HERO,
  heroSchema,
  RAILS,
  railSchema,
  type HeroContent,
  type RailKey,
} from "@/lib/site-content";

async function read(key: string) {
  const row = await db.query.siteContent.findFirst({ where: eq(siteContent.key, key) });
  return row ? { value: row.value, updatedAt: row.updatedAt } : undefined;
}

async function write(key: string, value: unknown) {
  await db
    .insert(siteContent)
    .values({ key, value })
    .onConflictDoUpdate({ target: siteContent.key, set: { value, updatedAt: new Date() } });
}

export async function getHeroForEdit() {
  const stored = await read(contentKeys.hero);
  const parsed = heroSchema.safeParse(stored?.value);
  return {
    hero: parsed.success ? parsed.data : DEFAULT_HERO,
    isDefault: !parsed.success,
    updatedAt: stored?.updatedAt,
  };
}

export async function saveHero(hero: HeroContent) {
  await write(contentKeys.hero, hero);
}

export async function resetContent(key: string) {
  await db.delete(siteContent).where(eq(siteContent.key, key));
}

export type RailEntry = {
  slug: string;
  name: string | null;
  status: string | null;
  image: ImageAsset | null;
};

/** A rail's slugs with what they currently point at; deleted products show as missing. */
export async function getRailForEdit(key: RailKey) {
  const stored = await read(contentKeys.rail(key));
  const parsed = railSchema.safeParse(stored?.value);
  const slugs = parsed.success ? parsed.data : [...RAILS[key].defaults];

  const rows = slugs.length
    ? await db
        .select({ slug: products.slug, name: products.name, status: products.status, images: products.images })
        .from(products)
        .where(inArray(products.slug, slugs))
    : [];
  const bySlug = new Map(rows.map((row) => [row.slug, row]));

  const entries: RailEntry[] = slugs.map((slug) => {
    const row = bySlug.get(slug);
    return { slug, name: row?.name ?? null, status: row?.status ?? null, image: row?.images[0] ?? null };
  });
  return { entries, isDefault: !parsed.success, updatedAt: stored?.updatedAt };
}

export async function saveRail(key: RailKey, slugs: string[]) {
  await write(contentKeys.rail(key), slugs);
}

/** Every product, for the rail pickers. */
export async function getProductPickerOptions() {
  return db
    .select({ slug: products.slug, name: products.name, status: products.status })
    .from(products)
    .orderBy(products.name);
}

export async function existingProductSlugs(slugs: string[]) {
  const rows = await db.select({ slug: products.slug }).from(products).where(inArray(products.slug, slugs));
  return new Set(rows.map((row) => row.slug));
}
