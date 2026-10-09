"use client";

import Image from "next/image";
import Link from "next/link";

import { OrderSummary } from "@/components/order-summary";
import { formatPrice, MAX_QUANTITY, ONE_SIZE } from "@/lib/products";
import { setBagQuantity, useBag, useShopReady } from "@/lib/shop-store";

// Bag lines, quantities and an order summary leading to checkout.
export function BagView() {
  const ready = useShopReady();
  const { lines, count, subtotal } = useBag();

  if (!ready) return <p className="text-meta" aria-busy="true">Loading your bag…</p>;

  if (lines.length === 0) {
    return (
      <div className="hairline-t stack items-start gap-5 pt-8">
        <p className="text-ink-soft">Your bag is empty.</p>
        <div className="cluster gap-3">
          <Link href="/new-in" className="btn btn-primary">
            Shop new arrivals
          </Link>
          <Link href="/wishlist" className="btn btn-secondary">
            View saved items
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)] gap-10 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-16">
      <ul className="hairline-t">
        {lines.map((line) => {
          const href = `/products/${line.slug}`;
          return (
            <li key={`${line.slug}:${line.size}`} className="hairline-b flex gap-4 py-6 sm:gap-6">
              <Link href={href} className="media-product w-24 shrink-0 sm:w-32" tabIndex={-1} aria-hidden="true">
                <Image src={line.image.src} alt={line.image.alt} fill sizes="8rem" />
              </Link>
              <div className="flex min-w-0 flex-1 flex-col gap-1">
                <div className="flex items-start justify-between gap-4">
                  <h2 className="text-product">
                    <Link href={href} className="link-quiet">
                      {line.name}
                    </Link>
                  </h2>
                  <p className="text-price shrink-0">
                    {formatPrice(line.price * line.quantity)}
                  </p>
                </div>
                <p className="text-meta">
                  {line.color}
                  {line.size === ONE_SIZE ? "" : ` · Size ${line.size}`}
                </p>
                <div className="mt-auto flex flex-wrap items-center justify-between gap-4 pt-4">
                  <QuantityStepper
                    name={line.name}
                    quantity={line.quantity}
                    onChange={(quantity) => setBagQuantity(line.slug, line.size, quantity)}
                  />
                  <button
                    type="button"
                    className="link-mute text-meta link"
                    onClick={() => setBagQuantity(line.slug, line.size, 0)}
                  >
                    Remove<span className="sr-only"> {line.name}</span>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      <OrderSummary subtotal={subtotal} count={count} total={subtotal}>
        <Link href="/checkout" className="btn btn-primary btn-block">
          Checkout
        </Link>
        <p className="text-meta">
          Secure payment by card or wallet. Questions?{" "}
          <Link href="/contact" className="link text-ink">
            Contact a client advisor
          </Link>
          .
        </p>
      </OrderSummary>
    </div>
  );
}

function QuantityStepper({
  name,
  quantity,
  onChange,
}: {
  name: string;
  quantity: number;
  onChange: (quantity: number) => void;
}) {
  return (
    <div className="hairline inline-flex items-center" role="group" aria-label={`Quantity of ${name}`}>
      <button
        type="button"
        className="btn-icon size-9"
        aria-label="Decrease quantity"
        onClick={() => onChange(quantity - 1)}
      >
        −
      </button>
      <span className="w-6 text-center text-sm tabular-nums" aria-live="polite">
        {quantity}
      </span>
      <button
        type="button"
        className="btn-icon size-9"
        aria-label="Increase quantity"
        disabled={quantity >= MAX_QUANTITY}
        onClick={() => onChange(quantity + 1)}
      >
        +
      </button>
    </div>
  );
}
