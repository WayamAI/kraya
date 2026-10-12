"use client";

/**
 * EMS performance and quality.
 *
 * Answers: which partner is drifting on PPM, OTIF or first-pass yield, and
 * which audit findings are still open against them.
 */

import { useState } from "react";
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartTip, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import { Btn, Callout, Confidence, Evidence, KMark, KpiGrid, LinkBtn, RecordLink, RiskBadge, SignOff, Stack } from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, SplitRow, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { EMS_PARTNERS } from "@/lib/kraya/data";
import { daysFromToday, shortDate, TREND_MONTHS } from "@/lib/kraya/format";
import type { EmsPartner } from "@/lib/kraya/types";

type Metric = "ppm" | "otif" | "fpy";

const METRICS: { id: Metric; label: string; question: string; unit: string }[] = [
  { id: "ppm", label: "PPM", question: "Whose defect rate is rising: PPM by partner", unit: " ppm" },
  { id: "otif", label: "OTIF", question: "Who is slipping on delivery: OTIF by partner", unit: "%" },
  { id: "fpy", label: "FPY", question: "Whose lines are losing yield: first-pass yield by partner", unit: "%" },
];

const TREND: Record<Metric, (e: EmsPartner) => number[]> = { ppm: (e) => e.ppmTrend, otif: (e) => e.otifTrend, fpy: (e) => e.fpyTrend };

/** Six series tokens plus two feedback tones cover the eight partners. */
const PARTNER_COLOR = [...SERIES, TONE_COLOR.info, TONE_COLOR.neutral];

interface FindingRow {
  id: string;
  partner: EmsPartner;
  text: string;
  severity: "major" | "minor";
  due: string;
}

const FINDINGS: FindingRow[] = EMS_PARTNERS.flatMap((partner) => partner.findings.map((f) => ({ ...f, partner })));

const FINDING_STATE: Record<string, { label: string; tone: StatusTone }> = {
  open: { label: "Open", tone: "warning" },
  requested: { label: "Evidence requested", tone: "info" },
  closed: { label: "Closed", tone: "success" },
};

