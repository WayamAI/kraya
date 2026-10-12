import type {
  Bid,
  ClauseStatus,
  Contract,
  MaverickItem,
  PoStatus,
  PurchaseOrder,
  SavingsItem,
  SourcingEvent,
  SupplierRisk,
} from "../types";

function po(
  num: string, supplierId: string, pn: string, component: string, program: string, qty: number, valueL: number,
  orderDate: string, promisedDate: string, needDate: string, status: PoStatus, critical: boolean, note: string,
  expediteDays = 0, expediteCostL = 0, repromiseDays = 0, incoterm = "FCA",
): PurchaseOrder & { repromiseDays: number } {
  return {
    id: `PO-2026-${num}`, supplierId, pn, component, programId: `PGM-2026-${program}`, qty, valueL, orderDate, promisedDate, needDate,
    status, critical, incoterm, note, expediteDays, expediteCostL, repromiseDays,
  };
}

export type Po = PurchaseOrder & { repromiseDays: number };

export const PURCHASE_ORDERS: Po[] = [
  po("081", "SUP-009", "MLCC-X7R-106", "MLCC kit, X7R and C0G", "001", 1720000, 31.0, "2026-07-06", "2026-09-28", "2026-11-10", "Received", false, "Received in full, GRN 28 Sep."),
  po("082", "SUP-017", "PCB-CAM-6L", "Bare PCB, 6-layer HDI", "001", 20000, 42.8, "2026-08-10", "2026-10-28", "2026-11-10", "In Transit", true, "On vessel, ETA Nhava Sheva 24 Oct.", 0, 0, 0, "FOB"),
  po("083", "SUP-019", "LENS-190F", "Lens module, athermal", "001", 20000, 97.2, "2026-07-13", "2026-11-24", "2026-11-30", "Confirmed", true, "Six days of float. Single source."),
  po("084", "SUP-002", "ISP-V4-SOC", "Vision ISP SoC", "001", 20000, 169.0, "2026-06-22", "2026-11-20", "2026-11-30", "Confirmed", true, "Old-site date codes; before the PCN cut-in."),
  po("085", "SUP-013", "FAK-Z-90", "FAKRA Z-code connector", "001", 20000, 23.6, "2026-08-03", "2026-10-20", "2026-11-15", "In Transit", false, "Air, customs clearance in progress.", 0, 0, 0, "DAP"),
  po("086", "SUP-021", "HSG-CAM-AL", "Front housing, die-cast", "001", 20000, 32.8, "2026-08-17", "2026-10-05", "2026-11-15", "Received", false, "Received. Porosity sampling at incoming: 2 of 125 rejected."),
  po("087", "SUP-001", "IMG-2M3-A", "Image sensor, 2.3 MP HDR", "001", 20000, 122.4, "2026-06-01", "2026-12-18", "2026-11-30", "Delayed", true, "Supplier pushed 3 weeks citing colour-filter capacity. PPAP build cannot start without it.", 20, 3.2, 4),
  po("088", "SUP-008", "AFE-14S", "Cell monitor AFE, 14 channel", "002", 30000, 67.2, "2026-05-18", "2026-11-21", "2026-11-09", "Delayed", true, "On allocation at 70%. Pilot lot needs 500 by 9 Nov.", 14, 1.8, 3),
  po("089", "SUP-016", "PCB-BMS-4L", "Bare PCB, 4-layer", "002", 30000, 44.4, "2026-08-24", "2026-10-02", "2026-11-02", "Received", false, "Received in full."),
  po("090", "SUP-011", "SHUNT-100U", "Current shunt 100 µΩ", "002", 30000, 11.4, "2026-08-31", "2026-10-19", "2026-11-02", "In Transit", false, "Dispatched from Pune 10 Oct.", 0, 0, 0, "EXW"),
  po("091", "SUP-003", "MCU-32B-100", "32-bit MCU, 100 pin", "002", 30000, 73.8, "2026-04-20", "2026-11-04", "2026-11-09", "Confirmed", true, "Confirmed inside allocation. Five days of float."),
  po("092", "SUP-031", "LTE-CAT4-M", "LTE Cat-4 module", "003", 12000, 134.4, "2026-08-27", "2026-12-15", "2027-01-11", "Confirmed", true, "Covers PPAP build only. Last-time buy decision is separate (PCN-2026-032)."),
  po("093", "SUP-016", "PCB-TCU-6L", "Bare PCB, 6-layer", "003", 12000, 28.3, "2026-09-14", "2027-01-22", "2027-01-11", "Delayed", true, "Laminar's Hosur plant is at 96% utilisation; slot moved by 11 days.", 14, 0.9, 0),
  po("094", "SUP-003", "MCU-32A-144", "32-bit MCU, 144 pin", "003", 12000, 38.2, "2026-06-15", "2027-01-05", "2027-01-11", "Confirmed", true, "Inside the 80% allocation."),
  po("095", "SUP-026", "TFT-10.25", "TFT panel 10.25 in", "005", 6000, 231.0, "2026-07-20", "2027-01-29", "2026-12-21", "Delayed", true, "Lead time moved from 18 to 26 weeks. First articles for Meridian are at risk.", 21, 6.4, 18, "FOB"),
  po("096", "SUP-018", "PCB-IC-8L", "Bare PCB, 8-layer HDI", "005", 6000, 21.8, "2026-09-07", "2026-11-06", "2026-12-01", "In Transit", false, "Road from Bengaluru, two partial shipments."),
  po("097", "SUP-015", "HDR-48S", "Sealed header, 48 way", "004", 8000, 14.9, "2026-10-05", "2027-02-10", "2027-03-01", "Confirmed", false, "Prototype tool. Series sourcing is in SE-2026-015."),
  po("098", "SUP-030", "MEMS-P-450", "MEMS pressure sensor", "007", 60000, 57.6, "2026-10-01", "2027-03-12", "2027-03-20", "Confirmed", true, "Eight days of float on a 22-week part."),
];

