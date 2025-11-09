-- ==========================================================================
-- MIGRATIONS SUPABASE - Refonte LUMINᵉ MVP
-- Date: 2025-11-08
-- Description: Ajout champs IA, scoring, analyses, profils conversationnels
-- ==========================================================================

-- ==========================================================================
-- Migration 1: Champs manquants table melo_properties
-- ==========================================================================

-- Ajouter colonnes manquantes
ALTER TABLE melo_properties
ADD COLUMN IF NOT EXISTS bathrooms INTEGER,
ADD COLUMN IF NOT EXISTS neighborhood TEXT,
ADD COLUMN IF NOT EXISTS neighborhood_description TEXT,
ADD COLUMN IF NOT EXISTS renovation_status TEXT CHECK (renovation_status IN ('renovated', 'new', 'to_renovate')),
ADD COLUMN IF NOT EXISTS tags TEXT[],

-- Données financières
ADD COLUMN IF NOT EXISTS agency_fees NUMERIC,
ADD COLUMN IF NOT EXISTS notary_fees NUMERIC,
ADD COLUMN IF NOT EXISTS property_tax_annual NUMERIC,
ADD COLUMN IF NOT EXISTS monthly_payment_estimate NUMERIC,
ADD COLUMN IF NOT EXISTS energy_cost_estimate NUMERIC,

-- Diagnostics & Risques
ADD COLUMN IF NOT EXISTS flood_risk TEXT CHECK (flood_risk IN ('very_low', 'low', 'moderate', 'high')),
ADD COLUMN IF NOT EXISTS geological_risk TEXT CHECK (geological_risk IN ('none', 'low', 'moderate', 'high')),
ADD COLUMN IF NOT EXISTS pollution_risk TEXT CHECK (pollution_risk IN ('low', 'moderate', 'high')),
ADD COLUMN IF NOT EXISTS asbestos_report TEXT,
ADD COLUMN IF NOT EXISTS termites_report TEXT,
ADD COLUMN IF NOT EXISTS radon_level TEXT;

-- Indexes pour performance
CREATE INDEX IF NOT EXISTS idx_properties_construction_year ON melo_properties(construction_year);
CREATE INDEX IF NOT EXISTS idx_properties_neighborhood ON melo_properties(neighborhood);
CREATE INDEX IF NOT EXISTS idx_properties_renovation_status ON melo_properties(renovation_status);
CREATE INDEX IF NOT EXISTS idx_properties_dpe ON melo_properties(dpe_category);

COMMENT ON COLUMN melo_properties.bathrooms IS 'Nombre de salles de bain';
COMMENT ON COLUMN melo_properties.neighborhood IS 'Quartier (ex: Marais, Presqu''île)';
COMMENT ON COLUMN melo_properties.neighborhood_description IS 'Description courte du quartier';
COMMENT ON COLUMN melo_properties.renovation_status IS 'État de rénovation';
COMMENT ON COLUMN melo_properties.tags IS 'Tags affichés sur la card (Rénové, Énergie A, etc.)';
COMMENT ON COLUMN melo_properties.agency_fees IS 'Frais d''agence estimés (~3% du prix)';
COMMENT ON COLUMN melo_properties.notary_fees IS 'Frais de notaire estimés (~7.5% du prix)';
COMMENT ON COLUMN melo_properties.property_tax_annual IS 'Taxe foncière annuelle estimée';
COMMENT ON COLUMN melo_properties.monthly_payment_estimate IS 'Mensualité de prêt estimée (défaut: 20 ans, 20% apport)';
COMMENT ON COLUMN melo_properties.energy_cost_estimate IS 'Coût énergétique mensuel estimé';

-- ==========================================================================
-- Migration 2: Table ai_property_analysis - Analyses IA des propriétés
-- ==========================================================================

