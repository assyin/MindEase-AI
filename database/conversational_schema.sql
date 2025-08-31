-- ================================================
-- SCHEMA DE BASE DE DONNÉES POUR ARCHITECTURE CONVERSATIONNELLE
-- Support des sessions thérapeutiques avec dialogue naturel
-- Date: 30/08/2025
-- ================================================

-- Table pour les sessions conversationnelles
CREATE TABLE IF NOT EXISTS conversational_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
    
    -- Gestion de phase conversationnelle
    current_phase_id VARCHAR(50) NOT NULL,
    phase_start_time TIMESTAMP WITH TIME ZONE NOT NULL,
    phase_objectives_met BOOLEAN DEFAULT FALSE,
    total_user_interactions INTEGER DEFAULT 0,
    
    -- Configuration expert
    expert_profile_id VARCHAR(50) NOT NULL,
    conversation_style JSONB DEFAULT '{}',
    cultural_adaptations TEXT[] DEFAULT '{}',
    
    -- État de session
    is_active BOOLEAN DEFAULT TRUE,
    wellbeing_score INTEGER,
    crisis_level VARCHAR(20) DEFAULT 'none',
    
    -- Historique et adaptations
    phase_transitions JSONB DEFAULT '[]',
    style_adaptations JSONB DEFAULT '[]',
    adaptations_made TEXT[] DEFAULT '{}',
    
    -- Métadonnées session
    session_metadata JSONB DEFAULT '{}',
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX IF NOT EXISTS idx_conversational_sessions_session_id ON conversational_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_conversational_sessions_phase ON conversational_sessions(current_phase_id);
CREATE INDEX IF NOT EXISTS idx_conversational_sessions_active ON conversational_sessions(is_active);
CREATE INDEX IF NOT EXISTS idx_conversational_sessions_expert ON conversational_sessions(expert_profile_id);

