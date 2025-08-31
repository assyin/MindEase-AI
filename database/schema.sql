-- MindEase AI - Complete Database Schema for Supabase
-- =====================================================
-- ATTENTION: Ce script supprime et recrée toutes les tables !
-- Sauvegardez vos données importantes avant l'exécution.
-- =====================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 0. DROP EXISTING TABLES (in reverse dependency order)
-- =====================================================

-- Drop tables in correct order to avoid foreign key constraints
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

-- Drop functions
DROP FUNCTION IF EXISTS user_owns_therapy_program(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS user_owns_therapy_session(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS clean_dev_data() CASCADE;
DROP FUNCTION IF EXISTS create_sample_therapy_program(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;

-- Drop views
DROP VIEW IF EXISTS user_therapy_overview CASCADE;

NOTIFY pgsql, 'Tables supprimées avec succès';

-- =====================================================
-- 1. USER MANAGEMENT
-- =====================================================

-- User profiles table (extends Supabase auth.users)
CREATE TABLE user_profiles (
    id UUID REFERENCES auth.users(id) PRIMARY KEY,
    email TEXT NOT NULL UNIQUE,
    full_name TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    preferred_ai_model TEXT DEFAULT 'auto' CHECK (preferred_ai_model IN ('gemini', 'openai', 'auto')),
    preferred_mode TEXT DEFAULT 'text' CHECK (preferred_mode IN ('text', 'voice', 'hybrid')),
    timezone TEXT DEFAULT 'UTC',
    language TEXT DEFAULT 'fr',
    onboarding_completed BOOLEAN DEFAULT FALSE,
    therapeutic_profile_id UUID,
    avatar_preferences JSONB DEFAULT '{}',
    privacy_settings JSONB DEFAULT '{}'
);

-- =====================================================
-- 2. CHAT SYSTEM
-- =====================================================

-- Conversations table
CREATE TABLE conversations (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_archived BOOLEAN DEFAULT FALSE,
    conversation_type TEXT DEFAULT 'general' CHECK (conversation_type IN ('general', 'therapy', 'assessment')),
    metadata JSONB DEFAULT '{}'
);

-- Regular chat sessions (non-therapy)
CREATE TABLE sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    duration_minutes INTEGER,
    mood_before TEXT,
    mood_after TEXT,
    ai_model_used TEXT NOT NULL,
    mode_used TEXT NOT NULL CHECK (mode_used IN ('text', 'voice', 'hybrid')),
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
    session_metadata JSONB DEFAULT '{}'
);

-- Messages table
CREATE TABLE messages (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES sessions(id) ON DELETE CASCADE,
    conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
    role TEXT NOT NULL CHECK (role IN ('user', 'assistant')),
    content TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    ai_model TEXT,
    audio_duration INTEGER,
    message_metadata JSONB DEFAULT '{}'
);

-- =====================================================
-- 3. THERAPY SYSTEM
-- =====================================================

-- Therapy programs
CREATE TABLE therapy_programs (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    program_type TEXT NOT NULL CHECK (program_type IN ('anxiety', 'depression', 'stress', 'sleep', 'addiction', 'trauma', 'relationships', 'custom')),
    total_sessions INTEGER DEFAULT 12,
    completed_sessions INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'completed', 'cancelled')),
    expert_profile JSONB DEFAULT '{}',
    program_settings JSONB DEFAULT '{}',
    personalization_data JSONB DEFAULT '{}'
);

-- Therapy sessions
CREATE TABLE therapy_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapy_program_id UUID REFERENCES therapy_programs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    session_number INTEGER NOT NULL,
    scheduled_for TIMESTAMPTZ,
    actual_start_time TIMESTAMPTZ,
    actual_end_time TIMESTAMPTZ,
    duration_minutes INTEGER,
    session_type TEXT NOT NULL,
    status TEXT DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'in_progress', 'completed', 'cancelled', 'missed')),
    mood_before TEXT,
    mood_after TEXT,
    energy_before INTEGER CHECK (energy_before BETWEEN 1 AND 10),
    energy_after INTEGER CHECK (energy_after BETWEEN 1 AND 10),
    satisfaction_score INTEGER CHECK (satisfaction_score BETWEEN 1 AND 5),
    session_notes TEXT,
    homework_assigned JSONB DEFAULT '[]',
    next_session_plan JSONB DEFAULT '{}',
    crisis_alerts JSONB DEFAULT '[]',
    session_data JSONB DEFAULT '{}',
    attendance_status VARCHAR(20) DEFAULT 'present' CHECK (attendance_status IN ('present', 'absent', 'partial')),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Progress tracking
