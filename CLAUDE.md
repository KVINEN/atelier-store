# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

```bash
npm run dev            # dev server (Turbopack)
npm run build          # production build — needs DATABASE_URL set
npm run lint           # ESLint (flat config, next core-web-vitals + typescript)
npm run typecheck      # tsc --noEmit

npm run auth:generate  # Better Auth CLI writes its tables into src/db/schema/auth.ts
npm run db:generate    # drizzle-kit: SQL migrations from schema → drizzle/
npm run db:migrate     # apply migrations to Neon
npm run db:push        # push schema directly (prototyping only)
npm run db:studio      # Drizzle Studio
npm run db:seed        # insert the placeholder catalogue where missing (src/db/seed-data.ts)
npm run admin:grant -- <email> [--revoke]  # set an existing account's role to admin (or back to user)
```

There is no test runner configured yet.

Env: copy `.env.example` to `.env.local` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`). Locally, `npm run stripe:listen` forwards the handled Checkout and refund events to the webhook (the CLI must be logged in to the same Stripe account as `STRIPE_SECRET_KEY`, or events never arrive) and prints its signing secret (Stripe CLI 1.53+ requires `--events`). `drizzle.config.ts` loads `.env.local` then `.env` via dotenv; the app reads them through Next.

## Stack

Next.js 16.4 App Router + React 19.3, TypeScript (strict, `@/*` → `src/*`), Tailwind CSS v4, Better Auth, Drizzle ORM, Neon serverless Postgres.

## Architecture

Request flow for auth:

```
authClient (src/lib/auth-client.ts, baseURL = NEXT_PUBLIC_APP_URL)
  → /api/auth/* (src/app/api/auth/[...all]/route.ts, toNextJsHandler(auth))
  → auth (src/lib/auth.ts, betterAuth + drizzleAdapter(db, schema, provider "pg"))
  → db (src/db/index.ts, drizzle over neon-http)
  → Neon Postgres
```

- **Server-only boundary**: `src/lib/env.ts`, `src/lib/auth.ts` and `src/db/index.ts` import `server-only`; client components must only use `src/lib/auth-client.ts`.
- **Env access**: server code reads required vars via `env` from `src/lib/env.ts` (lazy getters that throw when missing), not `process.env` directly. `src/db/index.ts` reads `DATABASE_URL` at module load, which is why builds need it.
- **Schema**: `src/db/schema/` (re-exported from `index.ts`) is shared by the db client, the Better Auth adapter, and drizzle-kit. Better Auth tables are generated into `schema/auth.ts` with `auth:generate` and re-exported from `index.ts`.
- **Better Auth plugins**: `nextCookies()` must remain the last entry in `plugins`. `emailAndPassword` is enabled; no `socialProviders` yet.
- **`auth:generate`** cannot load `src/lib/auth.ts` (it and its imports use `server-only`). Generate from a throwaway config with the same auth options and diff the output against `schema/auth.ts`.
- **Route groups**: storefront pages live in `src/app/(shop)/`, whose layout adds the site header/footer; the root layout is html/body only. The root `not-found.tsx` renders the storefront chrome itself.
- **Admin access**: `user.role` (`"user" | "admin"`) is a Better Auth `additionalFields` entry with `input: false`, changed only by `admin:grant`. `src/lib/admin.ts` is the security boundary: every admin server action and route handler starts with `requireAdmin()`; layouts, pages and metadata use `requireAdminPage()` (which awaits `connection()` first so prerenders and prefetches never start the session query), and metadata goes through `adminMetadata()` rather than a static `metadata` export (static metadata is baked into the prerendered shell). Non-admins get the ordinary 404. `src/proxy.ts` only 404s requests without a session cookie and is not a security check. Keep admin markup inside Suspense behind the check, never link to `/admin` from the storefront, and don't enable `session.cookieCache` without revisiting `requireAdmin()`.
- **Admin area** (`src/app/admin/`): pages use `AdminMain` + `<Suspense fallback={<AdminSkeleton />}>` from `src/components/admin/ui.tsx`. Each section has an `actions.ts` returning `FormState` (`src/lib/admin-form.ts`) for `useActionState`; long forms use `ActionForm` (no field reset on error). After writes, actions call `updateTag("catalog")` / `updateTag("site")` for storefront data and `refresh()` for admin-only data.
- **Rendering model**: `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Data fetching is dynamic by default; opt into caching with the `"use cache"` directive / `cacheLife` / `cacheTag`. Requires the Node.js runtime (no `runtime = 'edge'`). Read `node_modules/next/dist/docs/` before using caching or routing APIs.
- **Payments**: Stripe Checkout Sessions with `ui_mode: "elements"` (Payment Element on our own `/checkout` page, styled via the Appearance API in `src/components/checkout-view.tsx`). The server action in `src/app/(shop)/checkout/actions.ts` prices the bag from the database (the localStorage bag is only a display snapshot) and inserts a `pending` order. Only the webhook (`src/app/api/stripe/webhook/route.ts`) marks orders paid and decrements stock; `/checkout/complete` just displays the outcome. Never pass `payment_method_types`. Admins refund through `stripe.refunds.create`; `orders.refunded_cents` is always Stripe's absolute total, set from the charge (webhook `charge.refunded` / `charge.refund.updated`, or re-read right after the refund). Fulfilment (`fulfillment_status`, tracking) is admin-managed; payment status stays webhook-only.
- **Tailwind v4** is wired through the `@tailwindcss/turbopack` loader rule in `next.config.ts` (no PostCSS config). Theme tokens live in `src/app/globals.css` under `@theme inline`.

## Database conventions

- **Migrations**: every schema change goes through `db:generate` + `db:migrate`, with the generated SQL in `drizzle/` committed. `db:push` is for throwaway prototyping only.
- **Catalogue model**: `categories` 1→n `products` 1→n `stock`. Only `status = 'active'` products are shown or sold; drafts and archived products are admin-only, and products that were ever ordered are archived rather than deleted. Slugs are fixed after creation. Stock is one row per product and size, keyed by `(product_id, size)`; one-size items get a single `"One size"` row. Stock rows are not product variants: they have no SKU, price or colour of their own.
- **Money** is stored as integer minor units (`price_cents`). The app's `Product.price` is whole units, converted only in `toProduct` in the queries module.
- **Ordered sub-data** that nothing queries on its own (product images, detail bullets) lives in `jsonb` / `text[]` columns, not child tables.
- **Reads**: the storefront reads the catalogue only through `src/db/queries/catalog.ts` (module-level `"use cache"`, `cacheTag("catalog")`, `cacheLife("hours")`), which returns the existing `Product` / `Category` shapes. Admin reads and writes live in `src/db/admin/*` (uncached). `src/lib/products.ts` is imported by client components, so it must hold types and pure helpers only, never DB imports.
- **Stock changes** are relative (`quantity = quantity + delta`, guarded `>= 0`) and write a `stock_movements` row in the same statement, so they never overwrite a sale the webhook records meanwhile. neon-http has no interactive transactions: use one SQL statement (CTEs) or `db.batch`.
- **Correlated subqueries**: Drizzle leaves columns unqualified in single-table select lists, so reference outer columns with `ref()` from `src/db/sql.ts`. Drizzle's insert…select also lists identity columns; use `db.execute` with explicit columns instead.
- **Merchandising**: the home hero and curated rails (New arrivals, Gift edit) are admin-editable in the `site_content` table (validated by `src/lib/site-content.ts`, read via `src/db/queries/content.ts` under `cacheTag("site")`). The values in `src/lib/catalog.ts` are only the defaults used when nothing is stored. Navigation, footer and editorials stay in code.
- **Scripts outside Next** (`scripts/seed.ts`, `scripts/grant-admin.ts`) build their own Drizzle client, because `src/db/index.ts` imports `server-only`. The seed is insert-only: it never overwrites existing rows (admin edits, live stock) and never deletes.
