/**
 * Derived views over the dataset plus the operator's in-session actions.
 *
 * `Status` is a flat key/value map held in context. Every action a page takes
 * (expedite a PO, accept a mitigation, approve a PPAP element...) writes one
 * key; these selectors fold those keys back into readiness, risk and the
 * exception queue, so a fix on one page moves numbers on another.
 *
 * Keys:
 *   risk:<RSK>            assigned | mitigating | closed      (absent = open)
 *   riskOwner:<RSK>       person name
 *   po:<PO>:expedite      "1"
 *   po:<PO>:repromise     "1"
 *   award:<SE>            supplier id
 *   ppap:<PPAP>:<index>   element status override
 *   alloc:<ALC>           accepted | rejected                  (absent = proposed)
 *   pcn:<PCN>             actioned | dismissed                 (absent = open)
 *   ncr:<NCR>:step        completed 8D disciplines
 *   approval:<APR>        approved | rejected
 */

import {
  ALLOCATION_PROPOSALS,
  BOMS,
  CAPACITY_LINES,
  EMS_PARTNERS,
  LIFECYCLE_NOTICES,
  NCRS,
  OEMS,
  OTHER_LOAD,
  PPAP_SUBMISSIONS,
  PROGRAMS,
  PURCHASE_ORDERS,
  SOURCING_EVENTS,
  STAGES,
  SUPPLIERS,
  SUPPLIER_RISKS,
  type Po,
} from "./data";
import { addDays, daysBetween, daysFromToday, inrL, shortDate, TODAY } from "./format";
import type {
  Bid,
  BomNode,
  EmsPartner,
  ExceptionItem,
  LifecycleNotice,
  Ncr,
  Oem,
  PoStatus,
  PpapElementStatus,
  PpapSubmission,
  Program,
  Readiness,
  RiskLevel,
  SourcingEvent,
  StageId,
  Supplier,
  SupplierRisk,
} from "./types";

export type Status = Record<string, string>;

// --- lookups -----------------------------------------------------------------

const PROGRAM_BY_ID = new Map(PROGRAMS.map((p) => [p.id, p]));
const SUPPLIER_BY_ID = new Map(SUPPLIERS.map((s) => [s.id, s]));
const EMS_BY_ID = new Map(EMS_PARTNERS.map((e) => [e.id, e]));
const OEM_BY_ID = new Map(OEMS.map((o) => [o.id, o]));

export const programById = (id: string): Program | undefined => PROGRAM_BY_ID.get(id);
export const supplierById = (id: string | undefined): Supplier | undefined => (id ? SUPPLIER_BY_ID.get(id) : undefined);
export const emsById = (id: string | undefined): EmsPartner | undefined => (id ? EMS_BY_ID.get(id) : undefined);
export const oemById = (id: string): Oem | undefined => OEM_BY_ID.get(id);

/** Name for a supplier or EMS partner id. */
export function sourceName(id: string | undefined): string {
  if (!id) return "—";
  return SUPPLIER_BY_ID.get(id)?.name ?? EMS_BY_ID.get(id)?.name ?? id;
}

/** Detail route for a supplier or EMS partner id. */
export function sourceHref(id: string): string {
  return id.startsWith("EMS") ? "/ems/performance" : `/suppliers/${id}`;
}

export function programLabel(id: string): string {
  if (id === OTHER_LOAD) return "Other products";
  return PROGRAM_BY_ID.get(id)?.name ?? id;
}

export function oemName(programId: string): string {
  const program = PROGRAM_BY_ID.get(programId);
  return program ? OEM_BY_ID.get(program.oemId)?.name ?? program.oemId : "—";
}

export const stageIndex = (stage: StageId): number => STAGES.findIndex((s) => s.id === stage);
export const stageLabel = (stage: StageId): string => STAGES.find((s) => s.id === stage)?.label ?? stage;

export const RISK_RANK: Record<RiskLevel, number> = { critical: 0, high: 1, medium: 2, low: 3 };

export function riskTone(risk: RiskLevel): "error" | "warning" | "info" | "success" {
  return risk === "critical" ? "error" : risk === "high" ? "warning" : risk === "medium" ? "info" : "success";
}

/** Annual revenue of a program in lakh. */
export function annualValueL(program: Program): number {
  return (program.annualVolume * program.unitPrice) / 100_000;
}

// --- gates -------------------------------------------------------------------

