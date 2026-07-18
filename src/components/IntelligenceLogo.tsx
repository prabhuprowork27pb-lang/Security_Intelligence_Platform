import { cn } from "@/lib/utils";

interface IntelligenceLogoProps {
  className?: string;
  /** Render variant — "mark" is the standalone symbol, "wordmark" pairs it with text */
  size?: number;
}

/**
 * SIP™ — Intelligence Pulse mark.
 * A minimal radar/pulse motif: concentric arcs converging on a luminous core.
 * Inspired by Palantir / Bloomberg / Linear restraint — no shields, no tactical clichés.
 */
export const IntelligenceLogo = ({ className, size = 36 }: IntelligenceLogoProps) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("shrink-0", className)}
      aria-hidden
    >
      <defs>
        <radialGradient id="sipCore" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="hsl(var(--secondary))" stopOpacity="1" />
          <stop offset="60%" stopColor="hsl(var(--secondary))" stopOpacity="0.55" />
          <stop offset="100%" stopColor="hsl(var(--secondary))" stopOpacity="0" />
        </radialGradient>
        <linearGradient id="sipRing" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="currentColor" stopOpacity="0.95" />
          <stop offset="100%" stopColor="currentColor" stopOpacity="0.35" />
        </linearGradient>
      </defs>

      {/* Outer arc — operational reach */}
      <path
        d="M4 20a16 16 0 0 1 32 0"
        stroke="url(#sipRing)"
        strokeWidth="1.4"
        strokeLinecap="round"
        fill="none"
      />
      {/* Inner arc — intelligence layer */}
      <path
        d="M10 20a10 10 0 0 1 20 0"
        stroke="currentColor"
        strokeOpacity="0.7"
        strokeWidth="1.2"
        strokeLinecap="round"
        fill="none"
      />
      {/* Pulse halo */}
      <circle cx="20" cy="20" r="9" fill="url(#sipCore)" />
      {/* Core */}
      <circle cx="20" cy="20" r="2.6" fill="hsl(var(--secondary))" />
      {/* Signal node */}
      <circle cx="32" cy="14" r="1.4" fill="currentColor" opacity="0.85" />
    </svg>
  );
};

export default IntelligenceLogo;
