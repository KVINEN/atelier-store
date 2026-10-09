import type { Metadata } from "next";

import { AccountView } from "@/components/account-view";

export const metadata: Metadata = { title: "My account" };

export default function AccountPage() {
  return (
    <main className="flex-1">
      <section aria-labelledby="account-title" className="container-content section">
        <h1 id="account-title" className="text-heading mb-8">
          My account
        </h1>
        <AccountView />
      </section>
    </main>
  );
}
