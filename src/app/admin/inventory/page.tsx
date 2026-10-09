import Link from "next/link";
import { Suspense } from "react";

import { ProductStatusBadge, StockBadge } from "@/components/admin/status";
import { StockAdjustPanel } from "@/components/admin/stock-controls";
import {
  AdminMain,
  AdminSkeleton,
  EmptyState,
  FilterTabs,
  PageHeader,
  Panel,
  SearchForm,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { listInventory, listMovements, type InventoryFilter } from "@/db/admin/inventory";
import { adminMetadata, requireAdminPage } from "@/lib/admin";
import { LOW_STOCK_THRESHOLD } from "@/lib/products";

import { adjustStockAction } from "../products/actions";
import { MovementList } from "./movement-list";

export const generateMetadata = () => adminMetadata({ title: "Inventory" });

const FILTERS: { value: InventoryFilter; label: string }[] = [
  { value: "low", label: `Low (${LOW_STOCK_THRESHOLD} or fewer)` },
  { value: "out", label: "Sold out" },
  { value: "all", label: "All sizes" },
];

export default function InventoryPage(props: PageProps<"/admin/inventory">) {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <Inventory {...props} />
      </Suspense>
    </AdminMain>
  );
}

async function Inventory({ searchParams }: PageProps<"/admin/inventory">) {
  await requireAdminPage();
  const params = await searchParams;
  const filter = FILTERS.find((option) => option.value === params.filter)?.value ?? "low";
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";

  const [rows, movements] = await Promise.all([
    listInventory({ filter, q: q || undefined }),
    listMovements({ limit: 30 }),
  ]);

  return (
    <>
      <PageHeader
        eyebrow="Catalogue"
        title="Inventory"
        description="Stock per size. Changes are logged and applied relative to the current level, so they never overwrite a sale that lands meanwhile."
      />

      <div className="grid gap-10 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <div>
          <FilterTabs
            label="Stock level"
            current={filter}
            options={FILTERS}
            href={(value) => `/admin/inventory?filter=${value}${q ? `&q=${encodeURIComponent(q)}` : ""}`}
          />
          <SearchForm label="Search inventory" placeholder="Product name or SKU" defaultValue={q} hidden={{ filter }} />

          {rows.length === 0 ? (
            <EmptyState title={filter === "all" ? "No stock found" : "Nothing needs attention"}>
              {filter !== "all" && "Every size is above the low-stock threshold."}
            </EmptyState>
          ) : (
            <Table caption="Stock by product and size">
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Size</Th>
                  <Th align="right">On hand</Th>
                  <Th>Level</Th>
                  <Th>Update</Th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={`${row.productId}-${row.size}`}>
                    <Td>
                      <Link href={`/admin/products/${row.productId}`} className="link-quiet font-medium">
                        {row.name}
                      </Link>
                      <p className="text-meta inline-flex flex-wrap gap-x-3">
                        <span>{row.sku}</span>
                        {row.status !== "active" && <ProductStatusBadge status={row.status} />}
                      </p>
                    </Td>
                    <Td>{row.size}</Td>
                    <Td align="right">{row.quantity}</Td>
                    <Td>
                      <StockBadge quantity={row.quantity} threshold={LOW_STOCK_THRESHOLD} />
                    </Td>
                    <Td className="min-w-64">
                      <StockAdjustPanel
                        productId={row.productId}
                        size={row.size}
                        quantity={row.quantity}
                        action={adjustStockAction}
                        label={`${row.name}, ${row.size}`}
                      />
                    </Td>
                  </tr>
                ))}
              </tbody>
            </Table>
          )}
        </div>

        <Panel title="Stock log" className="xl:sticky xl:top-6">
          <MovementList movements={movements} showProduct />
        </Panel>
      </div>
    </>
  );
}
