import type { Metadata } from "next";

import { ProductListing } from "@/components/product-listing";
import { getProductsBySlugs } from "@/db/queries/catalog";
import { getRailSlugs } from "@/db/queries/content";

export const metadata: Metadata = {
  title: "Gifts",
  description:
    "Gifts chosen by our client advisors, each arriving in signature packaging.",
};

export default async function GiftsPage() {
  const products = await getProductsBySlugs(await getRailSlugs("gift-edit"));

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
