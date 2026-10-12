import type { Oem, Program, Quote, RfqPack, Stage } from "../types";

export const PEOPLE = {
  head: "Meenakshi Rao",
  buyers: ["Arjun Bhatia", "Kavya Nair", "Rohit Deshmukh"],
  pms: ["Sneha Kulkarni", "Imran Sheikh", "Divya Menon"],
  sqes: ["Prakash Iyer", "Tanvi Joshi", "Harpreet Gill"],
} as const;

export const ALL_PEOPLE: string[] = [PEOPLE.head, ...PEOPLE.buyers, ...PEOPLE.pms, ...PEOPLE.sqes];

export const STAGES: Stage[] = [
  { id: "rfi", label: "RFI Received", short: "RFI", markId: "mark-stage-rfi" },
  { id: "rfq-analysis", label: "RFQ Analysis", short: "RFQ", markId: "mark-stage-rfq" },
  { id: "quote-submitted", label: "Quote Submitted", short: "Quote", markId: "mark-stage-quote" },
  { id: "awarded", label: "Program Awarded", short: "Award", markId: "mark-stage-award" },
  { id: "bom-finalised", label: "BOM Finalised", short: "BOM", markId: "mark-stage-bom" },
  { id: "suppliers-onboarded", label: "Suppliers Onboarded", short: "Suppliers", markId: "mark-stage-suppliers" },
  { id: "pos-placed", label: "POs Placed", short: "POs", markId: "mark-stage-po" },
  { id: "production-scheduled", label: "Production Scheduled", short: "Production", markId: "mark-stage-production" },
  { id: "sop-achieved", label: "SOP Achieved", short: "SOP", markId: "mark-stage-sop" },
];

export const OEMS: Oem[] = [
  { id: "OEM-VAR", name: "Varuna Motors", segment: "Passenger vehicles", city: "Pune" },
  { id: "OEM-KES", name: "Kestrel Auto", segment: "Passenger vehicles", city: "Chennai" },
  { id: "OEM-TEJ", name: "Tejas EV", segment: "Electric two-wheelers", city: "Hosur" },
  { id: "OEM-IND", name: "Indus Commercial Vehicles", segment: "Trucks and buses", city: "Jamshedpur" },
  { id: "OEM-MER", name: "Meridian Mobility", segment: "Electric passenger vehicles", city: "Sanand" },
  { id: "OEM-ORB", name: "Orbis Two-Wheelers", segment: "Motorcycles and scooters", city: "Manesar" },
];

