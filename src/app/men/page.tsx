import type { Metadata } from "next";

import { ProductListing } from "@/components/product-listing";
import { getProductsByGender } from "@/db/queries/catalog";

export const metadata: Metadata = {
  title: "Men",
  description:
    "Shirts, outerwear, sneakers and accessories for men, crafted to last. Complimentary express shipping and returns.",
};

export default async function MenPage() {
  const products = await getProductsByGender("men");

  return (
    <main className="flex-1">
      <ProductListing
        id="men-title"
        eyebrow="The collection"
        title="Men"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Men" }]}
        products={products}
      />
    </main>
  );
}
