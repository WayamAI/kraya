import type { Agent, AgentEvent, Approval, CopilotScript, Integration, MasterDataIssue, Policy } from "../types";

export const AGENTS: Agent[] = [
  { id: "AGT-RFQ", name: "RFQ Agent", purpose: "Reads OEM RFQ packs, extracts requirements and lists gaps to clarify", mode: "Human-in-loop", runsPerDay: 6, confidence: 91, lastAction: "Parsed Varuna surround-view pack: 10 requirements, 3 gaps", lastRun: "2026-10-12T09:14", markId: "mark-rfq-pack" },
  { id: "AGT-BID", name: "Bid Comparison Agent", purpose: "Normalises supplier bids to landed cost and drafts an award recommendation", mode: "Human-in-loop", runsPerDay: 4, confidence: 86, lastAction: "Re-tabulated SE-2026-014 after Faktron's revised offer", lastRun: "2026-10-12T08:40", markId: "mark-sourcing-event" },
  { id: "AGT-SUP", name: "Supplier Evaluation Agent", purpose: "Refreshes scorecards from delivery, PPM and audit data", mode: "Autonomous", runsPerDay: 32, confidence: 94, lastAction: "Updated 32 supplier scorecards from September GRN data", lastRun: "2026-10-12T06:00", markId: "mark-supplier" },
  { id: "AGT-CTR", name: "Contract Review Agent", purpose: "Extracts clauses and flags missing protections before renewal", mode: "Human-in-loop", runsPerDay: 3, confidence: 88, lastAction: "Flagged missing price escalation cap in the Nexora agreement", lastRun: "2026-10-11T17:22", markId: "mark-contract" },
  { id: "AGT-RSK", name: "Risk Monitoring Agent", purpose: "Watches delivery, financial, capacity and lifecycle signals per supplier", mode: "Autonomous", runsPerDay: 96, confidence: 83, lastAction: "Raised RSK-09 after Bridgepin's incident disclosure", lastRun: "2026-10-12T09:30", markId: "mark-supplier-risk" },
  { id: "AGT-COP", name: "Copilot", purpose: "Answers source-to-pay questions with the records behind each answer", mode: "Human-in-loop", runsPerDay: 58, confidence: 90, lastAction: "Answered 'what blocks the Varuna camera SOP'", lastRun: "2026-10-12T09:41", markId: "mark-copilot" },
  { id: "AGT-SPD", name: "Spend Optimisation Agent", purpose: "Builds should-cost models and finds index and specification savings", mode: "Human-in-loop", runsPerDay: 5, confidence: 81, lastAction: "Re-ran camera housing should-cost on October aluminium", lastRun: "2026-10-12T07:05", markId: "mark-spend" },
  { id: "AGT-INV", name: "Invoice Validation Agent", purpose: "Three-way matches invoice, PO and GRN; releases clean invoices", mode: "Autonomous", runsPerDay: 214, confidence: 97, lastAction: "Released 186 invoices, held 9 for price variance", lastRun: "2026-10-12T09:38", markId: "mark-invoice" },
];

