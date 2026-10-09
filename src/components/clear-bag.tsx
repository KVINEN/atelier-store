"use client";

import { useEffect } from "react";

import { clearBag } from "@/lib/shop-store";

/** Empties the bag once an order is confirmed. */
export function ClearBag() {
  useEffect(() => clearBag(), []);
  return null;
}
