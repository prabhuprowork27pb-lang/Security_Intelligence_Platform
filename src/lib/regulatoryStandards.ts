/**
 * Indian regulatory / standards reference table used by the
 * Validated Intelligence Report.
 */
export interface RegStandard {
  code: string;
  name: string;
  scope: string;
  applies_to: string;
}

export const INDIA_REG_STANDARDS: RegStandard[] = [
  {
    code: "PSARA",
    name: "Private Security Agencies (Regulation) Act, 2005",
    scope: "Licensing, training, background verification of private security personnel.",
    applies_to: "Any site deploying private security guards in India.",
  },
  {
    code: "DPDP",
    name: "Digital Personal Data Protection Act, 2023",
    scope: "Lawful processing, consent, breach notification for personal data — including CCTV footage of identifiable individuals.",
    applies_to: "All organisations processing personal data of individuals in India.",
  },
  {
    code: "ISO 18788",
    name: "ISO 18788:2015 — Management System for Private Security Operations",
    scope: "Risk-based governance, accountability, and human-rights respect in security operations.",
    applies_to: "Sites maintaining structured, auditable security operations.",
  },
  {
    code: "Labour Codes",
    name: "Code on Wages 2019 · OSH Code 2020",
    scope: "Working hours, welfare, safety obligations for on-site personnel including security.",
    applies_to: "All employers and contractors deploying personnel at the site.",
  },
];
