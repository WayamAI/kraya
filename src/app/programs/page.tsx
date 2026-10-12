"use client";

/**
 * Program Tracker. Every program on one launch calendar, then as a table.
 * Answers: which launches are close, and which of those are not ready.
 */

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { KMark, KpiGrid, KpiLink, Meter, RiskBadge, scoreTone, Stack } from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, Select } from "@/components/ui/primitives";
import { useKraya } from "@/lib/kraya/context";
import { OEMS, PROGRAMS } from "@/lib/kraya/data";
import { compact, daysBetween, daysFromToday, fullDate, inrCr, rupees, shortDate, TODAY } from "@/lib/kraya/format";
import { emsById, gatesFor, oemName, programRisk, readiness, RISK_RANK, stageIndex, stageLabel } from "@/lib/kraya/selectors";
import type { Program } from "@/lib/kraya/types";

const FILTERS = [
  { id: "all", label: "All" },
  { id: "at-risk", label: "At risk" },
  { id: "pre-award", label: "Pre-award" },
  { id: "launch", label: "In launch" },
  { id: "production", label: "In production" },
];

const CAL_START = "2026-07-01";
const CAL_END = "2028-04-01";
const CAL_DAYS = daysBetween(CAL_START, CAL_END);
const QUARTERS = [
  { label: "Q2 FY27", date: "2026-07-01" },
  { label: "Q3 FY27", date: "2026-10-01" },
  { label: "Q4 FY27", date: "2027-01-01" },
  { label: "Q1 FY28", date: "2027-04-01" },
  { label: "Q2 FY28", date: "2027-07-01" },
  { label: "Q3 FY28", date: "2027-10-01" },
  { label: "Q4 FY28", date: "2028-01-01" },
];

const pos = (iso: string) => Math.max(0, Math.min(100, (daysBetween(CAL_START, iso) / CAL_DAYS) * 100));

const BAR_TONE = { critical: "bg-error-icon", high: "bg-warning-icon", medium: "bg-info-icon", low: "bg-success-icon" } as const;

