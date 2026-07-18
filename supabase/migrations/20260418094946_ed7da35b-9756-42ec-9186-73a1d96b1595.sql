-- Add review workflow status to assessments
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS review_status text NOT NULL DEFAULT 'pending_review',
  ADD COLUMN IF NOT EXISTS submitted_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_ready_at timestamptz,
  ADD COLUMN IF NOT EXISTS reviewed_by_name text,
  ADD COLUMN IF NOT EXISTS reviewed_by_role text;

-- Backfill: any assessment that already has scores is treated as a delivered/ready report
UPDATE public.assessments
SET review_status = 'report_ready',
    submitted_at = COALESCE(submitted_at, created_at),
    report_ready_at = COALESCE(report_ready_at, created_at)
WHERE overall_score_0_100 IS NOT NULL
  AND review_status = 'pending_review';