import { getMessaging, getToken, onMessage } from 'firebase/messaging';
import app from './firebase';

const VAPID_KEY = import.meta.env.VITE_FIREBASE_VAPID_KEY;

let _messaging = null;

function msg() {
  if (!_messaging) _messaging = getMessaging(app);
  return _messaging;
}

/**
 * Solicita permiso de notificaciones al usuario.
 * Retorna true si el permiso fue concedido.
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) return false;
  if (Notification.permission === 'granted') return true;
  if (Notification.permission === 'denied')  return false;
  const result = await Notification.requestPermission();
  return result === 'granted';
}

/**
 * Obtiene el token FCM usando el Service Worker activo (generado por Vite PWA,
 * que ya incluye los handlers de Firebase Messaging vía importScripts).
 * Retorna el token como string, o null si falla.
 */
export async function getFCMToken() {
  if (!('serviceWorker' in navigator) || !VAPID_KEY) return null;
  try {
    const registration = await navigator.serviceWorker.ready;
    const token = await getToken(msg(), {
      vapidKey: VAPID_KEY,
      serviceWorkerRegistration: registration,
    });
    return token || null;
  } catch (err) {
    console.error('[Notifications] getFCMToken error:', err);
    return null;
  }
}

/**
 * Escucha mensajes cuando la app está en foreground.
 * Retorna la función de limpieza (unsub).
 */
export function listenForeground(callback) {
  return onMessage(msg(), callback);
}
