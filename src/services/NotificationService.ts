import { supabase } from '../config/supabase';

export interface Notification {
  id: string;
  user_id?: string;
  type: 'reminder' | 'tip' | 'achievement' | 'system' | 'mood_check' | 'milestone' | 'encouragement';
  category: 'wellness' | 'progress' | 'social' | 'system' | 'achievement';
  title: string;
  message: string;
  timestamp: number;
  read: boolean;
  priority: 'low' | 'medium' | 'high';
  actionUrl?: string;
  actionLabel?: string;
  icon?: string;
  image?: string;
  metadata?: Record<string, any>;
  expiresAt?: number;
  created_at?: string;
}

export interface NotificationPreferences {
  enabled: boolean;
  types: {
    reminder: boolean;
    tip: boolean;
    achievement: boolean;
    system: boolean;
    mood_check: boolean;
    milestone: boolean;
    encouragement: boolean;
  };
  frequency: 'none' | 'low' | 'medium' | 'high';
  quiet_hours: {
    enabled: boolean;
    start: string; // HH:MM format
    end: string;   // HH:MM format
  };
  push_notifications: boolean;
  sound_enabled: boolean;
  vibration_enabled: boolean;
}

interface NotificationRule {
  id: string;
  name: string;
  condition: (context: NotificationContext) => boolean;
  createNotification: (context: NotificationContext) => Omit<Notification, 'id' | 'timestamp' | 'read' | 'user_id'>;
  frequency: number; // heures entre notifications
  lastTriggered?: number;
}

interface NotificationContext {
  user_id: string;
  lastSessionDate?: Date;
  sessionCount: number;
  moodTrend: 'positive' | 'neutral' | 'negative';
  streakDays: number;
  averageSessionTime: number;
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  daysSinceLastSession: number;
}

export class NotificationService {
  private notifications: Notification[] = [];
  private listeners: Array<(notifications: Notification[]) => void> = [];
  private preferences: NotificationPreferences;
  private rules: NotificationRule[] = [];
  private reminderIntervals: Map<string, NodeJS.Timeout> = new Map();

  constructor() {
    this.preferences = this.loadPreferences();
    this.initializeRules();
    this.loadNotifications();
    this.setupPeriodicReminders();
  }

  private loadPreferences(): NotificationPreferences {
    const stored = localStorage.getItem('notification_preferences');
    if (stored) {
      return JSON.parse(stored);
    }
    
    // Préférences par défaut
    return {
      enabled: true,
      types: {
        reminder: true,
        tip: true,
        achievement: true,
        system: true,
        mood_check: true,
        milestone: true,
        encouragement: true
      },
      frequency: 'medium',
      quiet_hours: {
        enabled: true,
        start: '22:00',
        end: '08:00'
      },
      push_notifications: false,
      sound_enabled: true,
      vibration_enabled: true
    };
  }

