"use client";

/**
 * Capacity against demand.
 *
 * Answers: for the next 12 months, does each partner's line time cover the
 * boards the programs need, and if not, which allocation fixes it.
 */

import { ArrowRight, Check, RotateCcw, X } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartLegend, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import { Btn, Confidence, Evidence, Field, KMark, KpiGrid, Label, LinkBtn, PipelineSteps, RecordLink, SignOff, Stack, usePipeline } from "@/components/kraya/kit";
import { KpiTile, Panel, Select, StatusBadge } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { ALLOCATION_PROPOSALS, EMS_PARTNERS, OTHER_LOAD } from "@/lib/kraya/data";
import { compact, inrL, num, PLAN_MONTHS } from "@/lib/kraya/format";
import { allocationState, capacityFor, emsById, programById, programLabel, readiness, sourceName } from "@/lib/kraya/selectors";
import type { AllocationProposal } from "@/lib/kraya/types";

const YEAR = (index: number) => (index < 3 ? "2026" : "2027");

function monthSpan(months: number[]): string {
  const first = months[0];
  const last = months[months.length - 1];
  return first === last ? `${PLAN_MONTHS[first]} ${YEAR(first)}` : `${PLAN_MONTHS[first]} ${YEAR(first)} to ${PLAN_MONTHS[last]} ${YEAR(last)}`;
}

function cellClass(pctValue: number): string {
  if (pctValue > 100) return "bg-error-surface text-error";
  if (pctValue >= 92) return "bg-warning-surface text-warning";
  if (pctValue >= 75) return "text-secondary";
  return "text-quaternary";
}

