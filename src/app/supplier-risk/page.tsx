"use client";

/**
 * Supplier Risk.
 *
 * Predictive risk by signal. Each risk carries a mitigation plan that a named
 * person owns, accepts and closes; doing so moves program readiness and the
 * command center's exception queue.
 */

import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import {
  Btn,
  Callout,
  Confidence,
  Drawer,
  Evidence,
  Field,
  KMark,
  KpiGrid,
  KpiLink,
  Label,
  PipelineSteps,
  RecordLink,
  SignOff,
  Stack,
  usePipeline,
  useSelection,
} from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, Select, SplitRow, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { ALL_PEOPLE, SUPPLIER_RISKS } from "@/lib/kraya/data";
import { fullDate, inrL } from "@/lib/kraya/format";
import { programById, programLabel, readiness, residualScore, riskState, sourceName, type RiskState } from "@/lib/kraya/selectors";
import type { RiskSignal, SupplierRisk } from "@/lib/kraya/types";

const SIGNALS: RiskSignal[] = ["Financial", "Delivery", "Quality", "Capacity", "Single-source", "Geopolitical", "Cybersecurity", "Natural disaster"];

const STATE_TONE: Record<RiskState, StatusTone> = { open: "warning", assigned: "neutral", mitigating: "info", closed: "success" };

const STATE_FILTERS: { id: string; label: string }[] = [
  { id: "open", label: "Open" },
  { id: "assigned", label: "Assigned" },
  { id: "mitigating", label: "Mitigating" },
  { id: "closed", label: "Closed" },
  { id: "all", label: "All" },
];

function scoreClass(score: number) {
  return score >= 80 ? "text-error" : score >= 65 ? "text-warning" : "text-primary";
}

