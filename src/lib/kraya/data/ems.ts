import type { AllocationProposal, CapacityLine, TierChain, TierNode } from "../types";

/** Pseudo program id for products outside the 12 tracked programs. */
export const OTHER_LOAD = "OTHER";

const k = (values: number[]) => values.map((v) => Math.round(v * 1000));

/** Boards per month by EMS partner and program, Oct 2026 to Sep 2027. */
export const CAPACITY_LINES: CapacityLine[] = [
  { emsId: "EMS-01", programId: OTHER_LOAD, demand: k([44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44, 44]) },
  { emsId: "EMS-01", programId: "PGM-2026-001", demand: k([0, 0.5, 1, 2, 8, 12, 15, 15, 15, 15, 15, 15]) },
  { emsId: "EMS-01", programId: "PGM-2026-008", demand: k([0, 0, 0, 0.1, 0.1, 0.2, 0.2, 0.2, 0.5, 0.5, 1, 2]) },
  { emsId: "EMS-02", programId: OTHER_LOAD, demand: k([82, 82, 83, 84, 84, 84, 84, 84, 84, 84, 84, 84]) },
  { emsId: "EMS-02", programId: "PGM-2026-005", demand: k([0, 0, 0.3, 0.5, 2, 5, 5, 5, 5, 5, 5, 5]) },
  { emsId: "EMS-02", programId: "PGM-2026-003", demand: k([0, 0, 0, 0.5, 0.5, 1, 10, 10, 10, 10, 10, 10]) },
  { emsId: "EMS-03", programId: OTHER_LOAD, demand: k([30, 30, 30, 29, 29, 28, 28, 28, 28, 28, 28, 28]) },
  { emsId: "EMS-03", programId: "PGM-2026-002", demand: k([0, 0.5, 6, 14, 20, 20, 20, 20, 20, 20, 20, 20]) },
  { emsId: "EMS-04", programId: OTHER_LOAD, demand: k([30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30, 30]) },
  { emsId: "EMS-04", programId: "PGM-2026-006", demand: k([25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25, 25]) },
  { emsId: "EMS-04", programId: "PGM-2026-004", demand: k([0, 0, 0, 0, 0.2, 0.2, 0.5, 1, 3.75, 3.75, 3.75, 3.75]) },
  { emsId: "EMS-05", programId: OTHER_LOAD, demand: k([24, 24, 24, 22, 20, 18, 14, 10, 8, 6, 6, 6]) },
  { emsId: "EMS-05", programId: "PGM-2026-007", demand: k([0, 0, 0, 0, 0, 0.5, 1, 2, 4, 30, 42, 42]) },
  { emsId: "EMS-06", programId: OTHER_LOAD, demand: k([17, 17, 18, 18, 18, 18, 18, 18, 18, 18, 18, 18]) },
  { emsId: "EMS-07", programId: OTHER_LOAD, demand: k([14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14, 14]) },
  { emsId: "EMS-08", programId: OTHER_LOAD, demand: k([32, 32, 33, 33, 34, 34, 34, 34, 34, 34, 34, 34]) },
];

