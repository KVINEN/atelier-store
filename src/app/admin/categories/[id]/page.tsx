import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CategoryForm } from "@/components/admin/category-form";
import { ActionButton } from "@/components/admin/form-controls";
import { AdminMain, AdminSkeleton, PageHeader, Panel } from "@/components/admin/ui";
import { getCategory, listCategories } from "@/db/admin/categories";
import { adminMetadata, requireAdminPage } from "@/lib/admin";

import { deleteCategoryAction, updateCategoryAction } from "../actions";

export const generateMetadata = () => adminMetadata({ title: "Edit category" });

export default function CategoryPage(props: PageProps<"/admin/categories/[id]">) {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <CategoryEditor {...props} />
      </Suspense>
    </AdminMain>
  );
}

async function CategoryEditor({ params }: PageProps<"/admin/categories/[id]">) {
  await requireAdminPage();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [category, all] = await Promise.all([getCategory(id), listCategories()]);
  if (!category) notFound();
  const productCount = all.find((row) => row.id === id)?.products ?? 0;

  return (
    <>
      <PageHeader
        eyebrow="Categories"
        title={category.name}
        description={
          <>
            {productCount} {productCount === 1 ? "product" : "products"} ·{" "}
            <Link href={category.href} className="link" target="_blank">
              View in store
            </Link>{" "}
            ·{" "}
            <Link href={`/admin/products?category=${id}`} className="link">
              View products
            </Link>
          </>
        }
        actions={
          <Link href="/admin/categories" className="link-quiet text-label">
            All categories
          </Link>
        }
      />
      <div className="stack gap-10">
        <CategoryForm
          mode="edit"
          action={updateCategoryAction.bind(null, id)}
          initial={{ name: category.name, slug: category.slug, imageSrc: category.imageSrc, imageAlt: category.imageAlt }}
        />
        <Panel title="Delete" className="max-w-3xl">
          {productCount > 0 ? (
            <p className="text-meta">
              This category has products. Move them to another category (or delete them) before deleting it.
            </p>
          ) : (
            <ActionButton action={deleteCategoryAction.bind(null, id)} confirmLabel="Delete permanently" pendingLabel="Deleting…">
              Delete category
            </ActionButton>
          )}
        </Panel>
      </div>
    </>
  );
}
