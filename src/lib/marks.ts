/**
 * Mark registry: every dimensional mark the app uses.
 *
 * id -> fallback Lucide glyph -> where it appears. The render for an id lives
 * at public/images/marks/<id>.png; prompts.md holds the Flow prompt for each,
 * in this order. Until a render exists, <Mark> shows the glyph on an orange tile.
 */

import {
  Award,
  BookCheck,
  Bot,
  Cable,
  Calculator,
  Camera,
  CircuitBoard,
  ClipboardCheck,
  ClipboardList,
  Cpu,
  Disc3,
  Factory,
  FileSearch,
  FileSignature,
  FileStack,
  Flag,
  Gauge,
  Grid3x3,
  Handshake,
  Hourglass,
  Inbox,
  ListTree,
  Mail,
  Microscope,
  Network,
  Package,
  PieChart,
  Plug,
  Receipt,
  Ruler,
  Scale,
  ShieldAlert,
  SlidersHorizontal,
  Sparkles,
  Stamp,
  Thermometer,
  Truck,
  Vault,
  Workflow,
  Wrench,
  type LucideIcon,
} from "lucide-react";

export interface MarkDef {
  id: string;
  icon: LucideIcon;
  /** Where the mark is used. */
  use: string;
}

export const MARKS: MarkDef[] = [
  // Pipeline stages
  { id: "mark-stage-rfi", icon: Mail, use: "Stage flow: RFI Received" },
  { id: "mark-stage-rfq", icon: FileSearch, use: "Stage flow: RFQ Analysis" },
  { id: "mark-stage-quote", icon: Calculator, use: "Stage flow: Quote Submitted" },
  { id: "mark-stage-award", icon: Award, use: "Stage flow: Program Awarded" },
  { id: "mark-stage-bom", icon: ListTree, use: "Stage flow: BOM Finalised" },
  { id: "mark-stage-suppliers", icon: Handshake, use: "Stage flow: Suppliers Onboarded" },
  { id: "mark-stage-po", icon: ClipboardList, use: "Stage flow: POs Placed" },
  { id: "mark-stage-production", icon: Factory, use: "Stage flow: Production Scheduled" },
  { id: "mark-stage-sop", icon: Flag, use: "Stage flow: SOP Achieved" },
  // Command center
  { id: "mark-command", icon: Camera, use: "/dashboard header" },
  { id: "mark-observation", icon: Cpu, use: "Agent observation cards on /dashboard and /programs/[id]" },
  { id: "mark-empty", icon: Inbox, use: "Empty states across the app" },
  // Programs
  { id: "mark-rfq-pack", icon: FileStack, use: "/rfq header, RFQ Agent" },
  { id: "mark-quote-build", icon: Workflow, use: "/quoting header" },
  { id: "mark-program", icon: Wrench, use: "/programs and /programs/[id] headers, active-programs KPI" },
  { id: "mark-readiness", icon: Gauge, use: "/readiness header, SOP hit-rate KPI" },
  // BOM and parts
  { id: "mark-bom", icon: CircuitBoard, use: "/bom header" },
  { id: "mark-lifecycle", icon: Vault, use: "/lifecycle header" },
  { id: "mark-lead-time", icon: Hourglass, use: "Lead-time KPIs on /lifecycle, /bom and /dashboard" },
  { id: "mark-should-cost", icon: Ruler, use: "/should-cost header" },
  { id: "mark-single-source", icon: Cable, use: "Single-source KPIs on /bom, /suppliers and /dashboard" },
  // Sourcing
  { id: "mark-supplier", icon: Disc3, use: "/suppliers and /suppliers/[id] headers, Supplier Evaluation Agent" },
  { id: "mark-supplier-risk", icon: ShieldAlert, use: "/supplier-risk header, Risk Monitoring Agent, at-risk KPI" },
  { id: "mark-sourcing-event", icon: Scale, use: "/sourcing-events header, Bid Comparison Agent" },
  { id: "mark-po", icon: ClipboardCheck, use: "/purchase-orders header" },
  { id: "mark-shipment", icon: Package, use: "In-transit and late-PO KPIs" },
  { id: "mark-contract", icon: FileSignature, use: "/contracts header, Contract Review Agent" },
  { id: "mark-spend", icon: PieChart, use: "/spend header, savings KPI on /should-cost, Spend Optimisation Agent" },
  // Quality
  { id: "mark-quality", icon: Microscope, use: "/quality header" },
  { id: "mark-ppap", icon: BookCheck, use: "/ppap header" },
  // EMS network
  { id: "mark-ems", icon: Bot, use: "/ems header and partner cards" },
  { id: "mark-capacity", icon: Thermometer, use: "/ems/capacity header" },
  { id: "mark-performance", icon: Grid3x3, use: "/ems/performance header" },
  { id: "mark-multi-tier", icon: Network, use: "/ems/multi-tier header" },
  // Intelligence
  { id: "mark-copilot", icon: Sparkles, use: "/copilot header, Copilot agent" },
  { id: "mark-agents", icon: Truck, use: "/agents header" },
  { id: "mark-approval", icon: Stamp, use: "Approvals inbox on /agents" },
  { id: "mark-invoice", icon: Receipt, use: "Invoice Validation Agent" },
  { id: "mark-integrations", icon: Plug, use: "/integrations header" },
  { id: "mark-settings", icon: SlidersHorizontal, use: "/settings header" },
];

const ICON_BY_ID = new Map(MARKS.map((mark) => [mark.id, mark.icon]));

export function markIcon(id: string): LucideIcon {
  return ICON_BY_ID.get(id) ?? Inbox;
}
