"use client";

/**
 * Quality & RCA.
 *
 * Answers: which non-conformances are open, where in the 8D each one sits,
 * what the likely root cause is, and who pays for it.
 */

import { ArrowRight, Check, CircleDashed, Receipt, Square, SquareCheck, X } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartLegend, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import {
  Btn,
  Callout,
  Confidence,
  Drawer,
  Evidence,
  Field,
  KMark,
  KpiGrid,
  Label,
  Meter,
  PipelineSteps,
  RecordLink,
  RiskBadge,
  SignOff,
  Stack,
  usePipeline,
  useSelection,
} from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, SplitRow, StatusBadge } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { EIGHT_D, NCR_TREND, NCRS } from "@/lib/kraya/data";
import { inrL, num, shortDate } from "@/lib/kraya/format";
import { ncrStep, programById, programLabel, readiness, RISK_RANK, sourceHref, sourceName } from "@/lib/kraya/selectors";
import type { DefectCategory, Ncr } from "@/lib/kraya/types";

const FILTERS = [
  { id: "open", label: "Open" },
  { id: "Incoming", label: "Incoming" },
  { id: "In-Process", label: "In-Process" },
  { id: "Field", label: "Field" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

const CATEGORIES: DefectCategory[] = ["Solder joint", "Component failure", "Connector", "Firmware", "Cosmetic", "Dimensional"];

const DETECTION_COLOR = { Incoming: SERIES[0], "In-Process": SERIES[1], Field: TONE_COLOR.error } as const;

export default function QualityPage() {
  const { status, get, set, clear, setNcrStep } = useKraya();
  const toast = useToast();
  const [filter, setFilter] = useState("open");
  const [category, setCategory] = useState<DefectCategory | null>(null);
  const [selectedId, select] = useSelection("ncr");
  const pipeline = usePipeline();

  const step = (ncr: Ncr) => ncrStep(status, ncr);

  const matches = (ncr: Ncr, id: string) => {
    const s = ncrStep(status, ncr);
    if (id === "open") return s < 8;
    if (id === "closed") return s >= 8;
    if (id === "all") return true;
    return ncr.detection === id;
  };

  const scoped = category ? NCRS.filter((n) => n.category === category) : NCRS;
  const rows = scoped.filter((n) => matches(n, filter));

  const open = NCRS.filter((n) => step(n) < 8);
  const severeOpen = open.filter((n) => RISK_RANK[n.severity] <= 1);
  const avgStep = open.length ? open.reduce((sum, n) => sum + step(n), 0) / open.length : 8;
  const field = NCRS.filter((n) => n.detection === "Field");
  const chargeable = NCRS.filter((n) => n.chargebackL > 0);
  const raisedL = chargeable.filter((n) => status[`ncr:${n.id}:chargeback`] === "raised").reduce((sum, n) => sum + n.chargebackL, 0);
  const availableL = chargeable.reduce((sum, n) => sum + n.chargebackL, 0);

  const byCategory = useMemo(
    () => CATEGORIES.map((name) => ({ name, count: NCRS.filter((n) => n.category === name).length })).sort((a, b) => b.count - a.count),
    [],
  );

  const selected = NCRS.find((n) => n.id === selectedId) ?? null;

  const columns: Column<Ncr>[] = [
    { key: "id", header: "NCR", card: "title", value: (n) => n.id, render: (n) => <span className="tabular whitespace-nowrap text-primary">{n.id}</span> },
    { key: "title", header: "Defect", value: (n) => n.title, render: (n) => <span className="block max-w-[280px] truncate" title={n.title}>{n.title}</span> },
    { key: "category", header: "Category", hide: "lg", value: (n) => n.category, render: (n) => <span className="whitespace-nowrap">{n.category}</span> },
    {
      key: "detection", header: "Caught at", value: (n) => n.detection,
      render: (n) => <StatusBadge tone={n.detection === "Field" ? "error" : n.detection === "Incoming" ? "info" : "neutral"}>{n.detection}</StatusBadge>,
    },
    { key: "severity", header: "Severity", value: (n) => n.severity, render: (n) => <RiskBadge risk={n.severity} /> },
    { key: "source", header: "Source", value: (n) => sourceName(n.sourceId), render: (n) => <RecordLink href={sourceHref(n.sourceId)}>{sourceName(n.sourceId)}</RecordLink> },
    { key: "program", header: "Program", hide: "md", value: (n) => programLabel(n.programId), render: (n) => <RecordLink href={`/programs/${n.programId}`}>{programLabel(n.programId)}</RecordLink> },
    { key: "pn", header: "Part", hide: "lg", value: (n) => n.pn, render: (n) => <span className="tabular whitespace-nowrap">{n.pn}</span> },
    { key: "qty", header: "Qty", align: "right", hide: "lg", value: (n) => n.qtyAffected, render: (n) => <span className="tabular">{num(n.qtyAffected)}</span> },
    {
      key: "step", header: "8D", card: "metric", value: (n) => step(n),
      render: (n) => {
        const s = step(n);
        return (
          <span className="flex w-24 flex-col gap-1">
            <span className="tabular whitespace-nowrap text-primary">{s >= 8 ? "Closed" : `D${s} of 8`}</span>
            <Meter value={s} max={8} tone={s >= 8 ? "success" : s >= 4 ? "info" : "warning"} />
          </span>
        );
      },
    },
    { key: "owner", header: "Owner", hide: "md", value: (n) => n.owner, render: (n) => <span className="whitespace-nowrap">{n.owner}</span> },
    { key: "raised", header: "Raised", align: "right", hide: "md", value: (n) => n.raised, render: (n) => <span className="tabular whitespace-nowrap">{shortDate(n.raised)}</span> },
  ];

  function advance(ncr: Ncr) {
    const current = step(ncr);
    if (current >= 8) return;
    const next = current + 1;
    setNcrStep(ncr.id, next);
    if (next >= 8) toast(`${ncr.id} closed at D8. ${ncr.owner} is recorded as the closing owner.`);
    else if (next === 4 && RISK_RANK[ncr.severity] <= 1) toast(`${ncr.id} root cause confirmed at D4. Readiness for ${programLabel(ncr.programId)} was recalculated.`);
    else toast(`${ncr.id} advanced to ${EIGHT_D[next - 1]}.`, "info");
  }

  function raiseChargeback(ncr: Ncr) {
    pipeline.start(
      ["Collect sorting, rework and line-stop costs from the QMS", `Check the warranty and chargeback clause for ${sourceName(ncr.sourceId)}`, "Draft the debit note in SAP S/4HANA", `Route to ${ncr.owner} for signature`],
      () => {
        set(`ncr:${ncr.id}:chargeback`, "raised");
        toast(`Chargeback of ${inrL(ncr.chargebackL)} raised against ${sourceName(ncr.sourceId)}. ${ncr.owner} signs the debit note.`);
      },
    );
  }

  return (
    <>
      <PageHeader
        title="Quality & RCA"
        description="Every open non-conformance, where it sits in the 8D, the likely root cause with its evidence, and the chargeback owed."
        mark={<KMark id="mark-quality" size={44} />}
        actions={
          category ? (
            <Btn icon={X} onClick={() => setCategory(null)}>
              {category} · clear
            </Btn>
          ) : null
        }
      >
        <FilterChips
          options={FILTERS.map((f) => ({ ...f, count: scoped.filter((n) => matches(n, f.id)).length }))}
          value={filter}
          onChange={setFilter}
        />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid cols={5}>
            <KpiTile label="Open NCRs" value={String(open.length)} hint={`of ${NCRS.length} raised since Aug`} mark={<KMark id="mark-quality" />} />
            <KpiTile label="Critical or high, open" value={String(severeOpen.length)} hint="these drag program readiness" tone="error" delta={severeOpen.length ? "act first" : undefined} />
            <KpiTile label="Average 8D progress" value={`D${avgStep.toFixed(1)}`} hint="open NCRs, target D4 in 10 days" />
            <KpiTile label="Caught in the field" value={String(field.length)} hint={`${field.filter((n) => step(n) < 8).length} still open`} tone="warning" />
            <KpiTile label="Chargebacks raised" value={inrL(raisedL)} hint={`of ${inrL(availableL)} recoverable`} tone={raisedL > 0 ? "success" : "neutral"} delta={raisedL > 0 ? `${Math.round((raisedL / availableL) * 100)}%` : undefined} />
          </KpiGrid>

          <SplitRow ratio="1/1.4">
            <Panel title="What kind of defects are we seeing" action={<span className="text-caption text-quaternary">select a bar to filter</span>}>
              <ChartFrame height={230}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={byCategory} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 8 }}>
                    <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                    <XAxis type="number" allowDecimals={false} {...AXIS_PROPS} />
                    <YAxis type="category" interval={0} dataKey="name" width={118} {...AXIS_PROPS} />
                    <Tooltip cursor={CURSOR_FILL} content={<ChartTip />} />
                    <Bar dataKey="count" name="NCRs" radius={[0, 4, 4, 0]} barSize={16} className="cursor-pointer" onClick={(_, index) => setCategory((c) => (c === byCategory[index].name ? null : byCategory[index].name))}>
                      {byCategory.map((row) => (
                        <Cell key={row.name} fill={SERIES[0]} fillOpacity={category && category !== row.name ? 0.3 : 1} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
            </Panel>
            <Panel title="Where are defects caught" action={<span className="text-caption text-quaternary">NCRs raised per month</span>}>
              <ChartFrame height={206}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={NCR_TREND} margin={{ top: 4, right: 8, bottom: 0, left: -18 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="month" {...AXIS_PROPS} />
                    <YAxis allowDecimals={false} {...AXIS_PROPS} />
                    <Tooltip cursor={CURSOR_FILL} content={<ChartTip />} />
                    <Bar dataKey="Incoming" stackId="d" fill={DETECTION_COLOR.Incoming} barSize={28} />
                    <Bar dataKey="In-Process" stackId="d" fill={DETECTION_COLOR["In-Process"]} barSize={28} />
                    <Bar dataKey="Field" stackId="d" fill={DETECTION_COLOR.Field} barSize={28} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
              <ChartLegend
                items={[
                  { label: "Incoming inspection", color: DETECTION_COLOR.Incoming },
                  { label: "In-process at EMS", color: DETECTION_COLOR["In-Process"] },
                  { label: "Field return", color: DETECTION_COLOR.Field },
                ]}
              />
            </Panel>
          </SplitRow>

          <Panel title={`Non-conformance reports · ${rows.length}`} padded={false}>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(n) => n.id}
              onRowClick={(n) => select(n.id)}
              isRowSelected={(n) => n.id === selectedId}
              defaultSort={{ key: "severity", dir: "asc" }}
              exportName="kraya-ncrs"
              searchPlaceholder="Search NCRs, parts, sources"
              emptyTitle="No NCRs match"
              emptyDetail="Clear the category or pick another filter."
            />
          </Panel>
        </Stack>
      </PageBody>

      {selected ? (
        <NcrDrawer
          key={selected.id}
          ncr={selected}
          step={step(selected)}
          onClose={() => select(null)}
          onAdvance={() => advance(selected)}
          onChargeback={() => raiseChargeback(selected)}
          pipeline={pipeline}
          get={get}
          set={set}
          clear={clear}
          quality={(() => {
            const program = programById(selected.programId);
            const r = program ? readiness(status, program) : null;
            return r ? { quality: r.quality, confidence: r.confidence } : null;
          })()}
        />
      ) : null}
    </>
  );
}

function NcrDrawer({
  ncr,
  step,
  onClose,
  onAdvance,
  onChargeback,
  pipeline,
  get,
  set,
  clear,
  quality,
}: {
  ncr: Ncr;
  step: number;
  onClose: () => void;
  onAdvance: () => void;
  onChargeback: () => void;
  pipeline: ReturnType<typeof usePipeline>;
  get: (key: string, fallback?: string) => string;
  set: (key: string, value: string) => void;
  clear: (key: string) => void;
  quality: { quality: number; confidence: number } | null;
}) {
  const toast = useToast();
  const closed = step >= 8;
  const isEms = ncr.sourceId.startsWith("EMS");
  const chargeback = get(`ncr:${ncr.id}:chargeback`);
  const hypotheses = ncr.hypotheses.map((h, index) => ({ ...h, index })).sort((a, b) => b.confidence - a.confidence);

  return (
    <Drawer
      open
      wide
      onClose={onClose}
      title={ncr.id}
      badge={
        <>
          <RiskBadge risk={ncr.severity} />
          <StatusBadge tone={closed ? "success" : "neutral"}>{closed ? "Closed" : `D${step} of 8`}</StatusBadge>
        </>
      }
      subtitle={ncr.title}
      footer={
        <>
          <Btn variant="primary" icon={ArrowRight} disabled={closed} onClick={onAdvance}>
            {closed ? "8D closed" : step === 7 ? "Close at D8" : `Advance to D${step + 1}`}
          </Btn>
          <span className="ml-auto">
            <SignOff name={ncr.owner} note="owns the 8D" />
          </span>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <Field label="Source">
          <RecordLink href={sourceHref(ncr.sourceId)}>{sourceName(ncr.sourceId)}</RecordLink>
        </Field>
        <Field label="Program">
          <RecordLink href={`/programs/${ncr.programId}`}>{programLabel(ncr.programId)}</RecordLink>
        </Field>
        <Field label="Part">
          <span className="tabular">{ncr.pn}</span>
        </Field>
        <Field label="Caught at">{ncr.detection}</Field>
        <Field label="Quantity affected">
          <span className="tabular">{num(ncr.qtyAffected)}</span>
        </Field>
        <Field label="Raised">{shortDate(ncr.raised)}</Field>
      </div>

      <div>
        <Label>8D progress</Label>
        <ol className="mt-2 grid grid-cols-2 gap-1.5 sm:grid-cols-4">
          {EIGHT_D.map((name, index) => {
            const done = index < step;
            const current = index === step && !closed;
            return (
              <li
                key={name}
                className={`flex min-w-0 items-start gap-1.5 rounded-md border px-2 py-1.5 ${done ? "border-success-stroke bg-success-surface" : current ? "border-default bg-raised" : "border-muted"}`}
              >
                {done ? (
                  <Check size={13} strokeWidth={1.75} aria-hidden className="mt-0.5 shrink-0 text-success" />
                ) : (
                  <CircleDashed size={13} strokeWidth={1.75} aria-hidden className={`mt-0.5 shrink-0 ${current ? "text-brand" : "text-quaternary"}`} />
                )}
                <span className="min-w-0">
                  <span className={`block text-body-sm ${done || current ? "text-primary" : "text-tertiary"}`}>{name}</span>
                  <span className="block text-caption text-quaternary">{done ? "done" : current ? "next" : "upcoming"}</span>
                </span>
              </li>
            );
          })}
        </ol>
        {quality ? (
          <p className="mt-2 text-caption text-quaternary">
            Program quality readiness <span className="tabular text-secondary">{quality.quality}</span> · ATP confidence{" "}
            <span className="tabular text-secondary">{quality.confidence}%</span>
            {RISK_RANK[ncr.severity] <= 1 && step < 4 ? " · rises when this NCR reaches D4" : ""}
          </p>
        ) : null}
      </div>

      <div className="flex flex-col gap-2">
        <Label>Root-cause hypotheses, ranked by the RCA agent</Label>
        {hypotheses.map((h) => {
          const key = `ncr:${ncr.id}:hyp:${h.index}`;
          const verdict = get(key);
          return (
            <article key={h.cause} className="flex flex-col gap-2.5 rounded-lg border border-muted p-3">
              <div className="flex items-start justify-between gap-3">
                <p className={`min-w-0 text-body-md ${verdict === "ruled-out" ? "text-quaternary line-through" : "text-primary"}`}>{h.cause}</p>
                {verdict ? <StatusBadge tone={verdict === "confirmed" ? "success" : "neutral"}>{verdict === "confirmed" ? "Confirmed" : "Ruled out"}</StatusBadge> : null}
              </div>
              <Confidence value={h.confidence} />
              <Evidence items={h.evidence} />
              <div className="flex flex-wrap gap-2">
                <Btn
                  variant={verdict === "confirmed" ? "secondary" : "primary"}
                  disabled={verdict === "confirmed"}
                  onClick={() => {
                    set(key, "confirmed");
                    toast(`Root cause confirmed on ${ncr.id} by ${ncr.owner}. Record it at D4.`);
                  }}
                >
                  Confirm as root cause
                </Btn>
                <Btn
                  disabled={verdict === "ruled-out"}
                  onClick={() => {
                    set(key, "ruled-out");
                    toast(`Hypothesis ruled out on ${ncr.id}.`, "info");
                  }}
                >
                  Rule out
                </Btn>
                {verdict ? (
                  <Btn variant="ghost" onClick={() => clear(key)}>
                    Reset
                  </Btn>
                ) : null}
              </div>
            </article>
          );
        })}
        <p className="text-caption text-quaternary">Hypotheses are drafts from the RCA agent. {ncr.owner} confirms the root cause.</p>
      </div>

      <div>
        <Label>Containment actions</Label>
        <ul className="mt-1.5 flex flex-col gap-1">
          {ncr.containment.map((action, index) => {
            const key = `ncr:${ncr.id}:contain:${index}`;
            const done = get(key) === "done";
            const Icon = done ? SquareCheck : Square;
            return (
              <li key={action}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={done}
                  onClick={() => (done ? clear(key) : set(key, "done"))}
                  className="flex w-full items-start gap-2 rounded-md px-1.5 py-1 text-left outline-none transition-colors duration-[150ms] hover:bg-raised focus-visible:ring-2 focus-visible:ring-active"
                >
                  <Icon size={15} strokeWidth={1.75} aria-hidden className={`mt-0.5 shrink-0 ${done ? "text-success" : "text-quaternary"}`} />
                  <span className={`min-w-0 text-body-sm ${done ? "text-tertiary" : "text-secondary"}`}>
                    {action}
                    <span className="text-quaternary">{done ? " · verified" : " · not yet verified"}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      <div className="flex flex-col gap-2.5 rounded-lg border border-muted p-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Label>Supplier chargeback</Label>
            <p className="mt-0.5 font-display text-display-lg tabular text-primary">{ncr.chargebackL > 0 ? inrL(ncr.chargebackL) : "—"}</p>
          </div>
          {chargeback === "raised" ? <StatusBadge tone="success">Debit note raised</StatusBadge> : null}
        </div>
        <p className="text-body-sm text-tertiary">
          {isEms
            ? "The source is an EMS partner. Conversion defects are settled through the yield clause in the manufacturing services agreement, not by debit note."
            : ncr.chargebackL === 0
              ? "No sorting, rework or line-stop cost has been booked against this NCR, so there is nothing to recover yet."
              : "Sorting, rework and line-stop costs booked in the QMS against this NCR."}
        </p>
        <PipelineSteps run={pipeline.run} />
        <div>
          <Btn icon={Receipt} variant="primary" disabled={isEms || ncr.chargebackL === 0 || chargeback === "raised" || pipeline.running} onClick={onChargeback}>
            {chargeback === "raised" ? "Chargeback raised" : "Raise chargeback"}
          </Btn>
        </div>
      </div>

      {ncr.severity === "critical" && step < 4 ? (
        <Callout tone="warning" label="Why this matters now">
          A critical NCR without a confirmed root cause takes 4 points off the program&apos;s quality readiness until it reaches D4.
        </Callout>
      ) : null}
    </Drawer>
  );
}
