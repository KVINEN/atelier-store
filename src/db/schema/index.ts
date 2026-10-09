// Drizzle schema, shared by the db client, the Better Auth adapter and drizzle-kit.
//
// Better Auth tables are generated into ./auth.ts with `npm run auth:generate`;
// re-export them here, then run `npm run db:generate && npm run db:migrate`.
export * from "./catalog";
export * from "./auth";
export * from "./orders";
