-- Replace permissive false-check with RESTRICTIVE policy that blocks all client inserts
DROP POLICY IF EXISTS "Block client inserts on payments" ON public.payments;

CREATE POLICY "Restrict payments inserts to service role"
ON public.payments
AS RESTRICTIVE
FOR INSERT
TO anon, authenticated
WITH CHECK (false);