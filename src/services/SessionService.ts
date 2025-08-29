import { supabase } from '../config/supabase';

export interface SessionData {
  id?: string;
  user_id: string;
  created_at?: string;
  updated_at?: string;
  duration_minutes?: number;
  mood_before?: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
  mood_after?: 'very_bad' | 'bad' | 'neutral' | 'good' | 'very_good';
  ai_model_used: string;
  mode_used: 'text' | 'voice' | 'hybrid';
  satisfaction_score?: number;
  session_summary?: string;
}

export interface MessageData {
  id?: string;
  session_id: string;
  role: 'user' | 'assistant';
  content: string;
  created_at?: string;
  ai_model?: string;
  audio_duration?: number;
}

export class SessionService {
  async createSession(sessionData: Omit<SessionData, 'id' | 'created_at' | 'updated_at'>): Promise<string> {
    const { data, error } = await supabase
      .from('sessions')
      .insert([sessionData])
      .select('id')
      .single();

    if (error) throw error;
    return data.id;
  }

  async updateSession(sessionId: string, updates: Partial<SessionData>) {
    const { error } = await supabase
      .from('sessions')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', sessionId);

    if (error) throw error;
  }

  async saveMessage(messageData: Omit<MessageData, 'id' | 'created_at'>) {
    const { error } = await supabase
      .from('messages')
      .insert([messageData]);

    if (error) throw error;
  }

  async getSessionHistory(userId: string, limit: number = 10) {
    const { data, error } = await supabase
      .from('sessions')
      .select(`
        id,
        created_at,
        duration_minutes,
        mood_before,
        mood_after,
        ai_model_used,
        session_summary,
        messages(content, role, created_at)
      `)
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(limit);

    if (error) throw error;
    return data;
  }

  async getSessionMessages(sessionId: string) {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('session_id', sessionId)
      .order('created_at', { ascending: true });

    if (error) throw error;
    return data;
  }
}
