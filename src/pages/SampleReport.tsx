import { useMemo } from "react";
import { useParams, useNavigate, Navigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ScoreGauge } from "@/components/ScoreGauge";
import { InlineCta } from "@/components/InlineCta";
import OneClickDownload from "@/components/OneClickDownload";
import ConfidentialityNote from "@/components/ConfidentialityNote";
import ReportWatermark from "@/components/ReportWatermark";
import StudioInquiryDialog from "@/components/StudioInquiryDialog";
import {
  Download, ArrowLeft, ShieldCheck, Printer, ArrowRight, AlertTriangle,
  TrendingUp, Target, Calendar, IndianRupee, FileCheck2, Users, MapPin,
  Activity, Eye, BookOpen, Sparkles, CheckCircle2, Building2, Landmark, Globe2,
} from "lucide-react";

// ────────────────────────────────────────────────────────────────────────
// Types
// ────────────────────────────────────────────────────────────────────────
interface DomainMetric { label: string; current: string; benchmark: string; gap: "ok" | "watch" | "exposed"; }
interface SampleDomain {
  key: string;
  name: string;
  score: number;
  weight: number;
  commentary: string;
  metrics: DomainMetric[];
  observations: string[];
  recommendations: string[];
}
interface CriticalFinding {
  id: string;
  title: string;
  severity: "Critical" | "High" | "Material";
  domain: string;
  observation: string;
  consequence: string;
  recommendation: string;
  investmentInr: string;
  effort: "Quick win" | "30-day" | "60-90 day" | "Capital";
}
interface RoadmapItem {
  horizon: "0-30 days" | "31-60 days" | "61-90 days";
  initiative: string;
  owner: string;
  outcome: string;
  investment: string;
}
interface SampleProfile {
  slug: string;
  industry: string;
  archetype: string;
  city: string;
  state: string;
  headcount: string;
  builtUp: string;
  shifts: string;
  criticality: string;
  overall: number;
  posture: "Red" | "Amber" | "Teal" | "Green";
  peerBand: string;
  prepared: string;
  validatedBy: string;
  reportRef: string;
  icon: React.ReactNode;
  exec: {
    headline: string;
    posture: string;
    keyStrength: string;
    keyExposure: string;
    boardCall: string;
  };
  contextualBrief: string;
  domains: SampleDomain[];
  criticalFindings: CriticalFinding[];
  roadmap: RoadmapItem[];
  investment: { capex: string; opex: string; payback: string; rationale: string };
  regulatory: { framework: string; alignment: "Aligned" | "Partial" | "Gap"; note: string }[];
}

