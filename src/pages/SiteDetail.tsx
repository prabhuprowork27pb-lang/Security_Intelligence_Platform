import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, ClipboardList, FileText, MapPin, Home, Pencil, Trash2 } from "lucide-react";
import { getRiskPosture, getScoreColor } from "@/lib/questions";
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
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";

interface Site {
  id: string;
  name: string;
  city: string;
  state: string | null;
  site_type: string;
  criticality: string;
  headcount_band: string | null;
}

interface Assessment {
  id: string;
  created_at: string;
  created_by_name: string;
  overall_score_0_100: number | null;
  risk_posture: string | null;
  status: string;
  review_status?: string | null;
}

const SiteDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuth();
  const { isAdmin, isBetaTester } = useUserRole();
  const [site, setSite] = useState<Site | null>(null);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleStartAssessment = async () => {
    if (!user) {
      navigate(`/sites/${id}/assessment/new`);
      return;
    }
    if (!isAdmin && !isBetaTester) {
      const { count } = await supabase
        .from("assessments")
        .select("id", { count: "exact", head: true })
        .eq("site_id", id as string)
        .eq("user_id", user.id)
        .eq("status", "submitted");
      if ((count ?? 0) > 0) {
        toast({
          title: "Assessment already submitted",
          description:
            "A Security Selfie™ has been submitted for this site. Each site can be assessed once during the free period. Contact us for a reassessment or Security Studio™ engagement.",
          variant: "destructive",
        });
        return;
      }
    }
    navigate(`/sites/${id}/assessment/new`);
  };

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    const { data: siteData } = await supabase
      .from("sites")
      .select("*")
      .eq("id", id)
      .single();

    const { data: assessmentsData } = await supabase
      .from("assessments")
      .select("*")
      .eq("site_id", id)
      .order("created_at", { ascending: false });

    setSite(siteData);
    setAssessments(assessmentsData || []);
    setLoading(false);
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    try {
      // Remove dependent rows first (no FK cascades guaranteed)
      await supabase.from("question_responses").delete().eq("assessment_id", deleteId);
      await supabase.from("domain_scores").delete().eq("assessment_id", deleteId);
      const { error } = await supabase.from("assessments").delete().eq("id", deleteId);
      if (error) throw error;

      setAssessments((prev) => prev.filter((a) => a.id !== deleteId));
      toast({ title: "Report deleted", description: "The assessment has been permanently removed." });
    } catch (e: any) {
      toast({
        title: "Delete failed",
        description: e?.message ?? "Could not delete this assessment.",
        variant: "destructive",
      });
    } finally {
      setDeleting(false);
      setDeleteId(null);
    }
  };


  if (loading || !site) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center gap-2">
          <Button variant="ghost" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary-foreground/10">
            <Home className="mr-2 h-4 w-4" />
            Home
          </Button>
          <Button variant="ghost" onClick={() => navigate(-1)} className="text-primary-foreground hover:bg-primary-foreground/10">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        <div className="mb-8">
          <h1 className="text-4xl font-heading font-bold text-foreground mb-3">{site.name}</h1>
          <div className="flex flex-wrap items-center gap-3 text-muted-foreground">
            <span className="flex items-center gap-1.5">
              <MapPin className="h-4 w-4" />
              {site.city}{site.state && `, ${site.state}`}
            </span>
            <span className="text-muted-foreground/50">•</span>
            <span className="px-3 py-1 bg-secondary/10 text-secondary rounded-lg font-medium text-sm">
              {site.site_type}
            </span>
            <span className={`px-3 py-1 rounded-lg font-medium text-sm ${
              site.criticality === "high" 
                ? "bg-score-low/10 text-score-low" 
                : site.criticality === "medium"
                ? "bg-score-medium/10 text-score-medium"
                : "bg-score-high/10 text-score-high"
            }`}>
              {site.criticality} criticality
            </span>
            {site.headcount_band && (
              <>
                <span className="text-muted-foreground/50">•</span>
                <span className="text-sm">Headcount: {site.headcount_band}</span>
              </>
            )}
          </div>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-heading font-bold">Intelligence Diagnostics</h2>
            <Button onClick={handleStartAssessment} size="lg" className="bg-secondary hover:bg-secondary/90">
              <ClipboardList className="mr-2 h-5 w-5" />
              Initiate New Diagnostic
            </Button>
          </div>

          {assessments.length === 0 ? (
            <Card className="premium-card p-16 text-center border-dashed border-2">
              <div className="p-4 rounded-full bg-muted/50 w-24 h-24 mx-auto mb-6 flex items-center justify-center">
                <FileText className="h-12 w-12 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-heading font-semibold mb-3">No diagnostics on record</h3>
              <p className="text-muted-foreground mb-8 max-w-md mx-auto">
                Initiate the first Intelligence Diagnostic to assess this site's security maturity and surface actionable findings.
              </p>
              <Button onClick={handleStartAssessment} size="lg" className="bg-secondary hover:bg-secondary/90">
                <ClipboardList className="mr-2 h-5 w-5" />
                Initiate Diagnostic
              </Button>
            </Card>
          ) : (
            <div className="space-y-4">
              {assessments.map((assessment) => {
                const isReady = (assessment.review_status ?? "report_ready") === "report_ready";
                const target = isReady
                  ? `/assessments/${assessment.id}`
                  : `/assessments/${assessment.id}/submitted`;
                return (
                <Card
                  key={assessment.id}
                  className="premium-card p-6 cursor-pointer border-l-4 border-l-secondary/50 hover:border-l-secondary group"
                  onClick={() => navigate(target)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-xl font-heading font-semibold mb-2 group-hover:text-secondary transition-colors">
                        Diagnostic submitted by {assessment.created_by_name}
                      </h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <ClipboardList className="h-4 w-4" />
                        {new Date(assessment.created_at).toLocaleDateString("en-IN", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
                      </p>
                    </div>
                    <div className="flex items-center gap-6">
                      {isReady && assessment.overall_score_0_100 !== null && (
                        <div className="text-center">
                          <div className={`text-4xl font-mono font-bold ${
                            assessment.overall_score_0_100 >= 75 ? 'text-accent' :
                            assessment.overall_score_0_100 >= 50 ? 'text-score-medium' :
                            'text-score-low'
                          }`}>
                            {assessment.overall_score_0_100.toFixed(0)}
                          </div>
                          <p className="text-xs text-muted-foreground mt-1">Posture Index</p>
                        </div>
                      )}
                      <div className="flex flex-col gap-2 items-end">
                        {!isReady ? (
                          <Badge variant="outline" className="font-medium border-secondary text-secondary">
                            Under Review
                          </Badge>
                        ) : (
                          <Badge className="font-medium bg-accent/15 text-accent hover:bg-accent/15">
                            Intelligence Report Ready
                          </Badge>
                        )}
                        {isReady && assessment.risk_posture && (
                          <Badge
                            variant="outline"
                            className={`font-medium ${
                              assessment.risk_posture === "High Risk"
                                ? "border-score-low text-score-low"
                                : assessment.risk_posture === "Developing"
                                ? "border-score-medium text-score-medium"
                                : "border-accent text-accent"
                            }`}
                          >
                            {assessment.risk_posture}
                          </Badge>
                        )}
                        {assessment.status === "draft" && (
                          <Badge variant="secondary" className="font-medium">Draft</Badge>
                        )}
                      </div>
                      <div className="flex items-center gap-1 ml-2" onClick={(e) => e.stopPropagation()}>
                        {assessment.status === "draft" ? (
                          <>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Edit assessment"
                              onClick={() => navigate(`/assessments/${assessment.id}/edit`)}
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              aria-label="Delete assessment"
                              className="text-destructive hover:text-destructive hover:bg-destructive/10"
                              onClick={() => setDeleteId(assessment.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <span className="text-[10px] uppercase tracking-wide text-muted-foreground px-2">
                            Locked
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                </Card>
                );
              })}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteId} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this assessment?</AlertDialogTitle>
            <AlertDialogDescription>
              This permanently removes the report, all question responses, and domain scores. This action cannot be undone.
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

export default SiteDetail;