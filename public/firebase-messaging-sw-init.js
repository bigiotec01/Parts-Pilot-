// Firebase Messaging SW — este archivo se inyecta en el SW de Vite PWA via importScripts
// NO lo renombres a firebase-messaging-sw.js; ese nombre tiene significado especial en Firebase.

importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.12.0/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: 'AIzaSyAWmTOV17ojzGOxi6RSLEzf46zFiPktyjo',
  authDomain: 'partspilot-ec37a.firebaseapp.com',
  projectId: 'partspilot-ec37a',
  storageBucket: 'partspilot-ec37a.firebasestorage.app',
  messagingSenderId: '956365583546',
  appId: '1:956365583546:web:8345158e5faa7ad44fbe83',
});

const messaging = firebase.messaging();

// Mensajes recibidos cuando la app está cerrada o en background
messaging.onBackgroundMessage((payload) => {
  const title = payload.notification?.title || 'Parts Pilot';
  const body  = payload.notification?.body  || '';

  return self.registration.showNotification(title, {
    body,
    icon:    '/pwa-192x192.png',
    badge:   '/pwa-64x64.png',
    tag:     payload.data?.pedidoId || 'pp-notif',
    data:    payload.data || {},
    vibrate: [200, 100, 200],
    requireInteraction: false,
  });
});

// Clic en la notificación → abrir/enfocar la app
self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  event.waitUntil(
    clients
      .matchAll({ type: 'window', includeUncontrolled: true })
      .then((windowClients) => {
        for (const client of windowClients) {
          if ('focus' in client) return client.focus();
        }
        return clients.openWindow('/');
      })
  );
});
