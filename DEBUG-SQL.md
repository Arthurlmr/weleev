# Debug SQL - Vérification des tables Supabase

Execute ces requêtes dans Supabase Dashboard → SQL Editor pour diagnostiquer les problèmes.

## 1. Vérifier la structure de `conversational_profiles`

```sql
-- Vérifier les colonnes de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'conversational_profiles'
ORDER BY ordinal_position;
```

**Résultat attendu :** Tu devrais voir une colonne `profile_completeness_score` de type `numeric`.

## 2. Vérifier les RLS policies de `conversational_profiles`

```sql
-- Vérifier les policies RLS
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual
FROM pg_policies
WHERE tablename = 'conversational_profiles';
```

**Résultat attendu :** Tu devrais voir au moins 3 policies (SELECT, UPDATE, INSERT).

## 3. Vérifier la structure de `ai_property_analysis`

```sql
-- Vérifier les colonnes de la table
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'ai_property_analysis'
ORDER BY ordinal_position;
```

**Résultat attendu :** Tu devrais voir toutes ces colonnes :
- `analyzed_at`
- `global_score`
- `strengths`
- `weaknesses`
- `location_score`, `location_analysis`
- `building_score`, `building_analysis`
- `interior_score`, `interior_analysis`
- `outdoor_score`, `outdoor_analysis`
- `value_score`, `value_analysis`
- `ai_recommendation`

## 4. Test de requête sur `conversational_profiles`

```sql
-- Tester une requête SELECT (remplace USER_ID par ton user_id)
SELECT profile_completeness_score
FROM conversational_profiles
WHERE user_id = 'd63b1d48-cc73-4754-bf74-7ec7de9a32bc';
```

**Si cette requête échoue**, c'est que :
- Soit la colonne n'existe pas → exécute le script SQL que je t'ai donné
- Soit les RLS policies bloquent → exécute les scripts de policies que je t'ai donnés

## 5. Créer les colonnes manquantes si besoin

Si la colonne `profile_completeness_score` n'existe pas :

```sql
ALTER TABLE conversational_profiles
ADD COLUMN IF NOT EXISTS profile_completeness_score NUMERIC DEFAULT 0;
```

Si les colonnes d'`ai_property_analysis` manquent :

```sql
ALTER TABLE ai_property_analysis
ADD COLUMN IF NOT EXISTS analyzed_at TIMESTAMPTZ DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS global_score NUMERIC,
ADD COLUMN IF NOT EXISTS strengths TEXT[],
ADD COLUMN IF NOT EXISTS weaknesses TEXT[],
ADD COLUMN IF NOT EXISTS location_score NUMERIC,
ADD COLUMN IF NOT EXISTS location_analysis TEXT,
ADD COLUMN IF NOT EXISTS building_score NUMERIC,
ADD COLUMN IF NOT EXISTS building_analysis TEXT,
ADD COLUMN IF NOT EXISTS interior_score NUMERIC,
ADD COLUMN IF NOT EXISTS interior_analysis TEXT,
ADD COLUMN IF NOT EXISTS outdoor_score NUMERIC,
ADD COLUMN IF NOT EXISTS outdoor_analysis TEXT,
ADD COLUMN IF NOT EXISTS value_score NUMERIC,
ADD COLUMN IF NOT EXISTS value_analysis TEXT,
ADD COLUMN IF NOT EXISTS ai_recommendation TEXT,
ADD COLUMN IF NOT EXISTS processing_time_ms INTEGER;
```

## 6. Vérifier les variables d'environnement Supabase Edge Functions

Va dans **Supabase Dashboard → Edge Functions → Settings** et vérifie que :

- `GEMINI_API_KEY` est définie
- `SUPABASE_URL` est définie
- `SUPABASE_SERVICE_ROLE_KEY` est définie

Si `GEMINI_API_KEY` n'est pas définie, c'est la raison principale des erreurs 500.
