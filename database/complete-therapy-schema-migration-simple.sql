-- ============================================================================
-- MIGRATION COMPLÈTE DU SCHÉMA THÉRAPEUTIQUE (VERSION SIMPLIFIÉE)
-- ============================================================================
-- Ce script exécute les migrations pour ajouter toutes les colonnes manquantes
-- aux tables therapy_sessions et therapy_programs
-- Date: 30/08/2025
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🚀 Début de la migration complète du schéma thérapeutique...';
    RAISE NOTICE '📋 Vérification des tables existantes...';
END $$;

-- Vérifier que les tables existent
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapy_sessions') THEN
        RAISE EXCEPTION 'Table therapy_sessions non trouvée. Veuillez d''abord exécuter le script d''installation principal.';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'therapy_programs') THEN
        RAISE EXCEPTION 'Table therapy_programs non trouvée. Veuillez d''abord exécuter le script d''installation principal.';
    END IF;
    
    RAISE NOTICE '✅ Tables therapy_sessions et therapy_programs trouvées';
END $$;

-- ============================================================================
-- ÉTAPE 1: MIGRATION DE LA TABLE THERAPY_SESSIONS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Étape 1: Migration de la table therapy_sessions...';
    
    -- Ajouter les colonnes pour la structure de session 20-25 minutes
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'checkin_data') THEN
        ALTER TABLE therapy_sessions ADD COLUMN checkin_data JSONB DEFAULT '{}';
        RAISE NOTICE 'Colonne checkin_data ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'homework_review') THEN
        ALTER TABLE therapy_sessions ADD COLUMN homework_review JSONB DEFAULT '{}';
        RAISE NOTICE 'Colonne homework_review ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'main_content') THEN
        ALTER TABLE therapy_sessions ADD COLUMN main_content JSONB DEFAULT '{}';
        RAISE NOTICE 'Colonne main_content ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'practical_application') THEN
        ALTER TABLE therapy_sessions ADD COLUMN practical_application JSONB DEFAULT '{}';
        RAISE NOTICE 'Colonne practical_application ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'session_summary') THEN
        ALTER TABLE therapy_sessions ADD COLUMN session_summary JSONB DEFAULT '{}';
        RAISE NOTICE 'Colonne session_summary ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour le contenu thérapeutique
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'session_theme') THEN
        ALTER TABLE therapy_sessions ADD COLUMN session_theme VARCHAR(255);
        RAISE NOTICE 'Colonne session_theme ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'therapeutic_objective') THEN
        ALTER TABLE therapy_sessions ADD COLUMN therapeutic_objective TEXT;
        RAISE NOTICE 'Colonne therapeutic_objective ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'techniques_taught') THEN
        ALTER TABLE therapy_sessions ADD COLUMN techniques_taught JSONB DEFAULT '[]';
        RAISE NOTICE 'Colonne techniques_taught ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'concepts_covered') THEN
        ALTER TABLE therapy_sessions ADD COLUMN concepts_covered JSONB DEFAULT '[]';
        RAISE NOTICE 'Colonne concepts_covered ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour les scores et évaluation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'pre_session_mood_score') THEN
        ALTER TABLE therapy_sessions ADD COLUMN pre_session_mood_score INTEGER CHECK (pre_session_mood_score >= 1 AND pre_session_mood_score <= 10);
        RAISE NOTICE 'Colonne pre_session_mood_score ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'post_session_mood_score') THEN
        ALTER TABLE therapy_sessions ADD COLUMN post_session_mood_score INTEGER CHECK (post_session_mood_score >= 1 AND post_session_mood_score <= 10);
        RAISE NOTICE 'Colonne post_session_mood_score ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'session_effectiveness_score') THEN
        ALTER TABLE therapy_sessions ADD COLUMN session_effectiveness_score INTEGER CHECK (session_effectiveness_score >= 1 AND session_effectiveness_score <= 10);
        RAISE NOTICE 'Colonne session_effectiveness_score ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'user_engagement_level') THEN
        ALTER TABLE therapy_sessions ADD COLUMN user_engagement_level INTEGER CHECK (user_engagement_level >= 1 AND user_engagement_level <= 10);
        RAISE NOTICE 'Colonne user_engagement_level ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour la réaction utilisateur et adaptation temps réel
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'user_reaction_type') THEN
        ALTER TABLE therapy_sessions ADD COLUMN user_reaction_type VARCHAR(50);
        RAISE NOTICE 'Colonne user_reaction_type ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'adaptations_made') THEN
        ALTER TABLE therapy_sessions ADD COLUMN adaptations_made JSONB DEFAULT '[]';
        RAISE NOTICE 'Colonne adaptations_made ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'expert_notes') THEN
        ALTER TABLE therapy_sessions ADD COLUMN expert_notes TEXT;
        RAISE NOTICE 'Colonne expert_notes ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour les devoirs générés
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'homework_instructions') THEN
        ALTER TABLE therapy_sessions ADD COLUMN homework_instructions TEXT;
        RAISE NOTICE 'Colonne homework_instructions ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour l'audio et transcription
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'audio_recording_url') THEN
        ALTER TABLE therapy_sessions ADD COLUMN audio_recording_url TEXT;
        RAISE NOTICE 'Colonne audio_recording_url ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'session_transcript') THEN
        ALTER TABLE therapy_sessions ADD COLUMN session_transcript TEXT;
        RAISE NOTICE 'Colonne session_transcript ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour les métadonnées
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'conversation_id') THEN
        ALTER TABLE therapy_sessions ADD COLUMN conversation_id UUID;
        RAISE NOTICE 'Colonne conversation_id ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'ai_model_used') THEN
        ALTER TABLE therapy_sessions ADD COLUMN ai_model_used VARCHAR(50);
        RAISE NOTICE 'Colonne ai_model_used ajoutée';
    END IF;
    
    -- Ajouter la colonne scheduled_date pour compatibilité avec le code existant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'scheduled_date') THEN
        ALTER TABLE therapy_sessions ADD COLUMN scheduled_date TIMESTAMPTZ;
        RAISE NOTICE 'Colonne scheduled_date ajoutée';
    END IF;
    
    -- Ajouter la colonne session_status pour compatibilité avec le code existant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_sessions' AND column_name = 'session_status') THEN
        ALTER TABLE therapy_sessions ADD COLUMN session_status VARCHAR(20) DEFAULT 'planned' CHECK (session_status IN ('planned', 'in_progress', 'completed', 'missed', 'cancelled'));
        RAISE NOTICE 'Colonne session_status ajoutée';
    END IF;
    
    RAISE NOTICE '✅ Migration de therapy_sessions terminée';
