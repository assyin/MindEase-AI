-- MindEase AI - Seed Data for Development
-- =======================================

-- =====================================================
-- 1. ASSESSMENT TEMPLATES
-- =====================================================

-- Intake Assessment Template
INSERT INTO assessment_templates (id, name, description, assessment_type, questions, scoring_rules) VALUES
(
    uuid_generate_v4(),
    'Évaluation d''Accueil Complète',
    'Évaluation initiale pour comprendre les besoins et objectifs thérapeutiques',
    'intake',
    '{
        "sections": [
            {
                "title": "Informations Générales",
                "questions": [
                    {
                        "id": "age",
                        "type": "number",
                        "question": "Quel est votre âge ?",
                        "required": true
                    },
                    {
                        "id": "main_concern",
                        "type": "text",
                        "question": "Quelle est votre principale préoccupation qui vous amène ici ?",
                        "required": true
                    }
                ]
            },
            {
                "title": "État Psychologique",
                "questions": [
                    {
                        "id": "anxiety_level",
                        "type": "scale",
                        "question": "Sur une échelle de 1 à 10, comment évaluez-vous votre niveau d''anxiété actuel ?",
                        "scale": {"min": 1, "max": 10},
                        "required": true
                    },
                    {
                        "id": "depression_symptoms",
                        "type": "multiple_choice",
                        "question": "Avez-vous ressenti les symptômes suivants au cours des 2 dernières semaines ?",
                        "options": [
                            "Tristesse persistante",
                            "Perte d''intérêt",
                            "Fatigue",
                            "Troubles du sommeil",
                            "Difficultés de concentration",
                            "Aucun de ces symptômes"
                        ],
                        "multiple": true
                    }
                ]
            },
            {
                "title": "Objectifs Thérapeutiques",
                "questions": [
                    {
                        "id": "therapy_goals",
                        "type": "text",
                        "question": "Quels sont vos principaux objectifs pour cette thérapie ?",
                        "required": true
                    },
                    {
                        "id": "preferred_approach",
                        "type": "single_choice",
                        "question": "Quelle approche thérapeutique préférez-vous ?",
                        "options": [
                            "Thérapie cognitivo-comportementale (TCC)",
                            "Thérapie d''acceptation et d''engagement",
                            "Mindfulness et méditation",
                            "Approche humaniste",
                            "Je ne sais pas / Besoin de conseils"
                        ]
                    }
                ]
            }
        ]
    }',
    '{
        "anxiety_threshold": {"low": 3, "medium": 6, "high": 8},
        "risk_factors": ["anxiety_level > 8", "depression_symptoms.length > 3"]
    }'
);

-- Progress Assessment Template
INSERT INTO assessment_templates (id, name, description, assessment_type, questions, scoring_rules) VALUES
(
    uuid_generate_v4(),
    'Évaluation de Progrès Hebdomadaire',
    'Suivi hebdomadaire des progrès thérapeutiques',
    'progress',
    '{
        "sections": [
            {
                "title": "État Actuel",
                "questions": [
                    {
                        "id": "mood_week",
                        "type": "scale",
                        "question": "Comment évaluez-vous votre humeur générale cette semaine ?",
                        "scale": {"min": 1, "max": 10},
                        "required": true
                    },
                    {
                        "id": "anxiety_week",
                        "type": "scale",
                        "question": "Niveau d''anxiété moyen cette semaine ?",
                        "scale": {"min": 1, "max": 10},
                        "required": true
                    },
                    {
                        "id": "coping_strategies",
                        "type": "multiple_choice",
                        "question": "Quelles stratégies d''adaptation avez-vous utilisées cette semaine ?",
                        "options": [
                            "Exercices de respiration",
                            "Méditation",
                            "Exercice physique",
                            "Journaling",
                            "Conversations avec des proches",
                            "Aucune"
                        ],
                        "multiple": true
                    }
                ]
            },
            {
                "title": "Progrès Thérapeutiques",
                "questions": [
                    {
                        "id": "homework_completion",
                        "type": "scale",
                        "question": "À quel point avez-vous suivi les exercices assignés ?",
                        "scale": {"min": 0, "max": 100, "unit": "%"},
                        "required": true
                    },
                    {
                        "id": "goals_progress",
                        "type": "text",
                        "question": "Décrivez vos progrès vers vos objectifs thérapeutiques",
                        "required": false
                    }
                ]
            }
        ]
    }',
    '{
        "progress_indicators": ["mood_week >= 7", "anxiety_week <= 4", "homework_completion >= 70"]
    }'
);

-- =====================================================
-- 2. SAMPLE DATA (ONLY FOR DEVELOPMENT - DO NOT USE IN PRODUCTION)
-- =====================================================

-- Note: This section should only be run in development environments
-- In production, real user data will be created through the application

-- Example user profile (this would normally be created by Supabase Auth)
-- INSERT INTO user_profiles (id, email, full_name, preferred_ai_model, preferred_mode) VALUES
-- ('550e8400-e29b-41d4-a716-446655440000', 'demo@mindease.ai', 'Demo User', 'gemini', 'text');

-- Example therapy program
-- INSERT INTO therapy_programs (id, user_id, name, description, program_type, total_sessions) VALUES
-- (
--     uuid_generate_v4(),
--     '550e8400-e29b-41d4-a716-446655440000',
--     'Programme de Gestion du Stress',
--     'Un programme personnalisé pour apprendre à gérer le stress quotidien',
--     'stress',
--     12
-- );

