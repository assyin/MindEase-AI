// Service Worker pour les notifications push
const CACHE_NAME = 'mindease-notifications-v1';
const NOTIFICATION_TAG = 'mindease-notification';

// Installation du Service Worker
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...');
  self.skipWaiting();
});

// Activation du Service Worker
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...');
  event.waitUntil(self.clients.claim());
});

// Gestion des notifications push
self.addEventListener('push', (event) => {
  console.log('Push event received:', event);
  
  if (!event.data) {
    console.log('Push event has no data');
    return;
  }

  try {
    const data = event.data.json();
    console.log('Push data:', data);

    const options = {
      body: data.message || data.body,
      icon: data.icon || '/icon-192x192.png',
      badge: '/icon-192x192.png',
      image: data.image,
      tag: data.tag || NOTIFICATION_TAG,
      requireInteraction: data.priority === 'high',
      silent: data.silent === true,
      vibrate: data.vibrate ? [200, 100, 200] : undefined,
      actions: data.actions || [
        {
          action: 'open',
          title: 'Ouvrir MindEase',
          icon: '/icon-192x192.png'
        },
        {
          action: 'dismiss',
          title: 'Ignorer'
        }
      ],
      data: {
        url: data.url || '/',
        notificationId: data.id,
        ...data.metadata
      }
    };

    event.waitUntil(
      self.registration.showNotification(
        data.title || 'MindEase AI',
        options
      )
    );
  } catch (error) {
    console.error('Error processing push event:', error);
    
    // Notification de fallback
    event.waitUntil(
      self.registration.showNotification('MindEase AI', {
        body: 'Vous avez une nouvelle notification',
        icon: '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: NOTIFICATION_TAG
      })
    );
  }
});

// Gestion des clics sur les notifications
self.addEventListener('notificationclick', (event) => {
  console.log('Notification clicked:', event);
  
  event.notification.close();

  const action = event.action;
  const data = event.notification.data || {};

  if (action === 'dismiss') {
    // Ne rien faire, juste fermer la notification
    return;
  }

  // URL à ouvrir (par défaut ou spécifiée dans les données)
  let url = '/';
  if (action === 'open' || !action) {
    url = data.url || '/';
  }

  event.waitUntil(
    clients.matchAll({
      type: 'window',
      includeUncontrolled: true
    }).then((clientList) => {
      // Chercher si MindEase est déjà ouvert
      for (const client of clientList) {
        if (client.url.includes(self.location.origin)) {
          // Focus sur la fenêtre existante et naviguer vers l'URL
          client.focus();
          return client.navigate(url);
        }
      }
      
      // Ouvrir une nouvelle fenêtre si aucune n'est ouverte
      return clients.openWindow(url);
    })
  );
});

// Gestion de la fermeture des notifications
self.addEventListener('notificationclose', (event) => {
  console.log('Notification closed:', event.notification);
  
  // Optionnel : envoyer des analytics sur les notifications fermées
  const data = event.notification.data || {};
  if (data.notificationId) {
    // Ici on pourrait envoyer une requête pour marquer la notification comme vue
    console.log('Notification closed:', data.notificationId);
  }
});

// Gestion des messages depuis l'application principale
self.addEventListener('message', (event) => {
  console.log('Service Worker received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});

// Fonction utilitaire pour créer des notifications locales
function createLocalNotification(title, options = {}) {
  return self.registration.showNotification(title, {
    body: options.body || '',
    icon: options.icon || '/icon-192x192.png',
    badge: '/icon-192x192.png',
    tag: options.tag || NOTIFICATION_TAG,
    requireInteraction: options.requireInteraction || false,
    silent: options.silent || false,
    vibrate: options.vibrate ? [200, 100, 200] : undefined,
    data: options.data || {}
  });
}

// Export pour utilisation depuis l'application
self.createLocalNotification = createLocalNotification;