-- ============================================================
-- 1. ROLES SYSTEM
-- ============================================================
CREATE TYPE public.app_role AS ENUM ('admin', 'client', 'guest');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Security definer function (avoids recursive RLS)
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_roles
    WHERE user_id = _user_id AND role = _role
  )
$$;

-- Convenience: get all roles for current user
CREATE OR REPLACE FUNCTION public.current_user_roles()
RETURNS SETOF app_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.user_roles WHERE user_id = auth.uid()
$$;

CREATE POLICY "Users view own roles" ON public.user_roles
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Auto-assign 'client' role to every new signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'client')
  ON CONFLICT DO NOTHING;
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Bootstrap: make the existing user admin
-- INSERT INTO public.user_roles (user_id, role)
-- VALUES ('aa0a9576-e686-4441-ad53-e6926962a45c', 'admin'),
--        ('aa0a9576-e686-4441-ad53-e6926962a45c', 'client')
-- ON CONFLICT DO NOTHING;

-- ============================================================
-- 2. APP SETTINGS (admin-editable price etc.)
-- ============================================================
CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  updated_by uuid REFERENCES auth.users(id)
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read settings" ON public.app_settings
  FOR SELECT USING (true);

CREATE POLICY "Admins write settings" ON public.app_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

INSERT INTO public.app_settings (key, value) VALUES
  ('pricing', '{"assessment_price_inr": 4999, "currency": "INR"}'::jsonb);

-- ============================================================
-- 3. PAYMENTS
-- ============================================================
CREATE TABLE public.payments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  assessment_id uuid REFERENCES public.assessments(id) ON DELETE SET NULL,
  amount_inr numeric NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  provider text NOT NULL DEFAULT 'placeholder',
  provider_ref text,
  status text NOT NULL DEFAULT 'succeeded',
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.payments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own payments" ON public.payments
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Users create own payments" ON public.payments
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins manage payments" ON public.payments
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- ============================================================
-- 4. ADD OWNERSHIP TO EXISTING TABLES + paid flag
-- ============================================================
ALTER TABLE public.organisations ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.sites         ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.assessments   ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE public.assessments   ADD COLUMN paid boolean NOT NULL DEFAULT false;

-- Backfill existing rows to the bootstrap admin
-- UPDATE public.organisations SET user_id = 'aa0a9576-e686-4441-ad53-e6926962a45c' WHERE user_id IS NULL;
-- UPDATE public.sites         SET user_id = 'aa0a9576-e686-4441-ad53-e6926962a45c' WHERE user_id IS NULL;
-- UPDATE public.assessments   SET user_id = 'aa0a9576-e686-4441-ad53-e6926962a45c', paid = true WHERE user_id IS NULL;


CREATE INDEX idx_organisations_user ON public.organisations(user_id);
CREATE INDEX idx_sites_user ON public.sites(user_id);
CREATE INDEX idx_assessments_user ON public.assessments(user_id);

-- ============================================================
-- 5. TIGHTEN RLS — drop "allow all", add ownership policies
-- ============================================================

-- ORGANISATIONS
DROP POLICY IF EXISTS "Allow all operations on organisations" ON public.organisations;

CREATE POLICY "Users manage own orgs" ON public.organisations
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- SITES
DROP POLICY IF EXISTS "Allow all operations on sites" ON public.sites;

CREATE POLICY "Users manage own sites" ON public.sites
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- ASSESSMENTS
DROP POLICY IF EXISTS "Allow all operations on assessments" ON public.assessments;

CREATE POLICY "Users manage own assessments" ON public.assessments
  FOR ALL TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'))
  WITH CHECK (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin'));

-- DOMAIN_SCORES — gated via parent assessment
DROP POLICY IF EXISTS "Allow all operations on domain_scores" ON public.domain_scores;

CREATE POLICY "Users manage scores via assessment" ON public.domain_scores
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = assessment_id
        AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = assessment_id
        AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- QUESTION_RESPONSES — gated via parent assessment
DROP POLICY IF EXISTS "Allow all operations on question_responses" ON public.question_responses;

CREATE POLICY "Users manage responses via assessment" ON public.question_responses
  FOR ALL TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = assessment_id
        AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.assessments a
      WHERE a.id = assessment_id
        AND (a.user_id = auth.uid() OR public.has_role(auth.uid(), 'admin'))
    )
  );

-- DSLR_LEADS — anyone can submit, only admins can read
DROP POLICY IF EXISTS "Allow all operations on dslr_leads" ON public.dslr_leads;

CREATE POLICY "Anyone can submit a lead" ON public.dslr_leads
  FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Admins read leads" ON public.dslr_leads
  FOR SELECT TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins manage leads" ON public.dslr_leads
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));