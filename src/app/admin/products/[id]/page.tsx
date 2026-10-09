import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionButton } from "@/components/admin/form-controls";
import { ProductForm } from "@/components/admin/product-form";
import { ProductStatusBadge, StockBadge } from "@/components/admin/status";
import {
  AddSizeForm,
  RemoveSizeButton,
  SizeOrderButtons,
  StockAdjustPanel,
} from "@/components/admin/stock-controls";
import { AdminMain, AdminSkeleton, formatDateTime, PageHeader, Panel, Table, Td, Th } from "@/components/admin/ui";
import { listMovements } from "@/db/admin/inventory";
import { getCategoryOptions, getProductForEdit, hasOrders, PRODUCT_BADGES } from "@/db/admin/products";
import { adminMetadata, requireAdminPage } from "@/lib/admin";
import { LOW_STOCK_THRESHOLD } from "@/lib/products";

import {
  addSizeAction,
  adjustStockAction,
  deleteProductAction,
  moveSizeAction,
  removeSizeAction,
  setProductStatusAction,
  updateProductAction,
} from "../actions";
import { GENDER_OPTIONS, STATUS_OPTIONS } from "../options";
import { MovementList } from "../../inventory/movement-list";

export const generateMetadata = () => adminMetadata({ title: "Edit product" });

export default function ProductPage(props: PageProps<"/admin/products/[id]">) {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <ProductEditor {...props} />
      </Suspense>
    </AdminMain>
  );
}

async function ProductEditor({ params, searchParams }: PageProps<"/admin/products/[id]">) {
  await requireAdminPage();
  const id = Number((await params).id);
  if (!Number.isInteger(id) || id <= 0) notFound();

  const [product, categories, ordered, movements, query] = await Promise.all([
    getProductForEdit(id),
    getCategoryOptions(),
    hasOrders(id),
    listMovements({ productId: id, limit: 20 }),
    searchParams,
  ]);
  if (!product) notFound();

  const totalStock = product.stock.reduce((sum, row) => sum + row.quantity, 0);
  const statusAction = setProductStatusAction.bind(null, id);

  return (
    <>
      <PageHeader
        eyebrow={product.category.name}
        title={product.name}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <ProductStatusBadge status={product.status} />
            <span>{product.sku}</span>
            <span>{totalStock} in stock</span>
            {product.status === "active" && (
              <Link href={`/products/${product.slug}`} className="link" target="_blank">
                View in store
              </Link>
            )}
          </span>
        }
        actions={
          <Link href="/admin/products" className="link-quiet text-label">
            All products
          </Link>
        }
      />
      {query.saved === "1" && (
        <p role="status" className="text-success mb-6 text-sm">
          Changes saved.
        </p>
      )}
      {query.created === "1" && (
        <p role="status" className="text-success mb-6 text-sm">
          Product created{product.status === "draft" ? " as a draft. Publish it when it's ready." : "."}
        </p>
      )}

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_22rem] xl:items-start">
        <div className="stack gap-10">
          <ProductForm
            // Remount after any save or status change so fields never hold stale values.
            key={product.updatedAt.toISOString()}
            mode="edit"
            action={updateProductAction.bind(null, id)}
            categories={categories}
            statuses={STATUS_OPTIONS}
            genders={GENDER_OPTIONS}
            badges={[...PRODUCT_BADGES]}
            initial={{
              name: product.name,
              slug: product.slug,
              sku: product.sku,
              categoryId: product.categoryId,
              gender: product.gender,
              badge: product.badge,
              status: product.status,
              priceCents: product.priceCents,
              color: product.color,
              colorCount: product.colorCount,
              description: product.description,
              details: product.details,
              images: product.images,
            }}
          />

          <Panel title="Stock by size">
            <Table caption={`Stock for ${product.name}`}>
              <thead>
                <tr>
                  <Th>Size</Th>
                  <Th align="right">On hand</Th>
                  <Th>Status</Th>
                  <Th>Update</Th>
                  <Th>
                    <span className="sr-only">Order and remove</span>
                  </Th>
                </tr>
              </thead>
              <tbody>
                {product.stock.map((row, index) => (
                  <tr key={row.size}>
                    <Td className="font-medium">{row.size}</Td>
                    <Td align="right">{row.quantity}</Td>
                    <Td>
                      <StockBadge quantity={row.quantity} threshold={LOW_STOCK_THRESHOLD} />
                    </Td>
                    <Td className="min-w-64">
                      <StockAdjustPanel
                        productId={id}
                        size={row.size}
                        quantity={row.quantity}
                        action={adjustStockAction}
                        label={`${product.name}, ${row.size}`}
                      />
                    </Td>
                    <Td>
                      <span className="inline-flex flex-wrap items-center gap-3">
                        <SizeOrderButtons
                          size={row.size}
                          isFirst={index === 0}
                          isLast={index === product.stock.length - 1}
                          moveUp={moveSizeAction.bind(null, id, row.size, "up")}
                          moveDown={moveSizeAction.bind(null, id, row.size, "down")}
                        />
                        {product.stock.length > 1 && row.quantity === 0 && (
                          <RemoveSizeButton size={row.size} action={removeSizeAction.bind(null, id, row.size)} />
                        )}
                      </span>
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <div className="mt-6">
              <AddSizeForm action={addSizeAction.bind(null, id)} />
            </div>
          </Panel>
        </div>

        <aside className="stack gap-6 xl:sticky xl:top-6">
          <Panel title="Availability">
            <div className="stack items-start gap-4">
              <p className="text-meta">
                {product.status === "active"
                  ? "On sale in the store."
                  : product.status === "draft"
                    ? "Hidden from the store until published."
                    : "Hidden from the store. Order history keeps it."}
              </p>
              {product.status !== "active" && (
                <ActionButton action={statusAction} fields={{ status: "active" }} variant="primary" pendingLabel="Publishing…">
                  Publish
                </ActionButton>
              )}
              {product.status === "active" && (
                <ActionButton action={statusAction} fields={{ status: "draft" }} pendingLabel="Unpublishing…">
                  Unpublish to draft
                </ActionButton>
              )}
              {product.status !== "archived" && (
                <ActionButton action={statusAction} fields={{ status: "archived" }} pendingLabel="Archiving…">
                  Archive
                </ActionButton>
              )}
            </div>
          </Panel>

          <Panel title="Delete">
            {ordered ? (
              <p className="text-meta">
                This product has been ordered, so it&rsquo;s kept for order history. Archive it to stop selling it.
              </p>
            ) : (
              <div className="stack items-start gap-3">
                <p className="text-meta">Permanently removes the product, its sizes and stock history.</p>
                <ActionButton
                  action={deleteProductAction.bind(null, id)}
                  confirmLabel="Delete permanently"
                  pendingLabel="Deleting…"
                >
                  Delete product
                </ActionButton>
              </div>
            )}
          </Panel>

          <Panel title="Recent stock changes">
            <MovementList movements={movements} showProduct={false} />
            <p className="text-meta mt-4">Updated {formatDateTime(product.updatedAt)}</p>
          </Panel>
        </aside>
      </div>
    </>
  );
}
