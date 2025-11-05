-- =====================================================
-- SCRIPT DE NETTOYAGE COMPLET SUPABASE
-- =====================================================
-- Ce script supprime TOUTES les tables, policies, triggers,
-- et functions personnalisées pour repartir de zéro.
--
-- ⚠️ ATTENTION : Ceci supprimera TOUTES VOS DONNÉES !
-- Utilisez uniquement en développement.
-- =====================================================

-- 1. Supprimer les policies RLS existantes
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    -- Drop toutes les policies sur la table profiles
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'profiles') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.profiles CASCADE';
    END LOOP;

    -- Drop toutes les policies sur la table searches
    FOR r IN (SELECT policyname FROM pg_policies WHERE tablename = 'searches') LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON public.searches CASCADE';
    END LOOP;
END $$;

-- 2. Supprimer les triggers
-- =====================================================

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS set_updated_at_profiles ON public.profiles;
DROP TRIGGER IF EXISTS set_updated_at_searches ON public.searches;

-- 3. Supprimer les functions
-- =====================================================

DROP FUNCTION IF EXISTS public.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS public.handle_updated_at() CASCADE;

-- 4. Supprimer les tables (CASCADE supprime aussi les contraintes)
-- =====================================================

DROP TABLE IF EXISTS public.searches CASCADE;
DROP TABLE IF EXISTS public.profiles CASCADE;

-- 5. Supprimer les types personnalisés
-- =====================================================

DROP TYPE IF EXISTS public.property_type CASCADE;

-- 6. Supprimer les indexes (normalement supprimés avec les tables, mais par sécurité)
-- =====================================================

DROP INDEX IF EXISTS public.profiles_email_idx;
DROP INDEX IF EXISTS public.searches_user_id_idx;
DROP INDEX IF EXISTS public.searches_created_at_idx;

-- 7. Nettoyer les policies du Storage (bucket avatars)
-- =====================================================

DO $$
DECLARE
    r RECORD;
BEGIN
    FOR r IN (
        SELECT policyname
        FROM pg_policies
        WHERE schemaname = 'storage'
        AND tablename = 'objects'
    ) LOOP
        EXECUTE 'DROP POLICY IF EXISTS ' || quote_ident(r.policyname) || ' ON storage.objects CASCADE';
    END LOOP;
END $$;

-- 8. Supprimer le bucket storage (optionnel - décommentez si vous voulez aussi supprimer le bucket)
-- =====================================================

-- DELETE FROM storage.buckets WHERE id = 'avatars';

-- =====================================================
-- NETTOYAGE TERMINÉ !
-- =====================================================
-- Vous pouvez maintenant exécuter le fichier schema.sql
-- pour recréer toute la structure proprement.
-- =====================================================

-- Message de confirmation
DO $$
BEGIN
    RAISE NOTICE 'Nettoyage terminé ! Vous pouvez maintenant exécuter schema.sql';
END $$;
