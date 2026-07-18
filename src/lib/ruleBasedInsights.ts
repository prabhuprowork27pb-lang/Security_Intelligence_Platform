// ─────────────────────────────────────────────────────────────────────────
// SIP™ — Rule-Based Report Content Generator
//
// PURPOSE
// Generates Signature Finding, Patterns Detected, Executive Summary, and
// Weak/Strong Domain Analysis from domain scores alone — with ZERO AI
// dependency. This guarantees every report is complete, instantly, with
// no token cost and no risk of partial/blank sections.
//
// OUTPUT CONTRACT
// Produces the exact same JSON shape that generate-insights' AI call
// produces, so AssessmentResults.tsx, PdfReport.tsx, and PrintPreview.tsx
// require ZERO changes. This is a drop-in replacement for the AI path.
//
// NOTE
// A byte-identical copy of this logic is inlined inside
// supabase/functions/calculate-scores/index.ts (edge functions cannot
// import from src/). If you change templates or thresholds here, mirror
// the change there.
// ─────────────────────────────────────────────────────────────────────────

export interface DomainScoreInput {
  domain_key: string;
  domain_name: string;
  score_0_100: number;
  maturity_1_5: number;
}

export interface SiteContext {
  site_name?: string;
  site_type?: string;
  city?: string;
  overall_score_0_100: number;
  overall_maturity_1_5: number;
  risk_posture: string;
}

export interface DomainFinding {
  domain: string;
  score: number;
  findings: string[];
}

export interface RuleBasedInsights {
  signature_finding: string;
  executive_summary: string;
  weak_domains: DomainFinding[];
  strong_domains: DomainFinding[];
  detected_patterns: string[];
  remediation_30: string[];
  remediation_60: string[];
  remediation_90: string[];
  generation_method: 'rule_based';
}

const BANDS = [
  { id: 'vulnerable', label: 'Ad Hoc', min: 0, max: 40 },
  { id: 'emerging', label: 'Developing', min: 41, max: 70 },
  { id: 'effective', label: 'Managed', min: 71, max: 85 },
  { id: 'proactive', label: 'Resilient', min: 86, max: 100 },
] as const;

function bandFor(score: number) {
  return BANDS.find(b => score >= b.min && score <= b.max) ?? BANDS[0];
}

const MANAGED_THRESHOLD = 71;

interface DomainTemplate {
  current: (band: string, score: number) => string;
  consequence: (band: string) => string;
  action: (band: string) => string;
  strength: (band: string, score: number) => string;
  nextLevel: (band: string) => string;
}