export const AGENT_EVENTS: AgentEvent[] = [
  { id: "EV-01", agentId: "AGT-COP", time: "2026-10-12T09:41", text: "Answered a readiness question for Sneha Kulkarni citing 6 records", outcome: "auto", recordHref: "/copilot", recordLabel: "Copilot" },
  { id: "EV-02", agentId: "AGT-INV", time: "2026-10-12T09:38", text: "Held invoice from Castwell Alloys: die repair billed with no PO", outcome: "queued", recordHref: "/spend", recordLabel: "MAV-07" },
  { id: "EV-03", agentId: "AGT-RSK", time: "2026-10-12T09:30", text: "PO-2026-095 slipped a further 4 days; proposed air-freight split", outcome: "queued", recordHref: "/purchase-orders", recordLabel: "PO-2026-095" },
  { id: "EV-04", agentId: "AGT-RFQ", time: "2026-10-12T09:14", text: "Parsed Varuna surround-view RFI pack; sent 3 gaps for review", outcome: "queued", recordHref: "/rfq", recordLabel: "RFQ-2026-118" },
  { id: "EV-05", agentId: "AGT-BID", time: "2026-10-12T08:40", text: "Re-tabulated FAKRA bids; recommendation unchanged at Coaxis Connect", outcome: "queued", recordHref: "/sourcing-events", recordLabel: "SE-2026-014" },
  { id: "EV-06", agentId: "AGT-INV", time: "2026-10-12T08:15", text: "Auto-approved 3 call-off POs under ₹5L against the MLCC contract", outcome: "auto" },
  { id: "EV-07", agentId: "AGT-SPD", time: "2026-10-12T07:05", text: "Camera housing should-cost moved from ₹143 to ₹141 on October aluminium", outcome: "auto", recordHref: "/should-cost", recordLabel: "SC-01" },
  { id: "EV-08", agentId: "AGT-SUP", time: "2026-10-12T06:00", text: "Nexora Semiconductor OTD fell under 80%; scorecard moved to high risk", outcome: "auto", recordHref: "/suppliers/SUP-001", recordLabel: "SUP-001" },
  { id: "EV-09", agentId: "AGT-CTR", time: "2026-10-11T17:22", text: "Nexora agreement auto-renews 31 Dec with no price cap; notice window closes soon", outcome: "queued", recordHref: "/contracts", recordLabel: "CTR-2025-004" },
  { id: "EV-10", agentId: "AGT-RSK", time: "2026-10-11T16:50", text: "Tried to auto-close RSK-10; blocked because closure needs a named owner", outcome: "blocked", recordHref: "/supplier-risk", recordLabel: "RSK-10" },
  { id: "EV-11", agentId: "AGT-RSK", time: "2026-10-11T15:05", text: "Matched PCN-2026-033 to PPAP-0146 and opened a delta PPAP", outcome: "auto", recordHref: "/lifecycle", recordLabel: "PCN-2026-033" },
  { id: "EV-12", agentId: "AGT-INV", time: "2026-10-11T14:31", text: "Price variance of 2.4x on a broker MCU invoice; routed to head of procurement", outcome: "queued", recordHref: "/spend", recordLabel: "MAV-01" },
  { id: "EV-13", agentId: "AGT-BID", time: "2026-10-11T12:10", text: "Chased Laminar Circuits for the missing capacity statement on SE-2026-016", outcome: "auto", recordHref: "/sourcing-events", recordLabel: "SE-2026-016" },
  { id: "EV-14", agentId: "AGT-RFQ", time: "2026-10-11T11:02", text: "Low-confidence read (52%) on a scanned connector drawing; asked for a native file", outcome: "queued", recordHref: "/rfq", recordLabel: "RFQ-2026-114" },
  { id: "EV-15", agentId: "AGT-CTR", time: "2026-10-10T16:44", text: "Tried to accept a supplier's redline on liability; blocked by policy P-02", outcome: "blocked", recordHref: "/contracts", recordLabel: "CTR-2025-027" },
  { id: "EV-16", agentId: "AGT-SPD", time: "2026-10-10T10:20", text: "Found panel utilisation lever on the camera PCB worth ₹25.2L a year", outcome: "auto", recordHref: "/should-cost", recordLabel: "SC-02" },
];

