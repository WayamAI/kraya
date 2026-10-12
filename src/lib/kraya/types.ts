/**
 * Kraya domain model: program sourcing for an automotive-electronics Tier-1.
 *
 * Money: program, PO, contract and spend values are in lakh (₹1L = ₹100,000)
 * unless the field name ends in `Cr` (crore). Piece prices are plain rupees.
 */

export type RiskLevel = "low" | "medium" | "high" | "critical";

export type StageId =
  | "rfi"
  | "rfq-analysis"
  | "quote-submitted"
  | "awarded"
  | "bom-finalised"
  | "suppliers-onboarded"
  | "pos-placed"
  | "production-scheduled"
  | "sop-achieved";

export interface Stage {
  id: StageId;
  label: string;
  short: string;
  markId: string;
}

export interface Oem {
  id: string;
  name: string;
  segment: string;
  city: string;
}

export interface ReadinessBase {
  bom: number;
  suppliers: number;
  material: number;
  production: number;
  quality: number;
}

export interface Program {
  id: string;
  name: string;
  oemId: string;
  product: string;
  productCode: string;
  stage: StageId;
  daysInStage: number;
  /** Used until the program is awarded; after that risk is computed from readiness. */
  baseRisk: RiskLevel;
  nextMilestone: string;
  nextMilestoneDate: string;
  sopDate: string;
  annualVolume: number;
  /** Selling price per unit, rupees. */
  unitPrice: number;
  lifetimeValueCr: number;
  pm: string;
  buyer: string;
  sqe: string;
  emsId?: string;
  /** Readiness before open issues are subtracted (see selectors). */
  base: ReadinessBase;
}

// --- RFQ intake and quoting ---------------------------------------------------

export type RfqStatus = "New" | "AI Parsing" | "Parsed — Review Required" | "Sent to Quoting";

export interface RfqDocument {
  name: string;
  kind: string;
  pages: number;
}

export interface RfqRequirement {
  label: string;
  value: string;
  source: string;
  confidence: number;
}

export interface RfqGap {
  id: string;
  question: string;
  why: string;
}

export interface RfqPack {
  id: string;
  oemId: string;
  product: string;
  programId?: string;
  received: string;
  due: string;
  status: RfqStatus;
  matchConfidence: number;
  annualVolume: number;
  sopTarget: string;
  /** OEM target price per unit, rupees. */
  targetPrice: number;
  owner: string;
  documents: RfqDocument[];
  requirements: RfqRequirement[];
  gaps: RfqGap[];
}

export type QuoteStatus = "Draft" | "In Review" | "Submitted" | "Escalated" | "Won";

export interface Quote {
  id: string;
  rfqId: string;
  programId?: string;
  oemId: string;
  product: string;
  status: QuoteStatus;
  annualVolume: number;
  /** Per-unit cost build-up in rupees. */
  cost: {
    components: number;
    rawMaterials: number;
    labour: number;
    tooling: number;
    logistics: number;
    overhead: number;
  };
  marginPct: number;
  /** Floor below which the head of procurement must sign. */
  marginFloorPct: number;
  targetPrice: number;
  feasibility: { technical: number; supplyChain: number; capacity: number; timeline: number };
  feasibilityNotes: string[];
  due: string;
  owner: string;
}

// --- suppliers, EMS, parts ----------------------------------------------------

export type SupplierCategory =
  | "Semiconductor"
  | "Passive"
  | "Connector"
  | "PCB"
  | "Optics"
  | "Die-cast"
  | "Seal"
  | "Harness"
  | "Display"
  | "Mechanical"
  | "Module";

export interface Supplier {
  id: string;
  name: string;
  category: SupplierCategory;
  commodity: string;
  city: string;
  country: string;
  otd: number;
  quality: number;
  ppm: number;
  risk: RiskLevel;
  /** Spend, FY26-27 year to date, crore. */
  spendCr: number;
  leadTimeWeeks: number;
  paymentTerms: string;
  certifications: string[];
  financialHealth: "Strong" | "Stable" | "Watch" | "Weak";
  singleSourceParts: number;
  accountOwner: string;
  /** Six monthly OTD readings, May to Oct 2026. */
  otdTrend: number[];
}

export interface EmsPartner {
  id: string;
  name: string;
  city: string;
  state: string;
  smtLines: number;
  /** Rated placements per hour across lines. */
  cph: number;
  /** Boards per month at 2 shifts. */
  capacity: number;
  utilisation: number;
  certifications: string[];
  capabilities: string[];
  ppm: number;
  otif: number;
  fpy: number;
  changeoverMin: number;
  auditScore: number;
  vdaGrade: "A" | "B" | "C";
  risk: RiskLevel;
  spendCr: number;
  findings: { id: string; text: string; severity: "major" | "minor"; due: string }[];
  /** Six monthly readings, May to Oct 2026. */
  ppmTrend: number[];
  otifTrend: number[];
  fpyTrend: number[];
}

