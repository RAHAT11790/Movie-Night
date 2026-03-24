// Firebase Messaging Service Worker for background push notifications
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.14.1/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyC0KtwNcRcGYplQloSUh1nVCJKdEqJ5dj8",
  authDomain: "movie-night-88f65.firebaseapp.com",
  projectId: "movie-night-88f65",
  storageBucket: "movie-night-88f65.firebasestorage.app",
  messagingSenderId: "222819622819",
  appId: "1:222819622819:web:c3a8b2f4eb1558fea28416"
};

const messaging = firebase.messaging();

// Handle background messages
messaging.onBackgroundMessage((payload) => {
  const { title, body, icon, image } = payload.notification || {};
  const notifTitle = title || 'Movie Night';
  const brandIcon = 'https://i.ibb.co.com/MxDFRJVt/IMG-20260324-224042-439.jpg';
  const notifOptions = {
    body: body || '',
    icon: icon || brandIcon,
    image: image || undefined,
    badge: brandIcon,
    vibrate: [200, 100, 200],
    data: payload.data || {},
    tag: `rsanime-bg-${Date.now()}`,
  };
  self.registration.showNotification(notifTitle, notifOptions);
});

// Handle notification click
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const rawUrl = event.notification.data?.url || '/';
  const url = rawUrl.startsWith('http://') || rawUrl.startsWith('https://')
    ? rawUrl
    : `${self.location.origin}${rawUrl.startsWith('/') ? rawUrl : `/${rawUrl}`}`;

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url.includes(self.location.origin) && 'focus' in client) {
          client.focus();
          if ('navigate' in client) return client.navigate(url);
          return client;
        }
      }
      return self.clients.openWindow(url);
    })
  );
});
