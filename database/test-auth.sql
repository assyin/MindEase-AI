-- Test d'authentification et de création de profil utilisateur
-- ============================================================

-- Ce script teste si la structure de base de données est compatible
-- avec le code d'authentification de l'application

BEGIN;

-- 1. Vérifier que la table user_profiles existe avec les bonnes colonnes
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE tablename = 'user_profiles') THEN
        RAISE EXCEPTION 'Table user_profiles not found!';
    END IF;
    
    -- Vérifier les colonnes essentielles
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'email'
    ) THEN
        RAISE EXCEPTION 'Column email not found in user_profiles!';
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'user_profiles' AND column_name = 'preferred_ai_model'
    ) THEN
        RAISE EXCEPTION 'Column preferred_ai_model not found in user_profiles!';
    END IF;
    
    RAISE NOTICE '✅ Table user_profiles structure is correct';
END $$;

-- 2. Test d'insertion d'un profil utilisateur (comme le fait AuthService)
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    preferred_ai_model,
    preferred_mode
) VALUES (
    uuid_generate_v4(),
    'test@example.com',
    'Test User',
    'auto',
    'text'
) ON CONFLICT (email) DO NOTHING;

-- 3. Vérifier que l'insertion a fonctionné
DO $$
DECLARE
    user_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM user_profiles WHERE email = 'test@example.com';
    
    IF user_count = 0 THEN
        RAISE EXCEPTION 'Test user profile was not created!';
    END IF;
    
    RAISE NOTICE '✅ User profile creation test passed';
END $$;

-- 4. Test des politiques RLS (si activées)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_profiles' AND policyname LIKE '%can view own profile%'
    ) THEN
        RAISE NOTICE '✅ RLS policies are configured';
    ELSE
        RAISE NOTICE '⚠️  RLS policies not found - make sure to run rls-policies.sql';
    END IF;
END $$;

-- 5. Nettoyer les données de test
DELETE FROM user_profiles WHERE email = 'test@example.com';

RAISE NOTICE '========================================';
RAISE NOTICE '🎉 Test d''authentification réussi !';
RAISE NOTICE '========================================';
RAISE NOTICE 'La structure est compatible avec AuthService';
RAISE NOTICE 'Vous pouvez maintenant vous connecter dans l''app';
RAISE NOTICE '========================================';

ROLLBACK; -- Ne pas sauvegarder les données de test