export const PROGRAMS: Program[] = [
  {
    id: "PGM-2026-001", name: "Varuna ADAS front camera", oemId: "OEM-VAR", product: "ADAS front camera module", productCode: "ADAS-CAM-001",
    stage: "pos-placed", daysInStage: 23, baseRisk: "high", nextMilestone: "PPAP build material on dock", nextMilestoneDate: "2026-11-30",
    sopDate: "2027-02-15", annualVolume: 180000, unitPrice: 4650, lifetimeValueCr: 418, pm: "Sneha Kulkarni", buyer: "Arjun Bhatia", sqe: "Prakash Iyer",
    emsId: "EMS-01", base: { bom: 96, suppliers: 95, material: 94, production: 92, quality: 94 },
  },
  {
    id: "PGM-2026-002", name: "Tejas 2W battery management", oemId: "OEM-TEJ", product: "BMS module, 14S two-wheeler EV", productCode: "BMS-2W-014",
    stage: "production-scheduled", daysInStage: 12, baseRisk: "high", nextMilestone: "Pilot lot of 500 at Kaveri SMT", nextMilestoneDate: "2026-11-09",
    sopDate: "2026-12-07", annualVolume: 240000, unitPrice: 2850, lifetimeValueCr: 274, pm: "Imran Sheikh", buyer: "Arjun Bhatia", sqe: "Tanvi Joshi",
    emsId: "EMS-03", base: { bom: 98, suppliers: 97, material: 94, production: 94, quality: 92 },
  },
  {
    id: "PGM-2026-003", name: "Kestrel telematics unit", oemId: "OEM-KES", product: "Telematics control unit, 4G", productCode: "TCU-4G-007",
    stage: "suppliers-onboarded", daysInStage: 31, baseRisk: "medium", nextMilestone: "Release long-lead POs", nextMilestoneDate: "2026-10-26",
    sopDate: "2027-04-12", annualVolume: 120000, unitPrice: 6200, lifetimeValueCr: 372, pm: "Divya Menon", buyer: "Kavya Nair", sqe: "Harpreet Gill",
    emsId: "EMS-02", base: { bom: 95, suppliers: 94, material: 92, production: 92, quality: 92 },
  },
  {
    id: "PGM-2026-004", name: "Indus CAN gateway", oemId: "OEM-IND", product: "CAN FD gateway ECU", productCode: "CGW-CV-003",
    stage: "bom-finalised", daysInStage: 18, baseRisk: "medium", nextMilestone: "Award housing and header sourcing", nextMilestoneDate: "2026-10-30",
    sopDate: "2027-06-21", annualVolume: 45000, unitPrice: 5400, lifetimeValueCr: 146, pm: "Imran Sheikh", buyer: "Rohit Deshmukh", sqe: "Prakash Iyer",
    emsId: "EMS-04", base: { bom: 94, suppliers: 96, material: 92, production: 94, quality: 92 },
  },
  {
    id: "PGM-2026-005", name: "Meridian digital cluster", oemId: "OEM-MER", product: "Digital instrument cluster, 10.25 in", productCode: "IC-TFT-010",
    stage: "pos-placed", daysInStage: 40, baseRisk: "high", nextMilestone: "Display first articles at Coromandel", nextMilestoneDate: "2026-12-21",
    sopDate: "2027-03-08", annualVolume: 60000, unitPrice: 14800, lifetimeValueCr: 444, pm: "Divya Menon", buyer: "Kavya Nair", sqe: "Tanvi Joshi",
    emsId: "EMS-02", base: { bom: 95, suppliers: 94, material: 94, production: 94, quality: 93 },
  },
  {
    id: "PGM-2026-006", name: "Varuna headlamp controller", oemId: "OEM-VAR", product: "LED matrix headlamp controller", productCode: "LHC-MX-005",
    stage: "sop-achieved", daysInStage: 63, baseRisk: "low", nextMilestone: "Run-at-rate audit by Varuna", nextMilestoneDate: "2026-11-18",
    sopDate: "2026-08-10", annualVolume: 300000, unitPrice: 1450, lifetimeValueCr: 218, pm: "Sneha Kulkarni", buyer: "Arjun Bhatia", sqe: "Harpreet Gill",
    emsId: "EMS-04", base: { bom: 100, suppliers: 99, material: 98, production: 98, quality: 98 },
  },
  {
    id: "PGM-2026-007", name: "Orbis TPMS sensor", oemId: "OEM-ORB", product: "TPMS sensor, BLE", productCode: "TPMS-BLE-002",
    stage: "bom-finalised", daysInStage: 9, baseRisk: "medium", nextMilestone: "Close PCB sourcing event", nextMilestoneDate: "2026-10-23",
    sopDate: "2027-07-19", annualVolume: 500000, unitPrice: 620, lifetimeValueCr: 155, pm: "Imran Sheikh", buyer: "Rohit Deshmukh", sqe: "Tanvi Joshi",
    emsId: "EMS-05", base: { bom: 93, suppliers: 91, material: 92, production: 94, quality: 92 },
  },
  {
    id: "PGM-2026-008", name: "Kestrel corner radar", oemId: "OEM-KES", product: "77 GHz corner radar unit", productCode: "RAD-CR-001",
    stage: "awarded", daysInStage: 14, baseRisk: "medium", nextMilestone: "BOM freeze review", nextMilestoneDate: "2026-11-16",
    sopDate: "2027-10-04", annualVolume: 80000, unitPrice: 7900, lifetimeValueCr: 316, pm: "Sneha Kulkarni", buyer: "Arjun Bhatia", sqe: "Prakash Iyer",
    emsId: "EMS-01", base: { bom: 90, suppliers: 90, material: 90, production: 92, quality: 90 },
  },
  {
    id: "PGM-2026-009", name: "Meridian PV battery management", oemId: "OEM-MER", product: "BMS module, 96S passenger EV", productCode: "BMS-PV-021",
    stage: "quote-submitted", daysInStage: 21, baseRisk: "medium", nextMilestone: "Meridian sourcing board decision", nextMilestoneDate: "2026-11-05",
    sopDate: "2028-01-17", annualVolume: 70000, unitPrice: 11200, lifetimeValueCr: 392, pm: "Divya Menon", buyer: "Arjun Bhatia", sqe: "Tanvi Joshi",
    base: { bom: 0, suppliers: 0, material: 0, production: 0, quality: 0 },
  },
  {
    id: "PGM-2026-010", name: "Indus fleet telematics", oemId: "OEM-IND", product: "Telematics control unit, CV", productCode: "TCU-CV-009",
    stage: "quote-submitted", daysInStage: 8, baseRisk: "low", nextMilestone: "Technical review with Indus", nextMilestoneDate: "2026-10-21",
    sopDate: "2027-11-15", annualVolume: 55000, unitPrice: 6900, lifetimeValueCr: 190, pm: "Imran Sheikh", buyer: "Kavya Nair", sqe: "Harpreet Gill",
    base: { bom: 0, suppliers: 0, material: 0, production: 0, quality: 0 },
  },
  {
    id: "PGM-2026-011", name: "Tejas 2W cluster", oemId: "OEM-TEJ", product: "Instrument cluster, 5 in two-wheeler", productCode: "IC-2W-012",
    stage: "rfq-analysis", daysInStage: 6, baseRisk: "medium", nextMilestone: "Feasibility sign-off", nextMilestoneDate: "2026-10-19",
    sopDate: "2027-12-06", annualVolume: 320000, unitPrice: 2100, lifetimeValueCr: 336, pm: "Sneha Kulkarni", buyer: "Kavya Nair", sqe: "Prakash Iyer",
    base: { bom: 0, suppliers: 0, material: 0, production: 0, quality: 0 },
  },
  {
    id: "PGM-2026-012", name: "Varuna surround-view camera", oemId: "OEM-VAR", product: "Surround-view camera, 190 degree", productCode: "SVC-190-004",
    stage: "rfi", daysInStage: 3, baseRisk: "low", nextMilestone: "RFI response to Varuna", nextMilestoneDate: "2026-10-20",
    sopDate: "2028-03-13", annualVolume: 400000, unitPrice: 2300, lifetimeValueCr: 460, pm: "Sneha Kulkarni", buyer: "Arjun Bhatia", sqe: "Prakash Iyer",
    base: { bom: 0, suppliers: 0, material: 0, production: 0, quality: 0 },
  },
];

