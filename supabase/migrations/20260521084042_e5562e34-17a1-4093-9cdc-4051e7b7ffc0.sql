CREATE TABLE IF NOT EXISTS public.analytics_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NULL,
  event text NOT NULL,
  path text NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.analytics_events ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can record analytics events" ON public.analytics_events;
CREATE POLICY "Anyone can record analytics events"
ON public.analytics_events
FOR INSERT
WITH CHECK (user_id IS NULL OR auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins can read analytics events" ON public.analytics_events;
CREATE POLICY "Admins can read analytics events"
ON public.analytics_events
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_analytics_events_created_at ON public.analytics_events(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_analytics_events_event ON public.analytics_events(event);
CREATE INDEX IF NOT EXISTS idx_analytics_events_path ON public.analytics_events(path);
CREATE INDEX IF NOT EXISTS idx_analytics_events_user_id ON public.analytics_events(user_id);

CREATE OR REPLACE FUNCTION public.admin_platform_kpis(_from timestamptz DEFAULT NULL, _to timestamptz DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  from_ts timestamptz := COALESCE(_from, now() - interval '30 days');
  to_ts timestamptz := COALESCE(_to, now());
  result jsonb;
BEGIN
  IF NOT public.has_role(auth.uid(), 'admin'::public.app_role) THEN
    RAISE EXCEPTION 'not authorized';
  END IF;

  WITH assessment_scope AS (
    SELECT *
    FROM public.assessments a
    WHERE COALESCE(a.created_at, now()) >= from_ts
      AND COALESCE(a.created_at, now()) <= to_ts
  ),
  payment_scope AS (
    SELECT *
    FROM public.payments p
    WHERE p.created_at >= from_ts
      AND p.created_at <= to_ts
  ),
  lead_scope AS (
    SELECT *
    FROM public.dslr_leads l
    WHERE COALESCE(l.created_at, now()) >= from_ts
      AND COALESCE(l.created_at, now()) <= to_ts
  ),
  event_scope AS (
    SELECT *
    FROM public.analytics_events e
    WHERE e.created_at >= from_ts
      AND e.created_at <= to_ts
  ),
  response_scope AS (
    SELECT qr.*
    FROM public.question_responses qr
    JOIN public.assessments a ON a.id = qr.assessment_id
    WHERE COALESCE(a.created_at, now()) >= from_ts
      AND COALESCE(a.created_at, now()) <= to_ts
  )
  SELECT jsonb_build_object(
    'from', from_ts,
    'to', to_ts,
    'operational', jsonb_build_object(
      'assessments_total', (SELECT count(*) FROM assessment_scope),
      'drafts_started', (SELECT count(*) FROM assessment_scope WHERE COALESCE(status, 'draft') = 'draft'),
      'submitted', (SELECT count(*) FROM assessment_scope WHERE status = 'submitted' OR review_status IN ('pending_review', 'report_ready')),
      'report_ready', (SELECT count(*) FROM assessment_scope WHERE review_status = 'report_ready'),
      'abandoned', (SELECT count(*) FROM public.assessments WHERE COALESCE(status, 'draft') = 'draft' AND created_at < now() - interval '14 days'),
      'active_accounts', (SELECT count(DISTINCT user_id) FROM event_scope WHERE user_id IS NOT NULL),
      'ai_calls', (SELECT count(*) FROM event_scope WHERE event IN ('ask_saass_call', 'insight_generation', 'pdf_export'))
    ),
    'financial', jsonb_build_object(
      'revenue_inr', (SELECT COALESCE(sum(amount_inr), 0) FROM payment_scope WHERE status = 'succeeded'),
      'paid_count', (SELECT count(*) FROM payment_scope WHERE status = 'succeeded'),
      'failed_count', (SELECT count(*) FROM payment_scope WHERE status <> 'succeeded'),
      'avg_sale_price', (SELECT COALESCE(round(avg(amount_inr)), 0) FROM payment_scope WHERE status = 'succeeded'),
      'outstanding_assessments', (SELECT count(*) FROM assessment_scope WHERE COALESCE(paid, false) = false AND (status = 'submitted' OR review_status = 'pending_review'))
    ),
    'leads', jsonb_build_object(
      'total', (SELECT count(*) FROM lead_scope),
      'new', (SELECT count(*) FROM lead_scope WHERE COALESCE(status, 'new') = 'new'),
      'contacted', (SELECT count(*) FROM lead_scope WHERE status = 'contacted'),
      'qualified', (SELECT count(*) FROM lead_scope WHERE status = 'qualified'),
      'won', (SELECT count(*) FROM lead_scope WHERE status IN ('won', 'converted')),
      'lost', (SELECT count(*) FROM lead_scope WHERE status = 'lost'),
      'stale', (SELECT count(*) FROM public.dslr_leads WHERE COALESCE(status, 'new') = 'new' AND created_at < now() - interval '3 days')
    ),
    'engagement', jsonb_build_object(
      'page_views', (SELECT count(*) FROM event_scope WHERE event = 'page_view'),
      'unique_visitors', (SELECT count(DISTINCT user_id) FROM event_scope WHERE event = 'page_view' AND user_id IS NOT NULL),
      'pdf_exports', (SELECT count(*) FROM event_scope WHERE event = 'pdf_export'),
      'smarty_pins', (SELECT count(*) FROM public.pinned_smarty_answers psa JOIN public.assessments a ON a.id = psa.assessment_id WHERE COALESCE(a.created_at, now()) >= from_ts AND COALESCE(a.created_at, now()) <= to_ts)
    ),
    'quality', jsonb_build_object(
      'average_score', (SELECT round(avg(overall_score_0_100)::numeric, 1) FROM assessment_scope WHERE overall_score_0_100 IS NOT NULL),
      'red', (SELECT count(*) FROM assessment_scope WHERE overall_score_0_100 BETWEEN 0 AND 40),
      'amber', (SELECT count(*) FROM assessment_scope WHERE overall_score_0_100 > 40 AND overall_score_0_100 <= 70),
      'green', (SELECT count(*) FROM assessment_scope WHERE overall_score_0_100 > 70 AND overall_score_0_100 <= 100),
      'responses', (SELECT count(*) FROM response_scope)
    )
  ) INTO result;

  RETURN result;
END;
$$;

REVOKE EXECUTE ON FUNCTION public.admin_platform_kpis(timestamptz, timestamptz) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.admin_platform_kpis(timestamptz, timestamptz) TO authenticated;