const GATE_OFFSETS = [-430, -390, -340, -300, -235, -180, -125, -55, 0];

export interface Gate {
  stage: StageId;
  label: string;
  date: string;
  state: "done" | "current" | "upcoming";
}

/** Gate plan back-scheduled from SOP. */
export function gatesFor(program: Program): Gate[] {
  const current = stageIndex(program.stage);
  return STAGES.map((stage, index) => ({
    stage: stage.id,
    label: stage.label,
    date: addDays(program.sopDate, GATE_OFFSETS[index]),
    state: index < current ? "done" : index === current ? "current" : "upcoming",
  }));
}

// --- supplier risk -------------------------------------------------------------

export type RiskState = "open" | "assigned" | "mitigating" | "closed";

export function riskState(s: Status, id: string): RiskState {
  const value = s[`risk:${id}`];
  return value === "assigned" || value === "mitigating" || value === "closed" ? value : "open";
}

export function riskOwner(s: Status, risk: SupplierRisk): string | undefined {
  return s[`riskOwner:${risk.id}`];
}

/** Score after mitigation progress is taken into account. */
export function residualScore(s: Status, risk: SupplierRisk): number {
  const state = riskState(s, risk.id);
  const factor = state === "closed" ? 0.25 : state === "mitigating" ? 0.55 : state === "assigned" ? 0.9 : 1;
  return Math.round(risk.score * factor);
}

// --- purchase orders -----------------------------------------------------------

export interface PoView {
  promised: string;
  /** Positive when the promise is after the need date. */
  lateDays: number;
  status: PoStatus;
  expedited: boolean;
  repromised: boolean;
  atRisk: boolean;
}

export function poView(s: Status, po: Po): PoView {
  const expedited = s[`po:${po.id}:expedite`] === "1";
  const repromised = s[`po:${po.id}:repromise`] === "1";
  const recovered = (expedited ? po.expediteDays : 0) + (repromised ? po.repromiseDays : 0);
  const promised = addDays(po.promisedDate, -recovered);
  const lateDays = po.status === "Received" ? 0 : Math.max(0, daysBetween(po.needDate, promised));
  const status: PoStatus = po.status === "Delayed" && lateDays === 0 ? "Confirmed" : po.status;
  const float = daysBetween(promised, po.needDate);
  return { promised, lateDays, status, expedited, repromised, atRisk: po.status !== "Received" && (lateDays > 0 || (po.critical && float < 7)) };
}

// --- sourcing events -----------------------------------------------------------

/** Three-year tooling amortisation and 10% cost of capital against Net 45. */
export function landedCost(bid: Bid, event: SourcingEvent): number {
  const duty = bid.unitPrice * (1 + (bid.freightPct + bid.dutyPct) / 100);
  const tooling = event.annualQty > 0 ? (bid.toolingL * 100_000) / (event.annualQty * 3) : 0;
  const terms = (bid.unitPrice * 0.1 * (bid.paymentDays - 45)) / 365;
  return Math.round((duty + tooling - terms) * 100) / 100;
}

export function eventAward(s: Status, event: SourcingEvent): string | undefined {
  return s[`award:${event.id}`] ?? event.awardedTo;
}

export function eventStatus(s: Status, event: SourcingEvent): SourcingEvent["status"] {
  return eventAward(s, event) ? "Awarded" : event.status;
}

// --- PPAP ----------------------------------------------------------------------

export function ppapElements(s: Status, sub: PpapSubmission): PpapElementStatus[] {
  return sub.elements.map((base, index) => (s[`ppap:${sub.id}:${index}`] as PpapElementStatus | undefined) ?? base);
}

export interface PpapSummary {
  approved: number;
  required: number;
  submitted: number;
  pending: number;
  overdue: number;
  pct: number;
  pswSigned: boolean;
  /** Elements 1 to 17 are all approved or not applicable. */
  readyForPsw: boolean;
}

export function ppapSummary(s: Status, sub: PpapSubmission): PpapSummary {
  const elements = ppapElements(s, sub);
  const count = (status: PpapElementStatus) => elements.filter((e) => e === status).length;
  const required = elements.length - count("na");
  const approved = count("approved");
  const pswSigned = elements[17] === "approved";
  const readyForPsw = elements.slice(0, 17).every((e) => e === "approved" || e === "na");
  return { approved, required, submitted: count("submitted"), pending: count("pending"), overdue: count("overdue"), pct: Math.round((approved / required) * 100), pswSigned, readyForPsw };
}

