import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  throw new Error('Missing Supabase configuration');
}

export const supabase = createClient(supabaseUrl, supabaseKey);

// Types de la base de données
export interface User {
  id: string;
  email: string;
  created_at: string;
  preferred_ai_model?: 'gemini' | 'openai' | 'auto';
  preferred_mode?: 'text' | 'voice' | 'hybrid';
}

export interface Session {
  id: string;
  user_id: string;
  created_at: string;
  updated_at: string;
  duration_minutes?: number;
  mood_before?: string;
  mood_after?: string;
  ai_model_used: string;
  mode_used: string;
  satisfaction_score?: number;
}

export interface Message {
  id: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at: string;
  ai_model?: string;
  audio_duration?: number;
}
