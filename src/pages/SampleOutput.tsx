import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/contexts/AuthContext";
import { SiteHeader } from "@/components/SiteHeader";
import {
  ArrowRight,
  Radar,
  TrendingUp,
  Activity,
  AlertTriangle,
  CheckCircle2,
  Info,
} from "lucide-react";

const DOMAINS = [
  { name: "Access Control", v: 78 },
  { name: "Surveillance & ESS", v: 64 },
  { name: "Crisis & Continuity", v: 34 },
  { name: "Guarding Operations", v: 71 },
  { name: "Visitor Management", v: 58 },
  { name: "Perimeter Security", v: 67 },
  { name: "Incident Response", v: 42 },
  { name: "Workforce Readiness", v: 55 },
  { name: "Tech Integration", v: 49 },
  { name: "Governance", v: 73 },
];

const HEATMAP = [
  70, 64, 58, 34, 71, 78, 52, 66, 81, 45,
  58, 49, 72, 38, 65, 70, 54, 61, 77, 42,
  66, 71, 39, 58, 73, 48, 62, 79, 51, 44,
];

const SampleOutput = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const handlePrimaryCta = () => navigate(user ? "/dashboard" : "/auth");

  return (
    <div className="min-h-dvh bg-background">
      <SiteHeader />

      {/* Header band */}
      <section className="border-b border-border/40 bg-muted/30">
        <div className="container mx-auto px-6 py-16 lg:py-20">
          <div className="max-w-3xl">
            <p className="text-xs uppercase tracking-[0.2em] text-primary font-semibold mb-4">
              Platform Preview
            </p>
            <h1 className="font-heading text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight leading-[1.05] mb-5">
              A representative diagnostic output.
            </h1>
            <p className="text-lg text-muted-foreground leading-relaxed">
              An illustrative view of what the Security Selfie produces — score, posture, domain breakdown
              and risk heatmap. Not a real client report.
            </p>
            <div className="mt-4 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-3 py-1 text-xs text-muted-foreground">
              <Info className="h-3.5 w-3.5" />
              Illustrative data — for product preview only
            </div>
          </div>
        </div>
      </section>

      {/* Output */}
      <section className="container mx-auto px-6 py-16 lg:py-20">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-[1fr_1.2fr] gap-6">
          <Card className="overflow-hidden border-border/60 bg-gradient-to-br from-primary to-secondary text-primary-foreground shadow-2xl">
            <CardContent className="p-10 flex flex-col items-center text-center h-full justify-center">
              <p className="text-xs uppercase tracking-[0.2em] opacity-80 mb-6">Posture Score</p>
              <p className="font-mono font-bold text-8xl md:text-9xl leading-none mb-4">62</p>
              <span className="inline-block px-4 py-1.5 rounded-full bg-background text-foreground text-sm font-semibold mb-6">
                Developing
              </span>
              <p className="text-sm opacity-80 max-w-xs">
                Moderate exposure — 5 of 10 domains performing below target.
              </p>
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-5">
                  <h3 className="font-heading font-semibold flex items-center gap-2">
                    <Radar className="h-4 w-4 text-primary" />
                    Domain Breakdown
                  </h3>
                  <span className="text-xs text-muted-foreground">10 domains</span>
                </div>
                <div className="space-y-3">
                  {DOMAINS.map((d) => (
                    <div key={d.name} className="flex items-center gap-3">
                      <span className="text-sm text-foreground w-44 truncate">{d.name}</span>
                      <div className="flex-1 h-2 rounded-full bg-muted overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            d.v >= 71 ? "bg-primary" : d.v >= 41 ? "bg-accent" : "bg-destructive"
                          }`}
                          style={{ width: `${d.v}%` }}
                        />
                      </div>
                      <span className="font-mono text-xs text-foreground w-8 text-right">{d.v}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card className="border-border/60">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-heading font-semibold flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-primary" />
                    Risk Heatmap
                  </h3>
                  <div className="flex items-center gap-3 text-[10px] text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-destructive" /> High
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-accent" /> Med
                    </span>
                    <span className="flex items-center gap-1">
                      <span className="h-2 w-2 rounded-sm bg-primary" /> Low
                    </span>
                  </div>
                </div>
                <div className="grid grid-cols-10 gap-1.5">
                  {HEATMAP.map((v, i) => {
                    const cls = v >= 71 ? "bg-primary" : v >= 41 ? "bg-accent" : "bg-destructive";
                    return (
                      <div
                        key={i}
                        className={`h-7 rounded-sm ${cls} hover:scale-110 transition-transform`}
                        title={`Score: ${v}`}
                      />
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Summary cards */}
        <div className="max-w-6xl mx-auto grid sm:grid-cols-3 gap-5 mt-8">
          {[
            { icon: CheckCircle2, label: "Strongest domain", value: "Access Control", tone: "primary" },
            { icon: AlertTriangle, label: "Weakest domain", value: "Crisis & Continuity", tone: "destructive" },
            { icon: Activity, label: "Inefficiency detected", value: "~30%", tone: "accent" },
          ].map((c) => (
            <Card key={c.label} className="border-border/60">
              <CardContent className="p-5 flex items-center gap-4">
                <div className={`h-10 w-10 rounded-lg flex items-center justify-center bg-${c.tone}/10 text-${c.tone}`}>
                  <c.icon className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs uppercase tracking-wider text-muted-foreground mb-1">{c.label}</p>
                  <p className="font-heading font-semibold text-base">{c.value}</p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Button size="lg" onClick={handlePrimaryCta} className="text-base px-8 h-12">
            Take a Security Selfie™
            <ArrowRight className="ml-2 h-5 w-5" />
          </Button>
        </div>
      </section>
    </div>
  );
};

export default SampleOutput;