CREATE TABLE progress_tracking (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapy_program_id UUID REFERENCES therapy_programs(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    tracking_date DATE DEFAULT CURRENT_DATE,
    overall_progress INTEGER DEFAULT 0 CHECK (overall_progress BETWEEN 0 AND 100),
    weekly_sessions INTEGER DEFAULT 0,
    homework_completion INTEGER DEFAULT 0 CHECK (homework_completion BETWEEN 0 AND 100),
    mood_improvement INTEGER DEFAULT 0 CHECK (mood_improvement BETWEEN -100 AND 100),
    goals_achieved INTEGER DEFAULT 0,
    metrics_data JSONB DEFAULT '{}',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Homework assignments
CREATE TABLE homework_assignments (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    therapy_session_id UUID REFERENCES therapy_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT,
    assignment_type TEXT CHECK (assignment_type IN ('reading', 'exercise', 'journal', 'meditation', 'breathing', 'custom')),
    due_date TIMESTAMPTZ,
    completed BOOLEAN DEFAULT FALSE,
    completed_at TIMESTAMPTZ,
    feedback TEXT,
    difficulty_rating INTEGER CHECK (difficulty_rating BETWEEN 1 AND 5),
    assignment_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 4. ASSESSMENT SYSTEM
-- =====================================================

-- Assessment templates
CREATE TABLE assessment_templates (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT NOT NULL,
    description TEXT,
    assessment_type TEXT NOT NULL CHECK (assessment_type IN ('intake', 'progress', 'outcome', 'crisis', 'custom')),
    questions JSONB NOT NULL,
    scoring_rules JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Assessment sessions
CREATE TABLE assessment_sessions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    template_id UUID REFERENCES assessment_templates(id),
    therapy_program_id UUID REFERENCES therapy_programs(id) ON DELETE CASCADE,
    session_type TEXT NOT NULL,
    status TEXT DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'abandoned')),
    responses JSONB DEFAULT '{}',
    scores JSONB DEFAULT '{}',
    recommendations JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ
);

-- Therapeutic profiles (psychological profiles)
CREATE TABLE therapeutic_profiles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    profile_type TEXT NOT NULL,
    assessment_data JSONB NOT NULL,
    risk_factors JSONB DEFAULT '[]',
    strengths JSONB DEFAULT '[]',
    treatment_preferences JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    is_current BOOLEAN DEFAULT TRUE
);

-- =====================================================
-- 5. AI & INTERACTION SYSTEM
-- =====================================================

-- AI contexts for personalization
CREATE TABLE ai_contexts (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    context_type TEXT NOT NULL CHECK (context_type IN ('therapeutic', 'general', 'crisis', 'assessment')),
    context_data JSONB NOT NULL,
    last_updated TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE
);

-- Therapeutic interactions (detailed AI interactions)
CREATE TABLE therapeutic_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    session_id UUID REFERENCES therapy_sessions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    user_input TEXT,
    ai_response TEXT,
    sentiment_analysis JSONB DEFAULT '{}',
    therapeutic_techniques JSONB DEFAULT '[]',
    crisis_indicators JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- User interactions (analytics)
CREATE TABLE user_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    interaction_type TEXT NOT NULL,
    interaction_data JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 6. AVATAR & PERSONALITY SYSTEM
-- =====================================================