END $$;

-- ============================================================================
-- ÉTAPE 2: MIGRATION DE LA TABLE THERAPY_PROGRAMS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Étape 2: Migration de la table therapy_programs...';
    
    -- Ajouter les colonnes pour le diagnostic et évaluation
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'primary_diagnosis') THEN
        ALTER TABLE therapy_programs ADD COLUMN primary_diagnosis VARCHAR(100);
        RAISE NOTICE 'Colonne primary_diagnosis ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'secondary_diagnoses') THEN
        ALTER TABLE therapy_programs ADD COLUMN secondary_diagnoses JSONB DEFAULT '[]';
        RAISE NOTICE 'Colonne secondary_diagnoses ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'severity_level') THEN
        ALTER TABLE therapy_programs ADD COLUMN severity_level VARCHAR(20) CHECK (severity_level IN ('léger', 'modéré', 'sévère'));
        RAISE NOTICE 'Colonne severity_level ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour le profil utilisateur
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'personality_profile') THEN
        ALTER TABLE therapy_programs ADD COLUMN personality_profile JSONB DEFAULT '{}';
        RAISE NOTICE 'Colonne personality_profile ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'risk_factors') THEN
        ALTER TABLE therapy_programs ADD COLUMN risk_factors JSONB DEFAULT '[]';
        RAISE NOTICE 'Colonne risk_factors ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'protective_factors') THEN
        ALTER TABLE therapy_programs ADD COLUMN protective_factors JSONB DEFAULT '[]';
        RAISE NOTICE 'Colonne protective_factors ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'motivation_level') THEN
        ALTER TABLE therapy_programs ADD COLUMN motivation_level INTEGER CHECK (motivation_level >= 1 AND motivation_level <= 10);
        RAISE NOTICE 'Colonne motivation_level ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'availability_per_week') THEN
        ALTER TABLE therapy_programs ADD COLUMN availability_per_week INTEGER;
        RAISE NOTICE 'Colonne availability_per_week ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour l'expert assigné
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'assigned_expert_id') THEN
        ALTER TABLE therapy_programs ADD COLUMN assigned_expert_id VARCHAR(100);
        RAISE NOTICE 'Colonne assigned_expert_id ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'expert_approach') THEN
        ALTER TABLE therapy_programs ADD COLUMN expert_approach VARCHAR(100);
        RAISE NOTICE 'Colonne expert_approach ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'gemini_voice_id') THEN
        ALTER TABLE therapy_programs ADD COLUMN gemini_voice_id VARCHAR(50);
        RAISE NOTICE 'Colonne gemini_voice_id ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour le programme thérapeutique
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'treatment_protocol_id') THEN
        ALTER TABLE therapy_programs ADD COLUMN treatment_protocol_id UUID;
        RAISE NOTICE 'Colonne treatment_protocol_id ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'total_planned_sessions') THEN
        ALTER TABLE therapy_programs ADD COLUMN total_planned_sessions INTEGER DEFAULT 8;
        RAISE NOTICE 'Colonne total_planned_sessions ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'sessions_completed') THEN
        ALTER TABLE therapy_programs ADD COLUMN sessions_completed INTEGER DEFAULT 0;
        RAISE NOTICE 'Colonne sessions_completed ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'current_session_number') THEN
        ALTER TABLE therapy_programs ADD COLUMN current_session_number INTEGER DEFAULT 0;
        RAISE NOTICE 'Colonne current_session_number ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'program_duration_weeks') THEN
        ALTER TABLE therapy_programs ADD COLUMN program_duration_weeks INTEGER DEFAULT 8;
        RAISE NOTICE 'Colonne program_duration_weeks ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'session_frequency_per_week') THEN
        ALTER TABLE therapy_programs ADD COLUMN session_frequency_per_week INTEGER DEFAULT 1;
        RAISE NOTICE 'Colonne session_frequency_per_week ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour le statut et suivi
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'program_status') THEN
        ALTER TABLE therapy_programs ADD COLUMN program_status VARCHAR(20) DEFAULT 'active' CHECK (program_status IN ('active', 'paused', 'completed', 'discontinued'));
        RAISE NOTICE 'Colonne program_status ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'start_date') THEN
        ALTER TABLE therapy_programs ADD COLUMN start_date TIMESTAMPTZ DEFAULT NOW();
        RAISE NOTICE 'Colonne start_date ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'end_date') THEN
        ALTER TABLE therapy_programs ADD COLUMN end_date TIMESTAMPTZ;
        RAISE NOTICE 'Colonne end_date ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'completion_date') THEN
        ALTER TABLE therapy_programs ADD COLUMN completion_date TIMESTAMPTZ;
        RAISE NOTICE 'Colonne completion_date ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'next_session_scheduled') THEN
        ALTER TABLE therapy_programs ADD COLUMN next_session_scheduled TIMESTAMPTZ;
        RAISE NOTICE 'Colonne next_session_scheduled ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour les objectifs personnels
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'personal_goals') THEN
        ALTER TABLE therapy_programs ADD COLUMN personal_goals JSONB DEFAULT '[]';
        RAISE NOTICE 'Colonne personal_goals ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'success_definition') THEN
        ALTER TABLE therapy_programs ADD COLUMN success_definition TEXT;
        RAISE NOTICE 'Colonne success_definition ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour le contexte culturel et linguistique
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'cultural_context') THEN
        ALTER TABLE therapy_programs ADD COLUMN cultural_context VARCHAR(50) DEFAULT 'français';
        RAISE NOTICE 'Colonne cultural_context ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'preferred_language') THEN
        ALTER TABLE therapy_programs ADD COLUMN preferred_language VARCHAR(10) DEFAULT 'fr' CHECK (preferred_language IN ('fr', 'ar'));
        RAISE NOTICE 'Colonne preferred_language ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour l'adaptation dynamique
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'adaptation_history') THEN
        ALTER TABLE therapy_programs ADD COLUMN adaptation_history JSONB DEFAULT '[]';
        RAISE NOTICE 'Colonne adaptation_history ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'current_adaptations') THEN
        ALTER TABLE therapy_programs ADD COLUMN current_adaptations JSONB DEFAULT '{}';
        RAISE NOTICE 'Colonne current_adaptations ajoutée';
    END IF;
    
    -- Ajouter les colonnes pour les métriques globales
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'initial_assessment_scores') THEN
        ALTER TABLE therapy_programs ADD COLUMN initial_assessment_scores JSONB DEFAULT '{}';
        RAISE NOTICE 'Colonne initial_assessment_scores ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'current_scores') THEN
        ALTER TABLE therapy_programs ADD COLUMN current_scores JSONB DEFAULT '{}';
        RAISE NOTICE 'Colonne current_scores ajoutée';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'improvement_percentage') THEN
        ALTER TABLE therapy_programs ADD COLUMN improvement_percentage INTEGER DEFAULT 0;
        RAISE NOTICE 'Colonne improvement_percentage ajoutée';
    END IF;
    
    -- Ajouter les colonnes de compatibilité avec le code existant
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'program_name') THEN
        ALTER TABLE therapy_programs ADD COLUMN program_name TEXT;
        RAISE NOTICE 'Colonne program_name ajoutée';
    END IF;
    
    RAISE NOTICE '✅ Migration de therapy_programs terminée';
