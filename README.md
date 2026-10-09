# Atelier Store

Next.js (App Router) + TypeScript + Tailwind CSS, with Better Auth, Drizzle ORM and Neon Postgres.

## Setup

1. Install dependencies: `npm install`
2. Copy `.env.example` to `.env.local` and fill in `DATABASE_URL` (Neon) and `BETTER_AUTH_SECRET` (`openssl rand -base64 32`).
3. Start the dev server: `npm run dev`

## Project structure

```
src/
  app/api/auth/[...all]/route.ts  Better Auth route handler
  db/index.ts                     Drizzle client (Neon HTTP driver)
  db/schema.ts                    Drizzle schema (empty)
  lib/auth.ts                     Better Auth server instance
  lib/auth-client.ts              Better Auth React client
  lib/env.ts                      Server env access with required-var checks
drizzle.config.ts                 Drizzle Kit config
drizzle/                          Generated SQL migrations
```

## Scripts

| Script                  | Description                                          |
| ----------------------- | ---------------------------------------------------- |
| `npm run dev`           | Start the dev server                                 |
| `npm run build`         | Production build (requires `DATABASE_URL` to be set) |
| `npm run lint`          | ESLint                                               |
| `npm run typecheck`     | TypeScript check                                     |
| `npm run auth:generate` | Generate Better Auth tables into `src/db/schema.ts`  |
| `npm run db:generate`   | Generate SQL migrations from the schema              |
| `npm run db:migrate`    | Apply migrations                                     |
| `npm run db:push`       | Push schema directly (prototyping)                   |
| `npm run db:studio`     | Open Drizzle Studio                                  |
