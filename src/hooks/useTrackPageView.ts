import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

export const useTrackPageView = () => {
  const location = useLocation();
  const { user } = useAuth();

  useEffect(() => {
    const path = `${location.pathname}${location.search}`;
    void supabase.from("analytics_events" as any).insert({
      user_id: user?.id ?? null,
      event: "page_view",
      path,
      meta: {
        title: document.title,
      },
    } as any);
  }, [location.pathname, location.search, user?.id]);
};
