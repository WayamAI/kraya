"use client";

import { Check, Info, TriangleAlert, X } from "lucide-react";
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";

export type ToastTone = "success" | "info" | "warning";

interface ToastItem {
  id: number;
  message: string;
  tone: ToastTone;
}

type ToastFn = (message: string, tone?: ToastTone) => void;

const ToastContext = createContext<ToastFn>(() => {});

const ICON = { success: Check, info: Info, warning: TriangleAlert } as const;
const ICON_TONE: Record<ToastTone, string> = { success: "text-success", info: "text-info", warning: "text-warning" };

/** Bottom-right confirmation stack. Every action that changes state says so here. */
export function ToastProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<ToastItem[]>([]);
  const nextId = useRef(1);

  const dismiss = useCallback((id: number) => {
    setItems((current) => current.filter((item) => item.id !== id));
  }, []);

  const toast = useCallback<ToastFn>(
    (message, tone = "success") => {
      const id = nextId.current;
      nextId.current += 1;
      setItems((current) => [...current.slice(-3), { id, message, tone }]);
      window.setTimeout(() => dismiss(id), 4200);
    },
    [dismiss],
  );

  const value = useMemo(() => toast, [toast]);

  return (
    <ToastContext.Provider value={value}>
      {children}
      <div aria-live="polite" className="pointer-events-none fixed right-4 bottom-4 z-[80] flex w-[min(calc(100vw-2rem),22rem)] flex-col gap-2">
        {items.map((item) => {
          const Icon = ICON[item.tone];
          return (
            <div key={item.id} role="status" className="pointer-events-auto flex items-start gap-2.5 rounded-lg border border-muted bg-container px-3 py-2.5 shadow-lg">
              <Icon size={15} strokeWidth={1.75} aria-hidden className={`mt-0.5 shrink-0 ${ICON_TONE[item.tone]}`} />
              <p className="min-w-0 flex-1 text-body-sm text-secondary">{item.message}</p>
              <button
                type="button"
                aria-label="Dismiss"
                onClick={() => dismiss(item.id)}
                className="shrink-0 rounded-full p-0.5 text-quaternary outline-none transition-colors duration-[150ms] hover:text-primary focus-visible:ring-2 focus-visible:ring-active"
              >
                <X size={13} strokeWidth={1.75} aria-hidden />
              </button>
            </div>
          );
        })}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastFn {
  return useContext(ToastContext);
}
