import { Card } from "@/components/ui/card";
import { getDomainIcon } from "@/lib/domainIcons";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { getScoreBand, SAASS_SCORE_BANDS } from "@/lib/scoring";
import type { DomainRiskScores } from "@/lib/riskDimensions";

interface RiskHeatmapProps {
  riskDimensionData: DomainRiskScores[];
}

const RISK_DIMENSIONS: Array<keyof Omit<DomainRiskScores, "domainKey" | "domainName">> = [
  "people",
  "process",
  "technology",
  "governance",
  "compliance",
];

const DIMENSION_LABELS: Record<string, string> = {
  people: "People",
  process: "Process",
  technology: "Technology",
  governance: "Governance",
  compliance: "Compliance",
};

export const RiskHeatmap = ({ riskDimensionData }: RiskHeatmapProps) => {
  const getCellStyle = (score: number | null) => {
    if (score === null) {
      return {
        backgroundColor: 'var(--saass-bg)',
        color: '#6B7280'
      };
    }
    const band = getScoreBand(score);
    return {
      backgroundColor: band?.color || 'var(--saass-bg)',
      color: band?.textColor || '#6B7280'
    };
  };

  return (
    <Card className="p-6 border-border/50">
      <h2 className="text-2xl font-heading font-bold mb-2">Your Risk Picture</h2>
      <p className="text-sm text-muted-foreground mb-6">
        Security performance mapped across risk dimensions and domains
      </p>
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b-2 border-border">
              <th className="text-left p-4 font-heading font-semibold text-foreground min-w-[200px]">
                Domain
              </th>
              {RISK_DIMENSIONS.map((dim) => (
                <th
                  key={dim}
                  className="text-center p-4 font-heading font-semibold text-sm text-foreground"
                >
                  {DIMENSION_LABELS[dim]}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {riskDimensionData.map((domain) => {
              const Icon = getDomainIcon(domain.domainKey);
              
              return (
                <tr key={domain.domainKey} className="border-b border-border/30 hover:bg-muted/20 transition-colors">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="p-2 rounded-lg bg-primary/10">
                        <Icon className="h-4 w-4 text-primary" />
                      </div>
                      <span className="font-medium text-foreground text-sm">{domain.domainName}</span>
                    </div>
                  </td>
                  {RISK_DIMENSIONS.map((dim) => {
                    const score = domain[dim];
                    const cellStyle = getCellStyle(score);
                    const band = score !== null ? getScoreBand(score) : null;
                    
                    return (
                      <td key={dim} className="p-2 text-center">
                        <TooltipProvider delayDuration={100}>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <div
                                className="saass-heatmap-cell mx-auto cursor-pointer"
                                style={cellStyle}
                              >
                                <span className="text-xs font-mono font-semibold">
                                  {score !== null ? score.toFixed(0) : '-'}
                                </span>
                              </div>
                            </TooltipTrigger>
                            <TooltipContent side="top" className="bg-card border-border">
                              <p className="text-xs font-medium">
                                {DIMENSION_LABELS[dim]}: {score !== null ? `${score.toFixed(1)}/100` : "Not measured for this domain"}
                              </p>
                              {band && (
                                <p className="text-xs text-muted-foreground">{band.label}</p>
                              )}
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                    );
                  })}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="mt-6 flex gap-4 justify-end text-sm flex-wrap">
        {SAASS_SCORE_BANDS.map((band) => (
          <div key={band.id} className="flex items-center gap-2">
            <div 
              className="w-4 h-4 rounded"
              style={{ backgroundColor: band.color }}
            />
            <span className="text-muted-foreground">
              {band.label} ({band.min}-{band.max})
            </span>
          </div>
        ))}
        <div className="flex items-center gap-2">
          <div
            className="w-4 h-4 rounded border border-border"
            style={{ backgroundColor: 'var(--saass-bg)' }}
          />
          <span className="text-muted-foreground">Not measured for this domain</span>
        </div>
      </div>
    </Card>
  );
};
