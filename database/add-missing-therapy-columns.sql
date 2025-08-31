-- ============================================================================
-- AJOUT DES COLONNES MANQUANTES POUR LE SYSTÈME THÉRAPEUTIQUE COMPLET
-- ============================================================================
-- Ce script ajoute les colonnes manquantes à la table therapy_sessions
-- pour qu'elle corresponde au schéma étendu utilisé par le code
-- Date: 30/08/2025
-- ============================================================================

-- Vérifier si les colonnes existent déjà avant de les ajouter
DO $$
BEGIN
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
    
    RAISE NOTICE '✅ Toutes les colonnes manquantes ont été ajoutées avec succès !';
END $$;

-- Créer des index pour les nouvelles colonnes si elles n'existent pas
DO $$
BEGIN
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

-- Afficher un résumé des modifications
SELECT 
    'Colonnes ajoutées à therapy_sessions' as action,
    COUNT(*) as count
FROM information_schema.columns 
WHERE table_name = 'therapy_sessions';

-- Vérifier que toutes les colonnes nécessaires sont présentes
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'therapy_sessions' 
ORDER BY ordinal_position;
