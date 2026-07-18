import { getScoreBand } from "@/lib/scoring";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { cn } from "@/lib/utils";

interface ScoreBadgeProps {
  score: number | null | undefined;
  compact?: boolean;
  className?: string;
  showScore?: boolean;
}

export function ScoreBadge({ score, compact = false, className, showScore = true }: ScoreBadgeProps) {
  const band = getScoreBand(score);
  
  // Handle null/undefined scores
  if (!band) {
    return (
      <span 
        className={cn(
          "saass-badge inline-flex items-center justify-center rounded-full font-semibold",
          compact ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
          className
        )}
        style={{ 
          backgroundColor: 'var(--saass-bg)', 
          color: '#6B7280' 
        }}
      >
        -
      </span>
    );
  }

  const displayText = showScore && score !== null && score !== undefined
    ? `${band.label} • ${Math.round(score)}`
    : band.label;

  return (
    <TooltipProvider delayDuration={200}>
      <Tooltip>
        <TooltipTrigger asChild>
          <span 
            className={cn(
              `saass-badge saass-badge--${band.id}`,
              "inline-flex items-center justify-center rounded-full font-semibold transition-all cursor-default",
              compact ? "px-2 py-0.5 text-xs" : "px-3 py-1.5 text-sm",
              className
            )}
            style={{ 
              backgroundColor: band.color, 
              color: band.textColor 
            }}
          >
            {displayText}
          </span>
        </TooltipTrigger>
        <TooltipContent side="top" className="bg-card border-border max-w-xs">
          <p className="text-sm font-medium">{band.label}</p>
          <p className="text-xs text-muted-foreground">{band.description}</p>
          <p className="text-xs text-muted-foreground mt-1">Score range: {band.min}-{band.max}</p>
        </TooltipContent>
      </Tooltip>
    </TooltipProvider>
  );
}
