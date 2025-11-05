-- =====================================================
-- MELO.IO INTEGRATION - TABLES ET POLICIES
-- =====================================================
-- Migration pour intégrer l'API Melo.io
-- Tables : melo_searches, melo_properties
-- Date : 2025-11-05

-- =====================================================
-- TABLE: melo_searches
-- =====================================================
-- Stocke les recherches Melo.io associées aux utilisateurs
CREATE TABLE IF NOT EXISTS public.melo_searches (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  search_id BIGINT NOT NULL REFERENCES public.searches(id) ON DELETE CASCADE,

  -- Référence Melo
  melo_uuid UUID NOT NULL UNIQUE,
  melo_token TEXT,

  -- Données de recherche (pour faciliter les updates)
  location_id TEXT NOT NULL,  -- "/cities/75056"
  location_name TEXT NOT NULL, -- "Paris"
  transaction_type INTEGER NOT NULL, -- 0=Vente, 1=Location
  property_types INTEGER[] NOT NULL, -- [0, 1]
  budget_max INTEGER NOT NULL,
  room_min INTEGER,

  -- Configuration complète Melo (JSONB)
  melo_search_data JSONB NOT NULL,

  -- Statut
  last_synced_at TIMESTAMP WITH TIME ZONE,

  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_search UNIQUE(user_id, search_id)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_melo_searches_user_id ON public.melo_searches(user_id);
CREATE INDEX IF NOT EXISTS idx_melo_searches_melo_uuid ON public.melo_searches(melo_uuid);
CREATE INDEX IF NOT EXISTS idx_melo_searches_search_id ON public.melo_searches(search_id);

-- Enable Row Level Security
ALTER TABLE public.melo_searches ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own melo searches"
  ON public.melo_searches FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own melo searches"
  ON public.melo_searches FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own melo searches"
  ON public.melo_searches FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own melo searches"
  ON public.melo_searches FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TABLE: melo_properties
-- =====================================================
-- Stocke les annonces immobilières de Melo.io
CREATE TABLE IF NOT EXISTS public.melo_properties (
  id BIGSERIAL PRIMARY KEY,
  melo_uuid UUID NOT NULL,
  user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  melo_search_id BIGINT REFERENCES public.melo_searches(id) ON DELETE CASCADE,

  -- Données complètes de la propriété (JSONB)
  property_data JSONB NOT NULL,

  -- Champs dénormalisés pour requêtes rapides
  title TEXT NOT NULL,
  price INTEGER NOT NULL,
  surface INTEGER,
  rooms INTEGER,
  bedrooms INTEGER,
  city TEXT NOT NULL,
  zipcode TEXT,
  property_type TEXT NOT NULL, -- 'apartment' | 'house'
  transaction_type INTEGER NOT NULL, -- 0=Vente, 1=Location

  -- Médias
  main_image TEXT,
  images TEXT[],
  virtual_tour TEXT,

  -- Statut utilisateur
  is_favorite BOOLEAN DEFAULT FALSE,
  is_viewed BOOLEAN DEFAULT FALSE,
  is_hidden BOOLEAN DEFAULT FALSE,

  -- Dates
  melo_created_at TIMESTAMP WITH TIME ZONE NOT NULL,
  melo_updated_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  CONSTRAINT unique_user_property UNIQUE(user_id, melo_uuid)
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_melo_properties_user_id ON public.melo_properties(user_id);
CREATE INDEX IF NOT EXISTS idx_melo_properties_melo_uuid ON public.melo_properties(melo_uuid);
CREATE INDEX IF NOT EXISTS idx_melo_properties_melo_search_id ON public.melo_properties(melo_search_id);
CREATE INDEX IF NOT EXISTS idx_melo_properties_price ON public.melo_properties(price);
CREATE INDEX IF NOT EXISTS idx_melo_properties_created_at ON public.melo_properties(melo_created_at DESC);
CREATE INDEX IF NOT EXISTS idx_melo_properties_favorites ON public.melo_properties(user_id, is_favorite) WHERE is_favorite = true;
CREATE INDEX IF NOT EXISTS idx_melo_properties_visible ON public.melo_properties(user_id, is_hidden) WHERE is_hidden = false;

-- Enable Row Level Security
ALTER TABLE public.melo_properties ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Users can view their own melo properties"
  ON public.melo_properties FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own melo properties"
  ON public.melo_properties FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own melo properties"
  ON public.melo_properties FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own melo properties"
  ON public.melo_properties FOR DELETE
  USING (auth.uid() = user_id);

-- =====================================================
-- TRIGGER: updated_at
-- =====================================================
-- Mettre à jour automatiquement updated_at

CREATE TRIGGER set_updated_at_melo_searches
  BEFORE UPDATE ON public.melo_searches
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_updated_at_melo_properties
  BEFORE UPDATE ON public.melo_properties
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_updated_at();

-- =====================================================
-- VÉRIFICATION
-- =====================================================
-- Vérifier que les tables sont bien créées
SELECT
  'melo_searches' as table_name,
  COUNT(*) as row_count
FROM public.melo_searches
UNION ALL
SELECT
  'melo_properties' as table_name,
  COUNT(*) as row_count
FROM public.melo_properties;
