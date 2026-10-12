"use client";

/**
 * Component Lifecycle Watch.
 *
 * Answers: which parts are going end of life, onto allocation or out in lead
 * time, which programs that touches, and what to buy, qualify or redesign
 * before the deadline passes.
 */

import { Check, RotateCcw } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartLegend, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import {
  Btn,
  Callout,
  Confidence,
  Drawer,
  Evidence,
  Field,
  Figure,
  KMark,
  KpiGrid,
  Label,
  LinkBtn,
  PipelineSteps,
  RecordLink,
  RiskBadge,
  SignOff,
  Stack,
  usePipeline,
  useSelection,
} from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, Select, SplitRow, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { BOMS, LIFECYCLE_NOTICES } from "@/lib/kraya/data";
import { daysFromToday, fullDate, inrL, num, rupees, shortDate } from "@/lib/kraya/format";
import { noticeHeadline, noticeState, programById, readiness, sourceName, type NoticeState } from "@/lib/kraya/selectors";
import type { LifecycleNotice, NoticeType } from "@/lib/kraya/types";

const TYPES: NoticeType[] = ["EOL", "PCN", "Allocation", "Lead-time creep"];
const TYPE_TONE: Record<NoticeType, StatusTone> = { EOL: "error", PCN: "info", Allocation: "warning", "Lead-time creep": "warning" };
const STATE_TONE: Record<NoticeState, StatusTone> = { open: "warning", actioned: "success", dismissed: "neutral" };

const DISMISS_REASONS = ["No impact on a live program", "Covered by an existing buffer", "Duplicate of another notice", "Supplier withdrew the notice"];

const APPROVE_STEPS = [
  "Check quantity against program volume plans",
  "Check budget and approval authority",
  "Raise the requisition or change request in SAP and PLM",
  "Recalculate readiness for the affected programs",
];

/** Units of this part consumed per month across the affected programs, and its piece price. */
function demandFor(notice: LifecycleNotice): { monthly: number; unitCost: number } {
  let monthly = 0;
  let unitCost = 0;
  for (const programId of notice.programIds) {
    const node = BOMS[programId]?.find((n) => n.pn === notice.pn);
    const program = programById(programId);
    if (!node || !program) continue;
    monthly += (program.annualVolume / 12) * node.qty;
    unitCost = unitCost || node.unitCost;
  }
  return { monthly: Math.round(monthly), unitCost };
}

