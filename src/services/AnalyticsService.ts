import { supabase } from '../config/supabase';
import { format, subDays, subWeeks, subMonths, startOfWeek, endOfWeek, eachDayOfInterval } from 'date-fns';
import { fr } from 'date-fns/locale';
import { UserInteraction, DashboardMetrics } from '../types';

export interface MoodData {
  date: string;
  mood_before: number;
  mood_after: number;
  improvement: number;
}

export class AnalyticsService {
  private interactions: UserInteraction[] = [];
  private batchSize = 10;

  trackInteraction(interaction: UserInteraction) {
    this.interactions.push({
      ...interaction,
      timestamp: Date.now()
    });

    if (this.interactions.length >= this.batchSize) {
      this.flushToDB();
    }
  }

  async flushToDB() {
    if (this.interactions.length === 0) return;

    try {
      const { error } = await supabase
        .from('user_interactions')
        .insert(this.interactions);

      if (!error) {
        this.interactions = [];
      }
    } catch (error) {
      console.error('Erreur envoi analytics:', error);
    }
  }

  async getDashboardMetrics(userId: string, timeRange: 'week' | 'month' | 'all'): Promise<DashboardMetrics> {
    try {
      const now = new Date();
      let startDate: Date;
      
      switch (timeRange) {
        case 'week':
          startDate = subWeeks(now, 1);
          break;
        case 'month':
          startDate = subMonths(now, 1);
          break;
        default:
          startDate = new Date('2023-01-01');
      }

      const [sessionsData, messagesData, interactionsData] = await Promise.all([
        this.getSessionsData(userId, startDate),
        this.getMessagesData(userId, startDate),
        this.getInteractionsData(userId, startDate)
      ]);

      const weeklyProgress = await this.getWeeklyProgress(userId);
      const monthlyProgress = await this.getMonthlyProgress(userId);
      const moodTrend = await this.getMoodTrend(userId, startDate);
      const streakDays = await this.getStreakDays(userId);
      const averageSessionTime = this.calculateAverageSessionTime(sessionsData);
      const voiceUsagePercent = this.calculateVoiceUsage(interactionsData);
      const preferredModel = this.getPreferredModel(sessionsData);
      const satisfactionScore = this.calculateSatisfactionScore(sessionsData);

      return {
        totalSessions: sessionsData.length,
        averageSessionTime,
        voiceUsagePercent,
        preferredModel,
        moodTrend,
        weeklyProgress,
        monthlyProgress,
        streakDays,
        totalMessages: messagesData.length,
        satisfactionScore
      };
    } catch (error) {
      console.error('Erreur récupération métriques:', error);
      return this.getDefaultMetrics();
    }
  }

