-- Email is a follow-up option on customer requests; phone remains the required contact method.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('parakh-database-setup'));

ALTER TABLE public.inspections ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.inquiries ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.sell_requests ALTER COLUMN email DROP NOT NULL;
ALTER TABLE public.find_requests ALTER COLUMN email DROP NOT NULL;

CREATE TABLE IF NOT EXISTS public.parakh_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.parakh_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.parakh_migrations FROM anon, authenticated;
INSERT INTO public.parakh_migrations (id)
VALUES ('20261011_optional_customer_email')
ON CONFLICT (id) DO NOTHING;

COMMIT;
