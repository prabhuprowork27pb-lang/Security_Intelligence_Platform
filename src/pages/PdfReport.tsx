import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { getDomainIcon } from "@/lib/domainIcons";
import { getScoreBand, SAASS_SCORE_BANDS } from "@/lib/scoring";
import { computeRiskDimensionScores } from "@/lib/riskDimensions";
import { DomainBarChart } from "@/components/charts/DomainBarChart";
import { RadarChart } from "@/components/charts/RadarChart";
import { CapaTable } from "@/components/CapaTable";
import { DomainInsightBlock } from "@/components/DomainInsightBlock";
import { EvidenceChecklist } from "@/components/EvidenceChecklist";
import { PinnedAnswersSection, type PinnedAnswer } from "@/components/PinnedAnswersSection";
import TrustSignals from "@/components/TrustSignals";
import SeverityLegend from "@/components/SeverityLegend";
import ReportWatermark from "@/components/ReportWatermark";
import IntelligenceLogo from "@/components/IntelligenceLogo";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/contexts/AuthContext";
import { stripCost } from "@/lib/stripCost";

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
  id: string;
  domain_key: string;
  question_code: string;
  question_text: string;
  rating_0_4: number;
  comment: string | null;
  evidence_note: string | null;
  assessor_comment: string | null;
}

