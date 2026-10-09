"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { addSize, adjustStock, ADJUSTMENT_REASONS, moveSize, removeSize } from "@/db/admin/inventory";
import {
  createProduct,
  deleteProduct,
  hasOrders,
  PRODUCT_STATUSES,
  setProductStatus,
  updateProduct,
} from "@/db/admin/products";
import { requireAdmin } from "@/lib/admin";
import {
  failure,
  fieldErrorsOf,
  indexedRows,
  invalid,
  isUniqueViolation,
  lines,
  success,
  type FormState,
} from "@/lib/admin-form";

import { productSchema, quantity, sizeName, sizesSchema, slugSchema } from "./schema";

function readProduct(formData: FormData) {
  return productSchema.safeParse({
    name: formData.get("name"),
    sku: formData.get("sku"),
    categoryId: formData.get("categoryId"),
    gender: formData.get("gender"),
    badge: formData.get("badge"),
    status: formData.get("status"),
    priceCents: formData.get("price"),
    color: formData.get("color"),
    colorCount: formData.get("colorCount"),
    description: formData.get("description"),
    details: lines(formData.get("details")),
    images: indexedRows(formData, "images", ["src", "alt"]),
  });
}

function duplicateError(error: unknown): FormState | undefined {
  if (isUniqueViolation(error, "products_slug_unique")) {
    return failure("Please check the highlighted fields.", { slug: "Another product already uses this slug." });
  }
  if (isUniqueViolation(error, "products_sku_unique")) {
    return failure("Please check the highlighted fields.", { sku: "Another product already uses this SKU." });
  }
}

/** Storefront listings, product pages and rails are all cached under "catalog". */
function catalogChanged() {
  updateTag("catalog");
  refresh();
}

export async function createProductAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const fields = readProduct(formData);
  const slug = slugSchema.safeParse(formData.get("slug"));
  const sizes = sizesSchema.safeParse(indexedRows(formData, "sizes", ["size", "quantity"]));
  if (!fields.success || !slug.success || !sizes.success) {
    const fieldErrors = {
      ...(fields.success ? {} : fieldErrorsOf(fields.error)),
      ...(slug.success ? {} : { slug: slug.error.issues[0].message }),
      // Row-level errors (sizes.0.quantity) plus the list-level one under "sizes".
      ...(sizes.success ? {} : { sizes: sizes.error.issues[0].message, ...fieldErrorsOf(sizes.error, "sizes") }),
    };
    return failure("Please check the highlighted fields.", fieldErrors);
  }

  let id: number;
  try {
    id = await createProduct({ ...fields.data, slug: slug.data }, sizes.data, admin.id);
  } catch (error) {
    const duplicate = duplicateError(error);
    if (duplicate) return duplicate;
    throw error;
  }

  catalogChanged();
  redirect(`/admin/products/${id}?created=1`);
}

