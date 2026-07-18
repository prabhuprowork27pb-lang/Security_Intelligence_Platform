import { Link } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { BetaPill } from "@/components/BetaPill";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen, Compass, Eye, ShieldCheck, Activity, Layers } from "lucide-react";
import { BRAND } from "@/lib/brand";
import StudioInquiryDialog from "@/components/StudioInquiryDialog";
import SignalsFromTheField from "@/components/SignalsFromTheField";
import IndiaAdvisorySection from "@/components/IndiaAdvisorySection";

interface Article {
  slug: string;
  category: "Operational Observation" | "Maturity Insight" | "Governance Signal" | "Security Pulse";
  title: string;
  dek: string;
  read: string;
  icon: React.ReactNode;
}

const ARTICLE_POOL: Article[] = [
  {
    slug: "shift-handover-blindspot",
    category: "Operational Observation",
    title: "The shift-handover blind spot that costs more than any breach",
    dek: "Across 60+ Indian operating environments, the most consistent operational gap surfaces in the seven minutes between outgoing and incoming security shifts.",
    read: "6 min read",
    icon: <Activity className="h-5 w-5" />,
  },
  {
    slug: "maturity-without-investment",
    category: "Maturity Insight",
    title: "Why maturity rarely correlates with investment",
    dek: "Three sites with comparable budgets, three different posture trajectories. The variable is not spend — it is the operating rhythm leadership chooses to defend.",
    read: "8 min read",
    icon: <Compass className="h-5 w-5" />,
  },
  {
    slug: "governance-fatigue",
    category: "Governance Signal",
    title: "Governance fatigue: the silent driver of security drift",
    dek: "Quarterly reviews degrade into status updates. Status updates degrade into spreadsheets. Spreadsheets degrade into silence. A pattern, not an exception.",
    read: "5 min read",
    icon: <Layers className="h-5 w-5" />,
  },
  {
    slug: "psara-beyond-compliance",
    category: "Security Pulse",
    title: "PSARA beyond compliance: reading the operating signal",
    dek: "Statutory adherence is necessary, not sufficient. The operating signal embedded in PSARA records is what separates a guarded site from a defended one.",
    read: "7 min read",
    icon: <ShieldCheck className="h-5 w-5" />,
  },
  {
    slug: "intelligence-vs-reporting",
    category: "Maturity Insight",
    title: "Intelligence versus reporting — and why most boards confuse the two",
    dek: "A monthly report tells you what happened. Intelligence tells you what is changing. Most security functions are still optimised for the former.",
    read: "9 min read",
    icon: <Eye className="h-5 w-5" />,
  },
  {
    slug: "indian-context-frameworks",
    category: "Governance Signal",
    title: "Why imported frameworks under-serve Indian operating environments",
    dek: "ISO 18788 and ISO 22301 remain the gold standards. The work is in the local translation — labour cycles, statutory layers, climate, and crowd dynamics.",
    read: "8 min read",
    icon: <BookOpen className="h-5 w-5" />,
  },
  { slug: "contractor-risk-underestimated", category: "Security Pulse", title: "Why contractor risk is the most underestimated gap in Indian corporate security", dek: "Repeat AMC vendors and housekeeping staff are the highest-frequency access category and the lowest-screened. A pattern observed across 40+ sites.", read: "7 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "dpdp-act-physical-security", category: "Governance Signal", title: "The DPDP Act 2023 has physical security implications most teams have not mapped", dek: "India's data protection law extends obligations into the physical environment. Most security teams have not yet connected the two frameworks.", read: "6 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "guarding-compliance-principal-employer", category: "Security Pulse", title: "Principal employer liability: the guarding compliance gap nobody wants to own", dek: "Under the Code on Social Security 2020, principal employers carry joint liability for contractor PF defaults. Most organisations are exposed and unaware.", read: "8 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "night-shift-security-gap", category: "Operational Observation", title: "The night shift is where most Indian office security programmes quietly fail", dek: "Reduced manning, passive monitoring, and absent site-specific protocols create a predictable vulnerability window between 10pm and 6am.", read: "5 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "security-culture-leadership-gap", category: "Maturity Insight", title: "Security culture starts at the top — and most Indian offices have a leadership gap", dek: "When senior leaders bypass badge protocols or request VIP exemptions, the cultural signal travels faster than any awareness training.", read: "6 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "gcc-audit-readiness", category: "Governance Signal", title: "GCC audit readiness: what a US or UK client security assessor actually checks", dek: "Client security audits at Indian GCCs follow a predictable pattern. Understanding the checklist before the assessor arrives changes the outcome.", read: "9 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "incident-register-value", category: "Operational Observation", title: "The incident register is your most valuable security asset. Most sites don't have one.", dek: "Near-misses are the leading indicators of serious events. Sites without a maintained register are operating without early warning.", read: "4 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "tailgating-indian-offices", category: "Security Pulse", title: "Tailgating in Indian offices: why policy alone never fixes it", dek: "Social norms override security policy at the access point when guards are not empowered and employees are not culturally aligned.", read: "5 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "bcp-testing-reality", category: "Maturity Insight", title: "BCP testing: the gap between the document and the drill", dek: "Annual announced drills produce compliance records, not operational readiness. The distinction matters when you need the plan to actually work.", read: "6 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "electronic-security-cybersecurity", category: "Governance Signal", title: "Your CCTV system is a cybersecurity liability and most security teams don't know it", dek: "IP-based cameras on unsegregated networks with default credentials are a known attack vector. The security team rarely owns the fix.", read: "7 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "perimeter-myths", category: "Operational Observation", title: "The perimeter myths that persist in Indian corporate offices", dek: "Three assumptions about compound walls, lighting, and secondary gates that security leaders keep making — and what actually happens as a result.", read: "5 min read", icon: <BookOpen className="h-5 w-5" /> },
  { slug: "psara-beyond-licence", category: "Security Pulse", title: "PSARA is not just a licence — it is a minimum standard most vendors are not meeting", dek: "Having a PSARA licence on file is not the same as PSARA compliance. The distinction becomes important when an inspector visits.", read: "5 min read", icon: <BookOpen className="h-5 w-5" /> },
];

// Rotate the featured set every 15 days, 6 articles per chunk, so the
// homepage and /insights surface fresh narratives without code changes.
const ROTATION_PERIOD_DAYS = 15;
const ROTATION_EPOCH = new Date("2026-06-01").getTime();
const CHUNK_SIZE = 6;
const rotationIndex = Math.floor(
  (Date.now() - ROTATION_EPOCH) / (ROTATION_PERIOD_DAYS * 24 * 60 * 60 * 1000),
);
const totalChunks = Math.max(1, Math.ceil(ARTICLE_POOL.length / CHUNK_SIZE));
const chunkIndex = ((rotationIndex % totalChunks) + totalChunks) % totalChunks;
const ARTICLES = ARTICLE_POOL.slice(chunkIndex * CHUNK_SIZE, (chunkIndex + 1) * CHUNK_SIZE);

const CATEGORY_CLASS: Record<Article["category"], string> = {
  "Operational Observation": "bg-secondary/10 text-secondary border-secondary/30",
  "Maturity Insight": "bg-primary/10 text-primary border-primary/30",
  "Governance Signal": "bg-amber-500/10 text-amber-700 border-amber-500/30",
  "Security Pulse": "bg-teal-500/10 text-teal-700 border-teal-500/30",
};

const Insights = () => {
  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Intelligence Insights — Operational observations, maturity signals & governance narratives"
        description="Field-grade observations from Indian physical security environments: operational signals, maturity trajectories, governance fatigue patterns and security pulse narratives."
        path="/insights"
      />
      <SiteHeader />

      {/* Hero */}
      <section className="border-b border-border/40 bg-gradient-to-b from-background via-background to-card">
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-20 max-w-5xl">
          <div className="mb-4"><BetaPill variant="light" /></div>
          <Badge variant="secondary" className="mb-4">Intelligence Insights</Badge>
          <h1 className="font-heading font-semibold text-4xl md:text-5xl lg:text-6xl tracking-tight leading-[1.05] mb-5 [text-wrap:balance]">
            Field observations from the operating edge of Indian security.
          </h1>
          <p className="text-lg md:text-xl text-muted-foreground max-w-3xl leading-relaxed">
            Curated narratives drawn from {BRAND.primary} diagnostics across IT/ITES campuses, GCCs, manufacturing sites and corporate headquarters. No vendor noise — only operating signal.
          </p>
          <p className="mt-8 text-[11px] uppercase tracking-[0.28em] text-muted-foreground">
            {BRAND.trustTrio}
          </p>
        </div>
      </section>

      {/* Articles */}
      <section className="container mx-auto px-4 md:px-6 py-14 md:py-20 max-w-6xl">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ARTICLES.map((a, i) => {
            const accents = [
              { ring: "hsl(195 100% 55%)", tint: "hsl(195 100% 55% / 0.12)" },
              { ring: "hsl(12 100% 64%)", tint: "hsl(12 100% 64% / 0.12)" },
              { ring: "hsl(78 85% 50%)", tint: "hsl(78 85% 50% / 0.14)" },
              { ring: "hsl(320 85% 60%)", tint: "hsl(320 85% 60% / 0.12)" },
              { ring: "hsl(38 100% 58%)", tint: "hsl(38 100% 58% / 0.14)" },
            ];
            const accent = accents[i % accents.length];
            return (
              <Link
                key={a.slug}
                to={`/insights/${a.slug}`}
                className="group block"
              >
                <Card
                  className="group relative border-border/60 bg-card/80 hover:-translate-y-1 hover:shadow-editorial transition-all overflow-hidden h-full"
                  style={{ borderTop: `4px solid ${accent.ring}` }}
                >
                  <div
                    className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-60"
                    style={{ background: accent.tint }}
                  />
                  <CardContent className="p-6 flex flex-col h-full relative">
                    <div className="flex items-center justify-between mb-5">
                      <div
                        className="h-10 w-10 rounded-xl flex items-center justify-center"
                        style={{ background: accent.tint, color: accent.ring }}
                      >
                        {a.icon}
                      </div>
                      <span className={`text-[10px] uppercase tracking-[0.18em] font-semibold px-2 py-0.5 rounded-md border ${CATEGORY_CLASS[a.category]}`}>
                        {a.category}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-lg leading-snug mb-3">
                      {a.title}
                    </h3>
                    <p className="text-sm text-muted-foreground leading-relaxed mb-5 flex-grow">
                      {a.dek}
                    </p>
                    <div className="flex items-center justify-between text-xs text-muted-foreground/80 border-t border-border/50 pt-4">
                      <span>{a.read}</span>
                      <span
                        className="inline-flex items-center gap-1 font-semibold transition-colors"
                        style={{ color: accent.ring }}
                      >
                        Read narrative <ArrowRight className="h-3 w-3 transition-transform group-hover:translate-x-0.5" />
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>

        <p className="mt-8 text-center text-xs text-muted-foreground">
          Free preview available to all readers. Full narratives unlock with a
          Security Selfie™ or Security Studio™ engagement.
        </p>
      </section>

      {/* Signals from the Field™ */}
      <SignalsFromTheField />

      {/* India Security Advisory */}
      <IndiaAdvisorySection />

      {/* Closing dual-CTA */}
      <section className="border-t border-border/40 bg-card/40">
        <div className="container mx-auto px-4 md:px-6 py-16 md:py-20 max-w-5xl">
          <div className="grid md:grid-cols-2 gap-5">
            <Card className="border-secondary/30 bg-card">
              <CardContent className="p-8">
                <p className="text-[11px] uppercase tracking-[0.25em] text-secondary font-semibold mb-3">
                  Begin the diagnostic
                </p>
                <h3 className="font-heading text-2xl font-semibold mb-3">
                  Run a {BRAND.primary} for your environment.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  A structured, consulting-grade snapshot of your physical security posture across ten domains. Reviewed before release.
                </p>
                <Button asChild size="lg" className="w-full sm:w-auto min-h-[48px]">
                  <Link to="/diagnostic/start">
                    Take a Security Selfie™ <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
              </CardContent>
            </Card>
            <Card className="border-border/60 bg-card">
              <CardContent className="p-8">
                <p className="text-[11px] uppercase tracking-[0.25em] text-muted-foreground font-semibold mb-3">
                  Premium advisory
                </p>
                <h3 className="font-heading text-2xl font-semibold mb-3">
                  Engage {BRAND.premium} directly.
                </h3>
                <p className="text-sm text-muted-foreground leading-relaxed mb-6">
                  An expert-led engagement for environments that warrant deeper validation, refinement and operational precision.
                </p>
                <StudioInquiryDialog
                  trigger={
                    <Button size="lg" variant="outline" className="w-full sm:w-auto min-h-[48px]">
                      Request Security Studio™ <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  }
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Insights;
