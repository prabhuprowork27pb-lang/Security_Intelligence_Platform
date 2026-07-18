import { SiteHeader } from "@/components/SiteHeader";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import { ArrowRight, Compass, Globe2, Layers, ShieldCheck, Sparkles } from "lucide-react";
import { BRAND } from "@/lib/brand";
import { PmiPageHero } from "@/components/PmiPageHero";

const PHILOSOPHY = [
  "Security intelligence should not be limited by hierarchy, geography, or enterprise scale.",
  "Every forward-looking security leader deserves access to structured operational intelligence.",
  "A remote site should have access to the same quality of intelligence visibility as a major enterprise environment.",
  "A proactive security leader should not need to wait for hierarchy to access consulting-grade insight.",
];

const PILLARS = [
  {
    icon: Compass,
    title: "Operational visibility, not paperwork",
    body:
      "Most environments operate on assumptions. We translate ground reality into a structured, intelligence-led view leaders can act on.",
  },
  {
    icon: Globe2,
    title: "Scale-agnostic intelligence",
    body:
      "A 40-seat satellite office and a flagship campus deserve the same caliber of structured visibility. Geography should not gate insight.",
  },
  {
    icon: Layers,
    title: "Consulting intelligence, democratized",
    body:
      "What was historically delivered through long, expensive engagements is now available as an immediate, structured snapshot — without diluting rigor.",
  },
  {
    icon: ShieldCheck,
    title: "Modern advisory infrastructure",
    body:
      "A platform built for security leaders who want to move from reactive reporting to proactive operational intelligence.",
  },
];

const Why = () => (
  <div className="min-h-dvh bg-background">
    <Seo
      title="Why this Platform Exists — Security Intelligence Platform"
      description="Democratizing consulting-grade security intelligence. Built so every security leader — at every scale — can access structured operational visibility."
      path="/why"
    />
    <SiteHeader />

    {/* Hero */}
    <PmiPageHero
      eyebrow="Platform Philosophy"
      headlineSolid="Why this platform"
      headlineGradient="exists."
      lede={
        <>
          We built the {BRAND.platform} because operational security intelligence should not be a privilege reserved for headquarters, hierarchy, or large-budget engagements. It should be a default — accessible to every leader accountable for risk.
        </>
      }
    />


    {/* Philosophy quotes */}
    <section className="border-y border-border/40 bg-muted/20">
      <div className="container mx-auto px-5 md:px-6 py-16 lg:py-24 max-w-5xl">
        <div className="grid md:grid-cols-2 gap-6 md:gap-8">
          {PHILOSOPHY.map((q, i) => (
            <Card key={i} className="border-border/60 bg-background/70">
              <CardContent className="p-7 md:p-8">
                <p className="font-mono text-[11px] text-secondary mb-3">
                  0{i + 1}
                </p>
                <p className="font-heading text-lg md:text-xl leading-snug text-foreground">
                  “{q}”
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>

    {/* Pillars */}
    <section className="container mx-auto px-5 md:px-6 py-16 lg:py-24 max-w-6xl">
      <p className="text-[11px] uppercase tracking-[0.22em] text-secondary font-semibold mb-3">
        Intelligence Access Positioning
      </p>
      <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-4 max-w-3xl">
        Democratizing consulting-grade security intelligence.
      </h2>
      <p className="text-base md:text-lg text-muted-foreground max-w-3xl mb-12">
        Making structured operational intelligence more accessible across
        environments of every scale — without diluting the rigor that defines
        consulting practice.
      </p>

      <div className="grid md:grid-cols-2 gap-5 md:gap-6">
        {PILLARS.map(({ icon: Icon, title, body }) => (
          <Card key={title} className="border-border/60">
            <CardContent className="p-7">
              <div className="h-10 w-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-5">
                <Icon className="h-5 w-5" />
              </div>
              <h3 className="font-heading font-semibold text-xl mb-2">
                {title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    {/* Founder / team trust */}
    <section className="border-y border-border/40 bg-foreground text-background">
      <div className="container mx-auto px-5 md:px-6 py-16 lg:py-24 max-w-5xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-background/60 font-semibold mb-4">
          Why experienced operational leaders built this
        </p>
        <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6 max-w-3xl">
          Built by operators who have lived the gap.
        </h2>
        <p className="text-base md:text-lg text-background/75 max-w-3xl leading-relaxed mb-10">
          The {BRAND.platform} is shaped by leaders with years of on-ground
          operational responsibility across multi-site enterprises, critical
          infrastructure, and global advisory engagements. Every decision in the
          platform reflects what experienced security leaders actually need —
          structured visibility, defensible posture, and intelligence that can
          travel across hierarchy.
        </p>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            {
              h: "Operational background",
              b: "Decades of front-line security leadership across IT/ITES, manufacturing, and critical environments.",
            },
            {
              h: "Enterprise consulting",
              b: "Senior advisory experience supporting boards, CISOs, and operational heads across geographies.",
            },
            {
              h: "Mission",
              b: "To make consulting-grade intelligence a baseline — not a privilege — for every security leader.",
            },
          ].map((c) => (
            <div key={c.h} className="border-t border-background/20 pt-5">
              <p className="font-heading font-semibold text-lg mb-1.5">{c.h}</p>
              <p className="text-sm text-background/70 leading-relaxed">{c.b}</p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* CTA */}
    <section className="container mx-auto px-5 md:px-6 py-16 lg:py-24 max-w-4xl text-center">
      <Sparkles className="h-6 w-6 text-secondary mx-auto mb-5" />
      <h3 className="font-heading text-2xl md:text-4xl font-semibold tracking-tight mb-5">
        Step into structured operational intelligence.
      </h3>
      <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
        Begin with a {BRAND.primary} — a structured snapshot of your security
        environment, delivered as intelligence, not paperwork.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <Button asChild size="lg">
          <Link to="/diagnostic/start">
            Take a {BRAND.primary} <ArrowRight className="ml-2 h-4 w-4" />
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/insights">Explore Intelligence Insights</Link>
        </Button>
      </div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mt-8">
        {BRAND.trustTrio}
      </p>
    </section>
  </div>
);

export default Why;
