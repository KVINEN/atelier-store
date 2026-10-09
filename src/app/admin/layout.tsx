import Link from "next/link";
import { Suspense } from "react";

import { SignOutButton } from "@/components/admin/sign-out-button";
import { adminMetadata, requireAdmin } from "@/lib/admin";

export const generateMetadata = () =>
  adminMetadata({
    title: { default: "Admin", template: "%s | Atelier Admin" },
    robots: { index: false, follow: false },
  });

// No admin markup sits outside the Suspense boundary, so the static shell is
// empty for everyone. Pages must still call requireAdmin() themselves.
export default function AdminLayout({ children }: LayoutProps<"/admin">) {
  return (
    <Suspense fallback={null}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}

async function AdminShell({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();

  return (
    <>
      <header className="header-bar">
        <div className="container-page flex h-full items-center justify-between gap-6">
          <Link href="/admin" className="flex items-baseline gap-3">
            <span className="text-lg font-medium tracking-[0.32em] uppercase">Atelier</span>
            <span className="text-eyebrow text-mute">Admin</span>
          </Link>
          <div className="flex items-center gap-6">
            <span className="text-meta hidden sm:inline">{admin.email}</span>
            <Link href="/" className="link-quiet text-label">
              View store
            </Link>
            <SignOutButton />
          </div>
        </div>
      </header>
      {children}
    </>
  );
}
