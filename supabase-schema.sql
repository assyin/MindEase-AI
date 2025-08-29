-- MindEase AI - Multi-Conversations Database Schema
-- This file contains all the SQL needed to set up the Supabase database for multi-conversation support

-- Enable RLS (Row Level Security) on all tables
-- All tables will have RLS policies to ensure users can only access their own data

-- ============================================================================
-- CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  theme VARCHAR(50) CHECK (theme IN ('work', 'family', 'health', 'personal', 'therapy', 'custom')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_message TEXT,
  last_message_at TIMESTAMPTZ,
  message_count INTEGER NOT NULL DEFAULT 0,
  mood_context VARCHAR(20) CHECK (mood_context IN ('positive', 'neutral', 'negative', 'mixed')),
  is_archived BOOLEAN NOT NULL DEFAULT FALSE,
  is_favorite BOOLEAN NOT NULL DEFAULT FALSE,
  ai_model_preference VARCHAR(20) CHECK (ai_model_preference IN ('gemini', 'openai', 'claude', 'auto')),
  conversation_mode VARCHAR(20) CHECK (conversation_mode IN ('listening', 'counseling', 'analysis', 'coaching')),
  tags JSONB DEFAULT '[]',
  color VARCHAR(7) DEFAULT '#3B82F6'
);

-- Add indexes for better performance
CREATE INDEX idx_conversations_user_id ON conversations(user_id);
CREATE INDEX idx_conversations_updated_at ON conversations(updated_at DESC);
CREATE INDEX idx_conversations_is_archived ON conversations(is_archived);
CREATE INDEX idx_conversations_is_favorite ON conversations(is_favorite);
CREATE INDEX idx_conversations_theme ON conversations(theme);

