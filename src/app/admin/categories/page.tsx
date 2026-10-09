import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { AdminMain, AdminSkeleton, EmptyState, PageHeader, Table, Td, Th } from "@/components/admin/ui";
import { listCategories } from "@/db/admin/categories";
import { adminMetadata, requireAdminPage } from "@/lib/admin";

import { moveCategoryAction } from "./actions";

export const generateMetadata = () => adminMetadata({ title: "Categories" });

export default function CategoriesPage(props: PageProps<"/admin/categories">) {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <Categories {...props} />
      </Suspense>
    </AdminMain>
  );
}

async function Categories({ searchParams }: PageProps<"/admin/categories">) {
  await requireAdminPage();
  const [categories, params] = await Promise.all([listCategories(), searchParams]);

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Categories"
        description="The order here is the order of “Shop by category” on the home page."
        actions={
          <Link href="/admin/categories/new" className="btn btn-primary btn-sm">
            New category
          </Link>
        }
      />
      {params.saved === "1" && (
        <p role="status" className="text-success mb-6 text-sm">
          Category saved.
        </p>
      )}
      {params.deleted === "1" && (
        <p role="status" className="text-success mb-6 text-sm">
          Category deleted.
        </p>
      )}

      {categories.length === 0 ? (
        <EmptyState title="No categories yet" />
      ) : (
        <Table caption="Categories in storefront order">
          <thead>
            <tr>
              <Th>
                <span className="sr-only">Image</span>
              </Th>
              <Th>Category</Th>
              <Th align="right">Products</Th>
              <Th>Order</Th>
            </tr>
          </thead>
          <tbody>
            {categories.map((category, index) => (
              <tr key={category.id}>
                <Td className="w-14">
                  <div className="bg-surface relative aspect-[3/4] w-10 overflow-hidden">
                    <Image src={category.imageSrc} alt="" fill sizes="40px" className="object-cover" />
                  </div>
                </Td>
                <Td>
                  <Link href={`/admin/categories/${category.id}`} className="link-quiet font-medium">
                    {category.name}
                  </Link>
                  <p className="text-meta">{category.href}</p>
                </Td>
                <Td align="right">
                  {category.activeProducts}
                  <span className="text-mute"> / {category.products}</span>
                  <p className="text-meta">active / all</p>
                </Td>
                <Td>
                  <span className="inline-flex gap-3">
                    <form action={moveCategoryAction.bind(null, category.id, "up")}>
                      <button type="submit" className="link-mute text-label" disabled={index === 0} aria-label={`Move ${category.name} up`}>
                        Up
                      </button>
                    </form>
                    <form action={moveCategoryAction.bind(null, category.id, "down")}>
                      <button
                        type="submit"
                        className="link-mute text-label"
                        disabled={index === categories.length - 1}
                        aria-label={`Move ${category.name} down`}
                      >
                        Down
                      </button>
                    </form>
                  </span>
                </Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
      <p className="text-meta mt-6">
        The header menu links to some categories directly and is edited in code.
      </p>
    </>
  );
}
