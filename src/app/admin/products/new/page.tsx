import Link from "next/link";
import { Suspense } from "react";

import { ProductForm } from "@/components/admin/product-form";
import { AdminMain, AdminSkeleton, EmptyState, PageHeader } from "@/components/admin/ui";
import { getCategoryOptions, PRODUCT_BADGES } from "@/db/admin/products";
import { adminMetadata, requireAdminPage } from "@/lib/admin";

import { createProductAction } from "../actions";
import { GENDER_OPTIONS, STATUS_OPTIONS } from "../options";

export const generateMetadata = () => adminMetadata({ title: "New product" });

export default function NewProductPage() {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <NewProduct />
      </Suspense>
    </AdminMain>
  );
}

async function NewProduct() {
  await requireAdminPage();
  const categories = await getCategoryOptions();

  return (
    <>
      <PageHeader
        eyebrow="Products"
        title="New product"
        description="Save as a draft to prepare it privately, or make it active to sell straight away."
        actions={
          <Link href="/admin/products" className="link-quiet text-label">
            Back to products
          </Link>
        }
      />
      {categories.length === 0 ? (
        <EmptyState title="Create a category first">
          <Link href="/admin/categories/new" className="link">
            New category
          </Link>
        </EmptyState>
      ) : (
        <ProductForm
          mode="create"
          action={createProductAction}
          categories={categories}
          statuses={STATUS_OPTIONS}
          genders={GENDER_OPTIONS}
          badges={[...PRODUCT_BADGES]}
          initial={{
            name: "",
            slug: "",
            sku: "",
            categoryId: null,
            gender: "unisex",
            badge: null,
            status: "draft",
            priceCents: 0,
            color: "",
            colorCount: 1,
            description: "",
            details: [],
            images: [],
          }}
        />
      )}
    </>
  );
}
