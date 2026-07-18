// Deterministic, score-sensitive structured insight layer.
// This does NOT replace the AI narrative — it sits alongside it and
// presents a consistent consulting-grade framing for every domain.

export type InsightTier = "high" | "medium" | "low";

export interface StructuredInsight {
  currentView: string;
  observation: string;
  implication: string;
  consideration: string;
}

export const getInsightTier = (score: number): InsightTier => {
  if (score >= 75) return "high";
  if (score >= 50) return "medium";
  return "low";
};

export const getTierLabel = (tier: InsightTier): string => {
  switch (tier) {
    case "high":
      return "Mature & Consistent";
    case "medium":
      return "Partial Implementation";
    case "low":
      return "Material Gaps";
  }
};

// Domain-specific phrasing. Keys align with domain_key in the database.
// Each domain has three score-sensitive variants so statements remain
// non-generic and non-repetitive across the report.
const DOMAIN_COPY: Record<string, Record<InsightTier, StructuredInsight>> = {
  SITE_CONTEXT: {
    high: {
      currentView:
        "The site's risk profile is formally documented, location-specific, and actively used to calibrate security resources and guarding posture.",
      observation:
        "Risk context is treated as a living input to operational decisions, not a once-written artefact that sits in a shared drive.",
      implication:
        "Security investments are well-calibrated to the facility's actual exposure — neither over-specified nor blind to material threats.",
      consideration:
        "Revalidate the risk assessment when neighbourhood conditions change — new construction, adjacent high-value targets, or changes in public transport access.",
    },
    medium: {
      currentView:
        "A risk assessment exists, but it is not consistently referenced in operational security decisions or resource allocation.",
      observation:
        "Site-specific factors — local crime pattern, adjacency risks, shift-based vulnerability windows — are documented in parts but not integrated into the guarding or technology plan.",
      implication:
        "Security controls reflect general industry practice rather than the site's specific exposure, leaving pockets of unaddressed risk.",
      consideration:
        "Commission a location-specific risk refresh and use it to explicitly drive the next guarding model review and CCTV coverage audit.",
    },
    low: {
      currentView:
        "The site's security design is not grounded in a documented, current risk assessment, and exposure factors are understood only informally.",
      observation:
        "Local crime patterns, adjacency risks, criticality tiers, and seasonal exposure windows are not captured or actively reviewed.",
      implication:
        "Security posture is driven by precedent rather than risk, leaving the site exposed to plausible Indian-context threats that have never been formally considered.",
      consideration:
        "Commission a structured site risk profiling exercise — including police liaison input and local crime data — and use it as the foundation for every subsequent control decision.",
    },
  },

  GOVERNANCE: {
    high: {
      currentView:
        "Security governance is embedded, with clear ownership, documented policies, and visible accountability at leadership level.",
      observation:
        "Roles, review cadences, and escalation paths are consistently understood by security, facilities, and business stakeholders.",
      implication:
        "The site benefits from timely decisions and predictable enforcement of security standards across functions.",
      consideration:
        "Strengthen board-level reporting with trend indicators (incidents, compliance, cost-of-control) to sustain executive engagement.",
    },
    medium: {
      currentView:
        "Governance structures exist but are applied unevenly, with dependence on a few individuals rather than institutionalised process.",
      observation:
        "Policies are documented, yet review cycles, exception handling, and KPI tracking are not consistently operationalised.",
      implication:
        "Decision-making slows in ambiguous situations and policy drift accumulates between formal reviews.",
      consideration:
        "Establish a fixed security governance calendar with defined owners, inputs, and decision rights for each review forum.",
    },
    low: {
      currentView:
        "Formal security governance is limited; decisions are largely reactive and driven by individual judgement.",
      observation:
        "Policies, where they exist, are not actively maintained and there is no routine forum for security oversight.",
      implication:
        "Accountability gaps create exposure to both operational failures and regulatory scrutiny.",
      consideration:
        "Stand up a minimum viable governance construct — a single policy set, a named accountable owner, and a monthly review cadence.",
    },
  },
  PERIMETER: {
    high: {
      currentView:
        "Perimeter controls operate as an integrated system of physical barriers, access control, and monitored entry points.",
      observation:
        "Layered defences are reinforced by consistent enforcement at access points and well-maintained infrastructure.",
      implication:
        "The likelihood of unauthorised ingress is materially reduced, and exceptions are handled through a controlled process.",
      consideration:
        "Stress-test the perimeter periodically through red-team walk-throughs and tailgating audits to validate real-world effectiveness.",
    },
    medium: {
      currentView:
        "Core perimeter controls are in place, but inconsistencies in enforcement and coverage weaken the overall barrier.",
      observation:
        "Access control technology and physical barriers are present, yet gaps exist in tailgating discipline, visitor routing, or after-hours coverage.",
      implication:
        "Determined intruders can exploit predictable gaps, and routine operational shortcuts begin to normalise control bypass.",
      consideration:
        "Prioritise closing high-traffic bypass paths, tighten after-hours protocols, and reinforce enforcement discipline through spot audits.",
    },
    low: {
      currentView:
        "Perimeter protection relies heavily on manual oversight, with limited integration between barriers, access control, and monitoring.",
      observation:
        "Entry discipline is inconsistent, technology coverage is patchy, and maintenance of physical barriers is reactive.",
      implication:
        "The site is exposed to casual as well as deliberate intrusion, and incidents are more likely to be detected late.",
      consideration:
        "Redesign the perimeter as an integrated layered system — barriers, controlled access, surveillance — with clearly defined enforcement standards.",
    },
  },
  VISITORS: {
    high: {
      currentView:
        "Visitor, vendor, and contractor management is structured, traceable, and aligned with the site's risk tiers.",
      observation:
        "Pre-registration, identity verification, escort rules, and access duration are consistently enforced across categories.",
      implication:
        "Third-party presence on site is predictable, auditable, and unlikely to become a vector for security or safety incidents.",
      consideration:
        "Integrate visitor data with incident and access analytics to identify anomalous patterns over time.",
    },
    medium: {
      currentView:
        "Visitor and contractor processes are defined but executed inconsistently, especially at peak hours or for recurring vendors.",
      observation:
        "Identity checks and escort discipline slip under operational pressure, and digital records are not always reconciled.",
      implication:
        "Unverified or unescorted third parties gain access to sensitive areas, raising both security and compliance exposure.",
      consideration:
        "Simplify the visitor workflow, enforce identity verification at a single controlled lobby, and audit escort compliance weekly.",
    },
    low: {
      currentView:
        "Third-party access is loosely controlled, with limited pre-registration, identity verification, or tracking of movement on site.",
      observation:
        "Vendors and contractors often self-manage entry and exit, and records — if kept — are not reviewed.",
      implication:
        "The site has elevated insider-threat and theft exposure, with limited ability to reconstruct who was present during an incident.",
      consideration:
        "Introduce a baseline visitor management system with mandatory pre-approval, ID verification, and time-bound access.",
    },
  },
  GUARDS: {
    high: {
      currentView:
        "Guarding operations are disciplined, statutory-compliant, and aligned to documented post orders and deployment standards.",
      observation:
        "PSARA licensing, statutory payments, BGV, and training records are verifiable and kept current.",
      implication:
        "The guarding force operates as a credible first line of defence, with low regulatory and reputational exposure.",
      consideration:
        "Shift focus toward performance measurement — response drills, post effectiveness, and retention — to sustain operational quality.",
    },
    medium: {
      currentView:
        "Guarding is functional and largely compliant, but documentation and field discipline are not uniformly reliable.",
      observation:
        "Statutory records, training refreshers, or post-order adherence show gaps that would surface in a rigorous audit.",
      implication:
        "Compliance risk is elevated, and field performance is likely inconsistent across shifts and posts.",
      consideration:
        "Close documentation gaps first — PSARA, PF/ESI, wages, BGV, police verification — then tighten shift discipline through supervised checks.",
    },
    low: {
      currentView:
        "Guarding operations lack structured supervision, verifiable statutory records, and consistent post-level discipline.",
      observation:
        "Licensing, wage, and BGV records are incomplete, and post behaviour is driven by habit rather than documented standards.",
      implication:
        "The site faces concurrent regulatory, reputational, and operational exposure from its most visible security layer.",
      consideration:
        "Initiate a guarding reset — verify vendor licensing, reconstruct statutory records, and re-baseline post orders and supervision.",
    },
  },
  ELECTRONIC: {
    high: {
      currentView:
        "Electronic security systems — CCTV, access control, and alarms — are coherent, well-maintained, and actively monitored.",
      observation:
        "Coverage, retention, and integration are aligned to risk, and system health is tracked rather than assumed.",
      implication:
        "Technology reliably supports detection, investigation, and deterrence, and incidents can be reconstructed with confidence.",
      consideration:
        "Evaluate the case for analytics (intrusion detection, tailgating, loitering) to move from passive recording to active alerting.",
    },
    medium: {
      currentView:
        "Electronic security systems cover the essentials, but integration, health monitoring, and operational use are uneven.",
      observation:
        "Cameras and access control are deployed, yet blind spots, unmonitored alarms, or outdated retention policies remain.",
      implication:
        "The system supports reactive investigation more than proactive detection, and outages may go unnoticed.",
      consideration:
        "Institute a system-health regime — uptime, coverage validation, retention — and integrate events into a single monitoring view.",
    },
    low: {
      currentView:
        "Electronic security systems are fragmented, with visible blind spots, ageing infrastructure, and minimal active monitoring.",
      observation:
        "Coverage is driven by what was installed historically rather than by current risk, and health of the estate is not tracked.",
      implication:
        "Technology provides limited assurance and may create a false sense of control at critical points.",
      consideration:
        "Commission a technology refresh plan anchored in a coverage-vs-risk map, starting with the highest-criticality zones.",
    },
  },
  INCIDENTS: {
    high: {
      currentView:
        "Incident management is structured end-to-end, from detection through response, investigation, and lessons-learned.",
      observation:
        "Response protocols are practised, incidents are categorised consistently, and trends inform operational changes.",
      implication:
        "The site is able to contain incidents quickly and convert them into durable improvements.",
      consideration:
        "Extend incident analytics to near-misses and precursor events to move toward a predictive posture.",
    },
    medium: {
      currentView:
        "Incidents are managed competently when they occur, but capture, classification, and learning loops are inconsistent.",
      observation:
        "Response is effective in the moment, yet reporting quality, root-cause analysis, and tracking of corrective actions are uneven.",
      implication:
        "Recurring issues persist because lessons are not systematically translated into preventive controls.",
      consideration:
        "Standardise an incident taxonomy, introduce mandatory RCA for defined severities, and track CAPA closure visibly.",
    },
    low: {
      currentView:
        "Incident handling is largely informal, with limited documentation, classification, or follow-through on corrective actions.",
      observation:
        "Events are resolved locally and rarely escalated or analysed, so the same issues tend to recur.",
      implication:
        "The site is unable to demonstrate control effectiveness and will struggle in any serious post-incident review.",
      consideration:
        "Put in place a simple incident register, a severity definition, and a standing review to drive corrective action to closure.",
    },
  },
  CULTURE: {
    high: {
      currentView:
        "Security awareness is embedded in employee behaviour, with visible ownership beyond the security function.",
      observation:
        "Staff consistently report suspicious behaviour, follow access discipline, and participate actively in drills and training.",
      implication:
        "The organisation benefits from a credible human sensor network that materially amplifies formal controls.",
      consideration:
        "Sustain engagement through role-relevant scenarios and periodic measurement of security behaviour, not just completion rates.",
    },
    medium: {
      currentView:
        "Awareness programmes exist, but engagement is variable and security behaviour is not consistently reinforced.",
      observation:
        "Training is delivered, yet day-to-day behaviours — tailgating, badge discipline, visitor challenge — remain inconsistent.",
      implication:
        "Formal controls are partially undermined by everyday behavioural shortcuts.",
      consideration:
        "Shift from completion-based training to behaviour-based reinforcement, with visible leadership messaging on key expectations.",
    },
    low: {
      currentView:
        "Security awareness is not systematically cultivated; staff have limited clarity on their role in the control environment.",
      observation:
        "Training is episodic or absent, and security is widely perceived as the guarding team's responsibility alone.",
      implication:
        "Human behaviour is a persistent weak link, eroding the effectiveness of even well-designed technical controls.",
      consideration:
        "Launch a baseline awareness programme with leadership sponsorship, targeting a small number of critical, observable behaviours.",
    },
  },
  BCP: {
    high: {
      currentView:
        "Business continuity, emergency response, and crisis management are practised capabilities rather than paper plans.",
      observation:
        "Roles, activation triggers, and recovery priorities are understood, and drills are conducted with realistic scenarios.",
      implication:
        "The site is positioned to respond to disruptive events with speed, coordination, and minimal business impact.",
      consideration:
        "Extend exercises to include cross-functional and multi-site scenarios, and align with external partners where relevant.",
    },
    medium: {
      currentView:
        "Continuity and emergency plans are documented, but drill rigour and cross-functional coverage are inconsistent.",
      observation:
        "Evacuation and basic response are practised, yet recovery of business-critical activities is less well rehearsed.",
      implication:
        "Response to familiar events is adequate; response to compound or novel disruptions is likely to be improvised.",
      consideration:
        "Broaden the scenario library, rehearse with business owners rather than security alone, and test decision-making under pressure.",
    },
    low: {
      currentView:
        "Continuity and crisis capability rests on documents that are not actively exercised or maintained.",
      observation:
        "Drills, if held, focus narrowly on fire evacuation and do not engage business or senior leadership.",
      implication:
        "In any serious disruption, response is likely to be slow, uncoordinated, and heavily dependent on individual judgement.",
      consideration:
        "Rebuild continuity as a lived capability — simple plans, named decision-makers, and at least one realistic drill per quarter.",
    },
  },
  COMPLIANCE: {
    high: {
      currentView:
        "Compliance, documentation, and third-party risk are managed as an integrated discipline with strong audit readiness.",
      observation:
        "Statutory registers, contract obligations, and CAPA trackers are current and regularly reviewed.",
      implication:
        "Regulatory and contractual exposure is low, and the site can respond confidently to audits and inspections.",
      consideration:
        "Move beyond compliance to assurance — periodically test control effectiveness, not just the existence of documents.",
    },
    medium: {
      currentView:
        "Compliance obligations are broadly tracked, but documentation quality and third-party oversight are inconsistent.",
      observation:
        "Core records exist, yet gaps emerge in vendor contract hygiene, evidence freshness, and CAPA closure.",
      implication:
        "Audit findings are likely, and third-party failures can translate into direct site-level exposure.",
      consideration:
        "Consolidate compliance into a single living register with clear owners, due dates, and evidence links.",
    },
    low: {
      currentView:
        "Compliance and third-party documentation are fragmented, with material gaps in statutory evidence and contract oversight.",
      observation:
        "Records are incomplete, vendor obligations are not actively monitored, and CAPA tracking is largely absent.",
      implication:
        "The site carries concurrent legal, financial, and reputational exposure that is likely to surface under scrutiny.",
      consideration:
        "Prioritise a compliance stabilisation sprint — reconstruct statutory records, map vendor obligations, and open a CAPA tracker.",
    },
  },
};