export const APPROVALS: Approval[] = [
  {
    id: "APR-101", agentId: "AGT-RSK", title: "Expedite PO-2026-088 for the BMS pilot lot", detail: "Pay ₹1.8L for a priority lot at Cellguard Analog to recover 14 days on 30,000 cell monitor ICs.",
    evidence: ["Pilot lot at Kaveri needs 500 pieces by 9 Nov", "Current promise is 21 Nov", "Expedite fee is inside the buyer's ₹5L authority"],
    confidence: 88, valueL: 1.8, approver: "Arjun Bhatia", policy: "Expedite fees above ₹1L need buyer approval", href: "/purchase-orders", effect: { kind: "expedite", poId: "PO-2026-088" },
  },
  {
    id: "APR-102", agentId: "AGT-BID", title: "Award SE-2026-015 to Sealtite Headers", detail: "Sealed 48-way header for the CAN gateway, 90,000 a year at ₹178 with selective gold to follow.",
    evidence: ["Landed ₹185.0; Coaxis is ₹180.2 but has no sealed 48-way in production", "Same part serves the TCU: combined 2,10,000 a year", "Supplier risk is low, OTD 90.4%"],
    confidence: 82, valueL: 160.2, approver: "Kavya Nair", policy: "Awards above ₹50L a year need commodity buyer sign-off", href: "/sourcing-events", effect: { kind: "award", eventId: "SE-2026-015", supplierId: "SUP-015" },
  },
  {
    id: "APR-103", agentId: "AGT-RSK", title: "Start the bridge buy for cell monitor ICs", detail: "Reserve 24,000 pieces at the franchised distributor to cover the December to February gap.",
    evidence: ["Shortfall of 18,000 pieces against the ramp", "Distributor holds 31,400 with traceable date codes", "Premium is 9% over contract price"],
    confidence: 86, valueL: 58.6, approver: "Meenakshi Rao", policy: "Buys outside contract price above ₹25L need head of procurement sign-off", href: "/supplier-risk", effect: { kind: "mitigate", riskId: "RSK-06" },
  },
  {
    id: "APR-104", agentId: "AGT-RSK", title: "Move 10,000 TPMS boards a month to Aravali from August", detail: "Sabarmati is short 8,000 boards a month at full volume. Aravali needs an ultrasonic weld cell.",
    evidence: ["Third shift at Sabarmati costs more and adds night-shift quality risk", "Weld cell lead time is 10 weeks; decision needed by May"],
    confidence: 74, valueL: 18.0, approver: "Meenakshi Rao", policy: "EMS allocation changes need head of procurement sign-off", href: "/ems/capacity", effect: { kind: "allocate", allocationId: "ALC-03" },
  },
  {
    id: "APR-105", agentId: "AGT-RSK", title: "Switch the gateway to the DFN CAN transceiver", detail: "Act on PCN-2026-038 before the gateway layout freeze on 6 Nov.",
    evidence: ["DFN variant already PPAP approved on the BMS", "No price change", "SOIC-8 last-time buy closes 31 Mar 2027"],
    confidence: 91, valueL: 2.1, approver: "Arjun Bhatia", policy: "AVL changes need commodity buyer sign-off", href: "/lifecycle", effect: { kind: "lifecycle", noticeId: "PCN-2026-038" },
  },
  {
    id: "APR-106", agentId: "AGT-INV", title: "Reject Castwell die-repair invoice of ₹5.5L", detail: "The tooling agreement makes wear repairs the supplier's cost and no PO was raised.",
    evidence: ["CTR-2024-040 clause 9.3: maintenance and wear at supplier's cost", "No purchase requisition in SAP"],
    confidence: 93, valueL: 5.5, approver: "Rohit Deshmukh", policy: "Invoice rejections above ₹2L need buyer confirmation", href: "/spend", effect: { kind: "none" },
  },
  {
    id: "APR-107", agentId: "AGT-CTR", title: "Serve non-renewal notice on the Nexora agreement", detail: "The agreement auto-renews on 31 Dec with no price escalation cap and no capacity reservation.",
    evidence: ["Notice window closes 2 Oct plus cure: 12 days late already; supplier has agreed to accept notice until 31 Oct", "Two missing clauses, two weak"],
    confidence: 79, valueL: 5200, approver: "Meenakshi Rao", policy: "Contract risk flags always require human sign-off", href: "/contracts", effect: { kind: "none" },
  },
  {
    id: "APR-108", agentId: "AGT-SPD", title: "Send the camera PCB panel drawing to Stratum PCB", detail: "A 4 x 6 array lifts panel utilisation from 71% to 84%, worth ₹14 a board.",
    evidence: ["Array fits the 457 x 610 mm panel with rotated coupons", "No change to the board itself"],
    confidence: 81, valueL: 25.2, approver: "Rohit Deshmukh", policy: "Supplier-facing cost proposals need buyer review", href: "/should-cost", effect: { kind: "none" },
  },
  {
    id: "APR-109", agentId: "AGT-INV", title: "Block broker MCU invoice pending quality disposition", detail: "Nine parts from this reel failed boundary scan (NCR-2026-059).",
    evidence: ["Invoice is 2.4x contract price", "No certificate of conformance", "2,391 pieces in quarantine at Kaveri"],
    confidence: 95, valueL: 14.6, approver: "Meenakshi Rao", policy: "Payments to non-AVL sources need head of procurement sign-off", href: "/quality", effect: { kind: "none" },
  },
];

