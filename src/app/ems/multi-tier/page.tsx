"use client";

/**
 * Multi-tier visibility.
 *
 * Answers: behind each critical part, who supplies the supplier, and where
 * does one site or one process carry the whole chain.
 */

import { Eye, MapPin, Send, TriangleAlert } from "lucide-react";
import { useState } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Btn, Callout, Drawer, Field, KMark, KpiGrid, Label, LinkBtn, RecordLink, Stack, useSelection } from "@/components/kraya/kit";
import { DataTable, type Column } from "@/components/ui/data-table";
import { KpiTile, Panel, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { TIER_CHAINS } from "@/lib/kraya/data";
import { programLabel, supplierById } from "@/lib/kraya/selectors";
import type { TierChain, TierNode } from "@/lib/kraya/types";

function flatten(node: TierNode): TierNode[] {
  return [node, ...(node.children ?? []).flatMap(flatten)];
}

interface SpofRow {
  key: string;
  chain: TierChain;
  node: TierNode;
}

const ALL_NODES = TIER_CHAINS.flatMap((chain) => flatten(chain.root).map((node) => ({ key: `${chain.id}:${node.id}`, chain, node })));
const SPOF_ROWS: SpofRow[] = ALL_NODES.filter((row) => row.node.spof);

const WATCH: Record<string, { label: string; tone: StatusTone }> = {
  none: { label: "Not watched", tone: "neutral" },
  disclosure: { label: "Disclosure requested", tone: "info" },
  watch: { label: "On risk watch", tone: "warning" },
};

const TIER_LABEL: Record<number, string> = { 1: "Tier 1 · we buy from", 2: "Tier 2 · their supplier", 3: "Tier 3 · sub-tier" };

export default function MultiTierPage() {
  const { get, set, clear } = useKraya();
  const toast = useToast();
  const [chainParam, selectChain] = useSelection("chain");
  const [node, setNode] = useState<TierNode | null>(null);

  const chain = TIER_CHAINS.find((c) => c.id === chainParam) ?? TIER_CHAINS[0];
  const watchState = (id: string) => get(`tier:${id}`, "none");

  const subTier = ALL_NODES.filter((row) => row.node.tier > 1).length;
  const hidden = SPOF_ROWS.filter((row) => row.node.tier > 1).length;
  const watched = SPOF_ROWS.filter((row) => watchState(row.node.id) !== "none").length;

  function nodeCard(item: TierNode) {
    const state = watchState(item.id);
    return (
      <button
        type="button"
        onClick={() => setNode(item)}
        className={`flex w-52 shrink-0 flex-col gap-1 rounded-lg border px-3 py-2.5 text-left outline-none transition-colors duration-[180ms] focus-visible:ring-2 focus-visible:ring-active ${item.spof ? "border-error-stroke bg-error-surface hover:border-default" : "border-muted bg-page hover:border-default hover:bg-raised"}`}
      >
        <span className="text-caption tracking-[0.08em] text-quaternary uppercase">Tier {item.tier}</span>
        <span className="text-body-md font-medium text-primary">{item.name}</span>
        <span className="text-body-sm text-tertiary">{item.role}</span>
        <span className="flex items-center gap-1 text-caption text-quaternary">
          <MapPin size={11} strokeWidth={1.75} aria-hidden className="shrink-0" />
          <span className="truncate">{item.location}</span>
        </span>
        {item.spof ? (
          <span className="mt-0.5 flex items-center gap-1 text-caption font-medium text-error">
            <TriangleAlert size={12} strokeWidth={1.75} aria-hidden className="shrink-0" />
            Single point of failure
          </span>
        ) : null}
        {item.note ? <span className="text-caption text-tertiary">{item.note}</span> : null}
        {state !== "none" ? <span className="text-caption text-info">{WATCH[state].label}</span> : null}
      </button>
    );
  }

  function branch(item: TierNode) {
    return (
      <div className="flex items-start">
        {nodeCard(item)}
        {item.children?.length ? (
          <>
            <span aria-hidden className="mt-7 h-px w-5 shrink-0 bg-[var(--stroke-default)]" />
            <div className="flex flex-col gap-3 border-l border-default">
              {item.children.map((child) => (
                <div key={child.id} className="flex items-start">
                  <span aria-hidden className="mt-7 h-px w-5 shrink-0 bg-[var(--stroke-default)]" />
                  {branch(child)}
                </div>
              ))}
            </div>
          </>
        ) : null}
      </div>
    );
  }

  const columns: Column<SpofRow>[] = [
    { key: "part", header: "Part", card: "title", value: (r) => r.chain.pn, render: (r) => <span className="tabular whitespace-nowrap text-primary">{r.chain.pn}</span> },
    { key: "node", header: "Node", value: (r) => r.node.name, render: (r) => <span className="whitespace-nowrap">{r.node.name}</span> },
    { key: "role", header: "Does", hide: "md", value: (r) => r.node.role, render: (r) => <span className="block max-w-[220px] truncate" title={r.node.role}>{r.node.role}</span> },
    { key: "tier", header: "Tier", align: "right", card: "metric", value: (r) => r.node.tier, render: (r) => <span className="tabular">{r.node.tier}</span> },
    { key: "location", header: "Location", value: (r) => r.node.location, render: (r) => <span className="whitespace-nowrap">{r.node.location}</span> },
    { key: "note", header: "Why it matters", hide: "lg", value: (r) => r.node.note ?? "", render: (r) => <span className="block max-w-[280px] truncate" title={r.node.note}>{r.node.note ?? "—"}</span> },
    { key: "watch", header: "Watch", value: (r) => watchState(r.node.id), render: (r) => <StatusBadge tone={WATCH[watchState(r.node.id)]?.tone ?? "neutral"}>{WATCH[watchState(r.node.id)]?.label ?? "Not watched"}</StatusBadge> },
  ];

  const nodeState = node ? watchState(node.id) : "none";
  const nodeSupplier = node && node.id.startsWith("SUP-") ? supplierById(node.id) : undefined;

  return (
    <>
      <PageHeader
        title="Multi-tier Visibility"
        description="The chain behind each critical part, from the supplier we pay to the fabs, glass and laminate behind them, with every single point of failure marked."
        mark={<KMark id="mark-multi-tier" size={44} />}
        actions={<LinkBtn href="/supplier-risk">Supplier risk</LinkBtn>}
      />

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiTile label="Critical parts mapped" value={String(TIER_CHAINS.length)} hint="long-lead or single-source" mark={<KMark id="mark-multi-tier" />} />
            <KpiTile label="Sub-tier nodes" value={String(subTier)} hint="tier 2 and tier 3 sites" />
            <KpiTile label="Single points of failure" value={String(SPOF_ROWS.length)} hint={`${watched} watched or disclosure requested`} tone="error" delta={`${SPOF_ROWS.length - watched} unwatched`} />
            <KpiTile label="Hidden behind tier 1" value={String(hidden)} hint="at tier 2 or 3, not on any PO" tone="warning" />
          </KpiGrid>

          <div className="flex flex-col gap-4 xl:flex-row">
            <div className="min-w-0 xl:w-[300px] xl:shrink-0">
              <Panel title="Critical parts" padded={false}>
                <ul className="flex flex-col overflow-y-auto">
                  {TIER_CHAINS.map((item) => {
                    const count = flatten(item.root).filter((n) => n.spof).length;
                    const selected = item.id === chain.id;
                    return (
                      <li key={item.id} className="border-b border-muted last:border-b-0">
                        <button
                          type="button"
                          aria-pressed={selected}
                          onClick={() => selectChain(item.id)}
                          className={`flex w-full flex-col gap-0.5 px-4 py-2.5 text-left outline-none transition-colors duration-[150ms] hover:bg-raised focus-visible:bg-raised ${selected ? "bg-raised" : ""}`}
                        >
                          <span className="flex items-baseline justify-between gap-2">
                            <span className="tabular text-body-md text-primary">{item.pn}</span>
                            <span className={`shrink-0 text-caption tabular ${count ? "text-error" : "text-quaternary"}`}>{count} SPOF</span>
                          </span>
                          <span className="truncate text-body-sm text-tertiary">{item.description}</span>
                          <span className="truncate text-caption text-quaternary">{item.programIds.map(programLabel).join(" · ")}</span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </div>

            <div className="min-w-0 flex-1">
              <Panel title={`Dependency map · ${chain.pn} ${chain.description}`} padded={false} action={<span className="text-caption text-quaternary">select a node</span>}>
                <div className="overflow-x-auto p-4">
                  <div className="mb-3 flex min-w-max gap-5">
                    {[1, 2, 3].map((tier) => (
                      <span key={tier} className="w-52 shrink-0 text-caption tracking-[0.08em] text-quaternary uppercase" style={{ marginRight: tier < 3 ? 20 : 0 }}>
                        {TIER_LABEL[tier]}
                      </span>
                    ))}
                  </div>
                  <div className="min-w-max">
                    {branch(chain.root)}
                  </div>
                </div>
              </Panel>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Callout tone="warning" label="Exposure">
              {chain.exposure}
              <span className="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-body-sm">
                <span className="text-quaternary">Affects</span>
                {chain.programIds.map((id) => (
                  <RecordLink key={id} href={`/programs/${id}`}>
                    {programLabel(id)}
                  </RecordLink>
                ))}
              </span>
            </Callout>
            <Callout label="Recommended action">
              {chain.action}
              <span className="mt-1.5 block text-caption text-quaternary">Drafted by the Risk Monitoring Agent from supplier disclosures and notices. The commodity buyer decides.</span>
            </Callout>
          </div>

          <Panel title={`Single points of failure across all chains · ${SPOF_ROWS.length}`} padded={false}>
            <DataTable
              rows={SPOF_ROWS}
              columns={columns}
              rowKey={(r) => r.key}
              onRowClick={(r) => {
                selectChain(r.chain.id);
                setNode(r.node);
              }}
              defaultSort={{ key: "tier", dir: "desc" }}
              exportName="kraya-sub-tier-spof"
              searchPlaceholder="Search nodes, parts, locations"
            />
          </Panel>
        </Stack>
      </PageBody>

      {node ? (
        <Drawer
          open
          onClose={() => setNode(null)}
          title={node.name}
          subtitle={node.role}
          badge={
            <>
              <StatusBadge tone="neutral">Tier {node.tier}</StatusBadge>
              {node.spof ? <StatusBadge tone="error">Single point of failure</StatusBadge> : null}
            </>
          }
          footer={
            <>
              <Btn
                variant="primary"
                icon={Send}
                disabled={nodeState === "disclosure"}
                onClick={() => {
                  set(`tier:${node.id}`, "disclosure");
                  toast(`Sub-tier disclosure requested for ${node.name} through ${chain.root.name}. Reply due in 10 working days.`, "info");
                }}
              >
                {nodeState === "disclosure" ? "Disclosure requested" : "Request sub-tier disclosure"}
              </Btn>
              <Btn
                icon={Eye}
                disabled={nodeState === "watch"}
                onClick={() => {
                  set(`tier:${node.id}`, "watch");
                  toast(`${node.name} added to the risk watch. The Risk Monitoring Agent will track news, weather and capacity signals for ${node.location}.`);
                }}
              >
                {nodeState === "watch" ? "On risk watch" : "Add to risk watch"}
              </Btn>
              {nodeState !== "none" ? (
                <Btn variant="ghost" onClick={() => clear(`tier:${node.id}`)}>
                  Reset
                </Btn>
              ) : null}
            </>
          }
        >
          <div className="grid grid-cols-2 gap-3">
            <Field label="Location">{node.location}</Field>
            <Field label="Position">{TIER_LABEL[node.tier]}</Field>
            <Field label="Part">
              <span className="tabular">{chain.pn}</span> · {chain.description}
            </Field>
            <Field label="Watch state">{WATCH[nodeState]?.label ?? "Not watched"}</Field>
          </div>
          {node.note ? <Callout tone={node.spof ? "error" : "neutral"} label={node.spof ? "Why it is a single point of failure" : "Note"}>{node.note}</Callout> : null}
          {node.tier > 1 ? (
            <p className="text-body-sm text-tertiary">
              Auralis has no contract with this site. Everything known about it comes through {chain.root.name}, so any action goes through that account.
            </p>
          ) : null}
          {node.children?.length ? (
            <div>
              <Label>Depends on</Label>
              <ul className="mt-1 flex flex-col gap-1">
                {node.children.map((child) => (
                  <li key={child.id}>
                    <button type="button" onClick={() => setNode(child)} className="flex w-full items-baseline justify-between gap-3 rounded-md px-1.5 py-1 text-left outline-none transition-colors duration-[150ms] hover:bg-raised focus-visible:ring-2 focus-visible:ring-active">
                      <span className="min-w-0 truncate text-body-sm text-secondary">
                        {child.name} · {child.role}
                      </span>
                      {child.spof ? <span className="shrink-0 text-caption text-error">SPOF</span> : null}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
          <div>
            <Label>Programs exposed</Label>
            <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-body-sm">
              {chain.programIds.map((id) => (
                <RecordLink key={id} href={`/programs/${id}`}>
                  {programLabel(id)}
                </RecordLink>
              ))}
            </div>
          </div>
          {nodeSupplier ? (
            <Callout label="Supplier scorecard">
              <RecordLink href={`/suppliers/${nodeSupplier.id}`}>{nodeSupplier.name}</RecordLink> · OTD {nodeSupplier.otd}% · quality {nodeSupplier.quality} · {nodeSupplier.risk} risk
            </Callout>
          ) : null}
        </Drawer>
      ) : null}
    </>
  );
}