// --- lifecycle, allocation, NCR ------------------------------------------------

export type NoticeState = "open" | "actioned" | "dismissed";

export function noticeState(s: Status, id: string): NoticeState {
  const value = s[`pcn:${id}`];
  return value === "actioned" || value === "dismissed" ? value : "open";
}

export type AllocationState = "proposed" | "accepted" | "rejected";

export function allocationState(s: Status, id: string): AllocationState {
  const value = s[`alloc:${id}`];
  return value === "accepted" || value === "rejected" ? value : "proposed";
}

export function ncrStep(s: Status, ncr: Ncr): number {
  const value = Number(s[`ncr:${ncr.id}:step`]);
  return Number.isFinite(value) && value > 0 ? Math.max(value, ncr.step) : ncr.step;
}

export interface CapacityMonth {
  index: number;
  capacity: number;
  total: number;
  shortfall: number;
  byProgram: Record<string, number>;
}

/** Twelve-month load for one EMS partner with accepted allocations applied. */
export function capacityFor(s: Status, emsId: string): CapacityMonth[] {
  const partner = EMS_BY_ID.get(emsId);
  const capacity = partner?.capacity ?? 0;
  const months: CapacityMonth[] = Array.from({ length: 12 }, (_, index) => ({ index, capacity, total: 0, shortfall: 0, byProgram: {} }));
  for (const line of CAPACITY_LINES) {
    if (line.emsId !== emsId) continue;
    line.demand.forEach((boards, index) => {
      months[index].byProgram[line.programId] = (months[index].byProgram[line.programId] ?? 0) + boards;
    });
  }
  for (const proposal of ALLOCATION_PROPOSALS) {
    if (allocationState(s, proposal.id) !== "accepted") continue;
    for (const index of proposal.months) {
      if (proposal.fromEmsId === emsId) {
        const now = months[index].byProgram[proposal.programId] ?? 0;
        months[index].byProgram[proposal.programId] = Math.max(0, now - proposal.boardsPerMonth);
      }
      if (proposal.toEmsId === emsId) {
        months[index].byProgram[proposal.programId] = (months[index].byProgram[proposal.programId] ?? 0) + proposal.boardsPerMonth;
      }
    }
  }
  for (const month of months) {
    month.total = Object.values(month.byProgram).reduce((sum, v) => sum + v, 0);
    month.shortfall = Math.max(0, month.total - month.capacity);
  }
  return months;
}

/** Count of partner-months over capacity across the network. */
export function shortfallMonths(s: Status): number {
  return EMS_PARTNERS.reduce((sum, partner) => sum + capacityFor(s, partner.id).filter((m) => m.shortfall > 0).length, 0);
}

// --- BOM -----------------------------------------------------------------------

export interface BomRow extends BomNode {
  index: number;
  /** Rolled-up cost per unit of the top assembly, rupees. */
  extended: number;
  hasChildren: boolean;
  parentIndex: number | null;
}

/** Roll child costs up through the indented structure. */
export function bomRows(programId: string): BomRow[] {
  const nodes = BOMS[programId] ?? [];
  const rows: BomRow[] = nodes.map((node, index) => ({ ...node, index, extended: node.qty * node.unitCost, hasChildren: false, parentIndex: null }));
  const stack: number[] = [];
  rows.forEach((row, index) => {
    while (stack.length && rows[stack[stack.length - 1]].level >= row.level) stack.pop();
    row.parentIndex = stack.length ? stack[stack.length - 1] : null;
    if (row.parentIndex !== null) rows[row.parentIndex].hasChildren = true;
    stack.push(index);
  });
  for (let index = rows.length - 1; index >= 0; index -= 1) {
    const row = rows[index];
    if (row.parentIndex !== null) rows[row.parentIndex].extended += row.extended * (row.hasChildren ? row.qty : 1);
  }
  return rows;
}

export function bomHealth(programId: string) {
  const rows = bomRows(programId).filter((r) => !r.hasChildren && r.supplierId);
  const cost = bomRows(programId)[0]?.extended ?? 0;
  const single = rows.filter((r) => r.sourcing === "single");
  const noAlternate = single.filter((r) => !r.alternates.some((a) => a.status !== "Not started"));
  const longLead = rows.filter((r) => (r.leadTimeWeeks ?? 0) >= 20);
  const maxLead = rows.reduce((max, r) => Math.max(max, r.leadTimeWeeks ?? 0), 0);
  return { lines: rows.length, cost, single: single.length, noAlternate: noAlternate.length, longLead: longLead.length, maxLead };
}

