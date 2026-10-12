"use client";

/**
 * Agents. What each agent does, what it did today, what it wants a person to
 * approve, and the rules that bound it. Approving a proposal applies its
 * effect to the record, so readiness and the exception queue move with it.
 */

import { Check, Lock, Pause, Play, X } from "lucide-react";
import { useState } from "react";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import {
  Btn,
  Callout,
  Confidence,
  Evidence,
  KMark,
  KpiGrid,
  Label,
  LinkBtn,
  PipelineSteps,
  RecordLink,
  SignOff,
  Stack,
  usePipeline,
} from "@/components/kraya/kit";
import { FilterChips } from "@/components/ui/data-table";
import { EmptyState, KpiTile, Panel, Select, StatusBadge, type StatusTone } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { AGENTS, AGENT_EVENTS, APPROVALS, POLICIES } from "@/lib/kraya/data";
import { inrL } from "@/lib/kraya/format";
import type { Approval } from "@/lib/kraya/types";

const TABS = [
  { id: "approvals", label: "Approvals inbox" },
  { id: "roster", label: "Roster" },
  { id: "activity", label: "Activity" },
  { id: "governance", label: "Governance" },
];

const OUTCOME: Record<string, { label: string; tone: StatusTone }> = {
  auto: { label: "done within policy", tone: "success" },
  queued: { label: "queued for a person", tone: "info" },
  blocked: { label: "blocked by policy", tone: "warning" },
};

const REJECT_REASONS = ["Evidence is incomplete", "Commercially not acceptable", "Timing is wrong", "Handled outside the system"];

const agentName = (id: string) => AGENTS.find((a) => a.id === id)?.name ?? id;
const time = (iso: string) => `${iso.slice(8, 10)} Oct, ${iso.slice(11)}`;

function ApprovalCard({ approval }: { approval: Approval }) {
  const { get, set, applyEffect } = useKraya();
  const toast = useToast();
  const pipeline = usePipeline();
  const [reason, setReason] = useState(REJECT_REASONS[0]);
  const [rejecting, setRejecting] = useState(false);
  const decision = get(`approval:${approval.id}`);
  const agent = AGENTS.find((a) => a.id === approval.agentId);
  const hasEffect = approval.effect.kind !== "none";

  function approve() {
    pipeline.start(
      ["Check the proposal against governance policy", `Record sign-off by ${approval.approver}`, hasEffect ? "Apply the change to the record" : "Notify the requester", "Write the audit entry"],
      () => {
        applyEffect(approval.effect);
        set(`approval:${approval.id}`, "approved");
        toast(hasEffect ? `${approval.id} approved. The record is updated; readiness and the exception queue were recalculated.` : `${approval.id} approved and logged under ${approval.approver}.`);
      },
      560,
    );
  }

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-lg border border-muted bg-container p-4">
      <div className="flex items-start gap-3">
        <KMark id={agent?.markId ?? "mark-approval"} size={32} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <Label>{approval.id} · {agentName(approval.agentId)}</Label>
            {decision ? <StatusBadge tone={decision === "approved" ? "success" : "neutral"}>{decision}</StatusBadge> : <StatusBadge tone="info">awaiting sign-off</StatusBadge>}
          </div>
          <p className="mt-1 text-body-md text-primary">{approval.title}</p>
          <p className="mt-0.5 text-body-sm text-secondary">{approval.detail}</p>
        </div>
        <div className="shrink-0 text-right">
          <Label>Value</Label>
          <p className="font-display text-display-base tabular text-primary">{inrL(approval.valueL)}</p>
        </div>
      </div>

      <Evidence items={approval.evidence} />

      <div className="flex flex-wrap items-end justify-between gap-3">
        <Confidence value={approval.confidence} />
        <p className="min-w-0 text-caption text-quaternary">Policy: {approval.policy}</p>
      </div>

      <PipelineSteps run={pipeline.run} />

      {decision ? (
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="inline-flex items-center gap-1.5 text-body-sm text-secondary">
            {decision === "approved" ? <Check size={13} strokeWidth={1.75} aria-hidden className="text-success" /> : <X size={13} strokeWidth={1.75} aria-hidden className="text-tertiary" />}
            {decision === "approved" ? `Approved by ${approval.approver}` : `Rejected by ${approval.approver}: ${get(`approval:${approval.id}:reason`, "no reason given").toLowerCase()}`}
          </p>
          <LinkBtn href={approval.href}>Open record</LinkBtn>
        </div>
      ) : rejecting ? (
        <div className="flex flex-wrap items-center gap-2">
          <Select value={reason} onChange={(event) => setReason(event.target.value)} aria-label="Reason" className="h-8 rounded-full border border-muted bg-action text-label-sm text-secondary">
            {REJECT_REASONS.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </Select>
          <Btn
            variant="primary"
            onClick={() => {
              set(`approval:${approval.id}:reason`, reason);
              set(`approval:${approval.id}`, "rejected");
              setRejecting(false);
              toast(`${approval.id} rejected. The agent will not repeat this proposal without new evidence.`, "info");
            }}
          >
            Confirm rejection
          </Btn>
          <Btn variant="ghost" onClick={() => setRejecting(false)}>Cancel</Btn>
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="primary" icon={Check} onClick={approve} disabled={pipeline.running}>Approve</Btn>
          <Btn icon={X} onClick={() => setRejecting(true)} disabled={pipeline.running}>Reject</Btn>
          <LinkBtn href={approval.href} variant="ghost">Open record</LinkBtn>
        </div>
      )}
      <SignOff name={approval.approver} note="the agent proposes; this person decides" />
    </article>
  );
}

