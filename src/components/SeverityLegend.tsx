/**
 * SeverityLegend
 * Reusable, presentation-only band legend used across executive surfaces.
 * Mirrors the project-wide score bands (0–40 / 41–70 / 71–85 / 86–100).
 * Does NOT alter any scoring logic.
 */
interface SeverityLegendProps {
  className?: string;
  compact?: boolean;
}

const BANDS = [
  { label: "Critical",   range: "0–40",   tone: "bg-score-low/15 text-score-low border-score-low/30" },
  { label: "Developing", range: "41–70",  tone: "bg-score-medium/15 text-score-medium border-score-medium/30" },
  { label: "Effective",  range: "71–85",  tone: "bg-secondary/15 text-secondary border-secondary/30" },
  { label: "Mature",     range: "86–100", tone: "bg-accent/15 text-accent border-accent/30" },
];

export const SeverityLegend = ({ className = "", compact = false }: SeverityLegendProps) => {
  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      {!compact && (
        <span className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground mr-1">
          Severity Hierarchy
        </span>
      )}
      {BANDS.map((b) => (
        <span
          key={b.label}
          className={`inline-flex items-center gap-1.5 rounded-md border px-2 py-0.5 text-[11px] font-medium ${b.tone}`}
        >
          <span className="font-mono opacity-80">{b.range}</span>
          <span>{b.label}</span>
        </span>
      ))}
    </div>
  );
};

export default SeverityLegend;
