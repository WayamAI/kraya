import type {
  BomFlag,
  BomNode,
  EmsPartner,
  LifecycleNotice,
  RiskLevel,
  ShouldCostLine,
  Sourcing,
  Supplier,
  SupplierCategory,
} from "../types";

type Health = Supplier["financialHealth"];

function sup(
  id: string, name: string, category: SupplierCategory, commodity: string, city: string, country: string,
  otd: number, quality: number, ppm: number, risk: RiskLevel, spendCr: number, leadTimeWeeks: number,
  paymentTerms: string, financialHealth: Health, singleSourceParts: number, accountOwner: string, otdStart: number,
): Supplier {
  const step = (otd - otdStart) / 5;
  const wobble = [0, 0.6, -0.8, 0.5, -0.4, 0];
  const otdTrend = wobble.map((w, i) => Math.round((otdStart + step * i + w) * 10) / 10);
  const certifications = country === "India"
    ? ["IATF 16949", "ISO 14001"]
    : category === "Semiconductor" ? ["IATF 16949", "ISO 26262 (product)", "AEC-Q100"] : ["IATF 16949", "ISO 14001", "ISO 45001"];
  return { id, name, category, commodity, city, country, otd, quality, ppm, risk, spendCr, leadTimeWeeks, paymentTerms, certifications, financialHealth, singleSourceParts, accountOwner, otdTrend };
}

const AB = "Arjun Bhatia";
const KN = "Kavya Nair";
const RD = "Rohit Deshmukh";

export const SUPPLIERS: Supplier[] = [
  sup("SUP-001", "Nexora Semiconductor", "Semiconductor", "Image sensors", "Hsinchu", "Taiwan", 78.2, 91, 14, "high", 18.6, 26, "Net 45", "Strong", 2, AB, 91.4),
  sup("SUP-002", "Halcyon Silicon", "Semiconductor", "ISP and vision SoC", "Penang", "Malaysia", 84.1, 94, 9, "medium", 14.2, 22, "Net 45", "Strong", 1, AB, 86.0),
  sup("SUP-003", "Kortex Microsystems", "Semiconductor", "Automotive MCU", "Dresden", "Germany", 81.4, 96, 6, "high", 21.4, 30, "Net 30", "Strong", 2, AB, 88.9),
  sup("SUP-004", "Voltera Power ICs", "Semiconductor", "PMIC and regulators", "Austin", "USA", 90.3, 93, 11, "low", 6.8, 16, "Net 45", "Strong", 0, AB, 89.1),
  sup("SUP-005", "Mnemos Memory", "Semiconductor", "LPDDR and eMMC", "Icheon", "South Korea", 86.0, 95, 7, "medium", 9.1, 18, "Net 30", "Strong", 0, AB, 87.2),
  sup("SUP-006", "Linkwave Devices", "Semiconductor", "CAN and Ethernet PHY", "Eindhoven", "Netherlands", 88.4, 94, 8, "medium", 5.4, 14, "Net 45", "Strong", 1, AB, 90.0),
  sup("SUP-007", "Sensara RF", "Semiconductor", "Radar MMIC", "Villach", "Austria", 83.0, 92, 12, "high", 3.2, 32, "Net 30", "Stable", 1, AB, 85.5),
  sup("SUP-008", "Cellguard Analog", "Semiconductor", "Cell monitor AFE", "Dallas", "USA", 79.6, 93, 10, "critical", 7.7, 24, "Net 45", "Strong", 1, AB, 92.3),
  sup("SUP-009", "Kyomi Ceramics", "Passive", "MLCC", "Kyoto", "Japan", 92.1, 97, 3, "low", 4.9, 12, "Net 60", "Strong", 0, KN, 91.0),
  sup("SUP-010", "Induxa Magnetics", "Passive", "Power inductors", "Chennai", "India", 89.2, 90, 38, "low", 2.3, 8, "Net 60", "Stable", 0, KN, 86.4),
  sup("SUP-011", "Ohmline Components", "Passive", "Resistors and shunts", "Pune", "India", 94.0, 92, 22, "low", 1.6, 6, "Net 60", "Stable", 0, KN, 93.1),
  sup("SUP-012", "Quartzia Timing", "Passive", "Crystals and oscillators", "Bengaluru", "India", 91.3, 93, 18, "low", 0.9, 10, "Net 60", "Stable", 0, KN, 90.2),
  sup("SUP-013", "Faktron Interconnect", "Connector", "FAKRA and coax", "Stuttgart", "Germany", 87.1, 95, 12, "medium", 3.8, 14, "Net 45", "Strong", 1, KN, 88.8),
  sup("SUP-014", "Bridgepin Connectors", "Connector", "Board-to-board", "Shenzhen", "China", 82.3, 89, 46, "medium", 2.1, 12, "Net 60", "Stable", 0, KN, 87.5),
  sup("SUP-015", "Sealtite Headers", "Connector", "Sealed ECU headers", "Pune", "India", 90.4, 91, 31, "low", 4.4, 10, "Net 75", "Stable", 0, KN, 88.0),
  sup("SUP-016", "Laminar Circuits", "PCB", "Multilayer PCB", "Hosur", "India", 85.7, 88, 64, "medium", 8.3, 6, "Net 75", "Stable", 0, RD, 90.6),
  sup("SUP-017", "Stratum PCB", "PCB", "HDI PCB", "Shenzhen", "China", 80.2, 90, 52, "high", 6.1, 10, "Net 60", "Stable", 1, RD, 85.3),
  sup("SUP-018", "Copperleaf Boards", "PCB", "Multilayer PCB", "Bengaluru", "India", 91.0, 92, 41, "low", 3.5, 6, "Net 75", "Strong", 0, RD, 89.4),
  sup("SUP-019", "Optivue Lens Works", "Optics", "Automotive lens modules", "Taichung", "Taiwan", 76.4, 93, 28, "critical", 7.9, 20, "Net 30", "Stable", 2, AB, 88.1),
  sup("SUP-020", "Clarion Optics India", "Optics", "Lens modules", "Noida", "India", 88.2, 86, 72, "medium", 1.2, 12, "Net 60", "Stable", 0, AB, 85.0),
  sup("SUP-021", "Castwell Alloys", "Die-cast", "Aluminium housings", "Pune", "India", 85.3, 87, 118, "medium", 5.6, 8, "Net 75", "Stable", 0, RD, 89.9),
  sup("SUP-022", "Formet Die Casting", "Die-cast", "Aluminium housings", "Coimbatore", "India", 92.4, 90, 74, "low", 3.1, 8, "Net 75", "Strong", 0, RD, 91.2),
  sup("SUP-023", "Elastoseal Polymers", "Seal", "Gaskets and seals", "Chennai", "India", 93.1, 89, 86, "low", 1.1, 6, "Net 60", "Stable", 0, RD, 92.0),
  sup("SUP-024", "Wirekraft Harness Systems", "Harness", "Wire harness", "Manesar", "India", 84.0, 85, 142, "high", 4.7, 5, "Net 90", "Watch", 0, KN, 90.1),
  sup("SUP-025", "Loomtech Wiring", "Harness", "Wire harness", "Sanand", "India", 90.2, 88, 96, "low", 2.6, 5, "Net 75", "Stable", 0, KN, 88.7),
  sup("SUP-026", "Lumigrid Displays", "Display", "TFT displays", "Suzhou", "China", 79.1, 90, 58, "high", 11.3, 26, "Net 30", "Watch", 1, KN, 90.4),
  sup("SUP-027", "Thermavent Heatsinks", "Mechanical", "Thermal parts", "Aurangabad", "India", 95.2, 91, 48, "low", 0.8, 5, "Net 60", "Stable", 0, RD, 94.0),
  sup("SUP-028", "Presswell Stampings", "Mechanical", "Shields and brackets", "Faridabad", "India", 93.0, 90, 66, "low", 1.4, 5, "Net 60", "Stable", 0, RD, 91.8),
  sup("SUP-029", "Brightline Drivers", "Semiconductor", "LED driver ICs", "Hsinchu", "Taiwan", 87.3, 92, 13, "medium", 2.9, 18, "Net 45", "Stable", 1, AB, 88.0),
  sup("SUP-030", "Barosense MEMS", "Semiconductor", "Pressure sensors", "Regensburg", "Germany", 85.2, 94, 9, "high", 1.9, 22, "Net 30", "Stable", 1, AB, 89.6),
  sup("SUP-031", "Cellonis Wireless", "Module", "Cellular and GNSS modules", "Shenzhen", "China", 86.4, 91, 34, "medium", 8.8, 16, "Net 45", "Stable", 1, KN, 87.9),
  sup("SUP-032", "Coaxis Connect", "Connector", "Coax and sealed connectors", "Bengaluru", "India", 91.6, 90, 44, "low", 0.7, 9, "Net 75", "Stable", 0, KN, 90.3),
];

