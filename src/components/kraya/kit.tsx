"use client";

/**
 * Kraya page kit: the handful of pieces every page composes on top of the
 * shell primitives. Buttons, drawer, meters, record links, the paced pipeline
 * runner and the registered mark.
 */

import { Check, Loader, X, type LucideIcon } from "lucide-react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";

import { Mark } from "@/components/ui/mark";
import { StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { markIcon } from "@/lib/marks";
import type { RiskLevel } from "@/lib/kraya/types";

// --- mark ----------------------------------------------------------------------

/** Mark from the registry: the fallback glyph comes from src/lib/marks.ts. */
export function KMark({ id, size = 28, className = "" }: { id: string; size?: number; className?: string }) {
  return <Mark id={id} icon={markIcon(id)} size={size} className={className} />;
}

// --- buttons -------------------------------------------------------------------

type BtnVariant = "primary" | "secondary" | "ghost";

const BTN_BASE =
  "inline-flex h-8 shrink-0 items-center justify-center gap-1.5 rounded-full px-3 text-label-sm whitespace-nowrap outline-none transition-colors duration-[180ms] focus-visible:ring-2 focus-visible:ring-active disabled:pointer-events-none disabled:opacity-40";

const BTN_VARIANT: Record<BtnVariant, string> = {
  primary: "bg-action-primary text-on-color hover:bg-action-primary-hover",
  secondary: "border border-muted bg-action text-secondary hover:border-default hover:bg-raised-2 hover:text-primary",
  ghost: "text-tertiary hover:bg-action-tertiary-hover hover:text-primary",
};

export function Btn({
  children,
  onClick,
  variant = "secondary",
  icon: Icon,
  disabled,
  className = "",
  title,
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: BtnVariant;
  icon?: LucideIcon;
  disabled?: boolean;
  className?: string;
  title?: string;
}) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} title={title} className={`${BTN_BASE} ${BTN_VARIANT[variant]} ${className}`}>
      {Icon ? <Icon size={13} strokeWidth={1.75} aria-hidden /> : null}
      {children}
    </button>
  );
}

/** Same pill, but navigates. */
export function LinkBtn({
  href,
  children,
  variant = "secondary",
  icon: Icon,
  className = "",
}: {
  href: string;
  children: ReactNode;
  variant?: BtnVariant;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <Link href={href} className={`${BTN_BASE} ${BTN_VARIANT[variant]} ${className}`}>
      {Icon ? <Icon size={13} strokeWidth={1.75} aria-hidden /> : null}
      {children}
    </Link>
  );
}

/** Inline record id that opens the record's page. */
export function RecordLink({ href, children, className = "" }: { href: string; children: ReactNode; className?: string }) {
  return (
    <Link
      href={href}
      onClick={(event) => event.stopPropagation()}
      className={`tabular whitespace-nowrap text-primary underline decoration-[var(--stroke-default)] underline-offset-2 transition-colors duration-[150ms] hover:text-brand ${className}`}
    >
      {children}
    </Link>
  );
}

// --- labels and values ---------------------------------------------------------

export function Label({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <p className={`text-caption tracking-[0.08em] text-quaternary uppercase ${className}`}>{children}</p>;
}

/** Caption label over a value. */
export function Field({ label, children, className = "" }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={`min-w-0 ${className}`}>
      <Label>{label}</Label>
      <div className="mt-0.5 min-w-0 text-body-md text-secondary">{children}</div>
    </div>
  );
}

/** Caption label over a display-face figure. */
export function Figure({
  label,
  value,
  hint,
  tone = "text-primary",
}: {
  label: string;
  value: ReactNode;
  hint?: ReactNode;
  tone?: string;
}) {
  return (
    <div className="min-w-0">
      <Label className="truncate">{label}</Label>
      <p className={`mt-0.5 font-display text-display-lg tabular ${tone}`}>{value}</p>
      {hint ? <p className="truncate text-caption text-quaternary">{hint}</p> : null}
    </div>
  );
}

const METER_TONE: Record<StatusTone, string> = {
  success: "bg-success-icon",
  info: "bg-info-icon",
  neutral: "bg-quaternary",
  warning: "bg-warning-icon",
  error: "bg-error-icon",
};

