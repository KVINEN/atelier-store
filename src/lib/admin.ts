import "server-only";

import type { Metadata } from "next";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { cache } from "react";

import { auth } from "@/lib/auth";

export type AdminUser = { id: string; name: string; email: string };

/**
 * The admin security boundary. Call it in every admin layout, page, server
 * action and route handler — a layout check alone does not stop pages or
 * actions from running, and proxy.ts only does an optimistic cookie check.
 *
 * Anyone who isn't an admin (signed out or not) gets the ordinary 404, so the
 * admin area's existence isn't revealed. `cache` only dedupes within a single
 * request; never wrap this in "use cache".
 */
export const requireAdmin = cache(async (): Promise<AdminUser> => {
  const session = await auth.api.getSession({ headers: await headers() });
  if (session?.user.role !== "admin") notFound();

  const { id, name, email } = session.user;
  return { id, name, email };
});

/**
 * requireAdmin() for rendering (layouts, pages, metadata). Awaiting
 * connection() first keeps the session read out of prerenders and prefetches
 * (including the runtime prerender on a page load), which would otherwise
 * start the uncached session query and abandon it mid-flight. The check runs
 * for the real request; prerenders get the Suspense fallback.
 */
export async function requireAdminPage(): Promise<AdminUser> {
  await connection();
  return requireAdmin();
}

/**
 * Admin metadata must be gated too: a static `metadata` export is baked into
 * the prerendered shell that any signed-in visitor receives. Use as
 * `export const generateMetadata = () => adminMetadata({ title: "…" })`.
 */
export async function adminMetadata(metadata: Metadata): Promise<Metadata> {
  await requireAdminPage();
  return metadata;
}
