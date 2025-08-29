import type { Notification } from './NotificationService';

export interface PushSubscriptionData {
  endpoint: string;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export class PushNotificationService {
  private registration: ServiceWorkerRegistration | null = null;
  private subscription: PushSubscription | null = null;

  async initialize(): Promise<boolean> {
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      console.warn('Push notifications not supported');
      return false;
    }

    try {
      // Enregistrer le service worker
      this.registration = await navigator.serviceWorker.register('/sw.js');
      
      // Attendre que le service worker soit actif
      await navigator.serviceWorker.ready;
      
      console.log('Service Worker registered and ready');
      return true;
    } catch (error) {
      console.error('Service Worker registration failed:', error);
      return false;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (!('Notification' in window)) {
      console.warn('Notifications not supported');
      return false;
    }

    if (Notification.permission === 'granted') {
      return true;
    }

    if (Notification.permission === 'denied') {
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      return permission === 'granted';
    } catch (error) {
      console.error('Error requesting notification permission:', error);
      return false;
    }
  }

  async subscribeToPush(): Promise<PushSubscriptionData | null> {
    if (!this.registration) {
      await this.initialize();
    }

    if (!this.registration) {
      console.error('No service worker registration');
      return null;
    }

    try {
      // Générer une clé VAPID pour l'exemple (en production, elle devrait venir du serveur)
      const vapidPublicKey = this.urlBase64ToUint8Array(
        'BEl62iUYgUivxIkv69yViEuiBIa40HI8YlAk75ZdWHECJo3-GxMCl9zw7rOCBSCJRVs0PJFGqcImn6BiBUQl3YI'
      );

      this.subscription = await this.registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: vapidPublicKey
      });

      console.log('Push subscription created:', this.subscription);

      // Convertir en format utilisable
      const subscriptionData: PushSubscriptionData = {
        endpoint: this.subscription.endpoint,
        keys: {
          p256dh: this.arrayBufferToBase64(this.subscription.getKey('p256dh')),
          auth: this.arrayBufferToBase64(this.subscription.getKey('auth'))
        }
      };

      return subscriptionData;
    } catch (error) {
      console.error('Error subscribing to push:', error);
      return null;
    }
  }

  async unsubscribeFromPush(): Promise<boolean> {
    if (!this.subscription) {
      console.log('No active push subscription');
      return true;
    }

    try {
      const success = await this.subscription.unsubscribe();
      if (success) {
        this.subscription = null;
        console.log('Push subscription cancelled');
      }
      return success;
    } catch (error) {
      console.error('Error unsubscribing from push:', error);
      return false;
    }
  }

  async sendLocalNotification(notification: Notification): Promise<void> {
    if (!this.registration) {
      console.error('No service worker registration');
      return;
    }

    if (Notification.permission !== 'granted') {
      console.warn('Notification permission not granted');
      return;
    }

    try {
      await this.registration.showNotification(notification.title, {
        body: notification.message,
        icon: notification.image || '/icon-192x192.png',
        badge: '/icon-192x192.png',
        tag: notification.id,
        requireInteraction: notification.priority === 'high',
        silent: false,
        vibrate: [200, 100, 200],
        actions: notification.actionUrl ? [
          {
            action: 'open',
            title: notification.actionLabel || 'Ouvrir',
            icon: '/icon-192x192.png'
          },
          {
            action: 'dismiss',
            title: 'Ignorer'
          }
        ] : undefined,
        data: {
          url: notification.actionUrl || '/',
          notificationId: notification.id,
          type: notification.type,
          category: notification.category,
          ...notification.metadata
        }
      });
    } catch (error) {
      console.error('Error showing local notification:', error);
    }
  }

  async simulatePushNotification(notification: Notification): Promise<void> {
    // Simuler une notification push pour les tests
    if (!this.registration) {
      console.error('No service worker registration');
      return;
    }

    // Créer un événement push simulé
    const pushData = {
      title: notification.title,
      body: notification.message,
      icon: notification.image || '/icon-192x192.png',
      url: notification.actionUrl || '/',
      id: notification.id,
      priority: notification.priority,
      metadata: notification.metadata
    };

    // Envoyer le message au service worker
    if (this.registration.active) {
      this.registration.active.postMessage({
        type: 'SIMULATE_PUSH',
        data: pushData
      });
    }
  }

  // Méthodes utilitaires
  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  private arrayBufferToBase64(buffer: ArrayBuffer | null): string {
    if (!buffer) return '';
    
    const bytes = new Uint8Array(buffer);
    let binary = '';
    
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    
    return window.btoa(binary);
  }

  // Vérifications de support
  isSupported(): boolean {
    return 'serviceWorker' in navigator && 
           'PushManager' in window && 
           'Notification' in window;
  }

  isPushSupported(): boolean {
    return this.isSupported() && 'PushManager' in window;
  }

  getNotificationPermission(): NotificationPermission {
    return Notification.permission;
  }

  async hasActiveSubscription(): Promise<boolean> {
    if (!this.registration) return false;
    
    try {
      const subscription = await this.registration.pushManager.getSubscription();
      return subscription !== null;
    } catch {
      return false;
    }
  }
}

// Instance singleton
export const pushNotificationService = new PushNotificationService();