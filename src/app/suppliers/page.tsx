"use client";

/**
 * Supplier Command Centre.
 *
 * Who we buy from, who is late, where the money sits. Every row opens the
 * supplier's scorecard.
 */

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartLegend, ChartTip, CURSOR_FILL, GRID_STROKE, SERIES, TONE_COLOR } from "@/components/kraya/charts";
import { Btn, KMark, KpiGrid, KpiLink, Meter, RiskBadge, Stack } from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, Select, SplitRow, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useKraya } from "@/lib/kraya/context";
import { SUPPLIERS } from "@/lib/kraya/data";
import { inrCr } from "@/lib/kraya/format";
import { RISK_RANK } from "@/lib/kraya/selectors";
import type { Supplier } from "@/lib/kraya/types";

const HEALTH_TONE: Record<Supplier["financialHealth"], StatusTone> = {
  Strong: "success",
  Stable: "neutral",
  Watch: "warning",
  Weak: "error",
};

const OTD_TARGET = 85;

export default function SuppliersPage() {
  const router = useRouter();
  const { get } = useKraya();
  const [category, setCategory] = useState("all");
  const [risk, setRisk] = useState("all");

  const categories = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of SUPPLIERS) counts.set(s.category, (counts.get(s.category) ?? 0) + 1);
    return [
      { id: "all", label: "All", count: SUPPLIERS.length },
      ...[...counts.entries()].sort((a, b) => b[1] - a[1]).map(([id, count]) => ({ id, label: id, count })),
    ];
  }, []);

  const rows = useMemo(
    () =>
      SUPPLIERS.filter((s) => (category === "all" || s.category === category) && (risk === "all" || s.risk === risk)).sort(
        (a, b) => RISK_RANK[a.risk] - RISK_RANK[b.risk] || a.otd - b.otd,
      ),
    [category, risk],
  );

  const avgOtd = SUPPLIERS.reduce((sum, s) => sum + s.otd, 0) / SUPPLIERS.length;
  const avgQuality = SUPPLIERS.reduce((sum, s) => sum + s.quality, 0) / SUPPLIERS.length;
  const singleSource = SUPPLIERS.reduce((sum, s) => sum + s.singleSourceParts, 0);
  const atRisk = SUPPLIERS.filter((s) => RISK_RANK[s.risk] <= 1).length;
  const belowTarget = SUPPLIERS.filter((s) => s.otd < OTD_TARGET).length;

  const worst = useMemo(() => [...SUPPLIERS].sort((a, b) => a.otd - b.otd).slice(0, 10).map((s) => ({ id: s.id, name: s.name, otd: s.otd })), []);

  const spend = useMemo(() => {
    const totals = new Map<string, number>();
    for (const s of SUPPLIERS) totals.set(s.category, (totals.get(s.category) ?? 0) + s.spendCr);
    return [...totals.entries()].map(([name, value]) => ({ name, value: Math.round(value * 10) / 10 })).sort((a, b) => b.value - a.value);
  }, []);

  const columns: Column<Supplier>[] = [
    {
      key: "name", header: "Supplier", card: "title", value: (s) => `${s.name} ${s.id}`,
      render: (s) => (
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate text-primary">{s.name}</span>
            {get(`sup:${s.id}:hold`) === "1" ? <StatusBadge tone="warning">hold</StatusBadge> : null}
          </span>
          <span className="text-caption tabular text-quaternary">{s.id}</span>
        </span>
      ),
    },
    { key: "category", header: "Category", value: (s) => s.category, render: (s) => <span className="whitespace-nowrap">{s.category}</span> },
    { key: "commodity", header: "Commodity", hide: "md", value: (s) => s.commodity, render: (s) => <span className="whitespace-nowrap">{s.commodity}</span> },
    { key: "location", header: "Location", hide: "lg", value: (s) => `${s.city}, ${s.country}`, render: (s) => <span className="whitespace-nowrap">{s.city}, {s.country}</span> },
    {
      key: "otd", header: "OTD", align: "right", card: "metric", value: (s) => s.otd,
      render: (s) => (
        <span className="inline-flex w-20 flex-col items-end gap-1">
          <span className={`tabular ${s.otd < OTD_TARGET ? "text-warning" : "text-primary"}`}>{s.otd.toFixed(1)}%</span>
          <Meter value={s.otd} tone={s.otd < 80 ? "error" : s.otd < OTD_TARGET ? "warning" : "success"} />
        </span>
      ),
    },
    { key: "quality", header: "Quality", align: "right", value: (s) => s.quality, render: (s) => <span className="tabular">{s.quality}</span> },
    { key: "ppm", header: "PPM", align: "right", hide: "md", value: (s) => s.ppm, render: (s) => <span className="tabular">{s.ppm}</span> },
    { key: "lead", header: "Lead time", align: "right", value: (s) => s.leadTimeWeeks, render: (s) => <span className={`tabular whitespace-nowrap ${s.leadTimeWeeks >= 20 ? "text-warning" : ""}`}>{s.leadTimeWeeks} wk</span> },
    { key: "spend", header: "YTD spend", align: "right", value: (s) => s.spendCr, render: (s) => <span className="tabular whitespace-nowrap text-primary">{inrCr(s.spendCr)}</span> },
    { key: "terms", header: "Terms", hide: "lg", value: (s) => s.paymentTerms, render: (s) => <span className="whitespace-nowrap">{s.paymentTerms}</span> },
    { key: "health", header: "Financial", hide: "md", value: (s) => s.financialHealth, render: (s) => <StatusBadge tone={HEALTH_TONE[s.financialHealth]}>{s.financialHealth}</StatusBadge> },
    { key: "risk", header: "Risk", value: (s) => s.risk, render: (s) => <RiskBadge risk={s.risk} /> },
  ];

  return (
    <>
      <PageHeader
        title="Supplier Command Centre"
        description="Every component supplier on the approved vendor list: delivery, quality, spend and risk. Open a row for the scorecard."
        mark={<KMark id="mark-supplier" size={44} />}
        actions={
          <>
            <Select
              aria-label="Filter by risk"
              value={risk}
              onChange={(event) => setRisk(event.target.value)}
              className="h-8 rounded-full border border-muted bg-action text-label-sm text-secondary outline-none focus-visible:ring-2 focus-visible:ring-active"
            >
              <option value="all">All risk levels</option>
              <option value="critical">Critical</option>
              <option value="high">High</option>
              <option value="medium">Medium</option>
              <option value="low">Low</option>
            </Select>
            {category !== "all" || risk !== "all" ? (
              <Btn onClick={() => { setCategory("all"); setRisk("all"); }}>Clear filters</Btn>
            ) : null}
          </>
        }
      >
        <FilterChips options={categories} value={category} onChange={setCategory} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid cols={5}>
            <KpiTile label="Suppliers on AVL" value={String(SUPPLIERS.length)} hint={`${categories.length - 1} categories`} mark={<KMark id="mark-supplier" />} />
            <KpiTile label="Average OTD" value={`${avgOtd.toFixed(1)}%`} delta={`${belowTarget} under ${OTD_TARGET}%`} hint="target 90%" tone={belowTarget ? "warning" : "success"} />
            <KpiTile label="Quality score" value={`${avgQuality.toFixed(0)}/100`} hint="PPM, audits, NCR closure" />
            <KpiLink href="/bom">
              <KpiTile label="Single-source parts" value={String(singleSource)} hint="open the BOM to see them" tone="warning" mark={<KMark id="mark-single-source" />} />
            </KpiLink>
            <KpiLink href="/supplier-risk">
              <KpiTile label="High or critical risk" value={String(atRisk)} delta="open risk register" tone="error" mark={<KMark id="mark-supplier-risk" />} />
            </KpiLink>
          </KpiGrid>

          <SplitRow ratio="1.4/1">
            <Panel title="Who is late: OTD by supplier, worst 10" action={<span className="text-caption text-quaternary">click a bar for the scorecard</span>}>
              <ChartFrame height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={worst} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                    <XAxis type="number" domain={[70, 100]} {...AXIS_PROPS} tickFormatter={(v: number) => `${v}%`} />
                    <YAxis type="category" interval={0} dataKey="name" width={170} {...AXIS_PROPS} />
                    <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => `${v.toFixed(1)}%`} />} />
                    <ReferenceLine x={OTD_TARGET} stroke={TONE_COLOR.neutral} strokeDasharray="4 4" />
                    <Bar dataKey="otd" name="On-time delivery" radius={[0, 4, 4, 0]} barSize={14} cursor="pointer" onClick={(_, index) => router.push(`/suppliers/${worst[index].id}`)}>
                      {worst.map((row) => (
                        <Cell key={row.id} fill={row.otd < 80 ? TONE_COLOR.error : row.otd < OTD_TARGET ? TONE_COLOR.warning : SERIES[0]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
              <ChartLegend
                items={[
                  { label: "Under 80%", color: TONE_COLOR.error },
                  { label: `Under ${OTD_TARGET}%`, color: TONE_COLOR.warning },
                  { label: `At or above ${OTD_TARGET}%`, color: SERIES[0] },
                ]}
              />
            </Panel>

            <Panel title="Where the spend sits by category" action={<span className="text-caption text-quaternary">click to filter</span>}>
              <ChartFrame height={300}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={spend} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                    <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                    <XAxis type="number" {...AXIS_PROPS} tickFormatter={(v: number) => `₹${v} Cr`} />
                    <YAxis type="category" interval={0} dataKey="name" width={104} {...AXIS_PROPS} />
                    <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => inrCr(v)} />} />
                    <Bar dataKey="value" name="YTD spend" radius={[0, 4, 4, 0]} barSize={14} cursor="pointer" onClick={(_, index) => setCategory(spend[index].name === category ? "all" : spend[index].name)}>
                      {spend.map((row) => (
                        <Cell key={row.name} fill={category === "all" || category === row.name ? SERIES[1] : TONE_COLOR.neutral} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </ChartFrame>
              <p className="mt-2 text-caption text-quaternary">
                Semiconductors carry {Math.round(((spend.find((s) => s.name === "Semiconductor")?.value ?? 0) / spend.reduce((t, s) => t + s.value, 0)) * 100)}% of component spend and most of the single-source exposure.
              </p>
            </Panel>
          </SplitRow>

          <Panel title={`Suppliers · ${rows.length}`} padded={false}>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(s) => s.id}
              onRowClick={(s) => router.push(`/suppliers/${s.id}`)}
              searchPlaceholder="Search supplier, commodity or city"
              getSearchText={(s) => `${s.city} ${s.country} ${s.commodity}`}
              exportName="kraya-suppliers"
              pageSize={16}
              emptyTitle="No supplier matches these filters"
              emptyDetail="Clear the category or risk filter."
            />
          </Panel>
        </Stack>
      </PageBody>
    </>
  );
}
