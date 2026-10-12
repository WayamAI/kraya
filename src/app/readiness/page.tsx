"use client";

/**
 * ATP / SOP Readiness. For each awarded program: can it ship on its SOP date,
 * and if not, which record is taking the points away.
 */

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartTip, CURSOR_FILL, GRID_STROKE, TONE_COLOR } from "@/components/kraya/charts";
import {
  Btn,
  Callout,
  KMark,
  KpiGrid,
  Label,
  LinkBtn,
  Meter,
  PipelineSteps,
  RecordLink,
  RiskBadge,
  scoreTone,
  Stack,
  usePipeline,
  useSelection,
} from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { InfoPopover } from "@/components/ui/info-popover";
import { EmptyState, KpiTile, Panel, SplitRow } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { PROGRAMS } from "@/lib/kraya/data";
import { daysFromToday, fullDate } from "@/lib/kraya/format";
import { oemName, readiness, RISK_RANK, stageLabel } from "@/lib/kraya/selectors";
import type { Program, Readiness, ReadinessBase } from "@/lib/kraya/types";

const DIMENSIONS: { id: keyof ReadinessBase; label: string }[] = [
  { id: "bom", label: "BOM ready" },
  { id: "suppliers", label: "Suppliers" },
  { id: "material", label: "Material" },
  { id: "production", label: "Production" },
  { id: "quality", label: "Quality" },
];

const FILTERS = [
  { id: "all", label: "All awarded" },
  { id: "at-risk", label: "At risk" },
  { id: "180", label: "SOP within 180 days" },
];

function ScoreCell({ value }: { value: number }) {
  return (
    <span className="flex min-w-[76px] items-center gap-2">
      <Meter value={value} tone={scoreTone(value)} />
      <span className="w-8 shrink-0 text-right text-body-sm tabular text-secondary">{value}</span>
    </span>
  );
}

