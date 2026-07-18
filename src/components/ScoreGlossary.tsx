import { Card } from "@/components/ui/card";
import { SAASS_SCORE_BANDS } from "@/lib/scoring";

const MATURITY_LEVELS: Array<{ level: number; label: string; description: string; color: string }> = [
  { level: 1, label: "Ad Hoc", description: "Practiced informally; reactive; no consistent approach.", color: "#E74C3C" },
  { level: 2, label: "Developing", description: "Basic procedures exist but applied inconsistently.", color: "#F5B041" },
  { level: 3, label: "Defined", description: "Documented and standardised across the site.", color: "#F1C40F" },
  { level: 4, label: "Managed", description: "Measured and consistently applied with named owners.", color: "#1877F2" },
  { level: 5, label: "Resilient", description: "Continuously improved and integrated with operations.", color: "#2ECC71" },
];

interface ScoreGlossaryProps {
  variant?: "screen" | "print";
}

/**
 * Glossary explaining the 0–4 maturity scale and how aggregated 0–100 domain
 * scores translate into the SIP score bands. Used both on the Assessment
 * Results page and inside the PDF report for consistent interpretation.
 */
export const ScoreGlossary = ({ variant = "screen" }: ScoreGlossaryProps) => {
  const isPrint = variant === "print";

  const Wrapper = ({ children }: { children: React.ReactNode }) =>
    isPrint ? (
      <div className="space-y-6 page-break-inside-avoid">{children}</div>
    ) : (
      <Card className="p-6 md:p-8 space-y-6">{children}</Card>
    );

  return (
    <Wrapper>
      <div>
        <h2 className={isPrint ? "text-2xl font-heading font-bold text-primary mb-2" : "text-2xl font-heading font-bold mb-2"}>
          Glossary &amp; How to Read This Report
        </h2>
        <p className="text-sm text-muted-foreground leading-relaxed">
          Each question is rated on a 1–5 maturity scale. Ratings are aggregated within each
          domain and normalised to a 0–100 score, which then maps to one of four operational
          bands. Use this section to interpret domain scores and the overall posture
          consistently.
        </p>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-base mb-3 text-foreground">
          Maturity Scale (per question, 1–5)
        </h3>
        <div className={isPrint ? "grid grid-cols-5 gap-2" : "grid grid-cols-2 sm:grid-cols-5 gap-2"}>
          {MATURITY_LEVELS.map((m) => (
            <div
              key={m.level}
              className="rounded-lg p-3 text-center border"
              style={{ backgroundColor: m.color + "12", borderColor: m.color + "33" }}
            >
              <div className="font-mono font-bold text-2xl" style={{ color: m.color }}>
                {m.level}
              </div>
              <div className="text-xs font-semibold mt-1 text-foreground">{m.label}</div>
              <div className="text-[11px] text-muted-foreground mt-1 leading-snug">
                {m.description}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div>
        <h3 className="font-heading font-semibold text-base mb-3 text-foreground">
          Score Bands (aggregated, 0–100)
        </h3>
        <div className="space-y-2">
          {SAASS_SCORE_BANDS.map((band) => (
            <div
              key={band.id}
              className="flex items-start gap-3 rounded-lg border p-3"
              style={{ borderLeftColor: band.color, borderLeftWidth: 4 }}
            >
              <div
                className="px-2.5 py-1 rounded-md text-xs font-bold tracking-wide shrink-0"
                style={{ backgroundColor: band.color, color: band.textColor }}
              >
                {band.label}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-foreground">
                  {band.min}–{band.max}
                </div>
                <div className="text-xs text-muted-foreground leading-relaxed">
                  {band.description}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="text-xs text-muted-foreground leading-relaxed border-t pt-4">
        <p className="mb-1">
          <span className="font-semibold text-foreground">How to read a domain score: </span>
          Compare the band (qualitative posture) with the numeric score (relative
          performance). Domains in the lower bands warrant prioritised remediation; higher
          bands indicate areas to sustain and optimise.
        </p>
        <p className="italic">
          Reviewed. Structured. Operationally grounded.
        </p>
      </div>
    </Wrapper>
  );
};

export default ScoreGlossary;