export default function CapacityPage() {
  const { status, decideAllocation, clear } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const [running, setRunning] = useState<string | null>(null);

  const network = EMS_PARTNERS.map((partner) => ({ partner, months: capacityFor(status, partner.id) }));
  const firstShort = network.find((n) => n.months.some((m) => m.shortfall > 0))?.partner.id ?? EMS_PARTNERS[0].id;
  const [picked, setPicked] = useState<string | null>(null);
  const emsId = picked ?? firstShort;
  const partner = emsById(emsId) ?? EMS_PARTNERS[0];
  const months = capacityFor(status, partner.id);

  const overCount = network.reduce((sum, n) => sum + n.months.filter((m) => m.shortfall > 0).length, 0);
  const worst = network.flatMap((n) => n.months.map((m) => ({ ...m, name: n.partner.name }))).sort((a, b) => b.shortfall - a.shortfall)[0];
  const states = ALLOCATION_PROPOSALS.map((p) => allocationState(status, p.id));
  const awaiting = states.filter((s) => s === "proposed").length;
  const accepted = states.filter((s) => s === "accepted").length;

  const programIds = Array.from(new Set(months.flatMap((m) => Object.keys(m.byProgram)))).sort((a, b) => (a === OTHER_LOAD ? -1 : b === OTHER_LOAD ? 1 : a.localeCompare(b)));
  const color = (id: string) => (id === OTHER_LOAD ? TONE_COLOR.neutral : SERIES[programIds.filter((p) => p !== OTHER_LOAD).indexOf(id) % SERIES.length]);
  const data = months.map((m) => {
    const row: Record<string, number | string> = { month: PLAN_MONTHS[m.index] };
    for (const id of programIds) row[id] = m.byProgram[id] ?? 0;
    return row;
  });
  const overMonths = months.filter((m) => m.shortfall > 0);

  function accept(proposal: AllocationProposal) {
    setRunning(proposal.id);
    pipeline.start(
      [
        `Reserve ${num(proposal.boardsPerMonth)} boards a month of line time at ${sourceName(proposal.toEmsId)}`,
        `Update the demand plan for ${programLabel(proposal.programId)}, ${monthSpan(proposal.months)}`,
        `Notify ${sourceName(proposal.fromEmsId)} and ${sourceName(proposal.toEmsId)}`,
        "Recalculate program readiness and the exception queue",
      ],
      () => {
        setRunning(null);
        decideAllocation(proposal.id, "accepted");
        toast(`${proposal.id} accepted. Readiness for ${programLabel(proposal.programId)} and the exception queue were recalculated.`);
      },
    );
  }

  return (
    <>
      <PageHeader
        title="Capacity ↔ Demand"
        description="Twelve months of board demand by program against each partner's line capacity, with the allocation moves that close each shortfall."
        mark={<KMark id="mark-capacity" size={44} />}
        actions={
          <>
            <Select aria-label="EMS partner" value={emsId} onChange={(event) => setPicked(event.target.value)} className="h-8 rounded-full border border-muted bg-action text-label-sm text-secondary">
              {EMS_PARTNERS.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </Select>
            <LinkBtn href={`/ems?ems=${emsId}`}>Partner profile</LinkBtn>
          </>
        }
      />

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiTile label="Partner-months over capacity" value={String(overCount)} hint="Oct 2026 to Sep 2027" tone={overCount ? "error" : "success"} delta={overCount ? "shortfall" : "all fit"} mark={<KMark id="mark-capacity" />} />
            <KpiTile label="Largest monthly shortfall" value={worst && worst.shortfall > 0 ? num(worst.shortfall) : "0"} hint={worst && worst.shortfall > 0 ? `boards · ${worst.name}, ${PLAN_MONTHS[worst.index]}` : "boards"} tone={worst && worst.shortfall > 0 ? "warning" : "success"} />
            <KpiTile label="Awaiting sign-off" value={String(awaiting)} hint="allocation proposals" tone={awaiting ? "warning" : "neutral"} />
            <KpiTile label="Accepted" value={`${accepted} / ${ALLOCATION_PROPOSALS.length}`} hint="applied to the plan below" tone="success" />
          </KpiGrid>

          <Panel title={`Does demand fit the line: boards per month against capacity · ${partner.name}`} action={<span className="text-caption text-quaternary">capacity {num(partner.capacity)} / month</span>}>
            <ChartFrame height={280}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data} margin={{ top: 12, right: 8, bottom: 0, left: -6 }}>
                  <CartesianGrid stroke={GRID_STROKE} vertical={false} />
                  <XAxis dataKey="month" {...AXIS_PROPS} interval={0} />
                  <YAxis {...AXIS_PROPS} tickFormatter={(v: number) => compact(v)} domain={[0, (max: number) => Math.ceil(Math.max(max, partner.capacity) * 1.08 / 5000) * 5000]} />
                  <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => `${num(v)} boards`} />} />
                  {programIds.map((id, index) => (
                    <Bar key={id} dataKey={id} name={programLabel(id)} stackId="load" fill={color(id)} barSize={34} radius={index === programIds.length - 1 ? [3, 3, 0, 0] : undefined} />
                  ))}
                  <ReferenceLine y={partner.capacity} stroke={TONE_COLOR.error} strokeDasharray="5 4" />
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
            <ChartLegend items={[...programIds.map((id) => ({ label: programLabel(id), color: color(id) })), { label: "Line capacity (dashed)", color: TONE_COLOR.error }]} />
            <div className="mt-3 border-t border-muted pt-3">
              {overMonths.length ? (
                <p className="text-body-sm text-error">
                  Over capacity in {overMonths.length} month{overMonths.length > 1 ? "s" : ""}:{" "}
                  <span className="tabular text-secondary">{overMonths.map((m) => `${PLAN_MONTHS[m.index]} +${num(m.shortfall)}`).join(" · ")}</span>
                </p>
              ) : (
                <p className="text-body-sm text-success">Demand fits the line in all 12 months at {partner.name}.</p>
              )}
            </div>
          </Panel>

          <Panel title="Network heat: utilisation by partner and month" padded={false} action={<span className="text-caption text-quaternary">select a row to chart it</span>}>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-collapse text-body-sm">
                <thead>
                  <tr className="border-b border-muted">
                    <th className="px-4 py-2 text-left text-caption font-medium tracking-[0.08em] text-quaternary uppercase">Partner</th>
                    {PLAN_MONTHS.map((month) => (
                      <th key={month} className="px-1 py-2 text-center text-caption font-medium tracking-[0.08em] text-quaternary uppercase">
                        {month}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {network.map(({ partner: p, months: row }) => (
                    <tr
                      key={p.id}
                      tabIndex={0}
                      onClick={() => setPicked(p.id)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          setPicked(p.id);
                        }
                      }}
                      aria-selected={p.id === emsId}
                      className={`cursor-pointer border-b border-muted outline-none transition-colors duration-[150ms] last:border-b-0 hover:bg-raised focus-visible:bg-raised ${p.id === emsId ? "bg-raised" : ""}`}
                    >
                      <td className="max-w-[220px] px-4 py-1.5">
                        <span className="block truncate text-primary">{p.name}</span>
                        <span className="block text-caption text-quaternary">
                          {p.city} · {compact(p.capacity)} / mo
                        </span>
                      </td>
                      {row.map((m) => {
                        const value = Math.round((m.total / m.capacity) * 100);
                        return (
                          <td key={m.index} className="px-1 py-1.5 text-center">
                            <span className={`block rounded-md px-1 py-1 tabular ${cellClass(value)}`} title={`${num(m.total)} of ${num(m.capacity)} boards`}>
                              {value}%
                              {m.shortfall > 0 ? <span className="block text-caption">+{compact(m.shortfall)}</span> : null}
                            </span>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Panel>

          <div>
            <Label className="mb-2">Allocation recommendations</Label>
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
              {ALLOCATION_PROPOSALS.map((proposal) => {
                const state = allocationState(status, proposal.id);
                const program = programById(proposal.programId);
                const now = program ? readiness(status, program) : null;
                const before = program ? readiness({ ...status, [`alloc:${proposal.id}`]: "rejected" }, program) : null;
                return (
                  <article key={proposal.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-muted bg-container p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="text-caption tabular text-quaternary">{proposal.id}</p>
                        <RecordLink href={`/programs/${proposal.programId}`}>{programLabel(proposal.programId)}</RecordLink>
                      </div>
                      <StatusBadge tone={state === "accepted" ? "success" : state === "rejected" ? "neutral" : "warning"}>{state === "proposed" ? "Awaiting sign-off" : state}</StatusBadge>
                    </div>

                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-body-md">
                      <button type="button" onClick={() => setPicked(proposal.fromEmsId)} className="min-w-0 truncate text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-active">
                        {sourceName(proposal.fromEmsId)}
                      </button>
                      <ArrowRight size={13} strokeWidth={1.75} aria-hidden className="shrink-0 text-quaternary" />
                      <button type="button" onClick={() => setPicked(proposal.toEmsId)} className="min-w-0 truncate text-primary underline-offset-2 outline-none hover:underline focus-visible:ring-2 focus-visible:ring-active">
                        {sourceName(proposal.toEmsId)}
                      </button>
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Field label="Boards / mo">
                        <span className="tabular text-primary">{num(proposal.boardsPerMonth)}</span>
                      </Field>
                      <Field label="Months">
                        <span className="text-primary">{monthSpan(proposal.months)}</span>
                      </Field>
                      <Field label="One-time cost">
                        <span className="tabular text-primary">{inrL(proposal.costDeltaL)}</span>
                      </Field>
                    </div>

                    <Evidence label="Rationale" items={proposal.rationale} />
                    <Confidence value={proposal.confidence} />

                    {now && before ? (
                      <p className="text-caption text-quaternary">
                        Production readiness{" "}
                        <span className="tabular text-secondary">
                          {state === "accepted" ? `${before.production} → ${now.production}` : `${now.production} now, ${readiness({ ...status, [`alloc:${proposal.id}`]: "accepted" }, program!)?.production ?? now.production} if accepted`}
                        </span>{" "}
                        · ATP confidence <span className="tabular text-secondary">{now.confidence}%</span>
                      </p>
                    ) : null}

                    {running === proposal.id ? <PipelineSteps run={pipeline.run} /> : null}

                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      {state === "proposed" ? (
                        <>
                          <Btn variant="primary" icon={Check} disabled={pipeline.running} onClick={() => accept(proposal)}>
                            Accept allocation
                          </Btn>
                          <Btn
                            icon={X}
                            disabled={pipeline.running}
                            onClick={() => {
                              decideAllocation(proposal.id, "rejected");
                              toast(`${proposal.id} rejected. The shortfall at ${sourceName(proposal.fromEmsId)} stays in the exception queue.`, "warning");
                            }}
                          >
                            Reject
                          </Btn>
                        </>
                      ) : (
                        <Btn
                          icon={RotateCcw}
                          onClick={() => {
                            clear(`alloc:${proposal.id}`);
                            toast(`${proposal.id} returned to awaiting sign-off.`, "info");
                          }}
                        >
                          Undo
                        </Btn>
                      )}
                    </div>
                    <SignOff name={proposal.owner} note="head of procurement signs EMS allocation changes" />
                  </article>
                );
              })}
            </div>
          </div>
        </Stack>
      </PageBody>
    </>
  );
}
