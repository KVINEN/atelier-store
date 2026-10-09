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
npm run db:seed        # upsert the placeholder catalogue (src/db/seed-data.ts)
npm run admin:grant -- <email> [--revoke]  # set an existing account's role to admin (or back to user)
```

There is no test runner configured yet.

Env: copy `.env.example` to `.env.local` (`DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `NEXT_PUBLIC_APP_URL`, `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`). Locally, `npm run stripe:listen` forwards the handled Checkout events to the webhook and prints its signing secret (Stripe CLI 1.53+ requires `--events`). `drizzle.config.ts` loads `.env.local` then `.env` via dotenv; the app reads them through Next.

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
- **Admin access**: `user.role` (`"user" | "admin"`) is a Better Auth `additionalFields` entry with `input: false`, changed only by `admin:grant`. `requireAdmin()` (`src/lib/admin.ts`) is the security boundary: call it in every admin layout, page, server action and route handler, and use `adminMetadata()` instead of a static `metadata` export (static metadata is baked into the prerendered shell). Non-admins get the ordinary 404. `src/proxy.ts` only 404s requests without a session cookie and is not a security check. Keep admin markup inside Suspense behind `requireAdmin()`, never link to `/admin` from the storefront, and don't enable `session.cookieCache` without revisiting `requireAdmin()`.
- **Rendering model**: `next.config.ts` enables `cacheComponents` and `partialPrefetching`. Data fetching is dynamic by default; opt into caching with the `"use cache"` directive / `cacheLife` / `cacheTag`. Requires the Node.js runtime (no `runtime = 'edge'`). Read `node_modules/next/dist/docs/` before using caching or routing APIs.
- **Payments**: Stripe Checkout Sessions with `ui_mode: "elements"` (Payment Element on our own `/checkout` page, styled via the Appearance API in `src/components/checkout-view.tsx`). The server action in `src/app/checkout/actions.ts` prices the bag from the database (the localStorage bag is only a display snapshot) and inserts a `pending` order. Only the webhook (`src/app/api/stripe/webhook/route.ts`) marks orders paid and decrements stock; `/checkout/complete` just displays the outcome. Never pass `payment_method_types`.
- **Tailwind v4** is wired through the `@tailwindcss/turbopack` loader rule in `next.config.ts` (no PostCSS config). Theme tokens live in `src/app/globals.css` under `@theme inline`.

## Database conventions

- **Migrations**: every schema change goes through `db:generate` + `db:migrate`, with the generated SQL in `drizzle/` committed. `db:push` is for throwaway prototyping only.
- **Catalogue model**: `categories` 1→n `products` 1→n `stock`. Stock is one row per product and size, keyed by `(product_id, size)`; one-size items get a single `"One size"` row. Stock rows are not product variants: they have no SKU, price or colour of their own.
- **Money** is stored as integer minor units (`price_cents`). The app's `Product.price` is whole units, converted only in `toProduct` in the queries module.
- **Ordered sub-data** that nothing queries on its own (product images, detail bullets) lives in `jsonb` / `text[]` columns, not child tables.
- **Reads**: server code reads the catalogue only through `src/db/queries/catalog.ts` (module-level `"use cache"`, `cacheTag("catalog")`, `cacheLife("hours")`), which returns the existing `Product` / `Category` shapes. `src/lib/products.ts` is imported by client components, so it must hold types and pure helpers only, never DB imports.
- **Merchandising** such as curated home-page rails stays as slug lists in `src/lib/catalog.ts`, not in the database.
- **Scripts outside Next** (`scripts/seed.ts`) build their own Drizzle client, because `src/db/index.ts` imports `server-only`. The seed upserts by slug and never deletes rows.
