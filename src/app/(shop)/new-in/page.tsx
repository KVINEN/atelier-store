import type { Metadata } from "next";

import { ProductListing } from "@/components/product-listing";
import { getLatestProducts } from "@/db/queries/catalog";

export const metadata: Metadata = {
  title: "New arrivals",
  description:
    "The latest ready-to-wear, handbags, shoes and jewellery, newly arrived at Atelier.",
};

export default async function NewInPage() {
  const products = await getLatestProducts();

  return (
    <main className="flex-1">
      <ProductListing
        id="new-in-title"
        eyebrow="Just landed"
        title="New arrivals"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "New In" }]}
        products={products}
      />
    </main>
  );
}
