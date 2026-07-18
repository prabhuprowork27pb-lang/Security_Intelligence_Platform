import { useEffect, useState, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";

export interface Profile {
  user_id: string;
  full_name: string;
  email: string;
  mobile: string | null;
  company: string | null;
  designation: string | null;
  verified_at: string | null;
  company_locked_at?: string | null;
  designation_locked_at?: string | null;
}

/**
 * Loads the current user's profile row. If no row exists, creates one
 * seeded from auth metadata / pending lead capture. Once verified_at is
 * set, full_name and email are locked at the database layer.
 */
export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!user) {
      setProfile(null);
      setLoading(false);
      return;
    }
    setLoading(true);

    const { data: existing } = await supabase
      .from("profiles" as any)
      .select("*")
      .eq("user_id", user.id)
      .maybeSingle();

    let row = existing as unknown as Profile | null;

    if (!row) {
      // Seed from auth metadata + pending lead-capture stash if present.
      let pending: Partial<Profile> = {};
      try {
        const { data: stash } = await supabase
          .from("app_settings" as any)
          .select("value")
          .eq("key", `pending_profile:${(user.email ?? "").toLowerCase()}`)
          .maybeSingle();
        const v = (stash as any)?.value ?? {};
        pending = {
          full_name: v.full_name,
          mobile: v.mobile,
          company: v.company,
          designation: v.designation,
        };
      } catch {/* non-fatal */}

      const meta = (user.user_metadata as any) ?? {};
      const seed = {
        user_id: user.id,
        email: (user.email ?? "").toLowerCase(),
        full_name: pending.full_name || meta.full_name || meta.name || (user.email?.split("@")[0] ?? "User"),
        mobile: pending.mobile ?? null,
        company: pending.company ?? null,
        designation: pending.designation ?? null,
        verified_at: new Date().toISOString(),
      };
      const { data: inserted } = await supabase
        .from("profiles" as any)
        .upsert(seed as any, { onConflict: "user_id" })
        .select("*")
        .single();
      row = inserted as unknown as Profile;
    } else if (!row.verified_at) {
      // First sign-in after profile auto-created by trigger → mark verified now.
      const { data: updated } = await supabase
        .from("profiles" as any)
        .update({ verified_at: new Date().toISOString() } as any)
        .eq("user_id", user.id)
        .select("*")
        .single();
      row = (updated as unknown as Profile) ?? row;
    }

    setProfile(row);
    setLoading(false);
  }, [user]);

  useEffect(() => { refresh(); }, [refresh]);

  return { profile, loading, refresh };
};
