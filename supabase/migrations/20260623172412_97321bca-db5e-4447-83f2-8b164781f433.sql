
-- Assessments: report pipeline columns
ALTER TABLE public.assessments
  ADD COLUMN IF NOT EXISTS report_status text NOT NULL DEFAULT 'none',
  ADD COLUMN IF NOT EXISTS report_pdf_path text,
  ADD COLUMN IF NOT EXISTS report_generated_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_approved_by uuid,
  ADD COLUMN IF NOT EXISTS report_approved_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_sent_at timestamptz,
  ADD COLUMN IF NOT EXISTS report_error text;

-- Pulse: allow anon/authenticated to read tagged items for the public Signals strip
DROP POLICY IF EXISTS "Public can read tagged pulse items" ON public.pulse_raw_items;
CREATE POLICY "Public can read tagged pulse items"
  ON public.pulse_raw_items
  FOR SELECT
  TO anon, authenticated
  USING (status = 'tagged');

GRANT SELECT ON public.pulse_raw_items TO anon;
GRANT SELECT ON public.pulse_sources TO anon, authenticated;

-- Storage policies for `reports` bucket
DROP POLICY IF EXISTS "Owners can read sent reports" ON storage.objects;
CREATE POLICY "Owners can read sent reports"
  ON storage.objects
  FOR SELECT
  TO authenticated
  USING (
    bucket_id = 'reports'
    AND EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id::text = split_part(storage.objects.name, '/', 1)
        AND a.user_id = auth.uid()
        AND a.report_status = 'sent'
    )
  );

DROP POLICY IF EXISTS "Admins manage all reports" ON storage.objects;
CREATE POLICY "Admins manage all reports"
  ON storage.objects
  FOR ALL
  TO authenticated
  USING (bucket_id = 'reports' AND public.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (bucket_id = 'reports' AND public.has_role(auth.uid(), 'admin'::public.app_role));