const CERT_FULL = ["IATF 16949", "ISO 14001", "ISO 26262 (process)", "ESD S20.20", "VDA 6.3"];
const CERT_NO_FUSA = ["IATF 16949", "ISO 14001", "ESD S20.20", "VDA 6.3"];

export const EMS_PARTNERS: EmsPartner[] = [
  {
    id: "EMS-01", name: "Sahyadri Electronics Manufacturing", city: "Pune", state: "Maharashtra", smtLines: 4, cph: 168000, capacity: 62000, utilisation: 84,
    certifications: CERT_FULL, capabilities: ["SMT 01005", "Active alignment", "Conformal coating", "ICT / FCT", "Box build", "X-ray"],
    ppm: 38, otif: 94.1, fpy: 98.6, changeoverMin: 42, auditScore: 91, vdaGrade: "A", risk: "low", spendCr: 22.4,
    findings: [{ id: "AF-101", text: "MSA for active-alignment station not refreshed after camera fixture change", severity: "minor", due: "2026-10-30" }],
    ppmTrend: [52, 47, 44, 41, 40, 38], otifTrend: [92.8, 93.1, 93.6, 93.9, 94.4, 94.1], fpyTrend: [98.1, 98.2, 98.4, 98.5, 98.5, 98.6],
  },
  {
    id: "EMS-02", name: "Coromandel Circuit Works", city: "Chennai", state: "Tamil Nadu", smtLines: 6, cph: 240000, capacity: 95000, utilisation: 86,
    certifications: CERT_FULL, capabilities: ["SMT 0201", "Selective solder", "Optical bonding", "ICT / FCT", "Box build", "Burn-in"],
    ppm: 61, otif: 91.3, fpy: 97.4, changeoverMin: 55, auditScore: 86, vdaGrade: "B", risk: "medium", spendCr: 31.8,
    findings: [
      { id: "AF-102", text: "Line 4 reflow profile not re-validated after paste change", severity: "major", due: "2026-10-19" },
      { id: "AF-103", text: "ESD wrist-strap log gaps on night shift, 3 of 21 days", severity: "minor", due: "2026-11-06" },
    ],
    ppmTrend: [58, 55, 64, 70, 66, 61], otifTrend: [93.0, 92.4, 91.9, 90.6, 90.9, 91.3], fpyTrend: [97.9, 97.8, 97.3, 97.0, 97.2, 97.4],
  },
  {
    id: "EMS-03", name: "Kaveri SMT Systems", city: "Hosur", state: "Tamil Nadu", smtLines: 3, cph: 120000, capacity: 44000, utilisation: 93,
    certifications: CERT_NO_FUSA, capabilities: ["SMT 0201", "Conformal coating", "ICT / FCT", "Potting"],
    ppm: 74, otif: 88.6, fpy: 96.8, changeoverMin: 68, auditScore: 79, vdaGrade: "B", risk: "high", spendCr: 14.9,
    findings: [
      { id: "AF-104", text: "No ISO 26262 process assessment on file; required for ASIL C BMS work", severity: "major", due: "2026-11-14" },
      { id: "AF-105", text: "Solder paste out-of-fridge time not recorded on line 2", severity: "major", due: "2026-10-23" },
      { id: "AF-106", text: "Changeover averages 68 min against the 45 min agreement", severity: "minor", due: "2026-11-28" },
    ],
    ppmTrend: [49, 53, 61, 69, 78, 74], otifTrend: [93.4, 92.0, 90.8, 89.1, 88.2, 88.6], fpyTrend: [97.8, 97.5, 97.2, 96.9, 96.6, 96.8],
  },
  {
    id: "EMS-04", name: "Aravali Assembly Works", city: "Manesar", state: "Haryana", smtLines: 5, cph: 200000, capacity: 78000, utilisation: 71,
    certifications: CERT_FULL, capabilities: ["SMT 0201", "Selective solder", "Conformal coating", "ICT / FCT", "Box build", "Optical bonding"],
    ppm: 44, otif: 95.2, fpy: 98.2, changeoverMin: 38, auditScore: 90, vdaGrade: "A", risk: "low", spendCr: 19.6,
    findings: [{ id: "AF-107", text: "Calibration sticker expired on one torque driver at box build", severity: "minor", due: "2026-10-27" }],
    ppmTrend: [51, 49, 47, 46, 45, 44], otifTrend: [94.0, 94.4, 94.8, 95.0, 95.1, 95.2], fpyTrend: [97.8, 97.9, 98.0, 98.1, 98.2, 98.2],
  },
  {
    id: "EMS-05", name: "Sabarmati Mechatronics", city: "Sanand", state: "Gujarat", smtLines: 3, cph: 105000, capacity: 40000, utilisation: 64,
    certifications: CERT_NO_FUSA, capabilities: ["SMT 0402", "Potting", "Ultrasonic welding", "ICT / FCT", "Box build"],
    ppm: 68, otif: 92.0, fpy: 97.1, changeoverMin: 50, auditScore: 83, vdaGrade: "B", risk: "medium", spendCr: 6.2,
    findings: [{ id: "AF-108", text: "Potting cure oven lacks continuous temperature logging", severity: "major", due: "2026-11-10" }],
    ppmTrend: [80, 77, 73, 71, 70, 68], otifTrend: [90.2, 90.9, 91.3, 91.6, 91.8, 92.0], fpyTrend: [96.4, 96.6, 96.8, 96.9, 97.0, 97.1],
  },
  {
    id: "EMS-06", name: "Indrayani Box Build", city: "Pune", state: "Maharashtra", smtLines: 1, cph: 36000, capacity: 30000, utilisation: 58,
    certifications: ["IATF 16949", "ISO 14001", "ESD S20.20"], capabilities: ["Box build", "Leak test", "End-of-line test", "Laser marking"],
    ppm: 55, otif: 96.0, fpy: 98.9, changeoverMin: 25, auditScore: 88, vdaGrade: "A", risk: "low", spendCr: 3.4,
    findings: [],
    ppmTrend: [60, 59, 58, 57, 56, 55], otifTrend: [95.1, 95.4, 95.6, 95.8, 95.9, 96.0], fpyTrend: [98.6, 98.7, 98.8, 98.8, 98.9, 98.9],
  },
  {
    id: "EMS-07", name: "Marina Precision Electronics", city: "Chennai", state: "Tamil Nadu", smtLines: 2, cph: 72000, capacity: 26000, utilisation: 54,
    certifications: CERT_FULL, capabilities: ["SMT 0201", "Conformal coating", "ICT / FCT", "Potting"],
    ppm: 47, otif: 93.4, fpy: 98.0, changeoverMin: 40, auditScore: 87, vdaGrade: "A", risk: "low", spendCr: 4.1,
    findings: [{ id: "AF-109", text: "FCT fixture preventive-maintenance record missing for September", severity: "minor", due: "2026-10-31" }],
    ppmTrend: [56, 54, 52, 50, 48, 47], otifTrend: [92.1, 92.5, 92.9, 93.0, 93.3, 93.4], fpyTrend: [97.6, 97.7, 97.8, 97.9, 98.0, 98.0],
  },
  {
    id: "EMS-08", name: "Thar Coatings & Test", city: "Manesar", state: "Haryana", smtLines: 0, cph: 0, capacity: 52000, utilisation: 62,
    certifications: ["IATF 16949", "ESD S20.20"], capabilities: ["Conformal coating", "ICT / FCT", "Environmental stress screening", "Rework"],
    ppm: 29, otif: 94.8, fpy: 99.1, changeoverMin: 20, auditScore: 85, vdaGrade: "B", risk: "low", spendCr: 1.8,
    findings: [{ id: "AF-110", text: "Coating thickness gauge R&R above 10%", severity: "minor", due: "2026-11-21" }],
    ppmTrend: [35, 33, 32, 31, 30, 29], otifTrend: [94.0, 94.2, 94.4, 94.5, 94.7, 94.8], fpyTrend: [98.9, 99.0, 99.0, 99.1, 99.1, 99.1],
  },
];

