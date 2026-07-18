// Static evidence checklist per security domain.
// Surfaced for low-scoring domains (score < 71) so the assessor knows
// exactly what to collect to validate the diagnostic finding.

export interface EvidenceItem {
  label: string;
  detail?: string;
}

export interface DomainEvidence {
  documents: EvidenceItem[];
  logsAndRecords: EvidenceItem[];
  interviews: EvidenceItem[];
}

const DEFAULT: DomainEvidence = {
  documents: [
    { label: "Current security policy / SOP set" },
    { label: "Org chart with security roles & accountabilities" },
  ],
  logsAndRecords: [
    { label: "Last 90 days of operational logs / registers" },
  ],
  interviews: [
    { label: "Site security in-charge" },
    { label: "Facilities / admin lead" },
  ],
};

export const DOMAIN_EVIDENCE: Record<string, DomainEvidence> = {
  SITE_PROFILE: {
    documents: [
      { label: "Site risk profile / threat assessment document" },
      { label: "Asset criticality register & zoning map" },
      { label: "Neighbourhood & adjacency risk notes" },
    ],
    logsAndRecords: [
      { label: "Recent change log for site layout / tenant mix" },
      { label: "Past 12 months incident geo-pattern (if available)" },
    ],
    interviews: [
      { label: "Site head / facility manager" },
      { label: "Security lead — to validate articulated risk context" },
    ],
  },
  GOVERNANCE: {
    documents: [
      { label: "Approved security policy & version history" },
      { label: "Roles, responsibilities & RACI matrix" },
      { label: "Security governance calendar / review minutes" },
    ],
    logsAndRecords: [
      { label: "Last 4 governance / security review meeting minutes" },
      { label: "Open exceptions and policy waiver register" },
      { label: "KPI / metrics dashboards shared with leadership" },
    ],
    interviews: [
      { label: "Accountable executive (CSO / Admin head)" },
      { label: "Security manager — on enforcement & escalation paths" },
    ],
  },
  PERIMETER: {
    documents: [
      { label: "Perimeter design drawing & access point map" },
      { label: "Boundary wall, fencing & gate specification" },
      { label: "After-hours access SOP" },
    ],
    logsAndRecords: [
      { label: "Last 30 days access control event logs (entry/exit)" },
      { label: "Tailgating / forced-entry incident register" },
      { label: "Perimeter maintenance & repair log" },
    ],
    interviews: [
      { label: "Gate supervisor across all shifts" },
      { label: "Security control room operator" },
    ],
  },
  VISITOR: {
    documents: [
      { label: "Visitor / vendor / contractor management SOP" },
      { label: "Approved escort and access duration matrix" },
      { label: "Vendor onboarding & BGV checklist" },
    ],
    logsAndRecords: [
      { label: "Last 30 days visitor management system export" },
      { label: "Contractor work permit register" },
      { label: "Lost / unreturned visitor badge log" },
    ],
    interviews: [
      { label: "Lobby / reception lead" },
      { label: "Procurement or vendor coordinator" },
    ],
  },
  GUARDING: {
    documents: [
      { label: "PSARA license & vendor agreement" },
      { label: "Approved post orders for each guarding position" },
      { label: "Training calendar & shift roster" },
    ],
    logsAndRecords: [
      { label: "BGV, police verification & ID records (sample 10%)" },
      { label: "PF / ESI / wage compliance challans (last 3 months)" },
      { label: "Daily occurrence book & shift handover log" },
      { label: "Guard mount / drill records" },
    ],
    interviews: [
      { label: "Guarding vendor account manager" },
      { label: "2–3 deployed guards across critical posts" },
      { label: "Site security supervisor" },
    ],
  },
  ESS: {
    documents: [
      { label: "CCTV coverage map & camera inventory" },
      { label: "Access control system architecture diagram" },
      { label: "AMC / maintenance contract for ESS estate" },
    ],
    logsAndRecords: [
      { label: "System health / uptime reports (last 90 days)" },
      { label: "Recording retention sample & playback test" },
      { label: "Access control exception & alarm event log" },
    ],
    interviews: [
      { label: "Control room / monitoring operator" },
      { label: "IT / OT engineer responsible for ESS" },
    ],
  },
  INCIDENT: {
    documents: [
      { label: "Incident management & escalation SOP" },
      { label: "Severity classification matrix" },
      { label: "Root cause analysis (RCA) template" },
    ],
    logsAndRecords: [
      { label: "Incident register for last 12 months" },
      { label: "CAPA tracker with closure status" },
      { label: "Near-miss / precursor event log (if maintained)" },
    ],
    interviews: [
      { label: "Incident response lead" },
      { label: "Security supervisor — on field reporting discipline" },
    ],
  },
  CULTURE: {
    documents: [
      { label: "Security awareness training plan & content samples" },
      { label: "Leadership communication on security expectations" },
    ],
    logsAndRecords: [
      { label: "Training completion records (last 12 months)" },
      { label: "Phishing / tailgating drill outcomes" },
      { label: "Employee security incident reports submitted" },
    ],
    interviews: [
      { label: "HR / L&D lead" },
      { label: "Sample of 3–5 employees from different functions" },
    ],
  },
  BCP: {
    documents: [
      { label: "Business continuity & crisis management plan" },
      { label: "Emergency response & evacuation SOP" },
      { label: "Recovery time / point objectives per critical activity" },
    ],
    logsAndRecords: [
      { label: "Drill reports for last 12 months (fire, evacuation, BCP)" },
      { label: "Crisis call tree validation log" },
      { label: "Post-drill improvement action tracker" },
    ],
    interviews: [
      { label: "BCP / crisis owner" },
      { label: "Business owner of a critical activity" },
    ],
  },
  COMPLIANCE: {
    documents: [
      { label: "Statutory compliance register (PSARA, fire, labour, etc.)" },
      { label: "Third-party / vendor risk assessment records" },
      { label: "Last internal & external audit reports" },
    ],
    logsAndRecords: [
      { label: "CAPA closure register from last audits" },
      { label: "License & permit renewal tracker" },
      { label: "Contractual SLA performance data (last 2 quarters)" },
    ],
    interviews: [
      { label: "Compliance / legal owner" },
      { label: "Procurement / vendor management lead" },
    ],
  },
};

export const getEvidenceFor = (domainKey: string): DomainEvidence => {
  return DOMAIN_EVIDENCE[domainKey] ?? DEFAULT;
};
