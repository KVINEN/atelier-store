// Validation for product forms. Server-only (the enums come from the db module).

import "server-only";

import { z } from "zod";

import { PRODUCT_BADGES, PRODUCT_GENDERS, PRODUCT_STATUSES } from "@/db/admin/products";
import { parseMoneyToCents, SLUG_PATTERN } from "@/lib/admin-form";
import { IMAGE_URL_HINT, isAllowedImageUrl } from "@/lib/images";

export const MAX_PRICE_CENTS = 10_000_000; // $100,000
export const MAX_QUANTITY_PER_SIZE = 100_000;

const image = z.object({
  src: z.string().trim().refine(isAllowedImageUrl, IMAGE_URL_HINT),
  alt: z.string().trim().min(1, "Describe the image for screen readers.").max(200),
});

export const productSchema = z.object({
  name: z.string().trim().min(1, "Required.").max(120),
  sku: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z0-9][A-Z0-9-]{0,39}$/, "Letters, numbers and hyphens, up to 40 characters."),
  categoryId: z.coerce.number({ error: "Choose a category." }).int().positive("Choose a category."),
  gender: z.enum(PRODUCT_GENDERS),
  badge: z.preprocess((value) => (value === "" ? null : value), z.enum(PRODUCT_BADGES).nullable()),
  status: z.enum(PRODUCT_STATUSES),
  priceCents: z
    .string()
    .transform(parseMoneyToCents)
    .pipe(
      z
        .number({ error: "Enter a price such as 1250 or 1250.00." })
        .int()
        .refine(Number.isFinite, "Enter a price such as 1250 or 1250.00.")
        .min(0, "Price can't be negative.")
        .max(MAX_PRICE_CENTS, "That price is too high."),
    ),
  color: z.string().trim().min(1, "Required.").max(60),
  colorCount: z.coerce.number().int().min(1, "At least 1.").max(50),
  description: z.string().trim().min(1, "Required.").max(2000),
  details: z.array(z.string().trim().min(1).max(200)).max(20, "Up to 20 detail lines."),
  images: z.array(image).min(1, "Add at least one image.").max(12, "Up to 12 images."),
});

export const slugSchema = z
  .string()
  .trim()
  .min(1, "Required.")
  .max(80)
  .regex(SLUG_PATTERN, "Lowercase letters, numbers and single hyphens.");

export const sizeName = z.string().trim().min(1, "Required.").max(20);
export const quantity = z.coerce
  .number({ error: "Enter a whole number." })
  .int("Enter a whole number.")
  .min(0, "Can't be negative.")
  .max(MAX_QUANTITY_PER_SIZE);

export const sizesSchema = z
  .array(z.object({ size: sizeName, quantity }))
  .min(1, "Add at least one size.")
  .max(30)
  .refine(
    (rows) => new Set(rows.map((row) => row.size.toLowerCase())).size === rows.length,
    "Each size can be listed once.",
  );
