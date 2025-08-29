export interface Message {
    id: string;
    conversation_id: string;
    role: 'user' | 'assistant';
    content: string;
    timestamp: number;
    model?: string;
    ai_model?: 'gemini' | 'openai' | 'claude';
  }

  export interface Conversation {
    id: string;
    user_id: string;
    name: string;
    theme?: 'work' | 'family' | 'health' | 'personal' | 'therapy' | 'custom';
    created_at: string;
    updated_at: string;
    last_message?: string;
    last_message_at?: string;
    message_count: number;
    mood_context?: 'positive' | 'neutral' | 'negative' | 'mixed';
    is_archived: boolean;
    is_favorite: boolean;
    ai_model_preference?: 'gemini' | 'openai' | 'claude' | 'auto';
    conversation_mode?: 'listening' | 'counseling' | 'analysis' | 'coaching';
    tags?: string[];
    color?: string;
  }

  export interface ConversationSummary {
    conversation_id: string;
    summary: string;
    key_topics: string[];
    mood_progression: string;
    last_updated: string;
    token_count: number;
  }

  export interface AIContext {
    conversation_id: string;
    system_prompt: string;
    conversation_history: string;
    personality_traits: string[];
    user_preferences: Record<string, any>;
    mood_context: string;
    session_goals: string[];
    cached_responses: Record<string, string>;
    last_updated: string;
  }
  
  export interface ConversationPattern {
    id: string;
    pattern_type: 'mood_trend' | 'topic_frequency' | 'engagement_level' | 'response_time';
    description: string;
    confidence_score: number;
    detected_at: string;
    related_conversations: string[];
    metadata: Record<string, any>;
  }

  export interface ConversationInsight {
    id: string;
    insight_type: 'recommendation' | 'alert' | 'progress' | 'trend';
    title: string;
    description: string;
    priority: 'low' | 'medium' | 'high';
    action_items: string[];
    related_conversations: string[];
    created_at: string;
  }

  export interface Avatar {
    id: string;
    name: string;
    specialization: 'therapist' | 'coach' | 'meditation' | 'analyst';
    description: string;
    personality_traits: string[];
    voice_config: VoiceConfig;
    system_prompt_template: string;
    conversation_style: ConversationStyle;
    emoji: string;
    color_theme: string;
    expertise_areas: string[];
    introduction_message: string;
    preferred_scenarios: string[];
    language?: string; // langue principale de l'avatar (fr, ar, en)
    cultural_background?: string; // contexte culturel (french, moroccan, etc.)
    supports_rtl?: boolean; // supporte l'écriture de droite à gauche
  }

  export interface VoiceConfig {
    voice_id: string;
    language_code: string;
    speaking_rate: number; // 0.25 to 4.0
    pitch: number; // -20.0 to 20.0
    volume_gain_db: number; // -96.0 to 16.0
    emotional_tone: 'empathetic' | 'energetic' | 'calming' | 'analytical' | 'supportive';
    pause_duration: number; // milliseconds between sentences
    emphasis_words: string[]; // words to emphasize
    accent?: string; // pour les accents spécifiques (ex: 'casablanca', 'rabat')
    cultural_context?: string; // contexte culturel spécifique
  }

  export interface ConversationStyle {
    greeting_style: 'formal' | 'casual' | 'warm' | 'professional';
    question_approach: 'direct' | 'gentle' | 'exploratory' | 'structured';
    response_length: 'concise' | 'moderate' | 'detailed';
    empathy_level: 'low' | 'medium' | 'high';
    use_metaphors: boolean;
    encourage_reflection: boolean;
    offer_practical_advice: boolean;
    check_in_frequency: 'rare' | 'occasional' | 'frequent';
  }

  export interface AvatarInteraction {
    id: string;
    conversation_id: string;
    avatar_id: string;
    message_content: string;
    audio_url?: string;
    audio_duration?: number;
    generated_at: string;
    voice_synthesis_params: VoiceConfig;
    context_used: string;
    user_feedback?: 'helpful' | 'neutral' | 'unhelpful';
  }

  export interface MultiAvatarDialogue {
    id: string;
    conversation_id: string;
    participating_avatars: string[];
    dialogue_topic: string;
    turns: DialogueTurn[];
    created_at: string;
    user_initiated: boolean;
    dialogue_purpose: 'consultation' | 'perspective_sharing' | 'conflict_resolution' | 'collaborative_support';
  }

  export interface DialogueTurn {
    avatar_id: string;
    content: string;
    audio_url?: string;
    timestamp: string;
    addressing_avatar?: string; // which avatar they're responding to
    user_visible: boolean;
  }

  export interface AvatarPreferences {
    user_id: string;
    preferred_avatar_id: string;
    avatar_settings: Record<string, any>; // per-avatar customizations
    voice_speed_multiplier: number;
    auto_play_audio: boolean;
    dialogue_mode_enabled: boolean;
    preferred_dialogue_combinations: string[][]; // avatar pairs/groups
    last_updated: string;
  }

  export interface UserProfile {
    id: string;
    email: string;
    full_name?: string;
    preferred_ai_model: 'gemini' | 'openai' | 'auto';
    preferred_mode: 'text' | 'voice' | 'hybrid';
    created_at: string;
    total_sessions: number;
    subscription_type: 'free' | 'standard' | 'premium';
    active_conversations: string[];
    max_conversations: number;
    preferred_avatar_id?: string;
    avatar_preferences?: AvatarPreferences;
  }

  export interface Session {
    id: string;
    user_id: string;
    conversation_id: string;
    created_at: string;
    ended_at?: string;
    duration_minutes?: number;
    ai_model_used?: 'gemini' | 'openai' | 'claude';
    mood_before?: string;
    mood_after?: string;
    satisfaction_score?: number;
    session_type: 'therapy' | 'coaching' | 'analysis' | 'meditation';
    goals_achieved?: string[];
    notes?: string;
    voice_used: boolean;
    message_count: number;
  }

  export interface UserInteraction {
    id: string;
    user_id: string;
    session_id?: string;
    type: 'message_sent' | 'voice_used' | 'model_switched' | 'session_started' | 'mood_tracked';
    timestamp: number;
    metadata?: Record<string, any>;
  }

  export interface DashboardMetrics {
    totalSessions: number;
    averageSessionTime: number;
    voiceUsagePercent: number;
    preferredModel: string;
    moodTrend: 'positive' | 'neutral' | 'negative';
    weeklyProgress: number[];
    monthlyProgress: { date: string; sessions: number; mood: number }[];
    streakDays: number;
    totalMessages: number;
    satisfactionScore: number;
  }

  export interface MoodEntry {
    id: string;
    user_id: string;
    session_id?: string;
    mood_score: number; // 1-5
    mood_notes?: string;
    timestamp: string;
    mood_factors?: string[];
    improvement_since_last?: number;
  }

  export interface UserGoal {
    id: string;
    user_id: string;
    title: string;
    description: string;
    target_metric: 'sessions_per_week' | 'mood_improvement' | 'streak_days' | 'satisfaction_score';
    target_value: number;
    current_value: number;
    deadline?: string;
    created_at: string;
    completed_at?: string;
    is_active: boolean;
    progress_percentage: number;
  }

  export interface LanguageSettings {
    current_language: 'fr' | 'ar' | 'en';
    preferred_languages: string[];
    auto_detect_language: boolean;
    rtl_enabled: boolean;
    arabic_keyboard_enabled: boolean;
  }

  export interface CulturalContext {
    region: 'france' | 'morocco' | 'mena' | 'international';
    traditions: string[];
    values: string[];
    greeting_style: string;
    communication_preferences: string[];
  }
  