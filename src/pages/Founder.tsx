import { useState } from "react";
import { SiteHeader } from "@/components/SiteHeader";
import { BetaPill } from "@/components/BetaPill";
import { Seo } from "@/components/Seo";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  Linkedin,
  Mail,
  MessageCircle,
  ShieldOff,
  Lock,
  Sparkles,
  Award,
  Copy,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { BRAND } from "@/lib/brand";
import founderPortrait from "@/assets/founder-prabhu.jpg";
import TraceabilityStrip from "@/components/TraceabilityStrip";

const LINKEDIN_URL = "https://www.linkedin.com/in/captprabhu27punjab/";

const CopyLinkedInButton = () => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(LINKEDIN_URL);
      setCopied(true);
      toast.success("LinkedIn URL copied to clipboard.");
      window.setTimeout(() => setCopied(false), 1800);
    } catch {
      toast.error("Couldn't copy. Long-press the LinkedIn button to copy the link instead.");
    }
  };
  return (
    <Button variant="outline" size="lg" onClick={handleCopy} aria-label="Copy LinkedIn URL">
      {copied ? (
        <>
          <Check className="mr-2 h-4 w-4" />
          Copied
        </>
      ) : (
        <>
          <Copy className="mr-2 h-4 w-4" />
          Copy URL
        </>
      )}
    </Button>
  );
};


const ANCHORS = [
  {
    title: "Military foundation",
    body:
      "Indian Army officer. Operational discipline that still shapes how SIP™ thinks about risk, evidence, and accountability.",
  },
  {
    title: "Corporate security leadership",
    body:
      "Enterprise-scale physical security, BCM, and integrated risk programs across IT/ITES, manufacturing, and critical environments.",
  },
  {
    title: "Founder, SIP™",
    body:
      "Building the democratisation layer — elite consulting intelligence, delivered to every site, every shift, every leader who carries the risk.",
  },
];

const COMMITMENTS = [
  {
    icon: Lock,
    title: "Your data stays yours",
    body:
      "Inputs are never resold, never used to train external models, never shared with vendors.",
  },
  {
    icon: ShieldOff,
    title: "No vendor kickbacks",
    body:
      "SIP™ scoring is not influenced by any product, integrator, or guarding agency. Ever.",
  },
  {
    icon: Sparkles,
    title: "No black-box AI",
    body:
      "Every score, every recommendation, traceable back to a question and a recognised standard.",
  },
];

