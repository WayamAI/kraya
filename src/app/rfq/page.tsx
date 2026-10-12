"use client";

/**
 * RFQ Intake.
 *
 * Answers: which OEM packs have arrived, what do they actually ask for, what
 * is unclear, and is the pack ready to go to quoting.
 */

import { ArrowRight, FileText, ScanSearch, Send } from "lucide-react";
import { useState } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import {
  Btn,
  Callout,
  Confidence,
  Drawer,
  Field,
  KMark,
  KpiGrid,
  Label,
  LinkBtn,
  PipelineSteps,
  RecordLink,
  SignOff,
  Stack,
  usePipeline,
  useSelection,
} from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { RFQS } from "@/lib/kraya/data";
import { daysFromToday, fullDate, num, relativeDays, rupees, shortDate } from "@/lib/kraya/format";
import { oemById } from "@/lib/kraya/selectors";
import type { RfqGap, RfqPack, RfqRequirement, RfqStatus } from "@/lib/kraya/types";

const STATUS_TONE: Record<RfqStatus, StatusTone> = {
  New: "neutral",
  "AI Parsing": "info",
  "Parsed — Review Required": "warning",
  "Sent to Quoting": "success",
};

const STATUSES: RfqStatus[] = ["New", "AI Parsing", "Parsed — Review Required", "Sent to Quoting"];

const PARSE_STEPS = [
  "OCR and text layer check on every document",
  "Classify documents: commercial, technical, quality, drawing",
  "Extract requirements with source references",
  "Match to an Auralis product family",
  "List gaps to clarify with the OEM",
];

/* What the parser returns for the two packs that arrive unparsed. */
const PARSED_LATER: Record<string, { confidence: number; requirements: RfqRequirement[]; gaps: RfqGap[] }> = {
  "RFQ-2026-119": {
    confidence: 84,
    requirements: [
      { label: "Sensor", value: "60 GHz FMCW radar, 1T3R antenna in package", source: "Radar spec §3.1", confidence: 92 },
      { label: "Detection", value: "Child presence by breathing motion, within 10 s", source: "Radar spec §4.2", confidence: 88 },
      { label: "Interface", value: "CAN FD to body controller", source: "Radar spec §5", confidence: 95 },
      { label: "Mounting", value: "Headliner, behind fabric, IP5K2", source: "Radar spec §6.3", confidence: 81 },
      { label: "Regulatory", value: "WPC equipment type approval, 57 to 64 GHz band", source: "RFQ §7", confidence: 74 },
      { label: "Target price", value: "₹1,850 at 1,50,000 per year", source: "RFQ §4", confidence: 99 },
    ],
    gaps: [
      { id: "G1", question: "Is the specification a draft or released?", why: "The file name says draft and three sections are marked TBD. Quoting against a draft needs a change-order clause." },
      { id: "G2", question: "Who holds the type approval, Kestrel or Auralis?", why: "Approval testing is about ₹14L and 9 weeks; it is not in the cost template." },
    ],
  },
  "RFQ-2026-120": {
    confidence: 81,
    requirements: [
      { label: "Function", value: "Sub-GHz receiver for keyless entry, 433.92 MHz", source: "Archive file 2, §2", confidence: 90 },
      { label: "Immobiliser", value: "125 kHz LF transponder interface", source: "Archive file 2, §3", confidence: 86 },
      { label: "Quiescent current", value: "Under 80 µA with polling", source: "Archive file 3, §4.1", confidence: 83 },
      { label: "Sealing", value: "IP67, under-seat mounted", source: "Archive file 3, §6", confidence: 91 },
      { label: "Annual volume", value: "6,00,000 units", source: "Archive file 1, §2", confidence: 99 },
      { label: "Target price", value: "₹480", source: "Archive file 1, §4", confidence: 99 },
      { label: "PPAP", value: "Level 3", source: "Archive file 6", confidence: 94 },
    ],
    gaps: [
      { id: "G1", question: "Are key fobs in scope or receiver only?", why: "File 1 says receiver ECU; file 4 lists fob drop-test requirements." },
      { id: "G2", question: "Is the ₹480 target with or without the LF antenna coil?", why: "The coil is ₹34 and appears in only one of two BOM templates." },
      { id: "G3", question: "Confirm security algorithm ownership.", why: "A licensed rolling-code algorithm adds a per-unit royalty." },
    ],
  },
};

interface RfqView extends RfqPack {
  parsedInSession: boolean;
}

