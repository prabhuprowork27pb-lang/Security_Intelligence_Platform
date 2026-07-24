import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDomainIcon } from "@/lib/domainIcons";
import { SCALE_LABELS } from "@/lib/questions";
import { getScoreBand, SAASS_SCORE_BANDS, sanitizeReportText } from "@/lib/scoring";
import { computeRiskDimensionScores } from "@/lib/riskDimensions";
import { ScoreBadge } from "@/components/ScoreBadge";
import ReportDisclaimerRibbon from "@/components/ReportDisclaimerRibbon";
import { stripCost } from "@/lib/stripCost";

// Helper to get maturity label from 1-5 score
const getMaturityLabel = (score: number): string => {
  const rounded = Math.round(score);
  if (rounded <= 1) return SCALE_LABELS[1];
  if (rounded >= 5) return SCALE_LABELS[5];
  return SCALE_LABELS[rounded as keyof typeof SCALE_LABELS] || SCALE_LABELS[1];
};

// Parse remediation plan JSON
const parseRoadmap = (planJson: string | null): { days_30: string[]; days_60: string[]; days_90: string[] } | null => {
  if (!planJson) return null;
  try {
    const parsed = JSON.parse(planJson);
    // Handle nested roadmap structure
    if (parsed.roadmap) {
      return {
        days_30: parsed.roadmap.days_30 || [],
        days_60: parsed.roadmap.days_60 || [],
        days_90: parsed.roadmap.days_90 || [],
      };
    }
    // Handle flat structure
    return {
      days_30: parsed.days_30 || [],
      days_60: parsed.days_60 || [],
      days_90: parsed.days_90 || [],
    };
  } catch {
    return null;
  }
};

interface Assessment {
  id: string;
  overall_score_0_100: number;
  overall_maturity_1_5: number;
  risk_posture: string;
  executive_summary: string;
  remediation_plan: string;
  created_at: string;
  created_by_name: string;
  created_by_role: string;
  sites: {
    name: string;
    city: string;
    state: string;
    organisations: {
      name: string;
    };
  };
}

interface DomainScore {
  domain_key: string;
  domain_name: string;
  score_0_100: number;
  maturity_1_5: number;
  commentary: string;
}

interface QuestionResponse {
  domain_key: string;
  question_code: string;
  rating_0_4: number;
}

