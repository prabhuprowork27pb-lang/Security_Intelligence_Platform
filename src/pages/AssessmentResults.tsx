import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Sparkles, FileText, MessageSquare, AlertTriangle, Home, BookOpen, Clock, CheckCircle2, Loader2 } from "lucide-react";
import { getScoreBand, SAASS_SCORE_BANDS, sanitizeReportText } from "@/lib/scoring";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getDomainIcon } from "@/lib/domainIcons";
import { DslrLeadForm } from "@/components/DslrLeadForm";
import { AskSaassPanel } from "@/components/AskSaassPanel";
import { RemediationRoadmap } from "@/components/RemediationRoadmap";
import { DomainCard } from "@/components/DomainCard";
import { DomainInsightBlock } from "@/components/DomainInsightBlock";
import { ScoreGlossary } from "@/components/ScoreGlossary";
import { EvidenceChecklist } from "@/components/EvidenceChecklist";
import { PinnedAnswersSection, type PinnedAnswer } from "@/components/PinnedAnswersSection";
import { ScoreGauge } from "@/components/ScoreGauge";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Cell } from "recharts";
import { useToast } from "@/hooks/use-toast";
import { RiskHeatmap } from "@/components/RiskHeatmap";
import { computeRiskDimensionScores, type DomainRiskScores } from "@/lib/riskDimensions";
import ConfidentialWatermark from "@/components/ConfidentialWatermark";
import IntelligenceLogo from "@/components/IntelligenceLogo";
import ReportOwnershipBanner from "@/components/ReportOwnershipBanner";
import TrustSignals from "@/components/TrustSignals";
import SeverityLegend from "@/components/SeverityLegend";
import AuditTrail from "@/components/AuditTrail";
import ValidatedReportSection from "@/components/ValidatedReportSection";
import ReportDisclaimerRibbon from "@/components/ReportDisclaimerRibbon";
import { useUserRole } from "@/hooks/useUserRole";

