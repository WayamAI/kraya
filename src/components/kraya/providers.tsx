"use client";

import type { ReactNode } from "react";

import { ToastProvider } from "@/components/ui/toast";
import { KrayaProvider } from "@/lib/kraya/context";

/** Client wrapper mounted once around the shell so state survives navigation. */
export function KrayaProviders({ children }: { children: ReactNode }) {
  return (
    <ToastProvider>
      <KrayaProvider>{children}</KrayaProvider>
    </ToastProvider>
  );
}
