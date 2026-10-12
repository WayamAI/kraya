"use client";

/** Shared recharts styling so every chart reads the same tokens. */

import type { ReactNode } from "react";

export const SERIES = [
  "var(--analytics-series-1)",
  "var(--analytics-series-2)",
  "var(--analytics-series-3)",
  "var(--analytics-series-4)",
  "var(--analytics-series-5)",
  "var(--analytics-series-6)",
];

export const TONE_COLOR = {
  success: "var(--feedback-success-icon)",
  warning: "var(--feedback-warning-icon)",
  error: "var(--feedback-error-icon)",
  info: "var(--feedback-info-icon)",
  neutral: "var(--text-quaternary)",
} as const;

export const AXIS_TICK = { fill: "var(--text-quaternary)", fontSize: 11 } as const;
export const GRID_STROKE = "var(--stroke-muted)";
export const AXIS_PROPS = { tick: AXIS_TICK, axisLine: false, tickLine: false } as const;
export const CURSOR_FILL = { fill: "var(--surface-raised)" } as const;

/** Fixed-height, shrinkable chart wrapper. Put a ResponsiveContainer inside. */
export function ChartFrame({ height = 240, children }: { height?: number; children: ReactNode }) {
  return (
    <div className="w-full min-w-0 shrink-0 overflow-hidden" style={{ height }}>
      {children}
    </div>
  );
}

interface TipEntry {
  name?: unknown;
  value?: unknown;
  color?: string;
  dataKey?: unknown;
}

/** Tooltip body in the container style. Pass as `content={<ChartTip />}`. */
export function ChartTip({
  active,
  payload,
  label,
  format = (value) => value.toLocaleString("en-IN"),
  title,
}: {
  active?: boolean;
  payload?: ReadonlyArray<TipEntry>;
  label?: unknown;
  format?: (value: number, name: string) => string;
  title?: (label: string) => string;
}) {
  if (!active || !payload?.length) return null;
  const heading = label === undefined || label === null ? "" : String(label);
  return (
    <div className="rounded-lg border border-muted bg-container px-3 py-2 shadow-lg">
      {heading ? <p className="mb-1 text-caption text-quaternary">{title ? title(heading) : heading}</p> : null}
      <ul className="flex flex-col gap-0.5">
        {payload.map((entry, index) => (
          <li key={`${String(entry.dataKey ?? entry.name)}-${index}`} className="flex items-center gap-2 text-body-sm">
            <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: entry.color ?? "var(--text-quaternary)" }} />
            <span className="text-tertiary">{String(entry.name ?? "")}</span>
            <span className="ml-auto pl-3 tabular text-primary">{format(Number(entry.value ?? 0), String(entry.name ?? ""))}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Legend row under a chart, since recharts' own legend ignores the type scale. */
export function ChartLegend({ items }: { items: { label: string; color: string }[] }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
      {items.map((item) => (
        <li key={item.label} className="flex items-center gap-1.5 text-caption text-tertiary">
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: item.color }} />
          {item.label}
        </li>
      ))}
    </ul>
  );
}
