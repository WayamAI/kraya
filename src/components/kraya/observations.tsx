"use client";

/**
 * Agent observations. Not a chat: an observation, its cause, the evidence it
 * rests on, a confidence, a recommended action and the person who signs it.
 * Each card reads live state, so it resolves itself once the action is taken.
 */

import { Check } from "lucide-react";

import { useToast } from "@/components/ui/toast";
import { useKraya } from "@/lib/kraya/context";
import { PURCHASE_ORDERS } from "@/lib/kraya/data";
import { inrL } from "@/lib/kraya/format";
import { allocationState, poView, riskState, type Status } from "@/lib/kraya/selectors";

import { Btn, Callout, Confidence, Evidence, KMark, Label, LinkBtn, SignOff } from "./kit";

interface Observation {
  id: string;
  programId: string;
  observation: string;
  cause: string;
  evidence: string[];
  confidence: number;
  impact: string;
  recommendation: string;
  signOff: string;
  actionLabel: string;
  recordHref: string;
  recordLabel: string;
  resolved: (s: Status) => boolean;
  resolvedText: string;
}

const PO_087 = PURCHASE_ORDERS.find((po) => po.id === "PO-2026-087");

export const OBSERVATIONS: Observation[] = [
  {
    id: "OBS-1", programId: "PGM-2026-001",
    observation: "The Varuna camera PPAP build will start 18 days late.",
    cause: "The image sensor order (PO-2026-087) was re-promised to 18 Dec. Every other long-lead part for the build lands by 30 Nov.",
    evidence: ["PO-2026-087: promised 18 Dec, needed 30 Nov", "Nexora has offered a priority lot that recovers 20 days for ₹3.2L", "PPAP-0142 cannot close without production samples from this order"],
    confidence: 88, impact: "18 days on a 126-day runway to SOP",
    recommendation: "Pay the ₹3.2L expedite fee. It is inside buyer authority and brings the sensor in two days ahead of the need date.",
    signOff: "Arjun Bhatia", actionLabel: "Expedite PO-2026-087", recordHref: "/purchase-orders?po=PO-2026-087", recordLabel: "Open PO",
    resolved: (s) => (PO_087 ? poView(s, PO_087).lateDays === 0 : true),
    resolvedText: "Expedited. The sensor now lands before the need date.",
  },
  {
    id: "OBS-2", programId: "PGM-2026-002",
    observation: "The Tejas BMS ramp is short by 18,000 cell monitor ICs between December and February.",
    cause: "Cellguard Analog is confirming 70% of demand. The 200 mm fab that runs this part is sold out to March.",
    evidence: ["Allocation letter CG-AL-2291 dated 18 Sep", "Ramp needs 60,000 pieces by end Feb; 42,000 confirmed", "Franchised distributor holds 31,400 pieces with traceable date codes"],
    confidence: 86, impact: `${inrL(58.6)} bridge buy against a ${inrL(6840)} a year program`,
    recommendation: "Reserve 24,000 pieces at the franchised distributor at a 9% premium. Do not use brokers: the last broker reel failed boundary scan.",
    signOff: "Meenakshi Rao", actionLabel: "Accept bridge-buy plan", recordHref: "/supplier-risk?risk=RSK-06", recordLabel: "Open risk",
    resolved: (s) => riskState(s, "RSK-06") === "mitigating" || riskState(s, "RSK-06") === "closed",
    resolvedText: "Mitigation accepted. Bridge buy is in progress.",
  },
  {
    id: "OBS-3", programId: "PGM-2026-002",
    observation: "Kaveri SMT Systems cannot build the BMS at volume from February.",
    cause: "Kaveri's three lines carry 28,000 to 30,000 boards of other products. Adding 20,000 BMS boards exceeds the 44,000 capacity.",
    evidence: ["Shortfall of 4,000 to 5,000 boards a month from Feb 2027", "Marina Precision Electronics runs at 54% with coating, potting and ICT / FCT", "Kaveri has no ISO 26262 process assessment (audit finding AF-104)"],
    confidence: 85, impact: "8 months over capacity on a program that reaches SOP on 7 Dec",
    recommendation: "Move 8,000 BMS boards a month to Marina from February. One-time transfer cost is ₹4.8L.",
    signOff: "Meenakshi Rao", actionLabel: "Accept allocation ALC-01", recordHref: "/ems/capacity", recordLabel: "Open capacity plan",
    resolved: (s) => allocationState(s, "ALC-01") === "accepted",
    resolvedText: "Allocation accepted. Kaveri is back under capacity.",
  },
];

export function ObservationCard({ item }: { item: Observation }) {
  const { status, expeditePo, setRisk, decideAllocation, get, set } = useKraya();
  const toast = useToast();
  const resolved = item.resolved(status);
  const dismissed = get(`obs:${item.id}`) === "dismissed";

  function act() {
    if (item.id === "OBS-1") expeditePo("PO-2026-087");
    if (item.id === "OBS-2") setRisk("RSK-06", "mitigating", "Arjun Bhatia");
    if (item.id === "OBS-3") decideAllocation("ALC-01", "accepted");
    toast(`${item.actionLabel}: done. Readiness for ${item.programId} and the exception queue were recalculated.`);
  }

  if (dismissed && !resolved) {
    return (
      <article className="flex items-center justify-between gap-3 rounded-lg border border-muted bg-container px-4 py-3">
        <p className="min-w-0 truncate text-body-sm text-tertiary">Dismissed: {item.observation}</p>
        <Btn variant="ghost" onClick={() => set(`obs:${item.id}`, "open")}>Restore</Btn>
      </article>
    );
  }

  return (
    <article className="flex min-w-0 flex-col gap-3 rounded-lg border border-muted bg-container p-4">
      <div className="flex items-start gap-3">
        <KMark id="mark-observation" size={32} className="mt-0.5" />
        <div className="min-w-0 flex-1">
          <Label>Observation · {item.programId}</Label>
          <p className="mt-1 text-body-md text-primary">{item.observation}</p>
        </div>
      </div>

      <div>
        <Label>Cause</Label>
        <p className="mt-1 text-body-md text-secondary">{item.cause}</p>
      </div>

      <Evidence items={item.evidence} />

      <div className="flex flex-wrap items-end justify-between gap-4">
        <Confidence value={item.confidence} />
        <div className="min-w-0 text-right">
          <Label>At stake</Label>
          <p className="mt-0.5 text-body-md text-warning">{item.impact}</p>
        </div>
      </div>

      <Callout label="Recommendation">{item.recommendation}</Callout>

      {resolved ? (
        <p className="inline-flex items-center gap-1.5 text-body-sm text-success">
          <Check size={13} strokeWidth={1.75} aria-hidden />
          {item.resolvedText}
        </p>
      ) : (
        <div className="flex flex-wrap items-center gap-2">
          <Btn variant="primary" onClick={act}>{item.actionLabel}</Btn>
          <LinkBtn href={item.recordHref}>{item.recordLabel}</LinkBtn>
          <Btn variant="ghost" onClick={() => set(`obs:${item.id}`, "dismissed")}>Dismiss</Btn>
        </div>
      )}
      <SignOff name={item.signOff} note={resolved ? "recorded this session" : "agent proposes, a person decides"} />
    </article>
  );
}