// --- BOMs ------------------------------------------------------------------

type Alt = BomNode["alternates"][number];

function n(
  level: number, pn: string, description: string, qty: number, unitCost: number,
  supplierId?: string, leadTimeWeeks?: number, sourcing?: Sourcing, flags: BomFlag[] = [], alternates: Alt[] = [], commodity?: string,
): BomNode {
  return { level, pn, description, qty, unitCost, supplierId, leadTimeWeeks, sourcing, flags, alternates, commodity };
}

const alt = (pn: string, supplier: string, status: Alt["status"], delta: string): Alt => ({ pn, supplier, status, delta });

export const BOMS: Record<string, BomNode[]> = {
  "PGM-2026-001": [
    n(0, "ADAS-CAM-001", "ADAS front camera module", 1, 0),
    n(1, "PCA-CAM-100", "Main PCB assembly", 1, 0),
    n(2, "PCB-CAM-6L", "Bare PCB, 6-layer HDI, ENIG", 1, 214, "SUP-017", 10, "single", ["supplier-concentration"], [alt("PCB-CAM-6L-B", "Copperleaf Boards", "In qualification", "+₹19")], "PCB"),
    n(2, "IMG-2M3-A", "Image sensor, 2.3 MP HDR, iBGA", 1, 612, "SUP-001", 26, "single", ["single-source", "extended-lead-time"], [alt("IMG-2M3-H", "Halcyon Silicon", "Not started", "+₹48, new lens tuning")], "Semiconductor"),
    n(2, "ISP-V4-SOC", "Vision ISP SoC, ASIL B", 1, 845, "SUP-002", 22, "single", ["single-source", "lifecycle"], [], "Semiconductor"),
    n(2, "LPD4-2G", "LPDDR4 2 Gb, automotive grade 2", 1, 268, "SUP-005", 18, "dual", ["lifecycle"], [alt("LPD4X-2G", "Mnemos Memory", "In qualification", "-₹12, needs 0.6 V rail")], "Semiconductor"),
    n(2, "PMIC-5R-Q", "PMIC, 5-rail, camera", 1, 92, "SUP-004", 16, "dual", [], [alt("PMIC-5R-K", "Kortex Microsystems", "Qualified", "+₹6")], "Semiconductor"),
    n(2, "PHY-T1-100", "100BASE-T1 Ethernet PHY", 1, 176, "SUP-006", 20, "single", ["single-source"], [], "Semiconductor"),
    n(2, "MLCC-X7R-106", "MLCC kit, X7R and C0G, 0402 / 0201", 86, 1.8, "SUP-009", 12, "multi", [], [alt("MLCC-X7R-106-T", "second franchised line", "Qualified", "±₹0")], "Passive"),
    n(2, "IND-PWR-4R7", "Power inductor 4.7 µH, shielded", 4, 14, "SUP-010", 8, "dual", [], [], "Passive"),
    n(2, "XTAL-27M", "Crystal 27 MHz, AEC-Q200", 1, 22, "SUP-012", 10, "dual", [], [], "Passive"),
    n(2, "B2B-40P", "Board-to-board connector, 40 pos, 0.4 mm", 1, 36, "SUP-014", 12, "dual", [], [], "Connector"),
    n(1, "LENS-190F", "Lens module, 52° HFOV, IR-cut, athermal", 1, 486, "SUP-019", 20, "single", ["single-source", "extended-lead-time"], [alt("LENS-190F-C", "Clarion Optics India", "Not started", "-₹31, MTF to be proven")], "Optics"),
    n(1, "ENC-CAM-200", "Enclosure assembly", 1, 0),
    n(2, "HSG-CAM-AL", "Front housing, die-cast ADC12, machined", 1, 164, "SUP-021", 8, "single", ["supplier-concentration"], [alt("HSG-CAM-AL-F", "Formet Die Casting", "Not started", "+₹9, new tool ₹22L")], "Die-cast"),
    n(2, "HSG-CAM-RC", "Rear cover, die-cast ADC12", 1, 88, "SUP-021", 8, "single", ["supplier-concentration"], [], "Die-cast"),
    n(2, "GSK-CAM-SI", "Perimeter gasket, silicone 50 Shore A", 1, 12, "SUP-023", 6, "dual", [], [], "Seal"),
    n(2, "THM-PAD-15", "Thermal gap pad, 1.5 mm", 1, 18, "SUP-027", 5, "multi", [], [], "Mechanical"),
    n(2, "SCR-M2-6", "Screw M2 x 6, thread-forming", 4, 0.9, "SUP-028", 5, "multi", [], [], "Mechanical"),
    n(1, "FAK-Z-90", "FAKRA Z-code connector, right angle", 1, 118, "SUP-013", 14, "single", ["single-source"], [alt("FAK-Z-90-C", "Coaxis Connect", "In qualification", "-₹21")], "Connector"),
    n(1, "HRN-CAM-PIG", "Harness pigtail, 180 mm, sealed", 1, 96, "SUP-024", 5, "dual", [], [alt("HRN-CAM-PIG-L", "Loomtech Wiring", "Qualified", "+₹3")], "Harness"),
    n(1, "CONV-CAM", "EMS conversion: SMT, AOI, active alignment, FCT", 1, 310, undefined, undefined, undefined, [], [], "Conversion"),
  ],
  "PGM-2026-002": [
    n(0, "BMS-2W-014", "BMS module, 14S two-wheeler EV", 1, 0),
    n(1, "PCA-BMS-100", "BMS PCB assembly", 1, 0),
    n(2, "PCB-BMS-4L", "Bare PCB, 4-layer, 2 oz copper", 1, 148, "SUP-016", 6, "dual", [], [alt("PCB-BMS-4L-C", "Copperleaf Boards", "Qualified", "+₹7")], "PCB"),
    n(2, "AFE-14S", "Cell monitor AFE, 14 channel, ASIL C", 1, 224, "SUP-008", 24, "single", ["single-source", "allocation", "extended-lead-time"], [], "Semiconductor"),
    n(2, "MCU-32B-100", "32-bit MCU, 100 pin, CAN FD", 1, 246, "SUP-003", 28, "single", ["single-source", "extended-lead-time"], [], "Semiconductor"),
    n(2, "PHY-CANFD-2", "CAN FD transceiver, 5 Mbit/s", 1, 41, "SUP-006", 14, "multi", ["lifecycle"], [alt("PHY-CANFD-2S", "Linkwave Devices", "Qualified", "±₹0, SOIC-8 to DFN")], "Semiconductor"),
    n(2, "SHUNT-100U", "Current shunt 100 µΩ, 4-terminal", 1, 38, "SUP-011", 6, "dual", [], [], "Passive"),
    n(2, "FET-80V-Q", "MOSFET 80 V, 1.2 mΩ, charge / discharge", 8, 46, "SUP-004", 16, "dual", [], [], "Semiconductor"),
    n(2, "MLCC-X7R-106", "MLCC kit, X7R, 0603 / 0402", 142, 1.6, "SUP-009", 12, "multi", [], [], "Passive"),
    n(2, "IND-PWR-22U", "Power inductor 22 µH", 2, 19, "SUP-010", 8, "dual", [], [], "Passive"),
    n(1, "HDR-24S", "Sealed header, 24 way", 1, 132, "SUP-015", 10, "dual", [], [alt("HDR-24S-C", "Coaxis Connect", "Qualified", "+₹4")], "Connector"),
    n(1, "HSG-BMS-PA", "Housing, PA66-GF30 with heat spreader", 1, 118, "SUP-028", 5, "dual", [], [], "Mechanical"),
    n(1, "HRN-BMS-SNS", "Cell sense harness, 15 way", 1, 164, "SUP-025", 5, "dual", [], [], "Harness"),
    n(1, "CONV-BMS", "EMS conversion: SMT, conformal coat, potting, FCT", 1, 248, undefined, undefined, undefined, [], [], "Conversion"),
  ],
  "PGM-2026-003": [
    n(0, "TCU-4G-007", "Telematics control unit, 4G", 1, 0),
    n(1, "PCA-TCU-100", "TCU main PCB assembly", 1, 0),
    n(2, "PCB-TCU-6L", "Bare PCB, 6-layer, impedance controlled", 1, 236, "SUP-016", 6, "single", ["supplier-concentration"], [alt("PCB-TCU-6L-C", "Copperleaf Boards", "In qualification", "+₹11")], "PCB"),
    n(2, "LTE-CAT4-M", "LTE Cat-4 module, LGA", 1, 1120, "SUP-031", 16, "single", ["single-source", "lifecycle"], [alt("LTE-CAT1B-M", "Cellonis Wireless", "In qualification", "-₹210, new antenna match")], "Module"),
    n(2, "GNSS-L1L5", "GNSS receiver, L1 + L5, NavIC", 1, 318, "SUP-031", 14, "dual", [], [], "Module"),
    n(2, "MCU-32A-144", "32-bit MCU, 144 pin, HSM", 1, 318, "SUP-003", 30, "single", ["single-source", "allocation", "extended-lead-time"], [], "Semiconductor"),
    n(2, "LPD4-2G", "LPDDR4 2 Gb, automotive grade 2", 1, 268, "SUP-005", 18, "dual", ["lifecycle"], [], "Semiconductor"),
    n(2, "PMIC-7R-Q", "PMIC, 7-rail with watchdog", 1, 134, "SUP-004", 16, "dual", [], [], "Semiconductor"),
    n(2, "PHY-CANFD-2", "CAN FD transceiver", 2, 41, "SUP-006", 14, "multi", [], [], "Semiconductor"),
    n(2, "MLCC-X7R-106", "MLCC kit", 214, 1.7, "SUP-009", 12, "multi", [], [], "Passive"),
    n(2, "IND-PWR-4R7", "Power inductor 4.7 µH", 6, 14, "SUP-010", 8, "dual", [], [], "Passive"),
    n(2, "B2B-40P", "Board-to-board connector, 40 pos", 1, 36, "SUP-014", 12, "dual", [], [], "Connector"),
    n(1, "FAK-D-180", "FAKRA D-code, twin, straight", 1, 142, "SUP-013", 14, "single", ["single-source"], [], "Connector"),
    n(1, "HDR-48S", "Sealed header, 48 way", 1, 186, "SUP-015", 10, "dual", [], [], "Connector"),
    n(1, "BAT-BKP-LI", "Backup cell, Li-ion 1000 mAh with PCM", 1, 228, "SUP-031", 12, "dual", [], [], "Module"),
    n(1, "HSG-ECU-AL", "ECU housing, die-cast ADC12", 1, 212, "SUP-022", 8, "dual", [], [], "Die-cast"),
    n(1, "CONV-TCU", "EMS conversion: SMT, ICT, RF calibration, box build", 1, 396, undefined, undefined, undefined, [], [], "Conversion"),
  ],
  "PGM-2026-004": [
    n(0, "CGW-CV-003", "CAN FD gateway ECU", 1, 0),
    n(1, "PCA-CGW-100", "Gateway PCB assembly", 1, 0),
    n(2, "PCB-CGW-6L", "Bare PCB, 6-layer", 1, 228, "SUP-018", 6, "dual", [], [], "PCB"),
    n(2, "MCU-32A-144", "32-bit MCU, 144 pin, HSM", 1, 318, "SUP-003", 30, "single", ["single-source", "allocation", "extended-lead-time"], [], "Semiconductor"),
    n(2, "PHY-CANFD-2", "CAN FD transceiver", 8, 41, "SUP-006", 14, "multi", ["lifecycle"], [alt("PHY-CANFD-2S", "Linkwave Devices", "Qualified", "±₹0")], "Semiconductor"),
    n(2, "PHY-T1-100", "100BASE-T1 Ethernet PHY", 2, 176, "SUP-006", 20, "single", ["single-source"], [], "Semiconductor"),
    n(2, "PMIC-7R-Q", "PMIC, 7-rail with watchdog", 1, 134, "SUP-004", 16, "dual", [], [], "Semiconductor"),
    n(2, "MLCC-X7R-106", "MLCC kit", 196, 1.7, "SUP-009", 12, "multi", [], [], "Passive"),
    n(1, "HDR-48S", "Sealed header, 48 way", 2, 186, "SUP-015", 10, "single", ["single-source"], [alt("HDR-48S-C", "Coaxis Connect", "In qualification", "-₹14")], "Connector"),
    n(1, "HSG-ECU-AL", "ECU housing, die-cast ADC12", 1, 212, "SUP-021", 8, "single", ["supplier-concentration"], [alt("HSG-ECU-AL-F", "Formet Die Casting", "Qualified", "-₹8")], "Die-cast"),
    n(1, "GSK-ECU-SI", "Housing gasket, dispensed silicone", 1, 16, "SUP-023", 6, "single", ["single-source"], [], "Seal"),
    n(1, "CONV-CGW", "EMS conversion: SMT, selective solder, ICT, FCT", 1, 342, undefined, undefined, undefined, [], [], "Conversion"),
  ],
  "PGM-2026-005": [
    n(0, "IC-TFT-010", "Digital instrument cluster, 10.25 in", 1, 0),
    n(1, "DSP-ASSY-10", "Display assembly, bonded", 1, 0),
    n(2, "TFT-10.25", "TFT panel 10.25 in, 1920 x 720, 1000 nit", 1, 3850, "SUP-026", 26, "single", ["single-source", "extended-lead-time"], [], "Display"),
    n(2, "CVR-LENS-AG", "Cover lens, anti-glare, anti-fingerprint", 1, 412, "SUP-020", 12, "dual", [], [], "Optics"),
    n(2, "OCA-BOND", "Optical bonding adhesive and process", 1, 186, undefined, undefined, undefined, [], [], "Conversion"),
    n(1, "PCA-IC-100", "Cluster main PCB assembly", 1, 0),
    n(2, "PCB-IC-8L", "Bare PCB, 8-layer HDI", 1, 364, "SUP-018", 6, "dual", [], [], "PCB"),
    n(2, "SOC-GFX-4", "Graphics SoC, quad core, ASIL B", 1, 1680, "SUP-002", 22, "single", ["single-source", "extended-lead-time"], [], "Semiconductor"),
    n(2, "LPD4-2G", "LPDDR4 2 Gb x 2", 2, 268, "SUP-005", 18, "dual", ["lifecycle"], [], "Semiconductor"),
    n(2, "EMMC-16G", "eMMC 16 GB, automotive", 1, 342, "SUP-005", 18, "dual", [], [], "Semiconductor"),
    n(2, "MCU-32B-100", "Safety MCU, 100 pin", 1, 246, "SUP-003", 28, "single", ["single-source", "extended-lead-time"], [], "Semiconductor"),
    n(2, "PMIC-7R-Q", "PMIC, 7-rail", 1, 134, "SUP-004", 16, "dual", [], [], "Semiconductor"),
    n(2, "MLCC-X7R-106", "MLCC kit", 318, 1.7, "SUP-009", 12, "multi", [], [], "Passive"),
    n(1, "HSG-IC-MG", "Rear housing, magnesium die-cast", 1, 486, "SUP-022", 8, "single", [], [], "Die-cast"),
    n(1, "HRN-IC-MAIN", "Main harness, 32 way", 1, 284, "SUP-024", 5, "dual", [], [alt("HRN-IC-MAIN-L", "Loomtech Wiring", "Qualified", "+₹6")], "Harness"),
    n(1, "CONV-IC", "EMS conversion: SMT, bonding, burn-in, EOL test", 1, 1120, undefined, undefined, undefined, [], [], "Conversion"),
  ],
  "PGM-2026-006": [
    n(0, "LHC-MX-005", "LED matrix headlamp controller", 1, 0),
    n(1, "PCA-LHC-100", "Controller PCB assembly", 1, 0),
    n(2, "PCB-LHC-4L", "Bare PCB, 4-layer, high Tg", 1, 96, "SUP-016", 6, "dual", [], [], "PCB"),
    n(2, "LEDDRV-8CH", "LED matrix driver, 8 channel", 2, 148, "SUP-029", 18, "single", ["single-source", "lifecycle"], [alt("LEDDRV-8CH-N", "Brightline Drivers", "Not started", "+₹11, successor part")], "Semiconductor"),
    n(2, "MCU-32B-064", "32-bit MCU, 64 pin", 1, 168, "SUP-003", 28, "dual", [], [], "Semiconductor"),
    n(2, "PHY-CANFD-2", "CAN FD transceiver", 1, 41, "SUP-006", 14, "multi", ["lifecycle"], [], "Semiconductor"),
    n(2, "MLCC-X7R-106", "MLCC kit", 74, 1.6, "SUP-009", 12, "multi", [], [], "Passive"),
    n(1, "HDR-12S", "Sealed header, 12 way", 1, 78, "SUP-015", 10, "dual", [], [], "Connector"),
    n(1, "HSG-LHC-AL", "Housing, die-cast with fins", 1, 126, "SUP-022", 8, "dual", [], [], "Die-cast"),
    n(1, "CONV-LHC", "EMS conversion: SMT, coat, FCT", 1, 164, undefined, undefined, undefined, [], [], "Conversion"),
  ],
  "PGM-2026-007": [
    n(0, "TPMS-BLE-002", "TPMS sensor, BLE", 1, 0),
    n(1, "PCA-TPMS-100", "Sensor PCB assembly", 1, 0),
    n(2, "PCB-TPMS-4L", "Bare PCB, 4-layer, 0.8 mm", 1, 18, undefined, 6, undefined, [], [], "PCB"),
    n(2, "MEMS-P-450", "MEMS pressure and temperature sensor, 450 kPa", 1, 96, "SUP-030", 22, "single", ["single-source", "extended-lead-time"], [], "Semiconductor"),
    n(2, "SOC-BLE-5", "BLE 5 SoC, AEC-Q100 grade 2", 1, 88, "SUP-003", 26, "dual", [], [], "Semiconductor"),
    n(2, "XTAL-32M", "Crystal 32 MHz", 1, 14, "SUP-012", 10, "dual", [], [], "Passive"),
    n(2, "MLCC-X7R-106", "MLCC kit", 22, 1.4, "SUP-009", 12, "multi", [], [], "Passive"),
    n(1, "BAT-CR2050", "Coin cell CR2050HR, welded tabs", 1, 62, "SUP-031", 12, "dual", [], [], "Module"),
    n(1, "HSG-TPMS-PA", "Housing with valve interface, PA66", 1, 48, "SUP-028", 5, "dual", [], [], "Mechanical"),
    n(1, "CONV-TPMS", "EMS conversion: SMT, potting, ultrasonic weld, RF test", 1, 86, undefined, undefined, undefined, [], [], "Conversion"),
  ],
};

