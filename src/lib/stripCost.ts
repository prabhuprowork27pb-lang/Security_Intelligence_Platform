// Strips monetary / cost / investment fragments from AI-generated action strings.
// Used in Action Plan (Quick + Validated) and PDF/print roadmaps to ensure SIP™
// never implies pricing guidance without a Security Studio™ engagement.
export const stripCost = (s: string): string => {
  if (!s) return s;
  return s
    // Remove parenthetical money chunks: (₹6.2L), (₹4-5 lakh / year), etc.
    .replace(/\s*\(\s*₹[^)]*\)\s*/gi, " ")
    // Remove standalone ₹ amounts e.g. " — ₹3 lakh / year"
    .replace(/\s*[—–-]?\s*₹\s?[\d.,]+\s*(?:L|lakh|lakhs|cr|crore|crores|K)?(?:\s*\/\s*(?:year|yr|month|mo))?/gi, "")
    // Remove "CapEx ₹…" / "OpEx ₹…" / "investment of ₹…" leftovers
    .replace(/\b(?:CapEx|OpEx|Capex|Opex)\b[^.,;]*/gi, "")
    .replace(/\b(?:investment|cost|budget|spend)\s+(?:of\s+|range\s+|estimate[d]?\s+)?[^.,;]*/gi, "")
    // Tidy whitespace + dangling punctuation
    .replace(/\s{2,}/g, " ")
    .replace(/\s+([.,;:])/g, "$1")
    .replace(/[—–-]\s*([.,;])/g, "$1")
    .replace(/\(\s*\)/g, "")
    .trim();
};
