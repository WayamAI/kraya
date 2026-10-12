"use client";

/**
 * Should-Cost & Negotiation.
 *
 * Answers: what should this part cost when built up from material, conversion
 * and a fair margin, how far is the quote from that, and which levers close
 * the gap in the supplier meeting.
 */

import { Check, Copy, FileText, Plus } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartLegend, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import { Btn, Callout, Confidence, Figure, KMark, KpiGrid, KpiLink, Label, LinkBtn, PipelineSteps, RecordLink, SignOff, Stack, usePipeline, useSelection } from "@/components/kraya/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, StatusBadge } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { SHOULD_COSTS } from "@/lib/kraya/data";
import { inrL, num, rupees } from "@/lib/kraya/format";
import { programById, sourceName, supplierById } from "@/lib/kraya/selectors";
import type { ShouldCostLine } from "@/lib/kraya/types";

const BREAKDOWN: { key: keyof ShouldCostLine["breakdown"]; label: string; color: string }[] = [
  { key: "material", label: "Material", color: SERIES[0] },
  { key: "conversion", label: "Conversion", color: SERIES[1] },
  { key: "overhead", label: "Overhead", color: SERIES[2] },
  { key: "logistics", label: "Logistics", color: SERIES[3] },
  { key: "margin", label: "Supplier margin", color: SERIES[4] },
];

const BRIEF_STEPS = [
  "Refresh commodity indices and exchange rates",
  "Rebuild the should-cost from material, cycle time and machine rates",
  "Rank the selected levers by evidence strength",
  "Draft opening position, target and walk-away",
];

const gapPct = (line: ShouldCostLine) => ((line.quoted - line.shouldCost) / line.quoted) * 100;
const opportunityL = (line: ShouldCostLine) => ((line.quoted - line.shouldCost) * line.annualQty) / 100_000;

