import type { DefectCategory, DetectionPoint, Ncr, PpapElementStatus, PpapSubmission, RiskLevel } from "../types";

/** The 18 PPAP elements in AIAG order. */
export const PPAP_ELEMENTS: string[] = [
  "Design records",
  "Engineering change documents",
  "Customer engineering approval",
  "Design FMEA",
  "Process flow diagram",
  "Process FMEA",
  "Control plan",
  "Measurement system analysis",
  "Dimensional results",
  "Material and performance test results",
  "Initial process studies",
  "Qualified laboratory documentation",
  "Appearance approval report",
  "Sample production parts",
  "Master sample",
  "Checking aids",
  "Customer-specific requirements",
  "Part submission warrant",
];

export const EIGHT_D: string[] = [
  "D1 Team",
  "D2 Problem description",
  "D3 Containment",
  "D4 Root cause",
  "D5 Corrective action chosen",
  "D6 Corrective action implemented",
  "D7 Prevent recurrence",
  "D8 Closure",
];

const CODE: Record<string, PpapElementStatus> = { A: "approved", S: "submitted", P: "pending", O: "overdue", N: "na" };

function ppap(
  num: string, pn: string, description: string, supplierId: string, program: string, level: PpapSubmission["level"],
  due: string, sqe: string, pattern: string, blocksSop: boolean, note: string,
): PpapSubmission {
  return {
    id: `PPAP-${num}`, pn, description, supplierId, programId: `PGM-2026-${program}`, level, due, sqe,
    elements: pattern.split("").map((c) => CODE[c] ?? "pending"), blocksSop, note,
  };
}

const PI = "Prakash Iyer";
const TJ = "Tanvi Joshi";
const HG = "Harpreet Gill";

/* Pattern: one letter per element. A approved, S submitted, P pending, O overdue, N not applicable. */
export const PPAP_SUBMISSIONS: PpapSubmission[] = [
  ppap("0141", "LENS-190F", "Lens module, athermal", "SUP-019", "001", 3, "2026-10-05", PI, "AANAAASOOSPANSPANP", true, "MSA and dimensional results are a week overdue. Supplier says the MTF bench was down."),
  ppap("0142", "IMG-2M3-A", "Image sensor, 2.3 MP HDR", "SUP-001", "001", 3, "2026-11-13", PI, "AAAAAAAASSAANSNNAP", true, "Waiting on production samples from PO-2026-087."),
  ppap("0143", "PCB-CAM-6L", "Bare PCB, 6-layer HDI", "SUP-017", "001", 3, "2026-10-30", PI, "AANAAAAAASSANSNAAP", false, "Dimensional and micro-section reports submitted 9 Oct."),
  ppap("0144", "HSG-CAM-AL", "Front housing, die-cast", "SUP-021", "001", 3, "2026-10-09", PI, "AANAAAOASOPAAANSAP", true, "Control plan must add vacuum level after NCR-2026-052. Capability study overdue."),
  ppap("0145", "FAK-Z-90", "FAKRA Z-code connector", "SUP-013", "001", 2, "2026-10-23", PI, "AANNNNNNAANANANNAS", false, "Level 2. Warrant submitted, awaiting SQE signature."),
  ppap("0146", "ISP-V4-SOC", "Vision ISP SoC (delta, new OSAT site)", "SUP-002", "001", 3, "2027-01-08", PI, "ASAAPPPPPPPANPNNAP", false, "Delta PPAP opened by PCN-2026-033."),
  ppap("0151", "AFE-14S", "Cell monitor AFE", "SUP-008", "002", 3, "2026-09-25", TJ, "AAAAAAAAAAAANANNAA", false, "Approved 22 Sep. PSW signed."),
  ppap("0152", "PCB-BMS-4L", "Bare PCB, 4-layer", "SUP-016", "002", 3, "2026-10-16", TJ, "AANAAAAASSAANANAAS", true, "Two elements and the warrant are with the SQE for review."),
  ppap("0153", "HRN-BMS-SNS", "Cell sense harness", "SUP-025", "002", 3, "2026-10-02", TJ, "AANAAAAAAOAANAAAAP", true, "Crimp pull-force results overdue by 10 days."),
  ppap("0154", "HDR-24S", "Sealed header, 24 way", "SUP-015", "002", 3, "2026-09-18", TJ, "AANAAAAAAAAANAAAAA", false, "Approved 16 Sep."),
  ppap("0161", "LTE-CAT4-M", "LTE Cat-4 module", "SUP-031", "003", 2, "2026-12-18", HG, "AANNNNNNSPNANPNNPP", false, "Level 2 by agreement. EOL notice changes the plan."),
  ppap("0162", "PCB-TCU-6L", "Bare PCB, 6-layer", "SUP-016", "003", 3, "2027-01-29", HG, "AANAAPPPPPPANPNPAP", false, "Follows the delayed PO-2026-093."),
  ppap("0171", "TFT-10.25", "TFT panel 10.25 in", "SUP-026", "005", 3, "2026-10-08", TJ, "AASAAAOOPOPAOPPPAP", true, "Four elements overdue. No samples until the delayed panels arrive."),
  ppap("0172", "HSG-IC-MG", "Rear housing, magnesium", "SUP-022", "005", 3, "2026-11-06", TJ, "AANAAAAASSSAASAAAP", false, "On plan."),
  ppap("0173", "HRN-IC-MAIN", "Main harness, 32 way", "SUP-024", "005", 3, "2026-10-28", TJ, "AANAAAASSPPANPAPAP", false, "On plan; watch supplier's financial position."),
  ppap("0181", "HSG-ECU-AL", "ECU housing, die-cast", "SUP-021", "004", 3, "2027-02-19", PI, "ASNPPPPPPPPPNPPPPP", false, "Starts after the award in SE-2026-017."),
];

