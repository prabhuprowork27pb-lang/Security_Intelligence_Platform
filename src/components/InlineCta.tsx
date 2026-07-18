import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowRight, Eye, ShieldCheck, Sparkles } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface InlineCtaProps {
  variant?: "default" | "compact" | "premium";
  eyebrow?: string;
  title?: string;
  body?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  hideSecondary?: boolean;
}

/**
 * Reusable inline CTA section for embedding across every platform page.
 * The platform IS the landing page — every surface should convert.
 */
export const InlineCta = ({
  variant = "default",
  eyebrow = "Ready to see your own posture?",
  title = "Run your Intelligence Diagnostic in under thirty minutes.",
  body = "Receive a board-ready report — validated by our specialist review panel before release. Free during the beta preview.",
  primaryLabel,
  secondaryLabel = "View sample reports",
  hideSecondary = false,
}: InlineCtaProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const primary = primaryLabel ?? (user ? "Open my dashboard" : "Take a Security Selfie™");

  if (variant === "compact") {
    return (
      <div className="rounded-2xl border border-primary/20 bg-gradient-to-r from-primary/5 via-background to-secondary/5 px-5 py-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-9 w-9 rounded-lg bg-primary/10 text-primary flex items-center justify-center">
            <Sparkles className="h-4 w-4" />
          </div>
          <div className="text-sm">
            <p className="font-semibold leading-tight">{title}</p>
            <p className="text-xs text-muted-foreground">{eyebrow}</p>
          </div>
        </div>
        <Button size="sm" onClick={() => navigate(user ? "/dashboard" : "/auth?next=/dashboard")}>
          {primary} <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
        </Button>
      </div>
    );
  }

  return (
    <Card
      className={
        variant === "premium"
          ? "border-primary/30 bg-gradient-to-br from-primary/10 via-background to-secondary/10 shadow-xl"
          : "border-primary/20 bg-gradient-to-br from-primary/5 via-background to-secondary/5"
      }
    >
      <CardContent className="p-8 md:p-10 text-center">
        <div className="inline-flex items-center gap-2 rounded-full bg-primary/10 text-primary px-3 py-1 text-xs font-semibold mb-4">
          <Sparkles className="h-3.5 w-3.5" /> {eyebrow}
        </div>
        <h2 className="font-heading font-bold text-2xl md:text-3xl tracking-tight mb-3">
          {title}
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mb-6 leading-relaxed">{body}</p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <Button size="lg" onClick={() => navigate(user ? "/dashboard" : "/auth?next=/dashboard")}>
            {primary} <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          {!hideSecondary && (
            <Button size="lg" variant="outline" onClick={() => navigate("/sample")}>
              <Eye className="mr-2 h-4 w-4" /> {secondaryLabel}
            </Button>
          )}
        </div>
        <div className="mt-5 flex items-center justify-center gap-1.5 text-xs text-muted-foreground">
          <ShieldCheck className="h-3.5 w-3.5 text-primary" />
          DPDP Act 2023 aligned · Row-level isolation · Watermarked exports
        </div>
      </CardContent>
    </Card>
  );
};

export default InlineCta;
