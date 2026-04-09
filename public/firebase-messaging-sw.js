// Firebase Messaging Service Worker for background push notifications
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC0KtwNcRcGYplQloSUh1nVCJKdEqJ5dj8",
  authDomain: "movie-night-88f65.firebaseapp.com",
  databaseURL: "https://movie-night-88f65-default-rtdb.firebaseio.com",
  projectId: "movie-night-88f65",
  storageBucket: "movie-night-88f65.firebasestorage.app",
  messagingSenderId: "222819622819",
  appId: "1:222819622819:web:c3a8b2f4eb1558fea28416"
});

const messaging = firebase.messaging();
const brandIcon = 'https://i.ibb.co/pjHZHQXv/20260401-202949.png';
// Main published domain — always use this for notification clicks
const MAIN_DOMAIN = 'https://movienight-dun.vercel.app';

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const notification = payload.notification || {};
  const data = payload.data || {};
  
  const notifTitle = notification.title || data.title || 'MOVIE NIGHT';
  const notifBody = notification.body || data.body || '';
  const notifImage = notification.image || data.image || undefined;
  const notifIcon = notification.icon || data.icon || brandIcon;
  
  // Use content-based tag to prevent duplicate notifications
  const contentTag = data.contentId || data.type || 'general';
  
  const notifOptions = {
    body: notifBody,
    icon: notifIcon,
    image: notifImage,
    badge: brandIcon,
    vibrate: [200, 100, 200],
    data: data,
    tag: 'rsanime-' + contentTag,
    renotify: true,
    requireInteraction: false,
  };
  
  return self.registration.showNotification(notifTitle, notifOptions);
});

// Raw push event fallback
self.addEventListener('push', (event) => {
  if (event.data) {
    try {
      const payload = event.data.json();
      if (!payload.notification && payload.data) {
        const data = payload.data;
        const title = data.title || 'MOVIE NIGHT';
        const contentTag = data.contentId || data.type || 'general';
        const options = {
          body: data.body || '',
          icon: data.icon || brandIcon,
          image: data.image || undefined,
          badge: brandIcon,
          vibrate: [200, 100, 200],
          data: data,
          tag: 'rsanime-' + contentTag,
          renotify: true,
        };
        event.waitUntil(self.registration.showNotification(title, options));
      }
    } catch (e) {
      // Not JSON, ignore
    }
  }
});

// Handle notification click — ALWAYS open main domain
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const data = event.notification.data || {};
  const rawUrl = data.url || '/';
  
  // Always use main domain or baseUrl from payload, never self.location.origin
  const baseDomain = data.baseUrl || MAIN_DOMAIN;
  const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : baseDomain + (rawUrl.startsWith('/') ? rawUrl : '/' + rawUrl);

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Try to focus an existing window on the main domain
      for (const client of clientList) {
        if (client.url.includes(baseDomain) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) return client.navigate(url);
          return client;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});

// Activate immediately
self.addEventListener('activate', (event) => {
  event.waitUntil(self.clients.claim());
});