-- Table pour les messages de conversation
CREATE TABLE IF NOT EXISTS conversation_messages (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
    
    -- Message content
    sender VARCHAR(10) NOT NULL CHECK (sender IN ('user', 'expert')),
    content TEXT NOT NULL,
    phase_id VARCHAR(50) NOT NULL,
    
    -- Métadonnées
    message_type VARCHAR(50) DEFAULT 'standard',
    confidence_score FLOAT,
    detected_emotion VARCHAR(50),
    therapeutic_techniques_used TEXT[] DEFAULT '{}',
    crisis_indicators TEXT[] DEFAULT '{}',
    
    -- Audio
    has_audio BOOLEAN DEFAULT FALSE,
    audio_url TEXT,
    audio_duration_seconds INTEGER,
    
    -- Timestamps
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour messages
CREATE INDEX IF NOT EXISTS idx_conversation_messages_session ON conversation_messages(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_sender ON conversation_messages(sender);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_phase ON conversation_messages(phase_id);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_timestamp ON conversation_messages(timestamp);
CREATE INDEX IF NOT EXISTS idx_conversation_messages_crisis ON conversation_messages USING GIN(crisis_indicators);

-- Table pour la mémoire conversationnelle
CREATE TABLE IF NOT EXISTS conversation_memory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
    
    -- Données mémoire
    memory_data JSONB NOT NULL DEFAULT '{}',
    
    -- Types de mémoire
    topics_discussed TEXT[] DEFAULT '{}',
    emotional_journey JSONB DEFAULT '[]',
    techniques_introduced TEXT[] DEFAULT '{}',
    rapport_building JSONB DEFAULT '[]',
    expert_personality_moments JSONB DEFAULT '[]',
    
    -- Métadonnées
    memory_version INTEGER DEFAULT 1,
    last_access TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour mémoire
CREATE UNIQUE INDEX IF NOT EXISTS idx_conversation_memory_session ON conversation_memory(session_id);
CREATE INDEX IF NOT EXISTS idx_conversation_memory_access ON conversation_memory(last_access);

-- Table pour les adaptations de style
CREATE TABLE IF NOT EXISTS style_adaptations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES therapy_sessions(id) ON DELETE CASCADE,
    
    -- Données adaptation
    adaptation_data JSONB NOT NULL,
    
    -- Contexte adaptation
    trigger_type VARCHAR(50) NOT NULL,
    trigger_message TEXT,
    user_reaction_type VARCHAR(50),
    user_reaction_intensity INTEGER CHECK (user_reaction_intensity BETWEEN 1 AND 10),
    
    -- Résultat adaptation
    adaptations_applied TEXT[] DEFAULT '{}',
    expert_adjustments JSONB DEFAULT '{}',
    effectiveness_score INTEGER CHECK (effectiveness_score BETWEEN 1 AND 10),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour adaptations
CREATE INDEX IF NOT EXISTS idx_style_adaptations_session ON style_adaptations(session_id);
CREATE INDEX IF NOT EXISTS idx_style_adaptations_trigger ON style_adaptations(trigger_type);
CREATE INDEX IF NOT EXISTS idx_style_adaptations_reaction ON style_adaptations(user_reaction_type);

-- Table pour les interactions thérapeutiques (étendue de TherapeuticAI)
CREATE TABLE IF NOT EXISTS therapeutic_interactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES therapy_sessions(id) ON DELETE CASCADE,
    
    -- Interaction data
    expert_id VARCHAR(50) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    
    -- Contexte thérapeutique
    emotional_context VARCHAR(50),
    phase_context VARCHAR(50),
    techniques_used TEXT[] DEFAULT '{}',
    crisis_level VARCHAR(20) DEFAULT 'none',
    
    -- Qualité interaction
    response_quality_score INTEGER CHECK (response_quality_score BETWEEN 1 AND 10),
    user_engagement_score INTEGER CHECK (user_engagement_score BETWEEN 1 AND 10),
    therapeutic_effectiveness INTEGER CHECK (therapeutic_effectiveness BETWEEN 1 AND 10),
    
    -- Métadonnées IA
    model_version VARCHAR(50),
    prompt_tokens INTEGER,
    completion_tokens INTEGER,
    processing_time_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour interactions thérapeutiques
CREATE INDEX IF NOT EXISTS idx_therapeutic_interactions_session ON therapeutic_interactions(session_id);
CREATE INDEX IF NOT EXISTS idx_therapeutic_interactions_expert ON therapeutic_interactions(expert_id);
CREATE INDEX IF NOT EXISTS idx_therapeutic_interactions_crisis ON therapeutic_interactions(crisis_level);
CREATE INDEX IF NOT EXISTS idx_therapeutic_interactions_date ON therapeutic_interactions(created_at);

-- Table pour cache audio TTS
CREATE TABLE IF NOT EXISTS audio_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    
    -- Clé cache
    cache_key VARCHAR(100) UNIQUE NOT NULL,
    
    -- Données audio
    audio_url TEXT NOT NULL,
    audio_blob_data BYTEA, -- Pour stockage local éventuel
    audio_duration_seconds INTEGER,
    audio_format VARCHAR(20) DEFAULT 'mp3',
    
    -- Métadonnées génération
    text_content TEXT NOT NULL,
    voice_id VARCHAR(50) NOT NULL,
    expert_id VARCHAR(50),
    emotional_tone VARCHAR(50),
    
    -- Gestion cache
    access_count INTEGER DEFAULT 0,
    last_accessed TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour cache audio
CREATE INDEX IF NOT EXISTS idx_audio_cache_key ON audio_cache(cache_key);
CREATE INDEX IF NOT EXISTS idx_audio_cache_voice ON audio_cache(voice_id);
CREATE INDEX IF NOT EXISTS idx_audio_cache_expert ON audio_cache(expert_id);
CREATE INDEX IF NOT EXISTS idx_audio_cache_expires ON audio_cache(expires_at);
CREATE INDEX IF NOT EXISTS idx_audio_cache_accessed ON audio_cache(last_accessed);

-- Table pour statistiques reconnaissance vocale
CREATE TABLE IF NOT EXISTS voice_recognition_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID REFERENCES therapy_sessions(id) ON DELETE CASCADE,
    
    -- Données reconnaissance
    transcript TEXT NOT NULL,
    confidence_score FLOAT NOT NULL,
    recognition_duration_ms INTEGER,
    
    -- Analyse émotionnelle
    detected_emotion VARCHAR(50),
    emotional_intensity INTEGER CHECK (emotional_intensity BETWEEN 1 AND 10),
    therapeutic_indicators TEXT[] DEFAULT '{}',
    needs_attention BOOLEAN DEFAULT FALSE,
    
    -- Contexte
    expert_id VARCHAR(50),
    phase_context VARCHAR(50),
    user_engagement_level INTEGER CHECK (user_engagement_level BETWEEN 1 AND 10),
    
    -- Résultat
    was_processed BOOLEAN DEFAULT FALSE,
    processing_outcome VARCHAR(50),
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index pour stats reconnaissance vocale
CREATE INDEX IF NOT EXISTS idx_voice_stats_session ON voice_recognition_stats(session_id);
CREATE INDEX IF NOT EXISTS idx_voice_stats_emotion ON voice_recognition_stats(detected_emotion);
CREATE INDEX IF NOT EXISTS idx_voice_stats_attention ON voice_recognition_stats(needs_attention);
CREATE INDEX IF NOT EXISTS idx_voice_stats_confidence ON voice_recognition_stats(confidence_score);

-- ================================================
-- VUES POUR ANALYSES ET RAPPORTS
-- ================================================

-- Vue pour analyse complète des sessions conversationnelles
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
     ) t) as techniques_used

