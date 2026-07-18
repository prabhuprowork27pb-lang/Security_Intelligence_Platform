import { supabase } from "@/integrations/supabase/client";

export interface PricingConfig {
  assessment_price_inr: number;
  currency: string;
}

const DEFAULT_PRICING: PricingConfig = {
  assessment_price_inr: 4999,
  currency: "INR",
};

export async function fetchPricing(): Promise<PricingConfig> {
  const { data, error } = await supabase
    .from("app_settings" as any)
    .select("value")
    .eq("key", "pricing")
    .maybeSingle();
  if (error || !data) return DEFAULT_PRICING;
  const value = (data as any).value as Partial<PricingConfig> | null;
  return { ...DEFAULT_PRICING, ...(value ?? {}) };
}

export async function updatePricing(next: PricingConfig): Promise<void> {
  const { error } = await supabase
    .from("app_settings" as any)
    .upsert({ key: "pricing", value: next as any, updated_at: new Date().toISOString() }, { onConflict: "key" });
  if (error) throw error;
}

export function formatINR(amount: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(amount);
}