const DOMAIN_TEMPLATES: Record<string, DomainTemplate> = {
  SITE_CONTEXT: {
    current: (band, score) =>
      `Site Profile & Risk Context is rated ${band} at ${Math.round(score)}/100, indicating the site's baseline risk factors — location, footfall, asset criticality, and threat exposure — are ${band === 'Ad Hoc' ? 'not formally documented or understood' : 'only partially mapped'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? 'Without a documented risk context, every other security decision on site is made without a clear reference point, increasing the likelihood of mismatched or generic controls.'
        : 'Gaps in risk context mapping mean some site-specific threats may not be receiving proportionate attention.',
    action: (band) =>
      band === 'Ad Hoc'
        ? 'The site leadership should commission a formal site risk assessment within 30 days, documenting asset criticality, footfall patterns, and known local threat factors, with a named owner and a completion date.'
        : 'Refresh the existing site risk assessment to close identified gaps and assign a named owner for annual review.',
    strength: (band, score) =>
      `Site Profile & Risk Context is rated ${band} at ${Math.round(score)}/100, reflecting a clear, current understanding of the site's risk landscape that is informing security decisions.`,
    nextLevel: () =>
      'To progress further, formalise a recurring (at least annual) review cycle for the risk context document, with explicit sign-off from site leadership.',
  },
  GOVERNANCE: {
    current: (band, score) =>
      `Governance, Policy & Security Organisation is rated ${band} at ${Math.round(score)}/100, indicating ${band === 'Ad Hoc' ? 'an absence of formal security policy, ownership, or escalation structure' : 'policy and ownership structures exist but are not consistently embedded across the organisation'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? 'Without documented policy and clear ownership, security decisions are made ad hoc, response to incidents is inconsistent, and there is no clear accountability if something goes wrong.'
        : 'Inconsistent governance application creates uncertainty about who is accountable for specific security outcomes, slowing response and decision-making.',
    action: (band) =>
      band === 'Ad Hoc'
        ? 'Appoint a named security owner with documented authority, and draft (or formalise) a baseline security policy within 30 days, even if initially brief.'
        : 'Formalise the existing governance structure into a written policy with clear escalation paths, and communicate it to all relevant staff.',
    strength: (band, score) =>
      `Governance, Policy & Security Organisation is rated ${band} at ${Math.round(score)}/100, reflecting clear ownership, documented policy, and a functioning escalation structure.`,
    nextLevel: () =>
      'Strengthen this further by introducing a recurring governance review (quarterly or biannual) and documenting decision rights for security exceptions.',
  },
  PERIMETER: {
    current: (band, score) =>
      `Perimeter, Access Control & Physical Infrastructure is rated ${band} at ${Math.round(score)}/100, indicating ${band === 'Ad Hoc' ? 'significant gaps in physical boundary security and access control discipline' : 'physical controls exist but enforcement or coverage is inconsistent'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? 'Weak perimeter and access controls are typically the most direct path for unauthorised entry, and are disproportionately responsible for the most serious physical security incidents.'
        : 'Inconsistent access control increases the risk of unauthorised entry going undetected, particularly during shift changes or off-hours.',
    action: (band) =>
      band === 'Ad Hoc'
        ? 'Conduct a physical perimeter walkthrough within 30 days to identify and prioritise the most exploitable gaps, starting with unmonitored or unsecured entry points.'
        : 'Audit current access control enforcement against documented procedure, and close the highest-risk inconsistencies first.',
    strength: (band, score) =>
      `Perimeter, Access Control & Physical Infrastructure is rated ${band} at ${Math.round(score)}/100, reflecting well-controlled physical boundaries and consistent access enforcement.`,
    nextLevel: () =>
      'Consider layered verification (e.g., combining badge access with visual or biometric checks) at the highest-criticality entry points to move toward a Resilient posture.',
  },
  VISITORS: {
    current: (band, score) =>
      `Visitor, Vendor & Contractor Management is rated ${band} at ${Math.round(score)}/100, indicating ${band === 'Ad Hoc' ? 'little to no formal process for tracking who enters the site and why' : 'a visitor process exists but is not consistently followed or logged'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? 'Without visitor tracking, the organisation has no reliable record of who was on site at any given time — a significant gap during incident investigation or audits.'
        : 'Inconsistent visitor logging weakens accountability and makes it harder to reconstruct events accurately if an incident occurs.',
    action: (band) =>
      band === 'Ad Hoc'
        ? 'Implement a basic visitor sign-in process (digital or paper) within 30 days, capturing name, purpose, host, and time in/out at minimum.'
        : 'Reinforce the existing visitor process through staff briefing and spot checks, and consider digitising the log if not already done.',
    strength: (band, score) =>
      `Visitor, Vendor & Contractor Management is rated ${band} at ${Math.round(score)}/100, reflecting consistent, well-documented control over who accesses the site and why.`,
    nextLevel: () =>
      'Introduce pre-registration for known recurring vendors and periodic review of visitor logs for anomalies, to move toward a fully proactive posture.',
  },
  GUARDS: {
    current: (band, score) =>
      `Guarding Operations & Statutory Compliance is rated ${band} at ${Math.round(score)}/100, indicating ${band === 'Ad Hoc' ? 'significant gaps in guard deployment, training, or statutory documentation' : 'guarding presence exists but documentation or training consistency needs attention'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? "Gaps in guarding compliance carry direct statutory and contractual risk, and undermine the reliability of the site's first line of physical defence."
        : 'Inconsistent guard training or documentation increases the risk of procedural lapses during incidents and weakens audit readiness.',
    action: (band) =>
      band === 'Ad Hoc'
        ? 'Review current guard deployment against statutory licensing requirements within 30 days, and identify the most urgent compliance gap to close first.'
        : 'Schedule a refresher training session for deployed guards and verify all statutory documentation is current and on file.',
    strength: (band, score) =>
      `Guarding Operations & Statutory Compliance is rated ${band} at ${Math.round(score)}/100, reflecting well-deployed, properly documented, and compliant guarding operations.`,
    nextLevel: () =>
      'Introduce scenario-based refresher drills (not just classroom training) to build response consistency, moving toward a Resilient posture.',
  },
  ELECTRONIC: {
    current: (band, score) =>
      `Electronic Security Systems (CCTV, ACS, IDS & Integration) is rated ${band} at ${Math.round(score)}/100, indicating ${band === 'Ad Hoc' ? 'minimal or non-functional electronic monitoring and access control infrastructure' : 'electronic systems are present but coverage, integration, or maintenance has gaps'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? 'Without functioning electronic monitoring, incidents are far less likely to be detected in real time or reconstructed afterward, leaving the site reliant entirely on human vigilance.'
        : 'Partial or unintegrated electronic coverage creates blind spots that can be exploited, and may go unnoticed until an incident occurs.',
    action: (band) =>
      band === 'Ad Hoc'
        ? 'Conduct an audit of existing CCTV/access control hardware within 30 days to identify what is functional, what is not, and the highest-priority gap to fix first.'
        : 'Map current camera/access-control coverage against the site layout to identify blind spots, and prioritise closing the highest-risk gap.',
    strength: (band, score) =>
      `Electronic Security Systems is rated ${band} at ${Math.round(score)}/100, reflecting functional, well-integrated CCTV and access control infrastructure with good coverage.`,
    nextLevel: () =>
      'Consider integrating analytics (e.g., motion/anomaly alerts) on top of existing camera infrastructure to move from passive recording to active monitoring.',
  },
  INCIDENTS: {
    current: (band, score) =>
      `Incident Management, SOC & Monitoring is rated ${band} at ${Math.round(score)}/100, indicating ${band === 'Ad Hoc' ? 'no formal process for logging, escalating, or learning from security incidents' : 'an incident process exists but is not consistently followed or reviewed'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? 'Without incident logging, patterns go unnoticed, repeat issues are not addressed at the root cause, and there is no record to support investigation or insurance claims.'
        : "Inconsistent incident logging means some events may go unreported or unreviewed, limiting the organisation's ability to spot recurring issues.",
    action: (band) =>
      band === 'Ad Hoc'
        ? 'Introduce a simple incident log (even a shared spreadsheet) within 30 days, and brief all security staff on when and how to use it.'
        : 'Reinforce existing incident logging discipline through a brief refresher, and introduce a monthly review of logged incidents.',
    strength: (band, score) =>
      `Incident Management, SOC & Monitoring is rated ${band} at ${Math.round(score)}/100, reflecting a functioning process for capturing, escalating, and reviewing incidents.`,
    nextLevel: () =>
      'Introduce trend analysis on logged incidents (e.g., monthly pattern review) to move from reactive logging to proactive risk identification.',
  },
  CULTURE: {
    current: (band, score) =>
      `Employee Security Culture, Awareness & Behaviour is rated ${band} at ${Math.round(score)}/100, indicating ${band === 'Ad Hoc' ? 'limited staff awareness of security responsibilities or expected behaviour' : 'some awareness exists but is not consistently reinforced'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? 'Low security awareness among staff is consistently one of the most exploited weaknesses, since even strong physical and electronic controls can be bypassed through human error or social engineering.'
        : 'Inconsistent awareness means staff behaviour around security (e.g., tailgating, badge sharing) may vary significantly across shifts or departments.',
    action: (band) =>
      band === 'Ad Hoc'
        ? 'Run a brief, focused security awareness session for all staff within 30 days, covering the 3–4 most relevant risks for this site type.'
        : 'Reinforce awareness through periodic reminders (e.g., posters, brief refreshers) and observe whether behaviour change is occurring.',
    strength: (band, score) =>
      `Employee Security Culture, Awareness & Behaviour is rated ${band} at ${Math.round(score)}/100, reflecting good staff awareness and consistent security-conscious behaviour.`,
    nextLevel: () =>
      'Introduce periodic (e.g., quarterly) refreshers and recognise good security behaviour publicly to sustain and deepen this culture over time.',
  },
  BCP: {
    current: (band, score) =>
      `Business Continuity, Emergency Response & Crisis Management is rated ${band} at ${Math.round(score)}/100, indicating ${band === 'Ad Hoc' ? 'no documented plan for responding to a major disruption or emergency' : 'a plan exists but has not been recently tested or may be incomplete'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? 'Without a documented emergency response plan, a major incident is likely to be met with confusion and delay precisely when a fast, coordinated response matters most.'
        : 'An untested plan may contain gaps that only become apparent during an actual emergency, when there is no time to improvise.',
    action: (band) =>
      band === 'Ad Hoc'
        ? 'Draft a basic emergency response plan within 30 days covering the most likely scenarios for this site type (e.g., fire, medical emergency, unauthorised intrusion).'
        : 'Schedule a tabletop walkthrough of the existing plan with key staff to identify gaps before the next formal review.',
    strength: (band, score) =>
      `Business Continuity, Emergency Response & Crisis Management is rated ${band} at ${Math.round(score)}/100, reflecting a documented, reasonably current emergency response capability.`,
    nextLevel: () =>
      'Conduct a live (not just tabletop) drill at least annually to validate that the plan works in practice, not just on paper.',
  },
  COMPLIANCE: {
    current: (band, score) =>
      `Compliance, Documentation & Third-Party Risk is rated ${band} at ${Math.round(score)}/100, indicating ${band === 'Ad Hoc' ? 'significant gaps in regulatory documentation or third-party risk oversight' : 'documentation exists but is not fully current or consistently maintained'}.`,
    consequence: (band) =>
      band === 'Ad Hoc'
        ? 'Compliance gaps carry direct regulatory and contractual exposure, and are typically the first thing scrutinised during an audit or after an incident.'
        : "Incomplete or outdated documentation weakens the organisation's position during audits and may understate actual third-party risk exposure.",
    action: (band) =>
      band === 'Ad Hoc'
        ? 'Identify the single most urgent compliance gap (e.g., an expired license or missing third-party agreement) and resolve it within 30 days.'
        : 'Conduct a documentation review within the next quarter to identify and update outdated records before the next audit cycle.',
    strength: (band, score) =>
      `Compliance, Documentation & Third-Party Risk is rated ${band} at ${Math.round(score)}/100, reflecting well-maintained documentation and good oversight of third-party risk.`,
    nextLevel: () =>
      'Introduce a recurring (e.g., biannual) compliance self-audit to catch documentation drift before external audits do.',
  },
};

const GENERIC_TEMPLATE: DomainTemplate = {
  current: (band, score) =>
    `This domain is rated ${band} at ${Math.round(score)}/100, indicating room for improvement in this area of the security programme.`,
  consequence: () =>
    'Gaps in this domain may increase overall site risk exposure if not addressed.',
  action: () =>
    'Review current practices in this domain within 30 days and identify the most impactful improvement to prioritise first.',
  strength: (band, score) =>
    `This domain is rated ${band} at ${Math.round(score)}/100, reflecting solid performance in this area.`,
  nextLevel: () =>
    'Continue reinforcing current practices and review periodically to sustain this level of performance.',
};

function templateFor(domainKey: string): DomainTemplate {
  return DOMAIN_TEMPLATES[domainKey] ?? GENERIC_TEMPLATE;
}

function buildSignatureFinding(sorted: DomainScoreInput[], overallBand: string): string {
  if (sorted.length === 0) return 'Assessment data is being processed.';
  const lowest = sorted[0];
  const lowestBand = bandFor(lowest.score_0_100).label;
  if (lowestBand === 'Resilient' || lowestBand === 'Managed') {
    return `Overall posture is ${overallBand}, with no domain currently below the Managed threshold — the strongest area for continued investment is ${lowest.domain_name}.`;
  }
  return `${lowest.domain_name} is the most significant gap, currently rated ${lowestBand} at ${Math.round(lowest.score_0_100)}/100.`;
}

function buildPatterns(domainScores: DomainScoreInput[]): string[] {
  const patterns: string[] = [];
  const weak = domainScores.filter(d => d.score_0_100 < MANAGED_THRESHOLD);
  const adHoc = domainScores.filter(d => d.score_0_100 <= 40);

  if (adHoc.length >= 3) {
    patterns.push('Systemic Gap — three or more domains remain in the Ad Hoc band, suggesting security has not yet been formalised as a programme.');
  }
  const g = domainScores.find(d => d.domain_key === 'GUARDS')?.score_0_100;
  const c = domainScores.find(d => d.domain_key === 'COMPLIANCE')?.score_0_100;
  if (g !== undefined && c !== undefined && g < MANAGED_THRESHOLD && c < MANAGED_THRESHOLD) {
    patterns.push('Statutory Exposure Risk — both Guarding Operations and Compliance/Documentation are below the Managed threshold, indicating elevated regulatory risk.');
  }
  const p = domainScores.find(d => d.domain_key === 'PERIMETER')?.score_0_100;
  const e = domainScores.find(d => d.domain_key === 'ELECTRONIC')?.score_0_100;
  if (p !== undefined && e !== undefined && p < MANAGED_THRESHOLD && e < MANAGED_THRESHOLD) {
    patterns.push('Physical Layer Gap — both Perimeter/Access Control and Electronic Security Systems are below the Managed threshold, the two domains most directly tied to unauthorised entry risk.');
  }
  const cu = domainScores.find(d => d.domain_key === 'CULTURE')?.score_0_100;
  const i = domainScores.find(d => d.domain_key === 'INCIDENTS')?.score_0_100;
  if (cu !== undefined && i !== undefined && cu < MANAGED_THRESHOLD && i < MANAGED_THRESHOLD) {
    patterns.push('Detection & Response Gap — weak security culture combined with weak incident management means issues are both less likely to be noticed and less likely to be acted on.');
  }
  if (weak.length === 0) {
    patterns.push('Mature Baseline — all domains have reached the Managed threshold or above, indicating a formalised security programme is in place.');
  }
  return patterns;
}

function buildExecutiveSummary(
  site: SiteContext,
  _domainScores: DomainScoreInput[],
  weakDomains: DomainScoreInput[],
  strongDomains: DomainScoreInput[],
): string {
  const siteName = site.site_name || 'This site';
  const overallScore = Math.round(site.overall_score_0_100);
  const overallBand = bandFor(site.overall_score_0_100).label;

  const para1 = `${siteName} achieves an overall security score of ${overallScore}/100, placing the site in the "${overallBand}" band with an overall risk posture of ${site.risk_posture}. This assessment covers ten domains spanning physical, procedural, and statutory security controls, weighted by relative criticality to derive the overall score.`;

  let para2: string;
  if (weakDomains.length === 0) {
    para2 = `All ten domains currently meet or exceed the Managed threshold, indicating a formalised and reasonably mature security programme. The strongest-performing area is ${strongDomains[0]?.domain_name ?? 'the leading domain'}, scoring ${Math.round(strongDomains[0]?.score_0_100 ?? 0)}/100.`;
  } else {
    const domainList = weakDomains.map(d => `${d.domain_name} (${Math.round(d.score_0_100)}/100)`).join(', ');
    para2 = `The domains requiring the most immediate attention are: ${domainList}. These represent the areas where the gap between current practice and a formalised security posture is widest, and where targeted action will produce the greatest improvement in overall risk reduction.`;
  }

  let para3: string;
  if (strongDomains.length > 0) {
    const topDomain = strongDomains[0];
    para3 = `On the positive side, ${topDomain.domain_name} stands out as a relative strength at ${Math.round(topDomain.score_0_100)}/100, and can serve as a model for how other domains might be brought up to a similar standard. The recommended next step is to focus near-term effort on the lowest-scoring domain(s) identified above, while sustaining current performance in stronger areas.`;
  } else {
    para3 = `No domain currently stands out as a clear relative strength, suggesting the security programme would benefit from a structured, sequenced improvement plan across multiple domains simultaneously rather than building on an existing area of strength.`;
  }

  return [para1, para2, para3].join('\n\n');
}

function buildWeakDomainFindings(weakDomains: DomainScoreInput[]): DomainFinding[] {
  return weakDomains.map(d => {
    const band = bandFor(d.score_0_100).label;
    const t = templateFor(d.domain_key);
    return {
      domain: d.domain_name,
      score: Math.round(d.score_0_100),
      findings: [t.current(band, d.score_0_100), t.consequence(band), t.action(band)],
    };
  });
}

function buildStrongDomainFindings(strongDomains: DomainScoreInput[]): DomainFinding[] {
  return strongDomains.map(d => {
    const band = bandFor(d.score_0_100).label;
    const t = templateFor(d.domain_key);
    return {
      domain: d.domain_name,
      score: Math.round(d.score_0_100),
      findings: [t.strength(band, d.score_0_100), t.nextLevel(band)],
    };
  });
}

function buildRoadmap(weakDomains: DomainScoreInput[], allDomains: DomainScoreInput[]) {
  const adHocDomains = allDomains.filter(d => d.score_0_100 <= 40);
  const developingDomains = allDomains.filter(d => d.score_0_100 > 40 && d.score_0_100 <= 70);

  const remediation_30 = adHocDomains.length > 0
    ? adHocDomains.slice(0, 5).map(d => `${templateFor(d.domain_key).action('Ad Hoc')} · Owner: Site security lead · Domain: ${d.domain_name}`)
    : ['Review the most recent assessment findings with site leadership and confirm priority areas for the next 30 days. · Owner: Site security lead'];

  const remediation_60 = developingDomains.length > 0
    ? developingDomains.slice(0, 5).map(d => `${templateFor(d.domain_key).action('Developing')} · Owner: Site security lead · Domain: ${d.domain_name}`)
    : ['Consolidate improvements made in the first 30 days and document updated procedures formally. · Owner: Site security lead'];

  const remediation_90 = weakDomains.length > 0
    ? weakDomains.slice(0, 4).map(d => `${templateFor(d.domain_key).nextLevel(bandFor(d.score_0_100).label)} · Owner: Site security lead · Domain: ${d.domain_name}`)
    : ['Schedule the next full Security Selfie™ reassessment to validate sustained improvement. · Owner: Site security lead'];

  return { remediation_30, remediation_60, remediation_90 };
}

export function buildRuleBasedInsights(domainScores: DomainScoreInput[], site: SiteContext): RuleBasedInsights {
  const sorted = [...domainScores].sort((a, b) => a.score_0_100 - b.score_0_100);
  const weakDomains = sorted.filter(d => d.score_0_100 < MANAGED_THRESHOLD).slice(0, 3);
  const strongDomains = [...sorted].reverse().filter(d => d.score_0_100 >= MANAGED_THRESHOLD).slice(0, 3);
  const overallBand = bandFor(site.overall_score_0_100).label;
  const roadmap = buildRoadmap(weakDomains, domainScores);

  return {
    signature_finding: buildSignatureFinding(sorted, overallBand),
    executive_summary: buildExecutiveSummary(site, domainScores, weakDomains, strongDomains),
    weak_domains: buildWeakDomainFindings(weakDomains),
    strong_domains: buildStrongDomainFindings(strongDomains),
    detected_patterns: buildPatterns(domainScores),
    remediation_30: roadmap.remediation_30,
    remediation_60: roadmap.remediation_60,
    remediation_90: roadmap.remediation_90,
    generation_method: 'rule_based',
  };
}
