"use client";

// Bag and saved items, kept in localStorage until there's a cart backend.
// Entries carry a display snapshot so the bag and saved pages render without
// a catalogue fetch.

import { useSyncExternalStore } from "react";

import { MAX_QUANTITY, type ProductSnapshot } from "@/lib/products";

export type { ProductSnapshot };

export type BagLine = ProductSnapshot & { size: string; quantity: number };

type ShopState = { bag: BagLine[]; saved: ProductSnapshot[] };

const STORAGE_KEY = "atelier:shop";
const EMPTY: ShopState = { bag: [], saved: [] };

const listeners = new Set<() => void>();
let state: ShopState | null = null;

function read(): ShopState {
  if (state) return state;
  try {
    const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "null");
    state = {
      bag: Array.isArray(parsed?.bag) ? parsed.bag : [],
      saved: Array.isArray(parsed?.saved) ? parsed.saved : [],
    };
  } catch {
    state = EMPTY;
  }
  return state;
}

function write(next: ShopState) {
  state = next;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    // Storage full or blocked: keep the in-memory state for this tab.
  }
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  // Pick up changes made in other tabs.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== STORAGE_KEY) return;
    state = null;
    listener();
  };
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

function useShopState() {
  return useSyncExternalStore(subscribe, read, () => EMPTY);
}

const sameLine = (line: BagLine, slug: string, size: string) =>
  line.slug === slug && line.size === size;

export function addToBag(item: ProductSnapshot, size: string) {
  const { bag, saved } = read();
  const existing = bag.find((line) => sameLine(line, item.slug, size));
  write({
    saved,
    bag: existing
      ? bag.map((line) =>
          line === existing
            ? { ...line, quantity: Math.min(line.quantity + 1, MAX_QUANTITY) }
            : line,
        )
      : [...bag, { ...item, size, quantity: 1 }],
  });
}

export function setBagQuantity(slug: string, size: string, quantity: number) {
  const { bag, saved } = read();
  write({
    saved,
    bag:
      quantity <= 0
        ? bag.filter((line) => !sameLine(line, slug, size))
        : bag.map((line) =>
            sameLine(line, slug, size)
              ? { ...line, quantity: Math.min(quantity, MAX_QUANTITY) }
              : line,
          ),
  });
}

export function clearBag() {
  write({ ...read(), bag: [] });
}

export function toggleSaved(item: ProductSnapshot) {
  const { bag, saved } = read();
  write({
    bag,
    saved: saved.some((entry) => entry.slug === item.slug)
      ? saved.filter((entry) => entry.slug !== item.slug)
      : [...saved, item],
  });
}

const noopSubscribe = () => () => {};

/** False during server render and hydration, before stored items are readable. */
export function useShopReady() {
  return useSyncExternalStore(noopSubscribe, () => true, () => false);
}

export function useBag() {
  const { bag } = useShopState();
  return {
    lines: bag,
    count: bag.reduce((sum, line) => sum + line.quantity, 0),
    subtotal: bag.reduce((sum, line) => sum + line.price * line.quantity, 0),
  };
}

export function useSaved() {
  return useShopState().saved;
}

export function useIsSaved(slug: string) {
  return useShopState().saved.some((entry) => entry.slug === slug);
}
