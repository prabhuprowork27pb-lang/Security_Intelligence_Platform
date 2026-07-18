import { getStructuredInsight, getTierLabel } from "@/lib/domainInsights";
import { getScoreBand } from "@/lib/scoring";

interface DomainInsightBlockProps {
  domainKey: string;
  domainName: string;
  score: number;
  /** When true, render a compact, print-friendly layout for the PDF report. */
  variant?: "screen" | "print";
}

/**
 * Consulting-grade structured insight block rendered alongside (not replacing)
 * the system-generated narrative. Always presents four advisory lenses:
 * Current View, Observation, Implication, Consideration.
 */
export const DomainInsightBlock = ({
  domainKey,
  domainName,
  score,
  variant = "screen",
}: DomainInsightBlockProps) => {
  const { tier, insight } = getStructuredInsight(domainKey, score);
  const band = getScoreBand(score);
  const tierLabel = getTierLabel(tier);

  const rows: Array<{ label: string; body: string }> = [
    { label: "Current View", body: insight.currentView },
    { label: "Observation", body: insight.observation },
    { label: "Implication", body: insight.implication },
    { label: "Consideration", body: insight.consideration },
  ];

  if (variant === "print") {
    return (
      <div
        className="mt-3 border-l-2 pl-4 space-y-2 page-break-inside-avoid"
        style={{ borderColor: band?.color ?? "hsl(var(--border))" }}
      >
        <div className="flex items-center gap-2 text-[10pt] font-semibold text-primary">
          <span>Advisory Lens</span>
          <span className="text-muted-foreground font-normal">· {tierLabel}</span>
        </div>
        {rows.map((row) => (
          <div key={row.label} className="text-[10pt] leading-relaxed">
            <span className="font-semibold text-foreground">{row.label}: </span>
            <span className="text-muted-foreground">{row.body}</span>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div
      className="mt-4 rounded-lg border bg-muted/30 p-4 space-y-3"
      style={{ borderLeftColor: band?.color ?? "hsl(var(--border))", borderLeftWidth: 3 }}
      aria-label={`Structured insight for ${domainName}`}
    >
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h4 className="text-sm font-heading font-semibold text-foreground">
          Advisory Lens
        </h4>
        <span
          className="text-[11px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full"
          style={{
            backgroundColor: (band?.color ?? "#95A5A6") + "22",
            color: band?.color ?? "hsl(var(--muted-foreground))",
          }}
        >
          {tierLabel}
        </span>
      </div>
      <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
        {rows.map((row) => (
          <div key={row.label}>
            <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1">
              {row.label}
            </dt>
            <dd className="text-sm text-foreground leading-relaxed">{row.body}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
};

export default DomainInsightBlock;
