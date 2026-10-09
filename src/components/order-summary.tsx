import type { ReactNode } from "react";

import { formatPrice } from "@/lib/products";

export type SummaryItem = { key: string; name: string; detail?: string; quantity: number; amount: number };

// Order summary panel shared by the bag, checkout and confirmation pages.
// Amounts are whole currency units.
export function OrderSummary({
  items,
  subtotal,
  count,
  total,
  children,
}: {
  items?: SummaryItem[];
  subtotal: number;
  count: number;
  total: number;
  children?: ReactNode;
}) {
  return (
    <aside aria-labelledby="summary-title" className="bg-surface stack h-fit gap-5 p-6">
      <h2 id="summary-title" className="text-label">
        Order summary
      </h2>
      {items?.length ? (
        <ul className="stack hairline-b gap-3 pb-5 text-sm">
          {items.map((item) => (
            <li key={item.key} className="flex justify-between gap-4">
              <span className="min-w-0">
                {item.name}
                <span className="text-meta block">
                  {[item.detail, `Qty ${item.quantity}`].filter(Boolean).join(" · ")}
                </span>
              </span>
              <span className="shrink-0 tabular-nums">{formatPrice(item.amount)}</span>
            </li>
          ))}
        </ul>
      ) : null}
      <dl className="stack gap-2 text-sm">
        <div className="flex justify-between gap-4">
          <dt>
            Subtotal ({count} {count === 1 ? "item" : "items"})
          </dt>
          <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
        </div>
        <div className="flex justify-between gap-4">
          <dt>Express shipping</dt>
          <dd>Complimentary</dd>
        </div>
      </dl>
      <div className="hairline-t flex justify-between pt-4 font-medium">
        <span>Total</span>
        <span className="tabular-nums">{formatPrice(total)}</span>
      </div>
      {children}
    </aside>
  );
}
