"use client";

/**
 * Spend Analytics.
 *
 * Where direct-material money goes, whether it tracks plan, what savings are
 * in the pipeline and which purchases went around the process.
 */

import { ArrowRight, Ban, CircleCheck, UserRoundCheck } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartLegend, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import { Btn, Callout, Drawer, Field, KMark, KpiGrid, KpiLink, Label, RecordLink, SignOff, Stack, useSelection } from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { InlineArrow, KpiTile, Panel, Select, SplitRow, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { BOMS, EMS_PARTNERS, MAVERICK_SPEND, OEMS, PROGRAMS, SAVINGS_PIPELINE, SHOULD_COSTS, SPEND_BY_PROGRAM, SPEND_MONTHLY, SUPPLIERS } from "@/lib/kraya/data";
import { fullDate, inrCr, inrL, shortDate } from "@/lib/kraya/format";
import { programById, programLabel, sourceHref } from "@/lib/kraya/selectors";
import type { MaverickItem, SavingsItem } from "@/lib/kraya/types";

type Dimension = "commodity" | "supplier" | "program" | "oem";
const DIMENSIONS: { id: Dimension; label: string }[] = [
  { id: "commodity", label: "Commodity" },
  { id: "supplier", label: "Supplier" },
  { id: "program", label: "Program" },
  { id: "oem", label: "OEM" },
];

const EMS_LABEL = "EMS conversion";
const STAGES: SavingsItem["stage"][] = ["Identified", "Validated", "Negotiating", "Realised"];
const STAGE_TONE: Record<SavingsItem["stage"], StatusTone> = { Identified: "neutral", Validated: "info", Negotiating: "warning", Realised: "success" };

const MAV_LABEL: Record<string, string> = { routed: "routed to buyer", blocked: "vendor blocked", accepted: "accepted as one-off" };
const MAV_TONE: Record<string, StatusTone> = { routed: "info", blocked: "error", accepted: "neutral" };
const ONE_OFF_REASONS = ["Line-down emergency, approved after the fact", "Engineering prototype, no series impact", "Contracted source had no stock"];

interface Party {
  id: string;
  name: string;
  category: string;
  spendCr: number;
}

const PARTIES: Party[] = [
  ...SUPPLIERS.map((s) => ({ id: s.id, name: s.name, category: s.category as string, spendCr: s.spendCr })),
  ...EMS_PARTNERS.map((e) => ({ id: e.id, name: e.name, category: EMS_LABEL, spendCr: e.spendCr })),
];
const TOTAL_CR = PARTIES.reduce((sum, p) => sum + p.spendCr, 0);

/** Supplier and EMS ids that feed a program. */
function partiesOfProgram(programId: string): Set<string> {
  const ids = new Set<string>();
  for (const node of BOMS[programId] ?? []) if (node.supplierId) ids.add(node.supplierId);
  const ems = programById(programId)?.emsId;
  if (ems) ids.add(ems);
  return ids;
}

const round1 = (value: number) => Math.round(value * 10) / 10;

export default function SpendPage() {
  const { status, get, set, clear } = useKraya();
  const toast = useToast();
  const [dimension, setDimension] = useState<Dimension>("commodity");
  const [scope, setScope] = useState<{ dimension: Dimension; id: string; label: string } | null>(null);
  const [mavId, selectMav] = useSelection("maverick");
  const [reason, setReason] = useState(ONE_OFF_REASONS[0]);

  const chart = useMemo(() => {
    if (dimension === "commodity") {
      const totals = new Map<string, number>();
      for (const p of PARTIES) totals.set(p.category, (totals.get(p.category) ?? 0) + p.spendCr);
      return [...totals.entries()].map(([name, value]) => ({ id: name, name, value: round1(value) })).sort((a, b) => b.value - a.value);
    }
    if (dimension === "supplier") {
      return [...PARTIES].sort((a, b) => b.spendCr - a.spendCr).slice(0, 12).map((p) => ({ id: p.id, name: p.name, value: p.spendCr }));
    }
    if (dimension === "program") {
      return SPEND_BY_PROGRAM.map((row) => ({ id: row.programId, name: programLabel(row.programId), value: row.spendCr }));
    }
    return OEMS.map((oem) => ({
      id: oem.id,
      name: oem.name,
      value: round1(SPEND_BY_PROGRAM.filter((row) => programById(row.programId)?.oemId === oem.id).reduce((sum, row) => sum + row.spendCr, 0)),
    }))
      .filter((row) => row.value > 0)
      .sort((a, b) => b.value - a.value);
  }, [dimension]);

  const inScope = useMemo(() => {
    if (!scope) return PARTIES;
    if (scope.dimension === "commodity") return PARTIES.filter((p) => p.category === scope.id);
    if (scope.dimension === "supplier") return PARTIES.filter((p) => p.id === scope.id);
    const programIds = scope.dimension === "program" ? [scope.id] : PROGRAMS.filter((p) => p.oemId === scope.id).map((p) => p.id);
    const ids = new Set<string>();
    for (const programId of programIds) for (const id of partiesOfProgram(programId)) ids.add(id);
    return PARTIES.filter((p) => ids.has(p.id));
  }, [scope]);

  // Lines pushed from Should-Cost & Negotiation join the pipeline at Identified.
  const allSavings: SavingsItem[] = [
    ...SAVINGS_PIPELINE,
    ...SHOULD_COSTS.filter((line) => status[`sc:${line.id}:pipeline`] === "1").map((line): SavingsItem => {
      const supplier = SUPPLIERS.find((entry) => entry.id === line.supplierId);
      return {
        id: `SAV-${line.id}`,
        title: `${line.description}: should-cost levers`,
        commodity: supplier?.category ?? "Other",
        lever: "Should-cost",
        valueL: Math.round(((line.quoted - line.shouldCost) * line.annualQty) / 10_000) / 10,
        stage: "Identified",
        owner: supplier?.accountOwner ?? "Unassigned",
        due: "2026-12-18",
      };
    }),
  ];
  const stageOf = (item: SavingsItem): SavingsItem["stage"] => {
    const value = status[`sav:${item.id}:stage`] as SavingsItem["stage"] | undefined;
    return value && STAGES.includes(value) ? value : item.stage;
  };

  const savings = allSavings.filter((item) => !scope || scope.dimension !== "commodity" || item.commodity === scope.id);
  const maverick = MAVERICK_SPEND.filter((item) => !scope || scope.dimension !== "commodity" || item.commodity === scope.id);
  const scopeAppliesToLists = !scope || scope.dimension === "commodity";

  const pipelineTotal = allSavings.reduce((sum, item) => sum + item.valueL, 0);
  const realised = allSavings.filter((item) => stageOf(item) === "Realised").reduce((sum, item) => sum + item.valueL, 0);
  const baseRealised = allSavings.filter((item) => item.stage === "Realised").reduce((sum, item) => sum + item.valueL, 0);
  const maverickTotal = MAVERICK_SPEND.reduce((sum, item) => sum + item.valueL, 0);
  const maverickOpen = MAVERICK_SPEND.filter((item) => !status[`mav:${item.id}`]);
  const top5 = [...PARTIES].sort((a, b) => b.spendCr - a.spendCr).slice(0, 5).reduce((sum, p) => sum + p.spendCr, 0);

  const funnel = STAGES.map((stage) => {
    const items = allSavings.filter((item) => stageOf(item) === stage);
    return { stage, count: items.length, valueL: items.reduce((sum, item) => sum + item.valueL, 0) };
  });

  const selectedMav = MAVERICK_SPEND.find((item) => item.id === mavId) ?? null;
  const mavState = selectedMav ? get(`mav:${selectedMav.id}`) : "";

  function advance(item: SavingsItem) {
    const next = STAGES[STAGES.indexOf(stageOf(item)) + 1];
    if (!next) return;
    set(`sav:${item.id}:stage`, next);
    toast(next === "Realised" ? `${item.id} marked realised: ${inrL(item.valueL)} a year, counted from the first invoice at the new price.` : `${item.id} moved to ${next}. ${item.owner} owns the next step.`);
  }

  function decide(item: MaverickItem, decision: "routed" | "blocked" | "accepted") {
    set(`mav:${item.id}`, decision);
    if (decision === "accepted") set(`mav:${item.id}:reason`, reason);
    toast(
      decision === "routed"
        ? `${item.id} routed to the ${item.commodity.toLowerCase()} buyer to bring under contract.`
        : decision === "blocked"
          ? `${item.supplier} blocked for new POs in SAP pending onboarding. ${item.requester} has been told.`
          : `${item.id} accepted as a one-off: ${reason.toLowerCase()}.`,
      decision === "blocked" ? "warning" : "success",
    );
  }

  const partyColumns: Column<Party>[] = [
    { key: "name", header: "Supplier or EMS partner", card: "title", value: (p) => p.name, render: (p) => <RecordLink href={sourceHref(p.id)} className="text-body-sm">{p.name}</RecordLink> },
    { key: "id", header: "Id", hide: "md", value: (p) => p.id, render: (p) => <span className="tabular">{p.id}</span> },
    { key: "category", header: "Commodity", value: (p) => p.category, render: (p) => <span className="whitespace-nowrap">{p.category}</span> },
    { key: "spend", header: "YTD spend", align: "right", card: "metric", value: (p) => p.spendCr, render: (p) => <span className="tabular whitespace-nowrap text-primary">{inrCr(p.spendCr)}</span> },
    { key: "share", header: "Share of total", align: "right", value: (p) => p.spendCr / TOTAL_CR, render: (p) => <span className="tabular">{((p.spendCr / TOTAL_CR) * 100).toFixed(1)}%</span> },
  ];

  const savingsColumns: Column<SavingsItem>[] = [
    { key: "id", header: "Id", width: "w-20", value: (i) => i.id, render: (i) => <span className="tabular text-primary">{i.id}</span> },
    { key: "title", header: "Saving", card: "title", value: (i) => i.title, render: (i) => <span className="text-primary">{i.title}</span> },
    { key: "commodity", header: "Commodity", hide: "md", value: (i) => i.commodity, render: (i) => <span className="whitespace-nowrap">{i.commodity}</span> },
    { key: "lever", header: "Lever", hide: "lg", value: (i) => i.lever, render: (i) => <span className="whitespace-nowrap">{i.lever}</span> },
    { key: "value", header: "Per year", align: "right", card: "metric", value: (i) => i.valueL, render: (i) => <span className="tabular whitespace-nowrap text-primary">{inrL(i.valueL)}</span> },
    { key: "owner", header: "Owner", hide: "md", value: (i) => i.owner, render: (i) => <span className="whitespace-nowrap">{i.owner}</span> },
    { key: "due", header: "Due", align: "right", hide: "lg", value: (i) => i.due, render: (i) => <span className="tabular whitespace-nowrap">{shortDate(i.due)}</span> },
    { key: "stage", header: "Stage", value: (i) => STAGES.indexOf(stageOf(i)), render: (i) => <StatusBadge tone={STAGE_TONE[stageOf(i)]}>{stageOf(i)}</StatusBadge> },
    {
      key: "action", header: "", card: false,
      render: (i) => {
        const stage = stageOf(i);
        const next = STAGES[STAGES.indexOf(stage) + 1];
        return (
          <span className="flex items-center justify-end gap-1">
            {next ? <Btn icon={ArrowRight} onClick={() => advance(i)}>To {next}</Btn> : <span className="text-caption text-quaternary">done</span>}
            {status[`sav:${i.id}:stage`] ? (
              <Btn variant="ghost" onClick={() => { clear(`sav:${i.id}:stage`); toast(`${i.id} back to ${i.stage}.`, "info"); }}>Reset</Btn>
            ) : null}
          </span>
        );
      },
    },
  ];

  const maverickColumns: Column<MaverickItem>[] = [
    { key: "id", header: "Id", width: "w-20", value: (i) => i.id, render: (i) => <span className="tabular text-primary">{i.id}</span> },
    { key: "description", header: "Purchase", card: "title", value: (i) => i.description, render: (i) => <span className="text-primary">{i.description}</span> },
    { key: "supplier", header: "Bought from", value: (i) => i.supplier, render: (i) => <span className="whitespace-nowrap">{i.supplier}</span> },
    { key: "commodity", header: "Commodity", hide: "md", value: (i) => i.commodity, render: (i) => <span className="whitespace-nowrap">{i.commodity}</span> },
    { key: "value", header: "Value", align: "right", card: "metric", value: (i) => i.valueL, render: (i) => <span className="tabular whitespace-nowrap text-primary">{inrL(i.valueL)}</span> },
    { key: "reason", header: "Why it is maverick", hide: "lg", value: (i) => i.reason, render: (i) => <span className="block max-w-[22rem] truncate">{i.reason}</span> },
    { key: "requester", header: "Requester", hide: "lg", value: (i) => i.requester, render: (i) => <span className="whitespace-nowrap">{i.requester}</span> },
    { key: "date", header: "Date", align: "right", hide: "md", value: (i) => i.date, render: (i) => <span className="tabular whitespace-nowrap">{shortDate(i.date)}</span> },
    {
      key: "status", header: "Status", value: (i) => status[`mav:${i.id}`] ?? "open",
      render: (i) => {
        const state = status[`mav:${i.id}`];
        return <StatusBadge tone={state ? MAV_TONE[state] ?? "neutral" : "warning"}>{state ? MAV_LABEL[state] ?? state : "needs decision"}</StatusBadge>;
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Spend Analytics"
        description="Direct-material and EMS spend for FY26-27 to date: where it goes, whether it tracks plan, what is being saved and what was bought around the process."
        mark={<KMark id="mark-spend" size={44} />}
        actions={scope ? <Btn onClick={() => setScope(null)}>{DIMENSIONS.find((d) => d.id === scope.dimension)?.label}: {scope.label} · clear</Btn> : null}
      >
        <FilterChips options={DIMENSIONS} value={dimension} onChange={(id) => setDimension(id as Dimension)} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid cols={5}>
            <KpiTile label="YTD direct spend" value={inrCr(TOTAL_CR)} hint={`${PARTIES.length} suppliers and EMS partners`} mark={<KMark id="mark-spend" />} />
            <KpiLink href="/should-cost">
              <KpiTile label="Savings pipeline" value={inrL(pipelineTotal)} hint={`${allSavings.length} items, per year`} tone="info" />
            </KpiLink>
            <KpiTile label="Savings realised" value={inrL(realised)} delta={realised > baseRealised ? `+${inrL(realised - baseRealised)} this session` : `${Math.round((realised / pipelineTotal) * 100)}% of pipeline`} tone="success" />
            <KpiTile label="Maverick spend" value={inrL(maverickTotal)} delta={`${((maverickTotal / (TOTAL_CR * 100)) * 100).toFixed(2)}% of spend`} hint={`${maverickOpen.length} need a decision`} tone={maverickOpen.length ? "warning" : "success"} />
            <KpiLink href="/suppliers">
              <KpiTile label="Top-5 concentration" value={`${Math.round((top5 / TOTAL_CR) * 100)}%`} hint="share of spend with five parties" />
            </KpiLink>
          </KpiGrid>

          <SplitRow ratio="1.4/1">
            <Panel title={`Where the money goes: by ${DIMENSIONS.find((d) => d.id === dimension)?.label.toLowerCase()}`} action={<span className="text-caption text-quaternary">click a bar to scope the tables</span>}>
              <ChartFrame height={Math.max(240, chart.length * 26 + 40)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                    <XAxis type="number" {...AXIS_PROPS} tickFormatter={(v: number) => `₹${v} Cr`} />
                    <YAxis type="category" dataKey="name" width={dimension === "commodity" ? 112 : 190} interval={0} {...AXIS_PROPS} />
                    <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => inrCr(v)} />} />
                    <Bar
                      dataKey="value"
                      name="YTD spend"
                      radius={[0, 4, 4, 0]}
                      barSize={14}
                      cursor="pointer"
                      isAnimationActive={false}
                      onClick={(_, index) => {
                        const row = chart[index];
                        setScope(scope?.dimension === dimension && scope.id === row.id ? null : { dimension, id: row.id, label: row.name });
                      }}
                    >
                      {chart.map((row) => (
                        <Cell key={row.id} fill={!scope || scope.dimension !== dimension || scope.id === row.id ? SERIES[0] : TONE_COLOR.neutral} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
              {dimension === "program" || dimension === "oem" ? (
                <p className="mt-2 text-caption text-quaternary">Program and OEM views cover spend booked to a program: {inrCr(SPEND_BY_PROGRAM.reduce((sum, row) => sum + row.spendCr, 0))} of {inrCr(TOTAL_CR)}. The rest is shared stock and legacy products.</p>
              ) : null}
            </Panel>

            <Panel title="Are we tracking to plan: monthly spend, actual against plan">
              <ChartFrame height={240}>
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={SPEND_MONTHLY} margin={{ top: 8, right: 12, bottom: 0, left: -8 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="month" {...AXIS_PROPS} />
                    <YAxis {...AXIS_PROPS} tickFormatter={(v: number) => `₹${v}`} />
                    <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => inrCr(v)} />} />
                    <Bar dataKey="actual" name="Actual" barSize={22} radius={[4, 4, 0, 0]} isAnimationActive={false}>
                      {SPEND_MONTHLY.map((row, index) => (
                        <Cell key={row.month} fill={index === SPEND_MONTHLY.length - 1 ? TONE_COLOR.neutral : row.actual > row.plan * 1.03 ? TONE_COLOR.warning : SERIES[0]} />
                      ))}
                    </Bar>
                    <Line type="monotone" dataKey="plan" name="Plan" stroke={SERIES[1]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </ChartFrame>
              <ChartLegend
                items={[
                  { label: "Actual, within 3% of plan", color: SERIES[0] },
                  { label: "Actual, over plan by more than 3%", color: TONE_COLOR.warning },
                  { label: "October, month to date", color: TONE_COLOR.neutral },
                  { label: "Plan", color: SERIES[1] },
                ]}
              />
              <p className="mt-2 text-body-sm text-tertiary">
                July to September ran {inrCr(SPEND_MONTHLY.slice(2, 5).reduce((sum, row) => sum + row.actual - row.plan, 0))} over plan, mostly expedite fees and long-lead buys pulled forward. October shows 12 days only.
              </p>
            </Panel>
          </SplitRow>

          <Panel title={`Spend in scope · ${inScope.length} parties · ${inrCr(inScope.reduce((sum, p) => sum + p.spendCr, 0))}`} padded={false}>
            <DataTable
              rows={inScope}
              columns={partyColumns}
              rowKey={(p) => p.id}
              defaultSort={{ key: "spend", dir: "desc" }}
              pageSize={10}
              searchPlaceholder="Search supplier or commodity"
              exportName="kraya-spend-parties"
              emptyTitle="No supplier in this scope"
            />
          </Panel>

          <Panel title="Savings pipeline: how much is at each stage">
            <div className="grid grid-cols-2 gap-2 lg:grid-cols-4">
              {funnel.map((row, index) => (
                <div key={row.stage} className="flex min-w-0 items-center gap-2 rounded-lg border border-muted bg-page px-3 py-2.5">
                  <div className="min-w-0 flex-1">
                    <Label className="truncate">{row.stage}</Label>
                    <p className={`mt-0.5 font-display text-display-lg tabular ${row.stage === "Realised" ? "text-success" : "text-primary"}`}>{inrL(row.valueL)}</p>
                    <p className="text-caption tabular text-quaternary">{row.count} item{row.count === 1 ? "" : "s"}</p>
                  </div>
                  {index < funnel.length - 1 ? <InlineArrow className="hidden text-quaternary lg:inline-block" /> : null}
                </div>
              ))}
            </div>
            <p className="mt-2 text-caption text-quaternary">A saving counts as realised only after the first invoice at the new price.</p>
          </Panel>

          {!scopeAppliesToLists ? (
            <Callout>The savings and maverick lists are tagged by commodity, not by {scope?.dimension}. They show everything while this scope is on.</Callout>
          ) : null}

          <Panel title={`Savings items · ${savings.length}`} padded={false}>
            <DataTable
              rows={savings}
              columns={savingsColumns}
              rowKey={(i) => i.id}
              defaultSort={{ key: "value", dir: "desc" }}
              searchPlaceholder="Search saving, lever or owner"
              exportName="kraya-savings"
              emptyTitle="No savings items for this commodity"
              emptyDetail="Clear the scope to see the whole pipeline."
            />
          </Panel>

          <Panel title={`Maverick spend · ${maverick.length}`} padded={false} action={<span className="text-caption text-quaternary">bought outside contract, AVL or approval limits</span>}>
            <DataTable
              rows={maverick}
              columns={maverickColumns}
              rowKey={(i) => i.id}
              onRowClick={(i) => selectMav(i.id)}
              isRowSelected={(i) => i.id === mavId}
              defaultSort={{ key: "value", dir: "desc" }}
              searchPlaceholder="Search purchase, vendor or requester"
              exportName="kraya-maverick-spend"
              emptyTitle="No maverick spend for this commodity"
              emptyDetail="Clear the scope to see every item."
            />
          </Panel>
        </Stack>
      </PageBody>

      <Drawer
        open={Boolean(selectedMav)}
        onClose={() => selectMav(null)}
        title={selectedMav?.id ?? ""}
        subtitle={selectedMav?.description}
        badge={selectedMav ? <StatusBadge tone={mavState ? MAV_TONE[mavState] ?? "neutral" : "warning"}>{mavState ? MAV_LABEL[mavState] ?? mavState : "needs decision"}</StatusBadge> : undefined}
        footer={
          selectedMav ? (
            <>
              <Btn variant="primary" icon={UserRoundCheck} disabled={mavState === "routed"} onClick={() => decide(selectedMav, "routed")}>Route to buyer</Btn>
              <Btn icon={Ban} disabled={mavState === "blocked"} onClick={() => decide(selectedMav, "blocked")}>Block vendor</Btn>
              <Btn icon={CircleCheck} disabled={mavState === "accepted"} onClick={() => decide(selectedMav, "accepted")}>Accept as one-off</Btn>
              {mavState ? (
                <Btn variant="ghost" onClick={() => { clear(`mav:${selectedMav.id}`); clear(`mav:${selectedMav.id}:reason`); toast(`${selectedMav.id} decision withdrawn.`, "info"); }}>Undo</Btn>
              ) : null}
            </>
          ) : null
        }
      >
        {selectedMav ? (
          <>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Bought from">{selectedMav.supplier}</Field>
              <Field label="Value"><span className="font-display text-display-lg tabular text-primary">{inrL(selectedMav.valueL)}</span></Field>
              <Field label="Commodity">{selectedMav.commodity}</Field>
              <Field label="Requester">{selectedMav.requester}</Field>
              <Field label="Date"><span className="tabular">{fullDate(selectedMav.date)}</span></Field>
            </div>
            <Callout label="Why it is maverick" tone="warning">{selectedMav.reason}</Callout>
            {selectedMav.id === "MAV-01" ? (
              <Callout label="Linked quality record">
                Nine parts from this reel failed boundary scan: <RecordLink href="/quality?ncr=NCR-2026-059">NCR-2026-059</RecordLink>.
              </Callout>
            ) : null}
            {selectedMav.id === "MAV-07" ? (
              <Callout label="Linked contract">
                Under the tooling agreement the supplier pays for wear repairs: <RecordLink href="/contracts?contract=CTR-2024-040">CTR-2024-040</RecordLink>.
              </Callout>
            ) : null}
            <div>
              <Label>Reason, if accepted as a one-off</Label>
              <div className="mt-1.5">
                <Select
                  aria-label="One-off reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  className="h-8 w-full rounded-full border border-muted bg-action text-label-sm text-secondary outline-none focus-visible:ring-2 focus-visible:ring-active"
                >
                  {ONE_OFF_REASONS.map((option) => (
                    <option key={option} value={option}>{option}</option>
                  ))}
                </Select>
              </div>
              {mavState === "accepted" ? <p className="mt-1.5 text-caption text-quaternary">Recorded reason: {get(`mav:${selectedMav.id}:reason`, reason)}</p> : null}
            </div>
            <SignOff name="Meenakshi Rao" note="purchases from non-AVL or non-franchised sources need head of procurement sign-off (policy P-07)" />
          </>
        ) : null}
      </Drawer>
    </>
  );
}
