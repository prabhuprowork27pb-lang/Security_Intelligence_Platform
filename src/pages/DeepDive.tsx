import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import {
  ArrowRight,
  Microscope,
  ClipboardCheck,
  Wrench,
  ShieldCheck,
  Users,
  Network,
  Gauge,
  TrendingDown,
  Target,
  Lock,
  Sparkles,
} from "lucide-react";

const DeepDive = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  useRevealOnScroll();

  const handleRequest = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Deep Dive — Senior-Led Security Review"
        description="Senior-led, on-the-ground physical security review for enterprises. Structured engagement, defensible findings, executable roadmap."
        path="/deep-dive"
        jsonLd={{
          "@context": "https://schema.org",
          "@type": "Service",
          name: "Security Selfie Deep Dive",
          serviceType: "Enterprise physical security review",
          provider: { "@type": "Organization", name: "Security Selfie" },
          areaServed: "IN",
        }}
      />
      <SiteHeader />

      {/* HERO — dark, premium */}
      <section className="relative overflow-hidden border-b border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(217_45%_5%)] pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,_hsl(var(--secondary)/0.35),_transparent_60%)] pointer-events-none" />
        <div
          className="absolute inset-0 opacity-[0.06] pointer-events-none"
          style={{
            backgroundImage:
              "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />

        <div className="container mx-auto px-6 pt-24 pb-28 lg:pt-32 lg:pb-36 relative">
          <div className="max-w-4xl text-primary-foreground animate-fade-in">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-xs font-medium mb-8 backdrop-blur-sm">
              <Lock className="h-3.5 w-3.5" />
              Deep-Dive Security Leadership Review
            </div>

            <h1 className="font-heading font-bold tracking-tight leading-[1.05] text-5xl md:text-6xl lg:text-7xl mb-6">
              Not everything can be{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary-foreground to-primary-foreground/60">
                fixed remotely.
              </span>
            </h1>

            <p className="text-lg md:text-xl text-primary-foreground/80 max-w-2xl leading-relaxed mb-10">
              When the diagnostic exposes structural gaps, a senior team validates on the ground,
              redesigns deployment, and re-engineers your security operating model.
            </p>

            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
              <Button
                size="lg"
                onClick={handleRequest}
                className="text-base px-8 h-12 bg-background text-foreground hover:bg-background/90 shadow-2xl"
              >
                Request Deep-Dive Engagement
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <span className="text-xs text-primary-foreground/60 sm:ml-2 inline-flex items-center gap-2">
                <Sparkles className="h-3.5 w-3.5" />
                Senior-led · Vendor-agnostic · Limited slots
              </span>
            </div>
          </div>
        </div>
      </section>

      {/* WHAT IT IS */}
      <section className="container mx-auto px-6 py-24 lg:py-32">
        <div className="max-w-3xl mb-14">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-4">
            What it is
          </p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
            On-ground intelligence. Not another report.
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            A focused, time-boxed engagement led by senior practitioners. We validate what the
            diagnostic reveals, restructure what isn't working, and hand back an operating system
            you can actually run.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl">
          {[
            {
              icon: ClipboardCheck,
              title: "On-ground validation",
              body: "Walk-throughs, control tests and evidence review at every critical site.",
            },
            {
              icon: Network,
              title: "Deployment restructuring",
              body: "Re-architect guarding, electronic security and protocols against real risk.",
            },
            {
              icon: Users,
              title: "Workforce optimisation",
              body: "Right-size, retrain and re-deploy to remove redundancy and blind spots.",
            },
            {
              icon: Wrench,
              title: "Tech integration",
              body: "Make CCTV, access control, alarms and command actually operate as one system.",
            },
            {
              icon: ShieldCheck,
              title: "Operating model redesign",
              body: "SOPs, escalation, ownership and KPIs — built to be measured, not shelved.",
            },
            {
              icon: Microscope,
              title: "Independent assurance",
              body: "Vendor-agnostic. No product to sell, no incentive to inflate scope.",
            },
          ].map((c) => (
            <Card
              key={c.title}
              className="group border-border/60 bg-background hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
            >
              <CardContent className="p-6">
                <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform">
                  <c.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-base mb-2 leading-snug">
                  {c.title}
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* PROCESS */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-4">
              The Process
            </p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight leading-tight">
              Diagnose. Validate. Restructure.
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {[
              {
                n: "01",
                t: "Diagnose",
                b: "Start with the Security Selfie. Establish a measurable baseline across every domain.",
                icon: Gauge,
              },
              {
                n: "02",
                t: "Validate",
                b: "Senior team verifies findings on the ground. Evidence over assumption.",
                icon: Microscope,
              },
              {
                n: "03",
                t: "Restructure",
                b: "Redesign deployment, technology and protocols. Hand back a system that runs.",
                icon: Wrench,
              },
            ].map((s) => (
              <Card
                key={s.n}
                className="relative overflow-hidden border-border/60 bg-background hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
              >
                <CardContent className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center shadow-md">
                      <s.icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-3xl font-bold text-muted-foreground/40">
                      {s.n}
                    </span>
                  </div>
                  <h3 className="font-heading font-bold text-2xl mb-3">{s.t}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{s.b}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* OUTCOMES */}
      <section className="container mx-auto px-6 py-24 lg:py-32">
        <div className="max-w-3xl mb-16">
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-4">
            The Outcome
          </p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            A measurably stronger system.
          </h2>
        </div>

        <div className="grid sm:grid-cols-3 gap-6 max-w-6xl">
          {[
            {
              icon: ShieldCheck,
              title: "Stronger system",
              body: "Coverage, controls and response — aligned to the actual risk profile.",
              accent: "primary",
            },
            {
              icon: TrendingDown,
              title: "Reduced inefficiency",
              body: "Cut duplication, rationalise vendors, recover budget you didn't know you had.",
              accent: "accent",
            },
            {
              icon: Target,
              title: "Better control",
              body: "A single, defensible posture score — tracked, owned and improved over time.",
              accent: "secondary",
            },
          ].map((o) => (
            <Card
              key={o.title}
              className="group border-border/60 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
            >
              <CardContent className="p-8">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center mb-6 shadow-md group-hover:scale-110 transition-transform">
                  <o.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-3">{o.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{o.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden border-t border-border/40">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--secondary)/0.4),_transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-6 py-24 lg:py-28 text-center relative text-primary-foreground">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary-foreground/10 border border-primary-foreground/20 text-primary-foreground text-xs font-medium mb-8 backdrop-blur-sm">
            <Lock className="h-3.5 w-3.5" />
            Limited engagements per quarter
          </div>
          <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight max-w-3xl mx-auto mb-6">
            When the data shows gaps,
            <br />
            <span className="text-primary-foreground/70">we step in.</span>
          </h2>
          <Button
            size="lg"
            onClick={handleRequest}
            className="text-base px-10 h-14 bg-background text-foreground hover:bg-background/90 shadow-2xl"
          >
            Request Deep-Dive Engagement
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
          <p className="text-xs text-primary-foreground/60 mt-6">
            Made in India. Built for the world.
          </p>
        </div>
      </section>
    </div>
  );
};

export default DeepDive;
