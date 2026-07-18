import { Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface SmartyInsightProps {
  title?: string;
  body: string;
  className?: string;
}

/**
 * Compact, advisory-tone intelligence card. Used contextually inside the
 * Operational Intelligence Cockpit and report surfaces. Not a chatbot —
 * a subtle SMARTY signal injected into the operational narrative.
 */
export const SmartyInsight = ({
  title = "SMARTY Insight",
  body,
  className,
}: SmartyInsightProps) => {
  return (
    <div
      className={cn(
        "rounded-xl border border-secondary/25 bg-gradient-to-br from-card via-card to-secondary/[0.04] p-4 md:p-5",
        className,
      )}
    >
      <div className="flex items-center gap-2 mb-2">
        <span className="inline-flex h-6 w-6 items-center justify-center rounded-md bg-secondary/15 text-secondary">
          <Sparkles className="h-3.5 w-3.5" />
        </span>
        <p className="text-[10px] uppercase tracking-[0.22em] text-secondary font-semibold">
          {title}
        </p>
      </div>
      <p className="text-sm leading-relaxed text-foreground/90">{body}</p>
    </div>
  );
};

export default SmartyInsight;
