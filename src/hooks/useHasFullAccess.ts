import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { FREE_LAUNCH_MODE } from "@/config/launchMode";


/**
 * Returns whether the current user has access to full ("paid") intelligence.
 * True for admins and for any user with at least one succeeded payment.
 */
export function useHasFullAccess() {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isBetaTester, loading: roleLoading } = useUserRole();
  const [hasPaid, setHasPaid] = useState<boolean | null>(null);
  const cachedUserId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!user) {
        cachedUserId.current = null;
        if (!cancelled) setHasPaid(false);
        return;
      }
      // Free Launch Mode: every authenticated user has full access. Payment
      // infrastructure stays intact but the gate is bypassed.
      if (FREE_LAUNCH_MODE || isAdmin || isBetaTester) {
        cachedUserId.current = user.id;
        if (!cancelled) setHasPaid(true);
        return;
      }
      // Skip DB hit if we already resolved this user.
      if (cachedUserId.current === user.id && hasPaid !== null) return;
      try {
        const { count, error } = await supabase
          .from("payments")
          .select("id", { count: "exact", head: true })
          .eq("user_id", user.id)
          .eq("status", "succeeded");
        if (error) throw error;
        if (!cancelled) {
          cachedUserId.current = user.id;
          setHasPaid((count ?? 0) > 0);
        }
      } catch (err) {
        // On network/query error, do NOT downgrade access — leave loading state
        // so a paying user is never incorrectly blocked.
        console.error("useHasFullAccess: payment check failed:", err);
      }
    };
    if (!authLoading && !roleLoading) check();
    return () => {
      cancelled = true;
    };
  }, [user, isAdmin, isBetaTester, authLoading, roleLoading, hasPaid]);

  const loading =
    authLoading || roleLoading || (Boolean(user) && hasPaid === null);

  return {
    loading,
    isAuthenticated: Boolean(user),
    isAdmin,
    isBetaTester,
    hasFullAccess: isAdmin || isBetaTester || hasPaid === true,
  };
}
