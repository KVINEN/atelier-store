import type { Metadata } from "next";

import { ProductListing } from "@/components/product-listing";
import { getProductsByGender } from "@/db/queries/catalog";

export const metadata: Metadata = {
  title: "Women",
  description:
    "Dresses, tailoring, handbags and jewellery for women, crafted to last. Complimentary express shipping and returns.",
};

export default async function WomenPage() {
  const products = await getProductsByGender("women");

  return (
    <main className="flex-1">
      <ProductListing
        id="women-title"
        eyebrow="The collection"
        title="Women"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Women" }]}
        products={products}
      />
    </main>
  );
}