END $$;

-- ============================================================================
-- ÉTAPE 3: CRÉATION DES INDEX ET MISE À JOUR DES DONNÉES
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔄 Étape 3: Création des index et mise à jour des données...';
    
    -- Créer des index pour therapy_sessions
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_therapy_sessions_scheduled_date') THEN
        CREATE INDEX idx_therapy_sessions_scheduled_date ON therapy_sessions(scheduled_date);
        RAISE NOTICE 'Index idx_therapy_sessions_scheduled_date créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_therapy_sessions_session_status') THEN
        CREATE INDEX idx_therapy_sessions_session_status ON therapy_sessions(session_status);
        RAISE NOTICE 'Index idx_therapy_sessions_session_status créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_therapy_sessions_theme') THEN
        CREATE INDEX idx_therapy_sessions_theme ON therapy_sessions(session_theme);
        RAISE NOTICE 'Index idx_therapy_sessions_theme créé';
    END IF;
    
    -- Créer des index pour therapy_programs
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_therapy_programs_expert') THEN
        CREATE INDEX idx_therapy_programs_expert ON therapy_programs(assigned_expert_id);
        RAISE NOTICE 'Index idx_therapy_programs_expert créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_therapy_programs_next_session') THEN
        CREATE INDEX idx_therapy_programs_next_session ON therapy_programs(next_session_scheduled);
        RAISE NOTICE 'Index idx_therapy_programs_next_session créé';
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_therapy_programs_severity') THEN
        CREATE INDEX idx_therapy_programs_severity ON therapy_programs(severity_level);
        RAISE NOTICE 'Index idx_therapy_programs_severity créé';
    END IF;
    
    RAISE NOTICE '✅ Index créés avec succès';
