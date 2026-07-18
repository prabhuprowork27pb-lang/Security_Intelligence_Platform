import { Card } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { ScoreBadge } from "@/components/ScoreBadge";
import { getScoreBand } from "@/lib/scoring";

interface DomainCardProps {
  icon: LucideIcon;
  name: string;
  score: number;
  maturity: number;
  scoreColor?: string; // Kept for backwards compatibility but no longer used
}

export const DomainCard = ({ icon: Icon, name, score, maturity }: DomainCardProps) => {
  const band = getScoreBand(score);
  
  return (
    <Card 
      className="p-5 group cursor-pointer border-l-4 transition-all hover:shadow-lg"
      style={{ borderLeftColor: band?.color || '#95A5A6' }}
    >
      <div className="flex items-start justify-between mb-3">
        <div className="p-3 rounded-lg bg-muted/50 group-hover:bg-secondary/10 transition-colors">
          <Icon className="h-6 w-6 text-secondary" />
        </div>
        <ScoreBadge score={score} compact showScore={false} />
      </div>
      <h3 className="font-heading font-semibold text-sm mb-3 line-clamp-2 min-h-[2.5rem]">
        {name}
      </h3>
      <div className="flex items-baseline gap-2">
        <span 
          className="font-mono text-3xl font-bold"
          style={{ color: band?.color || '#95A5A6' }}
        >
          {score.toFixed(0)}
        </span>
        <span className="text-xs text-muted-foreground">/100</span>
        <span className="ml-auto text-xs text-muted-foreground font-mono">L{maturity}</span>
      </div>
    </Card>
  );
};
