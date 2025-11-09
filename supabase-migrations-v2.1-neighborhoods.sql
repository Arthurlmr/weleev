-- =====================================================
-- Migration v2.1 : Système de quartiers dynamiques IA
-- =====================================================

-- Table pour stocker les quartiers générés par IA pour chaque ville
CREATE TABLE IF NOT EXISTS city_neighborhoods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  city TEXT NOT NULL,
  postal_code TEXT,
  name TEXT NOT NULL,
  zone TEXT, -- 'centre' | 'nord' | 'sud' | 'est' | 'ouest' | 'limitrophe' | etc
  type TEXT, -- 'quartier' | 'commune' | 'secteur'
  description TEXT,
  generated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(city, name)
);

-- Index pour recherche rapide par ville
CREATE INDEX IF NOT EXISTS idx_city_neighborhoods_city ON city_neighborhoods(city);
CREATE INDEX IF NOT EXISTS idx_city_neighborhoods_postal ON city_neighborhoods(postal_code);

-- Table pour les quartiers personnalisés ajoutés par les utilisateurs
CREATE TABLE IF NOT EXISTS user_custom_neighborhoods (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  city TEXT NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, city, name)
);

-- Index pour récupération rapide des quartiers custom d'un user
CREATE INDEX IF NOT EXISTS idx_user_custom_neighborhoods_user ON user_custom_neighborhoods(user_id);

-- =====================================================
-- COMMANDE DE RESET POUR TESTS (⚠️ UTILISER AVEC PRÉCAUTION)
-- =====================================================

-- Cette commande supprime TOUS les utilisateurs et leurs données
-- À utiliser uniquement en développement pour tester de bout en bout

-- ⚠️ DÉCOMMENTER LA SECTION CI-DESSOUS POUR EXÉCUTER LE RESET ⚠️

/*
-- Supprimer les quartiers custom
DELETE FROM user_custom_neighborhoods;

-- Supprimer les profils conversationnels
DELETE FROM conversational_profiles;

-- Supprimer les analyses IA
DELETE FROM ai_property_analysis;

-- Supprimer les utilisateurs (CASCADE supprimera aussi auth.users)
-- Note: Cette commande nécessite les droits admin sur auth.users
-- Si erreur, supprimer manuellement depuis Supabase Dashboard > Authentication
DELETE FROM auth.users;

-- Reset les quartiers générés (optionnel, si tu veux que l'IA régénère)
DELETE FROM city_neighborhoods;
*/

-- =====================================================
-- Fonction helper pour récupérer tous les quartiers d'une ville
-- (quartiers IA + quartiers custom de l'utilisateur)
-- =====================================================

CREATE OR REPLACE FUNCTION get_neighborhoods_for_city(
  p_city TEXT,
  p_user_id UUID DEFAULT NULL
)
RETURNS TABLE (
  name TEXT,
  zone TEXT,
  type TEXT,
  is_custom BOOLEAN
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    cn.name,
    cn.zone,
    cn.type,
    false AS is_custom
  FROM city_neighborhoods cn
  WHERE cn.city = p_city

  UNION ALL

  SELECT
    ucn.name,
    NULL AS zone,
    'custom' AS type,
    true AS is_custom
  FROM user_custom_neighborhoods ucn
  WHERE ucn.city = p_city
    AND (p_user_id IS NULL OR ucn.user_id = p_user_id);
END;
$$ LANGUAGE plpgsql;

-- Exemple d'utilisation :
-- SELECT * FROM get_neighborhoods_for_city('Niort', 'user-uuid');
