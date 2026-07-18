/**
 * Canonical methodology disclosure for every Security Intelligence Report™.
 *
 * The Security Selfie™ is NOT an audit. It does not involve interviews,
 * site walkthroughs, evidence collection or physical inspection. Every
 * observation must be classifiable as Reported, Inferred or Recommended
 * so that leaders can act with the correct confidence.
 *
 * Use this single source of truth in PDF reports, sample reports, the
 * methodology page and any LLM prompt that emits report copy.
 */

export const REPORT_METHODOLOGY = {
  oneLiner:
    "Derived from your self-reported assessment responses, the SIP™ knowledge graph and structured analytical models.",
  fullDisclosure:
    "This Security Intelligence Report™ is derived from your self-reported assessment responses, the Security Intelligence Platform™ knowledge graph and structured analytical models. It is not an audit. It does not involve interviews, site walkthroughs, evidence collection or physical inspection. Observations are classified as Reported, Inferred or Recommended so leaders can act with appropriate confidence.",
  classifications: {
    Reported:
      "Directly captured from your assessment responses.",
    Inferred:
      "Derived from your responses combined with sector benchmarks and the SIP™ knowledge graph.",
    Recommended:
      "An advisory action drawn from leading practice — calibrated to the posture you reported.",
  },
  /**
   * Forbidden phrasings — never imply activities the platform did not perform.
   * Use this regex to guard LLM output before it reaches the user.
   */
  forbiddenPhrases: [
    /\binterview(s|ed|ing)?\b/gi,
    /\bwalk[- ]?through(s)?\b/gi,
    /\bsite visit(s)?\b/gi,
    /\bsite inspection(s)?\b/gi,
    /\bphysical inspection(s)?\b/gi,
    /\bevidence (collected|collection|reviewed|gathered)\b/gi,
    /\bdocument review(ed|s)?\b/gi,
    /\bobserved on site\b/gi,
    /\baudit performed\b/gi,
    /\bwe (tested|verified|inspected|witnessed)\b/gi,
    /\bfield assessment(s)?\b/gi,
    /\bon[- ]ground (assessment|validation|inspection)\b/gi,
  ],
} as const;

/** Replace any forbidden phrase with the safe placeholder. */
export function sanitiseReportText(text: string): string {
  let out = text;
  for (const pattern of REPORT_METHODOLOGY.forbiddenPhrases) {
    out = out.replace(pattern, "based on your responses");
  }
  return out;
}

export function containsForbiddenPhrase(text: string): boolean {
  return REPORT_METHODOLOGY.forbiddenPhrases.some((p) => p.test(text));
}
