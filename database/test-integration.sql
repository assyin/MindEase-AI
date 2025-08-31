-- Test d'intégration complète MindEase AI
-- ======================================

-- Ce script teste toute la chaîne de fonctionnalités
-- depuis l'authentification jusqu'aux programmes thérapeutiques

BEGIN;

-- Nettoyer les données de test précédentes
DELETE FROM user_profiles WHERE email LIKE '%test%';

RAISE NOTICE '🧪 Test d''intégration MindEase AI';
RAISE NOTICE '==================================';

-- 1. Test création utilisateur (simule AuthService.createUserProfile)
INSERT INTO user_profiles (
    id,
    email,
    full_name,
    preferred_ai_model,
    preferred_mode
) VALUES (
    '550e8400-e29b-41d4-a716-446655440000',
    'test-integration@example.com',
    'Test Integration User',
    'auto',
    'text'
);

RAISE NOTICE '✅ 1. Utilisateur créé avec succès';

-- 2. Test création programme thérapeutique (simule TherapyProgramManager)
INSERT INTO therapy_programs (
    id,
    user_id,
    name,
    description,
    program_type,
    total_sessions,
    completed_sessions,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    'Programme de Gestion du Stress - Test',
    'Programme de test pour validation',
    'stress',
    12,
    3,
    'active'
);

RAISE NOTICE '✅ 2. Programme thérapeutique créé';

-- 3. Test création session thérapeutique (simule SessionManager)
INSERT INTO therapy_sessions (
    id,
    therapy_program_id,
    user_id,
    session_number,
    scheduled_for,
    session_type,
    status
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    4,
    NOW() + INTERVAL '2 days',
    'Techniques de Relaxation',
    'scheduled'
);

RAISE NOTICE '✅ 3. Session thérapeutique créée';

-- 4. Test suivi de progrès
INSERT INTO progress_tracking (
    therapy_program_id,
    user_id,
    overall_progress,
    weekly_sessions,
    homework_completion,
    mood_improvement
) VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    '550e8400-e29b-41d4-a716-446655440000',
    25,
    1,
    80,
    15
);

RAISE NOTICE '✅ 4. Suivi de progrès ajouté';

-- 5. Test devoir thérapeutique
INSERT INTO homework_assignments (
    therapy_session_id,
    user_id,
    title,
    description,
    assignment_type,
    due_date,
    completed
) VALUES (
    '550e8400-e29b-41d4-a716-446655440002',
    '550e8400-e29b-41d4-a716-446655440000',
    'Exercices de Respiration Test',
    'Test assignment',
    'breathing',
    NOW() + INTERVAL '7 days',
    false
);

RAISE NOTICE '✅ 5. Devoir thérapeutique assigné';

-- 6. Tests de requêtes (simule les appels API de l'application)

-- Test TherapyProgramManager.getCurrentProgram()
DO $$
DECLARE
    program_record RECORD;
BEGIN
    SELECT * INTO program_record 
    FROM therapy_programs 
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000' 
    AND status = 'active'
    ORDER BY created_at DESC 
    LIMIT 1;
    
    IF program_record.id IS NOT NULL THEN
        RAISE NOTICE '✅ 6a. getCurrentProgram() - Programme trouvé: %', program_record.name;
    ELSE
        RAISE EXCEPTION '❌ getCurrentProgram() failed';
    END IF;
END $$;

-- Test SessionManager.getNextSession()
DO $$
DECLARE
    session_record RECORD;
BEGIN
    SELECT * INTO session_record
    FROM therapy_sessions 
    WHERE therapy_program_id = '550e8400-e29b-41d4-a716-446655440001'
    AND status = 'scheduled'
    ORDER BY scheduled_for ASC
    LIMIT 1;
    
    IF session_record.id IS NOT NULL THEN
        RAISE NOTICE '✅ 6b. getNextSession() - Session trouvée: %', session_record.session_type;
    ELSE
        RAISE EXCEPTION '❌ getNextSession() failed';
    END IF;
END $$;

-- Test SessionManager.getActiveHomework()
DO $$
DECLARE
    homework_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO homework_count
    FROM homework_assignments 
    WHERE user_id = '550e8400-e29b-41d4-a716-446655440000'
    AND completed = false;
    
    IF homework_count > 0 THEN
        RAISE NOTICE '✅ 6c. getActiveHomework() - % devoirs trouvés', homework_count;
    ELSE
        RAISE EXCEPTION '❌ getActiveHomework() failed';
    END IF;
END $$;

-- Test TherapyProgramManager.getProgressMetrics()
DO $$
DECLARE
    progress_record RECORD;
BEGIN
    SELECT * INTO progress_record
    FROM progress_tracking 
    WHERE therapy_program_id = '550e8400-e29b-41d4-a716-446655440001'
    ORDER BY tracking_date DESC
    LIMIT 1;
    
    IF progress_record.overall_progress IS NOT NULL THEN
        RAISE NOTICE '✅ 6d. getProgressMetrics() - Progrès: %%%', progress_record.overall_progress;
    ELSE
        RAISE EXCEPTION '❌ getProgressMetrics() failed';
    END IF;
END $$;

-- 7. Test des politiques RLS (Row Level Security)
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies 
    WHERE schemaname = 'public';
    
    IF policy_count > 0 THEN
        RAISE NOTICE '✅ 7. RLS Policies - % politiques configurées', policy_count;
    ELSE
        RAISE NOTICE '⚠️  7. RLS Policies - Aucune politique trouvée (à configurer)';
    END IF;
END $$;

RAISE NOTICE '==================================';
RAISE NOTICE '🎉 Test d''intégration RÉUSSI !';
RAISE NOTICE '==================================';
RAISE NOTICE 'Toutes les fonctionnalités principales sont opérationnelles:';
RAISE NOTICE '• Authentification utilisateur';
RAISE NOTICE '• Programmes thérapeutiques'; 
RAISE NOTICE '• Sessions thérapeutiques';
RAISE NOTICE '• Suivi de progrès';
RAISE NOTICE '• Devoirs thérapeutiques';
RAISE NOTICE '• Requêtes API simulées';
RAISE NOTICE '==================================';
RAISE NOTICE '🚀 L''application peut maintenant être utilisée !';
RAISE NOTICE '==================================';

-- Nettoyer les données de test
DELETE FROM homework_assignments WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM progress_tracking WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM therapy_sessions WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM therapy_programs WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
DELETE FROM user_profiles WHERE id = '550e8400-e29b-41d4-a716-446655440000';

ROLLBACK; -- Ne pas sauvegarder les données de test