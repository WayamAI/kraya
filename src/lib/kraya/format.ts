/** Formatting and fixed-clock helpers. The demo clock never moves. */

export const TODAY = "2026-10-12";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parts(iso: string): [number, number, number] {
  const [y, m, d] = iso.split("-").map(Number);
  return [y, m, d];
}

function utc(iso: string): number {
  const [y, m, d] = parts(iso);
  return Date.UTC(y, m - 1, d);
}

/** 14 Oct */
export function shortDate(iso: string | undefined): string {
  if (!iso) return "—";
  const [, m, d] = parts(iso);
  return `${d} ${MONTHS[m - 1]}`;
}

/** 14 Oct 2026 */
export function fullDate(iso: string | undefined): string {
  if (!iso) return "—";
  const [y, m, d] = parts(iso);
  return `${d} ${MONTHS[m - 1]} ${y}`;
}

/** Oct 2026 */
export function monthYear(iso: string): string {
  const [y, m] = parts(iso);
  return `${MONTHS[m - 1]} ${y}`;
}

/** Whole days from a to b (positive when b is later). */
export function daysBetween(a: string, b: string): number {
  return Math.round((utc(b) - utc(a)) / 86_400_000);
}

export function daysFromToday(iso: string): number {
  return daysBetween(TODAY, iso);
}

export function addDays(iso: string, days: number): string {
  const date = new Date(utc(iso) + days * 86_400_000);
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, "0");
  const d = String(date.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

/** "in 9d", "today", "6d ago" */
export function relativeDays(iso: string): string {
  const n = daysFromToday(iso);
  if (n === 0) return "today";
  return n > 0 ? `in ${n}d` : `${Math.abs(n)}d ago`;
}

function trim(value: number, digits: number): string {
  return value.toFixed(digits).replace(/\.0+$/, "").replace(/(\.\d*[1-9])0+$/, "$1");
}

/** Value held in lakh: 28.4 gives ₹28.4L, 420 gives ₹4.2 Cr. */
export function inrL(lakh: number): string {
  const abs = Math.abs(lakh);
  const sign = lakh < 0 ? "-" : "";
  if (abs >= 100) return `${sign}₹${trim(abs / 100, abs >= 1000 ? 1 : 2)} Cr`;
  if (abs >= 1) return `${sign}₹${trim(abs, 1)}L`;
  return `${sign}₹${Math.round(abs * 100).toLocaleString("en-IN")}K`;
}

/** Value held in crore. */
export function inrCr(crore: number): string {
  return inrL(crore * 100);
}

/** Piece price in rupees: ₹1,240 or ₹1.80. */
export function rupees(value: number): string {
  const sign = value < 0 ? "-" : "";
  const abs = Math.abs(value);
  if (abs < 100 && abs % 1 !== 0) return `${sign}₹${abs.toFixed(2)}`;
  return `${sign}₹${Math.round(abs).toLocaleString("en-IN")}`;
}

export function pct(value: number, digits = 0): string {
  return `${value.toFixed(digits)}%`;
}

export function num(value: number): string {
  return value.toLocaleString("en-IN");
}

/** 62,000 gives 62k */
export function compact(value: number): string {
  if (Math.abs(value) >= 100_000) return `${trim(value / 100_000, 1)}L`;
  if (Math.abs(value) >= 1000) return `${trim(value / 1000, 1)}k`;
  return String(value);
}

/** Twelve planning months starting Oct 2026. */
export const PLAN_MONTHS = ["Oct", "Nov", "Dec", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

/** Six trailing months ending Oct 2026. */
export const TREND_MONTHS = ["May", "Jun", "Jul", "Aug", "Sep", "Oct"];
