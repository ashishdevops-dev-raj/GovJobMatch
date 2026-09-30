-- Exams catalog, user roles, fingerprint helper, extra job columns.

ALTER TABLE public.jobs
  ADD COLUMN IF NOT EXISTS fingerprint TEXT,
  ADD COLUMN IF NOT EXISTS qualification_codes TEXT[] NOT NULL DEFAULT '{}'::text[],
  ADD COLUMN IF NOT EXISTS required_conditions JSONB NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS exam_family TEXT,
  ADD COLUMN IF NOT EXISTS organization_name TEXT,
  ADD COLUMN IF NOT EXISTS search_vector tsvector;

-- PostgREST ON CONFLICT (fingerprint) requires a UNIQUE constraint, not only an index.
DROP INDEX IF EXISTS jobs_fingerprint_not_null_uidx;
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'jobs_fingerprint_key'
  ) THEN
    ALTER TABLE public.jobs ADD CONSTRAINT jobs_fingerprint_key UNIQUE (fingerprint);
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS jobs_qualification_codes_gin
  ON public.jobs USING GIN (qualification_codes);

CREATE INDEX IF NOT EXISTS jobs_search_vector_gin
  ON public.jobs USING GIN (search_vector);

CREATE INDEX IF NOT EXISTS jobs_exam_family_idx
  ON public.jobs (exam_family);

-- SHA-256 fingerprint matching lib/jobs/fingerprint.ts
CREATE OR REPLACE FUNCTION public.compute_job_fingerprint(
  organization_name text,
  title text,
  application_end_date date
)
RETURNS text
LANGUAGE sql
IMMUTABLE
SET search_path = public, extensions, pg_catalog
AS $$
  SELECT encode(
    digest(
      lower(btrim(coalesce(organization_name, ''))) || '|' ||
      lower(btrim(coalesce(title, ''))) || '|' ||
      coalesce(application_end_date::text, ''),
      'sha256'
    ),
    'hex'
  );
$$;

REVOKE ALL ON FUNCTION public.compute_job_fingerprint(text, text, date) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.compute_job_fingerprint(text, text, date) TO authenticated;

CREATE OR REPLACE FUNCTION public.jobs_before_write()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public, extensions, pg_catalog
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

  IF NEW.fingerprint IS NULL OR btrim(NEW.fingerprint) = '' THEN
    NEW.fingerprint := public.compute_job_fingerprint(
      coalesce(NEW.organization_name, ''),
      NEW.title,
      NEW.application_end_date
    );
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

DROP TRIGGER IF EXISTS jobs_search_vector_trigger ON public.jobs;
DROP TRIGGER IF EXISTS jobs_fill_org_and_fingerprint ON public.jobs;
DROP TRIGGER IF EXISTS jobs_before_write ON public.jobs;
CREATE TRIGGER jobs_before_write
  BEFORE INSERT OR UPDATE ON public.jobs
  FOR EACH ROW
  EXECUTE FUNCTION public.jobs_before_write();

-- ---------------------------------------------------------------------------
-- user_roles
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.user_roles (
  user_id UUID PRIMARY KEY REFERENCES auth.users (id) ON DELETE CASCADE,
  role TEXT NOT NULL DEFAULT 'user',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT user_roles_role_check CHECK (role IN ('user', 'admin'))
);

CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
      FROM public.user_roles
     WHERE user_id = auth.uid()
       AND role = 'admin'
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO anon, authenticated;

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

  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'user')
  ON CONFLICT (user_id) DO NOTHING;

  RETURN NEW;
END;
$$;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS user_roles_select_own ON public.user_roles;
CREATE POLICY user_roles_select_own
  ON public.user_roles
  FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR public.is_admin());

DROP POLICY IF EXISTS user_roles_admin_all ON public.user_roles;
CREATE POLICY user_roles_admin_all
  ON public.user_roles
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON TABLE public.user_roles TO authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.user_roles TO authenticated;

-- ---------------------------------------------------------------------------
-- exams
-- ---------------------------------------------------------------------------

CREATE TABLE IF NOT EXISTS public.exams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  family TEXT,
  description TEXT,
  official_url TEXT,
  typical_qualification TEXT,
  frequency TEXT,
  is_sample BOOLEAN NOT NULL DEFAULT true,
  status TEXT NOT NULL DEFAULT 'published',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.exams
  ADD COLUMN IF NOT EXISTS status TEXT NOT NULL DEFAULT 'published';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
      FROM pg_constraint
     WHERE conname = 'exams_status_check'
       AND conrelid = 'public.exams'::regclass
  ) THEN
    ALTER TABLE public.exams
      ADD CONSTRAINT exams_status_check
      CHECK (status IN ('published', 'unpublished'));
  END IF;
END;
$$;

CREATE INDEX IF NOT EXISTS exams_family_idx ON public.exams (family);
CREATE INDEX IF NOT EXISTS exams_status_idx ON public.exams (status, is_sample);

ALTER TABLE public.exams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS exams_public_select ON public.exams;
CREATE POLICY exams_public_select
  ON public.exams
  FOR SELECT
  TO anon, authenticated
  USING (status = 'published' OR is_sample = true);

DROP POLICY IF EXISTS exams_admin_all ON public.exams;
CREATE POLICY exams_admin_all
  ON public.exams
  FOR ALL
  TO authenticated
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

GRANT SELECT ON TABLE public.exams TO anon, authenticated;
GRANT INSERT, UPDATE, DELETE ON TABLE public.exams TO authenticated;
