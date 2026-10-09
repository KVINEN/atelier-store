// Presentational building blocks for admin pages. Server-safe (no hooks).

import Link from "next/link";
import type { ReactNode } from "react";

/**
 * Page frame for admin routes. Pages render their content inside
 * <Suspense fallback={<AdminSkeleton />}> and call requireAdminPage() there.
 */
export function AdminMain({ children }: { children: ReactNode }) {
  return (
    <main className="flex-1">
      <section aria-labelledby="page-title" className="container-page py-8 md:py-12">
        {children}
      </section>
    </main>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: ReactNode;
  actions?: ReactNode;
}) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div className="stack gap-2">
        {eyebrow && <p className="text-eyebrow text-mute">{eyebrow}</p>}
        <h1 id="page-title" className="text-heading">
          {title}
        </h1>
        {description && <p className="text-meta max-w-2xl">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-3">{actions}</div>}
    </div>
  );
}

export function Panel({
  title,
  action,
  children,
  className = "",
}: {
  title?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`hairline p-5 md:p-6 ${className}`}>
      {(title || action) && (
        <div className="mb-5 flex items-baseline justify-between gap-4">
          {title && <h2 className="text-label">{title}</h2>}
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export type Tone = "neutral" | "success" | "warning" | "danger" | "muted";

const dotTone: Record<Tone, string> = {
  neutral: "bg-ink",
  success: "bg-success",
  warning: "bg-sale",
  danger: "bg-error",
  muted: "bg-subtle",
};

/** Dot + label; the label always carries the meaning, the colour only reinforces it. */
export function StatusBadge({ tone, children }: { tone: Tone; children: ReactNode }) {
  return (
    <span className="text-meta inline-flex items-center gap-2 whitespace-nowrap">
      <span aria-hidden="true" className={`size-1.5 shrink-0 rounded-full ${dotTone[tone]}`} />
      <span className={tone === "danger" ? "text-error" : tone === "warning" ? "text-sale" : undefined}>
        {children}
      </span>
    </span>
  );
}

export function EmptyState({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <div className="hairline stack items-start gap-2 p-8">
      <p className="text-label">{title}</p>
      {children && <div className="text-meta">{children}</div>}
    </div>
  );
}

export function Table({ caption, children }: { caption: string; children: ReactNode }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[40rem] border-collapse text-sm">
        <caption className="sr-only">{caption}</caption>
        {children}
      </table>
    </div>
  );
}

export function Th({ children, align = "left", className = "" }: { children?: ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <th
      scope="col"
      className={`text-label hairline-b py-3 pr-4 font-medium last:pr-0 ${align === "right" ? "text-right" : "text-left"} ${className}`}
    >
      {children}
    </th>
  );
}

export function Td({ children, align = "left", className = "" }: { children?: ReactNode; align?: "left" | "right"; className?: string }) {
  return (
    <td
      className={`hairline-b py-3 pr-4 align-middle last:pr-0 ${align === "right" ? "text-right tabular-nums" : ""} ${className}`}
    >
      {children}
    </td>
  );
}

/** Tab-style filter links; the current one gets aria-current. */
export function FilterTabs({
  label,
  options,
  current,
  href,
}: {
  label: string;
  options: { value: string; label: string; count?: number }[];
  current: string;
  href: (value: string) => string;
}) {
  return (
    <nav aria-label={label} className="hairline-b mb-6 overflow-x-auto">
      <ul className="flex gap-6">
        {options.map((option) => (
          <li key={option.value}>
            <Link
              href={href(option.value)}
              aria-current={option.value === current ? "page" : undefined}
              className="text-label text-mute aria-[current=page]:text-ink aria-[current=page]:border-ink -mb-px inline-block border-b border-transparent pb-3 whitespace-nowrap hover:text-ink"
            >
              {option.label}
              {option.count !== undefined && <span className="text-mute"> {option.count}</span>}
            </Link>
          </li>
        ))}
      </ul>
    </nav>
  );
}

/** Plain GET search form; keeps the other filters as hidden fields. */
export function SearchForm({
  label,
  placeholder,
  defaultValue,
  hidden = {},
}: {
  label: string;
  placeholder: string;
  defaultValue?: string;
  hidden?: Record<string, string | undefined>;
}) {
  return (
    <form role="search" className="mb-6 flex max-w-md items-end gap-3">
      {Object.entries(hidden).map(([name, value]) =>
        value ? <input key={name} type="hidden" name={name} value={value} /> : null,
      )}
      <label className="flex-1">
        <span className="sr-only">{label}</span>
        <input type="search" name="q" defaultValue={defaultValue} placeholder={placeholder} className="field" />
      </label>
      <button type="submit" className="btn btn-secondary btn-sm">
        Search
      </button>
    </form>
  );
}

export function Pagination({
  page,
  hasMore,
  href,
}: {
  page: number;
  hasMore: boolean;
  href: (page: number) => string;
}) {
  if (page <= 1 && !hasMore) return null;
  return (
    <nav aria-label="Pagination" className="mt-6 flex items-center justify-between">
      {page > 1 ? (
        <Link href={href(page - 1)} className="link-quiet text-label">
          Previous
        </Link>
      ) : (
        <span />
      )}
      <span className="text-meta">Page {page}</span>
      {hasMore ? (
        <Link href={href(page + 1)} className="link-quiet text-label">
          Next
        </Link>
      ) : (
        <span />
      )}
    </nav>
  );
}

/** Skeleton used as the Suspense fallback for admin pages. Deliberately generic. */
export function AdminSkeleton() {
  return (
    <div className="stack gap-6" aria-busy="true" aria-label="Loading">
      <div className="stack gap-3">
        <div className="bg-surface h-3 w-16" />
        <div className="bg-surface h-9 w-56" />
      </div>
      <div className="bg-surface h-64 w-full" />
    </div>
  );
}

const dateFormat = new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" });
const dateTimeFormat = new Intl.DateTimeFormat("en-US", {
  dateStyle: "medium",
  timeStyle: "short",
  timeZone: "UTC",
});

/** Server-rendered dates use UTC so they don't depend on where the server runs. */
export function formatDate(value: Date | string | null | undefined) {
  return value ? dateFormat.format(new Date(value)) : "—";
}

export function formatDateTime(value: Date | string | null | undefined) {
  return value ? `${dateTimeFormat.format(new Date(value))} UTC` : "—";
}
