import type { Metadata } from "next";

import { ProductListing } from "@/components/product-listing";
import { getProductsBySlugs } from "@/db/queries/catalog";
import { GIFT_EDIT } from "@/lib/catalog";

export const metadata: Metadata = {
  title: "Gifts",
  description:
    "Gifts chosen by our client advisors, each arriving in signature packaging.",
};

export default async function GiftsPage() {
  const products = await getProductsBySlugs(GIFT_EDIT);

  return (
    <main className="flex-1">
      <ProductListing
        id="gifts-title"
        eyebrow="The gift edit"
        title="Gifts"
        breadcrumbs={[{ label: "Home", href: "/" }, { label: "Gifts" }]}
        products={products}
      />
    </main>
  );
}
