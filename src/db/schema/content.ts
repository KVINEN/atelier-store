// Admin-editable storefront content, one jsonb document per key. Missing keys
// fall back to the defaults in `src/lib/catalog.ts`.

import { jsonb, pgTable, text, timestamp } from "drizzle-orm/pg-core";

export const siteContent = pgTable("site_content", {
  key: text().primaryKey(),
  value: jsonb().notNull(),
  updatedAt: timestamp("updated_at", { withTimezone: true })
    .notNull()
    .defaultNow()
    .$onUpdate(() => new Date()),
});