export const POLICIES: Policy[] = [
  { id: "P-01", text: "Agents may auto-approve call-off POs under ₹5L against a live contract price", scope: "Invoice Validation, RFQ", enabled: true, locked: false },
  { id: "P-02", text: "Contract risk flags and redlines always require human sign-off", scope: "Contract Review", enabled: true, locked: true },
  { id: "P-03", text: "Award recommendations are drafts until a commodity buyer signs", scope: "Bid Comparison", enabled: true, locked: true },
  { id: "P-04", text: "Agents may chase suppliers for missing bid documents without approval", scope: "Bid Comparison, RFQ", enabled: true, locked: false },
  { id: "P-05", text: "Risk items are closed only by a named owner, never by an agent", scope: "Risk Monitoring", enabled: true, locked: true },
  { id: "P-06", text: "Clean three-way matches inside 1% price tolerance are released for payment automatically", scope: "Invoice Validation", enabled: true, locked: false },
  { id: "P-07", text: "Purchases from non-franchised sources are blocked until the head of procurement approves", scope: "All agents", enabled: true, locked: true },
  { id: "P-08", text: "Agents may update MRP lead times in SAP when a supplier notice changes them", scope: "Risk Monitoring", enabled: false, locked: false },
  { id: "P-09", text: "Answers below 70% confidence are shown with a warning and never acted on", scope: "Copilot", enabled: true, locked: false },
];

export const INTEGRATIONS: Integration[] = [
  { id: "INT-SAP", name: "SAP S/4HANA", role: "Purchase orders, goods receipts, vendor and material master", status: "Healthy", lastSync: "2026-10-12T09:35", records: 184200, latencyMin: 5, errors24h: 2, objects: ["EKKO / EKPO purchase orders", "MSEG goods movements", "LFA1 vendors", "MARA / MARC materials"], note: "Delta sync every 5 minutes over OData." },
  { id: "INT-COUPA", name: "Coupa", role: "Sourcing events, contracts, supplier onboarding", status: "Healthy", lastSync: "2026-10-12T09:20", records: 12640, latencyMin: 20, errors24h: 0, objects: ["Sourcing events and bids", "Contracts", "Supplier information"], note: "REST polling every 20 minutes." },
  { id: "INT-ARIBA", name: "SAP Ariba Network", role: "Order confirmations and advance ship notices", status: "Degraded", lastSync: "2026-10-12T07:02", records: 46880, latencyMin: 158, errors24h: 14, objects: ["Order confirmations", "Advance ship notices", "Invoices"], note: "ASN feed delayed: 14 messages rejected on unit-of-measure mismatch." },
  { id: "INT-PLM", name: "Windchill PLM", role: "Engineering BOM, AVL, change notices", status: "Healthy", lastSync: "2026-10-12T06:00", records: 28310, latencyMin: 720, errors24h: 1, objects: ["EBOM structures", "Approved vendor list", "Engineering change notices"], note: "Nightly export plus change-notice webhook." },
  { id: "INT-MES", name: "EMS partner MES feeds", role: "Line output, first-pass yield, test results from 8 partners", status: "Degraded", lastSync: "2026-10-12T08:50", records: 932400, latencyMin: 45, errors24h: 6, objects: ["Line output by hour", "AOI / ICT / FCT results", "Changeover log"], note: "Kaveri SMT Systems line 2 has sent no data since 11 Oct 22:10." },
  { id: "INT-QMS", name: "Quality management system", role: "NCRs, 8D reports, PPAP records", status: "Healthy", lastSync: "2026-10-12T09:30", records: 9120, latencyMin: 10, errors24h: 0, objects: ["NCR and 8D", "PPAP submissions", "Audit findings"], note: "Event stream." },
  { id: "INT-MKT", name: "Component market data", role: "Lifecycle status, lead times, distributor stock", status: "Failed", lastSync: "2026-10-10T23:40", records: 61200, latencyMin: 2040, errors24h: 48, objects: ["Lifecycle and PCN feed", "Lead-time index", "Franchised distributor stock"], note: "API key expired 10 Oct. Lifecycle data on this app is 34 hours old." },
];

