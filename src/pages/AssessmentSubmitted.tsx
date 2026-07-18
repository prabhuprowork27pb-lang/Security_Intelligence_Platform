import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2,
  Clock3,
  ShieldCheck,
  Home,
  ArrowRight,
  Loader2,
  Sparkles,
} from "lucide-react";
import ConfidentialWatermark from "@/components/ConfidentialWatermark";
import ReportOwnershipBanner from "@/components/ReportOwnershipBanner";

interface AssessmentSnapshot {
  id: string;
  risk_posture: string | null;
  review_status: string | null;
  report_status: string | null;
  submitted_at: string | null;
  report_ready_at: string | null;
  overall_score_0_100: number | null;
  sites: { name: string; city: string | null } | null;
}

const TOTAL_SECONDS = 120;

// Status narration bands — keep the prep feeling alive, on-brand and unfussy.
const STATUS_BANDS: { from: number; label: string }[] = [
  { from: 0,  label: "Scoring your ten domains against the SIP™ knowledge graph…" },
  { from: 25, label: "Detecting site-specific patterns and signature findings…" },
  { from: 55, label: "Drafting the executive intelligence layer…" },
  { from: 90, label: "Rendering your Security Intelligence Report™…" },
  { from: 115, label: "Finalising your Command Centre view…" },
];

const STAGES = [
  { key: "received", label: "Diagnostic data received & scored", until: 25 },
  { key: "ai",       label: "Intelligence layer being generated", until: 90 },
  { key: "pdf",      label: "Report being rendered",              until: 115 },
  { key: "ready",    label: "Released to your Command Centre",    until: TOTAL_SECONDS },
];

function fmt(s: number) {
  const m = Math.floor(s / 60).toString().padStart(2, "0");
  const r = Math.floor(s % 60).toString().padStart(2, "0");
  return `${m}:${r}`;
}

function statusFor(elapsed: number) {
  let current = STATUS_BANDS[0].label;
  for (const b of STATUS_BANDS) if (elapsed >= b.from) current = b.label;
  return current;
}


