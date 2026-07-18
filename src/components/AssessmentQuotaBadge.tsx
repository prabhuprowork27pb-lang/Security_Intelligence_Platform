import { Card, CardContent } from "@/components/ui/card";
import { Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { useAssessmentQuota } from "@/hooks/useAssessmentQuota";

/**
 * Lightweight transparency strip showing the user's complimentary
 * Security Selfie™ usage. Hidden for admins, beta testers, and when the
 * Free Launch Mode flag is off.
 */
const AssessmentQuotaBadge = () => {
  const { used, limit, exempt, loading } = useAssessmentQuota();

  if (exempt || loading) return null;
  const atLimit = used >= limit;

  return (
    <Card className="border border-border/60 bg-card/60">
      <CardContent className="flex flex-col gap-1 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-secondary" />
          <p className="text-[11px] uppercase tracking-[0.22em] text-muted-foreground font-semibold">
            Security Selfie™
          </p>
        </div>
        <p className="text-sm text-foreground">
          <span className="font-semibold tabular-nums">{used}</span> of{" "}
          <span className="font-semibold tabular-nums">{limit}</span>{" "}
          complimentary assessments completed.
          {atLimit && (
            <>
              {" "}
              <Link to="/studio" className="text-secondary underline underline-offset-4 hover:text-secondary/80">
                Explore Security Studio™ for ongoing advisory engagements.
              </Link>
            </>
          )}
        </p>
      </CardContent>
    </Card>
  );
};

export default AssessmentQuotaBadge;
