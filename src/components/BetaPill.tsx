interface BetaPillProps {
  variant?: "dark" | "light";
  className?: string;
  label?: string;
}

/**
 * Small "Invite-only preview" pill used above hero headlines to set
 * founder-safe expectations: we're in private beta, not GA.
 */
export const BetaPill = ({ variant = "dark", className = "", label = "Private · Feedback cohort" }: BetaPillProps) => {
  const base =
    "inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-[10.5px] font-semibold uppercase tracking-[0.2em] backdrop-blur-sm";
  const skin =
    variant === "dark"
      ? "bg-white/10 border border-white/25 text-white"
      : "bg-primary/8 border border-primary/20 text-primary";
  return (
    <span className={`${base} ${skin} ${className}`}>
      <span className="relative flex h-1.5 w-1.5">
        <span className="absolute inline-flex h-full w-full rounded-full bg-accent-coral opacity-75 animate-ping" />
        <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-accent-coral" />
      </span>
      {label}
    </span>
  );
};

export default BetaPill;
