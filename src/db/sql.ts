import "server-only";

import { getTableName, sql, type AnyColumn } from "drizzle-orm";

/**
 * A fully qualified column reference ("table"."column"). Drizzle leaves column
 * names unqualified in the select list of single-table queries, so a
 * correlated subquery such as `where products.category_id = categories.id`
 * would silently compare against the subquery's own `id`. Use this for every
 * outer-table column inside such a subquery.
 */
export function ref(column: AnyColumn) {
  return sql`${sql.identifier(getTableName(column.table))}.${sql.identifier(column.name)}`;
}
