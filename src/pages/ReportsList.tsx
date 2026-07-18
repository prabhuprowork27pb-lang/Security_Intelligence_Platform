import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Loader2, FileText, ArrowRight, Eye, MessageCircle, ShieldCheck, Clock3 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

interface Row {
  id: string;
  created_at: string;
  submitted_at: string | null;
  report_status: string;
  review_status: string | null;
  report_version: number | null;
  overall_score_0_100: number | null;
  validated_report_status: string | null;
  validated_report_ready_at: string | null;
  sites: {
    name: string | null;
    city: string | null;
    organisations: { industry: string | null } | null;
  } | null;
}

const LABEL: Record<string, string> = {
  none: "Draft",
  generating: "Processing",
  pending_review: "Intelligence report ready",
  approved: "Intelligence report ready",
  sent: "Intelligence report ready · emailed",
  failed: "Re-generating",
  email_failed: "Intelligence report ready · email issue",
};

function isViewable(r: Row): boolean {
  return r.review_status === "report_ready" ||
    ["pending_review", "approved", "sent"].includes(r.report_status);
}

function displayStatus(r: Row): { label: string; key: string } {
  const rs = r.report_status ?? "none";
  if ((rs === "none" || !rs) && (r.submitted_at || typeof r.overall_score_0_100 === "number")) {
    return {
      label: typeof r.overall_score_0_100 === "number" ? "Initial scoring received" : "Submitted · scoring queued",
      key: "pending_review",
    };
  }
  return { label: LABEL[rs] ?? rs, key: rs };
}

function scoreBand(score: number | null): { label: string; tone: string } {
  if (score == null) return { label: "—", tone: "text-muted-foreground" };
  if (score <= 40) return { label: `${Math.round(score)} · Ad Hoc`, tone: "text-destructive" };
  if (score <= 70) return { label: `${Math.round(score)} · Developing`, tone: "text-amber-600" };
  if (score <= 85) return { label: `${Math.round(score)} · Managed`, tone: "text-secondary" };
  return { label: `${Math.round(score)} · Resilient`, tone: "text-accent" };
}

const ReportsList = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [rows, setRows] = useState<Row[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from("assessments")
        .select(
          "id, created_at, submitted_at, report_status, review_status, report_version, overall_score_0_100, validated_report_status, validated_report_ready_at, sites(name, city, organisations(industry))" as any
        )
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setRows((data ?? []) as any);
      setLoading(false);
    })();
  }, [user]);

  return (
    <>
      <Seo title="My reports — Security Intelligence Platform™" description="Track and download your Security Intelligence Reports." path="/reports" />
      <div className="min-h-dvh bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 md:px-6 py-10 max-w-4xl">
          <div className="mb-6">
            <p className="text-[11px] uppercase tracking-[0.24em] text-secondary font-semibold mb-1">Command Centre</p>
            <h1 className="font-heading text-2xl md:text-3xl font-semibold tracking-tight">My Security Intelligence Reports</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Every Security Selfie™ you've initiated, with current pipeline status, score band, and version history.
            </p>
          </div>

          {loading ? (
            <div className="py-12 flex justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
          ) : rows.length === 0 ? (
            <Card className="p-10 text-center">
              <FileText className="h-9 w-9 mx-auto text-muted-foreground/60 mb-3" />
              <h2 className="font-heading font-semibold text-lg mb-1">You haven't completed a Security Selfie™ yet</h2>
              <p className="text-sm text-muted-foreground mb-5 max-w-md mx-auto">
                Your reports will appear here once you submit your first Security Selfie™ assessment.
              </p>
              <Button onClick={() => navigate("/diagnostic/start")}>Start your first Security Selfie™</Button>
            </Card>
          ) : (
            <div className="space-y-3">
              {rows.map((r) => {
                const band = scoreBand(r.overall_score_0_100);
                const viewable = isViewable(r);
                return (
                  <Card key={r.id} className="p-4 md:p-5 hover:border-secondary/40 transition-colors">
                    <div className="flex items-start justify-between gap-3 flex-wrap">
                      <Link to={`/reports/${r.id}/status`} className="flex-1 min-w-0">
                        <div className="min-w-0">
                          <p className="font-heading font-semibold truncate">{r.sites?.name ?? "Untitled site"}</p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {[
                              r.sites?.city,
                              r.sites?.organisations?.industry,
                              r.submitted_at
                                ? `Submitted ${new Date(r.submitted_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`
                                : `Started ${new Date(r.created_at).toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })}`,
                              r.report_version && r.report_version > 1 ? `v${r.report_version}` : null,
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                          <p className={`text-xs mt-1 font-mono ${band.tone}`}>
                            Overall rating: {band.label}
                          </p>
                        </div>
                      </Link>
                      <div className="flex flex-col items-end gap-1.5 shrink-0">
                        <div className="flex items-center gap-1.5 flex-wrap justify-end">
                          {(() => {
                            const ds = displayStatus(r);
                            return (
                              <Badge variant={viewable ? "default" : ds.key === "email_failed" || ds.key === "failed" ? "destructive" : "secondary"} className="gap-1">
                                <Clock3 className="h-3 w-3" /> Quick · {ds.label}
                              </Badge>
                            );
                          })()}
                          {r.validated_report_status === "ready" ? (
                            <Badge className="bg-accent/15 text-accent border-accent/30 gap-1">
                              <ShieldCheck className="h-3 w-3" /> Validated · Ready
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="text-muted-foreground gap-1">
                              <ShieldCheck className="h-3 w-3" /> Validated · {r.validated_report_status === "generating" ? "Generating" : r.validated_report_status === "failed" ? "Retrying" : "Pending"}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1.5">
                          {viewable && (
                            <Button size="sm" variant="outline" onClick={() => navigate(`/assessments/${r.id}`)}>
                              <Eye className="h-3.5 w-3.5 mr-1.5" /> View
                            </Button>
                          )}
                          {r.validated_report_status === "ready" && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                const url = `${window.location.origin}/assessments/${r.id}`;
                                const msg = `Validated Intelligence Report for ${r.sites?.name ?? "our site"} is now ready in the SIP™ Command Centre: ${url}`;
                                window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, "_blank", "noopener");
                              }}
                              title="Share via WhatsApp"
                            >
                              <MessageCircle className="h-3.5 w-3.5 mr-1.5" /> Share
                            </Button>
                          )}
                          <Link to={`/reports/${r.id}/status`} aria-label="Open status">
                            <ArrowRight className="h-4 w-4 text-muted-foreground" />
                          </Link>
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </main>
      </div>
    </>
  );
};

export default ReportsList;
