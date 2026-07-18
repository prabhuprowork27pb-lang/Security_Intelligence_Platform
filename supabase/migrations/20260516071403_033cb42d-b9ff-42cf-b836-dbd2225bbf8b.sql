ALTER TABLE public.intelligence_pulse_subscribers
  ADD COLUMN IF NOT EXISTS phone text,
  ADD COLUMN IF NOT EXISTS channel text NOT NULL DEFAULT 'email';

ALTER TABLE public.intelligence_pulse_subscribers
  ALTER COLUMN email DROP NOT NULL;

-- Replace the strict email-only insert policy with one that accepts either channel
DROP POLICY IF EXISTS "Anyone can subscribe" ON public.intelligence_pulse_subscribers;

CREATE POLICY "Anyone can subscribe"
ON public.intelligence_pulse_subscribers
FOR INSERT
TO anon, authenticated
WITH CHECK (
  channel IN ('email','whatsapp')
  AND (
    (channel = 'email' AND email IS NOT NULL
      AND char_length(trim(email)) BETWEEN 3 AND 320
      AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$')
    OR
    (channel = 'whatsapp' AND phone IS NOT NULL
      AND char_length(trim(phone)) BETWEEN 7 AND 20
      AND phone ~ '^\+?[0-9 \-]{7,20}$')
  )
  AND char_length(coalesce(name,'')) <= 200
  AND char_length(coalesce(role,'')) <= 200
  AND char_length(coalesce(organisation,'')) <= 200
  AND char_length(coalesce(source,'')) <= 200
);