"use client";

/**
 * Command Center.
 *
 * One question: which programs will miss SOP, why, and what to do today.
 * The stage flow is a filter: picking a stage scopes the programs table and
 * the exception queue beneath it.
 */

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { EXCEPTION_FILTERS, ExceptionList } from "@/components/kraya/exception-queue";
import { Btn, KMark, KpiGrid, KpiLink, Label, RecordLink, RiskBadge, Stack } from "@/components/kraya/kit";
import { OBSERVATIONS, ObservationCard } from "@/components/kraya/observations";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { InfoPopover } from "@/components/ui/info-popover";
import { InlineArrow, KpiTile, Panel, SplitRow, StatusBadge } from "@/components/ui/primitives";
import { useKraya } from "@/lib/kraya/context";
import { BOMS, PROGRAMS, STAGES } from "@/lib/kraya/data";
import { inrCr, shortDate } from "@/lib/kraya/format";
import {
  atRiskPrograms,
  bomHealth,
  exceptions,
  oemName,
  pipeline,
  programRisk,
  readiness,
  stageLabel,
} from "@/lib/kraya/selectors";
import type { ExceptionKind, Program, StageId } from "@/lib/kraya/types";

const PIPELINE = pipeline();
const BOM_IDS = Object.keys(BOMS);
const SINGLE_SOURCE = BOM_IDS.reduce((sum, id) => sum + bomHealth(id).single, 0);
const NO_ALTERNATE = BOM_IDS.reduce((sum, id) => sum + bomHealth(id).noAlternate, 0);

const BANDS: { label: string; from: string; to: string; stages: StageId[]; grid: string; grow: string }[] = [
  { label: "Win", from: "Enquiry", to: "Award", stages: ["rfi", "rfq-analysis", "quote-submitted", "awarded"], grid: "grid-cols-2 sm:grid-cols-4", grow: "xl:flex-[4]" },
  { label: "Source", from: "BOM", to: "Orders", stages: ["bom-finalised", "suppliers-onboarded", "pos-placed"], grid: "grid-cols-3", grow: "xl:flex-[3]" },
  { label: "Launch", from: "Build", to: "SOP", stages: ["production-scheduled", "sop-achieved"], grid: "grid-cols-2", grow: "xl:flex-[2]" },
];

function StageTile({ stage, selected, dimmed, onSelect }: { stage: StageId; selected: boolean; dimmed: boolean; onSelect: () => void }) {
  const def = STAGES.find((s) => s.id === stage);
  const snapshot = PIPELINE.find((s) => s.stage === stage);
  if (!def || !snapshot) return null;
  return (
    <button
      type="button"
      onClick={onSelect}
      aria-pressed={selected}
      title={def.label}
      className={[
        "flex min-w-0 flex-col gap-1.5 rounded-lg border px-2.5 py-2.5 text-left outline-none",
        "transition-[background-color,border-color,opacity] duration-[180ms] focus-visible:ring-2 focus-visible:ring-active",
        selected ? "border-default bg-raised" : "border-muted bg-page hover:border-default hover:bg-raised",
        dimmed ? "opacity-45" : "opacity-100",
      ].join(" ")}
    >
      <span className="flex items-center justify-between gap-2">
        <KMark id={def.markId} size={28} />
        <span className="font-display text-display-xl tabular text-primary">{snapshot.count}</span>
      </span>
      <span className="truncate text-caption tracking-[0.06em] text-quaternary uppercase">{def.label}</span>
      <span className="text-caption tabular text-tertiary">{snapshot.count ? inrCr(snapshot.valueCr) : "no programs"}</span>
    </button>
  );
}

