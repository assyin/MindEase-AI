import { notificationService } from '../services/NotificationService';

// Fonction pour créer des notifications de test
export const createTestNotifications = () => {
  // Notifications de différents types pour démonstration
  const testNotifications = [
    {
      type: 'reminder' as const,
      category: 'wellness' as const,
      title: 'Moment de bien-être',
      message: 'Comment vous sentez-vous aujourd\'hui ? Prenez quelques minutes pour vous. 🌱',
      priority: 'medium' as const,
      icon: '🧘‍♀️',
      actionUrl: '/chat',
      actionLabel: 'Commencer une session'
    },
    {
      type: 'achievement' as const,
      category: 'achievement' as const,
      title: 'Félicitations ! 🎉',
      message: 'Vous avez complété votre 7ème jour consécutif d\'utilisation. Belle constance !',
      priority: 'high' as const,
      icon: '🏆',
      actionUrl: '/dashboard',
      actionLabel: 'Voir mes progrès'
    },
    {
      type: 'tip' as const,
      category: 'progress' as const,
      title: 'Conseil personnalisé 💡',
      message: 'Vos sessions approfondies sont excellentes ! Continuez ce beau travail.',
      priority: 'medium' as const,
      icon: '💡',
      actionUrl: '/dashboard',
      actionLabel: 'Voir mes statistiques'
    },
    {
      type: 'mood_check' as const,
      category: 'wellness' as const,
      title: 'Vérification d\'humeur 💙',
      message: 'Cela fait quelques jours. Comment vous portez-vous ?',
      priority: 'medium' as const,
      icon: '🤗',
      actionUrl: '/mood-tracker',
      actionLabel: 'Enregistrer mon humeur'
    },
    {
      type: 'system' as const,
      category: 'system' as const,
      title: 'Système de notifications activé ✅',
      message: 'Votre système de notifications intelligent est maintenant opérationnel !',
      priority: 'low' as const,
      icon: '🔔',
      actionUrl: '/notifications',
      actionLabel: 'Configurer'
    }
  ];

  // Créer les notifications avec un délai pour simuler leur arrivée
  testNotifications.forEach((notification, index) => {
    setTimeout(() => {
      notificationService.addNotification(notification);
    }, index * 2000); // 2 secondes entre chaque notification
  });

  console.log('🧪 Notifications de test créées !');
};

// Fonction pour tester les notifications par catégorie
export const createNotificationsByCategory = (category: string) => {
  const notificationsByCategory: Record<string, any[]> = {
    wellness: [
      {
        type: 'reminder',
        category: 'wellness',
        title: 'Respiration consciente',
        message: 'Accordez-vous 5 minutes de respiration profonde 🌬️',
        priority: 'medium',
        icon: '🧘‍♀️',
        actionUrl: '/chat',
        actionLabel: 'Commencer'
      },
      {
        type: 'mood_check',
        category: 'wellness',
        title: 'Comment allez-vous ?',
        message: 'Partagez votre état émotionnel du moment 💝',
        priority: 'medium',
        icon: '💙',
        actionUrl: '/mood-tracker',
        actionLabel: 'Enregistrer'
      }
    ],
    achievement: [
      {
        type: 'achievement',
        category: 'achievement',
        title: 'Première semaine complète ! 🎊',
        message: 'Vous avez utilisé MindEase chaque jour cette semaine !',
        priority: 'high',
        icon: '🎉',
        actionUrl: '/dashboard',
        actionLabel: 'Célébrer'
      },
      {
        type: 'milestone',
        category: 'achievement',
        title: '50 sessions atteintes ! 🌟',
        message: 'Incroyable ! Vous avez atteint 50 sessions de bien-être.',
        priority: 'high',
        icon: '🏆',
        actionUrl: '/dashboard',
        actionLabel: 'Voir les détails'
      }
    ],
    progress: [
      {
        type: 'tip',
        category: 'progress',
        title: 'Conseil basé sur vos données 📊',
        message: 'Vos sessions du matin semblent plus productives. Continuez !',
        priority: 'medium',
        icon: '💡',
        actionUrl: '/dashboard',
        actionLabel: 'Analyser'
      }
    ]
  };

  const notifications = notificationsByCategory[category] || [];
  notifications.forEach((notification, index) => {
    setTimeout(() => {
      notificationService.addNotification(notification);
    }, index * 1000);
  });

  console.log(`🧪 Notifications de catégorie "${category}" créées !`);
};

