-- GovJobMatch initial schema: catalog, user tables, search, RLS, triggers.
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

GRANT USAGE ON SCHEMA public TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Helper functions
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Stub until 0002 creates user_roles and replaces this with a real check.
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  RETURN false;
END;
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- Catalog tables
-- ---------------------------------------------------------------------------

CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  official_website TEXT,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.job_sources (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations (id) ON DELETE CASCADE,
  name TEXT,
  source_url TEXT,
  source_type TEXT,
  last_checked_at TIMESTAMPTZ,
  status TEXT NOT NULL DEFAULT 'idle',
  enabled BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations (id) ON DELETE RESTRICT,
  source_id UUID REFERENCES public.job_sources (id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  description TEXT,
  qualification TEXT,
  branches TEXT[] NOT NULL DEFAULT '{}'::text[],
  minimum_age INTEGER,
  maximum_age INTEGER,
  age_relaxation JSONB NOT NULL DEFAULT '{}'::jsonb,
  experience TEXT,
  states TEXT[] NOT NULL DEFAULT '{}'::text[],
  locations TEXT[] NOT NULL DEFAULT '{}'::text[],
  vacancies INTEGER,
  salary_min NUMERIC,
  salary_max NUMERIC,
  salary_text TEXT,
  job_type TEXT,
  category TEXT,
  application_start_date DATE,
  application_end_date DATE,
  exam_date DATE,
  selection_process TEXT[] NOT NULL DEFAULT '{}'::text[],
  application_fee JSONB NOT NULL DEFAULT '{}'::jsonb,
  official_notification_url TEXT,
  official_apply_url TEXT,
  source_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  is_verified BOOLEAN NOT NULL DEFAULT false,
  is_sample BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  fingerprint TEXT,
  qualification_codes TEXT[] NOT NULL DEFAULT '{}'::text[],
  required_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  exam_family TEXT,
  organization_name TEXT,
  search_vector tsvector,
  CONSTRAINT jobs_status_check CHECK (
    status IN ('pending', 'published', 'unpublished', 'closed')
  )
);

CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  full_name TEXT,
  date_of_birth DATE,
  gender TEXT,
  state TEXT,
  category TEXT,
  highest_qualification TEXT,
  branch TEXT,
  passing_year INTEGER,
  experience_level TEXT,
  experience_years NUMERIC,
  preferred_states TEXT[] NOT NULL DEFAULT '{}'::text[],
  preferred_categories TEXT[] NOT NULL DEFAULT '{}'::text[],
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.saved_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id)
);

CREATE TABLE public.applications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'planning',
  notes TEXT,
  applied_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT applications_status_check CHECK (
    status IN (
      'saved',
      'planning',
      'applied',
      'exam_scheduled',
      'exam_completed',
      'result_declared',
      'selected',
      'not_selected'
    )
  )
);

CREATE TABLE public.notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  job_id UUID REFERENCES public.jobs (id) ON DELETE SET NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TABLE public.eligibility_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users (id) ON DELETE CASCADE,
  job_id UUID NOT NULL REFERENCES public.jobs (id) ON DELETE CASCADE,
  status TEXT NOT NULL,
  matched_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  failed_rules JSONB NOT NULL DEFAULT '[]'::jsonb,
  warnings JSONB NOT NULL DEFAULT '[]'::jsonb,
  summary TEXT,
  computed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, job_id),
  CONSTRAINT eligibility_results_status_check CHECK (
    status IN ('ELIGIBLE', 'CHECK_DETAILS', 'NOT_ELIGIBLE')
  )
);

-- ---------------------------------------------------------------------------
-- Indexes
-- ---------------------------------------------------------------------------

CREATE INDEX jobs_status_verified_end_idx
  ON public.jobs (status, is_verified, application_end_date);

CREATE INDEX jobs_branches_gin ON public.jobs USING GIN (branches);
CREATE INDEX jobs_states_gin ON public.jobs USING GIN (states);
CREATE INDEX jobs_locations_gin ON public.jobs USING GIN (locations);
CREATE INDEX jobs_qualification_codes_gin ON public.jobs USING GIN (qualification_codes);
CREATE INDEX jobs_search_vector_gin ON public.jobs USING GIN (search_vector);

-- UNIQUE constraint (not only an index) so PostgREST on_conflict=fingerprint works.
ALTER TABLE public.jobs ADD CONSTRAINT jobs_fingerprint_key UNIQUE (fingerprint);

