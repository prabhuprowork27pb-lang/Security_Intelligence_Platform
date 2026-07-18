CREATE TABLE IF NOT EXISTS public.intelligence_pulse_subscribers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  name text,
  role text,
  organisation text,
  source text,
  status text NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX IF NOT EXISTS intelligence_pulse_subscribers_email_key
  ON public.intelligence_pulse_subscribers (lower(email));

ALTER TABLE public.intelligence_pulse_subscribers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can subscribe"
  ON public.intelligence_pulse_subscribers
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    char_length(trim(email)) BETWEEN 3 AND 320
    AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
    AND char_length(coalesce(name, '')) <= 200
    AND char_length(coalesce(role, '')) <= 200
    AND char_length(coalesce(organisation, '')) <= 200
    AND char_length(coalesce(source, '')) <= 200
  );

CREATE POLICY "Admins read subscribers"
  ON public.intelligence_pulse_subscribers
  FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins manage subscribers"
  ON public.intelligence_pulse_subscribers
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));