// Admin-editable storefront content: shapes, validation and code defaults.
// Stored in the `site_content` table; read through `@/db/queries/content`.

import { z } from "zod";

import { GIFT_EDIT, hero, NEW_ARRIVALS } from "@/lib/catalog";
import { IMAGE_URL_HINT, isAllowedImageUrl } from "@/lib/images";

const imageSchema = z.object({
  src: z.string().trim().refine(isAllowedImageUrl, IMAGE_URL_HINT),
  alt: z.string().trim().min(1, "Describe the image for screen readers.").max(200),
});

const ctaSchema = z.object({
  label: z.string().trim().min(1, "Required.").max(40),
  href: z
    .string()
    .trim()
    .regex(/^\/[a-z0-9\-/]*$/, "A site path such as /women."),
});

export const heroSchema = z.object({
  eyebrow: z.string().trim().max(60),
  title: z.string().trim().min(1, "Required.").max(80),
  body: z.string().trim().max(240),
  images: z.array(imageSchema).length(2),
  ctas: z.array(ctaSchema).min(1).max(2),
});

export type HeroContent = z.infer<typeof heroSchema>;

export const RAILS = {
  "new-arrivals": {
    title: "New arrivals",
    description: "Home page, below the categories.",
    defaults: NEW_ARRIVALS,
  },
  "gift-edit": {
    title: "The gift edit",
    description: "Home page rail and the /gifts page.",
    defaults: GIFT_EDIT,
  },
} as const;

export type RailKey = keyof typeof RAILS;
export const RAIL_KEYS = Object.keys(RAILS) as RailKey[];
export const MAX_RAIL_ITEMS = 24;

export const railSchema = z
  .array(z.string().regex(/^[a-z0-9-]+$/))
  .max(MAX_RAIL_ITEMS)
  .refine((slugs) => new Set(slugs).size === slugs.length, "Each piece can appear once.");

export const contentKeys = {
  hero: "hero",
  rail: (key: RailKey) => `rail:${key}`,
};

export const DEFAULT_HERO: HeroContent = {
  eyebrow: hero.eyebrow,
  title: hero.title,
  body: hero.body,
  images: hero.images,
  ctas: hero.ctas,
};