CREATE INDEX jobs_organization_id_idx ON public.jobs (organization_id);
CREATE INDEX jobs_source_id_idx ON public.jobs (source_id);
CREATE INDEX jobs_category_idx ON public.jobs (category);
CREATE INDEX jobs_exam_family_idx ON public.jobs (exam_family);
CREATE INDEX jobs_application_end_date_idx ON public.jobs (application_end_date);

CREATE INDEX job_sources_organization_id_idx ON public.job_sources (organization_id);
CREATE INDEX saved_jobs_user_id_idx ON public.saved_jobs (user_id);
CREATE INDEX saved_jobs_job_id_idx ON public.saved_jobs (job_id);
CREATE INDEX applications_user_id_idx ON public.applications (user_id);
CREATE INDEX applications_job_id_idx ON public.applications (job_id);
CREATE INDEX notifications_user_id_idx ON public.notifications (user_id, is_read, created_at DESC);
CREATE INDEX eligibility_results_user_id_idx ON public.eligibility_results (user_id);

-- ---------------------------------------------------------------------------
-- Search: denormalized org name + tsvector trigger
-- ---------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.jobs_before_write()
RETURNS trigger
LANGUAGE plpgsql
AS $$
DECLARE
  org_name text;
BEGIN
  IF NEW.organization_name IS NULL OR btrim(NEW.organization_name) = '' THEN
    SELECT o.name
      INTO org_name
      FROM public.organizations o
     WHERE o.id = NEW.organization_id;
    NEW.organization_name := org_name;
  END IF;

  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.title, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.organization_name, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.qualification, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.category, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.exam_family, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.qualification_codes, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.branches, ' '), '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.states, ' '), '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(array_to_string(NEW.locations, ' '), '')), 'C') ||
    setweight(to_tsvector('simple', coalesce(NEW.description, '')), 'D');

  RETURN NEW;
END;
$$;

CREATE TRIGGER jobs_before_write
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.jobs_before_write();

CREATE OR REPLACE FUNCTION public.sync_jobs_organization_name()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.name IS DISTINCT FROM OLD.name THEN
    UPDATE public.jobs
       SET organization_name = NEW.name,
           updated_at = now()
     WHERE organization_id = NEW.id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER organizations_sync_job_names
  AFTER UPDATE OF name ON public.organizations
  FOR EACH ROW
  EXECUTE FUNCTION public.sync_jobs_organization_name();

CREATE OR REPLACE FUNCTION public.search_jobs(query text)
RETURNS SETOF public.jobs
LANGUAGE plpgsql
STABLE
SET search_path = public
AS $$
DECLARE
  trimmed text := btrim(coalesce(query, ''));
  safe_q text;
  tsq tsquery;
  tokens text[];
BEGIN
  IF trimmed = '' THEN
    RETURN QUERY
    SELECT j.*
      FROM public.jobs j
     ORDER BY j.application_end_date ASC NULLS LAST, j.created_at DESC;
    RETURN;
  END IF;

  safe_q := replace(replace(trimmed, '%', ''), '_', '');

  BEGIN
    tsq := websearch_to_tsquery('simple', safe_q);
  EXCEPTION WHEN OTHERS THEN
    BEGIN
      tsq := plainto_tsquery('simple', safe_q);
    EXCEPTION WHEN OTHERS THEN
      tsq := NULL;
    END;
  END;

  tokens := regexp_split_to_array(lower(safe_q), '[[:space:]]+');

  RETURN QUERY
  SELECT j.*
    FROM public.jobs j
   WHERE (
      (tsq IS NOT NULL AND length(tsq::text) > 0 AND j.search_vector @@ tsq)
      OR j.title ILIKE '%' || safe_q || '%'
      OR coalesce(j.organization_name, '') ILIKE '%' || safe_q || '%'
      OR coalesce(j.qualification, '') ILIKE '%' || safe_q || '%'
      OR coalesce(j.category, '') ILIKE '%' || safe_q || '%'
      OR coalesce(j.exam_family, '') ILIKE '%' || safe_q || '%'
      OR EXISTS (
        SELECT 1
          FROM unnest(tokens) AS t(token)
         WHERE length(t.token) >= 2
           AND (
             j.title ILIKE '%' || t.token || '%'
             OR coalesce(j.organization_name, '') ILIKE '%' || t.token || '%'
             OR coalesce(j.qualification, '') ILIKE '%' || t.token || '%'
             OR coalesce(j.category, '') ILIKE '%' || t.token || '%'
             OR coalesce(j.exam_family, '') ILIKE '%' || t.token || '%'
             OR coalesce(j.slug, '') ILIKE '%' || t.token || '%'
             OR EXISTS (
               SELECT 1 FROM unnest(j.qualification_codes) AS c(code)
                WHERE c.code ILIKE '%' || t.token || '%'
             )
             OR EXISTS (
               SELECT 1 FROM unnest(j.branches) AS b(branch)
                WHERE b.branch ILIKE '%' || t.token || '%'
             )
             OR EXISTS (
               SELECT 1 FROM unnest(j.states) AS s(state)
                WHERE s.state ILIKE '%' || t.token || '%'
             )
             OR EXISTS (
               SELECT 1 FROM unnest(j.locations) AS loc(location)
                WHERE loc.location ILIKE '%' || t.token || '%'
             )
           )
      )
    )
   ORDER BY
     CASE
       WHEN tsq IS NOT NULL AND length(tsq::text) > 0
         THEN ts_rank_cd(j.search_vector, tsq)
       ELSE 0
     END DESC,
     j.application_end_date ASC NULLS LAST,
     j.created_at DESC;