FROM conversational_sessions cs
LEFT JOIN therapy_sessions ts ON cs.session_id = ts.id
LEFT JOIN conversation_messages cm ON cs.session_id = cm.session_id
GROUP BY cs.id, cs.session_id, ts.user_id, ts.therapy_program_id,
         cs.current_phase_id, cs.expert_profile_id, cs.total_user_interactions,
         cs.wellbeing_score, cs.crisis_level, cs.created_at, cs.updated_at, cs.session_metadata;

-- Vue pour rapport d'engagement utilisateur
CREATE OR REPLACE VIEW user_engagement_report AS
SELECT 
    ts.user_id,
    COUNT(DISTINCT cs.session_id) as total_sessions,
    AVG(cs.total_user_interactions) as avg_interactions_per_session,
    AVG(cm.confidence_score) as avg_voice_confidence,
    
    -- Engagement émotionnel
    COUNT(CASE WHEN cm.detected_emotion != 'neutre' THEN 1 END) as emotional_expressions,
    
    -- Utilisation features
    COUNT(CASE WHEN cm.has_audio = true THEN 1 END) as audio_messages_used,
    COUNT(CASE WHEN cm.confidence_score > 0 THEN 1 END) as voice_inputs_used,
    
    -- Progression
    MIN(cs.created_at) as first_conversational_session,
    MAX(cs.updated_at) as last_conversational_session,
    
    -- Alertes
    COUNT(CASE WHEN cs.crisis_level != 'none' THEN 1 END) as crisis_sessions

FROM conversational_sessions cs
JOIN therapy_sessions ts ON cs.session_id = ts.id
LEFT JOIN conversation_messages cm ON cs.session_id = cm.session_id
GROUP BY ts.user_id;

-- ================================================
-- FONCTIONS ET TRIGGERS
-- ================================================

-- Fonction pour nettoyer le cache audio expiré
CREATE OR REPLACE FUNCTION clean_expired_audio_cache()
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM audio_cache WHERE expires_at < NOW();
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les stats d'accès cache
CREATE OR REPLACE FUNCTION update_audio_cache_access(cache_key_param VARCHAR(100))
RETURNS VOID AS $$
BEGIN
    UPDATE audio_cache 
    SET access_count = access_count + 1,
        last_accessed = NOW()
    WHERE cache_key = cache_key_param;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour analyser la qualité conversationnelle
CREATE OR REPLACE FUNCTION analyze_conversation_quality(session_id_param UUID)
RETURNS JSONB AS $$
DECLARE
    result JSONB := '{}';
    total_messages INTEGER;
    user_messages INTEGER;
    avg_confidence FLOAT;
    emotional_variety INTEGER;
    crisis_indicators INTEGER;