export const MASTER_DATA_ISSUES: MasterDataIssue[] = [
  { id: "MD-01", system: "SAP S/4HANA", object: "Material master", record: "IMG-2M3-A", issue: "Planned delivery time is 140 days; supplier lead time is now 182", impact: "MRP will release the next order 6 weeks late", fix: "Set planned delivery time to 182 days", severity: "high" },
  { id: "MD-02", system: "SAP S/4HANA", object: "Vendor master", record: "Castwell Alloys", issue: "Two vendor codes (104217 and 118840) with different payment terms", impact: "Spend split across codes; rebate threshold not reached", fix: "Merge to 104217 and block 118840", severity: "medium" },
  { id: "MD-03", system: "SAP Ariba Network", object: "Unit of measure", record: "MLCC-X7R-106", issue: "Supplier ships in reels of 10,000; SAP order unit is each", impact: "14 advance ship notices rejected", fix: "Add reel-to-each conversion on the info record", severity: "high" },
  { id: "MD-04", system: "Windchill PLM", object: "AVL", record: "PHY-CANFD-2", issue: "DFN alternate approved in PLM but missing from the SAP source list", impact: "Buyers cannot order the qualified alternate", fix: "Add source list entry for the DFN part", severity: "medium" },
  { id: "MD-05", system: "SAP S/4HANA", object: "Material master", record: "TFT-10.25", issue: "Planned delivery time 126 days; supplier lead time is 182", impact: "Cluster display orders release 8 weeks late", fix: "Set planned delivery time to 182 days", severity: "high" },
  { id: "MD-06", system: "SAP S/4HANA", object: "Info record", record: "HSG-CAM-AL", issue: "Price ₹172 in the info record; contract price is ₹164", impact: "Invoices pay ₹8 over contract until corrected", fix: "Update info record to ₹164 from 1 Oct", severity: "medium" },
  { id: "MD-07", system: "Coupa", object: "Supplier record", record: "Coaxis Connect", issue: "IATF 16949 certificate expired in Coupa; a renewed one is on file in the QMS", impact: "Supplier shows as not approved for award", fix: "Attach the renewed certificate valid to Aug 2029", severity: "medium" },
  { id: "MD-08", system: "SAP S/4HANA", object: "Material master", record: "LTE-CAT4-M", issue: "HSN code 8517.62 missing on the plant view for Chennai", impact: "Bill of entry held at customs", fix: "Maintain HSN code on plant 2100", severity: "low" },
  { id: "MD-09", system: "Windchill PLM", object: "EBOM", record: "TCU-4G-007", issue: "EBOM revision D released; SAP MBOM is still at C", impact: "Old gasket part number will be ordered", fix: "Sync MBOM to revision D", severity: "high" },
  { id: "MD-10", system: "SAP S/4HANA", object: "Vendor master", record: "Wirekraft Harness Systems", issue: "Payment terms Net 90 in SAP; amendment signed for Net 60", impact: "Late payment to a supplier on financial watch", fix: "Change payment terms key to Net 60", severity: "medium" },
  { id: "MD-11", system: "EMS partner MES feeds", object: "Line mapping", record: "Kaveri line 2", issue: "Line renamed in the partner MES; mapping broken", impact: "No yield data for the BMS pilot line", fix: "Remap KAV-L2-B to line 2", severity: "medium" },
  { id: "MD-12", system: "SAP S/4HANA", object: "Material master", record: "GSK-ECU-SI", issue: "Duplicate material: 4000118 and 4000342 describe the same gasket", impact: "Stock held under two numbers", fix: "Flag 4000342 for deletion and transfer stock", severity: "low" },
];