export const SUPPLIER_RISKS: SupplierRisk[] = [
  {
    id: "RSK-01", supplierId: "SUP-019", signal: "Single-source", score: 88, failureProb: 34, pn: "LENS-190F",
    title: "Lens module has no second source", summary: "Optivue Lens Works is the only qualified source for the camera lens and its on-time delivery has fallen 12 points in five months.",
    evidence: ["OTD 88.1% in May, 76.4% in October", "One plant in Taichung; no disaster-recovery site disclosed", "Clarion Optics India has a budgetary quote but no MTF validation"],
    programIds: ["PGM-2026-001"],
    mitigation: { title: "Qualify Clarion Optics India as second source", steps: ["Release drawing and MTF spec under NDA", "Order 200 samples for MTF, thermal shift and IP6K9K tests", "Run delta PPAP level 3 with Varuna", "Award 30% share from month 6 after SOP"], costL: 14.0, weeks: 16 },
    suggestedOwner: "Arjun Bhatia", confidence: 87, detected: "2026-09-21",
  },
  {
    id: "RSK-02", supplierId: "SUP-001", signal: "Delivery", score: 81, failureProb: 41, pn: "IMG-2M3-A",
    title: "Image sensor deliveries slipping", summary: "Nexora Semiconductor has missed or re-promised 5 of the last 9 shipments and lead time has grown from 20 to 26 weeks.",
    evidence: ["PO-2026-087 re-promised by 18 days", "Supplier bulletin cites colour-filter capacity through Q1", "No buffer stock held in India"],
    programIds: ["PGM-2026-001"],
    mitigation: { title: "Weekly allocation call and 6-week hub buffer", steps: ["Escalate to Nexora's regional sales director", "Agree a weekly ship plan against firm orders", "Build 6 weeks of stock at the Sahyadri hub after the PPAP build"], costL: 128.5, weeks: 8 },
    suggestedOwner: "Arjun Bhatia", confidence: 83, detected: "2026-09-02",
  },
  {
    id: "RSK-03", supplierId: "SUP-003", signal: "Capacity", score: 79, failureProb: 29, pn: "MCU-32A-144",
    title: "MCU family on 80% allocation", summary: "Kortex Microsystems is confirming 80% of forecast on the 144-pin MCU that the TCU and CAN gateway share.",
    evidence: ["Allocation notice 4 Sep 2026", "Lead time 30 to 38 weeks", "LTA clause 7.2 gives priority to firm 12-month orders"],
    programIds: ["PGM-2026-003", "PGM-2026-004"],
    mitigation: { title: "Firm 12-month order under the LTA", steps: ["Convert forecast to non-cancellable order for 1,65,000 pieces", "Confirm priority allocation in writing", "Hold 8 weeks of stock from Mar 2027"], costL: 95.4, weeks: 3 },
    suggestedOwner: "Arjun Bhatia", confidence: 80, detected: "2026-09-04",
  },
  {
    id: "RSK-04", supplierId: "SUP-026", signal: "Delivery", score: 76, failureProb: 38, pn: "TFT-10.25",
    title: "Display lead time out to 26 weeks", summary: "Lumigrid Displays moved lead time by 8 weeks and is on financial watch after two quarters of negative operating cash flow.",
    evidence: ["PO-2026-095 is 39 days behind the need date", "Driver IC is single source at tier 3", "Credit insurer cut cover by 40% in August"],
    programIds: ["PGM-2026-005"],
    mitigation: { title: "Air-freight first articles and open a second panel source study", steps: ["Split PO-2026-095: 1,500 panels by air", "Ask Lumigrid for a committed weekly output", "Issue an RFI to two alternate panel makers"], costL: 12.8, weeks: 6 },
    suggestedOwner: "Kavya Nair", confidence: 78, detected: "2026-09-12",
  },
  {
    id: "RSK-05", supplierId: "SUP-017", signal: "Geopolitical", score: 64, failureProb: 18, pn: "PCB-CAM-6L",
    title: "HDI boards exposed to import-duty change", summary: "A proposed safeguard duty on bare PCBs from China would add about 11% to the landed cost of the camera board.",
    evidence: ["Trade-remedy investigation notice dated 16 Sep 2026", "All HDI volume is with Stratum PCB in Shenzhen", "Copperleaf Boards is in qualification for the same stack-up"],
    programIds: ["PGM-2026-001"],
    mitigation: { title: "Finish Copperleaf qualification for the HDI stack-up", steps: ["Approve the remaining reliability coupons", "Run 500-board pilot at Sahyadri", "Split volume 60 / 40 from SOP"], costL: 4.6, weeks: 9 },
    suggestedOwner: "Rohit Deshmukh", confidence: 71, detected: "2026-09-17",
  },
  {
    id: "RSK-06", supplierId: "SUP-008", signal: "Capacity", score: 83, failureProb: 44, pn: "AFE-14S",
    title: "Cell monitor IC confirmed at 70%", summary: "Cellguard Analog cannot cover the BMS ramp. The shortfall is 18,000 pieces between December and February.",
    evidence: ["Allocation letter CG-AL-2291", "PO-2026-088 is 12 days behind the pilot-lot need date", "Franchised distributor shows 31,400 pieces in stock"],
    programIds: ["PGM-2026-002"],
    mitigation: { title: "Bridge buy through franchised distribution", steps: ["Reserve 24,000 pieces at the distributor today", "Verify date codes and traceability to the original manufacturer", "Negotiate 2027 volume into the LTA at renewal"], costL: 58.6, weeks: 2 },
    suggestedOwner: "Arjun Bhatia", confidence: 86, detected: "2026-09-18",
  },
  {
    id: "RSK-07", supplierId: "SUP-024", signal: "Financial", score: 67, failureProb: 22,
    title: "Harness supplier on financial watch", summary: "Wirekraft Harness Systems was downgraded one notch and is paying its copper supplier late.",
    evidence: ["Rating agency action 28 Aug 2026", "Sub-tier feedback: copper rod payments at 75 days against 45", "Requested a move from Net 90 to Net 60 twice"],
    programIds: ["PGM-2026-005"],
    mitigation: { title: "Move to Net 60 and qualify Loomtech volume share", steps: ["Agree Net 60 in return for a copper index reset", "Shift 40% of the cluster harness to Loomtech Wiring", "Monthly financial review for two quarters"], costL: 1.9, weeks: 5 },
    suggestedOwner: "Kavya Nair", confidence: 74, detected: "2026-08-29",
  },
  {
    id: "RSK-08", supplierId: "SUP-021", signal: "Quality", score: 58, failureProb: 16, pn: "HSG-CAM-AL",
    title: "Porosity rejects rising on camera housing", summary: "Incoming reject rate at Castwell Alloys went from 0.4% to 1.6% over three lots.",
    evidence: ["NCR-2026-052 open, 8D at D4", "Vacuum-assist unit on die 2 was out of service for 9 days", "Leak-test fallout at Sahyadri: 11 of 800"],
    programIds: ["PGM-2026-001"],
    mitigation: { title: "100% X-ray sort and process audit", steps: ["Supplier-paid 100% X-ray until three clean lots", "VDA 6.3 process audit on the casting cell", "Add vacuum level to the control plan"], costL: 0.8, weeks: 4 },
    suggestedOwner: "Prakash Iyer", confidence: 82, detected: "2026-09-25",
  },
  {
    id: "RSK-09", supplierId: "SUP-014", signal: "Cybersecurity", score: 61, failureProb: 14,
    title: "Ransomware incident at connector supplier", summary: "Bridgepin Connectors disclosed an incident on 3 Oct. Their order portal and EDI were offline for 6 days.",
    evidence: ["Supplier disclosure letter 5 Oct 2026", "Two ASN messages missing in SAP", "No TISAX label on file"],
    programIds: ["PGM-2026-003"],
    mitigation: { title: "Confirm order book manually and request TISAX assessment", steps: ["Reconcile open orders by email against SAP", "Rotate shared portal credentials", "Add TISAX AL2 to the supplier development plan"], costL: 0, weeks: 2 },
    suggestedOwner: "Kavya Nair", confidence: 69, detected: "2026-10-05",
  },
  {
    id: "RSK-10", supplierId: "SUP-023", signal: "Natural disaster", score: 49, failureProb: 9,
    title: "Single gasket plant in a flood zone", summary: "Elastoseal's only plant sits in a Chennai flood zone and cyclone season runs to December.",
    evidence: ["Plant was closed 4 days in the 2023 floods", "No finished-goods stock held outside Chennai", "Gasket tools are Auralis-owned and portable"],
    programIds: ["PGM-2026-004"],
    mitigation: { title: "Hold 6 weeks of gaskets at the Pune hub through December", steps: ["Raise a one-time buffer order", "Confirm tool storage above flood level"], costL: 0.6, weeks: 2 },
    suggestedOwner: "Rohit Deshmukh", confidence: 66, detected: "2026-09-30",
  },
  {
    id: "RSK-11", supplierId: "SUP-030", signal: "Single-source", score: 72, failureProb: 21, pn: "MEMS-P-450",
    title: "TPMS pressure sensor has no second source", summary: "Five lakh units a year depend on one MEMS die from Barosense, and its lead time just moved to 22 weeks.",
    evidence: ["PCN-2026-040", "Two pin-compatible sensors exist but need a seal change", "PO-2026-098 has 8 days of float"],
    programIds: ["PGM-2026-007"],
    mitigation: { title: "Second-source study on two pin-compatible sensors", steps: ["Order 100 samples of each", "1,000-hour drift test and pressure-port seal redesign", "Decide before tooling release in January"], costL: 9.8, weeks: 14 },
    suggestedOwner: "Rohit Deshmukh", confidence: 73, detected: "2026-09-26",
  },
  {
    id: "RSK-12", supplierId: "SUP-007", signal: "Single-source", score: 74, failureProb: 19, pn: "MMIC-77G",
    title: "Radar MMIC single source at 32 weeks", summary: "Sensara RF is the only source for the 77 GHz front end and has put 2027 on 85% allocation.",
    evidence: ["PCN-2026-042", "Antenna design is tied to this MMIC's pin-out", "Capacity reservation draft is on the table"],
    programIds: ["PGM-2026-008"],
    mitigation: { title: "Sign the capacity reservation agreement", steps: ["Legal review of take-or-pay exposure", "Sign for 7,500 a month, 12-month rolling", "Place the SOP order 34 weeks out"], costL: 0, weeks: 4 },
    suggestedOwner: "Arjun Bhatia", confidence: 80, detected: "2026-09-29",
  },
  {
    id: "RSK-13", supplierId: "SUP-005", signal: "Geopolitical", score: 52, failureProb: 11, pn: "LPD4-2G",
    title: "Memory export-licence review", summary: "A licence review on memory shipments routed through a third-country hub could add 2 to 3 weeks of transit.",
    evidence: ["Forwarder advisory 1 Oct 2026", "Current routing: Icheon to Singapore hub to Chennai"],
    programIds: ["PGM-2026-003"],
    mitigation: { title: "Route direct to Chennai and add 2 weeks to MRP lead time", steps: ["Change the forwarder routing", "Update SAP planned delivery time"], costL: 0.4, weeks: 1 },
    suggestedOwner: "Arjun Bhatia", confidence: 64, detected: "2026-10-01",
  },
  {
    id: "RSK-14", supplierId: "SUP-016", signal: "Capacity", score: 63, failureProb: 24, pn: "PCB-TCU-6L",
    title: "PCB plant at 96% utilisation", summary: "Laminar Circuits is running at 96% and has started moving slots. The TCU board has already slipped once.",
    evidence: ["PO-2026-093 moved 11 days", "OTD 90.6% in May, 85.7% in October", "Copperleaf Boards has 22% open capacity"],
    programIds: ["PGM-2026-003"],
    mitigation: { title: "Move the TCU board to Copperleaf after qualification", steps: ["Complete impedance coupons at Copperleaf", "Dual-source 50 / 50 from SOP"], costL: 2.2, weeks: 7 },
    suggestedOwner: "Rohit Deshmukh", confidence: 75, detected: "2026-09-19",
  },
];

