
-- Shared trigger helper (idempotent)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- pulse_sources
CREATE TABLE public.pulse_sources (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  url text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('rss','atom','x_handle','html')),
  region text NOT NULL DEFAULT 'india' CHECK (region IN ('india','global')),
  sector text[] NOT NULL DEFAULT '{}',
  weight integer NOT NULL DEFAULT 5 CHECK (weight BETWEEN 1 AND 10),
  active boolean NOT NULL DEFAULT true,
  last_fetched_at timestamptz,
  last_error text,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_sources TO authenticated;
GRANT ALL ON public.pulse_sources TO service_role;
ALTER TABLE public.pulse_sources ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pulse sources" ON public.pulse_sources FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- pulse_raw_items
CREATE TABLE public.pulse_raw_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  source_id uuid NOT NULL REFERENCES public.pulse_sources(id) ON DELETE CASCADE,
  external_id text NOT NULL,
  url text NOT NULL,
  title text NOT NULL,
  summary text,
  published_at timestamptz,
  fetched_at timestamptz NOT NULL DEFAULT now(),
  language text DEFAULT 'en',
  ai_tags jsonb NOT NULL DEFAULT '{}'::jsonb,
  ai_tagged_at timestamptz,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','tagged','archived','used')),
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pulse_raw_items_source_external_uidx ON public.pulse_raw_items (source_id, external_id);
CREATE INDEX pulse_raw_items_status_idx ON public.pulse_raw_items (status, fetched_at DESC);
CREATE INDEX pulse_raw_items_published_idx ON public.pulse_raw_items (published_at DESC);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_raw_items TO authenticated;
GRANT ALL ON public.pulse_raw_items TO service_role;
ALTER TABLE public.pulse_raw_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pulse raw items" ON public.pulse_raw_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- pulse_editions
CREATE TABLE public.pulse_editions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  issue_number integer NOT NULL,
  edition_date date NOT NULL,
  status text NOT NULL DEFAULT 'drafting' CHECK (status IN ('drafting','pending_review','approved','sent')),
  title text,
  subtitle text,
  sections jsonb NOT NULL DEFAULT '{}'::jsonb,
  approved_by uuid,
  approved_at timestamptz,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE UNIQUE INDEX pulse_editions_issue_uidx ON public.pulse_editions (issue_number);
CREATE UNIQUE INDEX pulse_editions_date_uidx ON public.pulse_editions (edition_date);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_editions TO authenticated;
GRANT ALL ON public.pulse_editions TO service_role;
ALTER TABLE public.pulse_editions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pulse editions" ON public.pulse_editions FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- pulse_edition_items
CREATE TABLE public.pulse_edition_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES public.pulse_editions(id) ON DELETE CASCADE,
  raw_item_id uuid NOT NULL REFERENCES public.pulse_raw_items(id) ON DELETE CASCADE,
  section_key text NOT NULL,
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pulse_edition_items_edition_idx ON public.pulse_edition_items (edition_id, section_key, position);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_edition_items TO authenticated;
GRANT ALL ON public.pulse_edition_items TO service_role;
ALTER TABLE public.pulse_edition_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pulse edition items" ON public.pulse_edition_items FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- pulse_deliveries
CREATE TABLE public.pulse_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  edition_id uuid NOT NULL REFERENCES public.pulse_editions(id) ON DELETE CASCADE,
  channel text NOT NULL CHECK (channel IN ('email','whatsapp')),
  recipient_count integer NOT NULL DEFAULT 0,
  sent_at timestamptz,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','sending','sent','failed')),
  provider_ref text,
  error text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX pulse_deliveries_edition_idx ON public.pulse_deliveries (edition_id, channel);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.pulse_deliveries TO authenticated;
GRANT ALL ON public.pulse_deliveries TO service_role;
ALTER TABLE public.pulse_deliveries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Admins manage pulse deliveries" ON public.pulse_deliveries FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role)) WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE TRIGGER update_pulse_sources_updated_at BEFORE UPDATE ON public.pulse_sources
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_pulse_editions_updated_at BEFORE UPDATE ON public.pulse_editions
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