export const COPILOT_SCRIPTS: CopilotScript[] = [
  {
    id: "Q1", prompt: "What will stop the Varuna camera from hitting SOP on 15 February?",
    answer: [
      "Three things, in order of how much time they cost.",
      "The image sensor is the gate. PO-2026-087 is promised for 18 December against a need date of 30 November, so the PPAP build starts 18 days late unless it is expedited. Nexora has offered a priority lot for ₹3.2L that recovers 20 days.",
      "The lens module has no second source and two PPAP elements are overdue. Until measurement system analysis and dimensional results arrive from Optivue, the warrant cannot be signed.",
      "The ISP moves assembly site from date code 2027 week 06. Varuna needs a delta PPAP, and the first new-site lots land three weeks before SOP.",
    ],
    bullets: ["Expedite PO-2026-087 today (buyer authority).", "Chase Optivue for PPAP elements 8 and 9.", "Pull 300 new-site ISP samples now so delta qualification is finished before the launch build."],
    citations: [
      { type: "Purchase order", id: "PO-2026-087", label: "Image sensor, 20,000 pcs", detail: "Promised 18 Dec, needed 30 Nov", href: "/purchase-orders" },
      { type: "Supplier risk", id: "RSK-01", label: "Lens module has no second source", detail: "Score 88, failure probability 34%", href: "/supplier-risk" },
      { type: "PPAP", id: "PPAP-0141", label: "Lens module, level 3", detail: "2 elements overdue", href: "/ppap" },
      { type: "Lifecycle notice", id: "PCN-2026-033", label: "ISP assembly site change", detail: "Delta PPAP required", href: "/lifecycle" },
      { type: "Program", id: "PGM-2026-001", label: "Varuna ADAS front camera", detail: "SOP 15 Feb 2027", href: "/programs/PGM-2026-001" },
    ],
    confidence: 88, followUp: "Sneha Kulkarni owns the program; Arjun Bhatia signs the expedite.",
  },
  {
    id: "Q2", prompt: "Which single-source parts have no qualified alternate?",
    answer: [
      "Across the seven frozen BOMs, 25 line items are single source and 19 of those have no alternate even in qualification. Five sit on a program inside 12 months of SOP and matter now.",
      "The lens module and cell monitor IC matter most: one is late and the other is on allocation.",
    ],
    bullets: ["LENS-190F, Optivue Lens Works: Clarion study not started.", "AFE-14S, Cellguard Analog: no alternate identified.", "ISP-V4-SOC, Halcyon Silicon: no alternate identified.", "TFT-10.25, Lumigrid Displays: no alternate identified.", "MEMS-P-450, Barosense MEMS: two candidates, study not approved."],
    citations: [
      { type: "BOM", id: "ADAS-CAM-001", label: "Camera BOM, 8 single-source lines", detail: "PGM-2026-001", href: "/bom" },
      { type: "Supplier risk", id: "RSK-01", label: "Lens module", detail: "Single-source", href: "/supplier-risk" },
      { type: "Supplier risk", id: "RSK-11", label: "TPMS pressure sensor", detail: "Single-source", href: "/supplier-risk" },
      { type: "Lifecycle notice", id: "PCN-2026-031", label: "AFE on 70% allocation", detail: "Critical", href: "/lifecycle" },
      { type: "Multi-tier map", id: "MT-04", label: "Display driver IC at tier 2", detail: "Sub-tier single point of failure", href: "/ems/multi-tier" },
    ],
    confidence: 90, followUp: "Counts come from the PLM AVL, synced 12 Oct 06:00.",
  },
  {
    id: "Q3", prompt: "Compare the FAKRA bids on landed cost and tell me who to award.",
    answer: [
      "Coaxis Connect is lowest once everything is counted: ₹98.4 landed against ₹105.2 for Bridgepin and ₹131.0 for the incumbent Faktron.",
      "Bridgepin has the lowest piece price at ₹92, but 10% duty and 4% freight put it above Coaxis. Coaxis also gives Net 75 and a 9-week lead time.",
      "I recommend awarding 70% to Coaxis and keeping 30% with Faktron so the existing PPAP stays live. That is worth about ₹33L a year and removes a single-source flag.",
    ],
    citations: [
      { type: "Sourcing event", id: "SE-2026-014", label: "FAKRA Z-code second source", detail: "3 bids, due 16 Oct", href: "/sourcing-events" },
      { type: "Should-cost", id: "SC-11", label: "FAKRA should-cost ₹99", detail: "Quoted ₹118", href: "/should-cost" },
      { type: "Supplier", id: "SUP-032", label: "Coaxis Connect", detail: "OTD 91.6%, quality 90", href: "/suppliers/SUP-032" },
      { type: "Supplier risk", id: "RSK-09", label: "Bridgepin incident", detail: "Cybersecurity", href: "/supplier-risk" },
    ],
    confidence: 86, followUp: "Kavya Nair signs awards above ₹50L a year.",
  },
  {
    id: "Q4", prompt: "What is our exposure to the LTE module end-of-life notice?",
    answer: [
      "The Kestrel TCU uses the module from SOP in April 2027, at 10,000 a month. Last-time-buy orders close on 30 November 2026 and the last shipment is 31 May 2027.",
      "The Cat-1bis successor finishes RF validation in week 14 of 2027 and then needs six weeks of AIS-140 re-certification, so the earliest cut-in is about June 2027 with no margin.",
      "A last-time buy of 70,000 pieces covers SOP plus seven months for ₹7.84 Cr. That is the recommended action; the Indus telematics quote already assumes the successor.",
    ],
    citations: [
      { type: "Lifecycle notice", id: "PCN-2026-032", label: "LTE Cat-4 module EOL", detail: "LTB closes 30 Nov", href: "/lifecycle" },
      { type: "Purchase order", id: "PO-2026-092", label: "PPAP build quantity", detail: "12,000 pcs, ₹1.34 Cr", href: "/purchase-orders" },
      { type: "Program", id: "PGM-2026-003", label: "Kestrel telematics unit", detail: "SOP 12 Apr 2027", href: "/programs/PGM-2026-003" },
      { type: "Contract", id: "CTR-2025-048", label: "Cellonis supply agreement", detail: "PCN / EOL clause missing", href: "/contracts" },
    ],
    confidence: 82, followUp: "Kavya Nair owns the notice. A buy above ₹5 Cr needs Meenakshi Rao.",
  },
  {
    id: "Q5", prompt: "Where are we over EMS capacity in the next 12 months?",
    answer: [
      "Three partners go over capacity if nothing changes.",
      "Kaveri SMT Systems is short 4,000 to 5,000 boards a month from February when the BMS reaches volume. Coromandel Circuit Works is 4,000 over from April when the TCU launches on top of the cluster. Sabarmati Mechatronics is 8,000 over from August at full TPMS volume.",
      "Each has an allocation proposal waiting for sign-off. The Kaveri move to Marina is the most urgent because the BMS reaches SOP on 7 December.",
    ],
    citations: [
      { type: "Allocation", id: "ALC-01", label: "BMS: Kaveri to Marina, 8,000 a month", detail: "From Feb 2027", href: "/ems/capacity" },
      { type: "Allocation", id: "ALC-02", label: "Cluster: Coromandel to Aravali, 5,000 a month", detail: "From Apr 2027", href: "/ems/capacity" },
      { type: "Allocation", id: "ALC-03", label: "TPMS: Sabarmati to Aravali, 10,000 a month", detail: "From Aug 2027", href: "/ems/capacity" },
      { type: "EMS partner", id: "EMS-03", label: "Kaveri SMT Systems", detail: "93% utilised, 3 audit findings", href: "/ems/performance" },
    ],
    confidence: 85, followUp: "Allocation changes are signed by Meenakshi Rao.",
  },
  {
    id: "Q6", prompt: "Which contracts renew in the next 90 days and what is missing from them?",
    answer: [
      "Four agreements reach their end date inside 90 days.",
      "The Nexora agreement is the one to act on. It auto-renews on 31 December with no price escalation cap and no capacity reservation, on a part whose lead time has just grown by six weeks.",
      "Laminar Circuits auto-renews on 30 November with no escalation cap and no volume commitment. The Kyomi quality agreement and the Castwell tooling agreement are lower risk, though Castwell's does not state who owns the tools.",
    ],
    citations: [
      { type: "Contract", id: "CTR-2025-004", label: "Nexora supply agreement", detail: "Ends 31 Dec, auto-renews", href: "/contracts" },
      { type: "Contract", id: "CTR-2023-032", label: "Laminar master supply agreement", detail: "Ends 30 Nov, auto-renews", href: "/contracts" },
      { type: "Contract", id: "CTR-2024-037", label: "Kyomi quality agreement", detail: "Ends 15 Dec", href: "/contracts" },
      { type: "Contract", id: "CTR-2024-040", label: "Castwell tooling and supply", detail: "Ends 31 Jan, tooling ownership missing", href: "/contracts" },
    ],
    confidence: 87, followUp: "Contract flags always need human sign-off (policy P-02).",
  },
  {
    id: "Q7", prompt: "Why did NCRs at Kaveri go up, and is the supplier or the EMS at fault?",
    answer: [
      "Kaveri's PPM went from 49 in May to 74 in October. Three open NCRs point to the EMS process, one to a part bought outside the AVL.",
      "Solder bridging on the 0.4 mm connector traces to paste left out of refrigeration on line 2, which matches an open audit finding. Coating voids came from flux residue. Both are process control at Kaveri.",
      "The MCU boundary-scan failures are different: all nine trace to a reel bought from a broker during the allocation. That is a sourcing-control failure, not a Kortex quality problem.",
    ],
    citations: [
      { type: "NCR", id: "NCR-2026-056", label: "Solder bridging, B2B connector", detail: "8D at D2", href: "/quality" },
      { type: "NCR", id: "NCR-2026-059", label: "MCU fails boundary scan", detail: "Broker reel", href: "/quality" },
      { type: "NCR", id: "NCR-2026-060", label: "Coating voids near shunt", detail: "8D at D6", href: "/quality" },
      { type: "EMS partner", id: "EMS-03", label: "Kaveri SMT Systems", detail: "PPM 74, FPY 96.8%", href: "/ems/performance" },
      { type: "Maverick spend", id: "MAV-01", label: "MCU spot buy", detail: "₹14.6L outside AVL", href: "/spend" },
    ],
    confidence: 84, followUp: "Tanvi Joshi owns the Kaveri NCRs.",
  },
  {
    id: "Q8", prompt: "Where can I find ₹1 Cr of savings this quarter without touching single-source parts?",
    answer: [
      "Five levers add up to ₹1.08 Cr a year and none depends on a single-source supplier agreeing to a price cut.",
      "The FAKRA second-source award and the camera housing renegotiation are furthest along. The PCB panel change costs the supplier nothing, which makes it the easiest conversation.",
    ],
    bullets: ["FAKRA award to Coaxis: ₹33.1L.", "Camera housing indexing and 2-setup machining: ₹28.8L.", "Camera PCB panel utilisation: ₹25.2L.", "Harness copper index reset: ₹12.0L.", "Sealed header selective gold: ₹8.1L."],
    citations: [
      { type: "Savings", id: "SAV-01", label: "FAKRA second source award", detail: "₹33.1L, negotiating", href: "/spend" },
      { type: "Should-cost", id: "SC-01", label: "Camera housing", detail: "Quoted ₹164, should-cost ₹141", href: "/should-cost" },
      { type: "Should-cost", id: "SC-02", label: "Camera PCB", detail: "Quoted ₹214, should-cost ₹188", href: "/should-cost" },
      { type: "Savings", id: "SAV-04", label: "Harness copper index reset", detail: "₹12.0L, validated", href: "/spend" },
    ],
    confidence: 80, followUp: "Savings count as realised only after the first invoice at the new price.",
  },
];