export const ALLOCATION_PROPOSALS: AllocationProposal[] = [
  {
    id: "ALC-01", programId: "PGM-2026-002", fromEmsId: "EMS-03", toEmsId: "EMS-07", months: [4, 5, 6, 7, 8, 9, 10, 11], boardsPerMonth: 8000,
    rationale: [
      "Kaveri SMT Systems is short by 4,000 to 5,000 boards a month from February once the BMS reaches 20,000.",
      "Marina Precision Electronics runs at 54% and already has conformal coating, potting and ICT / FCT.",
      "Marina holds an ISO 26262 process assessment; Kaveri does not (audit finding AF-104).",
    ],
    costDeltaL: 4.8, confidence: 85, owner: "Meenakshi Rao",
  },
  {
    id: "ALC-02", programId: "PGM-2026-005", fromEmsId: "EMS-02", toEmsId: "EMS-04", months: [6, 7, 8, 9, 10, 11], boardsPerMonth: 5000,
    rationale: [
      "Coromandel Circuit Works goes 4,000 boards over capacity in April when the TCU launches on top of the cluster.",
      "Aravali Assembly Works has optical bonding and runs at 71%.",
      "Moving the cluster, not the TCU, keeps RF calibration equipment where it is.",
    ],
    costDeltaL: 11.5, confidence: 81, owner: "Meenakshi Rao",
  },
  {
    id: "ALC-03", programId: "PGM-2026-007", fromEmsId: "EMS-05", toEmsId: "EMS-04", months: [10, 11], boardsPerMonth: 10000,
    rationale: [
      "Sabarmati Mechatronics is short by 8,000 boards a month from August at full TPMS volume.",
      "Aravali has the SMT headroom but needs an ultrasonic weld cell: ₹18L, 10 weeks.",
      "A third shift at Sabarmati was costed at ₹26L a year and adds night-shift quality risk.",
    ],
    costDeltaL: 18.0, confidence: 74, owner: "Meenakshi Rao",
  },
];

// --- multi-tier ------------------------------------------------------------

function t(id: string, name: string, role: string, location: string, tier: 1 | 2 | 3, spof: boolean, note?: string, children?: TierNode[]): TierNode {
  return { id, name, role, location, tier, spof, note, children };
}

