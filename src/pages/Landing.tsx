import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustRibbon } from "@/components/TrustRibbon";
import { FloatingCta } from "@/components/FloatingCta";
import StudioInquiryDialog from "@/components/StudioInquiryDialog";
import SignalsFromTheField from "@/components/SignalsFromTheField";
import ExploreSipSection from "@/components/ExploreSipSection";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import { useCountUp } from "@/hooks/useCountUp";
import {
  Shield,
  Gauge,
  ArrowRight,
  Activity,
  Target,
  Layers,
  Zap,
  Eye,
  CheckCircle2,
  XCircle,
  Radar,
  TrendingUp,
  ChevronDown,
  Compass,
  FileText,
  Lock,
} from "lucide-react";
import { Link } from "react-router-dom";
import { BetaPill } from "@/components/BetaPill";

const Landing = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  useRevealOnScroll();

  // Animated counters
  const outputScore = useCountUp(62, 1600);

  const handlePrimaryCta = () => navigate(user ? "/dashboard" : "/community");
  const handleSelfieCta = () => navigate(user ? "/dashboard" : "/diagnostic/start");
  const scrollToOutput = () =>
    document.getElementById("moment-output")?.scrollIntoView({ behavior: "smooth" });

  return (
    <>
      <Seo
        title="Security Intelligence Platform — Security Selfie™"
        description="A structured snapshot of your security environment. Consulting-grade security intelligence. Accessible. Immediate. Operational."
        path="/"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "Security Selfie",
          url: "/",
          potentialAction: {
            "@type": "SearchAction",
            target: "/?q={search_term_string}",
            "query-input": "required name=search_term_string",
          },
        }}
      />
      <div className="landing-dark min-h-dvh bg-background">
        <SiteHeader />
        <FloatingCta />

        {/* ───────────────────────── HERO — PMI-INSPIRED INDIGO ───────────────────────── */}
        <section className="relative min-h-[calc(100vh-4.5rem)] flex items-center overflow-hidden bg-primary text-primary-foreground">
          {/* Indigo → violet gradient base */}
          <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
          {/* Signature angular light beam (top-right) */}
          <div
            className="absolute -top-32 -right-40 h-[120vh] w-[80vw] pointer-events-none opacity-90"
            style={{
              background: "var(--gradient-beam)",
              clipPath: "polygon(60% 0, 100% 0, 100% 100%, 30% 100%)",
              filter: "blur(2px)",
            }}
          />
          {/* Secondary cyan halo */}
          <div className="absolute -bottom-1/3 -left-1/4 h-[55vh] w-[55vh] rounded-full bg-secondary/20 blur-[140px] pointer-events-none animate-aurora-2" />
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />


          {/* Radial vignette behind headline for type pop */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 60% 50% at 50% 45%, hsl(261 78% 7% / 0.55) 0%, transparent 70%)",
            }}
          />

          <div className="container mx-auto px-6 py-20 lg:py-28 relative z-10">
            <div className="max-w-4xl mx-auto text-center">
              {/* Invite-only preview pill */}
              <div className="mb-5 animate-fade-in">
                <BetaPill variant="dark" />
              </div>

              <div className="inline-flex items-center gap-2.5 px-4 py-1.5 rounded-full bg-white/10 border border-white/25 text-white text-[11px] font-semibold uppercase tracking-[0.22em] mb-10 backdrop-blur-sm animate-fade-in">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-accent-cyan opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-accent-cyan" />
                </span>
                Security Intelligence Platform™
              </div>

              {/* Platform wordmark — dominant master brand */}
              <h1 className="font-heading font-bold tracking-tight leading-[0.95] animate-fade-in [text-wrap:balance]">
                <span className="hero-headline-solid block text-[40px] sm:text-[58px] md:text-[76px] lg:text-[92px] tracking-[-0.025em]">
                  Security
                </span>
                <span className="hero-headline-gradient block text-[40px] sm:text-[58px] md:text-[76px] lg:text-[92px] tracking-[-0.025em]">
                  Intelligence Platform
                </span>
              </h1>

              {/* SIP™ positioning */}
              <p className="mt-6 text-[11px] md:text-xs uppercase tracking-[0.42em] font-semibold animate-fade-in text-[hsl(195_100%_74%)]">
                SIP™ <span className="text-white/30 mx-2">·</span> <span className="text-[hsl(195_100%_74%/0.72)]">Structured</span> <span className="text-white/30 mx-2">·</span> <span className="text-[hsl(195_100%_74%/0.72)]">Intelligent</span> <span className="text-white/30 mx-2">·</span> <span className="text-[hsl(195_100%_74%/0.72)]">Practicable</span>
              </p>

              {/* Subhead */}
              <p className="mt-10 text-lg md:text-xl text-white/95 max-w-2xl mx-auto leading-relaxed [text-wrap:balance]">
                A structured snapshot of your security environment. <br />
                <span className="font-semibold text-white"> Consulting-grade intelligence. Accessible. Immediate. Operational.</span>
              </p>

              {/* CTAs — feedback / beta mode */}
              <div className="mt-12 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">

                <Button
                  size="lg"
                  onClick={handlePrimaryCta}
                  className="text-base px-8 h-14 min-h-[52px] rounded-full bg-white/10 border border-white/30 text-white hover:bg-white/15 hover:border-white/50 hover:-translate-y-0.5 transition-all backdrop-blur-sm"
                >
                  Join the Intelligent Community
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/sample")}
                  className="text-base px-6 h-14 min-h-[52px] rounded-full border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white hover:border-accent-cyan"
                >
                  See a Sample Report
                </Button>
                <Button
                  size="lg"
                  onClick={handleSelfieCta}
                  className="text-base px-6 h-14 min-h-[52px] rounded-full pmi-cta-gradient shadow-editorial hover:-translate-y-0.5 transition-all"
                >
                  Take a Security Selfie™
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>

              <p className="mt-6 text-sm md:text-base text-white/85 max-w-2xl mx-auto leading-relaxed [text-wrap:balance]">
                Built for security leaders, facility heads, and site teams who need a clear, practicable view of their operating reality.
              </p>

              {/* Beta framing strip */}
              {/* <div className="mt-6 max-w-2xl mx-auto rounded-2xl border border-white/15 bg-white/[0.04] backdrop-blur-sm px-5 py-3.5 text-[12.5px] text-white/85 leading-relaxed">
                This beta version is being shared with a select group of business leaders to gather valuable feedback and improve the platform.
              </div> */}

              <p className="mt-8 text-[10px] uppercase tracking-[0.3em] text-white/70">
                Reviewed · Structured · Operationally grounded
              </p>


              {/* Scroll cue */}
              <button
                onClick={scrollToOutput}
                className="mt-16 inline-flex flex-col items-center gap-1.5 text-[10px] uppercase tracking-[0.3em] text-white/80 hover:text-white transition-colors"
                aria-label="Scroll to explore"
              >
                <span>Continue</span>
                <ChevronDown className="h-4 w-4 animate-bounce" />
              </button>
            </div>
          </div>
        </section>



        {/* ───────────────────────── WHY WE BUILT THIS ───────────────────────── */}
        <section className="relative border-y border-border/40 bg-background overflow-hidden">
          <div className="container mx-auto px-6 py-24 lg:py-28">
            <div className="grid lg:grid-cols-[1.05fr_1fr] gap-12 lg:gap-16 max-w-6xl mx-auto items-start" data-reveal>
              <div>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-border/60 text-foreground text-[11px] font-semibold uppercase tracking-[0.22em] mb-6">
                  <Compass className="h-3.5 w-3.5 text-secondary" />
                  Why we built this
                </div>
                <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] mb-6">
                  Consulting-grade intelligence — at the speed your operations run.
                </h2>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mb-4">
                  Boards increasingly want posture expressed as intelligence, not activity. The Security Intelligence Platform™ stands alongside the leaders and teams who already carry that responsibility — translating the work they do every day into a structured, intelligent, practicable view of posture, delivered within 24 hours.
                </p>
                <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-xl mb-8">
                  Built for speed, scale and transparency — calibrated to how Indian security environments actually run.
                </p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild size="lg" variant="outline" className="h-12">
                    <Link to="/why">
                      Read the philosophy <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>
              <div className="grid sm:grid-cols-2 gap-4">
                {[
                  { k: "Intelligence", v: "Operational signal, not noise.", icon: Radar },
                  { k: "Structure", v: "Ten domains. One defensible score.", icon: Layers },
                  { k: "Practicable", v: "Recommendations you can sequence Monday.", icon: Target },
                  { k: "Confidential", v: "Privacy-conscious by architecture.", icon: Lock },
                ].map((p) => (
                  <Card key={p.k} className="border-border/60 bg-card/60 hover:border-secondary/40 hover:-translate-y-0.5 transition-all">
                    <CardContent className="p-5">
                      <p.icon className="h-5 w-5 text-secondary mb-3" />
                      <p className="font-heading font-semibold text-sm tracking-tight">{p.k}</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-1">{p.v}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── EXPLORE SIP™ — THE INTELLIGENCE PLATFORM ───────────────────────── */}
        <ExploreSipSection />

        {/* ───────────────────────── MOMENT 2 — DISCOMFORT ───────────────────────── */}
        <section className="relative overflow-hidden bg-[hsl(261_50%_9%)] text-white">
          <div
            className="absolute inset-0 opacity-[0.05] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(0 0% 100%) 1px, transparent 1px), linear-gradient(90deg, hsl(0 0% 100%) 1px, transparent 1px)",
              backgroundSize: "48px 48px",
            }}
          />
          <div className="container mx-auto px-6 py-20 lg:py-28 relative">
            <div className="max-w-4xl mx-auto text-center mb-12" data-reveal>
              <p className="text-xs uppercase tracking-[0.25em] text-white/55 font-semibold mb-4">
                The Reality Gap
              </p>
              <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-medium tracking-tight leading-[1.15]">
                Most security setups appear robust on paper. Their effectiveness is determined by how consistently they operate in practice.
              </h2>
            </div>

            <div className="grid md:grid-cols-2 gap-px bg-white/10 max-w-4xl mx-auto rounded-xl overflow-hidden border border-white/10">
              {/* Perceived State */}
              <div className="bg-[hsl(261_50%_9%)] p-8 md:p-10" data-reveal>
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 text-white/75 text-[11px] font-semibold uppercase tracking-wider mb-6">
                  Perceived State
                </div>
                <ul className="space-y-4">
                  {[
                    "Controls are in place",
                    "Processes are defined",
                    "Staffing levels appear adequate"
                  ].map((t) => (
                    <li
                      key={t}
                      className="flex items-center gap-3 font-heading font-medium text-lg md:text-xl text-white/85"
                    >
                      <CheckCircle2 className="h-5 w-5 text-white/45 flex-shrink-0" />
                      {t}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Operational Reality */}
              <div className="bg-[hsl(261_50%_9%)] p-8 md:p-10 relative" data-reveal>
                <div className="absolute inset-0 bg-gradient-to-br from-destructive/[0.10] to-transparent pointer-events-none" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-destructive/20 text-[hsl(0_85%_72%)] text-[11px] font-semibold uppercase tracking-wider mb-6">
                    Operational Reality
                  </div>
                  <ul className="space-y-4">
                    {[
                      "Variability in execution",
                      "Inefficiencies in deployment",
                      "Limited visibility across operations"
                    ].map((t) => (
                      <li
                        key={t}
                        className="flex items-center gap-3 font-heading font-medium text-lg md:text-xl text-white"
                      >
                        <XCircle className="h-5 w-5 text-[hsl(0_75%_60%)] flex-shrink-0" />
                        {t}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── MOMENT 3 — CLARITY (OUTPUT) ───────────────────────── */}
        <section
          id="moment-output"
          className="relative scroll-mt-20 bg-background overflow-hidden"
        >
          <div className="container mx-auto px-6 py-28 lg:py-36">
            <div className="max-w-4xl mx-auto text-center mb-16" data-reveal>
              <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-5">
                The Output
              </p>
              <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                Most systems are not broken.
                <br />
                <span className="text-muted-foreground">They are just not measured.</span>
              </h2>
            </div>

            <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-6" data-reveal>
              {/* Big animated score */}
              <Card
                ref={outputScore.ref as React.RefObject<HTMLDivElement>}
                className="overflow-hidden border-0 bg-gradient-to-br from-primary via-primary to-secondary text-primary-foreground shadow-2xl relative"
              >
                <div className="absolute -top-20 -right-20 h-64 w-64 rounded-full bg-secondary/40 blur-3xl pointer-events-none" />
                <CardContent className="p-10 flex flex-col items-center text-center h-full justify-center relative">
                  <p className="text-xs uppercase tracking-[0.25em] opacity-80 mb-6">
                    Posture Score
                  </p>
                  <p className="font-mono font-bold text-8xl md:text-9xl leading-none mb-5 tabular-nums">
                    {outputScore.value}
                  </p>
                  <span className="inline-block px-4 py-1.5 rounded-full bg-background text-foreground text-sm font-semibold mb-6">
                    Developing
                  </span>
                  <p className="text-sm opacity-80 max-w-xs">
                    Moderate exposure — 5 of 10 domains performing below target.
                  </p>
                </CardContent>
              </Card>

              <div className="space-y-6">
                <Card className="border-border/60 hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-5">
                      <h3 className="font-heading font-semibold flex items-center gap-2">
                        <Radar className="h-4 w-4 text-primary" />
                        Domain Breakdown
                      </h3>
                      <span className="text-xs text-muted-foreground">10 domains</span>
                    </div>
                    <div className="space-y-3">
                      {[
                        { name: "Access Control", v: 78 },
                        { name: "Surveillance & ESS", v: 64 },
                        { name: "Crisis & Continuity", v: 34 },
                        { name: "Guarding Operations", v: 71 },
                        { name: "Visitor Management", v: 58 },
                      ].map((d) => (
                        <div key={d.name} className="flex items-center gap-3">
                          <span className="text-sm text-foreground w-44 truncate">{d.name}</span>
                          <div className="flex-1 h-2 rounded-full bg-white/10 overflow-hidden">
                            <div
                              className={`h-full rounded-full transition-all duration-700 ${d.v >= 71
                                ? "bg-[hsl(145_63%_50%)]"
                                : d.v >= 41
                                  ? "bg-[hsl(36_95%_56%)]"
                                  : "bg-[hsl(0_75%_55%)]"
                                }`}
                              style={{ width: `${d.v}%` }}
                            />
                          </div>
                          <span className="font-mono text-xs text-foreground w-8 text-right">
                            {d.v}
                          </span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="border-border/60 hover:shadow-xl transition-all">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="font-heading font-semibold flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-primary" />
                        Risk Heatmap
                      </h3>
                      <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-[hsl(0_75%_55%)]" /> High
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-[hsl(36_95%_56%)]" /> Med
                        </span>
                        <span className="flex items-center gap-1">
                          <span className="h-2 w-2 rounded-sm bg-[hsl(145_63%_50%)]" /> Low
                        </span>
                      </div>
                    </div>
                    <div className="grid grid-cols-10 gap-1.5">
                      {[
                        70, 64, 58, 34, 71, 78, 52, 66, 81, 45, 58, 49, 72, 38, 65, 70, 54, 61, 77,
                        42, 66, 71, 39, 58, 73, 48, 62, 79, 51, 44,
                      ].map((v, i) => {
                        const cls =
                          v >= 71 ? "bg-[hsl(145_63%_50%)]" : v >= 41 ? "bg-[hsl(36_95%_56%)]" : "bg-[hsl(0_75%_55%)]";
                        return (
                          <div
                            key={i}
                            className={`h-7 rounded-sm ${cls} hover:scale-110 transition-transform`}
                            title={`Score: ${v}`}
                          />
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────────────── PRODUCT SYSTEM (capability via outcomes) ───────────────────────── */}
        <section className="border-y border-border/40 bg-[hsl(258_35%_10%)]">
          <div className="container mx-auto px-6 py-28 lg:py-36">
            <div className="max-w-3xl mx-auto text-center mb-16" data-reveal>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-5">
                <Shield className="h-3.5 w-3.5" />
                The System
              </div>
              <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
                Security Selfie<sup className="text-2xl md:text-3xl text-primary">™</sup>
              </h2>
              <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto">
                A structured diagnostic of your entire security ecosystem.
              </p>
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto" data-reveal>
              {[
                { icon: Activity, title: "Measure effectiveness", body: "Quantify what your investments actually deliver." },
                { icon: Layers, title: "Reveal inefficiency", body: "Surface duplication, blind spots, underused controls." },
                { icon: Gauge, title: "Quantify risk", body: "A single, defensible posture score across all domains." },
                { icon: Target, title: "Prioritise action", body: "A clear sequence of high-impact moves — not a wishlist." },
              ].map((f) => (
                <Card
                  key={f.title}
                  className="group border-border/60 bg-background hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
                >
                  <CardContent className="p-6">
                    <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform">
                      <f.icon className="h-5 w-5" />
                    </div>
                    <h3 className="font-heading font-semibold text-base mb-2 leading-snug">
                      {f.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── MOMENT 4 — AUTHORITY (INSIGHTS) ───────────────────────── */}
        <section className="container mx-auto px-6 py-28 lg:py-36">
          <div className="max-w-4xl mx-auto text-center mb-16" data-reveal>
            <p className="text-xs uppercase tracking-[0.25em] text-primary font-semibold mb-5">
              Patterns We're Seeing
            </p>
            <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
              Seen on ground.
              <br />
              <span className="text-muted-foreground">Not in reports.</span>
            </h2>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto" data-reveal>
            {[
              { n: "01", t: "Most setups operate between 45–60 maturity", icon: Gauge },
              { n: "02", t: "Electronic security is consistently underused", icon: Eye },
              { n: "03", t: "Guard deployment rarely matches risk", icon: Shield },
              { n: "04", t: "Visibility is the single biggest gap", icon: Activity },
            ].map((i) => (
              <Card
                key={i.n}
                className="border-border/60 bg-background hover:border-primary/40 hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <div className="h-10 w-10 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
                      <i.icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">{i.n}</span>
                  </div>
                  <p className="font-heading font-semibold text-base leading-snug">{i.t}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* ACCOUNTABILITY */}
        <section className="border-y border-white/10 bg-[hsl(261_50%_9%)] text-white">
          <div className="container mx-auto px-6 py-28 lg:py-36">
            <div className="max-w-4xl mx-auto" data-reveal>
              <h2 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-14">
                If you're responsible for security,{" "}
                <span className="text-white/55">this matters.</span>
              </h2>

              <div className="grid md:grid-cols-3 gap-8">
                {[
                  { n: "01", t: "You are accountable for risk", b: "The buck stops with you when things go wrong." },
                  { n: "02", t: "But rarely given visibility", b: "Most leaders operate on assumptions, not evidence." },
                  { n: "03", t: "This changes that", b: "A measurable, defensible view — on demand." },
                ].map((item) => (
                  <div key={item.n} className="border-t border-white/20 pt-6">
                    <p className="font-mono text-xs text-white/55 mb-3">{item.n}</p>
                    <h3 className="font-heading font-semibold text-xl mb-2">{item.t}</h3>
                    <p className="text-sm text-white/75 leading-relaxed">{item.b}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* SIGNALS FROM THE FIELD™ */}
        <SignalsFromTheField />

        {/* ───────────────────────── SAMPLE INTELLIGENCE REPORTS — TEASER ───────────────────────── */}
        <section className="container mx-auto px-6 py-24 lg:py-28 max-w-6xl" data-reveal>
          <div className="text-center max-w-3xl mx-auto mb-12">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-[11px] font-semibold uppercase tracking-[0.22em] mb-5">
              <FileText className="h-3.5 w-3.5" />
              Sample Intelligence Reports
            </div>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] mb-4">
              See the output before you commit.
            </h2>
            <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
              Three flagship watermarked diagnostics — Global Capability Centre, Manufacturing, and Corporate HQ. Synthetic data, real structure, board-grade narrative.
            </p>
          </div>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { slug: "gcc", title: "Global Capability Centre", city: "Hyderabad · ~4,200 HC", score: 58, posture: "Amber" },
              { slug: "manufacturing", title: "Manufacturing Facility", city: "Pune · ~1,650 HC", score: 61, posture: "Amber" },
              { slug: "corporate-hq", title: "Corporate HQ", city: "Mumbai · ~2,200 HC", score: 67, posture: "Amber" },
            ].map((s) => (
              <Link key={s.slug} to={`/sample/${s.slug}`} className="group">
                <Card className="border-border/60 hover:border-secondary/50 hover:shadow-xl hover:-translate-y-1 transition-all h-full">
                  <CardContent className="p-6">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-muted-foreground font-semibold mb-3">
                      {s.posture} · Sample
                    </p>
                    <h3 className="font-heading font-semibold text-lg leading-tight mb-1">{s.title}</h3>
                    <p className="text-xs text-muted-foreground mb-5">{s.city}</p>
                    <div className="flex items-baseline gap-2 mb-5">
                      <span className="font-mono font-bold text-4xl text-foreground">{s.score}</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>
                    <span className="inline-flex items-center text-sm font-medium text-secondary group-hover:gap-2 transition-all gap-1">
                      Read sample <ArrowRight className="h-3.5 w-3.5" />
                    </span>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
          <div className="text-center mt-8">
            <Button asChild variant="ghost" className="text-sm">
              <Link to="/sample">View all sample reports <ArrowRight className="ml-2 h-3.5 w-3.5" /></Link>
            </Button>
          </div>
        </section>

        {/* SECURITY STUDIO™ — ELITE LAYER */}
        <section id="studio" className="container mx-auto px-6 py-28 lg:py-36 scroll-mt-24">
          <div className="max-w-5xl mx-auto" data-reveal>
            <Card className="overflow-hidden border-white/10 bg-gradient-to-br from-[hsl(258_35%_12%)] to-[hsl(258_40%_18%)] hover:shadow-2xl hover:shadow-[hsl(195_100%_55%/0.18)] transition-shadow">
              <CardContent className="p-10 md:p-14">
                <div className="grid md:grid-cols-[1fr_auto] gap-10 items-center">
                  <div>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/10 text-secondary text-xs font-semibold mb-5">
                      <Zap className="h-3.5 w-3.5" />
                      By Invitation
                    </div>
                    <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4">
                      Not everything can be fixed remotely.
                    </h2>
                    <p className="text-lg md:text-xl text-muted-foreground max-w-xl">
                      A senior-led, on-ground deep-dive. Evidence-validated. Vendor-agnostic.
                    </p>
                  </div>
                  <div className="flex md:flex-col gap-3">
                    <Button
                      size="lg"
                      onClick={() => navigate("/deep-dive")}
                      className="text-base px-7 h-12"
                    >
                      Request Deep Dive
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* BRAND STATEMENT */}
        <section className="relative overflow-hidden border-y border-border/40 bg-[hsl(258_35%_10%)]">
          <div
            className="absolute inset-0 opacity-[0.04] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="container mx-auto px-6 py-24 text-center relative" data-reveal>
            <div className="inline-flex items-center justify-center h-12 w-12 rounded-full bg-primary text-primary-foreground mb-6 shadow-lg">
              <Shield className="h-5 w-5" />
            </div>
            <p className="font-heading text-2xl md:text-3xl font-semibold max-w-3xl mx-auto leading-relaxed">
              Built from real operations where{" "}
              <span className="text-primary">failure is not an option.</span>
            </p>
            <div className="mt-5 inline-flex items-center gap-3 text-sm text-muted-foreground tracking-wide">
              <span className="h-px w-10 bg-border" />
              Made in India. Built for the world.
              <span className="h-px w-10 bg-border" />
            </div>
          </div>
        </section>

        {/* ───────────────────────── TRUST & PRIVACY ───────────────────────── */}
        <section className="container mx-auto px-6 py-24 lg:py-28 max-w-5xl" data-reveal>
          <div className="grid md:grid-cols-[1fr_1.4fr] gap-10 items-start">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-border/60 text-foreground text-[11px] font-semibold uppercase tracking-[0.22em] mb-5">
                <Lock className="h-3.5 w-3.5 text-secondary" />
                Trust &amp; Privacy
              </div>
              <h2 className="font-heading text-3xl md:text-4xl font-bold tracking-tight leading-[1.1] mb-4">
                Confidential by architecture.
              </h2>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6">
                Your operational reality is sensitive. We treat it that way — controlled access, encrypted transit, watermarked exports, no vendor leakage.
              </p>
              <Button asChild variant="outline">
                <Link to="/trust">Review the Trust posture <ArrowRight className="ml-2 h-4 w-4" /></Link>
              </Button>
            </div>
            <div className="grid sm:grid-cols-2 gap-3">
              {[
                { t: "Privacy-conscious architecture", b: "Diagnostic inputs stay scoped to the engagement workspace." },
                { t: "Confidential intelligence handling", b: "Outputs are watermarked and access-controlled by default." },
                { t: "Secure diagnostic workflows", b: "Role-gated, auditable, with explicit data ownership." },
                { t: "Indian-context calibrated", b: "PSARA, DPDP Act 2023, ISO 18788 / 22301 aligned." },
              ].map((p) => (
                <Card key={p.t} className="border-border/60 bg-card/60">
                  <CardContent className="p-5">
                    <p className="font-heading font-semibold text-sm tracking-tight mb-1">{p.t}</p>
                    <p className="text-xs text-muted-foreground leading-relaxed">{p.b}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────────────── MOMENT 5 — ACTION ───────────────────────── */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(261_78%_10%)] via-[hsl(258_60%_20%)] to-[hsl(285_55%_28%)] pointer-events-none" />
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(195_100%_55%/0.35),_transparent_70%)] pointer-events-none" />
          <div className="container mx-auto px-6 py-28 lg:py-36 text-center relative text-white">
            <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight max-w-3xl mx-auto mb-4">
              If you're not completely sure your system works —
            </h2>
            <p className="font-heading text-2xl md:text-3xl text-white/75 mb-10">
              run it once.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button
                size="lg"
                onClick={handleSelfieCta}
                className="text-base px-10 h-14 bg-[hsl(40_60%_98%)] text-[hsl(261_75%_11%)] hover:bg-[hsl(40_60%_94%)] shadow-2xl hover:-translate-y-0.5 transition-transform"
              >
                Take a Security Selfie™
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <StudioInquiryDialog
                trigger={
                  <Button
                    size="lg"
                    variant="ghost"
                    className="text-base px-8 h-14 border border-white/30 text-white hover:bg-white/10 hover:text-white"
                  >
                    Request Security Studio™
                  </Button>
                }
              />
            </div>
          </div>
        </section>

        <TrustRibbon />
        {/* Global SecureFooter is rendered from App.tsx */}
      </div>
    </>
  );
};

export default Landing;
