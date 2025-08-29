import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

export const UserSettings: React.FC = () => {
  const { user, updateUserProfile } = useAuth();
  const [settings, setSettings] = useState({
    preferredAIModel: user?.preferred_ai_model || 'auto',
    preferredMode: user?.preferred_mode || 'text',
    autoPlay: localStorage.getItem('autoPlay') === 'true',
    notifications: localStorage.getItem('notifications') !== 'false',
    privacy: localStorage.getItem('privacy') || 'high',
    language: 'fr',
    theme: 'light'
  });

  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Sauvegarder dans le profil utilisateur
      await updateUserProfile({
        preferred_ai_model: settings.preferredAIModel as any,
        preferred_mode: settings.preferredMode as any
      });

      // Sauvegarder dans localStorage
      localStorage.setItem('autoPlay', settings.autoPlay.toString());
      localStorage.setItem('notifications', settings.notifications.toString());
      localStorage.setItem('privacy', settings.privacy);
      localStorage.setItem('language', settings.language);
      localStorage.setItem('theme', settings.theme);

      setSaveMessage('✅ Paramètres sauvegardés avec succès !');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      setSaveMessage('❌ Erreur lors de la sauvegarde');
      setTimeout(() => setSaveMessage(''), 3000);
    } finally {
      setIsSaving(false);
    }
  };

  const handleReset = () => {
    setSettings({
      preferredAIModel: 'auto',
      preferredMode: 'text',
      autoPlay: false,
      notifications: true,
      privacy: 'high',
      language: 'fr',
      theme: 'light'
    });
  };

  const SettingSection: React.FC<{
    title: string;
    description: string;
    children: React.ReactNode;
  }> = ({ title, description, children }) => (
    <div className="bg-white rounded-lg shadow-sm p-6 border">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-800">{title}</h3>
        <p className="text-sm text-gray-600 mt-1">{description}</p>
      </div>
      {children}
    </div>
  );

  return (
    <div className="p-6 max-w-4xl mx-auto h-full overflow-auto">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Paramètres</h1>
        <p className="text-gray-600 mt-2">
          Personnalisez votre expérience MindEase AI
        </p>
      </div>

      {/* Message de sauvegarde */}
      {saveMessage && (
        <div className={`mb-6 p-4 rounded-lg ${
          saveMessage.includes('✅') 
            ? 'bg-green-50 text-green-800 border border-green-200' 
            : 'bg-red-50 text-red-800 border border-red-200'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="space-y-6">
        {/* Intelligence Artificielle */}
        <SettingSection
          title="🤖 Intelligence Artificielle"
          description="Configurez les préférences pour les modèles IA"
        >
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Modèle IA préféré
              </label>
              <select
                value={settings.preferredAIModel}
                onChange={(e) => setSettings({...settings, preferredAIModel: e.target.value as 'gemini' | 'openai' | 'auto'})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="auto">🔄 Automatique (Recommandé)</option>
                <option value="gemini">🟢 Google Gemini - Meilleur pour analyses approfondies</option>
                <option value="openai">🟠 OpenAI GPT-4 - Plus rapide et créatif</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Mode de communication préféré
              </label>
              <select
                value={settings.preferredMode}
                onChange={(e) => setSettings({...settings, preferredMode: e.target.value as 'text' | 'voice' | 'hybrid'})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="text">💬 Textuel - Écriture et lecture</option>
                <option value="voice">🎤 Vocal - Parole et écoute</option>
                <option value="hybrid">🔄 Hybride - Combinaison des deux</option>
              </select>
            </div>
          </div>
        </SettingSection>

        {/* Audio et Interface */}
        <SettingSection
          title="🔊 Audio et Interface"
          description="Personnalisez l'expérience audio et visuelle"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Lecture automatique des réponses
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  L'IA lit automatiquement ses réponses quand vous utilisez le mode vocal
                </p>
              </div>
              <button
                onClick={() => setSettings({...settings, autoPlay: !settings.autoPlay})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.autoPlay ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.autoPlay ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Thème de l'interface
              </label>
              <select
                value={settings.theme}
                onChange={(e) => setSettings({...settings, theme: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="light">☀️ Clair</option>
                <option value="dark">🌙 Sombre (Bientôt disponible)</option>
                <option value="auto">🔄 Automatique selon l'heure</option>
              </select>
            </div>
          </div>
        </SettingSection>

        {/* Confidentialité et Sécurité */}
        <SettingSection
          title="🔒 Confidentialité et Sécurité"
          description="Contrôlez vos données et votre vie privée"
        >
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Notifications de bien-être
                </label>
                <p className="text-xs text-gray-500 mt-1">
                  Recevez des rappels et conseils personnalisés
                </p>
              </div>
              <button
                onClick={() => setSettings({...settings, notifications: !settings.notifications})}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                  settings.notifications ? 'bg-blue-600' : 'bg-gray-300'
                }`}
              >
                <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  settings.notifications ? 'translate-x-6' : 'translate-x-1'
                }`} />
              </button>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Niveau de confidentialité
              </label>
              <select
                value={settings.privacy}
                onChange={(e) => setSettings({...settings, privacy: e.target.value})}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="high">🔒 Élevé - Aucune donnée sauvegardée (Recommandé)</option>
                <option value="medium">🔐 Moyen - Données anonymisées uniquement</option>
                <option value="low">🔓 Faible - Amélioration de l'expérience</option>
              </select>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
              <div className="flex">
                <div className="text-yellow-500 mr-3">⚠️</div>
                <div>
                  <h4 className="text-sm font-medium text-yellow-800">
                    Important sur la confidentialité
                  </h4>
                  <p className="text-sm text-yellow-700 mt-1">
                    Vos conversations ne sont jamais stockées de manière permanente. 
                    Toutes les données sont chiffrées et anonymisées.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </SettingSection>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex-1 px-6 py-3 rounded-lg font-medium transition-colors ${
              isSaving
                ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
          >
            {isSaving ? 'Sauvegarde...' : '💾 Sauvegarder les paramètres'}
          </button>
          
          <button
            onClick={handleReset}
            className="px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors font-medium"
          >
            🔄 Réinitialiser
          </button>
        </div>
      </div>
    </div>
  );
};
