# Structure de données - Profil utilisateur v2

## Les 19 critères de recherche

### 🏠 Bien recherché (6 critères)
1. **Type de bien** → `Appartement` / `Maison` / `Les deux` *(FILTRE STRICT)*
2. **Ville** → `Niort` / `Niort + communes` / etc. *(FILTRE STRICT)*
3. **Quartiers/Zones** → Choix multiple *(FILTRE STRICT - ULTRA IMPORTANT)*
4. **Budget max** → `350k€` (achat) ou `1200€/mois` (location) *(FILTRE STRICT)*
5. **Surface min** → `80m²` / `100m²` / `Flexible` *(FILTRE STRICT si pas flexible)*
6. **Chambres** → `3` / `4+` / `Peu importe` *(FILTRE STRICT si pas "peu importe")*

### 🏢 Caractéristiques physiques (7 critères)
7. **Étage** *(si appart)* → `Pas RDC` / `Dernier étage` / `Peu importe` *(PRÉFÉRENCE)*
8. **Extérieur** → `Jardin obligatoire` / `Balcon suffit` / `Pas nécessaire` *(FILTRE STRICT si "obligatoire")*
9. **Parking** → `Garage obligatoire` / `Place suffit` / `Pas important` *(FILTRE STRICT si "obligatoire")*
10. **État/Âge du bien** → `Neuf uniquement` / `Pas de neuf` / `Récent (<10 ans)` / `Ancien OK` / `À construire` *(FILTRE STRICT)*
11. **Mitoyenneté** *(si maison)* → `Non mitoyenne obligatoire` / `Mitoyenne OK` / `Peu importe` *(FILTRE STRICT si "obligatoire")*
12. **Vis-à-vis** → `Dégagé obligatoire` / `Important` / `Peu importe` *(PRÉFÉRENCE)*
13. **Orientation** → `Sud/Sud-Ouest obligatoire` / `Important` / `Peu importe` *(PRÉFÉRENCE)*

### 🔧 Pratique & Confort (3 critères)
14. **Proximités essentielles** → Choix multiple : `Écoles` / `Transports` / `Commerces` / `Rien` *(PRÉFÉRENCE)*
15. **Travaux acceptés** → `Non` / `Petits travaux` / `Gros travaux OK` *(FILTRE STRICT)*
16. **Copropriété/Charges** *(si appart)* → `Charges < 100€/mois` / `< 200€/mois` / `Peu importe` *(PRÉFÉRENCE)*

### 💼 Situation & Usage (3 critères)
17. **Propriétaire actuel ?** → `Oui` / `Non` / `Préfère ne pas dire` *(ULTRA IMPORTANT modèle économique)*
18. **Usage du bien** → `Résidence principale` / `Investissement locatif` / `Résidence secondaire` *(Change priorités)*
19. **Configuration intérieure** → Choix multiple : `Séjour ouvert obligatoire` / `Cuisine ouverte obligatoire` / `Pièces fermées préférées` / `Flexible` *(PRÉFÉRENCE)*

---

## Migration SQL pour `conversational_profiles`

```sql
-- ============================================
-- MIGRATION : Profil utilisateur structuré v2
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
  IF NEW.property_type_filter IS NOT NULL THEN filled_count := filled_count + 1; END IF;
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
```

---

## Adaptation ACHAT vs LOCATION

### Différences clés

| Critère | ACHAT | LOCATION |
|---------|-------|----------|
| Budget | Prix d'achat (350k€) | Loyer mensuel (1200€/mois) |
| État du bien | Très important (travaux = investissement) | Moins critique (pas propriétaire) |
| Travaux | Deal breaker potentiel | Moins important |
| Charges copro | Bonus/malus | Plus important (impacte budget direct) |
| Proximités | Valeur de revente | Praticité quotidienne |
| Orientation | Valeur long terme | Confort immédiat |

### Questions conditionnelles selon search_type

```typescript
// Si search_type === 'purchase'
- "Acceptez-vous des travaux ?" (impact investissement)
- "État du bien important ?" (valeur patrimoniale)

// Si search_type === 'rental'
- "Meublé ou vide ?"
- "Durée de location souhaitée ?"
- "Charges comprises importantes ?"
```

---

## Format de stockage des réponses

### Exemples de valeurs stockées

```json
{
  "property_type_filter": ["house"],
  "city_filter": "Niort",
  "neighborhoods_filter": ["Centre-ville", "Quartier des Halles"],
  "budget_max": 350000,
  "surface_min": 100,
  "bedrooms_min": 3,
  "must_have_garden": true,
  "state_filter": ["recent", "old"],
  "floor_preference": "not_ground",
  "outdoor_preference": "garden_required",
  "parking_preference": "garage_required",
  "orientation_importance": "important",
  "proximity_priorities": ["schools", "transport"],
  "is_current_owner": false,
  "property_usage": "main_residence",
  "renovation_acceptance": "minor",
  "criteria_filled": 15,
  "profile_completeness_score": 78.95
}
```

### Valeurs normalisées

Toujours utiliser des valeurs enum standardisées pour faciliter le filtrage :

```typescript
// État du bien
type PropertyState = 'new' | 'recent' | 'old' | 'construction' | 'no_new'

// Importance
type Importance = 'required' | 'important' | 'not_important'

// Travaux
type RenovationAcceptance = 'none' | 'minor' | 'major'

// Extérieur
type OutdoorPreference = 'garden_required' | 'balcony_ok' | 'not_needed'
```