// Fonction pour tester les niveaux de priorité
export const createPriorityTestNotifications = () => {
  const priorities = [
    {
      type: 'system' as const,
      category: 'system' as const,
      title: 'Information (Priorité basse)',
      message: 'Nouvelle fonctionnalité disponible dans les paramètres.',
      priority: 'low' as const,
      icon: 'ℹ️'
    },
    {
      type: 'reminder' as const,
      category: 'wellness' as const,
      title: 'Rappel (Priorité moyenne)',
      message: 'N\'oubliez pas votre session de bien-être quotidienne.',
      priority: 'medium' as const,
      icon: '⏰'
    },
    {
      type: 'system' as const,
      category: 'system' as const,
      title: 'Urgent (Priorité élevée)',
      message: 'Votre session semble interrompue de manière inattendue.',
      priority: 'high' as const,
      icon: '🚨'
    }
  ];

  priorities.forEach((notification, index) => {
    setTimeout(() => {
      notificationService.addNotification(notification);
    }, index * 3000);
  });

  console.log('🧪 Notifications de test de priorité créées !');
};

// Fonction pour simuler une journée complète de notifications
export const simulateDailyNotifications = () => {
  const dailySchedule = [
    {
      delay: 1000, // 9h00 - Matin
      notification: {
        type: 'reminder' as const,
        category: 'wellness' as const,
        title: 'Bonjour ! ☀️',
        message: 'Commencez votre journée avec une intention positive.',
        priority: 'medium' as const,
        icon: '🌅',
        actionUrl: '/chat',
        actionLabel: 'Démarrer'
      }
    },
    {
      delay: 5000, // 12h00 - Midi
      notification: {
        type: 'mood_check' as const,
        category: 'wellness' as const,
        title: 'Pause méridienne 🌤️',
        message: 'Comment se passe votre matinée ? Prenez un moment pour vous.',
        priority: 'medium' as const,
        icon: '☀️',
        actionUrl: '/mood-tracker',
        actionLabel: 'Check-in'
      }
    },
    {
      delay: 9000, // 18h00 - Soir
      notification: {
        type: 'tip' as const,
        category: 'progress' as const,
        title: 'Réflexion du soir 🌅',
        message: 'Quelle a été la meilleure partie de votre journée ?',
        priority: 'medium' as const,
        icon: '🌆',
        actionUrl: '/chat',
        actionLabel: 'Réfléchir'
      }
    },
    {
      delay: 13000, // 21h00 - Nuit
      notification: {
        type: 'encouragement' as const,
        category: 'wellness' as const,
        title: 'Bonne nuit 🌙',
        message: 'Vous avez fait de votre mieux aujourd\'hui. Reposez-vous bien.',
        priority: 'low' as const,
        icon: '😴',
        actionUrl: '/dashboard',
        actionLabel: 'Bilan de journée'
      }
    }
  ];

  dailySchedule.forEach(({ delay, notification }) => {
    setTimeout(() => {
      notificationService.addNotification(notification);
    }, delay);
  });

  console.log('🧪 Simulation d\'une journée de notifications démarrée !');
};

// Fonction pour nettoyer les notifications de test
export const clearTestNotifications = () => {
  notificationService.clearAll();
  console.log('🧹 Notifications de test nettoyées !');
};

// Exposer les fonctions pour utilisation dans la console du navigateur
if (typeof window !== 'undefined') {
  (window as any).testNotifications = {
    createTestNotifications,
    createNotificationsByCategory,
    createPriorityTestNotifications,
    simulateDailyNotifications,
    clearTestNotifications
  };
}