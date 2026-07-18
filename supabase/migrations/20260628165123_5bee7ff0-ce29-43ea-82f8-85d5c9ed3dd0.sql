
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS validated_report_status text NOT NULL DEFAULT 'pending',
  ADD COLUMN IF NOT EXISTS validated_report_ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS validated_report_generated_by text,
  ADD COLUMN IF NOT EXISTS validated_reviewer_name text DEFAULT 'SIP™ Advisory Team',
  ADD COLUMN IF NOT EXISTS validated_report_payload jsonb,
  ADD COLUMN IF NOT EXISTS validated_report_error text,
  ADD COLUMN IF NOT EXISTS validated_share_expires_at timestamptz;

COMMENT ON COLUMN public.assessments.validated_report_status IS 'pending | generating | ready | failed';
COMMENT ON COLUMN public.assessments.validated_report_generated_by IS 'admin | auto | auto_escalated';

-- Index for the auto-release cron sweep
CREATE INDEX IF NOT EXISTS idx_assessments_validated_pending
  ON public.assessments (validated_report_status, report_ready_at)
  WHERE validated_report_status = 'pending';

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA extensions;
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Auto-release cron: every 15 minutes, ping the edge function which scans
-- and processes assessments where the Quick Report is older than 23h and
-- the Validated Report is still pending.
DO $$
DECLARE
  job_id bigint;
BEGIN
  SELECT jobid INTO job_id FROM cron.job WHERE jobname = 'validated-report-auto-release-15m';
  IF job_id IS NOT NULL THEN
    PERFORM cron.unschedule(job_id);
  END IF;
END $$;

SELECT cron.schedule(
  'validated-report-auto-release-15m',
  '*/15 * * * *',
  $$
  SELECT net.http_post(
    url := 'https://kosbznmprojyaqeldlrl.supabase.co/functions/v1/generate-validated-report',
    headers := jsonb_build_object(
      'Content-Type','application/json',
      'Authorization', 'Bearer ' || current_setting('app.cron_secret', true)
    ),
    body := jsonb_build_object('mode','sweep')
  );
  $$
);