/** Programs whose frozen BOM uses a part number. */
export function programsUsing(pn: string): string[] {
  return Object.entries(BOMS).filter(([, nodes]) => nodes.some((node) => node.pn === pn)).map(([id]) => id);
}

// --- readiness -----------------------------------------------------------------

const NOTICE_POINTS: Record<RiskLevel, number> = { critical: 8, high: 6, medium: 3, low: 1 };
const WEIGHTS = { bom: 0.2, suppliers: 0.2, material: 0.25, production: 0.15, quality: 0.2 } as const;

export function riskFromConfidence(confidence: number): RiskLevel {
  if (confidence >= 92) return "low";
  if (confidence >= 88) return "medium";
  if (confidence >= 78) return "high";
  return "critical";
}

/** Readiness to ship at SOP. Null before award, when there is nothing to measure. */
export function readiness(s: Status, program: Program): Readiness | null {
  if (stageIndex(program.stage) < 3) return null;
  const drags: Readiness["drags"] = [];

  for (const notice of LIFECYCLE_NOTICES) {
    if (!notice.programIds.includes(program.id) || noticeState(s, notice.id) !== "open") continue;
    drags.push({ dimension: "bom", points: NOTICE_POINTS[notice.severity], href: "/lifecycle", text: `${notice.id}: ${notice.type.toLowerCase()} on ${notice.pn}` });
  }

  for (const risk of SUPPLIER_RISKS) {
    if (!risk.programIds.includes(program.id)) continue;
    const state = riskState(s, risk.id);
    if (state === "closed") continue;
    const divisor = state === "mitigating" ? 40 : state === "assigned" ? 18 : 14;
    const points = Math.round(risk.score / divisor);
    if (points > 0) drags.push({ dimension: "suppliers", points, href: "/supplier-risk", text: `${risk.id}: ${risk.title.toLowerCase()} (${state})` });
  }
  for (const event of SOURCING_EVENTS) {
    if (event.programId !== program.id || eventStatus(s, event) === "Awarded" || event.status === "Draft") continue;
    drags.push({ dimension: "suppliers", points: event.status === "Evaluation" ? 4 : 2, href: "/sourcing-events", text: `${event.id}: ${event.pn} not awarded` });
  }

  for (const po of PURCHASE_ORDERS) {
    if (po.programId !== program.id) continue;
    const view = poView(s, po);
    if (view.lateDays <= 0) continue;
    const points = Math.min(14, Math.ceil(view.lateDays / (po.critical ? 2.5 : 5)));
    drags.push({ dimension: "material", points, href: "/purchase-orders", text: `${po.id}: ${po.pn} is ${view.lateDays}d behind need date` });
  }

  for (const proposal of ALLOCATION_PROPOSALS) {
    if (proposal.programId !== program.id || allocationState(s, proposal.id) === "accepted") continue;
    drags.push({ dimension: "production", points: proposal.months[0] <= 6 ? 12 : 7, href: "/ems/capacity", text: `${proposal.id}: line capacity short at ${sourceName(proposal.fromEmsId)}` });
  }

  for (const sub of PPAP_SUBMISSIONS) {
    if (sub.programId !== program.id) continue;
    const summary = ppapSummary(s, sub);
    if (summary.overdue > 0) {
      drags.push({ dimension: "quality", points: summary.overdue * 2 + (sub.blocksSop ? 1 : 0), href: "/ppap", text: `${sub.id}: ${summary.overdue} PPAP element${summary.overdue > 1 ? "s" : ""} overdue on ${sub.pn}` });
    } else if (sub.blocksSop && !summary.pswSigned) {
      drags.push({ dimension: "quality", points: 2, href: "/ppap", text: `${sub.id}: warrant not signed on ${sub.pn}` });
    }
  }
  for (const ncr of NCRS) {
    if (ncr.programId !== program.id || RISK_RANK[ncr.severity] > 1) continue;
    if (ncrStep(s, ncr) < 4) drags.push({ dimension: "quality", points: ncr.severity === "critical" ? 4 : 2, href: "/quality", text: `${ncr.id}: root cause not confirmed` });
  }

  const sum = (dimension: keyof typeof WEIGHTS) => drags.filter((d) => d.dimension === dimension).reduce((total, d) => total + d.points, 0);
  const value = (dimension: keyof typeof WEIGHTS) => Math.max(20, program.base[dimension] - sum(dimension));
  const scores = { bom: value("bom"), suppliers: value("suppliers"), material: value("material"), production: value("production"), quality: value("quality") };
  const confidence = Math.round(
    (scores.bom * WEIGHTS.bom + scores.suppliers * WEIGHTS.suppliers + scores.material * WEIGHTS.material + scores.production * WEIGHTS.production + scores.quality * WEIGHTS.quality) * 10,
  ) / 10;
  drags.sort((a, b) => b.points - a.points);
  return { ...scores, confidence, risk: riskFromConfidence(confidence), drags };
}