function bid(supplierId: string, unitPrice: number, toolingL: number, freightPct: number, dutyPct: number, leadTimeWeeks: number, paymentDays: number, moq: number, qualityScore: number, note: string): Bid {
  return { supplierId, unitPrice, toolingL, freightPct, dutyPct, leadTimeWeeks, paymentDays, moq, qualityScore, note };
}

export const SOURCING_EVENTS: SourcingEvent[] = [
  {
    id: "SE-2026-014", title: "FAKRA Z-code connector, second source", pn: "FAK-Z-90", commodity: "Connector", programId: "PGM-2026-001", status: "Evaluation",
    annualQty: 180000, targetPrice: 104, issued: "2026-09-08", due: "2026-10-16", buyer: "Kavya Nair",
    bids: [
      bid("SUP-013", 118, 0, 3.5, 7.5, 14, 45, 5000, 95, "Incumbent. No tooling. Offered ₹114 for a 3-year award."),
      bid("SUP-032", 97, 6.5, 1.0, 0, 9, 75, 2000, 90, "Local. Samples passed insertion-loss and retention tests."),
      bid("SUP-014", 92, 4.0, 4.0, 10, 12, 60, 10000, 89, "Lowest piece price. Portal outage delayed the technical response."),
    ],
    recommendation: { supplierId: "SUP-032", confidence: 86, rationale: [
      "Lowest landed cost at ₹98.4 once duty, freight, tooling and payment terms are counted. Bridgepin's ₹92 lands at ₹105.2.",
      "Removes a single-source flag on the camera BOM and cuts lead time from 14 to 9 weeks.",
      "Keep Faktron at 30% share so the existing PPAP stays live.",
    ] },
  },
  {
    id: "SE-2026-015", title: "Sealed 48-way header, series supply", pn: "HDR-48S", commodity: "Connector", programId: "PGM-2026-004", status: "Evaluation",
    annualQty: 90000, targetPrice: 172, issued: "2026-09-15", due: "2026-10-23", buyer: "Kavya Nair",
    bids: [
      bid("SUP-015", 178, 18.0, 1.0, 0, 10, 75, 3000, 91, "Incumbent on prototypes. Offers selective gold on signal pins."),
      bid("SUP-032", 171, 24.0, 1.0, 0, 12, 75, 3000, 90, "New tool needed. No sealed 48-way in production today."),
      bid("SUP-013", 169, 0, 3.5, 7.5, 16, 45, 6000, 95, "Catalogue part. Duty and 16 weeks lead time."),
    ],
    recommendation: { supplierId: "SUP-015", confidence: 82, rationale: [
      "Landed ₹185.0 against ₹180.2 for Coaxis, but Sealtite has the sealed 48-way in series production and Coaxis does not.",
      "Selective gold takes a further ₹9 out after award, bringing the landed cost under target.",
      "Same header is used on the TCU, so one award covers 2,10,000 pieces a year.",
    ] },
  },
  {
    id: "SE-2026-016", title: "TPMS sensor PCB, 4-layer", pn: "PCB-TPMS-4L", commodity: "PCB", programId: "PGM-2026-007", status: "Bidding",
    annualQty: 500000, targetPrice: 17, issued: "2026-10-01", due: "2026-10-23", buyer: "Rohit Deshmukh",
    bids: [
      bid("SUP-018", 17.8, 1.2, 1.0, 0, 6, 75, 20000, 92, "Bid received 8 Oct."),
      bid("SUP-016", 17.2, 0.9, 1.0, 0, 6, 75, 25000, 88, "Bid received 9 Oct. Capacity statement missing."),
    ],
  },
  {
    id: "SE-2026-017", title: "ECU housing, die-cast ADC12", pn: "HSG-ECU-AL", commodity: "Die-cast", programId: "PGM-2026-004", status: "Evaluation",
    annualQty: 45000, targetPrice: 198, issued: "2026-09-10", due: "2026-10-30", buyer: "Rohit Deshmukh",
    bids: [
      bid("SUP-021", 212, 26.0, 1.5, 0, 8, 75, 2000, 87, "Single-cavity tool. Porosity NCR open on another part."),
      bid("SUP-022", 204, 31.0, 2.0, 0, 8, 75, 2000, 90, "Two-cavity tool. Cast-in datum removes one machining setup."),
    ],
    recommendation: { supplierId: "SUP-022", confidence: 84, rationale: [
      "Landed ₹229.4 against ₹232.7 for Castwell, including the dearer two-cavity tool.",
      "Ends the concentration of all three housings at Castwell Alloys.",
      "Castwell has an open porosity NCR (NCR-2026-052) at 8D step D4.",
    ] },
  },
  {
    id: "SE-2026-018", title: "Camera lens module, second source", pn: "LENS-190F", commodity: "Optics", programId: "PGM-2026-001", status: "Bidding",
    annualQty: 54000, targetPrice: 455, issued: "2026-10-05", due: "2026-11-06", buyer: "Arjun Bhatia",
    bids: [bid("SUP-020", 455, 38.0, 1.0, 0, 12, 60, 1000, 86, "Budgetary. MTF validation samples promised for 14 Nov.")],
  },
  {
    id: "SE-2026-019", title: "Cluster main harness", pn: "HRN-IC-MAIN", commodity: "Harness", programId: "PGM-2026-005", status: "Awarded", awardedTo: "SUP-024",
    annualQty: 60000, targetPrice: 262, issued: "2026-06-02", due: "2026-07-10", buyer: "Kavya Nair",
    bids: [
      bid("SUP-024", 284, 3.2, 1.0, 0, 5, 90, 1000, 85, "Awarded 14 Jul."),
      bid("SUP-025", 290, 3.6, 1.5, 0, 5, 75, 1000, 88, "Qualified alternate."),
    ],
    recommendation: { supplierId: "SUP-024", confidence: 71, rationale: ["Lowest landed cost at the time of award. Financial watch began six weeks later."] },
  },
  {
    id: "SE-2026-020", title: "MLCC annual buy, FY27", pn: "MLCC-X7R-106", commodity: "Passive", programId: "PGM-2026-001", status: "Awarded", awardedTo: "SUP-009",
    annualQty: 96000000, targetPrice: 1.7, issued: "2026-05-11", due: "2026-06-19", buyer: "Kavya Nair",
    bids: [bid("SUP-009", 1.72, 0, 2.0, 0, 12, 60, 4000, 97, "Awarded 24 Jun on a 12-month fixed price.")],
    recommendation: { supplierId: "SUP-009", confidence: 92, rationale: ["Only AEC-Q200 line with all 41 values on one franchise."] },
  },
  {
    id: "SE-2026-021", title: "Radar radome and housing", pn: "HSG-RAD-PBT", commodity: "Mechanical", programId: "PGM-2026-008", status: "Draft",
    annualQty: 80000, targetPrice: 240, issued: "2026-10-09", due: "2026-11-20", buyer: "Rohit Deshmukh",
    bids: [],
  },
  {
    id: "SE-2026-022", title: "Power inductors, TCU", pn: "IND-PWR-4R7", commodity: "Passive", programId: "PGM-2026-003", status: "Evaluation",
    annualQty: 720000, targetPrice: 13, issued: "2026-09-22", due: "2026-10-19", buyer: "Kavya Nair",
    bids: [
      bid("SUP-010", 13.4, 0, 1.0, 0, 8, 60, 20000, 90, "Incumbent on the camera. AEC-Q200 data on file."),
      bid("SUP-009", 12.9, 0, 2.0, 7.5, 12, 60, 40000, 97, "Imported; duty applies."),
    ],
    recommendation: { supplierId: "SUP-010", confidence: 88, rationale: [
      "Landed ₹13.5 against ₹14.1 for the imported part.",
      "Eight-week lead time and a Chennai plant 40 km from Coromandel Circuit Works.",
    ] },
  },
];

