"use client";

/**
 * Program detail. One program seen through every record that can hold it up:
 * gates, readiness, BOM, supplier risks, POs, PPAP and lifecycle notices.
 */

import { ArrowLeft, Check } from "lucide-react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, type ReactNode } from "react";

import { PageBody } from "@/components/layout/page-header";
import { ExceptionList } from "@/components/kraya/exception-queue";
import {
  Btn,
  Callout,
  Field,
  Figure,
  KMark,
  Label,
  LinkBtn,
  Meter,
  PipelineSteps,
  RecordLink,
  RiskBadge,
  scoreTone,
  Stack,
  usePipeline,
} from "@/components/kraya/kit";
import { OBSERVATIONS, ObservationCard } from "@/components/kraya/observations";
import { useToast } from "@/components/ui/toast";
import { EmptyState, Panel, SplitRow, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useKraya } from "@/lib/kraya/context";
import {
  ALLOCATION_PROPOSALS,
  LIFECYCLE_NOTICES,
  NCRS,
  PPAP_SUBMISSIONS,
  PURCHASE_ORDERS,
  QUOTES,
  RFQS,
  SOURCING_EVENTS,
  SUPPLIER_RISKS,
} from "@/lib/kraya/data";
import { compact, daysFromToday, fullDate, inrCr, inrL, rupees, shortDate } from "@/lib/kraya/format";
import {
  allocationState,
  annualValueL,
  bomHealth,
  emsById,
  eventStatus,
  exceptions,
  gatesFor,
  ncrStep,
  noticeState,
  oemById,
  poView,
  ppapSummary,
  programById,
  readiness,
  residualScore,
  riskState,
  sourceName,
  stageLabel,
} from "@/lib/kraya/selectors";
import type { ReadinessBase } from "@/lib/kraya/types";

const DIMENSIONS: { id: keyof ReadinessBase; label: string; weight: string }[] = [
  { id: "bom", label: "BOM ready", weight: "20%" },
  { id: "suppliers", label: "Suppliers", weight: "20%" },
  { id: "material", label: "Material", weight: "25%" },
  { id: "production", label: "Production", weight: "15%" },
  { id: "quality", label: "Quality", weight: "20%" },
];

function Row({ children }: { children: ReactNode }) {
  return <li className="flex min-w-0 items-center justify-between gap-3 border-b border-muted py-2 last:border-b-0">{children}</li>;
}