export default function ProgramTrackerPage() {
  const router = useRouter();
  const { status } = useKraya();
  const [filter, setFilter] = useState("all");
  const [oem, setOem] = useState("all");

  const matches = (p: Program, id: string) => {
    const index = stageIndex(p.stage);
    switch (id) {
      case "at-risk":
        return RISK_RANK[programRisk(status, p)] <= 1;
      case "pre-award":
        return index < 3;
      case "launch":
        return index >= 3 && index < 8;
      case "production":
        return index === 8;
      default:
        return true;
    }
  };

  const byOem = useMemo(() => (oem === "all" ? PROGRAMS : PROGRAMS.filter((p) => p.oemId === oem)), [oem]);
  const rows = byOem.filter((p) => matches(p, filter));
  const calendarRows = [...rows].sort((a, b) => a.sopDate.localeCompare(b.sopDate));

  const launches = PROGRAMS.filter((p) => stageIndex(p.stage) >= 3 && stageIndex(p.stage) < 8);
  const next = [...launches].sort((a, b) => a.sopDate.localeCompare(b.sopDate))[0];
  const annual = PROGRAMS.filter((p) => stageIndex(p.stage) >= 3).reduce((sum, p) => sum + (p.annualVolume * p.unitPrice) / 1e7, 0);
  const within180 = launches.filter((p) => daysFromToday(p.sopDate) <= 180).length;

  const columns: Column<Program>[] = [
    { key: "id", header: "Program", card: "title", value: (p) => p.id, render: (p) => <span className="tabular whitespace-nowrap text-primary">{p.id}</span> },
    { key: "name", header: "Name", value: (p) => p.name, render: (p) => <span className="block max-w-[220px] truncate" title={p.name}>{p.name}</span> },
    { key: "oem", header: "OEM", hide: "md", value: (p) => oemName(p.id), render: (p) => <span className="whitespace-nowrap">{oemName(p.id)}</span> },
    { key: "code", header: "Product code", hide: "lg", value: (p) => p.productCode, render: (p) => <span className="tabular whitespace-nowrap">{p.productCode}</span> },
    { key: "stage", header: "Stage", value: (p) => stageIndex(p.stage), render: (p) => <span className="whitespace-nowrap">{stageLabel(p.stage)}</span> },
    { key: "risk", header: "Risk", value: (p) => programRisk(status, p), render: (p) => <RiskBadge risk={programRisk(status, p)} /> },
    {
      key: "atp", header: "ATP confidence", value: (p) => readiness(status, p)?.confidence ?? null,
      render: (p) => {
        const r = readiness(status, p);
        if (!r) return <span className="text-quaternary">pre-award</span>;
        return (
          <span className="flex w-28 items-center gap-2">
            <Meter value={r.confidence} tone={scoreTone(r.confidence)} />
            <span className="shrink-0 tabular text-primary">{r.confidence.toFixed(0)}%</span>
          </span>
        );
      },
    },
    { key: "volume", header: "Volume / yr", align: "right", hide: "lg", value: (p) => p.annualVolume, render: (p) => <span className="tabular">{compact(p.annualVolume)}</span> },
    { key: "price", header: "Unit price", align: "right", hide: "lg", value: (p) => p.unitPrice, render: (p) => <span className="tabular">{rupees(p.unitPrice)}</span> },
    { key: "value", header: "Lifetime", align: "right", card: "metric", value: (p) => p.lifetimeValueCr, render: (p) => <span className="tabular text-primary">{inrCr(p.lifetimeValueCr)}</span> },
    { key: "ems", header: "EMS partner", hide: "lg", value: (p) => emsById(p.emsId)?.name ?? "", render: (p) => <span className="block max-w-[160px] truncate">{emsById(p.emsId)?.name ?? "not allocated"}</span> },
    { key: "sop", header: "SOP", align: "right", value: (p) => p.sopDate, render: (p) => <span className="tabular whitespace-nowrap">{fullDate(p.sopDate)}</span> },
    { key: "pm", header: "Program manager", hide: "md", value: (p) => p.pm, render: (p) => <span className="whitespace-nowrap">{p.pm}</span> },
  ];

  return (
    <>
      <PageHeader
        title="Program Tracker"
        description="Twelve programs from enquiry to start of production. The calendar shows how much runway each launch has; the bar colour is its current risk."
        mark={<KMark id="mark-program" size={44} />}
        actions={
          <Select value={oem} onChange={(event) => setOem(event.target.value)} aria-label="OEM" className="h-8 rounded-full border border-muted bg-action text-label-sm text-secondary">
            <option value="all">All OEMs</option>
            {OEMS.map((o) => (
              <option key={o.id} value={o.id}>{o.name}</option>
            ))}
          </Select>
        }
      >
        <FilterChips options={FILTERS.map((f) => ({ ...f, count: byOem.filter((p) => matches(p, f.id)).length }))} value={filter} onChange={setFilter} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiTile label="Programs in launch" value={String(launches.length)} hint="awarded, not yet at SOP" mark={<KMark id="mark-program" size={32} />} />
            <KpiLink href={next ? `/programs/${next.id}` : "/programs"}>
              <KpiTile label="Next SOP" value={next ? `${daysFromToday(next.sopDate)}d` : "—"} hint={next ? `${next.name}, ${shortDate(next.sopDate)}` : undefined} tone="warning" delta="countdown" mark={<KMark id="mark-stage-sop" size={32} />} />
            </KpiLink>
            <KpiLink href="/readiness">
              <KpiTile label="SOP within 180 days" value={String(within180)} hint="need PPAP and material now" mark={<KMark id="mark-readiness" size={32} />} />
            </KpiLink>
            <KpiTile label="Awarded revenue / yr" value={inrCr(annual)} hint="at plan volume" mark={<KMark id="mark-stage-award" size={32} />} />
          </KpiGrid>

          <Panel title="Launch calendar: how much runway does each program have" padded={false}>
            <div className="overflow-x-auto">
              <div className="min-w-[720px] px-4 py-3">
                <div className="flex items-end gap-3">
                  <div className="w-44 shrink-0" />
                  <div className="relative h-5 min-w-0 flex-1">
                    {QUARTERS.map((q) => (
                      <span key={q.label} className="absolute top-0 text-caption whitespace-nowrap text-quaternary" style={{ left: `${pos(q.date)}%` }}>
                        {q.label}
                      </span>
                    ))}
                  </div>
                </div>
                <ul className="mt-1 flex flex-col">
                  {calendarRows.map((p) => {
                    const gates = gatesFor(p);
                    const start = gates[Math.min(stageIndex(p.stage), 8)].date;
                    const risk = programRisk(status, p);
                    const left = pos(start < CAL_START ? CAL_START : start);
                    const right = pos(p.sopDate);
                    return (
                      <li key={p.id}>
                        <Link href={`/programs/${p.id}`} className="group flex items-center gap-3 rounded-md py-1.5 outline-none transition-colors duration-[150ms] hover:bg-raised focus-visible:bg-raised">
                          <span className="w-44 shrink-0 truncate pl-1 text-body-sm text-secondary group-hover:text-primary" title={p.name}>{p.name}</span>
                          <span className="relative h-5 min-w-0 flex-1">
                            {QUARTERS.map((q) => (
                              <span key={q.label} aria-hidden className="absolute top-0 h-full w-px bg-muted" style={{ left: `${pos(q.date)}%` }} />
                            ))}
                            <span aria-hidden className="absolute top-0 h-full w-px bg-brand" style={{ left: `${pos(TODAY)}%` }} />
                            {right > left ? (
                              <span aria-hidden className={`absolute top-1.5 h-2 rounded-full opacity-70 ${BAR_TONE[risk]}`} style={{ left: `${left}%`, width: `${right - left}%` }} />
                            ) : null}
                            <span
                              className={`absolute top-0.5 size-4 -translate-x-1/2 rounded-full border-2 border-container ${BAR_TONE[risk]}`}
                              style={{ left: `${right}%` }}
                              title={`SOP ${fullDate(p.sopDate)} · ${risk} risk`}
                            />
                          </span>
                          <span className="w-24 shrink-0 text-right text-caption tabular whitespace-nowrap text-tertiary">
                            {daysFromToday(p.sopDate) >= 0 ? `SOP in ${daysFromToday(p.sopDate)}d` : "in production"}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-2 text-caption text-quaternary">
                  Bar runs from the current gate to SOP. The orange line is today, {fullDate(TODAY)}. Risk is shown by the badge in the table below as well as by colour.
                </p>
              </div>
            </div>
          </Panel>

          <Panel title={`Programs · ${rows.length}`} padded={false}>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(p) => p.id}
              onRowClick={(p) => router.push(`/programs/${p.id}`)}
              exportName="kraya-program-tracker"
              searchPlaceholder="Search programs, OEMs, product codes"
              defaultSort={{ key: "sop", dir: "asc" }}
              emptyTitle="No programs match this filter"
              pageSize={12}
            />
          </Panel>
        </Stack>
      </PageBody>
    </>
  );
}
