"use server";

import { refresh, updateTag } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";

import { createCategory, deleteCategory, moveCategory, updateCategory } from "@/db/admin/categories";
import { requireAdmin } from "@/lib/admin";
import { failure, invalid, isUniqueViolation, SLUG_PATTERN, type FormState } from "@/lib/admin-form";
import { IMAGE_URL_HINT, isAllowedImageUrl } from "@/lib/images";

const categorySchema = z.object({
  name: z.string().trim().min(1, "Required.").max(60),
  imageSrc: z.string().trim().refine(isAllowedImageUrl, IMAGE_URL_HINT),
  imageAlt: z.string().trim().min(1, "Describe the image for screen readers.").max(200),
});

const slugSchema = z
  .string()
  .trim()
  .min(1, "Required.")
  .max(60)
  .regex(SLUG_PATTERN, "Lowercase letters, numbers and single hyphens.");

function read(formData: FormData) {
  return categorySchema.safeParse({
    name: formData.get("name"),
    imageSrc: formData.get("imageSrc"),
    imageAlt: formData.get("imageAlt"),
  });
}

function catalogChanged() {
  updateTag("catalog");
  refresh();
}

export async function createCategoryAction(_prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const fields = read(formData);
  const slug = slugSchema.safeParse(formData.get("slug"));
  if (!fields.success) return invalid(fields.error);
  if (!slug.success) return failure("Please check the highlighted fields.", { slug: slug.error.issues[0].message });

  try {
    await createCategory({ ...fields.data, slug: slug.data });
  } catch (error) {
    if (isUniqueViolation(error, "categories_slug_unique")) {
      return failure("Please check the highlighted fields.", { slug: "Another category already uses this slug." });
    }
    throw error;
  }

  catalogChanged();
  redirect("/admin/categories?saved=1");
}

export async function updateCategoryAction(id: number, _prev: FormState, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const fields = read(formData);
  if (!fields.success) return invalid(fields.error);

  const updated = await updateCategory(id, fields.data);
  if (!updated) return failure("This category no longer exists.");

  catalogChanged();
  redirect("/admin/categories?saved=1");
}

export async function deleteCategoryAction(id: number): Promise<FormState> {
  await requireAdmin();

  if (!(await deleteCategory(id))) {
    return failure("Only empty categories can be deleted. Move or delete its products first.");
  }

  catalogChanged();
  redirect("/admin/categories?deleted=1");
}

export async function moveCategoryAction(id: number, direction: "up" | "down") {
  await requireAdmin();
  await moveCategory(id, direction);
  catalogChanged();
}
