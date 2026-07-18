import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useUserRole } from "@/hooks/useUserRole";
import { supabase } from "@/integrations/supabase/client";
import { FREE_ASSESSMENT_LIMIT, FREE_LAUNCH_MODE } from "@/config/launchMode";

export interface AssessmentQuota {
  used: number;
  limit: number;
  remaining: number;
  atLimit: boolean;
  loading: boolean;
  /** Admins and beta testers are exempt from the cap. */
  exempt: boolean;
  refresh: () => Promise<void>;
}

/**
 * Counts the current user's completed (submitted) assessments and exposes
 * the remaining complimentary quota during Free Launch Mode.
 *
 * Drafts do not count. Admins and beta testers are exempt.
 */
export function useAssessmentQuota(): AssessmentQuota {
  const { user, loading: authLoading } = useAuth();
  const { isAdmin, isBetaTester, loading: roleLoading } = useUserRole();
  const [used, setUsed] = useState(0);
  const [loading, setLoading] = useState(true);

  const exempt = isAdmin || isBetaTester || !FREE_LAUNCH_MODE;

  const fetchCount = useCallback(async () => {
    if (!user?.id) {
      setUsed(0);
      setLoading(false);
      return;
    }
    if (exempt) {
      setUsed(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const { count, error } = await supabase
        .from("assessments")
        .select("id", { count: "exact", head: true })
        .eq("user_id", user.id)
        .eq("status", "submitted");
      if (error) throw error;
      setUsed(count ?? 0);
    } catch (err) {
      console.error("[SIP] useAssessmentQuota: count failed:", err);
    } finally {
      setLoading(false);
    }
  }, [user?.id, exempt]);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    fetchCount();
  }, [authLoading, roleLoading, fetchCount]);

  const remaining = Math.max(0, FREE_ASSESSMENT_LIMIT - used);
  return {
    used,
    limit: FREE_ASSESSMENT_LIMIT,
    remaining,
    atLimit: !exempt && used >= FREE_ASSESSMENT_LIMIT,
    loading: authLoading || roleLoading || loading,
    exempt,
    refresh: fetchCount,
  };
}