export default function AgentsPage() {
  const { get, set } = useKraya();
  const toast = useToast();
  const [tab, setTab] = useState("approvals");
  const [inbox, setInbox] = useState("pending");
  const [agentFilter, setAgentFilter] = useState("all");

  const pending = APPROVALS.filter((a) => !get(`approval:${a.id}`));
  const decided = APPROVALS.filter((a) => get(`approval:${a.id}`));
  const shownApprovals = inbox === "pending" ? pending : decided;
  const runs = AGENTS.reduce((sum, a) => sum + a.runsPerDay, 0);
  const modeOf = (id: string, base: string) => get(`agent:${id}:mode`, base);
  const autonomous = AGENTS.filter((a) => modeOf(a.id, a.mode) === "Autonomous").length;
  const paused = AGENTS.filter((a) => get(`agent:${a.id}:paused`) === "1").length;
  const events = agentFilter === "all" ? AGENT_EVENTS : AGENT_EVENTS.filter((e) => e.agentId === agentFilter);
  const pendingValue = pending.filter((a) => a.valueL < 1000).reduce((sum, a) => sum + a.valueL, 0);

  return (
    <>
      <PageHeader
        title="Agents"
        description="Eight agents work the source-to-pay cycle. They act alone only inside the policies below; everything else waits here for a named person."
        mark={<KMark id="mark-agents" size={44} />}
      >
        <FilterChips
          options={TABS.map((t) => ({ ...t, count: t.id === "approvals" ? pending.length : t.id === "roster" ? AGENTS.length : t.id === "activity" ? AGENT_EVENTS.length : POLICIES.length }))}
          value={tab}
          onChange={setTab}
        />
      </PageHeader>

      <PageBody>
        <Stack>
          <KpiGrid>
            <KpiTile label="Awaiting sign-off" value={String(pending.length)} hint={`${inrL(pendingValue)} in buying decisions`} tone={pending.length ? "warning" : "success"} delta={pending.length ? "needs a person" : "inbox clear"} mark={<KMark id="mark-approval" size={32} />} />
            <KpiTile label="Agent runs / day" value={String(runs)} hint={`${AGENTS.length} agents${paused ? `, ${paused} paused` : ""}`} mark={<KMark id="mark-agents" size={32} />} />
            <KpiTile label="Autonomous agents" value={`${autonomous} of ${AGENTS.length}`} hint="the rest are human-in-loop" mark={<KMark id="mark-copilot" size={32} />} />
            <KpiTile label="Blocked by policy" value={String(AGENT_EVENTS.filter((e) => e.outcome === "blocked").length)} hint="in the last 48 hours" mark={<KMark id="mark-contract" size={32} />} />
          </KpiGrid>

          {tab === "approvals" ? (
            <>
              <div className="flex flex-wrap items-center justify-between gap-3">
                <FilterChips
                  options={[
                    { id: "pending", label: "Awaiting sign-off", count: pending.length },
                    { id: "decided", label: "Decided this session", count: decided.length },
                  ]}
                  value={inbox}
                  onChange={setInbox}
                />
                <p className="text-caption text-quaternary">Sorted as the agents raised them. Approving applies the change to the record.</p>
              </div>
              {shownApprovals.length === 0 ? (
                <Panel>
                  <EmptyState
                    title={inbox === "pending" ? "Inbox clear" : "Nothing decided yet this session"}
                    detail={inbox === "pending" ? "Every agent proposal has a decision recorded against a named approver." : "Approve or reject a proposal and it moves here."}
                    mark={<KMark id="mark-approval" size={64} />}
                  />
                </Panel>
              ) : (
                <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
                  {shownApprovals.map((approval) => (
                    <ApprovalCard key={approval.id} approval={approval} />
                  ))}
                </div>
              )}
            </>
          ) : null}

          {tab === "roster" ? (
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-4">
              {AGENTS.map((agent) => {
                const mode = modeOf(agent.id, agent.mode);
                const isPaused = get(`agent:${agent.id}:paused`) === "1";
                return (
                  <article key={agent.id} className="flex min-w-0 flex-col gap-3 rounded-lg border border-muted bg-container p-4">
                    <div className="flex items-start justify-between gap-2">
                      <KMark id={agent.markId} size={36} />
                      <StatusBadge tone={isPaused ? "neutral" : mode === "Autonomous" ? "info" : "success"}>{isPaused ? "paused" : mode}</StatusBadge>
                    </div>
                    <div className="min-w-0">
                      <p className="text-body-md font-medium text-primary">{agent.name}</p>
                      <p className="mt-0.5 text-body-sm text-tertiary">{agent.purpose}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label>Runs / day</Label>
                        <p className="font-display text-display-lg tabular text-primary">{isPaused ? 0 : agent.runsPerDay}</p>
                      </div>
                      <Confidence value={agent.confidence} label="Avg confidence" />
                    </div>
                    <div className="min-w-0">
                      <Label>Last action · {time(agent.lastRun)}</Label>
                      <p className="mt-0.5 text-body-sm text-secondary">{agent.lastAction}</p>
                    </div>
                    <div className="mt-auto flex flex-wrap items-center gap-2">
                      <Btn
                        icon={isPaused ? Play : Pause}
                        onClick={() => {
                          set(`agent:${agent.id}:paused`, isPaused ? "0" : "1");
                          toast(isPaused ? `${agent.name} resumed.` : `${agent.name} paused. Queued proposals stay in the inbox.`, "info");
                        }}
                      >
                        {isPaused ? "Resume" : "Pause"}
                      </Btn>
                      <Btn
                        variant="ghost"
                        onClick={() => {
                          const next = mode === "Autonomous" ? "Human-in-loop" : "Autonomous";
                          if (next === "Autonomous" && (agent.id === "AGT-CTR" || agent.id === "AGT-BID")) {
                            toast(`${agent.name} cannot run autonomously: policy ${agent.id === "AGT-CTR" ? "P-02" : "P-03"} is locked.`, "warning");
                            return;
                          }
                          set(`agent:${agent.id}:mode`, next);
                          toast(`${agent.name} set to ${next.toLowerCase()}.`, "info");
                        }}
                      >
                        {mode === "Autonomous" ? "Require approval" : "Make autonomous"}
                      </Btn>
                    </div>
                  </article>
                );
              })}
            </div>
          ) : null}

          {tab === "activity" ? (
            <Panel
              title={`Activity · ${events.length}`}
              padded={false}
              action={
                <Select value={agentFilter} onChange={(event) => setAgentFilter(event.target.value)} aria-label="Agent" className="h-7 rounded-full border border-muted bg-action text-label-sm text-secondary">
                  <option value="all">All agents</option>
                  {AGENTS.map((a) => (
                    <option key={a.id} value={a.id}>{a.name}</option>
                  ))}
                </Select>
              }
            >
              {events.length === 0 ? (
                <EmptyState title="No activity from this agent in the last 48 hours" mark={<KMark id="mark-empty" size={56} />} />
              ) : (
                <ul className="flex flex-col">
                  {events.map((event) => (
                    <li key={event.id} className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1 border-b border-muted px-4 py-2.5 last:border-b-0">
                      <span className="w-24 shrink-0 text-caption tabular text-quaternary">{time(event.time)}</span>
                      <span className="w-44 shrink-0 truncate text-body-sm text-tertiary">{agentName(event.agentId)}</span>
                      <span className="min-w-[200px] flex-1 text-body-sm text-secondary">{event.text}</span>
                      <StatusBadge tone={OUTCOME[event.outcome].tone}>{OUTCOME[event.outcome].label}</StatusBadge>
                      {event.recordHref ? <RecordLink href={event.recordHref}>{event.recordLabel}</RecordLink> : <span className="text-caption text-quaternary">no record</span>}
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          ) : null}

          {tab === "governance" ? (
            <>
              <Callout label="How governance works">
                A policy says what an agent may do without a person. Locked policies are set by the head of procurement, Meenakshi Rao, and cannot be
                switched here. Every agent action, automatic or approved, is written to the audit log with the policy that allowed it.
              </Callout>
              <Panel title={`Policies · ${POLICIES.length}`} padded={false}>
                <ul className="flex flex-col">
                  {POLICIES.map((policy) => {
                    const enabled = get(`policy:${policy.id}`, policy.enabled ? "on" : "off") === "on";
                    return (
                      <li key={policy.id} className="flex min-w-0 items-center gap-3 border-b border-muted px-4 py-3 last:border-b-0">
                        <span className="w-10 shrink-0 text-caption tabular text-quaternary">{policy.id}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block text-body-md text-primary">{policy.text}</span>
                          <span className="text-caption text-quaternary">Applies to: {policy.scope}</span>
                        </span>
                        {policy.locked ? (
                          <span className="inline-flex shrink-0 items-center gap-1 text-caption text-tertiary">
                            <Lock size={12} strokeWidth={1.75} aria-hidden /> locked
                          </span>
                        ) : null}
                        <button
                          type="button"
                          role="switch"
                          aria-checked={enabled}
                          aria-label={`${policy.id} ${enabled ? "on" : "off"}`}
                          onClick={() => {
                            if (policy.locked) {
                              toast(`${policy.id} is locked. Only Meenakshi Rao can change it.`, "warning");
                              return;
                            }
                            set(`policy:${policy.id}`, enabled ? "off" : "on");
                            toast(`${policy.id} switched ${enabled ? "off: these actions now queue for approval" : "on"}.`, "info");
                          }}
                          className={`relative h-5 w-9 shrink-0 rounded-full outline-none transition-colors duration-[180ms] focus-visible:ring-2 focus-visible:ring-active ${enabled ? "bg-action-primary" : "bg-raised-2"} ${policy.locked ? "opacity-60" : ""}`}
                        >
                          <span className={`absolute top-0.5 size-4 rounded-full bg-container transition-[left] duration-[180ms] ${enabled ? "left-[18px]" : "left-0.5"}`} />
                        </button>
                        <span className="w-7 shrink-0 text-caption text-tertiary">{enabled ? "on" : "off"}</span>
                      </li>
                    );
                  })}
                </ul>
              </Panel>
            </>
          ) : null}
        </Stack>
      </PageBody>
    </>
  );
}
