import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

const apiKey = import.meta.env.VITE_FIREBASE_API_KEY?.toString().trim();
const authDomain = import.meta.env.VITE_FIREBASE_AUTH_DOMAIN?.toString().trim();
const projectId = import.meta.env.VITE_FIREBASE_PROJECT_ID?.toString().trim();
const storageBucket = import.meta.env.VITE_FIREBASE_STORAGE_BUCKET?.toString().trim();
const messagingSenderId = import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID?.toString().trim();
const appId = import.meta.env.VITE_FIREBASE_APP_ID?.toString().trim();

if (!apiKey) {
  throw new Error('Missing VITE_FIREBASE_API_KEY environment variable. Check Vercel env settings.');
}

const firebaseConfig = {
  apiKey,
  authDomain,
  projectId,
  storageBucket,
  messagingSenderId,
  appId,
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export { firebaseConfig };
export default app;