export default function ProgramDetailPage() {
  const params = useParams<{ id: string }>();
  const { status, get, set } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const program = programById(params.id);

  const programExceptions = useMemo(() => exceptions(status).filter((e) => e.programId === params.id), [status, params.id]);

  if (!program) {
    return (
      <PageBody>
        <EmptyState title={`No program ${params.id}`} detail="Check the id, or pick a program from the tracker." mark={<KMark id="mark-empty" size={72} />} />
        <div className="mt-3 flex justify-center">
          <LinkBtn href="/programs">Back to Program Tracker</LinkBtn>
        </div>
      </PageBody>
    );
  }

  const oem = oemById(program.oemId);
  const ready = readiness(status, program);
  const gates = gatesFor(program);
  const ems = emsById(program.emsId);
  const hasBom = bomHealth(program.id).lines > 0;
  const bom = bomHealth(program.id);
  const pos = PURCHASE_ORDERS.filter((po) => po.programId === program.id);
  const risks = SUPPLIER_RISKS.filter((r) => r.programIds.includes(program.id));
  const ppaps = PPAP_SUBMISSIONS.filter((p) => p.programId === program.id);
  const notices = LIFECYCLE_NOTICES.filter((n) => n.programIds.includes(program.id));
  const ncrs = NCRS.filter((n) => n.programId === program.id);
  const events = SOURCING_EVENTS.filter((e) => e.programId === program.id);
  const allocations = ALLOCATION_PROPOSALS.filter((a) => a.programId === program.id);
  const rfq = RFQS.find((r) => r.programId === program.id);
  const quote = QUOTES.find((q) => q.programId === program.id);
  const observations = OBSERVATIONS.filter((o) => o.programId === program.id);
  const reviewRequested = get(`pgm:${program.id}:review`) === "requested";
  const sopDays = daysFromToday(program.sopDate);
  const margin = hasBom ? ((program.unitPrice - bom.cost) / program.unitPrice) * 100 : null;

  function requestReview() {
    pipeline.start(
      ["Collect open exceptions for the gate pack", "Snapshot readiness by dimension", "Draft agenda for the next gate", `Send invite to ${program?.pm ?? "program manager"} and the gate board`],
      () => {
        set(`pgm:${params.id}:review`, "requested");
        toast(`Gate review requested for ${params.id}. ${program?.pm ?? "The program manager"} chairs it.`);
      },
    );
  }

  return (
    <>
      <div className="shrink-0 border-b border-muted px-4 py-4 sm:px-5">
        <Link href="/programs" className="inline-flex items-center gap-1.5 text-caption text-tertiary transition-colors duration-[150ms] hover:text-primary">
          <ArrowLeft size={12} strokeWidth={1.75} aria-hidden />
          Program Tracker
        </Link>
        <div className="mt-2 flex flex-wrap items-start justify-between gap-4">
          <div className="flex min-w-0 items-start gap-3">
            <KMark id="mark-program" size={44} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <h2 className="font-display text-display-lg tabular text-primary sm:text-display-xl">{program.id}</h2>
                <StatusBadge tone="neutral">{stageLabel(program.stage)}</StatusBadge>
                <RiskBadge risk={ready?.risk ?? program.baseRisk} />
                {reviewRequested ? <StatusBadge tone="info">gate review requested</StatusBadge> : null}
              </div>
              <p className="mt-1 text-body-md text-secondary">
                {program.name} · {oem?.name} · <span className="tabular">{program.productCode}</span>
              </p>
              <p className="mt-0.5 text-body-sm text-tertiary">{program.product}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {hasBom ? <LinkBtn href={`/bom?program=${program.id}`}>Open BOM</LinkBtn> : null}
            {quote ? <LinkBtn href={`/quoting?quote=${quote.id}`}>Open quote</LinkBtn> : null}
            {rfq ? <LinkBtn href={`/rfq?rfq=${rfq.id}`}>Open RFQ pack</LinkBtn> : null}
            <Btn variant="primary" onClick={requestReview} disabled={pipeline.running || reviewRequested}>
              {reviewRequested ? "Review requested" : "Request gate review"}
            </Btn>
          </div>
        </div>
      </div>

      <PageBody>
        <Stack>
          <PipelineSteps run={pipeline.run} />

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg border border-muted bg-container px-4 py-3.5 md:grid-cols-3 @6xl:grid-cols-6">
            <Figure
              label="ATP confidence"
              value={ready ? `${ready.confidence.toFixed(1)}%` : "—"}
              hint={ready ? "weighted across five dimensions" : "starts at award"}
              tone={ready ? (ready.confidence >= 88 ? "text-success" : ready.confidence >= 78 ? "text-warning" : "text-error") : "text-quaternary"}
            />
            <Figure label="SOP" value={shortDate(program.sopDate)} hint={sopDays >= 0 ? `${fullDate(program.sopDate)} · in ${sopDays} days` : `${fullDate(program.sopDate)} · in production`} />
            <Figure label="Volume / yr" value={compact(program.annualVolume)} hint={`${rupees(program.unitPrice)} per unit`} />
            <Figure label="Annual value" value={inrL(annualValueL(program))} hint={`${inrCr(program.lifetimeValueCr)} lifetime`} />
            <Figure label="Unit cost (BOM)" value={hasBom ? rupees(bom.cost) : "—"} hint={margin !== null ? `${margin.toFixed(1)}% margin over BOM and conversion` : "BOM not frozen"} />
            <Figure label="EMS partner" value={<span className="font-sans text-body-md text-primary">{ems?.name ?? "Not allocated"}</span>} hint={ems ? `${ems.city} · ${ems.utilisation}% utilised` : "decided at award"} />
          </div>

          <Panel title="Gate timeline" padded={false}>
            <div className="overflow-x-auto">
              <ol className="flex min-w-[820px] items-stretch px-4 py-4">
                {gates.map((gate, index) => (
                  <li key={gate.stage} className="relative flex min-w-0 flex-1 flex-col items-center gap-1.5 text-center">
                    {index > 0 ? <span aria-hidden className={`absolute top-3 right-1/2 h-px w-full ${gate.state === "upcoming" ? "bg-muted" : "bg-success-icon"}`} /> : null}
                    <span
                      className={[
                        "relative z-10 flex size-6 items-center justify-center rounded-full border text-caption tabular",
                        gate.state === "done" ? "border-success-stroke bg-success-surface text-success" : gate.state === "current" ? "border-default bg-action-primary text-on-color" : "border-muted bg-container text-quaternary",
                      ].join(" ")}
                    >
                      {gate.state === "done" ? <Check size={12} strokeWidth={2} aria-hidden /> : index + 1}
                    </span>
                    <span className={`px-1 text-caption ${gate.state === "upcoming" ? "text-quaternary" : "text-secondary"}`}>{gate.label}</span>
                    <span className="text-caption tabular text-quaternary">{shortDate(gate.date)} {gate.date.slice(2, 4)}</span>
                    {gate.state === "current" ? <span className="text-caption text-brand">day {program.daysInStage}</span> : null}
                  </li>
                ))}
              </ol>
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-muted px-4 py-2.5">
              <p className="min-w-0 text-body-sm text-secondary">
                Next: <span className="text-primary">{program.nextMilestone}</span> by {fullDate(program.nextMilestoneDate)} ({daysFromToday(program.nextMilestoneDate)} days)
              </p>
              <p className="text-caption text-quaternary">PM {program.pm} · Buyer {program.buyer} · SQE {program.sqe}</p>
            </div>
          </Panel>

          {ready ? (
            <SplitRow ratio="1/1.4">
              <Panel title="Readiness by dimension" action={<RecordLink href="/readiness">ATP board</RecordLink>}>
                <ul className="flex flex-col gap-3">
                  {DIMENSIONS.map((dimension) => {
                    const value = ready[dimension.id];
                    const base = program.base[dimension.id];
                    return (
                      <li key={dimension.id}>
                        <div className="flex items-baseline justify-between gap-3">
                          <span className="text-body-sm text-secondary">
                            {dimension.label} <span className="text-quaternary">· weight {dimension.weight}</span>
                          </span>
                          <span className="text-body-sm tabular text-primary">
                            {value}%{value < base ? <span className="text-quaternary"> of {base}%</span> : null}
                          </span>
                        </div>
                        <Meter value={value} tone={scoreTone(value)} className="mt-1" />
                      </li>
                    );
                  })}
                </ul>
              </Panel>

              <Panel title={`What is holding readiness down · ${ready.drags.length}`} padded={false}>
                {ready.drags.length === 0 ? (
                  <EmptyState title="Nothing open against this program" detail="Readiness is at its planned level." mark={<KMark id="mark-empty" size={56} />} />
                ) : (
                  <ul className="flex min-h-0 flex-col overflow-y-auto px-4">
                    {ready.drags.map((drag) => (
                      <Row key={drag.text}>
                        <span className="min-w-0">
                          <span className="block truncate text-body-sm text-secondary" title={drag.text}>{drag.text}</span>
                          <span className="text-caption text-quaternary">{DIMENSIONS.find((d) => d.id === drag.dimension)?.label}</span>
                        </span>
                        <span className="flex shrink-0 items-center gap-3">
                          <span className="text-body-sm tabular text-warning">-{drag.points} pts</span>
                          <RecordLink href={drag.href}>Fix</RecordLink>
                        </span>
                      </Row>
                    ))}
                  </ul>
                )}
              </Panel>
            </SplitRow>
          ) : (
            <Callout label="Readiness starts at award" tone="info">
              This program is at {stageLabel(program.stage)}. Until it is awarded there is no BOM, no orders and no PPAP to measure.
              {quote ? ` Quote ${quote.id} is ${quote.status.toLowerCase()} with feasibility scored on supply chain, capacity and timeline.` : ""}
            </Callout>
          )}

          {programExceptions.length > 0 || observations.length > 0 ? (
            <SplitRow>
              <Panel title={`Open exceptions · ${programExceptions.length}`} padded={false}>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <ExceptionList items={programExceptions} showProgram={false} />
                </div>
              </Panel>
              <Panel title="Agent observations" padded={false}>
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
                  {observations.length ? (
                    observations.map((item) => <ObservationCard key={item.id} item={item} />)
                  ) : (
                    <EmptyState title="No agent observation on this program" detail="The exception list on the left is complete." mark={<KMark id="mark-observation" size={56} />} />
                  )}
                </div>
              </Panel>
            </SplitRow>
          ) : null}

          {hasBom ? (
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              <Panel title="BOM health" action={<RecordLink href={`/bom?program=${program.id}`}>BOM Intelligence</RecordLink>}>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  <Figure label="Buy lines" value={bom.lines} />
                  <Figure label="Single source" value={bom.single} tone={bom.single ? "text-warning" : "text-primary"} />
                  <Figure label="No alternate" value={bom.noAlternate} tone={bom.noAlternate ? "text-error" : "text-primary"} />
                  <Figure label="Lead time 20 wk +" value={bom.longLead} />
                  <Figure label="Longest lead" value={`${bom.maxLead} wk`} />
                  <Figure label="Cost per unit" value={rupees(bom.cost)} />
                </div>
                {notices.length ? (
                  <div className="mt-4 border-t border-muted pt-3">
                    <Label>Lifecycle notices</Label>
                    <ul className="mt-1 flex flex-col">
                      {notices.map((notice) => (
                        <Row key={notice.id}>
                          <span className="min-w-0 truncate text-body-sm text-secondary">
                            <RecordLink href={`/lifecycle?notice=${notice.id}`}>{notice.id}</RecordLink> · {notice.type} on {notice.pn}
                          </span>
                          <StatusBadge tone={noticeState(status, notice.id) === "open" ? "warning" : "success"}>{noticeState(status, notice.id)}</StatusBadge>
                        </Row>
                      ))}
                    </ul>
                  </div>
                ) : null}
              </Panel>

              <Panel title={`Supplier risks · ${risks.length}`} action={<RecordLink href="/supplier-risk">Supplier Risk</RecordLink>} padded={false}>
                {risks.length ? (
                  <ul className="flex flex-col px-4">
                    {risks.map((risk) => {
                      const state = riskState(status, risk.id);
                      const tone: StatusTone = state === "closed" ? "success" : state === "mitigating" ? "info" : state === "assigned" ? "neutral" : "warning";
                      return (
                        <Row key={risk.id}>
                          <span className="min-w-0">
                            <span className="block truncate text-body-sm text-secondary">
                              <RecordLink href={`/supplier-risk?risk=${risk.id}`}>{risk.id}</RecordLink> · {risk.title}
                            </span>
                            <span className="text-caption text-quaternary">{sourceName(risk.supplierId)} · {risk.signal}</span>
                          </span>
                          <span className="flex shrink-0 items-center gap-2">
                            <span className="text-body-sm tabular text-primary">{residualScore(status, risk)}</span>
                            <StatusBadge tone={tone}>{state}</StatusBadge>
                          </span>
                        </Row>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState title="No supplier risk raised" mark={<KMark id="mark-empty" size={56} />} />
                )}
              </Panel>

              <Panel title={`Purchase orders · ${pos.length}`} action={<RecordLink href="/purchase-orders">PO Tracker</RecordLink>} padded={false}>
                {pos.length ? (
                  <ul className="flex flex-col px-4">
                    {pos.map((po) => {
                      const view = poView(status, po);
                      return (
                        <Row key={po.id}>
                          <span className="min-w-0">
                            <span className="block truncate text-body-sm text-secondary">
                              <RecordLink href={`/purchase-orders?po=${po.id}`}>{po.id}</RecordLink> · {po.component}
                            </span>
                            <span className="text-caption text-quaternary">
                              {sourceName(po.supplierId)} · {inrL(po.valueL)} · promised {shortDate(view.promised)}, needed {shortDate(po.needDate)}
                            </span>
                          </span>
                          <StatusBadge tone={view.lateDays > 0 ? "error" : view.status === "Received" ? "success" : view.atRisk ? "warning" : "neutral"}>
                            {view.lateDays > 0 ? `${view.lateDays}d late` : view.status}
                          </StatusBadge>
                        </Row>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState title="No purchase orders yet" detail="Orders are released after suppliers are onboarded." mark={<KMark id="mark-empty" size={56} />} />
                )}
              </Panel>

              <Panel title={`PPAP status · ${ppaps.length}`} action={<RecordLink href="/ppap">PPAP Tracker</RecordLink>} padded={false}>
                {ppaps.length ? (
                  <ul className="flex flex-col px-4">
                    {ppaps.map((sub) => {
                      const summary = ppapSummary(status, sub);
                      return (
                        <Row key={sub.id}>
                          <span className="min-w-0 flex-1">
                            <span className="block truncate text-body-sm text-secondary">
                              <RecordLink href={`/ppap?ppap=${sub.id}`}>{sub.id}</RecordLink> · {sub.description}
                            </span>
                            <span className="mt-1 flex items-center gap-2">
                              <Meter value={summary.pct} tone={summary.overdue ? "warning" : summary.pswSigned ? "success" : "info"} />
                              <span className="shrink-0 text-caption tabular text-quaternary">{summary.approved} of {summary.required}</span>
                            </span>
                          </span>
                          <StatusBadge tone={summary.pswSigned ? "success" : summary.overdue ? "error" : "neutral"}>
                            {summary.pswSigned ? "PSW signed" : summary.overdue ? `${summary.overdue} overdue` : `due ${shortDate(sub.due)}`}
                          </StatusBadge>
                        </Row>
                      );
                    })}
                  </ul>
                ) : (
                  <EmptyState title="No PPAP submissions opened" mark={<KMark id="mark-empty" size={56} />} />
                )}
              </Panel>
            </div>
          ) : null}

          {events.length || allocations.length || ncrs.length ? (
            <Panel title="Also open on this program">
              <div className="grid grid-cols-1 gap-x-6 gap-y-3 md:grid-cols-3">
                <Field label="Sourcing events">
                  {events.length ? (
                    <ul className="flex flex-col gap-1">
                      {events.map((event) => (
                        <li key={event.id} className="truncate text-body-sm">
                          <RecordLink href={`/sourcing-events?event=${event.id}`}>{event.id}</RecordLink> · {event.pn} · {eventStatus(status, event).toLowerCase()}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-body-sm text-quaternary">None</span>
                  )}
                </Field>
                <Field label="EMS capacity">
                  {allocations.length ? (
                    <ul className="flex flex-col gap-1">
                      {allocations.map((allocation) => (
                        <li key={allocation.id} className="truncate text-body-sm">
                          <RecordLink href="/ems/capacity">{allocation.id}</RecordLink> · {sourceName(allocation.fromEmsId)} short · {allocationState(status, allocation.id)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-body-sm text-quaternary">Fits the allocated line</span>
                  )}
                </Field>
                <Field label="Quality">
                  {ncrs.length ? (
                    <ul className="flex flex-col gap-1">
                      {ncrs.map((ncr) => (
                        <li key={ncr.id} className="truncate text-body-sm">
                          <RecordLink href={`/quality?ncr=${ncr.id}`}>{ncr.id}</RecordLink> · {ncr.category} · 8D at D{ncrStep(status, ncr)}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-body-sm text-quaternary">No NCRs</span>
                  )}
                </Field>
              </div>
            </Panel>
          ) : null}
        </Stack>
      </PageBody>
    </>
  );
}
