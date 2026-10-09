import Link from "next/link";
import { Suspense } from "react";

import {
  AdminMain,
  AdminSkeleton,
  EmptyState,
  formatDate,
  PageHeader,
  Pagination,
  SearchForm,
  StatusBadge,
  Table,
  Td,
  Th,
} from "@/components/admin/ui";
import { listCustomers } from "@/db/admin/customers";
import { adminMetadata, requireAdminPage } from "@/lib/admin";
import { formatCents } from "@/lib/admin-form";

export const generateMetadata = () => adminMetadata({ title: "Customers" });

export default function CustomersPage(props: PageProps<"/admin/customers">) {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <Customers {...props} />
      </Suspense>
    </AdminMain>
  );
}

async function Customers({ searchParams }: PageProps<"/admin/customers">) {
  await requireAdminPage();
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim().slice(0, 100) : "";
  const page = Math.max(1, Number(params.page) || 1);
  const { rows, hasMore } = await listCustomers({ q: q || undefined, page });

  return (
    <>
      <PageHeader
        eyebrow="Sales"
        title="Customers"
        description="Registered accounts. Guest orders appear under Orders. Admin access is granted from the command line only."
      />
      <SearchForm label="Search customers" placeholder="Name or email" defaultValue={q} />

      {rows.length === 0 ? (
        <EmptyState title="No customers match" />
      ) : (
        <>
          <Table caption="Registered customers, newest first">
            <thead>
              <tr>
                <Th>Customer</Th>
                <Th>Joined</Th>
                <Th align="right">Paid orders</Th>
                <Th align="right">Spent</Th>
                <Th>Last order</Th>
              </tr>
            </thead>
            <tbody>
              {rows.map((customer) => (
                <tr key={customer.id}>
                  <Td>
                    <p className="font-medium">
                      {customer.name}
                      {customer.role === "admin" && (
                        <span className="ml-3 inline-block align-middle">
                          <StatusBadge tone="neutral">Admin</StatusBadge>
                        </span>
                      )}
                    </p>
                    <p className="text-meta">{customer.email}</p>
                  </Td>
                  <Td className="text-meta whitespace-nowrap">{formatDate(customer.createdAt)}</Td>
                  <Td align="right">
                    {customer.orders > 0 ? (
                      <Link href={`/admin/orders?view=all&q=${encodeURIComponent(customer.email)}`} className="link">
                        {customer.orders}
                      </Link>
                    ) : (
                      0
                    )}
                  </Td>
                  <Td align="right">{formatCents(customer.spentCents)}</Td>
                  <Td className="text-meta whitespace-nowrap">{formatDate(customer.lastOrderAt)}</Td>
                </tr>
              ))}
            </tbody>
          </Table>
          <Pagination
            page={page}
            hasMore={hasMore}
            href={(next) => `/admin/customers?${new URLSearchParams({ ...(q ? { q } : {}), page: String(next) })}`}
          />
        </>
      )}
    </>
  );
}