const AssessmentResults = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const [assessment, setAssessment] = useState<any>(null);
  const [domainScores, setDomainScores] = useState<any[]>([]);
  const [riskDimensionData, setRiskDimensionData] = useState<DomainRiskScores[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [generatingInsights, setGeneratingInsights] = useState(false);
  const [dslrFormOpen, setDslrFormOpen] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const [askSaasPanelOpen, setAskSaasPanelOpen] = useState(false);
  const [smartyPrefill, setSmartyPrefill] = useState<string | undefined>();
  const [pinnedAnswers, setPinnedAnswers] = useState<PinnedAnswer[]>([]);
  const [signatureFinding, setSignatureFinding] = useState<string | null>(null);
  const [detectedPatterns, setDetectedPatterns] = useState<string[]>([]);
  const [weakDomainFindings, setWeakDomainFindings] = useState<Array<{ domain: string; score?: number; findings: string[] }>>([]);
  const autoGenStartedRef = useRef(false);

  const askSmartyAbout = (domainName: string, score: number) => {
    const rounded = Math.round(score);
    const question = `Provide a structured analysis of the "${domainName}" domain (current score: ${rounded}/100). Cover: 1) the most likely root causes for this score, 2) the operational risks it creates, 3) 3–5 prioritised actions for the next 30/60/90 days, and 4) what evidence I should ask my team for to validate improvement.`;
    // Append a zero-width space nonce so the same domain can be re-asked.
    setSmartyPrefill(question + "\u200B".repeat((smartyPrefill?.match(/\u200B/g)?.length ?? 0) + 1));
    setAskSaasPanelOpen(true);
  };

  const fetchPinnedAnswers = useCallback(async () => {
    const { data } = await supabase
      .from("pinned_smarty_answers" as any)
      .select("*")
      .eq("assessment_id", id)
      .order("created_at", { ascending: true })
      .returns<PinnedAnswer[]>();
    setPinnedAnswers(data ?? []);
  }, [id]);

  const fetchData = useCallback(async () => {
    setLoadError(null);
    setLoading(true);
    try {
      const [assessmentRes, scoresRes, responsesRes] = await Promise.all([
        supabase
          .from("assessments")
          .select("*, sites(name, city)")
          .eq("id", id)
          .maybeSingle(),
        supabase
          .from("domain_scores")
          .select("*")
          .eq("assessment_id", id)
          .order("score_0_100", { ascending: false }),
        supabase
          .from("question_responses")
          .select("domain_key, question_code, rating_0_4")
          .eq("assessment_id", id),
      ]);

      if (assessmentRes.error || scoresRes.error || responsesRes.error) {
        throw assessmentRes.error || scoresRes.error || responsesRes.error;
      }
      if (!assessmentRes.data) {
        setLoadError("We couldn't find this assessment. It may have been removed or you may not have access.");
        return;
      }

      setAssessment(assessmentRes.data);
      setDomainScores(scoresRes.data || []);
      if (responsesRes.data) {
        setRiskDimensionData(computeRiskDimensionScores(responsesRes.data));
      }

      // Parse the AI intelligence payload from remediation_plan (stored as JSON string)
      try {
        const parsed = JSON.parse(assessmentRes.data.remediation_plan || "{}");
        const rawSig = parsed.signature_finding ?? null;
        setSignatureFinding(rawSig ? sanitizeReportText(rawSig, assessmentRes.data.overall_score_0_100) : null);
        setDetectedPatterns(Array.isArray(parsed.detected_patterns) ? parsed.detected_patterns : []);
        const weak = Array.isArray(parsed.weak_domains) ? parsed.weak_domains : [];
        setWeakDomainFindings(
          weak.map((d: any) => ({
            domain: d.domain,
            score: d.score,
            findings: d.findings || d.insights || [],
          })).filter((d: any) => d.domain && Array.isArray(d.findings) && d.findings.length > 0)
        );
      } catch {
        setSignatureFinding(null);
        setDetectedPatterns([]);
        setWeakDomainFindings([]);
      }

      await fetchPinnedAnswers();
    } catch (err: any) {
      console.error("Failed to load assessment:", err);
      setLoadError(err?.message ?? "We couldn't load this assessment. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [id, fetchPinnedAnswers]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const generateInsights = async () => {
    setGeneratingInsights(true);
    try {
      const { error } = await supabase.functions.invoke("generate-insights", {
        body: { assessment_id: id },
      });
      if (error) throw error;
      await fetchData();
    } catch (err: any) {
      console.error("generate-insights failed:", err);
      toast({
        title: "Couldn't generate insights",
        description: err?.message ?? "Please try again in a moment.",
        variant: "destructive",
      });
    } finally {
      setGeneratingInsights(false);
    }
  };

  // Auto-kick generation on first load if the report payload is missing.
  useEffect(() => {
    if (!assessment) return;
    if (autoGenStartedRef.current) return;
    if (generatingInsights) return;
    const needs = !assessment.executive_summary;
    if (!needs) return;
    autoGenStartedRef.current = true;
    generateInsights();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assessment]);


  const downloadPdf = async () => {
    setDownloadingPdf(true);
    try {
      // Open the PDF report page directly in a new tab
      const pdfUrl = `/pdf-report?id=${id}`;
      window.open(pdfUrl, '_blank');

      toast({
        title: "PDF Report Opened",
        description: "Use Ctrl+P (or Cmd+P on Mac) to save as PDF. Enable 'Background graphics' for best results.",
      });
    } catch (error) {
      console.error(error);
      toast({
        title: "Error",
        description: "Failed to open PDF report.",
        variant: "destructive",
      });
    } finally {
      setDownloadingPdf(false);
    }
  };

  const getRiskPostureBadge = (posture: string) => {
    // Map risk posture to SIP score band colors
    const band = getScoreBand(assessment?.overall_score_0_100 || 0);
    if (band) {
      return {
        variant: "default" as const,
        className: `text-[${band.textColor}]`,
        style: { backgroundColor: band.color, color: band.textColor }
      };
    }
    return { variant: "outline" as const, className: "", style: {} };
  };

  if (loadError) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-destructive" />
          <h2 className="text-xl font-heading font-semibold mb-2">Could Not Load Report</h2>
          <p className="text-muted-foreground mb-6">{loadError}</p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => { setLoadError(null); setLoading(true); fetchData(); }}>
              Try Again
            </Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              Back to Dashboard
            </Button>
          </div>
        </Card>
      </div>
    );
  }


  if (loading || !assessment) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading results...</p>
        </div>
      </div>
    );
  }

  if (assessment.status === 'draft' || !assessment.overall_score_0_100) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-4">
        <Card className="p-8 max-w-md text-center">
          <AlertTriangle className="h-16 w-16 mx-auto mb-4 text-score-medium" />
          <h2 className="text-xl font-heading font-semibold mb-2">Assessment Not Completed</h2>
          <p className="text-muted-foreground mb-4">
            This assessment is still in draft status. Please complete all questions to see results.
          </p>
          <div className="flex flex-col gap-2">
            <Button onClick={() => navigate(`/assessments/${id}/edit`)}>
              Continue Assessment
            </Button>
            <Button variant="outline" onClick={() => navigate(`/sites/${assessment.site_id}`)}>
              View Site Details
            </Button>
            <Button variant="ghost" onClick={() => navigate("/")}>
              <Home className="mr-2 h-4 w-4" />
              Go Home
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  // Validated review gating: clients only see the full report once a specialist
  // has marked the diagnostic as "report_ready". Admins always have access.
  if (!isAdmin && assessment.review_status && assessment.review_status !== "report_ready") {
    navigate(`/assessments/${id}/submitted`, { replace: true });
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center text-muted-foreground">Redirecting…</div>
      </div>
    );
  }

  const riskBadgeStyle = getRiskPostureBadge(assessment.risk_posture);

  return (
    <div className="min-h-dvh bg-background relative">
      <ConfidentialWatermark
        siteName={assessment?.sites?.name}
        dateIso={assessment?.created_at}
      />
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                onClick={() => navigate("/")}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <Home className="mr-2 h-4 w-4" />
                Home
              </Button>
              <div className="border-l border-primary-foreground/20 pl-4 flex items-center gap-3">
                <IntelligenceLogo size={28} className="text-primary-foreground" />
                <div className="leading-tight">
                  <p className="text-base md:text-lg font-heading font-semibold tracking-tight">
                    Security Intelligence Platform<sup className="text-[9px] opacity-80 ml-0.5">™</sup>
                  </p>
                  <p className="text-[10px] uppercase tracking-[0.28em] text-primary-foreground/75 font-medium">
                    SIP™ · Structured · Intelligent · Practicable
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setAskSaasPanelOpen(!askSaasPanelOpen)}
                className="text-primary-foreground hover:bg-primary-foreground/10 lg:hidden"
              >
                <MessageSquare className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8 max-w-7xl">
        <ReportOwnershipBanner
          siteName={assessment?.sites?.name}
          assessmentDate={assessment?.created_at}
        />
        <TrustSignals className="mb-4 -mt-1 px-1" />
        <AuditTrail
          className="mb-4"
          createdAt={assessment?.created_at}
          submittedAt={assessment?.submitted_at}
          reportReadyAt={assessment?.report_ready_at}
          reviewedByName={assessment?.reviewed_by_name}
          reviewedByRole={assessment?.reviewed_by_role}
          validatedAt={assessment?.validated_report_ready_at}
          reportTier={assessment?.validated_report_status === "ready" ? "validated" : "quick"}
        />
        <SeverityLegend className="mb-6" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content Area */}
          <div className="lg:col-span-2 space-y-8">
            {/* Report tier banner — Quick (auto) vs Validated (Advisory Team) */}
            {assessment.validated_report_status === "ready" ? (
              <Card className="p-4 border-l-4 border-l-emerald-600 bg-emerald-500/[0.06]">
                <div className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 mt-0.5 text-emerald-600 shrink-0" />
                  <p className="text-sm text-foreground">
                    <span className="font-semibold">Specialist Validated</span> — Reviewed and
                    validated by the SIP™ Advisory Team. This is your Security Selfie™ —
                    Validated Intelligence Report.
                  </p>
                </div>
              </Card>
            ) : null}

            {/* Validated Report Section (renders pending state or full content) */}
            <ValidatedReportSection
              status={assessment.validated_report_status}
              readyAt={assessment.validated_report_ready_at}
              generatedBy={assessment.validated_report_generated_by}
              payload={assessment.validated_report_payload}
            />

            {/* Hero Section */}
            <div className="relative overflow-hidden">
              <Card className="p-8 bg-gradient-to-br from-primary to-primary/80 text-primary-foreground border-0 shadow-xl">
                <div className="flex flex-col md:flex-row items-center justify-between gap-8">
                  <div className="flex-1 text-center md:text-left">
                    <Badge className="mb-3 bg-primary-foreground/20 text-primary-foreground border-primary-foreground/30">
                      {assessment.validated_report_status === "ready"
                        ? "Security Selfie™ — Validated Intelligence Report"
                        : "Security Selfie™ — Quick Intelligence Report"}
                    </Badge>
                    <h1 className="text-3xl md:text-4xl font-heading font-bold mb-2">
                      {assessment.sites.name}
                    </h1>
                    <p className="text-primary-foreground/80 mb-4">
                      {assessment.sites.city}
                    </p>
                    <div className="flex flex-wrap items-center gap-3 justify-center md:justify-start">
                      <Badge className={riskBadgeStyle.className} variant={riskBadgeStyle.variant}>
                        {assessment.risk_posture}
                      </Badge>
                      <Badge variant="outline" className="bg-primary-foreground/10 text-primary-foreground border-primary-foreground/30">
                        Maturity Level {assessment.overall_maturity_1_5}/5
                      </Badge>
                      {assessment.validated_report_status === "ready" && (
                        <Badge variant="outline" className="bg-accent/15 text-primary-foreground border-primary-foreground/30">
                          ✓ Reviewed & Validated
                        </Badge>
                      )}
                    </div>
                    {assessment.validated_report_status === "ready" ? (
                      (assessment.reviewed_by_name || assessment.report_ready_at) && (
                        <p className="text-xs text-primary-foreground/75 mt-3">
                          Reviewed & validated by{" "}
                          <span className="font-semibold text-primary-foreground">
                            {assessment.reviewed_by_name ?? "SIP™ Advisory Team"}
                          </span>
                          {assessment.reviewed_by_role ? `, ${assessment.reviewed_by_role}` : ""}
                          {assessment.report_ready_at
                            ? ` · ${new Date(assessment.report_ready_at).toLocaleDateString()}`
                            : ""}
                        </p>
                      )
                    ) : (
                      <p className="text-xs text-primary-foreground/75 mt-3">
                        Auto-generated by the SIP™ Intelligence Engine
                        {assessment.report_ready_at
                          ? ` · ${new Date(assessment.report_ready_at).toLocaleDateString()}`
                          : ""}
                      </p>
                    )}
                  </div>
                  <div className="shrink-0">
                    <ScoreGauge score={assessment.overall_score_0_100} size="lg" showLabel={false} />
                  </div>
                </div>
              </Card>
            </div>

            {/* Signature Finding — the one-line pattern this diagnostic reveals */}
            {signatureFinding ? (
              <Card className="p-6 border-l-4 border-l-secondary bg-secondary/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-[11px] uppercase tracking-wider text-secondary mb-2 font-semibold">
                      Signature Finding
                    </p>
                    <p className="text-lg md:text-xl font-heading font-semibold leading-snug text-foreground">
                      &ldquo;{signatureFinding}&rdquo;
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      The single most important pattern this diagnostic identified
                      {assessment?.sites?.name ? ` for ${assessment.sites.name}` : ""}.
                    </p>
                  </div>
                </div>
              </Card>
            ) : generatingInsights ? (
              <Card className="p-6 border-l-4 border-l-secondary bg-secondary/5">
                <div className="flex items-start gap-4">
                  <div className="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
                    <Sparkles className="h-5 w-5" />
                  </div>
                  <div className="flex-1 space-y-2">
                    <p className="text-[11px] uppercase tracking-wider text-secondary font-semibold">
                      Signature Finding
                    </p>
                    <Skeleton className="h-6 w-[92%]" />
                    <Skeleton className="h-6 w-[78%]" />
                    <p className="text-xs text-muted-foreground pt-1 flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Identifying the most important pattern for this site…
                    </p>
                  </div>
                </div>
              </Card>
            ) : null}


            {/* Detected cross-domain patterns from the consultant library */}
            {detectedPatterns.length > 0 && (
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="h-5 w-5 text-secondary" />
                  <h3 className="text-base font-heading font-semibold">Patterns Detected</h3>
                </div>
                <p className="text-xs text-muted-foreground mb-4">
                  These cross-domain patterns were identified by comparing your assessment answers
                  against findings from 200+ Indian corporate site diagnostics.
                </p>
                <div className="flex flex-wrap gap-2">
                  {detectedPatterns.map((pattern, i) => (
                    <Badge key={i} variant="outline" className="text-xs font-medium">
                      {pattern}
                    </Badge>
                  ))}
                </div>
              </Card>
            )}


            {/* Executive Summary — auto-generated; skeleton while preparing */}
            {assessment.executive_summary ? (
              <Card className="p-8 border-l-4 border-l-secondary">
                <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-secondary" />
                  What This Means For Your Site
                </h2>
                <div className="prose prose-sm max-w-none">
                  <p className="text-foreground leading-relaxed whitespace-pre-wrap">{sanitizeReportText(assessment.executive_summary, assessment.overall_score_0_100)}</p>
                </div>
              </Card>
            ) : (
              <Card className="p-8 border-l-4 border-l-secondary">
                <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-secondary" />
                  What This Means For Your Site
                </h2>
                {generatingInsights ? (
                  <>
                    <div className="space-y-2.5">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-[95%]" />
                      <Skeleton className="h-4 w-[88%]" />
                      <Skeleton className="h-4 w-[70%]" />
                    </div>
                    <p className="mt-4 text-xs text-muted-foreground flex items-center gap-2">
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Generating executive summary…
                    </p>
                  </>
                ) : (
                  <div className="text-sm text-muted-foreground">
                    Couldn't generate the executive summary just now.{" "}
                    <button
                      type="button"
                      onClick={generateInsights}
                      className="text-secondary hover:underline font-medium"
                    >
                      Retry generation
                    </button>
                  </div>
                )}
              </Card>
            )}


            {/* Domain Cards Grid */}
            <div>
              <h2 className="text-2xl font-heading font-bold mb-6">How Your Site Scored</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {domainScores.map((domain) => {
                  const Icon = getDomainIcon(domain.domain_key);
                  return (
                    <DomainCard
                      key={domain.id}
                      icon={Icon}
                      name={domain.domain_name}
                      score={domain.score_0_100}
                      maturity={domain.maturity_1_5}
                    />
                  );
                })}
              </div>
            </div>

            {/* Charts */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6">
                <h3 className="text-lg font-heading font-semibold mb-4">Domain Scores</h3>
                <p className="text-xs text-muted-foreground mb-4">Performance across security domains (0-100 scale)</p>
                <ResponsiveContainer width="100%" height={320}>
                  <BarChart data={domainScores} margin={{ top: 20, right: 10, left: -10, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis
                      dataKey="domain_key"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                      angle={-45}
                      textAnchor="end"
                      height={100}
                    />
                    <YAxis
                      domain={[0, 110]}
                      ticks={[0, 25, 50, 75, 100]}
                      tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))"
                      }}
                      itemStyle={{
                        color: "hsl(var(--card-foreground))"
                      }}
                      labelStyle={{
                        color: "hsl(var(--card-foreground))",
                        fontWeight: "600"
                      }}
                      formatter={(value: any) => [value, "Score"]}
                    />
                    <Bar dataKey="score_0_100" radius={[8, 8, 0, 0]}>
                      {domainScores.map((entry, index) => {
                        const band = getScoreBand(entry.score_0_100);
                        return <Cell key={`cell-${index}`} fill={band?.color || '#95A5A6'} />;
                      })}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-heading font-semibold mb-4">Maturity Radar</h3>
                <p className="text-xs text-muted-foreground mb-4">Maturity levels across domains (1-5 scale)</p>
                <ResponsiveContainer width="100%" height={300}>
                  <RadarChart data={domainScores}>
                    <PolarGrid stroke="hsl(var(--border))" />
                    <PolarAngleAxis
                      dataKey="domain_key"
                      tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }}
                    />
                    <PolarRadiusAxis domain={[0, 5]} tickCount={6} tick={{ fill: "hsl(var(--muted-foreground))" }} />
                    <Radar
                      name="Maturity"
                      dataKey="maturity_1_5"
                      stroke="hsl(var(--secondary))"
                      fill="hsl(var(--secondary))"
                      fillOpacity={0.5}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                        color: "hsl(var(--card-foreground))"
                      }}
                      itemStyle={{
                        color: "hsl(var(--card-foreground))"
                      }}
                      labelStyle={{
                        color: "hsl(var(--card-foreground))",
                        fontWeight: "600"
                      }}
                      formatter={(value: any) => [value, "Maturity Level"]}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              </Card>
            </div>

            {/* Risk Heatmap */}
            {riskDimensionData.length > 0 && (
              <RiskHeatmap riskDimensionData={riskDimensionData} />
            )}

            {/* Domain Details List */}
            <Card className="p-6">
              <h2 className="text-2xl font-heading font-bold mb-6">Detailed Domain Breakdown</h2>
              <div className="space-y-4">
                {domainScores.map((domain) => {
                  const Icon = getDomainIcon(domain.domain_key);
                  return (
                    <div key={domain.id} className="border-b border-border pb-4 last:border-0">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded-lg bg-muted/50">
                            <Icon className="h-5 w-5 text-secondary" />
                          </div>
                          <h3 className="font-heading font-semibold">{domain.domain_name}</h3>
                        </div>
                        <div className="flex items-center gap-4">
                          <span
                            className="text-2xl font-mono font-bold"
                            style={{ color: getScoreBand(domain.score_0_100)?.color || '#95A5A6' }}
                          >
                            {domain.score_0_100.toFixed(0)}
                          </span>
                          <ScoreBadge score={domain.score_0_100} compact showScore={false} />
                        </div>
                      </div>
                      {domain.commentary && (
                        <p className="text-sm text-muted-foreground mt-2 ml-11">{domain.commentary}</p>
                      )}
                      <div className="ml-11 mr-1">
                        <DomainInsightBlock
                          domainKey={domain.domain_key}
                          domainName={domain.domain_name}
                          score={domain.score_0_100}
                        />
                        <div className="mt-3 flex items-center justify-between gap-3 flex-wrap">
                          <p className="text-xs text-muted-foreground">
                            {domain.score_0_100 < 71
                              ? "Request a focused, structured analysis from SMARTY for this domain."
                              : "Want to push this domain further? Ask SMARTY how to sustain and optimise."}
                          </p>
                          <Button
                            size="sm"
                            variant={domain.score_0_100 < 71 ? "default" : "outline"}
                            onClick={() => askSmartyAbout(domain.domain_name, domain.score_0_100)}

                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Ask SMARTY about {domain.domain_name}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </Card>

            {/* Evidence Checklist for low-scoring domains */}
            <EvidenceChecklist domains={domainScores} />

            {/* Pinned SMARTY advisor notes saved as part of this report */}
            <PinnedAnswersSection pinned={pinnedAnswers} />

            {/* In-Report Glossary — consistent interpretation of scores & bands */}
            <ScoreGlossary />

            {/* Weak Domain Findings — Current State / Operational Consequence / Priority Action */}
            {weakDomainFindings.length > 0 && (
              <Card className="p-6">
                <h2 className="text-2xl font-heading font-bold mb-1">Where To Focus First</h2>
                <p className="text-sm text-muted-foreground mb-6">
                  The three lowest-scoring domains, each examined through current state, operational
                  consequence, and the priority action that closes the gap.
                </p>
                <div className="space-y-6">
                  {weakDomainFindings.map((d, idx) => {
                    const labels = ["CURRENT STATE", "OPERATIONAL CONSEQUENCE", "PRIORITY ACTION"];
                    return (
                      <div key={idx} className="border-l-4 border-l-secondary/60 pl-4">
                        <div className="flex items-baseline justify-between gap-3 flex-wrap mb-3">
                          <h3 className="text-lg font-heading font-semibold">{d.domain}</h3>
                          {typeof d.score === "number" && (
                            <Badge variant="outline" className="text-xs">{Math.round(d.score)}/100</Badge>
                          )}
                        </div>
                        <div className="space-y-3">
                          {d.findings.map((f, fi) => (
                            <div key={fi}>
                              <p className="text-[11px] uppercase tracking-wider text-secondary font-semibold mb-1">
                                {labels[fi] ?? `FINDING ${fi + 1}`}
                              </p>
                              <p className="text-sm text-foreground leading-relaxed">{f}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>
            )}

            {/* Remediation Roadmap */}
            {assessment.remediation_plan ? (
              <RemediationRoadmap remediationPlan={assessment.remediation_plan} />
            ) : generatingInsights ? (
              <Card className="p-8">
                <h2 className="text-2xl font-heading font-bold mb-4 flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-secondary" />
                  Your Action Plan
                </h2>
                <div className="grid md:grid-cols-3 gap-4">
                  {[0, 1, 2].map((i) => (
                    <div key={i} className="space-y-2">
                      <Skeleton className="h-5 w-24" />
                      <Skeleton className="h-3 w-full" />
                      <Skeleton className="h-3 w-[90%]" />
                      <Skeleton className="h-3 w-[75%]" />
                      <Skeleton className="h-3 w-[85%]" />
                    </div>
                  ))}
                </div>
                <p className="mt-5 text-xs text-muted-foreground flex items-center gap-2">
                  <Loader2 className="h-3 w-3 animate-spin" />
                  Preparing your 30 / 60 / 90 day action plan…
                </p>
              </Card>
            ) : null}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-3">
              <Button onClick={() => setDslrFormOpen(true)} className="w-full h-auto py-3" size="lg">
                <FileText className="mr-2 h-5 w-5" />
                <div className="text-left">
                  <div className="font-semibold">Request Security Studio™ Engagement</div>
                  <div className="text-xs opacity-90">Senior-led, on-ground deep validation</div>
                </div>
              </Button>
            </div>


            {/* Security Studio upgrade */}
            <Card className="p-8 border border-border/60 bg-gradient-to-br from-secondary/[0.05] via-card to-card shadow-sm">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-xl bg-secondary/10 text-secondary shrink-0">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-secondary mb-2 font-medium">
                    Ready to go deeper?
                  </p>
                  <h2 className="text-2xl font-heading font-semibold tracking-tight mb-3">
                    Security Studio™
                  </h2>
                  <p className="text-foreground/90 leading-relaxed mb-2">
                    Your Security Selfie™ provides a structured snapshot. For environments
                    requiring deeper validation and precision, Security Studio™ is a focused,
                    expert-led engagement designed to refine, validate, and elevate your security
                    environment.
                  </p>
                  <p className="text-xs text-muted-foreground italic mb-5">
                    Reviewed. Structured. Operationally grounded.
                  </p>
                  <Button
                    variant="outline"
                    onClick={() => setDslrFormOpen(true)}
                    className="border-secondary/40 text-secondary hover:bg-secondary/5"
                  >
                    Explore Security Studio™
                  </Button>
                </div>
              </div>
            </Card>
          </div>

          {/* Right Sidebar - SMARTY Advisor (Desktop) */}
          <div className="hidden lg:block lg:col-span-1">
            <div className="sticky top-24">
              <AskSaassPanel
                assessmentId={id!}
                assessmentData={assessment}
                domainScores={domainScores}
                prefillQuestion={smartyPrefill}
                onPinnedChange={fetchPinnedAnswers}
              />
            </div>
          </div>
        </div>
        <ReportDisclaimerRibbon
          tier={assessment.validated_report_status === "ready" ? "validated" : "quick"}
          className="mt-6"
        />
      </main>

      {/* Mobile SMARTY Overlay */}
      {askSaasPanelOpen && (
        <div className="fixed inset-0 z-50 bg-background/95 lg:hidden overflow-y-auto">
          <div className="container mx-auto px-4 py-4 h-full flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-heading font-bold">SMARTY — Security Advisor</h2>
              <Button variant="ghost" size="sm" onClick={() => setAskSaasPanelOpen(false)}>
                Close
              </Button>
            </div>
            <div className="flex-1 overflow-hidden">
              <AskSaassPanel
                assessmentId={id!}
                assessmentData={assessment}
                domainScores={domainScores}
                prefillQuestion={smartyPrefill}
                onPinnedChange={fetchPinnedAnswers}
              />
            </div>
          </div>
        </div>
      )}



      {/* Security Studio™ Inquiry */}
      <DslrLeadForm
        open={dslrFormOpen}
        onOpenChange={setDslrFormOpen}
        siteId={assessment.site_id}
        siteName={assessment.sites.name}
        organisationId={assessment.sites.organisation_id}
      />

      {/* Floating SMARTY Button (Mobile) */}
      <Button
        className="fixed bottom-6 right-6 lg:hidden rounded-full h-14 w-14 shadow-xl z-40"
        onClick={() => setAskSaasPanelOpen(true)}
      >
        <MessageSquare className="h-6 w-6" />
      </Button>
    </div>
  );
};

export default AssessmentResults;
