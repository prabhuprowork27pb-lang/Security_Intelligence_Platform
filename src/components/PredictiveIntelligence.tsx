import { useEffect, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { TrendingUp, TrendingDown, Minus, AlertTriangle, LineChart } from "lucide-react";

interface AssessmentRow {
  id: string;
  site_id: string;
  status: string;
  overall_score_0_100: number | null;
  submitted_at: string | null;
  created_at: string;
}

interface DomainRow {
  assessment_id: string;
  domain_name: string;
  score_0_100: number;
}

interface RegressingDomain {
  name: string;
  delta: number; // negative = regressing
  latestAvg: number;
}

interface PredictiveSignal {
  portfolioIndex: number | null;
  delta: number | null; // vs previous portfolio snapshot
  forecastBand: "Critical" | "Developing" | "Effective" | "Mature" | null;
  weakestDomains: { name: string; score: number }[];
  regressingDomains: RegressingDomain[];
  sampleSize: number;
}

const bandFor = (score: number | null): PredictiveSignal["forecastBand"] => {
  if (score == null) return null;
  if (score <= 40) return "Critical";
  if (score <= 70) return "Developing";
  if (score <= 85) return "Effective";
  return "Mature";
};

interface PredictiveIntelligenceProps {
  className?: string;
}

/**
 * Read-only predictive layer. Derives portfolio drift, forecast band, and
 * predicted-risk domains from the latest completed assessments per site.
 * No schema changes; uses existing assessments + domain_scores tables.
 */
const PredictiveIntelligence = ({ className = "" }: PredictiveIntelligenceProps) => {
  const [signal, setSignal] = useState<PredictiveSignal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      try {
        const { data: assessments } = await supabase
          .from("assessments")
          .select("id, site_id, status, overall_score_0_100, submitted_at, created_at")
          .eq("status", "completed")
          .order("submitted_at", { ascending: false })
          .limit(500);

        const rows = (assessments ?? []) as AssessmentRow[];
        if (!rows.length) {
          if (!cancelled) {
            setSignal({ portfolioIndex: null, delta: null, forecastBand: null, weakestDomains: [], regressingDomains: [], sampleSize: 0 });
            setLoading(false);
          }
          return;
        }

        // Latest + previous per site
        const latestPerSite = new Map<string, AssessmentRow>();
        const previousPerSite = new Map<string, AssessmentRow>();
        for (const r of rows) {
          if (!latestPerSite.has(r.site_id)) {
            latestPerSite.set(r.site_id, r);
          } else if (!previousPerSite.has(r.site_id)) {
            previousPerSite.set(r.site_id, r);
          }
        }

        const latestScores = [...latestPerSite.values()]
          .map((a) => a.overall_score_0_100)
          .filter((v): v is number => typeof v === "number");
        const previousScores = [...previousPerSite.values()]
          .map((a) => a.overall_score_0_100)
          .filter((v): v is number => typeof v === "number");

        const avg = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : null);
        const portfolioIndex = avg(latestScores);
        const previousIndex = avg(previousScores);
        const delta = portfolioIndex != null && previousIndex != null ? portfolioIndex - previousIndex : null;

        // Predicted-risk + regressing domains
        const latestIds = [...latestPerSite.values()].map((a) => a.id);
        const previousIds = [...previousPerSite.values()].map((a) => a.id);
        let weakestDomains: { name: string; score: number }[] = [];
        let regressingDomains: RegressingDomain[] = [];
        if (latestIds.length) {
          const allIds = [...new Set([...latestIds, ...previousIds])];
          const { data: domains } = await supabase
            .from("domain_scores")
            .select("assessment_id, domain_name, score_0_100")
            .in("assessment_id", allIds);

          const latestSet = new Set(latestIds);
          const previousSet = new Set(previousIds);
          const latestByDomain = new Map<string, number[]>();
          const previousByDomain = new Map<string, number[]>();
          for (const d of (domains ?? []) as DomainRow[]) {
            if (latestSet.has(d.assessment_id)) {
              const arr = latestByDomain.get(d.domain_name) ?? [];
              arr.push(d.score_0_100);
              latestByDomain.set(d.domain_name, arr);
            }
            if (previousSet.has(d.assessment_id)) {
              const arr = previousByDomain.get(d.domain_name) ?? [];
              arr.push(d.score_0_100);
              previousByDomain.set(d.domain_name, arr);
            }
          }

          weakestDomains = [...latestByDomain.entries()]
            .map(([name, vals]) => ({ name, score: vals.reduce((a, b) => a + b, 0) / vals.length }))
            .sort((a, b) => a.score - b.score)
            .slice(0, 3);

          regressingDomains = [...latestByDomain.entries()]
            .map(([name, vals]) => {
              const latestAvg = vals.reduce((a, b) => a + b, 0) / vals.length;
              const prev = previousByDomain.get(name);
              if (!prev || !prev.length) return null;
              const previousAvg = prev.reduce((a, b) => a + b, 0) / prev.length;
              return { name, latestAvg, delta: latestAvg - previousAvg };
            })
            .filter((d): d is RegressingDomain => !!d && d.delta < -0.5)
            .sort((a, b) => a.delta - b.delta)
            .slice(0, 3);
        }

        if (!cancelled) {
          setSignal({
            portfolioIndex,
            delta,
            forecastBand: bandFor(portfolioIndex),
            weakestDomains,
            regressingDomains,
            sampleSize: latestPerSite.size,
          });
          setLoading(false);
        }
      } catch (e) {
        console.warn("PredictiveIntelligence load error", e);
        if (!cancelled) setLoading(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, []);

  if (loading) {
    return (
      <Card className={`border-border/60 ${className}`}>
        <CardContent className="p-5">
          <div className="h-24 animate-pulse bg-muted/40 rounded" />
        </CardContent>
      </Card>
    );
  }

  if (!signal || signal.sampleSize === 0) {
    return (
      <Card className={`border-dashed border-border/60 ${className}`}>
        <CardContent className="p-5">
          <div className="flex items-center gap-2 mb-1.5">
            <LineChart className="h-4 w-4 text-secondary" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              Predictive Posture
            </p>
          </div>
          <p className="text-sm text-muted-foreground">
            Predictive signals will appear once at least one diagnostic is completed.
          </p>
        </CardContent>
      </Card>
    );
  }

  const TrendIcon = signal.delta == null
    ? Minus
    : signal.delta > 0.5
      ? TrendingUp
      : signal.delta < -0.5
        ? TrendingDown
        : Minus;

  const trendColor = signal.delta == null
    ? "text-muted-foreground"
    : signal.delta > 0.5
      ? "text-accent"
      : signal.delta < -0.5
        ? "text-score-low"
        : "text-muted-foreground";

  return (
    <Card className={`border-border/60 ${className}`}>
      <CardContent className="p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-secondary" />
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold">
              Predictive Posture
            </p>
          </div>
          <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
            {signal.sampleSize} site{signal.sampleSize === 1 ? "" : "s"} · latest diagnostic
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Portfolio Index</p>
            <div className="flex items-baseline gap-2">
              <span className="text-2xl font-mono font-semibold text-foreground">
                {signal.portfolioIndex != null ? signal.portfolioIndex.toFixed(0) : "—"}
              </span>
              <span className="text-xs text-muted-foreground">/ 100</span>
            </div>
            {signal.forecastBand && (
              <p className="text-[11px] mt-1 text-muted-foreground">
                Forecast band:{" "}
                <span className="font-semibold text-foreground">{signal.forecastBand}</span>
              </p>
            )}
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1">Drift Signal</p>
            <div className={`flex items-center gap-2 ${trendColor}`}>
              <TrendIcon className="h-5 w-5" />
              <span className="text-2xl font-mono font-semibold">
                {signal.delta == null ? "—" : `${signal.delta > 0 ? "+" : ""}${signal.delta.toFixed(1)}`}
              </span>
            </div>
            <p className="text-[11px] mt-1 text-muted-foreground">
              {signal.delta == null
                ? "Insufficient history for drift detection."
                : "vs previous diagnostics across portfolio"}
            </p>
          </div>

          <div>
            <p className="text-[11px] uppercase tracking-wider text-muted-foreground mb-1 flex items-center gap-1">
              <AlertTriangle className="h-3 w-3 text-score-low" />
              Predicted Risk Domains
            </p>
            {signal.weakestDomains.length === 0 ? (
              <p className="text-xs text-muted-foreground">No domain signals yet.</p>
            ) : (
              <ul className="space-y-1">
                {signal.weakestDomains.map((d) => (
                  <li key={d.name} className="flex items-center justify-between gap-2 text-xs">
                    <span className="text-foreground truncate">{d.name}</span>
                    <span className="font-mono text-muted-foreground shrink-0">{d.score.toFixed(0)}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {signal.regressingDomains.length > 0 && (
          <div className="mt-4 border-t border-border/50 pt-3">
            <p className="text-[11px] uppercase tracking-[0.18em] text-muted-foreground font-semibold mb-2 flex items-center gap-1.5">
              <TrendingDown className="h-3 w-3 text-score-low" />
              Regressing Watchlist
            </p>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-2">
              {signal.regressingDomains.map((d) => (
                <li
                  key={d.name}
                  className="flex items-center justify-between gap-2 text-xs rounded-md border border-border/60 bg-muted/30 px-2.5 py-1.5"
                >
                  <span className="text-foreground truncate">{d.name}</span>
                  <span className="font-mono text-score-low shrink-0">
                    {d.delta.toFixed(1)}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        )}

        <p className="mt-4 text-[11px] text-muted-foreground/80 border-t border-border/50 pt-3">
          Heuristic forecast derived from the latest completed diagnostics. Treat as a directional signal, not a guarantee — validate with a fresh review before executive reporting.
        </p>
      </CardContent>
    </Card>
  );
};

export default PredictiveIntelligence;
