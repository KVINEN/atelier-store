"use client";

import { useState } from "react";

import { HeartIcon } from "@/components/icons";

export function SaveButton({ productName }: { productName: string }) {
  const [saved, setSaved] = useState(false);

  return (
    <button
      type="button"
      className="btn-icon"
      aria-label={`Save ${productName}`}
      aria-pressed={saved}
      onClick={() => setSaved((value) => !value)}
    >
      <HeartIcon fill={saved ? "currentColor" : "none"} />
    </button>
  );
}
