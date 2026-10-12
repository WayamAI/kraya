"use client";

/**
 * Quoting & Feasibility.
 *
 * Answers: what does this product cost us to make, what price does a given
 * margin produce against the OEM target, and can we actually deliver it.
 */

import { ArrowUpRight, Save, Send, Undo2 } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import {
  Btn,
  Callout,
  Evidence,
  Field,
  Figure,
  KMark,
  Label,
  LinkBtn,
  Meter,
  PipelineSteps,
  RecordLink,
  scoreTone,
  SignOff,
  usePipeline,
  useSelection,
} from "@/components/kraya/kit";
import { Panel, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { PEOPLE, QUOTES, RFQS } from "@/lib/kraya/data";
import { inrL, num, relativeDays, rupees, shortDate } from "@/lib/kraya/format";
import { oemById } from "@/lib/kraya/selectors";
import type { Quote, QuoteStatus } from "@/lib/kraya/types";

const STATUS_TONE: Record<QuoteStatus, StatusTone> = { Draft: "neutral", "In Review": "info", Submitted: "success", Escalated: "warning", Won: "success" };

const COST_LINES: { key: keyof Quote["cost"]; label: string }[] = [
  { key: "components", label: "Components" },
  { key: "rawMaterials", label: "Raw materials" },
  { key: "labour", label: "Labour" },
  { key: "tooling", label: "Tooling amort." },
  { key: "logistics", label: "Logistics" },
  { key: "overhead", label: "Overhead" },
];

const FEASIBILITY: { key: keyof Quote["feasibility"]; label: string }[] = [
  { key: "technical", label: "Technical" },
  { key: "supplyChain", label: "Supply chain" },
  { key: "capacity", label: "Capacity" },
  { key: "timeline", label: "Timeline" },
];

const SUBMIT_STEPS = [
  "Freeze cost build-up and margin",
  "Fill the OEM cost breakdown template",
  "Attach feasibility commitment and timing plan",
  "Record sign-off and send through the OEM portal",
];

const totalCost = (quote: Quote) => COST_LINES.reduce((sum, line) => sum + quote.cost[line.key], 0);
const priceAt = (cost: number, marginPct: number) => cost / (1 - marginPct / 100);

interface WaterfallRow {
  name: string;
  base: number;
  value: number;
  kind: "cost" | "margin" | "price";
}

function WaterfallTip({ active, payload }: { active?: boolean; payload?: ReadonlyArray<{ payload?: WaterfallRow }> }) {
  const row = payload?.[0]?.payload;
  if (!active || !row) return null;
  return (
    <div className="rounded-lg border border-muted bg-container px-3 py-2 shadow-lg">
      <p className="text-caption text-quaternary">{row.name}</p>
      <p className="text-body-sm tabular text-primary">{rupees(Math.round(row.value))} per unit</p>
    </div>
  );
}

export default function QuotingPage() {
  const { status, set } = useKraya();
  const toast = useToast();
  const [selectedId, select] = useSelection("quote");
  const [draft, setDraft] = useState<Record<string, number>>({});
  const { run, start, running } = usePipeline();

  const quote = QUOTES.find((q) => q.id === selectedId) ?? QUOTES[0];
  const statusOf = (q: Quote) => (status[`quote:${q.id}:status`] as QuoteStatus | undefined) ?? q.status;
  const savedMargin = (q: Quote) => {
    const saved = Number(status[`quote:${q.id}:margin`]);
    return Number.isFinite(saved) && saved > 0 ? saved : q.marginPct;
  };

  const quoteStatus = statusOf(quote);
  const margin = draft[quote.id] ?? savedMargin(quote);
  const cost = totalCost(quote);
  const price = priceAt(cost, margin);
  const gap = price - quote.targetPrice;
  const gapPct = (gap / quote.targetPrice) * 100;
  const revenueL = (price * quote.annualVolume) / 100_000;
  const marginL = ((price - cost) * quote.annualVolume) / 100_000;
  const belowFloor = margin < quote.marginFloorPct;
  const marginAtTarget = (1 - cost / quote.targetPrice) * 100;
  const dirty = Math.abs(margin - savedMargin(quote)) > 0.001;
  const locked = quoteStatus === "Submitted" || quoteStatus === "Won";

  const overall = Math.round(FEASIBILITY.reduce((sum, f) => sum + quote.feasibility[f.key], 0) / FEASIBILITY.length);
  const weakest = FEASIBILITY.reduce((min, f) => (quote.feasibility[f.key] < quote.feasibility[min.key] ? f : min), FEASIBILITY[0]);

  const waterfall: WaterfallRow[] = COST_LINES.map((line, index) => ({
    name: line.label,
    base: COST_LINES.slice(0, index).reduce((sum, earlier) => sum + quote.cost[earlier.key], 0),
    value: quote.cost[line.key],
    kind: "cost",
  }));
  waterfall.push({ name: "Margin", base: cost, value: price - cost, kind: "margin" });
  waterfall.push({ name: "Price", base: 0, value: price, kind: "price" });

  const rfq = RFQS.find((r) => r.id === quote.rfqId);
  const oem = oemById(quote.oemId)?.name ?? quote.oemId;

  function submit() {
    start(SUBMIT_STEPS, () => {
      set(`quote:${quote.id}:margin`, String(margin));
      set(`quote:${quote.id}:status`, "Submitted");
      toast(`${quote.id} submitted to ${oem} at ${rupees(Math.round(price))} per unit, ${margin.toFixed(1)}% margin.`);
    });
  }

  return (
    <>
      <PageHeader
        title="Quoting & Feasibility"
        description="Cost build-up, the price a margin produces against the OEM target, and whether supply, capacity and timing can back the quote."
        mark={<KMark id="mark-quote-build" size={44} />}
        actions={<LinkBtn href="/rfq" icon={ArrowUpRight}>RFQ intake</LinkBtn>}
      />

      <PageBody>
        <div className="flex min-w-0 flex-col gap-4 xl:flex-row xl:items-start">
          {/* Quote list */}
          <div className="min-w-0 xl:w-[300px] xl:shrink-0">
            <Panel title={`Quotes · ${QUOTES.length}`} padded={false}>
              <ul className="flex flex-col">
                {QUOTES.map((q) => {
                  const active = q.id === quote.id;
                  const m = draft[q.id] ?? savedMargin(q);
                  return (
                    <li key={q.id} className="border-b border-muted last:border-b-0">
                      <button
                        type="button"
                        onClick={() => select(q.id)}
                        aria-pressed={active}
                        className={`flex w-full min-w-0 flex-col gap-1 px-4 py-3 text-left outline-none transition-colors duration-[150ms] focus-visible:ring-2 focus-visible:ring-active ${active ? "bg-raised" : "hover:bg-raised"}`}
                      >
                        <span className="flex items-center justify-between gap-2">
                          <span className="tabular text-body-sm text-primary">{q.id}</span>
                          <StatusBadge tone={STATUS_TONE[statusOf(q)]}>{statusOf(q)}</StatusBadge>
                        </span>
                        <span className="truncate text-body-sm text-secondary">{q.product}</span>
                        <span className="flex items-center justify-between gap-2 text-caption text-quaternary">
                          <span className="truncate">{oemById(q.oemId)?.name}</span>
                          <span className={`shrink-0 tabular ${m < q.marginFloorPct ? "text-warning" : ""}`}>{m.toFixed(1)}% margin</span>
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </div>

          {/* Workspace */}
          <div className="flex min-w-0 flex-1 flex-col gap-4">
            <div className="rounded-lg border border-muted bg-container px-4 py-3.5">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-display text-display-lg tabular text-primary">{quote.id}</h3>
                    <StatusBadge tone={STATUS_TONE[quoteStatus]}>{quoteStatus}</StatusBadge>
                  </div>
                  <p className="mt-1 text-body-md text-secondary">{quote.product}</p>
                </div>
                <div className="grid grid-cols-2 gap-x-6 gap-y-2 sm:grid-cols-4">
                  <Field label="OEM">{oem}</Field>
                  <Field label="Volume / yr"><span className="tabular">{num(quote.annualVolume)}</span></Field>
                  <Field label="Due"><span className="tabular whitespace-nowrap">{shortDate(quote.due)} · {relativeDays(quote.due)}</span></Field>
                  <Field label="Owner">{quote.owner}</Field>
                </div>
              </div>
              <div className="mt-2.5 flex flex-wrap items-center gap-x-4 gap-y-1 text-body-sm text-tertiary">
                <span>
                  RFQ pack: {rfq ? <RecordLink href={`/rfq?rfq=${rfq.id}`}>{rfq.id}</RecordLink> : <span className="tabular">{quote.rfqId} (archived)</span>}
                </span>
                <span>
                  Program: {quote.programId ? <RecordLink href={`/programs/${quote.programId}`}>{quote.programId}</RecordLink> : "opens on award"}
                </span>
              </div>
            </div>

            <div className="grid min-w-0 grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="min-w-0 lg:col-span-3">
                <Panel title="How the unit price is built" action={<span className="text-caption text-quaternary">₹ per unit</span>}>
                  <ChartFrame height={270}>
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={waterfall} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
                        <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                        <XAxis dataKey="name" {...AXIS_PROPS} interval={0} tick={{ fill: "var(--text-quaternary)", fontSize: 10 }} />
                        <YAxis {...AXIS_PROPS} width={52} tickFormatter={(v: number) => `₹${v.toLocaleString("en-IN")}`} />
                        <Tooltip cursor={CURSOR_FILL} content={<WaterfallTip />} />
                        <ReferenceLine y={quote.targetPrice} stroke={TONE_COLOR.warning} strokeDasharray="4 4" />
                        <Bar dataKey="base" stackId="w" fill="transparent" isAnimationActive={false} />
                        <Bar dataKey="value" stackId="w" radius={[3, 3, 0, 0]} isAnimationActive={false}>
                          {waterfall.map((row) => (
                            <Cell key={row.name} fill={row.kind === "price" ? SERIES[0] : row.kind === "margin" ? (belowFloor ? TONE_COLOR.warning : TONE_COLOR.success) : SERIES[1]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </ChartFrame>
                  <p className="mt-2 text-caption text-quaternary">Dashed line is the OEM target of {rupees(quote.targetPrice)}. Components are {Math.round((quote.cost.components / cost) * 100)}% of cost, so the BOM is where price moves.</p>
                  <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 border-t border-muted pt-3 sm:grid-cols-3">
                    {COST_LINES.map((line) => (
                      <div key={line.key} className="flex items-baseline justify-between gap-2">
                        <span className="truncate text-body-sm text-tertiary">{line.label}</span>
                        <span className="text-body-sm tabular text-primary">{rupees(quote.cost[line.key])}</span>
                      </div>
                    ))}
                  </div>
                </Panel>
              </div>

              <div className="min-w-0 lg:col-span-2">
                <Panel title="Margin what-if">
                  <div className="flex flex-col gap-4">
                    <div>
                      <div className="flex items-baseline justify-between gap-3">
                        <Label>Margin</Label>
                        <span className={`font-display text-display-xl tabular ${belowFloor ? "text-warning" : "text-primary"}`}>{margin.toFixed(1)}%</span>
                      </div>
                      <input
                        type="range"
                        min={4}
                        max={20}
                        step={0.1}
                        value={margin}
                        disabled={locked}
                        aria-label="Margin percent"
                        onChange={(event) => setDraft((current) => ({ ...current, [quote.id]: Number(event.target.value) }))}
                        className="mt-2 w-full accent-[var(--brand-accent)] disabled:opacity-40"
                      />
                      <div className="flex justify-between text-caption text-quaternary">
                        <span>4%</span>
                        <span>floor {quote.marginFloorPct}%</span>
                        <span>20%</span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <Figure label="Quoted price" value={rupees(Math.round(price))} hint={`cost ${rupees(cost)}`} />
                      <Figure
                        label="vs OEM target"
                        value={`${gap >= 0 ? "+" : "-"}${rupees(Math.abs(Math.round(gap)))}`}
                        hint={`${gapPct >= 0 ? "+" : ""}${gapPct.toFixed(1)}% on ${rupees(quote.targetPrice)}`}
                        tone={gap > 0 ? "text-warning" : "text-success"}
                      />
                      <Figure label="Annual revenue" value={inrL(revenueL)} hint="at quoted price" />
                      <Figure label="Annual margin" value={inrL(marginL)} hint={`${rupees(Math.round(price - cost))} per unit`} />
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <Btn disabled={locked} onClick={() => setDraft((c) => ({ ...c, [quote.id]: Math.max(4, Math.min(20, Math.round(marginAtTarget * 10) / 10)) }))}>
                        Match OEM target ({marginAtTarget.toFixed(1)}%)
                      </Btn>
                      <Btn icon={Save} disabled={!dirty || locked} onClick={() => { set(`quote:${quote.id}:margin`, String(margin)); toast(`What-if saved on ${quote.id}: ${margin.toFixed(1)}% margin, ${rupees(Math.round(price))} per unit.`); }}>
                        Save what-if
                      </Btn>
                      <Btn variant="ghost" icon={Undo2} disabled={!dirty} onClick={() => setDraft((c) => { const next = { ...c }; delete next[quote.id]; return next; })}>
                        Reset
                      </Btn>
                    </div>

                    {belowFloor ? (
                      <Callout label="Below margin floor" tone="warning">
                        {margin.toFixed(1)}% is under the {quote.marginFloorPct}% floor for this OEM. {PEOPLE.head}, head of procurement, must sign before this can be submitted, or {rupees(Math.ceil(cost - price * (1 - quote.marginFloorPct / 100)))} per unit of cost has to come out.
                      </Callout>
                    ) : gap > 0 ? (
                      <Callout tone="info">Price is {rupees(Math.round(gap))} over the OEM target. Matching the target leaves {marginAtTarget.toFixed(1)}% margin.</Callout>
                    ) : (
                      <Callout tone="success">At or under the OEM target with margin above the floor.</Callout>
                    )}
                  </div>
                </Panel>
              </div>
            </div>

            <Panel title="Can we deliver it" action={<span className="text-caption text-quaternary">feasibility {overall} / 100</span>}>
              <div className="grid min-w-0 grid-cols-1 gap-5 lg:grid-cols-5">
                <div className="flex min-w-0 flex-col gap-3 lg:col-span-2">
                  <div className="flex items-end gap-3">
                    <span className="font-display text-display-3xl tabular text-primary">{overall}</span>
                    <span className="pb-1 text-body-sm text-tertiary">overall · weakest is {weakest.label.toLowerCase()} at {quote.feasibility[weakest.key]}</span>
                  </div>
                  {FEASIBILITY.map((f) => (
                    <div key={f.key}>
                      <div className="flex items-baseline justify-between gap-3">
                        <span className="text-body-sm text-secondary">{f.label}</span>
                        <span className="text-body-sm tabular text-primary">{quote.feasibility[f.key]}</span>
                      </div>
                      <Meter value={quote.feasibility[f.key]} tone={scoreTone(quote.feasibility[f.key])} className="mt-1" />
                    </div>
                  ))}
                </div>
                <div className="min-w-0 lg:col-span-3">
                  <Evidence label="What the scores rest on" items={quote.feasibilityNotes} />
                  <div className="mt-3">
                    <SignOff name={quote.owner} note={`feasibility commitment; ${PEOPLE.head} signs below the margin floor`} />
                  </div>
                </div>
              </div>
            </Panel>

            <div className="rounded-lg border border-muted bg-container px-4 py-3.5">
              <PipelineSteps run={run} />
              {locked ? (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0 text-body-md text-secondary">
                    {quoteStatus === "Won" ? `Awarded by ${oem}. The quote is closed and the program is open.` : `Submitted to ${oem}. Price and margin are frozen until the OEM responds.`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {quote.programId ? <LinkBtn href={`/programs/${quote.programId}`} icon={ArrowUpRight}>Open program</LinkBtn> : null}
                    {quoteStatus === "Submitted" ? (
                      <Btn onClick={() => { set(`quote:${quote.id}:status`, "Draft"); toast(`${quote.id} recalled to draft.`, "info"); }}>Recall to draft</Btn>
                    ) : null}
                  </div>
                </div>
              ) : running ? null : (
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <p className="min-w-0 flex-1 text-body-sm text-tertiary">
                    {belowFloor && quoteStatus !== "Escalated"
                      ? `Submit is blocked: margin is under the ${quote.marginFloorPct}% floor. Escalate for sign-off or raise the margin.`
                      : quoteStatus === "Escalated"
                        ? `Escalated to ${PEOPLE.head}. Submitting now records her sign-off on the margin.`
                        : `Submitting sends ${rupees(Math.round(price))} per unit to ${oem} under ${quote.owner}'s name.`}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    <Btn
                      disabled={quoteStatus === "Escalated"}
                      onClick={() => { set(`quote:${quote.id}:margin`, String(margin)); set(`quote:${quote.id}:status`, "Escalated"); toast(`${quote.id} escalated to ${PEOPLE.head} at ${margin.toFixed(1)}% margin.`, "info"); }}
                    >
                      Escalate to head of procurement
                    </Btn>
                    <Btn variant="primary" icon={Send} disabled={belowFloor && quoteStatus !== "Escalated"} onClick={submit}>
                      Submit to OEM
                    </Btn>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </PageBody>
    </>
  );
}
