"use client";

/**
 * APQP / PPAP tracker.
 *
 * Answers: for each part and supplier, which of the 18 PPAP elements are in,
 * which are late, and whether the warrant can be signed before SOP.
 */

import { BadgeCheck, Check, Dot, Minus, PenLine, Send, TriangleAlert, type LucideIcon } from "lucide-react";
import { useState } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import {
  Btn,
  Callout,
  Drawer,
  Field,
  KMark,
  KpiGrid,
  KpiLink,
  Label,
  Meter,
  PipelineSteps,
  RecordLink,
  SignOff,
  Stack,
  usePipeline,
  useSelection,
} from "@/components/kraya/kit";
import { FilterChips } from "@/components/ui/data-table";
import { EmptyState, KpiTile, Panel, Select, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { PPAP_ELEMENTS, PPAP_SUBMISSIONS } from "@/lib/kraya/data";
import { daysFromToday, shortDate } from "@/lib/kraya/format";
import { ppapElements, ppapSummary, programById, programLabel, readiness, sourceName } from "@/lib/kraya/selectors";
import type { PpapElementStatus, PpapSubmission } from "@/lib/kraya/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "blocking", label: "Blocking SOP" },
  { id: "overdue", label: "Overdue" },
  { id: "review", label: "Awaiting SQE review" },
  { id: "approved", label: "Approved" },
];

const ELEMENT_VIEW: Record<PpapElementStatus, { label: string; tone: StatusTone; icon: LucideIcon | null; cell: string }> = {
  approved: { label: "Approved", tone: "success", icon: Check, cell: "bg-success-surface text-success" },
  submitted: { label: "Submitted", tone: "info", icon: Dot, cell: "bg-info-surface text-info" },
  pending: { label: "Pending", tone: "neutral", icon: Minus, cell: "bg-raised text-quaternary" },
  overdue: { label: "Overdue", tone: "error", icon: TriangleAlert, cell: "bg-error-surface text-error" },
  na: { label: "Not required", tone: "neutral", icon: null, cell: "text-quaternary" },
};

const PROGRAM_IDS = Array.from(new Set(PPAP_SUBMISSIONS.map((p) => p.programId)));