function req(label: string, value: string, source: string, confidence: number) {
  return { label, value, source, confidence };
}

export const RFQS: RfqPack[] = [
  {
    id: "RFQ-2026-118", oemId: "OEM-VAR", product: "Surround-view camera, 190 degree", programId: "PGM-2026-012", received: "2026-10-09", due: "2026-10-20",
    status: "Parsed — Review Required", matchConfidence: 91, annualVolume: 400000, sopTarget: "2028-03-13", targetPrice: 2300, owner: "Sneha Kulkarni",
    documents: [
      { name: "Varuna_SVC_RFI_v2.pdf", kind: "RFI cover and commercial terms", pages: 14 },
      { name: "SVC-190_Component_Spec.pdf", kind: "Technical specification", pages: 62 },
      { name: "Varuna_Supplier_Quality_Manual_R7.pdf", kind: "Quality manual", pages: 88 },
      { name: "SVC_Envelope_Drawing.step", kind: "3D envelope", pages: 1 },
    ],
    requirements: [
      req("Image sensor", "1.3 MP, HDR 120 dB, LED flicker mitigation", "Component spec §4.2", 96),
      req("Field of view", "190° horizontal, distortion table supplied", "Component spec §4.5", 94),
      req("Video interface", "GMSL2 over coax, FAKRA Z-code", "Component spec §5.1", 97),
      req("Ingress protection", "IP6K9K, ISO 20653", "Component spec §7.3", 93),
      req("Operating temperature", "-40 to +85 °C ambient", "Component spec §7.1", 98),
      req("Functional safety", "ASIL B (camera as sensor), ISO 26262", "Component spec §9", 88),
      req("EMC", "CISPR 25 Class 5 radiated, ISO 11452-4 BCI 200 mA", "Component spec §8", 90),
      req("PPAP", "Level 3, AIAG 4th edition", "Quality manual §6.4", 95),
      req("Annual volume", "4,00,000 units at 4 per vehicle", "RFI cover §2", 99),
      req("Payment terms", "Net 60 from GRN", "RFI cover §5", 97),
    ],
    gaps: [
      { id: "G1", question: "Is lens heater required for the cold-climate export variant?", why: "Spec §4.7 mentions de-fog time but lists no heater power budget. Adds about ₹46 per unit." },
      { id: "G2", question: "Who owns active-alignment tooling at end of program?", why: "RFI cover is silent on tooling ownership. Tooling is ₹1.8 Cr." },
      { id: "G3", question: "Is the 120 dB HDR figure at sensor or at ISP output?", why: "Decides between two sensor options with a 22-week and a 14-week lead time." },
    ],
  },
  {
    id: "RFQ-2026-117", oemId: "OEM-TEJ", product: "Instrument cluster, 5 in two-wheeler", programId: "PGM-2026-011", received: "2026-10-06", due: "2026-10-19",
    status: "Sent to Quoting", matchConfidence: 94, annualVolume: 320000, sopTarget: "2027-12-06", targetPrice: 2100, owner: "Sneha Kulkarni",
    documents: [
      { name: "Tejas_IC2W_RFQ.pdf", kind: "RFQ and commercial terms", pages: 22 },
      { name: "IC-2W_SOR_revC.pdf", kind: "Statement of requirements", pages: 48 },
      { name: "Tejas_BOM_Template.xlsx", kind: "Cost breakdown template", pages: 6 },
    ],
    requirements: [
      req("Display", "5 in TFT, 800 x 480, 1000 nit, optical bonding", "SOR §3.1", 97),
      req("Connectivity", "BLE 5.2, CAN FD", "SOR §3.4", 96),
      req("Ingress protection", "IP67 with pressure-wash exposure", "SOR §6.2", 92),
      req("Vibration", "ISO 16750-3 two-wheeler profile, 30 g peak", "SOR §6.4", 89),
      req("Target price", "₹2,100 at 3,20,000 per year", "RFQ §4", 99),
      req("Tooling", "OEM-owned, amortised over 24 months", "RFQ §6", 95),
      req("PPAP", "Level 3", "RFQ §8", 96),
    ],
    gaps: [
      { id: "G1", question: "Is sunlight readability measured at 1000 nit centre or average?", why: "Changes the backlight LED count from 12 to 16." },
    ],
  },
  {
    id: "RFQ-2026-116", oemId: "OEM-IND", product: "Telematics control unit, CV", programId: "PGM-2026-010", received: "2026-09-22", due: "2026-10-12",
    status: "Sent to Quoting", matchConfidence: 96, annualVolume: 55000, sopTarget: "2027-11-15", targetPrice: 6900, owner: "Imran Sheikh",
    documents: [
      { name: "Indus_TCU_RFQ_Pack.pdf", kind: "RFQ and commercial terms", pages: 31 },
      { name: "TCU-CV_Technical_Spec.pdf", kind: "Technical specification", pages: 74 },
    ],
    requirements: [
      req("Cellular", "LTE Cat-4 with 2G fallback, AIS-140 compliant", "Tech spec §4", 97),
      req("GNSS", "L1 + L5, NavIC support", "Tech spec §4.3", 95),
      req("Supply voltage", "9 to 32 V, ISO 16750-2 load dump 58 V", "Tech spec §5", 94),
      req("Backup battery", "Li-ion, 4 h reporting after main power loss", "Tech spec §5.4", 91),
      req("Cybersecurity", "UN R155, secure boot, HSM", "Tech spec §9", 87),
      req("Warranty", "36 months or 3,00,000 km", "RFQ §7", 98),
    ],
    gaps: [],
  },
  {
    id: "RFQ-2026-115", oemId: "OEM-MER", product: "BMS module, 96S passenger EV", programId: "PGM-2026-009", received: "2026-09-08", due: "2026-09-29",
    status: "Sent to Quoting", matchConfidence: 93, annualVolume: 70000, sopTarget: "2028-01-17", targetPrice: 11200, owner: "Divya Menon",
    documents: [
      { name: "Meridian_BMS96_RFQ.pdf", kind: "RFQ and commercial terms", pages: 28 },
      { name: "BMS-PV_System_Requirements.pdf", kind: "System requirements", pages: 112 },
      { name: "Meridian_APQP_Timing.xlsx", kind: "Timing plan", pages: 3 },
    ],
    requirements: [
      req("Cell monitoring", "96 series cells, ±2 mV accuracy", "SysReq §3.2", 96),
      req("Functional safety", "ASIL C, ISO 26262", "SysReq §8", 92),
      req("Isolation", "Reinforced, 800 V system, IEC 60664-1", "SysReq §5.3", 90),
      req("Communication", "isoSPI daisy chain, CAN FD to VCU", "SysReq §4", 95),
      req("Balancing", "Passive, 150 mA per cell", "SysReq §3.6", 94),
    ],
    gaps: [],
  },
  {
    id: "RFQ-2026-119", oemId: "OEM-KES", product: "Rear occupant alert radar, 60 GHz", received: "2026-10-12", due: "2026-10-30",
    status: "AI Parsing", matchConfidence: 0, annualVolume: 150000, sopTarget: "2028-06-05", targetPrice: 1850, owner: "Sneha Kulkarni",
    documents: [
      { name: "Kestrel_ROA_RFQ.pdf", kind: "RFQ and commercial terms", pages: 19 },
      { name: "ROA_Radar_Spec_draft.pdf", kind: "Technical specification", pages: 41 },
    ],
    requirements: [],
    gaps: [],
  },
  {
    id: "RFQ-2026-120", oemId: "OEM-ORB", product: "Smart key fob receiver ECU", received: "2026-10-12", due: "2026-11-02",
    status: "New", matchConfidence: 0, annualVolume: 600000, sopTarget: "2028-02-14", targetPrice: 480, owner: "Imran Sheikh",
    documents: [
      { name: "Orbis_KeyECU_RFQ.zip", kind: "RFQ archive, 7 files", pages: 96 },
    ],
    requirements: [],
    gaps: [],
  },
  {
    id: "RFQ-2026-114", oemId: "OEM-VAR", product: "Body control module, mid variant", received: "2026-10-01", due: "2026-10-22",
    status: "Parsed — Review Required", matchConfidence: 78, annualVolume: 210000, sopTarget: "2028-04-10", targetPrice: 3900, owner: "Divya Menon",
    documents: [
      { name: "Varuna_BCM_RFQ.pdf", kind: "RFQ and commercial terms", pages: 26 },
      { name: "BCM_Mid_Function_List.xlsx", kind: "Function and I/O list", pages: 9 },
      { name: "BCM_Connector_Drawing.pdf", kind: "2D drawing (scanned)", pages: 4 },
    ],
    requirements: [
      req("Outputs", "38 high-side, 12 low-side, 4 H-bridge", "Function list tab 2", 84),
      req("Network", "2 x CAN FD, 4 x LIN", "Function list tab 1", 93),
      req("Connector", "2 x sealed header, pin count unreadable on scan", "Connector drawing sheet 2", 52),
      req("Quiescent current", "Under 150 µA", "RFQ §3.8", 90),
      req("Functional safety", "ASIL B for exterior lighting", "RFQ §5", 86),
      req("Target price", "₹3,900 at 2,10,000 per year", "RFQ §4", 99),
    ],
    gaps: [
      { id: "G1", question: "Confirm header pin counts: scan reads 48 and either 32 or 52.", why: "Drawing is a low-resolution scan. Pin count sets the PCB outline and the header price." },
      { id: "G2", question: "Is the price escalation clause in §4.3 symmetric for copper and gold?", why: "Text only names increases. Our LTA template needs both directions." },
      { id: "G3", question: "Does 'local content 60%' count EMS conversion as local?", why: "Decides whether the PCB must move from Shenzhen to Hosur." },
      { id: "G4", question: "Is the 36-month price-down of 3% per year firm or indicative?", why: "At 3% the program falls below the 9% margin floor in year 3." },
    ],
  },
  {
    id: "RFQ-2026-113", oemId: "OEM-TEJ", product: "On-board charger control board, 3.3 kW", received: "2026-09-28", due: "2026-10-16",
    status: "Parsed — Review Required", matchConfidence: 88, annualVolume: 90000, sopTarget: "2027-12-20", targetPrice: 3200, owner: "Imran Sheikh",
    documents: [
      { name: "Tejas_OBC_Control_RFQ.pdf", kind: "RFQ and commercial terms", pages: 18 },
      { name: "OBC_Control_Schematic_Intent.pdf", kind: "Reference schematic", pages: 12 },
    ],
    requirements: [
      req("Controller", "32-bit MCU with HRPWM, dual-core lockstep preferred", "Schematic intent p.3", 91),
      req("Isolation", "Reinforced gate drive, 5 kV rms", "Schematic intent p.6", 89),
      req("Conformal coating", "Acrylic, IPC-CC-830", "RFQ §6.2", 95),
      req("Test coverage", "ICT plus functional test, 100%", "RFQ §6.5", 96),
      req("Build model", "Build to print, consigned magnetics", "RFQ §2", 93),
    ],
    gaps: [
      { id: "G1", question: "Are consigned magnetics delivered to the EMS partner or to our hub?", why: "Changes inventory ownership and the logistics line of the quote." },
      { id: "G2", question: "Is the preferred MCU family negotiable?", why: "The named family is on 80% allocation at Kortex Microsystems through Q1." },
    ],
  },
  {
    id: "RFQ-2026-112", oemId: "OEM-IND", product: "Tachograph interface unit", received: "2026-09-15", due: "2026-10-06",
    status: "Sent to Quoting", matchConfidence: 90, annualVolume: 30000, sopTarget: "2027-09-27", targetPrice: 4100, owner: "Divya Menon",
    documents: [{ name: "Indus_Tacho_RFQ.pdf", kind: "RFQ and commercial terms", pages: 24 }],
    requirements: [
      req("Interfaces", "CAN FD, K-line, 2 x digital pulse", "RFQ §3", 94),
      req("Supply", "24 V system, reverse polarity protected", "RFQ §3.2", 96),
      req("Sealing", "IP54 cabin mounted", "RFQ §3.6", 93),
    ],
    gaps: [],
  },
];

