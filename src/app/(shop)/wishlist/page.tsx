import type { Metadata } from "next";

import { SavedView } from "@/components/saved-view";

export const metadata: Metadata = { title: "Saved items" };

export default function WishlistPage() {
  return (
    <main className="flex-1">
      <section aria-labelledby="saved-title" className="container-page section">
        <h1 id="saved-title" className="text-heading mb-8">
          Saved items
        </h1>
        <SavedView />
      </section>
    </main>
  );
}