  private async getSessionsData(userId: string, startDate: Date) {
    const { data, error } = await supabase
      .from('sessions')
      .select('*')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false });
    
    if (error) throw error;
    return data || [];
  }

  private async getMessagesData(userId: string, startDate: Date) {
    const { data, error } = await supabase
      .from('messages')
      .select('*, sessions!inner(user_id)')
      .eq('sessions.user_id', userId)
      .gte('created_at', startDate.toISOString());
    
    if (error) throw error;
    return data || [];
  }

  private async getInteractionsData(userId: string, startDate: Date) {
    const { data, error } = await supabase
      .from('user_interactions')
      .select('*')
      .eq('userId', userId)
      .gte('timestamp', startDate.getTime());
    
    if (error) throw error;
    return data || [];
  }

  private async getWeeklyProgress(userId: string): Promise<number[]> {
    const weekStart = startOfWeek(new Date(), { locale: fr });
    const weekEnd = endOfWeek(new Date(), { locale: fr });
    
    const days = eachDayOfInterval({ start: weekStart, end: weekEnd });
    const progress = await Promise.all(
      days.map(async (day) => {
        const { count, error } = await supabase
          .from('sessions')
          .select('*', { count: 'exact' })
          .eq('user_id', userId)
          .gte('created_at', day.toISOString())
          .lt('created_at', new Date(day.getTime() + 24 * 60 * 60 * 1000).toISOString());
        
        return error ? 0 : (count || 0);
      })
    );
    
    return progress;
  }

  private async getMonthlyProgress(userId: string) {
    const startDate = subMonths(new Date(), 1);
    const { data, error } = await supabase
      .from('sessions')
      .select('created_at, mood_before, mood_after')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .order('created_at');
    
    if (error || !data) return [];
    
    const groupedByDate = data.reduce((acc: any, session) => {
      const date = format(new Date(session.created_at), 'yyyy-MM-dd');
      if (!acc[date]) {
        acc[date] = { sessions: 0, moodSum: 0, moodCount: 0 };
      }
      acc[date].sessions++;
      if (session.mood_after) {
        acc[date].moodSum += parseInt(session.mood_after);
        acc[date].moodCount++;
      }
      return acc;
    }, {});
    
    return Object.entries(groupedByDate).map(([date, data]: [string, any]) => ({
      date,
      sessions: data.sessions,
      mood: data.moodCount > 0 ? data.moodSum / data.moodCount : 0
    }));
  }

  private async getMoodTrend(userId: string, startDate: Date): Promise<'positive' | 'neutral' | 'negative'> {
    const { data, error } = await supabase
      .from('sessions')
      .select('mood_before, mood_after')
      .eq('user_id', userId)
      .gte('created_at', startDate.toISOString())
      .not('mood_before', 'is', null)
      .not('mood_after', 'is', null);
    
    if (error || !data || data.length === 0) return 'neutral';
    
    const improvements = data.map(session => {
      const before = parseInt(session.mood_before);
      const after = parseInt(session.mood_after);
      return after - before;
    });
    
    const averageImprovement = improvements.reduce((sum, imp) => sum + imp, 0) / improvements.length;
    
    if (averageImprovement > 0.5) return 'positive';
    if (averageImprovement < -0.5) return 'negative';
    return 'neutral';
  }

  private async getStreakDays(userId: string): Promise<number> {
    const { data, error } = await supabase
      .from('sessions')
      .select('created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(30);
    
    if (error || !data) return 0;
    
    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);
    
    for (const session of data) {
      const sessionDate = new Date(session.created_at);
      sessionDate.setHours(0, 0, 0, 0);
      
      if (sessionDate.getTime() === currentDate.getTime()) {
        streak++;
        currentDate = subDays(currentDate, 1);
      } else if (sessionDate.getTime() < currentDate.getTime()) {
        break;
      }
    }
    
    return streak;
  }

  private calculateAverageSessionTime(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const totalDuration = sessions.reduce((sum, session) => sum + (session.duration_minutes || 0), 0);
    return Math.round((totalDuration / sessions.length) * 10) / 10;
  }

  private calculateVoiceUsage(interactions: any[]): number {
    if (interactions.length === 0) return 0;
    const voiceInteractions = interactions.filter(i => i.type === 'voice_used').length;
    return Math.round((voiceInteractions / interactions.length) * 100);
  }

  private getPreferredModel(sessions: any[]): string {
    if (sessions.length === 0) return 'gemini';
    const modelCounts = sessions.reduce((acc: any, session) => {
      const model = session.ai_model_used || 'gemini';
      acc[model] = (acc[model] || 0) + 1;
      return acc;
    }, {});
    
    return Object.keys(modelCounts).reduce((a, b) => 
      modelCounts[a] > modelCounts[b] ? a : b
    );
  }

  private calculateSatisfactionScore(sessions: any[]): number {
    if (sessions.length === 0) return 0;
    const scores = sessions.filter(s => s.satisfaction_score).map(s => s.satisfaction_score);
    if (scores.length === 0) return 0;
    return Math.round((scores.reduce((sum: number, score: number) => sum + score, 0) / scores.length) * 10) / 10;
  }

  private getDefaultMetrics(): DashboardMetrics {
    return {
      totalSessions: 0,
      averageSessionTime: 0,
      voiceUsagePercent: 0,
      preferredModel: 'gemini',
      moodTrend: 'neutral',
      weeklyProgress: [0, 0, 0, 0, 0, 0, 0],
      monthlyProgress: [],
      streakDays: 0,
      totalMessages: 0,
      satisfactionScore: 0
    };
  }

  getSessionMetrics() {
    return {
      totalMessages: this.interactions.filter(i => i.type === 'message_sent').length,
      voiceUsage: this.interactions.filter(i => i.type === 'voice_used').length,
      sessionDuration: this.getSessionDuration()
    };
  }

  private getSessionDuration() {
    if (this.interactions.length === 0) return 0;
    const first = this.interactions[0].timestamp;
    const last = this.interactions[this.interactions.length - 1].timestamp;
    return last - first;
  }

  async exportUserData(userId: string, format: 'json' | 'csv'): Promise<string> {
    try {
      const metrics = await this.getDashboardMetrics(userId, 'all');
      
      const [sessions, messages] = await Promise.all([
        supabase.from('sessions').select('*').eq('user_id', userId),
        supabase.from('messages').select('*, sessions!inner(user_id)').eq('sessions.user_id', userId)
      ]);
      
      const exportData = {
        user_id: userId,
        export_date: new Date().toISOString(),
        metrics,
        sessions: sessions.data || [],
        messages: messages.data || []
      };
      
      if (format === 'json') {
        return JSON.stringify(exportData, null, 2);
      } else {
        return this.convertToCSV(exportData);
      }
    } catch (error) {
      console.error('Erreur export données:', error);
      throw error;
    }
  }

  private convertToCSV(data: any): string {
    const csvLines = [];
    
    csvLines.push('Type,Date,Value');
    csvLines.push(`Total Sessions,${data.export_date},${data.metrics.totalSessions}`);
    csvLines.push(`Average Session Time,${data.export_date},${data.metrics.averageSessionTime}`);
    csvLines.push(`Voice Usage,${data.export_date},${data.metrics.voiceUsagePercent}%`);
    csvLines.push(`Satisfaction Score,${data.export_date},${data.metrics.satisfactionScore}`);
    
    return csvLines.join('\n');
  }
}
  