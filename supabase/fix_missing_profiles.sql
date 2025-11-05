-- =====================================================
-- SCRIPT DE RÉPARATION DES PROFILS MANQUANTS
-- =====================================================
-- Ce script crée les profils manquants pour les utilisateurs
-- qui existent dans auth.users mais pas dans public.profiles
--
-- EXÉCUTEZ CE SCRIPT UNE SEULE FOIS dans le SQL Editor de Supabase

-- Créer les profils manquants
INSERT INTO public.profiles (id, email, full_name, avatar_url, onboarded)
SELECT
  au.id,
  au.email,
  au.raw_user_meta_data->>'full_name' as full_name,
  au.raw_user_meta_data->>'avatar_url' as avatar_url,
  COALESCE(
    (SELECT COUNT(*) > 0 FROM public.searches WHERE user_id = au.id),
    false
  ) as onboarded
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;

-- Vérifier le résultat
SELECT
  'Profils réparés' as status,
  COUNT(*) as count
FROM auth.users au
INNER JOIN public.profiles p ON au.id = p.id;

SELECT
  'Utilisateurs sans profil (devrait être 0)' as status,
  COUNT(*) as count
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL;
