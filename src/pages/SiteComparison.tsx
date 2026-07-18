import { useEffect, useMemo, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, GitCompare, MapPin } from "lucide-react";
import { getScoreBand } from "@/lib/scoring";
import { ScoreBadge } from "@/components/ScoreBadge";

interface SiteRow {
  id: string;
  name: string;
  city: string;
}

interface AssessmentRow {
  id: string;
  site_id: string;
  overall_score_0_100: number | null;
  overall_maturity_1_5: number | null;
  risk_posture: string | null;
  created_at: string;
  status: string | null;
  review_status: string | null;
}

interface DomainRow {
  assessment_id: string;
  domain_key: string;
  domain_name: string;
  score_0_100: number | null;
  maturity_1_5: number | null;
}

interface SiteCompare {
  site: SiteRow;
  assessment: AssessmentRow | null;
  domains: Record<string, DomainRow>;
}

const SiteComparison = () => {
  const { id: orgId } = useParams();
  const navigate = useNavigate();
  const [orgName, setOrgName] = useState<string>("");
  const [rows, setRows] = useState<SiteCompare[]>([]);
  const [allDomains, setAllDomains] = useState<{ key: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orgId]);

  const fetchData = async () => {
    if (!orgId) return;

    const { data: org } = await supabase.from("organisations").select("name").eq("id", orgId).maybeSingle();
    setOrgName(org?.name ?? "");

    const { data: sites } = await supabase
      .from("sites")
      .select("id, name, city")
      .eq("organisation_id", orgId)
      .order("name", { ascending: true });

    const siteList = (sites ?? []) as SiteRow[];
    if (siteList.length === 0) {
      setRows([]);
      setLoading(false);
      return;
    }

    const siteIds = siteList.map((s) => s.id);

    const { data: assessments } = await supabase
      .from("assessments")
      .select("id, site_id, overall_score_0_100, overall_maturity_1_5, risk_posture, created_at, status, review_status")
      .in("site_id", siteIds)
      .order("created_at", { ascending: false });

    // Latest completed assessment per site
    const latestPerSite: Record<string, AssessmentRow> = {};
    for (const a of (assessments ?? []) as AssessmentRow[]) {
      const completed = a.status !== "draft" && a.overall_score_0_100 != null;
      if (completed && !latestPerSite[a.site_id]) {
        latestPerSite[a.site_id] = a;
      }
    }

    const aIds = Object.values(latestPerSite).map((a) => a.id);
    let domainData: DomainRow[] = [];
    if (aIds.length > 0) {
      const { data: ds } = await supabase
        .from("domain_scores")
        .select("assessment_id, domain_key, domain_name, score_0_100, maturity_1_5")
        .in("assessment_id", aIds);
      domainData = (ds ?? []) as DomainRow[];
    }

    // Build site -> domain map
    const compareRows: SiteCompare[] = siteList.map((site) => {
      const a = latestPerSite[site.id] ?? null;
      const domains: Record<string, DomainRow> = {};
      if (a) {
        for (const d of domainData.filter((x) => x.assessment_id === a.id)) {
          domains[d.domain_key] = d;
        }
      }
      return { site, assessment: a, domains };
    });

    // Domain master list (ordered by canonical order from any assessment)
    const domainMaster: { key: string; name: string }[] = [];
    const seen = new Set<string>();
    for (const d of domainData) {
      if (!seen.has(d.domain_key)) {
        seen.add(d.domain_key);
        domainMaster.push({ key: d.domain_key, name: d.domain_name });
      }
    }

    setRows(compareRows);
    setAllDomains(domainMaster);
    setLoading(false);
  };

  const sitesWithData = useMemo(() => rows.filter((r) => r.assessment), [rows]);

  // Compute min/max per domain to highlight strongest / weakest site
  const domainStats = useMemo(() => {
    const stats: Record<string, { min: number; max: number }> = {};
    for (const d of allDomains) {
      const vals = sitesWithData
        .map((r) => r.domains[d.key]?.score_0_100)
        .filter((v): v is number => typeof v === "number");
      if (vals.length > 0) stats[d.key] = { min: Math.min(...vals), max: Math.max(...vals) };
    }
    return stats;
  }, [sitesWithData, allDomains]);

  if (loading) {
    return (
      <div className="min-h-dvh bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">Loading site comparison…</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="sticky top-0 z-40 border-b border-border bg-primary text-primary-foreground shadow-md">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              onClick={() => navigate(`/organisations/${orgId}`)}
              className="text-primary-foreground hover:bg-primary-foreground/10"
            >
              <ArrowLeft className="mr-2 h-4 w-4" /> Back to organisation
            </Button>
            <div className="border-l border-primary-foreground/20 pl-4">
              <h1 className="text-base md:text-lg font-heading font-semibold tracking-tight">
                Site Comparison
              </h1>
              <p className="text-[11px] md:text-xs text-primary-foreground/70">
                Latest validated diagnostic per site · {orgName}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-6 py-8 max-w-7xl">
        {sitesWithData.length === 0 ? (
          <Card className="p-12 text-center">
            <GitCompare className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h2 className="font-heading font-semibold text-xl mb-2">No comparable diagnostics yet</h2>
            <p className="text-muted-foreground max-w-md mx-auto">
              Complete a Security Selfie™ for at least two sites in this organisation to see a
              domain-wise comparison here.
            </p>
          </Card>
        ) : (
          <div className="space-y-6">
            {/* Headline scores per site */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {sitesWithData.map(({ site, assessment }) => {
                const score = assessment!.overall_score_0_100 ?? 0;
                const band = getScoreBand(score);
                return (
                  <Card key={site.id} className="p-5 border-l-4" style={{ borderLeftColor: band?.color || "#95A5A6" }}>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                      <MapPin className="h-3.5 w-3.5" /> {site.city}
                    </div>
                    <h3 className="font-heading font-semibold text-lg mb-2">{site.name}</h3>
                    <div className="flex items-end gap-3">
                      <span
                        className="text-3xl font-mono font-bold"
                        style={{ color: band?.color || "#95A5A6" }}
                      >
                        {Math.round(score)}
                      </span>
                      <span className="text-xs text-muted-foreground mb-1">/100</span>
                      <div className="ml-auto">
                        <ScoreBadge score={score} compact showScore={false} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
                      <Badge variant="outline" className="text-[10px]">
                        Maturity {assessment!.overall_maturity_1_5}/5
                      </Badge>
                      <span>·</span>
                      <span>{new Date(assessment!.created_at).toLocaleDateString()}</span>
                    </div>
                  </Card>
                );
              })}
            </div>

            {/* Sites without a completed assessment */}
            {rows.some((r) => !r.assessment) && (
              <Card className="p-4 border-dashed">
                <p className="text-xs text-muted-foreground">
                  <span className="font-semibold text-foreground">No completed diagnostic:</span>{" "}
                  {rows.filter((r) => !r.assessment).map((r) => r.site.name).join(", ")}
                </p>
              </Card>
            )}

            {/* Domain-by-domain table */}
            <Card className="p-0 overflow-hidden">
              <div className="p-5 border-b">
                <h2 className="font-heading font-semibold text-lg">Domain-wise comparison</h2>
                <p className="text-xs text-muted-foreground mt-1">
                  Strongest site per domain is highlighted in <span className="text-secondary font-semibold">teal</span>;
                  weakest in <span className="text-score-low font-semibold">red</span>. Differences are shown
                  versus the strongest site.
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="text-left p-3 font-semibold text-foreground">Domain</th>
                      {sitesWithData.map(({ site }) => (
                        <th key={site.id} className="text-left p-3 font-semibold text-foreground">
                          {site.name}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {allDomains.map((d) => {
                      const stat = domainStats[d.key];
                      return (
                        <tr key={d.key} className="border-t">
                          <td className="p-3 font-medium text-foreground/90 align-top">{d.name}</td>
                          {sitesWithData.map(({ site, domains }) => {
                            const cell = domains[d.key];
                            const v = cell?.score_0_100;
                            if (typeof v !== "number") {
                              return (
                                <td key={site.id} className="p-3 text-xs text-muted-foreground">
                                  —
                                </td>
                              );
                            }
                            const isMax = stat && v === stat.max && stat.min !== stat.max;
                            const isMin = stat && v === stat.min && stat.min !== stat.max;
                            const delta = stat ? v - stat.max : 0;
                            const band = getScoreBand(v);
                            return (
                              <td key={site.id} className="p-3 align-top">
                                <div className="flex items-center gap-2">
                                  <span
                                    className={`font-mono font-bold text-base ${
                                      isMax
                                        ? "text-secondary"
                                        : isMin
                                        ? "text-score-low"
                                        : "text-foreground"
                                    }`}
                                  >
                                    {Math.round(v)}
                                  </span>
                                  <span
                                    className="inline-block h-2 w-12 rounded-full"
                                    style={{ backgroundColor: band?.color || "#95A5A6" }}
                                  />
                                </div>
                                {!isMax && stat && stat.min !== stat.max && (
                                  <span className="text-[10px] text-muted-foreground">
                                    {delta < 0 ? "" : "+"}
                                    {Math.round(delta)} vs best
                                  </span>
                                )}
                                {isMax && stat.min !== stat.max && (
                                  <span className="text-[10px] text-secondary font-semibold">
                                    Strongest
                                  </span>
                                )}
                              </td>
                            );
                          })}
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </div>
        )}
      </main>
    </div>
  );
};

export default SiteComparison;
