-- MindEase AI - Installation Propre (Clean Install)
-- ==================================================
-- Ce script installe la base de données en supprimant d'abord
-- toutes les tables existantes. ATTENTION: Toutes les données
-- existantes seront perdues !
-- ==================================================

BEGIN;

-- =====================================================
-- 1. VÉRIFICATION ET AVERTISSEMENT
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '⚠️  ATTENTION: Installation propre de MindEase AI';
    RAISE NOTICE '⚠️  Toutes les données existantes seront supprimées !';
    RAISE NOTICE '⚠️  Appuyez sur Ctrl+C maintenant pour annuler';
    RAISE NOTICE '==========================================';
    
    -- Attendre quelques secondes (simulate delay)
    PERFORM pg_sleep(3);
    
    RAISE NOTICE '🚀 Début de l''installation...';
END $$;

-- =====================================================
-- 2. NETTOYAGE COMPLET (SAFE DROPS)
-- =====================================================

-- Désactiver les politiques RLS temporairement pour éviter les erreurs
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE ' || table_record.tablename || ' DISABLE ROW LEVEL SECURITY';
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignorer les erreurs (table might not have RLS)
                NULL;
        END;
    END LOOP;
END $$;

-- Supprimer toutes les politiques RLS existantes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                RAISE NOTICE 'Could not drop policy: %', policy_record.policyname;
        END;
    END LOOP;
END $$;

-- Supprimer toutes les tables dans l'ordre des dépendances
DROP TABLE IF EXISTS expert_matching_history CASCADE;
DROP TABLE IF EXISTS mood_entries CASCADE;
DROP TABLE IF EXISTS notifications CASCADE;
DROP TABLE IF EXISTS conversation_insights CASCADE;
DROP TABLE IF EXISTS conversation_patterns CASCADE;
DROP TABLE IF EXISTS multi_avatar_dialogues CASCADE;
DROP TABLE IF EXISTS avatar_interactions CASCADE;
DROP TABLE IF EXISTS avatar_preferences CASCADE;
DROP TABLE IF EXISTS user_interactions CASCADE;
DROP TABLE IF EXISTS therapeutic_interactions CASCADE;
DROP TABLE IF EXISTS ai_contexts CASCADE;
DROP TABLE IF EXISTS therapeutic_profiles CASCADE;
DROP TABLE IF EXISTS assessment_sessions CASCADE;
DROP TABLE IF EXISTS assessment_templates CASCADE;
DROP TABLE IF EXISTS homework_assignments CASCADE;
DROP TABLE IF EXISTS progress_tracking CASCADE;
DROP TABLE IF EXISTS therapy_sessions CASCADE;
DROP TABLE IF EXISTS therapy_programs CASCADE;
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS sessions CASCADE;
DROP TABLE IF EXISTS conversations CASCADE;
DROP TABLE IF EXISTS user_profiles CASCADE;

-- Supprimer toutes les fonctions personnalisées
DROP FUNCTION IF EXISTS user_owns_therapy_program(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS user_owns_therapy_session(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS clean_dev_data() CASCADE;
DROP FUNCTION IF EXISTS create_sample_therapy_program(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Supprimer les vues
DROP VIEW IF EXISTS user_therapy_overview CASCADE;

RAISE NOTICE '✅ Nettoyage terminé';

-- =====================================================
-- 3. CRÉATION DU SCHEMA COMPLET
-- =====================================================

-- Maintenant, exécuter le schema principal
\i schema.sql

-- =====================================================
-- 4. CONFIGURATION DES POLITIQUES DE SÉCURITÉ
-- =====================================================

-- Exécuter les politiques RLS
\i rls-policies.sql

-- =====================================================
-- 5. AJOUT DES DONNÉES DE BASE
-- =====================================================

-- Exécuter les données de seed
\i seed-data.sql

-- =====================================================
-- 6. VÉRIFICATION FINALE
-- =====================================================

DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 Installation MindEase AI Terminée !';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables créées: % tables', table_count;
    RAISE NOTICE 'Politiques RLS: % politiques', policy_count;
    RAISE NOTICE 'Status: ✅ Prêt pour utilisation';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Vous pouvez maintenant:';
    RAISE NOTICE '1. Redémarrer votre application';
    RAISE NOTICE '2. Créer votre compte utilisateur';
    RAISE NOTICE '3. Commencer à utiliser MindEase AI';
    RAISE NOTICE '========================================';
END $$;

COMMIT;

-- Message final
NOTIFY pgsql, 'MindEase AI Database: Installation complète réussie!';