-- ============================================================================
-- AJOUT DES COLONNES MANQUANTES POUR LA TABLE THERAPY_PROGRAMS
-- ============================================================================
-- Ce script ajoute les colonnes manquantes à la table therapy_programs
-- pour qu'elle corresponde au schéma étendu utilisé par le code
-- Date: 30/08/2025
-- ============================================================================

-- Vérifier si les colonnes existent déjà avant de les ajouter
DO $$
BEGIN
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
    
    -- Mettre à jour program_name à partir de name si elle existe
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'therapy_programs' AND column_name = 'name') THEN
        UPDATE therapy_programs SET program_name = name WHERE program_name IS NULL;
        RAISE NOTICE 'Colonne program_name mise à jour à partir de name';
    END IF;
    
    RAISE NOTICE '✅ Toutes les colonnes manquantes ont été ajoutées avec succès !';
END $$;

-- Créer des index pour les nouvelles colonnes si elles n'existent pas
DO $$
BEGIN
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
END $$;

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

-- Afficher un résumé des modifications
SELECT 
    'Colonnes ajoutées à therapy_programs' as action,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'therapy_programs';

-- Vérifier que toutes les colonnes nécessaires sont présentes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'therapy_programs' 
ORDER BY ordinal_position;
