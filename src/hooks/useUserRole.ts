import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export type AppRole = "admin" | "client" | "beta_tester" | "guest";

interface UseUserRoleResult {
  roles: AppRole[];
  isAdmin: boolean;
  isClient: boolean;
  isBetaTester: boolean;
  loading: boolean;
}

/**
 * Loads the current user's roles from public.user_roles via RLS.
 * Guests (unauthenticated) get an empty role array.
 */
export const useUserRole = (): UseUserRoleResult => {
  const { user, loading: authLoading } = useAuth();
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const lastLoadedUserId = useRef<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      if (authLoading) return;
      if (!user) {
        if (!cancelled) {
          lastLoadedUserId.current = null;
          setRoles([]);
          setLoading(false);
        }
        return;
      }
      // Skip refetch if we already loaded roles for this same user
      if (lastLoadedUserId.current === user.id) {
        if (!cancelled) setLoading(false);
        return;
      }
      const { data, error } = await supabase
        .from("user_roles" as any)
        .select("role")
        .eq("user_id", user.id);

      if (cancelled) return;
      if (error) {
        // PGRST116 = no rows; everything else is a genuine failure we should
        // surface as a warning while still releasing the loading state so the
        // app does not hang on a transient DB error.
        if ((error as any).code !== "PGRST116") {
          console.warn("[SIP] useUserRole:", error);
        }
      } else {
        setRoles(((data ?? []) as any[]).map((r) => r.role as AppRole));
        lastLoadedUserId.current = user.id;
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, authLoading]);

  return {
    roles,
    isAdmin: roles.includes("admin"),
    isClient: roles.includes("client") || roles.includes("admin"),
    isBetaTester: roles.includes("beta_tester"),
    loading: loading || authLoading,
  };
};