export default function PrintPreview() {
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("id");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [domainScores, setDomainScores] = useState<DomainScore[]>([]);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (assessmentId) {
      fetchData();
    }
  }, [assessmentId]);

  const fetchData = async () => {
    if (!assessmentId) return;

    const { data: assessmentData } = await supabase
      .from("assessments")
      .select(`
        *,
        sites(name, city, state, organisations(name))
      `)
      .eq("id", assessmentId)
      .single();

    const { data: scoresData } = await supabase
      .from("domain_scores")
      .select("*")
      .eq("assessment_id", assessmentId)
      .order("domain_key");

    const { data: responsesData } = await supabase
      .from("question_responses")
      .select("domain_key, question_code, rating_0_4")
      .eq("assessment_id", assessmentId);

    setAssessment(assessmentData);
    setDomainScores(scoresData || []);
    setResponses(responsesData || []);
    setLoading(false);
  };

  if (loading || !assessment) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-lg font-heading">Loading report...</div>
      </div>
    );
  }

  const riskDimensionData = computeRiskDimensionScores(responses);

  return (
    <div className="min-h-dvh bg-background print:bg-white">
      <style>{`
        @media print {
          body { font-size: 12pt; }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          thead { display: table-header-group; }
          @page { margin: 18mm 20mm; size: A4; }
        }
      `}</style>

      {/* Print controls */}
      <div className="no-print fixed top-4 right-4 z-50 flex gap-2">
        <button
          onClick={() => window.print()}
          className="px-4 py-2 bg-primary text-primary-foreground rounded-lg shadow-md hover:bg-primary/90"
        >
          Print / Save as PDF
        </button>
        <button
          onClick={() => window.close()}
          className="px-4 py-2 bg-secondary text-secondary-foreground rounded-lg shadow-md hover:bg-secondary/90"
        >
          Close Preview
        </button>
      </div>

      {/* Cover Page */}
      <div className="page-break p-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-heading font-bold text-primary mb-4">
            Security Intelligence Report
          </h1>
          <p className="text-xl text-muted-foreground">
            {(assessment as any)?.validated_report_status === "ready"
              ? "Security Selfie™ — Validated Intelligence Report"
              : "Security Selfie™ — Quick Intelligence Report"}
          </p>
        </div>

        <Card className="premium-card p-8 mb-8 page-break-inside-avoid">
          <div className="text-center mb-6">
            <div 
              className="inline-flex items-center justify-center w-32 h-32 rounded-full mb-4"
              style={{ 
                backgroundColor: getScoreBand(assessment.overall_score_0_100)?.color || '#95A5A6'
              }}
            >
              <span 
                className="text-5xl font-mono font-bold"
                style={{ color: getScoreBand(assessment.overall_score_0_100)?.textColor || '#FFFFFF' }}
              >
                {Math.round(assessment.overall_score_0_100 || 0)}
              </span>
            </div>
            <h2 className="text-2xl font-heading font-semibold mb-2">Overall Security Score</h2>
            <Badge 
              className="px-4 py-1 text-base"
              style={{ 
                backgroundColor: getScoreBand(assessment.overall_score_0_100)?.color || '#95A5A6',
                color: getScoreBand(assessment.overall_score_0_100)?.textColor || '#FFFFFF'
              }}
            >
              {getScoreBand(assessment.overall_score_0_100)?.label || "UNKNOWN"}
            </Badge>
            <div className="mt-4 text-lg">
              <span className="font-semibold">Maturity Level:</span>{" "}
              <span className="font-mono">{assessment.overall_maturity_1_5 || 1}</span> / 5 — {getMaturityLabel(assessment.overall_maturity_1_5 || 1)}
            </div>
          </div>
        </Card>

        <div className="grid grid-cols-2 gap-4 mb-8">
          <Card className="p-4 page-break-inside-avoid">
            <h3 className="font-heading font-semibold mb-2">Organisation</h3>
            <p>{assessment.sites?.organisations?.name}</p>
          </Card>
          <Card className="p-4 page-break-inside-avoid">
            <h3 className="font-heading font-semibold mb-2">Site</h3>
            <p>{assessment.sites?.name}</p>
            <p className="text-sm text-muted-foreground">
              {assessment.sites?.city}, {assessment.sites?.state}
            </p>
          </Card>
          <Card className="p-4 page-break-inside-avoid">
            <h3 className="font-heading font-semibold mb-2">Assessment Date</h3>
            <p>{new Date(assessment.created_at).toLocaleDateString()}</p>
          </Card>
          <Card className="p-4 page-break-inside-avoid">
            <h3 className="font-heading font-semibold mb-2">Assessor</h3>
            <p>{assessment.created_by_name}</p>
            <p className="text-sm text-muted-foreground">{assessment.created_by_role}</p>
          </Card>
        </div>
      </div>

      {/* Signature Finding — the one-line pattern from the AI intelligence layer */}
      {(() => {
        let signatureFinding: string | null = null;
        try {
          const parsed = JSON.parse(assessment.remediation_plan || "{}");
          const rawSig = parsed.signature_finding ?? null;
          signatureFinding = rawSig ? sanitizeReportText(rawSig, assessment.overall_score_0_100) : null;
        } catch { /* ignore */ }
        if (!signatureFinding) return null;
        return (
          <div className="p-8 page-break-inside-avoid">
            <Card className="p-6 border-l-4 border-l-secondary bg-secondary/5">
              <p className="text-[11px] uppercase tracking-wider text-secondary font-semibold mb-2">
                Signature Finding
              </p>
              <p className="text-xl font-heading font-semibold leading-snug text-foreground">
                &ldquo;{signatureFinding}&rdquo;
              </p>
            </Card>
          </div>
        );
      })()}

      {/* Executive Summary */}
      {assessment.executive_summary && (
        <div className="p-8 page-break-inside-avoid">
          <h2 className="text-2xl font-heading font-bold text-primary mb-4">Executive Summary</h2>
          <Card className="p-6">
            <p className="whitespace-pre-wrap">{sanitizeReportText(assessment.executive_summary, assessment.overall_score_0_100)}</p>
          </Card>
        </div>
      )}

      {/* Domain Scores */}
      <div className="p-8 page-break">
        <h2 className="text-2xl font-heading font-bold text-primary mb-6">Domain Scores</h2>
        <div className="grid grid-cols-2 gap-4">
          {domainScores.map((domain) => {
            const Icon = getDomainIcon(domain.domain_key);
            const band = getScoreBand(domain.score_0_100 || 0);
            return (
              <Card 
                key={domain.domain_key} 
                className="p-4 page-break-inside-avoid border-l-4"
                style={{ borderLeftColor: band?.color || '#95A5A6' }}
              >
                <div className="flex items-start gap-3">
                  <div className="p-2 rounded-lg bg-primary/10">
                    <Icon className="w-5 h-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-heading font-semibold mb-1">{domain.domain_name}</h3>
                    <div className="flex items-center gap-2 flex-wrap">
                      <ScoreBadge score={domain.score_0_100 || 0} />
                      <Badge variant="outline">Maturity: {domain.maturity_1_5 || 1}/5 — {getMaturityLabel(domain.maturity_1_5 || 1)}</Badge>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Risk Dimension Heatmap */}
      <div className="p-8 page-break">
        <h2 className="text-2xl font-heading font-bold text-primary mb-6">Risk Dimension Heatmap</h2>
        <Card className="p-6 overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-border p-2 text-left font-heading">Domain</th>
                <th className="border border-border p-2 text-center font-heading">People</th>
                <th className="border border-border p-2 text-center font-heading">Process</th>
                <th className="border border-border p-2 text-center font-heading">Technology</th>
                <th className="border border-border p-2 text-center font-heading">Governance</th>
                <th className="border border-border p-2 text-center font-heading">Compliance</th>
              </tr>
            </thead>
            <tbody>
              {riskDimensionData.map((domain) => (
                <tr key={domain.domainKey}>
                  <td className="border border-border p-2 font-medium">{domain.domainName}</td>
                  {["people", "process", "technology", "governance", "compliance"].map((dim) => {
                    const score = domain[dim as keyof Omit<typeof domain, 'domainKey' | 'domainName'>];
                    const band = score !== null ? getScoreBand(score) : null;
                    return (
                      <td
                        key={dim}
                        className="border border-border text-center font-mono font-semibold saass-heatmap-cell"
                        style={{
                          backgroundColor: band ? band.color : 'var(--saass-bg)',
                          color: band ? band.textColor : 'inherit',
                          width: "72px",
                          height: "40px",
                        }}
                      >
                        {score === null ? "-" : Math.round(score)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
          <div className="mt-4 flex flex-wrap gap-4 text-sm">
            {SAASS_SCORE_BANDS.map((band) => (
              <div key={band.id} className="flex items-center gap-2">
                <div 
                  className="w-6 h-6 rounded" 
                  style={{ backgroundColor: band.color }}
                ></div>
                <span>{band.label} ({band.min}-{band.max})</span>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Remediation Plan */}
      {assessment.remediation_plan && (() => {
        const roadmap = parseRoadmap(assessment.remediation_plan);
        return (
          <div className="p-8">
            <h2 className="text-2xl font-heading font-bold text-primary mb-6">Remediation Roadmap</h2>
            {roadmap ? (
              <div className="grid grid-cols-3 gap-4">
                <Card className="p-4 page-break-inside-avoid">
                  <h3 className="font-heading font-semibold mb-3 text-primary">0-30 Days</h3>
                  <ul className="space-y-2">
                    {roadmap.days_30.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{stripCost(action)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4 page-break-inside-avoid">
                  <h3 className="font-heading font-semibold mb-3 text-primary">31-60 Days</h3>
                  <ul className="space-y-2">
                    {roadmap.days_60.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{stripCost(action)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
                <Card className="p-4 page-break-inside-avoid">
                  <h3 className="font-heading font-semibold mb-3 text-primary">61-90 Days</h3>
                  <ul className="space-y-2">
                    {roadmap.days_90.map((action, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <span className="text-primary mt-1">•</span>
                        <span className="text-sm">{stripCost(action)}</span>
                      </li>
                    ))}
                  </ul>
                </Card>
              </div>
            ) : (
              <Card className="p-6">
                <div className="whitespace-pre-wrap">{assessment.remediation_plan}</div>
              </Card>
            )}
          </div>
        );
      })()}

      {/* Assessment Framework */}
      <div className="p-8 page-break">
        <h2 className="text-2xl font-heading font-bold text-primary mb-6">Assessment Framework</h2>
        <Card className="p-6">
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            This Security Selfie is a <strong>Physical Security Self-Assessment</strong> built for corporate sites, campuses and facilities. It uses a focused, practitioner-oriented framework covering <strong>10 critical physical-security domains</strong> and five cross-cutting risk dimensions. The framework maps questions to Indian statutory and operational requirements (for example: PSARA/state guard licensing, minimum wages, PF, ESI, bonus, police verification and background checks, fire & building safety norms, Shops & Establishment / local labour laws) and to internationally recognised security operations guidance where relevant.
          </p>
          <p className="text-sm text-muted-foreground leading-relaxed mb-4">
            Each domain contains targeted, practical questions evaluated on a 1–5 maturity scale and aggregated to produce domain scores (0–100) and an overall organisational maturity rating (levels 1–5). This assessment is intentionally focused on <strong>physical security, guarding and site resilience</strong> rather than IT/cyber controls.
          </p>
          <div className="grid grid-cols-2 gap-4 mt-4">
            <div>
              <h4 className="font-semibold text-sm mb-2 text-foreground">10 Physical Security Domains</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• Site Profile & Risk Context</li>
                <li>• Governance, Policy & Security Organisation</li>
                <li>• Perimeter, Access Control & Physical Infrastructure</li>
                <li>• Visitor, Vendor & Contractor Management</li>
                <li>• Guarding Operations & Statutory Compliance (PSARA, PF, ESI, wages, BGV, police verification)</li>
                <li>• Electronic Security Systems (CCTV, ACS, alarms & integration)</li>
                <li>• Incident Management, SOC & Monitoring (on-site incident response)</li>
                <li>• Employee Security Culture, Awareness & Behaviour</li>
                <li>• Business Continuity, Emergency Response & Crisis Management</li>
                <li>• Compliance, Documentation & Third-Party Risk (contracts, audits, CAPA)</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-2 text-foreground">5 Risk Dimensions</h4>
              <ul className="text-xs space-y-1 text-muted-foreground">
                <li>• People — staffing, vetting, training & awareness</li>
                <li>• Process — procedures, SOPs and workflows</li>
                <li>• Technology — cameras, access control, alarms and integrations</li>
                <li>• Governance — policies, roles, oversight and reporting</li>
                <li>• Compliance — statutory adherence, licences and statutory records</li>
              </ul>
            </div>
          </div>
          <p className="text-xs text-muted-foreground mt-4 italic">
            Framework & mapping: Practitioner-focused physical-security controls mapped to Indian statutory requirements (PSARA, PF, ESI, Minimum Wages, Police verification / BGV, Fire & Building norms, Shops & Establishment) and to security-ops standards where relevant.
          </p>
        </Card>
      </div>

      {/* Legal disclaimer — full clause, page-break before so it prints together */}
      <div className="px-8">
        <ReportDisclaimerRibbon
          variant="print"
          tier={(assessment as any)?.validated_report_status === "ready" ? "validated" : "quick"}
        />
      </div>

      {/* Footer */}
      <div className="p-8 text-center text-sm text-muted-foreground">
        <p>Security Intelligence Platform — Security Selfie™</p>
        <p>Generated on {new Date().toLocaleDateString()}</p>
      </div>
    </div>
  );
}
