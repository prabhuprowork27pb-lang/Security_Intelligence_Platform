import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import {
  Radar,
  ShieldCheck,
  Layers,
  Activity,
  Compass,
  Users,
  ArrowRight,
} from "lucide-react";

/**
 * "Explore SIP™ — The Intelligence Platform"
 * Homepage platform-overview section that introduces the five working
 * surfaces of the Security Intelligence Platform.
 */
const PILLARS = [
  {
    icon: ShieldCheck,
    title: "Security Selfie™",
    description:
      "A guided diagnostic across ten operational domains. Honest, structured, with your report delivered within 2 business days.",
    href: "/diagnostic/start",
    cta: "Take a Security Selfie™",
  },
  {
    icon: Layers,
    title: "Security Studio™",
    description:
      "Consulting-grade engagements for boards and operating committees. Strategy, governance and field calibration.",
    href: "/studio",
    cta: "Request Studio™",
  },
  {
    icon: Compass,
    title: "Intelligence Insights",
    description:
      "Operational advisories, leadership observations and maturity insights — written for working security leaders.",
    href: "/insights",
    cta: "Read the latest",
  },
  {
    icon: Activity,
    title: "Intelligence Pulse™",
    description:
      "A weekly intelligence brief, delivered by email or WhatsApp. Field signals and governance prompts — no noise.",
    href: "/community",
    cta: "Subscribe to the Pulse™",
  },
  {
    icon: Users,
    title: "The Intelligent Community",
    description:
      "A moderated network of operators, advisors and CSOs. Chatham House Rule, identity verified at entry.",
    href: "/community",
    cta: "Join the community",
  },
];

export const ExploreSipSection = () => {
  return (
    <section
      id="explore-sip"
      className="relative border-y border-border/40 bg-gradient-to-b from-background via-muted/20 to-background overflow-hidden scroll-mt-24"
    >
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
      <div className="container mx-auto px-6 py-24 lg:py-28 relative">
        <div className="max-w-3xl mx-auto text-center mb-14" data-reveal>
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-border/60 text-foreground text-[11px] font-semibold uppercase tracking-[0.22em] mb-6">
            <Radar className="h-3.5 w-3.5 text-secondary" />
            Explore SIP™
          </div>
          <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-[1.08] mb-5">
            The Intelligence Platform.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            One ecosystem. Five working surfaces. Built for modern security
            leadership — from the first diagnostic to the weekly intelligence
            brief.
          </p>
        </div>

        <div
          className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 max-w-6xl mx-auto"
          data-reveal
        >
          {PILLARS.map((p, i) => {
            const Icon = p.icon;
            const accents = [
              { ring: "hsl(195 100% 55%)", tint: "hsl(195 100% 55% / 0.12)" },
              { ring: "hsl(12 100% 64%)", tint: "hsl(12 100% 64% / 0.12)" },
              { ring: "hsl(78 85% 50%)", tint: "hsl(78 85% 50% / 0.14)" },
              { ring: "hsl(320 85% 60%)", tint: "hsl(320 85% 60% / 0.12)" },
              { ring: "hsl(38 100% 58%)", tint: "hsl(38 100% 58% / 0.14)" },
            ];
            const a = accents[i % accents.length];
            return (
              <Card
                key={p.title}
                className="group relative border-border/60 bg-card/80 hover:-translate-y-1 hover:shadow-editorial transition-all overflow-hidden"
                style={{ borderTop: `4px solid ${a.ring}` }}
              >
                <div
                  className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-60"
                  style={{ background: a.tint }}
                />
                <CardContent className="p-6 flex flex-col h-full relative">
                  <div
                    className="flex items-center justify-center h-11 w-11 rounded-xl mb-4"
                    style={{ background: a.tint, color: a.ring }}
                  >
                    <Icon className="h-5 w-5" />
                  </div>
                  <h3 className="font-heading font-semibold text-lg tracking-tight mb-2">
                    {p.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-grow">
                    {p.description}
                  </p>
                  <Link
                    to={p.href}
                    className="inline-flex items-center text-sm font-semibold transition-colors"
                    style={{ color: a.ring }}
                  >
                    {p.cta}
                    <ArrowRight className="ml-1.5 h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </CardContent>
              </Card>
            );
          })}

        </div>

        <p className="mt-12 text-center text-sm text-muted-foreground max-w-2xl mx-auto">
          All five surfaces share one operational spine —{" "}
          <span className="text-foreground font-medium">
            your Security Intelligence record
          </span>
          .
        </p>
      </div>
    </section>
  );
};

export default ExploreSipSection;
