import Link from "next/link";
import { Suspense } from "react";

import { CategoryForm } from "@/components/admin/category-form";
import { AdminMain, AdminSkeleton, PageHeader } from "@/components/admin/ui";
import { adminMetadata, requireAdminPage } from "@/lib/admin";

import { createCategoryAction } from "../actions";

export const generateMetadata = () => adminMetadata({ title: "New category" });

export default function NewCategoryPage() {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <NewCategory />
      </Suspense>
    </AdminMain>
  );
}

async function NewCategory() {
  await requireAdminPage();
  return (
    <>
      <PageHeader
        eyebrow="Categories"
        title="New category"
        actions={
          <Link href="/admin/categories" className="link-quiet text-label">
            All categories
          </Link>
        }
      />
      <CategoryForm mode="create" action={createCategoryAction} initial={{ name: "", slug: "", imageSrc: "", imageAlt: "" }} />
    </>
  );
}
