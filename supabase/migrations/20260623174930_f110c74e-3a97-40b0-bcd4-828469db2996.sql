
CREATE OR REPLACE FUNCTION public.enforce_assessment_limits()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  guard jsonb;
BEGIN
  IF NEW.user_id IS NULL THEN
    RETURN NEW;
  END IF;
  guard := public.can_user_start_assessment(NEW.user_id, NEW.site_id);
  IF (guard->>'allowed')::boolean IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'assessment_blocked: %', COALESCE(guard->>'message', guard->>'reason', 'not allowed')
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_assessment_limits ON public.assessments;
CREATE TRIGGER trg_enforce_assessment_limits
BEFORE INSERT ON public.assessments
FOR EACH ROW EXECUTE FUNCTION public.enforce_assessment_limits();