BEGIN
    -- Compter messages
    SELECT COUNT(*), COUNT(CASE WHEN sender = 'user' THEN 1 END)
    INTO total_messages, user_messages
    FROM conversation_messages WHERE session_id = session_id_param;
    
    -- Confiance moyenne
    SELECT AVG(confidence_score)
    INTO avg_confidence
    FROM conversation_messages 
    WHERE session_id = session_id_param AND confidence_score IS NOT NULL;
    
    -- Variété émotionnelle
    SELECT COUNT(DISTINCT detected_emotion)
    INTO emotional_variety
    FROM conversation_messages 
    WHERE session_id = session_id_param AND detected_emotion IS NOT NULL;
    
    -- Indicateurs de crise
    SELECT COUNT(*)
    INTO crisis_indicators
    FROM conversation_messages 
    WHERE session_id = session_id_param AND array_length(crisis_indicators, 1) > 0;
    
    -- Construction résultat
    result := jsonb_build_object(
        'total_messages', total_messages,
        'user_messages', user_messages,
        'engagement_ratio', CASE WHEN total_messages > 0 THEN user_messages::float / total_messages ELSE 0 END,
        'avg_confidence', COALESCE(avg_confidence, 0),
        'emotional_variety', emotional_variety,
        'crisis_indicators', crisis_indicators,
        'quality_score', CASE 
            WHEN total_messages > 10 AND avg_confidence > 0.7 AND emotional_variety > 1 AND crisis_indicators = 0 THEN 'excellent'
            WHEN total_messages > 5 AND avg_confidence > 0.5 AND crisis_indicators = 0 THEN 'good'
            WHEN total_messages > 2 THEN 'fair'
            ELSE 'poor'
        END
    );
    
    RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mise à jour automatique des timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Application des triggers
CREATE TRIGGER update_conversational_sessions_updated_at
    BEFORE UPDATE ON conversational_sessions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_conversation_memory_updated_at
    BEFORE UPDATE ON conversation_memory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ================================================
-- POLITIQUES DE SÉCURITÉ (RLS)
-- ================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE conversational_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_memory ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE voice_recognition_stats ENABLE ROW LEVEL SECURITY;

-- Politique pour conversational_sessions (via therapy_sessions)
CREATE POLICY conversational_sessions_user_policy ON conversational_sessions
    FOR ALL USING (
        session_id IN (
            SELECT id FROM therapy_sessions WHERE user_id = auth.uid()
        )
    );

-- Politique pour conversation_messages
CREATE POLICY conversation_messages_user_policy ON conversation_messages
    FOR ALL USING (
        session_id IN (
            SELECT id FROM therapy_sessions WHERE user_id = auth.uid()
        )
    );

-- Politique pour conversation_memory
CREATE POLICY conversation_memory_user_policy ON conversation_memory
    FOR ALL USING (
        session_id IN (
            SELECT id FROM therapy_sessions WHERE user_id = auth.uid()
        )
    );

-- Politique pour therapeutic_interactions
CREATE POLICY therapeutic_interactions_user_policy ON therapeutic_interactions
    FOR ALL USING (
        session_id IN (
            SELECT id FROM therapy_sessions WHERE user_id = auth.uid()
        )
    );

-- Politique pour voice_recognition_stats
CREATE POLICY voice_recognition_stats_user_policy ON voice_recognition_stats
    FOR ALL USING (
        session_id IN (
            SELECT id FROM therapy_sessions WHERE user_id = auth.uid()
        )
    );

-- ================================================
-- TÂCHES DE MAINTENANCE
-- ================================================

-- Créer extension pour tâches cron si disponible (optionnel)
-- CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Exemple de tâche de nettoyage (à adapter selon environnement)
-- SELECT cron.schedule('clean-audio-cache', '0 2 * * *', 'SELECT clean_expired_audio_cache();');

-- ================================================
-- COMMENTAIRES ET DOCUMENTATION
-- ================================================

COMMENT ON TABLE conversational_sessions IS 'Sessions thérapeutiques avec interface conversationnelle naturelle';
COMMENT ON TABLE conversation_messages IS 'Messages échangés dans les conversations thérapeutiques avec métadonnées';
COMMENT ON TABLE conversation_memory IS 'Mémoire conversationnelle pour maintenir cohérence et continuité';
COMMENT ON TABLE style_adaptations IS 'Adaptations de style en temps réel selon réactions utilisateur';
COMMENT ON TABLE therapeutic_interactions IS 'Interactions avec IA thérapeutique pour analyse et amélioration';
COMMENT ON TABLE audio_cache IS 'Cache pour optimisation des synthèses vocales (TTS)';
COMMENT ON TABLE voice_recognition_stats IS 'Statistiques et analyses de reconnaissance vocale thérapeutique';

