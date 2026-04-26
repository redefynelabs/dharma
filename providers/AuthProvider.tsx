// providers/AuthProvider.tsx
import React, { useEffect } from 'react';
import { onAuthStateChanged } from 'firebase/auth';
import { signOut as firebaseSignOut } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { syncUserWithBackend } from '@/lib/auth';
import { ApiError } from '@/lib/api';
import type { UserProfile } from '@/types';

function buildMinimalProfile(firebaseUser: import('firebase/auth').User): UserProfile {
  const provider = firebaseUser.providerData[0]?.providerId === 'google.com' ? 'google' : 'email';
  return {
    uid:          firebaseUser.uid,
    email:        firebaseUser.email ?? '',
    displayName:  firebaseUser.displayName ?? firebaseUser.email?.split('@')[0] ?? 'Devotee',
    photoURL:     firebaseUser.photoURL ?? undefined,
    authProvider: provider,
    subscription: { tier: 'free', state: 'none' },
    preferences:  { preferredScripture: 'all', language: 'en', notificationsEnabled: true },
    stats:        { totalChats: 0, dailyAiQueries: 0 },
  };
}

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const { setUser, setLoading, setInitialized } = useAuthStore();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        // 1. Immediately unblock the UI — splash hides, navigation goes to app
        setUser(buildMinimalProfile(firebaseUser));
        setInitialized(true);

        // 2. Sync real profile in the background — subscription tier, stats, etc.
        syncUserWithBackend()
          .then((profile) => setUser(profile))
          .catch((error: any) => {
            const isAuthError = error instanceof ApiError && error.isAuthError;
            if (isAuthError) {
              // Token revoked — force sign out
              console.error('[AuthProvider] Auth error during sync — signing out:', error.message);
              firebaseSignOut(auth).catch(() => {});
              setUser(null);
            }
            // Network / server errors: keep the minimal profile, sync next launch
          })
          .finally(() => setLoading(false));
      } else {
        setUser(null);
        useChatStore.getState().reset();
        setLoading(false);
        setInitialized(true);
      }
    });

    return unsubscribe;
  }, []);

  return <>{children}</>;
}
