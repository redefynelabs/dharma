// lib/firebase.ts
import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence,
} from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Firebase Console → Project Settings → Your apps → Web app → Config
const firebaseConfig = {
  apiKey: "AIzaSyDFVmHjbsVfqYBorFk1YJtcmfFzlQ60xV4",
  authDomain: "dharma-ai-scriptures-prod.firebaseapp.com",
  projectId: "dharma-ai-scriptures-prod",
  storageBucket: "dharma-ai-scriptures-prod.firebasestorage.app",
  messagingSenderId: "866683342547",
  appId: "1:866683342547:web:9429bd6ed36e3660694e26",
  measurementId: "G-GMPE5WX1MM"
};

const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

let auth: ReturnType<typeof getAuth>;

try {
  auth = initializeAuth(app, {
    persistence: getReactNativePersistence(AsyncStorage),
  });
} catch {
  // Already initialized on hot reload
  auth = getAuth(app);
}

export { app, auth };