-- ================================================
-- DONNÉES DE CONFIGURATION INITIALES
-- ================================================

-- Configuration des phases conversationnelles (optionnel, peut être en code)
CREATE TABLE IF NOT EXISTS conversational_phases (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(100) NOT NULL,
    duration_minutes INTEGER NOT NULL,
    min_interactions INTEGER NOT NULL,
    max_interactions INTEGER,
    conversational_goals TEXT[] NOT NULL,
    transition_triggers TEXT[] NOT NULL,
    expert_prompts JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insérer phases par défaut
INSERT INTO conversational_phases (id, name, display_name, duration_minutes, min_interactions, max_interactions, conversational_goals, transition_triggers, expert_prompts)
VALUES 
    ('checkin_conversational', 'Check-in Conversationnel', 'Accueil', 3, 3, 6, 
     ARRAY['Établir connexion chaleureuse', 'Évaluer état émotionnel', 'Identifier préoccupations'],
     ARRAY['État émotionnel évalué', 'Connexion établie', 'Préoccupations identifiées'],
     '{"opening": "Accueillir avec chaleur selon expert", "progression": ["Explorer état émotionnel", "Approfondir événements récents"], "transition": "Résumer et introduire suite"}'::jsonb),
    
    ('homework_dialogue', 'Dialogue Devoirs', 'Révision', 4, 4, 8,
     ARRAY['Discuter exercices pratiqués', 'Analyser obstacles', 'Célébrer réussites'],
     ARRAY['Exercices évalués', 'Obstacles identifiés', 'Ajustements déterminés'],
     '{"opening": "Transition vers pratique entre sessions", "progression": ["Expériences concrètes", "Explorer challenges"], "transition": "Lier insights au contenu principal"}'::jsonb),
    
    ('therapeutic_conversation', 'Conversation Thérapeutique', 'Exploration', 10, 8, 15,
     ARRAY['Enseigner nouvelle technique', 'Explorer concepts', 'Faciliter insights'],
     ARRAY['Technique enseignée', 'Compréhension confirmée', 'Application explorée'],
     '{"opening": "Introduire sujet principal", "progression": ["Dialogue socratique", "Exemples personnalisés"], "transition": "Préparer application pratique"}'::jsonb),
    
    ('guided_practice', 'Pratique Guidée Interactive', 'Pratique', 5, 5, 10,
     ARRAY['Guider exercice pratique', 'Feedback temps réel', 'Application concrète'],
     ARRAY['Exercice complété', 'Technique expérimentée', 'Confiance renforcée'],
     '{"opening": "Inviter à mise en pratique", "progression": ["Guider étapes", "Feedback encourageant"], "transition": "Récapituler expérience"}'::jsonb),
    
    ('conversational_summary', 'Résumé Conversationnel', 'Conclusion', 3, 3, 6,
     ARRAY['Récapituler apprentissages', 'Assigner devoirs', 'Prévoir session suivante'],
     ARRAY['Session résumée', 'Devoirs assignés', 'Session suivante planifiée'],
     '{"opening": "Célébrer travail accompli", "progression": ["Co-créer résumé", "Proposer devoirs"], "transition": "Clôturer avec encouragement"}'::jsonb)
ON CONFLICT (id) DO NOTHING;

COMMENT ON TABLE conversational_phases IS 'Configuration des phases conversationnelles thérapeutiques';

-- ================================================
-- INDEX ET OPTIMISATIONS FINALES
-- ================================================

-- Index composés pour requêtes complexes
CREATE INDEX IF NOT EXISTS idx_conversation_messages_composite 
ON conversation_messages(session_id, sender, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_conversational_sessions_composite
ON conversational_sessions(expert_profile_id, current_phase_id, is_active);

-- Statistiques pour optimiseur
ANALYZE conversational_sessions;
ANALYZE conversation_messages;
ANALYZE conversation_memory;
ANALYZE style_adaptations;
ANALYZE therapeutic_interactions;
ANALYZE audio_cache;
ANALYZE voice_recognition_stats;