-- MindEase AI - Installation Propre Simplifiée
-- =============================================
-- Ce script contient tout en un seul fichier pour Supabase Web Interface
-- =============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =====================================================
-- 1. NETTOYAGE COMPLET (SAFE DROPS)
-- =====================================================

DO $$
BEGIN
    RAISE NOTICE '⚠️  ATTENTION: Installation propre de MindEase AI';
    RAISE NOTICE '⚠️  Toutes les données existantes seront supprimées !';
    RAISE NOTICE '🚀 Début de l''installation...';
END $$;

-- Désactiver les politiques RLS temporairement
DO $$
DECLARE
    table_record RECORD;
BEGIN
    FOR table_record IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'ALTER TABLE ' || table_record.tablename || ' DISABLE ROW LEVEL SECURITY';
        EXCEPTION
            WHEN OTHERS THEN
                -- Ignorer les erreurs
                NULL;
        END;
    END LOOP;
END $$;

-- Supprimer toutes les politiques RLS existantes
DO $$
DECLARE
    policy_record RECORD;
BEGIN
    FOR policy_record IN 
        SELECT schemaname, tablename, policyname
        FROM pg_policies 
        WHERE schemaname = 'public'
    LOOP
        BEGIN
            EXECUTE 'DROP POLICY IF EXISTS "' || policy_record.policyname || '" ON ' || policy_record.tablename;
        EXCEPTION
            WHEN OTHERS THEN
                NULL;
        END;
    END LOOP;
END $$;

-- Supprimer tables dans l'ordre des dépendances
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

-- Supprimer fonctions et vues
DROP FUNCTION IF EXISTS user_owns_therapy_program(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS user_owns_therapy_session(UUID, UUID) CASCADE;
DROP FUNCTION IF EXISTS clean_dev_data() CASCADE;
DROP FUNCTION IF EXISTS create_sample_therapy_program(UUID) CASCADE;
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP VIEW IF EXISTS user_therapy_overview CASCADE;

DO $$
BEGIN
    RAISE NOTICE '✅ Nettoyage terminé';
    RAISE NOTICE '🏗️  Création des tables...';
END $$;

-- =====================================================
-- 2. CRÉATION COMPLÈTE DU SCHEMA
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

-- Therapeutic profiles
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

-- Autres tables essentielles (version simplifiée)
CREATE TABLE notifications (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES user_profiles(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    notification_type TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Fonction pour updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers
CREATE TRIGGER update_user_profiles_updated_at BEFORE UPDATE ON user_profiles FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_conversations_updated_at BEFORE UPDATE ON conversations FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_therapy_programs_updated_at BEFORE UPDATE ON therapy_programs FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();
CREATE TRIGGER update_therapy_sessions_updated_at BEFORE UPDATE ON therapy_sessions FOR EACH ROW EXECUTE PROCEDURE update_updated_at_column();

DO $$
BEGIN
    RAISE NOTICE '✅ Tables créées avec succès';
    RAISE NOTICE '🔒 Configuration des politiques de sécurité...';
END $$;

-- =====================================================
-- 3. POLITIQUES RLS ESSENTIELLES
-- =====================================================

-- Enable RLS sur les tables principales
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;

-- Politiques essentielles
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Users can view own therapy programs" ON therapy_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own therapy programs" ON therapy_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own therapy programs" ON therapy_programs FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own therapy sessions" ON therapy_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own therapy sessions" ON therapy_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own therapy sessions" ON therapy_sessions FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON progress_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON progress_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own homework" ON homework_assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own homework" ON homework_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own homework" ON homework_assignments FOR UPDATE USING (auth.uid() = user_id);

-- Template public (lecture seule)
CREATE POLICY "Anyone can view assessment templates" ON assessment_templates FOR SELECT USING (is_active = true);

DO $$
DECLARE
    table_count INTEGER;
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO table_count FROM pg_tables WHERE schemaname = 'public';
    SELECT COUNT(*) INTO policy_count FROM pg_policies WHERE schemaname = 'public';
    
    RAISE NOTICE '========================================';
    RAISE NOTICE '🎉 Installation MindEase AI Terminée !';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Tables créées: % tables', table_count;
    RAISE NOTICE 'Politiques RLS: % politiques', policy_count;
    RAISE NOTICE 'Status: ✅ Prêt pour utilisation';
    RAISE NOTICE '========================================';
    RAISE NOTICE 'Vous pouvez maintenant:';
    RAISE NOTICE '1. Redémarrer votre application';
    RAISE NOTICE '2. Créer votre compte utilisateur'; 
    RAISE NOTICE '3. Commencer à utiliser MindEase AI';
    RAISE NOTICE '========================================';
END $$;