"use cache";

// Storefront content reads, cached and tagged "site". Stored values are
// re-validated on read and fall back to the code defaults when missing.

import "server-only";

import { eq } from "drizzle-orm";
import { cacheLife, cacheTag } from "next/cache";

import { db } from "@/db";
import { siteContent } from "@/db/schema";
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
  cacheTag("site");
  cacheLife("hours");
  const row = await db.query.siteContent.findFirst({ where: eq(siteContent.key, key) });
  return row?.value;
}

export async function getHero(): Promise<HeroContent> {
  const parsed = heroSchema.safeParse(await read(contentKeys.hero));
  return parsed.success ? parsed.data : DEFAULT_HERO;
}

/** Product slugs for a curated rail, in display order. */
export async function getRailSlugs(key: RailKey): Promise<string[]> {
  const parsed = railSchema.safeParse(await read(contentKeys.rail(key)));
  return parsed.success ? parsed.data : [...RAILS[key].defaults];
}
