import { getDomainIcon } from "@/lib/domainIcons";
import { getScoreBand } from "@/lib/scoring";

interface DomainScore {
  domain_key: string;
  domain_name: string;
  score_0_100: number;
  maturity_1_5: number;
}

interface DomainBarChartProps {
  domains: DomainScore[];
}

export function DomainBarChart({ domains }: DomainBarChartProps) {
  const maxScore = 100;

  return (
    <div className="space-y-3">
      {domains.map((domain) => {
        const Icon = getDomainIcon(domain.domain_key);
        const barWidth = `${(domain.score_0_100 / maxScore) * 100}%`;
        const band = getScoreBand(domain.score_0_100);
        
        return (
          <div key={domain.domain_key} className="flex items-center gap-3">
            <div className="flex items-center gap-2 w-48 flex-shrink-0">
              <div className="p-1.5 rounded bg-primary/10 flex-shrink-0">
                <Icon className="w-4 h-4 text-primary" />
              </div>
              <span className="text-xs font-medium text-foreground truncate">
                {domain.domain_name}
              </span>
            </div>
            <div className="flex-1 relative h-8 bg-muted rounded-lg overflow-hidden">
              <div
                className="absolute inset-y-0 left-0 rounded-lg transition-all duration-500"
                style={{
                  width: barWidth,
                  backgroundColor: band?.color || '#95A5A6',
                }}
              />
              {/* Score displayed outside the bar for readability */}
              <span
                className="absolute inset-0 flex items-center pl-2 text-xs font-mono font-semibold text-foreground"
              >
                {Math.round(domain.score_0_100)}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
