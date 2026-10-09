import Link from "next/link";
import { Suspense } from "react";

import { FulfillmentBadge, PaymentBadge } from "@/components/admin/status";
import {
  AdminMain,
  AdminSkeleton,
  EmptyState,
  FilterTabs,
  formatDate,
  PageHeader,
  Pagination,
  SearchForm,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { listOrders, ORDER_VIEWS, type OrderView } from "@/db/admin/orders";
import { adminMetadata, requireAdminPage } from "@/lib/admin";
import { formatCents } from "@/lib/admin-form";

export const generateMetadata = () => adminMetadata({ title: "Orders" });

export default function OrdersPage(props: PageProps<"/admin/orders">) {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <Orders {...props} />
      </Suspense>
    </AdminMain>
  );
}

async function Orders({ searchParams }: PageProps<"/admin/orders">) {
  await requireAdminPage();
  const params = await searchParams;
  const view = ORDER_VIEWS.find((option) => option.value === params.view)?.value ?? "to-fulfil";
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(params.page) || 1);

  const { rows, hasMore } = await listOrders({ view, q: q || undefined, page });

  const href = (next: { view?: OrderView; page?: number }) => {
    const query = new URLSearchParams({ view: next.view ?? view });
    if (q) query.set("q", q);
    if (next.page && next.page > 1) query.set("page", String(next.page));
    return `/admin/orders?${query}`;
  };

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Orders"
        description="Payments are recorded by Stripe. Fulfil paid orders here: ship, deliver, refund or cancel."
      />
      <FilterTabs label="Order view" current={view} options={ORDER_VIEWS} href={(value) => href({ view: value as OrderView })} />
      <SearchForm label="Search orders" placeholder="Email, name or order ID" defaultValue={q} hidden={{ view }} />

      {rows.length === 0 ? (
        <EmptyState title={view === "to-fulfil" && !q ? "All caught up" : "No orders match"}>
          {view === "to-fulfil" && !q ? "Every paid order has been shipped or cancelled." : null}
        </EmptyState>
      ) : (
        <>
          <Table caption="Orders, newest first">
            <thead>
              <tr>
                <Th>Order</Th>
                <Th>Customer</Th>
                <Th>Date</Th>
                <Th align="right">Items</Th>
                <Th align="right">Total</Th>
                <Th>Payment</Th>
                <Th>Fulfilment</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((order) => (
                <tr key={order.id} className="hover:bg-surface">
                  <Td>
                    <Link href={`/admin/orders/${order.id}`} className="link-quiet font-medium font-mono text-xs uppercase">
                      #{order.id.slice(0, 8)}
                    </Link>
                  </Td>
                  <Td>
                    <p>{order.customerName ?? "—"}</p>
                    <p className="text-meta">{order.email ?? "No email"}</p>
                  </Td>
                  <Td className="text-meta whitespace-nowrap">{formatDate(order.paidAt ?? order.createdAt)}</Td>
                  <Td align="right">{order.items}</Td>
                  <Td align="right">
                    {formatCents(order.amountTotalCents)}
                    {order.refundedCents > 0 && <p className="text-meta">−{formatCents(order.refundedCents)}</p>}
                  </Td>
                  <Td>
                    <PaymentBadge status={order.status} amountTotalCents={order.amountTotalCents} refundedCents={order.refundedCents} />
                  </Td>
                  <Td>
                    <FulfillmentBadge status={order.fulfillmentStatus} paid={order.status === "paid"} />
                  </Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination page={page} hasMore={hasMore} href={(next) => href({ page: next })} />
        </>
      )}
    </>
  );
}
