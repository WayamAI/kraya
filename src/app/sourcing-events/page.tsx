"use client";

/**
 * RFQ Automation & Bid Comparison.
 *
 * Supplier bids normalised to landed cost, an award recommendation with its
 * reasons, and the award itself. An award is a draft until the buyer signs.
 */

import { Award, BellRing, RotateCcw, Send } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartLegend, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import { Btn, Callout, Confidence, Evidence, Field, KMark, KpiGrid, KpiLink, Label, PipelineSteps, RecordLink, SignOff, Stack, usePipeline, useSelection } from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { EmptyState, KpiTile, Panel, SplitRow, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { SOURCING_EVENTS } from "@/lib/kraya/data";
import { daysFromToday, fullDate, inrL, num, relativeDays, rupees, shortDate } from "@/lib/kraya/format";
import { eventAward, eventStatus, landedCost, programById, programLabel, readiness, sourceName } from "@/lib/kraya/selectors";
import type { Bid, EventStatus, SourcingEvent } from "@/lib/kraya/types";

const STATUS_TONE: Record<EventStatus, StatusTone> = { Draft: "neutral", Bidding: "info", Evaluation: "warning", Awarded: "success" };
const FILTERS = ["all", "Evaluation", "Bidding", "Draft", "Awarded"] as const;

function breakdown(bid: Bid, event: SourcingEvent) {
  const freightDuty = (bid.unitPrice * (bid.freightPct + bid.dutyPct)) / 100;
  const tooling = event.annualQty > 0 ? (bid.toolingL * 100_000) / (event.annualQty * 3) : 0;
  const terms = (bid.unitPrice * 0.1 * (bid.paymentDays - 45)) / 365;
  return { freightDuty, tooling, terms, landed: landedCost(bid, event) };
}

const two = (value: number) => `₹${value.toFixed(2)}`;

export default function SourcingEventsPage() {
  const { status, get, set, clear, awardEvent } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const [linkedId, select] = useSelection("event");
  const [filter, setFilter] = useState<string>("all");

  const rows = useMemo(() => SOURCING_EVENTS.filter((e) => filter === "all" || eventStatus(status, e) === filter), [filter, status]);
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f, SOURCING_EVENTS.filter((e) => f === "all" || eventStatus(status, e) === f).length])) as Record<string, number>,
    [status],
  );

  const fallback = SOURCING_EVENTS.find((e) => e.status === "Evaluation") ?? SOURCING_EVENTS[0];
  const event = SOURCING_EVENTS.find((e) => e.id === linkedId) ?? fallback;
  const state = eventStatus(status, event);
  const winner = eventAward(status, event);
  const awardedThisSession = Boolean(status[`award:${event.id}`]);
  const published = get(`se:${event.id}:published`) === "1";
  const bafo = get(`se:${event.id}:bafo`) === "1";
  const chased = get(`se:${event.id}:chased`) === "1";
  const program = programById(event.programId);
  const ready = program ? readiness(status, program) : null;

  const bids = event.bids.map((bid) => ({ bid, ...breakdown(bid, event) })).sort((a, b) => a.landed - b.landed);
  const lowest = bids[0]?.bid.supplierId;
  const chart = bids.map((row) => ({
    name: sourceName(row.bid.supplierId),
    price: row.bid.unitPrice,
    freightDuty: Math.round(row.freightDuty * 100) / 100,
    tooling: Math.round(row.tooling * 100) / 100,
  }));

  const open = SOURCING_EVENTS.filter((e) => eventStatus(status, e) !== "Awarded");
  const dueSoon = open.filter((e) => e.status === "Evaluation" && daysFromToday(e.due) <= 14).length;
  const bidCount = open.reduce((sum, e) => sum + e.bids.length, 0);
  const savingL = SOURCING_EVENTS.filter((e) => e.status === "Evaluation" && e.recommendation).reduce((sum, e) => {
    const incumbent = e.bids[0];
    const pick = e.bids.find((b) => b.supplierId === e.recommendation?.supplierId);
    if (!incumbent || !pick) return sum;
    return sum + (Math.max(0, landedCost(incumbent, e) - landedCost(pick, e)) * e.annualQty) / 100_000;
  }, 0);

  function award(supplierId: string) {
    pipeline.start(
      ["Lock bids and freeze the tabulation", `Create award record for ${sourceName(supplierId)}`, "Notify successful and unsuccessful bidders", "Create contract request in Coupa", "Recalculate program readiness"],
      () => {
        awardEvent(event.id, supplierId);
        toast(`${event.id} awarded to ${sourceName(supplierId)}, signed by ${event.buyer}. Readiness for ${programLabel(event.programId)} was recalculated.`);
      },
    );
  }

  const columns: Column<SourcingEvent>[] = [
    { key: "id", header: "Event", width: "w-28", value: (e) => e.id, render: (e) => <span className="tabular whitespace-nowrap text-primary">{e.id}</span> },
    { key: "title", header: "What is being sourced", card: "title", value: (e) => e.title, render: (e) => <span className="text-primary">{e.title}</span> },
    { key: "pn", header: "Part", hide: "lg", value: (e) => e.pn, render: (e) => <span className="tabular whitespace-nowrap">{e.pn}</span> },
    { key: "program", header: "Program", hide: "md", value: (e) => programLabel(e.programId), render: (e) => <RecordLink href={`/programs/${e.programId}`} className="text-body-sm">{programLabel(e.programId)}</RecordLink> },
    { key: "bids", header: "Bids", align: "right", value: (e) => e.bids.length, render: (e) => <span className="tabular">{e.bids.length}</span> },
    { key: "due", header: "Due", align: "right", card: "metric", value: (e) => e.due, render: (e) => <span className="tabular whitespace-nowrap">{shortDate(e.due)} <span className="text-quaternary">· {relativeDays(e.due)}</span></span> },
    { key: "buyer", header: "Buyer", hide: "md", value: (e) => e.buyer, render: (e) => <span className="whitespace-nowrap">{e.buyer}</span> },
    { key: "status", header: "Status", value: (e) => eventStatus(status, e), render: (e) => <StatusBadge tone={STATUS_TONE[eventStatus(status, e)]}>{eventStatus(status, e)}</StatusBadge> },
  ];

  return (
    <>
      <PageHeader
        title="RFQ Automation & Bid Comparison"
        description="Supplier bids put on one basis: landed cost per piece with duty, freight, tooling and payment terms counted. Pick an event, read the recommendation, award."
        mark={<KMark id="mark-sourcing-event" size={44} />}
      >
        <FilterChips options={FILTERS.map((f) => ({ id: f, label: f === "all" ? "All" : f, count: counts[f] }))} value={filter} onChange={setFilter} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiTile label="Open events" value={String(open.length)} hint={`${SOURCING_EVENTS.length - open.length} awarded`} mark={<KMark id="mark-sourcing-event" />} />
            <KpiTile label="Bids received" value={String(bidCount)} hint="on open events" />
            <KpiLink href="/dashboard">
              <KpiTile label="Awards due in 14 days" value={String(dueSoon)} delta={dueSoon ? "on the exception queue" : "none waiting"} tone={dueSoon ? "warning" : "success"} />
            </KpiLink>
            <KpiLink href="/spend">
              <KpiTile label="Saving vs incumbent" value={`${inrL(savingL)}/yr`} hint="if recommendations are awarded" tone="success" />
            </KpiLink>
          </KpiGrid>

          <Panel title={`Sourcing events · ${rows.length}`} padded={false} action={<span className="text-caption text-quaternary">select an event to open its workspace below</span>}>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(e) => e.id}
              onRowClick={(e) => select(e.id)}
              isRowSelected={(e) => e.id === event.id}
              searchPlaceholder="Search event, part or buyer"
              exportName="kraya-sourcing-events"
              emptyTitle="No events in this status"
            />
          </Panel>

          <Panel
            title={`${event.id} · bid tabulation`}
            action={<StatusBadge tone={STATUS_TONE[state]}>{state}</StatusBadge>}
          >
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="min-w-0">
                  <p className="text-body-lg text-primary">{event.title}</p>
                  <p className="mt-0.5 text-body-sm text-tertiary">
                    <span className="tabular">{event.pn}</span> · {event.commodity} · for <RecordLink href={`/programs/${event.programId}`} className="text-body-sm">{programLabel(event.programId)}</RecordLink>
                    {ready ? <> · ATP confidence <span className="tabular text-primary">{ready.confidence.toFixed(1)}%</span></> : null}
                  </p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {state === "Draft" ? (
                    <Btn
                      variant="primary"
                      icon={Send}
                      disabled={pipeline.running || published}
                      onClick={() =>
                        pipeline.start(["Attach drawing, specification and quality manual", "Select bidders from the approved vendor list", "Publish in Coupa and send invitations"], () => {
                          set(`se:${event.id}:published`, "1");
                          toast(`${event.id} published to 3 approved bidders. Bids close ${fullDate(event.due)}.`);
                        })
                      }
                    >
                      {published ? "Published, awaiting bids" : "Publish event"}
                    </Btn>
                  ) : null}
                  {state === "Bidding" ? (
                    <Btn
                      variant="primary"
                      icon={BellRing}
                      disabled={chased}
                      onClick={() => { set(`se:${event.id}:chased`, "1"); toast(`Reminder sent to bidders who have not responded on ${event.id}. Agents may chase without approval (policy P-04).`); }}
                    >
                      {chased ? "Bidders chased today" : "Chase outstanding bids"}
                    </Btn>
                  ) : null}
                  {state === "Evaluation" ? (
                    <>
                      <Btn
                        icon={RotateCcw}
                        disabled={bafo || pipeline.running}
                        onClick={() => { set(`se:${event.id}:bafo`, "1"); toast(`Best-and-final requested from ${event.bids.length} bidders on ${event.id}. Replies due in 3 working days.`); }}
                      >
                        {bafo ? "Best-and-final requested" : "Request best-and-final"}
                      </Btn>
                      {event.recommendation ? (
                        <Btn variant="primary" icon={Award} disabled={pipeline.running} onClick={() => event.recommendation && award(event.recommendation.supplierId)}>
                          Award to recommended
                        </Btn>
                      ) : null}
                    </>
                  ) : null}
                  {state === "Awarded" && awardedThisSession ? (
                    <Btn disabled={pipeline.running} onClick={() => { clear(`award:${event.id}`); toast(`${event.id} award reopened. Readiness recalculated.`, "info"); }}>
                      Reopen award
                    </Btn>
                  ) : null}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 md:grid-cols-5">
                <Field label="Annual quantity"><span className="tabular">{num(event.annualQty)}</span></Field>
                <Field label="Target price"><span className="tabular">{event.targetPrice < 100 ? two(event.targetPrice) : rupees(event.targetPrice)}</span></Field>
                <Field label="Issued"><span className="tabular">{fullDate(event.issued)}</span></Field>
                <Field label="Decision due"><span className="tabular">{fullDate(event.due)} · {relativeDays(event.due)}</span></Field>
                <Field label="Buyer">{event.buyer}</Field>
              </div>

              <PipelineSteps run={pipeline.run} />

              {state === "Awarded" && winner ? (
                <Callout tone="success" label="Awarded">
                  <RecordLink href={`/suppliers/${winner}`}>{sourceName(winner)}</RecordLink> holds this award
                  {awardedThisSession ? `, signed this session by ${event.buyer}. A contract request is open in Coupa.` : "."}
                </Callout>
              ) : null}

              {bids.length ? (
                <div className="overflow-x-auto rounded-md border border-muted">
                  <table className="w-full min-w-[980px] text-left text-body-sm">
                    <thead>
                      <tr className="border-b border-muted">
                        {["Bidder", "Piece price", "Freight", "Duty", "Tooling", "Tooling / pc", "Terms", "Terms effect", "Landed cost", "vs target", "Lead time", "MOQ", "Quality", ""].map((heading, index) => (
                          <th key={`${heading}-${index}`} className={`px-3 py-2 text-caption font-medium tracking-[0.08em] whitespace-nowrap text-quaternary uppercase ${index > 0 && index < 13 ? "text-right" : ""}`}>{heading}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {bids.map(({ bid, tooling, terms, landed }) => {
                        const gap = landed - event.targetPrice;
                        const isWinner = winner === bid.supplierId;
                        return (
                          <tr key={bid.supplierId} className={`border-b border-muted last:border-b-0 ${isWinner ? "bg-raised" : ""}`}>
                            <td className="px-3 py-2.5">
                              <div className="flex min-w-0 flex-col gap-1">
                                <RecordLink href={`/suppliers/${bid.supplierId}`} className="text-body-sm">{sourceName(bid.supplierId)}</RecordLink>
                                <span className="flex flex-wrap gap-1">
                                  {bid.supplierId === lowest ? <StatusBadge tone="success">lowest landed</StatusBadge> : null}
                                  {event.recommendation?.supplierId === bid.supplierId ? <StatusBadge tone="info">recommended</StatusBadge> : null}
                                  {isWinner ? <StatusBadge tone="success">awarded</StatusBadge> : null}
                                </span>
                              </div>
                            </td>
                            <td className="px-3 py-2.5 text-right tabular text-primary">{two(bid.unitPrice)}</td>
                            <td className="px-3 py-2.5 text-right tabular">{bid.freightPct}%</td>
                            <td className="px-3 py-2.5 text-right tabular">{bid.dutyPct}%</td>
                            <td className="px-3 py-2.5 text-right tabular">{bid.toolingL ? inrL(bid.toolingL) : "none"}</td>
                            <td className="px-3 py-2.5 text-right tabular">{two(tooling)}</td>
                            <td className="px-3 py-2.5 text-right tabular whitespace-nowrap">Net {bid.paymentDays}</td>
                            <td className={`px-3 py-2.5 text-right tabular ${terms > 0 ? "text-success" : terms < 0 ? "text-warning" : ""}`}>{terms > 0 ? "-" : terms < 0 ? "+" : ""}{two(Math.abs(terms))}</td>
                            <td className="px-3 py-2.5 text-right font-display text-display-base tabular text-primary">{two(landed)}</td>
                            <td className={`px-3 py-2.5 text-right tabular whitespace-nowrap ${gap <= 0 ? "text-success" : "text-warning"}`}>{gap <= 0 ? "under by " : "over by "}{two(Math.abs(gap))}</td>
                            <td className="px-3 py-2.5 text-right tabular whitespace-nowrap">{bid.leadTimeWeeks} wk</td>
                            <td className="px-3 py-2.5 text-right tabular">{num(bid.moq)}</td>
                            <td className="px-3 py-2.5 text-right tabular">{bid.qualityScore}</td>
                            <td className="px-3 py-2.5 text-right">
                              {state === "Evaluation" ? (
                                <Btn disabled={pipeline.running} onClick={() => award(bid.supplierId)}>Award</Btn>
                              ) : null}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <EmptyState
                  title="No bids yet"
                  detail={state === "Draft" ? "Publish the event to invite bidders from the approved vendor list." : "Bids appear here as suppliers respond."}
                  mark={<KMark id="mark-empty" size={56} />}
                />
              )}

              {bids.length ? (
                <ul className="flex flex-col gap-1">
                  {bids.map(({ bid }) => (
                    <li key={bid.supplierId} className="text-body-sm text-tertiary">
                      <span className="text-secondary">{sourceName(bid.supplierId)}:</span> {bid.note}
                    </li>
                  ))}
                </ul>
              ) : null}
              <p className="text-caption text-quaternary">
                Landed cost = piece price plus freight and duty, plus tooling amortised over three years of volume, less a 10% cost-of-capital credit for payment terms beyond Net 45.
              </p>
            </div>
          </Panel>

          {bids.length ? (
            <SplitRow ratio="1.4/1">
              <Panel title="Landed cost per piece by bidder">
                <ChartFrame height={Math.max(180, bids.length * 64 + 48)}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                      <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                      <XAxis type="number" {...AXIS_PROPS} tickFormatter={(v: number) => `₹${v}`} />
                      <YAxis type="category" interval={0} dataKey="name" width={150} {...AXIS_PROPS} />
                      <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => two(v)} />} />
                      <ReferenceLine x={event.targetPrice} stroke={TONE_COLOR.neutral} strokeDasharray="4 4" />
                      <Bar dataKey="price" name="Piece price" stackId="cost" fill={SERIES[0]} barSize={18} isAnimationActive={false} />
                      <Bar dataKey="freightDuty" name="Freight and duty" stackId="cost" fill={SERIES[2]} barSize={18} isAnimationActive={false} />
                      <Bar dataKey="tooling" name="Tooling amortisation" stackId="cost" fill={SERIES[3]} barSize={18} radius={[0, 4, 4, 0]} isAnimationActive={false} />
                    </BarChart>
                  </ResponsiveContainer>
                </ChartFrame>
                <ChartLegend
                  items={[
                    { label: "Piece price", color: SERIES[0] },
                    { label: "Freight and duty", color: SERIES[2] },
                    { label: "Tooling amortisation", color: SERIES[3] },
                    { label: `Target ${two(event.targetPrice)}`, color: TONE_COLOR.neutral },
                  ]}
                />
                <p className="mt-2 text-caption text-quaternary">Bars show cost before the payment-terms credit; the landed cost in the table includes it.</p>
              </Panel>

              <Panel title="Award recommendation">
                {event.recommendation ? (
                  <div className="flex flex-col gap-3">
                    <div className="flex items-start gap-3">
                      <KMark id="mark-sourcing-event" size={36} className="mt-0.5" />
                      <div className="min-w-0">
                        <Label>Recommended supplier</Label>
                        <p className="mt-0.5 text-body-lg text-primary">
                          <RecordLink href={`/suppliers/${event.recommendation.supplierId}`}>{sourceName(event.recommendation.supplierId)}</RecordLink>
                        </p>
                      </div>
                    </div>
                    <Evidence label="Why" items={event.recommendation.rationale} />
                    <Confidence value={event.recommendation.confidence} />
                    <Callout>
                      {state === "Awarded"
                        ? "The award is recorded. The recommendation is kept here for the audit trail."
                        : `This is a draft from the Bid Comparison Agent. Nothing is awarded until ${event.buyer} signs.`}
                    </Callout>
                    <SignOff name={event.buyer} note="awards are drafts until a commodity buyer signs (policy P-03)" />
                  </div>
                ) : (
                  <EmptyState
                    title="No recommendation yet"
                    detail={state === "Bidding" ? "The agent recommends once at least two technically compliant bids are in." : "Publish the event and collect bids first."}
                    mark={<KMark id="mark-empty" size={56} />}
                  />
                )}
              </Panel>
            </SplitRow>
          ) : null}
        </Stack>
      </PageBody>
    </>
  );
}
