"use client";

/**
 * In-session operator state shared by every page.
 *
 * One flat key/value map (see selectors.ts for the key list). Pages write a
 * key when the operator acts; selectors fold the map into readiness, risk and
 * the exception queue, so an action on one page shows up on the others.
 */

import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";

import type { Status } from "./selectors";
import type { ApprovalEffect } from "./types";

interface KrayaContextValue {
  status: Status;
  /** Read one key, with a fallback when the operator has not acted. */
  get: (key: string, fallback?: string) => string;
  set: (key: string, value: string) => void;
  setMany: (entries: Record<string, string>) => void;
  clear: (key: string) => void;
  reset: () => void;
  /** Number of actions taken this session. */
  actionCount: number;

  expeditePo: (poId: string) => void;
  repromisePo: (poId: string) => void;
  awardEvent: (eventId: string, supplierId: string) => void;
  setRisk: (riskId: string, state: "assigned" | "mitigating" | "closed", owner?: string) => void;
  setPpapElement: (ppapId: string, index: number, state: "approved" | "submitted") => void;
  decideAllocation: (allocationId: string, decision: "accepted" | "rejected") => void;
  actionNotice: (noticeId: string, decision: "actioned" | "dismissed") => void;
  setNcrStep: (ncrId: string, step: number) => void;
  /** Apply the side effect an approved agent proposal carries. */
  applyEffect: (effect: ApprovalEffect) => void;
}

const KrayaContext = createContext<KrayaContextValue | null>(null);

export function KrayaProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<Status>({});

  const set = useCallback((key: string, value: string) => {
    setStatus((current) => (current[key] === value ? current : { ...current, [key]: value }));
  }, []);

  const setMany = useCallback((entries: Record<string, string>) => {
    setStatus((current) => ({ ...current, ...entries }));
  }, []);

  const clear = useCallback((key: string) => {
    setStatus((current) => {
      if (!(key in current)) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  }, []);

  const reset = useCallback(() => setStatus({}), []);

  const value = useMemo<KrayaContextValue>(() => {
    const expeditePo = (poId: string) => set(`po:${poId}:expedite`, "1");
    const repromisePo = (poId: string) => set(`po:${poId}:repromise`, "1");
    const awardEvent = (eventId: string, supplierId: string) => set(`award:${eventId}`, supplierId);
    const setRisk: KrayaContextValue["setRisk"] = (riskId, state, owner) =>
      setMany(owner ? { [`risk:${riskId}`]: state, [`riskOwner:${riskId}`]: owner } : { [`risk:${riskId}`]: state });
    const decideAllocation: KrayaContextValue["decideAllocation"] = (id, decision) => set(`alloc:${id}`, decision);
    const actionNotice: KrayaContextValue["actionNotice"] = (id, decision) => set(`pcn:${id}`, decision);

    return {
      status,
      get: (key, fallback = "") => status[key] ?? fallback,
      set,
      setMany,
      clear,
      reset,
      actionCount: Object.keys(status).length,
      expeditePo,
      repromisePo,
      awardEvent,
      setRisk,
      setPpapElement: (ppapId, index, state) => set(`ppap:${ppapId}:${index}`, state),
      decideAllocation,
      actionNotice,
      setNcrStep: (ncrId, step) => set(`ncr:${ncrId}:step`, String(step)),
      applyEffect: (effect) => {
        switch (effect.kind) {
          case "expedite":
            expeditePo(effect.poId);
            break;
          case "award":
            awardEvent(effect.eventId, effect.supplierId);
            break;
          case "mitigate":
            setRisk(effect.riskId, "mitigating");
            break;
          case "allocate":
            decideAllocation(effect.allocationId, "accepted");
            break;
          case "lifecycle":
            actionNotice(effect.noticeId, "actioned");
            break;
          default:
            break;
        }
      },
    };
  }, [status, set, setMany, clear, reset]);

  return <KrayaContext.Provider value={value}>{children}</KrayaContext.Provider>;
}

export function useKraya(): KrayaContextValue {
  const value = useContext(KrayaContext);
  if (!value) throw new Error("useKraya must be used inside KrayaProvider");
  return value;
}
