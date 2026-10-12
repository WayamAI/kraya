/**
 * Primary navigation.
 *
 * One source of truth: the sidebar, the command palette's page results and the
 * top bar's title all read this. Adding a route means adding it here once.
 *
 * Groups with more than one item render as a collapsible tree in the sidebar.
 * Optional `sections` add a second branch level. Keep the sidebar to seven
 * groups or fewer so the collapsed rail never outgrows a laptop viewport.
 */

import {
  BookCheck,
  Bot,
  CalendarClock,
  CircuitBoard,
  ClipboardCheck,
  Factory,
  FileSignature,
  FileStack,
  Gauge,
  Handshake,
  Hourglass,
  LayoutDashboard,
  ListTree,
  Microscope,
  Network,
  PieChart,
  Plug,
  Rocket,
  Ruler,
  Scale,
  Settings,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
  Workflow,
  type LucideIcon,
} from "lucide-react";

import {
  ALLOCATION_PROPOSALS,
  APPROVALS,
  LIFECYCLE_NOTICES,
  NCRS,
  PPAP_SUBMISSIONS,
  PURCHASE_ORDERS,
  RFQS,
  SOURCING_EVENTS,
  SUPPLIER_RISKS,
} from "./kraya/data";
import { poView, ppapSummary } from "./kraya/selectors";

export interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  /** Open-work count shown beside the leaf in the expanded tree. */
  badge?: number;
}

export interface NavSection {
  id: string;
  label: string;
  items: NavItem[];
}

export interface NavGroup {
  id: string;
  label: string;
  icon: LucideIcon;
  items: NavItem[];
  /** Optional second-level labels inside a dropdown. */
  sections?: NavSection[];
  /** Hidden from the sidebar; still indexed for the top bar and search. */
  sidebar?: false;
}

/* Open-work counts at the start of the session, derived from the dataset. */
const OPEN = {
  rfq: RFQS.filter((r) => r.status === "Parsed — Review Required").length,
  lifecycle: LIFECYCLE_NOTICES.filter((n) => n.severity === "critical" || n.severity === "high").length,
  risk: SUPPLIER_RISKS.filter((r) => r.score >= 70).length,
  events: SOURCING_EVENTS.filter((e) => e.status === "Evaluation").length,
  po: PURCHASE_ORDERS.filter((po) => poView({}, po).lateDays > 0).length,
  ncr: NCRS.filter((n) => n.step < 8).length,
  ppap: PPAP_SUBMISSIONS.filter((p) => ppapSummary({}, p).overdue > 0).length,
  capacity: ALLOCATION_PROPOSALS.length,
  approvals: APPROVALS.length,
};

export const NAV_GROUPS: NavGroup[] = [
  {
    id: "command-center",
    label: "Command Center",
    icon: LayoutDashboard,
    items: [{ label: "Command Center", href: "/dashboard", icon: LayoutDashboard }],
  },
  {
    id: "programs",
    label: "Programs",
    icon: Rocket,
    items: [
      { label: "RFQ Intake", href: "/rfq", icon: FileStack, badge: OPEN.rfq },
      { label: "Quoting & Feasibility", href: "/quoting", icon: Workflow },
      { label: "Program Tracker", href: "/programs", icon: Target },
      { label: "ATP / SOP Readiness", href: "/readiness", icon: Gauge },
    ],
  },
  {
    id: "bom-parts",
    label: "BOM & Parts",
    icon: CircuitBoard,
    items: [
      { label: "BOM Intelligence", href: "/bom", icon: ListTree },
      { label: "Component Lifecycle Watch", href: "/lifecycle", icon: Hourglass, badge: OPEN.lifecycle },
      { label: "Should-Cost & Negotiation", href: "/should-cost", icon: Ruler },
    ],
  },
  {
    id: "sourcing",
    label: "Sourcing",
    icon: Handshake,
    items: [],
    sections: [
      {
        id: "suppliers",
        label: "Suppliers",
        items: [
          { label: "Supplier Command Centre", href: "/suppliers", icon: Users },
          { label: "Supplier Risk", href: "/supplier-risk", icon: ShieldAlert, badge: OPEN.risk },
        ],
      },
      {
        id: "buying",
        label: "Buying",
        items: [
          { label: "RFQ Automation & Bids", href: "/sourcing-events", icon: Scale, badge: OPEN.events },
          { label: "PO Tracker", href: "/purchase-orders", icon: ClipboardCheck, badge: OPEN.po },
        ],
      },
      {
        id: "commercial",
        label: "Commercial",
        items: [
          { label: "Contracts", href: "/contracts", icon: FileSignature },
          { label: "Spend Analytics", href: "/spend", icon: PieChart },
        ],
      },
    ],
  },
  {
    id: "quality",
    label: "Quality",
    icon: ShieldCheck,
    items: [
      { label: "Quality & RCA", href: "/quality", icon: Microscope, badge: OPEN.ncr },
      { label: "APQP / PPAP Tracker", href: "/ppap", icon: BookCheck, badge: OPEN.ppap },
    ],
  },
  {
    id: "ems",
    label: "EMS Network",
    icon: Factory,
    items: [
      { label: "Network", href: "/ems", icon: Factory },
      { label: "Capacity ↔ Demand", href: "/ems/capacity", icon: CalendarClock, badge: OPEN.capacity },
      { label: "Performance & Quality", href: "/ems/performance", icon: Gauge },
      { label: "Multi-tier Visibility", href: "/ems/multi-tier", icon: Network },
    ],
  },
  {
    id: "intelligence",
    label: "Intelligence",
    icon: Sparkles,
    items: [
      { label: "Copilot", href: "/copilot", icon: Sparkles },
      { label: "Agents", href: "/agents", icon: Bot, badge: OPEN.approvals },
      { label: "Integrations", href: "/integrations", icon: Plug },
    ],
  },
  {
    id: "administration",
    label: "Administration",
    icon: Settings,
    sidebar: false,
    items: [{ label: "Settings", href: "/settings", icon: Settings }],
  },
];

export function itemsInGroup(group: NavGroup): NavItem[] {
  return group.sections?.length
    ? group.sections.flatMap((section) => section.items)
    : group.items;
}

export const ALL_NAV_ITEMS: NavItem[] = NAV_GROUPS.flatMap(itemsInGroup);

export const SIDEBAR_GROUPS: NavGroup[] = NAV_GROUPS.filter((g) => g.sidebar !== false);

/** Longest-prefix match, so /designs/D-1 still resolves to Designs. */
export function navItemForPath(pathname: string): NavItem | undefined {
  return ALL_NAV_ITEMS.filter(
    (item) => pathname === item.href || pathname.startsWith(`${item.href}/`),
  ).sort((a, b) => b.href.length - a.href.length)[0];
}

export function groupForPath(pathname: string): NavGroup | undefined {
  const item = navItemForPath(pathname);
  if (!item) return undefined;
  return NAV_GROUPS.find((g) => itemsInGroup(g).includes(item));
}
