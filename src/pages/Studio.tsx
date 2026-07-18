import { useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { PmiPageHero } from "@/components/PmiPageHero";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Compass, Layers, ShieldCheck, Telescope, Users } from "lucide-react";
import { BRAND } from "@/lib/brand";
import StudioInquiryDialog from "@/components/StudioInquiryDialog";

const PILLARS = [
  {
    icon: Telescope,
    title: "Deeper validation",
    body: "Expert-led examination of the controls, evidence, and operational rhythm behind your Security Selfie™ outputs.",
  },
  {
    icon: Layers,
    title: "Contextual refinement",
    body: "A more granular evaluation that accounts for site complexity, regulatory exposure, and operating tempo.",
  },
  {
    icon: Users,
    title: "Leadership alignment",
    body: "Structured working sessions that translate findings into board-ready narratives and operating commitments.",
  },
  {
    icon: Compass,
    title: "Strategic direction",
    body: "Sequenced refinement plans designed to elevate posture without disrupting operational continuity.",
  },
];

const Studio = () => {
  const navigate = useNavigate();

  return (
    <>
      <Seo
        title={`${BRAND.premium} — Expert-led security intelligence`}
        description="Security Studio™ is a focused, expert-led engagement that elevates and strategically refines your security environment beyond the Security Selfie™ snapshot."
        path="/studio"
      />
      <div className="min-h-dvh bg-background">
        <SiteHeader />

        {/* Hero */}
        <PmiPageHero
          eyebrow="Premium engagement"
          headlineSolid="Security"
          headlineGradient={BRAND.premium.replace(/^Security\s+/, "")}
          lede="A focused, expert-led engagement designed to elevate and strategically refine your security environment."
          size="lg"
          metaTag={BRAND.trustTrio}
          actions={
            <>
              <StudioInquiryDialog
                trigger={
                  <Button size="lg" className="h-13 min-h-[52px] px-7 rounded-full pmi-cta-gradient shadow-editorial hover:-translate-y-0.5">
                    Request Security Studio™ <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                }
              />
              <Button size="lg" variant="outline" onClick={() => navigate("/diagnostic/start")} className="h-13 min-h-[52px] px-6 rounded-full border-white/40 bg-white/5 text-white hover:bg-white/15 hover:text-white hover:border-accent-cyan">
                Take a Security Selfie™
              </Button>
            </>
          }
        />


        {/* Positioning */}
        <section className="container mx-auto px-6 py-20 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-10 items-start mb-16">
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3">
                When Studio is appropriate
              </p>
              <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight leading-tight">
                For environments that warrant deeper scrutiny.
              </h2>
            </div>
            <div className="space-y-4 text-base text-muted-foreground leading-relaxed">
              <p>
                {BRAND.primary} provides a structured snapshot of your security posture. {BRAND.premium} extends that visibility — a curated engagement led by senior practitioners who validate evidence, examine operational nuance, and refine strategic direction.
              </p>
              <p>
                It is not a higher subscription tier. It is a different kind of engagement, designed for environments where the stakes, complexity, or expectations call for considered, expert-led intelligence.
              </p>
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            {PILLARS.map((p) => (
              <Card key={p.title} className="border border-border/60 bg-card hover:border-secondary/40 transition-colors">
                <CardContent className="p-6">
                  <div className="h-10 w-10 rounded-lg bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                    <p.icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg mb-2">{p.title}</h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">{p.body}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Closing CTA */}
        <section className="border-t border-border/40 bg-card/40">
          <div className="container mx-auto px-6 py-20 max-w-4xl text-center">
            <ShieldCheck className="h-8 w-8 text-secondary mx-auto mb-6" />
            <h2 className="font-heading text-3xl md:text-4xl font-semibold tracking-tight mb-4">
              Two paths. Begin with whichever fits.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8 leading-relaxed">
              Most engagements begin with a {BRAND.primary} — a structured baseline against which deeper analysis becomes meaningful. You may also request {BRAND.premium} directly.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Button size="lg" onClick={() => navigate("/diagnostic/start")} className="h-14 px-8 text-base">
                Take a Security Selfie™
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
              <StudioInquiryDialog
                trigger={
                  <Button size="lg" variant="outline" className="h-14 px-8 text-base">
                    Request Security Studio™
                  </Button>
                }
              />
            </div>
          </div>
        </section>
      </div>
    </>
  );
};

export default Studio;