export default function ShouldCostPage() {
  const { get, set } = useKraya();
  const toast = useToast();
  const [selectedId, select] = useSelection("line");
  const [unchecked, setUnchecked] = useState<Record<string, string[]>>({});
  const { run, start, running } = usePipeline();
  const [briefFor, setBriefFor] = useState<string | null>(null);

  const line = SHOULD_COSTS.find((l) => l.id === selectedId) ?? SHOULD_COSTS[0];
  const supplier = supplierById(line.supplierId);
  const program = programById(line.programId);
  const buyer = program?.buyer ?? supplier?.accountOwner ?? "the commodity buyer";

  const off = unchecked[line.id] ?? [];
  const chosen = line.levers.filter((lever) => !off.includes(lever.id));
  const saving = chosen.reduce((sum, lever) => sum + lever.saving, 0);
  const ask = Math.max(line.shouldCost, Math.round((line.quoted - saving) * 10) / 10);
  const annualSavingL = ((line.quoted - ask) * line.annualQty) / 100_000;
  const opening = Math.round((ask - (line.quoted - ask) * 0.25) * 10) / 10;
  const walkAway = Math.round(((ask + line.quoted) / 2) * 10) / 10;
  const briefReady = get(`sc:${line.id}:brief`) === "1";
  const inPipeline = get(`sc:${line.id}:pipeline`) === "1";

  const totalGapL = SHOULD_COSTS.reduce((sum, l) => sum + opportunityL(l), 0);
  const aboveTarget = SHOULD_COSTS.filter((l) => l.quoted > l.target).length;
  const leverCount = SHOULD_COSTS.reduce((sum, l) => sum + l.levers.length, 0);
  const avgConfidence = Math.round(SHOULD_COSTS.reduce((sum, l) => sum + l.confidence, 0) / SHOULD_COSTS.length);

  const chartData = [
    { name: "Target", total: line.target },
    { name: "Quoted", total: line.quoted },
    { name: "Should-cost", ...line.breakdown },
    { name: "Our ask", total: ask },
  ];

  const briefText = [
    `Negotiation brief: ${line.pn} ${line.description} with ${sourceName(line.supplierId)}`,
    `Quoted ${rupees(line.quoted)}, should-cost ${rupees(line.shouldCost)}, program target ${rupees(line.target)}, ${num(line.annualQty)} pieces a year.`,
    `Opening position: ${rupees(opening)}. Target: ${rupees(ask)}. Walk-away: ${rupees(walkAway)}.`,
    "Levers:",
    ...chosen.map((lever, i) => `${i + 1}. ${lever.label} (${rupees(lever.saving)} per piece). ${lever.evidence}`),
    "Talking points:",
    ...line.brief.map((point, i) => `${i + 1}. ${point}`),
    `Annual saving at target: ${inrL(annualSavingL)}. Model confidence ${line.confidence}%. Sign-off: ${buyer}.`,
  ].join("\n");

  function toggleLever(id: string) {
    setUnchecked((current) => {
      const now = current[line.id] ?? [];
      return { ...current, [line.id]: now.includes(id) ? now.filter((x) => x !== id) : [...now, id] };
    });
  }

  function generate() {
    setBriefFor(line.id);
    start(BRIEF_STEPS, () => {
      set(`sc:${line.id}:brief`, "1");
      setBriefFor(null);
      toast(`Negotiation brief ready for ${line.pn}. ${buyer} reviews it before the supplier meeting.`);
    });
  }

  async function copyBrief() {
    try {
      await navigator.clipboard.writeText(briefText);
      toast("Brief copied to the clipboard.");
    } catch {
      toast("Clipboard is blocked in this browser. Select the brief text and copy it by hand.", "warning");
    }
  }

  const columns: Column<ShouldCostLine>[] = [
    {
      key: "pn", header: "Part", card: "title", value: (l) => `${l.pn} ${l.description}`,
      render: (l) => (
        <span className="block min-w-0 max-w-[240px]">
          <span className="block truncate tabular text-primary">{l.pn}</span>
          <span className="block truncate text-caption text-quaternary">{l.description}</span>
        </span>
      ),
    },
    { key: "supplier", header: "Supplier", value: (l) => sourceName(l.supplierId), render: (l) => <RecordLink href={`/suppliers/${l.supplierId}`}>{sourceName(l.supplierId)}</RecordLink> },
    { key: "program", header: "Program", hide: "lg", value: (l) => l.programId, render: (l) => <RecordLink href={`/programs/${l.programId}`}>{programById(l.programId)?.productCode ?? l.programId}</RecordLink> },
    { key: "qty", header: "Qty / yr", align: "right", hide: "lg", value: (l) => l.annualQty, render: (l) => <span className="tabular">{num(l.annualQty)}</span> },
    { key: "target", header: "Target", align: "right", hide: "md", value: (l) => l.target, render: (l) => <span className="tabular">{rupees(l.target)}</span> },
    { key: "quoted", header: "Quoted", align: "right", value: (l) => l.quoted, render: (l) => <span className={`tabular ${l.quoted > l.target ? "text-warning" : "text-primary"}`}>{rupees(l.quoted)}</span> },
    { key: "should", header: "Should-cost", align: "right", value: (l) => l.shouldCost, render: (l) => <span className="tabular text-primary">{rupees(l.shouldCost)}</span> },
    { key: "gap", header: "Gap", align: "right", value: (l) => gapPct(l), render: (l) => <span className="tabular text-warning">{gapPct(l).toFixed(1)}%</span> },
    { key: "opportunity", header: "Annual opportunity", align: "right", card: "metric", value: (l) => opportunityL(l), render: (l) => <span className="tabular text-primary">{inrL(opportunityL(l))}</span> },
    {
      key: "state", header: "State", hide: "md", value: (l) => (get(`sc:${l.id}:pipeline`) === "1" ? "in pipeline" : get(`sc:${l.id}:brief`) === "1" ? "brief ready" : "modelled"),
      render: (l) =>
        get(`sc:${l.id}:pipeline`) === "1" ? <StatusBadge tone="success">in pipeline</StatusBadge> : get(`sc:${l.id}:brief`) === "1" ? <StatusBadge tone="info">brief ready</StatusBadge> : <StatusBadge>modelled</StatusBadge>,
    },
  ];

  return (
    <>
      <PageHeader
        title="Should-Cost & Negotiation"
        description="What each part should cost built up from material, conversion and a fair margin, against what was quoted, with the levers to take into the supplier meeting."
        mark={<KMark id="mark-should-cost" size={44} />}
        actions={<LinkBtn href="/spend">Savings pipeline</LinkBtn>}
      />

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiLink href="/spend">
              <KpiTile label="Quoted vs should-cost" value={inrL(totalGapL)} hint="a year, across modelled lines" tone="warning" delta={`${SHOULD_COSTS.length} lines`} mark={<KMark id="mark-should-cost" />} />
            </KpiLink>
            <KpiTile label="Lines above target" value={`${aboveTarget} of ${SHOULD_COSTS.length}`} hint="quote over program target" tone={aboveTarget ? "error" : "success"} />
            <KpiTile label="Levers identified" value={String(leverCount)} hint="each with evidence" />
            <KpiTile label="Avg model confidence" value={`${avgConfidence}%`} hint="lower where yield data is thin" mark={<KMark id="mark-spend" />} />
          </KpiGrid>

          <Panel title={`Modelled parts · ${SHOULD_COSTS.length}`} padded={false} action={<span className="text-caption text-quaternary">select a part to work the negotiation below</span>}>
            <DataTable
              rows={SHOULD_COSTS}
              columns={columns}
              rowKey={(l) => l.id}
              onRowClick={(l) => select(l.id)}
              isRowSelected={(l) => l.id === line.id}
              defaultSort={{ key: "opportunity", dir: "desc" }}
              exportName="kraya-should-cost"
              searchPlaceholder="Search parts, suppliers"
              pageSize={12}
            />
          </Panel>

          <div className="rounded-lg border border-muted bg-container px-4 py-3.5">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="font-display text-display-lg tabular text-primary">{line.pn}</h3>
                  {inPipeline ? <StatusBadge tone="success">in savings pipeline</StatusBadge> : null}
                </div>
                <p className="mt-1 text-body-md text-secondary">
                  {line.description} · <RecordLink href={`/suppliers/${line.supplierId}`}>{sourceName(line.supplierId)}</RecordLink> · <RecordLink href={`/programs/${line.programId}`}>{line.programId}</RecordLink>
                </p>
              </div>
              <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                <Figure label="Quoted" value={rupees(line.quoted)} />
                <Figure label="Should-cost" value={rupees(line.shouldCost)} />
                <Figure label="Our ask" value={rupees(ask)} tone="text-success" hint={`${chosen.length} of ${line.levers.length} levers`} />
                <Figure label="Annual saving" value={inrL(annualSavingL)} hint={`${num(line.annualQty)} pcs`} />
              </div>
            </div>
          </div>

          <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-5">
            <div className="min-w-0 lg:col-span-2">
              <Panel title="How far is the quote from should-cost" action={<span className="text-caption text-quaternary">₹ per piece</span>}>
                <ChartFrame height={250}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                      <XAxis dataKey="name" {...AXIS_PROPS} interval={0} />
                      <YAxis {...AXIS_PROPS} width={48} tickFormatter={(v: number) => `₹${v}`} />
                      <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => rupees(v)} />} />
                      <ReferenceLine y={line.target} stroke={TONE_COLOR.warning} strokeDasharray="4 4" />
                      <Bar dataKey="total" name="Price" stackId="p" fill={TONE_COLOR.neutral} radius={[3, 3, 0, 0]} barSize={38} isAnimationActive={false} />
                      {BREAKDOWN.map((part, index) => (
                        <Bar key={part.key} dataKey={part.key} name={part.label} stackId="p" fill={part.color} barSize={38} radius={index === BREAKDOWN.length - 1 ? [3, 3, 0, 0] : undefined} isAnimationActive={false} />
                      ))}
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
                <ChartLegend items={BREAKDOWN.map((part) => ({ label: `${part.label} ${rupees(line.breakdown[part.key])}`, color: part.color }))} />
                <p className="mt-2 text-caption text-quaternary">Dashed line is the program target of {rupees(line.target)}. The quote is {gapPct(line).toFixed(1)}% over should-cost.</p>
                <div className="mt-3">
                  <Confidence value={line.confidence} label="Model confidence" />
                </div>
              </Panel>
            </div>

            <div className="min-w-0 lg:col-span-3">
              <Panel title={`Levers · ${rupees(saving)} per piece selected`}>
                <ul className="flex flex-col gap-2">
                  {line.levers.map((lever) => {
                    const on = !off.includes(lever.id);
                    return (
                      <li key={lever.id}>
                        <button
                          type="button"
                          role="checkbox"
                          aria-checked={on}
                          onClick={() => toggleLever(lever.id)}
                          className={`flex w-full min-w-0 items-start gap-3 rounded-md border px-3 py-2.5 text-left outline-none transition-colors duration-[150ms] focus-visible:ring-2 focus-visible:ring-active ${on ? "border-default bg-raised" : "border-muted bg-page hover:bg-raised"}`}
                        >
                          <span className={`mt-0.5 flex size-4 shrink-0 items-center justify-center rounded-[4px] border ${on ? "border-transparent bg-action-primary text-on-color" : "border-default"}`}>
                            {on ? <Check size={11} strokeWidth={2.25} aria-hidden /> : null}
                          </span>
                          <span className="min-w-0 flex-1">
                            <span className={`block text-body-md ${on ? "text-primary" : "text-tertiary"}`}>{lever.label}</span>
                            <span className="mt-0.5 block text-body-sm text-tertiary">{lever.evidence}</span>
                          </span>
                          <span className={`shrink-0 text-body-md tabular ${on ? "text-success" : "text-quaternary"}`}>-{rupees(lever.saving)}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
                <div className="mt-3 grid grid-cols-3 gap-3 border-t border-muted pt-3">
                  <Figure label="Negotiation ask" value={rupees(ask)} hint={ask <= line.shouldCost ? "floored at should-cost" : `quoted less ${rupees(line.quoted - ask)}`} />
                  <Figure label="vs program target" value={`${ask <= line.target ? "-" : "+"}${rupees(Math.abs(Math.round((ask - line.target) * 10) / 10))}`} tone={ask <= line.target ? "text-success" : "text-warning"} hint={ask <= line.target ? "meets target" : "still above target"} />
                  <Figure label="Annual saving" value={inrL(annualSavingL)} hint="at the ask" />
                </div>

                <div className="mt-4">
                  <Label>Talking points</Label>
                  <ol className="mt-1.5 flex flex-col gap-1.5">
                    {line.brief.map((point, index) => (
                      <li key={point} className="flex gap-2.5 text-body-sm text-secondary">
                        <span className="shrink-0 tabular text-quaternary">{index + 1}.</span>
                        <span className="min-w-0">{point}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </Panel>
            </div>
          </div>

          <Panel
            title="Negotiation brief"
            action={
              <div className="flex flex-wrap items-center gap-2">
                <Btn icon={FileText} variant={briefReady ? "secondary" : "primary"} disabled={running} onClick={generate}>
                  {briefReady ? "Regenerate brief" : "Generate negotiation brief"}
                </Btn>
              </div>
            }
          >
            <div className="flex flex-col gap-3">
              {running && briefFor === line.id ? <PipelineSteps run={run} /> : null}
              {briefReady && !(running && briefFor === line.id) ? (
                <>
                  <div className="grid grid-cols-3 gap-3">
                    <Figure label="Opening position" value={rupees(opening)} hint="leaves room to concede" />
                    <Figure label="Target" value={rupees(ask)} hint="quoted less selected levers" tone="text-success" />
                    <Figure label="Walk-away" value={rupees(walkAway)} hint="above this, hold the award" tone="text-warning" />
                  </div>
                  <pre className="max-h-[320px] overflow-auto rounded-md border border-muted bg-raised px-3 py-2.5 font-sans text-body-sm whitespace-pre-wrap text-secondary">{briefText}</pre>
                </>
              ) : !running || briefFor !== line.id ? (
                <Callout>
                  No brief drafted for {line.pn} yet. Choose the levers above, then generate: the brief sets an opening position, a target and a walk-away from the should-cost model and the evidence behind each lever.
                </Callout>
              ) : null}
              <div className="flex flex-wrap items-center justify-between gap-3">
                <SignOff name={buyer} note="reviews the brief; nothing is sent to the supplier from here" />
                <div className="flex flex-wrap gap-2">
                  <Btn icon={Copy} disabled={!briefReady} onClick={copyBrief} title={briefReady ? undefined : "Generate the brief first"}>Copy brief</Btn>
                  {inPipeline ? (
                    <LinkBtn href="/spend">View in savings pipeline</LinkBtn>
                  ) : (
                    <Btn icon={Plus} onClick={() => { set(`sc:${line.id}:pipeline`, "1"); toast(`${line.pn} added to the savings pipeline at ${inrL(annualSavingL)} a year, stage Identified. See Spend Analytics.`); }}>
                      Add to savings pipeline
                    </Btn>
                  )}
                </div>
              </div>
            </div>
          </Panel>
        </Stack>
      </PageBody>
    </>
  );
}