export default function PdfReport() {
  const [searchParams] = useSearchParams();
  const assessmentId = searchParams.get("id");
  const [assessment, setAssessment] = useState<Assessment | null>(null);
  const [domainScores, setDomainScores] = useState<DomainScore[]>([]);
  const [responses, setResponses] = useState<QuestionResponse[]>([]);
  const [pinnedAnswers, setPinnedAnswers] = useState<PinnedAnswer[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const watermarkUserName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, any>;
    return (
      meta.full_name ||
      meta.name ||
      (user?.email ? user.email.split("@")[0] : "Authorised viewer")
    );
  }, [user]);
  const watermarkEmail = user?.email ?? "";

  // prePdfCapture helper for canvas -> image conversion
  useEffect(() => {
    (window as any).prePdfCapture = async function prePdfCapture(options: { timeoutMs?: number } = {}) {
      const timeoutMs = options.timeoutMs || 8000;
      try {
        // Convert canvases -> images
        const canvases = Array.from(document.querySelectorAll('canvas'));
        let converted = 0;
        const imagePromises: Promise<{ ok: boolean }>[] = [];
        
        canvases.forEach((c) => {
          try {
            const dataUrl = c.toDataURL('image/png');
            const img = document.createElement('img');
            img.src = dataUrl;
            if (c.width) img.width = c.width;
            if (c.height) img.height = c.height;
            img.style.maxWidth = '100%';
            img.alt = 'chart';
            img.style.display = getComputedStyle(c).display || 'block';
            try { c.parentNode?.replaceChild(img, c); } catch(e) { /* ignore */ }
            const p = new Promise<{ ok: boolean }>((resolve) => {
              img.onload = () => resolve({ ok: true });
              img.onerror = () => resolve({ ok: false });
            });
            imagePromises.push(p);
            converted++;
          } catch (err) {
            console.warn('canvas->img conversion error', err);
          }
        });

        // Wait for all images to load (safeguard with timeout)
        const results = await Promise.race([
          Promise.all(imagePromises),
          new Promise(resolve => setTimeout(() => resolve('timeout'), Math.min(timeoutMs, 2000)))
        ]);

        // Force visibility in case of print CSS hiding
        try {
          document.documentElement.style.visibility = 'visible';
          document.body.style.visibility = 'visible';
          document.body.style.opacity = '1';
        } catch(e) { /* ignore */ }

        // set ready flag
        (window as any).__reportReady = true;

        return {
          canvasesFound: canvases.length,
          canvasesConverted: converted,
          imageLoadResult: results === 'timeout' ? 'timeout' : 'loaded'
        };
      } catch (err) {
        console.error('prePdfCapture fatal', err);
        (window as any).__reportReady = true; // avoid permanent blocking
        return { error: String(err) };
      }
    };
  }, []);

  useEffect(() => {
    if (assessmentId) {
      fetchData();
    }
  }, [assessmentId]);

  const fetchData = async () => {
    if (!assessmentId) {
      setLoading(false);
      return;
    }

    try {
      const { data: assessmentData, error: assessmentError } = await supabase
        .from("assessments")
        .select(`
          *,
          sites(name, city, state, organisations(name))
        `)
        .eq("id", assessmentId)
        .single();

      if (assessmentError) {
        console.error("Assessment fetch error:", assessmentError);
        setLoading(false);
        return;
      }

      const { data: scoresData, error: scoresError } = await supabase
        .from("domain_scores")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("score_0_100", { ascending: true });

      if (scoresError) {
        console.error("Scores fetch error:", scoresError);
      }

      const { data: responsesData, error: responsesError } = await supabase
        .from("question_responses")
        .select("*")
        .eq("assessment_id", assessmentId);

      if (responsesError) {
        console.error("Responses fetch error:", responsesError);
      }

      const { data: pinnedData } = await (supabase as any)
        .from("pinned_smarty_answers")
        .select("*")
        .eq("assessment_id", assessmentId)
        .order("created_at", { ascending: true });

      setAssessment(assessmentData);
      setDomainScores(scoresData || []);
      setResponses(responsesData || []);
      setPinnedAnswers((pinnedData as PinnedAnswer[]) ?? []);
      setLoading(false);

      // Signal that report is ready for PDF capture and run prePdfCapture
      setTimeout(() => {
        try {
          if ((window as any).prePdfCapture) {
            (window as any).prePdfCapture().then(() => {
              (window as any).__reportReady = true;
            });
          } else {
            (window as any).__reportReady = true;
          }
        } catch(e) {
          (window as any).__reportReady = true;
        }
      }, 400);
    } catch (error) {
      console.error("Fetch data error:", error);
      setLoading(false);
    }
  };

  if (loading || !assessment) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-lg font-heading text-primary">Preparing report...</div>
      </div>
    );
  }

  const riskDimensionData = computeRiskDimensionScores(responses);
  
  // Calculate KPIs
  const criticalGaps = domainScores.filter(d => d.score_0_100 < 50).length;
  const quickWins = domainScores.filter(d => d.score_0_100 >= 50 && d.score_0_100 < 75).length;
  const topRiskDomain = domainScores.length > 0 ? domainScores[0] : null;

  // Get maturity label from level (1-5)
  const getMaturityLabel = (level: number): string => {
    const labels = ["", "Ad-hoc", "Developing", "Defined", "Managed", "Resilient"];
    return labels[level] || "";
  };

  // Parse roadmap - handle both JSON and text formats
  const parseRoadmap = () => {
    const roadmap = assessment.remediation_plan || "";
    const phases = {
      phase1: [] as { title: string; description: string }[],
      phase2: [] as { title: string; description: string }[],
      phase3: [] as { title: string; description: string }[]
    };

    // Try to parse as JSON first
    try {
      const parsed = JSON.parse(roadmap);
      
      // Handle roadmap.days_30/60/90 structure (from generate-insights)
      if (parsed.roadmap) {
        if (parsed.roadmap.days_30 && Array.isArray(parsed.roadmap.days_30)) {
          phases.phase1 = parsed.roadmap.days_30.map((action: string) => ({
            title: '',
            description: stripCost(action)
          }));
        }
        if (parsed.roadmap.days_60 && Array.isArray(parsed.roadmap.days_60)) {
          phases.phase2 = parsed.roadmap.days_60.map((action: string) => ({
            title: '',
            description: stripCost(action)
          }));
        }
        if (parsed.roadmap.days_90 && Array.isArray(parsed.roadmap.days_90)) {
          phases.phase3 = parsed.roadmap.days_90.map((action: string) => ({
            title: '',
            description: stripCost(action)
          }));
        }
      }

      // Fallback: Handle weak_domains structure - extract immediate actions for phase1
      if (phases.phase1.length === 0 && parsed.weak_domains && Array.isArray(parsed.weak_domains)) {
        parsed.weak_domains.forEach((domain: { domain: string; insights: string[] }) => {
          if (domain.insights && Array.isArray(domain.insights)) {
            domain.insights.forEach((insight: string) => {
              if (insight.toLowerCase().includes('immediate action')) {
                const match = insight.match(/immediate actions?:?\s*(.*)/i);
                if (match && match[1]) {
                  phases.phase1.push({
                    title: domain.domain,
                    description: match[1].trim().substring(0, 200) + (match[1].length > 200 ? '...' : '')
                  });
                }
              }
            });
          }
        });
      }

      // If still empty, try phases structure
      if (phases.phase1.length === 0 && phases.phase2.length === 0) {
        if (parsed.phases) {
          if (parsed.phases.phase1) phases.phase1 = parsed.phases.phase1;
          if (parsed.phases.phase2) phases.phase2 = parsed.phases.phase2;
          if (parsed.phases.phase3) phases.phase3 = parsed.phases.phase3;
        }
      }
    } catch {
      // Fall back to text parsing
      const lines = roadmap.split('\n');
      let currentPhase: 'phase1' | 'phase2' | 'phase3' | null = null;

      lines.forEach(line => {
        if (line.includes('0-30') || line.includes('Immediate')) {
          currentPhase = 'phase1';
        } else if (line.includes('31-60') || line.includes('31–60')) {
          currentPhase = 'phase2';
        } else if (line.includes('61-90') || line.includes('61–90')) {
          currentPhase = 'phase3';
        } else if (line.trim() && currentPhase && line.startsWith('-')) {
          phases[currentPhase].push({
            title: '',
            description: line.replace(/^-\s*/, '')
          });
        }
      });
    }

    return phases;
  };

  const roadmapPhases = parseRoadmap();

  // Get questions with comments for annexure
  const questionsWithComments = responses.filter(
    r => r.comment || r.evidence_note || r.assessor_comment
  );

  const handleDownloadPdf = async () => {
    // Run prePdfCapture to convert canvases to images
    if ((window as any).prePdfCapture) {
      await (window as any).prePdfCapture();
    }
    // Trigger print dialog
    window.print();
  };

  return (
    <div className="min-h-screen bg-white">
      <style>{`
        @media print {
          body { 
            font-size: 12pt; 
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print { display: none !important; }
          .page-break { page-break-after: always; }
          .page-break-inside-avoid { page-break-inside: avoid; }
          thead { display: table-header-group; }
          @page { 
            margin: 18mm 20mm 22mm 20mm; 
            size: A4 portrait; 
          }
          
          .heatmap-cell {
            width: 72px !important;
            height: 40px !important;
            min-width: 72px !important;
            min-height: 40px !important;
          }

          .pdf-print-watermark {
            display: block !important;
          }
        }
        
        .pdf-footer {
          position: fixed;
          bottom: 0;
          left: 0;
          right: 0;
          min-height: 30px;
          background: hsl(217, 33%, 8%);
          color: white;
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 12px;
          padding: 6px 20mm;
          font-size: 9pt;
        }
        .pdf-footer .pdf-footer-meta {
          opacity: 0.85;
          font-family: 'JetBrains Mono', ui-monospace, monospace;
          font-size: 8pt;
          max-width: 60%;
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }

        /* Faint diagonal "CONFIDENTIAL" watermark (visible only when printing) */
        .pdf-print-watermark {
          display: none;
          position: fixed;
          inset: 0;
          z-index: 0;
          pointer-events: none;
          align-items: center;
          justify-content: center;
        }
        .pdf-print-watermark span {
          font-family: Poppins, system-ui, sans-serif;
          font-weight: 700;
          font-size: 110pt;
          letter-spacing: 0.08em;
          color: hsl(217, 33%, 17%);
          opacity: 0.05;
          transform: rotate(-28deg);
          white-space: nowrap;
        }
        
        @media print {
          .pdf-footer {
            position: fixed;
            bottom: 0;
          }
        }
      `}</style>

      {/* Print-only diagonal watermark */}
      <div aria-hidden className="pdf-print-watermark">
        <span>CONFIDENTIAL</span>
      </div>


      {/* Download Button - Fixed position */}
      <div className="no-print fixed top-4 right-4 z-50">
        <button
          onClick={handleDownloadPdf}
          className="bg-primary text-primary-foreground px-6 py-3 rounded-lg shadow-lg hover:bg-primary/90 transition-colors font-semibold flex items-center gap-2"
        >
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="7 10 12 15 17 10" />
            <line x1="12" y1="15" x2="12" y2="3" />
          </svg>
          Download PDF
        </button>
        <p className="text-xs text-muted-foreground mt-2 text-right">
          Enable "Background graphics" for best results
        </p>
      </div>

      {/* Diagonal brand watermark — visible across the printed report */}
      <ReportWatermark
        primary="Security Intelligence Platform™"
        secondary="Intelligence Diagnostic Report"
        tertiary="Confidential · Prepared for the named organisation"
      />

      {/* Cover Page */}
      <div className="page-break min-h-screen flex flex-col justify-center p-12 bg-gradient-to-br from-primary/5 to-secondary/5">
        <div className="text-center mb-16">
          <div className="flex items-center justify-center gap-4 mb-6">
            <IntelligenceLogo size={56} className="text-primary" />
            <div className="text-left leading-tight">
              <p className="font-heading font-bold text-2xl text-foreground tracking-tight">
                {BRAND.platformTm}
              </p>
              <p className="text-[11px] uppercase tracking-[0.32em] text-secondary font-semibold mt-1">
                {BRAND.shortTm} · {BRAND.shortMeaning}
              </p>
            </div>
          </div>
          <h1 className="text-5xl font-heading font-bold text-primary mb-4">
            Intelligence Diagnostic Report
          </h1>
          <p className="text-xl text-secondary font-medium">Security Selfie™ · Operational Maturity Assessment</p>
          <div className="mt-8 text-lg text-muted-foreground">
            <p className="font-semibold">{assessment.sites?.organisations?.name}</p>
            <p>{assessment.sites?.name} • {assessment.sites?.city}, {assessment.sites?.state}</p>
          </div>
          <div className="mt-10 max-w-2xl mx-auto space-y-3">
            <TrustSignals />
            <SeverityLegend />
          </div>
        </div>

        {/* Score Badge */}
        <div className="flex justify-center mb-16">
          <div className="relative inline-flex items-center justify-center w-48 h-48 rounded-full bg-gradient-to-br from-primary to-secondary shadow-2xl">
            <div className="absolute inset-2 rounded-full bg-white flex flex-col items-center justify-center">
              <span className="text-7xl font-mono font-bold text-primary">
                {Math.round(assessment.overall_score_0_100 || 0)}
              </span>
              <span className="text-sm text-muted-foreground font-medium">Security Score</span>
            </div>
          </div>
        </div>

        {/* Risk Posture Badge */}
        <div className="text-center mb-12">
          <Badge 
            className="px-6 py-3 text-xl font-semibold"
            style={{ 
              backgroundColor: getScoreBand(assessment.overall_score_0_100)?.color || '#95A5A6',
              color: getScoreBand(assessment.overall_score_0_100)?.textColor || '#FFFFFF'
            }}
          >
            {getScoreBand(assessment.overall_score_0_100)?.label || "UNKNOWN"}
          </Badge>
          <p className="mt-4 text-lg">
            <span className="font-semibold text-foreground">Maturity Level:</span>{" "}
            <span className="font-mono text-2xl text-primary">{assessment.overall_maturity_1_5 || 0}</span>
            <span className="text-muted-foreground"> / 5</span>{" "}
            <span className="text-secondary font-medium">({getMaturityLabel(assessment.overall_maturity_1_5 || 0)})</span>
          </p>
        </div>

        {/* Methodology Box */}
        <Card className="p-6 max-w-2xl mx-auto">
          <h3 className="font-heading font-semibold text-lg mb-3 text-primary">Assessment Methodology</h3>
          <p className="text-sm text-muted-foreground leading-relaxed">
            This Physical Security Self-Assessment evaluates security maturity across <strong>10 critical physical-security domains</strong> using a practitioner-focused framework mapped to Indian statutory requirements and security-ops standards. Each domain is scored on a 0-100 scale and mapped to maturity levels (1-5). Risk dimensions (People, Process, Technology, Governance, Compliance) provide granular insights into organizational capability gaps.
          </p>
        </Card>

        {/* Assessment Details */}
        <div className="grid grid-cols-3 gap-6 max-w-4xl mx-auto mt-12">
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Assessment Date</p>
            <p className="font-semibold text-foreground">
              {new Date(assessment.created_at).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </p>
          </Card>
          <Card className="p-4 text-center">
            <p className="text-sm text-muted-foreground mb-1">Assessor</p>
            <p className="font-semibold text-foreground">{assessment.created_by_name}</p>
            <p className="text-xs text-muted-foreground">{assessment.created_by_role}</p>
          </Card>
          {(assessment as any)?.validated_report_status === "ready" ? (
            <Card className="p-4 text-center border-l-4 border-l-accent">
              <p className="text-sm text-muted-foreground mb-1">Reviewed & Validated By</p>
              <p className="font-semibold text-foreground">
                {(assessment as any).reviewed_by_name ?? "SIP™ Advisory Team"}
              </p>
              <p className="text-xs text-muted-foreground">
                {(assessment as any).reviewed_by_role ?? "Validated Intelligence Review"}
              </p>
              <p className="text-[10px] text-muted-foreground mt-1 italic">— Digital signature on file —</p>
            </Card>
          ) : (
            <Card className="p-4 text-center border-l-4 border-l-secondary">
              <p className="text-sm text-muted-foreground mb-1">Report Type</p>
              <p className="font-semibold text-foreground">SIP™ Intelligence Engine</p>
              <p className="text-xs text-muted-foreground">Auto-generated Quick Intelligence Report</p>
            </Card>
          )}
        </div>
      </div>

      {/* Page 1: Executive Snapshot */}
      <div className="page-break p-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-8 border-b-2 border-secondary pb-3">
          Executive Snapshot
        </h2>

        {/* KPI Strip */}
        <div className="grid grid-cols-3 gap-4 mb-10">
          <Card className="p-6 border-l-4 border-l-primary">
            <p className="text-sm text-muted-foreground mb-1">Overall Score</p>
            <p className="text-4xl font-mono font-bold text-primary">
              {Math.round(assessment.overall_score_0_100)}
            </p>
          </Card>
          <Card className="p-6 border-l-4 border-l-secondary">
            <p className="text-sm text-muted-foreground mb-1">Maturity Level</p>
            <p className="text-4xl font-mono font-bold text-secondary">
              {assessment.overall_maturity_1_5} / 5
            </p>
            <p className="text-sm text-muted-foreground mt-1">{getMaturityLabel(assessment.overall_maturity_1_5 || 0)}</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-[#C0392B]">
            <p className="text-sm text-muted-foreground mb-1">Risk Posture</p>
            <p className="text-2xl font-semibold text-foreground">
              {assessment.risk_posture}
            </p>
          </Card>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-10">
          <Card className="p-6 border-l-4 border-l-[#C0392B]">
            <p className="text-sm text-muted-foreground mb-1">Critical Gaps</p>
            <p className="text-4xl font-mono font-bold text-[#C0392B]">{criticalGaps}</p>
            <p className="text-xs text-muted-foreground mt-1">Domains &lt; 50</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-[#F5B041]">
            <p className="text-sm text-muted-foreground mb-1">Quick Wins</p>
            <p className="text-4xl font-mono font-bold text-[#F5B041]">{quickWins}</p>
            <p className="text-xs text-muted-foreground mt-1">Domains 50-75</p>
          </Card>
          <Card className="p-6 border-l-4 border-l-[#2ECC71]">
            <p className="text-sm text-muted-foreground mb-1">Top Risk Domain</p>
            <p className="text-xl font-semibold text-foreground truncate">
              {topRiskDomain?.domain_name || "N/A"}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Lowest Score</p>
          </Card>
        </div>

        {/* 3-Column Summary */}
        <div className="grid grid-cols-3 gap-6">
          <Card className="p-6 page-break-inside-avoid">
            <h3 className="font-heading font-semibold text-lg mb-4 text-[#2ECC71]">Strengths</h3>
            <ul className="space-y-2 text-sm">
              {domainScores
                .filter(d => d.score_0_100 >= 75)
                .slice(0, 5)
                .map(d => (
                  <li key={d.domain_key} className="flex items-start gap-2">
                    <span className="text-[#2ECC71] mt-1">✓</span>
                    <span>{d.domain_name} ({Math.round(d.score_0_100)})</span>
                  </li>
                ))}
              {domainScores.filter(d => d.score_0_100 >= 75).length === 0 && (
                <li className="text-muted-foreground italic">No domains above 75</li>
              )}
            </ul>
          </Card>

          <Card className="p-6 page-break-inside-avoid">
            <h3 className="font-heading font-semibold text-lg mb-4 text-[#F5B041]">Opportunities</h3>
            <ul className="space-y-2 text-sm">
              {domainScores
                .filter(d => d.score_0_100 >= 50 && d.score_0_100 < 75)
                .slice(0, 5)
                .map(d => (
                  <li key={d.domain_key} className="flex items-start gap-2">
                    <span className="text-[#F5B041] mt-1">→</span>
                    <span>{d.domain_name} ({Math.round(d.score_0_100)})</span>
                  </li>
                ))}
              {domainScores.filter(d => d.score_0_100 >= 50 && d.score_0_100 < 75).length === 0 && (
                <li className="text-muted-foreground italic">No domains 50-75</li>
              )}
            </ul>
          </Card>

          <Card className="p-6 page-break-inside-avoid">
            <h3 className="font-heading font-semibold text-lg mb-4 text-[#C0392B]">Critical Risks</h3>
            <ul className="space-y-2 text-sm">
              {domainScores
                .filter(d => d.score_0_100 < 50)
                .slice(0, 5)
                .map(d => (
                  <li key={d.domain_key} className="flex items-start gap-2">
                    <span className="text-[#C0392B] mt-1">!</span>
                    <span>{d.domain_name} ({Math.round(d.score_0_100)})</span>
                  </li>
                ))}
              {domainScores.filter(d => d.score_0_100 < 50).length === 0 && (
                <li className="text-muted-foreground italic">No critical risks</li>
              )}
            </ul>
          </Card>
        </div>

        {/* Executive Summary */}
        {assessment.executive_summary && (
          <Card className="p-6 mt-8 page-break-inside-avoid">
            <h3 className="font-heading font-semibold text-lg mb-4 text-primary">Executive Summary</h3>
            <p className="text-sm leading-relaxed whitespace-pre-wrap text-foreground">
              {assessment.executive_summary}
            </p>
          </Card>
        )}
      </div>

      {/* Page 2: Domain Overview */}
      <div className="page-break p-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-8 border-b-2 border-secondary pb-3">
          Domain Overview
        </h2>

        <div className="grid grid-cols-2 gap-8">
          {/* Bar Chart */}
          <div className="page-break-inside-avoid">
            <h3 className="font-heading font-semibold text-lg mb-4 text-foreground">
              Domain Scores
            </h3>
            <DomainBarChart domains={domainScores} />
          </div>

          {/* Radar Chart */}
          <div className="page-break-inside-avoid">
            <h3 className="font-heading font-semibold text-lg mb-4 text-foreground">
              Maturity Radar
            </h3>
            <RadarChart domains={domainScores} />
          </div>
        </div>

        {/* Domain Commentary */}
        <div className="mt-8 space-y-4">
          {domainScores.slice(0, 3).map(domain => {
            const Icon = getDomainIcon(domain.domain_key);
            return (
              <Card key={domain.domain_key} className="p-6 page-break-inside-avoid">
                <div className="flex items-start gap-4">
                  <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                    <Icon className="w-6 h-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-heading font-semibold text-foreground">
                        {domain.domain_name}
                      </h4>
                      <div className="flex items-center gap-3">
                        <span 
                          className="text-2xl font-mono font-bold"
                          style={{ color: getScoreBand(domain.score_0_100)?.color || '#95A5A6' }}
                        >
                          {Math.round(domain.score_0_100)}
                        </span>
                        <Badge variant="outline">L{domain.maturity_1_5}</Badge>
                      </div>
                    </div>
                    {domain.commentary && (
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {domain.commentary}
                      </p>
                    )}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* Page 3: Risk Dimension Heatmap */}
      <div className="page-break p-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-8 border-b-2 border-secondary pb-3">
          Risk Dimension Heatmap
        </h2>
        
        <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
          This heatmap visualizes security capability across five risk dimensions for each domain. 
          Red indicates high risk (&lt;50), amber shows medium risk (50-75), and green represents 
          low risk (&gt;75). Empty cells indicate no questions mapped to that dimension.
        </p>

        <Card className="p-6 overflow-x-auto page-break-inside-avoid">
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="border border-border p-3 text-left font-heading bg-muted text-sm">
                  Domain
                </th>
                <th className="border border-border p-3 text-center font-heading bg-muted text-sm">
                  People
                </th>
                <th className="border border-border p-3 text-center font-heading bg-muted text-sm">
                  Process
                </th>
                <th className="border border-border p-3 text-center font-heading bg-muted text-sm">
                  Technology
                </th>
                <th className="border border-border p-3 text-center font-heading bg-muted text-sm">
                  Governance
                </th>
                <th className="border border-border p-3 text-center font-heading bg-muted text-sm">
                  Compliance
                </th>
              </tr>
            </thead>
            <tbody>
              {riskDimensionData.map((domain) => (
                <tr key={domain.domainKey}>
                  <td className="border border-border p-3 font-medium text-sm bg-muted/30">
                    {domain.domainName}
                  </td>
                  {["people", "process", "technology", "governance", "compliance"].map((dim) => {
                    const score = domain[dim as keyof Omit<typeof domain, 'domainKey' | 'domainName'>];
                    const bgColor =
                      score === null
                        ? "transparent"
                        : score < 50
                        ? "#C0392B"
                        : score < 75
                        ? "#F5B041"
                        : "#2ECC71";
                    return (
                      <td
                        key={dim}
                        className="border border-border p-3 text-center font-mono font-semibold text-sm heatmap-cell"
                        style={{
                          backgroundColor: bgColor,
                          color: score === null ? "inherit" : "white",
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
          
          {/* Legend */}
          <div className="mt-6 flex gap-6 text-xs">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: "#C0392B" }}></div>
              <span className="text-muted-foreground">High Risk (&lt;50)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: "#F5B041" }}></div>
              <span className="text-muted-foreground">Medium Risk (50-75)</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded" style={{ backgroundColor: "#2ECC71" }}></div>
              <span className="text-muted-foreground">Low Risk (&gt;75)</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Pages 4-9: Domain Deep Dives (continued on next pages) */}
      {domainScores.slice(3).map((domain, idx) => (
        <div key={domain.domain_key} className={idx < domainScores.length - 4 ? "page-break p-12" : "p-12"}>
          {idx === 0 && (
            <h2 className="text-3xl font-heading font-bold text-primary mb-8 border-b-2 border-secondary pb-3">
              Domain Deep Dive
            </h2>
          )}
          <Card className="p-6 page-break-inside-avoid">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
                {(() => {
                  const Icon = getDomainIcon(domain.domain_key);
                  return <Icon className="w-8 h-8 text-primary" />;
                })()}
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-heading font-semibold text-xl text-foreground">
                    {domain.domain_name}
                  </h3>
                  <div className="flex items-center gap-3">
                    <span 
                      className="text-3xl font-mono font-bold"
                      style={{ color: getScoreBand(domain.score_0_100)?.color || '#95A5A6' }}
                    >
                      {Math.round(domain.score_0_100)}
                    </span>
                    <Badge variant="outline" className="text-base">
                      Maturity L{domain.maturity_1_5}
                    </Badge>
                  </div>
                </div>
                {domain.commentary && (
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {domain.commentary}
                  </p>
                )}
                <DomainInsightBlock
                  domainKey={domain.domain_key}
                  domainName={domain.domain_name}
                  score={domain.score_0_100}
                  variant="print"
                />
              </div>
            </div>
          </Card>
        </div>
      ))}

      {/* Page 10: 30/60/90 Roadmap */}
      <div className="page-break p-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-8 border-b-2 border-secondary pb-3">
          Remediation Roadmap
        </h2>

        <div className="grid grid-cols-3 gap-6">
          {/* 0-30 Days */}
          <Card className="p-6 border-t-4 border-t-[#C0392B] page-break-inside-avoid">
            <h3 className="font-heading font-semibold text-lg mb-4 text-[#C0392B]">
              0-30 Days
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Immediate Actions</p>
            <ul className="space-y-3 text-sm">
              {roadmapPhases.phase1.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#C0392B] mt-1 flex-shrink-0">•</span>
                  <div className="leading-relaxed">
                    {item.title && <strong className="block text-foreground">{item.title}</strong>}
                    <span className="text-muted-foreground">{item.description}</span>
                  </div>
                </li>
              ))}
              {roadmapPhases.phase1.length === 0 && (
                <li className="text-muted-foreground italic">No immediate actions</li>
              )}
            </ul>
          </Card>

          {/* 31-60 Days */}
          <Card className="p-6 border-t-4 border-t-[#F5B041] page-break-inside-avoid">
            <h3 className="font-heading font-semibold text-lg mb-4 text-[#F5B041]">
              31-60 Days
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Short-term Improvements</p>
            <ul className="space-y-3 text-sm">
              {roadmapPhases.phase2.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#F5B041] mt-1 flex-shrink-0">•</span>
                  <div className="leading-relaxed">
                    {item.title && <strong className="block text-foreground">{item.title}</strong>}
                    <span className="text-muted-foreground">{item.description}</span>
                  </div>
                </li>
              ))}
              {roadmapPhases.phase2.length === 0 && (
                <li className="text-muted-foreground italic">No short-term actions</li>
              )}
            </ul>
          </Card>

          {/* 61-90 Days */}
          <Card className="p-6 border-t-4 border-t-[#2ECC71] page-break-inside-avoid">
            <h3 className="font-heading font-semibold text-lg mb-4 text-[#2ECC71]">
              61-90 Days
            </h3>
            <p className="text-xs text-muted-foreground mb-4">Strategic Initiatives</p>
            <ul className="space-y-3 text-sm">
              {roadmapPhases.phase3.map((item, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-[#2ECC71] mt-1 flex-shrink-0">•</span>
                  <div className="leading-relaxed">
                    {item.title && <strong className="block text-foreground">{item.title}</strong>}
                    <span className="text-muted-foreground">{item.description}</span>
                  </div>
                </li>
              ))}
              {roadmapPhases.phase3.length === 0 && (
                <li className="text-muted-foreground italic">No strategic actions</li>
              )}
            </ul>
          </Card>
        </div>
      </div>

      {/* Page 11: CAPA / Action Tracker */}
      <div className="page-break p-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-8 border-b-2 border-secondary pb-3">
          Corrective & Preventive Actions (CAPA)
        </h2>
        <CapaTable domainScores={domainScores} />
      </div>

      {/* Page 12: Annexure */}
      {questionsWithComments.length > 0 && (
        <div className="page-break p-12">
          <h2 className="text-3xl font-heading font-bold text-primary mb-8 border-b-2 border-secondary pb-3">
            Annexure: Question-Level Details
          </h2>
          
          <div className="space-y-4">
            {questionsWithComments.map((q) => (
              <Card key={q.id} className="p-4 page-break-inside-avoid">
                <div className="mb-2">
                  <Badge variant="outline" className="text-xs mb-2">
                    {q.question_code}
                  </Badge>
                  <p className="text-sm font-medium text-foreground mb-2">
                    {q.question_text}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Rating: <span className="font-mono font-semibold">{q.rating_0_4}/5</span>{" "}
                    <span className="text-muted-foreground">({getMaturityLabel(q.rating_0_4)})</span>
                  </p>
                </div>
                {q.comment && (
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-foreground">Comment:</span>
                    <p className="text-muted-foreground mt-1">{q.comment}</p>
                  </div>
                )}
                {q.evidence_note && (
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-foreground">Evidence:</span>
                    <p className="text-muted-foreground mt-1">{q.evidence_note}</p>
                  </div>
                )}
                {q.assessor_comment && (
                  <div className="mt-2 text-xs">
                    <span className="font-semibold text-foreground">Assessor Note:</span>
                    <p className="text-muted-foreground mt-1">{q.assessor_comment}</p>
                  </div>
                )}
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Last Page: Methodology & Contact */}
      <div className="p-12">
        <h2 className="text-3xl font-heading font-bold text-primary mb-8 border-b-2 border-secondary pb-3">
          Methodology & Framework
        </h2>

        <div className="space-y-6">
          <Card className="p-6">
            <h3 className="font-heading font-semibold text-lg mb-3 text-primary">
              Assessment Framework
            </h3>
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

          {/* Evidence checklist for low-scoring domains */}
          <EvidenceChecklist domains={domainScores} compact />

          {/* Pinned SMARTY advisor notes saved as part of this report */}
          <PinnedAnswersSection pinned={pinnedAnswers} compact />

          <Card className="p-6">

            <h3 className="font-heading font-semibold text-lg mb-3 text-primary">
              Glossary — Maturity Scale (1–5)
            </h3>
            <p className="text-xs text-muted-foreground mb-3">
              Each question is rated on a 1–5 maturity scale. Ratings are aggregated within
              each domain and normalised to a 0–100 score.
            </p>
            <div className="grid grid-cols-5 gap-3 text-xs">
              <div className="text-center p-3 bg-[#E74C3C]/10 rounded-lg">
                <p className="font-mono font-bold text-[#E74C3C] text-2xl">1</p>
                <p className="text-foreground font-semibold mt-1">Ad-hoc</p>
                <p className="text-muted-foreground mt-1 text-[10pt] leading-snug">Informal, reactive</p>
              </div>
              <div className="text-center p-3 bg-[#F5B041]/10 rounded-lg">
                <p className="font-mono font-bold text-[#F5B041] text-2xl">2</p>
                <p className="text-foreground font-semibold mt-1">Developing</p>
                <p className="text-muted-foreground mt-1 text-[10pt] leading-snug">Inconsistent</p>
              </div>
              <div className="text-center p-3 bg-[#F1C40F]/10 rounded-lg">
                <p className="font-mono font-bold text-[#F1C40F] text-2xl">3</p>
                <p className="text-foreground font-semibold mt-1">Defined</p>
                <p className="text-muted-foreground mt-1 text-[10pt] leading-snug">Documented</p>
              </div>
              <div className="text-center p-3 bg-[#1877F2]/10 rounded-lg">
                <p className="font-mono font-bold text-[#1877F2] text-2xl">4</p>
                <p className="text-foreground font-semibold mt-1">Managed</p>
                <p className="text-muted-foreground mt-1 text-[10pt] leading-snug">Measured, with owners</p>
              </div>
              <div className="text-center p-3 bg-[#2ECC71]/10 rounded-lg">
                <p className="font-mono font-bold text-[#2ECC71] text-2xl">5</p>
                <p className="text-foreground font-semibold mt-1">Resilient</p>
                <p className="text-muted-foreground mt-1 text-[10pt] leading-snug">Continuously improving</p>
              </div>
            </div>
            <h4 className="font-heading font-semibold text-sm mt-5 mb-2 text-primary">
              Score Bands (aggregated, 0–100)
            </h4>
            <div className="space-y-1.5">
              {SAASS_SCORE_BANDS.map((band) => (
                <div
                  key={band.id}
                  className="flex items-start gap-3 rounded-md border p-2"
                  style={{ borderLeftColor: band.color, borderLeftWidth: 4 }}
                >
                  <div
                    className="px-2 py-0.5 rounded text-[10pt] font-bold tracking-wide shrink-0"
                    style={{ backgroundColor: band.color, color: band.textColor }}
                  >
                    {band.label}
                  </div>
                  <div className="text-[10pt]">
                    <span className="font-semibold text-foreground">{band.min}–{band.max}: </span>
                    <span className="text-muted-foreground">{band.description}</span>
                  </div>
                </div>
              ))}
            </div>
            <p className="text-[10pt] text-muted-foreground mt-3 italic">
              How to read a domain score: compare the band (qualitative posture) with the
              numeric score (relative performance). Lower bands warrant prioritised
              remediation; higher bands indicate areas to sustain and optimise.
            </p>
          </Card>

          <Card className="p-6 bg-primary/5">
            <h3 className="font-heading font-semibold text-lg mb-3 text-primary">
              Contact & Support
            </h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div>
                <p className="font-semibold text-foreground mb-2">Security Intelligence Platform</p>
                <p className="text-muted-foreground">Security Selfie™</p>
                <p className="text-muted-foreground mt-1">support@securityintelligence.com</p>
              </div>
              <div>
                <p className="font-semibold text-foreground mb-2">Report Generated</p>
                <p className="text-muted-foreground">
                  {new Date().toLocaleDateString('en-US', { 
                    year: 'numeric', 
                    month: 'long', 
                    day: 'numeric' 
                  })}
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      {/* Footer (appears on every page in print) */}
      <div className="pdf-footer">
        <span>Security Intelligence Platform · Security Selfie™</span>
        <span className="pdf-footer-meta">
          Confidential – Generated for {watermarkUserName}
          {watermarkEmail ? ` | ${watermarkEmail}` : ""}
          {assessment.sites?.name ? ` | ${assessment.sites.name}` : ""}
        </span>
      </div>
    </div>
  );
}
