/**
 * Product identity. The shell (logo, top bar, login, metadata) reads this, so
 * renaming the product is a one-file change.
 */
export const APP = {
  /** One-word Sanskrit product name, rendered as the wordmark. */
  name: "Kraya",
  devanagari: "क्रय",
  /** What the Sanskrit word means, shown once on the sign-in surface. */
  meaning: "procurement",
  descriptor: "Procurement command center for automotive electronics",
  /** Zero-based index of the wordmark letter that takes the brand orange. */
  accentIndex: 2,
  loginHeadline: "From RFQ to SOP, nothing bought blind.",
  loginSubline: "Every program, BOM line, supplier and purchase order between the OEM's enquiry and start of production, with the risk named before it reaches the line.",
  loginNote: "The command center is buyer-only.",
  /** Scope pill in the top bar, e.g. the tenant or dataset in view. */
  scope: "Auralis Mobility Electronics",
  operator: { name: "Demo Operator", initials: "DO" },
  home: "/dashboard",
  settingsHref: "/settings",
} as const;