// --- component lifecycle -----------------------------------------------------

export const LIFECYCLE_NOTICES: LifecycleNotice[] = [
  {
    id: "PCN-2026-031", pn: "AFE-14S", description: "Cell monitor AFE, 14 channel", supplierId: "SUP-008", type: "Allocation", severity: "critical", issued: "2026-09-18",
    summary: "Cellguard Analog confirms 70% of Q4 demand. The 200 mm fab that runs this family is sold out through March.",
    leadTimeWas: 24, leadTimeNow: 34, allocationPct: 70, aecq: "AEC-Q100 Grade 1", alternateStatus: "None identified", programIds: ["PGM-2026-002"],
    action: "Buffer stock", actionDetail: "Place a bridge buy of 24,000 pieces through the franchised distributor at +9% and hold at the Hosur hub. Covers the Dec to Feb ramp gap.",
    ltbQty: 24000, actionCostL: 58.6, confidence: 86,
    evidence: ["Allocation letter dated 18 Sep 2026, ref CG-AL-2291", "Ramp plan needs 60,000 pieces by end Feb; confirmed supply is 42,000", "Distributor stock check: 31,400 pieces, date code 2026 wk 30 or later"],
    owner: "Arjun Bhatia",
  },
  {
    id: "PCN-2026-032", pn: "LTE-CAT4-M", description: "LTE Cat-4 module, LGA", supplierId: "SUP-031", type: "EOL", severity: "high", issued: "2026-08-25",
    summary: "End of life. Last-time-buy orders close 30 Nov 2026, last shipment 31 May 2027. Successor is a Cat-1bis module with a different antenna match.",
    ltbDate: "2026-11-30", lastShipDate: "2027-05-31", leadTimeWas: 16, leadTimeNow: 16, aecq: "Not automotive qualified", alternateStatus: "In qualification", programIds: ["PGM-2026-003"],
    action: "Last-time buy", actionDetail: "Buy 70,000 pieces to cover SOP plus 7 months, while the Cat-1bis successor completes RF validation and AIS-140 re-certification.",
    ltbQty: 70000, actionCostL: 784, confidence: 82,
    evidence: ["EOL notice EOL-CW-0417 received 25 Aug 2026", "Successor validation plan ends wk 14 2027; AIS-140 re-test adds 6 weeks", "Kestrel volume plan: 10,000 per month from Apr 2027"],
    owner: "Kavya Nair",
  },
  {
    id: "PCN-2026-033", pn: "ISP-V4-SOC", description: "Vision ISP SoC, ASIL B", supplierId: "SUP-002", type: "PCN", severity: "high", issued: "2026-09-30",
    summary: "Assembly and test site moves from Penang to a second OSAT from date code 2027 wk 06. Form, fit and function unchanged, but Varuna requires a delta PPAP.",
    leadTimeWas: 22, leadTimeNow: 22, aecq: "AEC-Q100 Grade 2", alternateStatus: "None identified", programIds: ["PGM-2026-001"],
    action: "Qualify alternate", actionDetail: "Accept the PCN, pull 300 new-site samples now and run delta qualification (thermal cycling, HTOL data review) before the SOP build so launch material is not mixed-site.",
    actionCostL: 6.4, confidence: 88,
    evidence: ["PCN-HS-2026-118 with qualification summary attached", "Varuna SQ manual §6.4: site change needs delta PPAP level 3", "First new-site lots land 3 weeks before SOP"],
    owner: "Prakash Iyer",
  },
  {
    id: "PCN-2026-034", pn: "MCU-32A-144", description: "32-bit MCU, 144 pin, HSM", supplierId: "SUP-003", type: "Allocation", severity: "high", issued: "2026-09-04",
    summary: "Kortex Microsystems confirms 80% of forecast through Q1 2027. Lead time moved from 30 to 38 weeks.",
    leadTimeWas: 30, leadTimeNow: 38, allocationPct: 80, aecq: "AEC-Q100 Grade 1", alternateStatus: "None identified", programIds: ["PGM-2026-003", "PGM-2026-004"],
    action: "Buffer stock", actionDetail: "Convert the forecast to a 12-month non-cancellable order under the LTA, which moves Auralis to priority allocation, and hold 8 weeks of stock.",
    ltbQty: 30000, actionCostL: 95.4, confidence: 79,
    evidence: ["Allocation notice 4 Sep 2026", "LTA clause 7.2: firm 12-month orders get priority allocation", "Combined TCU and gateway demand: 13,750 per month from Jun 2027"],
    owner: "Arjun Bhatia",
  },
  {
    id: "PCN-2026-035", pn: "TFT-10.25", description: "TFT panel 10.25 in", supplierId: "SUP-026", type: "Lead-time creep", severity: "high", issued: "2026-09-12",
    summary: "Quoted lead time moved from 18 to 26 weeks after a driver-IC shortage at the panel maker's sub-tier.",
    leadTimeWas: 18, leadTimeNow: 26, aecq: "Not automotive qualified", alternateStatus: "None identified", programIds: ["PGM-2026-005"],
    action: "Buffer stock", actionDetail: "Pull the SOP material order forward by 8 weeks and air-freight the first 4,000 panels.",
    ltbQty: 12000, actionCostL: 31.2, confidence: 77,
    evidence: ["Lead-time letter 12 Sep 2026", "Display driver IC is single source at tier 3 (see multi-tier map)", "PO-2026-095 already 39 days behind need date"],
    owner: "Kavya Nair",
  },
  {
    id: "PCN-2026-036", pn: "IMG-2M3-A", description: "Image sensor, 2.3 MP HDR", supplierId: "SUP-001", type: "Lead-time creep", severity: "medium", issued: "2026-08-14",
    summary: "Lead time moved from 20 to 26 weeks. Nexora cites colour-filter capacity.",
    leadTimeWas: 20, leadTimeNow: 26, aecq: "AEC-Q100 Grade 2", alternateStatus: "None identified", programIds: ["PGM-2026-001"],
    action: "Buffer stock", actionDetail: "Add 6 weeks of sensor stock at the Sahyadri hub and update the MRP lead time in SAP from 140 to 182 days.",
    ltbQty: 21000, actionCostL: 128.5, confidence: 81,
    evidence: ["Supplier bulletin 14 Aug 2026", "SAP material master still carries 140 days", "OTD has fallen from 91% to 78% in five months"],
    owner: "Arjun Bhatia",
  },
  {
    id: "PCN-2026-037", pn: "MLCC-X7R-106", description: "MLCC kit, X7R", supplierId: "SUP-009", type: "PCN", severity: "low", issued: "2026-09-22",
    summary: "Termination plating supplier change on 0402 X7R values. AEC-Q200 data supplied, no change to form, fit or function.",
    leadTimeWas: 12, leadTimeNow: 12, aecq: "AEC-Q200", alternateStatus: "Qualified", programIds: ["PGM-2026-001", "PGM-2026-002", "PGM-2026-003"],
    action: "Qualify alternate", actionDetail: "Accept on data review. No delta PPAP needed under any OEM manual for a passive termination change with full AEC-Q200 data.",
    actionCostL: 0, confidence: 94,
    evidence: ["PCN-KC-0931 with AEC-Q200 rev E test report", "Solderability and board-flex results inside limits"],
    owner: "Tanvi Joshi",
  },
  {
    id: "PCN-2026-038", pn: "PHY-CANFD-2", description: "CAN FD transceiver", supplierId: "SUP-006", type: "EOL", severity: "medium", issued: "2026-07-30",
    summary: "SOIC-8 package variant goes end of life. Last-time buy closes 31 Mar 2027. The DFN variant continues and is already on the AVL.",
    ltbDate: "2027-03-31", lastShipDate: "2027-09-30", leadTimeWas: 14, leadTimeNow: 14, aecq: "AEC-Q100 Grade 1", alternateStatus: "Qualified", programIds: ["PGM-2026-004", "PGM-2026-006"],
    action: "Qualify alternate", actionDetail: "Switch the gateway to the DFN footprint before layout freeze. For the headlamp controller, already in production, release an engineering change with a dual footprint at the next board revision.",
    actionCostL: 2.1, confidence: 91,
    evidence: ["EOL notice 30 Jul 2026", "DFN variant PPAP approved on PGM-2026-002", "Gateway layout freeze is 6 Nov 2026"],
    owner: "Arjun Bhatia",
  },
  {
    id: "PCN-2026-039", pn: "LEDDRV-8CH", description: "LED matrix driver, 8 channel", supplierId: "SUP-029", type: "EOL", severity: "high", issued: "2026-09-08",
    summary: "End of life. Last-time buy closes 15 Jan 2027. The headlamp controller is in series production with 46 months of life left.",
    ltbDate: "2027-01-15", lastShipDate: "2027-07-15", leadTimeWas: 18, leadTimeNow: 18, aecq: "AEC-Q100 Grade 1", alternateStatus: "None identified", programIds: ["PGM-2026-006"],
    action: "Last-time buy", actionDetail: "Buy 9,00,000 pieces (18 months) and start a redesign on the successor driver. A full-life buy would tie up ₹34 Cr and exceed the 24-month shelf-life rule.",
    ltbQty: 900000, actionCostL: 1332, confidence: 84,
    evidence: ["EOL notice 8 Sep 2026", "Volume: 3,00,000 units a year, 2 drivers per unit", "Successor is not pin compatible; redesign plus Varuna validation is 14 months"],
    owner: "Arjun Bhatia",
  },
  {
    id: "PCN-2026-040", pn: "MEMS-P-450", description: "MEMS pressure sensor, 450 kPa", supplierId: "SUP-030", type: "Lead-time creep", severity: "medium", issued: "2026-09-26",
    summary: "Lead time moved from 16 to 22 weeks. Single source for the Orbis TPMS.",
    leadTimeWas: 16, leadTimeNow: 22, aecq: "AEC-Q100 Grade 1", alternateStatus: "None identified", programIds: ["PGM-2026-007"],
    action: "Qualify alternate", actionDetail: "Start a second-source study: two pin-compatible sensors exist, both need a pressure-port seal change and a 1,000-hour drift test.",
    actionCostL: 9.8, confidence: 73,
    evidence: ["Lead-time update 26 Sep 2026", "5,00,000 units a year depend on one die"],
    owner: "Rohit Deshmukh",
  },
  {
    id: "PCN-2026-041", pn: "XTAL-27M", description: "Crystal 27 MHz", supplierId: "SUP-012", type: "PCN", severity: "low", issued: "2026-10-02",
    summary: "Manufacturing moves between two buildings on the same Bengaluru site. No process change.",
    leadTimeWas: 10, leadTimeNow: 10, aecq: "AEC-Q200", alternateStatus: "Qualified", programIds: ["PGM-2026-001"],
    action: "Qualify alternate", actionDetail: "Accept on data review and record in the PPAP file.",
    actionCostL: 0, confidence: 96,
    evidence: ["PCN-QT-0088", "Same equipment, same operators, frequency data on 3 lots inside ±10 ppm"],
    owner: "Prakash Iyer",
  },
  {
    id: "PCN-2026-042", pn: "MMIC-77G", description: "Radar MMIC, 77 GHz, 3T4R", supplierId: "SUP-007", type: "Allocation", severity: "medium", issued: "2026-09-29",
    summary: "Sensara RF confirms 85% of forecast for 2027. The corner radar is 12 months from SOP so there is time to act.",
    leadTimeWas: 28, leadTimeNow: 32, allocationPct: 85, aecq: "AEC-Q100 Grade 1", alternateStatus: "None identified", programIds: ["PGM-2026-008"],
    action: "Buffer stock", actionDetail: "Sign the capacity reservation agreement Sensara has offered: 12-month rolling commitment for guaranteed supply of 7,500 a month.",
    ltbQty: 90000, actionCostL: 0, confidence: 80,
    evidence: ["Allocation letter 29 Sep 2026", "Capacity reservation draft received 6 Oct 2026"],
    owner: "Arjun Bhatia",
  },
  {
    id: "PCN-2026-043", pn: "LPD4-2G", description: "LPDDR4 2 Gb", supplierId: "SUP-005", type: "EOL", severity: "medium", issued: "2026-08-06",
    summary: "LPDDR4 at this density goes end of life. Last-time buy closes 30 Jun 2027. LPDDR4X successor needs a 0.6 V I/O rail.",
    ltbDate: "2027-06-30", lastShipDate: "2027-12-31", leadTimeWas: 18, leadTimeNow: 18, aecq: "AEC-Q100 Grade 2", alternateStatus: "In qualification", programIds: ["PGM-2026-001", "PGM-2026-003", "PGM-2026-005"],
    action: "Redesign", actionDetail: "Move all three boards to LPDDR4X at their first planned revision. The PMICs in use can supply 0.6 V with a resistor change, so this is a layout-neutral redesign plus memory validation.",
    actionCostL: 18.5, confidence: 85,
    evidence: ["EOL notice 6 Aug 2026", "PMIC-5R-Q and PMIC-7R-Q both support a 0.6 V rail", "Three programs share the part: 4,20,000 pieces a year"],
    owner: "Arjun Bhatia",
  },
];