// --- contracts -------------------------------------------------------------

const CLAUSE_LIBRARY: { id: string; name: string; present: string; weak: string; missing: string }[] = [
  { id: "escalation", name: "Price escalation cap", present: "Price changes follow the agreed index and are capped at ±4% in any 12 months.", weak: "Indexing is named but there is no cap and no downward adjustment.", missing: "No limit on price increases. The supplier can reprice at each order." },
  { id: "volume", name: "LTA volume commitment", present: "Volume bands and the price at each band are fixed for the term.", weak: "Forecast is stated as non-binding with no banded price.", missing: "No volume commitment either way, so allocation priority is not earned." },
  { id: "tooling", name: "Tooling ownership", present: "Tooling paid by Auralis is Auralis property and is released on 30 days' notice.", weak: "Ownership is stated but there is no release or access right.", missing: "Tooling ownership is not addressed. Moving the part needs the supplier's consent." },
  { id: "capacity", name: "Capacity reservation", present: "Supplier reserves capacity for forecast plus 20% with 12 weeks' notice.", weak: "Best-efforts language only.", missing: "No reserved capacity. Upside demand is unprotected." },
  { id: "pcn", name: "PCN and EOL notice period", present: "Twelve months' notice for EOL and six for any process change, with last-time-buy rights.", weak: "Notice period is 90 days, below the 12 months OEM manuals require.", missing: "No PCN or EOL notice obligation." },
  { id: "quality", name: "Warranty and PPM chargeback", present: "36-month warranty, PPM target with sorting and line-stop costs chargeable.", weak: "Warranty present; chargeback limited to part replacement.", missing: "No chargeback right for line stops, sorting or field returns." },
  { id: "liability", name: "Recall cost sharing", present: "Recall and field-action costs shared in proportion to fault, cap at 3x annual value.", weak: "Liability capped at 12 months of purchases.", missing: "Recall costs are not addressed." },
  { id: "exit", name: "Termination and exit support", present: "Six months of supply and transfer support after notice.", weak: "30 days' supply after termination.", missing: "No exit support. A dispute could stop supply at once." },
];