  private async loadNotifications() {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return;

      const { data, error } = await supabase
        .from('notifications')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;
      
      this.notifications = (data || []).map(notification => ({
        ...notification,
        timestamp: new Date(notification.created_at).getTime()
      }));
      
      this.notifyListeners();
    } catch (error) {
      console.error('Erreur chargement notifications:', error);
    }
  }

  private async getCurrentUserId(): Promise<string | null> {
    const { data: { user } } = await supabase.auth.getUser();
    return user?.id || null;
  }

  private initializeRules() {
    this.rules = [
      // Rappel de session quotidienne
      {
        id: 'daily_session_reminder',
        name: 'Rappel session quotidienne',
        condition: (ctx) => ctx.daysSinceLastSession >= 1,
        createNotification: (ctx) => ({
          type: 'reminder',
          category: 'wellness',
          title: 'Moment de bien-être',
          message: ctx.daysSinceLastSession === 1 
            ? 'Comment vous sentez-vous aujourd\'hui ? Prenez quelques minutes pour vous.' 
            : `Cela fait ${ctx.daysSinceLastSession} jours. Votre bien-être vous manque ! 🌱`,
          priority: ctx.daysSinceLastSession >= 3 ? 'high' : 'medium',
          icon: '🧘‍♀️',
          actionUrl: '/chat',
          actionLabel: 'Commencer une session'
        }),
        frequency: 24
      },

      // Encouragement pour série
      {
        id: 'streak_encouragement',
        name: 'Encouragement série',
        condition: (ctx) => ctx.streakDays >= 3 && ctx.streakDays % 7 === 0,
        createNotification: (ctx) => ({
          type: 'achievement',
          category: 'achievement',
          title: 'Belle série ! 🔥',
          message: `${ctx.streakDays} jours consécutifs ! Vous développez une excellente habitude de bien-être.`,
          priority: 'high',
          icon: '🎉',
          actionUrl: '/dashboard',
          actionLabel: 'Voir mes progrès'
        }),
        frequency: 168 // Une fois par semaine
      },

      // Vérification d'humeur contextuelle
      {
        id: 'mood_check_negative',
        name: 'Vérification humeur négative',
        condition: (ctx) => ctx.moodTrend === 'negative',
        createNotification: (ctx) => ({
          type: 'mood_check',
          category: 'wellness',
          title: 'Comment allez-vous ? 💙',
          message: 'J\'ai remarqué que votre humeur semble difficile ces derniers temps. Voulez-vous en parler ?',
          priority: 'high',
          icon: '🤗',
          actionUrl: '/chat',
          actionLabel: 'Parler maintenant'
        }),
        frequency: 48
      },

      // Conseil personnalisé basé sur l'usage
      {
        id: 'personalized_tip',
        name: 'Conseil personnalisé',
        condition: (ctx) => ctx.sessionCount >= 5,
        createNotification: (ctx) => {
          const tips = ctx.averageSessionTime < 5 
            ? [
                'Prendre plus de temps pour approfondir vos réflexions pourrait être bénéfique 🌱',
                'Essayez d\'explorer vos émotions plus en détail lors de vos prochaines sessions 💭'
              ]
            : [
                'Vos sessions approfondies sont excellentes ! Continuez ce beau travail 🌟',
                'Votre engagement dans le processus est remarquable ! 👏'
              ];
          
          return {
            type: 'tip',
            category: 'progress',
            title: 'Conseil personnalisé',
            message: tips[Math.floor(Math.random() * tips.length)],
            priority: 'medium',
            icon: '💡',
            actionUrl: '/dashboard',
            actionLabel: 'Voir mes statistiques'
          };
        },
        frequency: 72
      }
    ];
  }

  private setupPeriodicReminders() {
    // Vérification intelligente toutes les heures
    setInterval(() => {
      this.checkIntelligentReminders();
    }, 60 * 60 * 1000);

    // Nettoyage des notifications expirées
    setInterval(() => {
      this.cleanupExpiredNotifications();
    }, 6 * 60 * 60 * 1000); // Toutes les 6 heures
  }

  private async checkIntelligentReminders() {
    if (!this.preferences.enabled || this.isInQuietHours()) {
      return;
    }

    try {
      const context = await this.getNotificationContext();
      if (!context) return;

      for (const rule of this.rules) {
        if (this.shouldTriggerRule(rule, context)) {
          const notification = rule.createNotification(context);
          await this.addNotification(notification);
          rule.lastTriggered = Date.now();
        }
      }
    } catch (error) {
      console.error('Erreur vérification rappels intelligents:', error);
    }
  }

  private shouldTriggerRule(rule: NotificationRule, context: NotificationContext): boolean {
    // Vérifier si le type de notification est activé
    if (!this.preferences.types[rule.createNotification(context).type]) {
      return false;
    }

    // Vérifier la fréquence
    if (rule.lastTriggered) {
      const hoursSinceLastTrigger = (Date.now() - rule.lastTriggered) / (1000 * 60 * 60);
      if (hoursSinceLastTrigger < rule.frequency) {
        return false;
      }
    }

    // Vérifier la condition
    return rule.condition(context);
  }

  private async getNotificationContext(): Promise<NotificationContext | null> {
    try {
      const userId = await this.getCurrentUserId();
      if (!userId) return null;

      // Récupérer les données de session récentes
      const { data: sessions } = await supabase
        .from('sessions')
        .select('created_at, duration_minutes')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(10);

      // Récupérer les données d'humeur récentes
      const { data: moods } = await supabase
        .from('mood_entries')
        .select('mood_rating, created_at')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(7);

      const now = new Date();
      const lastSession = sessions?.[0];
      const lastSessionDate = lastSession ? new Date(lastSession.created_at) : null;
      const daysSinceLastSession = lastSessionDate 
        ? Math.floor((now.getTime() - lastSessionDate.getTime()) / (1000 * 60 * 60 * 24))
        : 999;

      // Calculer la tendance d'humeur
      let moodTrend: 'positive' | 'neutral' | 'negative' = 'neutral';
      if (moods && moods.length >= 2) {
        const recentMoods = moods.slice(0, 3);
        const olderMoods = moods.slice(3, 6);
        const recentAvg = recentMoods.reduce((sum, m) => sum + m.mood_rating, 0) / recentMoods.length;
        const olderAvg = olderMoods.length > 0 
          ? olderMoods.reduce((sum, m) => sum + m.mood_rating, 0) / olderMoods.length
          : recentAvg;
        
        if (recentAvg > olderAvg + 0.5) moodTrend = 'positive';
        else if (recentAvg < olderAvg - 0.5) moodTrend = 'negative';
      }

      // Calculer la série
      let streakDays = 0;
      if (sessions && sessions.length > 0) {
        let currentDate = new Date();
        currentDate.setHours(0, 0, 0, 0);
        
        for (const session of sessions) {
          const sessionDate = new Date(session.created_at);
          sessionDate.setHours(0, 0, 0, 0);
          
          if (sessionDate.getTime() === currentDate.getTime()) {
            streakDays++;
            currentDate = new Date(currentDate.getTime() - 24 * 60 * 60 * 1000);
          } else if (sessionDate.getTime() < currentDate.getTime()) {
            break;
          }
        }
      }

      // Temps moyen des sessions
      const averageSessionTime = sessions && sessions.length > 0
        ? sessions.reduce((sum, s) => sum + (s.duration_minutes || 0), 0) / sessions.length
        : 0;

      // Heure de la journée
      const hour = now.getHours();
      let timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
      if (hour >= 6 && hour < 12) timeOfDay = 'morning';
      else if (hour >= 12 && hour < 18) timeOfDay = 'afternoon';
      else if (hour >= 18 && hour < 22) timeOfDay = 'evening';
      else timeOfDay = 'night';

      return {
        user_id: userId,
        lastSessionDate: lastSessionDate || undefined,
        sessionCount: sessions?.length || 0,
        moodTrend,
        streakDays,
        averageSessionTime,
        timeOfDay,
        daysSinceLastSession
      };
    } catch (error) {
      console.error('Erreur récupération contexte notifications:', error);
      return null;
    }
  }

  private isInQuietHours(): boolean {
    if (!this.preferences.quiet_hours.enabled) return false;

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
    const { start, end } = this.preferences.quiet_hours;

    if (start <= end) {
      return currentTime >= start && currentTime <= end;
    } else {
      // Span across midnight
      return currentTime >= start || currentTime <= end;
    }
  }

  private cleanupExpiredNotifications() {
    const now = Date.now();
    this.notifications = this.notifications.filter(notification => {
      if (!notification.expiresAt) return true;
      return notification.expiresAt > now;
    });
    this.notifyListeners();
  }

  // API publique améliorée
  async addNotification(notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'user_id'>) {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    if (!this.preferences.enabled || !this.preferences.types[notification.type]) {
      return;
    }

    const newNotification: Notification = {
      ...notification,
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      user_id: userId,
      timestamp: Date.now(),
      read: false,
      priority: notification.priority || 'medium'
    };

    // Sauvegarder en base
    try {
      const { error } = await supabase
        .from('notifications')
        .insert([{
          id: newNotification.id,
          user_id: userId,
          type: newNotification.type,
          category: newNotification.category,
          title: newNotification.title,
          message: newNotification.message,
          priority: newNotification.priority,
          action_url: newNotification.actionUrl,
          action_label: newNotification.actionLabel,
          icon: newNotification.icon,
          image: newNotification.image,
          metadata: newNotification.metadata,
          expires_at: newNotification.expiresAt ? new Date(newNotification.expiresAt).toISOString() : null,
          read: false,
          created_at: new Date().toISOString()
        }]);

      if (error) throw error;
    } catch (error) {
      console.error('Erreur sauvegarde notification:', error);
    }

    // Ajouter à la liste locale
    this.notifications.unshift(newNotification);
    this.notifyListeners();

    // Notification browser si activée
    if (this.preferences.push_notifications && 'Notification' in window && Notification.permission === 'granted') {
      this.showBrowserNotification(newNotification);
    }

    // Auto-suppression si spécifiée
    if (newNotification.expiresAt) {
      const timeToExpiry = newNotification.expiresAt - Date.now();
      if (timeToExpiry > 0) {
        setTimeout(() => {
          this.removeNotification(newNotification.id);
        }, timeToExpiry);
      }
    } else {
      // Auto-suppression par défaut après 7 jours
      setTimeout(() => {
        this.removeNotification(newNotification.id);
      }, 7 * 24 * 60 * 60 * 1000);
    }
  }

  private showBrowserNotification(notification: Notification) {
    const browserNotification = new Notification(notification.title, {
      body: notification.message,
      icon: notification.image || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      tag: notification.id,
      requireInteraction: notification.priority === 'high',
      silent: !this.preferences.sound_enabled
    });

    browserNotification.onclick = () => {
      window.focus();
      if (notification.actionUrl) {
        window.location.hash = notification.actionUrl;
      }
      browserNotification.close();
    };

    // Auto-close après 10 secondes sauf si haute priorité
    if (notification.priority !== 'high') {
      setTimeout(() => browserNotification.close(), 10000);
    }
  }

  async markAsRead(id: string) {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.notifyListeners();
      
      // Mettre à jour en base
      try {
        await supabase
          .from('notifications')
          .update({ read: true })
          .eq('id', id);
      } catch (error) {
        console.error('Erreur mise à jour notification:', error);
      }
    }
  }

  async markAllAsRead() {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    this.notifications.forEach(n => n.read = true);
    this.notifyListeners();

    try {
      await supabase
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false);
    } catch (error) {
      console.error('Erreur marquage toutes lues:', error);
    }
  }

  async removeNotification(id: string) {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.notifyListeners();

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('id', id);
    } catch (error) {
      console.error('Erreur suppression notification:', error);
    }
  }

  async clearAll() {
    const userId = await this.getCurrentUserId();
    if (!userId) return;

    this.notifications = [];
    this.notifyListeners();

    try {
      await supabase
        .from('notifications')
        .delete()
        .eq('user_id', userId);
    } catch (error) {
      console.error('Erreur suppression toutes notifications:', error);
    }
  }

  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  getNotificationsByCategory(category: string): Notification[] {
    return this.notifications.filter(n => n.category === category);
  }

  getNotificationsByType(type: string): Notification[] {
    return this.notifications.filter(n => n.type === type);
  }

  subscribe(listener: (notifications: Notification[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.notifications]));
  }

  // Gestion des préférences
  updatePreferences(preferences: Partial<NotificationPreferences>) {
    this.preferences = { ...this.preferences, ...preferences };
    localStorage.setItem('notification_preferences', JSON.stringify(this.preferences));
  }

  getPreferences(): NotificationPreferences {
    return { ...this.preferences };
  }

  // Web Push API
  async requestPushPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Browser does not support notifications');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    }

    return false;
  }

  // Méthodes utilitaires pour créer des notifications spécifiques
  createWellnessReminder(message?: string) {
    const messages = [
      "Comment vous sentez-vous aujourd'hui ? 🌱",
      "Prenez quelques minutes pour respirer profondément 🧘‍♀️",
      "Votre bien-être mérite attention aujourd'hui 💙",
      "Un petit moment pour vous, ça vous dit ? ✨"
    ];

    return this.addNotification({
      type: 'reminder',
      category: 'wellness',
      title: 'Moment de bien-être',
      message: message || messages[Math.floor(Math.random() * messages.length)],
      priority: 'medium',
      icon: '🌱',
      actionUrl: '/chat',
      actionLabel: 'Commencer maintenant'
    });
  }

  createAchievementNotification(title: string, message: string, actionUrl?: string) {
    return this.addNotification({
      type: 'achievement',
      category: 'achievement',
      title,
      message,
      priority: 'high',
      icon: '🎉',
      actionUrl: actionUrl || '/dashboard',
      actionLabel: 'Voir mes progrès'
    });
  }

  createMoodCheckReminder(sentiment?: 'encouraging' | 'supportive' | 'neutral') {
    const messages = {
      encouraging: "Votre progression est inspirante ! Comment vous sentez-vous aujourd'hui ? 🌟",
      supportive: "Je suis là pour vous écouter. Comment allez-vous en ce moment ? 🤗",
      neutral: "Comment décririez-vous votre état d'esprit aujourd'hui ? 💭"
    };

    return this.addNotification({
      type: 'mood_check',
      category: 'wellness',
      title: 'Vérification d\'humeur',
      message: messages[sentiment || 'neutral'],
      priority: 'medium',
      icon: '💙',
      actionUrl: '/mood-tracker',
      actionLabel: 'Enregistrer mon humeur'
    });
  }
}

// Instance singleton
export const notificationService = new NotificationService();