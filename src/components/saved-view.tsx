"use client";

import Image from "next/image";
import Link from "next/link";

import { formatPrice } from "@/lib/products";
import { toggleSaved, useSaved, useShopReady } from "@/lib/shop-store";

export function SavedView() {
  const ready = useShopReady();
  const saved = useSaved();

  if (!ready) return <p className="text-meta" aria-busy="true">Loading saved items…</p>;

  if (saved.length === 0) {
    return (
      <div className="hairline-t stack items-start gap-5 pt-8">
        <p className="text-ink-soft">
          Nothing saved yet. Tap the heart on any piece to keep it here.
        </p>
        <Link href="/new-in" className="btn btn-primary">
          Shop new arrivals
        </Link>
      </div>
    );
  }

  return (
    <>
      <p className="text-meta mb-6">
        {saved.length} {saved.length === 1 ? "piece" : "pieces"}
      </p>
      <ul className="grid-products bleed md:mx-0">
        {saved.map((item) => {
          const href = `/products/${item.slug}`;
          return (
            <li key={item.slug}>
              <Link href={href} className="media-product block" tabIndex={-1} aria-hidden="true">
                <Image
                  src={item.image.src}
                  alt={item.image.alt}
                  fill
                  sizes="(min-width: 80rem) 25vw, (min-width: 48rem) 33vw, 50vw"
                />
              </Link>
              <div className="mt-3 flex flex-col gap-1 px-3 md:px-0">
                <h2 className="text-product">
                  <Link href={href} className="link-quiet">
                    {item.name}
                  </Link>
                </h2>
                <p className="text-price">{formatPrice(item.price)}</p>
                <div className="cluster mt-2 gap-4">
                  <Link href={href} className="text-meta link text-ink">
                    Choose size
                  </Link>
                  <button
                    type="button"
                    className="text-meta link-mute link"
                    onClick={() => toggleSaved(item)}
                  >
                    Remove<span className="sr-only"> {item.name}</span>
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
