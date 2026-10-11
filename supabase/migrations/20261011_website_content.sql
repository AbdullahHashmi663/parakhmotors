-- Add admin-managed service packages and website copy without overwriting existing data.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('parakh-database-setup'));
ALTER TABLE public.dealership_settings
  ADD COLUMN IF NOT EXISTS website_content JSONB NOT NULL DEFAULT '{}'::jsonb;
CREATE TABLE IF NOT EXISTS public.parakh_migrations (
  id text PRIMARY KEY,
  applied_at timestamptz NOT NULL DEFAULT NOW()
);
ALTER TABLE public.parakh_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.parakh_migrations FROM anon, authenticated;
INSERT INTO public.parakh_migrations (id)
  VALUES ('20261011_website_content')
  ON CONFLICT (id) DO NOTHING;
COMMIT;
