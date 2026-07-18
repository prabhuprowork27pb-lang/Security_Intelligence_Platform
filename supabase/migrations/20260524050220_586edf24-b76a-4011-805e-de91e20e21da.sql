
-- 1. Remove privilege-escalation vector on payments
DROP POLICY IF EXISTS "Users create own payments" ON public.payments;

-- 2. Restrict app_settings public read to only the 'pricing' key
DROP POLICY IF EXISTS "Anyone can read settings" ON public.app_settings;

CREATE POLICY "Public can read pricing only"
  ON public.app_settings
  FOR SELECT
  TO anon, authenticated
  USING (key = 'pricing');

CREATE POLICY "Admins read all settings"
  ON public.app_settings
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

-- 3. Tighten EXECUTE on admin KPI RPC (function still does its own admin check)
REVOKE EXECUTE ON FUNCTION public.admin_platform_kpis(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_kpis(timestamptz, timestamptz) TO authenticated;
