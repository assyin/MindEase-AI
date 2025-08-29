import React, { useState, useEffect } from 'react';
import { useNotifications } from '../hooks/useNotifications';
import { NotificationPreferences } from '../services/NotificationService';
import { 
  Bell, 
  BellOff, 
  Volume2, 
  VolumeX, 
  Smartphone, 
  Clock,
  Heart,
  Trophy,
  Info,
  Calendar,
  Lightbulb,
  Target,
  AlertTriangle,
  Save,
  RotateCcw,
  TestTube
} from 'lucide-react';

export const NotificationSettings: React.FC = () => {
  const { 
    preferences, 
    updatePreferences, 
    requestPushPermission,
    createWellnessReminder,
    createAchievementNotification,
    createMoodCheckReminder
  } = useNotifications();

  const [localPreferences, setLocalPreferences] = useState<NotificationPreferences>(preferences);
  const [hasChanges, setHasChanges] = useState(false);
  const [pushPermission, setPushPermission] = useState<NotificationPermission>('default');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    setLocalPreferences(preferences);
    if ('Notification' in window) {
      setPushPermission(Notification.permission);
    }
  }, [preferences]);

  useEffect(() => {
    const hasChanges = JSON.stringify(localPreferences) !== JSON.stringify(preferences);
    setHasChanges(hasChanges);
  }, [localPreferences, preferences]);

  const handlePreferenceChange = (key: keyof NotificationPreferences, value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      [key]: value
    }));
  };

  const handleTypeChange = (type: keyof NotificationPreferences['types'], enabled: boolean) => {
    setLocalPreferences(prev => ({
      ...prev,
      types: {
        ...prev.types,
        [type]: enabled
      }
    }));
  };

  const handleQuietHoursChange = (field: 'start' | 'end' | 'enabled', value: any) => {
    setLocalPreferences(prev => ({
      ...prev,
      quiet_hours: {
        ...prev.quiet_hours,
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      updatePreferences(localPreferences);
      // Simuler un délai de sauvegarde
      await new Promise(resolve => setTimeout(resolve, 500));
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setLocalPreferences(preferences);
  };

  const handleRequestPushPermission = async () => {
    const granted = await requestPushPermission();
    if (granted) {
      setPushPermission('granted');
      handlePreferenceChange('push_notifications', true);
    }
  };

  const testNotifications = [
    {
      label: 'Rappel bien-être',
      icon: <Heart className="w-4 h-4" />,
      action: () => createWellnessReminder("Ceci est un test de notification bien-être 🌱"),
      color: 'bg-green-100 text-green-700 hover:bg-green-200'
    },
    {
      label: 'Succès test',
      icon: <Trophy className="w-4 h-4" />,
      action: () => createAchievementNotification("Test réussi !", "Votre système de notifications fonctionne parfaitement 🎉"),
      color: 'bg-yellow-100 text-yellow-700 hover:bg-yellow-200'
    },
    {
      label: 'Vérification humeur',
      icon: <Heart className="w-4 h-4" />,
      action: () => createMoodCheckReminder('neutral'),
      color: 'bg-purple-100 text-purple-700 hover:bg-purple-200'
    }
  ];

  const notificationTypes = [
    {
      key: 'reminder' as const,
      label: 'Rappels de bien-être',
      description: 'Rappels pour prendre soin de votre santé mentale',
      icon: <Calendar className="w-5 h-5 text-blue-600" />
    },
    {
      key: 'tip' as const,
      label: 'Conseils personnalisés',
      description: 'Suggestions basées sur votre utilisation',
      icon: <Lightbulb className="w-5 h-5 text-yellow-600" />
    },
    {
      key: 'achievement' as const,
      label: 'Succès et récompenses',
      description: 'Célébrez vos progrès et accomplissements',
      icon: <Trophy className="w-5 h-5 text-gold-600" />
    },
    {
      key: 'mood_check' as const,
      label: 'Vérifications d\'humeur',
      description: 'Invitations à enregistrer votre état émotionnel',
      icon: <Heart className="w-5 h-5 text-pink-600" />
    },
    {
      key: 'milestone' as const,
      label: 'Jalons importants',
      description: 'Étapes significatives de votre parcours',
      icon: <Target className="w-5 h-5 text-green-600" />
    },
    {
      key: 'encouragement' as const,
      label: 'Messages d\'encouragement',
      description: 'Support motivationnel personnalisé',
      icon: <Heart className="w-5 h-5 text-purple-600" />
    },
    {
      key: 'system' as const,
      label: 'Notifications système',
      description: 'Mises à jour et informations importantes',
      icon: <Info className="w-5 h-5 text-gray-600" />
    }
  ];

  const frequencyOptions = [
    { value: 'none', label: 'Aucune notification automatique', description: 'Seulement les notifications manuelles' },
    { value: 'low', label: 'Faible (1-2 par semaine)', description: 'Notifications occasionnelles' },
    { value: 'medium', label: 'Modérée (3-5 par semaine)', description: 'Équilibre optimal recommandé' },
    { value: 'high', label: 'Élevée (quotidienne)', description: 'Support quotidien actif' }
  ];

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Bell className="w-8 h-8 text-blue-600" />
          Paramètres des notifications
        </h1>
        <p className="text-gray-600 mt-2">
          Personnalisez vos notifications pour une expérience adaptée à vos besoins
        </p>
      </div>

      <div className="space-y-8">
        {/* État général des notifications */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              {localPreferences.enabled ? (
                <Bell className="w-6 h-6 text-green-600" />
              ) : (
                <BellOff className="w-6 h-6 text-gray-400" />
              )}
              <div>
                <h3 className="text-lg font-semibold text-gray-800">Notifications activées</h3>
                <p className="text-sm text-gray-600">
                  {localPreferences.enabled 
                    ? 'Vous recevez des notifications personnalisées' 
                    : 'Toutes les notifications sont désactivées'}
                </p>
              </div>
            </div>
            
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={localPreferences.enabled}
                onChange={(e) => handlePreferenceChange('enabled', e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-14 h-7 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-0.5 after:left-[4px] after:bg-white after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-blue-600"></div>
            </label>
          </div>

          {!localPreferences.enabled && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-600" />
                <p className="text-sm text-yellow-800">
                  Vous ne recevrez aucune notification de bien-être. Activez les notifications pour un accompagnement optimal.
                </p>
              </div>
            </div>
          )}
        </div>

        {localPreferences.enabled && (
          <>
            {/* Types de notifications */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Types de notifications</h3>
              
              <div className="space-y-4">
                {notificationTypes.map((type) => (
                  <div key={type.key} className="flex items-center justify-between p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="flex-shrink-0">
                        {type.icon}
                      </div>
                      <div>
                        <h4 className="font-medium text-gray-800">{type.label}</h4>
                        <p className="text-sm text-gray-600">{type.description}</p>
                      </div>
                    </div>
                    
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={localPreferences.types[type.key]}
                        onChange={(e) => handleTypeChange(type.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>

            {/* Fréquence des notifications */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Fréquence générale</h3>
              
              <div className="space-y-3">
                {frequencyOptions.map((option) => (
                  <label key={option.value} className="flex items-start gap-3 p-3 rounded-lg border border-gray-200 hover:bg-gray-50 cursor-pointer">
                    <input
                      type="radio"
                      name="frequency"
                      value={option.value}
                      checked={localPreferences.frequency === option.value}
                      onChange={() => handlePreferenceChange('frequency', option.value)}
                      className="mt-1 text-blue-600"
                    />
                    <div>
                      <div className="font-medium text-gray-800">{option.label}</div>
                      <div className="text-sm text-gray-600">{option.description}</div>
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Heures de silence */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-3">
                  <Clock className="w-6 h-6 text-purple-600" />
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">Heures de silence</h3>
                    <p className="text-sm text-gray-600">Période pendant laquelle vous ne recevrez pas de notifications</p>
                  </div>
                </div>
                
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={localPreferences.quiet_hours.enabled}
                    onChange={(e) => handleQuietHoursChange('enabled', e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                </label>
              </div>

              {localPreferences.quiet_hours.enabled && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Début du silence
                    </label>
                    <input
                      type="time"
                      value={localPreferences.quiet_hours.start}
                      onChange={(e) => handleQuietHoursChange('start', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Fin du silence
                    </label>
                    <input
                      type="time"
                      value={localPreferences.quiet_hours.end}
                      onChange={(e) => handleQuietHoursChange('end', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Notifications push du navigateur */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <Smartphone className="w-6 h-6 text-blue-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Notifications du navigateur</h3>
                  <p className="text-sm text-gray-600">Recevez des notifications même quand MindEase n'est pas ouvert</p>
                </div>
              </div>

              {pushPermission === 'denied' ? (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                  <div className="flex items-center gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600" />
                    <div>
                      <p className="text-sm font-medium text-red-800">Notifications bloquées</p>
                      <p className="text-sm text-red-700 mt-1">
                        Les notifications sont bloquées dans votre navigateur. 
                        Cliquez sur l'icône de verrou dans la barre d'adresse pour les autoriser.
                      </p>
                    </div>
                  </div>
                </div>
              ) : pushPermission === 'granted' ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <Bell className="w-5 h-5 text-green-600" />
                    </div>
                    <div>
                      <p className="font-medium text-gray-800">Notifications autorisées</p>
                      <p className="text-sm text-gray-600">Vous recevrez des notifications push</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.push_notifications}
                      onChange={(e) => handlePreferenceChange('push_notifications', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
              ) : (
                <button
                  onClick={handleRequestPushPermission}
                  className="w-full p-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Bell className="w-5 h-5" />
                  Activer les notifications push
                </button>
              )}
            </div>

            {/* Options avancées */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-6">Options avancées</h3>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    {localPreferences.sound_enabled ? (
                      <Volume2 className="w-5 h-5 text-blue-600" />
                    ) : (
                      <VolumeX className="w-5 h-5 text-gray-400" />
                    )}
                    <div>
                      <p className="font-medium text-gray-800">Son des notifications</p>
                      <p className="text-sm text-gray-600">Son lors de la réception d'une notification</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.sound_enabled}
                      onChange={(e) => handlePreferenceChange('sound_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>

                <div className="flex items-center justify-between p-3 rounded-lg border border-gray-200">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium text-gray-800">Vibration</p>
                      <p className="text-sm text-gray-600">Vibration sur les appareils compatibles</p>
                    </div>
                  </div>
                  
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={localPreferences.vibration_enabled}
                      onChange={(e) => handlePreferenceChange('vibration_enabled', e.target.checked)}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-purple-600"></div>
                  </label>
                </div>
              </div>
            </div>

            {/* Test des notifications */}
            <div className="bg-white rounded-xl shadow-sm border p-6">
              <div className="flex items-center gap-3 mb-6">
                <TestTube className="w-6 h-6 text-green-600" />
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Tester les notifications</h3>
                  <p className="text-sm text-gray-600">Vérifiez que vos notifications fonctionnent correctement</p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {testNotifications.map((test, index) => (
                  <button
                    key={index}
                    onClick={test.action}
                    className={`p-3 rounded-lg border transition-colors flex items-center gap-2 ${test.color}`}
                  >
                    {test.icon}
                    {test.label}
                  </button>
                ))}
              </div>
            </div>
          </>
        )}

        {/* Actions de sauvegarde */}
        <div className="flex items-center gap-4 pt-6 border-t border-gray-200">
          <button
            onClick={handleSave}
            disabled={!hasChanges || isSaving}
            className={`flex items-center gap-2 px-6 py-3 rounded-lg font-medium transition-colors ${
              hasChanges && !isSaving
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Save className="w-5 h-5" />
            {isSaving ? 'Sauvegarde...' : 'Sauvegarder les modifications'}
          </button>

          {hasChanges && (
            <button
              onClick={handleReset}
              className="flex items-center gap-2 px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium"
            >
              <RotateCcw className="w-5 h-5" />
              Annuler les modifications
            </button>
          )}

          {!hasChanges && (
            <p className="text-sm text-gray-500 flex items-center gap-2">
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
              Vos paramètres sont à jour
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;