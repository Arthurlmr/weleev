-- =====================================================
-- SCRIPT DE VÉRIFICATION DES TRIGGERS
-- =====================================================
-- Ce script vérifie que tous les triggers nécessaires sont bien créés
-- Exécutez ce script dans le SQL Editor de Supabase

-- Vérifier tous les triggers existants
SELECT
  trigger_name,
  event_object_schema || '.' || event_object_table as table_name,
  event_manipulation as event_type,
  action_statement as function_called
FROM information_schema.triggers
WHERE trigger_schema IN ('public', 'auth')
ORDER BY trigger_name;

-- =====================================================
-- RÉSULTAT ATTENDU : 3 triggers
-- =====================================================
-- 1. on_auth_user_created      → auth.users       → AFTER INSERT → public.handle_new_user()
-- 2. set_updated_at_profiles   → public.profiles  → BEFORE UPDATE → public.handle_updated_at()
-- 3. set_updated_at_searches   → public.searches  → BEFORE UPDATE → public.handle_updated_at()
