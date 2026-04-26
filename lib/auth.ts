// lib/auth.ts
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  signOut as firebaseSignOut,
  updateProfile,
  GoogleAuthProvider,
  signInWithCredential,
  User,
} from 'firebase/auth';
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import { auth } from './firebase';
import { authApi } from './api';
import { getDeviceId } from './deviceId';
import { UserProfile } from '@/types';

// ─── Sync with backend ────────────────────────────────

export async function syncUserWithBackend(): Promise<UserProfile> {
  const deviceId   = await getDeviceId();
  const platform   = Platform.OS as 'ios' | 'android';
  const osVersion  = String(Platform.Version);
  const appVersion = Constants.expoConfig?.version ?? '1.0.0';
  const label      = `${platform === 'ios' ? 'iPhone' : 'Android'} · ${platform === 'ios' ? 'iOS' : 'Android'} ${osVersion}`;

  const response = await authApi.sync({ deviceId, platform, osVersion, appVersion, label });
  if (!response.data.success || !response.data.data) {
    throw new Error('Failed to sync user with backend');
  }
  return response.data.data;
}

// ─── Email Auth ───────────────────────────────────────

export async function signUpWithEmail(
  email: string,
  password: string,
  displayName: string
): Promise<void> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  await updateProfile(credential.user, { displayName });
  // Backend sync is handled by AuthProvider via onAuthStateChanged
}

export async function signInWithEmail(
  email: string,
  password: string
): Promise<void> {
  await signInWithEmailAndPassword(auth, email, password);
  // Backend sync is handled by AuthProvider via onAuthStateChanged
}

export async function sendPasswordReset(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

// ─── Google Auth ──────────────────────────────────────

export async function signInWithGoogleToken(idToken: string): Promise<void> {
  const credential = GoogleAuthProvider.credential(idToken);
  await signInWithCredential(auth, credential);
  // Backend sync is handled by AuthProvider via onAuthStateChanged
}

// ─── Sign Out ─────────────────────────────────────────

export async function signOut(): Promise<void> {
  await firebaseSignOut(auth);
}

// ─── Helpers ──────────────────────────────────────────

export function getCurrentUser(): User | null {
  return auth.currentUser;
}

export async function getIdToken(): Promise<string | null> {
  const user = auth.currentUser;
  if (!user) return null;
  return user.getIdToken();
}