export type Sourcing = "single" | "dual" | "multi";
export type BomFlag = "single-source" | "extended-lead-time" | "supplier-concentration" | "lifecycle" | "allocation";

export interface BomNode {
  pn: string;
  description: string;
  level: number;
  qty: number;
  /** Piece price, rupees. Assemblies carry 0 and roll up from children. */
  unitCost: number;
  supplierId?: string;
  leadTimeWeeks?: number;
  sourcing?: Sourcing;
  flags: BomFlag[];
  /** Approved vendor list alternates. */
  alternates: { pn: string; supplier: string; status: "Qualified" | "In qualification" | "Not started"; delta: string }[];
  commodity?: string;
}

export type NoticeType = "EOL" | "PCN" | "Allocation" | "Lead-time creep";
export type NoticeAction = "Last-time buy" | "Qualify alternate" | "Redesign" | "Buffer stock";

export interface LifecycleNotice {
  id: string;
  pn: string;
  description: string;
  supplierId: string;
  type: NoticeType;
  severity: RiskLevel;
  issued: string;
  summary: string;
  ltbDate?: string;
  lastShipDate?: string;
  leadTimeWas: number;
  leadTimeNow: number;
  /** Percent of demand the supplier has confirmed. */
  allocationPct?: number;
  aecq: "AEC-Q100 Grade 2" | "AEC-Q100 Grade 1" | "AEC-Q200" | "AEC-Q102" | "Not automotive qualified";
  alternateStatus: "Qualified" | "In qualification" | "None identified";
  programIds: string[];
  action: NoticeAction;
  actionDetail: string;
  ltbQty?: number;
  actionCostL: number;
  confidence: number;
  evidence: string[];
  owner: string;
}

export interface ShouldCostLine {
  id: string;
  pn: string;
  description: string;
  supplierId: string;
  programId: string;
  annualQty: number;
  target: number;
  quoted: number;
  shouldCost: number;
  breakdown: { material: number; conversion: number; overhead: number; logistics: number; margin: number };
  levers: { id: string; label: string; saving: number; evidence: string }[];
  brief: string[];
  confidence: number;
}

// --- sourcing ----------------------------------------------------------------

export type PoStatus = "Confirmed" | "In Transit" | "Delayed" | "Received";

export interface PurchaseOrder {
  id: string;
  supplierId: string;
  pn: string;
  component: string;
  programId: string;
  qty: number;
  valueL: number;
  orderDate: string;
  /** Supplier's current promise date. */
  promisedDate: string;
  /** Date the program needs material on dock. */
  needDate: string;
  status: PoStatus;
  critical: boolean;
  incoterm: string;
  note: string;
  /** Days a paid expedite can recover. */
  expediteDays: number;
  expediteCostL: number;
}

export type RiskSignal =
  | "Financial"
  | "Delivery"
  | "Quality"
  | "Capacity"
  | "Single-source"
  | "Geopolitical"
  | "Cybersecurity"
  | "Natural disaster";

export interface SupplierRisk {
  id: string;
  supplierId: string;
  signal: RiskSignal;
  score: number;
  /** Probability of a supply failure in the next 90 days. */
  failureProb: number;
  title: string;
  summary: string;
  evidence: string[];
  programIds: string[];
  pn?: string;
  mitigation: { title: string; steps: string[]; costL: number; weeks: number };
  suggestedOwner: string;
  confidence: number;
  detected: string;
}

export interface Bid {
  supplierId: string;
  unitPrice: number;
  toolingL: number;
  freightPct: number;
  dutyPct: number;
  leadTimeWeeks: number;
  paymentDays: number;
  moq: number;
  qualityScore: number;
  note: string;
}

export type EventStatus = "Draft" | "Bidding" | "Evaluation" | "Awarded";

export interface SourcingEvent {
  id: string;
  title: string;
  pn: string;
  commodity: string;
  programId: string;
  status: EventStatus;
  annualQty: number;
  targetPrice: number;
  issued: string;
  due: string;
  buyer: string;
  bids: Bid[];
  recommendation?: { supplierId: string; rationale: string[]; confidence: number };
  awardedTo?: string;
}

export type ClauseStatus = "present" | "weak" | "missing";

export interface Contract {
  id: string;
  supplierId: string;
  title: string;
  type: "LTA" | "MSA" | "Tooling agreement" | "Quality agreement" | "EMS agreement";
  valueCr: number;
  start: string;
  end: string;
  renewalNoticeDays: number;
  autoRenew: boolean;
  owner: string;
  clauses: { id: string; name: string; status: ClauseStatus; excerpt: string; risk: string }[];
}

export interface SavingsItem {
  id: string;
  title: string;
  commodity: string;
  lever: string;
  valueL: number;
  stage: "Identified" | "Validated" | "Negotiating" | "Realised";
  owner: string;
  due: string;
}