export default function EmsPerformancePage() {
  const { get, set } = useKraya();
  const toast = useToast();
  const [metric, setMetric] = useState<Metric>("ppm");
  const [focus, setFocus] = useState<string | null>(null);

  const weight = EMS_PARTNERS.reduce((sum, e) => sum + e.capacity * e.utilisation, 0);
  const weighted = (pick: (e: EmsPartner) => number) => EMS_PARTNERS.reduce((sum, e) => sum + pick(e) * e.capacity * e.utilisation, 0) / weight;
  const smt = EMS_PARTNERS.filter((e) => e.smtLines > 0);
  const changeover = smt.reduce((sum, e) => sum + e.changeoverMin, 0) / smt.length;
  const findingState = (id: string) => get(`finding:${id}`, "open");
  const openFindings = FINDINGS.filter((f) => findingState(f.id) !== "closed");
  const majorOpen = openFindings.filter((f) => f.severity === "major").length;

  const active = METRICS.find((m) => m.id === metric) ?? METRICS[0];
  const data = TREND_MONTHS.map((month, index) => {
    const row: Record<string, number | string> = { month };
    for (const e of EMS_PARTNERS) row[e.id] = TREND[metric](e)[index];
    return row;
  });
  const toggle = (id: string) => setFocus((current) => (current === id ? null : id));

  const columns: Column<EmsPartner>[] = [
    {
      key: "name", header: "Partner", card: "title", value: (e) => e.name,
      render: (e) => (
        <span className="flex items-center gap-2 whitespace-nowrap text-primary">
          <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: PARTNER_COLOR[EMS_PARTNERS.indexOf(e)] }} />
          {e.name}
        </span>
      ),
    },
    { key: "city", header: "City", hide: "md", value: (e) => e.city, render: (e) => e.city },
    { key: "ppm", header: "PPM", align: "right", card: "metric", value: (e) => e.ppm, render: (e) => <span className={`tabular ${e.ppm > 65 ? "text-error" : "text-primary"}`}>{e.ppm}</span> },
    { key: "otif", header: "OTIF", align: "right", value: (e) => e.otif, render: (e) => <span className={`tabular ${e.otif < 90 ? "text-error" : "text-secondary"}`}>{e.otif.toFixed(1)}%</span> },
    { key: "fpy", header: "FPY", align: "right", value: (e) => e.fpy, render: (e) => <span className={`tabular ${e.fpy < 97 ? "text-warning" : "text-secondary"}`}>{e.fpy.toFixed(1)}%</span> },
    {
      key: "changeover", header: "Changeover", align: "right", value: (e) => e.changeoverMin,
      render: (e) => (
        <span className="tabular whitespace-nowrap">
          {e.changeoverMin} min <span className={e.changeoverMin > 45 ? "text-warning" : "text-quaternary"}>{e.changeoverMin > 45 ? `+${e.changeoverMin - 45}` : "within 45"}</span>
        </span>
      ),
    },
    { key: "audit", header: "Audit", align: "right", hide: "md", value: (e) => e.auditScore, render: (e) => <span className="tabular">{e.auditScore}</span> },
    { key: "vda", header: "VDA 6.3", hide: "lg", value: (e) => e.vdaGrade, render: (e) => <StatusBadge tone={e.vdaGrade === "A" ? "success" : "info"}>Grade {e.vdaGrade}</StatusBadge> },
    {
      key: "findings", header: "Open findings", align: "right", value: (e) => e.findings.filter((f) => findingState(f.id) !== "closed").length,
      render: (e) => <span className="tabular">{e.findings.filter((f) => findingState(f.id) !== "closed").length}</span>,
    },
    { key: "risk", header: "Risk", value: (e) => e.risk, render: (e) => <RiskBadge risk={e.risk} /> },
  ];

  const findingColumns: Column<FindingRow>[] = [
    { key: "id", header: "Finding", card: "title", value: (f) => f.id, render: (f) => <span className="tabular whitespace-nowrap text-primary">{f.id}</span> },
    { key: "partner", header: "Partner", value: (f) => f.partner.name, render: (f) => <RecordLink href={`/ems?ems=${f.partner.id}`}>{f.partner.name}</RecordLink> },
    { key: "text", header: "Finding text", value: (f) => f.text, render: (f) => <span className="block max-w-[360px] truncate" title={f.text}>{f.text}</span> },
    { key: "severity", header: "Severity", value: (f) => f.severity, render: (f) => <StatusBadge tone={f.severity === "major" ? "error" : "neutral"}>{f.severity}</StatusBadge> },
    {
      key: "due", header: "Due", align: "right", card: "metric", value: (f) => f.due,
      render: (f) => {
        const days = daysFromToday(f.due);
        const closed = findingState(f.id) === "closed";
        return (
          <span className="tabular whitespace-nowrap">
            {shortDate(f.due)} <span className={closed ? "text-quaternary" : days < 0 ? "text-error" : days <= 10 ? "text-warning" : "text-quaternary"}>{closed ? "done" : days < 0 ? `${-days}d overdue` : `${days}d left`}</span>
          </span>
        );
      },
    },
    { key: "state", header: "State", value: (f) => findingState(f.id), render: (f) => <StatusBadge tone={FINDING_STATE[findingState(f.id)]?.tone ?? "warning"}>{FINDING_STATE[findingState(f.id)]?.label ?? "Open"}</StatusBadge> },
    {
      key: "actions", header: "Action", card: false,
      render: (f) => {
        const state = findingState(f.id);
        return (
          <span className="flex gap-1.5">
            <Btn
              disabled={state !== "open"}
              onClick={() => {
                set(`finding:${f.id}`, "requested");
                toast(`Evidence requested from ${f.partner.name} for ${f.id}. Due ${shortDate(f.due)}.`, "info");
              }}
            >
              Request evidence
            </Btn>
            <Btn
              variant="primary"
              disabled={state === "closed"}
              onClick={() => {
                set(`finding:${f.id}`, "closed");
                toast(`${f.id} closed. Closure is recorded against the next VDA 6.3 audit at ${f.partner.name}.`);
              }}
            >
              Close finding
            </Btn>
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Performance & Quality"
        description="PPM, on-time in-full and first-pass yield for each EMS partner over six months, with the audit findings still open against them."
        mark={<KMark id="mark-performance" size={44} />}
        actions={
          <>
            {focus ? <Btn onClick={() => setFocus(null)}>Show all partners</Btn> : null}
            <LinkBtn href="/quality">Open NCRs</LinkBtn>
          </>
        }
      >
        <FilterChips options={METRICS.map((m) => ({ id: m.id, label: m.label }))} value={metric} onChange={(id) => setMetric(id as Metric)} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid cols={5}>
            <KpiTile label="Network PPM" value={weighted((e) => e.ppm).toFixed(0)} hint="output weighted, October" mark={<KMark id="mark-performance" />} />
            <KpiTile label="OTIF" value={`${weighted((e) => e.otif).toFixed(1)}%`} hint="target 95%" tone="warning" delta={`${(weighted((e) => e.otif) - 95).toFixed(1)} pts`} />
            <KpiTile label="First-pass yield" value={`${weighted((e) => e.fpy).toFixed(1)}%`} hint="SMT through FCT" />
            <KpiTile label="Average changeover" value={`${changeover.toFixed(0)} min`} hint="SMT partners, agreement 45" tone={changeover > 45 ? "warning" : "success"} />
            <KpiTile label="Open audit findings" value={String(openFindings.length)} hint={`${majorOpen} major`} tone={majorOpen ? "error" : "success"} delta={majorOpen ? `${majorOpen} major` : undefined} />
          </KpiGrid>

          <SplitRow ratio="1.6/1">
            <Panel title={active.question} action={<span className="text-caption text-quaternary">May to Oct 2026</span>}>
              <ChartFrame height={270}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={data} margin={{ top: 8, right: 12, bottom: 0, left: -10 }}>
                    <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                    <XAxis dataKey="month" {...AXIS_PROPS} />
                    <YAxis {...AXIS_PROPS} domain={metric === "ppm" ? [20, 85] : metric === "otif" ? [87, 97] : [96, 99.5]} allowDataOverflow />
                    <Tooltip content={<ChartTip format={(v) => `${v}${active.unit}`} />} />
                    {EMS_PARTNERS.map((e, index) => (
                      <Line
                        key={e.id}
                        type="monotone"
                        dataKey={e.id}
                        name={e.name}
                        stroke={PARTNER_COLOR[index]}
                        strokeWidth={focus === e.id ? 2.5 : 1.5}
                        strokeOpacity={focus && focus !== e.id ? 0.18 : 1}
                        dot={focus === e.id ? { r: 3 } : false}
                        activeDot={{ r: 4 }}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </ChartFrame>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {EMS_PARTNERS.map((e, index) => (
                  <li key={e.id}>
                    <button
                      type="button"
                      aria-pressed={focus === e.id}
                      onClick={() => toggle(e.id)}
                      className={`inline-flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-caption outline-none transition-colors duration-[150ms] focus-visible:ring-2 focus-visible:ring-active ${focus === e.id ? "border-default bg-raised text-primary" : "border-muted text-tertiary hover:border-default hover:text-secondary"} ${focus && focus !== e.id ? "opacity-50" : ""}`}
                    >
                      <span aria-hidden className="size-2 shrink-0 rounded-full" style={{ background: PARTNER_COLOR[index] }} />
                      {e.name}
                    </button>
                  </li>
                ))}
              </ul>
            </Panel>

            <Panel title="Agent observation">
              <div className="flex flex-col gap-3">
                <div className="flex items-start gap-3">
                  <KMark id="mark-observation" size={28} className="mt-0.5" />
                  <p className="min-w-0 text-body-md text-primary">Kaveri SMT Systems is the only partner getting worse on all three measures, eight weeks before it launches the Tejas BMS.</p>
                </div>
                <Evidence
                  items={[
                    "PPM 49 in May, 74 in October",
                    "OTIF 93.4% in May, 88.6% in October",
                    "Three open audit findings, two major: paste handling on line 2 and no ISO 26262 process assessment",
                    "NCR-2026-056 ties solder bridging to paste left out of refrigeration on the night shift",
                  ]}
                />
                <Confidence value={84} />
                <Callout label="Recommendation">Close AF-105 before the pilot lot on 9 Nov and accept allocation ALC-01, which moves 8,000 BMS boards a month to Marina Precision Electronics from February.</Callout>
                <div className="flex flex-wrap gap-2">
                  <Btn variant="primary" onClick={() => setFocus("EMS-03")}>
                    Highlight Kaveri
                  </Btn>
                  <LinkBtn href="/quality?ncr=NCR-2026-056">Open NCR-2026-056</LinkBtn>
                  <LinkBtn href="/ems/capacity" variant="ghost">
                    ALC-01
                  </LinkBtn>
                </div>
                <SignOff name="Tanvi Joshi" note="SQE for Kaveri, confirms before any volume moves" />
              </div>
            </Panel>
          </SplitRow>

          <Panel title="Partner ranking" padded={false} action={<span className="text-caption text-quaternary">select a row to highlight its line</span>}>
            <DataTable rows={EMS_PARTNERS} columns={columns} rowKey={(e) => e.id} onRowClick={(e) => toggle(e.id)} isRowSelected={(e) => e.id === focus} defaultSort={{ key: metric, dir: metric === "ppm" ? "desc" : "asc" }} exportName="kraya-ems-performance" searchable={false} />
          </Panel>

          <Panel title={`Audit findings · ${openFindings.length} open`} padded={false}>
            <DataTable rows={FINDINGS} columns={findingColumns} rowKey={(f) => f.id} defaultSort={{ key: "due", dir: "asc" }} exportName="kraya-ems-findings" searchPlaceholder="Search findings" />
          </Panel>
        </Stack>
      </PageBody>
    </>
  );
}
