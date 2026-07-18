
-- 1. New columns on assessments
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS report_version int NOT NULL DEFAULT 1,
  ADD COLUMN IF NOT EXISTS report_history jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS report_email_attempts int NOT NULL DEFAULT 0;

-- 2. Audit log
CREATE TABLE IF NOT EXISTS public.report_audit_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id uuid NOT NULL REFERENCES public.assessments(id) ON DELETE CASCADE,
  actor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  actor_label text,
  action text NOT NULL,
  report_version int,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_report_audit_assessment ON public.report_audit_log(assessment_id, created_at DESC);

GRANT SELECT ON public.report_audit_log TO authenticated;
GRANT ALL ON public.report_audit_log TO service_role;

ALTER TABLE public.report_audit_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins read audit" ON public.report_audit_log;
CREATE POLICY "Admins read audit" ON public.report_audit_log
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "Owners read own audit" ON public.report_audit_log;
CREATE POLICY "Owners read own audit" ON public.report_audit_log
  FOR SELECT TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.assessments a
    WHERE a.id = report_audit_log.assessment_id AND a.user_id = auth.uid()
  ));

-- 3. Pre-flight guard for starting a new assessment
CREATE OR REPLACE FUNCTION public.can_user_start_assessment(
  _user_id uuid,
  _site_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_exempt boolean;
  active_count int;
  draft_count int;
  recent record;
  cooldown_days int := 30;
  lifetime_cap int := 5;
  draft_cap int := 3;
BEGIN
  IF _user_id IS NULL THEN
    RETURN jsonb_build_object('allowed', false, 'reason', 'auth_required');
  END IF;

  is_exempt := public.has_role(_user_id, 'admin'::app_role)
            OR public.has_role(_user_id, 'beta_tester'::app_role);

  IF NOT is_exempt THEN
    SELECT count(*) INTO active_count
    FROM public.assessments
    WHERE user_id = _user_id
      AND report_status IN ('pending_review','approved','sent','generating');
    IF active_count >= lifetime_cap THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'lifetime_cap_reached',
        'message', 'You have reached the 5-report limit for this email. Contact us for an enterprise plan.',
        'limit', lifetime_cap,
        'used', active_count
      );
    END IF;

    SELECT count(*) INTO draft_count
    FROM public.assessments
    WHERE user_id = _user_id AND COALESCE(status,'draft') = 'draft';
    IF draft_count >= draft_cap THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'too_many_drafts',
        'message', 'You have 3 unfinished drafts. Resume or discard one before starting a new assessment.',
        'limit', draft_cap
      );
    END IF;
  END IF;

  IF _site_id IS NOT NULL THEN
    SELECT a.id, a.submitted_at, a.created_at, s.name
      INTO recent
    FROM public.assessments a
    JOIN public.sites s ON s.id = a.site_id
    WHERE a.site_id = _site_id
      AND a.user_id = _user_id
      AND COALESCE(a.submitted_at, a.created_at) > now() - (cooldown_days || ' days')::interval
      AND a.report_status IN ('pending_review','approved','sent','generating')
    ORDER BY COALESCE(a.submitted_at, a.created_at) DESC
    LIMIT 1;

    IF FOUND AND NOT is_exempt THEN
      RETURN jsonb_build_object(
        'allowed', false,
        'reason', 'site_cooldown',
        'message', format('A Security Selfie for %s was generated on %s. You can re-assess this site after %s, or add a different site if the posture has materially changed.',
          recent.name,
          to_char(COALESCE(recent.submitted_at, recent.created_at), 'DD Mon YYYY'),
          to_char(COALESCE(recent.submitted_at, recent.created_at) + (cooldown_days || ' days')::interval, 'DD Mon YYYY')
        ),
        'previous_assessment_id', recent.id,
        'retry_after', COALESCE(recent.submitted_at, recent.created_at) + (cooldown_days || ' days')::interval
      );
    END IF;
  END IF;

  RETURN jsonb_build_object('allowed', true);
END;
$$;

GRANT EXECUTE ON FUNCTION public.can_user_start_assessment(uuid, uuid) TO authenticated;

-- 4. Trigger: terminal failure on report-ready email -> mark assessment email_failed
CREATE OR REPLACE FUNCTION public.handle_report_email_status()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  assessment_uuid uuid;
BEGIN
  IF NEW.message_id IS NULL OR NEW.message_id NOT LIKE 'report-ready-%' THEN
    RETURN NEW;
  END IF;

  BEGIN
    assessment_uuid := substring(NEW.message_id from 14)::uuid;
  EXCEPTION WHEN others THEN
    RETURN NEW;
  END;

  IF NEW.status IN ('dlq','failed','bounced','complained','suppressed') THEN
    UPDATE public.assessments
       SET report_status = 'email_failed',
           report_error  = COALESCE(NEW.error_message, NEW.status)
     WHERE id = assessment_uuid;

    INSERT INTO public.report_audit_log(assessment_id, action, metadata, actor_label)
    VALUES (assessment_uuid, 'email_failed',
            jsonb_build_object('status', NEW.status, 'error', NEW.error_message),
            'system');
  ELSIF NEW.status = 'sent' THEN
    INSERT INTO public.report_audit_log(assessment_id, action, metadata, actor_label)
    VALUES (assessment_uuid, 'email_delivered',
            jsonb_build_object('status', NEW.status),
            'system');
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_report_email_status ON public.email_send_log;
CREATE TRIGGER trg_report_email_status
AFTER INSERT ON public.email_send_log
FOR EACH ROW EXECUTE FUNCTION public.handle_report_email_status();