export function programRisk(s: Status, program: Program): RiskLevel {
  return readiness(s, program)?.risk ?? program.baseRisk;
}

// --- exception queue -----------------------------------------------------------

function exceptionFrom(program: Program, partial: Omit<ExceptionItem, "programId" | "stage">): ExceptionItem {
  return { ...partial, programId: program.id, stage: program.stage };
}

/** Everything that will make a program miss SOP, ranked. */
export function exceptions(s: Status): ExceptionItem[] {
  const items: ExceptionItem[] = [];

  for (const po of PURCHASE_ORDERS) {
    const view = poView(s, po);
    const program = PROGRAM_BY_ID.get(po.programId);
    if (!program || view.lateDays <= 0) continue;
    items.push(exceptionFrom(program, {
      id: `EX-${po.id}`, kind: "late-po", recordId: po.id, href: "/purchase-orders", owner: program.buyer, slipDays: view.lateDays,
      severity: po.critical ? (view.lateDays > 14 ? "critical" : "high") : "medium",
      title: `${po.component} is ${view.lateDays} days behind need date`,
      detail: `${po.id} · ${sourceName(po.supplierId)} · promised ${shortDate(view.promised)}, needed ${shortDate(po.needDate)}`,
    }));
  }

  for (const risk of SUPPLIER_RISKS) {
    if (risk.signal !== "Single-source") continue;
    const state = riskState(s, risk.id);
    if (state === "mitigating" || state === "closed") continue;
    for (const programId of risk.programIds) {
      const program = PROGRAM_BY_ID.get(programId);
      if (!program) continue;
      items.push(exceptionFrom(program, {
        id: `EX-${risk.id}-${programId}`, kind: "single-source", recordId: risk.id, href: "/supplier-risk", owner: s[`riskOwner:${risk.id}`] ?? "Unassigned",
        slipDays: (supplierById(risk.supplierId)?.leadTimeWeeks ?? 12) * 7,
        severity: risk.score >= 85 ? "critical" : risk.score >= 70 ? "high" : "medium",
        title: risk.title, detail: `${risk.id} · ${sourceName(risk.supplierId)} · ${risk.failureProb}% failure probability in 90 days`,
      }));
    }
  }

  for (const sub of PPAP_SUBMISSIONS) {
    const summary = ppapSummary(s, sub);
    const program = PROGRAM_BY_ID.get(sub.programId);
    if (!program || summary.overdue === 0 || !sub.blocksSop) continue;
    items.push(exceptionFrom(program, {
      id: `EX-${sub.id}`, kind: "ppap", recordId: sub.id, href: "/ppap", owner: sub.sqe, slipDays: Math.max(1, daysBetween(sub.due, TODAY)),
      severity: daysFromToday(program.sopDate) < 150 ? "high" : "medium",
      title: `${summary.overdue} PPAP element${summary.overdue > 1 ? "s" : ""} overdue on ${sub.description.toLowerCase()}`,
      detail: `${sub.id} · ${sourceName(sub.supplierId)} · due ${shortDate(sub.due)}, blocks the warrant`,
    }));
  }

  for (const notice of LIFECYCLE_NOTICES) {
    if (noticeState(s, notice.id) !== "open" || RISK_RANK[notice.severity] > 1) continue;
    const program = PROGRAM_BY_ID.get(notice.programIds[0]);
    if (!program) continue;
    items.push(exceptionFrom(program, {
      id: `EX-${notice.id}`, kind: "lifecycle", recordId: notice.id, href: "/lifecycle", owner: notice.owner,
      slipDays: Math.max(0, (notice.leadTimeNow - notice.leadTimeWas) * 7) || (notice.ltbDate ? Math.max(0, daysFromToday(notice.ltbDate)) : 0),
      severity: notice.severity,
      title: noticeHeadline(notice),
      detail: `${notice.id} · ${sourceName(notice.supplierId)} · ${notice.action.toLowerCase()} recommended`,
    }));
  }

  for (const proposal of ALLOCATION_PROPOSALS) {
    if (allocationState(s, proposal.id) === "accepted") continue;
    const program = PROGRAM_BY_ID.get(proposal.programId);
    if (!program) continue;
    items.push(exceptionFrom(program, {
      id: `EX-${proposal.id}`, kind: "capacity", recordId: proposal.id, href: "/ems/capacity", owner: proposal.owner, slipDays: proposal.months.length * 30,
      severity: proposal.months[0] <= 4 ? "high" : "medium",
      title: `${sourceName(proposal.fromEmsId)} is over capacity for ${proposal.months.length} months`,
      detail: `${proposal.id} · move ${proposal.boardsPerMonth.toLocaleString("en-IN")} boards a month to ${sourceName(proposal.toEmsId)} · ${inrL(proposal.costDeltaL)}`,
    }));
  }

  for (const event of SOURCING_EVENTS) {
    if (event.status !== "Evaluation" || eventStatus(s, event) === "Awarded") continue;
    const program = PROGRAM_BY_ID.get(event.programId);
    if (!program || daysFromToday(event.due) > 14) continue;
    items.push(exceptionFrom(program, {
      id: `EX-${event.id}`, kind: "sourcing", recordId: event.id, href: "/sourcing-events", owner: event.buyer, slipDays: Math.max(0, 14 - daysFromToday(event.due)),
      severity: "medium", title: `${event.title}: award decision due ${shortDate(event.due)}`,
      detail: `${event.id} · ${event.bids.length} bids tabulated, recommendation ready`,
    }));
  }

  return items.sort((a, b) => RISK_RANK[a.severity] - RISK_RANK[b.severity] || b.slipDays - a.slipDays);
}

