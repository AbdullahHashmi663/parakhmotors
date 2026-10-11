-- ==============================================================================
-- PARAKH MOTORS — COMPLETE SUPABASE DATABASE SCHEMA
-- Compatible with PostgreSQL 15+ / Supabase
-- ==============================================================================

-- 1. THEMES TABLE (8 Trending Themes + Admin Custom Themes)
CREATE TABLE IF NOT EXISTS public.themes (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  category TEXT NOT NULL,
  description TEXT,
  background TEXT NOT NULL,
  foreground TEXT NOT NULL,
  card_bg TEXT NOT NULL,
  border_color TEXT NOT NULL,
  primary_color TEXT NOT NULL,
  accent TEXT NOT NULL,
  glow_color TEXT NOT NULL,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. VEHICLES (INVENTORY)
CREATE TABLE IF NOT EXISTS public.vehicles (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  price BIGINT NOT NULL,
  mileage INTEGER NOT NULL,
  fuel_type TEXT NOT NULL,
  transmission TEXT NOT NULL,
  body_type TEXT NOT NULL,
  condition TEXT NOT NULL,
  inspection_score INTEGER DEFAULT 95,
  color TEXT NOT NULL,
  location TEXT NOT NULL,
  status TEXT DEFAULT 'available',
  featured BOOLEAN DEFAULT false,
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  features TEXT[] DEFAULT ARRAY[]::TEXT[],
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INSPECTION BOOKINGS (200+ Point Inspection)
CREATE TABLE IF NOT EXISTS public.inspections (
  id TEXT PRIMARY KEY,
  customer_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  city TEXT NOT NULL,
  car_make TEXT NOT NULL,
  car_model TEXT NOT NULL,
  car_year INTEGER NOT NULL,
  package_type TEXT NOT NULL,
  preferred_date TEXT NOT NULL,
  preferred_time_slot TEXT,
  location_address TEXT,
  status TEXT DEFAULT 'pending',
  estimated_fee INTEGER DEFAULT 0,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. CUSTOMER INQUIRIES & TEST DRIVE REQUESTS
CREATE TABLE IF NOT EXISTS public.inquiries (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  type TEXT DEFAULT 'general',
  vehicle_id TEXT REFERENCES public.vehicles(id) ON DELETE SET NULL,
  message TEXT NOT NULL,
  status TEXT DEFAULT 'new',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. SELL CAR REQUESTS
CREATE TABLE IF NOT EXISTS public.sell_requests (
  id TEXT PRIMARY KEY,
  seller_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  city TEXT NOT NULL,
  brand TEXT NOT NULL,
  model TEXT NOT NULL,
  year INTEGER NOT NULL,
  mileage INTEGER NOT NULL,
  expected_price BIGINT NOT NULL,
  estimated_market_value_min BIGINT DEFAULT 0,
  estimated_market_value_max BIGINT DEFAULT 0,
  condition_description TEXT,
  status TEXT DEFAULT 'received',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5B. SELL REQUEST PHOTOS
-- Private uploads belong to a selling request and are deleted with it.
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

-- 6. CAR FINDER REQUESTS
CREATE TABLE IF NOT EXISTS public.find_requests (
  id TEXT PRIMARY KEY,
  buyer_name TEXT NOT NULL,
  phone TEXT NOT NULL,
  email TEXT NOT NULL,
  target_brand TEXT NOT NULL,
  target_model TEXT NOT NULL,
  min_year INTEGER NOT NULL,
  budget_max BIGINT NOT NULL,
  preferred_city TEXT NOT NULL,
  notes TEXT,
  status TEXT DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. DEALERSHIP SETTINGS
CREATE TABLE IF NOT EXISTS public.dealership_settings (
  id TEXT PRIMARY KEY DEFAULT 'main_settings',
  dealership_name TEXT DEFAULT 'Parakh Motors',
  tagline TEXT DEFAULT 'TRUST BETTER — BUY & SELL FEARLESSLY TRUST DELIVERED',
  phone TEXT DEFAULT '+92 321 8466662',
  whatsapp TEXT DEFAULT '+923218466662',
  email TEXT DEFAULT 'info@parakhmotors.com',
  address TEXT DEFAULT 'Main Boulevard, Gulberg III, Lahore, Pakistan',
  working_hours TEXT DEFAULT 'Mon - Sat: 10:00 AM - 08:00 PM',
  announcement TEXT DEFAULT 'Ramadan Special: Complimentary 200+ Point Inspection on all certified bookings!',
  currency TEXT DEFAULT 'PKR',
  hero_headline TEXT DEFAULT 'PAKISTAN''S PREMIER CURATED LUXURY AUTOMOTIVE DEALERSHIP',
  hero_subheadline TEXT DEFAULT 'Uncompromising luxury, certified forensic inspections, and verified ownership history.',
  active_theme_id TEXT DEFAULT 'parakh-rosso',
  website_content JSONB NOT NULL DEFAULT '{}'::jsonb,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Allows the schema to be applied to an existing deployment without replacing settings.
ALTER TABLE public.dealership_settings ADD COLUMN IF NOT EXISTS website_content JSONB NOT NULL DEFAULT '{}'::jsonb;

-- ENABLE ROW LEVEL SECURITY
ALTER TABLE public.themes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.vehicles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inspections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sell_request_photos ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.find_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.dealership_settings ENABLE ROW LEVEL SECURITY;

-- PUBLIC READ ACCESS FOR SHOWROOM
DROP POLICY IF EXISTS "Public Read Themes" ON public.themes;
DROP POLICY IF EXISTS "Public Read Vehicles" ON public.vehicles;
DROP POLICY IF EXISTS "Public Read Settings" ON public.dealership_settings;
CREATE POLICY "Public Read Themes" ON public.themes FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Vehicles" ON public.vehicles FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "Public Read Settings" ON public.dealership_settings FOR SELECT TO anon, authenticated USING (true);

-- Submissions go through validated server routes. Customer data has no public policies.
DROP POLICY IF EXISTS "Public Insert Inquiries" ON public.inquiries;
DROP POLICY IF EXISTS "Public Insert Inspections" ON public.inspections;
DROP POLICY IF EXISTS "Public Insert Sell Requests" ON public.sell_requests;
DROP POLICY IF EXISTS "Public Insert Find Requests" ON public.find_requests;
REVOKE ALL ON public.themes, public.vehicles, public.dealership_settings,
  public.inspections, public.inquiries, public.sell_requests, public.sell_request_photos, public.find_requests FROM anon, authenticated;
GRANT SELECT ON public.themes, public.vehicles, public.dealership_settings TO anon, authenticated;

CREATE UNIQUE INDEX IF NOT EXISTS themes_one_active ON public.themes (is_active) WHERE is_active;
CREATE INDEX IF NOT EXISTS vehicles_created ON public.vehicles (created_at DESC);
CREATE INDEX IF NOT EXISTS inspections_status_created ON public.inspections (status, created_at DESC);
CREATE INDEX IF NOT EXISTS inquiries_status_created ON public.inquiries (status, created_at DESC);
CREATE INDEX IF NOT EXISTS sell_requests_status_created ON public.sell_requests (status, created_at DESC);
CREATE INDEX IF NOT EXISTS find_requests_status_created ON public.find_requests (status, created_at DESC);
