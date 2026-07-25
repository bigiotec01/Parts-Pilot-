// Firebase Messaging SW — este archivo se inyecta en el SW de Vite PWA via importScripts
// NO lo renombres a firebase-messaging-sw.js; ese nombre tiene significado especial en Firebase.

console.log('[SW] firebase-messaging-sw-init.js: evaluación inicial arrancando. BUILD MARKER: v1.3.7');
console.log('[SW] self.registration.active al arrancar:', self.registration && self.registration.active && self.registration.active.state);
console.log('[SW] self.registration.waiting al arrancar:', self.registration && self.registration.waiting && self.registration.waiting.state);

// Listener redundante para el mensaje de actualización de la PWA, independiente
// del que genera automáticamente Vite PWA/Workbox más abajo en el sw.js final.
// Lo ponemos aquí (en un archivo que controlamos por completo) para diagnosticar
// y, de paso, no depender de un único punto de fallo para algo tan crítico como
// poder saltar la espera de una actualización.
self.addEventListener('message', (event) => {
  console.log('[SW] mensaje recibido:', event.data);
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] ejecutando self.skipWaiting()');
    self.skipWaiting().then(
      () => console.log('[SW] skipWaiting() RESUELTO OK'),
      (err) => console.error('[SW] skipWaiting() RECHAZADO:', err)
    );
  }
});

self.addEventListener('activate', (event) => {
  console.log('[SW] >>> EVENTO ACTIVATE DISPARADO <<<');
});

// Si algo bloquea estos scripts externos (ad-blocker, offline, etc.), el try/catch
// evita que la excepción tumbe el resto del service worker generado por Vite PWA
// (que se concatena después de este archivo vía workbox.importScripts) — de lo
// contrario ni las actualizaciones de la app ni el cache funcionarían.
try {
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

  // Mensajes recibidos cuando la app está cerrada o en background.
  // Usamos payload.data porque los mensajes se envían como data-only
  // para evitar que iOS muestre la notificación dos veces (APNs + SW).
  messaging.onBackgroundMessage((payload) => {
    const title = payload.data?.title || payload.notification?.title || 'Parts Pilot';
    const body  = payload.data?.body  || payload.notification?.body  || '';

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
} catch (err) {
  console.error('[SW] No se pudo inicializar Firebase Messaging:', err);
}

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