/** Thin horizontal meter, 0 to max. */
export function Meter({ value, max = 100, tone = "neutral", className = "" }: { value: number; max?: number; tone?: StatusTone; className?: string }) {
  const width = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <span className={`block h-1.5 w-full overflow-hidden rounded-full bg-raised-2 ${className}`} aria-hidden>
      <span className={`block h-full rounded-full ${METER_TONE[tone]}`} style={{ width: `${width}%` }} />
    </span>
  );
}

/** Tone for a 0 to 100 score where higher is better. */
export function scoreTone(value: number): StatusTone {
  if (value >= 88) return "success";
  if (value >= 78) return "info";
  if (value >= 65) return "warning";
  return "error";
}

/** Agent confidence, always shown with the number. */
export function Confidence({ value, label = "Confidence" }: { value: number; label?: string }) {
  return (
    <div className="min-w-[120px]">
      <div className="flex items-baseline justify-between gap-3">
        <Label>{label}</Label>
        <span className="text-body-sm tabular text-primary">{value}%</span>
      </div>
      <Meter value={value} tone={value >= 80 ? "success" : value >= 70 ? "info" : "warning"} className="mt-1" />
    </div>
  );
}

const RISK_TONE: Record<RiskLevel, StatusTone> = { critical: "error", high: "warning", medium: "info", low: "success" };

export function RiskBadge({ risk }: { risk: RiskLevel }) {
  return <StatusBadge tone={RISK_TONE[risk]}>{risk}</StatusBadge>;
}

