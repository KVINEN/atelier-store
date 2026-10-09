// Status badges for orders and products, shared by admin lists and detail pages.

import { StatusBadge, type Tone } from "@/components/admin/ui";

type PaymentStatus = "pending" | "paid" | "failed" | "expired";
type FulfillmentStatus = "unfulfilled" | "shipped" | "delivered" | "cancelled";
type ProductStatus = "draft" | "active" | "archived";

export function PaymentBadge({
  status,
  amountTotalCents,
  refundedCents,
}: {
  status: PaymentStatus;
  amountTotalCents: number;
  refundedCents: number;
}) {
  if (status === "paid" && refundedCents > 0) {
    return refundedCents >= amountTotalCents ? (
      <StatusBadge tone="muted">Refunded</StatusBadge>
    ) : (
      <StatusBadge tone="warning">Partly refunded</StatusBadge>
    );
  }
  const map: Record<PaymentStatus, [Tone, string]> = {
    paid: ["success", "Paid"],
    pending: ["neutral", "Awaiting payment"],
    failed: ["danger", "Payment failed"],
    expired: ["muted", "Checkout expired"],
  };
  const [tone, label] = map[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

export function FulfillmentBadge({ status, paid }: { status: FulfillmentStatus; paid: boolean }) {
  if (!paid) return <span className="text-meta">—</span>;
  const map: Record<FulfillmentStatus, [Tone, string]> = {
    unfulfilled: ["warning", "To fulfil"],
    shipped: ["neutral", "Shipped"],
    delivered: ["success", "Delivered"],
    cancelled: ["muted", "Cancelled"],
  };
  const [tone, label] = map[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

export function ProductStatusBadge({ status }: { status: ProductStatus }) {
  const map: Record<ProductStatus, [Tone, string]> = {
    active: ["success", "Active"],
    draft: ["neutral", "Draft"],
    archived: ["muted", "Archived"],
  };
  const [tone, label] = map[status];
  return <StatusBadge tone={tone}>{label}</StatusBadge>;
}

export function StockBadge({ quantity, threshold }: { quantity: number; threshold: number }) {
  if (quantity <= 0) return <StatusBadge tone="danger">Sold out</StatusBadge>;
  if (quantity <= threshold) return <StatusBadge tone="warning">{quantity} left</StatusBadge>;
  return <StatusBadge tone="success">{quantity} in stock</StatusBadge>;
}
