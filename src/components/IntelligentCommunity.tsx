import { MessageCircle, Users, ShieldCheck, ArrowRight } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import IntelligencePulseSignup from "@/components/IntelligencePulseSignup";
import { BRAND } from "@/lib/brand";

// Set this to the real WhatsApp invite URL when available. Until then the
// button safely routes to the contact form (topic=whatsapp).
const WHATSAPP_COMMUNITY_URL: string | null =
  "https://wa.me/917982163154?text=" +
  encodeURIComponent("Hi, I'd like to join the SIP™ Intelligent Community.");

/**
 * "Join the Intelligent Community" — pairs a WhatsApp community invite with
 * the Intelligence Pulse™ subscription block. Any verified inbox or number is
 * accepted; no corporate-domain gating.
 */
export const IntelligentCommunity = ({ source = "community" }: { source?: string }) => {
  return (
    <section className="border-y border-border/40 bg-card/40">
      <div className="container mx-auto px-5 md:px-6 py-16 md:py-24 max-w-6xl">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <p className="text-[11px] uppercase tracking-[0.28em] text-secondary font-semibold mb-3">
            The Intelligent Community
          </p>
          <h2 className="font-heading text-3xl md:text-4xl lg:text-5xl font-semibold tracking-tight leading-[1.1] mb-4">
            A quiet network of modern security leaders.
          </h2>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Operators, advisors, COOs and CSOs trading field observations,
            governance signals and operational rhythm. Conversational, calibrated,
            never promotional.
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-5 md:gap-6">
          {/* WhatsApp community */}
          <div className="rounded-2xl border border-border/60 bg-card p-7 md:p-9 flex flex-col">
            <div className="flex items-center gap-2 mb-3">
              <Users className="h-4 w-4 text-secondary" />
              <p className="text-[11px] uppercase tracking-[0.25em] font-semibold text-secondary">
                Join the conversation
              </p>
            </div>
            <h3 className="font-heading text-2xl md:text-3xl font-semibold leading-tight tracking-tight mb-3">
              The {BRAND.shortTm} WhatsApp Community.
            </h3>
            <p className="text-sm md:text-base text-muted-foreground leading-relaxed mb-6 flex-grow">
              A moderated WhatsApp community for security leaders, operators and
              advisors. Field signals, weekly intelligence prompts, and direct
              access to the {BRAND.platformTm} practice team.
            </p>
            <ul className="space-y-2 mb-7 text-sm text-foreground/85">
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                Moderated, signal-only — no vendor pitching
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                Identity verified at entry — operators only
              </li>
              <li className="flex items-start gap-2">
                <ShieldCheck className="h-4 w-4 mt-0.5 text-secondary shrink-0" />
                Field intelligence shared under Chatham House Rule
              </li>
            </ul>
            <Button
              asChild
              size="lg"
              className="w-full sm:w-auto min-h-[48px] bg-[#25D366] hover:bg-[#1da851] text-white"
            >
              {WHATSAPP_COMMUNITY_URL ? (
                <a
                  href={WHATSAPP_COMMUNITY_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Join the WhatsApp community
                  <ArrowRight className="ml-2 h-4 w-4" />
                </a>
              ) : (
                <Link to="/contact?topic=whatsapp">
                  <MessageCircle className="mr-2 h-4 w-4" />
                  Request a WhatsApp invite
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              )}
            </Button>
            <p className="mt-3 text-[10px] uppercase tracking-[0.2em] text-muted-foreground/70">
              {WHATSAPP_COMMUNITY_URL
                ? "Opens WhatsApp · Identity verified at entry"
                : "Verified entry · Operators only"}
            </p>
          </div>

          {/* Intelligence Pulse subscribe — email or WhatsApp */}
          <IntelligencePulseSignup variant="card" source={source} />
        </div>
      </div>
    </section>
  );
};

export default IntelligentCommunity;
