// Firebase Messaging Service Worker for background push notifications
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC0KtwNcRcGYplQloSUh1nVCJKdEqJ5dj8",
  authDomain: "movie-night-88f65.firebaseapp.com",
  databaseURL: "https://movie-night-88f65-default-rtdb.firebaseio.com", // ✅ Added databaseURL
  projectId: "movie-night-88f65",
  storageBucket: "movie-night-88f65.firebasestorage.app",
  messagingSenderId: "222819622819",
  appId: "1:222819622819:web:c3a8b2f4eb1558fea28416"
});

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message:', payload);
  
  const notificationTitle = payload.notification?.title || payload.data?.title || 'Movie Night';
  const notificationBody = payload.notification?.body || payload.data?.body || '';
  const brandIcon = 'https://i.ibb.co/MxDFRJVt/IMG-20260324-224042-439.jpg';
  
  const notificationOptions = {
    body: notificationBody,
    icon: payload.notification?.icon || brandIcon,
    badge: brandIcon,
    vibrate: [200, 100, 200],
    data: {
      url: payload.data?.url || '/',
      ...payload.data
    },
    tag: `rsanime-bg-${Date.now()}`,
  };
  
  self.registration.showNotification(notificationTitle, notificationOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  
  const urlToOpen = event.notification.data?.url || '/';
  const fullUrl = urlToOpen.startsWith('http') ? urlToOpen : `${self.location.origin}${urlToOpen}`;
  
  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client && client.url !== fullUrl) {
            return client.navigate(fullUrl);
          }
          return client;
        }
      }
      return self.clients.openWindow(fullUrl);
    })
  );
});
