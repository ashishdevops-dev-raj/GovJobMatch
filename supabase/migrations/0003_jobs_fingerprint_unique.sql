-- Idempotent: PostgREST upserts require a UNIQUE constraint on jobs.fingerprint.
-- Safe if 0001/0002 already added the constraint or only a partial unique index.

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