END;
$$;

REVOKE ALL ON FUNCTION public.search_jobs(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.search_jobs(text) TO anon, authenticated;

-- ---------------------------------------------------------------------------
-- updated_at + new-user profile triggers
-- ---------------------------------------------------------------------------

CREATE TRIGGER job_sources_set_updated_at
  BEFORE UPDATE ON public.job_sources
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER jobs_set_updated_at
  BEFORE UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER profiles_set_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER applications_set_updated_at
  BEFORE UPDATE ON public.applications
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE TRIGGER eligibility_results_set_updated_at
  BEFORE UPDATE ON public.eligibility_results
  FOR EACH ROW
  EXECUTE FUNCTION public.set_updated_at();

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name)
  VALUES (
    NEW.id,
    COALESCE(
      NEW.raw_user_meta_data ->> 'full_name',
      NEW.raw_user_meta_data ->> 'name',
      ''
    )
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_sources ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.saved_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.eligibility_results ENABLE ROW LEVEL SECURITY;

CREATE POLICY organizations_public_select
  ON public.organizations
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY organizations_admin_all
  ON public.organizations
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY job_sources_public_select
  ON public.job_sources
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY job_sources_admin_all
  ON public.job_sources
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY jobs_public_select
  ON public.jobs
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' AND is_verified = true);

CREATE POLICY jobs_admin_all
  ON public.jobs
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY profiles_select_own
  ON public.profiles
  FOR SELECT
  TO authenticated
  USING (id = auth.uid() OR public.is_admin());

CREATE POLICY profiles_insert_own
  ON public.profiles
  FOR INSERT
  TO authenticated
  WITH CHECK (id = auth.uid());

CREATE POLICY profiles_update_own
  ON public.profiles
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid());

CREATE POLICY saved_jobs_select_own
  ON public.saved_jobs
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY saved_jobs_insert_own
  ON public.saved_jobs
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY saved_jobs_update_own
  ON public.saved_jobs
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY saved_jobs_delete_own
  ON public.saved_jobs
  FOR DELETE
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY applications_select_own
  ON public.applications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY applications_insert_own
  ON public.applications
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY applications_update_own
  ON public.applications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_select_own
  ON public.notifications
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY notifications_update_own
  ON public.notifications
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY notifications_admin_insert
  ON public.notifications
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_admin());

CREATE POLICY eligibility_results_select_own
  ON public.eligibility_results
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY eligibility_results_insert_own
  ON public.eligibility_results
  FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY eligibility_results_update_own
  ON public.eligibility_results
  FOR UPDATE
  TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- ---------------------------------------------------------------------------
-- Grants
-- ---------------------------------------------------------------------------

GRANT SELECT ON TABLE public.organizations TO anon, authenticated;
GRANT SELECT ON TABLE public.job_sources TO anon, authenticated;
GRANT SELECT ON TABLE public.jobs TO anon, authenticated;

GRANT INSERT, UPDATE, DELETE ON TABLE public.organizations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.job_sources TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.jobs TO authenticated;

GRANT SELECT, INSERT, UPDATE ON TABLE public.profiles TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.saved_jobs TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.applications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.notifications TO authenticated;
GRANT SELECT, INSERT, UPDATE ON TABLE public.eligibility_results TO authenticated;
