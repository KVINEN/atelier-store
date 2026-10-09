// Shared result shape for admin server actions and the forms that call them.

import type { z } from "zod";

export type FormState =
  | { status: "idle" }
  | { status: "success"; message: string }
  | { status: "error"; message: string; fieldErrors?: Record<string, string> };

export const IDLE: FormState = { status: "idle" };

export function success(message: string): FormState {
  return { status: "success", message };
}

export function failure(message: string, fieldErrors?: Record<string, string>): FormState {
  return { status: "error", message, fieldErrors };
}

/** First message per field, keyed by dotted path (`images.0.src`). */
export function fieldErrorsOf(error: z.ZodError, prefix?: string) {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = [prefix, ...issue.path].filter((part) => part !== undefined).join(".");
    fieldErrors[key] ??= issue.message;
  }
  return fieldErrors;
}

export function invalid(error: z.ZodError): FormState {
  return failure("Please check the highlighted fields.", fieldErrorsOf(error));
}

/** "1,250.5" → 125050. Returns NaN when the text isn't an amount. */
export function parseMoneyToCents(text: string) {
  const cleaned = text.replace(/[$,\s]/g, "");
  if (!/^\d+(\.\d{1,2})?$/.test(cleaned)) return Number.NaN;
  return Math.round(Number(cleaned) * 100);
}

const money = new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" });
const wholeMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  maximumFractionDigits: 0,
});

/** Cents → "$1,250" (or "$12.50" when there are cents). */
export function formatCents(cents: number) {
  return cents % 100 === 0 ? wholeMoney.format(cents / 100) : money.format(cents / 100);
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export const SLUG_PATTERN = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Postgres unique_violation, raised for duplicate slugs and SKUs. */
export function isUniqueViolation(error: unknown, constraint?: string) {
  const cause = (error as { cause?: { code?: string; constraint?: string } })?.cause ?? error;
  const { code, constraint: name } = (cause ?? {}) as { code?: string; constraint?: string };
  return code === "23505" && (!constraint || name === constraint);
}

/**
 * Reads repeated fields named `<prefix>.<index>.<key>` into rows, in index
 * order, dropping rows where every field is blank.
 */
export function indexedRows<K extends string>(formData: FormData, prefix: string, keys: readonly K[]) {
  const rows = new Map<number, Record<K, string>>();
  for (const [name, value] of formData.entries()) {
    const match = name.match(/^([\w-]+)\.(\d+)\.([\w-]+)$/);
    if (!match || match[1] !== prefix || !keys.includes(match[3] as K)) continue;
    const index = Number(match[2]);
    const row = rows.get(index) ?? (Object.fromEntries(keys.map((key) => [key, ""])) as Record<K, string>);
    row[match[3] as K] = String(value);
    rows.set(index, row);
  }
  return [...rows.entries()]
    .sort(([a], [b]) => a - b)
    .map(([, row]) => row)
    .filter((row) => keys.some((key) => row[key].trim() !== ""));
}

/** Non-empty trimmed lines of a textarea. */
export function lines(value: FormDataEntryValue | null) {
  return String(value ?? "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}
