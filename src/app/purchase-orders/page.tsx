"use client";

/**
 * PO Tracker.
 *
 * A PO is at risk when the supplier's promise date is after the date the
 * program needs the material on dock. Expedite and re-promise move the
 * promise date; readiness and the exception queue follow.
 */

import { Rocket, Undo2, CalendarSync } from "lucide-react";
import { useMemo, useState } from "react";
import { Bar, BarChart, CartesianGrid, Cell, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { AXIS_PROPS, ChartFrame, ChartLegend, ChartTip, CURSOR_FILL, GRID_STROKE, TONE_COLOR } from "@/components/kraya/charts";
import { Btn, Callout, Drawer, Field, KMark, KpiGrid, KpiLink, Label, PipelineSteps, RecordLink, SignOff, Stack, usePipeline, useSelection } from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { PURCHASE_ORDERS, type Po } from "@/lib/kraya/data";
import { daysBetween, fullDate, inrL, num, shortDate } from "@/lib/kraya/format";
import { poView, programById, programLabel, readiness, sourceName, type PoView } from "@/lib/kraya/selectors";
import type { PoStatus } from "@/lib/kraya/types";

const STATUS_TONE: Record<PoStatus, StatusTone> = { Confirmed: "neutral", "In Transit": "info", Delayed: "error", Received: "success" };

const FILTERS = [
  { id: "all", label: "All" },
  { id: "risk", label: "At risk" },
  { id: "Delayed", label: "Delayed" },
  { id: "In Transit", label: "In Transit" },
  { id: "Confirmed", label: "Confirmed" },
  { id: "Received", label: "Received" },
];

function matches(view: PoView, filter: string) {
  if (filter === "all") return true;
  if (filter === "risk") return view.atRisk;
  return view.status === filter;
}

/** Days of float: positive is early, negative is late. */
function floatDays(po: Po, view: PoView) {
  return daysBetween(view.promised, po.needDate);
}

function FloatText({ po, view }: { po: Po; view: PoView }) {
  if (po.status === "Received") return <span className="text-quaternary">received</span>;
  const float = floatDays(po, view);
  if (float < 0) return <span className="tabular whitespace-nowrap text-error">{Math.abs(float)}d late</span>;
  if (float < 7 && po.critical) return <span className="tabular whitespace-nowrap text-warning">{float}d float</span>;
  return <span className="tabular whitespace-nowrap text-tertiary">{float}d float</span>;
}

export default function PurchaseOrdersPage() {
  const { status, expeditePo, repromisePo, clear } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const [selectedId, select] = useSelection("po");
  const [filter, setFilter] = useState("all");

  const views = useMemo(() => new Map(PURCHASE_ORDERS.map((po) => [po.id, poView(status, po)])), [status]);
  const view = (po: Po) => views.get(po.id) ?? poView(status, po);

  const rows = useMemo(
    () => PURCHASE_ORDERS.filter((po) => matches(views.get(po.id) ?? poView(status, po), filter)),
    [filter, views, status],
  );
  const counts = useMemo(
    () => Object.fromEntries(FILTERS.map((f) => [f.id, PURCHASE_ORDERS.filter((po) => matches(views.get(po.id) ?? poView(status, po), f.id)).length])) as Record<string, number>,
    [views, status],
  );

  const open = PURCHASE_ORDERS.filter((po) => po.status !== "Received");
  const late = open.filter((po) => view(po).lateDays > 0);
  const tight = open.filter((po) => po.critical && view(po).lateDays === 0 && floatDays(po, view(po)) < 7);
  const openValue = open.reduce((sum, po) => sum + po.valueL, 0);
  const lateValue = late.reduce((sum, po) => sum + po.valueL, 0);

  const chart = useMemo(
    () =>
      PURCHASE_ORDERS.filter((po) => po.status !== "Received")
        .map((po) => {
          const v = views.get(po.id) ?? poView(status, po);
          return { id: po.id, name: `${po.id.slice(-3)} ${po.pn}`, float: daysBetween(v.promised, po.needDate), critical: po.critical };
        })
        .sort((a, b) => a.float - b.float),
    [views, status],
  );

  const selected = PURCHASE_ORDERS.find((po) => po.id === selectedId) ?? null;
  const sv = selected ? view(selected) : null;
  const program = selected ? programById(selected.programId) : undefined;
  const ready = program ? readiness(status, program) : null;
  const baseline = program ? readiness({}, program) : null;
  const originalLate = selected ? Math.max(0, daysBetween(selected.needDate, selected.promisedDate)) : 0;

  function expedite(po: Po) {
    pipeline.start(
      [`Request a priority lot from ${sourceName(po.supplierId)}`, `Confirm the ${inrL(po.expediteCostL)} expedite fee against buyer authority`, "Update the promise date in SAP S/4HANA", "Recalculate program readiness and the exception queue"],
      () => {
        expeditePo(po.id);
        toast(`${po.id} expedited: ${po.expediteDays} days recovered for ${inrL(po.expediteCostL)}. Readiness and the exception queue were recalculated.`);
      },
    );
  }

  function repromise(po: Po) {
    pipeline.start(
      [`Send re-promise request to ${sourceName(po.supplierId)} with the need date`, "Supplier reviews split shipment and line slot", "Record the new commitment in SAP S/4HANA"],
      () => {
        repromisePo(po.id);
        toast(`${sourceName(po.supplierId)} re-promised ${po.id}: ${po.repromiseDays} days earlier by split shipment, no fee.`);
      },
    );
  }

  const columns: Column<Po>[] = [
    { key: "id", header: "PO", width: "w-28", card: "title", value: (po) => po.id, render: (po) => <span className="tabular whitespace-nowrap text-primary">{po.id}</span> },
    { key: "supplier", header: "Supplier", value: (po) => sourceName(po.supplierId), render: (po) => <RecordLink href={`/suppliers/${po.supplierId}`} className="text-body-sm">{sourceName(po.supplierId)}</RecordLink> },
    {
      key: "component", header: "Component", value: (po) => `${po.component} ${po.pn}`,
      render: (po) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate text-secondary">{po.component}</span>
          <span className="text-caption tabular text-quaternary">{po.pn}{po.critical ? " · critical" : ""}</span>
        </span>
      ),
    },
    { key: "program", header: "Program", hide: "md", value: (po) => programLabel(po.programId), render: (po) => <RecordLink href={`/programs/${po.programId}`} className="text-body-sm">{programLabel(po.programId)}</RecordLink> },
    { key: "qty", header: "Qty", align: "right", hide: "lg", value: (po) => po.qty, render: (po) => <span className="tabular">{num(po.qty)}</span> },
    { key: "value", header: "Value", align: "right", value: (po) => po.valueL, render: (po) => <span className="tabular whitespace-nowrap text-primary">{inrL(po.valueL)}</span> },
    { key: "ordered", header: "Ordered", align: "right", hide: "lg", value: (po) => po.orderDate, render: (po) => <span className="tabular whitespace-nowrap">{shortDate(po.orderDate)}</span> },
    {
      key: "promised", header: "Promised", align: "right", value: (po) => view(po).promised,
      render: (po) => {
        const v = view(po);
        return (
          <span className="tabular whitespace-nowrap">
            {v.promised !== po.promisedDate ? <span className="text-quaternary line-through">{shortDate(po.promisedDate)}</span> : null} {shortDate(v.promised)}
          </span>
        );
      },
    },
    { key: "need", header: "Need date", align: "right", value: (po) => po.needDate, render: (po) => <span className="tabular whitespace-nowrap">{shortDate(po.needDate)}</span> },
    { key: "float", header: "Float", align: "right", card: "metric", value: (po) => (po.status === "Received" ? 999 : floatDays(po, view(po))), render: (po) => <FloatText po={po} view={view(po)} /> },
    {
      key: "status", header: "Status", value: (po) => view(po).status,
      render: (po) => {
        const v = view(po);
        return (
          <span className="flex flex-wrap items-center gap-1">
            <StatusBadge tone={STATUS_TONE[v.status]}>{v.status}</StatusBadge>
            {v.expedited ? <StatusBadge tone="info">expedited</StatusBadge> : null}
            {v.repromised ? <StatusBadge tone="info">re-promised</StatusBadge> : null}
          </span>
        );
      },
    },
  ];

  return (
    <>
      <PageHeader
        title="PO Tracker"
        description="Open purchase orders against the date each program needs the material. Late means the promise is after the need date, not after the original due date."
        mark={<KMark id="mark-po" size={44} />}
      >
        <FilterChips options={FILTERS.map((f) => ({ ...f, count: counts[f.id] }))} value={filter} onChange={setFilter} />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid cols={5}>
            <KpiTile label="Open POs" value={String(open.length)} hint={`${PURCHASE_ORDERS.length} tracked`} mark={<KMark id="mark-po" />} />
            <KpiTile label="Open value" value={inrL(openValue)} hint="not yet received" />
            <KpiLink href="/dashboard">
              <KpiTile label="Late against need date" value={String(late.length)} delta={late.length ? `${inrL(lateValue)} of material` : "none late"} tone={late.length ? "error" : "success"} mark={<KMark id="mark-shipment" />} />
            </KpiLink>
            <KpiTile label="Critical, under 7d float" value={String(tight.length)} hint="on time but one slip from late" tone={tight.length ? "warning" : "neutral"} />
            <KpiTile label="Received" value={String(PURCHASE_ORDERS.length - open.length)} hint="GRN posted" tone="success" />
          </KpiGrid>

          <Panel title="Which POs miss their need date" action={<span className="text-caption text-quaternary">days of float; left of zero is late · click a bar</span>}>
            <ChartFrame height={Math.max(220, chart.length * 22 + 40)}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chart} layout="vertical" margin={{ top: 4, right: 24, bottom: 0, left: 0 }}>
                  <CartesianGrid stroke={GRID_STROKE} horizontal={false} />
                  <XAxis type="number" {...AXIS_PROPS} tickFormatter={(v: number) => `${v}d`} />
                  <YAxis type="category" dataKey="name" width={132} interval={0} {...AXIS_PROPS} />
                  <Tooltip cursor={CURSOR_FILL} content={<ChartTip format={(v) => (v < 0 ? `${Math.abs(v)} days late` : `${v} days of float`)} />} />
                  <ReferenceLine x={0} stroke={TONE_COLOR.neutral} />
                  <Bar dataKey="float" name="Promise vs need date" barSize={12} radius={3} cursor="pointer" isAnimationActive={false} onClick={(_, index) => select(chart[index].id)}>
                    {chart.map((row) => (
                      <Cell key={row.id} fill={row.float < 0 ? TONE_COLOR.error : row.float < 7 && row.critical ? TONE_COLOR.warning : TONE_COLOR.success} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </ChartFrame>
            <ChartLegend
              items={[
                { label: "Late: promise after need date", color: TONE_COLOR.error },
                { label: "Critical part, under 7 days float", color: TONE_COLOR.warning },
                { label: "On time", color: TONE_COLOR.success },
              ]}
            />
          </Panel>

          <Panel title={`Purchase orders · ${rows.length}`} padded={false}>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(po) => po.id}
              onRowClick={(po) => select(po.id)}
              isRowSelected={(po) => po.id === selectedId}
              defaultSort={{ key: "float", dir: "asc" }}
              searchPlaceholder="Search PO, supplier, part or program"
              exportName="kraya-purchase-orders"
              emptyTitle="No purchase orders in this view"
              emptyDetail="Pick another status chip."
            />
          </Panel>
        </Stack>
      </PageBody>

      <Drawer
        open={Boolean(selected)}
        onClose={() => select(null)}
        title={selected?.id ?? ""}
        subtitle={selected ? `${selected.component} · ${sourceName(selected.supplierId)}` : undefined}
        badge={sv ? <StatusBadge tone={STATUS_TONE[sv.status]}>{sv.status}</StatusBadge> : undefined}
        footer={
          selected && sv && selected.status !== "Received" ? (
            <>
              <Btn
                variant="primary"
                icon={Rocket}
                disabled={pipeline.running || sv.expedited || selected.expediteDays === 0}
                title={selected.expediteDays === 0 ? "The supplier has offered no expedite option on this PO" : undefined}
                onClick={() => expedite(selected)}
              >
                {sv.expedited ? "Expedited" : selected.expediteDays ? `Expedite · ${inrL(selected.expediteCostL)}` : "Expedite"}
              </Btn>
              <Btn
                icon={CalendarSync}
                disabled={pipeline.running || sv.repromised || selected.repromiseDays === 0}
                title={selected.repromiseDays === 0 ? "The supplier has no earlier slot or split shipment to offer" : undefined}
                onClick={() => repromise(selected)}
              >
                {sv.repromised ? "Re-promised" : "Request re-promise"}
              </Btn>
              {sv.expedited || sv.repromised ? (
                <Btn
                  variant="ghost"
                  icon={Undo2}
                  disabled={pipeline.running}
                  onClick={() => { clear(`po:${selected.id}:expedite`); clear(`po:${selected.id}:repromise`); toast(`${selected.id} actions undone. Promise date back to ${shortDate(selected.promisedDate)}.`, "info"); }}
                >
                  Undo
                </Btn>
              ) : null}
            </>
          ) : null
        }
      >
        {selected && sv ? (
          <>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              <Field label="Supplier"><RecordLink href={`/suppliers/${selected.supplierId}`} className="text-body-md">{sourceName(selected.supplierId)}</RecordLink></Field>
              <Field label="Part"><span className="tabular">{selected.pn}</span></Field>
              <Field label="Program"><RecordLink href={`/programs/${selected.programId}`} className="text-body-md">{programLabel(selected.programId)}</RecordLink></Field>
              <Field label="Quantity"><span className="tabular">{num(selected.qty)}</span></Field>
              <Field label="Value"><span className="tabular">{inrL(selected.valueL)}</span></Field>
              <Field label="Incoterm">{selected.incoterm}</Field>
              <Field label="Ordered"><span className="tabular">{fullDate(selected.orderDate)}</span></Field>
              <Field label="Promised">
                <span className="tabular">{fullDate(sv.promised)}</span>
                {sv.promised !== selected.promisedDate ? <span className="block text-caption tabular text-quaternary">was {fullDate(selected.promisedDate)}</span> : null}
              </Field>
              <Field label="Needed on dock"><span className="tabular">{fullDate(selected.needDate)}</span></Field>
            </div>

            <Callout label="Buyer note">{selected.note}</Callout>

            <Callout
              label="Why this PO is or is not at risk"
              tone={selected.status === "Received" ? "success" : sv.lateDays > 0 ? "error" : sv.atRisk ? "warning" : "success"}
            >
              {selected.status === "Received" ? (
                "Material is received and the goods receipt is posted. Nothing to do."
              ) : (
                <>
                  {program ? `${program.name} needs this material on dock by ${fullDate(selected.needDate)} for: ${program.nextMilestone.toLowerCase()} (SOP ${fullDate(program.sopDate)}). ` : ""}
                  The supplier promises {fullDate(sv.promised)}.{" "}
                  {sv.lateDays > 0
                    ? `That is ${sv.lateDays} days after the need date, so the build waits for it.`
                    : `That leaves ${floatDays(selected, sv)} days of float.${selected.critical && floatDays(selected, sv) < 7 ? " On a critical part, under 7 days counts as at risk: one slip makes it late." : ""}`}
                  {selected.critical ? " The part is on the critical list: no alternate can cover a miss." : ""}
                </>
              )}
            </Callout>

            {selected.status !== "Received" ? (
              <div>
                <Label>Recovery options</Label>
                <ul className="mt-1.5 flex flex-col gap-1.5">
                  <li className="flex items-start justify-between gap-3 rounded-md border border-muted bg-raised px-3 py-2 text-body-sm">
                    <span className="min-w-0 text-secondary">
                      Expedite (priority lot or air freight)
                      <span className="block text-caption text-quaternary">
                        {selected.expediteDays ? `Recovers ${selected.expediteDays} days for ${inrL(selected.expediteCostL)}` : "No expedite option offered by the supplier"}
                      </span>
                    </span>
                    <StatusBadge tone={sv.expedited ? "success" : selected.expediteDays ? "neutral" : "neutral"}>{sv.expedited ? "done" : selected.expediteDays ? "available" : "not available"}</StatusBadge>
                  </li>
                  <li className="flex items-start justify-between gap-3 rounded-md border border-muted bg-raised px-3 py-2 text-body-sm">
                    <span className="min-w-0 text-secondary">
                      Re-promise (split shipment or earlier slot)
                      <span className="block text-caption text-quaternary">
                        {selected.repromiseDays ? `Recovers ${selected.repromiseDays} days at no fee` : "No earlier slot available"}
                      </span>
                    </span>
                    <StatusBadge tone={sv.repromised ? "success" : "neutral"}>{sv.repromised ? "done" : selected.repromiseDays ? "available" : "not available"}</StatusBadge>
                  </li>
                </ul>
              </div>
            ) : null}

            <PipelineSteps run={pipeline.run} />

            {sv.expedited || sv.repromised ? (
              <Callout label="Result" tone={sv.lateDays > 0 ? "warning" : "success"}>
                New promise date {fullDate(sv.promised)}: {originalLate - sv.lateDays} of {originalLate} late days recovered.{" "}
                {sv.lateDays > 0 ? `Still ${sv.lateDays} days late${!sv.expedited && selected.expediteDays ? "; expedite is still available" : !sv.repromised && selected.repromiseDays ? "; a re-promise is still available" : "; escalate to the program manager"}.` : "The PO now meets the need date and has left the exception queue."}
              </Callout>
            ) : null}

            {ready && program ? (
              <div className="grid grid-cols-2 gap-3 rounded-md border border-muted px-3 py-2.5">
                <Field label={`${program.productCode} material readiness`}>
                  <span className="font-display text-display-lg tabular text-primary">{ready.material}%</span>
                  {baseline && baseline.material !== ready.material ? <span className="ml-1.5 text-caption tabular text-success">+{ready.material - baseline.material} this session</span> : null}
                </Field>
                <Field label="ATP confidence">
                  <span className="font-display text-display-lg tabular text-primary">{ready.confidence.toFixed(1)}%</span>
                  {baseline && baseline.confidence !== ready.confidence ? (
                    <span className={`ml-1.5 text-caption tabular ${ready.confidence > baseline.confidence ? "text-success" : "text-error"}`}>
                      {ready.confidence > baseline.confidence ? "+" : ""}{(ready.confidence - baseline.confidence).toFixed(1)} this session
                    </span>
                  ) : null}
                </Field>
              </div>
            ) : null}

            {program ? <SignOff name={program.buyer} note="expedite fees above ₹1L need buyer approval; above ₹5L the head of procurement signs" /> : null}
          </>
        ) : null}
      </Drawer>
    </>
  );
}
