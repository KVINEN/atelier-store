import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";

import { ProductStatusBadge } from "@/components/admin/status";
import {
  AdminMain,
  AdminSkeleton,
  EmptyState,
  FilterTabs,
  formatDate,
  PageHeader,
  SearchForm,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { getCategoryOptions, listProducts, PRODUCT_STATUSES, type ProductStatus } from "@/db/admin/products";
import { adminMetadata, requireAdminPage } from "@/lib/admin";
import { formatCents } from "@/lib/admin-form";
import { LOW_STOCK_THRESHOLD } from "@/lib/products";

export const generateMetadata = () => adminMetadata({ title: "Products" });

export default function ProductsPage(props: PageProps<"/admin/products">) {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <Products {...props} />
      </Suspense>
    </AdminMain>
  );
}

async function Products({ searchParams }: PageProps<"/admin/products">) {
  await requireAdminPage();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const status = PRODUCT_STATUSES.find((value) => value === params.status);
  const categoryId = Number(params.category) || undefined;
  const deleted = params.deleted === "1";

  const [products, categories] = await Promise.all([
    listProducts({ q: q || undefined, status, categoryId }),
    getCategoryOptions(),
  ]);

  const href = (next: { status?: ProductStatus | "all"; category?: number | "all" }) => {
    const query = new URLSearchParams();
    const nextStatus = next.status === undefined ? status : next.status === "all" ? undefined : next.status;
    const nextCategory = next.category === undefined ? categoryId : next.category === "all" ? undefined : next.category;
    if (q) query.set("q", q);
    if (nextStatus) query.set("status", nextStatus);
    if (nextCategory) query.set("category", String(nextCategory));
    const text = query.toString();
    return `/admin/products${text ? `?${text}` : ""}`;
  };

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Products"
        description="Prices, details, images and status. Only active products appear in the store."
        actions={
          <Link href="/admin/products/new" className="btn btn-primary btn-sm">
            New product
          </Link>
        }
      />
      {deleted && (
        <p role="status" className="text-success mb-6 text-sm">
          Product deleted.
        </p>
      )}

      <FilterTabs
        label="Product status"
        current={status ?? "all"}
        options={[
          { value: "all", label: "All" },
          { value: "active", label: "Active" },
          { value: "draft", label: "Drafts" },
          { value: "archived", label: "Archived" },
        ]}
        href={(value) => href({ status: value as ProductStatus | "all" })}
      />

      <div className="flex flex-wrap items-start justify-between gap-x-8">
        <SearchForm
          label="Search products"
          placeholder="Name, SKU or slug"
          defaultValue={q}
          hidden={{ status, category: categoryId ? String(categoryId) : undefined }}
        />
        <nav aria-label="Category" className="mb-6 flex flex-wrap gap-x-4 gap-y-2">
          <Link href={href({ category: "all" })} aria-current={!categoryId ? "page" : undefined} className="link-quiet text-label">
            All categories
          </Link>
          {categories.map((category) => (
            <Link
              key={category.id}
              href={href({ category: category.id })}
              aria-current={categoryId === category.id ? "page" : undefined}
              className="link-quiet text-label"
            >
              {category.name}
            </Link>
          ))}
        </nav>
      </div>

      {products.length === 0 ? (
        <EmptyState title="No products match">
          {q || status || categoryId ? (
            <Link href="/admin/products" className="link">
              Clear filters
            </Link>
          ) : (
            "Create your first product to start selling."
          )}
        </EmptyState>
      ) : (
        <Table caption={`${products.length} products`}>
          <thead>
            <tr>
              <Th>
                <span className="sr-only">Image</span>
              </Th>
              <Th>Product</Th>
              <Th>Category</Th>
              <Th align="right">Price</Th>
              <Th align="right">Stock</Th>
              <Th>Status</Th>
              <Th>Updated</Th>
            </tr>
          </thead>
          <tbody>
            {products.map((product) => (
              <tr key={product.id} className="hover:bg-surface">
                <Td className="w-14">
                  <div className="bg-surface relative aspect-[3/4] w-10 overflow-hidden">
                    {product.image && (
                      <Image src={product.image.src} alt="" fill sizes="40px" className="object-cover" />
                    )}
                  </div>
                </Td>
                <Td>
                  <Link href={`/admin/products/${product.id}`} className="link-quiet font-medium">
                    {product.name}
                  </Link>
                  <p className="text-meta">{product.sku}</p>
                </Td>
                <Td>{product.category}</Td>
                <Td align="right">{formatCents(product.priceCents)}</Td>
                <Td align="right">
                  <span className={product.totalStock === 0 ? "text-error" : product.totalStock <= LOW_STOCK_THRESHOLD ? "text-sale" : undefined}>
                    {product.totalStock}
                  </span>
                  <p className="text-meta">
                    {product.sizes} {product.sizes === 1 ? "size" : "sizes"}
                  </p>
                </Td>
                <Td>
                  <ProductStatusBadge status={product.status} />
                </Td>
                <Td className="text-meta whitespace-nowrap">{formatDate(product.updatedAt)}</Td>
              </tr>
            ))}
          </tbody>
        </Table>
      )}
    </>
  );
}