// Fallback for any domain key we don't explicitly cover.
const FALLBACK: Record<InsightTier, StructuredInsight> = {
  high: {
    currentView:
      "Controls in this domain are functioning consistently and align with the site's stated risk appetite.",
    observation:
      "Documentation, execution, and oversight in this domain move in the same direction rather than in isolation.",
    implication:
      "The organisation can rely on this domain as a dependable element of the broader control environment.",
    consideration:
      "Focus on continuous refinement — measurement, benchmarking, and periodic independent validation.",
  },
  medium: {
    currentView:
      "This domain has the essentials in place, but execution quality and coverage are not uniform.",
    observation:
      "Design intent is reasonable, yet operational discipline and evidence trails are inconsistent.",
    implication:
      "Control effectiveness is variable, which limits the assurance this domain can provide.",
    consideration:
      "Target the specific execution gaps through clearer ownership, standard operating rhythms, and periodic review.",
  },
  low: {
    currentView:
      "This domain shows material gaps in both design and execution relative to the site's risk profile.",
    observation:
      "Controls are informal, inconsistently applied, or not supported by verifiable evidence.",
    implication:
      "The domain represents a meaningful source of risk that is likely to manifest in incidents, audits, or regulatory reviews.",
    consideration:
      "Treat this domain as a remediation priority with a defined owner, a short-horizon plan, and visible progress tracking.",
  },
};

export const getStructuredInsight = (
  domainKey: string,
  score: number,
): { tier: InsightTier; insight: StructuredInsight } => {
  const tier = getInsightTier(score);
  const domainCopy = DOMAIN_COPY[domainKey];
  const insight = domainCopy ? domainCopy[tier] : FALLBACK[tier];
  return { tier, insight };
};
