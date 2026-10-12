"use client";

/**
 * Ranked exception queue: the things that will make a program miss SOP.
 * Rows are derived from live state, so acting on a record elsewhere removes
 * its row here.
 */

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { EmptyState, PriorityBadge } from "@/components/ui/primitives";
import { EXCEPTION_KIND_LABEL } from "@/lib/kraya/selectors";
import type { ExceptionItem, ExceptionKind } from "@/lib/kraya/types";

import { KMark } from "./kit";

const PARAM: Partial<Record<ExceptionKind, string>> = {
  "late-po": "po",
  "single-source": "risk",
  ppap: "ppap",
  lifecycle: "notice",
  sourcing: "event",
};

/** Deep link that opens the record's drawer on its own page. */
export function exceptionHref(item: ExceptionItem): string {
  const param = PARAM[item.kind];
  return param ? `${item.href}?${param}=${item.recordId}` : item.href;
}

const EXPOSURE_LABEL: Record<ExceptionKind, (days: number) => string> = {
  "late-po": (d) => `${d}d late`,
  "single-source": (d) => `${Math.round(d / 7)} wk to recover`,
  ppap: (d) => `${d}d overdue`,
  lifecycle: (d) => (d > 0 ? `${d}d exposure` : "act now"),
  capacity: (d) => `${Math.round(d / 30)} mo short`,
  sourcing: () => "award due",
};

export const EXCEPTION_FILTERS: { id: "all" | ExceptionKind; label: string }[] = [
  { id: "all", label: "All" },
  { id: "late-po", label: "Late POs" },
  { id: "single-source", label: "Single source" },
  { id: "ppap", label: "PPAP" },
  { id: "lifecycle", label: "Lifecycle" },
  { id: "capacity", label: "Capacity" },
  { id: "sourcing", label: "Awards due" },
];

export function ExceptionList({ items, showProgram = true }: { items: ExceptionItem[]; showProgram?: boolean }) {
  if (items.length === 0) {
    return (
      <EmptyState
        title="Nothing is threatening SOP in this view"
        detail="Exceptions clear as soon as the record behind them is fixed."
        mark={<KMark id="mark-empty" size={56} />}
      />
    );
  }

  return (
    <ul className="flex min-w-0 flex-col">
      {items.map((item, index) => (
        <li key={item.id} className="border-b border-muted last:border-b-0">
          <Link
            href={exceptionHref(item)}
            className="group flex min-w-0 items-start gap-3 px-4 py-2.5 outline-none transition-colors duration-[150ms] hover:bg-raised focus-visible:bg-raised"
          >
            <span className="mt-0.5 w-5 shrink-0 text-right text-caption tabular text-quaternary">{index + 1}</span>
            <span className="min-w-0 flex-1">
              <span className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
                <PriorityBadge priority={item.severity} />
                <span className="text-caption tracking-[0.08em] text-quaternary uppercase">{EXCEPTION_KIND_LABEL[item.kind]}</span>
                {showProgram ? <span className="text-caption tabular text-tertiary">{item.programId}</span> : null}
              </span>
              <span className="mt-1 block text-body-md text-primary">{item.title}</span>
              <span className="mt-0.5 block truncate text-body-sm text-tertiary">{item.detail}</span>
            </span>
            <span className="flex shrink-0 flex-col items-end gap-1">
              <span className="text-body-sm tabular whitespace-nowrap text-warning">{EXPOSURE_LABEL[item.kind](item.slipDays)}</span>
              <span className="max-w-[120px] truncate text-caption text-quaternary">{item.owner}</span>
            </span>
            <ArrowUpRight size={14} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-quaternary transition-colors duration-[150ms] group-hover:text-primary" />
          </Link>
        </li>
      ))}
    </ul>
  );
}
