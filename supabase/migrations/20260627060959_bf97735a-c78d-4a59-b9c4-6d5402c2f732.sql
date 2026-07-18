ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS industry_other text;
ALTER TABLE public.sites ADD COLUMN IF NOT EXISTS site_type_other text;
ALTER TABLE public.profiles ADD CONSTRAINT profiles_industry_other_len CHECK (industry_other IS NULL OR char_length(industry_other) <= 80);
ALTER TABLE public.sites ADD CONSTRAINT sites_site_type_other_len CHECK (site_type_other IS NULL OR char_length(site_type_other) <= 80);