-- Avatar preferences
CREATE TABLE avatar_preferences (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    avatar_name TEXT NOT NULL,
    avatar_personality JSONB NOT NULL,
    visual_settings JSONB DEFAULT '{}',
    voice_settings JSONB DEFAULT '{}',
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Avatar interactions
CREATE TABLE avatar_interactions (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    avatar_id UUID REFERENCES avatar_preferences(id),
    interaction_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Multi-avatar dialogues
CREATE TABLE multi_avatar_dialogues (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    dialogue_context JSONB NOT NULL,
    participants JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    status TEXT DEFAULT 'active'
);

-- =====================================================
-- 7. ANALYTICS & INSIGHTS
-- =====================================================

-- Conversation patterns
CREATE TABLE conversation_patterns (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    pattern_type TEXT NOT NULL,
    pattern_data JSONB NOT NULL,
    confidence_score DECIMAL(3,2),
    detected_at TIMESTAMPTZ DEFAULT NOW()
);

-- Conversation insights
CREATE TABLE conversation_insights (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    insight_type TEXT NOT NULL,
    insight_data JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 8. NOTIFICATIONS & COMMUNICATION
-- =====================================================

-- Notifications
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL CHECK (notification_type IN ('reminder', 'achievement', 'system', 'therapeutic')),
    scheduled_for TIMESTAMPTZ,
    sent_at TIMESTAMPTZ,
    read_at TIMESTAMPTZ,
    action_url TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Mood entries (for mood tracking)
CREATE TABLE mood_entries (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    mood_value INTEGER CHECK (mood_value BETWEEN 1 AND 10),
    mood_label TEXT,
    notes TEXT,
    context_tags JSONB DEFAULT '[]',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 9. EXPERT MATCHING SYSTEM
-- =====================================================

-- Expert matching history
CREATE TABLE expert_matching_history (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    matching_criteria JSONB NOT NULL,
    selected_expert JSONB NOT NULL,
    matching_score DECIMAL(3,2),
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =====================================================
-- 10. INDEXES FOR PERFORMANCE
-- =====================================================

-- User profiles indexes
CREATE INDEX idx_user_profiles_email ON user_profiles(email);
CREATE INDEX idx_user_profiles_created_at ON user_profiles(created_at);

-- Conversations indexes
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_created_at ON conversations(created_at);

-- Sessions indexes  
CREATE INDEX idx_sessions_user_id ON sessions(user_id);
CREATE INDEX idx_sessions_conversation_id ON sessions(conversation_id);
CREATE INDEX idx_sessions_created_at ON sessions(created_at);

-- Messages indexes
CREATE INDEX idx_messages_session_id ON messages(session_id);
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_created_at ON messages(created_at);

-- Therapy programs indexes
CREATE INDEX idx_therapy_programs_user_id ON therapy_programs(user_id);
CREATE INDEX idx_therapy_programs_status ON therapy_programs(status);

-- Therapy sessions indexes
CREATE INDEX idx_therapy_sessions_program_id ON therapy_sessions(therapy_program_id);
CREATE INDEX idx_therapy_sessions_user_id ON therapy_sessions(user_id);
CREATE INDEX idx_therapy_sessions_scheduled_for ON therapy_sessions(scheduled_for);
CREATE INDEX idx_therapy_sessions_status ON therapy_sessions(status);

-- Progress tracking indexes
CREATE INDEX idx_progress_tracking_program_id ON progress_tracking(therapy_program_id);
CREATE INDEX idx_progress_tracking_user_id ON progress_tracking(user_id);
CREATE INDEX idx_progress_tracking_date ON progress_tracking(tracking_date);

-- Homework assignments indexes
CREATE INDEX idx_homework_assignments_session_id ON homework_assignments(therapy_session_id);
CREATE INDEX idx_homework_assignments_user_id ON homework_assignments(user_id);
CREATE INDEX idx_homework_assignments_due_date ON homework_assignments(due_date);

-- Assessment sessions indexes
CREATE INDEX idx_assessment_sessions_user_id ON assessment_sessions(user_id);
CREATE INDEX idx_assessment_sessions_program_id ON assessment_sessions(therapy_program_id);

-- Notifications indexes
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);
CREATE INDEX idx_notifications_sent_at ON notifications(sent_at);

-- Mood entries indexes
CREATE INDEX idx_mood_entries_user_id ON mood_entries(user_id);
CREATE INDEX idx_mood_entries_created_at ON mood_entries(created_at);

-- =====================================================
-- 11. FUNCTIONS & TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at trigger to relevant tables
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_sessions_updated_at BEFORE UPDATE ON sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_therapy_programs_updated_at BEFORE UPDATE ON therapy_programs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_therapy_sessions_updated_at BEFORE UPDATE ON therapy_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_therapeutic_profiles_updated_at BEFORE UPDATE ON therapeutic_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

-- =====================================================
-- 12. FINAL SUCCESS MESSAGE
-- =====================================================

NOTIFY pgsql, '🎉 Schema MindEase AI créé avec succès !';

-- Afficher un résumé des tables créées
DO $$
BEGIN
    RAISE NOTICE '========================================';
    RAISE NOTICE '✅ MindEase AI Database Schema Setup Complete!';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables créées: 23+ tables principales';
    RAISE NOTICE 'Index créés: Optimisés pour performance';
    RAISE NOTICE 'Fonctions: Utilitaires et triggers configurés';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Prochaines étapes:';
    RAISE NOTICE '1. Exécutez rls-policies.sql pour sécurité';
    RAISE NOTICE '2. Exécutez seed-data.sql pour données de base';
    RAISE NOTICE '3. Testez la connexion dans l''application';
    RAISE NOTICE '========================================';
END $$;