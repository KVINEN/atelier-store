import type { Metadata } from "next";

import { BagView } from "@/components/bag-view";

export const metadata: Metadata = { title: "Bag" };

export default function BagPage() {
  return (
    <main className="flex-1">
      <section aria-labelledby="bag-title" className="container-content section">
        <h1 id="bag-title" className="text-heading mb-8">
          Your bag
        </h1>
        <BagView />
      </section>
    </main>
  );
}
