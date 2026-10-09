import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { ActionButton } from "@/components/admin/form-controls";
import { CancelForm, NoteForm, RefundForm, ShipForm } from "@/components/admin/order-forms";
import { FulfillmentBadge, PaymentBadge } from "@/components/admin/status";
import { AdminMain, AdminSkeleton, formatDateTime, PageHeader, Panel, Table, Td, Th } from "@/components/admin/ui";
import { getOrder } from "@/db/admin/orders";
import { adminMetadata, requireAdminPage } from "@/lib/admin";
import { formatCents } from "@/lib/admin-form";
import { stripePaymentUrl } from "@/lib/stripe";

import {
  cancelOrderAction,
  deliverOrderAction,
  refundOrderAction,
  restockOrderAction,
  saveNoteAction,
  shipOrderAction,
} from "../actions";

export const generateMetadata = () => adminMetadata({ title: "Order" });

export default function OrderPage(props: PageProps<"/admin/orders/[id]">) {
  return (
    <AdminMain>
      <Suspense fallback={<AdminSkeleton />}>
        <OrderDetail {...props} />
      </Suspense>
    </AdminMain>
  );
}

async function OrderDetail({ params }: PageProps<"/admin/orders/[id]">) {
  await requireAdminPage();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) notFound();

  const order = await getOrder(id);
  if (!order) notFound();

  const paid = order.status === "paid";
  const remaining = order.amountTotalCents - order.refundedCents;
  const subtotal = order.items.reduce((sum, item) => sum + item.unitPriceCents * item.quantity, 0);
  const address = order.shipping?.address;
  const timeline = [
    { label: "Checkout started", at: order.createdAt },
    { label: "Paid", at: order.paidAt },
    { label: `Shipped${order.carrier ? ` with ${order.carrier}` : ""}`, at: order.shippedAt },
    { label: "Delivered", at: order.deliveredAt },
    { label: "Cancelled", at: order.cancelledAt },
    { label: "Items returned to stock", at: order.restockedAt },
  ].filter((event) => event.at);

  return (
    <>
      <PageHeader
        eyebrow="Order"
        title={`#${order.id.slice(0, 8).toUpperCase()}`}
        description={
          <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-1">
            <PaymentBadge status={order.status} amountTotalCents={order.amountTotalCents} refundedCents={order.refundedCents} />
            <FulfillmentBadge status={order.fulfillmentStatus} paid={paid} />
            <span>{formatDateTime(order.paidAt ?? order.createdAt)}</span>
          </span>
        }
        actions={
          <Link href="/admin/orders" className="link-quiet text-label">
            All orders
          </Link>
        }
      />

      <div className="grid gap-8 xl:grid-cols-[minmax(0,1fr)_24rem] xl:items-start">
        <div className="stack gap-8">
          <Panel title="Items">
            <Table caption="Items in this order">
              <thead>
                <tr>
                  <Th>Product</Th>
                  <Th>Size</Th>
                  <Th align="right">Qty</Th>
                  <Th align="right">Price</Th>
                  <Th align="right">Total</Th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={`${item.productId}-${item.size}`}>
                    <Td>
                      <Link href={`/admin/products/${item.productId}`} className="link-quiet font-medium">
                        {item.name}
                      </Link>
                    </Td>
                    <Td>{item.size}</Td>
                    <Td align="right">{item.quantity}</Td>
                    <Td align="right">{formatCents(item.unitPriceCents)}</Td>
                    <Td align="right">{formatCents(item.unitPriceCents * item.quantity)}</Td>
                  </tr>
                ))}
              </tbody>
            </Table>
            <dl className="mt-4 ml-auto grid max-w-xs grid-cols-[1fr_auto] gap-x-6 gap-y-1 text-sm tabular-nums">
              <dt className="text-mute">Items</dt>
              <dd className="text-right">{formatCents(subtotal)}</dd>
              {order.amountTotalCents !== subtotal && (
                <>
                  <dt className="text-mute">Shipping, tax and adjustments</dt>
                  <dd className="text-right">{formatCents(order.amountTotalCents - subtotal)}</dd>
                </>
              )}
              <dt className="font-medium">Charged</dt>
              <dd className="text-right font-medium">{formatCents(order.amountTotalCents)}</dd>
              {order.refundedCents > 0 && (
                <>
                  <dt className="text-sale">Refunded</dt>
                  <dd className="text-sale text-right">−{formatCents(order.refundedCents)}</dd>
                  <dt className="font-medium">Net</dt>
                  <dd className="text-right font-medium">{formatCents(remaining)}</dd>
                </>
              )}
            </dl>
          </Panel>

          {paid && (
            <Panel title="Fulfilment">
              {order.fulfillmentStatus === "unfulfilled" && (
                <ShipForm action={shipOrderAction.bind(null, order.id)} carrier={null} trackingNumber={null} isUpdate={false} />
              )}
              {order.fulfillmentStatus === "shipped" && (
                <div className="stack gap-6">
                  <p className="text-sm">
                    Shipped with {order.carrier}, tracking <span className="font-mono">{order.trackingNumber}</span>.
                  </p>
                  <ActionButton action={deliverOrderAction.bind(null, order.id)} variant="primary" pendingLabel="Saving…">
                    Mark as delivered
                  </ActionButton>
                  <ShipForm
                    action={shipOrderAction.bind(null, order.id)}
                    carrier={order.carrier}
                    trackingNumber={order.trackingNumber}
                    isUpdate
                  />
                </div>
              )}
              {order.fulfillmentStatus === "delivered" && (
                <p className="text-sm">
                  Delivered {formatDateTime(order.deliveredAt)}. Shipped with {order.carrier}, tracking{" "}
                  <span className="font-mono">{order.trackingNumber}</span>.
                </p>
              )}
              {order.fulfillmentStatus === "cancelled" && (
                <p className="text-sm">Cancelled {formatDateTime(order.cancelledAt)}.</p>
              )}
            </Panel>
          )}

          {paid && remaining > 0 && order.fulfillmentStatus !== "unfulfilled" && (
            <Panel title="Refund">
              <RefundForm action={refundOrderAction.bind(null, order.id)} remainingCents={remaining} />
            </Panel>
          )}

          {paid && order.fulfillmentStatus === "unfulfilled" && (
            <Panel title="Cancel or refund">
              <div className="grid gap-8 lg:grid-cols-2">
                <div className="stack gap-3">
                  <h3 className="text-label">Cancel the order</h3>
                  <CancelForm action={cancelOrderAction.bind(null, order.id)} remainingCents={remaining} />
                </div>
                {remaining > 0 && (
                  <div className="stack gap-3">
                    <h3 className="text-label">Partial refund</h3>
                    <RefundForm action={refundOrderAction.bind(null, order.id)} remainingCents={remaining} />
                  </div>
                )}
              </div>
            </Panel>
          )}

          {!paid && (
            <Panel>
              <p className="text-meta">
                {order.status === "pending"
                  ? "The customer opened checkout but hasn't paid. Stock isn't held; the order completes or expires on its own."
                  : "This checkout didn't complete. No payment was taken and nothing needs doing."}
              </p>
            </Panel>
          )}
        </div>

        <aside className="stack gap-6 xl:sticky xl:top-6">
          <Panel title="Customer">
            <div className="stack gap-1 text-sm">
              {order.shipping?.name && <p className="font-medium">{order.shipping.name}</p>}
              {order.email ? (
                <a href={`mailto:${order.email}`} className="link">
                  {order.email}
                </a>
              ) : (
                <p className="text-mute">No email</p>
              )}
              <p className="text-meta">
                {order.account ? (
                  <Link href={`/admin/customers?q=${encodeURIComponent(order.account.email)}`} className="link">
                    Registered account
                  </Link>
                ) : (
                  "Guest checkout"
                )}
              </p>
            </div>
            {address && (
              <address className="text-sm mt-4 not-italic">
                {[address.line1, address.line2, [address.city, address.state, address.postalCode].filter(Boolean).join(", "), address.country]
                  .filter(Boolean)
                  .map((line) => (
                    <span key={line} className="block">
                      {line}
                    </span>
                  ))}
              </address>
            )}
          </Panel>

          <Panel title="Timeline">
            <ol className="stack gap-3 text-sm">
              {timeline.map((event) => (
                <li key={event.label} className="grid gap-0.5">
                  <span>{event.label}</span>
                  <span className="text-meta">{formatDateTime(event.at)}</span>
                </li>
              ))}
            </ol>
          </Panel>

          {paid && (
            <Panel title="Stock">
              {order.restockedAt ? (
                <p className="text-meta">Items were returned to stock {formatDateTime(order.restockedAt)}.</p>
              ) : (
                <div className="stack items-start gap-3">
                  <p className="text-meta">
                    Stock was reduced when this order was paid. Return the items to stock if they came back in sellable condition.
                  </p>
                  <ActionButton action={restockOrderAction.bind(null, order.id)} confirmLabel="Return to stock" pendingLabel="Restocking…">
                    Return items to stock
                  </ActionButton>
                </div>
              )}
            </Panel>
          )}

          <Panel title="Notes">
            <NoteForm action={saveNoteAction.bind(null, order.id)} note={order.adminNote} />
          </Panel>

          <Panel title="Payment">
            <div className="stack gap-2 text-sm">
              {order.stripePaymentIntentId ? (
                <a href={stripePaymentUrl(order.stripePaymentIntentId)} className="link" target="_blank" rel="noreferrer">
                  View payment in Stripe
                </a>
              ) : (
                <p className="text-meta">No payment recorded yet.</p>
              )}
              <p className="text-meta break-all">Order {order.id}</p>
            </div>
          </Panel>
        </aside>
      </div>
    </>
  );
}