-- RLS Policy for conversations
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversations_user_policy ON conversations FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- MESSAGES TABLE (Updated for multi-conversations)
-- ============================================================================
CREATE TABLE messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant')),
  content TEXT NOT NULL,
  timestamp BIGINT NOT NULL,
  model VARCHAR(50),
  input_mode VARCHAR(10) CHECK (input_mode IN ('text', 'voice')),
  ai_model VARCHAR(20) CHECK (ai_model IN ('gemini', 'openai', 'claude')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_messages_conversation_id ON messages(conversation_id);
CREATE INDEX idx_messages_timestamp ON messages(timestamp DESC);
CREATE INDEX idx_messages_role ON messages(role);

-- RLS Policy for messages
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY messages_user_policy ON messages FOR ALL 
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- AI CONTEXTS TABLE
-- ============================================================================
CREATE TABLE ai_contexts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE UNIQUE,
  system_prompt TEXT NOT NULL,
  conversation_history TEXT DEFAULT '',
  personality_traits JSONB DEFAULT '[]',
  user_preferences JSONB DEFAULT '{}',
  mood_context VARCHAR(50) DEFAULT 'neutral',
  session_goals JSONB DEFAULT '[]',
  cached_responses JSONB DEFAULT '{}',
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_ai_contexts_conversation_id ON ai_contexts(conversation_id);
CREATE INDEX idx_ai_contexts_last_updated ON ai_contexts(last_updated DESC);

-- RLS Policy for ai_contexts
ALTER TABLE ai_contexts ENABLE ROW LEVEL SECURITY;
CREATE POLICY ai_contexts_user_policy ON ai_contexts FOR ALL 
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- CONVERSATION SUMMARIES TABLE
-- ============================================================================
CREATE TABLE conversation_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  summary TEXT NOT NULL,
  key_topics JSONB DEFAULT '[]',
  mood_progression TEXT,
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  token_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_conversation_summaries_conversation_id ON conversation_summaries(conversation_id);
CREATE INDEX idx_conversation_summaries_last_updated ON conversation_summaries(last_updated DESC);

-- RLS Policy for conversation_summaries
ALTER TABLE conversation_summaries ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversation_summaries_user_policy ON conversation_summaries FOR ALL 
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- CONVERSATION PATTERNS TABLE
-- ============================================================================
CREATE TABLE conversation_patterns (
  id VARCHAR(255) PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  pattern_type VARCHAR(50) NOT NULL CHECK (pattern_type IN ('mood_trend', 'topic_frequency', 'engagement_level', 'response_time')),
  description TEXT NOT NULL,
  confidence_score DECIMAL(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  detected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  related_conversations JSONB DEFAULT '[]',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes
CREATE INDEX idx_conversation_patterns_conversation_id ON conversation_patterns(conversation_id);
CREATE INDEX idx_conversation_patterns_pattern_type ON conversation_patterns(pattern_type);
CREATE INDEX idx_conversation_patterns_confidence_score ON conversation_patterns(confidence_score DESC);
CREATE INDEX idx_conversation_patterns_detected_at ON conversation_patterns(detected_at DESC);

-- RLS Policy for conversation_patterns
ALTER TABLE conversation_patterns ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversation_patterns_user_policy ON conversation_patterns FOR ALL 
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- CONVERSATION INSIGHTS TABLE
-- ============================================================================
CREATE TABLE conversation_insights (
  id VARCHAR(255) PRIMARY KEY,
  insight_type VARCHAR(20) NOT NULL CHECK (insight_type IN ('recommendation', 'alert', 'progress', 'trend')),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  priority VARCHAR(10) NOT NULL CHECK (priority IN ('low', 'medium', 'high')),
  action_items JSONB DEFAULT '[]',
  related_conversations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Add indexes
CREATE INDEX idx_conversation_insights_user_id ON conversation_insights(user_id);
CREATE INDEX idx_conversation_insights_insight_type ON conversation_insights(insight_type);
CREATE INDEX idx_conversation_insights_priority ON conversation_insights(priority);
CREATE INDEX idx_conversation_insights_created_at ON conversation_insights(created_at DESC);

-- RLS Policy for conversation_insights
ALTER TABLE conversation_insights ENABLE ROW LEVEL SECURITY;
CREATE POLICY conversation_insights_user_policy ON conversation_insights FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- AVATAR INTERACTIONS TABLE
-- ============================================================================
CREATE TABLE avatar_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  avatar_id VARCHAR(100) NOT NULL,
  message_content TEXT NOT NULL,
  audio_url TEXT,
  audio_duration INTEGER,
  voice_synthesis_params JSONB DEFAULT '{}',
  context_used JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for avatar_interactions
CREATE INDEX idx_avatar_interactions_conversation_id ON avatar_interactions(conversation_id);
CREATE INDEX idx_avatar_interactions_avatar_id ON avatar_interactions(avatar_id);
CREATE INDEX idx_avatar_interactions_created_at ON avatar_interactions(created_at DESC);

-- RLS Policy for avatar_interactions
ALTER TABLE avatar_interactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY avatar_interactions_user_policy ON avatar_interactions FOR ALL 
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- MULTI AVATAR DIALOGUES TABLE
-- ============================================================================
CREATE TABLE multi_avatar_dialogues (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id UUID NOT NULL REFERENCES conversations(id) ON DELETE CASCADE,
  participating_avatars JSONB NOT NULL DEFAULT '[]',
  dialogue_topic TEXT NOT NULL,
  turns JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  user_initiated BOOLEAN NOT NULL DEFAULT TRUE,
  dialogue_purpose VARCHAR(50) CHECK (dialogue_purpose IN ('consultation', 'perspective_sharing', 'conflict_resolution', 'collaborative_support'))
);

-- Add indexes for multi_avatar_dialogues
CREATE INDEX idx_multi_avatar_dialogues_conversation_id ON multi_avatar_dialogues(conversation_id);
CREATE INDEX idx_multi_avatar_dialogues_created_at ON multi_avatar_dialogues(created_at DESC);
CREATE INDEX idx_multi_avatar_dialogues_purpose ON multi_avatar_dialogues(dialogue_purpose);

-- RLS Policy for multi_avatar_dialogues
ALTER TABLE multi_avatar_dialogues ENABLE ROW LEVEL SECURITY;
CREATE POLICY multi_avatar_dialogues_user_policy ON multi_avatar_dialogues FOR ALL 
USING (
  conversation_id IN (
    SELECT id FROM conversations WHERE user_id = auth.uid()
  )
);

-- ============================================================================
-- AVATAR PREFERENCES TABLE
-- ============================================================================
CREATE TABLE avatar_preferences (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
  favorite_avatars JSONB DEFAULT '[]',
  voice_settings JSONB DEFAULT '{}',
  dialogue_preferences JSONB DEFAULT '{}',
  auto_select_avatar BOOLEAN DEFAULT TRUE,
  preferred_avatar_combinations JSONB DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add indexes for avatar_preferences
CREATE INDEX idx_avatar_preferences_user_id ON avatar_preferences(user_id);

-- RLS Policy for avatar_preferences
ALTER TABLE avatar_preferences ENABLE ROW LEVEL SECURITY;
CREATE POLICY avatar_preferences_user_policy ON avatar_preferences FOR ALL USING (auth.uid() = user_id);

-- ============================================================================
-- UPDATE EXISTING TABLES FOR AVATAR SUPPORT
-- ============================================================================

-- Add avatar_context column to ai_contexts table
ALTER TABLE ai_contexts ADD COLUMN IF NOT EXISTS current_avatar_id VARCHAR(100);
ALTER TABLE ai_contexts ADD COLUMN IF NOT EXISTS avatar_history JSONB DEFAULT '[]';
ALTER TABLE ai_contexts ADD COLUMN IF NOT EXISTS avatar_switch_count INTEGER DEFAULT 0;

-- Add avatar_id column to messages table for tracking which avatar generated the response
ALTER TABLE messages ADD COLUMN IF NOT EXISTS avatar_id VARCHAR(100);

-- ============================================================================
-- UPDATE EXISTING USER PROFILES TABLE
-- ============================================================================
-- Add new columns to support multi-conversations and avatars
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS active_conversations JSONB DEFAULT '[]';
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS max_conversations INTEGER DEFAULT 10;
ALTER TABLE user_profiles ADD COLUMN IF NOT EXISTS preferred_avatar VARCHAR(100);

-- ============================================================================
-- FUNCTIONS AND TRIGGERS
-- ============================================================================

-- Function to update the updated_at column
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for conversations table
CREATE TRIGGER update_conversations_updated_at 
  BEFORE UPDATE ON conversations 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to update the last_updated column for ai_contexts
CREATE OR REPLACE FUNCTION update_last_updated_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.last_updated = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for ai_contexts table
CREATE TRIGGER update_ai_contexts_last_updated 
  BEFORE UPDATE ON ai_contexts 
  FOR EACH ROW EXECUTE FUNCTION update_last_updated_column();

-- Function to update conversation metadata when messages are added
CREATE OR REPLACE FUNCTION update_conversation_on_message()
RETURNS TRIGGER AS $$
BEGIN
  -- Update message count and last message info
  UPDATE conversations 
  SET 
    message_count = message_count + 1,
    last_message = CASE WHEN LENGTH(NEW.content) > 100 THEN LEFT(NEW.content, 100) || '...' ELSE NEW.content END,
    last_message_at = to_timestamp(NEW.timestamp / 1000),
    updated_at = NOW()
  WHERE id = NEW.conversation_id;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for messages table
CREATE TRIGGER update_conversation_on_message_insert 
  AFTER INSERT ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message();

-- Function to decrement message count when messages are deleted
CREATE OR REPLACE FUNCTION update_conversation_on_message_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE conversations 
  SET message_count = GREATEST(0, message_count - 1)
  WHERE id = OLD.conversation_id;
  
  RETURN OLD;
END;
$$ language 'plpgsql';

-- Trigger for message deletion
CREATE TRIGGER update_conversation_on_message_delete 
  AFTER DELETE ON messages 
  FOR EACH ROW EXECUTE FUNCTION update_conversation_on_message_delete();

-- ============================================================================
-- INITIAL DATA AND CLEANUP
-- ============================================================================

-- Function to clean up old patterns and insights
CREATE OR REPLACE FUNCTION cleanup_old_analytics()
RETURNS void AS $$
BEGIN
  -- Delete patterns older than 30 days
  DELETE FROM conversation_patterns 
  WHERE detected_at < NOW() - INTERVAL '30 days';
  
  -- Delete insights older than 60 days
  DELETE FROM conversation_insights 
  WHERE created_at < NOW() - INTERVAL '60 days';
  
  -- Clean up old avatar interactions (keep only last 90 days)
  DELETE FROM avatar_interactions 
  WHERE created_at < NOW() - INTERVAL '90 days';
END;
$$ language 'plpgsql';

-- Function to update avatar preferences updated_at
CREATE OR REPLACE FUNCTION update_avatar_preferences_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for avatar_preferences table
CREATE TRIGGER update_avatar_preferences_updated_at 
  BEFORE UPDATE ON avatar_preferences 
  FOR EACH ROW EXECUTE FUNCTION update_avatar_preferences_updated_at();

-- Function to track avatar switches
CREATE OR REPLACE FUNCTION track_avatar_switch()
RETURNS TRIGGER AS $$
BEGIN
  -- If current_avatar_id changed, increment switch count and update history
  IF OLD.current_avatar_id IS DISTINCT FROM NEW.current_avatar_id THEN
    NEW.avatar_switch_count = COALESCE(OLD.avatar_switch_count, 0) + 1;
    
    -- Add to avatar history
    NEW.avatar_history = COALESCE(OLD.avatar_history, '[]'::jsonb) || 
      jsonb_build_object(
        'avatar_id', NEW.current_avatar_id,
        'switched_at', NOW()::text
      );
  END IF;
  
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for ai_contexts avatar switches
CREATE TRIGGER track_avatar_switch 
  BEFORE UPDATE ON ai_contexts 
  FOR EACH ROW EXECUTE FUNCTION track_avatar_switch();

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for conversation statistics
CREATE VIEW conversation_stats AS
SELECT 
  c.id,
  c.name,
  c.user_id,
  c.theme,
  c.message_count,
  c.created_at,
  c.updated_at,
  CASE 
    WHEN c.updated_at >= NOW() - INTERVAL '1 day' THEN 'active'
    WHEN c.updated_at >= NOW() - INTERVAL '7 days' THEN 'recent'
    ELSE 'inactive'
  END as activity_status,
  EXTRACT(DAYS FROM NOW() - c.created_at) as age_in_days,
  COALESCE(c.message_count::float / NULLIF(EXTRACT(DAYS FROM NOW() - c.created_at), 0), 0) as messages_per_day
FROM conversations c;

-- View for user conversation summary
CREATE VIEW user_conversation_summary AS
SELECT 
  user_id,
  COUNT(*) as total_conversations,
  COUNT(*) FILTER (WHERE is_archived = false) as active_conversations,
  COUNT(*) FILTER (WHERE is_favorite = true) as favorite_conversations,
  SUM(message_count) as total_messages,
  AVG(message_count) as avg_messages_per_conversation,
  MAX(updated_at) as last_activity
FROM conversations
GROUP BY user_id;

-- View for avatar interaction statistics
CREATE VIEW avatar_interaction_stats AS
SELECT 
  ai.avatar_id,
  COUNT(*) as total_interactions,
  COUNT(DISTINCT ai.conversation_id) as unique_conversations,
  AVG(ai.audio_duration) as avg_audio_duration,
  COUNT(*) FILTER (WHERE ai.audio_url IS NOT NULL) as audio_responses,
  MIN(ai.created_at) as first_interaction,
  MAX(ai.created_at) as last_interaction
FROM avatar_interactions ai
GROUP BY ai.avatar_id;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

-- Grant necessary permissions to authenticated users
GRANT SELECT, INSERT, UPDATE, DELETE ON conversations TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON messages TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON ai_contexts TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_summaries TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_patterns TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON conversation_insights TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON avatar_interactions TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON multi_avatar_dialogues TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON avatar_preferences TO authenticated;

-- Grant select on views
GRANT SELECT ON conversation_stats TO authenticated;
GRANT SELECT ON user_conversation_summary TO authenticated;
GRANT SELECT ON avatar_interaction_stats TO authenticated;

-- ============================================================================
-- NOTIFICATIONS TABLE
-- ============================================================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  type VARCHAR(50) NOT NULL CHECK (type IN ('session_reminder', 'mood_check', 'progress_update', 'avatar_message', 'system_alert', 'achievement')),
  title VARCHAR(255) NOT NULL,
  message TEXT NOT NULL,
  priority VARCHAR(20) NOT NULL DEFAULT 'medium' CHECK (priority IN ('low', 'medium', 'high', 'urgent')),
  read BOOLEAN NOT NULL DEFAULT FALSE,
  action_url VARCHAR(500),
  action_label VARCHAR(100),
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  scheduled_for TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,
  notification_channel VARCHAR(50) DEFAULT 'app' CHECK (notification_channel IN ('app', 'push', 'email', 'sms'))
);

-- Add indexes for notifications
CREATE INDEX idx_notifications_user_id ON notifications(user_id);
CREATE INDEX idx_notifications_created_at ON notifications(created_at DESC);
CREATE INDEX idx_notifications_read ON notifications(read);
CREATE INDEX idx_notifications_priority ON notifications(priority);
CREATE INDEX idx_notifications_type ON notifications(type);
CREATE INDEX idx_notifications_scheduled_for ON notifications(scheduled_for);

-- RLS Policy for notifications
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
CREATE POLICY notifications_user_policy ON notifications FOR ALL USING (auth.uid() = user_id);

-- Grant permissions for notifications
GRANT SELECT, INSERT, UPDATE, DELETE ON notifications TO authenticated;

-- ============================================================================
-- COMMENTS FOR DOCUMENTATION
-- ============================================================================

COMMENT ON TABLE conversations IS 'Stores individual conversations for each user with metadata and settings';
COMMENT ON TABLE messages IS 'Stores all messages within conversations with support for different AI models and avatars';
COMMENT ON TABLE ai_contexts IS 'Stores AI context and state for each conversation to maintain continuity with avatar support';
COMMENT ON TABLE conversation_summaries IS 'Stores auto-generated summaries of conversations for quick overview';
COMMENT ON TABLE conversation_patterns IS 'Stores detected patterns and trends within conversations';
COMMENT ON TABLE conversation_insights IS 'Stores AI-generated insights and recommendations based on conversation analysis';
COMMENT ON TABLE avatar_interactions IS 'Stores avatar-specific interactions including voice synthesis and context data';
COMMENT ON TABLE multi_avatar_dialogues IS 'Stores multi-avatar dialogue sessions between multiple therapeutic AI avatars';
COMMENT ON TABLE avatar_preferences IS 'Stores user preferences for avatar selection, voice settings, and dialogue configurations';

-- ============================================================================
-- EXAMPLE USAGE AND TESTING QUERIES
-- ============================================================================

-- Example: Create a test conversation (commented out)
/*
INSERT INTO conversations (user_id, name, theme, conversation_mode) 
VALUES (auth.uid(), 'Test Conversation', 'personal', 'listening');

-- Example: Query user's active conversations
SELECT * FROM conversations 
WHERE user_id = auth.uid() AND is_archived = false 
ORDER BY updated_at DESC;

-- Example: Get conversation with message count
SELECT c.*, COUNT(m.id) as actual_message_count 
FROM conversations c 
LEFT JOIN messages m ON c.id = m.conversation_id 
WHERE c.user_id = auth.uid() 
GROUP BY c.id;
*/

-- End of schema file
-- Execute this file in your Supabase SQL editor to set up the multi-conversation system