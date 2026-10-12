"use client";

/**
 * Contracts.
 *
 * Extracted clauses, the protections that are missing or weak, and the
 * renewal calendar. Contract flags always end with a human signature.
 */

import { FilePen, Handshake, MailWarning } from "lucide-react";
import { useMemo, useState } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Btn, Callout, Drawer, Field, KMark, KpiGrid, Label, PipelineSteps, RecordLink, SignOff, Stack, usePipeline, useSelection } from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { CONTRACTS } from "@/lib/kraya/data";
import { addDays, daysFromToday, fullDate, inrCr, PLAN_MONTHS, relativeDays, shortDate } from "@/lib/kraya/format";
import { sourceHref, sourceName, type Status } from "@/lib/kraya/selectors";
import type { ClauseStatus, Contract } from "@/lib/kraya/types";

const CLAUSE_TONE: Record<ClauseStatus, StatusTone> = { present: "success", weak: "warning", missing: "error" };

const FILTERS = [
  { id: "all", label: "All" },
  { id: "renewing", label: "Ending in 90 days" },
  { id: "gaps", label: "Clause gaps" },
  { id: "auto", label: "Auto-renew" },
  { id: "clean", label: "Fully covered" },
];

const noticeDeadline = (c: Contract) => addDays(c.end, -c.renewalNoticeDays);
const gapsOf = (c: Contract) => c.clauses.filter((clause) => clause.status !== "present");
const drafted = (s: Status, c: Contract, clauseId: string) => s[`ctr:${c.id}:${clauseId}`] === "drafted";

/** Month slot on the Oct 2026 to Sep 2027 strip, or -1 when later. */
function monthSlot(iso: string): number {
  const [y, m] = iso.split("-").map(Number);
  const slot = (y - 2026) * 12 + (m - 10);
  return slot >= 0 && slot < 12 ? slot : -1;
}

function matches(c: Contract, filter: string) {
  switch (filter) {
    case "renewing":
      return daysFromToday(c.end) <= 90;
    case "gaps":
      return gapsOf(c).length > 0;
    case "auto":
      return c.autoRenew;
    case "clean":
      return gapsOf(c).length === 0;
    default:
      return true;
  }
}