export function noticeHeadline(notice: LifecycleNotice): string {
  switch (notice.type) {
    case "EOL":
      return `${notice.description}: end of life, last-time buy closes ${shortDate(notice.ltbDate)}`;
    case "Allocation":
      return `${notice.description}: on ${notice.allocationPct}% allocation`;
    case "Lead-time creep":
      return `${notice.description}: lead time ${notice.leadTimeWas} to ${notice.leadTimeNow} weeks`;
    default:
      return `${notice.description}: process change needs a delta PPAP`;
  }
}

export const EXCEPTION_KIND_LABEL: Record<ExceptionItem["kind"], string> = {
  "late-po": "Late PO",
  "single-source": "Single source",
  ppap: "PPAP",
  lifecycle: "Lifecycle",
  capacity: "Capacity",
  sourcing: "Award due",
};

// --- pipeline ------------------------------------------------------------------

export function pipeline(): { stage: StageId; count: number; valueCr: number }[] {
  return STAGES.map((stage) => {
    const programs = PROGRAMS.filter((p) => p.stage === stage.id);
    return { stage: stage.id, count: programs.length, valueCr: programs.reduce((sum, p) => sum + p.lifetimeValueCr, 0) };
  });
}

export function atRiskPrograms(s: Status): Program[] {
  return PROGRAMS.filter((p) => RISK_RANK[programRisk(s, p)] <= 1);
}

/** Records tied to one supplier, for the scorecard page. */
export function supplierFootprint(s: Status, supplierId: string) {
  return {
    pos: PURCHASE_ORDERS.filter((po) => po.supplierId === supplierId),
    risks: SUPPLIER_RISKS.filter((r) => r.supplierId === supplierId),
    notices: LIFECYCLE_NOTICES.filter((n) => n.supplierId === supplierId),
    ppaps: PPAP_SUBMISSIONS.filter((p) => p.supplierId === supplierId),
    ncrs: NCRS.filter((n) => n.sourceId === supplierId),
    events: SOURCING_EVENTS.filter((e) => e.bids.some((b) => b.supplierId === supplierId)),
    openRisk: SUPPLIER_RISKS.filter((r) => r.supplierId === supplierId && riskState(s, r.id) !== "closed").length,
  };
}
