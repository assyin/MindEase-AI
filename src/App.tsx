import React, { useState, useEffect } from 'react';
import { MinimalChatInterface } from './components/MinimalChatInterface';
import { UserDashboard } from './components/UserDashboard';
import { UserSettings } from './components/UserSettings';
import { NotificationCenter } from './components/NotificationCenter';
import { NotificationSettings } from './components/NotificationSettings';
import { MoodTracker } from './components/MoodTracker';
import { ConversationSidebar } from './components/ConversationSidebar';
import { ConversationTabs } from './components/ConversationTabs';
import { NewConversationModal } from './components/NewConversationModal';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ConversationsProvider, useConversations } from './contexts/ConversationsContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { LanguageSelector } from './components/LanguageSelector';
import { QuickDarijaTest } from './components/QuickDarijaTest';
import { GeminiVoiceTestLab } from './components/GeminiVoiceTestLab';
import TherapyIntegrationTest from './components/TherapyIntegrationTest';
import TherapyOnboarding from './components/TherapyOnboarding';
import TherapyDashboard from './components/TherapyDashboard';
import { pushNotificationService } from './services/PushNotificationService';
import './index.css';

const AppContent: React.FC = () => {
  const [currentPage, setCurrentPage] = useState<'chat' | 'dashboard' | 'settings' | 'notifications' | 'mood-tracker' | 'darija-test' | 'voice-lab' | 'therapy-test' | 'therapy-onboarding' | 'therapy-dashboard'>('chat');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showNewConversationModal, setShowNewConversationModal] = useState(false);
  const { user, loading, signOut } = useAuth();
  const { languageSettings, setLanguage, isRtl } = useLanguage();

  // Initialiser les notifications push au chargement
  useEffect(() => {
    const initializePushNotifications = async () => {
      try {
        await pushNotificationService.initialize();
      } catch (error) {
        console.error('Erreur initialisation push notifications:', error);
      }
    };

    if (user) {
      initializePushNotifications();
    }
  }, [user]);

  // Écouter l'événement de navigation vers le therapy onboarding
  useEffect(() => {
    const handleNavigateToTherapyOnboarding = () => {
      setCurrentPage('therapy-onboarding');
    };

    window.addEventListener('navigate-to-therapy-onboarding', handleNavigateToTherapyOnboarding);
    
    return () => {
      window.removeEventListener('navigate-to-therapy-onboarding', handleNavigateToTherapyOnboarding);
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement de MindEase AI...</p>
        </div>
      </div>
    );
  }

  const renderPage = () => {
    switch (currentPage) {
      case 'dashboard':
        return <UserDashboard />;
      case 'settings':
        return <UserSettings />;
      case 'notifications':
        return <NotificationSettings />;
      case 'mood-tracker':
        return <MoodTracker />;
      case 'darija-test':
        return <QuickDarijaTest />;
      case 'voice-lab':
        return <GeminiVoiceTestLab />;
      case 'therapy-test':
        return <TherapyIntegrationTest />;
      case 'therapy-onboarding':
        return <TherapyOnboarding onComplete={() => setCurrentPage('therapy-dashboard')} />;
      case 'therapy-dashboard':
        return <TherapyDashboard />;
      default:
        return <MinimalChatInterface />;
    }
  };

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 to-green-50 ${isRtl() ? 'rtl' : 'ltr'}`} dir={isRtl() ? 'rtl' : 'ltr'}>
      {user && (
        <ConversationsProvider>
          <div className="flex h-screen max-h-screen">
            {/* Sidebar des conversations */}
            <ConversationSidebar
              isCollapsed={sidebarCollapsed}
              onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
              onCreateConversation={() => setShowNewConversationModal(true)}
              className={currentPage === 'chat' ? 'block' : 'hidden lg:block'}
            />

            {/* Contenu principal */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Barre de navigation supérieure */}
              <div className="bg-white shadow-sm border-b sticky top-0 z-40 flex-shrink-0">
                <div className="flex items-center justify-between px-4 py-2">
                  {/* Logo et navigation */}
                  <div className="flex items-center space-x-6">
                    <div className="flex items-center space-x-2">
                      <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-green-500 rounded-full flex items-center justify-center">
                        <span className="text-white text-sm font-bold">M</span>
                      </div>
                      <span className="font-bold text-gray-800">MindEase AI</span>
                    </div>
                    
                    {/* Onglets de navigation */}
                    <div className="flex space-x-1">
                      {[
                        { id: 'chat', label: '💬 Chat', icon: '💬' },
                        { id: 'therapy-onboarding', label: '🎯 Onboarding', icon: '🎯' },
                        { id: 'therapy-dashboard', label: '🏥 Thérapie', icon: '🏥' },
                        { id: 'therapy-test', label: '🧪 Tests', icon: '🧪' },
                        { id: 'dashboard', label: '📊 Dashboard', icon: '📊' },
                        { id: 'mood-tracker', label: '💝 Humeur', icon: '💝' },
                        { id: 'darija-test', label: '🇲🇦 Darija', icon: '🇲🇦' },
                        { id: 'voice-lab', label: '🔊 Voice', icon: '🔊' },
                        { id: 'settings', label: '⚙️ Paramètres', icon: '⚙️' }
                      ].map(tab => (
                        <button
                          key={tab.id}
                          onClick={() => setCurrentPage(tab.id as any)}
                          className={`px-4 py-2 rounded-lg font-medium text-sm transition-colors ${
                            currentPage === tab.id
                              ? 'bg-blue-100 text-blue-700 border-2 border-blue-200' 
                              : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
                          }`}
                        >
                          <span className="mr-2">{tab.icon}</span>
                          {tab.label.split(' ')[1]}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Informations utilisateur et notifications */}
                  <div className={`flex items-center space-x-4 ${isRtl() ? 'space-x-reverse' : ''}`}>
                    {/* Quick Language Toggle */}
                    <div className="flex space-x-1">
                      <button
                        onClick={() => setLanguage('fr')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          languageSettings.current_language === 'fr'
                            ? 'bg-blue-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-blue-100'
                        }`}
                        title="Basculer vers le français"
                      >
                        🇫🇷 FR
                      </button>
                      <button
                        onClick={() => setLanguage('ar')}
                        className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                          languageSettings.current_language === 'ar'
                            ? 'bg-orange-500 text-white'
                            : 'bg-gray-200 text-gray-700 hover:bg-orange-100'
                        }`}
                        title="التبديل إلى العربية"
                      >
                        🇲🇦 AR
                      </button>
                    </div>

                    {/* Full Language Selector */}
                    <LanguageSelector
                      currentLanguage={languageSettings.current_language}
                      onLanguageChange={setLanguage}
                      compact={true}
                      className="ml-2"
                    />

                    {/* Centre de notifications */}
                    <NotificationCenter />
                    
                    <span className="text-sm text-gray-600" dir={isRtl() ? 'rtl' : 'ltr'}>
                      {languageSettings.current_language === 'ar' 
                        ? `أهلاً، ${user.full_name || user.email}`
                        : `Bonjour, ${user.full_name || user.email}`
                      }
                    </span>
                    
                    {/* Menu utilisateur */}
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => setCurrentPage('notifications')}
                        className={`text-sm px-3 py-1 rounded-lg transition-colors ${
                          currentPage === 'notifications'
                            ? 'bg-purple-100 text-purple-700'
                            : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'
                        }`}
                      >
                        🔔 Notifs
                      </button>
                      <button
                        onClick={signOut}
                        className="text-sm text-gray-500 hover:text-gray-700 px-3 py-1 rounded-lg hover:bg-gray-100 transition-colors"
                      >
                        Déconnexion
                      </button>
                    </div>
                  </div>
                </div>

                {/* Onglets de conversation (seulement pour la page chat) */}
                {currentPage === 'chat' && (
                  <ConversationTabs
                    onCreateConversation={() => setShowNewConversationModal(true)}
                  />
                )}
              </div>

              {/* Contenu de la page */}
              <div className="flex-1 overflow-auto min-h-0">
                {renderPage()}
              </div>
            </div>
          </div>

          {/* Modal de nouvelle conversation */}
          <NewConversationModal
            isOpen={showNewConversationModal}
            onClose={() => setShowNewConversationModal(false)}
            onConversationCreated={() => {
              setCurrentPage('chat');
            }}
          />
        </ConversationsProvider>
      )}
    </div>
  );
};

function App() {
  return (
    <AuthProvider>
      <LanguageProvider>
        <AppContent />
      </LanguageProvider>
    </AuthProvider>
  );
}

export default App;
