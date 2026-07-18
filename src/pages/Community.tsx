import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { BetaPill } from "@/components/BetaPill";
import IntelligentCommunity from "@/components/IntelligentCommunity";
import { Activity, Radio, ShieldCheck, Users } from "lucide-react";
import { BRAND } from "@/lib/brand";

/**
 * Standalone "Join the Intelligent Community" destination.
 * Hosts the WhatsApp community invite and the Intelligence Pulse™ dual-channel
 * subscription (email or WhatsApp). Linked from the primary navigation.
 */
const Community = () => {
  return (
    <>
      <Seo
        title="Join the Intelligent Community — Security Intelligence Platform™"
        description="A moderated network of modern security leaders, operators and advisors. Field signals, the weekly Intelligence Pulse™ and direct access to the practice team."
        path="/community"
      />
      <div className="min-h-dvh bg-background">
        <SiteHeader />

        {/* Hero strip */}
        <section className="relative border-b border-border/40 bg-gradient-to-b from-background via-muted/30 to-background overflow-hidden">
          <div
            className="absolute inset-0 opacity-[0.025] pointer-events-none"
            style={{
              backgroundImage:
                "linear-gradient(hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--foreground)) 1px, transparent 1px)",
              backgroundSize: "64px 64px",
            }}
          />
          <div className="container mx-auto px-6 py-16 md:py-24 relative">
            <div className="max-w-3xl mx-auto text-center">
              <div className="mb-5"><BetaPill variant="light" /></div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-foreground/5 border border-border/60 text-foreground text-[11px] font-semibold uppercase tracking-[0.22em] mb-6">
                <Users className="h-3.5 w-3.5 text-secondary" />
                The Intelligent Community
              </div>
              <h1 className="font-heading text-3xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5 [text-wrap:balance]">
                A quiet network of modern security leaders.
              </h1>
              <p className="text-base md:text-lg text-muted-foreground leading-relaxed max-w-2xl mx-auto">
                Operators, advisors, COOs and CSOs trading field observations,
                governance signals and operational rhythm. Conversational,
                calibrated, and never promotional — under {BRAND.shortTm}.
              </p>

              {/* Value pills */}
              <div className="mt-10 grid sm:grid-cols-3 gap-3 max-w-3xl mx-auto">
                {[
                  { icon: Radio, label: "Field signals" },
                  { icon: Activity, label: "Weekly Pulse™" },
                  { icon: ShieldCheck, label: "Direct practice access" },
                ].map((p) => {
                  const Icon = p.icon;
                  return (
                    <div
                      key={p.label}
                      className="flex items-center justify-center gap-2 rounded-full border border-border/60 bg-card/60 px-4 py-2.5 text-sm font-medium text-foreground"
                    >
                      <Icon className="h-4 w-4 text-secondary" />
                      {p.label}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>
        </section>

        {/* Community + Pulse subscription block */}
        <IntelligentCommunity source="community-page" />
      </div>
    </>
  );
};

export default Community;
