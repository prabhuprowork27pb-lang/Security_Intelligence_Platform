import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import { PmiPageHero } from "@/components/PmiPageHero";
import { useRevealOnScroll } from "@/hooks/useRevealOnScroll";
import {
  ArrowRight,
  Workflow,
  ScanLine,
  FileBarChart,
  Lock,
  Layers,
  Gauge,
  Radar,
  Eye,
  Shield,
  Users,
  Network,
  AlertTriangle,
  ClipboardList,
  Sparkles,
  CheckCircle2,
} from "lucide-react";

const HOW_STEPS = [
  {
    n: "01",
    icon: ClipboardList,
    title: "Define your scope",
    body: "Add your organisation and the sites you want to measure. Multi-site, multi-domain — by design.",
  },
  {
    n: "02",
    icon: ScanLine,
    title: "Run the structured diagnostic",
    body: "A guided assessment across 10 operating domains. Evidence-led, not opinion-led.",
  },
  {
    n: "03",
    icon: FileBarChart,
    title: "See the truth, instantly",
    body: "A posture score, domain breakdown, risk heatmap and a prioritised action plan — generated in minutes.",
  },
];

const MEASURED = [
  { icon: Lock, title: "Access Control", body: "Authorisation, audit and physical entry integrity." },
  { icon: Eye, title: "Surveillance & ESS", body: "Coverage, retention, monitoring and live response." },
  { icon: Users, title: "Guarding Operations", body: "Deployment, rotation, supervision and accountability." },
  { icon: Shield, title: "Perimeter Security", body: "Boundary controls, intrusion detection, response loop." },
  { icon: Workflow, title: "Visitor Management", body: "Identification, escort, traceability and exit control." },
  { icon: AlertTriangle, title: "Incident Response", body: "Detection, escalation, command and after-action review." },
  { icon: Network, title: "Tech Integration", body: "Whether systems actually operate as one — not in silos." },
  { icon: Gauge, title: "Governance & Risk", body: "Ownership, KPIs, reviews and continuous improvement." },
];

const RECEIVE = [
  {
    icon: Gauge,
    title: "A defensible posture score",
    body: "0–100 score with a posture band — comparable across sites and over time.",
  },
  {
    icon: Radar,
    title: "Domain-level breakdown",
    body: "See exactly where you're strong, where you're average, and where you're exposed.",
  },
  {
    icon: Layers,
    title: "Risk heatmap",
    body: "A visual map of risk concentration — by domain, by site, by control area.",
  },
  {
    icon: ClipboardList,
    title: "Prioritised action plan",
    body: "30 / 60 / 90-day moves — sequenced by impact, not effort.",
  },
];

const DIFFERENTIATORS = [
  "Built from real operations — not theoretical frameworks.",
  "Vendor-agnostic. We have nothing to sell you afterwards.",
  "Outputs are measurable and defensible, not narrative reports.",
  "Designed for security leaders, not auditors.",
];

