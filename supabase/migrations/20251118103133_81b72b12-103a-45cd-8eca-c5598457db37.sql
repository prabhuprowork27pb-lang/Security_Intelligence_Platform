-- Create organisations table
CREATE TABLE public.organisations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  industry TEXT DEFAULT 'IT/ITES',
  city TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create sites table
CREATE TABLE public.sites (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  city TEXT NOT NULL,
  state TEXT,
  country TEXT DEFAULT 'India',
  site_type TEXT DEFAULT 'office',
  headcount_band TEXT,
  criticality TEXT DEFAULT 'medium',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create assessments table
CREATE TABLE public.assessments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id UUID REFERENCES public.sites(id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  created_by_name TEXT NOT NULL,
  created_by_role TEXT NOT NULL,
  version INTEGER DEFAULT 1,
  overall_score_0_100 NUMERIC(5,2),
  overall_maturity_1_5 INTEGER,
  risk_posture TEXT,
  status TEXT DEFAULT 'draft',
  executive_summary TEXT,
  remediation_plan TEXT
);

-- Create domain_scores table
CREATE TABLE public.domain_scores (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  domain_key TEXT NOT NULL,
  domain_name TEXT NOT NULL,
  score_raw_0_4 NUMERIC(3,2),
  score_0_100 NUMERIC(5,2),
  maturity_1_5 INTEGER,
  commentary TEXT
);

-- Create question_responses table
CREATE TABLE public.question_responses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assessment_id UUID REFERENCES public.assessments(id) ON DELETE CASCADE NOT NULL,
  domain_key TEXT NOT NULL,
  question_code TEXT NOT NULL,
  question_text TEXT NOT NULL,
  rating_0_4 INTEGER NOT NULL CHECK (rating_0_4 >= 0 AND rating_0_4 <= 4),
  comment TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Create dslr_leads table
CREATE TABLE public.dslr_leads (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organisation_id UUID REFERENCES public.organisations(id) ON DELETE SET NULL,
  site_id UUID REFERENCES public.sites(id) ON DELETE SET NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.organisations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.domain_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.question_responses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dslr_leads ENABLE ROW LEVEL SECURITY;

-- Create policies (public access for now, can be refined later with auth)
CREATE POLICY "Allow all operations on organisations" ON public.organisations FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on sites" ON public.sites FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on assessments" ON public.assessments FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on domain_scores" ON public.domain_scores FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on question_responses" ON public.question_responses FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all operations on dslr_leads" ON public.dslr_leads FOR ALL USING (true) WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX idx_sites_organisation ON public.sites(organisation_id);
CREATE INDEX idx_assessments_site ON public.assessments(site_id);
CREATE INDEX idx_domain_scores_assessment ON public.domain_scores(assessment_id);
CREATE INDEX idx_question_responses_assessment ON public.question_responses(assessment_id);