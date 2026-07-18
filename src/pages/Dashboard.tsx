import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { useUserRole } from "@/hooks/useUserRole";
import { useAuth } from "@/contexts/AuthContext";
import { Building2, Plus, ClipboardList, HelpCircle, BarChart3, Pencil, Trash2, Check, X, LogOut, ShieldCheck, Sparkles, FileText, ArrowRight, Info } from "lucide-react";
import AdminAnalyticsTab from "@/components/admin/AdminAnalyticsTab";
import AdminManagementTabs from "@/components/admin/AdminManagementTabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useToast } from "@/hooks/use-toast";
import ConfidentialWatermark from "@/components/ConfidentialWatermark";
import ReportOwnershipBanner from "@/components/ReportOwnershipBanner";
import TrustSignals from "@/components/TrustSignals";
import SeverityLegend from "@/components/SeverityLegend";
import AiOrchestrationStrip from "@/components/AiOrchestrationStrip";
import PredictiveIntelligence from "@/components/PredictiveIntelligence";
import AssessmentQuotaBadge from "@/components/AssessmentQuotaBadge";

interface Organisation {
  id: string;
  name: string;
  industry: string;
  city: string | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { toast } = useToast();
  const { isAdmin } = useUserRole();
  const { signOut } = useAuth();
  const activeTab = searchParams.get("tab") || "workspace";
  const [organisations, setOrganisations] = useState<Organisation[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deleteOrg, setDeleteOrg] = useState<Organisation | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [resumeDraft, setResumeDraft] = useState<{ id: string; siteName: string } | null>(null);
  const [stats, setStats] = useState<{ active: number | null; completed: number | null; avgScore: number | null }>({ active: null, completed: null, avgScore: null });
  const [latestReport, setLatestReport] = useState<{ id: string; siteName: string; status: string; score: number | null } | null>(null);
  const [betaDismissed, setBetaDismissed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("sip_beta_banner_dismissed") === "1";
  });

  useEffect(() => {
    fetchOrganisations();
    fetchResumeDraft();
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data } = await supabase
      .from("assessments")
      .select("id, status, report_status, overall_score_0_100, sites(name), created_at, submitted_at, report_generated_at" as any)
      .eq("user_id", user.id);
    if (!data) return;
    const rows = data as any[];
    const active = rows.filter((r) => (r.status ?? "draft") === "draft").length;
    const completed = rows.filter((r) => r.status === "submitted" || r.status === "completed" || ["pending_review", "approved", "sent"].includes(r.report_status)).length;
    const scored = rows.map((r) => r.overall_score_0_100).filter((s) => typeof s === "number");
    const avgScore = scored.length ? Math.round(scored.reduce((a: number, b: number) => a + b, 0) / scored.length) : null;
    setStats({ active, completed, avgScore });
    const latest = [...rows]
      .filter((r) => r.status === "submitted" || ["generating", "pending_review", "approved", "sent", "failed", "email_failed"].includes(r.report_status))
      .sort((a, b) => {
        const ta = new Date(a.report_generated_at ?? a.submitted_at ?? a.created_at).getTime();
        const tb = new Date(b.report_generated_at ?? b.submitted_at ?? b.created_at).getTime();
        return tb - ta;
      })[0];
    if (latest) {
      setLatestReport({
        id: latest.id,
        siteName: latest.sites?.name ?? "Your site",
        status: latest.report_status ?? "pending_review",
        score: latest.overall_score_0_100 ?? null,
      });
    }
  };


  const fetchResumeDraft = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const cutoff = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();
    const { data } = await supabase
      .from("assessments")
      .select("id, created_at, sites!inner(name)")
      .eq("user_id", user.id)
      .eq("status", "draft")
      .gte("created_at", cutoff)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    if (data) {
      setResumeDraft({ id: (data as any).id, siteName: (data as any).sites?.name ?? "your site" });
    }
  };


  useEffect(() => {
    if (!isAdmin && ["analytics", "admin"].includes(activeTab)) {
      setSearchParams({ tab: "workspace" }, { replace: true });
    }
  }, [activeTab, isAdmin, setSearchParams]);

  const changeTab = (value: string) => {
    setSearchParams(value === "workspace" ? {} : { tab: value });
  };

  const fetchOrganisations = async () => {
    const { data, error } = await supabase
      .from("organisations")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching organisations:", error);
    } else {
      setOrganisations(data || []);
    }
    setLoading(false);
  };

  const startEdit = (org: Organisation) => {
    setEditingId(org.id);
    setEditName(org.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
  };

  const saveEdit = async (orgId: string) => {
    const trimmed = editName.trim();
    if (!trimmed) {
      toast({ title: "Name required", description: "Organisation name cannot be empty.", variant: "destructive" });
      return;
    }
    setSavingId(orgId);
    const { error } = await supabase.from("organisations").update({ name: trimmed }).eq("id", orgId);
    setSavingId(null);
    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
      return;
    }
    setOrganisations((prev) => prev.map((o) => (o.id === orgId ? { ...o, name: trimmed } : o)));
    setEditingId(null);
    toast({ title: "Organisation renamed" });
  };

  const handleDelete = async () => {
    if (!deleteOrg) return;
    setDeleting(true);
    // Cascade: find sites, then assessments, then dependent rows
    const { data: sites } = await supabase.from("sites").select("id").eq("organisation_id", deleteOrg.id);
    const siteIds = (sites ?? []).map((s) => s.id);
    if (siteIds.length) {
      const { data: assessments } = await supabase.from("assessments").select("id").in("site_id", siteIds);
      const assessmentIds = (assessments ?? []).map((a) => a.id);
      if (assessmentIds.length) {
        await supabase.from("question_responses").delete().in("assessment_id", assessmentIds);
        await supabase.from("domain_scores").delete().in("assessment_id", assessmentIds);
        await supabase.from("assessments").delete().in("id", assessmentIds);
      }
      await supabase.from("dslr_leads").delete().in("site_id", siteIds);
      await supabase.from("sites").delete().in("id", siteIds);
    }
    await supabase.from("dslr_leads").delete().eq("organisation_id", deleteOrg.id);
    const { error } = await supabase.from("organisations").delete().eq("id", deleteOrg.id);
    setDeleting(false);
    if (error) {
      toast({ title: "Delete failed", description: error.message, variant: "destructive" });
      return;
    }
    setOrganisations((prev) => prev.filter((o) => o.id !== deleteOrg.id));
    setDeleteOrg(null);
    toast({ title: "Organisation deleted", description: "All related sites and assessments were removed." });
  };

  return (
    <div className="min-h-dvh bg-background relative">
      <ConfidentialWatermark />
      {/* Top Navigation */}
      <header className="sticky top-0 z-40 border-b border-border/60 bg-primary text-primary-foreground shadow-sm">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-primary-foreground/10 ring-1 ring-primary-foreground/15">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <div className="leading-tight">
                <h1 className="text-base md:text-lg font-heading font-semibold tracking-tight">Intelligence Command Center</h1>
                <p className="text-[11px] md:text-xs text-primary-foreground/70">Security Selfie™ · Enterprise Security Intelligence</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="ghost"
                onClick={() => navigate("/help")}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <HelpCircle className="mr-2 h-4 w-4" />
                Help
              </Button>
              <Button
                variant="ghost"
                onClick={async () => { await signOut(); navigate("/"); }}
                className="text-primary-foreground hover:bg-primary-foreground/10"
              >
                <LogOut className="mr-2 h-4 w-4" />
                Sign out
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 lg:px-8 py-8 lg:py-10 xl:py-12 max-w-7xl xl:max-w-[1400px] 2xl:max-w-[1560px]">
        {!betaDismissed && (
          <div className="mb-5 rounded-md border border-secondary/30 bg-secondary/[0.04] px-4 py-2.5 flex items-start gap-3">
            <Info className="h-3.5 w-3.5 text-secondary mt-1 shrink-0" />
            <div className="flex-1 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">SIP Programme · </span>
              You are participating in the SIP Programme. Your feedback is helping us continuously improve the platform.
            </div>
            <button
              onClick={() => { sessionStorage.setItem("sip_beta_banner_dismissed", "1"); setBetaDismissed(true); }}
              className="text-xs text-muted-foreground hover:text-foreground"
              aria-label="Dismiss beta banner"
            >
              Dismiss
            </button>
          </div>
        )}
        {latestReport && (
          <Card className="mb-6 border-secondary/30 bg-secondary/[0.03]">
            <CardContent className="p-5 flex flex-col md:flex-row md:items-center justify-between gap-3">
              <div className="min-w-0">
                <p className="text-[11px] uppercase tracking-[0.22em] text-secondary font-semibold mb-1">Latest Security Intelligence Report</p>
                <p className="font-heading font-semibold text-foreground truncate">{latestReport.siteName}</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Current stage: <span className="text-foreground font-medium">{({
                    none: "Submitted",
                    generating: "Intelligence Processing",
                    pending_review: "Quality Review",
                    approved: "Approved — preparing your Command Centre",
                    sent: "Ready in your Command Centre",
                    failed: "Generation will automatically resume",
                    email_failed: "Notification issue — report available",
                  } as Record<string, string>)[latestReport.status] ?? latestReport.status}</span>
                  {latestReport.score != null ? ` · Overall ${Math.round(latestReport.score)}/100` : ""}
                </p>
              </div>
              <div className="flex gap-2 shrink-0">
                {latestReport.status === "sent" ? (
                  <Button size="sm" onClick={() => navigate(`/assessments/${latestReport.id}`)}>
                    View Report <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => navigate(`/reports/${latestReport.id}/status`)}>
                    Track Status <ArrowRight className="h-3.5 w-3.5 ml-1" />
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        )}
        <ReportOwnershipBanner />
        {resumeDraft && (
          <div className="mb-6 rounded-lg border border-secondary/40 bg-secondary/5 px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="text-sm">
              <p className="font-heading font-semibold text-foreground">Resume your Security Selfie</p>
              <p className="text-muted-foreground text-xs mt-0.5">
                You have an unfinished assessment for <strong className="text-foreground">{resumeDraft.siteName}</strong>. Pick up exactly where you left off.
              </p>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => navigate(`/assessments/${resumeDraft.id}/edit`)}>Continue</Button>
              <Button size="sm" variant="ghost" onClick={() => setResumeDraft(null)}>Dismiss</Button>
            </div>
          </div>
        )}
        <TrustSignals className="mb-6 -mt-1 px-1" />
        <div className="mb-6"><AssessmentQuotaBadge /></div>

        <Tabs value={activeTab} onValueChange={changeTab} className="space-y-8">
          <div className="sticky top-[73px] z-30 -mx-4 border-b border-border/50 bg-background/95 px-4 py-3 backdrop-blur md:-mx-6 md:px-6 lg:-mx-8 lg:px-8">
            <TabsList className="h-auto flex w-full flex-wrap justify-start gap-1 bg-muted/60 p-1 md:w-auto">
              <TabsTrigger value="workspace">Workspace</TabsTrigger>
              <TabsTrigger value="reports">Reports</TabsTrigger>
              {isAdmin && (
                <>
                  <span className="mx-2 hidden h-6 w-px bg-border md:inline-block" aria-hidden />
                  <span className="px-2 text-[10px] font-semibold uppercase tracking-[0.2em] text-muted-foreground">Admin</span>
                  <TabsTrigger value="analytics">Analytics</TabsTrigger>
                  <TabsTrigger value="admin">Users & Ops</TabsTrigger>
                </>
              )}
            </TabsList>
          </div>

          <TabsContent value="workspace" className="mt-0 space-y-10">
            {/* Hero Section */}
            <div>
              <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-3">
                <div>
                  <p className="text-[11px] uppercase tracking-[0.22em] text-secondary font-semibold mb-2">Intelligence Command Center</p>
                  <h2 className="text-3xl md:text-4xl font-heading font-semibold tracking-tight text-foreground mb-2">
                    Security posture overview
                  </h2>
                  <p className="text-sm md:text-base text-muted-foreground max-w-2xl">
                    Overview of evaluated security environments — operational clarity, intelligence-driven visibility, and structured posture across your portfolio.
                  </p>
                  <p className="mt-2 inline-flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-muted-foreground/80">
                    <Sparkles className="h-3 w-3 text-secondary" />
                    Reviewed. Structured. Operationally grounded.
                  </p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {isAdmin && (
                    <Button
                      variant="outline"
                      onClick={() => navigate("/leads")}
                      className="border-border/60 hover:bg-muted/60"
                    >
                      <ClipboardList className="mr-2 h-4 w-4" />
                      Studio Inquiries
                    </Button>
                  )}
                  <Button
                    onClick={() => navigate("/organisations/new")}
                    size="lg"
                    className="bg-primary hover:bg-primary/90 text-primary-foreground shadow-sm"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    New Organisation
                  </Button>
                </div>
              </div>

              {/* Stats Cards — matte, subtle premium */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 xl:gap-6 mb-6">
                <Card className="bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Client Organisations</p>
                        <p className="text-3xl font-mono font-semibold text-foreground">{organisations.length}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                        <Building2 className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Active Diagnostics</p>
                        <p className="text-3xl font-mono font-semibold text-foreground">{stats.active ?? "—"}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-secondary/10 text-secondary">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Diagnostics Completed</p>
                        <p className="text-3xl font-mono font-semibold text-foreground">{stats.completed ?? "—"}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-accent/10 text-accent">
                        <ClipboardList className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card className="bg-card border border-border/60 shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1.5">Average Security Score</p>
                        <p className="text-3xl font-mono font-semibold text-foreground">{stats.avgScore ?? "—"}{stats.avgScore != null ? <span className="text-base text-muted-foreground">/100</span> : null}</p>
                      </div>
                      <div className="p-2 rounded-lg bg-muted text-muted-foreground">
                        <BarChart3 className="h-5 w-5" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Severity hierarchy + Studio signal */}
              <div className="border-t border-border/50 pt-3 space-y-2">
                <SeverityLegend />
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <span className="inline-flex h-1.5 w-1.5 rounded-full bg-secondary/70" />
                  Studio opportunities available — eligible environments may be elevated to Security Studio™ for expert-led validation.
                </div>
              </div>
            </div>

            {/* Phase 3 — Intelligence orchestration & predictive layer */}
            <div className="mb-10 space-y-4">
              {/* Mobile: collapsible to reduce density */}
              <details className="md:hidden group rounded-xl border border-border/50 bg-card/50 overflow-hidden" open={false}>
                <summary className="flex items-center justify-between gap-3 px-4 py-3 cursor-pointer list-none">
                  <span className="font-heading font-semibold text-sm">Intelligence Signals</span>
                  <span className="text-[10px] uppercase tracking-[0.2em] text-secondary">Tap to expand</span>
                </summary>
                <div className="px-3 pb-4 space-y-4">
                  <AiOrchestrationStrip />
                  <PredictiveIntelligence />
                </div>
              </details>
              {/* Desktop: stacked on md, two-column immersive on xl */}
              <div className="hidden md:block space-y-4 xl:space-y-0 xl:grid xl:grid-cols-2 xl:gap-6">
                <AiOrchestrationStrip />
                <PredictiveIntelligence />
              </div>
            </div>

            {/* Organisations Section */}

            <div>
              <h3 className="text-2xl font-heading font-bold mb-6">Client Portfolio</h3>

              {loading ? (
                <div className="text-center py-16">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Loading organisations...</p>
                </div>
              ) : organisations.length === 0 ? (
                <Card className="p-12 text-center border-dashed border-2">
                  <Building2 className="h-20 w-20 mx-auto mb-4 text-muted-foreground/50" />
                  <h3 className="text-2xl font-heading font-semibold mb-3">Start your first Security Selfie™</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Add your site and run a structured security diagnostic — the same quality of intelligence now available to every security professional, regardless of designation or organisation size.
                  </p>
                  <Button
                    onClick={() => navigate("/organisations/new")}
                    size="lg"
                    className="bg-secondary hover:bg-secondary/90"
                  >
                    <Plus className="mr-2 h-5 w-5" />
                    Create Your First Organisation
                  </Button>
                </Card>
              ) : (
                <div className="grid gap-4 xl:gap-6 md:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4">
                  {organisations.map((org) => {
                    const isEditing = editingId === org.id;
                    return (
                      <Card
                        key={org.id}
                        className={`group border-l-4 border-l-secondary/50 hover:border-l-secondary transition-all ${isEditing ? "" : "cursor-pointer"}`}
                        onClick={() => {
                          if (!isEditing) navigate(`/organisations/${org.id}`);
                        }}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between mb-3">
                            <div className="p-3 rounded-xl bg-secondary/10 group-hover:bg-secondary/20 transition-colors">
                              <Building2 className="h-8 w-8 text-secondary" />
                            </div>
                            <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                              {!isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Rename organisation"
                                    onClick={() => startEdit(org)}
                                  >
                                    <Pencil className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Delete organisation"
                                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                                    onClick={() => setDeleteOrg(org)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Save"
                                    onClick={() => saveEdit(org.id)}
                                    disabled={savingId === org.id}
                                  >
                                    <Check className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    aria-label="Cancel"
                                    onClick={cancelEdit}
                                    disabled={savingId === org.id}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                          {isEditing ? (
                            <Input
                              autoFocus
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onClick={(e) => e.stopPropagation()}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") saveEdit(org.id);
                                if (e.key === "Escape") cancelEdit();
                              }}
                              placeholder="Organisation name"
                              className="text-lg font-heading"
                            />
                          ) : (
                            <CardTitle className="text-xl font-heading group-hover:text-secondary transition-colors">
                              {org.name}
                            </CardTitle>
                          )}
                          <CardDescription className="space-y-1">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-medium text-secondary">{org.industry}</span>
                            </div>
                            {org.city && <div className="text-sm">{org.city}</div>}
                          </CardDescription>
                        </CardHeader>
                      </Card>
                    );
                  })}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="reports" className="mt-0">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-secondary" /> My Security Intelligence Reports
                </CardTitle>
                <CardDescription>
                  View every Security Selfie™ you've initiated with current pipeline stage, overall rating, and version history.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-3">
                <Button onClick={() => navigate("/reports")}>
                  Open my reports <ArrowRight className="h-4 w-4 ml-1.5" />
                </Button>
                <Button variant="outline" onClick={() => changeTab("workspace")}>Back to Workspace</Button>
              </CardContent>
            </Card>
          </TabsContent>


          {isAdmin && (
            <>
              <TabsContent value="analytics" className="mt-0">
                <AdminAnalyticsTab />
              </TabsContent>
              <TabsContent value="admin" className="mt-0">
                <AdminManagementTabs />
              </TabsContent>
            </>
          )}
        </Tabs>
      </main>

      <AlertDialog open={!!deleteOrg} onOpenChange={(open) => !open && setDeleteOrg(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete "{deleteOrg?.name}"?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the organisation and all of its sites, assessments, responses, scores, and Security Studio™ inquiries. This cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {deleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default Dashboard;
