"use server";

import { refresh, updateTag } from "next/cache";

import { existingProductSlugs, resetContent, saveHero, saveRail } from "@/db/admin/content";
import { requireAdmin } from "@/lib/admin";
import { failure, indexedRows, invalid, success, type FormState } from "@/lib/admin-form";
import { contentKeys, heroSchema, RAILS, railSchema, type RailKey } from "@/lib/site-content";

/** Hero and rails are cached under "site". */
function siteChanged() {
  updateTag("site");
  refresh();
}

export async function saveHeroAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const parsed = heroSchema.safeParse({
    eyebrow: formData.get("eyebrow") ?? "",
    title: formData.get("title"),
    body: formData.get("body") ?? "",
    images: indexedRows(formData, "images", ["src", "alt"]),
    ctas: indexedRows(formData, "ctas", ["label", "href"]),
  });
  if (!parsed.success) return invalid(parsed.error);

  await saveHero(parsed.data);
  siteChanged();
  return success("Hero published.");
}

export async function resetHeroAction(): Promise<FormState> {
  await requireAdmin();
  await resetContent(contentKeys.hero);
  siteChanged();
  return success("Hero reset to the default.");
}

function isRailKey(key: string): key is RailKey {
  return Object.hasOwn(RAILS, key);
}

export async function saveRailAction(key: string, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!isRailKey(key)) return failure("Unknown rail.");

  const parsed = railSchema.safeParse(formData.getAll("slugs").map(String));
  if (!parsed.success) return failure(parsed.error.issues[0].message);

  if (parsed.data.length > 0) {
    const known = await existingProductSlugs(parsed.data);
    const missing = parsed.data.filter((slug) => !known.has(slug));
    if (missing.length) return failure(`Remove pieces that no longer exist: ${missing.join(", ")}.`);
  }

  await saveRail(key, parsed.data);
  siteChanged();
  return success(`${RAILS[key].title} published.`);
}

export async function resetRailAction(key: string): Promise<FormState> {
  await requireAdmin();
  if (!isRailKey(key)) return failure("Unknown rail.");
  await resetContent(contentKeys.rail(key));
  siteChanged();
  return success("Reset to the default selection.");
}
