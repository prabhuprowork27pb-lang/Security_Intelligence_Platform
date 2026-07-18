import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { FREE_LAUNCH_MODE } from "@/config/launchMode";

interface Props {
  children: React.ReactNode;
}

/**
 * Restricts the Command Centre / authenticated workspace to:
 *  - admin users
 *  - users with at least one succeeded payment (paid Security Selfie™ /
 *    Security Studio™ engagement)
 *
 * Other authenticated users are redirected to the public homepage.
 */
const CommandCentreRoute: React.FC<Props> = ({ children }) => {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);

  useEffect(() => {
    let cancelled = false;
    let timeoutId: ReturnType<typeof setTimeout> | null = null;

    const check = async () => {
      if (!user) {
        if (!cancelled) setHasPaid(false);
        return;
      }
      // Free Launch Mode: any authenticated user can enter the Command Centre.
      if (FREE_LAUNCH_MODE || isAdmin) {
        if (!cancelled) setHasPaid(true);
        return;
      }
      // Safety timeout — never hang indefinitely on a slow/failing payments query.
      timeoutId = setTimeout(() => {
        if (cancelled) return;
        setHasPaid((prev) => {
          if (prev !== null) return prev;
          toast({
            title: "Could not verify access",
            description: "We couldn't confirm your unlock. Please complete checkout to continue.",
            variant: "destructive",
          });
          return false;
        });
      }, 5000);

      try {
        const { count, error } = await supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "succeeded");
        if (error) throw error;
        if (!cancelled) setHasPaid((count ?? 0) > 0);
      } catch (err) {
        console.error("[SIP] CommandCentreRoute payment check failed:", err);
        if (!cancelled) setHasPaid(false);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    };

    if (!authLoading && !roleLoading) check();
    return () => {
      cancelled = true;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [user, isAdmin, authLoading, roleLoading, toast]);

  if (authLoading || roleLoading || hasPaid === null) {
    return (
      <div className="min-h-dvh flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth" replace />;
  if (!isAdmin && !hasPaid) return <Navigate to="/unlock" replace />;

  return <>{children}</>;
};

export default CommandCentreRoute;
