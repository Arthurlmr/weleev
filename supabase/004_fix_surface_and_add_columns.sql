-- =====================================================
-- FIX SURFACE COLUMN AND ADD MISSING COLUMNS
-- =====================================================
-- Migration to fix surface column type and add missing columns
-- Date : 2025-11-05

-- =====================================================
-- FIX: Change surface column from INTEGER to NUMERIC
-- =====================================================
-- This fixes the error: invalid input syntax for type integer: "93.55"
ALTER TABLE public.melo_properties
ALTER COLUMN surface TYPE NUMERIC(10,2);

-- =====================================================
-- ADD MISSING COLUMNS
-- =====================================================
-- Add columns that are present in Melo.io data but missing from table

-- Add pictures_remote as JSONB (was missing, only TEXT[] images existed)
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS pictures_remote JSONB;

-- Add description
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS description TEXT;

-- Add features array
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS features JSONB;

-- Add DPE (energy rating) fields
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS dpe_category VARCHAR(1),
ADD COLUMN IF NOT EXISTS dpe_value INTEGER;

-- Add GES (greenhouse gas) fields
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS ges_category VARCHAR(1),
ADD COLUMN IF NOT EXISTS ges_value INTEGER;

-- Add geolocation
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS latitude DECIMAL(10, 8),
ADD COLUMN IF NOT EXISTS longitude DECIMAL(11, 8);

-- Add additional property details
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS floor INTEGER,
ADD COLUMN IF NOT EXISTS land_surface INTEGER,
ADD COLUMN IF NOT EXISTS construction_year INTEGER;

-- Add price per meter (NUMERIC for decimals like 3180.12)
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS price_per_meter NUMERIC(10,2);

-- Add agency information
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS agency_name TEXT,
ADD COLUMN IF NOT EXISTS agency_phone TEXT;

-- Add advert URL
ALTER TABLE public.melo_properties
ADD COLUMN IF NOT EXISTS advert_url TEXT;

-- =====================================================
-- CREATE INDEXES FOR NEW COLUMNS
-- =====================================================

-- Index on latitude/longitude for geolocation queries
CREATE INDEX IF NOT EXISTS idx_melo_properties_geolocation
ON public.melo_properties(latitude, longitude)
WHERE latitude IS NOT NULL AND longitude IS NOT NULL;

-- Index on DPE category for energy filtering
CREATE INDEX IF NOT EXISTS idx_melo_properties_dpe
ON public.melo_properties(dpe_category)
WHERE dpe_category IS NOT NULL;

-- =====================================================
-- VERIFICATION
-- =====================================================
-- Verify column types
SELECT
  column_name,
  data_type,
  character_maximum_length,
  numeric_precision,
  numeric_scale
FROM information_schema.columns
WHERE table_schema = 'public'
  AND table_name = 'melo_properties'
  AND column_name IN ('surface', 'price_per_meter', 'latitude', 'longitude')
ORDER BY column_name;
