import { ASSESSMENT_DOMAINS, type RiskDimension } from "./questions";

export interface DomainRiskScores {
  domainKey: string;
  domainName: string;
  people: number | null;
  process: number | null;
  technology: number | null;
  governance: number | null;
  compliance: number | null;
}

export const computeRiskDimensionScores = (
  questionResponses: Array<{
    domain_key: string;
    question_code: string;
    rating_0_4: number;
  }>
): DomainRiskScores[] => {
  const results: DomainRiskScores[] = [];

  // Process each domain
  ASSESSMENT_DOMAINS.forEach((domain) => {
    const domainResponses = questionResponses.filter(
      (r) => r.domain_key === domain.key
    );

    const dimensionScores: Record<RiskDimension, number[]> = {
      people: [],
      process: [],
      technology: [],
      governance: [],
      compliance: [],
    };

    // For each response in this domain, map it to risk dimensions
    domainResponses.forEach((response) => {
      const question = domain.questions.find((q) => q.code === response.question_code);
      if (question && question.riskDimensions) {
        // Convert 0-4 rating (from DB) to 0-100 scale
        const scoreNormalized = (response.rating_0_4 / 4) * 100;
        
        // Add this score to each relevant dimension
        question.riskDimensions.forEach((dim) => {
          dimensionScores[dim].push(scoreNormalized);
        });
      }
    });

    // Calculate averages for each dimension
    const domainRiskScores: DomainRiskScores = {
      domainKey: domain.key,
      domainName: domain.name,
      people: dimensionScores.people.length > 0
        ? dimensionScores.people.reduce((a, b) => a + b, 0) / dimensionScores.people.length
        : null,
      process: dimensionScores.process.length > 0
        ? dimensionScores.process.reduce((a, b) => a + b, 0) / dimensionScores.process.length
        : null,
      technology: dimensionScores.technology.length > 0
        ? dimensionScores.technology.reduce((a, b) => a + b, 0) / dimensionScores.technology.length
        : null,
      governance: dimensionScores.governance.length > 0
        ? dimensionScores.governance.reduce((a, b) => a + b, 0) / dimensionScores.governance.length
        : null,
      compliance: dimensionScores.compliance.length > 0
        ? dimensionScores.compliance.reduce((a, b) => a + b, 0) / dimensionScores.compliance.length
        : null,
    };

    results.push(domainRiskScores);
  });

  return results;
};