function contract(
  num: string, supplierId: string, title: string, type: Contract["type"], valueCr: number, start: string, end: string,
  renewalNoticeDays: number, autoRenew: boolean, owner: string, pattern: string,
): Contract {
  const map: Record<string, ClauseStatus> = { P: "present", W: "weak", M: "missing" };
  return {
    id: `CTR-${num}`, supplierId, title, type, valueCr, start, end, renewalNoticeDays, autoRenew, owner,
    clauses: CLAUSE_LIBRARY.map((clause, index) => {
      const status = map[pattern[index]] ?? "present";
      return {
        id: clause.id, name: clause.name, status, excerpt: clause[status],
        risk: status === "present" ? "Covered" : status === "weak" ? "Renegotiate at renewal" : "Add by amendment",
      };
    }),
  };
}

export const CONTRACTS: Contract[] = [
  contract("2024-011", "SUP-003", "Kortex Microsystems long-term agreement", "LTA", 64.0, "2024-04-01", "2027-03-31", 180, false, "Arjun Bhatia", "PPPPWPPP"),
  contract("2025-004", "SUP-001", "Nexora Semiconductor supply agreement", "LTA", 52.0, "2025-01-01", "2026-12-31", 90, true, "Arjun Bhatia", "MWPMPPWP"),
  contract("2025-019", "SUP-019", "Optivue lens module supply and tooling", "Tooling agreement", 24.0, "2025-06-01", "2028-05-31", 120, false, "Arjun Bhatia", "WPMMPPPW"),
  contract("2023-032", "SUP-016", "Laminar Circuits master supply agreement", "MSA", 26.0, "2023-11-01", "2026-11-30", 60, true, "Rohit Deshmukh", "MMPWPWPP"),
  contract("2025-027", "SUP-026", "Lumigrid Displays supply agreement", "LTA", 34.0, "2025-09-01", "2027-08-31", 90, false, "Kavya Nair", "PWPMMWPW"),
  contract("2024-040", "SUP-021", "Castwell Alloys tooling and supply", "Tooling agreement", 17.0, "2024-08-01", "2027-01-31", 90, true, "Rohit Deshmukh", "WPMPPPPP"),
  contract("2025-033", "SUP-008", "Cellguard Analog supply agreement", "LTA", 23.0, "2025-02-01", "2027-01-31", 120, false, "Arjun Bhatia", "PMPMPPPP"),
  contract("2024-015", "SUP-024", "Wirekraft Harness master supply agreement", "MSA", 14.0, "2024-03-01", "2027-02-28", 90, true, "Kavya Nair", "PPPPPWPM"),
  contract("2025-041", "EMS-03", "Kaveri SMT Systems manufacturing services", "EMS agreement", 45.0, "2025-04-01", "2028-03-31", 180, false, "Meenakshi Rao", "PPPWPWWP"),
  contract("2024-022", "EMS-02", "Coromandel Circuit Works manufacturing services", "EMS agreement", 96.0, "2024-07-01", "2027-06-30", 180, false, "Meenakshi Rao", "PPPPPPPP"),
  contract("2025-048", "SUP-031", "Cellonis Wireless module supply", "LTA", 27.0, "2025-10-01", "2027-09-30", 90, false, "Kavya Nair", "PPPPMPPP"),
  contract("2026-006", "SUP-015", "Sealtite Headers supply agreement", "MSA", 13.0, "2026-02-01", "2029-01-31", 90, true, "Kavya Nair", "PPPPPPPP"),
  contract("2024-037", "SUP-009", "Kyomi Ceramics quality agreement", "Quality agreement", 15.0, "2024-12-01", "2026-12-15", 60, true, "Kavya Nair", "PPPPPPWP"),
  contract("2025-052", "SUP-029", "Brightline Drivers supply agreement", "LTA", 9.0, "2025-05-01", "2027-04-30", 90, false, "Arjun Bhatia", "PPPMMPPW"),
];

