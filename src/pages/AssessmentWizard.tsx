import { useState, useEffect, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";
import { ArrowLeft, Save, ChevronDown, Home, FileText, Lock, Check, AlertCircle, Info } from "lucide-react";
import { Link } from "react-router-dom";
import { useToast } from "@/hooks/use-toast";
import { useHasFullAccess } from "@/hooks/useHasFullAccess";
import { useAssessmentQuota } from "@/hooks/useAssessmentQuota";
import { FREE_LAUNCH_MODE } from "@/config/launchMode";
import QuotaReachedCard from "@/components/QuotaReachedCard";
import { ASSESSMENT_DOMAINS, getRatingLabel } from "@/lib/questions";
import { errorToast } from "@/lib/errors";

interface QuestionResponse {
  question_code: string;
  rating_0_4: number;
  comment: string;
  assessor_comment: string;
  evidence_note: string;
}

const AssessmentWizard = () => {
  const { siteId, id: editId } = useParams();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const { user } = useAuth();
  const { profile } = useProfile();
  const { hasFullAccess } = useHasFullAccess();
  const quota = useAssessmentQuota();
  const [loading, setLoading] = useState(false);
  const [autoSaving, setAutoSaving] = useState(false);
  const [lastSavedAt, setLastSavedAt] = useState<Date | null>(null);
  const [initialLoading, setInitialLoading] = useState(!!editId);
  const [assessmentId, setAssessmentId] = useState<string | null>(editId || null);
  const [currentSiteId, setCurrentSiteId] = useState<string | null>(siteId || null);
  const [currentDomain, setCurrentDomain] = useState(0);
  const [showValidation, setShowValidation] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);
  const [recentlyCompletedDomain, setRecentlyCompletedDomain] = useState<number | null>(null);
  const questionRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const silentFailCountRef = useRef(0);
  const hasShownResumeToastRef = useRef(false);
  const prevDomainCompleteRef = useRef<boolean[]>([]);

  // Prefill from DiagnosticStart router state so we never re-ask the user.
  const prefill = (location.state as any)?.prefill as
    | { created_by_name?: string; created_by_role?: string }
    | undefined;
  const [metadata, setMetadata] = useState({
    created_by_name: prefill?.created_by_name || "",
    created_by_role: prefill?.created_by_role || "",
  });
  const prefilled = !!(prefill?.created_by_name && prefill?.created_by_role);

  // Hydrate name & designation from the verified profile when starting a new
  // assessment without router-state prefill. Existing drafts (editId) load
  // their own metadata so we don't overwrite them.
  useEffect(() => {
    if (editId) return;
    if (!profile) return;
    setMetadata((m) => ({
      created_by_name: m.created_by_name || profile.full_name || "",
      created_by_role: m.created_by_role || profile.designation || "",
    }));
  }, [profile, editId]);


  const [responses, setResponses] = useState<Record<string, QuestionResponse>>({});

  useEffect(() => {
    // Initialize empty responses
    const initialResponses: Record<string, QuestionResponse> = {};
    ASSESSMENT_DOMAINS.forEach(domain => {
      domain.questions.forEach(q => {
        initialResponses[q.code] = {
          question_code: q.code,
          rating_0_4: 0,
          comment: "",
          assessor_comment: "",
          evidence_note: "",
        };
      });
    });
    setResponses(initialResponses);
    
    // If editing, load existing assessment data
    if (editId) {
      loadExistingAssessment(editId, initialResponses);
    }
  }, [editId]);

  const loadExistingAssessment = async (id: string, initialResponses: Record<string, QuestionResponse>) => {
    try {
      // Fetch assessment metadata
      const { data: assessment, error: assessmentError } = await supabase
        .from("assessments")
        .select("*")
        .eq("id", id)
        .single();

      if (assessmentError) throw assessmentError;

      setCurrentSiteId(assessment.site_id);
      setMetadata({
        created_by_name: assessment.created_by_name,
        created_by_role: assessment.created_by_role,
      });

      // Fetch existing responses
      const { data: existingResponses, error: responsesError } = await supabase
        .from("question_responses")
        .select("*")
        .eq("assessment_id", id);

      if (responsesError) throw responsesError;

      // Merge existing responses with initial
      // DB stores 0-4, UI uses 1-5, so add 1 when loading
      const mergedResponses = { ...initialResponses };
      existingResponses?.forEach(resp => {
        if (mergedResponses[resp.question_code]) {
          mergedResponses[resp.question_code] = {
            question_code: resp.question_code,
            rating_0_4: resp.rating_0_4 + 1, // Convert 0-4 to 1-5 for UI
            comment: resp.comment || "",
            assessor_comment: resp.assessor_comment || "",
            evidence_note: resp.evidence_note || "",
          };
        }
      });

      setResponses(mergedResponses);

      // Resume toast — fire once per mount when prior answers exist.
      const answeredCodes = new Set(
        (existingResponses ?? []).map((r: any) => r.question_code),
      );
      if (answeredCodes.size > 0 && !hasShownResumeToastRef.current) {
        let resumeDomainIdx = 0;
        let resumeQNumber = 1;
        outer: for (let di = 0; di < ASSESSMENT_DOMAINS.length; di++) {
          const qs = ASSESSMENT_DOMAINS[di].questions;
          for (let qi = 0; qi < qs.length; qi++) {
            if (!answeredCodes.has(qs[qi].code)) {
              resumeDomainIdx = di;
              resumeQNumber = qi + 1;
              break outer;
            }
            // If we reach the very end, point at the last question.
            if (di === ASSESSMENT_DOMAINS.length - 1 && qi === qs.length - 1) {
              resumeDomainIdx = di;
              resumeQNumber = qi + 1;
            }
          }
        }
        setCurrentDomain(resumeDomainIdx);
        hasShownResumeToastRef.current = true;
        setShowBriefing(false);
        toast({
          title: "Welcome back",
          description: `We've restored your previous assessment. Continuing at ${ASSESSMENT_DOMAINS[resumeDomainIdx].name} · Q${resumeQNumber}.`,
        });
      }
    } catch (error: any) {
      toast(errorToast(error, "save"));
      navigate("/");
    } finally {
      setInitialLoading(false);
    }
  };

  const totalQuestions = ASSESSMENT_DOMAINS.reduce((acc, d) => acc + d.questions.length, 0);
  const answeredQuestions = Object.values(responses).filter(r => r.rating_0_4 > 0).length;
  const progress = (answeredQuestions / totalQuestions) * 100;

  const currentDomainAnswered = useMemo(
    () => ASSESSMENT_DOMAINS[currentDomain].questions.filter(
      q => (responses[q.code]?.rating_0_4 ?? 0) > 0
    ).length,
    [responses, currentDomain]
  );
  const currentDomainTotal = ASSESSMENT_DOMAINS[currentDomain].questions.length;

  // Which domains are fully complete (every question answered).
  const domainComplete = useMemo(
    () => ASSESSMENT_DOMAINS.map(d => d.questions.every(q => (responses[q.code]?.rating_0_4 ?? 0) > 0)),
    [responses],
  );
  // A future domain is locked unless every preceding domain is complete.
  const isDomainLocked = (idx: number) => {
    for (let i = 0; i < idx; i++) if (!domainComplete[i]) return true;
    return false;
  };
  const currentDomainIsComplete = domainComplete[currentDomain];

  // Estimated time remaining: ~30s per unanswered question.
  const minutesRemaining = Math.max(0, Math.ceil((totalQuestions - answeredQuestions) * 0.5));

  // Detect when a domain transitions from incomplete → complete and surface a banner.
  useEffect(() => {
    const prev = prevDomainCompleteRef.current;
    domainComplete.forEach((done, idx) => {
      if (done && !prev[idx]) {
        setRecentlyCompletedDomain(idx);
        const t = setTimeout(() => {
          setRecentlyCompletedDomain((curr) => (curr === idx ? null : curr));
        }, 6000);
        return () => clearTimeout(t);
      }
    });
    prevDomainCompleteRef.current = domainComplete;
  }, [domainComplete]);

  const focusFirstUnanswered = (domainIndex: number) => {
    const first = ASSESSMENT_DOMAINS[domainIndex].questions.find(
      q => (responses[q.code]?.rating_0_4 ?? 0) === 0,
    );
    if (!first) return;
    setShowValidation(true);
    requestAnimationFrame(() => {
      const el = questionRefs.current[first.code];
      el?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  };

  const tryGoToDomain = (targetIdx: number) => {
    if (targetIdx <= currentDomain) {
      setCurrentDomain(targetIdx);
      setShowValidation(false);
      return;
    }
    // Forward: every domain up to and including the current must be complete.
    for (let i = 0; i <= currentDomain; i++) {
      if (!domainComplete[i]) {
        toast({
          title: "Complete this domain first",
          description: "Please answer all questions in this domain before proceeding.",
          variant: "destructive",
        });
        focusFirstUnanswered(i);
        if (i !== currentDomain) setCurrentDomain(i);
        return;
      }
    }
    setCurrentDomain(targetIdx);
    setShowValidation(false);
  };

  const handleRatingChange = (questionCode: string, rating: number) => {
    setResponses(prev => ({
      ...prev,
      [questionCode]: { ...prev[questionCode], rating_0_4: rating },
    }));
  };


  const handleCommentChange = (questionCode: string, comment: string) => {
    setResponses(prev => ({
      ...prev,
      [questionCode]: { ...prev[questionCode], comment },
    }));
  };

  const handleAssessorCommentChange = (questionCode: string, assessor_comment: string) => {
    setResponses(prev => ({
      ...prev,
      [questionCode]: { ...prev[questionCode], assessor_comment },
    }));
  };

  const handleEvidenceNoteChange = (questionCode: string, evidence_note: string) => {
    setResponses(prev => ({
      ...prev,
      [questionCode]: { ...prev[questionCode], evidence_note },
    }));
  };

  const saveDraft = async (opts: { silent?: boolean } = {}): Promise<string | null> => {
    const { silent = false } = opts;
    const fallbackName = profile?.full_name || user?.email?.split("@")[0] || "Verified user";

    if (silent) setAutoSaving(true); else setLoading(true);

    try {
      if (!user?.id) {
        throw new Error("Not authenticated");
      }
      const clean = (s: string) => s.trim().replace(/<[^>]*>/g, '').slice(0, 200);
      const cleanName = clean(metadata.created_by_name || fallbackName);
      const cleanRole = clean(metadata.created_by_role || "Not specified");

      let currentAssessmentId = assessmentId;

      if (!currentAssessmentId) {
        const { data: newAssessment, error: assessmentError } = await supabase
          .from("assessments")
          .insert([{
            site_id: currentSiteId,
            created_by_name: cleanName,
            created_by_role: cleanRole,
            status: "draft",
            user_id: user.id,
          } as any])
          .select()
          .single();

        if (assessmentError) throw assessmentError;
        currentAssessmentId = newAssessment.id;
        setAssessmentId(currentAssessmentId);
      }

      // UI uses 1-5 rating, DB expects 0-4, so subtract 1 when saving
      const responsesToSave = Object.values(responses)
        .filter(r => r.rating_0_4 > 0)
        .map(resp => {
          const domain = ASSESSMENT_DOMAINS.find(d => 
            d.questions.some(q => q.code === resp.question_code)
          );
          const q = domain?.questions.find(q => q.code === resp.question_code);
          
          return {
            assessment_id: currentAssessmentId,
            question_code: resp.question_code,
            question_text: q?.text || '',
            rating_0_4: resp.rating_0_4 - 1, // Convert 1-5 to 0-4 for DB
            comment: resp.comment || null,
            assessor_comment: resp.assessor_comment || null,
            evidence_note: resp.evidence_note || null,
            domain_key: domain?.key || ''
          };
        });

      if (responsesToSave.length > 0) {
        const { error: deleteError } = await supabase
          .from("question_responses")
          .delete()
          .eq("assessment_id", currentAssessmentId);

        if (deleteError) throw deleteError;

        const { error: insertError } = await supabase
          .from("question_responses")
          .insert(responsesToSave);

        if (insertError) throw insertError;
      }

      setLastSavedAt(new Date());
      silentFailCountRef.current = 0;
      if (!silent) {
        toast({
          title: "Draft saved",
          description: "Your progress has been saved successfully.",
        });
      }
      return currentAssessmentId;
    } catch (error: any) {
      if (silent) {
        console.error("[SIP] Silent auto-save failed:", error);
        silentFailCountRef.current += 1;
        if (silentFailCountRef.current >= 3) {
          toast({
            title: "We're having difficulty saving your progress",
            description: "Please remain on this page while we reconnect.",
            variant: "destructive",
          });
          silentFailCountRef.current = 0;
        }
        return null;
      } else {
        toast({
          title: "Could not save your progress",
          description: "Please check your connection and try again.",
          variant: "destructive",
        });
        throw error;
      }
    } finally {
      if (silent) setAutoSaving(false); else setLoading(false);
    }
  };

  // Debounced silent autosave on responses/metadata changes
  useEffect(() => {
    if (initialLoading) return;
    if (!metadata.created_by_name && !profile?.full_name) return;
    const hasAnyAnswer = Object.values(responses).some(r => r.rating_0_4 > 0);
    if (!hasAnyAnswer) return;
    const t = setTimeout(() => { saveDraft({ silent: true }); }, 1500);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [responses, metadata.created_by_name, metadata.created_by_role, initialLoading]);


  const submitAssessment = async () => {
    const unanswered = Object.values(responses).filter(r => r.rating_0_4 === 0).length;

    if (unanswered > 0) {
      toast({
        title: "Assessment incomplete",
        description: `Please answer all ${totalQuestions} questions (${unanswered} remaining).`,
        variant: "destructive",
      });
      return;
    }

    let savedId: string | null = null;
    try {
      savedId = await saveDraft();
    } catch (e: any) {
      // saveDraft already surfaced a friendly toast.
      return;
    }

    // Avoid the React-state race: read the latest ID locally rather than from state.
    const effectiveId = assessmentId ?? savedId;
    if (!effectiveId) {
      toast({
        title: "Could not start your assessment",
        description: "Please refresh the page and try again. Your progress is auto-saved.",
        variant: "destructive",
      });
      return;
    }

    setLoading(true);
    try {
      // Free Launch Mode: skip the payment gate entirely. Payment infra remains
      // intact and can be re-enabled by flipping FREE_LAUNCH_MODE to false.
      if (!FREE_LAUNCH_MODE) {
        const { data: paidRow } = await supabase
          .from("assessments")
          .select("paid" as any)
          .eq("id", effectiveId)
          .maybeSingle();
        const isPaid = (paidRow as any)?.paid === true;

        if (!isPaid && !hasFullAccess) {
          setLoading(false);
          toast({
            title: "Unlock required",
            description: "Complete payment to generate your full diagnostic.",
          });
          navigate(`/unlock?assessment=${effectiveId}&next=${encodeURIComponent(`/assessments/${effectiveId}/submitted`)}`);
          return;
        }
      }

      // Mark the assessment as submitted BEFORE scoring so downstream writes
      // (calculate-scores → review_status='report_ready') are the final state.
      // Previously this ran AFTER calculate-scores and clobbered the
      // 'report_ready' flag with 'pending_review', which forced users to wait
      // for admin approval to see their report.
      try {
        await supabase
          .from("assessments")
          .update({
            submitted_at: new Date().toISOString(),
            status: "submitted",
          } as any)
          .eq("id", effectiveId);
      } catch (updateErr) {
        console.error("assessment status update failed:", updateErr);
      }

      // Run scoring. calculate-scores writes rule-based insights and sets
      // review_status='report_ready' — the guaranteed zero-AI path so the
      // 120s countdown reveals the report without admin intervention.
      const { error: scoringError } = await supabase.functions.invoke("calculate-scores", {
        body: { assessment_id: effectiveId },
      });
      if (scoringError) {
        console.error("calculate-scores failed (continuing to submit):", scoringError);
      }


      // Fire generate-insights AND generate-report-on-submit in parallel.
      // generate-report-on-submit now flips review_status='report_ready'
      // on entry, so the user is unblocked as soon as the function starts —
      // even if AI insights are still running. AssessmentResults auto-retries
      // insights if they haven't landed yet.
      //
      // We DON'T await either call here: holding the wizard for 30–60s
      // creates worse UX than letting the submitted page show its countdown.
      supabase.functions
        .invoke("generate-insights", { body: { assessment_id: effectiveId } })
        .then(({ error }) => {
          if (error) console.warn("[SIP] generate-insights returned error:", error);
        })
        .catch((err) => console.warn("[SIP] generate-insights threw:", err));

      supabase.functions
        .invoke("generate-report-on-submit", { body: { assessment_id: effectiveId } })
        .catch((err) => console.error("generate-report-on-submit invoke failed", err));

      toast({
        title: "Assessment submitted",
        description: "Your Quick Intelligence Report is being prepared.",
      });

      navigate(`/assessments/${effectiveId}/submitted`);
    } catch (error: any) {
      toast(errorToast(error, "submit"));
    } finally {
      setLoading(false);
    }
  };

  if (initialLoading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Preparing your diagnostic workspace…</p>
        </div>
      </div>
    );
  }

  // Free Launch Mode: block starting a NEW assessment once the complimentary
  // quota is exhausted. Existing drafts (editId) and submitted reports remain
  // fully accessible.
  if (!editId && !assessmentId && quota.atLimit && !quota.loading) {
    return (
      <div className="min-h-dvh bg-background">
        <div className="container mx-auto max-w-3xl px-6 py-16">
          <QuotaReachedCard />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Button variant="ghost" size="icon" onClick={() => navigate("/")} className="text-primary-foreground hover:bg-primary-foreground/10">
                <Home className="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="icon" onClick={() => navigate(-1)} className="text-primary-foreground hover:bg-primary-foreground/10">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div>
                <h1 className="text-2xl font-heading font-bold">Security Selfie™</h1>
                <p className="text-sm text-primary-foreground/80">Your personal site security diagnostic</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-primary-foreground/70 hidden md:inline-flex items-center gap-1.5">
                {autoSaving ? (
                  <>Saving…</>
                ) : lastSavedAt ? (
                  <><Check className="h-3 w-3" /> Saved · just now</>
                ) : null}
              </span>
              <Button onClick={() => saveDraft()} disabled={loading || autoSaving} variant="ghost" className="text-primary-foreground hover:bg-primary-foreground/10 border border-primary-foreground/20">
                <Save className="mr-2 h-4 w-4" />
                Save Progress
              </Button>
            </div>
          </div>
          <div className="mt-4 space-y-2">
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-sm">
              <span className="font-medium">
                Domain {currentDomain + 1} of {ASSESSMENT_DOMAINS.length}
                <span className="text-primary-foreground/70 font-normal"> · </span>
                {currentDomainAnswered} of {currentDomainTotal} questions answered
              </span>
              <span className="font-mono">
                {answeredQuestions} / {totalQuestions} · {Math.round(progress)}%
              </span>
            </div>
            <Progress value={progress} variant="brand" className="h-3 md:h-2.5" />
            <div className="flex flex-wrap justify-between gap-x-4 gap-y-1 text-xs text-primary-foreground/80 pt-0.5">
              <span>
                {answeredQuestions < totalQuestions
                  ? `Approx. ${minutesRemaining} minute${minutesRemaining === 1 ? "" : "s"} remaining`
                  : "All questions answered — ready for submission"}
              </span>
              {prefilled && (
                <span>Welcome, {metadata.created_by_name.split(" ")[0]} — your details are on file.</span>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8 max-w-6xl">
        {/* Floating save indicator — mobile only */}
        {answeredQuestions >= 3 && autoSaving && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-40 md:hidden inline-flex items-center gap-2 rounded-full bg-foreground/90 text-background px-4 py-2 text-xs font-medium shadow-lg backdrop-blur">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Saving your answers…
          </div>
        )}
        {showBriefing && !editId && answeredQuestions === 0 && (
          <Card className="premium-card p-8 md:p-10 mb-6">
            <p className="text-[11px] uppercase tracking-[0.28em] text-secondary font-semibold mb-3">
              Assessment Brief
            </p>
            <h2 className="text-2xl md:text-3xl font-heading font-bold text-foreground mb-3">
              Before you begin
            </h2>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 max-w-2xl">
              The Security Selfie™ is a structured operational diagnostic conducted across
              <span className="font-semibold text-foreground"> {ASSESSMENT_DOMAINS.length} security domains</span>.
              Each response is reviewed by our intelligence engine and a senior advisor before your report is released.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Estimated time</p>
                <p className="text-sm font-semibold text-foreground">25–30 minutes</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Domains</p>
                <p className="text-sm font-semibold text-foreground">{ASSESSMENT_DOMAINS.length} domains</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Questions</p>
                <p className="text-sm font-semibold text-foreground">{totalQuestions} structured items</p>
              </div>
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3">
                <p className="text-[11px] uppercase tracking-wide text-muted-foreground mb-1">Progress</p>
                <p className="text-sm font-semibold text-foreground">Auto-saved continuously</p>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-card p-5 mb-6">
              <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold mb-3">
                Maturity scale
              </p>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-2 text-xs">
                {[
                  { n: 1, label: "Ad-hoc" },
                  { n: 2, label: "Developing" },
                  { n: 3, label: "Defined" },
                  { n: 4, label: "Managed" },
                  { n: 5, label: "Resilient" },
                ].map((s) => (
                  <div key={s.n} className="flex items-center gap-2 rounded-lg bg-muted/40 px-2.5 py-2">
                    <span className="font-mono font-bold text-secondary">{s.n}</span>
                    <span className="text-foreground">{s.label}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-lg border-l-4 border-l-accent bg-accent/5 px-4 py-3 mb-6">
              <p className="text-sm text-foreground leading-relaxed">
                <span className="font-semibold">Honest responses produce intelligent reports.</span>{" "}
                Inflated answers will inflate your risk posture and reduce the value of every recommendation.
              </p>
            </div>

            <Button
              onClick={() => setShowBriefing(false)}
              size="lg"
              className="bg-secondary hover:bg-secondary/90"
            >
              Begin Assessment
            </Button>
          </Card>
        )}

        <Card className={`premium-card ${showBriefing && !editId && answeredQuestions === 0 ? "hidden" : ""}`}>
          {!assessmentId && !prefilled && (
            <div className="p-6 mb-6 bg-gradient-to-br from-secondary/10 to-secondary/5 rounded-xl border-b">
              <h3 className="font-heading font-semibold text-lg mb-4">Reviewer Identification</h3>
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <Label className="text-sm font-medium">Full name</Label>
                  <Input
                    value={metadata.created_by_name}
                    onChange={(e) => setMetadata({ ...metadata, created_by_name: e.target.value })}
                    placeholder="Enter your name"
                    className="mt-1.5"
                  />
                </div>
                <div>
                  <Label className="text-sm font-medium">Role</Label>
                  <Input
                    value={metadata.created_by_role}
                    onChange={(e) => setMetadata({ ...metadata, created_by_role: e.target.value })}
                    placeholder="e.g., Security Manager, Facility Head"
                    className="mt-1.5"
                  />
                </div>
              </div>
            </div>
          )}

          <Tabs value={currentDomain.toString()} onValueChange={(v) => tryGoToDomain(parseInt(v))} className="p-6">
            <TabsList className="grid grid-cols-5 lg:grid-cols-10 mb-8 bg-muted/50 overflow-x-auto scrollbar-hide">
              {ASSESSMENT_DOMAINS.map((domain, index) => {
                const locked = isDomainLocked(index);
                const done = domainComplete[index];
                return (
                  <TabsTrigger
                    key={domain.key}
                    value={index.toString()}
                    disabled={locked}
                    title={locked ? "Complete previous domains first" : domain.name}
                    className="font-mono data-[state=active]:bg-secondary data-[state=active]:text-secondary-foreground gap-1"
                  >
                    {done ? <Check className="h-3 w-3" /> : locked ? <Lock className="h-3 w-3" /> : null}
                    {index + 1}
                  </TabsTrigger>
                );
              })}
            </TabsList>


            {ASSESSMENT_DOMAINS.map((domain, domainIndex) => (
              <TabsContent key={domain.key} value={domainIndex.toString()} className="space-y-6">
                <div className="mb-8 p-6 bg-gradient-to-br from-primary/5 to-primary/10 rounded-xl border-l-4 border-l-secondary">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 rounded-lg bg-secondary/10">
                      {/* Domain icon would go here */}
                    </div>
                    <div>
                      <h2 className="text-2xl font-heading font-bold text-foreground">
                        Domain {domainIndex + 1}: {domain.name}
                      </h2>
                      <p className="text-sm text-muted-foreground mt-1">{domain.description}</p>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center gap-4">
                    <div className="text-sm">
                      <span className="text-muted-foreground">Progress: </span>
                      <span className="font-mono font-semibold text-secondary">
                        {currentDomainAnswered} / {domain.questions.length}
                      </span>
                    </div>
                    <Progress
                      value={(currentDomainAnswered / domain.questions.length) * 100}
                      variant="brand"
                      className="flex-1 h-2.5"
                    />

                  </div>
                </div>

                {domain.questions.map((question, qIndex) => {
                  const unanswered = (responses[question.code]?.rating_0_4 ?? 0) === 0;
                  const invalid = showValidation && unanswered;
                  return (
                  <div
                    key={question.code}
                    ref={(el) => { questionRefs.current[question.code] = el; }}
                    className={`pb-8 mb-8 border-b border-border last:border-0 ${invalid ? "pmi-question-invalid" : ""}`}
                  >
                    <div className="mb-5 flex items-start gap-3">
                      <span className="shrink-0 inline-flex items-center justify-center min-w-[2.25rem] h-9 px-2 rounded-lg bg-secondary/10 text-secondary font-mono text-sm font-semibold">
                        Q{qIndex + 1}
                      </span>
                      <div className="flex-1">
                        <Label className="text-base md:text-[17px] font-medium text-foreground block leading-relaxed">
                          {question.text}
                          {invalid && (
                            <span className="ml-2 inline-flex items-center gap-1 text-xs font-medium text-destructive align-middle">
                              <AlertCircle className="h-3 w-3" /> Required
                            </span>
                          )}
                        </Label>
                      </div>
                      {(question.why || question.evidenceHint) && (
                        <Collapsible>
                          <CollapsibleTrigger asChild>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 shrink-0 text-muted-foreground hover:text-foreground"
                              aria-label="Help · why this question matters"
                              title="Help · why this question matters"
                            >
                              <Info className="h-4 w-4" />
                            </Button>
                          </CollapsibleTrigger>
                          <CollapsibleContent className="col-span-full mt-3 w-full">
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-4 rounded-lg bg-muted/20 border border-border/50">
                              {question.why && (
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">What this means · Why it matters</p>
                                  <p className="text-xs text-foreground leading-relaxed">{question.why}</p>
                                </div>
                              )}
                              {question.evidenceHint && (
                                <div>
                                  <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Evidence to look for</p>
                                  <p className="text-xs text-foreground leading-relaxed">{question.evidenceHint}</p>
                                </div>
                              )}
                            </div>
                          </CollapsibleContent>
                        </Collapsible>
                      )}
                    </div>

                    <div className="grid grid-cols-5 gap-2 mb-4">
                      {[1, 2, 3, 4, 5].map((rating) => (
                        <button
                          key={rating}
                          type="button"
                          onClick={() => handleRatingChange(question.code, rating)}
                          className={`min-h-[60px] px-2 sm:px-4 py-2 rounded-lg border-2 transition-all font-medium text-sm ${
                            responses[question.code]?.rating_0_4 === rating
                              ? 'bg-secondary text-secondary-foreground border-secondary shadow-md'
                              : 'bg-background border-border hover:border-secondary/50 hover:bg-secondary/5'
                          }`}
                        >
                          <div className="font-mono font-bold mb-0.5">{rating}</div>
                          <div className="text-[10px] sm:text-xs opacity-90 leading-tight">{getRatingLabel(rating)}</div>
                        </button>
                      ))}
                    </div>


                    <Textarea
                      placeholder="Optional comment about this answer..."
                      value={responses[question.code]?.comment || ""}
                      onChange={(e) => handleCommentChange(question.code, e.target.value)}
                      className="mt-3 text-sm"
                      rows={2}
                    />

                    <Collapsible className="mt-3">
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="flex items-center gap-2 text-xs text-muted-foreground hover:text-foreground">
                          <ChevronDown className="h-3 w-3" />
                          Add assessor notes & evidence reference
                        </Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-3 mt-3 p-4 bg-muted/30 rounded-lg border border-border">
                        <div>
                          <Label className="text-sm font-medium text-foreground">Assessor Comment</Label>
                          <Textarea
                            placeholder="Add your professional assessor comment..."
                            value={responses[question.code]?.assessor_comment || ""}
                            onChange={(e) => handleAssessorCommentChange(question.code, e.target.value)}
                            rows={2}
                            className="mt-1.5 text-sm"
                          />
                        </div>
                        <div>
                          <Label className="text-sm font-medium text-foreground">Evidence Note / Reference</Label>
                          <Input
                            placeholder="e.g., PSARA licence file path, folder link, etc."
                            value={responses[question.code]?.evidence_note || ""}
                            onChange={(e) => handleEvidenceNoteChange(question.code, e.target.value)}
                            className="mt-1.5 text-sm"
                          />
                        </div>
                      </CollapsibleContent>
                    </Collapsible>
                  </div>
                  );
                })}

                <div className="pt-6 border-t border-border mt-8 space-y-6">
                  {recentlyCompletedDomain === domainIndex && (
                    <div className="flex items-start gap-2 rounded-lg border border-accent/40 bg-accent/10 p-4 text-sm text-foreground">
                      <Check className="h-4 w-4 mt-0.5 shrink-0 text-accent" />
                      <span>
                        <span className="font-semibold">{domain.name}</span> completed successfully.
                        {domainIndex < ASSESSMENT_DOMAINS.length - 1
                          ? " You may proceed to the next domain."
                          : " You may now submit your assessment for intelligence processing."}
                      </span>
                    </div>
                  )}
                  {!currentDomainIsComplete && domainIndex < ASSESSMENT_DOMAINS.length - 1 && (
                    <div className="flex items-start gap-2 rounded-lg border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-100">
                      <AlertCircle className="h-4 w-4 mt-0.5 shrink-0" />
                      <span>
                        Please complete all {domain.questions.length} questions in this domain before proceeding.
                        {" "}{domain.questions.length - currentDomainAnswered} remaining.
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <Button
                      variant="outline"
                      onClick={() => setCurrentDomain(Math.max(0, domainIndex - 1))}
                      disabled={domainIndex === 0}
                      size="lg"
                    >
                      ← Return to Previous Domain
                    </Button>

                    {domainIndex < ASSESSMENT_DOMAINS.length - 1 && (
                      <Button
                        onClick={() => {
                          if (!domainComplete[domainIndex]) {
                            setShowValidation(true);
                            focusFirstUnanswered(domainIndex);
                            toast({
                              title: "Please complete this domain before proceeding",
                              description: "All questions in this section must be answered first.",
                              variant: "destructive",
                            });
                            return;
                          }
                          setShowValidation(false);
                          setCurrentDomain(domainIndex + 1);
                        }}
                        size="lg"
                        className="bg-secondary hover:bg-secondary/90 disabled:opacity-60"
                        aria-disabled={!domainComplete[domainIndex]}
                      >
                        Proceed to Next Domain →
                      </Button>
                    )}
                  </div>


                  {domainIndex === ASSESSMENT_DOMAINS.length - 1 && (
                    <div className="rounded-2xl border border-secondary/30 bg-gradient-to-br from-secondary/5 to-primary/5 p-6 md:p-8">
                      <div className="flex items-start gap-3 mb-4">
                        <div className="p-2 rounded-lg bg-secondary/15 text-secondary">
                          <Lock className="h-5 w-5" />
                        </div>
                        <div>
                          <h3 className="font-heading text-lg md:text-xl font-semibold text-foreground">
                            Ready to submit for intelligence processing
                          </h3>
                          <p className="text-sm text-muted-foreground mt-1">
                            Submit to receive your personal Security Selfie™ — structured intelligence prepared specifically for your site, available in your Command Centre within minutes.
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-col gap-3">
                        <Button
                          onClick={submitAssessment}
                          disabled={loading}
                          size="lg"
                          className="w-full h-12 bg-accent hover:bg-accent/90 text-base"
                        >
                          {loading ? "Submitting…" : "Submit My Security Selfie™ →"}
                        </Button>
                        <Link
                          to="/sample"
                          className="inline-flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground underline underline-offset-4"
                        >
                          <FileText className="h-3.5 w-3.5" />
                          Not sure yet? See a sample report
                        </Link>
                      </div>

                      <p className="mt-4 text-[10px] uppercase tracking-[0.22em] text-muted-foreground text-center">
                        Reviewed · Structured · Operationally grounded
                      </p>
                    </div>
                  )}
                </div>
              </TabsContent>
            ))}
          </Tabs>
        </Card>
      </main>
    </div>
  );
};

export default AssessmentWizard;
