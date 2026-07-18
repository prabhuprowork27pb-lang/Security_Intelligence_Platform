import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Seo } from "@/components/Seo";
import { SiteHeader } from "@/components/SiteHeader";
import { TrustRibbon } from "@/components/TrustRibbon";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, Eye, Download, Building2, Factory, Globe2 } from "lucide-react";
import SampleOtpGate, { getSampleAccess, type SampleAccess } from "@/components/SampleOtpGate";
import StudioInquiryDialog from "@/components/StudioInquiryDialog";

interface SampleCard {
  slug: string;
  industry: string;
  archetype: string;
  city: string;
  overall: number;
  posture: "Red" | "Amber" | "Teal" | "Green";
  pitch: string;
  icon: React.ReactNode;
  accent: string;
}

const SAMPLES: SampleCard[] = [
  {
    slug: "gcc",
    industry: "Global Capability Centre (GCC)",
    archetype: "Multi-tenant campus",
    city: "Hyderabad · ~4,200 HC",
    overall: 58,
    posture: "Amber",
    pitch: "Operationally mature at tenant level. Campus-wide unified command and segmentation are the open frontier.",
    icon: <Globe2 className="h-5 w-5" />,
    accent: "from-amber-500/10 to-secondary/10",
  },
  {
    slug: "manufacturing",
    industry: "Manufacturing Facility",
    archetype: "Tier-1 production plant",
    city: "Pune · ~1,650 HC · 24×7 ops",
    overall: 61,
    posture: "Amber",
    pitch: "Strong physical perimeter and EHS rigour. Insider-risk assurance and shift-handover intelligence are under-instrumented.",
    icon: <Factory className="h-5 w-5" />,
    accent: "from-orange-500/10 to-primary/10",
  },
  {
    slug: "corporate-hq",
    industry: "Corporate HQ / Enterprise Campus",
    archetype: "Group head-office tower",
    city: "Mumbai · ~2,200 HC · Tier-1",
    overall: 67,
    posture: "Amber",
    pitch: "Executive-protection posture is competent. The frontier is principal-movement intelligence and crisis-decision rehearsal.",
    icon: <Building2 className="h-5 w-5" />,
    accent: "from-primary/10 to-secondary/10",
  },
];

const POSTURE_CLASS: Record<string, string> = {
  Red: "bg-destructive/15 text-destructive border-destructive/30",
  Amber: "bg-amber-500/15 text-amber-700 border-amber-500/30",
  Teal: "bg-teal-500/15 text-teal-700 border-teal-500/30",
  Green: "bg-emerald-500/15 text-emerald-700 border-emerald-500/30",
};

const Sample = () => {
  const navigate = useNavigate();
  const [access, setAccess] = useState<SampleAccess | null>(getSampleAccess());

  return (
    <div className="min-h-dvh bg-background">
      <Seo
        title="Sample Intelligence Reports — GCC, Manufacturing, Corporate HQ"
        description="Three flagship watermarked sample diagnostics: Global Capability Centre, Manufacturing Facility and Corporate HQ. Verify a WhatsApp number to access."
        path="/sample"
      />
      <SiteHeader />

      <main className="container mx-auto px-4 md:px-6 py-10 md:py-14 max-w-6xl">
        <div className="text-center mb-8 md:mb-12 max-w-3xl mx-auto">
          <Badge variant="secondary" className="mb-3">
            <Eye className="mr-1 h-3 w-3" /> Sample Intelligence Reports
          </Badge>
          <h1 className="font-heading font-semibold text-3xl md:text-5xl tracking-tight leading-tight mb-3 md:mb-4">
            Experience consulting-grade output before you commit.
          </h1>
          <p className="text-base md:text-lg text-muted-foreground leading-relaxed">
            Three flagship diagnostics — synthetic data, real structure. Verify a WhatsApp number to read on screen or download a watermarked PDF. No payment required.
          </p>
        </div>

        {!access ? (
          <SampleOtpGate onVerified={setAccess} />
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 mb-10 md:mb-14">
              {SAMPLES.map((s) => (
                <Card
                  key={s.slug}
                  className={`group hover:shadow-xl transition-all border-border/60 hover:border-secondary/40 overflow-hidden bg-gradient-to-br ${s.accent}`}
                >
                  <CardContent className="p-6 flex flex-col h-full">
                    <div className="flex items-center justify-between mb-4">
                      <div className="h-10 w-10 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center">
                        {s.icon}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-md border ${POSTURE_CLASS[s.posture]}`}>
                        {s.posture}
                      </span>
                    </div>
                    <h3 className="font-heading font-semibold text-xl mb-1 leading-tight">{s.industry}</h3>
                    <p className="text-xs text-muted-foreground mb-1">{s.archetype}</p>
                    <p className="text-xs text-muted-foreground mb-4">{s.city}</p>

                    <div className="flex items-baseline gap-2 mb-4">
                      <span className="font-mono font-semibold text-4xl text-foreground">{s.overall}</span>
                      <span className="text-xs text-muted-foreground">/ 100</span>
                    </div>

                    <p className="text-sm leading-relaxed text-muted-foreground mb-5 flex-grow">
                      {s.pitch}
                    </p>

                    <div className="flex flex-col gap-2 mt-auto">
                      <Button asChild size="sm" className="w-full">
                        <Link to={`/sample/${s.slug}`}>
                          Read full sample <ArrowRight className="ml-2 h-3.5 w-3.5" />
                        </Link>
                      </Button>
                      <Button asChild size="sm" variant="outline" className="w-full">
                        {/* <Link to={`/sample/${s.slug}`} state={{ download: true }}>
                          <Download className="mr-2 h-3.5 w-3.5" /> Download PDF
                        </Link> */}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="border-secondary/25 bg-card">
              <CardContent className="p-10 text-center">
                <h2 className="font-heading font-semibold text-3xl md:text-4xl tracking-tight mb-3">
                  Your report will reveal your actual posture.
                </h2>
                <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
                  Run your own Security Selfie™ in under thirty minutes — or request a {" "}
                  <span className="text-foreground font-medium">Security Studio™</span> engagement directly for environments that warrant deeper validation.
                </p>
                <div className="flex flex-wrap items-center justify-center gap-3">
                  <Button size="lg" onClick={() => navigate("/diagnostic/start")}>
                    Take a Security Selfie™ <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                  <StudioInquiryDialog
                    trigger={
                      <Button size="lg" variant="outline">
                        Request Security Studio™
                      </Button>
                    }
                  />
                </div>
                <p className="mt-6 text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
                  Reviewed · Structured · Operationally grounded
                </p>
              </CardContent>
            </Card>
          </>
        )}
      </main>

      <TrustRibbon />
    </div>
  );
};

export default Sample;