const AssessmentSubmitted = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [assessment, setAssessment] = useState<AssessmentSnapshot | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number>(Date.now());
  const navigatedRef = useRef(false);


  const isReady = (a: AssessmentSnapshot | null) =>
    !!a && (a.review_status === "report_ready" || a.report_status === "sent");

  const load = async (isPoll = false) => {
    if (!id) {
      setLoadError("Missing assessment reference.");
      setLoading(false);
      return;
    }
    try {
      const { data, error } = await supabase
        .from("assessments")
        .select(
          "id, risk_posture, review_status, report_status, submitted_at, report_ready_at, overall_score_0_100, sites(name, city)" as any,
        )
        .eq("id", id)
        .maybeSingle();
      if (error) throw error;
      if (!data) {
        setAssessment(null);
        setLoadError("We couldn't load this submission. It may still be syncing, or you may not have access.");
        setLoading(false);
        return;
      }
      setLoadError(null);
      setAssessment(data as any);
      setLoading(false);
      // Reveal is gated on BOTH backend-ready AND full 120s elapsed —
      // handled in the effect below so we never shortcut the countdown.

    } catch (err: any) {
      console.error("AssessmentSubmitted load failed:", err);
      if (!isPoll) {
        setLoadError("We couldn't load this submission right now.");
        setLoading(false);
      }
    }
  };

  // Initial load + 5s polling (hard-cap 10 min)
  useEffect(() => {
    let mounted = true;
    load();
    const poll = setInterval(() => {
      if (!mounted) return;
      if ((Date.now() - startRef.current) / 1000 > 600) {
        clearInterval(poll);
        return;
      }
      load(true);
    }, 5000);
    return () => {
      mounted = false;
      clearInterval(poll);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id]);

  // 1-second timer driving the ring + narration
  useEffect(() => {
    const t = setInterval(() => {
      setElapsed(Math.min(TOTAL_SECONDS, Math.floor((Date.now() - startRef.current) / 1000)));
    }, 1000);
    return () => clearInterval(t);
  }, []);

  // Reveal gate: the visual 120s countdown is the trigger. As soon as it
  // completes we open the report in the same window — no click, no detour
  // to the Command Centre. Backend polling continues in the background;
  // the results page handles its own loading state if it isn't ready yet.
  useEffect(() => {
    if (navigatedRef.current) return;
    if (!id) return;
    if (elapsed < TOTAL_SECONDS) return;
    navigatedRef.current = true;
    setTimeout(() => navigate(`/assessments/${id}`, { replace: true }), 600);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [elapsed, id]);



  const backendReady = isReady(assessment);
  const secondsLeft = Math.max(0, TOTAL_SECONDS - elapsed);
  const progress = Math.min(100, (elapsed / TOTAL_SECONDS) * 100);
  const countdownComplete = elapsed >= TOTAL_SECONDS;
  const ready = backendReady && countdownComplete;
  const overtime = countdownComplete && !backendReady;
  const showStuckHelp = elapsed > 180 && !backendReady;
  const status = ready
    ? "Report ready — opening now…"
    : overtime
      ? "Opening your report…"
      : statusFor(elapsed);


  // Ring geometry
  const SIZE = 240;
  const STROKE = 12;
  const R = (SIZE - STROKE) / 2;
  const C = 2 * Math.PI * R;
  const dash = countdownComplete ? 0 : C * (1 - progress / 100);

  const submittedAt = assessment?.submitted_at ?? new Date().toISOString();
  const siteName = assessment?.sites?.name ?? "your site";
  const hasBlockingLoadError = !!loadError && !loading && !assessment && elapsed >= 3;

  if (hasBlockingLoadError) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center p-6">
        <Card className="max-w-md w-full p-8 text-center">
          <ShieldCheck className="h-10 w-10 text-secondary mx-auto mb-4" />
          <h1 className="font-heading font-semibold text-xl mb-2">Submission not available</h1>
          <p className="text-sm text-muted-foreground mb-6">
            {loadError ?? "We couldn't load this submission."} If you just submitted, give it a moment and retry — otherwise return to the Command Centre.
          </p>
          <div className="flex flex-col sm:flex-row gap-2 justify-center">
            <Button onClick={() => { setLoading(true); load(); }}>Retry</Button>
            <Button variant="outline" onClick={() => navigate("/dashboard")}>
              <Home className="mr-2 h-4 w-4" /> Command Centre
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background relative">
      <ConfidentialWatermark
        siteName={assessment?.sites?.name ?? undefined}
        dateIso={submittedAt}
      />

      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldCheck className="h-6 w-6" />
            <div className="leading-tight">
              <p className="text-base md:text-lg font-heading font-semibold tracking-tight">Intelligence Command Centre</p>
              <p className="text-[11px] md:text-xs text-primary-foreground/70">Security Selfie™ · Preparing Report</p>
            </div>
          </div>
          <Button
            variant="ghost"
            onClick={() => navigate("/dashboard")}
            className="text-primary-foreground hover:bg-primary-foreground/10"
          >
            <Home className="mr-2 h-4 w-4" />
            Command Centre
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 md:px-6 py-8 md:py-10 max-w-4xl">
        <ReportOwnershipBanner
          siteName={assessment?.sites?.name ?? undefined}
          assessmentDate={submittedAt}
        />

        {/* Hero: countdown ring + narration — premium platform card with gold accent */}
        <Card className="relative overflow-hidden p-6 md:p-10 border border-border/60 bg-card shadow-sm">
          {/* Gold accent line */}
          <div className="absolute top-0 left-0 right-0 h-[3px] bg-gradient-to-r from-accent/40 via-accent to-accent/40" />
          {/* Subtle dotted texture, in foreground tone for legibility on light surface */}
          <div className="absolute inset-0 opacity-[0.04] pointer-events-none"
               style={{ backgroundImage: "radial-gradient(circle at 20% 20%, hsl(var(--foreground)) 1px, transparent 1px)", backgroundSize: "22px 22px" }} />

          <div className="relative flex flex-col items-center text-center">
            <Badge variant="outline" className="border-secondary/40 bg-secondary/10 text-secondary mb-4">
              <Sparkles className="h-3.5 w-3.5 mr-1.5" />
              Preparing your intelligence
            </Badge>
            <h1 className="text-2xl md:text-4xl font-heading font-bold mb-2 text-foreground">
              Your Security Intelligence Report is being prepared
            </h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl">
              Sit tight — your full report for <span className="font-semibold text-foreground">{siteName}</span> opens automatically in under two minutes. No email wait, no admin gate.
            </p>

            <div className="mt-5 inline-flex items-center gap-3 rounded-md border border-secondary/35 bg-secondary/10 px-4 py-3 text-secondary shadow-sm">
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Clock3 className="h-5 w-5" />}
              <span className="text-sm md:text-base font-heading font-semibold tracking-normal">
                Report opens in <span className="font-mono text-xl md:text-2xl tabular-nums text-foreground">{fmt(secondsLeft)}</span>
              </span>
            </div>

            {/* Countdown ring — always visible, ticks 02:00 → 00:00 */}
            <div className="relative mt-6 md:mt-8" style={{ width: SIZE, height: SIZE, maxWidth: "min(100%, 240px)" }}>
              <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="w-full h-full -rotate-90">
                <circle
                  cx={SIZE / 2} cy={SIZE / 2} r={R}
                  stroke="hsl(var(--muted))"
                  strokeWidth={STROKE}
                  fill="none"
                />
                <circle
                  cx={SIZE / 2} cy={SIZE / 2} r={R}
                  stroke="hsl(var(--secondary))"
                  strokeWidth={STROKE}
                  strokeLinecap="round"
                  fill="none"
                  strokeDasharray={C}
                  strokeDashoffset={dash}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {countdownComplete ? (
                  <>
                    <CheckCircle2 className="h-10 w-10 mb-1 text-secondary animate-pulse" />
                    <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground">Opening</span>
                  </>
                ) : (
                  <>
                    <span className="font-mono text-4xl md:text-5xl font-semibold tabular-nums text-foreground">
                      {fmt(secondsLeft)}
                    </span>
                    <span className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground mt-1">
                      {overtime ? "Final touches" : "Remaining"}
                    </span>
                  </>
                )}
              </div>
            </div>


            {/* Rotating status narration */}
            <div className="mt-6 min-h-[2.5rem] flex items-center justify-center">
              <p
                key={status}
                className="text-sm md:text-base text-muted-foreground max-w-xl animate-fade-in"
              >
                {status}
              </p>
            </div>

            <p className="mt-6 text-[11px] uppercase tracking-[0.28em] text-muted-foreground/80">
              Structured · Operationally grounded · Delivered in real time
            </p>

          </div>
        </Card>

        {/* What's being prepared — three feature cards */}
        <div className="grid md:grid-cols-3 gap-4 mt-6 md:mt-8">
          {[
            {
              title: "AI Intelligence Engine",
              body: "Pattern recognition across 200+ Indian site assessments.",
            },
            {
              title: "10 Domain Analysis",
              body: "Every domain scored and mapped to Indian regulation.",
            },
            {
              title: "Signature Finding",
              body: "The single most important insight about your site.",
            },
          ].map((f) => (
            <Card key={f.title} className="relative overflow-hidden p-5 border border-border/60 bg-card">
              <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-accent/30 via-accent to-accent/30" />
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-lg bg-secondary/10 text-secondary shrink-0">
                  <Sparkles className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-sm font-heading font-semibold text-foreground">{f.title}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{f.body}</p>
                </div>
              </div>
            </Card>
          ))}
        </div>


        {/* Stage tracker, synced to the timer */}
        <Card className="p-6 md:p-8 mt-6 md:mt-8">
          <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
            <h2 className="text-lg md:text-xl font-heading font-bold">Report generation stages</h2>
            <div className="text-xs text-muted-foreground">
              {countdownComplete ? "Opening report" : `${fmt(secondsLeft)} remaining`}
            </div>
          </div>

          <ol className="space-y-3.5">
            {STAGES.map((stage) => {
              const done = elapsed >= stage.until;
              const prevUntil = STAGES[STAGES.indexOf(stage) - 1]?.until ?? 0;
              const active = !done && elapsed >= prevUntil;
              return (
                <li key={stage.key} className="flex items-start gap-3">
                  <div
                    className={`mt-0.5 h-7 w-7 rounded-full flex items-center justify-center shrink-0 ${
                      done
                        ? "bg-accent/15 text-accent"
                        : active
                          ? "bg-secondary/15 text-secondary"
                          : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {done ? <CheckCircle2 className="h-4 w-4" /> : <Clock3 className={`h-4 w-4 ${active ? "animate-pulse" : ""}`} />}
                  </div>
                  <p className={`flex-1 text-sm md:text-base font-medium ${
                    !done && !active ? "text-muted-foreground" : "text-foreground"
                  }`}>
                    {stage.label}
                  </p>
                  <Badge
                    variant={!done && !active ? "outline" : "default"}
                    className={
                      done
                        ? "bg-accent/15 text-accent hover:bg-accent/15"
                        : active
                          ? "bg-secondary/15 text-secondary hover:bg-secondary/15"
                          : ""
                    }
                  >
                    {done ? "Complete" : active ? "In progress" : "Pending"}
                  </Badge>
                </li>
              );
            })}
          </ol>
        </Card>

        {/* Footer actions */}
        <div className="mt-8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-sm text-muted-foreground text-center sm:text-left">
            {ready
              ? "Your report is ready — opening now."
              : "We'll open your report automatically the moment it's live."}
          </p>
          <div className="flex flex-wrap gap-2 justify-center">
            <Button
              onClick={() => navigate(`/assessments/${id}`)}
              disabled={!countdownComplete}
              className="bg-secondary hover:bg-secondary/90"
            >
              {countdownComplete ? "Open report now" : "Open report"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button onClick={() => navigate("/dashboard")} variant="outline">
              Return to Command Centre
            </Button>
          </div>
        </div>

        {showStuckHelp && (
          <Card className="p-4 mt-6 border-l-4 border-l-secondary bg-secondary/5">
            <p className="text-sm text-foreground">
              Taking longer than expected? You can safely close this page — your report will appear in the Command Centre as soon as it's ready. For help, email{" "}
              <a className="underline" href="mailto:support@securityintelplatform.com">
                support@securityintelplatform.com
              </a>.
            </p>
          </Card>
        )}
      </main>
    </div>
  );
};

export default AssessmentSubmitted;