export default function PpapPage() {
  const { status, setPpapElement, setMany } = useKraya();
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [programId, setProgramId] = useState("all");
  const [selectedId, select] = useSelection("ppap");
  const pipeline = usePipeline();
  const [chasing, setChasing] = useState<number | null>(null);

  const summary = (sub: PpapSubmission) => ppapSummary(status, sub);

  const matches = (sub: PpapSubmission, id: string) => {
    const s = ppapSummary(status, sub);
    switch (id) {
      case "blocking":
        return sub.blocksSop && !s.pswSigned;
      case "overdue":
        return s.overdue > 0;
      case "review":
        return s.submitted > 0;
      case "approved":
        return s.pswSigned;
      default:
        return true;
    }
  };

  const scoped = programId === "all" ? PPAP_SUBMISSIONS : PPAP_SUBMISSIONS.filter((p) => p.programId === programId);
  const rows = scoped.filter((p) => matches(p, filter));

  const signed = PPAP_SUBMISSIONS.filter((p) => summary(p).pswSigned).length;
  const overdue = PPAP_SUBMISSIONS.reduce((sum, p) => sum + summary(p).overdue, 0);
  const blocking = PPAP_SUBMISSIONS.filter((p) => p.blocksSop && !summary(p).pswSigned).length;
  const avgPct = Math.round(PPAP_SUBMISSIONS.reduce((sum, p) => sum + summary(p).pct, 0) / PPAP_SUBMISSIONS.length);

  const selected = PPAP_SUBMISSIONS.find((p) => p.id === selectedId) ?? null;

  function approve(sub: PpapSubmission, index: number) {
    setPpapElement(sub.id, index, "approved");
    toast(`${sub.id}: ${PPAP_ELEMENTS[index]} approved by ${sub.sqe}.`);
  }

  function approveAll(sub: PpapSubmission) {
    const elements = ppapElements(status, sub);
    const entries: Record<string, string> = {};
    elements.forEach((state, index) => {
      if (state === "submitted" && index !== 17) entries[`ppap:${sub.id}:${index}`] = "approved";
    });
    const count = Object.keys(entries).length;
    if (!count) return;
    setMany(entries);
    toast(`${sub.id}: ${count} submitted element${count > 1 ? "s" : ""} approved by ${sub.sqe}.`);
  }

  function chase(sub: PpapSubmission, index: number) {
    const wasOverdue = ppapElements(status, sub)[index] === "overdue";
    const lastOverdue = wasOverdue && ppapSummary(status, sub).overdue === 1;
    setChasing(index);
    pipeline.start(
      [`Send a dated request to ${sourceName(sub.supplierId)} for "${PPAP_ELEMENTS[index]}"`, "Supplier uploads the document to the PPAP portal", "Check revision level and signatures", `Queue for ${sub.sqe} to review`],
      () => {
        setChasing(null);
        setPpapElement(sub.id, index, "submitted");
        if (lastOverdue && sub.blocksSop) toast(`${sub.id} has no overdue elements left. The dashboard exception queue and ${programLabel(sub.programId)} readiness were updated.`);
        else toast(`${sub.id}: ${PPAP_ELEMENTS[index]} received and queued for ${sub.sqe}.`, "info");
      },
    );
  }

  function signPsw(sub: PpapSubmission) {
    setPpapElement(sub.id, 17, "approved");
    toast(`Part submission warrant signed on ${sub.id} by ${sub.sqe}. ${sub.blocksSop ? "This part no longer blocks SOP." : "Recorded in the QMS."}`);
  }

  return (
    <>
      <PageHeader
        title="APQP / PPAP Tracker"
        description="The 18 PPAP elements for every part and supplier: what is approved, what is late, and which warrants stand between a program and SOP."
        mark={<KMark id="mark-ppap" size={44} />}
        actions={
          <Select aria-label="Program" value={programId} onChange={(event) => setProgramId(event.target.value)} className="h-8 rounded-full border border-muted bg-action text-label-sm text-secondary">
            <option value="all">All programs</option>
            {PROGRAM_IDS.map((id) => (
              <option key={id} value={id}>
                {programLabel(id)}
              </option>
            ))}
          </Select>
        }
      >
        <FilterChips options={FILTERS.map((f) => ({ ...f, count: scoped.filter((p) => matches(p, f.id)).length }))} value={filter} onChange={setFilter} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid cols={5}>
            <KpiTile label="Submissions" value={String(PPAP_SUBMISSIONS.length)} hint={`${PROGRAM_IDS.length} programs`} mark={<KMark id="mark-ppap" />} />
            <KpiTile label="Warrants signed" value={`${signed} / ${PPAP_SUBMISSIONS.length}`} hint="PSW approved by the SQE" tone="success" />
            <KpiTile label="Elements overdue" value={String(overdue)} hint="past the submission due date" tone={overdue ? "error" : "success"} delta={overdue ? "chase supplier" : "none"} />
            <KpiLink href="/readiness">
              <KpiTile label="Blocking SOP" value={String(blocking)} hint="warrant open on a gating part" tone={blocking ? "warning" : "success"} />
            </KpiLink>
            <KpiTile label="Average completion" value={`${avgPct}%`} hint="approved of required elements" />
          </KpiGrid>

          <Panel
            title={`Element matrix · ${rows.length} submissions`}
            padded={false}
            action={
              <ul className="hidden items-center gap-3 md:flex">
                {(["approved", "submitted", "pending", "overdue"] as const).map((state) => {
                  const view = ELEMENT_VIEW[state];
                  const Icon = view.icon;
                  return (
                    <li key={state} className="flex items-center gap-1 text-caption text-tertiary">
                      <span className={`flex size-4 items-center justify-center rounded-[4px] ${view.cell}`}>{Icon ? <Icon size={11} strokeWidth={2} aria-hidden /> : null}</span>
                      {view.label}
                    </li>
                  );
                })}
              </ul>
            }
          >
            {rows.length === 0 ? (
              <EmptyState title="No submissions match" detail="Pick another filter or program." mark={<KMark id="mark-empty" size={44} />} />
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[1040px] border-collapse text-left text-body-sm">
                  <thead>
                    <tr className="border-b border-muted">
                      {["Submission", "Part", "Supplier", "Program", "Lvl", "Due"].map((heading) => (
                        <th key={heading} className="px-3 py-2 text-caption font-medium tracking-[0.08em] whitespace-nowrap text-quaternary uppercase">
                          {heading}
                        </th>
                      ))}
                      {PPAP_ELEMENTS.map((name, index) => (
                        <th key={name} title={`${index + 1}. ${name}`} className="w-6 px-0.5 py-2 text-center text-caption font-medium tabular text-quaternary">
                          {index + 1}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-right text-caption font-medium tracking-[0.08em] text-quaternary uppercase">Done</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rows.map((sub) => {
                      const elements = ppapElements(status, sub);
                      const s = summary(sub);
                      const late = daysFromToday(sub.due) < 0 && !s.pswSigned;
                      return (
                        <tr
                          key={sub.id}
                          tabIndex={0}
                          onClick={() => select(sub.id)}
                          onKeyDown={(event) => {
                            if (event.key === "Enter" || event.key === " ") {
                              event.preventDefault();
                              select(sub.id);
                            }
                          }}
                          className={`cursor-pointer border-b border-muted outline-none transition-colors duration-[150ms] last:border-b-0 hover:bg-raised focus-visible:bg-raised ${sub.id === selectedId ? "bg-raised" : ""}`}
                        >
                          <td className="px-3 py-2 whitespace-nowrap">
                            <span className="tabular text-primary">{sub.id}</span>
                            {sub.blocksSop && !s.pswSigned ? <span className="ml-2 text-caption text-warning">blocks SOP</span> : null}
                          </td>
                          <td className="max-w-[170px] px-3 py-2">
                            <span className="block truncate text-secondary" title={sub.description}>
                              {sub.description}
                            </span>
                            <span className="block tabular text-caption text-quaternary">{sub.pn}</span>
                          </td>
                          <td className="max-w-[150px] truncate px-3 py-2">
                            <RecordLink href={`/suppliers/${sub.supplierId}`}>{sourceName(sub.supplierId)}</RecordLink>
                          </td>
                          <td className="max-w-[150px] truncate px-3 py-2">
                            <RecordLink href={`/programs/${sub.programId}`}>{programLabel(sub.programId)}</RecordLink>
                          </td>
                          <td className="px-3 py-2 tabular text-secondary">{sub.level}</td>
                          <td className={`px-3 py-2 tabular whitespace-nowrap ${late ? "text-error" : "text-secondary"}`}>{shortDate(sub.due)}</td>
                          {elements.map((state, index) => {
                            const view = ELEMENT_VIEW[state];
                            const Icon = view.icon;
                            return (
                              <td key={index} className="px-0.5 py-2 text-center">
                                <span title={`${index + 1}. ${PPAP_ELEMENTS[index]}: ${view.label}`} className={`mx-auto flex size-5 items-center justify-center rounded-[4px] ${view.cell}`}>
                                  {Icon ? <Icon size={12} strokeWidth={2} aria-label={view.label} /> : null}
                                </span>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2 text-right tabular whitespace-nowrap text-primary">{s.pswSigned ? "PSW signed" : `${s.pct}%`}</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </Panel>
          <p className="text-caption text-quaternary">Columns 1 to 18 follow the AIAG element order; hover a number for the element name. Select a row to review and approve.</p>
        </Stack>
      </PageBody>

      {selected ? (
        <PpapDrawer
          sub={selected}
          onClose={() => select(null)}
          onApprove={(index) => approve(selected, index)}
          onApproveAll={() => approveAll(selected)}
          onChase={(index) => chase(selected, index)}
          onSign={() => signPsw(selected)}
          pipeline={pipeline}
          chasing={chasing}
        />
      ) : null}
    </>
  );
}

function PpapDrawer({
  sub,
  onClose,
  onApprove,
  onApproveAll,
  onChase,
  onSign,
  pipeline,
  chasing,
}: {
  sub: PpapSubmission;
  onClose: () => void;
  onApprove: (index: number) => void;
  onApproveAll: () => void;
  onChase: (index: number) => void;
  onSign: () => void;
  pipeline: ReturnType<typeof usePipeline>;
  chasing: number | null;
}) {
  const { status } = useKraya();
  const elements = ppapElements(status, sub);
  const s = ppapSummary(status, sub);
  const program = programById(sub.programId);
  const ready = program ? readiness(status, program) : null;
  const base = program ? readiness({}, program) : null;
  const openBeforePsw = elements.slice(0, 17).filter((e) => e !== "approved" && e !== "na").length;
  const countBefore = (state: PpapElementStatus) => elements.slice(0, 17).filter((e) => e === state).length;
  const submittedCount = elements.filter((e, index) => e === "submitted" && index !== 17).length;

  return (
    <Drawer
      open
      wide
      onClose={onClose}
      title={sub.id}
      subtitle={`${sub.description} · ${sub.pn}`}
      badge={
        <>
          <StatusBadge tone={s.pswSigned ? "success" : s.overdue ? "error" : "info"}>{s.pswSigned ? "PSW signed" : s.overdue ? `${s.overdue} overdue` : "In progress"}</StatusBadge>
          {sub.blocksSop && !s.pswSigned ? <StatusBadge tone="warning">Blocks SOP</StatusBadge> : null}
        </>
      }
      footer={
        <>
          <Btn variant="primary" icon={PenLine} disabled={!s.readyForPsw || s.pswSigned} onClick={onSign}>
            {s.pswSigned ? "PSW signed" : "Sign PSW"}
          </Btn>
          <Btn icon={BadgeCheck} disabled={submittedCount === 0} onClick={onApproveAll}>
            Approve all submitted{submittedCount ? ` (${submittedCount})` : ""}
          </Btn>
          <span className="ml-auto">
            <SignOff name={sub.sqe} note="supplier quality engineer" />
          </span>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Field label="Supplier">
          <RecordLink href={`/suppliers/${sub.supplierId}`}>{sourceName(sub.supplierId)}</RecordLink>
        </Field>
        <Field label="Program">
          <RecordLink href={`/programs/${sub.programId}`}>{programLabel(sub.programId)}</RecordLink>
        </Field>
        <Field label="Submission level">Level {sub.level}</Field>
        <Field label="Due">
          <span className={daysFromToday(sub.due) < 0 && !s.pswSigned ? "text-error" : ""}>
            {shortDate(sub.due)} · {daysFromToday(sub.due) < 0 ? `${Math.abs(daysFromToday(sub.due))}d past` : `in ${daysFromToday(sub.due)}d`}
          </span>
        </Field>
      </div>

      <Callout label="SQE note">{sub.note}</Callout>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <Label>Completion</Label>
          <span className="text-body-sm tabular text-primary">
            {s.approved} of {s.required} approved · {s.pct}%
          </span>
        </div>
        <Meter value={s.pct} tone={s.pct >= 90 ? "success" : s.overdue ? "warning" : "info"} className="mt-1.5" />
        {ready && base ? (
          <p className="mt-2 text-caption text-quaternary">
            {programLabel(sub.programId)}: quality readiness <span className="tabular text-secondary">{ready.quality}</span>
            {ready.quality !== base.quality ? <span className="text-success"> (was {base.quality})</span> : null} · ATP confidence{" "}
            <span className="tabular text-secondary">{ready.confidence}%</span>
            {ready.confidence !== base.confidence ? <span className="text-success"> (was {base.confidence}%)</span> : null}
          </p>
        ) : null}
      </div>

      <PipelineSteps run={pipeline.run} />

      <div>
        <Label>The 18 elements</Label>
        <ul className="mt-1.5 flex flex-col">
          {PPAP_ELEMENTS.map((name, index) => {
            const state = elements[index];
            const view = ELEMENT_VIEW[state];
            const isPsw = index === 17;
            return (
              <li key={name} className="flex min-h-10 items-center gap-2.5 border-b border-muted py-1.5 last:border-b-0">
                <span className="w-5 shrink-0 text-right text-caption tabular text-quaternary">{index + 1}</span>
                <span className={`min-w-0 flex-1 truncate text-body-sm ${state === "na" ? "text-quaternary" : "text-secondary"}`} title={name}>
                  {name}
                </span>
                <StatusBadge tone={view.tone}>{view.label}</StatusBadge>
                <span className="flex w-[124px] shrink-0 justify-end">
                  {isPsw ? (
                    state === "approved" ? null : (
                      <Btn icon={PenLine} disabled={!s.readyForPsw} onClick={onSign} title={s.readyForPsw ? "Sign the warrant" : `${openBeforePsw} elements still open`}>
                        Sign PSW
                      </Btn>
                    )
                  ) : state === "submitted" ? (
                    <Btn icon={Check} variant="primary" onClick={() => onApprove(index)}>
                      Approve
                    </Btn>
                  ) : state === "overdue" || state === "pending" ? (
                    <Btn icon={Send} disabled={pipeline.running} onClick={() => onChase(index)}>
                      {chasing === index ? "Chasing" : "Chase supplier"}
                    </Btn>
                  ) : null}
                </span>
              </li>
            );
          })}
        </ul>
      </div>

      {!s.pswSigned ? (
        <Callout tone={s.readyForPsw ? "success" : "neutral"} label="Warrant">
          {s.readyForPsw
            ? `Elements 1 to 17 are approved or not required. ${sub.sqe} can sign the part submission warrant.`
            : `The warrant cannot be signed yet: ${openBeforePsw} element${openBeforePsw > 1 ? "s are" : " is"} still open (${countBefore("overdue")} overdue, ${countBefore("pending")} pending, ${countBefore("submitted")} awaiting review).`}
        </Callout>
      ) : null}
    </Drawer>
  );
}
