import { Card } from "@/components/ui/card";

interface ScoreGaugeProps {
  score: number;
  size?: "sm" | "md" | "lg";
  showLabel?: boolean;
}

export const ScoreGauge = ({ score, size = "lg", showLabel = true }: ScoreGaugeProps) => {
  const getScoreColor = () => {
    if (score >= 75) return "text-accent";
    if (score >= 50) return "text-score-medium";
    return "text-score-low";
  };

  const getGradientColor = () => {
    if (score >= 75) return "from-accent/20 to-accent/5";
    if (score >= 50) return "from-score-medium/20 to-score-medium/5";
    return "from-score-low/20 to-score-low/5";
  };

  const sizeClasses = {
    sm: "w-24 h-24 text-3xl",
    md: "w-32 h-32 text-4xl",
    lg: "w-40 h-40 text-6xl",
  };

  const percentage = Math.min(score, 100);
  const circumference = 2 * Math.PI * 60;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;

  return (
    <div className="flex flex-col items-center">
      <div className={`relative ${sizeClasses[size]}`}>
        {/* Background circle */}
        <svg className="absolute inset-0 -rotate-90 w-full h-full" viewBox="0 0 140 140">
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            className="text-muted/20"
          />
          <circle
            cx="70"
            cy="70"
            r="60"
            fill="none"
            stroke="currentColor"
            strokeWidth="8"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            className={`${getScoreColor()} transition-all duration-1000 ease-out`}
          />
        </svg>
        {/* Score display */}
        <div className={`absolute inset-0 flex items-center justify-center bg-gradient-to-br ${getGradientColor()} rounded-full`}>
          <span className={`font-mono font-bold ${getScoreColor()}`}>
            {score.toFixed(0)}
          </span>
        </div>
      </div>
      {showLabel && (
        <p className="text-sm text-muted-foreground mt-3 font-medium">Overall Score</p>
      )}
    </div>
  );
};
