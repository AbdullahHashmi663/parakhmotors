-- Private car photos submitted with a selling request. Existing requests remain unchanged.
BEGIN;
SELECT pg_advisory_xact_lock(hashtext('parakh-database-setup'));
CREATE TABLE IF NOT EXISTS public.sell_request_photos (
  id UUID PRIMARY KEY,
  request_id TEXT NOT NULL REFERENCES public.sell_requests(id) ON DELETE CASCADE,
  image_data BYTEA NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/webp' CHECK (mime_type = 'image/webp'),
  width INTEGER NOT NULL CHECK (width BETWEEN 1 AND 1600),
  height INTEGER NOT NULL CHECK (height BETWEEN 1 AND 1200),
  size INTEGER NOT NULL CHECK (size BETWEEN 1 AND 524288 AND size = octet_length(image_data)),
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 5),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE (request_id, position)
);
ALTER TABLE public.sell_request_photos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.sell_request_photos FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS public.parakh_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.parakh_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.parakh_migrations FROM anon, authenticated;
INSERT INTO public.parakh_migrations (id) VALUES ('20261011_sell_request_photos') ON CONFLICT (id) DO NOTHING;
COMMIT;
