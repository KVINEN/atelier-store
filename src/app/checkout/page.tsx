import type { Metadata } from "next";

import { CheckoutView } from "@/components/checkout-view";

export const metadata: Metadata = { title: "Checkout" };

export default function CheckoutPage() {
  return (
    <main className="flex-1">
      <section aria-labelledby="checkout-title" className="container-content section">
        <h1 id="checkout-title" className="text-heading mb-8">
          Checkout
        </h1>
        <CheckoutView />
      </section>
    </main>
  );
}