export const QUOTES: Quote[] = [
  {
    id: "QT-2026-031", rfqId: "RFQ-2026-117", programId: "PGM-2026-011", oemId: "OEM-TEJ", product: "Instrument cluster, 5 in two-wheeler", status: "Draft",
    annualVolume: 320000, cost: { components: 1318, rawMaterials: 142, labour: 96, tooling: 58, logistics: 44, overhead: 172 }, marginPct: 10.5, marginFloorPct: 9,
    targetPrice: 2100, feasibility: { technical: 86, supplyChain: 64, capacity: 82, timeline: 71 },
    feasibilityNotes: [
      "Display is the long pole: 5 in bonded TFT quotes at 24 weeks from Lumigrid Displays, and that supplier is already late on the Meridian cluster.",
      "Coromandel Circuit Works has line time for 27,000 boards per month from Oct 2027 only if the Meridian cluster ramp moves to Aravali.",
      "IP67 with pressure wash needs a new gasket profile. Elastoseal Polymers quotes 10 weeks for tooling.",
    ],
    due: "2026-10-19", owner: "Kavya Nair",
  },
  {
    id: "QT-2026-030", rfqId: "RFQ-2026-116", programId: "PGM-2026-010", oemId: "OEM-IND", product: "Telematics control unit, CV", status: "Submitted",
    annualVolume: 55000, cost: { components: 4420, rawMaterials: 318, labour: 244, tooling: 132, logistics: 118, overhead: 596 }, marginPct: 13.2, marginFloorPct: 9,
    targetPrice: 6900, feasibility: { technical: 91, supplyChain: 72, capacity: 88, timeline: 84 },
    feasibilityNotes: [
      "LTE Cat-4 module in the reference design is under an EOL notice. Quote assumes the Cat-1bis successor from SOP.",
      "Board is 82% common with the Kestrel TCU, so PPAP for 31 parts can be by similarity.",
    ],
    due: "2026-10-12", owner: "Kavya Nair",
  },
  {
    id: "QT-2026-029", rfqId: "RFQ-2026-115", programId: "PGM-2026-009", oemId: "OEM-MER", product: "BMS module, 96S passenger EV", status: "Submitted",
    annualVolume: 70000, cost: { components: 7340, rawMaterials: 486, labour: 392, tooling: 214, logistics: 162, overhead: 1024 }, marginPct: 12.4, marginFloorPct: 10,
    targetPrice: 11200, feasibility: { technical: 84, supplyChain: 61, capacity: 86, timeline: 78 },
    feasibilityNotes: [
      "Eight cell-monitor ICs per module. Cellguard Analog is confirming only 70% of demand on this family.",
      "ASIL C needs an ISO 26262 process audit at the EMS partner. Sahyadri holds it, Kaveri does not.",
    ],
    due: "2026-09-29", owner: "Arjun Bhatia",
  },
  {
    id: "QT-2026-028", rfqId: "RFQ-2026-112", oemId: "OEM-IND", product: "Tachograph interface unit", status: "In Review",
    annualVolume: 30000, cost: { components: 2610, rawMaterials: 236, labour: 188, tooling: 164, logistics: 92, overhead: 402 }, marginPct: 8.1, marginFloorPct: 9,
    targetPrice: 4100, feasibility: { technical: 93, supplyChain: 85, capacity: 92, timeline: 90 },
    feasibilityNotes: [
      "At the OEM target the margin is 8.1%, under the 9% floor. Needs head of procurement sign-off or ₹38 of cost-down.",
      "Low volume makes tooling amortisation heavy at ₹164 per unit.",
    ],
    due: "2026-10-16", owner: "Rohit Deshmukh",
  },
  {
    id: "QT-2026-027", rfqId: "RFQ-2026-113", oemId: "OEM-TEJ", product: "On-board charger control board, 3.3 kW", status: "Draft",
    annualVolume: 90000, cost: { components: 2046, rawMaterials: 164, labour: 212, tooling: 74, logistics: 68, overhead: 318 }, marginPct: 11, marginFloorPct: 9,
    targetPrice: 3200, feasibility: { technical: 88, supplyChain: 58, capacity: 90, timeline: 74 },
    feasibilityNotes: [
      "Named MCU family is on 80% allocation at Kortex Microsystems. A pin-compatible alternate adds 14 weeks of firmware validation.",
      "Conformal coating and ICT are available at Thar Coatings & Test with no new capital.",
    ],
    due: "2026-10-16", owner: "Arjun Bhatia",
  },
  {
    id: "QT-2026-024", rfqId: "RFQ-2026-101", programId: "PGM-2026-008", oemId: "OEM-KES", product: "77 GHz corner radar unit", status: "Won",
    annualVolume: 80000, cost: { components: 4980, rawMaterials: 412, labour: 286, tooling: 196, logistics: 124, overhead: 742 }, marginPct: 14.7, marginFloorPct: 10,
    targetPrice: 7900, feasibility: { technical: 82, supplyChain: 66, capacity: 85, timeline: 80 },
    feasibilityNotes: ["Awarded 28 Sep 2026. Radar MMIC is single source at 32 weeks."],
    due: "2026-08-31", owner: "Arjun Bhatia",
  },
  {
    id: "QT-2026-026", rfqId: "RFQ-2026-114", oemId: "OEM-VAR", product: "Body control module, mid variant", status: "Draft",
    annualVolume: 210000, cost: { components: 2392, rawMaterials: 248, labour: 176, tooling: 86, logistics: 72, overhead: 414 }, marginPct: 11.6, marginFloorPct: 9,
    targetPrice: 3900, feasibility: { technical: 79, supplyChain: 77, capacity: 74, timeline: 83 },
    feasibilityNotes: [
      "Connector pin count is unconfirmed, so the header price carries a ±₹40 band.",
      "A 3% yearly price-down takes margin to 8.4% in year 3 unless copper is indexed.",
    ],
    due: "2026-10-22", owner: "Rohit Deshmukh",
  },
];