// ────────────────────────────────────────────────────────────────────────
// Sample Profiles — three rich, board-grade exemplars
// ────────────────────────────────────────────────────────────────────────
const SAMPLES: Record<string, SampleProfile> = {
  // ═══════════════════════════════════════════════════════════════════
  "it-ites": {
    slug: "it-ites",
    industry: "IT / ITES",
    archetype: "Tier-1 Software Development Centre",
    city: "Bengaluru",
    state: "Karnataka",
    headcount: "1,820",
    builtUp: "2.4 lakh sq.ft. across 6 floors",
    shifts: "24×7 operations · 3 production shifts",
    criticality: "Tier-1 (intellectual property, client production data)",
    overall: 64,
    posture: "Amber",
    peerBand: "Median for Indian IT/ITES Tier-1 sites: 67",
    prepared: "12 May 2026",
    validatedBy: "Security Selfie™ Specialist Review Panel",
    reportRef: "SS-DIAG-IT-2026-0142",
    icon: <Building2 className="h-5 w-5" />,
    exec: {
      headline:
        "A credible operational baseline that does not yet match the criticality of the workloads hosted. The site is one tabletop rehearsal cycle and one segmentation upgrade away from a defensible board narrative.",
      posture: "Amber — material exposures persist in incident-response choreography and contractor governance.",
      keyStrength: "Surveillance density, biometric access governance and visitor escort discipline are at or above sector median.",
      keyExposure: "Incident-response rehearsal cadence is materially below the criticality of the workloads hosted; insider-risk surveillance is event-driven.",
      boardCall: "Approve a focused ₹38–46 lakh investment over 90 days targeting incident command, contractor lifecycle, and intelligence operationalisation. Posture lift to Teal (74–78) is achievable within two quarters.",
    },
    contextualBrief:
      "This Security Intelligence Report™ is derived from the site sponsor's self-reported Security Selfie™ responses, the SIP™ knowledge graph and structured analytical models. Ten physical-security domains were evaluated against the Security Selfie™ framework (10×100), benchmarked against ISO 18788:2015 (Security Operations Management Systems) and ISO 22301:2019 (Business Continuity), and contextualised for Indian regulatory expectations under the PSARA 2005 and the Digital Personal Data Protection Act, 2023. Observations below are classified as Reported (captured from responses), Inferred (combined with sector benchmarks) or Recommended (advisory action). This is not an audit and does not involve interviews, walkthroughs or physical inspection.",
    domains: [
      {
        key: "perimeter", name: "Perimeter & Access Control", score: 72, weight: 12,
        commentary: "Three-layer access architecture with biometrics is operationally sound. Tailgating exposure remains under-instrumented at peak ingress windows (08:30–10:00).",
        metrics: [
          { label: "Access points with biometric + card", current: "100%", benchmark: "≥95%", gap: "ok" },
          { label: "Tailgating-detection coverage", current: "42%", benchmark: "≥80%", gap: "exposed" },
          { label: "Visitor-to-host escort compliance", current: "94%", benchmark: "≥98%", gap: "watch" },
          { label: "Anti-passback enforcement", current: "Partial", benchmark: "Full", gap: "watch" },
        ],
        observations: [
          "Turnstile lanes 3 and 5 lack lidar-based tailgating analytics.",
          "Visitor escort breaches concentrated in F&B and parking zones.",
          "Two contractor badges observed shared during audit window.",
        ],
        recommendations: [
          "Retrofit lidar tailgating analytics on all six turnstile lanes (₹6.2L).",
          "Mandate escort handover sign-off via mobile QR at three named zones.",
          "Activate anti-passback site-wide with a 14-day amnesty period.",
        ],
      },
      {
        key: "surveillance", name: "Surveillance & Monitoring", score: 76, weight: 11,
        commentary: "Camera coverage is comprehensive (4.2 cameras / 1,000 sq.ft.). Video analytics tier under-utilised on critical zones — alarms are reviewed but rarely correlated.",
        metrics: [
          { label: "Critical-zone coverage", current: "98%", benchmark: "≥95%", gap: "ok" },
          { label: "Retention period", current: "60 days", benchmark: "≥45 days", gap: "ok" },
          { label: "Analytics-enabled cameras", current: "31%", benchmark: "≥60% (Tier-1)", gap: "exposed" },
          { label: "PTZ failure MTTR", current: "38 hrs", benchmark: "≤24 hrs", gap: "watch" },
        ],
        observations: [
          "VMS retention exceeds policy but no automated integrity verification.",
          "Loitering and abandoned-object analytics inactive on data-centre periphery.",
        ],
        recommendations: [
          "Activate intrusion / loitering analytics on 14 critical-zone cameras (₹2.8L).",
          "Institute monthly VMS integrity hash audit with named owner.",
        ],
      },
      {
        key: "manpower", name: "Manpower, Training & Drills", score: 51, weight: 10,
        commentary: "Headcount is adequate (ratio 1:62) but drill scenarios lack adversarial depth and a deputy-of-deputy roster is not consistently named.",
        metrics: [
          { label: "PSARA-compliant licenced guards", current: "100%", benchmark: "100%", gap: "ok" },
          { label: "Quarterly drill participation", current: "78%", benchmark: "≥95%", gap: "exposed" },
          { label: "Adversarial scenario coverage", current: "1 / yr", benchmark: "≥4 / yr", gap: "exposed" },
          { label: "Named deputy-of-deputy roster", current: "Partial", benchmark: "Full", gap: "exposed" },
        ],
        observations: [
          "Last full-perimeter drill was 11 months ago.",
          "No documented insider-threat scenario in the past 24 months.",
        ],
        recommendations: [
          "Adopt a quarterly adversarial drill calendar with one tabletop per month.",
          "Publish and gazette a named deputy-of-deputy roster for every critical control.",
        ],
      },
      {
        key: "incident", name: "Incident Response & Crisis Management", score: 42, weight: 12,
        commentary: "The escalation matrix exists on paper. Tabletop rehearsal cadence is below industry expectation for a Tier-1 IT/ITES centre and there is no joint exercise with the technology desk.",
        metrics: [
          { label: "Incident playbook count", current: "11", benchmark: "≥18 (Tier-1)", gap: "exposed" },
          { label: "Mean detection-to-acknowledge", current: "8.2 min", benchmark: "≤4 min", gap: "exposed" },
          { label: "Joint cyber-physical exercise", current: "0 / yr", benchmark: "≥2 / yr", gap: "exposed" },
          { label: "After-action closure rate", current: "61%", benchmark: "≥90%", gap: "exposed" },
        ],
        observations: [
          "No documented exercise simulating insider exfiltration via removable media.",
          "Unified command roster lacks rotation; key-person dependency observed.",
        ],
        recommendations: [
          "Stand up a monthly tabletop programme covering 6 priority scenarios.",
          "Run two joint cyber-physical exercises per year with the SOC team.",
          "Mandate after-action closure within 30 days with board-visible KPI.",
        ],
      },
      {
        key: "tech", name: "Security Technology & Integration", score: 70, weight: 10,
        commentary: "VMS and ACS are integrated. Intrusion-detection feeds are not yet correlated to a SIEM-equivalent and analytics adoption is patchy.",
        metrics: [
          { label: "VMS-ACS integration", current: "Yes", benchmark: "Yes", gap: "ok" },
          { label: "Single pane-of-glass console", current: "Partial", benchmark: "Full", gap: "watch" },
          { label: "Sensor-to-alert correlation", current: "Manual", benchmark: "Automated", gap: "exposed" },
          { label: "System uptime (12-mo)", current: "99.4%", benchmark: "≥99.5%", gap: "watch" },
        ],
        observations: ["Two intrusion sensors offline at audit; ticket open 9 days."],
        recommendations: ["Deploy a converged operations console with rule-based correlation (₹14L CapEx)."],
      },
      {
        key: "compliance", name: "Compliance, Audit & Regulatory", score: 64, weight: 10,
        commentary: "PSARA contractor records are current. Periodic third-party validation is overdue. DPDP Act mapping exists but is not embedded in operational drills.",
        metrics: [
          { label: "PSARA contractor compliance", current: "100%", benchmark: "100%", gap: "ok" },
          { label: "Third-party security audit", current: "Overdue 4 mo", benchmark: "Annual", gap: "watch" },
          { label: "DPDP physical-controls mapping", current: "Documented", benchmark: "Operationalised", gap: "watch" },
          { label: "Internal audit closure rate", current: "73%", benchmark: "≥90%", gap: "watch" },
        ],
        observations: ["Last external audit November 2024; observations 4 of 11 still open."],
        recommendations: ["Schedule external audit within 60 days; close all C-rated observations before."],
      },
      {
        key: "asset", name: "Asset & Information Protection", score: 68, weight: 9,
        commentary: "Sensitive media handling is documented. Mobile-device frisking compliance is variable across shifts; clean-desk discipline strong.",
        metrics: [
          { label: "Removable-media policy enforcement", current: "USB blocked", benchmark: "Blocked", gap: "ok" },
          { label: "Mobile-device frisking (random)", current: "62%", benchmark: "≥85%", gap: "watch" },
          { label: "Print-room access logging", current: "Yes", benchmark: "Yes", gap: "ok" },
          { label: "Clean-desk audit pass rate", current: "88%", benchmark: "≥90%", gap: "watch" },
        ],
        observations: ["Frisking compliance falls to 41% on night shift."],
        recommendations: ["Introduce shift-supervisor accountability KPI for frisking discipline."],
      },
      {
        key: "vendor", name: "Vendor & Contractor Governance", score: 55, weight: 8,
        commentary: "Onboarding KYC is robust. Ongoing behavioural review is intermittent and re-validation is event-triggered rather than scheduled.",
        metrics: [
          { label: "Contractor KYC at onboarding", current: "100%", benchmark: "100%", gap: "ok" },
          { label: "Periodic re-validation", current: "Ad-hoc", benchmark: "Half-yearly", gap: "exposed" },
          { label: "Behavioural-flag review SLA", current: ">14 days", benchmark: "≤72 hrs", gap: "exposed" },
        ],
        observations: ["28% of contractors have not been re-validated in past 12 months."],
        recommendations: ["Institute a half-yearly contractor re-validation gate with named ownership."],
      },
      {
        key: "continuity", name: "Business Continuity & Resilience", score: 60, weight: 9,
        commentary: "Site-failover plan is tested annually. The BCM playbook has not been rehearsed jointly with the security function for 18 months.",
        metrics: [
          { label: "Annual BCP rehearsal", current: "Yes", benchmark: "Yes", gap: "ok" },
          { label: "Joint security-BCM exercise", current: "0 / yr", benchmark: "≥1 / yr", gap: "exposed" },
          { label: "RTO for critical operations", current: "8 hrs", benchmark: "≤4 hrs", gap: "watch" },
        ],
        observations: ["No documented joint exercise involving guard force in past 18 months."],
        recommendations: ["Run one joint security-BCM exercise per year with documented after-action."],
      },
      {
        key: "intelligence", name: "Threat Intelligence & Insider Risk", score: 58, weight: 9,
        commentary: "Open-source signal is monitored. Operational integration into shift posture and insider-risk dashboards is informal.",
        metrics: [
          { label: "OSINT subscription active", current: "Yes", benchmark: "Yes", gap: "ok" },
          { label: "Intelligence in shift handover", current: "No", benchmark: "Yes", gap: "exposed" },
          { label: "Insider-risk continuous baseline", current: "Absent", benchmark: "Active", gap: "exposed" },
        ],
        observations: ["Insider-risk dashboard not yet operationalised for sensitive functions."],
        recommendations: ["Stand up a continuous insider-risk dashboard within 60 days."],
      },
    ],
    criticalFindings: [
      {
        id: "F-01", title: "Incident-response rehearsal cadence below criticality", severity: "Critical", domain: "Incident Response",
        observation: "Only 1 adversarial scenario rehearsed in 24 months; joint cyber-physical exercises are absent.",
        consequence: "An actual incident is highly likely to be managed by improvisation, not muscle memory. Median containment time will exceed peer benchmarks by 3–4×, materially extending dwell time and exposure.",
        recommendation: "Institute a monthly tabletop programme spanning 6 priority scenarios; hold two joint cyber-physical exercises per year.",
        investmentInr: "₹4–6 lakh / year (facilitation + simulation tooling)",
        effort: "30-day",
      },
      {
        id: "F-02", title: "Contractor behavioural assurance is event-driven", severity: "High", domain: "Vendor & Contractor",
        observation: "28% of contractors have not been re-validated in past 12 months; behavioural flags acted upon in >14 days on average.",
        consequence: "Insider risk concentrated in the workforce segment with the lowest behavioural visibility. A single material event could expose regulatory non-compliance under the DPDP Act 2023.",
        recommendation: "Half-yearly re-validation gate; behavioural-flag SLA tightened to ≤72 hours with named accountability.",
        investmentInr: "₹3–4 lakh / year (process + tooling overlay)",
        effort: "60-90 day",
      },
      {
        id: "F-03", title: "Tailgating instrumentation under-deployed at peak ingress", severity: "High", domain: "Perimeter & Access",
        observation: "Only 42% of turnstiles instrumented for tailgating; breaches concentrated in 08:30–10:00 window.",
        consequence: "Unauthorised entry during peak ingress is the single most plausible vector for unsanctioned device introduction or asset reconnaissance.",
        recommendation: "Retrofit lidar-based tailgating analytics across all six turnstile lanes; mandate same-day alarm review.",
        investmentInr: "₹6.2 lakh CapEx + ₹0.8 lakh / year OpEx",
        effort: "60-90 day",
      },
      {
        id: "F-04", title: "Insider-risk surveillance is reactive, not continuous", severity: "Material",
        domain: "Threat Intelligence",
        observation: "No continuous behavioural baseline for sensitive-function workforce; signals reviewed only after a triggering event.",
        consequence: "Detection of slow-burn insider activity (data staging, unusual access patterns) is structurally improbable in current posture.",
        recommendation: "Stand up a continuous insider-risk dashboard with weekly review for sensitive functions.",
        investmentInr: "₹8–10 lakh CapEx + ₹2 lakh / year OpEx",
        effort: "60-90 day",
      },
      {
        id: "F-05", title: "Threat intelligence not operationalised in shift posture", severity: "Material",
        domain: "Threat Intelligence",
        observation: "OSINT and threat advisories are subscribed-to but not integrated into the daily ops huddle or shift handover.",
        consequence: "Posture remains static against a moving threat landscape; opportunity cost of intelligence already paid for.",
        recommendation: "Embed a 5-minute intelligence brief into every shift handover with a posture-recommendation field.",
        investmentInr: "₹1–2 lakh / year (process + template)",
        effort: "Quick win",
      },
    ],
    roadmap: [
      { horizon: "0-30 days", initiative: "Launch monthly adversarial tabletop programme", owner: "CSO + Site Security Lead", outcome: "First three scenarios rehearsed; after-action library seeded.", investment: "₹1.8 L" },
      { horizon: "0-30 days", initiative: "Embed intelligence brief into shift handover", owner: "Shift Supervisors", outcome: "100% handovers carry posture recommendation by Day 30.", investment: "₹0.4 L" },
      { horizon: "0-30 days", initiative: "Publish named deputy-of-deputy roster", owner: "CSO Office", outcome: "Zero key-person dependency for any critical control.", investment: "₹0" },
      { horizon: "31-60 days", initiative: "Schedule and complete external security audit", owner: "Compliance Lead", outcome: "All C-rated 2024 observations closed; new baseline established.", investment: "₹3.5 L" },
      { horizon: "31-60 days", initiative: "Activate analytics on 14 critical-zone cameras", owner: "Security Tech", outcome: "Loitering / abandoned-object alerts live on data-centre periphery.", investment: "₹2.8 L" },
      { horizon: "31-60 days", initiative: "Tighten frisking discipline on night shift", owner: "Operations Manager", outcome: "Frisking compliance ≥85% across all shifts.", investment: "₹0.6 L" },
      { horizon: "61-90 days", initiative: "Retrofit tailgating analytics on all turnstile lanes", owner: "Facilities + Security Tech", outcome: "Tailgating-detection coverage from 42% → 100%.", investment: "₹6.2 L" },
      { horizon: "61-90 days", initiative: "Stand up continuous insider-risk dashboard", owner: "CSO + IT Security", outcome: "Sensitive-function workforce under continuous behavioural baseline.", investment: "₹8–10 L" },
      { horizon: "61-90 days", initiative: "Deploy converged operations console", owner: "Security Tech", outcome: "Single pane-of-glass with sensor-alert correlation.", investment: "₹14 L" },
    ],
    investment: {
      capex: "₹31–34 lakh",
      opex: "₹8–12 lakh / year",
      payback: "11–14 months on avoided-incident basis",
      rationale: "Investment is concentrated in the three areas with highest posture-lift leverage: incident command, contractor lifecycle and intelligence operationalisation. Modeled posture lift: 64 → 76–78 within two quarters.",
    },
    regulatory: [
      { framework: "PSARA 2005", alignment: "Aligned", note: "Licenced contractor workforce and supervisor accreditation current." },
      { framework: "DPDP Act 2023 — physical safeguards", alignment: "Partial", note: "Mapping exists; operational drills not yet incorporate DPDP scenarios." },
      { framework: "ISO 18788:2015", alignment: "Partial", note: "Governance present; rehearsal cadence below clause-9 expectations." },
      { framework: "ISO 22301:2019", alignment: "Partial", note: "BCP exists; joint security-BCM exercise programme absent." },
      { framework: "Karnataka Fire & Emergency Services rules", alignment: "Aligned", note: "Annual NOC current; mock-drill records compliant." },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  "bfsi": {
    slug: "bfsi",
    industry: "BFSI Back-Office",
    archetype: "Captive Shared-Services Centre (private-sector bank)",
    city: "Mumbai",
    state: "Maharashtra",
    headcount: "2,410",
    builtUp: "3.1 lakh sq.ft. across 8 floors",
    shifts: "24×7 · regulated processing windows",
    criticality: "Tier-1 (regulated payments, customer PII, AML processing)",
    overall: 71,
    posture: "Teal",
    peerBand: "Median for Indian BFSI back-office: 69",
    prepared: "12 May 2026",
    validatedBy: "Security Selfie™ Specialist Review Panel",
    reportRef: "SS-DIAG-BFSI-2026-0143",
    icon: <Landmark className="h-5 w-5" />,
    exec: {
      headline:
        "A disciplined posture commensurate with a regulated processing environment. The site's frontier is no longer foundational controls — it is the move from event-triggered insider risk to continuous behavioural assurance.",
      posture: "Teal — sector-leading on access governance, audit trail integrity and continuity rehearsal.",
      keyStrength: "Mantrap-style entry, regulator-clean audit trail and joint annual BCP rehearsal — a sector-leading combination.",
      keyExposure: "Insider-risk surveillance is event-triggered; periodic contractor re-validation is inconsistent.",
      boardCall: "Approve a focused ₹26–32 lakh investment to lift continuous behavioural assurance and contractor lifecycle. Posture lift to high-Teal / low-Green (80–84) achievable within 90 days.",
    },
    contextualBrief:
      "This Security Intelligence Report™ is derived from the site sponsor's self-reported Security Selfie™ responses, the SIP™ knowledge graph and structured analytical models. Ten physical-security domains were evaluated against the Security Selfie™ framework, benchmarked against ISO 18788:2015 and ISO 22301:2019, and contextualised for the RBI Master Direction on Outsourcing of IT Services (2023), the IRDAI Information & Cyber Security Guidelines (2023) where applicable, and the Digital Personal Data Protection Act, 2023. Observations are classified as Reported, Inferred or Recommended. This is not an audit and does not involve interviews, walkthroughs or physical inspection.",
    domains: [
      {
        key: "perimeter", name: "Perimeter & Access Control", score: 80, weight: 12,
        commentary: "Mantrap-style entry with two-factor authentication; visitor escort discipline is exemplary.",
        metrics: [
          { label: "Mantrap deployment on critical floors", current: "100%", benchmark: "≥95%", gap: "ok" },
          { label: "Two-factor at access points", current: "100%", benchmark: "100%", gap: "ok" },
          { label: "Tailgating-detection coverage", current: "92%", benchmark: "≥90%", gap: "ok" },
          { label: "Visitor escort compliance", current: "99%", benchmark: "≥98%", gap: "ok" },
        ],
        observations: ["Audit found zero unescorted visitor incidents in past 90 days."],
        recommendations: ["Maintain current discipline; quarterly spot-audit by named owner."],
      },
      {
        key: "surveillance", name: "Surveillance & Monitoring", score: 78, weight: 11,
        commentary: "Critical-zone coverage with retention beyond regulatory floor; analytics pilot underway.",
        metrics: [
          { label: "Critical-zone coverage", current: "100%", benchmark: "100%", gap: "ok" },
          { label: "Retention period", current: "90 days", benchmark: "≥45 days", gap: "ok" },
          { label: "Analytics-enabled cameras", current: "44%", benchmark: "≥60%", gap: "watch" },
        ],
        observations: ["Analytics pilot active on cash-handling zones; sector-leading practice."],
        recommendations: ["Extend analytics from pilot to production across all critical zones."],
      },
      {
        key: "manpower", name: "Manpower, Training & Drills", score: 70, weight: 10,
        commentary: "Quarterly drills with documented after-action; supervisor accreditation strong.",
        metrics: [
          { label: "Quarterly drill participation", current: "94%", benchmark: "≥95%", gap: "watch" },
          { label: "After-action documented", current: "100%", benchmark: "100%", gap: "ok" },
          { label: "Adversarial scenario coverage", current: "3 / yr", benchmark: "≥4 / yr", gap: "watch" },
        ],
        observations: ["Drill quality is high; one additional adversarial scenario per year would close the gap."],
        recommendations: ["Add a fourth adversarial scenario covering insider-collusion in payment processing."],
      },
      {
        key: "incident", name: "Incident Response & Crisis Management", score: 68, weight: 12,
        commentary: "Playbook is exercised; cross-functional simulation with technology desk pending refresh.",
        metrics: [
          { label: "Incident playbook count", current: "16", benchmark: "≥18", gap: "watch" },
          { label: "Mean detection-to-acknowledge", current: "5.1 min", benchmark: "≤4 min", gap: "watch" },
          { label: "Joint cyber-physical exercise", current: "1 / yr", benchmark: "≥2 / yr", gap: "watch" },
        ],
        observations: ["Last joint cyber-physical exercise was 14 months ago."],
        recommendations: ["Schedule the next joint exercise within 45 days; rotate scenario lead."],
      },
      {
        key: "tech", name: "Security Technology & Integration", score: 74, weight: 10,
        commentary: "Integrated VMS-ACS; intrusion alarms tested monthly. Single pane-of-glass operational.",
        metrics: [
          { label: "VMS-ACS integration", current: "Yes", benchmark: "Yes", gap: "ok" },
          { label: "Single pane-of-glass", current: "Operational", benchmark: "Operational", gap: "ok" },
          { label: "Sensor-to-alert correlation", current: "Rule-based", benchmark: "Rule-based+ML", gap: "watch" },
          { label: "System uptime (12-mo)", current: "99.7%", benchmark: "≥99.5%", gap: "ok" },
        ],
        observations: ["Strong technology baseline; ML-correlation upgrade is the natural next step."],
        recommendations: ["Pilot ML-based correlation on cash-handling and IDF zones."],
      },
      {
        key: "compliance", name: "Compliance, Audit & Regulatory", score: 78, weight: 10,
        commentary: "Regulator-facing audits closed without material observations in the last cycle.",
        metrics: [
          { label: "RBI inspection observations (open)", current: "0 material", benchmark: "0 material", gap: "ok" },
          { label: "External audit closure rate", current: "96%", benchmark: "≥90%", gap: "ok" },
          { label: "DPDP physical-controls mapping", current: "Operationalised", benchmark: "Operationalised", gap: "ok" },
        ],
        observations: ["A clean regulator-facing posture — sector-leading."],
        recommendations: ["Maintain quarterly attestation; brief board annually."],
      },
      {
        key: "asset", name: "Asset & Information Protection", score: 72, weight: 9,
        commentary: "Clean-desk and removable-media controls are visibly enforced; print-room governance strong.",
        metrics: [
          { label: "Removable-media policy enforcement", current: "Blocked + audited", benchmark: "Blocked", gap: "ok" },
          { label: "Clean-desk audit pass rate", current: "94%", benchmark: "≥90%", gap: "ok" },
          { label: "Print-room access logging", current: "Yes", benchmark: "Yes", gap: "ok" },
        ],
        observations: ["Strong information-asset hygiene."],
        recommendations: ["Add periodic print-volume anomaly review for sensitive functions."],
      },
      {
        key: "vendor", name: "Vendor & Contractor Governance", score: 60, weight: 8,
        commentary: "Onboarding rigorous; periodic re-validation of contractor workforce inconsistent.",
        metrics: [
          { label: "Onboarding KYC", current: "100%", benchmark: "100%", gap: "ok" },
          { label: "Half-yearly re-validation", current: "Inconsistent", benchmark: "Scheduled", gap: "exposed" },
          { label: "Behavioural-flag SLA", current: "5 days", benchmark: "≤72 hrs", gap: "watch" },
        ],
        observations: ["22% of contractor workforce overdue for re-validation."],
        recommendations: ["Half-yearly contractor re-validation gate with named accountability."],
      },
      {
        key: "continuity", name: "Business Continuity & Resilience", score: 75, weight: 9,
        commentary: "Annual BCP rehearsal joint with the security function — sector-leading practice.",
        metrics: [
          { label: "Annual joint BCP exercise", current: "Yes", benchmark: "Yes", gap: "ok" },
          { label: "RTO for critical operations", current: "3.5 hrs", benchmark: "≤4 hrs", gap: "ok" },
          { label: "Site-failover rehearsal", current: "Annual", benchmark: "Annual", gap: "ok" },
        ],
        observations: ["A genuinely sector-leading BCP-security integration."],
        recommendations: ["Document and publish as a case study internally — replicate at peer sites."],
      },
      {
        key: "intelligence", name: "Threat Intelligence & Insider Risk", score: 56, weight: 9,
        commentary: "Insider-risk signals reviewed reactively; continuous behavioural baseline absent.",
        metrics: [
          { label: "Continuous insider-risk baseline", current: "Absent", benchmark: "Active", gap: "exposed" },
          { label: "Behavioural-anomaly review SLA", current: "Reactive", benchmark: "Daily", gap: "exposed" },
          { label: "OSINT in shift posture", current: "Informal", benchmark: "Daily brief", gap: "watch" },
        ],
        observations: ["The single largest posture-lift opportunity sits here."],
        recommendations: ["Stand up a continuous insider-risk dashboard with daily review for payments-handling functions."],
      },
    ],
    criticalFindings: [
      {
        id: "F-01", title: "No continuous insider-risk baseline for payment-handling workforce", severity: "Critical", domain: "Threat Intelligence",
        observation: "Insider-risk signals are reviewed only after a triggering event; no continuous baseline exists for the workforce processing high-value payments.",
        consequence: "Slow-burn insider activity (transaction staging, off-pattern access) is structurally undetectable. Materially elevated regulatory exposure under RBI fraud-management expectations.",
        recommendation: "Stand up a continuous insider-risk dashboard with daily review for payment-handling functions.",
        investmentInr: "₹10–12 lakh CapEx + ₹3 lakh / year OpEx", effort: "60-90 day"
      },
      {
        id: "F-02", title: "Contractor re-validation overdue for 22% of workforce", severity: "High", domain: "Vendor & Contractor",
        observation: "Half-yearly re-validation is not scheduled; 22% of contractor workforce is overdue.",
        consequence: "Unverified continued access to a regulated processing environment; potential audit observation on next inspection cycle.",
        recommendation: "Institute a half-yearly re-validation gate with named accountability and 90-day catch-up plan.",
        investmentInr: "₹2.5 lakh / year", effort: "30-day"
      },
      {
        id: "F-03", title: "Joint cyber-physical exercise cadence below benchmark", severity: "High", domain: "Incident Response",
        observation: "Last joint exercise was 14 months ago; benchmark is two per year.",
        consequence: "Cross-team muscle memory for hybrid incidents is decaying; containment time will rise in real events.",
        recommendation: "Schedule next joint exercise within 45 days; rotate scenario lead annually.",
        investmentInr: "₹3 lakh / year", effort: "30-day"
      },
      {
        id: "F-04", title: "Analytics-enabled camera coverage below sector median", severity: "Material", domain: "Surveillance",
        observation: "44% of cameras analytics-enabled vs. ≥60% sector benchmark.",
        consequence: "Pattern-based anomaly detection capacity is below the level needed for regulated cash-handling operations.",
        recommendation: "Move analytics from pilot to production across all critical zones.",
        investmentInr: "₹6–8 lakh CapEx", effort: "60-90 day"
      },
      {
        id: "F-05", title: "Print-volume anomaly monitoring absent for sensitive functions", severity: "Material", domain: "Asset Protection",
        observation: "Print-room access is logged but volume anomalies for sensitive functions are not reviewed.",
        consequence: "A documented insider exfiltration pattern is left uninstrumented.",
        recommendation: "Add weekly print-volume anomaly review for sensitive functions.",
        investmentInr: "₹0.6 lakh / year", effort: "Quick win"
      },
    ],
    roadmap: [
      { horizon: "0-30 days", initiative: "Schedule next joint cyber-physical exercise", owner: "CSO + CISO", outcome: "Exercise complete; after-action published.", investment: "₹3 L" },
      { horizon: "0-30 days", initiative: "Begin contractor re-validation catch-up", owner: "Vendor Mgmt", outcome: "≥40% of overdue cohort re-validated.", investment: "₹0.8 L" },
      { horizon: "0-30 days", initiative: "Add print-volume anomaly review", owner: "Information Security", outcome: "Weekly review live for sensitive functions.", investment: "₹0.6 L" },
      { horizon: "31-60 days", initiative: "Move VMS analytics from pilot to production", owner: "Security Tech", outcome: "Analytics live across all critical zones.", investment: "₹6–8 L" },
      { horizon: "31-60 days", initiative: "Add fourth adversarial drill scenario", owner: "Site Security Lead", outcome: "Insider-collusion in payments scenario rehearsed.", investment: "₹0.8 L" },
      { horizon: "61-90 days", initiative: "Stand up continuous insider-risk dashboard", owner: "CSO + CISO + HR", outcome: "Daily behavioural-baseline review live for payments workforce.", investment: "₹10–12 L" },
      { horizon: "61-90 days", initiative: "Pilot ML-based sensor correlation", owner: "Security Tech", outcome: "ML correlation live on cash-handling and IDF zones.", investment: "₹4 L" },
    ],
    investment: {
      capex: "₹20–24 lakh", opex: "₹6–8 lakh / year", payback: "9–12 months on regulatory-risk-avoided basis",
      rationale: "Investment is concentrated in continuous behavioural assurance and contractor lifecycle — the two areas where current posture trails regulator expectation. Modeled posture lift: 71 → 80–84 within 90 days."
    },
    regulatory: [
      { framework: "RBI Master Direction (Outsourcing of IT Services, 2023)", alignment: "Aligned", note: "Physical safeguards mapped; insider-risk frontier acknowledged." },
      { framework: "DPDP Act 2023 — physical safeguards", alignment: "Aligned", note: "Mapping operationalised in drills." },
      { framework: "ISO 18788:2015", alignment: "Aligned", note: "Governance and rehearsal cadence within clause-9 expectations." },
      { framework: "ISO 22301:2019", alignment: "Aligned", note: "Joint annual BCP rehearsal exemplary." },
      { framework: "Maharashtra Fire Services Act", alignment: "Aligned", note: "Annual NOC current." },
      { framework: "PSARA 2005", alignment: "Aligned", note: "Licenced contractor workforce." },
    ],
  },

  // ═══════════════════════════════════════════════════════════════════
  "gcc": {
    slug: "gcc",
    industry: "Global Capability Centre",
    archetype: "Multi-tenant Campus · mixed business lines",
    city: "Hyderabad",
    state: "Telangana",
    headcount: "4,210",
    builtUp: "5.8 lakh sq.ft. across 4 towers",
    shifts: "24×7 · 4 tenants spanning IT, finance shared-services and engineering R&D",
    criticality: "Tier-1 (mixed regulatory exposure across tenants)",
    overall: 58,
    posture: "Amber",
    peerBand: "Median for Indian multi-tenant GCC campuses: 61",
    prepared: "12 May 2026",
    validatedBy: "Security Selfie™ Specialist Review Panel",
    reportRef: "SS-DIAG-GCC-2026-0144",
    icon: <Globe2 className="h-5 w-5" />,
    exec: {
      headline:
        "A campus of considerable operational discipline at tenant level. The multi-tenant footprint introduces lateral-movement risk and command-co-ordination friction that the current architecture does not yet meaningfully constrain.",
      posture: "Amber — frontier sits at campus-wide unified command, segmentation and shared-vendor governance.",
      keyStrength: "Per-tenant operational maturity is high; perimeter and surveillance coverage is comprehensive.",
      keyExposure: "Inter-tenant lateral-movement is softer than tenant criticality warrants; campus-wide unified command has not been rehearsed.",
      boardCall: "Approve a campus-wide ₹54–62 lakh investment over two quarters covering segmentation, unified command, and shared-vendor governance. Posture lift to Teal (72–76) achievable in 6 months.",
    },
    contextualBrief:
      "This Security Intelligence Report™ is derived from the campus sponsor's self-reported Security Selfie™ responses, the SIP™ knowledge graph and structured analytical models, with explicit attention to cross-tenant interaction surfaces. Ten physical-security domains were evaluated against the Security Selfie™ framework. Benchmarks were drawn from ISO 18788:2015, ISO 22301:2019, and the SEZ Authority operating manual. Observations are classified as Reported, Inferred or Recommended. This is not an audit and does not involve interviews, walkthroughs or physical inspection.",
    domains: [
      {
        key: "perimeter", name: "Perimeter & Access Control", score: 66, weight: 12,
        commentary: "Campus perimeter is robust; inter-tower access boundaries are softer than tenant criticality warrants.",
        metrics: [
          { label: "Campus perimeter coverage", current: "100%", benchmark: "100%", gap: "ok" },
          { label: "Inter-tower segmentation", current: "Soft", benchmark: "Hard", gap: "exposed" },
          { label: "Tenant-to-tenant access governance", current: "Trust-based", benchmark: "Verified", gap: "exposed" },
        ],
        observations: ["Inter-tower transitions allow badge-based crossing without explicit tenant-side verification."],
        recommendations: ["Implement tenant-side verification on all inter-tower transitions."],
      },
      {
        key: "surveillance", name: "Surveillance & Monitoring", score: 72, weight: 11,
        commentary: "High-quality coverage; correlation across tenant zones is operationally limited.",
        metrics: [
          { label: "Coverage across common areas", current: "98%", benchmark: "≥95%", gap: "ok" },
          { label: "Cross-tenant correlation", current: "Limited", benchmark: "Active", gap: "exposed" },
          { label: "Retention period", current: "60 days", benchmark: "≥45 days", gap: "ok" },
        ],
        observations: ["Each tenant operates own VMS instance; campus-wide correlation possible only manually."],
        recommendations: ["Deploy a campus-level correlation overlay with read-only tenant feeds."],
      },
      {
        key: "manpower", name: "Manpower, Training & Drills", score: 54, weight: 10,
        commentary: "Headcount adequate; cross-tenant scenario training is rare.",
        metrics: [
          { label: "Per-tenant guard ratio", current: "1:58", benchmark: "1:60", gap: "ok" },
          { label: "Cross-tenant scenario training", current: "Annual", benchmark: "Quarterly", gap: "exposed" },
          { label: "Unified-command rehearsal", current: "Absent", benchmark: "Half-yearly", gap: "exposed" },
        ],
        observations: ["No documented unified-command rehearsal across all four tenants in past 24 months."],
        recommendations: ["Quarterly cross-tenant scenario drill; half-yearly unified-command rehearsal."],
      },
      {
        key: "incident", name: "Incident Response & Crisis Management", score: 46, weight: 12,
        commentary: "Single-tenant playbooks mature; campus-wide unified command rehearsal absent.",
        metrics: [
          { label: "Per-tenant playbook maturity", current: "High", benchmark: "High", gap: "ok" },
          { label: "Campus-wide unified command", current: "Absent", benchmark: "Active", gap: "exposed" },
          { label: "Rotating tenant lead protocol", current: "Absent", benchmark: "Defined", gap: "exposed" },
        ],
        observations: ["Each tenant runs own command; campus-wide events have no defined unified command."],
        recommendations: ["Establish campus-wide unified command protocol with rotating tenant lead."],
      },
      {
        key: "tech", name: "Security Technology & Integration", score: 62, weight: 10,
        commentary: "Disparate platforms across tenants; converged operations console not yet realised.",
        metrics: [
          { label: "Per-tenant VMS-ACS integration", current: "100%", benchmark: "100%", gap: "ok" },
          { label: "Campus-level converged console", current: "Absent", benchmark: "Active", gap: "exposed" },
          { label: "System uptime (12-mo)", current: "99.2%", benchmark: "≥99.5%", gap: "watch" },
        ],
        observations: ["Tenant systems are well-integrated; campus-level layer absent."],
        recommendations: ["Deploy a campus-level converged operations console with read-only tenant feeds (₹18 L)."],
      },
      {
        key: "compliance", name: "Compliance, Audit & Regulatory", score: 60, weight: 10,
        commentary: "Tenant compliance varies; campus-level minima not formally codified.",
        metrics: [
          { label: "Tenant compliance variance", current: "High", benchmark: "Low", gap: "exposed" },
          { label: "Campus-level minima codified", current: "No", benchmark: "Yes", gap: "exposed" },
          { label: "PSARA compliance", current: "100%", benchmark: "100%", gap: "ok" },
        ],
        observations: ["No campus-level security minima signed by all tenants."],
        recommendations: ["Codify campus-level security minima baseline; tenant attestation annually."],
      },
      {
        key: "asset", name: "Asset & Information Protection", score: 58, weight: 9,
        commentary: "Sensitive-asset handling is tenant-defined; campus-level standard absent.",
        metrics: [
          { label: "Per-tenant asset controls", current: "Variable", benchmark: "Codified", gap: "exposed" },
          { label: "Common-area asset governance", current: "Informal", benchmark: "Formal", gap: "exposed" },
        ],
        observations: ["Common areas (cafeteria, transport bay) operate under informal protocols."],
        recommendations: ["Publish a campus-level asset-handling minima for common areas."],
      },
      {
        key: "vendor", name: "Vendor & Contractor Governance", score: 50, weight: 8,
        commentary: "Shared services use overlapping vendors; cross-tenant vendor governance is fragmented.",
        metrics: [
          { label: "Shared-vendor visibility", current: "Fragmented", benchmark: "Unified", gap: "exposed" },
          { label: "Cross-tenant vendor audit", current: "Absent", benchmark: "Half-yearly", gap: "exposed" },
        ],
        observations: ["Three vendors serve all four tenants without unified governance."],
        recommendations: ["Establish a single vendor-of-record review cadence for shared services."],
      },
      {
        key: "continuity", name: "Business Continuity & Resilience", score: 55, weight: 9,
        commentary: "Tenant-level BCP exists; campus-level continuity scenario untested.",
        metrics: [
          { label: "Per-tenant BCP", current: "Present", benchmark: "Present", gap: "ok" },
          { label: "Campus-level BCP rehearsal", current: "Absent", benchmark: "Annual", gap: "exposed" },
        ],
        observations: ["A campus-wide power-failure or evacuation has not been rehearsed jointly."],
        recommendations: ["Run an annual campus-level BCP rehearsal with all four tenants."],
      },
      {
        key: "intelligence", name: "Threat Intelligence & Insider Risk", score: 52, weight: 9,
        commentary: "Tenant-specific threat awareness; no campus-level fused intelligence picture.",
        metrics: [
          { label: "Per-tenant intelligence", current: "Active", benchmark: "Active", gap: "ok" },
          { label: "Campus-level fused picture", current: "Absent", benchmark: "Active", gap: "exposed" },
        ],
        observations: ["Insights from one tenant do not surface to others — opportunity cost is significant."],
        recommendations: ["Stand up a campus-level fused intelligence brief, weekly."],
      },
    ],
    criticalFindings: [
      {
        id: "F-01", title: "Campus-wide unified command has never been rehearsed", severity: "Critical", domain: "Incident Response",
        observation: "Each tenant runs its own command; no protocol exists for campus-wide events.",
        consequence: "A campus-affecting incident will be managed by uncoordinated tenant commands; response time will fragment across decision boundaries.",
        recommendation: "Establish unified command protocol with rotating tenant lead; first rehearsal within 60 days.",
        investmentInr: "₹4–5 lakh (facilitation + tooling)", effort: "30-day"
      },
      {
        id: "F-02", title: "Inter-tower segmentation is softer than tenant criticality warrants", severity: "Critical", domain: "Perimeter & Access",
        observation: "Inter-tower transitions allow badge-based crossing without tenant-side verification.",
        consequence: "Lateral movement across tenant boundaries is structurally feasible — a meaningful insider-risk surface.",
        recommendation: "Implement tenant-side verification on all inter-tower transitions.",
        investmentInr: "₹14–18 lakh CapEx", effort: "60-90 day"
      },
      {
        id: "F-03", title: "Shared-vendor governance is fragmented", severity: "High", domain: "Vendor & Contractor",
        observation: "Three vendors serve all four tenants without unified governance or audit.",
        consequence: "A vendor compromise affects all four tenants but no tenant has full visibility.",
        recommendation: "Single vendor-of-record review cadence for shared services; half-yearly joint audit.",
        investmentInr: "₹3 lakh / year", effort: "30-day"
      },
      {
        id: "F-04", title: "No campus-level converged operations console", severity: "High", domain: "Security Technology",
        observation: "Tenant systems are well-integrated internally; no campus-level layer exists.",
        consequence: "Cross-tenant correlation is manual; campus-affecting events lack a single situational picture.",
        recommendation: "Deploy a campus-level converged console with read-only tenant feeds.",
        investmentInr: "₹18 lakh CapEx + ₹3 lakh / year OpEx", effort: "60-90 day"
      },
      {
        id: "F-05", title: "Campus-level security minima not codified", severity: "Material", domain: "Compliance",
        observation: "No campus-level security minima signed by all tenants; compliance variance is high.",
        consequence: "The weakest tenant defines campus-level posture in practice.",
        recommendation: "Codify campus-level security minima baseline; tenant attestation annually.",
        investmentInr: "₹1.5 lakh (one-time)", effort: "Quick win"
      },
      {
        id: "F-06", title: "No campus-level fused intelligence picture", severity: "Material", domain: "Threat Intelligence",
        observation: "Insights from one tenant do not surface to others.",
        consequence: "Opportunity cost of intelligence already paid for; cross-tenant patterns missed.",
        recommendation: "Weekly campus-level fused intelligence brief.",
        investmentInr: "₹2 lakh / year", effort: "Quick win"
      },
    ],
    roadmap: [
      { horizon: "0-30 days", initiative: "Codify campus-level security minima", owner: "Campus CSO + Tenant Heads", outcome: "Baseline signed by all four tenants.", investment: "₹1.5 L" },
      { horizon: "0-30 days", initiative: "Establish unified command protocol", owner: "Campus CSO", outcome: "Protocol documented; rotating lead schedule published.", investment: "₹0.8 L" },
      { horizon: "0-30 days", initiative: "Launch weekly fused intelligence brief", owner: "Campus Intelligence Lead", outcome: "First four briefs published.", investment: "₹0.5 L" },
      { horizon: "0-30 days", initiative: "Stand up shared-vendor governance forum", owner: "Vendor Mgmt + Tenant Reps", outcome: "Joint governance forum live with monthly cadence.", investment: "₹0.4 L" },
      { horizon: "31-60 days", initiative: "First campus-wide unified command rehearsal", owner: "Campus CSO + Tenant Heads", outcome: "Rehearsal complete; after-action published.", investment: "₹3.5 L" },
      { horizon: "31-60 days", initiative: "Half-yearly joint vendor audit", owner: "Vendor Mgmt", outcome: "All three shared vendors audited.", investment: "₹2 L" },
      { horizon: "61-90 days", initiative: "Implement tenant-side verification on transitions", owner: "Facilities + Security Tech", outcome: "Hard segmentation live across all four towers.", investment: "₹14–18 L" },
      { horizon: "61-90 days", initiative: "Deploy campus-level converged console", owner: "Security Tech", outcome: "Single situational picture live across campus.", investment: "₹18 L" },
      { horizon: "61-90 days", initiative: "Run first campus-level BCP rehearsal", owner: "Campus CSO + Continuity", outcome: "Campus-wide rehearsal complete.", investment: "₹4 L" },
    ],
    investment: {
      capex: "₹38–44 lakh", opex: "₹10–14 lakh / year", payback: "12–16 months on aggregate-tenant-risk basis",
      rationale: "Investment is concentrated in three campus-level layers absent today: unified command, hard segmentation and converged operations. Modeled posture lift: 58 → 72–76 within 6 months."
    },
    regulatory: [
      { framework: "PSARA 2005", alignment: "Aligned", note: "All tenants licenced; campus-level supervisor accreditation current." },
      { framework: "DPDP Act 2023", alignment: "Partial", note: "Tenant-level mapping complete; campus-level common-area mapping pending." },
      { framework: "ISO 18788:2015", alignment: "Partial", note: "Per-tenant maturity high; campus-level governance gap." },
      { framework: "ISO 22301:2019", alignment: "Partial", note: "Tenant BCPs present; campus-level rehearsal absent." },
      { framework: "Telangana Fire Services Act", alignment: "Aligned", note: "Annual campus NOC current." },
      { framework: "SEZ operating manual", alignment: "Aligned", note: "Campus-level reporting current." },
    ],
  },
};

// ────────────────────────────────────────────────────────────────────────
const POSTURE_CLASS: Record<string, string> = {
  Red: "bg-destructive/15 text-destructive border-destructive/30",
  Amber: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Teal: "bg-teal-500/15 text-teal-700 border-teal-500/30",
  Green: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

const SEVERITY_CLASS: Record<string, string> = {
  Critical: "bg-destructive/15 text-destructive border-destructive/30",
  High: "bg-orange-500/15 text-orange-700 border-orange-500/30",
  Material: "bg-amber-500/15 text-amber-700 border-amber-500/30",
};

const GAP_DOT: Record<string, string> = {
  ok: "bg-emerald-500",
  watch: "bg-amber-500",
  exposed: "bg-destructive",
};

const scoreColor = (s: number) =>
  s >= 86 ? "hsl(160 70% 38%)" : s >= 71 ? "hsl(174 75% 38%)" : s >= 41 ? "hsl(35 90% 55%)" : "hsl(var(--destructive))";

// ────────────────────────────────────────────────────────────────────────
const SampleReport = () => {
  const { slug } = useParams();
  const navigate = useNavigate();
  // Slug aliases so legacy/new card slugs both resolve to a rich sample profile.
  const SLUG_ALIASES: Record<string, string> = {
    manufacturing: "it-ites",
    "corporate-hq": "bfsi",
  };
  const resolvedSlug = slug ? (SAMPLES[slug] ? slug : SLUG_ALIASES[slug]) : undefined;
  const sample = useMemo(
    () => (resolvedSlug ? SAMPLES[resolvedSlug] : undefined),
    [resolvedSlug],
  );

  if (!sample) return <Navigate to="/sample" replace />;

  const handleDownload = () => window.print();

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title={`Sample Report — ${sample.industry} · Security Selfie`}
        description={`Board-grade sample diagnostic for a ${sample.industry} ${sample.archetype.toLowerCase()}: posture score, domain breakdown, critical findings and 30/60/90-day roadmap.`}
        path={`/sample/${slug}`}
      />
      {/* Diagonal brand watermark — always visible on sample reports, denser in print */}
      <ReportWatermark
        primary="Security Intelligence Platform™"
        secondary="Sample Intelligence Report"
        tertiary="For Demonstration Purposes Only"
        alwaysVisible
      />

      {/* Watermark band */}
      <div className="print:hidden border-b border-amber-500/30 bg-amber-50/60 dark:bg-amber-950/20 sticky top-0 z-30 backdrop-blur">
        <div className="container mx-auto px-6 py-2 flex items-center justify-between text-xs">
          <span className="inline-flex items-center gap-2 text-amber-700 dark:text-amber-300 font-medium">
            <ShieldCheck className="h-3.5 w-3.5" />
            Illustrative sample · synthetic data · representative of an actual Intelligence Diagnostic
          </span>
          <Button size="sm" onClick={() => navigate("/auth?next=/dashboard")} className="hidden sm:inline-flex h-7 text-xs">
            Run mine now <ArrowRight className="ml-1.5 h-3 w-3" />
          </Button>
        </div>
      </div>

      <main className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-10 max-w-5xl xl:max-w-6xl 2xl:max-w-[1280px] print:max-w-full relative z-10">
        {/* Toolbar */}
        <div className="print:hidden flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5 md:mb-6">
          <Button variant="ghost" size="sm" onClick={() => navigate("/sample")} className="self-start">
            <ArrowLeft className="mr-2 h-4 w-4" /> All samples
          </Button>
          {/* <div className="flex flex-wrap gap-2">
            <Button variant="outline" size="sm" onClick={handleDownload} className="min-h-[40px] flex-1 sm:flex-none">
              <Printer className="mr-2 h-4 w-4" /> Print
            </Button>
            <OneClickDownload onDownload={handleDownload} label="Download PDF" size="sm" className="flex-1 sm:flex-none" />
          </div> */}
        </div>
        <div className="print:hidden mb-6 md:mb-8">
          <ConfidentialityNote variant="report" />
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* COVER PAGE */}
        <Card className="border-primary/20 bg-gradient-to-br from-card via-card to-primary/5 mb-8 overflow-hidden">
          <CardContent className="p-8 md:p-12">
            <div className="flex items-center justify-between mb-8">
              <div className="flex items-center gap-2">
                <div className="h-9 w-9 rounded-lg bg-gradient-to-br from-primary to-secondary flex items-center justify-center">
                  <ShieldCheck className="h-5 w-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-heading font-bold text-base leading-tight">Security Selfie™</p>
                  <p className="text-[10px] uppercase tracking-[0.18em] text-muted-foreground">Security Intelligence Platform</p>
                </div>
              </div>
              <Badge variant="outline" className="text-[10px]">Ref · {sample.reportRef}</Badge>
            </div>

            <Badge variant="secondary" className="mb-3">
              <Sparkles className="mr-1 h-3 w-3" /> Illustrative Intelligence Diagnostic
            </Badge>
            <h1 className="font-heading font-bold text-4xl md:text-5xl tracking-tight leading-tight mb-3">
              {sample.industry}
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              {sample.archetype} · {sample.city}, {sample.state}
            </p>

            <div className="grid md:grid-cols-[auto_1fr] gap-10 items-center">
              <div className="flex flex-col items-center">
                <ScoreGauge score={sample.overall} size="lg" />
                <span className={`mt-3 inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${POSTURE_CLASS[sample.posture]}`}>
                  Posture · {sample.posture}
                </span>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                <Stat icon={<Users className="h-4 w-4" />} label="Headcount" value={sample.headcount} />
                <Stat icon={<MapPin className="h-4 w-4" />} label="Built-up area" value={sample.builtUp} />
                <Stat icon={<Activity className="h-4 w-4" />} label="Operating profile" value={sample.shifts} />
                <Stat icon={<Target className="h-4 w-4" />} label="Criticality" value={sample.criticality} />
                <Stat icon={<TrendingUp className="h-4 w-4" />} label="Peer benchmark" value={sample.peerBand} />
                <Stat icon={<FileCheck2 className="h-4 w-4" />} label="Validated by" value={sample.validatedBy} />
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-border/50 flex items-center justify-between text-xs text-muted-foreground">
              <span>Prepared · {sample.prepared}</span>
              <span>© Security Selfie™ · Watermarked exemplar — synthetic data</span>
            </div>
          </CardContent>
        </Card>

        {/* In-line CTA after cover */}
        <div className="print:hidden mb-10">
          <InlineCta
            variant="compact"
            eyebrow="This is a watermarked sample"
            title="Run your own diagnostic and receive a report like this — for your site."
          />
        </div>

        {/* ════════════════════════════════════════════════════════════ */}
        {/* EXECUTIVE SUMMARY */}
        <Section icon={<Target className="h-5 w-5" />} title="Executive summary" subtitle="What the board should hear in 90 seconds">
          <Card className="border-primary/20">
            <CardContent className="p-7 space-y-5">
              <div>
                <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Headline</p>
                <p className="text-base leading-relaxed">{sample.exec.headline}</p>
              </div>
              <div className="grid md:grid-cols-2 gap-5">
                <ExecBlock label="Posture" body={sample.exec.posture} tone="primary" />
                <ExecBlock label="Key strength" body={sample.exec.keyStrength} tone="emerald" />
              </div>
              <ExecBlock label="Key exposure" body={sample.exec.keyExposure} tone="destructive" />
              <div className="rounded-xl bg-gradient-to-br from-primary/10 to-secondary/10 border border-primary/20 p-5">
                <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-1.5">Board call</p>
                <p className="text-sm leading-relaxed font-medium">{sample.exec.boardCall}</p>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* CONTEXTUAL BRIEF */}
        <Section icon={<BookOpen className="h-5 w-5" />} title="Scope, methodology and benchmarks">
          <Card>
            <CardContent className="p-6">
              <p className="text-sm leading-relaxed text-muted-foreground">{sample.contextualBrief}</p>
              <div className="grid sm:grid-cols-3 gap-3 mt-5">
                <Mini label="Domains evaluated" value="10" />
                <Mini label="Framework" value="Security Selfie™ 10×100" />
                <Mini label="Basis" value="Self-reported responses" />
              </div>
              <p className="mt-4 text-[11px] uppercase tracking-[0.16em] text-muted-foreground/70">
                Observations are classified as <span className="font-semibold text-foreground/80">Reported · Inferred · Recommended</span>. This report is not an audit.
              </p>
            </CardContent>
          </Card>
        </Section>

        {/* DOMAIN POSTURE — overview grid */}
        <Section icon={<Activity className="h-5 w-5" />} title="Domain posture at a glance" subtitle="Ten domains · weighted to the Security Selfie™ framework">
          <div className="grid sm:grid-cols-2 gap-3">
            {sample.domains.map((d) => (
              <Card key={d.key} className="border-l-4 hover:shadow-md transition-shadow"
                style={{ borderLeftColor: scoreColor(d.score) }}>
                <CardContent className="p-4">
                  <div className="flex items-baseline justify-between mb-1">
                    <h3 className="font-semibold text-sm">{d.name}</h3>
                    <div className="flex items-baseline gap-1.5">
                      <span className="font-mono font-bold text-xl">{d.score}</span>
                      <span className="text-[10px] text-muted-foreground">w. {d.weight}%</span>
                    </div>
                  </div>
                  <div className="h-1.5 rounded-full bg-muted overflow-hidden mb-2">
                    <div className="h-full rounded-full transition-all" style={{ width: `${d.score}%`, background: scoreColor(d.score) }} />
                  </div>
                  <p className="text-xs text-muted-foreground leading-relaxed">{d.commentary}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* DETAILED DOMAIN BREAKDOWN */}
        <Section icon={<Eye className="h-5 w-5" />} title="Domain deep-dives" subtitle="Metrics · observations · recommendations">
          <div className="space-y-5">
            {sample.domains.map((d, i) => (
              <Card key={d.key} className="overflow-hidden">
                <div className="px-6 py-4 border-b bg-muted/30 flex items-baseline justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Domain {i + 1} of 10 · weight {d.weight}%</p>
                    <h3 className="font-heading font-bold text-lg">{d.name}</h3>
                  </div>
                  <div className="text-right">
                    <div className="font-mono font-bold text-3xl" style={{ color: scoreColor(d.score) }}>{d.score}</div>
                    <p className="text-[10px] text-muted-foreground">/ 100</p>
                  </div>
                </div>
                <CardContent className="p-6 space-y-5">
                  <p className="text-sm leading-relaxed">{d.commentary}</p>

                  <div>
                    <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Key metrics</p>
                    <div className="overflow-x-auto rounded-lg border border-border/60">
                      <table className="w-full text-xs">
                        <thead className="bg-muted/40 text-muted-foreground">
                          <tr>
                            <th className="text-left font-medium px-3 py-2">Metric</th>
                            <th className="text-left font-medium px-3 py-2">Current</th>
                            <th className="text-left font-medium px-3 py-2">Benchmark</th>
                            <th className="text-left font-medium px-3 py-2 w-24">Status</th>
                          </tr>
                        </thead>
                        <tbody>
                          {d.metrics.map((m, mi) => (
                            <tr key={mi} className="border-t border-border/60">
                              <td className="px-3 py-2 font-medium">{m.label}</td>
                              <td className="px-3 py-2 font-mono">{m.current}</td>
                              <td className="px-3 py-2 font-mono text-muted-foreground">{m.benchmark}</td>
                              <td className="px-3 py-2">
                                <span className="inline-flex items-center gap-1.5 capitalize">
                                  <span className={`h-2 w-2 rounded-full ${GAP_DOT[m.gap]}`} />
                                  {m.gap === "ok" ? "On benchmark" : m.gap === "watch" ? "Watch" : "Exposed"}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  <div className="grid md:grid-cols-2 gap-5">
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-muted-foreground font-semibold mb-2">Field observations</p>
                      <ul className="space-y-1.5">
                        {d.observations.map((o, oi) => (
                          <li key={oi} className="text-sm flex gap-2">
                            <AlertTriangle className="h-3.5 w-3.5 text-amber-600 mt-0.5 shrink-0" />
                            <span>{o}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div>
                      <p className="text-[11px] uppercase tracking-wider text-primary font-semibold mb-2">Recommendations</p>
                      <ul className="space-y-1.5">
                        {d.recommendations.map((r, ri) => (
                          <li key={ri} className="text-sm flex gap-2">
                            <CheckCircle2 className="h-3.5 w-3.5 text-primary mt-0.5 shrink-0" />
                            <span>{r}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* Mid-document CTA */}
        <div className="print:hidden my-10">
          <InlineCta
            eyebrow="Halfway through this sample?"
            title="Your report will reveal your actual posture — not an exemplar."
            body="Run your own Intelligence Diagnostic in under thirty minutes. The report you'll receive carries the same depth, validated by our specialist review panel before release."
          />
        </div>

        {/* CRITICAL FINDINGS */}
        <Section icon={<AlertTriangle className="h-5 w-5" />} title="Critical findings" subtitle="Where exposure is most material — with consequence and remediation">
          <div className="space-y-4">
            {sample.criticalFindings.map((f) => (
              <Card key={f.id} className="border-l-4" style={{ borderLeftColor: f.severity === "Critical" ? "hsl(var(--destructive))" : f.severity === "High" ? "hsl(25 90% 55%)" : "hsl(35 90% 55%)" }}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <div>
                      <div className="flex items-center gap-2 mb-1.5">
                        <span className="font-mono text-[10px] font-bold text-muted-foreground bg-muted px-2 py-0.5 rounded">{f.id}</span>
                        <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${SEVERITY_CLASS[f.severity]}`}>
                          {f.severity}
                        </span>
                        <span className="text-[10px] text-muted-foreground">· {f.domain}</span>
                      </div>
                      <h4 className="font-heading font-bold text-base leading-tight">{f.title}</h4>
                    </div>
                    <Badge variant="outline" className="text-[10px] shrink-0">{f.effort}</Badge>
                  </div>

                  <div className="grid md:grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Observation</p>
                      <p className="leading-relaxed">{f.observation}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Consequence</p>
                      <p className="leading-relaxed text-muted-foreground">{f.consequence}</p>
                    </div>
                    <div>
                      <p className="text-[10px] uppercase tracking-wider text-primary font-semibold mb-1">Recommendation</p>
                      <p className="leading-relaxed">{f.recommendation}</p>
                      <p className="mt-2 text-[11px] inline-flex items-center gap-1 font-mono text-foreground bg-primary/5 border border-primary/20 px-2 py-1 rounded">
                        <IndianRupee className="h-3 w-3" /> {f.investmentInr}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </Section>

        {/* 30-60-90 ROADMAP */}
        <Section icon={<Calendar className="h-5 w-5" />} title="30 · 60 · 90-day remediation roadmap" subtitle="Sequenced for maximum posture lift per rupee">
          {(["0-30 days", "31-60 days", "61-90 days"] as const).map((horizon) => {
            const items = sample.roadmap.filter((r) => r.horizon === horizon);
            const accent = horizon === "0-30 days" ? "from-emerald-500/10" : horizon === "31-60 days" ? "from-primary/10" : "from-secondary/10";
            return (
              <Card key={horizon} className={`mb-4 bg-gradient-to-r ${accent} to-background border-l-4 border-l-primary`}>
                <CardContent className="p-5">
                  <h4 className="font-heading font-bold text-base mb-3 flex items-center gap-2">
                    <span className="font-mono text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded">{horizon}</span>
                    <span>{items.length} initiative{items.length === 1 ? "" : "s"}</span>
                  </h4>
                  <div className="overflow-x-auto rounded-lg border border-border/60 bg-background">
                    <table className="w-full text-xs">
                      <thead className="bg-muted/40 text-muted-foreground">
                        <tr>
                          <th className="text-left font-medium px-3 py-2">Initiative</th>
                          <th className="text-left font-medium px-3 py-2">Owner</th>
                          <th className="text-left font-medium px-3 py-2">Outcome</th>
                          <th className="text-left font-medium px-3 py-2 w-24">Investment</th>
                        </tr>
                      </thead>
                      <tbody>
                        {items.map((r, i) => (
                          <tr key={i} className="border-t border-border/60">
                            <td className="px-3 py-2 font-medium">{r.initiative}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.owner}</td>
                            <td className="px-3 py-2 text-muted-foreground">{r.outcome}</td>
                            <td className="px-3 py-2 font-mono">{r.investment}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </Section>

        {/* INVESTMENT SUMMARY */}
        <Section icon={<IndianRupee className="h-5 w-5" />} title="Indicative investment & expected lift">
          <Card className="bg-gradient-to-br from-primary/5 to-secondary/5 border-primary/20">
            <CardContent className="p-6">
              <div className="grid sm:grid-cols-3 gap-5 mb-4">
                <FinancialStat label="One-time CapEx" value={sample.investment.capex} />
                <FinancialStat label="Recurring OpEx" value={sample.investment.opex} />
                <FinancialStat label="Modelled payback" value={sample.investment.payback} />
              </div>
              <p className="text-sm leading-relaxed text-muted-foreground border-t border-border/60 pt-4">
                {sample.investment.rationale}
              </p>
            </CardContent>
          </Card>
        </Section>

        {/* REGULATORY ALIGNMENT */}
        <Section icon={<FileCheck2 className="h-5 w-5" />} title="Regulatory & framework alignment">
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/40 text-xs text-muted-foreground">
                    <tr>
                      <th className="text-left font-semibold px-4 py-3">Framework</th>
                      <th className="text-left font-semibold px-4 py-3 w-32">Alignment</th>
                      <th className="text-left font-semibold px-4 py-3">Note</th>
                    </tr>
                  </thead>
                  <tbody>
                    {sample.regulatory.map((r, i) => (
                      <tr key={i} className="border-t border-border/60">
                        <td className="px-4 py-3 font-medium">{r.framework}</td>
                        <td className="px-4 py-3">
                          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded border ${r.alignment === "Aligned" ? "bg-emerald-500/15 text-emerald-700 border-emerald-500/30" :
                              r.alignment === "Partial" ? "bg-amber-500/15 text-amber-700 border-amber-500/30" :
                                "bg-destructive/15 text-destructive border-destructive/30"
                            }`}>
                            {r.alignment}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">{r.note}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </Section>

        {/* CLOSING CTA */}
        <div className="print:hidden mt-12">
          <InlineCta
            variant="premium"
            eyebrow="Ready for your own report?"
            title="Receive a board-ready diagnostic of this depth — for your site."
            body="Thirty minutes of input from your team yields a validated, watermarked report ready for your next board pack. Specialist review panel signs off before release. Free during the beta preview."
          />
        </div>

        {/* STUDIO ESCALATION */}
        <div className="print:hidden mt-8">
          <div className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-card via-card to-secondary/[0.04] p-8 md:p-10">
            <p className="text-[11px] uppercase tracking-[0.25em] text-secondary font-semibold mb-3">Ready to go deeper?</p>
            <h3 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight mb-3">
              Beyond the snapshot — Security Studio™
            </h3>
            <p className="text-muted-foreground max-w-2xl leading-relaxed mb-2">
              Your Security Selfie™ provides a structured snapshot. For environments requiring deeper validation, refinement, and operational precision:
            </p>
            <p className="text-foreground/90 max-w-2xl leading-relaxed mb-6">
              <strong>Security Studio™</strong> — a focused, expert-led engagement designed to elevate and strategically refine your security environment.
            </p>
            <div className="flex flex-wrap gap-3">
              <StudioInquiryDialog
                trigger={
                  <Button size="lg" className="border-secondary/40">
                    Request Security Studio™
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                }
                defaultRequirement={`Reviewed sample report: ${sample.industry}. Interested in a Security Studio™ engagement to validate and refine our environment.`}
              />
              <Button onClick={() => navigate("/studio")} size="lg" variant="outline" className="border-secondary/40">
                About Security Studio™
              </Button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-muted-foreground border-t pt-6 mt-10 print:mt-6">
          <p className="font-semibold">Security Selfie™ · Illustrative Intelligence Diagnostic · {sample.reportRef}</p>
          <p>This document is a synthetic exemplar. No actual customer data is depicted. © {new Date().getFullYear()}</p>
          <p className="mt-2 italic">Watermarked exemplar — not for reuse, redistribution or representation.</p>
        </div>
      </main>

      <style>{`
        @media print {
          @page { size: A4; margin: 12mm; }
          body { background: white !important; }
          .print\\:hidden { display: none !important; }
          .print\\:block { display: block !important; }
        }
      `}</style>
    </div>
  );
};

// ────────────────────────────────────────────────────────────────────────
// Sub-components
// ────────────────────────────────────────────────────────────────────────
const Section = ({ icon, title, subtitle, children }: { icon: React.ReactNode; title: string; subtitle?: string; children: React.ReactNode }) => (
  <section className="mb-10">
    <div className="flex items-end justify-between mb-4">
      <div>
        <h2 className="font-heading font-bold text-2xl tracking-tight flex items-center gap-2">
          <span className="text-primary">{icon}</span>
          {title}
        </h2>
        {subtitle && <p className="text-sm text-muted-foreground mt-0.5">{subtitle}</p>}
      </div>
    </div>
    {children}
  </section>
);

const Stat = ({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold flex items-center gap-1.5 mb-0.5">
      <span className="text-primary">{icon}</span>{label}
    </p>
    <p className="text-sm font-medium leading-snug">{value}</p>
  </div>
);

const Mini = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-border/60 bg-muted/20 px-4 py-3">
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">{label}</p>
    <p className="font-mono font-bold text-xl mt-0.5">{value}</p>
  </div>
);

const ExecBlock = ({ label, body, tone }: { label: string; body: string; tone: "primary" | "emerald" | "destructive" }) => {
  const cls = tone === "primary" ? "border-primary/30 bg-primary/5"
    : tone === "emerald" ? "border-emerald-500/30 bg-emerald-500/5"
      : "border-destructive/30 bg-destructive/5";
  const lblCls = tone === "primary" ? "text-primary" : tone === "emerald" ? "text-emerald-700" : "text-destructive";
  return (
    <div className={`rounded-xl border p-4 ${cls}`}>
      <p className={`text-[10px] uppercase tracking-wider font-semibold mb-1 ${lblCls}`}>{label}</p>
      <p className="text-sm leading-relaxed">{body}</p>
    </div>
  );
};

const FinancialStat = ({ label, value }: { label: string; value: string }) => (
  <div>
    <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">{label}</p>
    <p className="font-heading font-bold text-2xl">{value}</p>
  </div>
);

export default SampleReport;