/** Bulleted evidence list used under every agent recommendation. */
export function Evidence({ items, label = "Evidence" }: { items: string[]; label?: string }) {
  return (
    <div className="min-w-0">
      <Label>{label}</Label>
      <ul className="mt-1 flex flex-col gap-1">
        {items.map((item) => (
          <li key={item} className="flex gap-2 text-body-sm text-secondary">
            <span aria-hidden className="mt-[7px] size-1 shrink-0 rounded-full bg-quaternary" />
            <span className="min-w-0">{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

/** "Sign-off: Name" line that closes an agent recommendation. */
export function SignOff({ name, note }: { name: string; note?: string }) {
  return (
    <p className="text-caption text-quaternary">
      Sign-off: <span className="text-secondary">{name}</span>
      {note ? ` · ${note}` : ""}
    </p>
  );
}

// --- drawer --------------------------------------------------------------------

/** Right-hand detail drawer. The page behind stays put; only the drawer scrolls. */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  badge,
  children,
  footer,
  wide = false,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: ReactNode;
  badge?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  wide?: boolean;
}) {
  useEffect(() => {
    if (!open) return;
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") onClose();
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex justify-end">
      <button type="button" aria-label="Close" onClick={onClose} className="absolute inset-0 bg-black/40" />
      <aside
        role="dialog"
        aria-label={title}
        className={`relative flex h-full w-full flex-col border-l border-muted bg-container shadow-lg ${wide ? "max-w-[680px]" : "max-w-[520px]"}`}
      >
        <header className="flex shrink-0 items-start justify-between gap-3 border-b border-muted px-5 py-4">
          <div className="min-w-0">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <h3 className="min-w-0 font-display text-display-lg text-primary">{title}</h3>
              {badge}
            </div>
            {subtitle ? <div className="mt-1 text-body-sm text-tertiary">{subtitle}</div> : null}
          </div>
          <button
            type="button"
            aria-label="Close"
            onClick={onClose}
            className="inline-flex size-8 shrink-0 items-center justify-center rounded-full text-tertiary outline-none transition-colors duration-[150ms] hover:bg-raised hover:text-primary focus-visible:ring-2 focus-visible:ring-active"
          >
            <X size={15} strokeWidth={1.75} aria-hidden />
          </button>
        </header>
        <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-5 py-4">{children}</div>
        {footer ? <footer className="flex shrink-0 flex-wrap items-center gap-2 border-t border-muted px-5 py-3">{footer}</footer> : null}
      </aside>
    </div>
  );
}

/** Bordered inset block for a recommendation or a note inside a panel or drawer. */
export function Callout({ label, children, tone = "neutral" }: { label?: string; children: ReactNode; tone?: "neutral" | "warning" | "success" | "error" | "info" }) {
  const border =
    tone === "warning" ? "border-warning-stroke bg-warning-surface" : tone === "success" ? "border-success-stroke bg-success-surface" : tone === "error" ? "border-error-stroke bg-error-surface" : tone === "info" ? "border-info-stroke bg-info-surface" : "border-muted bg-raised";
  return (
    <div className={`min-w-0 rounded-md border px-3 py-2 ${border}`}>
      {label ? <Label>{label}</Label> : null}
      <div className={`${label ? "mt-1" : ""} text-body-md text-secondary`}>{children}</div>
    </div>
  );
}

// --- paced pipeline ------------------------------------------------------------

export interface PipelineRun {
  steps: string[];
  index: number;
}

/**
 * Runs a long operation as visible steps. `start` shows each step for `pace`
 * milliseconds, then calls `onDone` once.
 */
export function usePipeline() {
  const [run, setRun] = useState<PipelineRun | null>(null);
  const timer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(timer.current), []);

  const start = useCallback((steps: string[], onDone: () => void, pace = 700) => {
    window.clearTimeout(timer.current);
    let index = 0;
    setRun({ steps, index });
    const tick = () => {
      index += 1;
      if (index >= steps.length) {
        setRun(null);
        onDone();
        return;
      }
      setRun({ steps, index });
      timer.current = window.setTimeout(tick, pace);
    };
    timer.current = window.setTimeout(tick, pace);
  }, []);

  return { run, start, running: run !== null };
}

export function PipelineSteps({ run }: { run: PipelineRun | null }) {
  if (!run) return null;
  return (
    <ol className="flex flex-col gap-1.5 rounded-md border border-muted bg-raised px-3 py-2.5" aria-live="polite">
      {run.steps.map((step, index) => {
        const done = index < run.index;
        const active = index === run.index;
        return (
          <li key={step} className={`flex items-center gap-2 text-body-sm ${done ? "text-tertiary" : active ? "text-primary" : "text-quaternary"}`}>
            {done ? (
              <Check size={13} strokeWidth={1.75} aria-hidden className="shrink-0 text-success" />
            ) : active ? (
              <Loader size={13} strokeWidth={1.75} aria-hidden className="shrink-0 animate-spin text-brand" />
            ) : (
              <span aria-hidden className="mx-[5px] size-[3px] shrink-0 rounded-full bg-quaternary" />
            )}
            <span className="min-w-0">{step}</span>
          </li>
        );
      })}
    </ol>
  );
}

// --- misc ----------------------------------------------------------------------

/** Vertical stack with the standard page gap. */
export function Stack({ children }: { children: ReactNode }) {
  return <div className="flex min-w-0 flex-col gap-4">{children}</div>;
}

/** KPI grid: 2 up on phones, 4 on laptops (or 5/6 with `cols`). */
export function KpiGrid({ children, cols = 4 }: { children: ReactNode; cols?: 3 | 4 | 5 | 6 }) {
  const grid = cols === 6 ? "md:grid-cols-3 @6xl:grid-cols-6" : cols === 5 ? "md:grid-cols-3 @5xl:grid-cols-5" : cols === 3 ? "lg:grid-cols-3" : "lg:grid-cols-4";
  return <div className={`grid grid-cols-2 gap-3 ${grid}`}>{children}</div>;
}

/** Wraps a KPI tile so the whole tile links to the page that explains it. */
export function KpiLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="block min-w-0 rounded-lg outline-none transition-opacity duration-[150ms] hover:opacity-80 focus-visible:ring-2 focus-visible:ring-active">
      {children}
    </Link>
  );
}

// --- selection -----------------------------------------------------------------

/**
 * Selected record id for a page with a detail drawer. Starts from the URL
 * (`?po=PO-2026-087`, as the command palette and cross-links write it) and
 * then follows clicks locally, so opening a row does not round-trip the router.
 */
export function useSelection(param: string): [string | null, (id: string | null) => void] {
  const linked = useSearchParams().get(param);
  const [state, setState] = useState<{ linked: string | null; value: string | null }>({ linked, value: linked });
  if (state.linked !== linked) setState({ linked, value: linked });
  const value = state.linked !== linked ? linked : state.value;
  const select = useCallback((id: string | null) => setState((current) => ({ linked: current.linked, value: id })), []);
  return [value, select];
}