export async function updateProductAction(
  productId: number,
  _prev: FormState,
  formData: FormData,
): Promise<FormState> {
  await requireAdmin();

  const fields = readProduct(formData);
  if (!fields.success) return invalid(fields.error);

  try {
    const updated = await updateProduct(productId, fields.data);
    if (!updated) return failure("This product no longer exists.");
  } catch (error) {
    const duplicate = duplicateError(error);
    if (duplicate) return duplicate;
    throw error;
  }

  catalogChanged();
  // The edit form remounts on change (it's keyed by updatedAt), so confirm via the URL.
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function setProductStatusAction(productId: number, _prev: FormState, formData: FormData) {
  await requireAdmin();

  const status = z.enum(PRODUCT_STATUSES).safeParse(formData.get("status"));
  if (!status.success) return failure("Unknown status.");

  const updated = await setProductStatus(productId, status.data);
  if (!updated) return failure("This product no longer exists.");

  catalogChanged();
  const labels = { active: "Published to the store.", draft: "Moved to drafts.", archived: "Archived." };
  return success(labels[status.data]);
}

export async function deleteProductAction(productId: number): Promise<FormState> {
  await requireAdmin();

  if (await hasOrders(productId)) {
    return failure("This product has been ordered, so it can't be deleted. Archive it instead.");
  }
  const deleted = await deleteProduct(productId);
  if (!deleted) return failure("This product couldn't be deleted. It may have just been ordered.");

  catalogChanged();
  redirect("/admin/products?deleted=1");
}

const adjustmentSchema = z.discriminatedUnion("mode", [
  z.object({
    mode: z.literal("adjust"),
    delta: z.coerce
      .number({ error: "Enter a whole number." })
      .int("Enter a whole number.")
      .refine((value) => value !== 0, "Enter a change other than 0.")
      .refine((value) => Math.abs(value) <= 100_000, "That change is too large."),
    reason: z.enum(ADJUSTMENT_REASONS),
  }),
  z.object({
    mode: z.literal("count"),
    count: quantity,
    expected: z.coerce.number().int().min(0),
  }),
]);

/** Shared by the product page and the inventory list. */
export async function adjustStockAction(_prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const productId = z.coerce.number().int().positive().safeParse(formData.get("productId"));
  const size = sizeName.safeParse(formData.get("size"));
  const parsed = adjustmentSchema.safeParse({
    mode: formData.get("mode"),
    delta: formData.get("delta"),
    reason: formData.get("reason"),
    count: formData.get("count"),
    expected: formData.get("expected"),
  });
  if (!productId.success || !size.success) return failure("This size couldn't be found.");
  if (!parsed.success) return invalid(parsed.error);

  const note = String(formData.get("note") ?? "").trim().slice(0, 200) || null;
  const change =
    parsed.data.mode === "adjust"
      ? { delta: parsed.data.delta, reason: parsed.data.reason }
      : {
          delta: parsed.data.count - parsed.data.expected,
          reason: "correction" as const,
          expected: parsed.data.expected,
        };
  if (change.delta === 0) return success("No change: the count matches.");

  const after = await adjustStock({
    productId: productId.data,
    size: size.data,
    note,
    actorId: admin.id,
    ...change,
  });
  if (after === null) {
    return failure(
      parsed.data.mode === "count"
        ? "Stock changed since this page loaded (probably a sale). Reload and count again."
        : "That would take stock below zero.",
    );
  }

  catalogChanged();
  return success(`${size.data}: now ${after} in stock.`);
}

export async function addSizeAction(productId: number, _prev: FormState, formData: FormData): Promise<FormState> {
  const admin = await requireAdmin();

  const size = sizeName.safeParse(formData.get("size"));
  const opening = quantity.safeParse(formData.get("quantity") || 0);
  if (!size.success) return failure("Please check the highlighted fields.", { size: size.error.issues[0].message });
  if (!opening.success) {
    return failure("Please check the highlighted fields.", { quantity: opening.error.issues[0].message });
  }

  const added = await addSize({ productId, size: size.data, quantity: opening.data, actorId: admin.id });
  if (!added) return failure("Please check the highlighted fields.", { size: "This size already exists." });

  catalogChanged();
  return success(`Added ${size.data}.`);
}

export async function removeSizeAction(productId: number, size: string): Promise<FormState> {
  await requireAdmin();

  const result = await removeSize(productId, size);
  const messages = {
    removed: undefined,
    missing: "This size no longer exists.",
    "has-stock": "Only sizes with no stock can be removed. Bring it to 0 first.",
    "last-size": "A product needs at least one size.",
    "pending-orders": "A checkout in progress includes this size. Try again once it completes or expires.",
  };
  const message = messages[result];
  if (message) return failure(message);

  catalogChanged();
  return success(`Removed ${size}.`);
}

export async function moveSizeAction(productId: number, size: string, direction: "up" | "down") {
  await requireAdmin();
  await moveSize(productId, size, direction);
  catalogChanged();
}
