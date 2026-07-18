
-- 1. Pin search_path on pgmq wrapper SECURITY DEFINER functions
ALTER FUNCTION public.enqueue_email(text, jsonb) SET search_path = public, pgmq;
ALTER FUNCTION public.read_email_batch(text, integer, integer) SET search_path = public, pgmq;
ALTER FUNCTION public.delete_email(text, bigint) SET search_path = public, pgmq;
ALTER FUNCTION public.move_to_dlq(text, text, bigint, jsonb) SET search_path = public, pgmq;

-- 2. Revoke anonymous EXECUTE on SECURITY DEFINER functions that should not
--    be callable by signed-out users.
REVOKE EXECUTE ON FUNCTION public.can_user_start_assessment(uuid, uuid) FROM PUBLIC, anon;
REVOKE EXECUTE ON FUNCTION public.enforce_assessment_limits() FROM PUBLIC, anon, authenticated;
REVOKE EXECUTE ON FUNCTION public.handle_report_email_status() FROM PUBLIC, anon, authenticated;
