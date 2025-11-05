-- =====================================================
-- SCRIPT DE CORRECTION DU TRIGGER MANQUANT
-- =====================================================
-- Ce script recrée le trigger on_auth_user_created qui peut manquer
-- Exécutez ce script dans le SQL Editor de Supabase

-- Étape 1 : Vérifier que la fonction handle_new_user existe
-- Cette requête doit retourner 1 ligne
SELECT
  routine_name,
  routine_type,
  routine_schema
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name = 'handle_new_user';

-- Si la fonction n'existe pas, la recréer
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url, onboarded)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url',
    FALSE
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Étape 2 : Supprimer le trigger s'il existe (pour éviter les doublons)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

-- Étape 3 : Créer le trigger
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Étape 4 : Vérifier que le trigger est bien créé
SELECT
  trigger_name,
  event_object_schema || '.' || event_object_table as table_name,
  event_manipulation as event_type
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- =====================================================
-- SUCCÈS SI :
-- =====================================================
-- La dernière requête retourne 1 ligne avec :
-- trigger_name: on_auth_user_created
-- table_name: auth.users
-- event_type: INSERT
