
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS designation_locked_at timestamptz,
  ADD COLUMN IF NOT EXISTS company_locked_at timestamptz;

CREATE TABLE IF NOT EXISTS public.profile_change_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field text NOT NULL,
  old_value text,
  new_value text,
  actor text NOT NULL DEFAULT 'self',
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.profile_change_log TO authenticated;
GRANT ALL ON public.profile_change_log TO service_role;

ALTER TABLE public.profile_change_log ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own change log" ON public.profile_change_log;
CREATE POLICY "Users read own change log"
  ON public.profile_change_log FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'::public.app_role));

CREATE INDEX IF NOT EXISTS idx_profile_change_log_user ON public.profile_change_log(user_id, created_at DESC);

CREATE OR REPLACE FUNCTION public.profiles_lock_identity()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF OLD.verified_at IS NOT NULL THEN
    IF NEW.full_name IS DISTINCT FROM OLD.full_name THEN
      RAISE EXCEPTION 'Full name is locked after verification';
    END IF;
    IF lower(NEW.email) IS DISTINCT FROM lower(OLD.email) THEN
      RAISE EXCEPTION 'Email is locked after verification';
    END IF;
  END IF;

  IF NEW.designation IS DISTINCT FROM OLD.designation THEN
    INSERT INTO public.profile_change_log(user_id, field, old_value, new_value, actor)
      VALUES (NEW.user_id, 'designation', OLD.designation, NEW.designation, 'self');
    NEW.designation_locked_at := now();
  END IF;
  IF NEW.company IS DISTINCT FROM OLD.company THEN
    INSERT INTO public.profile_change_log(user_id, field, old_value, new_value, actor)
      VALUES (NEW.user_id, 'company', OLD.company, NEW.company, 'self');
    NEW.company_locked_at := now();
  END IF;
  IF NEW.mobile IS DISTINCT FROM OLD.mobile THEN
    INSERT INTO public.profile_change_log(user_id, field, old_value, new_value, actor)
      VALUES (NEW.user_id, 'mobile', OLD.mobile, NEW.mobile, 'self');
  END IF;

  NEW.updated_at := now();
  RETURN NEW;
END;
$$;

ALTER TABLE public.pulse_editions
  ADD COLUMN IF NOT EXISTS featured_until timestamptz,
  ADD COLUMN IF NOT EXISTS archived boolean NOT NULL DEFAULT false;

UPDATE public.pulse_editions
   SET featured_until = COALESCE(featured_until, (edition_date::timestamptz) + interval '15 days')
 WHERE featured_until IS NULL;

CREATE INDEX IF NOT EXISTS idx_pulse_editions_featured ON public.pulse_editions(archived, featured_until DESC);

CREATE OR REPLACE FUNCTION public.pulse_rotate_expired()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  UPDATE public.pulse_editions
     SET archived = true
   WHERE archived = false AND featured_until IS NOT NULL AND featured_until < now();
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION public.pulse_rotate_expired() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.pulse_rotate_expired() TO authenticated, service_role;