export default function SupplierRiskPage() {
  const { status, setRisk, clear } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const [selectedId, select] = useSelection("risk");
  const [filter, setFilter] = useState("all");
  const [signal, setSignal] = useState<RiskSignal | null>(null);
  const [ownerDraft, setOwnerDraft] = useState<Record<string, string>>({});

  const bySignal = useMemo(
    () =>
      SIGNALS.map((name) => {
        const risks = SUPPLIER_RISKS.filter((r) => r.signal === name);
        return { name, score: risks.reduce((sum, r) => sum + residualScore(status, r), 0), count: risks.length };
      }),
    [status],
  );

  const scoped = useMemo(() => SUPPLIER_RISKS.filter((r) => !signal || r.signal === signal), [signal]);
  const rows = useMemo(
    () => scoped.filter((r) => filter === "all" || riskState(status, r.id) === filter).sort((a, b) => residualScore(status, b) - residualScore(status, a)),
    [scoped, filter, status],
  );
  const counts = useMemo(
    () => Object.fromEntries(STATE_FILTERS.map((f) => [f.id, scoped.filter((r) => f.id === "all" || riskState(status, r.id) === f.id).length])) as Record<string, number>,
    [scoped, status],
  );

  const notClosed = SUPPLIER_RISKS.filter((r) => riskState(status, r.id) !== "closed");
  const avgResidual = notClosed.length ? notClosed.reduce((sum, r) => sum + residualScore(status, r), 0) / notClosed.length : 0;
  const noOwner = notClosed.filter((r) => !status[`riskOwner:${r.id}`]).length;
  const mitigating = SUPPLIER_RISKS.filter((r) => riskState(status, r.id) === "mitigating").length;
  const exposure = SUPPLIER_RISKS.filter((r) => { const s = riskState(status, r.id); return s === "open" || s === "assigned"; }).reduce((sum, r) => sum + r.mitigation.costL, 0);

  const selected = SUPPLIER_RISKS.find((r) => r.id === selectedId) ?? null;
  const selectedState = selected ? riskState(status, selected.id) : "open";
  const savedOwner = selected ? status[`riskOwner:${selected.id}`] : undefined;
  const owner = selected ? ownerDraft[selected.id] ?? savedOwner ?? selected.suggestedOwner : "";

  function accept(risk: SupplierRisk, who: string) {
    pipeline.start(
      [`Create ${risk.mitigation.steps.length} mitigation tasks for ${who}`, `Notify ${sourceName(risk.supplierId)} and request a written commitment`, `Book ${inrL(risk.mitigation.costL)} against the program risk budget`, "Recalculate program readiness and the exception queue"],
      () => {
        setRisk(risk.id, "mitigating", who);
        toast(`${risk.id} mitigation accepted, owner ${who}. Program readiness and the dashboard exception queue were recalculated.`);
      },
    );
  }

  const columns: Column<SupplierRisk>[] = [
    { key: "id", header: "Risk", width: "w-24", value: (r) => r.id, render: (r) => <span className="tabular text-primary">{r.id}</span> },
    { key: "title", header: "What could go wrong", card: "title", value: (r) => r.title, render: (r) => <span className="text-primary">{r.title}</span> },
    { key: "supplier", header: "Supplier", value: (r) => sourceName(r.supplierId), render: (r) => <RecordLink href={`/suppliers/${r.supplierId}`} className="text-body-sm">{sourceName(r.supplierId)}</RecordLink> },
    { key: "signal", header: "Signal", value: (r) => r.signal, render: (r) => <span className="whitespace-nowrap">{r.signal}</span> },
    {
      key: "score", header: "Score", align: "right", card: "metric", value: (r) => residualScore(status, r),
      render: (r) => {
        const residual = residualScore(status, r);
        return (
          <span className="tabular whitespace-nowrap">
            {residual !== r.score ? <span className="text-quaternary line-through">{r.score}</span> : null}{" "}
            <span className={scoreClass(residual)}>{residual}</span>
          </span>
        );
      },
    },
    { key: "prob", header: "Failure prob. 90d", align: "right", hide: "md", value: (r) => r.failureProb, render: (r) => <span className="tabular">{r.failureProb}%</span> },
    {
      key: "programs", header: "Programs", hide: "lg", value: (r) => r.programIds.map(programLabel).join(", "),
      render: (r) => <span className="block max-w-[14rem] truncate">{r.programIds.map(programLabel).join(", ")}</span>,
    },
    {
      key: "owner", header: "Owner", hide: "md", value: (r) => status[`riskOwner:${r.id}`] ?? "",
      render: (r) => (status[`riskOwner:${r.id}`] ? <span className="whitespace-nowrap">{status[`riskOwner:${r.id}`]}</span> : <span className="text-warning">Unassigned</span>),
    },
    { key: "state", header: "State", value: (r) => riskState(status, r.id), render: (r) => <StatusBadge tone={STATE_TONE[riskState(status, r.id)]}>{riskState(status, r.id)}</StatusBadge> },
  ];

  return (
    <>
      <PageHeader
        title="Supplier Risk"
        description="Predicted supply failures by signal. Open a risk to assign an owner, accept the mitigation plan and close it."
        mark={<KMark id="mark-supplier-risk" size={44} />}
        actions={signal ? <Btn onClick={() => setSignal(null)}>Signal: {signal} · clear</Btn> : null}
      >
        <FilterChips options={STATE_FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} value={filter} onChange={setFilter} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid cols={5}>
            <KpiTile label="Risks not closed" value={String(notClosed.length)} hint={`of ${SUPPLIER_RISKS.length} detected`} tone="warning" mark={<KMark id="mark-supplier-risk" />} />
            <KpiTile label="Average residual score" value={avgResidual.toFixed(0)} hint="after mitigation progress" />
            <KpiTile label="No named owner" value={String(noOwner)} delta={noOwner ? "assign today" : "all owned"} tone={noOwner ? "error" : "success"} />
            <KpiTile label="Mitigations in progress" value={String(mitigating)} hint="accepted, not yet closed" tone="info" />
            <KpiLink href="/dashboard">
              <KpiTile label="Unfunded mitigation cost" value={inrL(exposure)} hint="plans not yet accepted" />
            </KpiLink>
          </KpiGrid>

          <SplitRow ratio="1/1.4">
            <Panel title="Which signal carries the risk" action={<span className="text-caption text-quaternary">click a bar to filter</span>}>
              <ChartFrame height={280}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={bySignal} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                    <XAxis type="number" {...AXIS_PROPS} />
                    <YAxis type="category" interval={0} dataKey="name" width={112} {...AXIS_PROPS} />
                    <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => `${v} points`} />} />
                    <Bar dataKey="score" name="Summed residual score" radius={[0, 4, 4, 0]} barSize={14} cursor="pointer" onClick={(_, index) => setSignal(bySignal[index].name === signal ? null : bySignal[index].name)}>
                      {bySignal.map((row) => (
                        <Cell key={row.name} fill={!signal || signal === row.name ? SERIES[0] : TONE_COLOR.neutral} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
              <div className="mt-2 flex flex-wrap gap-1.5">
                {bySignal.map((row) => (
                  <button
                    key={row.name}
                    type="button"
                    aria-pressed={signal === row.name}
                    onClick={() => setSignal(signal === row.name ? null : row.name)}
                    className={`rounded-full border px-2.5 py-0.5 text-caption outline-none transition-colors duration-[150ms] focus-visible:ring-2 focus-visible:ring-active ${signal === row.name ? "border-default bg-raised-2 text-primary" : "border-muted bg-action text-tertiary hover:text-primary"}`}
                  >
                    {row.name} <span className="tabular text-quaternary">{row.count}</span>
                  </button>
                ))}
              </div>
            </Panel>

            <Panel title="Highest residual risk now" padded={false}>
              <ul className="min-h-0 flex-1 overflow-y-auto">
                {[...SUPPLIER_RISKS].sort((a, b) => residualScore(status, b) - residualScore(status, a)).slice(0, 6).map((risk) => {
                  const state = riskState(status, risk.id);
                  return (
                    <li key={risk.id} className="border-b border-muted last:border-b-0">
                      <button type="button" onClick={() => select(risk.id)} className="flex w-full min-w-0 items-center gap-3 px-4 py-2.5 text-left outline-none transition-colors duration-[150ms] hover:bg-raised focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-active">
                        <span className={`w-9 shrink-0 font-display text-display-lg tabular ${scoreClass(residualScore(status, risk))}`}>{residualScore(status, risk)}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-body-md text-primary">{risk.title}</span>
                          <span className="block truncate text-caption text-quaternary">{risk.id} · {sourceName(risk.supplierId)} · {risk.signal} · {risk.failureProb}% in 90 days</span>
                        </span>
                        <StatusBadge tone={STATE_TONE[state]}>{state}</StatusBadge>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </Panel>
          </SplitRow>

          <Panel title={`Risk register · ${rows.length}`} padded={false}>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(r) => r.id}
              onRowClick={(r) => select(r.id)}
              isRowSelected={(r) => r.id === selectedId}
              searchPlaceholder="Search risk, supplier or part"
              getSearchText={(r) => `${r.pn ?? ""} ${r.summary}`}
              exportName="kraya-supplier-risks"
              emptyTitle="No risks in this state"
              emptyDetail="Pick another state chip or clear the signal filter."
            />
          </Panel>
        </Stack>
      </PageBody>

      <Drawer
        open={Boolean(selected)}
        onClose={() => select(null)}
        title={selected?.id ?? ""}
        subtitle={selected ? `${selected.signal} · ${sourceName(selected.supplierId)} · detected ${fullDate(selected.detected)}` : undefined}
        badge={selected ? <StatusBadge tone={STATE_TONE[selectedState]}>{selectedState}</StatusBadge> : undefined}
        footer={
          selected ? (
            <>
              {selectedState === "open" ? (
                <Btn variant="primary" disabled={pipeline.running} onClick={() => { setRisk(selected.id, "assigned", owner); toast(`${selected.id} assigned to ${owner}.`); }}>
                  Assign owner
                </Btn>
              ) : null}
              {selectedState === "open" || selectedState === "assigned" ? (
                <Btn variant={selectedState === "assigned" ? "primary" : "secondary"} disabled={pipeline.running} onClick={() => accept(selected, owner)}>
                  Accept mitigation plan
                </Btn>
              ) : null}
              {selectedState === "mitigating" ? (
                <Btn
                  variant="primary"
                  disabled={!savedOwner}
                  title={savedOwner ? undefined : "A named owner must close the risk"}
                  onClick={() => { setRisk(selected.id, "closed", savedOwner); toast(`${selected.id} closed by ${savedOwner}. Residual score stays on the register at 25%.`); }}
                >
                  Close risk
                </Btn>
              ) : null}
              {selectedState !== "open" ? (
                <Btn variant="ghost" disabled={pipeline.running} onClick={() => { clear(`risk:${selected.id}`); clear(`riskOwner:${selected.id}`); toast(`${selected.id} reopened. Readiness recalculated.`, "info"); }}>
                  Reopen
                </Btn>
              ) : null}
            </>
          ) : null
        }
      >
        {selected ? (
          <>
            <div>
              <p className="text-body-lg text-primary">{selected.title}</p>
              <p className="mt-1 text-body-md text-secondary">{selected.summary}</p>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <Field label="Score">
                <span className={`font-display text-display-lg tabular ${scoreClass(residualScore(status, selected))}`}>{residualScore(status, selected)}</span>
                {residualScore(status, selected) !== selected.score ? <span className="ml-1.5 text-caption tabular text-quaternary">was {selected.score}</span> : null}
              </Field>
              <Field label="Failure in 90 days"><span className="font-display text-display-lg tabular text-primary">{selected.failureProb}%</span></Field>
              <Field label="Part">{selected.pn ? <span className="tabular">{selected.pn}</span> : "Supplier-wide"}</Field>
            </div>

            <Evidence items={selected.evidence} />

            <div>
              <Label>Affected programs and their readiness</Label>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {selected.programIds.map((programId) => {
                  const program = programById(programId);
                  const ready = program ? readiness(status, program) : null;
                  const before = program ? readiness({}, program) : null;
                  return (
                    <li key={programId} className="flex min-w-0 items-center justify-between gap-3 rounded-md border border-muted bg-raised px-3 py-2">
                      <RecordLink href={`/programs/${programId}`} className="min-w-0 truncate text-body-sm">{programLabel(programId)}</RecordLink>
                      {ready ? (
                        <span className="shrink-0 text-body-sm text-tertiary">
                          ATP confidence <span className="tabular text-primary">{ready.confidence.toFixed(1)}%</span>
                          {before && before.confidence !== ready.confidence ? (
                            <span className={`ml-1.5 tabular ${ready.confidence > before.confidence ? "text-success" : "text-error"}`}>
                              {ready.confidence > before.confidence ? "+" : ""}{(ready.confidence - before.confidence).toFixed(1)} this session
                            </span>
                          ) : null}
                        </span>
                      ) : (
                        <span className="shrink-0 text-caption text-quaternary">not yet awarded</span>
                      )}
                    </li>
                  );
                })}
              </ul>
            </div>

            <Callout label="Recommended mitigation">
              <p className="text-primary">{selected.mitigation.title}</p>
              <ol className="mt-1.5 flex list-decimal flex-col gap-1 pl-5 text-body-sm text-secondary">
                {selected.mitigation.steps.map((step) => (
                  <li key={step}>{step}</li>
                ))}
              </ol>
              <p className="mt-2 text-body-sm text-tertiary">
                Cost <span className="tabular text-primary">{selected.mitigation.costL ? inrL(selected.mitigation.costL) : "no direct cost"}</span> · takes <span className="tabular text-primary">{selected.mitigation.weeks} weeks</span>
              </p>
            </Callout>

            <Confidence value={selected.confidence} label="Agent confidence in this risk" />

            <div>
              <Label>Owner</Label>
              <div className="mt-1.5 flex flex-wrap items-center gap-2">
                <Select
                  aria-label="Risk owner"
                  value={owner}
                  disabled={selectedState === "closed"}
                  onChange={(event) => setOwnerDraft((current) => ({ ...current, [selected.id]: event.target.value }))}
                  className="h-8 rounded-full border border-muted bg-action text-label-sm text-secondary outline-none focus-visible:ring-2 focus-visible:ring-active disabled:opacity-50"
                >
                  {ALL_PEOPLE.map((person) => (
                    <option key={person} value={person}>{person}{person === selected.suggestedOwner ? " (suggested)" : ""}</option>
                  ))}
                </Select>
                {savedOwner && savedOwner !== owner && selectedState !== "closed" ? (
                  <Btn onClick={() => { setRisk(selected.id, selectedState === "open" ? "assigned" : selectedState, owner); toast(`${selected.id} reassigned to ${owner}.`); }}>Reassign</Btn>
                ) : null}
                <span className="text-caption text-quaternary">{savedOwner ? `Currently ${savedOwner}` : "Not assigned yet"}</span>
              </div>
            </div>

            <PipelineSteps run={pipeline.run} />
            <SignOff name={savedOwner ?? owner} note="Agents raise and score risks; only a named owner accepts a plan or closes a risk (policy P-05)" />
          </>
        ) : null}
      </Drawer>
    </>
  );
}
