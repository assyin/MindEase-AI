-- ============================================================================
-- MIGRATION COMPLÈTE: Ajout des colonnes manquantes à therapy_sessions
-- ============================================================================
-- Cette migration ajoute TOUTES les colonnes manquantes pour que le code 
-- de TherapeuticIntegrationService fonctionne correctement.
-- 
-- Problème résolu: "Could not find the 'checkin_data' column" et autres erreurs
-- ============================================================================

-- Add missing columns to therapy_sessions table
ALTER TABLE therapy_sessions ADD COLUMN scheduled_date TIMESTAMPTZ;
ALTER TABLE therapy_sessions ADD COLUMN session_duration_minutes INTEGER;
ALTER TABLE therapy_sessions ADD COLUMN checkin_data JSONB DEFAULT '{}';
ALTER TABLE therapy_sessions ADD COLUMN homework_review JSONB DEFAULT '{}';
ALTER TABLE therapy_sessions ADD COLUMN main_content JSONB DEFAULT '{}';
ALTER TABLE therapy_sessions ADD COLUMN practical_application JSONB DEFAULT '{}';
ALTER TABLE therapy_sessions ADD COLUMN session_summary JSONB DEFAULT '{}';
ALTER TABLE therapy_sessions ADD COLUMN session_theme VARCHAR(255);
ALTER TABLE therapy_sessions ADD COLUMN therapeutic_objective TEXT;
ALTER TABLE therapy_sessions ADD COLUMN techniques_taught JSONB DEFAULT '[]';
ALTER TABLE therapy_sessions ADD COLUMN concepts_covered JSONB DEFAULT '[]';
ALTER TABLE therapy_sessions ADD COLUMN pre_session_mood_score INTEGER CHECK (pre_session_mood_score >= 1 AND pre_session_mood_score <= 10);
ALTER TABLE therapy_sessions ADD COLUMN post_session_mood_score INTEGER CHECK (post_session_mood_score >= 1 AND post_session_mood_score <= 10);
ALTER TABLE therapy_sessions ADD COLUMN session_effectiveness_score INTEGER CHECK (session_effectiveness_score >= 1 AND session_effectiveness_score <= 10);
ALTER TABLE therapy_sessions ADD COLUMN user_engagement_level INTEGER CHECK (user_engagement_level >= 1 AND user_engagement_level <= 10);
ALTER TABLE therapy_sessions ADD COLUMN user_reaction_type VARCHAR(50);
ALTER TABLE therapy_sessions ADD COLUMN adaptations_made JSONB DEFAULT '[]';
ALTER TABLE therapy_sessions ADD COLUMN expert_notes TEXT;
ALTER TABLE therapy_sessions ADD COLUMN session_status VARCHAR(20) DEFAULT 'planned' CHECK (session_status IN ('planned', 'in_progress', 'completed', 'missed', 'cancelled'));

-- Add comments to document what each column is for
COMMENT ON COLUMN therapy_sessions.checkin_data IS 'Minutes 1-3: Score humeur pré-session, événements marquants';
COMMENT ON COLUMN therapy_sessions.homework_review IS 'Minutes 4-7: Évaluation des devoirs précédents'; 
COMMENT ON COLUMN therapy_sessions.main_content IS 'Minutes 8-18: Contenu principal de la session';
COMMENT ON COLUMN therapy_sessions.practical_application IS 'Minutes 19-23: Application pratique guidée';
COMMENT ON COLUMN therapy_sessions.session_summary IS 'Minutes 24-25: Résumé + nouveaux devoirs';
COMMENT ON COLUMN therapy_sessions.session_theme IS 'ex: "Comprendre votre anxiété", "Techniques de respiration"';
COMMENT ON COLUMN therapy_sessions.therapeutic_objective IS 'ex: "Démystifier l anxiété", "Outils d urgence"';
COMMENT ON COLUMN therapy_sessions.techniques_taught IS 'ex: ["Respiration profonde", "Relaxation musculaire"]';
COMMENT ON COLUMN therapy_sessions.concepts_covered IS 'ex: ["Pensées automatiques", "Lien émotions-comportements"]';
COMMENT ON COLUMN therapy_sessions.user_reaction_type IS 'résistance, engagement_élevé, confusion, détresse_émotionnelle';
COMMENT ON COLUMN therapy_sessions.adaptations_made IS 'Adaptations faites en temps réel pendant la session';
COMMENT ON COLUMN therapy_sessions.expert_notes IS 'Notes de l expert IA sur la session';