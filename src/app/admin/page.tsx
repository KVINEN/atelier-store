import { Suspense } from "react";

import { adminMetadata, requireAdmin } from "@/lib/admin";

// The layout's title template only applies to child segments, not this page.
export const generateMetadata = () =>
  adminMetadata({ title: { absolute: "Dashboard | Atelier Admin" } });

export default function AdminHomePage() {
  return (
    <main className="flex-1">
      <section aria-labelledby="page-title" className="container-page section">
        <Suspense fallback={<DashboardSkeleton />}>
          <Dashboard />
        </Suspense>
      </section>
    </main>
  );
}

async function Dashboard() {
  const admin = await requireAdmin();

  return (
    <div className="stack gap-3">
      <p className="text-eyebrow text-mute">Admin</p>
      <h1 id="page-title" className="text-heading">
        Dashboard
      </h1>
      <p className="text-ink-soft">Signed in as {admin.name}.</p>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="stack gap-3" aria-busy="true" aria-label="Loading">
      <div className="bg-surface h-3 w-16" />
      <div className="bg-surface h-9 w-56" />
      <div className="bg-surface h-5 w-40" />
    </div>
  );
}
