"use client";

import { HeartIcon } from "@/components/icons";
import { toggleSaved, useIsSaved, type ProductSnapshot } from "@/lib/shop-store";

export function SaveButton({ item }: { item: ProductSnapshot }) {
  const saved = useIsSaved(item.slug);

  return (
    <button
      type="button"
      className="btn-icon"
      aria-label={`Save ${item.name}`}
      aria-pressed={saved}
      onClick={() => toggleSaved(item)}
    >
      <HeartIcon fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
