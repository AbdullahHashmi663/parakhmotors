BEGIN;
SELECT pg_advisory_xact_lock(hashtext('parakh-database-setup'));
CREATE TABLE IF NOT EXISTS public.vehicle_photos (
  id UUID PRIMARY KEY,
  vehicle_id TEXT NOT NULL REFERENCES public.vehicles(id) ON DELETE CASCADE,
  image_data BYTEA NOT NULL,
  mime_type TEXT NOT NULL DEFAULT 'image/webp' CHECK (mime_type = 'image/webp'),
  width INTEGER NOT NULL CHECK (width BETWEEN 1 AND 1600),
  height INTEGER NOT NULL CHECK (height BETWEEN 1 AND 1200),
  size INTEGER NOT NULL CHECK (size BETWEEN 1 AND 524288 AND size = octet_length(image_data)),
  position INTEGER NOT NULL CHECK (position BETWEEN 0 AND 19),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS vehicle_photos_vehicle_idx ON public.vehicle_photos(vehicle_id, position);
ALTER TABLE public.vehicle_photos ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.vehicle_photos FROM anon, authenticated;
CREATE TABLE IF NOT EXISTS public.parakh_migrations (
  id TEXT PRIMARY KEY,
  applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
ALTER TABLE public.parakh_migrations ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.parakh_migrations FROM anon, authenticated;
INSERT INTO public.parakh_migrations (id) VALUES ('20261011_vehicle_photos') ON CONFLICT (id) DO NOTHING;
COMMIT;
