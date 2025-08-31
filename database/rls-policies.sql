-- MindEase AI - Row Level Security (RLS) Policies
-- ================================================

-- =====================================================
-- 1. ENABLE RLS ON ALL TABLES
-- =====================================================

ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_programs ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapy_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE progress_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE homework_assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE assessment_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_contexts ENABLE ROW LEVEL SECURITY;
ALTER TABLE therapeutic_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_preferences ENABLE ROW LEVEL SECURITY;
ALTER TABLE avatar_interactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE multi_avatar_dialogues ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_patterns ENABLE ROW LEVEL SECURITY;
ALTER TABLE conversation_insights ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE mood_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE expert_matching_history ENABLE ROW LEVEL SECURITY;

-- =====================================================
-- 2. USER PROFILES POLICIES
-- =====================================================

-- Users can view and edit their own profile
CREATE POLICY "Users can view own profile" ON user_profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON user_profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON user_profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- =====================================================
-- 3. CONVERSATIONS POLICIES
-- =====================================================

-- Users can only access their own conversations
CREATE POLICY "Users can view own conversations" ON conversations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own conversations" ON conversations FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own conversations" ON conversations FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own conversations" ON conversations FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 4. SESSIONS POLICIES
-- =====================================================

-- Users can only access their own sessions
CREATE POLICY "Users can view own sessions" ON sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own sessions" ON sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own sessions" ON sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own sessions" ON sessions FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 5. MESSAGES POLICIES
-- =====================================================

-- Users can only access messages from their own sessions
CREATE POLICY "Users can view own messages" ON messages FOR SELECT USING (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = messages.session_id 
        AND sessions.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
);

CREATE POLICY "Users can insert own messages" ON messages FOR INSERT WITH CHECK (
    EXISTS (
        SELECT 1 FROM sessions 
        WHERE sessions.id = messages.session_id 
        AND sessions.user_id = auth.uid()
    )
    OR
    EXISTS (
        SELECT 1 FROM conversations 
        WHERE conversations.id = messages.conversation_id 
        AND conversations.user_id = auth.uid()
    )
);

-- =====================================================
-- 6. THERAPY PROGRAMS POLICIES
-- =====================================================

-- Users can only access their own therapy programs
CREATE POLICY "Users can view own therapy programs" ON therapy_programs FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own therapy programs" ON therapy_programs FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own therapy programs" ON therapy_programs FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own therapy programs" ON therapy_programs FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 7. THERAPY SESSIONS POLICIES
-- =====================================================

-- Users can only access their own therapy sessions
CREATE POLICY "Users can view own therapy sessions" ON therapy_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own therapy sessions" ON therapy_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own therapy sessions" ON therapy_sessions FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own therapy sessions" ON therapy_sessions FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 8. PROGRESS TRACKING POLICIES
-- =====================================================

-- Users can only access their own progress data
CREATE POLICY "Users can view own progress" ON progress_tracking FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own progress" ON progress_tracking FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON progress_tracking FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 9. HOMEWORK ASSIGNMENTS POLICIES
-- =====================================================

-- Users can only access their own homework
CREATE POLICY "Users can view own homework" ON homework_assignments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own homework" ON homework_assignments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own homework" ON homework_assignments FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 10. ASSESSMENT TEMPLATES POLICIES
-- =====================================================

-- Assessment templates are public (read-only)
CREATE POLICY "Anyone can view assessment templates" ON assessment_templates FOR SELECT USING (is_active = true);

-- =====================================================
-- 11. ASSESSMENT SESSIONS POLICIES
-- =====================================================

-- Users can only access their own assessment sessions
CREATE POLICY "Users can view own assessments" ON assessment_sessions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own assessments" ON assessment_sessions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own assessments" ON assessment_sessions FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 12. THERAPEUTIC PROFILES POLICIES
-- =====================================================

-- Users can only access their own therapeutic profiles
CREATE POLICY "Users can view own therapeutic profiles" ON therapeutic_profiles FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own therapeutic profiles" ON therapeutic_profiles FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own therapeutic profiles" ON therapeutic_profiles FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 13. AI CONTEXTS POLICIES
-- =====================================================

-- Users can only access their own AI contexts
CREATE POLICY "Users can view own AI contexts" ON ai_contexts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own AI contexts" ON ai_contexts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own AI contexts" ON ai_contexts FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 14. THERAPEUTIC INTERACTIONS POLICIES
-- =====================================================

-- Users can only access their own therapeutic interactions
CREATE POLICY "Users can view own therapeutic interactions" ON therapeutic_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own therapeutic interactions" ON therapeutic_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 15. USER INTERACTIONS POLICIES
-- =====================================================

-- Users can only access their own interaction data
CREATE POLICY "Users can view own interactions" ON user_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own interactions" ON user_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 16. AVATAR PREFERENCES POLICIES
-- =====================================================

-- Users can only access their own avatar preferences
CREATE POLICY "Users can view own avatars" ON avatar_preferences FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own avatars" ON avatar_preferences FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own avatars" ON avatar_preferences FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own avatars" ON avatar_preferences FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 17. AVATAR INTERACTIONS POLICIES
-- =====================================================

-- Users can only access their own avatar interactions
CREATE POLICY "Users can view own avatar interactions" ON avatar_interactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own avatar interactions" ON avatar_interactions FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 18. MULTI-AVATAR DIALOGUES POLICIES
-- =====================================================

-- Users can only access their own dialogues
CREATE POLICY "Users can view own dialogues" ON multi_avatar_dialogues FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own dialogues" ON multi_avatar_dialogues FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own dialogues" ON multi_avatar_dialogues FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 19. CONVERSATION PATTERNS POLICIES
-- =====================================================

-- Users can only access their own conversation patterns
CREATE POLICY "Users can view own patterns" ON conversation_patterns FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own patterns" ON conversation_patterns FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 20. CONVERSATION INSIGHTS POLICIES
-- =====================================================

-- Users can only access their own insights
CREATE POLICY "Users can view own insights" ON conversation_insights FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own insights" ON conversation_insights FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 21. NOTIFICATIONS POLICIES
-- =====================================================

-- Users can only access their own notifications
CREATE POLICY "Users can view own notifications" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own notifications" ON notifications FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own notifications" ON notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own notifications" ON notifications FOR DELETE USING (auth.uid() = user_id);

-- =====================================================
-- 22. MOOD ENTRIES POLICIES
-- =====================================================

-- Users can only access their own mood entries
CREATE POLICY "Users can view own mood entries" ON mood_entries FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own mood entries" ON mood_entries FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own mood entries" ON mood_entries FOR UPDATE USING (auth.uid() = user_id);

-- =====================================================
-- 23. EXPERT MATCHING HISTORY POLICIES
-- =====================================================

-- Users can only access their own expert matching history
CREATE POLICY "Users can view own expert matching" ON expert_matching_history FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own expert matching" ON expert_matching_history FOR INSERT WITH CHECK (auth.uid() = user_id);

-- =====================================================
-- 24. ADDITIONAL SECURITY FUNCTIONS
-- =====================================================

-- Function to check if user owns a therapy program
CREATE OR REPLACE FUNCTION user_owns_therapy_program(program_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM therapy_programs 
        WHERE id = program_id AND therapy_programs.user_id = user_owns_therapy_program.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user owns a therapy session
CREATE OR REPLACE FUNCTION user_owns_therapy_session(session_id UUID, user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM therapy_sessions 
        WHERE id = session_id AND therapy_sessions.user_id = user_owns_therapy_session.user_id
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;