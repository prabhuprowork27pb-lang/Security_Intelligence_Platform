import { useEffect, useState } from "react";
import { Loader2, FileText, Send, RefreshCw, ExternalLink, AlertCircle, Download, History, Mail, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import ReportAuditDrawer from "@/components/admin/ReportAuditDrawer";
import QaBackfillPanel from "@/components/admin/QaBackfillPanel";

interface ReportRow {
  id: string;
  created_at: string | null;
  report_status: string;
  report_pdf_path: string | null;
  report_generated_at: string | null;
  report_error: string | null;
  report_version: number | null;
  report_email_attempts: number | null;
  overall_score_0_100: number | null;
  created_by_name: string | null;
  user_id: string | null;
  validated_report_status: string | null;
  validated_report_ready_at: string | null;
  validated_report_generated_by: string | null;
  sites: { name: string | null; organisations: { name: string | null } | null } | null;
}

const STATUS_LABEL: Record<string, string> = {
  none: "Not generated",
  generating: "Generating PDF",
  pending_review: "Awaiting review",
  approved: "Approved",
  sent: "Sent to client",
  failed: "PDF failed",
  email_failed: "Email failed",
};

const STATUS_VARIANT: Record<string, "default" | "outline" | "secondary" | "destructive"> = {
  none: "destructive",
  generating: "outline",
  pending_review: "default",
  approved: "secondary",
  sent: "secondary",
  failed: "destructive",
  email_failed: "destructive",
};


const MAX_EMAIL_ATTEMPTS = 5;

export const ReportsQueueTab = () => {
  const { toast } = useToast();
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [auditFor, setAuditFor] = useState<{ id: string; name: string | null } | null>(null);

  const load = async () => {
    // Include 'none' so assessments where the fire-and-forget invoke never landed
    // (status stays 'none' / no PDF) are visible to admins instead of being silently stuck.
    const { data, error } = await supabase
      .from("assessments")
      .select(
        "id, created_at, report_status, report_pdf_path, report_generated_at, report_error, report_version, report_email_attempts, overall_score_0_100, created_by_name, user_id, status, review_status, submitted_at, validated_report_status, validated_report_ready_at, validated_report_generated_by, sites(name, organisations(name))" as any
      )
      .or(
        "report_status.in.(generating,pending_review,approved,sent,failed,email_failed),and(report_status.eq.none,status.eq.submitted),and(report_status.eq.none,review_status.eq.report_ready)"
      )
      .order("report_generated_at", { ascending: false, nullsFirst: false })
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) {
      toast({ title: "Could not load reports queue", description: error.message, variant: "destructive" });
    } else {
      setRows((data ?? []) as unknown as ReportRow[]);
    }
    setLoading(false);
  };


  useEffect(() => { load(); }, []);

  const signedAction = async (row: ReportRow, download: boolean) => {
    if (!row.report_pdf_path) return;
    const { data, error } = await supabase.functions.invoke("admin-get-report-signed-url", {
      body: { assessment_id: row.id, download },
    });
    if (error || (data as any)?.error) {
      toast({ title: download ? "Download failed" : "Preview failed", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    window.open((data as any).signedUrl, "_blank", "noopener");
  };

  const approve = async (row: ReportRow, forceResend: boolean) => {
    const msg = forceResend
      ? "Re-send this report to the client?"
      : row.report_status === "sent"
        ? "This report was already sent. Send another copy?"
        : "Approve and email this report to the client?";
    if (!confirm(msg)) return;
    setBusyId(row.id);
    const { data, error } = await supabase.functions.invoke("approve-and-send-report", {
      body: { assessment_id: row.id, version: row.report_version, force_resend: forceResend || row.report_status === "sent" },
    });
    setBusyId(null);
    if (error || (data as any)?.error) {
      toast({ title: "Could not send report", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Report sent", description: "The client has been notified by email." });
    load();
  };

  const regenerate = async (row: ReportRow) => {
    if (row.report_status === "sent") {
      if (!confirm("The current version was already delivered. Generate a new version (v" + ((row.report_version ?? 1) + 1) + ") that will need re-approval before re-sending?")) return;
    }
    setBusyId(row.id);
    const { data, error } = await supabase.functions.invoke("generate-report-on-submit", {
      body: { assessment_id: row.id, regenerate: true },
    });
    setBusyId(null);
    if (error || (data as any)?.error) {
      toast({ title: "Re-generation failed", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "New version generated", description: "Preview and approve to release." });
    load();
  };

  const releaseValidated = async (row: ReportRow) => {
    if (!confirm(`Generate and release the Validated Intelligence Report for ${row.sites?.name ?? "this site"}? The user will see it in their Command Centre and (if a WhatsApp number is on file) receive a notification.`)) return;
    setBusyId(row.id);
    const { data, error } = await supabase.functions.invoke("generate-validated-report", {
      body: { mode: "single", assessment_id: row.id },
    });
    setBusyId(null);
    if (error || (data as any)?.error) {
      toast({ title: "Validated release failed", description: (data as any)?.error ?? error?.message, variant: "destructive" });
      return;
    }
    toast({ title: "Validated Report released", description: "The user has been notified." });
    load();
  };

  return (
    <div className="space-y-4">
      <QaBackfillPanel onCompleteRefresh={load} />
      <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Reports queue
          </CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            User access is auto-released the moment generation completes. <strong>Approve &amp; send</strong> only controls the emailed PDF copy. Use <strong>New version</strong> to issue a revised report.
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={load} disabled={loading}>
          <RefreshCw className={`h-3.5 w-3.5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Site</TableHead>
                <TableHead>Submitter</TableHead>
                <TableHead>Generated</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Score</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No reports in the queue.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => {
                const attempts = r.report_email_attempts ?? 0;
                const capped = attempts >= MAX_EMAIL_ATTEMPTS;
                return (
                  <TableRow key={r.id}>
                    <TableCell>
                      <div className="font-medium">{r.sites?.name ?? "—"}</div>
                      <div className="text-xs text-muted-foreground">{r.sites?.organisations?.name ?? ""}</div>
                      {r.report_version && r.report_version > 1 && (
                        <Badge variant="outline" className="text-[10px] mt-1">v{r.report_version}</Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-xs">{r.created_by_name ?? "—"}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      {r.report_generated_at
                        ? new Date(r.report_generated_at).toLocaleString(undefined, { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })
                        : "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant={STATUS_VARIANT[r.report_status] ?? "outline"}>
                        {STATUS_LABEL[r.report_status] ?? r.report_status}
                      </Badge>
                      {(r.report_status === "failed" || r.report_status === "email_failed") && r.report_error && (
                        <div className="flex items-start gap-1 mt-1 text-[11px] text-destructive">
                          <AlertCircle className="h-3 w-3 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{r.report_error}</span>
                        </div>
                      )}
                      {attempts > 0 && (
                        <p className="text-[10px] text-muted-foreground mt-0.5">Email attempts: {attempts}/{MAX_EMAIL_ATTEMPTS}</p>
                      )}
                    </TableCell>
                    <TableCell className="text-right font-mono">{r.overall_score_0_100?.toFixed(0) ?? "—"}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-1.5 flex-wrap">
                        {r.report_pdf_path && (
                          <>
                            <Button size="sm" variant="outline" onClick={() => signedAction(r, false)} title="Preview in browser">
                              <ExternalLink className="h-3 w-3 mr-1" /> Preview
                            </Button>
                            <Button size="sm" variant="outline" onClick={() => signedAction(r, true)} title="Download PDF">
                              <Download className="h-3 w-3" />
                            </Button>
                          </>
                        )}
                        <Button size="sm" variant="ghost" onClick={() => setAuditFor({ id: r.id, name: r.sites?.name ?? null })} title="Audit trail">
                          <History className="h-3 w-3" />
                        </Button>
                        {r.report_status === "pending_review" && (
                          <Button size="sm" onClick={() => approve(r, false)} disabled={busyId === r.id || capped}>
                            {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Send className="h-3 w-3 mr-1" /> Approve & send</>}
                          </Button>
                        )}
                        {r.report_status === "email_failed" && (
                          <Button size="sm" variant="destructive" onClick={() => approve(r, true)} disabled={busyId === r.id || capped}>
                            {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><Mail className="h-3 w-3 mr-1" /> Retry send</>}
                          </Button>
                        )}
                        {r.report_status === "sent" && (
                          <Button size="sm" variant="outline" onClick={() => approve(r, true)} disabled={busyId === r.id || capped} title="Re-send same version">
                            <Mail className="h-3 w-3 mr-1" /> Re-send
                          </Button>
                        )}
                        {r.report_status === "none" && (
                          <Button size="sm" onClick={() => regenerate(r)} disabled={busyId === r.id} title="Generate report now">
                            {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3 mr-1" /> Generate now</>}
                          </Button>
                        )}
                        {(r.report_status === "failed" || r.report_status === "sent" || r.report_status === "email_failed" || r.report_status === "approved") && (
                          <Button size="sm" variant="outline" onClick={() => regenerate(r)} disabled={busyId === r.id} title="Generate a new version">
                            {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><RefreshCw className="h-3 w-3 mr-1" /> New version</>}
                          </Button>
                        )}
                        {r.validated_report_status !== "ready" && r.validated_report_status !== "generating" && r.report_pdf_path && (
                          <Button size="sm" variant="secondary" onClick={() => releaseValidated(r)} disabled={busyId === r.id} title="Generate and release the Validated Intelligence Report now">
                            {busyId === r.id ? <Loader2 className="h-3 w-3 animate-spin" /> : <><ShieldCheck className="h-3 w-3 mr-1" /> Release Validated</>}
                          </Button>
                        )}
                        {r.validated_report_status === "generating" && (
                          <Badge variant="outline" className="gap-1"><Loader2 className="h-3 w-3 animate-spin" /> Validating</Badge>
                        )}
                        {r.validated_report_status === "ready" && (
                          <Badge className="bg-accent/15 text-accent border-accent/30 gap-1">
                            <ShieldCheck className="h-3 w-3" />
                            {r.validated_report_generated_by === "auto_escalated" ? "Auto-released (SLA)" : "Validated · Released"}
                          </Badge>
                        )}
                      </div>
                      {capped && (
                        <p className="text-[10px] text-destructive mt-1">Retry cap reached — contact recipient manually.</p>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      <ReportAuditDrawer
        assessmentId={auditFor?.id ?? null}
        siteName={auditFor?.name ?? null}
        onClose={() => setAuditFor(null)}
      />
    </Card>
    </div>
  );
};

export default ReportsQueueTab;
