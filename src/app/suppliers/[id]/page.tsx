"use client";

/**
 * Supplier scorecard: one supplier seen through every record it touches.
 */

import { ArrowLeft, CalendarClock, ClipboardList, PauseCircle, PlayCircle } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { ReactNode } from "react";
import { CartesianGrid, Line, LineChart, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartLegend, ChartTip, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import { Btn, Callout, Figure, KMark, Label, Meter, PipelineSteps, RecordLink, RiskBadge, scoreTone, Stack, usePipeline } from "@/components/kraya/kit";
import { EmptyState, Panel, SplitRow, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { BOMS, CONTRACTS } from "@/lib/kraya/data";
import { daysFromToday, fullDate, inrCr, inrL, rupees, shortDate, TREND_MONTHS } from "@/lib/kraya/format";
import {
  eventStatus,
  noticeState,
  poView,
  ppapSummary,
  programLabel,
  riskState,
  supplierById,
  supplierFootprint,
} from "@/lib/kraya/selectors";
import type { Supplier } from "@/lib/kraya/types";

const HEALTH_TONE: Record<Supplier["financialHealth"], StatusTone> = { Strong: "success", Stable: "neutral", Watch: "warning", Weak: "error" };
const HEALTH_SCORE: Record<Supplier["financialHealth"], number> = { Strong: 95, Stable: 82, Watch: 58, Weak: 35 };
const RISK_SCORE: Record<Supplier["risk"], number> = { low: 92, medium: 76, high: 58, critical: 40 };

/** Deterministic sub-scores, each 0 to 100. */
function subScores(s: Supplier) {
  const termDays = Number(s.paymentTerms.replace(/\D/g, "")) || 45;
  const terms = Math.min(96, 48 + termDays * 0.55);
  const delivery = Math.round(s.otd);
  const quality = Math.round(s.quality - Math.min(8, s.ppm / 20));
  const commercial = Math.round(terms * 0.5 + HEALTH_SCORE[s.financialHealth] * 0.5);
  const risk = Math.max(20, RISK_SCORE[s.risk] - s.singleSourceParts * 5);
  const composite = Math.round(delivery * 0.35 + quality * 0.3 + commercial * 0.15 + risk * 0.2);
  return { delivery, quality, commercial, risk, composite };
}

function Row({ children }: { children: ReactNode }) {
  return <li className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-muted px-4 py-2.5 text-body-sm last:border-b-0">{children}</li>;
}

function ListPanel({ title, count, empty, children }: { title: string; count: number; empty: string; children: ReactNode }) {
  return (
    <Panel title={`${title} · ${count}`} padded={false}>
      {count ? <ul className="min-h-0 overflow-y-auto">{children}</ul> : <p className="px-4 py-4 text-body-sm text-quaternary">{empty}</p>}
    </Panel>
  );
}

export default function SupplierScorecardPage() {
  const params = useParams<{ id: string }>();
  const { status, get, set, clear } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const supplier = supplierById(params.id);

  if (!supplier) {
    return (
      <PageBody>
        <EmptyState title={`No supplier ${params.id}`} detail="Check the id, or pick one from the Supplier Command Centre." mark={<KMark id="mark-empty" size={72} />} />
        <div className="mt-3 flex justify-center">
          <Link href="/suppliers" className="text-body-sm text-tertiary underline underline-offset-2 hover:text-primary">Back to suppliers</Link>
        </div>
      </PageBody>
    );
  }

  const id = supplier.id;
  const foot = supplierFootprint(status, id);
  const scores = subScores(supplier);
  const onHold = get(`sup:${id}:hold`) === "1";
  const capRequested = get(`sup:${id}:cap`) === "requested";
  const reviewBooked = get(`sup:${id}:review`) === "booked";
  const contracts = CONTRACTS.filter((c) => c.supplierId === id);
  const trend = supplier.otdTrend.map((otd, index) => ({ month: TREND_MONTHS[index], otd }));
  const trendDelta = supplier.otdTrend[5] - supplier.otdTrend[0];

  const parts = Object.entries(BOMS).flatMap(([programId, nodes]) =>
    nodes.filter((node) => node.supplierId === id).map((node) => ({ programId, node })),
  );
  const openPos = foot.pos.filter((po) => po.status !== "Received");

  function requestCap() {
    pipeline.start(
      ["Collect open NCRs, late POs and audit findings", "Draft the corrective action request with targets", `Send to ${supplier?.name} with a 10-working-day reply date`],
      () => {
        set(`sup:${id}:cap`, "requested");
        toast(`Corrective action plan requested from ${supplier?.name}. ${supplier?.accountOwner} owns the follow-up.`);
      },
    );
  }

  return (
    <>
      <div className="shrink-0 border-b border-muted px-4 py-4 sm:px-5">
        <Link href="/suppliers" className="inline-flex items-center gap-1.5 text-caption text-tertiary transition-colors duration-[150ms] hover:text-primary">
          <ArrowLeft size={12} strokeWidth={1.75} aria-hidden />
          Supplier Command Centre
        </Link>
        <div className="mt-2 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 items-center gap-3">
            <KMark id="mark-supplier" size={44} />
            <div className="min-w-0">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h2 className="min-w-0 font-display text-display-lg text-primary sm:text-display-xl">{supplier.name}</h2>
                <RiskBadge risk={supplier.risk} />
                {onHold ? <StatusBadge tone="warning">new-business hold</StatusBadge> : null}
                {capRequested ? <StatusBadge tone="info">CAP requested</StatusBadge> : null}
                {reviewBooked ? <StatusBadge tone="neutral">review booked</StatusBadge> : null}
              </div>
              <p className="mt-1 text-body-md text-tertiary">
                <span className="tabular">{supplier.id}</span> · {supplier.category} · {supplier.commodity} · {supplier.city}, {supplier.country} · account owner {supplier.accountOwner}
              </p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Btn variant="primary" icon={ClipboardList} onClick={requestCap} disabled={pipeline.running || capRequested}>
              {capRequested ? "CAP requested" : "Request corrective action plan"}
            </Btn>
            <Btn
              icon={CalendarClock}
              onClick={() => {
                if (reviewBooked) {
                  clear(`sup:${id}:review`);
                  toast("Business review cancelled.", "info");
                } else {
                  set(`sup:${id}:review`, "booked");
                  toast(`Quarterly business review booked for 5 Nov 2026 with ${supplier.accountOwner} in the chair.`);
                }
              }}
            >
              {reviewBooked ? "Cancel business review" : "Schedule business review"}
            </Btn>
            <Btn
              icon={onHold ? PlayCircle : PauseCircle}
              onClick={() => {
                if (onHold) {
                  clear(`sup:${id}:hold`);
                  toast(`${supplier.name} released from new-business hold.`, "info");
                } else {
                  set(`sup:${id}:hold`, "1");
                  toast(`${supplier.name} is on new-business hold. Existing POs are not affected.`, "warning");
                }
              }}
            >
              {onHold ? "Release hold" : "Put on new-business hold"}
            </Btn>
          </div>
        </div>
      </div>

      <PageBody>
        <Stack>
          <PipelineSteps run={pipeline.run} />
          {onHold ? (
            <Callout tone="warning" label="New-business hold">
              This supplier will not be invited to new sourcing events until the hold is released. {supplier.accountOwner} releases it.
            </Callout>
          ) : null}

          <Panel title="Scorecard">
            <div className="grid grid-cols-2 gap-x-4 gap-y-4 md:grid-cols-4 @7xl:grid-cols-7">
              <Figure label="On-time delivery" value={`${supplier.otd.toFixed(1)}%`} hint={`${trendDelta >= 0 ? "+" : ""}${trendDelta.toFixed(1)} pts since May`} tone={supplier.otd < 85 ? "text-warning" : "text-primary"} />
              <Figure label="Quality score" value={`${supplier.quality}`} hint="out of 100" />
              <Figure label="PPM" value={String(supplier.ppm)} hint="rolling 6 months" />
              <Figure label="Lead time" value={`${supplier.leadTimeWeeks} wk`} hint="standard, ex-works" tone={supplier.leadTimeWeeks >= 20 ? "text-warning" : "text-primary"} />
              <Figure label="YTD spend" value={inrCr(supplier.spendCr)} hint="FY26-27" />
              <Figure label="Payment terms" value={supplier.paymentTerms} hint="from GRN" />
              <div className="min-w-0">
                <Label>Financial health</Label>
                <div className="mt-1.5"><StatusBadge tone={HEALTH_TONE[supplier.financialHealth]}>{supplier.financialHealth}</StatusBadge></div>
              </div>
            </div>
            <div className="mt-4 border-t border-muted pt-3">
              <Label>Certifications</Label>
              <div className="mt-1.5 flex flex-wrap gap-1.5">
                {supplier.certifications.map((cert) => (
                  <span key={cert} className="rounded-full border border-muted bg-raised px-2.5 py-0.5 text-caption text-secondary">{cert}</span>
                ))}
              </div>
            </div>
          </Panel>

          <SplitRow ratio="1.4/1">
            <Panel title="Is delivery getting better or worse: OTD, May to October">
              <ChartFrame height={230}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trend} margin={{ top: 8, right: 16, bottom: 0, left: -12 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="month" {...AXIS_PROPS} />
                    <YAxis domain={[70, 100]} {...AXIS_PROPS} tickFormatter={(v: number) => `${v}%`} />
                    <Tooltip content={<ChartTip format={(v) => `${v.toFixed(1)}%`} />} />
                    <ReferenceLine y={90} stroke={TONE_COLOR.neutral} strokeDasharray="4 4" />
                    <Line type="monotone" dataKey="otd" name="On-time delivery" stroke={SERIES[0]} strokeWidth={2} dot={{ r: 3 }} isAnimationActive={false} />
                  </LineChart>
                </ResponsiveContainer>
              </ChartFrame>
              <ChartLegend items={[{ label: "On-time delivery", color: SERIES[0] }, { label: "Target 90%", color: TONE_COLOR.neutral }]} />
              <p className="mt-2 text-body-sm text-tertiary">
                {trendDelta <= -3
                  ? `Down ${Math.abs(trendDelta).toFixed(1)} points in five months. Ask for a corrective action plan before the next award.`
                  : trendDelta >= 2
                    ? `Up ${trendDelta.toFixed(1)} points in five months.`
                    : "Flat over five months."}
              </p>
            </Panel>

            <Panel title="What makes up the composite score">
              <div className="flex items-baseline justify-between gap-3">
                <Label>Composite</Label>
                <span className="font-display text-display-xl tabular text-primary">{scores.composite}</span>
              </div>
              <ul className="mt-3 flex flex-col gap-3">
                {[
                  { label: "Delivery", weight: "35%", value: scores.delivery, note: `OTD ${supplier.otd.toFixed(1)}%` },
                  { label: "Quality", weight: "30%", value: scores.quality, note: `score ${supplier.quality}, ${supplier.ppm} PPM` },
                  { label: "Commercial", weight: "15%", value: scores.commercial, note: `${supplier.paymentTerms}, finances ${supplier.financialHealth.toLowerCase()}` },
                  { label: "Risk", weight: "20%", value: scores.risk, note: `${supplier.risk} risk, ${supplier.singleSourceParts} single-source parts` },
                ].map((row) => (
                  <li key={row.label} className="min-w-0">
                    <div className="flex items-baseline justify-between gap-3">
                      <span className="text-body-sm text-secondary">{row.label} <span className="text-quaternary">· weight {row.weight}</span></span>
                      <span className="text-body-sm tabular text-primary">{row.value}</span>
                    </div>
                    <Meter value={row.value} tone={scoreTone(row.value)} className="mt-1" />
                    <p className="mt-0.5 truncate text-caption text-quaternary">{row.note}</p>
                  </li>
                ))}
              </ul>
            </Panel>
          </SplitRow>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <ListPanel title="Open purchase orders" count={openPos.length} empty="No open purchase orders.">
              {openPos.map((po) => {
                const view = poView(status, po);
                return (
                  <Row key={po.id}>
                    <RecordLink href={`/purchase-orders?po=${po.id}`}>{po.id}</RecordLink>
                    <span className="min-w-0 flex-1 truncate text-secondary">{po.component}</span>
                    <span className="tabular text-tertiary">{inrL(po.valueL)}</span>
                    <span className="tabular text-tertiary">promised {shortDate(view.promised)}</span>
                    <StatusBadge tone={view.lateDays > 0 ? "error" : view.status === "In Transit" ? "info" : "neutral"}>
                      {view.lateDays > 0 ? `${view.lateDays}d late` : view.status}
                    </StatusBadge>
                  </Row>
                );
              })}
            </ListPanel>

            <ListPanel title="Risks" count={foot.risks.length} empty="No risk signals on this supplier.">
              {foot.risks.map((risk) => {
                const state = riskState(status, risk.id);
                return (
                  <Row key={risk.id}>
                    <RecordLink href={`/supplier-risk?risk=${risk.id}`}>{risk.id}</RecordLink>
                    <span className="min-w-0 flex-1 truncate text-secondary">{risk.title}</span>
                    <span className="text-tertiary">{risk.signal}</span>
                    <span className="tabular text-tertiary">score {risk.score}</span>
                    <StatusBadge tone={state === "closed" ? "success" : state === "mitigating" ? "info" : state === "assigned" ? "neutral" : "warning"}>{state}</StatusBadge>
                  </Row>
                );
              })}
            </ListPanel>

            <ListPanel title="Lifecycle notices" count={foot.notices.length} empty="No PCN, EOL or allocation notices.">
              {foot.notices.map((notice) => {
                const state = noticeState(status, notice.id);
                return (
                  <Row key={notice.id}>
                    <RecordLink href={`/lifecycle?notice=${notice.id}`}>{notice.id}</RecordLink>
                    <span className="min-w-0 flex-1 truncate text-secondary">{notice.pn} · {notice.type}</span>
                    <span className="text-tertiary">{notice.action}</span>
                    <StatusBadge tone={state === "open" ? "warning" : state === "actioned" ? "success" : "neutral"}>{state}</StatusBadge>
                  </Row>
                );
              })}
            </ListPanel>

            <ListPanel title="PPAP submissions" count={foot.ppaps.length} empty="No PPAP submissions on file.">
              {foot.ppaps.map((sub) => {
                const summary = ppapSummary(status, sub);
                return (
                  <Row key={sub.id}>
                    <RecordLink href={`/ppap?ppap=${sub.id}`}>{sub.id}</RecordLink>
                    <span className="min-w-0 flex-1 truncate text-secondary">{sub.description}</span>
                    <span className="tabular text-tertiary">{summary.approved} of {summary.required} approved</span>
                    <StatusBadge tone={summary.pswSigned ? "success" : summary.overdue ? "error" : "info"}>
                      {summary.pswSigned ? "PSW signed" : summary.overdue ? `${summary.overdue} overdue` : "in progress"}
                    </StatusBadge>
                  </Row>
                );
              })}
            </ListPanel>

            <ListPanel title="NCRs" count={foot.ncrs.length} empty="No non-conformance reports.">
              {foot.ncrs.map((ncr) => (
                <Row key={ncr.id}>
                  <RecordLink href={`/quality?ncr=${ncr.id}`}>{ncr.id}</RecordLink>
                  <span className="min-w-0 flex-1 truncate text-secondary">{ncr.title}</span>
                  <span className="text-tertiary">{ncr.detection}</span>
                  <RiskBadge risk={ncr.severity} />
                </Row>
              ))}
            </ListPanel>

            <ListPanel title="Sourcing events" count={foot.events.length} empty="Not bidding in any sourcing event.">
              {foot.events.map((event) => {
                const bid = event.bids.find((b) => b.supplierId === id);
                const state = eventStatus(status, event);
                return (
                  <Row key={event.id}>
                    <RecordLink href={`/sourcing-events?event=${event.id}`}>{event.id}</RecordLink>
                    <span className="min-w-0 flex-1 truncate text-secondary">{event.title}</span>
                    {bid ? <span className="tabular text-tertiary">bid {rupees(bid.unitPrice)}</span> : null}
                    <StatusBadge tone={state === "Awarded" ? "success" : state === "Evaluation" ? "warning" : "neutral"}>{state}</StatusBadge>
                  </Row>
                );
              })}
            </ListPanel>

            <ListPanel title="Contracts" count={contracts.length} empty="No contract on file. Purchases run on PO terms only.">
              {contracts.map((contract) => {
                const gaps = contract.clauses.filter((c) => c.status !== "present").length;
                return (
                  <Row key={contract.id}>
                    <RecordLink href={`/contracts?contract=${contract.id}`}>{contract.id}</RecordLink>
                    <span className="min-w-0 flex-1 truncate text-secondary">{contract.title}</span>
                    <span className="tabular text-tertiary">ends {fullDate(contract.end)} · {daysFromToday(contract.end)}d</span>
                    <StatusBadge tone={gaps ? "warning" : "success"}>{gaps ? `${gaps} clause gaps` : "clauses covered"}</StatusBadge>
                  </Row>
                );
              })}
            </ListPanel>

            <ListPanel title="Parts supplied" count={parts.length} empty="No part on a frozen BOM yet.">
              {parts.map(({ programId, node }) => (
                <Row key={`${programId}-${node.pn}`}>
                  <span className="tabular whitespace-nowrap text-primary">{node.pn}</span>
                  <span className="min-w-0 flex-1 truncate text-secondary">{node.description}</span>
                  <span className="tabular text-tertiary">{rupees(node.unitCost)}</span>
                  <RecordLink href={`/programs/${programId}`} className="text-body-sm">{programLabel(programId)}</RecordLink>
                  {node.sourcing === "single" ? <StatusBadge tone="warning">single source</StatusBadge> : <StatusBadge tone="neutral">{node.sourcing ?? "n/a"}</StatusBadge>}
                </Row>
              ))}
            </ListPanel>
          </div>
        </Stack>
      </PageBody>
    </>
  );
}