export default function LifecyclePage() {
  const { status, set, clear, actionNotice } = useKraya();
  const toast = useToast();
  const [type, setType] = useState("all");
  const [stateFilter, setStateFilter] = useState("all");
  const [selectedId, select] = useSelection("notice");
  const [cover, setCover] = useState<Record<string, number>>({});
  const [reason, setReason] = useState(DISMISS_REASONS[0]);
  const { run, start, running } = usePipeline();

  const stateOf = (n: LifecycleNotice) => noticeState(status, n.id);
  const typed = type === "all" ? LIFECYCLE_NOTICES : LIFECYCLE_NOTICES.filter((n) => n.type === type);
  const rows = stateFilter === "all" ? typed : typed.filter((n) => stateOf(n) === stateFilter);
  const selected = LIFECYCLE_NOTICES.find((n) => n.id === selectedId) ?? null;

  const open = LIFECYCLE_NOTICES.filter((n) => stateOf(n) === "open");
  const ltbSoon = LIFECYCLE_NOTICES.filter((n) => n.ltbDate && stateOf(n) === "open" && daysFromToday(n.ltbDate) <= 90 && daysFromToday(n.ltbDate) >= 0);
  const allocated = LIFECYCLE_NOTICES.filter((n) => n.type === "Allocation" && stateOf(n) === "open");
  const crept = LIFECYCLE_NOTICES.filter((n) => n.leadTimeNow > n.leadTimeWas);
  const avgCreep = crept.length ? crept.reduce((sum, n) => sum + (n.leadTimeNow - n.leadTimeWas), 0) / crept.length : 0;
  const nextLtb = ltbSoon.map((n) => n.ltbDate as string).sort()[0];

  const creepData = [...crept].sort((a, b) => b.leadTimeNow - b.leadTimeWas - (a.leadTimeNow - a.leadTimeWas)).map((n) => ({ name: n.pn, was: n.leadTimeWas, added: n.leadTimeNow - n.leadTimeWas, id: n.id }));

  function approve(notice: LifecycleNotice) {
    const before = notice.programIds.map((id) => {
      const program = programById(id);
      return program ? readiness(status, program)?.bom ?? 0 : 0;
    });
    start(APPROVE_STEPS, () => {
      actionNotice(notice.id, "actioned");
      const after = notice.programIds.map((id) => {
        const program = programById(id);
        return program ? readiness({ ...status, [`pcn:${notice.id}`]: "actioned" }, program)?.bom ?? 0 : 0;
      });
      const moves = notice.programIds.map((id, i) => `${programById(id)?.productCode ?? id} BOM readiness ${before[i]} to ${after[i]}`).join("; ");
      toast(`${notice.id} actioned under ${notice.owner}. Readiness recalculated: ${moves}.`);
    });
  }

  const columns: Column<LifecycleNotice>[] = [
    { key: "id", header: "Notice", card: "title", value: (n) => n.id, render: (n) => <span className="tabular whitespace-nowrap text-primary">{n.id}</span> },
    {
      key: "part", header: "Part", value: (n) => `${n.pn} ${n.description}`,
      render: (n) => (
        <span className="block min-w-0 max-w-[220px]">
          <span className="block truncate tabular text-primary">{n.pn}</span>
          <span className="block truncate text-caption text-quaternary">{n.description}</span>
        </span>
      ),
    },
    { key: "supplier", header: "Supplier", hide: "md", value: (n) => sourceName(n.supplierId), render: (n) => <RecordLink href={`/suppliers/${n.supplierId}`}>{sourceName(n.supplierId)}</RecordLink> },
    { key: "type", header: "Type", value: (n) => n.type, render: (n) => <StatusBadge tone={TYPE_TONE[n.type]}>{n.type}</StatusBadge> },
    { key: "severity", header: "Severity", value: (n) => n.severity, render: (n) => <RiskBadge risk={n.severity} /> },
    {
      key: "ltb", header: "Last-time buy", value: (n) => n.ltbDate ?? "",
      render: (n) =>
        n.ltbDate ? (
          <span className={`tabular whitespace-nowrap ${daysFromToday(n.ltbDate) <= 60 && stateOf(n) === "open" ? "text-warning" : ""}`}>
            {shortDate(n.ltbDate)} <span className="text-quaternary">· {daysFromToday(n.ltbDate)}d left</span>
          </span>
        ) : (
          <span className="text-quaternary">—</span>
        ),
    },
    {
      key: "lead", header: "Lead time", align: "right", value: (n) => n.leadTimeNow - n.leadTimeWas,
      render: (n) => (
        <span className="tabular whitespace-nowrap">
          {n.leadTimeNow > n.leadTimeWas ? (
            <>
              <span className="text-quaternary">{n.leadTimeWas} to </span>
              <span className="text-warning">{n.leadTimeNow} wk</span>
            </>
          ) : (
            `${n.leadTimeNow} wk`
          )}
        </span>
      ),
    },
    { key: "allocation", header: "Alloc.", align: "right", hide: "md", value: (n) => n.allocationPct ?? "", render: (n) => (n.allocationPct ? <span className="tabular text-warning">{n.allocationPct}%</span> : <span className="text-quaternary">—</span>) },
    { key: "aecq", header: "Qualification", hide: "lg", value: (n) => n.aecq, render: (n) => <span className={`whitespace-nowrap ${n.aecq.startsWith("Not") ? "text-warning" : ""}`}>{n.aecq}</span> },
    {
      key: "programs", header: "Programs", hide: "lg", value: (n) => n.programIds.map((id) => programById(id)?.productCode ?? id).join(", "),
      render: (n) => <span className="block max-w-[180px] truncate tabular">{n.programIds.map((id) => programById(id)?.productCode ?? id).join(", ")}</span>,
    },
    { key: "action", header: "Recommended", value: (n) => n.action, render: (n) => <span className="whitespace-nowrap text-primary">{n.action}</span> },
    { key: "cost", header: "Cost", align: "right", card: "metric", hide: "md", value: (n) => n.actionCostL, render: (n) => <span className="tabular">{n.actionCostL ? inrL(n.actionCostL) : "nil"}</span> },
    { key: "state", header: "State", value: (n) => stateOf(n), render: (n) => <StatusBadge tone={STATE_TONE[stateOf(n)]}>{stateOf(n)}</StatusBadge> },
  ];

  const selState = selected ? stateOf(selected) : "open";
  const demand = selected ? demandFor(selected) : { monthly: 0, unitCost: 0 };
  const defaultMonths = selected?.ltbQty && demand.monthly ? Math.max(3, Math.min(36, Math.round(selected.ltbQty / demand.monthly))) : 12;
  const months = selected ? cover[selected.id] ?? defaultMonths : defaultMonths;
  const ltbQty = demand.monthly * months;
  const ltbCostL = (ltbQty * demand.unitCost) / 100_000;

  return (
    <>
      <PageHeader
        title="Component Lifecycle Watch"
        description="End-of-life and change notices, allocation and lead-time creep on the parts in frozen BOMs, with the buy, qualification or redesign each one needs."
        mark={<KMark id="mark-lifecycle" size={44} />}
        actions={<LinkBtn href="/bom">BOM Intelligence</LinkBtn>}
      >
        <div className="flex flex-col gap-2">
          <FilterChips
            options={[{ id: "all", label: "All types", count: LIFECYCLE_NOTICES.length }, ...TYPES.map((t) => ({ id: t, label: t, count: LIFECYCLE_NOTICES.filter((n) => n.type === t).length }))]}
            value={type}
            onChange={setType}
          />
          <FilterChips
            options={[{ id: "all", label: "Any state", count: typed.length }, ...(["open", "actioned", "dismissed"] as NoticeState[]).map((s) => ({ id: s, label: s[0].toUpperCase() + s.slice(1), count: typed.filter((n) => stateOf(n) === s).length }))]}
            value={stateFilter}
            onChange={setStateFilter}
          />
        </div>
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiTile label="Open notices" value={String(open.length)} hint={`of ${LIFECYCLE_NOTICES.length} received`} delta={`${open.filter((n) => n.severity === "critical" || n.severity === "high").length} high or critical`} tone="warning" mark={<KMark id="mark-lifecycle" />} />
            <KpiTile label="LTB deadlines in 90 days" value={String(ltbSoon.length)} hint={nextLtb ? `next closes ${shortDate(nextLtb)}` : "none inside 90 days"} tone={ltbSoon.length ? "error" : "success"} delta={nextLtb ? `${daysFromToday(nextLtb)}d left` : undefined} />
            <KpiTile label="Parts on allocation" value={String(allocated.length)} hint="supplier confirming under 100%" tone={allocated.length ? "warning" : "success"} delta={allocated.length ? `lowest ${Math.min(...allocated.map((n) => n.allocationPct ?? 100))}%` : undefined} />
            <KpiTile label="Avg lead-time creep" value={`+${avgCreep.toFixed(1)} wk`} hint={`across ${crept.length} parts`} tone="warning" mark={<KMark id="mark-lead-time" />} />
          </KpiGrid>

          <Panel title={`Notices · ${rows.length}`} padded={false} action={<span className="text-caption text-quaternary">open a notice to approve its action</span>}>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(n) => n.id}
              onRowClick={(n) => select(n.id)}
              isRowSelected={(n) => n.id === selectedId}
              defaultSort={{ key: "severity", dir: "asc" }}
              exportName="kraya-lifecycle-notices"
              searchPlaceholder="Search parts, suppliers, notices"
              emptyTitle="No notices match"
              emptyDetail="Change the type or state filter."
            />
          </Panel>

          <SplitRow ratio="1.4/1">
            <Panel title="Which parts have lost the most lead time" action={<span className="text-caption text-quaternary">weeks, click a bar to open</span>}>
              <ChartFrame height={Math.max(200, creepData.length * 34 + 30)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={creepData} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                    <XAxis type="number" {...AXIS_PROPS} unit=" wk" />
                    <YAxis type="category" interval={0} dataKey="name" {...AXIS_PROPS} width={104} />
                    <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => `${v} weeks`} />} />
                    <Bar dataKey="was" name="Was" stackId="lt" fill={SERIES[1]} barSize={14} isAnimationActive={false} className="cursor-pointer" onClick={(entry: { payload?: { id?: string } }) => select(entry.payload?.id ?? null)} />
                    <Bar dataKey="added" name="Added" stackId="lt" fill={TONE_COLOR.warning} radius={[0, 3, 3, 0]} barSize={14} isAnimationActive={false} className="cursor-pointer" onClick={(entry: { payload?: { id?: string } }) => select(entry.payload?.id ?? null)} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
              <ChartLegend items={[{ label: "Lead time before the notice", color: SERIES[1] }, { label: "Weeks added", color: TONE_COLOR.warning }]} />
            </Panel>
            <Panel title="Deadlines that cannot move">
              <ul className="flex flex-col gap-2">
                {LIFECYCLE_NOTICES.filter((n) => n.ltbDate).sort((a, b) => (a.ltbDate as string).localeCompare(b.ltbDate as string)).map((n) => (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => select(n.id)}
                      className="flex w-full min-w-0 items-center gap-3 rounded-md border border-muted bg-raised px-3 py-2 text-left outline-none transition-colors duration-[150ms] hover:border-default focus-visible:ring-2 focus-visible:ring-active"
                    >
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-body-sm tabular text-primary">{n.pn}</span>
                        <span className="block truncate text-caption text-quaternary">Last-time buy closes {fullDate(n.ltbDate)}</span>
                      </span>
                      <span className={`shrink-0 font-display text-display-base tabular ${stateOf(n) !== "open" ? "text-tertiary" : daysFromToday(n.ltbDate as string) <= 60 ? "text-error" : "text-primary"}`}>{daysFromToday(n.ltbDate as string)}d</span>
                      <StatusBadge tone={STATE_TONE[stateOf(n)]}>{stateOf(n)}</StatusBadge>
                    </button>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-caption text-quaternary">A last-time buy placed after its closing date is not accepted by the supplier. Lifecycle data comes from supplier notices and the market feed on Integrations.</p>
            </Panel>
          </SplitRow>
        </Stack>
      </PageBody>

      <Drawer
        open={Boolean(selected)}
        onClose={() => select(null)}
        wide
        title={selected?.id ?? ""}
        subtitle={selected ? noticeHeadline(selected) : null}
        badge={selected ? <><StatusBadge tone={TYPE_TONE[selected.type]}>{selected.type}</StatusBadge><StatusBadge tone={STATE_TONE[selState]}>{selState}</StatusBadge></> : null}
        footer={
          selected ? (
            selState === "open" ? (
              <>
                <Btn variant="primary" icon={Check} disabled={running} onClick={() => approve(selected)}>Approve action</Btn>
                <Select
                  aria-label="Dismiss reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="h-8 max-w-[220px] rounded-full border border-muted bg-action text-label-sm text-secondary outline-none focus-visible:ring-2 focus-visible:ring-active"
                >
                  {DISMISS_REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </Select>
                <Btn disabled={running} onClick={() => { set(`pcn:${selected.id}:reason`, reason); actionNotice(selected.id, "dismissed"); toast(`${selected.id} dismissed: ${reason.toLowerCase()}.`, "info"); }}>Dismiss with reason</Btn>
              </>
            ) : (
              <>
                <span className="min-w-0 flex-1 text-body-sm text-tertiary">
                  {selState === "actioned" ? `Action approved. ${selected.owner} carries it out.` : `Dismissed: ${(status[`pcn:${selected.id}:reason`] ?? "no reason recorded").toLowerCase()}.`}
                </span>
                <Btn icon={RotateCcw} onClick={() => { clear(`pcn:${selected.id}`); toast(`${selected.id} reopened. It counts against readiness again.`, "info"); }}>Reopen</Btn>
              </>
            )
          ) : null
        }
      >
        {selected ? (
          <>
            <p className="text-body-md text-secondary">{selected.summary}</p>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Part"><span className="tabular">{selected.pn}</span></Field>
              <Field label="Supplier"><RecordLink href={`/suppliers/${selected.supplierId}`}>{sourceName(selected.supplierId)}</RecordLink></Field>
              <Field label="Severity"><RiskBadge risk={selected.severity} /></Field>
              <Field label="Issued">{fullDate(selected.issued)}</Field>
              <Field label="Last-time buy closes">{selected.ltbDate ? `${fullDate(selected.ltbDate)} · ${daysFromToday(selected.ltbDate)}d` : "Not applicable"}</Field>
              <Field label="Last shipment">{selected.lastShipDate ? fullDate(selected.lastShipDate) : "Not applicable"}</Field>
              <Field label="Lead time"><span className="tabular">{selected.leadTimeWas === selected.leadTimeNow ? `${selected.leadTimeNow} weeks` : `${selected.leadTimeWas} to ${selected.leadTimeNow} weeks`}</span></Field>
              <Field label="Allocation"><span className="tabular">{selected.allocationPct ? `${selected.allocationPct}% of demand confirmed` : "Not on allocation"}</span></Field>
              <Field label="Qualification">{selected.aecq}</Field>
              <Field label="Alternate">{selected.alternateStatus}</Field>
            </div>

            <div>
              <Label>Affected programs · {selected.programIds.length}</Label>
              <ul className="mt-1.5 flex flex-col gap-1">
                {selected.programIds.map((id) => {
                  const program = programById(id);
                  const ready = program ? readiness(status, program) : null;
                  return (
                    <li key={id} className="flex items-baseline justify-between gap-3 text-body-sm">
                      <RecordLink href={`/programs/${id}`}>{id}</RecordLink>
                      <span className="min-w-0 truncate text-tertiary">
                        {program?.name} · SOP {program ? fullDate(program.sopDate) : ""}{ready ? ` · BOM readiness ${ready.bom}` : ""}
                      </span>
                    </li>
                  );
                })}
              </ul>
            </div>

            <Callout label={`Recommended: ${selected.action}`} tone={selState === "actioned" ? "success" : "neutral"}>
              {selected.actionDetail}
            </Callout>

            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Figure label="Quantity" value={selected.ltbQty ? num(selected.ltbQty) : "—"} hint={selected.ltbQty ? "pieces" : "no buy needed"} />
              <Figure label="Cost of action" value={selected.actionCostL ? inrL(selected.actionCostL) : "nil"} hint={selected.actionCostL >= 500 ? "needs head of procurement" : "inside buyer authority"} tone={selected.actionCostL >= 500 ? "text-warning" : "text-primary"} />
              <div className="col-span-2 self-end sm:col-span-1">
                <Confidence value={selected.confidence} />
              </div>
            </div>

            {selected.action === "Last-time buy" && demand.monthly > 0 ? (
              <div className="rounded-md border border-muted bg-raised px-3 py-3">
                <div className="flex items-baseline justify-between gap-3">
                  <Label>Last-time-buy calculator</Label>
                  <span className="text-body-sm tabular text-primary">{months} months of cover</span>
                </div>
                <input
                  type="range"
                  min={3}
                  max={36}
                  step={1}
                  value={months}
                  aria-label="Months of cover"
                  onChange={(event) => setCover((current) => ({ ...current, [selected.id]: Number(event.target.value) }))}
                  className="mt-2 w-full accent-[var(--brand-accent)]"
                />
                <div className="mt-2 grid grid-cols-3 gap-3">
                  <Figure label="Monthly demand" value={num(demand.monthly)} hint="from volume plans" />
                  <Figure label="Buy quantity" value={num(ltbQty)} hint={`at ${rupees(demand.unitCost)} each`} />
                  <Figure label="Cash tied up" value={inrL(ltbCostL)} tone={months > 24 ? "text-warning" : "text-primary"} />
                </div>
                <p className={`mt-2 text-body-sm ${months > 24 ? "text-warning" : "text-tertiary"}`}>
                  {months > 24
                    ? "Over 24 months breaks the shelf-life rule for moisture-sensitive parts: solderability must be re-tested and the stock re-baked before use."
                    : months === defaultMonths
                      ? "This matches the recommended quantity."
                      : `Recommended cover is ${defaultMonths} months. ${months < defaultMonths ? "Less cover means the successor part must be validated sooner." : "More cover ties up cash and raises obsolescence risk if the program ends early."}`}
                </p>
              </div>
            ) : null}

            {running ? <PipelineSteps run={run} /> : null}

            <Evidence items={selected.evidence} />
            <SignOff name={selected.owner} note="approves the action; agents do not place buys" />
          </>
        ) : null}
      </Drawer>
    </>
  );
}
