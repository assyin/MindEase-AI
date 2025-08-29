import React, { useState, useRef, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { Notification } from '../services/NotificationService';
import { 
  Bell, 
  BellRing, 
  X, 
  Check, 
  CheckCheck, 
  Trash2, 
  Filter,
  Calendar,
  Heart,
  Trophy,
  Info,
  AlertCircle,
  Lightbulb,
  Target,
  Settings,
  ExternalLink
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';

interface NotificationCenterProps {
  className?: string;
  showInSidebar?: boolean;
}

export const NotificationCenter: React.FC<NotificationCenterProps> = ({ 
  className = '',
  showInSidebar = false 
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showOnlyUnread, setShowOnlyUnread] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    removeNotification,
    clearAll,
    getNotificationsByCategory,
    createWellnessReminder,
    createMoodCheckReminder
  } = useNotifications();

  // Fermer le dropdown si on clique à l'extérieur
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filtrer les notifications selon les critères sélectionnés
  const filteredNotifications = notifications.filter(notification => {
    if (selectedCategory !== 'all' && notification.category !== selectedCategory) {
      return false;
    }
    if (showOnlyUnread && notification.read) {
      return false;
    }
    return true;
  });

  const getNotificationIcon = (notification: Notification) => {
    const iconMap = {
      reminder: <Calendar className="w-5 h-5" />,
      tip: <Lightbulb className="w-5 h-5" />,
      achievement: <Trophy className="w-5 h-5" />,
      system: <Info className="w-5 h-5" />,
      mood_check: <Heart className="w-5 h-5" />,
      milestone: <Target className="w-5 h-5" />,
      encouragement: <Heart className="w-5 h-5" />
    };

    return iconMap[notification.type] || <Bell className="w-5 h-5" />;
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-red-500 bg-red-50';
      case 'medium': return 'border-yellow-500 bg-yellow-50';
      default: return 'border-blue-500 bg-blue-50';
    }
  };

  const getCategoryIcon = (category: string) => {
    const iconMap = {
      wellness: <Heart className="w-4 h-4" />,
      progress: <Target className="w-4 h-4" />,
      achievement: <Trophy className="w-4 h-4" />,
      social: <Info className="w-4 h-4" />,
      system: <Settings className="w-4 h-4" />
    };
    return iconMap[category as keyof typeof iconMap] || <Bell className="w-4 h-4" />;
  };

  const handleNotificationClick = (notification: Notification) => {
    if (!notification.read) {
      markAsRead(notification.id);
    }
    
    if (notification.actionUrl) {
      window.location.hash = notification.actionUrl;
      setIsOpen(false);
    }
  };

  const categories = [
    { id: 'all', label: 'Toutes', count: notifications.length },
    { id: 'wellness', label: 'Bien-être', count: getNotificationsByCategory('wellness').length },
    { id: 'progress', label: 'Progrès', count: getNotificationsByCategory('progress').length },
    { id: 'achievement', label: 'Succès', count: getNotificationsByCategory('achievement').length },
    { id: 'system', label: 'Système', count: getNotificationsByCategory('system').length }
  ];

  if (showInSidebar) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
            <Bell className="w-5 h-5" />
            Notifications
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                {unreadCount}
              </span>
            )}
          </h3>
          {unreadCount > 0 && (
            <button
              onClick={markAllAsRead}
              className="text-sm text-blue-600 hover:text-blue-700 flex items-center gap-1"
            >
              <CheckCheck className="w-4 h-4" />
              Tout lire
            </button>
          )}
        </div>

        <div className="space-y-2">
          {loading ? (
            <div className="animate-pulse space-y-2">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-16 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          ) : filteredNotifications.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <p className="text-sm">Aucune notification</p>
            </div>
          ) : (
            filteredNotifications.slice(0, 5).map(notification => (
              <NotificationItem
                key={notification.id}
                notification={notification}
                onClick={() => handleNotificationClick(notification)}
                onMarkAsRead={() => markAsRead(notification.id)}
                onRemove={() => removeNotification(notification.id)}
                compact={true}
              />
            ))
          )}
        </div>

        {filteredNotifications.length > 5 && (
          <button
            onClick={() => setIsOpen(true)}
            className="w-full text-sm text-blue-600 hover:text-blue-700 py-2"
          >
            Voir toutes les notifications ({filteredNotifications.length})
          </button>
        )}
      </div>
    );
  }

  return (
    <div className={`relative ${className}`} ref={dropdownRef}>
      {/* Bouton de notification */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="relative p-2 text-gray-600 hover:text-gray-800 transition-colors rounded-lg hover:bg-gray-100"
        aria-label="Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="w-6 h-6" />
        ) : (
          <Bell className="w-6 h-6" />
        )}
        
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center font-medium">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Panel des notifications */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-96 bg-white rounded-xl shadow-2xl border border-gray-200 z-50 max-h-[80vh] flex flex-col">
          {/* Header */}
          <div className="p-4 border-b border-gray-100 flex items-center justify-between bg-gray-50 rounded-t-xl">
            <div className="flex items-center gap-2">
              <Bell className="w-5 h-5 text-gray-700" />
              <h3 className="font-semibold text-gray-800">Notifications</h3>
              {unreadCount > 0 && (
                <span className="bg-red-100 text-red-700 text-xs px-2 py-1 rounded-full font-medium">
                  {unreadCount} non lue{unreadCount > 1 ? 's' : ''}
                </span>
              )}
            </div>
            
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllAsRead}
                  className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded hover:bg-blue-200 transition-colors flex items-center gap-1"
                >
                  <CheckCheck className="w-3 h-3" />
                  Tout lire
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Filtres */}
          <div className="p-4 border-b border-gray-100 bg-gray-50">
            <div className="flex items-center gap-2 mb-3">
              <Filter className="w-4 h-4 text-gray-500" />
              <span className="text-sm font-medium text-gray-700">Filtrer par catégorie</span>
            </div>
            
            <div className="flex flex-wrap gap-2 mb-3">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-1 px-3 py-1 text-xs rounded-full transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-100 text-blue-700 border border-blue-200'
                      : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {category.id !== 'all' && getCategoryIcon(category.id)}
                  {category.label}
                  {category.count > 0 && (
                    <span className="bg-gray-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                      {category.count}
                    </span>
                  )}
                </button>
              ))}
            </div>

            <label className="flex items-center gap-2 text-sm text-gray-600">
              <input
                type="checkbox"
                checked={showOnlyUnread}
                onChange={(e) => setShowOnlyUnread(e.target.checked)}
                className="rounded border-gray-300"
              />
              Afficher seulement les non lues
            </label>
          </div>

          {/* Liste des notifications */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4">
                <div className="animate-pulse space-y-4">
                  {[1, 2, 3, 4].map(i => (
                    <div key={i} className="flex space-x-3">
                      <div className="w-10 h-10 bg-gray-300 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ) : filteredNotifications.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <Bell className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p className="text-sm font-medium mb-1">Aucune notification</p>
                <p className="text-xs">
                  {selectedCategory === 'all' 
                    ? 'Vous êtes à jour !' 
                    : 'Aucune notification dans cette catégorie'}
                </p>
                
                {/* Actions rapides */}
                <div className="mt-4 space-y-2">
                  <button
                    onClick={() => {
                      createWellnessReminder();
                      setIsOpen(false);
                    }}
                    className="text-xs bg-green-100 text-green-700 px-3 py-1 rounded-full hover:bg-green-200 transition-colors"
                  >
                    Créer un rappel bien-être
                  </button>
                  <br />
                  <button
                    onClick={() => {
                      createMoodCheckReminder();
                      setIsOpen(false);
                    }}
                    className="text-xs bg-purple-100 text-purple-700 px-3 py-1 rounded-full hover:bg-purple-200 transition-colors"
                  >
                    Vérifier mon humeur
                  </button>
                </div>
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {filteredNotifications.map(notification => (
                  <NotificationItem
                    key={notification.id}
                    notification={notification}
                    onClick={() => handleNotificationClick(notification)}
                    onMarkAsRead={() => markAsRead(notification.id)}
                    onRemove={() => removeNotification(notification.id)}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Footer actions */}
          {filteredNotifications.length > 0 && (
            <div className="p-3 border-t border-gray-100 bg-gray-50 rounded-b-xl">
              <button
                onClick={() => {
                  clearAll();
                  setIsOpen(false);
                }}
                className="w-full text-sm text-red-600 hover:text-red-700 py-2 flex items-center justify-center gap-2 hover:bg-red-50 rounded transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Effacer toutes les notifications
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

// Composant pour une notification individuelle
interface NotificationItemProps {
  notification: Notification;
  onClick: () => void;
  onMarkAsRead: () => void;
  onRemove: () => void;
  compact?: boolean;
}

const NotificationItem: React.FC<NotificationItemProps> = ({
  notification,
  onClick,
  onMarkAsRead,
  onRemove,
  compact = false
}) => {
  const getNotificationIcon = (notification: Notification) => {
    if (notification.icon) return notification.icon;
    
    const iconMap = {
      reminder: <Calendar className="w-5 h-5 text-blue-600" />,
      tip: <Lightbulb className="w-5 h-5 text-yellow-600" />,
      achievement: <Trophy className="w-5 h-5 text-gold-600" />,
      system: <Info className="w-5 h-5 text-gray-600" />,
      mood_check: <Heart className="w-5 h-5 text-pink-600" />,
      milestone: <Target className="w-5 h-5 text-green-600" />,
      encouragement: <Heart className="w-5 h-5 text-purple-600" />
    };

    return iconMap[notification.type] || <Bell className="w-5 h-5 text-gray-600" />;
  };

  const getPriorityBorder = (priority: string) => {
    switch (priority) {
      case 'high': return 'border-l-red-500';
      case 'medium': return 'border-l-yellow-500';
      default: return 'border-l-blue-500';
    }
  };

  if (compact) {
    return (
      <div
        className={`p-3 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${getPriorityBorder(notification.priority)} ${
          !notification.read ? 'bg-blue-50' : ''
        }`}
        onClick={onClick}
      >
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5">
            {typeof notification.icon === 'string' ? (
              <span className="text-lg">{notification.icon}</span>
            ) : (
              getNotificationIcon(notification)
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between">
              <h4 className={`text-sm font-medium truncate ${
                !notification.read ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {notification.title}
              </h4>
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full flex-shrink-0 ml-2 mt-1"></div>
              )}
            </div>
            
            <p className="text-xs text-gray-500 mt-1 line-clamp-2">
              {notification.message}
            </p>
            
            <p className="text-xs text-gray-400 mt-1">
              {formatDistanceToNow(notification.timestamp, { addSuffix: true, locale: fr })}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`p-4 hover:bg-gray-50 transition-colors border-l-4 ${getPriorityBorder(notification.priority)} ${
        !notification.read ? 'bg-blue-50/50' : ''
      }`}
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0">
          {typeof notification.icon === 'string' ? (
            <span className="text-2xl">{notification.icon}</span>
          ) : (
            <div className="w-10 h-10 rounded-full bg-gray-100 flex items-center justify-center">
              {getNotificationIcon(notification)}
            </div>
          )}
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h4 className={`text-sm font-medium ${
                !notification.read ? 'text-gray-900' : 'text-gray-600'
              }`}>
                {notification.title}
              </h4>
              
              <p className={`text-sm mt-1 ${
                !notification.read ? 'text-gray-700' : 'text-gray-500'
              }`}>
                {notification.message}
              </p>
              
              <div className="flex items-center gap-4 mt-2">
                <span className="text-xs text-gray-400">
                  {format(notification.timestamp, 'dd MMM à HH:mm', { locale: fr })}
                </span>
                
                {notification.category && (
                  <span className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-full">
                    {notification.category}
                  </span>
                )}
                
                {notification.priority === 'high' && (
                  <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-full flex items-center gap-1">
                    <AlertCircle className="w-3 h-3" />
                    Urgent
                  </span>
                )}
              </div>
              
              {notification.actionUrl && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick();
                  }}
                  className="mt-2 text-xs text-blue-600 hover:text-blue-700 flex items-center gap-1"
                >
                  {notification.actionLabel || 'Voir plus'}
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="flex items-center gap-1 ml-3">
              {!notification.read && (
                <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
              )}
              
              <div className="flex items-center gap-1">
                {!notification.read && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onMarkAsRead();
                    }}
                    className="p-1 text-gray-400 hover:text-green-600 transition-colors"
                    title="Marquer comme lue"
                  >
                    <Check className="w-4 h-4" />
                  </button>
                )}
                
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemove();
                  }}
                  className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                  title="Supprimer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotificationCenter;