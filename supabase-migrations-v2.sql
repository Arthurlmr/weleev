-- ============================================
-- MIGRATION : Profil utilisateur structuré v2
-- LUMINᵉ - Système de 19 critères de recherche
-- ============================================
-- Date: 2025-11-09
-- Description: Ajout des colonnes pour filtres stricts, préférences, et métadonnées
-- ============================================

-- 1. Ajouter colonne pour différencier achat/location
ALTER TABLE conversational_profiles
ADD COLUMN IF NOT EXISTS search_type TEXT DEFAULT 'purchase' CHECK (search_type IN ('purchase', 'rental'));

-- 2. Filtres stricts (excluent des annonces)
ALTER TABLE conversational_profiles
ADD COLUMN IF NOT EXISTS property_type_filter TEXT[] DEFAULT ARRAY['both'], -- ['apartment', 'house', 'both']
ADD COLUMN IF NOT EXISTS city_filter TEXT,
ADD COLUMN IF NOT EXISTS neighborhoods_filter TEXT[], -- choix multiple
ADD COLUMN IF NOT EXISTS budget_max INTEGER, -- prix achat OU loyer mensuel
ADD COLUMN IF NOT EXISTS surface_min INTEGER, -- null = flexible
ADD COLUMN IF NOT EXISTS bedrooms_min INTEGER, -- null = flexible
ADD COLUMN IF NOT EXISTS must_have_garden BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS must_have_garage BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS state_filter TEXT[], -- ['new', 'recent', 'old', 'construction', 'no_new']
ADD COLUMN IF NOT EXISTS no_renovation_needed BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS detached_house_only BOOLEAN DEFAULT false; -- si maison

-- 3. Préférences (influencent le score uniquement)
ALTER TABLE conversational_profiles
ADD COLUMN IF NOT EXISTS floor_preference TEXT, -- 'not_ground', 'top_floor', 'no_preference'
ADD COLUMN IF NOT EXISTS outdoor_preference TEXT, -- 'garden_required', 'balcony_ok', 'not_needed'
ADD COLUMN IF NOT EXISTS parking_preference TEXT, -- 'garage_required', 'spot_ok', 'not_important'
ADD COLUMN IF NOT EXISTS orientation_importance TEXT, -- 'required', 'important', 'not_important'
ADD COLUMN IF NOT EXISTS vis_a_vis_importance TEXT, -- 'clear_required', 'important', 'not_important'
ADD COLUMN IF NOT EXISTS proximity_priorities TEXT[], -- ['schools', 'transport', 'shops']
ADD COLUMN IF NOT EXISTS max_charges INTEGER, -- null = peu importe
ADD COLUMN IF NOT EXISTS interior_config_prefs TEXT[]; -- ['open_living', 'open_kitchen', 'closed_rooms', 'flexible']

-- 4. Nouveaux critères (modèle économique + usage)
ALTER TABLE conversational_profiles
ADD COLUMN IF NOT EXISTS is_current_owner BOOLEAN, -- null = préfère ne pas dire
ADD COLUMN IF NOT EXISTS property_usage TEXT CHECK (property_usage IN ('main_residence', 'investment', 'secondary')),
ADD COLUMN IF NOT EXISTS renovation_acceptance TEXT; -- 'none', 'minor', 'major'

-- 5. Métadonnées de progression
ALTER TABLE conversational_profiles
ADD COLUMN IF NOT EXISTS criteria_filled INTEGER DEFAULT 0, -- sur 19
ADD COLUMN IF NOT EXISTS profile_version INTEGER DEFAULT 2; -- v2 = nouvelle structure

-- 6. Index pour performance
CREATE INDEX IF NOT EXISTS idx_conversational_profiles_user_id ON conversational_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_conversational_profiles_budget ON conversational_profiles(budget_max);
CREATE INDEX IF NOT EXISTS idx_conversational_profiles_neighborhoods ON conversational_profiles USING GIN(neighborhoods_filter);

-- 7. Trigger pour calcul automatique du profile_completeness_score
CREATE OR REPLACE FUNCTION calculate_profile_completeness()
RETURNS TRIGGER AS $$
DECLARE
  filled_count INTEGER := 0;
BEGIN
  -- Compter les critères remplis (sur 19)
  IF NEW.property_type_filter IS NOT NULL AND NEW.property_type_filter != ARRAY['both'] THEN filled_count := filled_count + 1; END IF;
  IF NEW.city_filter IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.neighborhoods_filter IS NOT NULL AND array_length(NEW.neighborhoods_filter, 1) > 0 THEN filled_count := filled_count + 1; END IF;
  IF NEW.budget_max IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.surface_min IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.bedrooms_min IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.floor_preference IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.outdoor_preference IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.parking_preference IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.state_filter IS NOT NULL AND array_length(NEW.state_filter, 1) > 0 THEN filled_count := filled_count + 1; END IF;
  IF NEW.detached_house_only IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.vis_a_vis_importance IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.orientation_importance IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.proximity_priorities IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.renovation_acceptance IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.max_charges IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.is_current_owner IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.property_usage IS NOT NULL THEN filled_count := filled_count + 1; END IF;
  IF NEW.interior_config_prefs IS NOT NULL THEN filled_count := filled_count + 1; END IF;

  NEW.criteria_filled := filled_count;
  NEW.profile_completeness_score := (filled_count::NUMERIC / 19) * 100;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_profile_completeness ON conversational_profiles;
CREATE TRIGGER update_profile_completeness
BEFORE INSERT OR UPDATE ON conversational_profiles
FOR EACH ROW
EXECUTE FUNCTION calculate_profile_completeness();

-- 8. Ajouter colonnes pour enrichissement auto dans melo_properties
ALTER TABLE melo_properties
ADD COLUMN IF NOT EXISTS ai_enriched_data JSONB, -- Données enrichies depuis description
ADD COLUMN IF NOT EXISTS ai_enriched_at TIMESTAMPTZ; -- Date enrichissement

-- 9. Index pour enrichissement
CREATE INDEX IF NOT EXISTS idx_melo_properties_ai_enriched ON melo_properties(ai_enriched_at) WHERE ai_enriched_at IS NOT NULL;

-- ============================================
-- FIN DE LA MIGRATION
-- ============================================
-- Instructions après exécution :
-- 1. Vérifier que toutes les colonnes ont été créées : SELECT * FROM conversational_profiles LIMIT 1;
-- 2. Tester le trigger : UPDATE conversational_profiles SET budget_max = 350000 WHERE id = 1;
-- 3. Vérifier que profile_completeness_score se met à jour automatiquement
-- ============================================
