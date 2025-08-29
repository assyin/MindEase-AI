import { useState, useEffect, useCallback, useRef } from 'react';
import { notificationService, Notification, NotificationPreferences } from '../services/NotificationService';

interface UseNotificationsReturn {
  notifications: Notification[];
  unreadCount: number;
  preferences: NotificationPreferences;
  loading: boolean;
  // Actions de base
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  removeNotification: (id: string) => void;
  clearAll: () => void;
  // Création de notifications
  addNotification: (notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'user_id'>) => void;
  createWellnessReminder: (message?: string) => void;
  createAchievementNotification: (title: string, message: string, actionUrl?: string) => void;
  createMoodCheckReminder: (sentiment?: 'encouraging' | 'supportive' | 'neutral') => void;
  // Gestion des préférences
  updatePreferences: (preferences: Partial<NotificationPreferences>) => void;
  requestPushPermission: () => Promise<boolean>;
  // Filtres et utilitaires
  getNotificationsByCategory: (category: string) => Notification[];
  getNotificationsByType: (type: string) => Notification[];
  getRecentNotifications: (count?: number) => Notification[];
  getHighPriorityNotifications: () => Notification[];
}

export const useNotifications = (): UseNotificationsReturn => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [preferences, setPreferences] = useState<NotificationPreferences>(notificationService.getPreferences());
  const [loading, setLoading] = useState(true);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  // Initialisation et souscription aux notifications
  useEffect(() => {
    setLoading(true);
    
    // S'abonner aux changements de notifications
    unsubscribeRef.current = notificationService.subscribe((newNotifications) => {
      setNotifications(newNotifications);
      setLoading(false);
    });

    // Déclencher un chargement initial
    setNotifications(notificationService['notifications'] || []);
    setLoading(false);

    // Nettoyage
    return () => {
      if (unsubscribeRef.current) {
        unsubscribeRef.current();
      }
    };
  }, []);

  // Actions de base
  const markAsRead = useCallback((id: string) => {
    notificationService.markAsRead(id);
  }, []);

  const markAllAsRead = useCallback(() => {
    notificationService.markAllAsRead();
  }, []);

  const removeNotification = useCallback((id: string) => {
    notificationService.removeNotification(id);
  }, []);

  const clearAll = useCallback(() => {
    notificationService.clearAll();
  }, []);

  // Création de notifications
  const addNotification = useCallback((notification: Omit<Notification, 'id' | 'timestamp' | 'read' | 'user_id'>) => {
    notificationService.addNotification(notification);
  }, []);

  const createWellnessReminder = useCallback((message?: string) => {
    notificationService.createWellnessReminder(message);
  }, []);

  const createAchievementNotification = useCallback((title: string, message: string, actionUrl?: string) => {
    notificationService.createAchievementNotification(title, message, actionUrl);
  }, []);

  const createMoodCheckReminder = useCallback((sentiment?: 'encouraging' | 'supportive' | 'neutral') => {
    notificationService.createMoodCheckReminder(sentiment);
  }, []);

  // Gestion des préférences
  const updatePreferences = useCallback((newPreferences: Partial<NotificationPreferences>) => {
    notificationService.updatePreferences(newPreferences);
    setPreferences(notificationService.getPreferences());
  }, []);

  const requestPushPermission = useCallback(() => {
    return notificationService.requestPushPermission();
  }, []);

  // Filtres et utilitaires
  const getNotificationsByCategory = useCallback((category: string) => {
    return notificationService.getNotificationsByCategory(category);
  }, []);

  const getNotificationsByType = useCallback((type: string) => {
    return notificationService.getNotificationsByType(type);
  }, []);

  const getRecentNotifications = useCallback((count = 10) => {
    return notifications.slice(0, count);
  }, [notifications]);

  const getHighPriorityNotifications = useCallback(() => {
    return notifications.filter(n => n.priority === 'high');
  }, [notifications]);

  const unreadCount = notificationService.getUnreadCount();

  return {
    notifications,
    unreadCount,
    preferences,
    loading,
    // Actions
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    // Création
    addNotification,
    createWellnessReminder,
    createAchievementNotification,
    createMoodCheckReminder,
    // Préférences
    updatePreferences,
    requestPushPermission,
    // Utilitaires
    getNotificationsByCategory,
    getNotificationsByType,
    getRecentNotifications,
    getHighPriorityNotifications
  };
};

// Hook spécialisé pour les notifications non lues uniquement
export const useUnreadNotifications = () => {
  const { notifications, ...rest } = useNotifications();
  
  const unreadNotifications = notifications.filter(n => !n.read);
  
  return {
    notifications: unreadNotifications,
    count: unreadNotifications.length,
    ...rest
  };
};

// Hook spécialisé pour une catégorie spécifique
export const useNotificationsByCategory = (category: string) => {
  const { notifications, unreadCount, ...rest } = useNotifications();
  
  const categoryNotifications = notifications.filter(n => n.category === category);
  
  return {
    notifications: categoryNotifications,
    count: categoryNotifications.length,
    categoryUnreadCount: categoryNotifications.filter(n => !n.read).length,
    unreadCount,
    ...rest
  };
};

// Hook pour les notifications de haute priorité
export const useHighPriorityNotifications = () => {
  const { notifications, unreadCount, ...rest } = useNotifications();
  
  const highPriorityNotifications = notifications.filter(n => n.priority === 'high');
  
  return {
    notifications: highPriorityNotifications,
    count: highPriorityNotifications.length,
    highPriorityUnreadCount: highPriorityNotifications.filter(n => !n.read).length,
    hasUnreadHighPriority: highPriorityNotifications.some(n => !n.read),
    unreadCount,
    ...rest
  };
};