export default function ReadinessPage() {
  const { status } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const [filter, setFilter] = useState("all");
  const [selectedId, select] = useSelection("program");

  const board = useMemo(
    () =>
      PROGRAMS.map((program) => ({ program, ready: readiness(status, program) }))
        .filter((row): row is { program: Program; ready: Readiness } => row.ready !== null)
        .sort((a, b) => a.ready.confidence - b.ready.confidence),
    [status],
  );
  const baseline = useMemo(() => new Map(PROGRAMS.map((p) => [p.id, readiness({}, p)?.confidence ?? 0])), []);

  const rows = board.filter(({ program, ready }) => {
    if (filter === "at-risk") return RISK_RANK[ready.risk] <= 1;
    if (filter === "180") return daysFromToday(program.sopDate) >= 0 && daysFromToday(program.sopDate) <= 180;
    return true;
  });

  const selected = board.find((row) => row.program.id === selectedId) ?? rows[0] ?? board[0];
  const atRisk = board.filter((row) => RISK_RANK[row.ready.risk] <= 1).length;
  const average = board.reduce((sum, row) => sum + row.ready.confidence, 0) / Math.max(1, board.length);
  const totalDrags = board.reduce((sum, row) => sum + row.ready.drags.length, 0);
  const improved = board.filter((row) => row.ready.confidence > (baseline.get(row.program.id) ?? 0)).length;

  const chart = rows.map(({ program, ready }) => ({ id: program.id, name: program.productCode, confidence: ready.confidence, risk: ready.risk }));

  type BoardRow = (typeof board)[number];
  const columns: Column<BoardRow>[] = [
    {
      key: "program", header: "Program", card: "title", value: (r) => `${r.program.id} ${r.program.name}`,
      render: (r) => (
        <span className="block min-w-0">
          <span className="block text-body-sm tabular whitespace-nowrap text-primary">{r.program.id}</span>
          <span className="block max-w-[190px] truncate text-caption text-quaternary" title={r.program.name}>{r.program.name}</span>
        </span>
      ),
    },
    { key: "stage", header: "Stage", hide: "lg", value: (r) => stageLabel(r.program.stage), render: (r) => <span className="whitespace-nowrap">{stageLabel(r.program.stage)}</span> },
    ...DIMENSIONS.map((dimension): Column<BoardRow> => ({
      key: dimension.id, header: dimension.label, hide: "md", value: (r) => r.ready[dimension.id], render: (r) => <ScoreCell value={r.ready[dimension.id]} />,
    })),
    {
      key: "confidence", header: "ATP confidence", align: "right", card: "metric", value: (r) => r.ready.confidence,
      render: (r) => {
        const delta = r.ready.confidence - (baseline.get(r.program.id) ?? r.ready.confidence);
        return (
          <span className="whitespace-nowrap">
            {delta > 0.05 ? <span className="mr-2 text-caption tabular text-success">+{delta.toFixed(1)}</span> : null}
            <span className="font-display text-display-base tabular text-primary">{r.ready.confidence.toFixed(1)}%</span>
          </span>
        );
      },
    },
    {
      key: "sop", header: "SOP", align: "right", value: (r) => r.program.sopDate,
      render: (r) => (
        <span className="tabular whitespace-nowrap">
          {fullDate(r.program.sopDate)}
          <span className="block text-caption text-quaternary">{daysFromToday(r.program.sopDate) >= 0 ? `in ${daysFromToday(r.program.sopDate)} days` : "in production"}</span>
        </span>
      ),
    },
    { key: "risk", header: "Risk", value: (r) => r.ready.risk, render: (r) => <RiskBadge risk={r.ready.risk} /> },
  ];

  function sendReport() {
    if (!selected) return;
    pipeline.start(
      ["Snapshot readiness by dimension", "Attach open exceptions and owners", "Format to the OEM's APQP status template", `Send to ${oemName(selected.program.id)} supplier quality`],
      () => toast(`Readiness report for ${selected.program.id} sent to ${oemName(selected.program.id)}. Signed by ${selected.program.pm}.`),
    );
  }

  return (
    <>
      <PageHeader
        title="ATP / SOP Readiness"
        description="Available-to-promise confidence for every awarded program: BOM, suppliers, material, production and quality, weighted into one number."
        mark={<KMark id="mark-readiness" size={44} />}
        info={
          <InfoPopover label="How confidence is calculated">
            <p className="text-body-sm text-secondary">
              Each dimension starts at its planned level and loses points for every open record against the program: lifecycle notices (BOM),
              supplier risks and unawarded sourcing events (suppliers), POs behind their need date (material), unresolved line-capacity shortfalls
              (production), overdue PPAP elements and unconfirmed root causes (quality). Weights: material 25%, BOM 20%, suppliers 20%, quality 20%,
              production 15%. Under 88% a program is at risk.
            </p>
          </InfoPopover>
        }
      >
        <FilterChips options={FILTERS} value={filter} onChange={setFilter} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiTile label="Awarded programs" value={String(board.length)} hint="measured for readiness" mark={<KMark id="mark-program" size={32} />} />
            <KpiTile label="At risk" value={String(atRisk)} hint="confidence under 88%" tone={atRisk ? "error" : "success"} delta={atRisk ? "needs action" : "clear"} mark={<KMark id="mark-supplier-risk" size={32} />} />
            <KpiTile label="Average confidence" value={`${average.toFixed(1)}%`} hint="across awarded programs" tone={improved ? "success" : "neutral"} delta={improved ? `${improved} improved today` : undefined} mark={<KMark id="mark-readiness" size={32} />} />
            <KpiTile label="Open drags" value={String(totalDrags)} hint="records taking points away" mark={<KMark id="mark-lead-time" size={32} />} />
          </KpiGrid>

          <Panel title="Readiness board" padded={false} action={<span className="text-caption text-quaternary">lowest confidence first · select a row</span>}>
            {rows.length === 0 ? (
              <EmptyState title="No program matches this filter" mark={<KMark id="mark-empty" size={56} />} />
            ) : (
              <DataTable
                rows={rows}
                columns={columns}
                rowKey={(row) => row.program.id}
                onRowClick={(row) => select(row.program.id)}
                isRowSelected={(row) => selected?.program.id === row.program.id}
                exportName="kraya-readiness-board"
                searchPlaceholder="Search programs"
                defaultSort={{ key: "confidence", dir: "asc" }}
                pageSize={12}
              />
            )}
          </Panel>

          <SplitRow ratio="1/1.4">
            <Panel title="Which programs are furthest from ready">
              <ChartFrame height={Math.max(180, chart.length * 34 + 40)}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 16, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                    <XAxis type="number" domain={[50, 100]} {...AXIS_PROPS} tickFormatter={(v: number) => `${v}%`} />
                    <YAxis type="category" interval={0} dataKey="name" width={104} {...AXIS_PROPS} />
                    <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => `${v.toFixed(1)}%`} />} />
                    <ReferenceLine x={88} stroke="var(--stroke-active)" strokeDasharray="4 4" />
                    <Bar dataKey="confidence" name="ATP confidence" radius={[0, 4, 4, 0]} barSize={14} onClick={(_, index) => select(chart[index]?.id ?? null)} className="cursor-pointer">
                      {chart.map((row) => (
                        <Cell key={row.id} fill={row.risk === "critical" ? TONE_COLOR.error : row.risk === "high" ? TONE_COLOR.warning : row.risk === "medium" ? TONE_COLOR.info : TONE_COLOR.success} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
              <p className="mt-2 text-caption text-quaternary">Dashed line is the 88% at-risk threshold. Select a bar to see what is behind the number.</p>
            </Panel>

            <Panel
              title={selected ? `What moves ${selected.program.id}` : "What moves the number"}
              padded={false}
              action={selected ? <RecordLink href={`/programs/${selected.program.id}`}>Open program</RecordLink> : undefined}
            >
              {selected ? (
                <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-y-auto p-4">
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-body-md text-primary">{selected.program.name}</p>
                      <p className="text-caption text-quaternary">{oemName(selected.program.id)} · SOP {fullDate(selected.program.sopDate)}</p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Btn onClick={sendReport} disabled={pipeline.running}>Send readiness report to OEM</Btn>
                      <LinkBtn href={`/programs/${selected.program.id}`} variant="primary">Work the program</LinkBtn>
                    </div>
                  </div>
                  <PipelineSteps run={pipeline.run} />
                  {selected.ready.drags.length === 0 ? (
                    <Callout tone="success">Nothing is open against this program. Readiness is at its planned level.</Callout>
                  ) : (
                    DIMENSIONS.map((dimension) => {
                      const drags = selected.ready.drags.filter((d) => d.dimension === dimension.id);
                      if (!drags.length) return null;
                      return (
                        <div key={dimension.id}>
                          <div className="flex items-baseline justify-between gap-3">
                            <Label>{dimension.label}</Label>
                            <span className="text-caption tabular text-quaternary">
                              {selected.ready[dimension.id]}% of {selected.program.base[dimension.id]}% planned
                            </span>
                          </div>
                          <ul className="mt-1 flex flex-col">
                            {drags.map((drag) => (
                              <li key={drag.text} className="flex items-center justify-between gap-3 border-b border-muted py-1.5 last:border-b-0">
                                <span className="min-w-0 truncate text-body-sm text-secondary" title={drag.text}>{drag.text}</span>
                                <span className="flex shrink-0 items-center gap-3">
                                  <span className="text-body-sm tabular text-warning">-{drag.points}</span>
                                  <RecordLink href={drag.href}>Fix</RecordLink>
                                </span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      );
                    })
                  )}
                </div>
              ) : (
                <EmptyState title="Select a program" mark={<KMark id="mark-empty" size={56} />} />
              )}
            </Panel>
          </SplitRow>
        </Stack>
      </PageBody>
    </>
  );
}
