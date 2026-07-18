import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { ShieldCheck } from "lucide-react";

interface ReportOwnershipBannerProps {
  siteName?: string;
  assessmentDate?: string | null;
}

/**
 * Slim ownership/personalisation strip shown above reports & dashboards
 * to reinforce that the content is tied to a specific user + site.
 */
export const ReportOwnershipBanner = ({
  siteName,
  assessmentDate,
}: ReportOwnershipBannerProps) => {
  const { user } = useAuth();

  const userName = useMemo(() => {
    const meta = (user?.user_metadata ?? {}) as Record<string, any>;
    return (
      meta.full_name ||
      meta.name ||
      (user?.email ? user.email.split("@")[0] : "Authenticated user")
    );
  }, [user]);

  const date = assessmentDate
    ? new Date(assessmentDate).toLocaleDateString()
    : new Date().toLocaleDateString();

  return (
    <div className="mb-4 flex flex-wrap items-center gap-x-4 gap-y-1 rounded-md border border-border/60 bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
      <div className="flex items-center gap-1.5 font-medium text-foreground">
        <ShieldCheck className="h-3.5 w-3.5 text-primary" />
        <span>Confidential</span>
      </div>
      <span>
        Prepared for <span className="font-medium text-foreground">{userName}</span>
        {user?.email ? <span className="ml-1 opacity-70">({user.email})</span> : null}
      </span>
      {siteName && (
        <span>
          Site: <span className="font-medium text-foreground">{siteName}</span>
        </span>
      )}
      <span className="ml-auto font-mono">{date}</span>
    </div>
  );
};

export default ReportOwnershipBanner;