export interface MaverickItem {
  id: string;
  description: string;
  supplier: string;
  commodity: string;
  valueL: number;
  reason: string;
  requester: string;
  date: string;
}

// --- quality -----------------------------------------------------------------

export type DefectCategory = "Solder joint" | "Component failure" | "Connector" | "Firmware" | "Cosmetic" | "Dimensional";
export type DetectionPoint = "Incoming" | "In-Process" | "Field";

export interface Ncr {
  id: string;
  title: string;
  category: DefectCategory;
  detection: DetectionPoint;
  severity: RiskLevel;
  /** Supplier or EMS partner id. */
  sourceId: string;
  programId: string;
  pn: string;
  qtyAffected: number;
  raised: string;
  /** Completed 8D disciplines at baseline, 0 to 8. */
  step: number;
  owner: string;
  hypotheses: { cause: string; confidence: number; evidence: string[] }[];
  containment: string[];
  chargebackL: number;
}

export type PpapElementStatus = "approved" | "submitted" | "pending" | "overdue" | "na";

export interface PpapSubmission {
  id: string;
  pn: string;
  description: string;
  supplierId: string;
  programId: string;
  level: 1 | 2 | 3 | 4 | 5;
  due: string;
  sqe: string;
  /** One status per PPAP element, in AIAG order (18 entries). */
  elements: PpapElementStatus[];
  blocksSop: boolean;
  note: string;
}

// --- EMS network -------------------------------------------------------------

export interface CapacityLine {
  emsId: string;
  programId: string;
  /** Boards per month, Oct 2026 to Sep 2027. */
  demand: number[];
}

export interface AllocationProposal {
  id: string;
  programId: string;
  fromEmsId: string;
  toEmsId: string;
  /** Month indexes (0 = Oct 2026) the move applies to. */
  months: number[];
  boardsPerMonth: number;
  rationale: string[];
  costDeltaL: number;
  confidence: number;
  owner: string;
}

export interface TierNode {
  id: string;
  name: string;
  role: string;
  location: string;
  tier: 1 | 2 | 3;
  spof: boolean;
  note?: string;
  children?: TierNode[];
}

export interface TierChain {
  id: string;
  pn: string;
  description: string;
  programIds: string[];
  root: TierNode;
  exposure: string;
  action: string;
}

// --- intelligence ------------------------------------------------------------

export interface Agent {
  id: string;
  name: string;
  purpose: string;
  mode: "Human-in-loop" | "Autonomous";
  runsPerDay: number;
  confidence: number;
  lastAction: string;
  lastRun: string;
  markId: string;
}

export interface AgentEvent {
  id: string;
  agentId: string;
  time: string;
  text: string;
  recordHref?: string;
  recordLabel?: string;
  outcome: "auto" | "queued" | "blocked";
}

export type ApprovalEffect =
  | { kind: "expedite"; poId: string }
  | { kind: "award"; eventId: string; supplierId: string }
  | { kind: "mitigate"; riskId: string }
  | { kind: "allocate"; allocationId: string }
  | { kind: "lifecycle"; noticeId: string }
  | { kind: "none" };

export interface Approval {
  id: string;
  agentId: string;
  title: string;
  detail: string;
  evidence: string[];
  confidence: number;
  valueL: number;
  approver: string;
  policy: string;
  href: string;
  effect: ApprovalEffect;
}

export interface Policy {
  id: string;
  text: string;
  scope: string;
  enabled: boolean;
  locked: boolean;
}

export interface Integration {
  id: string;
  name: string;
  role: string;
  status: "Healthy" | "Degraded" | "Failed";
  lastSync: string;
  records: number;
  latencyMin: number;
  errors24h: number;
  objects: string[];
  note: string;
}

export interface MasterDataIssue {
  id: string;
  system: string;
  object: string;
  record: string;
  issue: string;
  impact: string;
  fix: string;
  severity: RiskLevel;
}

export interface Citation {
  type: string;
  id: string;
  label: string;
  detail: string;
  href: string;
}

export interface CopilotScript {
  id: string;
  prompt: string;
  /** Paragraphs of the grounded answer. */
  answer: string[];
  bullets?: string[];
  citations: Citation[];
  confidence: number;
  followUp: string;
}

// --- derived -----------------------------------------------------------------

export interface Readiness extends ReadinessBase {
  confidence: number;
  risk: RiskLevel;
  /** Human-readable reasons readiness is below its base. */
  drags: { dimension: keyof ReadinessBase; text: string; href: string; points: number }[];
}

export type ExceptionKind = "late-po" | "single-source" | "ppap" | "lifecycle" | "capacity" | "sourcing";

export interface ExceptionItem {
  id: string;
  kind: ExceptionKind;
  severity: RiskLevel;
  title: string;
  detail: string;
  programId: string;
  stage: StageId;
  /** Days of SOP exposure if nothing is done. */
  slipDays: number;
  recordId: string;
  href: string;
  owner: string;
}
