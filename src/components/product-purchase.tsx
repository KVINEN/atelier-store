"use client";

import Link from "next/link";
import { useState } from "react";

import { HeartIcon } from "@/components/icons";
import { StockStatus } from "@/components/stock-status";
import type { Variant } from "@/lib/products";

type ProductPurchaseProps = {
  name: string;
  color: string;
  colors: number;
  variants: Variant[];
  oneSize: boolean;
};

// Size selection, stock state and bag/save actions. There's no cart backend
// yet, so "Add to bag" only confirms the selection.
export function ProductPurchase({
  name,
  color,
  colors,
  variants,
  oneSize,
}: ProductPurchaseProps) {
  const [size, setSize] = useState<string | null>(oneSize ? variants[0].size : null);
  const [error, setError] = useState(false);
  const [added, setAdded] = useState(false);
  const [saved, setSaved] = useState(false);

  const total = variants.reduce((sum, variant) => sum + variant.stock, 0);
  const selected = variants.find((variant) => variant.size === size);
  const soldOut = total === 0;

  function addToBag() {
    if (!selected) {
      setError(true);
      return;
    }
    setAdded(true);
  }

  return (
    <div className="stack gap-6">
      <p className="text-sm">
        <span className="text-mute">Colour</span>{" "}
        <span>{color}</span>
        {colors > 1 ? <span className="text-mute"> · {colors} colours available</span> : null}
      </p>

      {oneSize ? null : (
        <fieldset aria-describedby={error ? "size-error" : undefined}>
          <legend className="text-label float-left mb-3">
            Size{selected ? <span className="text-mute"> · {selected.size}</span> : null}
          </legend>
          <Link href="/size-guide" className="link-mute text-meta link float-right">
            Size guide
          </Link>
          <div className="clear-both grid grid-cols-4 gap-2 sm:grid-cols-5">
            {variants.map((variant) => {
              const unavailable = variant.stock === 0;
              return (
                <label
                  key={variant.size}
                  className={`hairline has-focus-visible:outline-ink relative flex min-h-11 items-center justify-center text-sm transition-colors has-focus-visible:outline has-focus-visible:outline-offset-2 ${
                    unavailable
                      ? "text-subtle cursor-not-allowed line-through"
                      : "hover:border-ink has-checked:border-ink has-checked:bg-ink has-checked:text-paper cursor-pointer"
                  }`}
                >
                  <input
                    type="radio"
                    name="size"
                    value={variant.size}
                    disabled={unavailable}
                    checked={size === variant.size}
                    onChange={() => {
                      setSize(variant.size);
                      setError(false);
                      setAdded(false);
                    }}
                    className="sr-only"
                  />
                  {variant.size}
                  {unavailable ? <span className="sr-only"> (sold out)</span> : null}
                </label>
              );
            })}
          </div>
          {error ? (
            <p id="size-error" role="alert" className="text-error mt-3 text-sm">
              Please select a size.
            </p>
          ) : null}
        </fieldset>
      )}

      <div aria-live="polite">
        {selected && !oneSize ? (
          <StockStatus quantity={selected.stock} />
        ) : (
          <StockStatus quantity={total} />
        )}
      </div>

      <div className="stack gap-3">
        {soldOut ? (
          <>
            <button type="button" className="btn btn-primary btn-block" disabled>
              Sold out
            </button>
            <p className="text-meta">
              This piece is currently unavailable.{" "}
              <Link href="/contact" className="link text-ink">
                Contact a client advisor
              </Link>{" "}
              to be notified when it returns.
            </p>
          </>
        ) : (
          <button type="button" className="btn btn-primary btn-block" onClick={addToBag}>
            Add to bag
          </button>
        )}

        <button
          type="button"
          className="btn btn-secondary btn-block"
          aria-pressed={saved}
          onClick={() => setSaved((value) => !value)}
        >
          <HeartIcon width={16} height={16} fill={saved ? "currentColor" : "none"} />
          {saved ? "Saved" : "Save"}
        </button>

        <p role="status" className="text-sm empty:hidden">
          {added && selected
            ? `${name}${oneSize ? "" : `, size ${selected.size},`} added to your bag.`
            : ""}
        </p>
      </div>
    </div>
  );
}