export default function ContractsPage() {
  const { status, get, set, clear } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const [selectedId, select] = useSelection("contract");
  const [filter, setFilter] = useState("all");

  const rows = useMemo(() => CONTRACTS.filter((c) => matches(c, filter)).sort((a, b) => a.end.localeCompare(b.end)), [filter]);
  const counts = useMemo(() => Object.fromEntries(FILTERS.map((f) => [f.id, CONTRACTS.filter((c) => matches(c, f.id)).length])) as Record<string, number>, []);

  const totalCr = CONTRACTS.reduce((sum, c) => sum + c.valueCr, 0);
  const ending = CONTRACTS.filter((c) => daysFromToday(c.end) <= 90);
  const allClauses = CONTRACTS.flatMap((c) => c.clauses.map((clause) => ({ c, clause })));
  const missing = allClauses.filter((x) => x.clause.status === "missing");
  const weak = allClauses.filter((x) => x.clause.status === "weak");
  const draftedCount = allClauses.filter((x) => x.clause.status !== "present" && drafted(status, x.c, x.clause.id)).length;

  const byMonth = useMemo(() => {
    const slots: Contract[][] = Array.from({ length: 12 }, () => []);
    for (const c of CONTRACTS) {
      const slot = monthSlot(c.end);
      if (slot >= 0) slots[slot].push(c);
    }
    return slots;
  }, []);
  const later = CONTRACTS.filter((c) => monthSlot(c.end) < 0);

  const selected = CONTRACTS.find((c) => c.id === selectedId) ?? null;
  const noticeServed = selected ? get(`ctr:${selected.id}:notice`) === "served" : false;
  const renewalStarted = selected ? get(`ctr:${selected.id}:renewal`) === "started" : false;

  function draft(contract: Contract, clauseId: string, clauseName: string) {
    pipeline.start(
      [`Pull the standard "${clauseName}" wording from the Auralis template`, `Adapt to ${contract.title}`, "Route the draft to legal for review"],
      () => {
        set(`ctr:${contract.id}:${clauseId}`, "drafted");
        toast(`Amendment for "${clauseName}" drafted on ${contract.id}. Legal reviews, then ${contract.owner} signs before it goes to the supplier.`);
      },
    );
  }

  const columns: Column<Contract>[] = [
    { key: "id", header: "Contract", width: "w-28", value: (c) => c.id, render: (c) => <span className="tabular whitespace-nowrap text-primary">{c.id}</span> },
    { key: "title", header: "Title", card: "title", value: (c) => c.title, render: (c) => <span className="text-primary">{c.title}</span> },
    { key: "party", header: "Counterparty", hide: "lg", value: (c) => sourceName(c.supplierId), render: (c) => <RecordLink href={sourceHref(c.supplierId)} className="text-body-sm">{sourceName(c.supplierId)}</RecordLink> },
    { key: "type", header: "Type", hide: "md", value: (c) => c.type, render: (c) => <span className="whitespace-nowrap">{c.type}</span> },
    { key: "value", header: "Value", align: "right", value: (c) => c.valueCr, render: (c) => <span className="tabular whitespace-nowrap text-primary">{inrCr(c.valueCr)}</span> },
    {
      key: "end", header: "Ends", align: "right", card: "metric", value: (c) => c.end,
      render: (c) => (
        <span className="tabular whitespace-nowrap">
          {fullDate(c.end)} <span className={daysFromToday(c.end) <= 90 ? "text-warning" : "text-quaternary"}>· {daysFromToday(c.end)}d</span>
        </span>
      ),
    },
    {
      key: "notice", header: "Notice deadline", align: "right", hide: "md", value: (c) => noticeDeadline(c),
      render: (c) => {
        const days = daysFromToday(noticeDeadline(c));
        return <span className={`tabular whitespace-nowrap ${days < 0 ? "text-error" : days <= 30 ? "text-warning" : ""}`}>{shortDate(noticeDeadline(c))} · {days < 0 ? `passed ${Math.abs(days)}d ago` : relativeDays(noticeDeadline(c))}</span>;
      },
    },
    { key: "auto", header: "Auto-renew", hide: "lg", value: (c) => (c.autoRenew ? "yes" : "no"), render: (c) => (c.autoRenew ? <StatusBadge tone="warning">auto-renews</StatusBadge> : <span className="text-quaternary">no</span>) },
    {
      key: "health", header: "Clause health", value: (c) => c.clauses.length - gapsOf(c).length,
      render: (c) => {
        const gaps = gapsOf(c);
        const inProgress = gaps.filter((clause) => drafted(status, c, clause.id)).length;
        return (
          <span className="flex min-w-0 flex-col gap-1">
            <span className="tabular whitespace-nowrap text-secondary">{c.clauses.length - gaps.length} of {c.clauses.length} covered{inProgress ? ` · ${inProgress} in amendment` : ""}</span>
            <span className="flex flex-wrap gap-1">
              {gaps.filter((clause) => clause.status === "missing").slice(0, 2).map((clause) => (
                <StatusBadge key={clause.id} tone={drafted(status, c, clause.id) ? "info" : "error"}>{clause.name}</StatusBadge>
              ))}
              {gaps.filter((clause) => clause.status === "missing").length > 2 ? <StatusBadge tone="error">+{gaps.filter((clause) => clause.status === "missing").length - 2}</StatusBadge> : null}
            </span>
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="Contracts"
        description="Supply, tooling and manufacturing agreements with their clauses extracted. Missing protections are flagged before the renewal notice window closes."
        mark={<KMark id="mark-contract" size={44} />}
      >
        <FilterChips options={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} value={filter} onChange={setFilter} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid cols={5}>
            <KpiTile label="Active contracts" value={String(CONTRACTS.length)} hint="supply, tooling, EMS" mark={<KMark id="mark-contract" />} />
            <KpiTile label="Value under contract" value={inrCr(totalCr)} hint="term value" />
            <KpiTile label="Ending in 90 days" value={String(ending.length)} delta={`${ending.filter((c) => c.autoRenew).length} auto-renew`} tone="warning" />
            <KpiTile label="Missing clauses" value={String(missing.length)} delta={draftedCount ? `${draftedCount} amendments drafted` : "none drafted yet"} tone="error" />
            <KpiTile label="Weak clauses" value={String(weak.length)} hint="renegotiate at renewal" tone="warning" />
          </KpiGrid>

          <Panel title="Renewal calendar: what ends when" action={<span className="text-caption text-quaternary">Oct 2026 to Sep 2027 · click a contract</span>}>
            <div className="overflow-x-auto">
              <div className="grid min-w-[960px] grid-cols-12 gap-1.5">
                {PLAN_MONTHS.map((month, index) => (
                  <div key={`${month}-${index}`} className="flex min-w-0 flex-col gap-1.5">
                    <p className={`rounded-md px-2 py-1 text-caption tracking-[0.08em] uppercase ${index <= 2 ? "bg-warning-surface text-warning" : "bg-raised text-quaternary"}`}>
                      {month} <span className="tabular">{index < 3 ? "26" : "27"}</span>
                    </p>
                    {byMonth[index].map((c) => {
                      const deadline = daysFromToday(noticeDeadline(c));
                      return (
                        <button
                          key={c.id}
                          type="button"
                          onClick={() => select(c.id)}
                          aria-pressed={selectedId === c.id}
                          className={`flex min-w-0 flex-col gap-0.5 rounded-md border px-2 py-1.5 text-left outline-none transition-colors duration-[150ms] focus-visible:ring-2 focus-visible:ring-active ${selectedId === c.id ? "border-default bg-raised" : "border-muted bg-page hover:border-default hover:bg-raised"}`}
                        >
                          <span className="truncate text-caption text-primary">{sourceName(c.supplierId)}</span>
                          <span className="truncate text-caption tabular text-quaternary">ends {shortDate(c.end)}</span>
                          <span className={`truncate text-caption tabular ${deadline < 0 ? "text-error" : deadline <= 30 ? "text-warning" : "text-quaternary"}`}>notice {shortDate(noticeDeadline(c))}</span>
                          {c.autoRenew ? <span className="text-caption text-warning">auto-renews</span> : null}
                        </button>
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            <p className="mt-3 text-caption text-quaternary">
              Ending after September 2027:{" "}
              {later.map((c, index) => (
                <span key={c.id}>
                  <button type="button" onClick={() => select(c.id)} className="text-tertiary underline underline-offset-2 outline-none hover:text-primary focus-visible:ring-2 focus-visible:ring-active">
                    {sourceName(c.supplierId)} ({fullDate(c.end)})
                  </button>
                  {index < later.length - 1 ? ", " : ""}
                </span>
              ))}
            </p>
          </Panel>

          <Panel title={`Contracts · ${rows.length}`} padded={false}>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(c) => c.id}
              onRowClick={(c) => select(c.id)}
              isRowSelected={(c) => c.id === selectedId}
              searchPlaceholder="Search contract, supplier or owner"
              getSearchText={(c) => `${c.owner} ${sourceName(c.supplierId)}`}
              exportName="kraya-contracts"
              emptyTitle="No contracts match this filter"
            />
          </Panel>
        </Stack>
      </PageBody>

      <Drawer
        wide
        open={Boolean(selected)}
        onClose={() => select(null)}
        title={selected?.id ?? ""}
        subtitle={selected ? `${selected.title} · ${selected.type}` : undefined}
        badge={
          selected ? (
            <>
              {selected.autoRenew && !noticeServed ? <StatusBadge tone="warning">auto-renews</StatusBadge> : null}
              {noticeServed ? <StatusBadge tone="info">non-renewal notice served</StatusBadge> : null}
              {renewalStarted ? <StatusBadge tone="info">renewal in negotiation</StatusBadge> : null}
            </>
          ) : undefined
        }
        footer={
          selected ? (
            <>
              {selected.autoRenew ? (
                <Btn
                  variant="primary"
                  icon={MailWarning}
                  disabled={pipeline.running}
                  onClick={() => {
                    if (noticeServed) {
                      clear(`ctr:${selected.id}:notice`);
                      toast(`Non-renewal notice on ${selected.id} withdrawn.`, "info");
                    } else {
                      set(`ctr:${selected.id}:notice`, "served");
                      toast(`Non-renewal notice prepared for ${selected.id}. ${selected.owner} signs it; it is not sent until then.`);
                    }
                  }}
                >
                  {noticeServed ? "Withdraw non-renewal notice" : "Serve non-renewal notice"}
                </Btn>
              ) : null}
              <Btn
                icon={Handshake}
                disabled={pipeline.running}
                onClick={() => {
                  if (renewalStarted) {
                    clear(`ctr:${selected.id}:renewal`);
                    toast(`Renewal negotiation on ${selected.id} stopped.`, "info");
                  } else {
                    set(`ctr:${selected.id}:renewal`, "started");
                    toast(`Renewal negotiation opened with ${sourceName(selected.supplierId)}. ${gapsOf(selected).length} clause gaps are on the agenda; ${selected.owner} leads.`);
                  }
                }}
              >
                {renewalStarted ? "Stop renewal negotiation" : "Start renewal negotiation"}
              </Btn>
            </>
          ) : null
        }
      >
        {selected ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Counterparty"><RecordLink href={sourceHref(selected.supplierId)} className="text-body-md">{sourceName(selected.supplierId)}</RecordLink></Field>
              <Field label="Term value"><span className="tabular">{inrCr(selected.valueCr)}</span></Field>
              <Field label="Owner">{selected.owner}</Field>
              <Field label="Start"><span className="tabular">{fullDate(selected.start)}</span></Field>
              <Field label="End"><span className="tabular">{fullDate(selected.end)} · {daysFromToday(selected.end)}d</span></Field>
              <Field label="Notice deadline">
                <span className={`tabular ${daysFromToday(noticeDeadline(selected)) < 0 ? "text-error" : daysFromToday(noticeDeadline(selected)) <= 30 ? "text-warning" : ""}`}>
                  {fullDate(noticeDeadline(selected))} · {selected.renewalNoticeDays}d notice
                </span>
              </Field>
            </div>

            {selected.autoRenew && !noticeServed ? (
              <Callout tone="warning" label="Auto-renewal">
                {daysFromToday(noticeDeadline(selected)) < 0
                  ? `The notice deadline passed ${Math.abs(daysFromToday(noticeDeadline(selected)))} days ago. Unless the supplier accepts late notice, this agreement renews on its current terms on ${fullDate(selected.end)}.`
                  : `This agreement renews on its current terms on ${fullDate(selected.end)} unless notice is served by ${fullDate(noticeDeadline(selected))}.`}
                {gapsOf(selected).length ? ` ${gapsOf(selected).length} clause gaps would carry over.` : ""}
              </Callout>
            ) : null}

            <PipelineSteps run={pipeline.run} />

            <div>
              <Label>Clause extraction · {selected.clauses.length - gapsOf(selected).length} of {selected.clauses.length} covered</Label>
              <ul className="mt-1.5 flex flex-col gap-2">
                {selected.clauses.map((clause) => {
                  const isDrafted = drafted(status, selected, clause.id);
                  return (
                    <li key={clause.id} className="rounded-md border border-muted px-3 py-2.5">
                      <div className="flex flex-wrap items-center justify-between gap-2">
                        <span className="text-body-md text-primary">{clause.name}</span>
                        <span className="flex items-center gap-1.5">
                          {isDrafted ? <StatusBadge tone="info">amendment drafted</StatusBadge> : null}
                          <StatusBadge tone={CLAUSE_TONE[clause.status]}>{clause.status}</StatusBadge>
                        </span>
                      </div>
                      <p className="mt-1 text-body-sm text-secondary">{clause.excerpt}</p>
                      {clause.status !== "present" ? (
                        <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
                          <span className="text-caption text-quaternary">{isDrafted ? "Amendment drafted, awaiting legal and supplier" : clause.risk}</span>
                          {isDrafted ? (
                            <Btn variant="ghost" disabled={pipeline.running} onClick={() => { clear(`ctr:${selected.id}:${clause.id}`); toast(`Draft amendment for "${clause.name}" discarded.`, "info"); }}>
                              Discard draft
                            </Btn>
                          ) : (
                            <Btn icon={FilePen} disabled={pipeline.running} onClick={() => draft(selected, clause.id, clause.name)}>
                              Draft amendment
                            </Btn>
                          )}
                        </div>
                      ) : null}
                    </li>
                  );
                })}
              </ul>
            </div>

            <SignOff name={selected.owner} note="contract risk flags and redlines always require human sign-off (policy P-02)" />
          </>
        ) : null}
      </Drawer>
    </>
  );
}