// --- should-cost -----------------------------------------------------------

export const SHOULD_COSTS: ShouldCostLine[] = [
  {
    id: "SC-01", pn: "HSG-CAM-AL", description: "Front housing, die-cast ADC12, machined", supplierId: "SUP-021", programId: "PGM-2026-001", annualQty: 180000,
    target: 148, quoted: 164, shouldCost: 141, breakdown: { material: 52, conversion: 48, overhead: 17, logistics: 6, margin: 18 },
    levers: [
      { id: "L1", label: "Index aluminium to LME plus a fixed premium", saving: 7, evidence: "Quote assumes ADC12 at ₹248/kg; 3-month average is ₹226/kg. Shot weight 212 g." },
      { id: "L2", label: "Cut machining from 3 setups to 2", saving: 9, evidence: "Datum B can be cast-in. Formet does this on the gateway housing at 41 s cycle against 68 s." },
      { id: "L3", label: "Margin from 12.3% to 9% for a 3-year award", saving: 5, evidence: "Castwell's last three awards with Auralis closed at 8.5 to 9.5%." },
    ],
    brief: [
      "Open with the aluminium index: it is factual and Castwell has accepted indexing on two other parts.",
      "Offer a 3-year LTA with volume bands in return for the 2-setup process and 9% margin.",
      "Walk-away: Formet Die Casting is quoted at ₹173 with a new ₹22L tool, break-even in 14 months.",
    ],
    confidence: 84,
  },
  {
    id: "SC-02", pn: "PCB-CAM-6L", description: "Bare PCB, 6-layer HDI, ENIG", supplierId: "SUP-017", programId: "PGM-2026-001", annualQty: 180000,
    target: 195, quoted: 214, shouldCost: 188, breakdown: { material: 86, conversion: 58, overhead: 19, logistics: 9, margin: 16 },
    levers: [
      { id: "L1", label: "Panel utilisation from 71% to 84%", saving: 14, evidence: "A 4 x 6 array with rotated coupons fits the 457 x 610 mm panel. Current array is 4 x 5." },
      { id: "L2", label: "ENIG gold thickness to 0.05 µm minimum", saving: 6, evidence: "Drawing calls 0.05 to 0.10 µm; supplier is plating to 0.09 µm average." },
      { id: "L3", label: "Sea freight with 4-week hub stock", saving: 6, evidence: "Currently air at ₹9 per board. Sea plus carrying cost is ₹3." },
    ],
    brief: [
      "Share the 4 x 6 panel drawing; it is the largest single lever and costs the supplier nothing.",
      "Ask for a gold-thickness Cpk report before asking for the price.",
      "Copperleaf Boards is in qualification at ₹233; use it as a delivery backstop, not a price lever.",
    ],
    confidence: 81,
  },
  {
    id: "SC-03", pn: "LENS-190F", description: "Lens module, athermal, IR-cut", supplierId: "SUP-019", programId: "PGM-2026-001", annualQty: 180000,
    target: 455, quoted: 486, shouldCost: 448, breakdown: { material: 198, conversion: 142, overhead: 44, logistics: 14, margin: 50 },
    levers: [
      { id: "L1", label: "Yield-linked price at 92% MTF yield", saving: 21, evidence: "Supplier cost model assumes 85% yield. Last 6 lots averaged 92.4%." },
      { id: "L2", label: "Consolidate freight with image sensor from Taiwan", saving: 6, evidence: "Both ship weekly from the Taoyuan forwarder hub." },
      { id: "L3", label: "Second-source credibility", saving: 11, evidence: "Clarion Optics India budgetary quote is ₹455 before MTF validation." },
    ],
    brief: [
      "Single source: do not threaten a move you cannot make before SOP.",
      "Lead with the yield data from their own lot reports and ask for a yield-linked price band.",
      "Tie any price concession to the capacity reservation the program needs anyway.",
    ],
    confidence: 76,
  },
  {
    id: "SC-04", pn: "HDR-48S", description: "Sealed header, 48 way", supplierId: "SUP-015", programId: "PGM-2026-004", annualQty: 90000,
    target: 172, quoted: 186, shouldCost: 168, breakdown: { material: 74, conversion: 46, overhead: 16, logistics: 5, margin: 27 },
    levers: [
      { id: "L1", label: "Selective gold on signal pins only", saving: 9, evidence: "32 of 48 pins are power or ground and can be tin plated per the Indus connector spec." },
      { id: "L2", label: "Margin from 14.5% to 10%", saving: 8, evidence: "Sealtite's sealed 24-way header to Auralis carries 10.2%." },
    ],
    brief: [
      "Bring the pin map marked up with tin-eligible positions.",
      "The 48-way volume doubles when the TCU launches; ask for the combined-volume price now.",
    ],
    confidence: 83,
  },
  {
    id: "SC-05", pn: "HRN-IC-MAIN", description: "Main harness, 32 way", supplierId: "SUP-024", programId: "PGM-2026-005", annualQty: 60000,
    target: 262, quoted: 284, shouldCost: 251, breakdown: { material: 138, conversion: 62, overhead: 20, logistics: 7, margin: 24 },
    levers: [
      { id: "L1", label: "Copper indexed monthly instead of quarterly", saving: 11, evidence: "Quote uses the June copper base; October is 6% lower." },
      { id: "L2", label: "Reduce wire gauge on 9 signal circuits to 0.35 mm²", saving: 13, evidence: "Current draw on those circuits is under 0.5 A." },
      { id: "L3", label: "Loomtech Wiring as qualified alternate", saving: 9, evidence: "Qualified on the AVL at ₹290; their copper base is current." },
    ],
    brief: [
      "Wirekraft is on financial watch: favour shorter payment terms over a deep price cut.",
      "Agree the gauge change with engineering before the meeting.",
    ],
    confidence: 80,
  },
  {
    id: "SC-06", pn: "PCB-BMS-4L", description: "Bare PCB, 4-layer, 2 oz copper", supplierId: "SUP-016", programId: "PGM-2026-002", annualQty: 240000,
    target: 139, quoted: 148, shouldCost: 136, breakdown: { material: 64, conversion: 38, overhead: 13, logistics: 4, margin: 17 },
    levers: [
      { id: "L1", label: "Laminate from the supplier's second approved source", saving: 7, evidence: "Same Tg 170 grade, UL listed, 8% cheaper per square metre." },
      { id: "L2", label: "Electrical test by flying probe sampling after 3 clean lots", saving: 5, evidence: "100% fixture test today; first-pass yield is 99.6%." },
    ],
    brief: ["Volume is firm and launching in 8 weeks; ask for the price to step down at 50,000 cumulative boards."],
    confidence: 82,
  },
  {
    id: "SC-07", pn: "HSG-ECU-AL", description: "ECU housing, die-cast ADC12", supplierId: "SUP-021", programId: "PGM-2026-004", annualQty: 45000,
    target: 198, quoted: 212, shouldCost: 196, breakdown: { material: 78, conversion: 61, overhead: 22, logistics: 8, margin: 27 },
    levers: [
      { id: "L1", label: "Two-cavity tool instead of single cavity", saving: 10, evidence: "Machine rate ₹1,850 per hour; cycle 58 s. Two cavities fit the 350 t press." },
      { id: "L2", label: "Award to Formet Die Casting", saving: 8, evidence: "Qualified alternate at ₹204 with the tool already costed." },
    ],
    brief: ["A sourcing event is open (SE-2026-017). Use the should-cost as the reserve price."],
    confidence: 85,
  },
  {
    id: "SC-08", pn: "CVR-LENS-AG", description: "Cover lens, anti-glare", supplierId: "SUP-020", programId: "PGM-2026-005", annualQty: 60000,
    target: 385, quoted: 412, shouldCost: 372, breakdown: { material: 152, conversion: 128, overhead: 36, logistics: 11, margin: 45 },
    levers: [
      { id: "L1", label: "Coating batch size from 48 to 72 pieces", saving: 18, evidence: "Chamber fixture drawing shows unused positions on the outer ring." },
      { id: "L2", label: "Reject returns for re-coat instead of scrap", saving: 12, evidence: "Scrap is 7.5%; two-thirds are coating cosmetic rejects." },
    ],
    brief: ["Offer a joint yield workshop at Noida; the supplier has asked for engineering support twice."],
    confidence: 74,
  },
  {
    id: "SC-09", pn: "HRN-CAM-PIG", description: "Harness pigtail, 180 mm, sealed", supplierId: "SUP-024", programId: "PGM-2026-001", annualQty: 180000,
    target: 90, quoted: 96, shouldCost: 87, breakdown: { material: 41, conversion: 24, overhead: 8, logistics: 3, margin: 11 },
    levers: [
      { id: "L1", label: "Automated crimp and seal insertion", saving: 6, evidence: "Manual today at 38 s per piece; applicator on the supplier's line B runs 14 s." },
      { id: "L2", label: "Copper index reset", saving: 3, evidence: "Same June base as the cluster harness." },
    ],
    brief: ["Bundle with the cluster harness discussion."],
    confidence: 82,
  },
  {
    id: "SC-10", pn: "GSK-CAM-SI", description: "Perimeter gasket, silicone", supplierId: "SUP-023", programId: "PGM-2026-001", annualQty: 180000,
    target: 11, quoted: 12, shouldCost: 10.4, breakdown: { material: 3.8, conversion: 3.4, overhead: 1.2, logistics: 0.4, margin: 1.6 },
    levers: [{ id: "L1", label: "16-cavity tool at next refurbishment", saving: 1.6, evidence: "8-cavity today; press has platen room." }],
    brief: ["Low value. Take the tool change at refurbishment and do not spend meeting time on it."],
    confidence: 88,
  },
  {
    id: "SC-11", pn: "FAK-Z-90", description: "FAKRA Z-code connector, right angle", supplierId: "SUP-013", programId: "PGM-2026-001", annualQty: 180000,
    target: 104, quoted: 118, shouldCost: 99, breakdown: { material: 38, conversion: 27, overhead: 11, logistics: 8, margin: 15 },
    levers: [
      { id: "L1", label: "Award second source to Coaxis Connect", saving: 21, evidence: "Bid of ₹97 lands at ₹98.4 in SE-2026-014; samples passed insertion-loss test." },
      { id: "L2", label: "Reel packaging at 600 per reel", saving: 3, evidence: "Tray of 120 today; EMS feeder supports reel." },
    ],
    brief: ["Decide the award in SE-2026-014 first. Keep Faktron at 30% share to hold the PPAP."],
    confidence: 86,
  },
  {
    id: "SC-12", pn: "HSG-IC-MG", description: "Rear housing, magnesium die-cast", supplierId: "SUP-022", programId: "PGM-2026-005", annualQty: 60000,
    target: 462, quoted: 486, shouldCost: 458, breakdown: { material: 186, conversion: 148, overhead: 42, logistics: 12, margin: 70 },
    levers: [
      { id: "L1", label: "Runner regrind credit", saving: 14, evidence: "Shot weight 610 g, part 380 g. Quote gives no credit for the 230 g returned to melt." },
      { id: "L2", label: "Margin from 15% to 11%", saving: 14, evidence: "Formet's aluminium parts with Auralis run at 10 to 11%." },
    ],
    brief: ["Formet is a low-risk supplier with good delivery; keep the tone collaborative and trade margin for a 4-year award."],
    confidence: 79,
  },
];
