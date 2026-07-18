import { CloudRain, Users2, Globe2, Plane, Building2, MapPin } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface AdvisoryItem {
  category:
    | "Regional Alert"
    | "Crowd Management"
    | "Weather & Operations"
    | "Geopolitical"
    | "Travel Risk"
    | "Infrastructure";
  region: string;
  title: string;
  body: string;
  posture: "Watch" | "Advisory" | "Heightened";
  icon: React.ReactNode;
}

const ADVISORIES: AdvisoryItem[] = [
  {
    category: "Crowd Management",
    region: "Bengaluru · ORR Corridor",
    title: "Shift-change congestion creating perimeter dwell exposure",
    body:
      "Tech-park access points are absorbing combined vendor-shuttle and contractor inflows. Recommend staggered ingress windows and a temporary verification lane during peak overlap.",
    posture: "Advisory",
    icon: <Users2 className="h-4 w-4" />,
  },
  {
    category: "Weather & Operations",
    region: "Mumbai · MMR",
    title: "Monsoon onset — perimeter and BCP rehearsal window",
    body:
      "Historical patterns suggest accelerated drainage stress and access-control disruption in low-lying campuses. Recommend a controlled BCP rehearsal before peak intensity.",
    posture: "Watch",
    icon: <CloudRain className="h-4 w-4" />,
  },
  {
    category: "Geopolitical",
    region: "Pan-India · Critical Sectors",
    title: "Heightened review cycle for critical-infrastructure adjacency",
    body:
      "Sector-wide advisories indicate a structured review of access protocols, vendor onboarding and visitor logging is appropriate over the next operating cycle.",
    posture: "Heightened",
    icon: <Globe2 className="h-4 w-4" />,
  },
  {
    category: "Travel Risk",
    region: "Northeast Corridor",
    title: "Calibrate executive travel against regional bandh notifications",
    body:
      "Localised bandh and movement-restriction calls have resurfaced. Recommend pre-travel briefings and a route-validation cadence for executive movement.",
    posture: "Advisory",
    icon: <Plane className="h-4 w-4" />,
  },
  {
    category: "Infrastructure",
    region: "NCR · Manufacturing Belt",
    title: "Power continuity stress during seasonal peak — UPS/CCTV impact",
    body:
      "Grid stress during peak summer historically degrades CCTV uptime and access-control polling. Recommend a UPS/PoE audit and recording-retention review.",
    posture: "Watch",
    icon: <Building2 className="h-4 w-4" />,
  },
  {
    category: "Regional Alert",
    region: "Hyderabad · Madhapur",
    title: "Vendor-density spikes at GCC corridors — verification drift risk",
    body:
      "Visitor logs across multiple campuses show verification drift during high-density vendor windows. Recommend supervisor sampling and gate-floor walkthroughs.",
    posture: "Advisory",
    icon: <MapPin className="h-4 w-4" />,
  },
];

const POSTURE_CLASS: Record<AdvisoryItem["posture"], string> = {
  Watch: "bg-teal-500/10 text-teal-700 border-teal-500/30",
  Advisory: "bg-amber-500/10 text-amber-700 border-amber-500/30",
  Heightened: "bg-red-500/10 text-red-700 border-red-500/30",
};

/**
 * "India Security Advisory" — calm, calibrated, consulting-tone advisories
 * across regional, crowd, weather, geopolitical, travel and infrastructure signals.
 */
export const IndiaAdvisorySection = () => {
  return (
    <section className="border-y border-border/40 bg-muted/20">
      <div className="container mx-auto px-5 md:px-6 py-16 md:py-24 max-w-6xl">
        <div className="flex items-end justify-between flex-wrap gap-4 mb-10">
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-secondary font-semibold mb-3">
              India Security Advisory
            </p>
            <h2 className="font-heading text-3xl md:text-5xl font-bold tracking-tight leading-[1.05] max-w-2xl">
              Curated operational signals across Indian environments.
            </h2>
            <p className="mt-4 text-sm md:text-base text-muted-foreground max-w-2xl leading-relaxed">
              Calibrated, non-sensational and consulting-grade. Updated as the
              operating picture evolves — never as alarmist commentary.
            </p>
          </div>
          <p className="text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70">
            Refreshed weekly · Field-curated
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5">
          {ADVISORIES.map((a, i) => {
            const accents = [
              { ring: "hsl(195 100% 55%)", tint: "hsl(195 100% 55% / 0.12)" },
              { ring: "hsl(12 100% 64%)", tint: "hsl(12 100% 64% / 0.12)" },
              { ring: "hsl(78 85% 50%)", tint: "hsl(78 85% 50% / 0.14)" },
              { ring: "hsl(320 85% 60%)", tint: "hsl(320 85% 60% / 0.12)" },
              { ring: "hsl(38 100% 58%)", tint: "hsl(38 100% 58% / 0.14)" },
            ];
            const accent = accents[i % accents.length];
            return (
              <Card
                key={a.title}
                className="group relative border-border/60 bg-card/80 hover:-translate-y-1 hover:shadow-editorial transition-all overflow-hidden h-full"
                style={{ borderTop: `4px solid ${accent.ring}` }}
              >
                <div
                  className="pointer-events-none absolute -top-12 -right-12 h-32 w-32 rounded-full blur-2xl opacity-60"
                  style={{ background: accent.tint }}
                />
                <CardContent className="p-6 flex flex-col h-full relative">
                  <div className="flex items-center justify-between mb-4">
                    <div className="inline-flex items-center gap-2 text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
                      <span
                        className="h-7 w-7 rounded-md flex items-center justify-center animate-pulse-slow"
                        style={{ background: accent.tint, color: accent.ring }}
                      >
                        {a.icon}
                      </span>
                      {a.category}
                    </div>
                    <Badge
                      variant="outline"
                      className={`text-[10px] uppercase tracking-[0.18em] font-semibold ${POSTURE_CLASS[a.posture]}`}
                    >
                      {a.posture}
                    </Badge>
                  </div>
                  <p className="font-mono text-[10px] uppercase tracking-[0.22em] text-muted-foreground/70 mb-2">
                    {a.region}
                  </p>
                  <h3 className="font-heading font-semibold text-base leading-snug mb-3">
                    {a.title}
                  </h3>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {a.body}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        <p className="mt-8 text-center text-[11px] uppercase tracking-[0.22em] text-muted-foreground/70">
          Calibrated · Non-sensational · Consulting-grade
        </p>
      </div>
    </section>
  );
};

export default IndiaAdvisorySection;
