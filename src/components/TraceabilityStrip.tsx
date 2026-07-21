import { Fragment } from "react";
import { Link } from "react-router-dom";
import { HelpCircle, Percent, BookOpen, ArrowRight } from "lucide-react";

/**
 * Public-facing "No black-box AI" trust strip.
 * States the traceability promise: every score and recommendation maps
 * from a question the user answered through a published weight to a
 * recognised standard. Reused on /founder and /trust.
 */
export const TraceabilityStrip = () => {
  const steps = [
    {
      icon: HelpCircle,
      label: "Question",
      body: "Your 1–5 maturity rating on a specific control.",
    },
    {
      icon: Percent,
      label: "Weighted score",
      body: "Domain weights are published, not hidden.",
    },
    {
      icon: BookOpen,
      label: "Standard",
      body: "ISO 18788 · ISO 22301 · ISO 31000 · PSARA.",
    },
  ];

  return (
    <section className="container mx-auto px-5 md:px-6 py-12 md:py-16 max-w-5xl">
      <div className="rounded-2xl border border-border/60 bg-muted/30 p-6 md:p-10">
        <p className="text-[11px] uppercase tracking-[0.22em] text-secondary font-semibold mb-3">
          No black-box AI
        </p>
        <h2 className="font-heading text-2xl md:text-3xl font-bold tracking-tight leading-tight mb-3 max-w-3xl">
          Every score traces back to a question and a standard.
        </h2>
        <p className="text-sm md:text-base text-muted-foreground leading-relaxed max-w-3xl mb-8">
          No hidden models. No mystery math. You can follow any recommendation
          from the answer that produced it to the standard it maps to.
        </p>

        <div className="grid md:grid-cols-[1fr_auto_1fr_auto_1fr] gap-5 md:gap-3 items-start">
          {steps.map((s, i) => (
            <Fragment key={s.label}>
              <div className="flex flex-col gap-2">
                <div className="inline-flex items-center gap-2 text-secondary">
                  <s.icon className="h-4 w-4" />
                  <span className="text-[11px] uppercase tracking-[0.18em] font-semibold">
                    {s.label}
                  </span>
                </div>
                <p className="text-sm text-foreground/90 leading-snug">
                  {s.body}
                </p>
              </div>
              {i < steps.length - 1 && (
                <ArrowRight
                  className="hidden md:block h-4 w-4 text-muted-foreground/60 mt-1 self-start"
                  aria-hidden
                />
              )}
            </Fragment>
          ))}
        </div>

        <div className="mt-8 pt-6 border-t border-border/40">
          <Link
            to="/trust#standards"
            className="inline-flex items-center gap-1.5 text-sm font-medium text-secondary hover:text-secondary/80 transition-colors"
          >
            See the standards we map to
            <ArrowRight className="h-3.5 w-3.5" />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default TraceabilityStrip;
