"use client";

/**
 * Integrations. Is each source system feeding this app, how stale is it, and
 * which master-data records are wrong enough to cost time or money.
 */

import { RefreshCw } from "lucide-react";
import { useState } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import {
  Btn,
  Callout,
  Drawer,
  Field,
  Figure,
  KMark,
  KpiGrid,
  Label,
  PipelineSteps,
  RiskBadge,
  Stack,
  usePipeline,
  useSelection,
} from "@/components/kraya/kit";
import { DataTable, FilterChips, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { INTEGRATIONS, MASTER_DATA_ISSUES } from "@/lib/kraya/data";
import { compact } from "@/lib/kraya/format";
import type { Integration, MasterDataIssue } from "@/lib/kraya/types";

const STATUS_TONE: Record<Integration["status"], StatusTone> = { Healthy: "success", Degraded: "warning", Failed: "error" };

const lastSync = (iso: string) => `${iso.slice(8, 10)} Oct, ${iso.slice(11)}`;
const latency = (minutes: number) => (minutes >= 120 ? `${Math.round(minutes / 60)} h` : `${minutes} min`);

function SystemCard({ system }: { system: Integration }) {
  const { get, set } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const synced = get(`int:${system.id}`) === "synced";
  const status: Integration["status"] = synced ? "Healthy" : system.status;

  function sync() {
    pipeline.start(
      system.status === "Failed"
        ? ["Rotate the expired API key", "Open the connection", `Pull ${system.objects[0].toLowerCase()}`, "Reconcile record counts"]
        : ["Open the connection", `Pull changes: ${system.objects[0].toLowerCase()}`, "Replay rejected messages", "Reconcile record counts"],
      () => {
        set(`int:${system.id}`, "synced");
        toast(`${system.name} synced. ${system.errors24h ? `${system.errors24h} rejected messages replayed.` : "No errors."}`);
      },
      620,
    );
  }

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-lg border border-muted bg-container p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-body-md font-medium text-primary">{system.name}</p>
          <p className="mt-0.5 text-body-sm text-tertiary">{system.role}</p>
        </div>
        <StatusBadge tone={STATUS_TONE[status]}>{status}</StatusBadge>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <Figure label="Last sync" value={<span className="font-sans text-body-md tabular text-primary">{synced ? "just now" : lastSync(system.lastSync)}</span>} />
        <Figure label="Data age" value={synced ? "0 min" : latency(system.latencyMin)} tone={!synced && system.latencyMin > 120 ? "text-warning" : "text-primary"} />
        <Figure label="Errors 24 h" value={synced ? 0 : system.errors24h} tone={!synced && system.errors24h > 5 ? "text-error" : "text-primary"} />
      </div>
      <div className="min-w-0">
        <Label>Objects · {compact(system.records)} records</Label>
        <ul className="mt-1 flex flex-wrap gap-1.5">
          {system.objects.map((object) => (
            <li key={object} className="rounded-full border border-muted px-2 py-0.5 text-caption text-tertiary">{object}</li>
          ))}
        </ul>
      </div>
      <p className="text-body-sm text-secondary">{synced ? "Back in step. Rejected messages were replayed and counts reconcile." : system.note}</p>
      <PipelineSteps run={pipeline.run} />
      <div className="mt-auto flex flex-wrap gap-2">
        <Btn icon={RefreshCw} variant={status === "Healthy" ? "secondary" : "primary"} onClick={sync} disabled={pipeline.running}>
          {system.status === "Failed" && !synced ? "Reconnect and sync" : "Sync now"}
        </Btn>
      </div>
    </article>
  );
}

