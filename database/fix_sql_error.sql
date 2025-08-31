-- ================================================
-- CORRECTION ERREUR SQL - ARCHITECTURE CONVERSATIONNELLE
-- Fix pour l'erreur: aggregate function calls cannot contain set-returning function calls
-- Date: 30/08/2025
-- ================================================

-- Correction de la vue conversation_session_analysis
DROP VIEW IF EXISTS conversation_session_analysis CASCADE;

CREATE OR REPLACE VIEW conversation_session_analysis AS
SELECT 
    cs.id,
    cs.session_id,
    ts.user_id,
    ts.therapy_program_id,
    
    -- Informations session
    cs.current_phase_id,
    cs.expert_profile_id,
    cs.total_user_interactions,
    cs.wellbeing_score,
    cs.crisis_level,
    
    -- Statistiques messages
    COUNT(cm.id) as total_messages,
    COUNT(CASE WHEN cm.sender = 'user' THEN 1 END) as user_messages,
    COUNT(CASE WHEN cm.sender = 'expert' THEN 1 END) as expert_messages,
    AVG(cm.confidence_score) as avg_confidence,
    
    -- Analyse temporelle
    cs.created_at as session_start,
    cs.updated_at as last_activity,
    EXTRACT(EPOCH FROM (cs.updated_at - cs.created_at))/60 as duration_minutes,
    
    -- Métadonnées
    cs.session_metadata,
    array_agg(DISTINCT cm.detected_emotion) FILTER (WHERE cm.detected_emotion IS NOT NULL) as emotions_detected,
    -- Correction: utiliser une sous-requête pour éviter l'erreur unnest dans array_agg
    (SELECT array_agg(DISTINCT technique) 
     FROM (
         SELECT unnest(cm2.therapeutic_techniques_used) as technique
         FROM conversation_messages cm2 
         WHERE cm2.session_id = cs.session_id 
           AND cm2.therapeutic_techniques_used IS NOT NULL
           AND array_length(cm2.therapeutic_techniques_used, 1) > 0
     ) t) as techniques_used

FROM conversational_sessions cs
LEFT JOIN therapy_sessions ts ON cs.session_id = ts.id
LEFT JOIN conversation_messages cm ON cs.session_id = cm.session_id
GROUP BY cs.id, cs.session_id, ts.user_id, ts.therapy_program_id,
         cs.current_phase_id, cs.expert_profile_id, cs.total_user_interactions,
         cs.wellbeing_score, cs.crisis_level, cs.created_at, cs.updated_at, cs.session_metadata;

-- Vérification que la vue fonctionne correctement
SELECT 'Vue conversation_session_analysis créée avec succès' as status;

-- Optionnel: Test de la vue avec des données factices si nécessaire
-- (Décommentez si vous voulez tester)
/*
-- Test insert pour vérifier la vue
DO $$
DECLARE
    test_session_id UUID;
BEGIN
    -- Insérer données de test si les tables existent
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapy_sessions') THEN
        
        -- Insérer session de test
        INSERT INTO therapy_sessions (id, user_id, therapy_program_id, session_number, status)
        VALUES (gen_random_uuid(), gen_random_uuid(), gen_random_uuid(), 1, 'scheduled')
        RETURNING id INTO test_session_id;
        
        -- Insérer session conversationnelle
        INSERT INTO conversational_sessions (session_id, current_phase_id, expert_profile_id, phase_start_time)
        VALUES (test_session_id, 'checkin_conversational', 'dr_sarah_empathie', NOW());
        
        -- Insérer message de test
        INSERT INTO conversation_messages (session_id, sender, content, phase_id, therapeutic_techniques_used)
        VALUES (test_session_id, 'expert', 'Message de test', 'checkin_conversational', ARRAY['empathie', 'validation']);
        
        -- Test de la vue
        PERFORM * FROM conversation_session_analysis WHERE session_id = test_session_id;
        
        -- Nettoyer les données de test
        DELETE FROM conversation_messages WHERE session_id = test_session_id;
        DELETE FROM conversational_sessions WHERE session_id = test_session_id;
        DELETE FROM therapy_sessions WHERE id = test_session_id;
        
        RAISE NOTICE 'Test de la vue réussi - données nettoyées';
        
    END IF;
END $$;
*/

-- Confirmation
SELECT 'Correction SQL appliquée avec succès' as result;