export const TIER_CHAINS: TierChain[] = [
  {
    id: "MT-01", pn: "IMG-2M3-A", description: "Image sensor, 2.3 MP HDR", programIds: ["PGM-2026-001"],
    exposure: "One colour-filter line at tier 3 limits every sensor Nexora ships.",
    action: "Ask Nexora to disclose its colour-filter recovery plan and reserve output on the second line due in March.",
    root: t("SUP-001", "Nexora Semiconductor", "Sensor design and final test", "Hsinchu, Taiwan", 1, false, undefined, [
      t("T2-011", "Formosa Wafer Foundry", "CMOS wafer fab, 65 nm BSI", "Tainan, Taiwan", 2, false, "Two fabs qualified", [
        t("T3-011", "Hikari Chroma", "Colour filter array and microlens", "Kumamoto, Japan", 3, true, "Single line; capacity cited in the lead-time notice"),
        t("T3-012", "Pure Silicon Works", "300 mm epitaxial wafers", "Singapore", 3, false),
      ]),
      t("T2-012", "Penang Pack & Test", "iBGA packaging and test", "Penang, Malaysia", 2, false, undefined, [
        t("T3-013", "Vitrum Cover Glass", "AR-coated cover glass", "Suzhou, China", 3, true, "Only approved glass source for this package"),
      ]),
    ]),
  },
  {
    id: "MT-02", pn: "LENS-190F", description: "Lens module, athermal", programIds: ["PGM-2026-001"],
    exposure: "Moulded glass blanks come from one press shop. A second-source lens maker would likely use the same blanks.",
    action: "Make an independent glass source a condition of the Clarion Optics second-source study.",
    root: t("SUP-019", "Optivue Lens Works", "Lens assembly and MTF test", "Taichung, Taiwan", 1, true, "Single source at tier 1", [
      t("T2-021", "Hoyo Precision Glass", "Moulded aspheric glass elements", "Nagano, Japan", 2, true, "Sole source for elements 1 and 4"),
      t("T2-022", "Taichung Barrel Works", "Machined aluminium barrels", "Taichung, Taiwan", 2, false),
      t("T2-023", "Spectra Thin Films", "IR-cut filter coating", "Hsinchu, Taiwan", 2, false, undefined, [
        t("T3-021", "Blue Glass Materials", "Absorptive blue glass", "Jena, Germany", 3, true, "One of two makers worldwide"),
      ]),
    ]),
  },
  {
    id: "MT-03", pn: "AFE-14S", description: "Cell monitor AFE, 14 channel", programIds: ["PGM-2026-002"],
    exposure: "The 200 mm BCD fab is sold out. No second fab is qualified for this process.",
    action: "Bridge buy now; press Cellguard for the 300 mm port date and get it into the LTA.",
    root: t("SUP-008", "Cellguard Analog", "Design, wafer sort, final test", "Dallas, USA", 1, true, "Single source at tier 1", [
      t("T2-031", "LoneStar Fab 2", "200 mm BCD wafer fab", "Sherman, USA", 2, true, "Sold out to March 2027", [
        t("T3-031", "Cascade Wafer", "200 mm SOI substrates", "Oregon, USA", 3, false),
      ]),
      t("T2-032", "Cebu Assembly Services", "TQFP packaging", "Cebu, Philippines", 2, false),
    ]),
  },
  {
    id: "MT-04", pn: "TFT-10.25", description: "TFT panel 10.25 in", programIds: ["PGM-2026-005"],
    exposure: "The display driver IC is single source and is the stated cause of the 8-week lead-time creep.",
    action: "Ask Lumigrid to qualify the second driver IC it uses on consumer panels; offer validation support.",
    root: t("SUP-026", "Lumigrid Displays", "Cell, module assembly, bonding", "Suzhou, China", 1, true, "Single source at tier 1", [
      t("T2-041", "Jiangsu Glass Substrates", "TFT array glass", "Wuxi, China", 2, false),
      t("T2-042", "Nexdrive Microelectronics", "Display driver IC", "Hsinchu, Taiwan", 2, true, "Named in the lead-time letter", [
        t("T3-041", "Island Foundry 8", "150 nm HV wafer fab", "Hsinchu, Taiwan", 3, true, "Legacy node with no added capacity planned"),
      ]),
      t("T2-043", "Lumen Backlight", "LED backlight unit", "Dongguan, China", 2, false, undefined, [
        t("T3-042", "Brightline Drivers", "Backlight LEDs", "Hsinchu, Taiwan", 3, false, "Also a tier-1 supplier to Auralis"),
      ]),
    ]),
  },
  {
    id: "MT-05", pn: "PCB-CAM-6L", description: "Bare PCB, 6-layer HDI", programIds: ["PGM-2026-001"],
    exposure: "Both PCB sources buy low-loss laminate from the same maker, so dual-sourcing the board does not remove this dependency.",
    action: "Approve a second laminate grade on the drawing before Copperleaf's qualification build.",
    root: t("SUP-017", "Stratum PCB", "HDI fabrication", "Shenzhen, China", 1, false, "Copperleaf Boards in qualification", [
      t("T2-051", "Shengli Laminates", "Low-loss copper-clad laminate", "Guangdong, China", 2, true, "Only laminate on the drawing", [
        t("T3-051", "Nittobo-type glass fabric mill", "Low-Dk glass fabric", "Fukushima, Japan", 3, true, "Industry-wide constraint"),
        t("T3-052", "Electrolytic copper foil mill", "HVLP copper foil", "Anhui, China", 3, false),
      ]),
      t("T2-052", "Pearl River Chemicals", "ENIG plating chemistry", "Guangzhou, China", 2, false),
    ]),
  },
  {
    id: "MT-06", pn: "MCU-32A-144", description: "32-bit MCU, 144 pin, HSM", programIds: ["PGM-2026-003", "PGM-2026-004"],
    exposure: "Kortex runs this family in one 40 nm embedded-flash fab. Allocation follows fab output, not order date.",
    action: "A firm 12-month order under LTA clause 7.2 is the only lever that moves allocation priority.",
    root: t("SUP-003", "Kortex Microsystems", "Design, test, quality", "Dresden, Germany", 1, false, undefined, [
      t("T2-061", "Elbe Foundry", "40 nm embedded-flash fab", "Dresden, Germany", 2, true, "One fab for the whole family", [
        t("T3-061", "Rhine Specialty Gases", "Neon and process gases", "Ludwigshafen, Germany", 3, false),
      ]),
      t("T2-062", "Malacca Test Centre", "LQFP packaging and final test", "Malacca, Malaysia", 2, false),
    ]),
  },
];
