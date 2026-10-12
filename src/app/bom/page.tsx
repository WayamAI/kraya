"use client";

/**
 * BOM Intelligence.
 *
 * Answers: what does one unit cost when the structure is rolled up, which
 * lines can stop the program (one source, long lead, lifecycle notice), and
 * what alternates exist for each.
 */

import { ChevronDown, ChevronRight, ChevronsDownUp, ChevronsUpDown, FlaskConical } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES } from "@/components/kraya/charts";
import { Btn, Callout, Drawer, Field, KMark, KpiGrid, KpiLink, Label, LinkBtn, RecordLink, Stack, useSelection } from "@/components/kraya/kit";
import { FilterChips } from "@/components/ui/data-table";
import { EmptyState, KpiTile, Panel, Select, SplitRow, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { BOMS, LIFECYCLE_NOTICES, PPAP_SUBMISSIONS, PROGRAMS, PURCHASE_ORDERS, SUPPLIER_RISKS } from "@/lib/kraya/data";
import { fullDate, rupees } from "@/lib/kraya/format";
import { bomHealth, bomRows, noticeState, oemName, poView, ppapSummary, programById, programsUsing, riskState, sourceName, type BomRow } from "@/lib/kraya/selectors";
import type { BomFlag, Sourcing } from "@/lib/kraya/types";

const BOM_PROGRAMS = PROGRAMS.filter((p) => BOMS[p.id]);

const SOURCING_TONE: Record<Sourcing, StatusTone> = { single: "warning", dual: "info", multi: "success" };

const FLAG_LABEL: Record<BomFlag, string> = {
  "single-source": "single source",
  "extended-lead-time": "long lead",
  "supplier-concentration": "concentration",
  lifecycle: "lifecycle notice",
  allocation: "allocation",
};

const FLAG_TONE: Record<BomFlag, StatusTone> = {
  "single-source": "warning",
  "extended-lead-time": "warning",
  "supplier-concentration": "info",
  lifecycle: "error",
  allocation: "error",
};

const FILTERS: { id: string; label: string; test: (row: BomRow) => boolean }[] = [
  { id: "all", label: "All lines", test: () => true },
  { id: "single", label: "Single-source", test: (r) => r.sourcing === "single" },
  { id: "lead", label: "Long lead (20 wk+)", test: (r) => (r.leadTimeWeeks ?? 0) >= 20 },
  { id: "lifecycle", label: "Lifecycle flag", test: (r) => r.flags.includes("lifecycle") || r.flags.includes("allocation") },
  { id: "concentration", label: "Supplier concentration", test: (r) => r.flags.includes("supplier-concentration") },
];

const ALT_TONE: Record<string, StatusTone> = { Qualified: "success", "In qualification": "info", "Not started": "neutral" };

function BomWorkspace({ programId }: { programId: string }) {
  const { status, get, set } = useKraya();
  const toast = useToast();
  const [collapsed, setCollapsed] = useState<Set<number>>(() => new Set());
  const [filter, setFilter] = useState("all");
  const [pn, selectPn] = useSelection("pn");

  const rows = bomRows(programId);
  const program = programById(programId);
  const health = bomHealth(programId);
  const leaves = rows.filter((r) => !r.hasChildren);
  const assemblies = rows.filter((r) => r.hasChildren);

  const active = FILTERS.find((f) => f.id === filter) ?? FILTERS[0];
  const keep = new Set<number>();
  for (const row of leaves) {
    if (!active.test(row)) continue;
    let cursor: number | null = row.index;
    while (cursor !== null) {
      keep.add(cursor);
      cursor = rows[cursor].parentIndex;
    }
  }

  const isHidden = (row: BomRow) => {
    let cursor = row.parentIndex;
    while (cursor !== null) {
      if (collapsed.has(cursor)) return true;
      cursor = rows[cursor].parentIndex;
    }
    return false;
  };
  const visible = rows.filter((row) => keep.has(row.index) && !isHidden(row));

  const toggle = (index: number) =>
    setCollapsed((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });

  const byCommodity = new Map<string, number>();
  for (const row of leaves) byCommodity.set(row.commodity ?? "Other", (byCommodity.get(row.commodity ?? "Other") ?? 0) + row.extended);
  const commodityData = [...byCommodity.entries()].map(([name, value]) => ({ name, value: Math.round(value) })).sort((a, b) => b.value - a.value);

  const price = program?.unitPrice ?? 0;
  const materialMargin = price ? ((price - health.cost) / price) * 100 : 0;
  const longest = leaves.reduce<BomRow | undefined>((max, r) => ((r.leadTimeWeeks ?? 0) > (max?.leadTimeWeeks ?? 0) ? r : max), undefined);

  const selected = pn ? leaves.find((r) => r.pn === pn) ?? null : null;
  const notices = selected ? LIFECYCLE_NOTICES.filter((n) => n.pn === selected.pn) : [];
  const risks = selected ? SUPPLIER_RISKS.filter((r) => r.pn === selected.pn) : [];
  const pos = selected ? PURCHASE_ORDERS.filter((po) => po.pn === selected.pn) : [];
  const ppaps = selected ? PPAP_SUBMISSIONS.filter((p) => p.pn === selected.pn) : [];
  const whereUsed = selected ? programsUsing(selected.pn) : [];
  const altKey = selected ? `bom:${selected.pn}:altq` : "";
  const altStarted = selected ? get(altKey) === "started" : false;
  const notStarted = selected?.alternates.find((a) => a.status === "Not started");

  return (
    <>
      <Stack>
        <KpiGrid>
          <KpiTile label="Rolled cost per unit" value={rupees(Math.round(health.cost))} hint={`sells at ${rupees(price)}`} delta={`${materialMargin.toFixed(1)}% left after BOM`} tone={materialMargin >= 18 ? "success" : "warning"} mark={<KMark id="mark-bom" />} />
          <KpiLink href="/supplier-risk">
            <KpiTile label="Single-source lines" value={String(health.single)} hint={`of ${health.lines} purchased lines`} tone="warning" delta={`${Math.round((health.single / Math.max(1, health.lines)) * 100)}%`} mark={<KMark id="mark-single-source" />} />
          </KpiLink>
          <KpiTile label="No alternate in work" value={String(health.noAlternate)} hint="single source, nothing in qualification" tone={health.noAlternate ? "error" : "success"} />
          <KpiLink href="/lifecycle">
            <KpiTile label="Longest lead time" value={`${health.maxLead} wk`} hint={longest ? longest.pn : ""} delta={`${health.longLead} lines at 20 wk+`} tone="warning" mark={<KMark id="mark-lead-time" />} />
          </KpiLink>
        </KpiGrid>

        <Panel
          title={`${rows[0]?.pn ?? ""} · indented BOM · ${visible.length} of ${rows.length} lines`}
          padded={false}
          action={
            <div className="flex items-center gap-1.5">
              <Btn variant="ghost" icon={ChevronsUpDown} onClick={() => setCollapsed(new Set())}>Expand all</Btn>
              <Btn variant="ghost" icon={ChevronsDownUp} onClick={() => setCollapsed(new Set(assemblies.filter((a) => a.level > 0).map((a) => a.index)))}>Collapse all</Btn>
            </div>
          }
        >
          <div className="shrink-0 border-b border-muted p-3">
            <FilterChips
              options={FILTERS.map((f) => ({ id: f.id, label: f.label, count: leaves.filter(f.test).length }))}
              value={filter}
              onChange={setFilter}
            />
          </div>
          {visible.length === 0 ? (
            <EmptyState title="No lines carry this flag" detail="Choose another filter." mark={<KMark id="mark-empty" size={44} />} />
          ) : (
            <div className="min-h-0 overflow-x-auto">
              <table className="w-full min-w-[1040px] text-left text-body-sm">
                <thead>
                  <tr className="border-b border-muted">
                    {[
                      ["Part number", ""], ["Description", ""], ["Qty", "text-right"], ["Unit cost", "text-right"], ["Rolled cost", "text-right"],
                      ["Supplier", ""], ["Lead time", "text-right"], ["Sourcing", ""], ["Flags", ""],
                    ].map(([label, align]) => (
                      <th key={label} className={`px-3 py-2 text-caption font-medium tracking-[0.08em] whitespace-nowrap text-quaternary uppercase ${align}`}>{label}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {visible.map((row) => {
                    const open = !collapsed.has(row.index);
                    const isSelected = selected?.index === row.index;
                    return (
                      <tr
                        key={`${row.index}-${row.pn}`}
                        onClick={() => (row.hasChildren ? toggle(row.index) : selectPn(row.pn))}
                        className={`cursor-pointer border-b border-muted transition-colors duration-[150ms] last:border-b-0 hover:bg-raised ${isSelected ? "bg-raised" : ""} ${row.hasChildren ? "bg-page" : ""}`}
                      >
                        <td className="px-3 py-2 whitespace-nowrap">
                          <span className="flex items-center gap-1.5" style={{ paddingLeft: row.level * 18 }}>
                            {row.hasChildren ? (
                              <button
                                type="button"
                                aria-label={open ? `Collapse ${row.pn}` : `Expand ${row.pn}`}
                                aria-expanded={open}
                                onClick={(event) => { event.stopPropagation(); toggle(row.index); }}
                                className="inline-flex size-5 shrink-0 items-center justify-center rounded-full text-tertiary outline-none hover:bg-raised-2 hover:text-primary focus-visible:ring-2 focus-visible:ring-active"
                              >
                                {open ? <ChevronDown size={13} strokeWidth={1.75} aria-hidden /> : <ChevronRight size={13} strokeWidth={1.75} aria-hidden />}
                              </button>
                            ) : (
                              <span aria-hidden className="inline-block size-5 shrink-0" />
                            )}
                            <span className="text-caption text-quaternary">L{row.level}</span>
                            <span className={`tabular ${row.hasChildren ? "font-medium text-primary" : "text-primary"}`}>{row.pn}</span>
                          </span>
                        </td>
                        <td className="max-w-[280px] truncate px-3 py-2 text-secondary">{row.description}</td>
                        <td className="px-3 py-2 text-right tabular text-secondary">{row.qty}</td>
                        <td className="px-3 py-2 text-right tabular text-secondary">{row.hasChildren ? "—" : rupees(row.unitCost)}</td>
                        <td className={`px-3 py-2 text-right tabular ${row.hasChildren ? "text-primary" : "text-secondary"}`}>{rupees(Math.round(row.extended * 10) / 10)}</td>
                        <td className="px-3 py-2 whitespace-nowrap">
                          {row.supplierId ? <RecordLink href={`/suppliers/${row.supplierId}`}>{sourceName(row.supplierId)}</RecordLink> : <span className="text-quaternary">{row.hasChildren ? "—" : row.commodity === "Conversion" ? "EMS partner" : "Sourcing open"}</span>}
                        </td>
                        <td className={`px-3 py-2 text-right tabular ${(row.leadTimeWeeks ?? 0) >= 20 ? "text-warning" : "text-secondary"}`}>{row.leadTimeWeeks ? `${row.leadTimeWeeks} wk` : "—"}</td>
                        <td className="px-3 py-2">{row.sourcing ? <StatusBadge tone={SOURCING_TONE[row.sourcing]}>{row.sourcing}</StatusBadge> : <span className="text-quaternary">—</span>}</td>
                        <td className="px-3 py-2">
                          <span className="flex flex-wrap gap-1">
                            {row.flags.map((flag) => (
                              <StatusBadge key={flag} tone={FLAG_TONE[flag]}>{FLAG_LABEL[flag]}</StatusBadge>
                            ))}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <SplitRow ratio="1.4/1">
          <Panel title="Where does the unit cost sit" action={<span className="text-caption text-quaternary">₹ per unit by commodity</span>}>
            <ChartFrame height={Math.max(200, commodityData.length * 30 + 30)}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={commodityData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" {...AXIS_PROPS} tickFormatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                  <YAxis type="category" interval={0} dataKey="name" {...AXIS_PROPS} width={104} />
                  <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => `${rupees(v)} · ${Math.round((v / Math.max(1, health.cost)) * 100)}% of unit cost`} />} />
                  <Bar dataKey="value" name="Cost per unit" fill={SERIES[0]} radius={[0, 3, 3, 0]} barSize={14} isAnimationActive={false} />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
          </Panel>
          <Panel title="What this BOM needs next">
            <div className="flex flex-col gap-3">
              <Callout tone={health.noAlternate ? "warning" : "success"}>
                {health.noAlternate
                  ? `${health.noAlternate} single-source ${health.noAlternate === 1 ? "line has" : "lines have"} no alternate even in qualification. With a ${health.maxLead}-week longest lead, a second source started today lands after the next order has to be placed.`
                  : "Every single-source line has an alternate qualified or in qualification."}
              </Callout>
              <p className="text-body-sm text-tertiary">
                {commodityData[0] ? `${commodityData[0].name} is ${Math.round((commodityData[0].value / Math.max(1, health.cost)) * 100)}% of the unit cost. ` : ""}
                Open a line to see its alternates, where else it is used, and the notices, risks, orders and PPAP that hang on it.
              </p>
              <div className="flex flex-wrap gap-2">
                <LinkBtn href={`/programs/${programId}`}>Open program</LinkBtn>
                <LinkBtn href="/should-cost">Should-cost models</LinkBtn>
                <LinkBtn href="/lifecycle">Lifecycle watch</LinkBtn>
              </div>
            </div>
          </Panel>
        </SplitRow>
      </Stack>

      <Drawer
        open={Boolean(selected)}
        onClose={() => selectPn(null)}
        title={selected?.pn ?? ""}
        subtitle={selected?.description}
        badge={selected?.sourcing ? <StatusBadge tone={SOURCING_TONE[selected.sourcing]}>{selected.sourcing} source</StatusBadge> : null}
        footer={
          selected && notStarted ? (
            altStarted ? (
              <>
                <StatusBadge tone="info">alternate qualification started</StatusBadge>
                <Btn variant="ghost" onClick={() => { set(altKey, "none"); toast("Alternate qualification request withdrawn.", "info"); }}>Withdraw</Btn>
              </>
            ) : (
              <Btn
                variant="primary"
                icon={FlaskConical}
                onClick={() => { set(altKey, "started"); toast(`Qualification request raised for ${notStarted.pn} at ${notStarted.supplier}. ${program?.sqe ?? "The SQE"} owns the plan.`); }}
              >
                Start alternate qualification
              </Btn>
            )
          ) : selected ? (
            <span className="text-caption text-quaternary">
              {selected.alternates.length ? "Alternates are already qualified or in qualification." : selected.supplierId ? "No alternate identified. Raise a second-source study from Supplier Risk." : "Not a purchased part."}
            </span>
          ) : null
        }
      >
        {selected ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Supplier">
                {selected.supplierId ? <RecordLink href={`/suppliers/${selected.supplierId}`}>{sourceName(selected.supplierId)}</RecordLink> : "—"}
              </Field>
              <Field label="Commodity">{selected.commodity ?? "—"}</Field>
              <Field label="Lead time"><span className="tabular">{selected.leadTimeWeeks ? `${selected.leadTimeWeeks} weeks` : "—"}</span></Field>
              <Field label="Qty per unit"><span className="tabular">{selected.qty}</span></Field>
              <Field label="Unit cost"><span className="tabular">{rupees(selected.unitCost)}</span></Field>
              <Field label="Share of unit cost"><span className="tabular">{((selected.extended / Math.max(1, health.cost)) * 100).toFixed(1)}%</span></Field>
            </div>

            {selected.flags.length ? (
              <div className="flex flex-wrap gap-1.5">
                {selected.flags.map((flag) => (
                  <StatusBadge key={flag} tone={FLAG_TONE[flag]}>{FLAG_LABEL[flag]}</StatusBadge>
                ))}
              </div>
            ) : null}

            <div>
              <Label>AVL alternates · {selected.alternates.length}</Label>
              {selected.alternates.length === 0 ? (
                <p className="mt-1.5 text-body-sm text-tertiary">{selected.sourcing === "single" ? "None on the approved vendor list. This line depends on one supplier." : "No alternates recorded against this line."}</p>
              ) : (
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {selected.alternates.map((a) => {
                    const startedNow = a.status === "Not started" && altStarted;
                    return (
                      <li key={a.pn} className="flex min-w-0 items-center gap-3 rounded-md border border-muted bg-raised px-3 py-2">
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body-sm tabular text-primary">{a.pn}</span>
                          <span className="block truncate text-caption text-quaternary">{a.supplier} · {a.delta}</span>
                        </span>
                        <StatusBadge tone={startedNow ? "info" : ALT_TONE[a.status]}>{startedNow ? "In qualification" : a.status}</StatusBadge>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>

            <div>
              <Label>Where used · {whereUsed.length} {whereUsed.length === 1 ? "program" : "programs"}</Label>
              <ul className="mt-1.5 flex flex-col gap-1">
                {whereUsed.map((id) => (
                  <li key={id} className="flex items-baseline justify-between gap-3 text-body-sm">
                    <RecordLink href={`/programs/${id}`}>{id}</RecordLink>
                    <span className="min-w-0 truncate text-tertiary">{programById(id)?.name} · {oemName(id)}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <Label>Linked records · {notices.length + risks.length + pos.length + ppaps.length}</Label>
              {notices.length + risks.length + pos.length + ppaps.length === 0 ? (
                <p className="mt-1.5 text-body-sm text-tertiary">No notices, risks, open orders or PPAP on this part.</p>
              ) : (
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  {notices.map((notice) => (
                    <li key={notice.id} className="flex items-baseline justify-between gap-3 text-body-sm">
                      <RecordLink href={`/lifecycle?notice=${notice.id}`}>{notice.id}</RecordLink>
                      <span className="min-w-0 truncate text-tertiary">{notice.type} · {noticeState(status, notice.id)}</span>
                    </li>
                  ))}
                  {risks.map((risk) => (
                    <li key={risk.id} className="flex items-baseline justify-between gap-3 text-body-sm">
                      <RecordLink href={`/supplier-risk?risk=${risk.id}`}>{risk.id}</RecordLink>
                      <span className="min-w-0 truncate text-tertiary">{risk.signal} · score {risk.score} · {riskState(status, risk.id)}</span>
                    </li>
                  ))}
                  {pos.map((po) => {
                    const view = poView(status, po);
                    return (
                      <li key={po.id} className="flex items-baseline justify-between gap-3 text-body-sm">
                        <RecordLink href={`/purchase-orders?po=${po.id}`}>{po.id}</RecordLink>
                        <span className={`min-w-0 truncate ${view.lateDays > 0 ? "text-warning" : "text-tertiary"}`}>
                          {view.status} · promised {fullDate(view.promised)}{view.lateDays > 0 ? ` · ${view.lateDays}d late` : ""}
                        </span>
                      </li>
                    );
                  })}
                  {ppaps.map((sub) => {
                    const summary = ppapSummary(status, sub);
                    return (
                      <li key={sub.id} className="flex items-baseline justify-between gap-3 text-body-sm">
                        <RecordLink href={`/ppap?ppap=${sub.id}`}>{sub.id}</RecordLink>
                        <span className={`min-w-0 truncate ${summary.overdue ? "text-warning" : "text-tertiary"}`}>
                          Level {sub.level} · {summary.approved} of {summary.required} approved{summary.overdue ? ` · ${summary.overdue} overdue` : ""}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </>
        ) : null}
      </Drawer>
    </>
  );
}

export default function BomPage() {
  const [linked, selectProgram] = useSelection("program");
  const programId = linked && BOMS[linked] ? linked : BOM_PROGRAMS[0].id;
  const program = programById(programId);

  return (
    <>
      <PageHeader
        title="BOM Intelligence"
        description="The frozen bill of materials for each program, rolled up to a unit cost, with every line that depends on one source, a long lead time or a part under notice."
        mark={<KMark id="mark-bom" size={44} />}
        actions={
          <>
            <span className="text-caption text-quaternary">{program ? oemName(program.id) : ""}</span>
            <Select
              aria-label="Program"
              value={programId}
              onChange={(event) => selectProgram(event.target.value)}
              className="h-8 max-w-[280px] rounded-full border border-muted bg-action text-label-sm text-secondary outline-none focus-visible:ring-2 focus-visible:ring-active"
            >
              {BOM_PROGRAMS.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.productCode} · {p.name}
                </option>
              ))}
            </Select>
          </>
        }
      />
      <PageBody>
        <BomWorkspace key={programId} programId={programId} />
      </PageBody>
    </>
  );
}
