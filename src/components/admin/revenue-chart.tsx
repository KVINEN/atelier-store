"use client";

import { useState, type KeyboardEvent } from "react";

import { formatCents } from "@/lib/admin-form";

type Day = { day: string; revenue: number; orders: number };

const dayFormat = new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
const compactMoney = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
  notation: "compact",
  maximumFractionDigits: 1,
});

function label(day: string) {
  return dayFormat.format(new Date(`${day}T00:00:00Z`));
}

/** Rounds the axis up to 1/2/2.5/5 × 10ⁿ so there are four clean steps. */
function niceMax(maxCents: number) {
  if (maxCents <= 0) return 10_000;
  const rough = maxCents / 4;
  const magnitude = 10 ** Math.floor(Math.log10(rough));
  const step = [1, 2, 2.5, 5, 10].map((m) => m * magnitude).find((value) => value >= rough)!;
  return step * 4;
}

/**
 * Daily net revenue as columns. Hover or focus a column for its value; arrow
 * keys move between days. Every value is also in the table below the chart.
 */
export function RevenueChart({ data }: { data: Day[] }) {
  const [active, setActive] = useState<number | null>(null);
  const max = niceMax(Math.max(...data.map((day) => day.revenue)));
  const ticks = [0, 0.25, 0.5, 0.75, 1].map((fraction) => fraction * max);
  const current = active === null ? null : data[active];

  function onKeyDown(event: KeyboardEvent) {
    if (event.key === "ArrowLeft" || event.key === "ArrowRight") {
      event.preventDefault();
      const offset = event.key === "ArrowLeft" ? -1 : 1;
      setActive((index) => Math.min(data.length - 1, Math.max(0, (index ?? data.length - 1) + (index === null ? 0 : offset))));
    } else if (event.key === "Home" || event.key === "End") {
      event.preventDefault();
      setActive(event.key === "Home" ? 0 : data.length - 1);
    }
  }

  return (
    <div className="stack gap-4">
      <div className="grid grid-cols-[3.5rem_1fr] gap-2">
        {/* Y axis */}
        <div className="relative h-56" aria-hidden="true">
          {ticks.map((tick) => (
            <span
              key={tick}
              className="text-meta absolute right-0 translate-y-1/2 tabular-nums"
              style={{ bottom: `${(tick / max) * 100}%` }}
            >
              {compactMoney.format(tick / 100)}
            </span>
          ))}
        </div>

        <div
          className="relative h-56 outline-offset-4"
          role="group"
          aria-label="Daily revenue, last 30 days. Use the arrow keys to read each day."
          tabIndex={0}
          onKeyDown={onKeyDown}
          onFocus={() => setActive((index) => index ?? data.length - 1)}
          onBlur={() => setActive(null)}
          onPointerLeave={() => setActive(null)}
        >
          {/* Gridlines */}
          {ticks.map((tick) => (
            <div
              key={tick}
              aria-hidden="true"
              className="border-line absolute inset-x-0 border-t"
              style={{ bottom: `${(tick / max) * 100}%` }}
            />
          ))}

          {/* Columns: each slot is the hit target, wider than the painted bar. */}
          <div className="absolute inset-0 flex items-end gap-0.5">
            {data.map((day, index) => (
              <div
                key={day.day}
                className="flex h-full flex-1 items-end justify-center"
                onPointerEnter={() => setActive(index)}
                aria-hidden="true"
              >
                {day.revenue > 0 && (
                  <div
                    className={`w-full max-w-6 rounded-t-[4px] transition-colors ${active === index ? "bg-mute" : "bg-ink"}`}
                    style={{ height: `${Math.max((day.revenue / max) * 100, 1)}%` }}
                  />
                )}
              </div>
            ))}
          </div>

          {current && active !== null && (
            <div
              className="bg-paper shadow-panel hairline pointer-events-none absolute top-0 z-10 stack min-w-36 gap-0.5 px-3 py-2"
              style={{
                left: `${((active + 0.5) / data.length) * 100}%`,
                transform: `translateX(${active > data.length / 2 ? "-100%" : "0"})`,
              }}
            >
              <span className="text-sm font-semibold tabular-nums">{formatCents(current.revenue)}</span>
              <span className="text-meta">
                {label(current.day)} · {current.orders} {current.orders === 1 ? "order" : "orders"}
              </span>
            </div>
          )}
          <p className="sr-only" aria-live="polite">
            {current ? `${label(current.day)}: ${formatCents(current.revenue)}, ${current.orders} orders` : ""}
          </p>
        </div>

        {/* X axis: first, middle and last day */}
        <span />
        <div className="text-meta flex justify-between" aria-hidden="true">
          <span>{label(data[0].day)}</span>
          <span>{label(data[Math.floor(data.length / 2)].day)}</span>
          <span>{label(data[data.length - 1].day)}</span>
        </div>
      </div>

      <details>
        <summary className="link-mute text-label cursor-pointer">Show as table</summary>
        <div className="mt-3 max-h-72 overflow-y-auto">
          <table className="w-full text-sm">
            <caption className="sr-only">Daily revenue and orders</caption>
            <thead>
              <tr>
                <th scope="col" className="text-label hairline-b py-2 text-left font-medium">Day</th>
                <th scope="col" className="text-label hairline-b py-2 text-right font-medium">Orders</th>
                <th scope="col" className="text-label hairline-b py-2 text-right font-medium">Revenue</th>
              </tr>
            </thead>
            <tbody>
              {[...data].reverse().map((day) => (
                <tr key={day.day}>
                  <td className="hairline-b py-1.5">{label(day.day)}</td>
                  <td className="hairline-b py-1.5 text-right tabular-nums">{day.orders}</td>
                  <td className="hairline-b py-1.5 text-right tabular-nums">{formatCents(day.revenue)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </div>
  );
}
