# Kraya

**Kraya** (क्रय, Sanskrit for *procurement* or *purchase*) is a procurement command center for automotive electronics, built in the Wayam AI visual system.

It follows a program from the vehicle maker's enquiry to start of production (SOP): RFI / RFQ, quote, award, BOM freeze, supplier onboarding, purchase orders, PPAP and production readiness. The point of the product is to name what will make a program miss SOP while there is still time to do something about it.

## Domain and roles

The demo tenant is **Auralis Mobility Electronics**, a fictional Tier-1 supplier in India that builds ADAS cameras, telematics units, battery management modules, CAN gateways, instrument clusters, headlamp controllers, TPMS sensors and radar units for six fictional OEMs. It buys semiconductors, passives, connectors, PCBs, optics, die-cast housings, seals and harnesses from 32 suppliers and builds at 8 EMS partners in Pune, Chennai, Hosur, Manesar and Sanand.

Written for commodity buyers, program purchasing managers, supplier quality engineers and the head of procurement. Money is in rupees, lakh and crore. All organisations and people are fictional; standards and systems (IATF 16949, ISO 26262, AEC-Q100/Q200, VDA 6.3, AIAG PPAP, SAP S/4HANA, Coupa, Ariba, Windchill) are real.

## Use cases, page by page

**Command Center**
- `/dashboard` Program pipeline as a clickable stage flow, programs in flight, a ranked exception queue of what will miss SOP, and agent observations with evidence and a one-click action.

**Programs**
- `/rfq` RFQ Intake: parsed OEM RFQ packs, extracted requirements with per-field confidence, gaps to clarify, send to quoting.
- `/quoting` Quoting & Feasibility: cost build-up waterfall, margin what-if against the OEM target, feasibility sub-scores, submit or escalate.
- `/programs` Program Tracker: launch calendar and table of all twelve programs with live risk.
- `/programs/[id]` Program detail: gate timeline, readiness by dimension and what is dragging it, BOM health, risks, POs, PPAP.
- `/readiness` ATP / SOP Readiness: available-to-promise confidence per program and the records behind each lost point.

**BOM & Parts**
- `/bom` BOM Intelligence: indented multi-level BOM with cost roll-up, lead time, sourcing status, risk flags and AVL alternates.
- `/lifecycle` Component Lifecycle Watch: PCN / EOL / allocation notices, last-time-buy dates and calculator, lead-time creep, AEC-Q status, recommended action.
- `/should-cost` Should-Cost & Negotiation: target vs quoted vs should-cost per part, levers, and a generated negotiation brief.

**Sourcing**
- `/suppliers` Supplier Command Centre: on-time delivery, quality, PPM, spend and risk for every supplier.
- `/suppliers/[id]` Supplier scorecard: trend, sub-scores and every PO, risk, notice, PPAP, NCR and contract tied to the supplier.
- `/supplier-risk` Supplier Risk: predictive risk by signal with mitigation plans to assign, accept and close.
- `/sourcing-events` RFQ Automation & Bid Comparison: bids normalised to landed cost, award recommendation with rationale, award action.
- `/purchase-orders` PO Tracker: promise date against program need date, expedite and re-promise actions.
- `/contracts` Contracts: clause extraction, missing-clause flags, renewal calendar, amendment drafting.
- `/spend` Spend Analytics: spend by commodity, supplier, program and OEM, savings pipeline, maverick spend.

**Quality**
- `/quality` Quality & RCA: NCRs with 8D progress, ranked root-cause hypotheses with evidence, containment, supplier chargeback.
- `/ppap` APQP / PPAP Tracker: the 18 PPAP elements per part and supplier, approvals, PSW sign-off, what blocks SOP.

**EMS Network**
- `/ems` Network: the eight EMS partners with lines, capacity, certifications and capabilities.
- `/ems/capacity` Capacity ↔ Demand: twelve months of demand against line capacity, shortfall months, allocation moves to accept.
- `/ems/performance` Performance & Quality: PPM, OTIF, first-pass yield, changeover and audit findings.
- `/ems/multi-tier` Multi-tier Visibility: tier-1 to tier-3 dependency maps for critical parts with sub-tier single points of failure.

**Intelligence**
- `/copilot` Copilot: grounded Q&A over the records, each answer citing live-linked records in a side panel.
- `/agents` Agents: roster, activity feed, approvals inbox and governance policies.
- `/integrations` Integrations: sync health for SAP S/4HANA, Coupa, Ariba, PLM, MES and market data, plus master-data fixes.
- `/settings` Administration: workspace, alerts, thresholds, theme, demo reset.

## One state, many pages

Actions are shared across the app through `src/lib/kraya/context.tsx`, and `src/lib/kraya/selectors.ts` folds them into readiness, program risk and the exception queue:

- Expediting or re-promising a PO moves its promise date, lifts the program's material readiness and removes the late-PO exception.
- Assigning, accepting and closing a supplier-risk mitigation lowers the residual score and lifts supplier readiness.
- Awarding a sourcing event clears the "award due" exception and lifts supplier readiness.
- Approving PPAP elements and signing the PSW lifts quality readiness and clears the PPAP exception.
- Accepting an EMS capacity allocation moves boards between partners, removes the shortfall and lifts production readiness.
- Actioning a lifecycle notice lifts BOM readiness; advancing an 8D past root cause lifts quality readiness.
- Approving an agent proposal on `/agents` applies the same effect as doing it on the record's own page.

State lives in memory for the browser session; reload the page or use Settings to reset it.

## Stack

Next.js 16 (App Router, client-rendered pages), React 19, TypeScript, Tailwind CSS v4 with the Wayam semantic token system, recharts, lucide-react. No backend: a deterministic synthetic dataset in `src/lib/kraya/data/` with a fixed demo clock of 12 October 2026.

```
src/lib/kraya/        types, data, format, selectors, context
src/lib/marks.ts      mark registry (id, fallback icon, where used)
src/lib/navigation.ts sidebar groups and badges
src/lib/search.ts     Ctrl+K record index
src/components/kraya/ page kit, chart helpers, exception queue, observations
src/components/ui/    shell primitives, data table, toast
src/app/              one folder per route
```

## Run

```
npm install
npm run dev
```

Open http://localhost:3102 (the port is set in `package.json`). `npm run build` then `npm run start` serves the production build on the same port.

## Demo sign-in

- Email: `operator@kraya.ai`
- Password: `command`

## Dropping in the Flow renders

`prompts.md` holds the Google Flow prompt pack: the colour lock, the login background prompt, the style prefix and one numbered subject for each of the 40 marks.

- Login background: save as `public/brand/login-bg.jpg` (4:5 portrait, 2400 x 3000).
- Marks: save each render as `public/images/marks/<mark-id>.png` (square, 1024 px), using the filenames table at the end of `prompts.md`.

No code change is needed. Until a file exists, the app shows the mark's Lucide fallback glyph on an orange tile, so renders can be added one at a time.
