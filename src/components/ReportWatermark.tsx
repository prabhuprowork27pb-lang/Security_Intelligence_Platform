import { cn } from "@/lib/utils";

interface ReportWatermarkProps {
  /** Primary mark — typically "Security Intelligence Platform™" */
  primary?: string;
  /** Secondary line — typically the report kind */
  secondary?: string;
  /** Compliance/legal line — e.g. "For Demonstration Purposes Only" */
  tertiary?: string;
  /** When true, watermark is visible on screen as well as in print */
  alwaysVisible?: boolean;
  /** Opacity override (0–1). Defaults to subtle. */
  opacity?: number;
  className?: string;
}

/**
 * Elegant diagonal watermarking layered over sample and exported reports.
 * Repeats the platform mark across the page at -30° with low opacity so the
 * underlying intelligence remains legible while clearly signalling provenance.
 *
 * Use `alwaysVisible` for on-screen sample reports; default behaviour shows
 * only on print/PDF export.
 */
export const ReportWatermark = ({
  primary = "Security Intelligence Platform™",
  secondary = "Sample Intelligence Report",
  tertiary = "For Demonstration Purposes Only",
  alwaysVisible = false,
  opacity,
  className,
}: ReportWatermarkProps) => {
  const screenOpacity = opacity ?? 0.05;
  const printOpacity = opacity ?? 0.07;

  // Build a repeating diagonal grid of brand tiles.
  const rows = 6;
  const cols = 3;

  return (
    <div
      className={cn(
        "pointer-events-none fixed inset-0 z-0 overflow-hidden select-none",
        alwaysVisible ? "" : "hidden print:block",
        className,
      )}
      aria-hidden
    >
      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{
          transform: "rotate(-30deg) scale(1.4)",
          transformOrigin: "center center",
        }}
      >
        {Array.from({ length: rows }).map((_, r) => (
          <div
            key={r}
            className="flex w-full items-center justify-center gap-24"
            style={{ marginBlock: "44px" }}
          >
            {Array.from({ length: cols }).map((_, c) => (
              <div
                key={c}
                className="text-center whitespace-nowrap font-heading"
                style={{
                  opacity: alwaysVisible ? screenOpacity : printOpacity,
                  color: "hsl(var(--foreground))",
                }}
              >
                <div
                  style={{
                    fontWeight: 800,
                    fontSize: 32,
                    letterSpacing: "0.14em",
                    textTransform: "uppercase",
                    lineHeight: 1.1,
                  }}
                >
                  {primary}
                </div>
                {secondary && (
                  <div
                    style={{
                      fontWeight: 600,
                      fontSize: 14,
                      letterSpacing: "0.32em",
                      textTransform: "uppercase",
                      marginTop: 6,
                    }}
                  >
                    {secondary}
                  </div>
                )}
                {tertiary && (
                  <div
                    style={{
                      fontWeight: 500,
                      fontSize: 11,
                      letterSpacing: "0.4em",
                      textTransform: "uppercase",
                      marginTop: 4,
                      opacity: 0.7,
                    }}
                  >
                    {tertiary}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
};

export default ReportWatermark;
