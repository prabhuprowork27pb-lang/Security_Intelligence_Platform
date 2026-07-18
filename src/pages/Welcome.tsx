import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { ArrowRight, Clock, ShieldCheck, BarChart3, Sparkles, Loader2, AlertTriangle, FileText, Compass } from "lucide-react";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { BRAND } from "@/lib/brand";
import { useAuth } from "@/contexts/AuthContext";
import { useProfile } from "@/hooks/useProfile";

const SCORE_SCALE = [
  { level: "1", label: "Ad-hoc — Informal, reactive" },
  { level: "2", label: "Developing — Inconsistent practice" },
  { level: "3", label: "Defined — Documented and standardised" },
  { level: "4", label: "Managed — Measured, with named owners" },
  { level: "5", label: "Resilient — Continuously improved" },
];

const DOMAINS = [
  "Governance & Policy", "Perimeter & Access Control", "Visitor Management",
  "Security Personnel & Operations", "Electronic Security Systems", "Incident Management",
  "Security Culture & Awareness", "Business Continuity & Crisis Management",
  "Compliance & Audit", "Site Context & Risk Factors",
];

const Welcome = () => {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { profile, loading } = useProfile();
  const [acknowledged, setAcknowledged] = useState(false);

  useEffect(() => {
    if (!authLoading && !user) navigate("/auth?next=/welcome", { replace: true });
  }, [user, authLoading, navigate]);

  if (loading || !profile) {
    return <div className="min-h-dvh flex items-center justify-center bg-background"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const firstName = profile.full_name.trim().split(/\s+/)[0] || profile.full_name;
  const startAssessment = () => {
    try {
      sessionStorage.removeItem("sip.pendingWelcome");
    } catch {
      /* sessionStorage unavailable — continue */
    }
    navigate("/diagnostic/start");
  };

  return (
    <>
      <Seo title={`Welcome — ${BRAND.platformTm}`} description="Before you take your Security Selfie™ — what to expect, how scoring works, and why your inputs determine the quality of your report." path="/welcome" />
      <div className="min-h-dvh bg-background">
        <SiteHeader />
        <main className="container mx-auto px-4 md:px-6 py-10 md:py-14 max-w-3xl">
          <div className="text-center mb-8 md:mb-10">
            <p className="text-[11px] uppercase tracking-[0.28em] text-secondary font-semibold mb-3">You're verified</p>
            <h1 className="font-heading text-3xl md:text-5xl font-semibold tracking-tight leading-[1.05] mb-3">Welcome, {firstName}</h1>
            <p className="text-sm md:text-base text-muted-foreground max-w-xl mx-auto leading-relaxed">
              Please read this orientation in full. The {BRAND.primary} is a professional diagnostic — the quality of your report depends entirely on the quality of your inputs.
            </p>
          </div>

          <Card className="border-border/60 mb-6">
            <CardContent className="p-6 md:p-8 space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Tile icon={<Clock className="h-5 w-5" />} title="20–30 minutes" body="Across 10 domains. Auto-saves continuously — step away and resume." />
                <Tile icon={<BarChart3 className="h-5 w-5" />} title="1–5 maturity scale" body="Each answer is rated 1 (Ad-hoc) to 5 (Resilient). Domain ratings aggregate to a 0–100 posture score." />
                <Tile icon={<ShieldCheck className="h-5 w-5" />} title="Confidential" body="Never shared, never used to train external models. For the named recipient only." />
              </div>

              <div className="rounded-lg border-l-4 border-l-destructive bg-destructive/5 p-4">
                <p className="inline-flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-destructive font-semibold mb-1">
                  <AlertTriangle className="h-3.5 w-3.5" /> Why this matters
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  Inflated or guessed inputs produce a misleading report and waste the reviewer's time. Answer honestly — even where the answer is uncomfortable — so the resulting intelligence is actually useful to your leadership.
                </p>
              </div>

              <Accordion type="multiple" className="border border-border/60 rounded-lg">
                <AccordionItem value="how" className="border-border/60">
                  <AccordionTrigger className="px-4 text-sm font-heading"><span className="inline-flex items-center gap-2"><Compass className="h-4 w-4 text-secondary" /> How the diagnostic works</span></AccordionTrigger>
                  <AccordionContent className="px-4 pb-4 text-sm text-muted-foreground space-y-2">
                    <ol className="space-y-2 list-decimal list-inside marker:text-secondary">
                      <li>Confirm your organisation and site context.</li>
                      <li>Answer structured diagnostic questions across 10 security domains.</li>
                      <li>Submit for specialist review.</li>
                      <li>Receive a reviewed intelligence report within 24 hours, in your SIP Command Centre.</li>
                    </ol>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="scoring" className="border-border/60">
                  <AccordionTrigger className="px-4 text-sm font-heading"><span className="inline-flex items-center gap-2"><BarChart3 className="h-4 w-4 text-secondary" /> How scoring works</span></AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <p className="text-sm text-muted-foreground mb-3">Scores reflect implementation depth and operational consistency, not intent.</p>
                    <div className="rounded-md border border-border/60 divide-y divide-border/60">
                      {SCORE_SCALE.map((s) => (
                        <div key={s.level} className="flex items-center gap-4 px-3 py-2">
                          <span className="font-mono font-semibold text-secondary w-6 text-center text-sm">{s.level}</span>
                          <span className="text-sm text-foreground/90">{s.label}</span>
                        </div>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="domains" className="border-border/60">
                  <AccordionTrigger className="px-4 text-sm font-heading"><span className="inline-flex items-center gap-2"><FileText className="h-4 w-4 text-secondary" /> The 10 domains you'll cover</span></AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm text-foreground/90">
                      {DOMAINS.map((d) => <li key={d} className="flex items-start gap-2"><span className="text-secondary mt-1">•</span> {d}</li>)}
                    </ul>
                  </AccordionContent>
                </AccordionItem>

                <AccordionItem value="best" className="border-border/60 border-b-0">
                  <AccordionTrigger className="px-4 text-sm font-heading"><span className="inline-flex items-center gap-2"><Sparkles className="h-4 w-4 text-secondary" /> Best practice while answering</span></AccordionTrigger>
                  <AccordionContent className="px-4 pb-4">
                    <ul className="space-y-2 text-sm text-foreground/90 list-disc list-inside marker:text-secondary">
                      <li>Answer for the <strong>current</strong> state, not the aspirational one.</li>
                      <li>If something is documented but not practised, score it lower.</li>
                      <li>Note evidence where requested — it sharpens the reviewer's read.</li>
                      <li>Pull in the person who actually runs the control if you're unsure.</li>
                    </ul>
                  </AccordionContent>
                </AccordionItem>
              </Accordion>

              <div className="border-t border-border/60 pt-5 flex items-start gap-3">
                <Checkbox id="ack" checked={acknowledged} onCheckedChange={(v) => setAcknowledged(v === true)} className="mt-0.5" />
                <label htmlFor="ack" className="text-sm text-foreground cursor-pointer leading-relaxed">
                  I understand that my answers drive the quality of this report, and I will answer honestly based on the current operating reality of my site.
                </label>
              </div>

              <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 border-t border-border/50 pt-5">
                <p className="text-xs text-muted-foreground">{BRAND.trustTrio}</p>
                <Button size="lg" disabled={!acknowledged} onClick={startAssessment} className="min-h-[48px]">
                  Start my Security Selfie <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </main>
      </div>
    </>
  );
};

const Tile = ({ icon, title, body }: { icon: React.ReactNode; title: string; body: string }) => (
  <div className="rounded-lg border border-border/60 bg-card/60 p-4">
    <div className="inline-flex h-9 w-9 items-center justify-center rounded-md bg-secondary/15 text-secondary mb-2">{icon}</div>
    <p className="font-heading font-semibold text-sm text-foreground mb-1">{title}</p>
    <p className="text-xs text-muted-foreground leading-relaxed">{body}</p>
  </div>
);

export default Welcome;
