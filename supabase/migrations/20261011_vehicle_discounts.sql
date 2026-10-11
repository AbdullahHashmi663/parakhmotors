ALTER TABLE public.vehicles
  ADD COLUMN IF NOT EXISTS discount_price BIGINT;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'vehicles_discount_price_valid'
      AND conrelid = 'public.vehicles'::regclass
  ) THEN
    ALTER TABLE public.vehicles
      ADD CONSTRAINT vehicles_discount_price_valid
      CHECK (discount_price IS NULL OR (discount_price > 0 AND discount_price < price));
  END IF;
END $$;