CREATE TABLE IF NOT EXISTS ai_property_analysis (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  property_id INTEGER NOT NULL REFERENCES melo_properties(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Analyse état général (Vision AI)
  general_condition TEXT CHECK (general_condition IN ('excellent', 'good', 'fair', 'poor')),
  general_condition_details TEXT,

  -- Features détectées par Vision AI
  remarked_features TEXT[],

  -- Travaux recommandés
  recommended_works JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"description": "Peinture", "estimatedCost": 3500, "diyCost": 1200, "urgency": "minor"}]
  total_renovation_budget NUMERIC DEFAULT 0,

  -- Données structurées extraites par NLP
  structured_data JSONB DEFAULT '{}'::jsonb,
  -- Format: {"kitchen": "Équipée moderne 10m²", "bathrooms": "1 principale + 1 secondaire", ...}

  -- Métadonnées IA
  vision_model_version TEXT DEFAULT 'gemini-2.0-flash-exp',
  nlp_model_version TEXT DEFAULT 'gemini-2.0-flash-exp',
  vision_confidence_score NUMERIC CHECK (vision_confidence_score >= 0 AND vision_confidence_score <= 1),
  nlp_confidence_score NUMERIC CHECK (nlp_confidence_score >= 0 AND nlp_confidence_score <= 1),

  -- Timestamps analyse
  vision_analyzed_at TIMESTAMPTZ,
  nlp_analyzed_at TIMESTAMPTZ,

  UNIQUE(property_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_ai_analysis_property ON ai_property_analysis(property_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_user ON ai_property_analysis(user_id);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_condition ON ai_property_analysis(general_condition);
CREATE INDEX IF NOT EXISTS idx_ai_analysis_updated ON ai_property_analysis(updated_at DESC);

COMMENT ON TABLE ai_property_analysis IS 'Analyses IA des propriétés (Vision + NLP)';
COMMENT ON COLUMN ai_property_analysis.general_condition IS 'État général détecté par Vision AI';
COMMENT ON COLUMN ai_property_analysis.remarked_features IS 'Éléments remarquables (parquet, moulures, etc.)';
COMMENT ON COLUMN ai_property_analysis.recommended_works IS 'Travaux recommandés avec coûts estimés';
COMMENT ON COLUMN ai_property_analysis.structured_data IS 'Données extraites du texte par NLP';

-- Fonction pour mettre à jour updated_at automatiquement
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
   NEW.updated_at = NOW();
   RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_ai_analysis_updated_at
BEFORE UPDATE ON ai_property_analysis
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- Migration 3: Table user_property_scores - Scoring personnalisé
-- ==========================================================================

CREATE TABLE IF NOT EXISTS user_property_scores (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES melo_properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Score personnalisé (0-10)
  personalized_score NUMERIC NOT NULL CHECK (personalized_score >= 0 AND personalized_score <= 10),

  -- Décomposition du score
  score_breakdown JSONB DEFAULT '{}'::jsonb,
  -- Format: {"criteriaMatch": 8.5, "lifestyleMatch": 9.0, "valueForMoney": 7.8, "bonusFactors": 8.2}

  -- Match avec critères utilisateur (%)
  criteria_match_percentage NUMERIC CHECK (criteria_match_percentage >= 0 AND criteria_match_percentage <= 100),

  -- Badge de recommandation
  recommendation_badge TEXT CHECK (recommendation_badge IN ('recommended', 'favorite', 'trending')),
  recommendation_reason TEXT,

  -- Métadonnées scoring
  scoring_algorithm_version TEXT DEFAULT 'v1.0',
  factors_used JSONB DEFAULT '[]'::jsonb,  -- Liste des facteurs pris en compte

  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_scores_user_score ON user_property_scores(user_id, personalized_score DESC);
CREATE INDEX IF NOT EXISTS idx_scores_property ON user_property_scores(property_id);
CREATE INDEX IF NOT EXISTS idx_scores_badge ON user_property_scores(recommendation_badge);
CREATE INDEX IF NOT EXISTS idx_scores_updated ON user_property_scores(updated_at DESC);

COMMENT ON TABLE user_property_scores IS 'Scores personnalisés par utilisateur pour chaque propriété';
COMMENT ON COLUMN user_property_scores.personalized_score IS 'Score IA personnalisé (ex: 9.2/10)';
COMMENT ON COLUMN user_property_scores.score_breakdown IS 'Détail des composantes du score';
COMMENT ON COLUMN user_property_scores.recommendation_badge IS 'Badge affiché sur la card (Recommandé, Coup de cœur, Tendance)';

CREATE TRIGGER update_user_scores_updated_at
BEFORE UPDATE ON user_property_scores
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- Migration 4: Table conversational_profiles - Profils conversationnels
-- ==========================================================================

CREATE TABLE IF NOT EXISTS conversational_profiles (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Historique de conversation avec le chatbot
  conversation_history JSONB DEFAULT '[]'::jsonb,
  -- Format: [{"question": "...", "answer": "...", "timestamp": "..."}]

  -- Préférences extraites par l'IA
  lifestyle_preferences TEXT[] DEFAULT '{}',  -- ["calme", "proche transports", ...]
  priorities TEXT[] DEFAULT '{}',             -- ["luminosité", "espace", ...]
  deal_breakers TEXT[] DEFAULT '{}',          -- ["bruit", "travaux lourds", ...]
  future_projects TEXT[] DEFAULT '{}',        -- ["agrandissement", "revente 5 ans", ...]

  -- Métadonnées
  total_interactions INTEGER DEFAULT 0,
  last_interaction_at TIMESTAMPTZ,
  profile_completeness_score NUMERIC DEFAULT 0 CHECK (profile_completeness_score >= 0 AND profile_completeness_score <= 100),

  -- Modèle utilisé
  ai_model_version TEXT DEFAULT 'gemini-2.0-flash-exp'
);

CREATE INDEX IF NOT EXISTS idx_conv_profiles_user ON conversational_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_conv_profiles_completeness ON conversational_profiles(profile_completeness_score DESC);
CREATE INDEX IF NOT EXISTS idx_conv_profiles_last_interaction ON conversational_profiles(last_interaction_at DESC);

COMMENT ON TABLE conversational_profiles IS 'Profils utilisateur enrichis via chatbot conversationnel';
COMMENT ON COLUMN conversational_profiles.conversation_history IS 'Historique complet des échanges avec le chatbot';
COMMENT ON COLUMN conversational_profiles.lifestyle_preferences IS 'Préférences de style de vie extraites';
COMMENT ON COLUMN conversational_profiles.priorities IS 'Priorités utilisateur (luminosité, espace, etc.)';
COMMENT ON COLUMN conversational_profiles.deal_breakers IS 'Deal-breakers absolus';
COMMENT ON COLUMN conversational_profiles.profile_completeness_score IS 'Score de complétude du profil (0-100%)';

CREATE TRIGGER update_conv_profiles_updated_at
BEFORE UPDATE ON conversational_profiles
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- Migration 5: Table saved_searches_enhanced - Recherches sauvegardées +
-- ==========================================================================

CREATE TABLE IF NOT EXISTS saved_searches_enhanced (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  search_id INTEGER NOT NULL REFERENCES searches(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  -- Nom personnalisé de la recherche
  name TEXT NOT NULL,

  -- Compteurs & Alertes
  new_results_count INTEGER DEFAULT 0,
  price_alerts_enabled BOOLEAN DEFAULT TRUE,
  email_notifications_enabled BOOLEAN DEFAULT TRUE,

  -- Seuils alertes prix
  price_alert_threshold_percentage NUMERIC DEFAULT 5.0,  -- Alerte si prix baisse de 5%+

  -- Dernières actions
  last_notified_at TIMESTAMPTZ,
  last_check_at TIMESTAMPTZ DEFAULT NOW(),

  -- Préférences notification
  notification_frequency TEXT DEFAULT 'daily' CHECK (notification_frequency IN ('instant', 'daily', 'weekly')),

  UNIQUE(user_id, search_id)
);

CREATE INDEX IF NOT EXISTS idx_saved_searches_user ON saved_searches_enhanced(user_id);
CREATE INDEX IF NOT EXISTS idx_saved_searches_new_results ON saved_searches_enhanced(new_results_count DESC);
CREATE INDEX IF NOT EXISTS idx_saved_searches_alerts ON saved_searches_enhanced(price_alerts_enabled, email_notifications_enabled);

COMMENT ON TABLE saved_searches_enhanced IS 'Recherches sauvegardées avec alertes et notifications';
COMMENT ON COLUMN saved_searches_enhanced.name IS 'Nom personnalisé donné par l''utilisateur';
COMMENT ON COLUMN saved_searches_enhanced.new_results_count IS 'Nombre de nouvelles annonces depuis dernière visite';
COMMENT ON COLUMN saved_searches_enhanced.price_alerts_enabled IS 'Activer alertes baisse de prix';

CREATE TRIGGER update_saved_searches_updated_at
BEFORE UPDATE ON saved_searches_enhanced
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- ==========================================================================
-- Migration 6: Table property_recommendations - Recommandations IA
-- ==========================================================================

CREATE TABLE IF NOT EXISTS property_recommendations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES melo_properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  -- Raison de la recommandation
  reason TEXT NOT NULL,  -- "Correspond à votre recherche Paris 11ᵉ"

  -- Score de match (%)
  match_score NUMERIC NOT NULL CHECK (match_score >= 0 AND match_score <= 100),

  -- Type de recommandation
  recommendation_type TEXT CHECK (recommendation_type IN ('search_match', 'similar_property', 'price_drop', 'trending')),

  -- Métadonnées
  is_viewed BOOLEAN DEFAULT FALSE,
  is_dismissed BOOLEAN DEFAULT FALSE,
  viewed_at TIMESTAMPTZ,
  dismissed_at TIMESTAMPTZ,

  UNIQUE(user_id, property_id, recommendation_type)
);

CREATE INDEX IF NOT EXISTS idx_recommendations_user ON property_recommendations(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_property ON property_recommendations(property_id);
CREATE INDEX IF NOT EXISTS idx_recommendations_match_score ON property_recommendations(match_score DESC);
CREATE INDEX IF NOT EXISTS idx_recommendations_not_viewed ON property_recommendations(user_id, is_viewed, is_dismissed);

COMMENT ON TABLE property_recommendations IS 'Recommandations de propriétés générées par l''IA';
COMMENT ON COLUMN property_recommendations.reason IS 'Raison affichée à l''utilisateur';
COMMENT ON COLUMN property_recommendations.match_score IS 'Pourcentage de correspondance avec profil utilisateur';

-- ==========================================================================
-- Migration 7: RLS (Row Level Security) Policies
-- ==========================================================================

-- Enable RLS on all new tables
ALTER TABLE ai_property_analysis ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_property_scores ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversational_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE saved_searches_enhanced ENABLE ROW LEVEL SECURITY;
ALTER TABLE property_recommendations ENABLE ROW LEVEL SECURITY;

-- ai_property_analysis policies
CREATE POLICY "Users can view their own AI analyses"
  ON ai_property_analysis FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own AI analyses"
  ON ai_property_analysis FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own AI analyses"
  ON ai_property_analysis FOR UPDATE
  USING (auth.uid() = user_id);

-- user_property_scores policies
CREATE POLICY "Users can view their own scores"
  ON user_property_scores FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own scores"
  ON user_property_scores FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own scores"
  ON user_property_scores FOR UPDATE
  USING (auth.uid() = user_id);

-- conversational_profiles policies
CREATE POLICY "Users can view their own profile"
  ON conversational_profiles FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own profile"
  ON conversational_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own profile"
  ON conversational_profiles FOR UPDATE
  USING (auth.uid() = user_id);

-- saved_searches_enhanced policies
CREATE POLICY "Users can view their own saved searches"
  ON saved_searches_enhanced FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own saved searches"
  ON saved_searches_enhanced FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own saved searches"
  ON saved_searches_enhanced FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own saved searches"
  ON saved_searches_enhanced FOR DELETE
  USING (auth.uid() = user_id);

-- property_recommendations policies
CREATE POLICY "Users can view their own recommendations"
  ON property_recommendations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own recommendations"
  ON property_recommendations FOR UPDATE
  USING (auth.uid() = user_id);

-- ==========================================================================
-- Migration 8: Fonctions utilitaires
-- ==========================================================================

-- Fonction pour calculer les frais automatiquement
CREATE OR REPLACE FUNCTION calculate_property_fees()
RETURNS TRIGGER AS $$
BEGIN
  -- Frais d'agence (~3% du prix)
  IF NEW.agency_fees IS NULL THEN
    NEW.agency_fees := NEW.price * 0.03;
  END IF;

  -- Frais de notaire (~7.5% du prix pour ancien, ~2.5% pour neuf)
  IF NEW.notary_fees IS NULL THEN
    IF NEW.construction_year IS NOT NULL AND NEW.construction_year >= EXTRACT(YEAR FROM NOW()) - 5 THEN
      NEW.notary_fees := NEW.price * 0.025;  -- Neuf
    ELSE
      NEW.notary_fees := NEW.price * 0.075;  -- Ancien
    END IF;
  END IF;

  -- Taxe foncière (~0.3% du prix annuel en estimation)
  IF NEW.property_tax_annual IS NULL THEN
    NEW.property_tax_annual := NEW.price * 0.003;
  END IF;

  -- Mensualité estimée (20% apport, 20 ans, 3.85% taux)
  IF NEW.monthly_payment_estimate IS NULL AND NEW.price IS NOT NULL THEN
    DECLARE
      loan_amount NUMERIC := NEW.price * 0.8;
      monthly_rate NUMERIC := 0.0385 / 12;
      num_payments INTEGER := 20 * 12;
    BEGIN
      NEW.monthly_payment_estimate := (loan_amount * monthly_rate * POWER(1 + monthly_rate, num_payments)) /
                                      (POWER(1 + monthly_rate, num_payments) - 1);
    END;
  END IF;

  -- Coût énergétique estimé (basé sur DPE)
  IF NEW.energy_cost_estimate IS NULL AND NEW.surface IS NOT NULL THEN
    CASE
      WHEN NEW.dpe_category = 'A' THEN NEW.energy_cost_estimate := 50;
      WHEN NEW.dpe_category = 'B' THEN NEW.energy_cost_estimate := 75;
      WHEN NEW.dpe_category = 'C' THEN NEW.energy_cost_estimate := 100;
      WHEN NEW.dpe_category = 'D' THEN NEW.energy_cost_estimate := 130;
      WHEN NEW.dpe_category = 'E' THEN NEW.energy_cost_estimate := 170;
      WHEN NEW.dpe_category = 'F' THEN NEW.energy_cost_estimate := 220;
      WHEN NEW.dpe_category = 'G' THEN NEW.energy_cost_estimate := 300;
      ELSE NEW.energy_cost_estimate := 120;  -- Défaut
    END CASE;
  END IF;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER calculate_fees_before_insert
BEFORE INSERT ON melo_properties
FOR EACH ROW
EXECUTE FUNCTION calculate_property_fees();

CREATE TRIGGER calculate_fees_before_update
BEFORE UPDATE ON melo_properties
FOR EACH ROW
WHEN (OLD.price IS DISTINCT FROM NEW.price OR
      OLD.construction_year IS DISTINCT FROM NEW.construction_year OR
      OLD.dpe_category IS DISTINCT FROM NEW.dpe_category)
EXECUTE FUNCTION calculate_property_fees();

-- ==========================================================================
-- Migration 9: Vues utiles pour l'application
-- ==========================================================================

-- Vue: Propriétés enrichies avec score utilisateur
CREATE OR REPLACE VIEW enriched_properties AS
SELECT
  p.*,
  ups.personalized_score,
  ups.recommendation_badge,
  ups.recommendation_reason,
  ai.general_condition,
  ai.remarked_features,
  ai.total_renovation_budget
FROM melo_properties p
LEFT JOIN user_property_scores ups ON p.id = ups.property_id
LEFT JOIN ai_property_analysis ai ON p.id = ai.property_id;

COMMENT ON VIEW enriched_properties IS 'Vue complète des propriétés avec scores et analyses IA';

-- Vue: Dashboard utilisateur
CREATE OR REPLACE VIEW user_dashboard AS
SELECT
  u.id as user_id,
  u.email,
  COUNT(DISTINCT s.id) as total_searches,
  COUNT(DISTINCT sse.id) as saved_searches_count,
  SUM(sse.new_results_count) as total_new_results,
  COUNT(DISTINCT pr.id) as recommendations_count,
  cp.profile_completeness_score,
  cp.total_interactions as chatbot_interactions
FROM auth.users u
LEFT JOIN searches s ON u.id = s.user_id
LEFT JOIN saved_searches_enhanced sse ON u.id = sse.user_id
LEFT JOIN property_recommendations pr ON u.id = pr.user_id AND pr.is_viewed = FALSE
LEFT JOIN conversational_profiles cp ON u.id = cp.user_id
GROUP BY u.id, u.email, cp.profile_completeness_score, cp.total_interactions;

COMMENT ON VIEW user_dashboard IS 'Vue dashboard utilisateur avec stats';

-- ==========================================================================
-- FIN DES MIGRATIONS
-- ==========================================================================

-- Vérification finale
DO $$
BEGIN
  RAISE NOTICE 'Migrations terminées avec succès!';
  RAISE NOTICE 'Tables créées:';
  RAISE NOTICE '  - ai_property_analysis';
  RAISE NOTICE '  - user_property_scores';
  RAISE NOTICE '  - conversational_profiles';
  RAISE NOTICE '  - saved_searches_enhanced';
  RAISE NOTICE '  - property_recommendations';
  RAISE NOTICE 'Policies RLS activées';
  RAISE NOTICE 'Triggers et fonctions créés';
END $$;

-- ==========================================================================
-- Migration 6: Table user_favorites - Favoris utilisateur
-- ==========================================================================

CREATE TABLE IF NOT EXISTS user_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  property_id INTEGER NOT NULL REFERENCES melo_properties(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, property_id)
);

CREATE INDEX IF NOT EXISTS idx_favorites_user ON user_favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_property ON user_favorites(property_id);
CREATE INDEX IF NOT EXISTS idx_favorites_created ON user_favorites(created_at DESC);

COMMENT ON TABLE user_favorites IS 'Propriétés favorites des utilisateurs';
COMMENT ON COLUMN user_favorites.user_id IS 'Utilisateur qui a mis en favori';
COMMENT ON COLUMN user_favorites.property_id IS 'Propriété mise en favori';

-- RLS Policy pour user_favorites
ALTER TABLE user_favorites ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own favorites"
  ON user_favorites FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own favorites"
  ON user_favorites FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete their own favorites"
  ON user_favorites FOR DELETE
  USING (auth.uid() = user_id);

