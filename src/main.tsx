import React from 'react';
import ReactDOM from 'react-dom/client';
import * as Sentry from '@sentry/react';
import { BrowserTracing } from '@sentry/tracing';
import App from './App';
import './index.css';
import { createTestNotifications, simulateDailyNotifications, clearTestNotifications } from './utils/testNotifications';
import GoogleGenAIClient from './services/GoogleGenAIClient';

// Initialiser Sentry
Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  integrations: [
    new BrowserTracing(),
  ],
  tracesSampleRate: 1.0,
  environment: import.meta.env.MODE,
});

// Test d'initialisation Google GenAI au démarrage
if (import.meta.env.DEV) {
  try {
    GoogleGenAIClient.getInstance();
    console.log('✅ Google GenAI client ready at startup');
    console.log('🔍 Client debug info:', GoogleGenAIClient.getDebugInfo());
  } catch (error) {
    console.error('❌ Google GenAI initialization failed at startup:', error);
    console.error('🔍 Debug info:', GoogleGenAIClient.getDebugInfo());
  }
}

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(
  <React.StrictMode>
    <Sentry.ErrorBoundary fallback={<div>Une erreur est survenue</div>}>
      <App />
    </Sentry.ErrorBoundary>
  </React.StrictMode>
);

// Exposer les fonctions de test dans la console (mode développement)
if (import.meta.env.DEV) {
  (window as any).testNotifications = {
    createTestNotifications,
    simulateDailyNotifications,
    clearTestNotifications
  };
  
  // Exposer les fonctions Google GenAI pour debugging
  (window as any).googleGenAI = {
    getDebugInfo: () => GoogleGenAIClient.getDebugInfo(),
    testConnection: () => GoogleGenAIClient.testConnection(),
    reset: () => GoogleGenAIClient.reset()
  };
  
  console.log('🧪 Fonctions de test disponibles:');
  console.log('📧 Notifications:');
  console.log('- testNotifications.createTestNotifications()');
  console.log('- testNotifications.simulateDailyNotifications()');  
  console.log('- testNotifications.clearTestNotifications()');
  console.log('🤖 Google GenAI:');
  console.log('- googleGenAI.getDebugInfo()');
  console.log('- googleGenAI.testConnection()');
  console.log('- googleGenAI.reset()');
}