export default function CommandCenterPage() {
  const router = useRouter();
  const { status, actionCount } = useKraya();
  const [stage, setStage] = useState<StageId | null>(null);
  const [kind, setKind] = useState<"all" | ExceptionKind>("all");

  const allExceptions = useMemo(() => exceptions(status), [status]);
  const scoped = useMemo(() => (stage ? allExceptions.filter((e) => e.stage === stage) : allExceptions), [allExceptions, stage]);
  const shown = kind === "all" ? scoped : scoped.filter((e) => e.kind === kind);

  const programs = useMemo(() => (stage ? PROGRAMS.filter((p) => p.stage === stage) : PROGRAMS), [stage]);
  const atRisk = atRiskPrograms(status);
  const baselineExceptions = useMemo(() => exceptions({}).length, []);
  const cleared = baselineExceptions - allExceptions.length;

  const avgDays = Math.round(PROGRAMS.reduce((sum, p) => sum + p.daysInStage, 0) / PROGRAMS.length);
  const lifetime = PROGRAMS.reduce((sum, p) => sum + p.lifetimeValueCr, 0);
  const criticalCount = allExceptions.filter((e) => e.severity === "critical").length;

  const columns: Column<Program>[] = [
    { key: "id", header: "Program", card: "title", value: (p) => p.id, render: (p) => <span className="tabular whitespace-nowrap text-primary">{p.id}</span> },
    { key: "oem", header: "OEM", value: (p) => oemName(p.id), render: (p) => <span className="whitespace-nowrap">{oemName(p.id)}</span> },
    { key: "product", header: "Product", value: (p) => p.product, render: (p) => <span className="block max-w-[240px] truncate" title={p.product}>{p.product}</span> },
    { key: "stage", header: "Stage", value: (p) => stageLabel(p.stage), render: (p) => <span className="whitespace-nowrap">{stageLabel(p.stage)}</span> },
    { key: "days", header: "Days in stage", align: "right", hide: "lg", value: (p) => p.daysInStage, render: (p) => <span className={`tabular ${p.daysInStage > 30 ? "text-warning" : ""}`}>{p.daysInStage}</span> },
    { key: "risk", header: "Risk", value: (p) => programRisk(status, p), render: (p) => <RiskBadge risk={programRisk(status, p)} /> },
    {
      key: "atp", header: "ATP conf.", align: "right", card: "metric",
      value: (p) => readiness(status, p)?.confidence ?? null,
      render: (p) => {
        const r = readiness(status, p);
        return r ? <span className="tabular text-primary">{r.confidence.toFixed(1)}%</span> : <span className="text-quaternary">pre-award</span>;
      },
    },
    { key: "next", header: "Next milestone", hide: "md", value: (p) => p.nextMilestone, render: (p) => <span className="block max-w-[220px] truncate" title={p.nextMilestone}>{p.nextMilestone}</span> },
    { key: "due", header: "Due", align: "right", hide: "md", value: (p) => p.nextMilestoneDate, render: (p) => <span className="tabular whitespace-nowrap">{shortDate(p.nextMilestoneDate)}</span> },
    { key: "sop", header: "SOP", align: "right", value: (p) => p.sopDate, render: (p) => <span className="tabular whitespace-nowrap">{shortDate(p.sopDate)} {p.sopDate.slice(2, 4)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Command Center"
        description="Every program between the OEM's enquiry and start of production: where it sits, what will make it miss SOP, and what to do today."
        mark={<KMark id="mark-command" size={44} />}
        info={
          <InfoPopover label="How this page works">
            <p className="text-body-sm text-secondary">
              Pick a stage tile to scope the programs table and the exception queue. Exceptions are derived from live records: expedite a PO,
              accept a mitigation, approve a PPAP element or accept a capacity allocation anywhere in the app and the row leaves this queue.
            </p>
          </InfoPopover>
        }
        actions={
          stage ? (
            <Btn onClick={() => setStage(null)}>Scoped to {stageLabel(stage)} · clear</Btn>
          ) : actionCount > 0 ? (
            <StatusBadge tone="success">{cleared > 0 ? `${cleared} exception${cleared > 1 ? "s" : ""} cleared this session` : `${actionCount} actions this session`}</StatusBadge>
          ) : null
        }
      />

      <PageBody>
        <Stack>
          <KpiGrid cols={6}>
            <KpiLink href="/programs">
              <KpiTile label="Active programs" value={String(PROGRAMS.length)} hint={`${inrCr(lifetime)} lifetime value`} mark={<KMark id="mark-program" size={32} />} />
            </KpiLink>
            <KpiLink href="/programs">
              <KpiTile label="Avg days in stage" value={String(avgDays)} hint="target under 30" tone="success" delta="on pace" mark={<KMark id="mark-lead-time" size={32} />} />
            </KpiLink>
            <KpiLink href="/readiness">
              <KpiTile label="Programs at risk" value={String(atRisk.length)} hint="ATP confidence under 88%" tone={atRisk.length ? "error" : "success"} delta={atRisk.length ? "act now" : "clear"} mark={<KMark id="mark-supplier-risk" size={32} />} />
            </KpiLink>
            <KpiLink href="/readiness">
              <KpiTile label="SOP hit rate" value="91.2%" hint="31 of 34 launches, 24 months" mark={<KMark id="mark-readiness" size={32} />} />
            </KpiLink>
            <KpiLink href="/purchase-orders">
              <KpiTile label="Open exceptions" value={String(allExceptions.length)} hint={`${criticalCount} critical`} tone={criticalCount ? "error" : "neutral"} delta={cleared > 0 ? `-${cleared} today` : undefined} mark={<KMark id="mark-shipment" size={32} />} />
            </KpiLink>
            <KpiLink href="/bom">
              <KpiTile label="Single-source lines" value={String(SINGLE_SOURCE)} hint={`${NO_ALTERNATE} with no alternate`} tone="warning" delta={`${BOM_IDS.length} BOMs`} mark={<KMark id="mark-single-source" size={32} />} />
            </KpiLink>
          </KpiGrid>

          <Panel title="Program pipeline" padded={false} action={<span className="text-caption text-quaternary">Select a stage to scope the tables below</span>}>
            <div className="flex flex-col gap-3 p-4 xl:flex-row">
              {BANDS.map((band) => (
                <div key={band.label} className={`min-w-0 ${band.grow}`}>
                  <p className="mb-2 inline-flex items-center gap-1 text-caption tracking-[0.08em] text-quaternary uppercase">
                    {band.label} · {band.from} <InlineArrow /> {band.to}
                  </p>
                  <div className={`grid gap-2 ${band.grid}`}>
                    {band.stages.map((id) => (
                      <StageTile key={id} stage={id} selected={stage === id} dimmed={stage !== null && stage !== id} onSelect={() => setStage(stage === id ? null : id)} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Panel>

          <SplitRow className="lg:h-[34rem] lg:max-h-[34rem]">
            <Panel title={`Exception queue · ${shown.length}`} padded={false} action={<span className="text-caption text-quaternary">ranked by severity, then exposure</span>}>
              <div className="flex h-full min-h-0 flex-col">
                <div className="shrink-0 border-b border-muted p-3">
                  <FilterChips
                    options={EXCEPTION_FILTERS.map((f) => ({ id: f.id, label: f.label, count: f.id === "all" ? scoped.length : scoped.filter((e) => e.kind === f.id).length }))}
                    value={kind}
                    onChange={(id) => setKind(id as "all" | ExceptionKind)}
                  />
                </div>
                <div className="min-h-0 flex-1 overflow-y-auto">
                  <ExceptionList items={shown} />
                </div>
              </div>
            </Panel>

            <Panel title="Agent observations" padded={false} action={<RecordLink href="/agents">Approvals inbox</RecordLink>}>
              <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-3">
                {OBSERVATIONS.map((item) => (
                  <ObservationCard key={item.id} item={item} />
                ))}
              </div>
            </Panel>
          </SplitRow>

          <Panel title={`Programs in flight · ${programs.length}`} padded={false} action={stage ? <Label>{stageLabel(stage)}</Label> : undefined}>
            <DataTable
              rows={programs}
              columns={columns}
              rowKey={(p) => p.id}
              onRowClick={(p) => router.push(`/programs/${p.id}`)}
              exportName="kraya-programs-in-flight"
              searchPlaceholder="Search programs"
              defaultSort={{ key: "sop", dir: "asc" }}
              emptyTitle="No programs at this stage"
              pageSize={12}
            />
          </Panel>
        </Stack>
      </PageBody>
    </>
  );
}
