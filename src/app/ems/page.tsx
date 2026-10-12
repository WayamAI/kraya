"use client";

/**
 * EMS network.
 *
 * Answers: who can build which board, with what certification and headroom,
 * and how each partner is performing.
 */

import { CalendarCheck, FileText } from "lucide-react";
import { useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import { Btn, Callout, Drawer, Field, Figure, KMark, KpiGrid, KpiLink, Label, LinkBtn, Meter, RecordLink, RiskBadge, Stack, useSelection } from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { EmptyState, KpiTile, Panel, Select, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { CONTRACTS, EMS_PARTNERS, PROGRAMS } from "@/lib/kraya/data";
import { compact, fullDate, inrCr, num, PLAN_MONTHS, shortDate } from "@/lib/kraya/format";
import { capacityFor, shortfallMonths } from "@/lib/kraya/selectors";
import type { EmsPartner } from "@/lib/kraya/types";

const CITIES = Array.from(new Set(EMS_PARTNERS.map((e) => e.city)));
const OPTIONS = Array.from(new Set(EMS_PARTNERS.flatMap((e) => [...e.certifications, ...e.capabilities]))).sort();

function utilTone(value: number): StatusTone {
  return value >= 90 ? "error" : value >= 82 ? "warning" : "success";
}

function Chip({ children }: { children: string }) {
  return <span className="inline-flex items-center rounded-full border border-muted px-2 py-0.5 text-caption whitespace-nowrap text-tertiary">{children}</span>;
}

export default function EmsNetworkPage() {
  const { status, get, set } = useKraya();
  const toast = useToast();
  const [city, setCity] = useState("all");
  const [capability, setCapability] = useState("all");
  const [selectedId, select] = useSelection("ems");

  const partners = EMS_PARTNERS.filter((e) => (city === "all" || e.city === city) && (capability === "all" || e.certifications.includes(capability) || e.capabilities.includes(capability)));
  const lines = EMS_PARTNERS.reduce((sum, e) => sum + e.smtLines, 0);
  const capacity = EMS_PARTNERS.reduce((sum, e) => sum + e.capacity, 0);
  const utilisation = EMS_PARTNERS.reduce((sum, e) => sum + e.utilisation * e.capacity, 0) / capacity;
  const over = shortfallMonths(status);
  const selected = EMS_PARTNERS.find((e) => e.id === selectedId) ?? null;

  const columns: Column<EmsPartner>[] = [
    { key: "name", header: "Partner", card: "title", value: (e) => e.name, render: (e) => <span className="whitespace-nowrap text-primary">{e.name}</span> },
    { key: "city", header: "City", value: (e) => e.city, render: (e) => e.city },
    { key: "lines", header: "SMT lines", align: "right", value: (e) => e.smtLines, render: (e) => <span className="tabular">{e.smtLines}</span> },
    { key: "cph", header: "Placements / h", align: "right", hide: "md", value: (e) => e.cph, render: (e) => <span className="tabular">{e.cph ? compact(e.cph) : "—"}</span> },
    { key: "capacity", header: "Boards / month", align: "right", card: "metric", value: (e) => e.capacity, render: (e) => <span className="tabular text-primary">{num(e.capacity)}</span> },
    { key: "util", header: "Utilisation", align: "right", value: (e) => e.utilisation, render: (e) => <span className={`tabular ${e.utilisation >= 90 ? "text-error" : e.utilisation >= 82 ? "text-warning" : "text-secondary"}`}>{e.utilisation}%</span> },
    { key: "ppm", header: "PPM", align: "right", value: (e) => e.ppm, render: (e) => <span className="tabular">{e.ppm}</span> },
    { key: "otif", header: "OTIF", align: "right", hide: "md", value: (e) => e.otif, render: (e) => <span className="tabular">{e.otif.toFixed(1)}%</span> },
    { key: "fpy", header: "FPY", align: "right", hide: "md", value: (e) => e.fpy, render: (e) => <span className="tabular">{e.fpy.toFixed(1)}%</span> },
    { key: "vda", header: "VDA 6.3", hide: "lg", value: (e) => e.vdaGrade, render: (e) => <StatusBadge tone={e.vdaGrade === "A" ? "success" : "info"}>Grade {e.vdaGrade}</StatusBadge> },
    { key: "risk", header: "Risk", value: (e) => e.risk, render: (e) => <RiskBadge risk={e.risk} /> },
    { key: "spend", header: "Spend YTD", align: "right", hide: "lg", value: (e) => e.spendCr, render: (e) => <span className="tabular">{inrCr(e.spendCr)}</span> },
  ];

  return (
    <>
      <PageHeader
        title="EMS Network"
        description="Eight contract manufacturers in Pune, Chennai, Hosur, Manesar and Sanand: lines, certification, headroom and the programs each one builds."
        mark={<KMark id="mark-ems" size={44} />}
        actions={
          <>
            <Select aria-label="Certification or capability" value={capability} onChange={(event) => setCapability(event.target.value)} className="h-8 rounded-full border border-muted bg-action text-label-sm text-secondary">
              <option value="all">Any capability</option>
              {OPTIONS.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </Select>
            <LinkBtn href="/ems/capacity">Capacity plan</LinkBtn>
          </>
        }
      >
        <FilterChips
          options={[{ id: "all", label: "All cities", count: EMS_PARTNERS.length }, ...CITIES.map((c) => ({ id: c, label: c, count: EMS_PARTNERS.filter((e) => e.city === c).length }))]}
          value={city}
          onChange={setCity}
        />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid cols={5}>
            <KpiTile label="EMS partners" value={String(EMS_PARTNERS.length)} hint={`${CITIES.length} cities`} mark={<KMark id="mark-ems" />} />
            <KpiTile label="SMT lines" value={String(lines)} hint="across the network" />
            <KpiTile label="Network capacity" value={compact(capacity)} hint="boards a month, 2 shifts" />
            <KpiTile label="Utilisation" value={`${utilisation.toFixed(0)}%`} hint="capacity weighted, October" tone={utilTone(utilisation)} />
            <KpiLink href="/ems/capacity">
              <KpiTile label="Partner-months over capacity" value={String(over)} hint="next 12 months, open the plan" tone={over ? "error" : "success"} delta={over ? "needs allocation" : "all fit"} />
            </KpiLink>
          </KpiGrid>

          {partners.length === 0 ? (
            <Panel>
              <EmptyState title="No partner matches" detail={`No partner in ${city === "all" ? "the network" : city} has ${capability}.`} mark={<KMark id="mark-empty" size={44} />} />
            </Panel>
          ) : (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 2xl:grid-cols-3">
              {partners.map((partner) => {
                const programs = PROGRAMS.filter((p) => p.emsId === partner.id);
                return (
                  <article
                    key={partner.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => select(partner.id)}
                    onKeyDown={(event) => {
                      if (event.key === "Enter" || event.key === " ") {
                        event.preventDefault();
                        select(partner.id);
                      }
                    }}
                    className="flex min-w-0 cursor-pointer flex-col gap-3 rounded-lg border border-muted bg-container p-4 outline-none transition-colors duration-[180ms] hover:border-default focus-visible:ring-2 focus-visible:ring-active"
                  >
                    <div className="flex items-start gap-3">
                      <KMark id="mark-ems" size={28} className="mt-0.5" />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-body-md font-medium text-primary">{partner.name}</p>
                        <p className="truncate text-caption text-quaternary">
                          {partner.id} · {partner.city}, {partner.state}
                        </p>
                      </div>
                      <RiskBadge risk={partner.risk} />
                    </div>

                    <div className="grid grid-cols-3 gap-3">
                      <Figure label="SMT lines" value={partner.smtLines || "—"} hint={partner.cph ? `${compact(partner.cph)} cph` : "coating and test"} />
                      <Figure label="Boards / mo" value={compact(partner.capacity)} hint="2 shifts" />
                      <Figure label="VDA 6.3" value={partner.vdaGrade} hint={`audit ${partner.auditScore}`} />
                    </div>

                    <div>
                      <div className="flex items-baseline justify-between gap-3">
                        <Label>Utilisation</Label>
                        <span className="text-body-sm tabular text-primary">{partner.utilisation}%</span>
                      </div>
                      <Meter value={partner.utilisation} tone={utilTone(partner.utilisation)} className="mt-1" />
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-muted pt-3">
                      <Field label="PPM">
                        <span className="tabular text-primary">{partner.ppm}</span>
                      </Field>
                      <Field label="OTIF">
                        <span className="tabular text-primary">{partner.otif.toFixed(1)}%</span>
                      </Field>
                      <Field label="FPY">
                        <span className="tabular text-primary">{partner.fpy.toFixed(1)}%</span>
                      </Field>
                    </div>

                    <div className="flex flex-wrap gap-1.5">
                      {partner.certifications.map((cert) => (
                        <Chip key={cert}>{cert}</Chip>
                      ))}
                    </div>
                    <p className="text-body-sm text-tertiary">{partner.capabilities.join(" · ")}</p>

                    <div className="mt-auto flex flex-wrap items-baseline gap-x-3 gap-y-1 border-t border-muted pt-3 text-body-sm">
                      <span className="text-caption text-quaternary">Builds</span>
                      {programs.length ? programs.map((p) => <RecordLink key={p.id} href={`/programs/${p.id}`}>{p.name}</RecordLink>) : <span className="text-tertiary">no tracked program</span>}
                    </div>
                  </article>
                );
              })}
            </div>
          )}

          <Panel title="Partner comparison" padded={false}>
            <DataTable rows={partners} columns={columns} rowKey={(e) => e.id} onRowClick={(e) => select(e.id)} isRowSelected={(e) => e.id === selectedId} exportName="kraya-ems-partners" searchPlaceholder="Search partners" defaultSort={{ key: "capacity", dir: "desc" }} />
          </Panel>
        </Stack>
      </PageBody>

      {selected ? <PartnerDrawer partner={selected} onClose={() => select(null)} auditBooked={get(`ems:${selected.id}:audit`) === "scheduled"} onAudit={() => {
        set(`ems:${selected.id}:audit`, "scheduled");
        toast(`VDA 6.3 process audit at ${selected.name} booked for 9 Nov 2026. Lead auditor: Harpreet Gill.`);
      }} onStatement={() => toast(`Capacity statement requested from ${selected.name}. Reply due in 5 working days.`, "info")} /> : null}
    </>
  );
}

function PartnerDrawer({ partner, onClose, auditBooked, onAudit, onStatement }: { partner: EmsPartner; onClose: () => void; auditBooked: boolean; onAudit: () => void; onStatement: () => void }) {
  const { status } = useKraya();
  const months = capacityFor(status, partner.id);
  const data = months.map((m) => ({ month: PLAN_MONTHS[m.index], boards: m.total, over: m.shortfall > 0 }));
  const contract = CONTRACTS.find((c) => c.supplierId === partner.id);
  const programs = PROGRAMS.filter((p) => p.emsId === partner.id);
  const overCount = months.filter((m) => m.shortfall > 0).length;

  return (
    <Drawer
      open
      wide
      onClose={onClose}
      title={partner.name}
      subtitle={`${partner.id} · ${partner.city}, ${partner.state}`}
      badge={<RiskBadge risk={partner.risk} />}
      footer={
        <>
          <Btn variant="primary" icon={FileText} onClick={onStatement}>
            Request capacity statement
          </Btn>
          <Btn icon={CalendarCheck} disabled={auditBooked} onClick={onAudit}>
            {auditBooked ? "Audit booked · 9 Nov" : "Schedule VDA 6.3 audit"}
          </Btn>
          <LinkBtn href="/ems/performance" variant="ghost">
            Performance
          </LinkBtn>
        </>
      }
    >
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Figure label="SMT lines" value={partner.smtLines || "—"} hint={partner.cph ? `${num(partner.cph)} cph` : "no SMT"} />
        <Figure label="Capacity" value={compact(partner.capacity)} hint="boards a month" />
        <Figure label="Utilisation" value={`${partner.utilisation}%`} tone={partner.utilisation >= 90 ? "text-error" : "text-primary"} />
        <Figure label="Changeover" value={`${partner.changeoverMin}m`} hint="agreement 45 min" tone={partner.changeoverMin > 45 ? "text-warning" : "text-primary"} />
        <Figure label="PPM" value={partner.ppm} />
        <Figure label="OTIF" value={`${partner.otif.toFixed(1)}%`} />
        <Figure label="FPY" value={`${partner.fpy.toFixed(1)}%`} />
        <Figure label="Spend YTD" value={inrCr(partner.spendCr)} />
      </div>

      <div>
        <Label>Certifications</Label>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {partner.certifications.map((cert) => (
            <Chip key={cert}>{cert}</Chip>
          ))}
          <Chip>{`VDA 6.3 grade ${partner.vdaGrade}`}</Chip>
        </div>
        {!partner.certifications.includes("ISO 26262 (process)") ? <p className="mt-1.5 text-caption text-warning">No ISO 26262 process assessment: not eligible for ASIL C or D builds.</p> : null}
      </div>

      <Field label="Capabilities">{partner.capabilities.join(" · ")}</Field>

      <div>
        <div className="flex items-baseline justify-between gap-3">
          <Label>Does the next 12 months fit: boards against capacity</Label>
          <span className={`text-caption ${overCount ? "text-error" : "text-success"}`}>{overCount ? `${overCount} months over` : "fits"}</span>
        </div>
        <ChartFrame height={160}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 12, right: 4, bottom: 0, left: -14 }}>
              <CartesianGrid stroke={GRID_STROKE} vertical={false} />
              <XAxis dataKey="month" {...AXIS_PROPS} interval={0} />
              <YAxis {...AXIS_PROPS} tickFormatter={(v: number) => compact(v)} />
              <Tooltip cursor={CURSOR_FILL} content={<ChartTip />} />
              <ReferenceLine y={partner.capacity} stroke={TONE_COLOR.neutral} strokeDasharray="4 4" />
              <Bar dataKey="boards" name="Boards" radius={[3, 3, 0, 0]}>
                {data.map((row) => (
                  <Cell key={row.month} fill={row.over ? TONE_COLOR.error : SERIES[0]} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </ChartFrame>
        <p className="text-caption text-quaternary">Dashed line is capacity at {num(partner.capacity)} boards. Accepted allocations are included.</p>
      </div>

      <div>
        <Label>Programs built here</Label>
        <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-body-sm">
          {programs.length ? programs.map((p) => <RecordLink key={p.id} href={`/programs/${p.id}`}>{`${p.id} · ${p.name}`}</RecordLink>) : <span className="text-tertiary">No tracked program; legacy products only.</span>}
        </div>
      </div>

      <div>
        <Label>Open audit findings · {partner.findings.length}</Label>
        {partner.findings.length ? (
          <ul className="mt-1.5 flex flex-col gap-1.5">
            {partner.findings.map((finding) => (
              <li key={finding.id} className="flex items-start gap-2.5 rounded-md border border-muted px-3 py-2">
                <StatusBadge tone={finding.severity === "major" ? "error" : "neutral"}>{finding.severity}</StatusBadge>
                <span className="min-w-0 flex-1 text-body-sm text-secondary">
                  {finding.text}
                  <span className="block text-caption text-quaternary">
                    {finding.id} · due {shortDate(finding.due)}
                  </span>
                </span>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-1 text-body-sm text-tertiary">No open findings from the last audit.</p>
        )}
      </div>

      {contract ? (
        <Callout label="Contract">
          <RecordLink href={`/contracts?contract=${contract.id}`}>{contract.id}</RecordLink> · {contract.title} · {inrCr(contract.valueCr)} · ends {fullDate(contract.end)}
        </Callout>
      ) : (
        <Callout label="Contract">No manufacturing services agreement on file in Coupa; work runs on purchase orders.</Callout>
      )}
    </Drawer>
  );
}