const Founder = () => (
  <div className="min-h-dvh bg-background">
    <Seo
      title="Founder — Capt. Prabhu · Security Intelligence Platform"
      description="The operator behind SIP™. 25 years across uniform, boardroom, and ground operations — building the platform that democratises elite security consulting."
      path="/founder"
      jsonLd={{
        "@context": "https://schema.org",
        "@type": "Person",
        name: "Capt. Prabhu",
        jobTitle: "Founder, Security Intelligence Platform™",
        worksFor: {
          "@type": "Organization",
          name: "Security Intelligence Platform",
        },
        sameAs: ["https://www.linkedin.com/in/captprabhu27punjab/"],
        image: "/founder-prabhu.jpg",
      }}
    />
    <SiteHeader />

    {/* Hero + portrait */}
    <section className="container mx-auto px-5 md:px-6 pt-14 lg:pt-20 pb-14 lg:pb-20 max-w-6xl">
      <div className="grid lg:grid-cols-[1.15fr_1fr] gap-10 lg:gap-14 items-center">
        <div>
          <div className="mb-4"><BetaPill variant="light" label="Feedback Cohort" /></div>
          <p className="text-[11px] uppercase tracking-[0.22em] text-secondary font-semibold mb-4">
            Founder
          </p>
          <h1 className="font-heading text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6 [text-wrap:balance]">
            The operator behind the{" "}
            <span className="text-muted-foreground">platform.</span>
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl leading-relaxed">
            Twenty-three years inside India's security operations — across
            IT/ITES, critical infrastructure, and global advisory. SIP™ is
            built from that practitioner's chair, for the people sitting in
            one today.
          </p>
        </div>

        <div className="relative">
          <div className="absolute -inset-3 md:-inset-4 rounded-3xl bg-gradient-to-br from-secondary/20 via-primary/10 to-transparent blur-xl" />
          <div className="relative overflow-hidden rounded-2xl border border-border/60 shadow-xl bg-muted/20">
            <img
              src={founderPortrait}
              alt="Capt. Prabhu — Founder, Security Intelligence Platform™"
              loading="lazy"
              className="w-full h-auto object-cover max-h-[640px]"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-background/95 via-background/70 to-transparent p-4 md:p-5">
              <p className="font-heading font-semibold text-foreground text-base md:text-lg leading-tight">
                Capt. Prabhu
              </p>
              <p className="text-[12px] md:text-[13px] text-muted-foreground mt-0.5">
                Founder, {BRAND.platformTm}
              </p>
              <div className="mt-2.5 pt-2.5 border-t border-border/40">
                <a
                  href={LINKEDIN_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Linkedin className="h-3.5 w-3.5 text-secondary" />
                  <span>in/captprabhu27punjab</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Credibility chips */}
      <div className="flex flex-wrap gap-2 mt-10">
        {[
          "23 yrs in security operations",
          "Ex-VP, IIRIS Consulting",
          "CPP® (ASIS)",
          "PCI® (ASIS)",
          "MBA · LLB · Google PMP",
        ].map((chip) => (
          <span
            key={chip}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-border/70 bg-muted/30 text-[11px] font-medium tracking-wide text-foreground"
          >
            <Award className="h-3 w-3 text-secondary" />
            {chip}
          </span>
        ))}
      </div>
    </section>

    {/* Bio + Why SIP */}
    <section className="border-y border-border/40 bg-muted/20">
      <div className="container mx-auto px-5 md:px-6 py-16 lg:py-24 max-w-4xl space-y-10">
        <div>
          <p className="font-mono text-[11px] text-secondary mb-3">01 · THE PATH</p>
          <p className="text-base md:text-lg text-foreground/90 leading-relaxed">
            Founded SIP™ to close a gap I spent 23 years watching widen — the distance between polished security frameworks on paper and what actually holds up on the ground. SIP™ gives security leaders a structured diagnostic across 10 domains — governance, perimeter, guarding operations, electronic security, crisis continuity, and more — producing a defensible posture score and board-ready intelligence report. The entry point is the Security Selfie™ and for leaders needing deeper validation, Security Studio™ offers a senior-led, on-ground engagement.
          </p>
        </div>

        <div>
          <p className="font-mono text-[11px] text-secondary mb-3">
            02 · WHY SIP™
          </p>
          <h2 className="font-heading text-2xl md:text-4xl font-bold tracking-tight leading-tight mb-5">
            Democratising elite consulting — to where the risk actually lives.
          </h2>
          <div className="space-y-4 text-base md:text-lg text-muted-foreground leading-relaxed">
            <p>
              For too long, world-class security intelligence has lived inside
              expensive reports, retainer engagements, and the heads of a
              handful of senior consultants — out of reach for the people doing
              the actual work. Meanwhile the night-shift supervisor, the
              regional security manager, the founder of a 40-seat office — the
              people closest to the actual risk — were left with paper
              checklists and gut feel.
            </p>
            <p>
              SIP™ takes the rigor of elite consulting and puts it on the desk
              of every security leader in India, regardless of title, budget, or
              postcode. <span className="text-foreground font-medium">
                The person standing at the gate deserves the same quality of
                thinking as the person sitting in the corner office.
              </span>{" "}
              Every site matters. Every shift matters. Every leader who carries
              the risk deserves to be heard, equipped, and empowered.
            </p>
          </div>
        </div>
      </div>
    </section>

    <TraceabilityStrip />

    {/* Track record anchors */}
    <section className="container mx-auto px-5 md:px-6 py-16 lg:py-24 max-w-6xl">
      <p className="text-[11px] uppercase tracking-[0.22em] text-secondary font-semibold mb-3">
        Track record
      </p>
      <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-12 max-w-3xl">
        Built from the inside — uniform, boardroom, and ground.
      </h2>
      <div className="grid md:grid-cols-3 gap-5 md:gap-6">
        {ANCHORS.map((a) => (
          <Card key={a.title} className="border-border/60">
            <CardContent className="p-7">
              <h3 className="font-heading font-semibold text-xl mb-2">
                {a.title}
              </h3>
              <p className="text-sm md:text-base text-muted-foreground leading-relaxed">
                {a.body}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>
    </section>

    {/* What I won't do — dark band */}
    <section className="border-y border-border/40 bg-foreground text-background">
      <div className="container mx-auto px-5 md:px-6 py-16 lg:py-24 max-w-5xl">
        <p className="text-[11px] uppercase tracking-[0.22em] text-background/60 font-semibold mb-4">
          What I won't do
        </p>
        <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-10 max-w-3xl">
          Three commitments — non-negotiable.
        </h2>
        <div className="grid md:grid-cols-3 gap-6 md:gap-8">
          {COMMITMENTS.map(({ icon: Icon, title, body }) => (
            <div key={title} className="border-t border-background/20 pt-5">
              <Icon className="h-5 w-5 text-background/80 mb-3" />
              <p className="font-heading font-semibold text-lg mb-1.5">
                {title}
              </p>
              <p className="text-sm text-background/70 leading-relaxed">
                {body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>

    {/* Direct contact */}
    <section className="container mx-auto px-5 md:px-6 py-16 lg:py-24 max-w-4xl text-center">
      <h3 className="font-heading text-2xl md:text-4xl font-semibold tracking-tight mb-5">
        Talk to me directly.
      </h3>
      <p className="text-muted-foreground mb-8 max-w-2xl mx-auto">
        If you lead security at a site, a region, or an
        enterprise — I want your feedback, your scepticism, and your stories.
      </p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
        <Button asChild size="lg">
          <a
            href={LINKEDIN_URL}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Linkedin className="mr-2 h-4 w-4" />
            Connect on LinkedIn
          </a>
        </Button>
        <CopyLinkedInButton />
        <Button asChild variant="outline" size="lg">
          <Link to="/contact">
            <Mail className="mr-2 h-4 w-4" />
            Send a message
          </Link>
        </Button>
        <Button asChild variant="outline" size="lg">
          <Link to="/community">
            <MessageCircle className="mr-2 h-4 w-4" />
            Join the community
          </Link>
        </Button>
      </div>
      <div className="mt-10">
        <Button asChild variant="ghost" size="sm">
          <Link to="/diagnostic/start">
            Take a {BRAND.primary} <ArrowRight className="ml-2 h-3.5 w-3.5" />
          </Link>
        </Button>
      </div>
      <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70 mt-8">
        {BRAND.trustTrio}
      </p>
    </section>
  </div>
);

export default Founder;
