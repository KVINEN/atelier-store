// Product types and client-safe helpers. Product data lives in the database;
// server code reads it through `@/db/queries/catalog`.

import type { ImageAsset } from "@/lib/images";

export type Variant = { size: string; stock: number };

export type ProductCategory = { slug: string; name: string; href: string };

export type Product = {
  slug: string;
  sku: string;
  name: string;
  category: ProductCategory;
  /** Whole currency units. */
  price: number;
  color: string;
  colors: number;
  badge?: "New" | "Exclusive" | "Limited";
  description: string;
  details: string[];
  /** One entry per size; one-size items have a single "One size" variant. */
  variants: Variant[];
  /** First image is the listing image; the rest are gallery detail shots. */
  images: ImageAsset[];
};

export type StockState = "in-stock" | "low-stock" | "sold-out";

export const LOW_STOCK_THRESHOLD = 3;
export const ONE_SIZE = "One size";

export function stockState(quantity: number): StockState {
  if (quantity <= 0) return "sold-out";
  if (quantity <= LOW_STOCK_THRESHOLD) return "low-stock";
  return "in-stock";
}

export function totalStock(product: Product) {
  return product.variants.reduce((sum, variant) => sum + variant.stock, 0);
}

export function isOneSize(product: Product) {
  return product.variants.length === 1 && product.variants[0].size === ONE_SIZE;
}

const priceFormat = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

export function formatPrice(amount: number) {
  return priceFormat.format(amount);
}