// --- spend -----------------------------------------------------------------

/** Direct-material spend by month, crore: actual against plan. */
export const SPEND_MONTHLY = [
  { month: "May", actual: 31.2, plan: 32.0 },
  { month: "Jun", actual: 33.8, plan: 33.0 },
  { month: "Jul", actual: 36.1, plan: 34.5 },
  { month: "Aug", actual: 38.4, plan: 36.0 },
  { month: "Sep", actual: 41.9, plan: 38.5 },
  { month: "Oct", actual: 18.6, plan: 40.0 },
];

/** Spend by program, FY26-27 year to date, crore. */
export const SPEND_BY_PROGRAM: { programId: string; spendCr: number }[] = [
  { programId: "PGM-2026-006", spendCr: 68.4 },
  { programId: "PGM-2026-001", spendCr: 41.2 },
  { programId: "PGM-2026-005", spendCr: 36.9 },
  { programId: "PGM-2026-002", spendCr: 29.7 },
  { programId: "PGM-2026-003", spendCr: 17.8 },
  { programId: "PGM-2026-004", spendCr: 4.1 },
  { programId: "PGM-2026-007", spendCr: 1.9 },
];

export const SAVINGS_PIPELINE: SavingsItem[] = [
  { id: "SAV-01", title: "FAKRA second source award", commodity: "Connector", lever: "Competitive bid", valueL: 33.1, stage: "Negotiating", owner: "Kavya Nair", due: "2026-10-16" },
  { id: "SAV-02", title: "Camera PCB panel utilisation 71% to 84%", commodity: "PCB", lever: "Design to cost", valueL: 25.2, stage: "Validated", owner: "Rohit Deshmukh", due: "2026-11-13" },
  { id: "SAV-03", title: "Camera housing aluminium indexing and 2-setup machining", commodity: "Die-cast", lever: "Should-cost", valueL: 28.8, stage: "Negotiating", owner: "Rohit Deshmukh", due: "2026-10-30" },
  { id: "SAV-04", title: "Harness copper index reset, two programs", commodity: "Harness", lever: "Index adjustment", valueL: 12.0, stage: "Validated", owner: "Kavya Nair", due: "2026-10-27" },
  { id: "SAV-05", title: "Sealed header selective gold plating", commodity: "Connector", lever: "Specification change", valueL: 8.1, stage: "Identified", owner: "Kavya Nair", due: "2026-11-20" },
  { id: "SAV-06", title: "MLCC FY27 fixed-price award", commodity: "Passive", lever: "Volume bundling", valueL: 19.4, stage: "Realised", owner: "Kavya Nair", due: "2026-06-24" },
  { id: "SAV-07", title: "Lens yield-linked pricing at 92%", commodity: "Optics", lever: "Should-cost", valueL: 37.8, stage: "Identified", owner: "Arjun Bhatia", due: "2026-12-04" },
  { id: "SAV-08", title: "Taiwan freight consolidation, sensor and lens", commodity: "Logistics", lever: "Logistics", valueL: 10.8, stage: "Validated", owner: "Arjun Bhatia", due: "2026-11-06" },
  { id: "SAV-09", title: "ECU housing two-cavity tool award", commodity: "Die-cast", lever: "Competitive bid", valueL: 3.6, stage: "Negotiating", owner: "Rohit Deshmukh", due: "2026-10-30" },
  { id: "SAV-10", title: "BMS PCB second laminate source", commodity: "PCB", lever: "Specification change", valueL: 16.8, stage: "Realised", owner: "Rohit Deshmukh", due: "2026-08-21" },
  { id: "SAV-11", title: "PMIC dual-source price alignment", commodity: "Semiconductor", lever: "Competitive bid", valueL: 9.2, stage: "Identified", owner: "Arjun Bhatia", due: "2026-12-11" },
];

