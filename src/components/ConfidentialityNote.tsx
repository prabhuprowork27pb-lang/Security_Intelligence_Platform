import { ShieldCheck, Lock } from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfidentialityNoteProps {
  variant?: "default" | "payment" | "upload" | "report";
  className?: string;
}

const COPY = {
  default: "Your operational data remains confidential and protected.",
  payment: "All payment transactions are processed through secure encrypted gateways.",
  upload: "All submitted operational information is treated as confidential.",
  report: "Reports are generated within controlled access environments.",
} as const;

/**
 * Subtle, enterprise-grade trust note. Use sparingly near forms,
 * payment surfaces, uploads, and report views.
 */
export const ConfidentialityNote = ({ variant = "default", className }: ConfidentialityNoteProps) => {
  const Icon = variant === "payment" ? Lock : ShieldCheck;
  return (
    <div
      className={cn(
        "flex items-start gap-2 text-[11px] leading-relaxed text-muted-foreground/90 rounded-md border border-border/50 bg-muted/20 px-3 py-2",
        className,
      )}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 mt-0.5 text-secondary/80" />
      <span>{COPY[variant]}</span>
    </div>
  );
};

export default ConfidentialityNote;
