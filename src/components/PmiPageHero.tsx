import { ReactNode } from "react";
import { BetaPill } from "@/components/BetaPill";

interface PmiPageHeroProps {
  eyebrow?: string;
  /** Solid cream first line of the headline. */
  headlineSolid: string;
  /** Vibrant-gradient second line of the headline. */
  headlineGradient?: string;
  /** Lede paragraph under the headline. */
  lede?: ReactNode;
  /** Optional CTA cluster. */
  actions?: ReactNode;
  /** Show the "Invite-only preview" beta pill above eyebrow. Default true. */
  showBeta?: boolean;
  /** Tag below the headline (small uppercase). */
  metaTag?: string;
  /** Visual density. Default "md". */
  size?: "sm" | "md" | "lg";
}

/**
 * Unified PMI-inspired dark-indigo hero band used across all public marketing
 * pages so the platform feels coherent. Mirrors the Landing hero's rhythm:
 * radial vignette → eyebrow → solid+gradient H1 → lede → actions.
 */
export const PmiPageHero = ({
  eyebrow,
  headlineSolid,
  headlineGradient,
  lede,
  actions,
  showBeta = true,
  metaTag,
  size = "md",
}: PmiPageHeroProps) => {
  const padY =
    size === "lg" ? "py-20 lg:py-28" : size === "sm" ? "py-14 lg:py-20" : "py-16 lg:py-24";
  const h1Size =
    size === "lg"
      ? "text-[40px] sm:text-[52px] md:text-[64px] lg:text-[80px]"
      : "text-[34px] sm:text-[44px] md:text-[56px] lg:text-[68px]";

  return (
    <section className="relative overflow-hidden bg-primary text-primary-foreground">
      {/* Indigo → violet base */}
      <div className="absolute inset-0 bg-gradient-hero pointer-events-none" />
      {/* Angular light beam */}
      <div
        className="absolute -top-24 -right-32 h-[110vh] w-[70vw] pointer-events-none opacity-80"
        style={{
          background: "var(--gradient-beam)",
          clipPath: "polygon(60% 0, 100% 0, 100% 100%, 30% 100%)",
          filter: "blur(2px)",
        }}
      />
      {/* Subtle grid */}
      <div
        className="absolute inset-0 opacity-[0.04] pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(hsl(var(--primary-foreground)) 1px, transparent 1px), linear-gradient(90deg, hsl(var(--primary-foreground)) 1px, transparent 1px)",
          backgroundSize: "56px 56px",
        }}
      />
      {/* Radial vignette for type pop */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            "radial-gradient(ellipse 65% 55% at 50% 45%, hsl(261 78% 6% / 0.65) 0%, transparent 72%)",
        }}
      />

      <div className={`container mx-auto px-6 ${padY} relative z-10`}>
        <div className="max-w-4xl mx-auto text-center">
          {showBeta && (
            <div className="mb-6 animate-fade-in">
              <BetaPill variant="dark" />
            </div>
          )}

          {eyebrow && (
            <p className="text-[11px] uppercase tracking-[0.32em] font-semibold mb-5 animate-fade-in" style={{ color: "hsl(195 100% 72%)" }}>
              {eyebrow}
            </p>
          )}

          <h1 className="font-heading font-bold tracking-tight leading-[0.98] animate-fade-in [text-wrap:balance]">
            <span className={`hero-headline-solid block ${h1Size} tracking-[-0.025em]`}>
              {headlineSolid}
            </span>
            {headlineGradient && (
              <span className={`hero-headline-gradient block ${h1Size} tracking-[-0.025em]`}>
                {headlineGradient}
              </span>
            )}
          </h1>

          {metaTag && (
            <p className="mt-5 text-[11px] uppercase tracking-[0.4em] font-semibold" style={{ color: "hsl(78 85% 65%)" }}>
              {metaTag}
            </p>
          )}

          {lede && (
            <p className="mt-7 text-base md:text-lg text-white/90 max-w-2xl mx-auto leading-relaxed [text-wrap:balance]">
              {lede}
            </p>
          )}

          {actions && <div className="mt-9 flex flex-col sm:flex-row items-stretch sm:items-center justify-center gap-3">{actions}</div>}
        </div>
      </div>
    </section>
  );
};

export default PmiPageHero;