function ncr(
  num: string, title: string, category: DefectCategory, detection: DetectionPoint, severity: RiskLevel, sourceId: string,
  program: string, pn: string, qtyAffected: number, raised: string, step: number, owner: string, chargebackL: number,
  hypotheses: Ncr["hypotheses"], containment: string[],
): Ncr {
  return { id: `NCR-2026-${num}`, title, category, detection, severity, sourceId, programId: `PGM-2026-${program}`, pn, qtyAffected, raised, step, owner, chargebackL, hypotheses, containment };
}

export const NCRS: Ncr[] = [
  ncr("052", "Porosity exposed on sealing face after machining", "Dimensional", "Incoming", "high", "SUP-021", "001", "HSG-CAM-AL", 320, "2026-09-25", 3, PI, 2.4,
    [
      { cause: "Vacuum-assist unit on die 2 out of service, trapping gas at the gate-far end", confidence: 81, evidence: ["Maintenance log: vacuum unit down 12 to 21 Sep", "All 320 rejects carry cavity mark D2", "X-ray shows pores clustered opposite the gate"] },
      { cause: "Melt hydrogen content high after degassing rotor wear", confidence: 34, evidence: ["Density index 4.1% on 18 Sep against a 3% limit", "Only one reading out of nine was high"] },
    ],
    ["100% X-ray sort at supplier, supplier-paid", "Leak test at 0.5 bar added at Sahyadri incoming", "Suspect lots 2609-A to 2609-D quarantined"]),
  ncr("053", "Head-in-pillow on image sensor BGA", "Solder joint", "In-Process", "critical", "EMS-01", "001", "IMG-2M3-A", 46, "2026-10-02", 3, PI, 0,
    [
      { cause: "Sensor package warpage at peak reflow exceeds paste wetting window", confidence: 76, evidence: ["Shadow moiré: 92 µm warpage at 245 °C on lot 2634", "Defects sit on the four corner rows", "Profile soak time is at the low end of the paste datasheet"] },
      { cause: "Paste slump from stencil aperture wear", confidence: 41, evidence: ["Stencil at 38,000 prints against 50,000 life", "SPI volume Cpk still 1.52"] },
    ],
    ["3D X-ray on 100% of camera boards", "Soak extended by 20 s on line 2 pending DOE", "Lot 2634 sensors segregated"]),
  ncr("054", "CAN bus-off after cold start at -30 °C", "Firmware", "Field", "high", "SUP-006", "006", "PHY-CANFD-2", 14, "2026-09-11", 5, HG, 0,
    [
      { cause: "Transceiver wake-up filter time longer on a new wafer lot, tripping the MCU's bus-off counter", confidence: 72, evidence: ["All 14 returns carry transceiver date code 2622", "Bench reproduction at -32 °C on 3 of 5 returned units", "Wake filter measured 4.8 µs against 3.1 µs typical"] },
      { cause: "Crystal start-up margin", confidence: 22, evidence: ["Start-up time inside limits on all returns"] },
    ],
    ["Firmware 2.3.1 with extended bus-off recovery released to Varuna", "Date code 2622 purged from EMS stock: 8,400 pieces"]),
  ncr("055", "Connector terminal push-out on mating", "Connector", "In-Process", "medium", "SUP-015", "002", "HDR-24S", 62, "2026-09-29", 4, TJ, 0.6,
    [
      { cause: "Terminal retention barb undersize from a worn stamping punch", confidence: 84, evidence: ["Retention force 28 N against 40 N minimum on lot 2638", "Barb height 0.11 mm against 0.15 mm nominal", "Punch at 1.9 M strokes; change interval is 1.5 M"] },
    ],
    ["100% retention check with go / no-go gauge", "Lot 2638 returned"]),
  ncr("056", "Solder bridging on 0.4 mm pitch connector", "Solder joint", "In-Process", "medium", "EMS-03", "002", "B2B-40P", 118, "2026-10-06", 2, TJ, 0,
    [
      { cause: "Paste left out of refrigeration beyond 8 hours on line 2", confidence: 68, evidence: ["Audit finding AF-105: out-of-fridge time not recorded", "Bridging concentrated on the night shift", "Viscosity of retained jar 22% under spec"] },
      { cause: "Stencil aperture reduction too small for this pitch", confidence: 45, evidence: ["Aperture is 1:1; supplier guideline is 10% reduction"] },
    ],
    ["AOI program tightened on J4", "Paste jars time-stamped at issue"]),
  ncr("057", "Dark mura on display corners", "Cosmetic", "Incoming", "medium", "SUP-026", "005", "TFT-10.25", 28, "2026-09-18", 4, TJ, 1.1,
    [
      { cause: "Backlight frame clamps over-torqued, stressing the cell", confidence: 63, evidence: ["Mura sits within 12 mm of all four clamps", "Supplier changed the torque driver in August"] },
    ],
    ["Incoming inspection at 100% under 5% grey pattern", "28 panels returned"]),
  ncr("058", "Lens module MTF below limit at 85 °C", "Component failure", "Incoming", "high", "SUP-019", "001", "LENS-190F", 90, "2026-10-01", 2, PI, 3.9,
    [
      { cause: "Barrel adhesive cure shortfall causing focus shift when hot", confidence: 71, evidence: ["MTF drops 14% between 25 and 85 °C on lot L-2639", "Supplier UV cure lamp hours at 1,900 against 1,500 replacement", "Previous lots hold within 5%"] },
      { cause: "Spacer material substitution", confidence: 28, evidence: ["No engineering change on record", "Spacer CTE not measured yet"] },
    ],
    ["Hot MTF test on a 13-piece sample per lot", "Lot L-2639 on hold: 1,800 pieces"]),
  ncr("059", "MCU fails boundary scan at ICT", "Component failure", "In-Process", "high", "SUP-003", "002", "MCU-32B-100", 9, "2026-10-07", 1, TJ, 0,
    [
      { cause: "Parts sourced through a non-franchised broker: remarked or mishandled devices", confidence: 79, evidence: ["All 9 failures trace to the reel bought in MAV-01", "Top marking font differs from franchised stock", "No certificate of conformance from Kortex"] },
    ],
    ["Broker reel quarantined: 2,391 pieces", "Franchised stock only at Kaveri until closure"]),
  ncr("060", "Conformal coating voids near shunt", "Cosmetic", "In-Process", "low", "EMS-03", "002", "PCA-BMS-100", 210, "2026-09-22", 6, TJ, 0,
    [{ cause: "Flux residue under the shunt repelling the coating", confidence: 77, evidence: ["Ionic contamination 1.9 µg/cm² against 1.56 limit", "Voids vanish after a wash trial"] }],
    ["Inline wash added before coating", "UV inspection at 100%"]),
  ncr("061", "Harness circuit swap on pins 7 and 9", "Connector", "Incoming", "medium", "SUP-024", "005", "HRN-IC-MAIN", 40, "2026-09-15", 7, TJ, 0.3,
    [{ cause: "Assembly board overlay not updated to drawing revision C", confidence: 92, evidence: ["All 40 pieces from board 3", "Overlay still at revision B"] }],
    ["Electrical test program updated", "Board 3 overlay replaced"]),
  ncr("062", "Gasket compression set after thermal ageing", "Component failure", "In-Process", "low", "SUP-023", "001", "GSK-CAM-SI", 0, "2026-08-28", 8, PI, 0,
    [{ cause: "Post-cure time shortened at supplier", confidence: 88, evidence: ["Compression set 31% against 25% limit", "Post-cure log shows 2 h instead of 4 h"] }],
    ["Closed: post-cure interlock fitted, three lots verified"]),
  ncr("063", "FAKRA retention clip cracked", "Connector", "Incoming", "low", "SUP-013", "001", "FAK-Z-90", 12, "2026-09-08", 8, PI, 0,
    [{ cause: "Moulding regrind ratio above 20%", confidence: 74, evidence: ["Regrind log shows 35% on one shift"] }],
    ["Closed: regrind capped at 15% in the control plan"]),
  ncr("064", "Tombstoning on 0201 capacitors", "Solder joint", "In-Process", "medium", "EMS-02", "005", "MLCC-X7R-106", 86, "2026-10-05", 2, TJ, 0,
    [
      { cause: "Reflow profile not re-validated after paste change on line 4", confidence: 82, evidence: ["Audit finding AF-102", "Ramp rate 2.9 °C/s against the new paste's 2.0 °C/s maximum", "Defects started the week the paste changed"] },
    ],
    ["Line 4 held to the previous paste lot", "AOI escape check on 2,000 boards"]),
  ncr("065", "Firmware flash checksum mismatch at EOL", "Firmware", "In-Process", "medium", "EMS-04", "006", "LHC-MX-005", 31, "2026-10-08", 1, HG, 0,
    [
      { cause: "EOL station pulled an outdated hex file from a cached network share", confidence: 86, evidence: ["All 31 units from station 2", "Station 2 cache last refreshed 29 Sep", "Released firmware changed on 6 Oct"] },
    ],
    ["Station 2 stopped; units re-flashed", "Cache disabled on EOL stations"]),
  ncr("066", "TCU housing flatness out of tolerance", "Dimensional", "Incoming", "low", "SUP-022", "003", "HSG-ECU-AL", 18, "2026-09-30", 5, HG, 0.2,
    [{ cause: "Ejector pin imbalance after tool maintenance", confidence: 70, evidence: ["Flatness 0.22 mm against 0.15 mm", "Tool serviced 24 Sep"] }],
    ["Sorting at supplier", "Ejector plate re-shimmed"]),
  ncr("067", "Radar prototype: MMIC solder voiding above 25%", "Solder joint", "In-Process", "medium", "EMS-01", "008", "MMIC-77G", 6, "2026-10-09", 1, PI, 0,
    [{ cause: "Thermal pad aperture is a single window; needs a window-pane pattern", confidence: 80, evidence: ["X-ray voiding 27 to 34% on 6 of 20 prototypes", "Package guideline recommends 4 x 4 pane"] }],
    ["Prototype build paused at 20 units"]),
];

/** NCRs raised per month by detection point, May to Oct 2026. */
export const NCR_TREND = [
  { month: "May", Incoming: 5, "In-Process": 7, Field: 1 },
  { month: "Jun", Incoming: 6, "In-Process": 6, Field: 0 },
  { month: "Jul", Incoming: 4, "In-Process": 8, Field: 1 },
  { month: "Aug", Incoming: 5, "In-Process": 6, Field: 0 },
  { month: "Sep", Incoming: 7, "In-Process": 5, Field: 1 },
  { month: "Oct", Incoming: 2, "In-Process": 6, Field: 0 },
];
