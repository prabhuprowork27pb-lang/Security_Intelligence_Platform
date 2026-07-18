import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export type AnalyticsRange = "7d" | "30d" | "90d" | "all";

export interface AdminKpis {
  from: string;
  to: string;
  operational: {
    assessments_total: number;
    drafts_started: number;
    submitted: number;
    report_ready: number;
    abandoned: number;
    active_accounts: number;
    ai_calls: number;
  };
  financial: {
    revenue_inr: number;
    paid_count: number;
    failed_count: number;
    avg_sale_price: number;
    outstanding_assessments: number;
  };
  leads: {
    total: number;
    new: number;
    contacted: number;
    qualified: number;
    won: number;
    lost: number;
    stale: number;
  };
  engagement: {
    page_views: number;
    unique_visitors: number;
    pdf_exports: number;
    smarty_pins: number;
  };
  quality: {
    average_score: number | null;
    red: number;
    amber: number;
    green: number;
    responses: number;
  };
}

const rangeToDates = (range: AnalyticsRange) => {
  const to = new Date();
  const from = new Date(to);
  if (range === "all") {
    from.setFullYear(2020, 0, 1);
  } else {
    from.setDate(to.getDate() - Number(range.replace("d", "")));
  }
  return { from: from.toISOString(), to: to.toISOString() };
};

export const useAdminAnalytics = (range: AnalyticsRange) => {
  const [data, setData] = useState<AdminKpis | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const dates = useMemo(() => rangeToDates(range), [range]);

  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoading(true);
      setError(null);
      const { data: result, error: rpcError } = await (supabase as any).rpc("admin_platform_kpis", {
        _from: dates.from,
        _to: dates.to,
      });
      if (cancelled) return;
      if (rpcError) {
        setError(rpcError.message);
        setData(null);
      } else {
        setData(result as AdminKpis);
      }
      setLoading(false);
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [dates.from, dates.to]);

  return { data, loading, error };
};