END $$;

-- Mettre à jour les sessions existantes pour avoir des valeurs par défaut
UPDATE therapy_sessions 
SET 
    checkin_data = '{}',
    homework_review = '{}',
    main_content = '{}',
    practical_application = '{}',
    session_summary = '{}',
    techniques_taught = '[]',
    concepts_covered = '[]',
    adaptations_made = '[]',
    session_status = COALESCE(session_status, status),
    scheduled_date = COALESCE(scheduled_date, scheduled_for)
WHERE checkin_data IS NULL;

-- Mettre à jour les programmes existants pour avoir des valeurs par défaut
UPDATE therapy_programs 
SET 
    primary_diagnosis = COALESCE(primary_diagnosis, 'Anxiété générale'),
    severity_level = COALESCE(severity_level, 'modéré'),
    personality_profile = '{}',
    risk_factors = '[]',
    protective_factors = '[]',
    motivation_level = COALESCE(motivation_level, 7),
    availability_per_week = COALESCE(availability_per_week, 2),
    assigned_expert_id = COALESCE(assigned_expert_id, 'dr_sarah_empathie'),
    expert_approach = COALESCE(expert_approach, 'TCC'),
    gemini_voice_id = COALESCE(gemini_voice_id, 'umbriel'),
    total_planned_sessions = COALESCE(total_planned_sessions, 8),
    program_duration_weeks = COALESCE(program_duration_weeks, 8),
    session_frequency_per_week = COALESCE(session_frequency_per_week, 1),
    program_status = COALESCE(program_status, 'active'),
    start_date = COALESCE(start_date, created_at),
    cultural_context = COALESCE(cultural_context, 'français'),
    preferred_language = COALESCE(preferred_language, 'fr'),
    adaptation_history = '[]',
    current_adaptations = '{}',
    initial_assessment_scores = '{}',
    current_scores = '{}',
    improvement_percentage = COALESCE(improvement_percentage, 0)
WHERE primary_diagnosis IS NULL;

-- Mettre à jour program_name à partir de name si elle existe
UPDATE therapy_programs SET program_name = name WHERE program_name IS NULL AND name IS NOT NULL;

-- ============================================================================
-- FINALISATION ET VÉRIFICATION
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🎯 Migration terminée avec succès !';
    RAISE NOTICE '📊 Vérification des résultats...';
END $$;

-- Afficher un résumé des modifications
SELECT 
    'Colonnes totales dans therapy_sessions' as table_info,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'therapy_sessions'

UNION ALL

SELECT 
    'Colonnes totales dans therapy_programs' as table_info,
    COUNT(*) as column_count
FROM information_schema.columns 
WHERE table_name = 'therapy_programs';

-- Vérifier que toutes les colonnes nécessaires sont présentes (séparément pour éviter les problèmes de syntaxe)
SELECT 'Vérification therapy_sessions:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'therapy_sessions' 
ORDER BY ordinal_position;

SELECT 'Vérification therapy_programs:' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'therapy_programs' 
ORDER BY ordinal_position;

-- Message de succès final
SELECT '🎉 Migration du schéma thérapeutique terminée avec succès !' as status;
