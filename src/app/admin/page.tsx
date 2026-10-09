import Link from "next/link";
import { Suspense, type ReactNode } from "react";

import { RevenueChart } from "@/components/admin/revenue-chart";
import { FulfillmentBadge, PaymentBadge } from "@/components/admin/status";
import { AdminMain, AdminSkeleton, formatDate, PageHeader, Panel, StatusBadge } from "@/components/admin/ui";
import {
  DASHBOARD_DAYS,
  getCatalogueSummary,
  getDailyRevenue,
  getLowStock,
  getRecentOrders,
  getSalesSummary,
  getTopProducts,
} from "@/db/admin/dashboard";
import { adminMetadata, requireAdminPage } from "@/lib/admin";
import { formatCents } from "@/lib/admin-form";

// The layout's title template only applies to child segments, not this page.
export const generateMetadata = () =>
  adminMetadata({ title: { absolute: "Dashboard | Atelier Admin" } });

export default function AdminHomePage() {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <Dashboard />
      </Suspense>
    </AdminMain>
  );
}

async function Dashboard() {
  const admin = await requireAdminPage();
  const [sales, daily, top, recent, lowStock, catalogue] = await Promise.all([
    getSalesSummary(),
    getDailyRevenue(),
    getTopProducts(),
    getRecentOrders(),
    getLowStock(),
    getCatalogueSummary(),
  ]);
  const averageOrder = sales.orders > 0 ? Math.round(sales.revenue / sales.orders) : 0;
  const previousAverage = sales.previousOrders > 0 ? Math.round(sales.previousRevenue / sales.previousOrders) : 0;
  const period = `last ${DASHBOARD_DAYS} days`;

  return (
    <>
      <PageHeader eyebrow="Admin" title="Dashboard" description={`Welcome back, ${admin.name}. Figures cover the ${period} (UTC), net of refunds.`} />

      <div className="stack gap-8">
        <ul className="grid gap-px sm:grid-cols-2 xl:grid-cols-4" aria-label="Key figures">
          <StatTile label="Revenue" value={formatCents(sales.revenue)} current={sales.revenue} previous={sales.previousRevenue} />
          <StatTile label="Orders" value={String(sales.orders)} current={sales.orders} previous={sales.previousOrders} />
          <StatTile label="Average order" value={formatCents(averageOrder)} current={averageOrder} previous={previousAverage} />
          <li className="hairline stack gap-2 p-5">
            <span className="text-label">To fulfil</span>
            <span className="text-2xl font-semibold tabular-nums">{sales.toFulfil}</span>
            <Link href="/admin/orders?view=to-fulfil" className="link text-meta">
              {sales.toFulfil === 0 ? "All caught up" : sales.toFulfil === 1 ? "1 paid order waiting" : `${sales.toFulfil} paid orders waiting`}
            </Link>
          </li>
        </ul>

        <Panel title={`Revenue, ${period}`}>
          <RevenueChart data={daily} />
        </Panel>

        <div className="grid gap-8 lg:grid-cols-2">
          <Panel
            title="Low stock"
            action={
              <Link href="/admin/inventory?filter=low" className="link text-meta">
                Inventory
              </Link>
            }
          >
            {lowStock.length === 0 ? (
              <p className="text-meta">Every live size is above the low-stock threshold.</p>
            ) : (
              <ul className="hairline-t">
                {lowStock.map((row) => (
                  <li key={`${row.productId}-${row.size}`} className="hairline-b flex items-center justify-between gap-4 py-2.5 text-sm">
                    <span className="min-w-0 truncate">
                      <Link href={`/admin/products/${row.productId}`} className="link-quiet">
                        {row.name}
                      </Link>
                      <span className="text-mute"> · {row.size}</span>
                    </span>
                    {row.quantity === 0 ? (
                      <StatusBadge tone="danger">Sold out</StatusBadge>
                    ) : (
                      <StatusBadge tone="warning">{row.quantity} left</StatusBadge>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title={`Best sellers, ${period}`}>
            {top.length === 0 ? (
              <p className="text-meta">No sales in this period yet.</p>
            ) : (
              <ol className="hairline-t">
                {top.map((product, index) => (
                  <li key={product.productId} className="hairline-b grid grid-cols-[1.5rem_1fr_auto] items-baseline gap-3 py-2.5 text-sm">
                    <span className="text-mute tabular-nums">{index + 1}</span>
                    <Link href={`/admin/products/${product.productId}`} className="link-quiet min-w-0 truncate">
                      {product.name}
                    </Link>
                    <span className="tabular-nums">
                      {product.units} sold <span className="text-mute">· {formatCents(product.revenue)}</span>
                    </span>
                  </li>
                ))}
              </ol>
            )}
          </Panel>
        </div>

        <div className="grid gap-8 lg:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
          <Panel
            title="Recent orders"
            action={
              <Link href="/admin/orders?view=all" className="link text-meta">
                All orders
              </Link>
            }
          >
            {recent.length === 0 ? (
              <p className="text-meta">No orders yet.</p>
            ) : (
              <ul className="hairline-t">
                {recent.map((order) => (
                  <li key={order.id} className="hairline-b grid gap-x-4 gap-y-1 py-3 text-sm sm:grid-cols-[1fr_auto_auto]">
                    <span className="min-w-0">
                      <Link href={`/admin/orders/${order.id}`} className="link-quiet font-medium">
                        {order.customerName ?? order.email ?? "Guest"}
                      </Link>
                      <span className="text-meta block">{formatDate(order.createdAt)}</span>
                    </span>
                    <span className="flex flex-wrap items-center gap-x-4">
                      <PaymentBadge status={order.status} amountTotalCents={order.amountTotalCents} refundedCents={order.refundedCents} />
                      <FulfillmentBadge status={order.fulfillmentStatus} paid={order.status === "paid"} />
                    </span>
                    <span className="tabular-nums sm:text-right">{formatCents(order.amountTotalCents)}</span>
                  </li>
                ))}
              </ul>
            )}
          </Panel>

          <Panel title="Catalogue">
            <dl className="grid grid-cols-[1fr_auto] gap-x-4 gap-y-2.5 text-sm">
              <Figure label="Active products" value={catalogue.active} href="/admin/products?status=active" />
              <Figure label="Sold out (active)" value={catalogue.soldOut} href="/admin/inventory?filter=out" />
              <Figure label="Drafts" value={catalogue.draft} href="/admin/products?status=draft" />
              <Figure label="Archived" value={catalogue.archived} href="/admin/products?status=archived" />
              <Figure label={`New customers, ${period}`} value={sales.newCustomers} href="/admin/customers" />
              <Figure label={`Refunded, ${period}`} value={formatCents(sales.refunds)} href="/admin/orders?view=refunded" />
            </dl>
          </Panel>
        </div>
      </div>
    </>
  );
}

function StatTile({ label, value, current, previous }: { label: string; value: string; current: number; previous: number }) {
  return (
    <li className="hairline stack gap-2 p-5">
      <span className="text-label">{label}</span>
      <span className="text-2xl font-semibold tabular-nums">{value}</span>
      <Delta current={current} previous={previous} />
    </li>
  );
}

/** Change vs the previous period: arrow and words carry the direction, colour reinforces it. */
function Delta({ current, previous }: { current: number; previous: number }) {
  if (previous === 0) {
    return <span className="text-meta">{current === 0 ? "No sales yet" : "None in the previous period"}</span>;
  }
  const change = Math.round(((current - previous) / previous) * 100);
  if (change === 0) return <span className="text-meta">Same as the previous {DASHBOARD_DAYS} days</span>;
  const up = change > 0;
  return (
    <span className={`text-sm ${up ? "text-success" : "text-sale"}`}>
      <span aria-hidden="true">{up ? "▲" : "▼"} </span>
      {up ? "Up" : "Down"} {Math.abs(change)}%<span className="text-mute"> vs previous {DASHBOARD_DAYS} days</span>
    </span>
  );
}

function Figure({ label, value, href }: { label: string; value: ReactNode; href: string }) {
  return (
    <>
      <dt className="text-mute">{label}</dt>
      <dd className="text-right tabular-nums">
        <Link href={href} className="link-quiet">
          {value}
        </Link>
      </dd>
    </>
  );
}