-- =====================================================
-- 3. SYSTEM CONFIGURATION
-- =====================================================

-- Insert default notification templates
INSERT INTO assessment_templates (id, name, description, assessment_type, questions, scoring_rules) VALUES
(
    uuid_generate_v4(),
    'Évaluation de Crise',
    'Évaluation rapide en cas de détection de signaux d''alarme',
    'crisis',
    '{
        "sections": [
            {
                "title": "État d''Urgence",
                "questions": [
                    {
                        "id": "immediate_danger",
                        "type": "boolean",
                        "question": "Ressentez-vous un danger immédiat pour vous-même ou pour autrui ?",
                        "required": true
                    },
                    {
                        "id": "suicidal_thoughts",
                        "type": "scale",
                        "question": "Avez-vous eu des pensées d''auto-agression ? (1=Jamais, 10=Très souvent)",
                        "scale": {"min": 1, "max": 10},
                        "required": true
                    },
                    {
                        "id": "support_available",
                        "type": "boolean",
                        "question": "Avez-vous quelqu''un à qui vous pouvez parler maintenant ?",
                        "required": true
                    }
                ]
            }
        ]
    }',
    '{
        "crisis_threshold": {"immediate_danger": true, "suicidal_thoughts": "> 5"},
        "emergency_contacts": ["3114", "SOS Amitié"]
    }'
);

-- =====================================================
-- 4. HELPFUL FUNCTIONS FOR DEVELOPMENT
-- =====================================================

-- Function to clean development data (useful for testing)
CREATE OR REPLACE FUNCTION clean_dev_data()
RETURNS void AS $$
BEGIN
    -- Only clean if we're in development (check for demo user)
    IF EXISTS (SELECT 1 FROM user_profiles WHERE email = 'demo@mindease.ai') THEN
        DELETE FROM messages WHERE session_id IN (SELECT id FROM sessions WHERE user_id = '550e8400-e29b-41d4-a716-446655440000');
        DELETE FROM sessions WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
        DELETE FROM conversations WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
        DELETE FROM therapy_sessions WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
        DELETE FROM therapy_programs WHERE user_id = '550e8400-e29b-41d4-a716-446655440000';
        DELETE FROM user_profiles WHERE id = '550e8400-e29b-41d4-a716-446655440000';
        
        RAISE NOTICE 'Development data cleaned successfully';
    ELSE
        RAISE NOTICE 'No development data found to clean';
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to create sample therapy program for a user
CREATE OR REPLACE FUNCTION create_sample_therapy_program(target_user_id UUID)
RETURNS UUID AS $$
DECLARE
    program_id UUID;
    session_id UUID;
BEGIN
    -- Create therapy program
    INSERT INTO therapy_programs (user_id, name, description, program_type, total_sessions)
    VALUES (target_user_id, 'Programme de Gestion du Stress', 'Programme personnalisé pour la gestion du stress', 'stress', 12)
    RETURNING id INTO program_id;
    
    -- Create first session
    INSERT INTO therapy_sessions (therapy_program_id, user_id, session_number, session_type, scheduled_for, status)
    VALUES (program_id, target_user_id, 1, 'Évaluation Initiale', NOW() + INTERVAL '2 days', 'scheduled')
    RETURNING id INTO session_id;
    
    -- Create some progress tracking
    INSERT INTO progress_tracking (therapy_program_id, user_id, overall_progress, weekly_sessions, homework_completion, mood_improvement)
    VALUES (program_id, target_user_id, 25, 1, 80, 15);
    
    -- Create sample homework
    INSERT INTO homework_assignments (therapy_session_id, user_id, title, description, assignment_type, due_date)
    VALUES (session_id, target_user_id, 'Exercices de Respiration', 'Pratiquer 5 minutes de respiration profonde chaque matin', 'breathing', NOW() + INTERVAL '7 days');
    
    RETURN program_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 5. HELPFUL VIEWS FOR DEVELOPMENT
-- =====================================================

-- View for user therapy overview
CREATE OR REPLACE VIEW user_therapy_overview AS
SELECT 
    up.id as user_id,
    up.full_name,
    tp.name as program_name,
    tp.program_type,
    tp.completed_sessions,
    tp.total_sessions,
    ROUND((tp.completed_sessions::DECIMAL / tp.total_sessions) * 100, 1) as completion_percentage,
    pt.overall_progress,
    pt.mood_improvement,
    COUNT(ha.id) as active_homework_count
FROM user_profiles up
LEFT JOIN therapy_programs tp ON up.id = tp.user_id AND tp.status = 'active'
LEFT JOIN progress_tracking pt ON tp.id = pt.therapy_program_id
LEFT JOIN homework_assignments ha ON tp.id = (
    SELECT therapy_program_id FROM therapy_sessions 
    WHERE id = ha.therapy_session_id
) AND ha.completed = FALSE
GROUP BY up.id, up.full_name, tp.name, tp.program_type, tp.completed_sessions, tp.total_sessions, pt.overall_progress, pt.mood_improvement;

COMMENT ON VIEW user_therapy_overview IS 'Vue d''ensemble des programmes thérapeutiques par utilisateur';