/**
 * Extra command-palette results beyond pages: the records an operator looks
 * up by id or name. Each entry navigates to the page that shows it. List
 * pages read the query parameter and open that record's drawer.
 */

import {
  CONTRACTS,
  EMS_PARTNERS,
  LIFECYCLE_NOTICES,
  NCRS,
  PPAP_SUBMISSIONS,
  PROGRAMS,
  PURCHASE_ORDERS,
  QUOTES,
  RFQS,
  SOURCING_EVENTS,
  SUPPLIERS,
  SUPPLIER_RISKS,
} from "./kraya/data";
import { fullDate, inrL } from "./kraya/format";
import { oemById, sourceName, stageLabel } from "./kraya/selectors";

export interface SearchRecord {
  id: string;
  group: string;
  title: string;
  detail: string;
  href: string;
}

export const SEARCH_RECORDS: SearchRecord[] = [
  ...PROGRAMS.map((p) => ({ id: p.id, group: "Programs", title: `${p.id} · ${p.name}`, detail: `${oemById(p.oemId)?.name ?? ""} · ${p.productCode} · ${stageLabel(p.stage)}`, href: `/programs/${p.id}` })),
  ...SUPPLIERS.map((s) => ({ id: s.id, group: "Suppliers", title: s.name, detail: `${s.id} · ${s.commodity} · ${s.city}`, href: `/suppliers/${s.id}` })),
  ...EMS_PARTNERS.map((e) => ({ id: e.id, group: "EMS partners", title: e.name, detail: `${e.id} · ${e.city} · ${e.smtLines} SMT lines`, href: `/ems?ems=${e.id}` })),
  ...PURCHASE_ORDERS.map((po) => ({ id: po.id, group: "Purchase orders", title: `${po.id} · ${po.component}`, detail: `${sourceName(po.supplierId)} · ${inrL(po.valueL)} · ${po.status}`, href: `/purchase-orders?po=${po.id}` })),
  ...RFQS.map((r) => ({ id: r.id, group: "RFQ packs", title: `${r.id} · ${r.product}`, detail: `${oemById(r.oemId)?.name ?? ""} · ${r.status}`, href: `/rfq?rfq=${r.id}` })),
  ...QUOTES.map((q) => ({ id: q.id, group: "Quotes", title: `${q.id} · ${q.product}`, detail: `${oemById(q.oemId)?.name ?? ""} · ${q.status}`, href: `/quoting?quote=${q.id}` })),
  ...SOURCING_EVENTS.map((e) => ({ id: e.id, group: "Sourcing events", title: `${e.id} · ${e.title}`, detail: `${e.pn} · ${e.status} · ${e.bids.length} bids`, href: `/sourcing-events?event=${e.id}` })),
  ...SUPPLIER_RISKS.map((r) => ({ id: r.id, group: "Supplier risks", title: `${r.id} · ${r.title}`, detail: `${sourceName(r.supplierId)} · ${r.signal} · score ${r.score}`, href: `/supplier-risk?risk=${r.id}` })),
  ...LIFECYCLE_NOTICES.map((n) => ({ id: n.id, group: "Lifecycle notices", title: `${n.id} · ${n.pn}`, detail: `${n.type} · ${sourceName(n.supplierId)}`, href: `/lifecycle?notice=${n.id}` })),
  ...CONTRACTS.map((c) => ({ id: c.id, group: "Contracts", title: `${c.id} · ${c.title}`, detail: `${c.type} · ends ${fullDate(c.end)}`, href: `/contracts?contract=${c.id}` })),
  ...NCRS.map((n) => ({ id: n.id, group: "NCRs", title: `${n.id} · ${n.title}`, detail: `${sourceName(n.sourceId)} · ${n.category} · ${n.detection}`, href: `/quality?ncr=${n.id}` })),
  ...PPAP_SUBMISSIONS.map((p) => ({ id: p.id, group: "PPAP", title: `${p.id} · ${p.description}`, detail: `${sourceName(p.supplierId)} · level ${p.level}`, href: `/ppap?ppap=${p.id}` })),
];
