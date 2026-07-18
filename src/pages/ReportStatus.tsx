import { useEffect, useState } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { Loader2, CheckCircle2, Clock3, AlertTriangle, Download, ShieldCheck, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface AuditRow { id: string; action: string; created_at: string; actor_label: string | null; metadata: any; report_version: number | null; }
interface AssessmentRow {
  id: string;
  report_status: string;
  review_status: string | null;
  report_version: number | null;
  report_generated_at: string | null;
  report_ready_at: string | null;
  report_approved_at: string | null;
  report_sent_at: string | null;
  submitted_at: string | null;
  overall_score_0_100: number | null;
  report_error: string | null;
  sites: { name: string | null; city: string | null } | null;
}

const isReady = (a: AssessmentRow) =>
  a.review_status === "report_ready" ||
  ["pending_review", "approved", "sent"].includes(a.report_status);

// Lifecycle: the initial AI report is auto-released to the Command Centre as
// soon as generation completes. Specialist QA is a non-blocking step.
const STAGES: { key: string; label: string; complete: (a: AssessmentRow) => boolean; active: (a: AssessmentRow) => boolean }[] = [
  { key: "submitted", label: "Assessment Submitted",
    complete: (a) => !!a.submitted_at,
    active: () => false,
  },
  { key: "validation", label: "Data Validation",
    complete: (a) => !!a.report_generated_at || typeof a.overall_score_0_100 === "number" || isReady(a),
    active: (a) => a.report_status === "generating" || (a.report_status === "none" && !!a.submitted_at),
  },
  { key: "processing", label: "Intelligence Processing",
    complete: (a) => isReady(a),
    active: (a) => a.report_status === "generating" || (a.report_status === "none" && typeof a.overall_score_0_100 === "number"),
  },
  { key: "ready", label: "Report Ready in Command Centre",
    complete: (a) => isReady(a),
    active: (a) => a.report_status === "generating",
  },
  { key: "qa", label: "Specialist QA (optional, post-release)",
    complete: (a) => a.report_status === "sent",
    active: (a) => a.report_status === "pending_review" || a.report_status === "approved",
  },
];

const ReportStatus = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [assessment, setAssessment] = useState<AssessmentRow | null>(null);
  const [audit, setAudit] = useState<AuditRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  const load = async () => {
    if (!id) return;
    const [{ data: a }, { data: log }] = await Promise.all([
      supabase.from("assessments")
        .select("id, report_status, review_status, report_version, report_generated_at, report_ready_at, report_approved_at, report_sent_at, submitted_at, overall_score_0_100, report_error, sites(name, city)" as any)
        .eq("id", id).maybeSingle(),
      supabase.from("report_audit_log" as any)
        .select("id, action, created_at, actor_label, metadata, report_version")
        .eq("assessment_id", id).order("created_at", { ascending: false }).limit(50),
    ]);
    setAssessment(a as any);
    setAudit((log ?? []) as any);
    setLoading(false);
  };

  useEffect(() => {
    load();
    const t = setInterval(load, 30000);
    return () => clearInterval(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  const download = async () => {
    setDownloading(true);
    const { data, error } = await supabase.functions.invoke("get-report-download-url", {
      body: { assessment_id: id, download: true },
    });
    setDownloading(false);
    if (error || (data as any)?.error) {
      toast({ title: "Could not get download link", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    window.open((data as any).signedUrl, "_blank", "noopener");
  };

  if (loading) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }
  if (!assessment) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <ShieldCheck className="h-10 w-10 text-secondary mx-auto mb-3" />
          <h1 className="font-heading font-semibold text-xl mb-2">Report not found</h1>
          <p className="text-sm text-muted-foreground mb-5">You may not have access to this report, or the link is stale.</p>
          <Button onClick={() => navigate("/reports")}>Back to my reports</Button>
        </Card>
      </div>
    );
  }

  const status = assessment.report_status;
  const ready = isReady(assessment);
  const isFailure = status === "failed" || status === "email_failed";
  const statusLabel = ready
    ? (status === "sent"
        ? "Ready in your Command Centre · emailed"
        : "Intelligence report ready in your Command Centre")
    : status === "none" && assessment.submitted_at
      ? (typeof assessment.overall_score_0_100 === "number" ? "Initial scoring received · finalising report" : "Submitted · scoring queued")
      : ({
        none: "Not yet started",
        generating: "Intelligence processing",
        failed: "Generation will automatically resume",
        email_failed: "Notification delivery issue — report still available",
      } as Record<string, string>)[status] ?? status;

  return (
    <>
      <Seo title="Report status — Security Selfie™" description="Track your Security Selfie report status." path={`/reports/${id}/status`} />
      <div className="min-h-dvh bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 md:px-6 py-10 max-w-3xl">
          <Link to="/reports" className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground mb-4">
            <ArrowLeft className="h-3 w-3" /> All my reports
          </Link>

          <Card className="p-6 md:p-8">
            <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
              <div>
                <p className="text-[11px] uppercase tracking-[0.24em] text-secondary font-semibold mb-1">Report status</p>
                <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight">
                  {assessment.sites?.name ?? "Security Selfie report"}
                </h1>
                <p className="text-xs text-muted-foreground mt-1">
                  {assessment.sites?.city ?? ""}
                  {assessment.report_version && assessment.report_version > 1 ? ` · Revision v${assessment.report_version}` : ""}
                </p>
              </div>
              <Badge variant={isFailure ? "destructive" : ready ? "default" : "secondary"}>{statusLabel}</Badge>
            </div>

            {isFailure && (
              <div className="rounded-md border border-destructive/30 bg-destructive/5 p-3 mb-4 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-destructive mt-0.5" />
                <p className="text-xs text-destructive">
                  We encountered an unexpected issue while preparing your report. Our team has been notified. Your assessment has been safely saved and report generation will automatically resume.
                </p>
              </div>
            )}

            <ol className="space-y-3 mt-6">
              {STAGES.map((s) => {
                const done = s.complete(assessment);
                const active = s.active(assessment);
                return (
                  <li key={s.key} className="flex items-center gap-3">
                    <div className={`h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      done ? "bg-accent/15 text-accent" : active ? "bg-secondary/15 text-secondary" : "bg-muted text-muted-foreground"
                    }`}>
                      {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className="h-4 w-4" />}
                    </div>
                    <span className={`text-sm ${done || active ? "text-foreground" : "text-muted-foreground"}`}>{s.label}</span>
                  </li>
                );
              })}
            </ol>

            {ready && (
              <div className="mt-6 border-t border-border/50 pt-5 flex flex-wrap gap-2">
                <Button onClick={() => navigate(`/assessments/${id}`)}>
                  View Report
                </Button>
                {status === "sent" && (
                  <Button variant="outline" onClick={download} disabled={downloading}>
                    {downloading ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                    Download PDF
                  </Button>
                )}
                <Button variant="ghost" onClick={() => navigate("/dashboard")}>
                  Return to Command Centre
                </Button>
                {status !== "sent" && (
                  <p className="basis-full text-[11px] text-muted-foreground mt-1">A PDF copy will be emailed once specialist QA is complete.</p>
                )}
              </div>
            )}
          </Card>

          {audit.length > 0 && (
            <Card className="p-6 md:p-8 mt-6">
              <h2 className="font-heading font-semibold text-sm mb-3">Activity log</h2>
              <ol className="space-y-2">
                {audit.map((row) => (
                  <li key={row.id} className="text-xs flex items-start gap-3 border-b border-border/40 last:border-0 pb-2">
                    <span className="font-mono text-muted-foreground shrink-0 w-32">
                      {new Date(row.created_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                    <span className="font-medium capitalize">{row.action.replace(/_/g, " ")}</span>
                    {row.report_version ? <Badge variant="outline" className="text-[10px]">v{row.report_version}</Badge> : null}
                  </li>
                ))}
              </ol>
            </Card>
          )}
          <p className="mt-8 text-xs italic text-muted-foreground border-t border-border/40 pt-4">
            SIP™ reports are intelligence products to aid prioritisation — not audit opinions, compliance certificates, or guarantees of outcome. Open the report to read the full disclaimer.
          </p>
        </main>
      </div>
    </>
  );
};

export default ReportStatus;
