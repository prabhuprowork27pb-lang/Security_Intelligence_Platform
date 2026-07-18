DROP POLICY IF EXISTS "Anyone can submit a lead" ON public.dslr_leads;

CREATE POLICY "Anyone can submit a lead" ON public.dslr_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (
    char_length(trim(name)) BETWEEN 1 AND 200
    AND char_length(trim(email)) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(coalesce(message, '')) <= 5000
  );