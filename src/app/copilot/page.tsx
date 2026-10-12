"use client";

/**
 * Copilot. Source-to-pay questions answered from the records in this app,
 * with every record the answer rests on listed beside it and linked.
 * Answers are scripted for the demo dataset; the side panel reads live state.
 */

import { ArrowUp, Copy, RotateCcw } from "lucide-react";
import Link from "next/link";
import { useEffect, useRef, useState, type FormEvent } from "react";

import { PageHeader } from "@/components/layout/page-header";
import { Btn, Confidence, KMark, Label, PipelineSteps, usePipeline } from "@/components/kraya/kit";
import { InfoPopover } from "@/components/ui/info-popover";
import { EmptyState, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import {
  ALLOCATION_PROPOSALS,
  BOMS,
  CONTRACTS,
  COPILOT_SCRIPTS,
  LIFECYCLE_NOTICES,
  NCRS,
  PPAP_SUBMISSIONS,
  PROGRAMS,
  PURCHASE_ORDERS,
  SOURCING_EVENTS,
  SUPPLIER_RISKS,
} from "@/lib/kraya/data";
import {
  allocationState,
  eventStatus,
  ncrStep,
  noticeState,
  poView,
  ppapSummary,
  readiness,
  riskState,
  type Status,
} from "@/lib/kraya/selectors";
import type { Citation, CopilotScript } from "@/lib/kraya/types";

interface Turn {
  id: number;
  question: string;
  script: CopilotScript | null;
}

const PARAM: Record<string, string> = {
  "Purchase order": "po",
  "Supplier risk": "risk",
  PPAP: "ppap",
  "Lifecycle notice": "notice",
  "Sourcing event": "event",
  Contract: "contract",
  NCR: "ncr",
  "Should-cost": "line",
};

function citationHref(citation: Citation): string {
  const param = PARAM[citation.type];
  return param ? `${citation.href}?${param}=${citation.id}` : citation.href;
}

/** What the cited record looks like right now, after anything done this session. */
function liveState(citation: Citation, s: Status): { text: string; tone: StatusTone } | null {
  switch (citation.type) {
    case "Purchase order": {
      const po = PURCHASE_ORDERS.find((p) => p.id === citation.id);
      if (!po) return null;
      const view = poView(s, po);
      return view.lateDays > 0 ? { text: `${view.lateDays}d late`, tone: "error" } : { text: view.expedited || view.repromised ? "recovered" : "on time", tone: "success" };
    }
    case "Supplier risk": {
      const risk = SUPPLIER_RISKS.find((r) => r.id === citation.id);
      if (!risk) return null;
      const state = riskState(s, risk.id);
      return { text: state, tone: state === "closed" ? "success" : state === "mitigating" ? "info" : "warning" };
    }
    case "PPAP": {
      const sub = PPAP_SUBMISSIONS.find((p) => p.id === citation.id);
      if (!sub) return null;
      const summary = ppapSummary(s, sub);
      return summary.overdue ? { text: `${summary.overdue} overdue`, tone: "error" } : { text: summary.pswSigned ? "PSW signed" : `${summary.pct}% approved`, tone: summary.pswSigned ? "success" : "info" };
    }
    case "Lifecycle notice": {
      if (!LIFECYCLE_NOTICES.some((n) => n.id === citation.id)) return null;
      const state = noticeState(s, citation.id);
      return { text: state, tone: state === "open" ? "warning" : "success" };
    }
    case "Sourcing event": {
      const event = SOURCING_EVENTS.find((e) => e.id === citation.id);
      if (!event) return null;
      const state = eventStatus(s, event);
      return { text: state.toLowerCase(), tone: state === "Awarded" ? "success" : "info" };
    }
    case "Allocation": {
      if (!ALLOCATION_PROPOSALS.some((a) => a.id === citation.id)) return null;
      const state = allocationState(s, citation.id);
      return { text: state, tone: state === "accepted" ? "success" : state === "rejected" ? "neutral" : "warning" };
    }
    case "NCR": {
      const ncr = NCRS.find((n) => n.id === citation.id);
      if (!ncr) return null;
      const step = ncrStep(s, ncr);
      return { text: step >= 8 ? "closed" : `8D at D${step}`, tone: step >= 8 ? "success" : "info" };
    }
    case "Program": {
      const program = PROGRAMS.find((p) => p.id === citation.id);
      const ready = program ? readiness(s, program) : null;
      return ready ? { text: `ATP ${ready.confidence.toFixed(1)}%`, tone: ready.confidence >= 88 ? "success" : "warning" } : null;
    }
    default:
      return null;
  }
}

const KEYWORDS: { id: string; words: string[] }[] = [
  { id: "Q1", words: ["camera", "varuna", "sop", "block", "stop"] },
  { id: "Q2", words: ["single", "sole", "alternate", "second source"] },
  { id: "Q3", words: ["fakra", "bid", "landed", "award"] },
  { id: "Q4", words: ["lte", "eol", "end-of-life", "end of life", "last-time", "ltb"] },
  { id: "Q5", words: ["capacity", "ems", "line", "kaveri", "coromandel"] },
  { id: "Q6", words: ["contract", "renew", "clause"] },
  { id: "Q7", words: ["ncr", "quality", "ppm", "defect", "fault"] },
  { id: "Q8", words: ["saving", "cost", "spend", "cr"] },
];

function matchScript(question: string): CopilotScript | null {
  const text = question.toLowerCase();
  const exact = COPILOT_SCRIPTS.find((s) => s.prompt.toLowerCase() === text);
  if (exact) return exact;
  let best: { id: string; hits: number } | null = null;
  for (const entry of KEYWORDS) {
    const hits = entry.words.filter((word) => text.includes(word)).length;
    if (hits > 0 && (!best || hits > best.hits)) best = { id: entry.id, hits };
  }
  return best ? COPILOT_SCRIPTS.find((s) => s.id === best.id) ?? null : null;
}

export default function CopilotPage() {
  const { status } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const [turns, setTurns] = useState<Turn[]>([]);
  const [activeId, setActiveId] = useState<number | null>(null);
  const [draft, setDraft] = useState("");
  const [pending, setPending] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const counter = useRef(1);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [turns.length, pending, pipeline.run?.index]);

  function ask(question: string) {
    const text = question.trim();
    if (!text || pipeline.running) return;
    setDraft("");
    setPending(text);
    const script = matchScript(text);
    pipeline.start(
      ["Reading the question", "Searching purchase orders, contracts, notices and PPAP records", script ? `Ranking ${script.citations.length} matching records` : "No strong match in the records", "Writing the answer with citations"],
      () => {
        const id = counter.current;
        counter.current += 1;
        setTurns((current) => [...current, { id, question: text, script }]);
        setActiveId(id);
        setPending(null);
      },
      520,
    );
  }

  function onSubmit(event: FormEvent) {
    event.preventDefault();
    ask(draft);
  }

  const active = turns.find((turn) => turn.id === activeId) ?? turns[turns.length - 1];
  const citations = active?.script?.citations ?? [];
  const asked = new Set(turns.map((turn) => turn.script?.id));
  const suggestions = COPILOT_SCRIPTS.filter((s) => !asked.has(s.id));

  return (
    <>
      <PageHeader
        title="Copilot"
        description="Ask about programs, POs, suppliers, contracts and quality. Every answer lists the records it rests on."
        mark={<KMark id="mark-copilot" size={44} />}
        info={
          <InfoPopover label="About these answers">
            <p className="text-body-sm text-secondary">
              In this build the answers are scripted against the demo dataset and matched to your question by topic. The records panel is live:
              it shows each cited record as it stands now, including anything you have changed this session. Copilot never acts; it points to the
              page where a named person does.
            </p>
          </InfoPopover>
        }
        actions={
          turns.length ? (
            <Btn icon={RotateCcw} onClick={() => { setTurns([]); setActiveId(null); }}>New conversation</Btn>
          ) : null
        }
      />

      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <section className="flex min-h-0 min-w-0 flex-1 flex-col">
          <div ref={scrollRef} className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-5">
            {turns.length === 0 && !pending ? (
              <div className="mx-auto flex max-w-[720px] flex-col gap-4 pt-4">
                <EmptyState
                  title="Ask a source-to-pay question"
                  detail={`Grounded in ${PURCHASE_ORDERS.length} POs, ${CONTRACTS.length} contracts, ${LIFECYCLE_NOTICES.length} lifecycle notices, ${PPAP_SUBMISSIONS.length} PPAP submissions, ${NCRS.length} NCRs and ${Object.keys(BOMS).length} frozen BOMs.`}
                  mark={<KMark id="mark-copilot" size={72} />}
                />
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {COPILOT_SCRIPTS.map((script) => (
                    <button
                      key={script.id}
                      type="button"
                      onClick={() => ask(script.prompt)}
                      className="rounded-lg border border-muted bg-container px-3 py-2.5 text-left text-body-sm text-secondary outline-none transition-colors duration-[150ms] hover:border-default hover:bg-raised hover:text-primary focus-visible:ring-2 focus-visible:ring-active"
                    >
                      {script.prompt}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex max-w-[760px] flex-col gap-5">
                {turns.map((turn) => {
                  const isActive = active?.id === turn.id;
                  return (
                    <article key={turn.id} className="flex flex-col gap-3">
                      <p className="ml-auto max-w-[85%] rounded-lg bg-raised-2 px-3 py-2 text-body-md text-primary">{turn.question}</p>
                      <div
                        className={`flex flex-col gap-3 rounded-lg border bg-container p-4 ${isActive ? "border-default" : "border-muted"}`}
                      >
                        {turn.script ? (
                          <>
                            {turn.script.answer.map((paragraph) => (
                              <p key={paragraph} className="text-body-md text-secondary">{paragraph}</p>
                            ))}
                            {turn.script.bullets ? (
                              <ul className="flex flex-col gap-1">
                                {turn.script.bullets.map((bullet) => (
                                  <li key={bullet} className="flex gap-2 text-body-md text-secondary">
                                    <span aria-hidden className="mt-2 size-1 shrink-0 rounded-full bg-quaternary" />
                                    <span className="min-w-0">{bullet}</span>
                                  </li>
                                ))}
                              </ul>
                            ) : null}
                            <div className="flex flex-wrap items-end justify-between gap-3 border-t border-muted pt-3">
                              <Confidence value={turn.script.confidence} />
                              <p className="min-w-0 text-caption text-quaternary">{turn.script.followUp}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                              <Btn onClick={() => setActiveId(turn.id)} variant={isActive ? "primary" : "secondary"}>
                                {turn.script.citations.length} records referenced
                              </Btn>
                              <Btn
                                icon={Copy}
                                variant="ghost"
                                onClick={() => {
                                  void navigator.clipboard?.writeText([...(turn.script?.answer ?? []), ...(turn.script?.bullets ?? [])].join("\n"));
                                  toast("Answer copied with its record ids.");
                                }}
                              >
                                Copy
                              </Btn>
                            </div>
                          </>
                        ) : (
                          <>
                            <p className="text-body-md text-secondary">
                              I could not ground that in the records I can read, so I will not guess. I can answer from programs, BOMs, purchase orders,
                              supplier risks, lifecycle notices, sourcing events, contracts, PPAP, NCRs and EMS capacity.
                            </p>
                            <p className="text-caption text-quaternary">Confidence below the 70% floor set in policy P-09. Try one of the questions below.</p>
                          </>
                        )}
                      </div>
                    </article>
                  );
                })}
                {pending ? (
                  <article className="flex flex-col gap-3">
                    <p className="ml-auto max-w-[85%] rounded-lg bg-raised-2 px-3 py-2 text-body-md text-primary">{pending}</p>
                    <PipelineSteps run={pipeline.run} />
                  </article>
                ) : null}
              </div>
            )}
          </div>

          <div className="shrink-0 border-t border-muted px-4 py-3 sm:px-5">
            <div className="mx-auto flex max-w-[760px] flex-col gap-2">
              {turns.length > 0 && suggestions.length > 0 ? (
                <div className="flex gap-1.5 overflow-x-auto pb-0.5">
                  {suggestions.slice(0, 4).map((script) => (
                    <button
                      key={script.id}
                      type="button"
                      onClick={() => ask(script.prompt)}
                      disabled={pipeline.running}
                      className="max-w-[280px] shrink-0 truncate rounded-full border border-muted bg-action px-2.5 py-1 text-label-sm text-tertiary outline-none transition-colors duration-[150ms] hover:border-default hover:text-primary focus-visible:ring-2 focus-visible:ring-active disabled:opacity-40"
                    >
                      {script.prompt}
                    </button>
                  ))}
                </div>
              ) : null}
              <form onSubmit={onSubmit} className="flex items-center gap-2">
                <input
                  value={draft}
                  onChange={(event) => setDraft(event.target.value)}
                  placeholder="Ask about a program, part, supplier, PO or contract"
                  aria-label="Question"
                  className="h-11 min-w-0 flex-1 rounded-full border border-muted bg-action px-4 text-body-md text-primary outline-none transition-colors duration-[150ms] placeholder:text-quaternary focus:border-active"
                />
                <button
                  type="submit"
                  aria-label="Ask"
                  disabled={!draft.trim() || pipeline.running}
                  className="inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-action-primary text-on-color outline-none transition-colors duration-[150ms] hover:bg-action-primary-hover focus-visible:ring-2 focus-visible:ring-active disabled:opacity-40"
                >
                  <ArrowUp size={16} strokeWidth={1.75} aria-hidden />
                </button>
              </form>
            </div>
          </div>
        </section>

        <aside className="flex max-h-[40vh] min-h-0 w-full shrink-0 flex-col border-t border-muted bg-container lg:max-h-none lg:w-[340px] lg:border-t-0 lg:border-l">
          <header className="flex h-11 shrink-0 items-center justify-between gap-3 border-b border-muted px-4">
            <h3 className="text-caption tracking-[0.08em] text-quaternary uppercase">Records referenced</h3>
            <span className="text-caption tabular text-quaternary">{citations.length}</span>
          </header>
          <div className="min-h-0 flex-1 overflow-y-auto p-3">
            {citations.length === 0 ? (
              <EmptyState title="No records yet" detail="Ask a question and the records behind the answer appear here." mark={<KMark id="mark-empty" size={48} />} />
            ) : (
              <ul className="flex flex-col gap-2">
                {citations.map((citation) => {
                  const live = liveState(citation, status);
                  return (
                    <li key={`${citation.type}-${citation.id}`}>
                      <Link
                        href={citationHref(citation)}
                        className="block rounded-lg border border-muted bg-page px-3 py-2.5 outline-none transition-colors duration-[150ms] hover:border-default hover:bg-raised focus-visible:ring-2 focus-visible:ring-active"
                      >
                        <span className="flex items-center justify-between gap-2">
                          <Label>{citation.type}</Label>
                          {live ? <StatusBadge tone={live.tone}>{live.text}</StatusBadge> : null}
                        </span>
                        <span className="mt-1 block text-body-sm tabular text-primary">{citation.id}</span>
                        <span className="block truncate text-body-sm text-secondary">{citation.label}</span>
                        <span className="block truncate text-caption text-quaternary">{citation.detail}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>
          <p className="shrink-0 border-t border-muted px-4 py-2 text-caption text-quaternary">
            Status badges are live. The answer text is as written when asked.
          </p>
        </aside>
      </div>
    </>
  );
}
