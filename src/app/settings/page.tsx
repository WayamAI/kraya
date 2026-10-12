"use client";

/** Administration: workspace, thresholds, notifications, theme and the demo session. */

import { LogOut, Moon, RotateCcw, Sun } from "lucide-react";
import { useRouter } from "next/navigation";

import { PageBody, PageHeader } from "@/components/layout/page-header";
import { Btn, Field, Figure, KMark, Label, LinkBtn, Stack } from "@/components/kraya/kit";
import { Panel, Select } from "@/components/ui/primitives";
import { useToast } from "@/components/ui/toast";
import { useTheme } from "@/context/theme-context";
import { APP } from "@/lib/app";
import { clearSession, DEMO_EMAIL } from "@/lib/auth/session";
import { useKraya } from "@/lib/kraya/context";
import { ALL_PEOPLE, EMS_PARTNERS, PROGRAMS, SUPPLIERS } from "@/lib/kraya/data";
import { fullDate, TODAY } from "@/lib/kraya/format";

const NOTIFICATIONS = [
  { id: "late-po", label: "A critical PO slips behind its need date", base: "on" },
  { id: "pcn", label: "A PCN, EOL or allocation notice arrives for a part on a frozen BOM", base: "on" },
  { id: "ppap", label: "A PPAP element goes overdue on a part that blocks SOP", base: "on" },
  { id: "capacity", label: "An EMS partner goes over capacity in the 12-month plan", base: "on" },
  { id: "approval", label: "An agent proposal is waiting for my sign-off", base: "on" },
  { id: "digest", label: "Daily digest at 08:00 instead of individual alerts", base: "off" },
];

const THRESHOLDS = [
  { label: "Program at risk when ATP confidence is under", value: "88%" },
  { label: "Critical PO flagged when float is under", value: "7 days" },
  { label: "Lead time counted as long from", value: "20 weeks" },
  { label: "Quote margin floor (escalates to head of procurement)", value: "9% to 10% by OEM" },
  { label: "Agent auto-approval limit for call-off POs", value: "₹5L" },
  { label: "Supplier OTD target", value: "90%" },
];

export default function SettingsPage() {
  const router = useRouter();
  const toast = useToast();
  const { theme, setTheme } = useTheme();
  const { get, set, reset, actionCount } = useKraya();

  return (
    <>
      <PageHeader
        title="Settings"
        description="Workspace, alert rules and the demo session. Changes here apply to this browser session only."
        mark={<KMark id="mark-settings" size={44} />}
      />
      <PageBody>
        <Stack>
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Workspace">
              <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                <Field label="Product">{APP.name} · {APP.devanagari} ({APP.meaning})</Field>
                <Field label="Tenant">{APP.scope}</Field>
                <Field label="Signed in as">{APP.operator.name}</Field>
                <Field label="Account"><span className="break-all">{DEMO_EMAIL}</span></Field>
                <Field label="Demo clock">{fullDate(TODAY)}</Field>
                <Field label="Currency">Indian rupee, lakh and crore</Field>
              </div>
              <div className="mt-4 grid grid-cols-3 gap-3 border-t border-muted pt-3">
                <Figure label="Programs" value={PROGRAMS.length} />
                <Figure label="Suppliers" value={SUPPLIERS.length} />
                <Figure label="EMS partners" value={EMS_PARTNERS.length} />
              </div>
            </Panel>

            <Panel title="Appearance and role">
              <div className="flex flex-col gap-4">
                <div>
                  <Label>Theme</Label>
                  <div className="mt-1.5 flex flex-wrap gap-2">
                    <Btn icon={Sun} variant={theme === "light" ? "primary" : "secondary"} onClick={() => setTheme("light")}>Light</Btn>
                    <Btn icon={Moon} variant={theme === "dark" ? "primary" : "secondary"} onClick={() => setTheme("dark")}>Dark</Btn>
                  </div>
                </div>
                <div>
                  <Label>Act as</Label>
                  <div className="mt-1.5">
                    <Select
                      value={get("settings:actor", ALL_PEOPLE[0])}
                      onChange={(event) => {
                        set("settings:actor", event.target.value);
                        toast(`Now acting as ${event.target.value}. Sign-off lines still name the record's owner.`, "info");
                      }}
                      aria-label="Act as"
                      className="h-11 w-full rounded-full border border-muted bg-action text-body-md text-secondary"
                    >
                      {ALL_PEOPLE.map((person) => (
                        <option key={person}>{person}</option>
                      ))}
                    </Select>
                  </div>
                  <p className="mt-1.5 text-caption text-quaternary">Head of procurement, commodity buyers, program managers and supplier quality engineers.</p>
                </div>
              </div>
            </Panel>
          </div>

          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Panel title="Alert me when" padded={false}>
              <ul className="flex flex-col">
                {NOTIFICATIONS.map((item) => {
                  const on = get(`notify:${item.id}`, item.base) === "on";
                  return (
                    <li key={item.id} className="flex items-center gap-3 border-b border-muted px-4 py-3 last:border-b-0">
                      <span className="min-w-0 flex-1 text-body-md text-secondary">{item.label}</span>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={on}
                        aria-label={item.label}
                        onClick={() => {
                          set(`notify:${item.id}`, on ? "off" : "on");
                          toast(`Alert ${on ? "off" : "on"}: ${item.label.toLowerCase()}.`, "info");
                        }}
                        className={`relative h-5 w-9 shrink-0 rounded-full outline-none transition-colors duration-[180ms] focus-visible:ring-2 focus-visible:ring-active ${on ? "bg-action-primary" : "bg-raised-2"}`}
                      >
                        <span className={`absolute top-0.5 size-4 rounded-full bg-container transition-[left] duration-[180ms] ${on ? "left-[18px]" : "left-0.5"}`} />
                      </button>
                      <span className="w-6 shrink-0 text-caption text-tertiary">{on ? "on" : "off"}</span>
                    </li>
                  );
                })}
              </ul>
            </Panel>

            <Panel title="Thresholds in use" padded={false} action={<LinkBtn href="/agents" variant="ghost">Agent policies</LinkBtn>}>
              <ul className="flex flex-col">
                {THRESHOLDS.map((item) => (
                  <li key={item.label} className="flex items-center justify-between gap-3 border-b border-muted px-4 py-3 last:border-b-0">
                    <span className="min-w-0 text-body-md text-secondary">{item.label}</span>
                    <span className="shrink-0 text-body-md tabular text-primary">{item.value}</span>
                  </li>
                ))}
              </ul>
            </Panel>
          </div>

          <Panel title="Demo session">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-body-md text-secondary">
                  {actionCount === 0
                    ? "No actions taken yet. Expedite a PO or accept a mitigation and it is recorded here."
                    : `${actionCount} state changes recorded this session: expedites, awards, approvals, mitigations and fixes.`}
                </p>
                <p className="mt-1 text-caption text-quaternary">All data is synthetic and held in the browser. Reloading the page also resets it.</p>
              </div>
              <div className="flex flex-wrap gap-2">
                <Btn
                  icon={RotateCcw}
                  disabled={actionCount === 0}
                  onClick={() => {
                    reset();
                    toast("Demo state reset. Every record is back to its 12 Oct 2026 baseline.", "info");
                  }}
                >
                  Reset demo state
                </Btn>
                <Btn
                  icon={LogOut}
                  onClick={() => {
                    clearSession();
                    router.replace("/login");
                  }}
                >
                  Sign out
                </Btn>
              </div>
            </div>
          </Panel>
        </Stack>
      </PageBody>
    </>
  );
}