const Platform = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  useRevealOnScroll();

  const handlePrimaryCta = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="The Platform — How Security Selfie Works"
        description="A structured, evidence-led diagnostic across ten operating domains. Three steps from scope to score, heatmap and prioritised action plan."
        path="/platform"
      />
      <SiteHeader />

      {/* HERO */}
      <PmiPageHero
        eyebrow="The Platform"
        headlineSolid="How Security Selfie"
        headlineGradient="works."
        lede="A structured, evidence-led diagnostic that turns scattered security operations into a single, measurable system."
        size="lg"
        actions={
          <>
            <Button
              size="lg"
              onClick={handlePrimaryCta}
              className="text-base px-7 h-13 min-h-[52px] rounded-full pmi-cta-gradient shadow-editorial hover:-translate-y-0.5 transition-all"
            >
              Take a Security Selfie™ <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
            <Button
              size="lg"
              variant="outline"
              onClick={() => navigate("/platform-preview")}
              className="text-base px-6 h-13 min-h-[52px] rounded-full border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white hover:border-accent-cyan"
            >
              See a sample output <Eye className="ml-2 h-4 w-4" />
            </Button>
          </>
        }
      />


      {/* HOW IT WORKS */}
      <section className="container mx-auto px-6 py-24 lg:py-32">
        <div className="max-w-3xl mx-auto text-center mb-16" data-reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-4">
            How it works
          </p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            Three steps. One source of truth.
          </h2>
        </div>

        <div className="grid md:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {HOW_STEPS.map((s) => (
            <Card
              key={s.n}
              data-reveal
              className="relative overflow-hidden border-border/60 bg-background hover:-translate-y-1 hover:shadow-xl transition-all duration-300"
            >
              <CardContent className="p-8">
                <div className="flex items-start justify-between mb-6">
                  <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center shadow-md">
                    <s.icon className="h-5 w-5" />
                  </div>
                  <span className="font-mono text-3xl font-bold text-muted-foreground/40">{s.n}</span>
                </div>
                <h3 className="font-heading font-bold text-2xl mb-3">{s.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{s.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* WHAT GETS MEASURED */}
      <section className="border-y border-border/40 bg-muted/30">
        <div className="container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-3xl mx-auto text-center mb-16" data-reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-4">
              What gets measured
            </p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-5">
              Ten domains. One operating picture.
            </h2>
            <p className="text-lg text-muted-foreground">
              Every layer of physical security — measured against the same defensible standard.
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5 max-w-6xl mx-auto">
            {MEASURED.map((m) => (
              <Card
                key={m.title}
                data-reveal
                className="group border-border/60 bg-background hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
              >
                <CardContent className="p-6">
                  <div className="h-11 w-11 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform">
                    <m.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-base mb-2 leading-snug">{m.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{m.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* WHAT YOU RECEIVE */}
      <section className="container mx-auto px-6 py-24 lg:py-32">
        <div className="max-w-3xl mx-auto text-center mb-16" data-reveal>
          <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-4">
            What you receive
          </p>
          <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight leading-tight">
            A measurable system. Not another PDF.
          </h2>
        </div>

        <div className="grid sm:grid-cols-2 gap-6 max-w-5xl mx-auto">
          {RECEIVE.map((r) => (
            <Card
              key={r.title}
              data-reveal
              className="group border-border/60 hover:border-primary/40 hover:-translate-y-1 transition-all duration-300"
            >
              <CardContent className="p-7">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-secondary text-primary-foreground flex items-center justify-center mb-5 shadow-md group-hover:scale-110 transition-transform">
                  <r.icon className="h-5 w-5" />
                </div>
                <h3 className="font-heading font-semibold text-lg mb-2">{r.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{r.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12" data-reveal>
          <Button
            size="lg"
            variant="outline"
            onClick={() => navigate("/platform-preview")}
            className="text-base px-8 h-12"
          >
            Preview a sample output
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>

      {/* WHY IT'S DIFFERENT */}
      <section className="border-y border-border/40 bg-foreground text-background">
        <div className="container mx-auto px-6 py-24 lg:py-32">
          <div className="max-w-4xl mx-auto" data-reveal>
            <p className="text-xs uppercase tracking-[0.2em] text-background/60 font-semibold mb-4">
              Why it's different
            </p>
            <h2 className="font-heading text-4xl md:text-5xl font-bold tracking-tight leading-tight mb-12">
              Built for security leaders.{" "}
              <span className="text-background/60">Not for auditors.</span>
            </h2>

            <div className="grid md:grid-cols-2 gap-6">
              {DIFFERENTIATORS.map((d, i) => (
                <div key={i} className="flex items-start gap-4 border-t border-background/20 pt-5">
                  <CheckCircle2 className="h-5 w-5 text-background mt-0.5 flex-shrink-0" />
                  <p className="font-heading text-lg leading-snug">{d}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* FINAL CTA */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary via-primary/95 to-secondary pointer-events-none" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_hsl(var(--secondary)/0.4),_transparent_70%)] pointer-events-none" />
        <div className="container mx-auto px-6 py-24 lg:py-28 text-center relative text-primary-foreground">
          <h2 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold leading-[1.1] tracking-tight max-w-3xl mx-auto mb-6">
            See what your security actually delivers.
          </h2>
          <Button
            size="lg"
            onClick={handlePrimaryCta}
            className="text-base px-10 h-14 bg-background text-foreground hover:bg-background/90 shadow-2xl"
          >
            Take a Security Selfie™
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

export default Platform;