export const MAVERICK_SPEND: MaverickItem[] = [
  { id: "MAV-01", description: "MCU spot buy, 2,400 pieces", supplier: "Unlisted broker (Singapore)", commodity: "Semiconductor", valueL: 14.6, reason: "Bought outside the AVL at 2.4x contract price with no traceability to the manufacturer", requester: "Kaveri SMT Systems", date: "2026-09-24" },
  { id: "MAV-02", description: "Conformal coating material", supplier: "Local distributor", commodity: "Chemicals", valueL: 3.8, reason: "No contract; three POs split under the ₹2L approval limit", requester: "Plant stores, Pune", date: "2026-09-30" },
  { id: "MAV-03", description: "Air freight, Shenzhen to Chennai", supplier: "Spot forwarder", commodity: "Logistics", valueL: 6.2, reason: "Contracted forwarder not used; rate 31% above the lane agreement", requester: "Coromandel Circuit Works", date: "2026-10-03" },
  { id: "MAV-04", description: "Test fixture rework", supplier: "Unregistered vendor", commodity: "Tooling", valueL: 2.9, reason: "Vendor not onboarded in SAP; paid on a one-time vendor code", requester: "Test engineering", date: "2026-09-12" },
  { id: "MAV-05", description: "Sealed header prototypes, 200 pieces", supplier: "Catalogue distributor", commodity: "Connector", valueL: 1.4, reason: "Preferred supplier Sealtite had stock; engineering ordered direct", requester: "R&D, Pune", date: "2026-10-06" },
  { id: "MAV-06", description: "MLCC top-up, 18 values", supplier: "Non-franchised distributor", commodity: "Passive", valueL: 4.1, reason: "Non-franchised source for AEC-Q200 parts breaches the Varuna quality manual", requester: "Sahyadri Electronics Manufacturing", date: "2026-09-19" },
  { id: "MAV-07", description: "Die repair, camera housing tool", supplier: "Castwell Alloys", commodity: "Tooling", valueL: 5.5, reason: "Invoice raised with no PO; tooling agreement makes wear repairs the supplier's cost", requester: "Castwell Alloys", date: "2026-10-01" },
  { id: "MAV-08", description: "Packaging trays, ESD", supplier: "Local vendor", commodity: "Packaging", valueL: 1.1, reason: "Contract price exists with another vendor at 18% less", requester: "Plant stores, Chennai", date: "2026-10-08" },
];