export default function RfqIntakePage() {
  const { status, get, set } = useKraya();
  const toast = useToast();
  const [filter, setFilter] = useState("all");
  const [selectedId, select] = useSelection("rfq");
  const { run, start, running } = usePipeline();
  const [parsingId, setParsingId] = useState<string | null>(null);

  const packs: RfqView[] = RFQS.map((pack) => {
    const effective = (status[`rfq:${pack.id}:status`] as RfqStatus | undefined) ?? pack.status;
    const later = PARSED_LATER[pack.id];
    const parsed = effective === "Parsed — Review Required" || effective === "Sent to Quoting";
    const useLater = Boolean(later) && parsed && pack.requirements.length === 0;
    return {
      ...pack,
      status: effective,
      matchConfidence: useLater ? later.confidence : pack.matchConfidence,
      requirements: useLater ? later.requirements : pack.requirements,
      gaps: useLater ? later.gaps : pack.gaps,
      parsedInSession: useLater,
    };
  });

  const rows = filter === "all" ? packs : packs.filter((p) => p.status === filter);
  const selected = packs.find((p) => p.id === selectedId) ?? null;

  const inIntake = packs.filter((p) => p.status !== "Sent to Quoting");
  const review = packs.filter((p) => p.status === "Parsed — Review Required");
  const parsed = packs.filter((p) => p.matchConfidence > 0);
  const avgConfidence = parsed.length ? Math.round(parsed.reduce((sum, p) => sum + p.matchConfidence, 0) / parsed.length) : 0;
  const dueSoon = inIntake.filter((p) => daysFromToday(p.due) <= 7);

  const gapState = (pack: RfqPack, gap: RfqGap) => get(`rfq:${pack.id}:gap:${gap.id}`, "open");
  const openGaps = (pack: RfqPack) => pack.gaps.filter((g) => gapState(pack, g) !== "resolved").length;

  function parse(pack: RfqView) {
    setParsingId(pack.id);
    set(`rfq:${pack.id}:status`, "AI Parsing");
    start(PARSE_STEPS, () => {
      set(`rfq:${pack.id}:status`, "Parsed — Review Required");
      setParsingId(null);
      toast(`${pack.id} parsed. Requirements and gaps are ready for review by ${pack.owner}.`);
    });
  }

  function sendToQuoting(pack: RfqView) {
    set(`rfq:${pack.id}:status`, "Sent to Quoting");
    toast(`${pack.id} sent to quoting with ${pack.requirements.length} requirements.`);
  }

  const columns: Column<RfqView>[] = [
    { key: "id", header: "Pack", card: "title", value: (p) => p.id, render: (p) => <span className="tabular whitespace-nowrap text-primary">{p.id}</span> },
    { key: "oem", header: "OEM", value: (p) => oemById(p.oemId)?.name ?? p.oemId, render: (p) => <span className="whitespace-nowrap">{oemById(p.oemId)?.name ?? p.oemId}</span> },
    { key: "product", header: "Product", value: (p) => p.product, render: (p) => <span className="block max-w-[260px] truncate">{p.product}</span> },
    { key: "received", header: "Received", hide: "lg", value: (p) => p.received, render: (p) => <span className="tabular whitespace-nowrap">{shortDate(p.received)}</span> },
    {
      key: "due", header: "Response due", value: (p) => p.due,
      render: (p) => (
        <span className={`tabular whitespace-nowrap ${p.status !== "Sent to Quoting" && daysFromToday(p.due) <= 3 ? "text-warning" : ""}`}>
          {shortDate(p.due)} <span className="text-quaternary">· {relativeDays(p.due)}</span>
        </span>
      ),
    },
    { key: "status", header: "Status", value: (p) => p.status, render: (p) => <StatusBadge tone={STATUS_TONE[p.status]}>{p.status}</StatusBadge> },
    {
      key: "confidence", header: "Match conf.", align: "right", value: (p) => p.matchConfidence,
      render: (p) => (p.matchConfidence > 0 ? <span className={`tabular ${p.matchConfidence < 80 ? "text-warning" : "text-primary"}`}>{p.matchConfidence}%</span> : <span className="text-quaternary">—</span>),
    },
    { key: "gaps", header: "Open gaps", align: "right", hide: "md", value: (p) => openGaps(p), render: (p) => <span className="tabular">{openGaps(p)}</span> },
    { key: "volume", header: "Volume / yr", align: "right", hide: "lg", value: (p) => p.annualVolume, render: (p) => <span className="tabular">{num(p.annualVolume)}</span> },
    { key: "target", header: "Target price", align: "right", card: "metric", value: (p) => p.targetPrice, render: (p) => <span className="tabular text-primary">{rupees(p.targetPrice)}</span> },
    { key: "owner", header: "Owner", hide: "lg", value: (p) => p.owner, render: (p) => <span className="whitespace-nowrap">{p.owner}</span> },
  ];

  const isParsing = selected ? running && parsingId === selected.id : false;
  const unparsed = selected ? selected.status === "New" || selected.status === "AI Parsing" : false;

  return (
    <>
      <PageHeader
        title="RFQ Intake"
        description="OEM enquiry packs as they arrive: what each one asks for, where the pack is unclear, and whether it is ready to quote."
        mark={<KMark id="mark-rfq-pack" size={44} />}
        actions={<LinkBtn href="/quoting" icon={ArrowRight}>Quoting workspace</LinkBtn>}
      >
        <FilterChips
          options={[{ id: "all", label: "All", count: packs.length }, ...STATUSES.map((s) => ({ id: s, label: s, count: packs.filter((p) => p.status === s).length }))]}
          value={filter}
          onChange={setFilter}
        />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiTile label="Packs in intake" value={String(inIntake.length)} hint="not yet with quoting" mark={<KMark id="mark-rfq-pack" />} />
            <KpiTile label="Awaiting review" value={String(review.length)} hint="parsed, gaps to check" tone="warning" delta={`${review.reduce((sum, p) => sum + openGaps(p), 0)} gaps`} />
            <KpiTile label="Avg match confidence" value={`${avgConfidence}%`} hint={`across ${parsed.length} parsed packs`} />
            <KpiTile label="Due within 7 days" value={String(dueSoon.length)} hint="OEM response dates" tone={dueSoon.length ? "error" : "neutral"} delta={dueSoon[0] ? `next ${shortDate(dueSoon.map((p) => p.due).sort()[0])}` : undefined} />
          </KpiGrid>

          <Panel title={`RFQ packs · ${rows.length}`} padded={false} action={<span className="text-caption text-quaternary">open a pack to review what was extracted</span>}>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(p) => p.id}
              onRowClick={(p) => select(p.id)}
              isRowSelected={(p) => p.id === selectedId}
              defaultSort={{ key: "due", dir: "asc" }}
              exportName="kraya-rfq-packs"
              searchPlaceholder="Search packs, OEMs, products"
              emptyTitle="No packs in this status"
              emptyDetail="Choose another status above."
            />
          </Panel>
        </Stack>
      </PageBody>

      <Drawer
        open={Boolean(selected)}
        onClose={() => select(null)}
        wide
        title={selected?.id ?? ""}
        badge={selected ? <StatusBadge tone={STATUS_TONE[selected.status]}>{selected.status}</StatusBadge> : null}
        subtitle={selected ? `${oemById(selected.oemId)?.name ?? ""} · ${selected.product}` : null}
        footer={
          selected ? (
            unparsed ? (
              <>
                <Btn variant="primary" icon={ScanSearch} disabled={running} onClick={() => parse(selected)}>
                  {selected.status === "AI Parsing" ? "Resume parse" : "Parse pack"}
                </Btn>
                <span className="text-caption text-quaternary">Nothing is sent to the OEM by parsing.</span>
              </>
            ) : selected.status === "Sent to Quoting" ? (
              <>
                <LinkBtn href="/quoting" variant="primary" icon={ArrowRight}>Open quoting</LinkBtn>
                <Btn onClick={() => { set(`rfq:${selected.id}:status`, "Parsed — Review Required"); toast(`${selected.id} pulled back to review.`, "info"); }}>Pull back to review</Btn>
              </>
            ) : (
              <>
                <Btn variant="primary" icon={ArrowRight} onClick={() => sendToQuoting(selected)}>Send to quoting</Btn>
                <Btn
                  icon={Send}
                  disabled={!selected.gaps.some((g) => gapState(selected, g) === "listed")}
                  onClick={() => toast(`${selected.gaps.filter((g) => gapState(selected, g) === "listed").length} clarification questions sent to ${oemById(selected.oemId)?.name ?? "the OEM"} buyer. Reply expected in 3 working days.`)}
                >
                  Send clarifications to OEM
                </Btn>
              </>
            )
          ) : null
        }
      >
        {selected ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
              <Field label="Received">{fullDate(selected.received)}</Field>
              <Field label="Response due"><span className="tabular">{fullDate(selected.due)}</span></Field>
              <Field label="Volume / yr"><span className="tabular">{num(selected.annualVolume)}</span></Field>
              <Field label="Target price"><span className="tabular">{rupees(selected.targetPrice)}</span></Field>
              <Field label="SOP target">{fullDate(selected.sopTarget)}</Field>
              <Field label="Owner">{selected.owner}</Field>
              <Field label="Program" className="col-span-2">
                {selected.programId ? <RecordLink href={`/programs/${selected.programId}`}>{selected.programId}</RecordLink> : "Not opened yet"}
              </Field>
            </div>

            {selected.matchConfidence > 0 ? (
              <div className="flex flex-wrap items-end justify-between gap-4">
                <Confidence value={selected.matchConfidence} label="Match confidence" />
                <SignOff name={selected.owner} note="reviews before the pack goes to quoting" />
              </div>
            ) : null}

            <div>
              <Label>Documents · {selected.documents.length}</Label>
              <ul className="mt-1.5 flex flex-col gap-1.5">
                {selected.documents.map((doc) => (
                  <li key={doc.name} className="flex min-w-0 items-center gap-2.5 rounded-md border border-muted bg-raised px-3 py-2">
                    <FileText size={14} strokeWidth={1.75} aria-hidden className="icon-tertiary shrink-0" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-body-sm text-primary">{doc.name}</span>
                      <span className="block truncate text-caption text-quaternary">{doc.kind}</span>
                    </span>
                    <span className="shrink-0 text-caption tabular text-quaternary">{doc.pages} {doc.pages === 1 ? "page" : "pages"}</span>
                    <StatusBadge tone={unparsed ? "neutral" : "success"}>{unparsed ? "queued" : "parsed"}</StatusBadge>
                  </li>
                ))}
              </ul>
            </div>

            {isParsing ? <PipelineSteps run={run} /> : null}

            {unparsed && !isParsing ? (
              <Callout label="Not parsed yet" tone="info">
                {selected.status === "AI Parsing"
                  ? "The parser stopped part-way through this pack. Resume to extract requirements and list the gaps."
                  : "This pack arrived today. Parse it to extract requirements, match it to a product family and list what needs clarifying."}
              </Callout>
            ) : null}

            {!unparsed ? (
              <>
                {selected.parsedInSession ? (
                  <Callout tone="info">Parsed in this session. Treat extracted values as a first read until {selected.owner} has checked them against the source.</Callout>
                ) : null}

                <div className="min-w-0">
                  <Label>Extracted requirements · {selected.requirements.length}</Label>
                  <div className="mt-1.5 overflow-x-auto rounded-md border border-muted">
                    <table className="w-full min-w-[520px] text-left text-body-sm">
                      <thead>
                        <tr className="border-b border-muted">
                          {["Requirement", "Value", "Source", "Conf."].map((h, i) => (
                            <th key={h} className={`px-3 py-2 text-caption font-medium tracking-[0.08em] text-quaternary uppercase ${i === 3 ? "text-right" : ""}`}>{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {selected.requirements.map((r) => (
                          <tr key={r.label} className="border-b border-muted last:border-b-0">
                            <td className="px-3 py-2 whitespace-nowrap text-primary">{r.label}</td>
                            <td className="px-3 py-2 text-secondary">{r.value}</td>
                            <td className="px-3 py-2 whitespace-nowrap text-quaternary">{r.source}</td>
                            <td className="px-3 py-2 text-right whitespace-nowrap">
                              {r.confidence < 80 ? <StatusBadge tone="warning">{r.confidence}% · check</StatusBadge> : <span className="tabular text-secondary">{r.confidence}%</span>}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="min-w-0">
                  <Label>Gaps to clarify · {openGaps(selected)} open of {selected.gaps.length}</Label>
                  {selected.gaps.length === 0 ? (
                    <p className="mt-1.5 text-body-sm text-tertiary">No gaps found. The pack is complete enough to quote.</p>
                  ) : (
                    <ul className="mt-1.5 flex flex-col gap-2">
                      {selected.gaps.map((gap) => {
                        const state = gapState(selected, gap);
                        const key = `rfq:${selected.id}:gap:${gap.id}`;
                        return (
                          <li key={gap.id} className="rounded-md border border-muted bg-raised px-3 py-2.5">
                            <div className="flex items-start justify-between gap-3">
                              <p className="min-w-0 text-body-md text-primary">{gap.question}</p>
                              <StatusBadge tone={state === "resolved" ? "success" : state === "listed" ? "info" : "warning"}>
                                {state === "resolved" ? "resolved" : state === "listed" ? "on clarification list" : "open"}
                              </StatusBadge>
                            </div>
                            <p className="mt-1 text-body-sm text-tertiary">{gap.why}</p>
                            <div className="mt-2 flex flex-wrap gap-2">
                              {state !== "listed" && state !== "resolved" ? (
                                <Btn onClick={() => { set(key, "listed"); toast("Added to the clarification list for this pack.", "info"); }}>Add to clarification list</Btn>
                              ) : null}
                              {state !== "resolved" ? (
                                <Btn variant="ghost" onClick={() => { set(key, "resolved"); toast("Gap marked resolved."); }}>Mark resolved</Btn>
                              ) : (
                                <Btn variant="ghost" onClick={() => set(key, "open")}>Reopen</Btn>
                              )}
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>
              </>
            ) : null}
          </>
        ) : null}
      </Drawer>
    </>
  );
}