export default function IntegrationsPage() {
  const { get, set, setMany } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const [filter, setFilter] = useState("open");
  const [selectedId, select] = useSelection("issue");

  const fixed = (issue: MasterDataIssue) => get(`md:${issue.id}`) === "fixed";
  const open = MASTER_DATA_ISSUES.filter((i) => !fixed(i));
  const rows = MASTER_DATA_ISSUES.filter((i) => (filter === "open" ? !fixed(i) : filter === "fixed" ? fixed(i) : true));
  const selected = MASTER_DATA_ISSUES.find((i) => i.id === selectedId);
  const healthy = INTEGRATIONS.filter((s) => get(`int:${s.id}`) === "synced" || s.status === "Healthy").length;
  const records = INTEGRATIONS.reduce((sum, s) => sum + s.records, 0);
  const lowRisk = open.filter((i) => i.severity === "low" || i.severity === "medium");

  function applyFix(issue: MasterDataIssue) {
    pipeline.start(
      ["Validate the change against the source record", `Write to ${issue.system}`, "Read back and verify", "Log the change with before and after values"],
      () => {
        set(`md:${issue.id}`, "fixed");
        toast(`${issue.id} fixed in ${issue.system}: ${issue.fix.toLowerCase()}.`);
      },
      560,
    );
  }

  const columns: Column<MasterDataIssue>[] = [
    { key: "id", header: "Issue", card: "title", value: (i) => i.id, render: (i) => <span className="tabular whitespace-nowrap text-primary">{i.id}</span> },
    { key: "system", header: "System", value: (i) => i.system, render: (i) => <span className="whitespace-nowrap">{i.system}</span> },
    { key: "object", header: "Object", hide: "md", value: (i) => i.object, render: (i) => <span className="whitespace-nowrap">{i.object}</span> },
    { key: "record", header: "Record", value: (i) => i.record, render: (i) => <span className="tabular whitespace-nowrap">{i.record}</span> },
    { key: "issue", header: "What is wrong", value: (i) => i.issue, render: (i) => <span className="block max-w-[320px] truncate" title={i.issue}>{i.issue}</span> },
    { key: "impact", header: "Impact", hide: "lg", value: (i) => i.impact, render: (i) => <span className="block max-w-[260px] truncate" title={i.impact}>{i.impact}</span> },
    { key: "severity", header: "Severity", value: (i) => i.severity, render: (i) => <RiskBadge risk={i.severity} /> },
    { key: "state", header: "State", value: (i) => (fixed(i) ? "fixed" : "open"), render: (i) => <StatusBadge tone={fixed(i) ? "success" : "warning"}>{fixed(i) ? "fixed" : "open"}</StatusBadge> },
  ];

  return (
    <>
      <PageHeader
        title="Integrations"
        description="Sync health for the systems this app reads, and the master-data errors that make MRP, invoices and awards go wrong."
        mark={<KMark id="mark-integrations" size={44} />}
        actions={
          <Btn
            onClick={() => {
              if (!lowRisk.length) {
                toast("No low or medium severity issues are open.", "info");
                return;
              }
              setMany(Object.fromEntries(lowRisk.map((i) => [`md:${i.id}`, "fixed"])));
              toast(`${lowRisk.length} low and medium severity fixes applied. High severity fixes need a person to open each one.`);
            }}
          >
            Apply low-risk fixes · {lowRisk.length}
          </Btn>
        }
      />

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiTile label="Systems connected" value={String(INTEGRATIONS.length)} hint={`${compact(records)} records mirrored`} mark={<KMark id="mark-integrations" size={32} />} />
            <KpiTile label="Healthy" value={`${healthy} of ${INTEGRATIONS.length}`} hint="synced inside their window" tone={healthy === INTEGRATIONS.length ? "success" : "warning"} delta={healthy === INTEGRATIONS.length ? "all in step" : `${INTEGRATIONS.length - healthy} need attention`} mark={<KMark id="mark-readiness" size={32} />} />
            <KpiTile label="Master-data issues" value={String(open.length)} hint={`${open.filter((i) => i.severity === "high").length} high severity`} tone={open.length ? "warning" : "success"} delta={open.length ? "open" : "clear"} mark={<KMark id="mark-bom" size={32} />} />
            <KpiTile label="Fixed this session" value={String(MASTER_DATA_ISSUES.length - open.length)} hint="written back to source" mark={<KMark id="mark-approval" size={32} />} />
          </KpiGrid>

          {get("int:INT-MKT") !== "synced" ? (
            <Callout label="Stale feed" tone="warning">
              Component market data has not synced since 10 Oct 23:40. Lifecycle notices, lead times and distributor stock on the Lifecycle Watch page are
              34 hours old. Reconnect below before acting on a last-time-buy quantity.
            </Callout>
          ) : null}

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {INTEGRATIONS.map((system) => (
              <SystemCard key={system.id} system={system} />
            ))}
          </div>

          <Panel title={`Master-data issues · ${rows.length}`} padded={false}>
            <div className="border-b border-muted p-3">
              <FilterChips
                options={[
                  { id: "open", label: "Open", count: open.length },
                  { id: "fixed", label: "Fixed", count: MASTER_DATA_ISSUES.length - open.length },
                  { id: "all", label: "All", count: MASTER_DATA_ISSUES.length },
                ]}
                value={filter}
                onChange={setFilter}
              />
            </div>
            <DataTable
              rows={rows}
              columns={columns}
              rowKey={(i) => i.id}
              onRowClick={(i) => select(i.id)}
              isRowSelected={(i) => i.id === selectedId}
              exportName="kraya-master-data-issues"
              searchPlaceholder="Search records and systems"
              defaultSort={{ key: "severity", dir: "asc" }}
              emptyTitle={filter === "open" ? "No open master-data issues" : "Nothing here yet"}
              emptyDetail={filter === "open" ? "Every record matches its source." : undefined}
              pageSize={12}
            />
          </Panel>
        </Stack>
      </PageBody>

      <Drawer
        open={Boolean(selected)}
        onClose={() => select(null)}
        title={selected?.id ?? ""}
        subtitle={selected ? `${selected.system} · ${selected.object} · ${selected.record}` : undefined}
        badge={selected ? <StatusBadge tone={fixed(selected) ? "success" : "warning"}>{fixed(selected) ? "fixed" : "open"}</StatusBadge> : undefined}
        footer={
          selected ? (
            fixed(selected) ? (
              <Btn onClick={() => { set(`md:${selected.id}`, "open"); toast(`${selected.id} reopened.`, "info"); }}>Reopen</Btn>
            ) : (
              <>
                <Btn variant="primary" onClick={() => applyFix(selected)} disabled={pipeline.running}>Apply fix in {selected.system}</Btn>
                <Btn onClick={() => toast(`${selected.id} assigned to the master-data steward for ${selected.system}.`, "info")}>Assign to data steward</Btn>
              </>
            )
          ) : null
        }
      >
        {selected ? (
          <>
            <Field label="What is wrong">{selected.issue}</Field>
            <Field label="Impact if left">{selected.impact}</Field>
            <Callout label="Proposed fix" tone={fixed(selected) ? "success" : "neutral"}>{selected.fix}</Callout>
            <div className="flex items-center gap-2">
              <Label>Severity</Label>
              <RiskBadge risk={selected.severity} />
            </div>
            <PipelineSteps run={pipeline.run} />
            <p className="text-caption text-quaternary">
              The fix is written to the source system, not to this app, and logged with before and after values. High severity fixes are applied one at a
              time by a named person.
            </p>
          </>
        ) : null}
      </Drawer>
    </>
  );
}
