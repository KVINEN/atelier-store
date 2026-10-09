import { stockState, type StockState } from "@/lib/products";

const dotColor: Record<StockState, string> = {
  "in-stock": "bg-success",
  "low-stock": "bg-sale",
  "sold-out": "bg-subtle",
};

export function stockLabel(quantity: number) {
  const state = stockState(quantity);
  if (state === "sold-out") return "Sold out";
  if (state === "low-stock") return `Only ${quantity} left`;
  return "In stock";
}

// Dot + label used on product cards and the product page.
export function StockStatus({
  quantity,
  className = "",
}: {
  quantity: number;
  className?: string;
}) {
  const state = stockState(quantity);

  return (
    <p className={`text-meta inline-flex items-center gap-2 ${className}`}>
      <span aria-hidden="true" className={`size-1.5 rounded-full ${dotColor[state]}`} />
      <span className={state === "low-stock" ? "text-sale" : undefined}>
        {stockLabel(quantity)}
      </span>
    </p>
  );
}
