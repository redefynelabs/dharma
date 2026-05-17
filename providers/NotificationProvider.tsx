// providers/NotificationProvider.tsx
import React, { useEffect, useRef } from 'react';
import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/store/authStore';
import api from '@/lib/api';

// How to handle notifications when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

const EAS_PROJECT_ID = 'bfda0052-0fe1-4b89-8a23-5dc9e9285e45';

async function registerForPushNotifications(): Promise<string | null> {
  // Push notifications don't work in the Expo Go simulator
  if (!Device.isDevice) return null;

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') return null;

  // Create the Android notification channel used by daily verse pushes
  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('daily_verse', {
      name: 'Daily Verse',
      importance: Notifications.AndroidImportance.DEFAULT,
      sound: 'default',
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#C4A747',
    });
  }

  const tokenData = await Notifications.getExpoPushTokenAsync({
    projectId: EAS_PROJECT_ID,
  });

  return tokenData.data;
}

export default function NotificationProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuthStore();
  const router = useRouter();
  const notificationListener = useRef<Notifications.EventSubscription | null>(null);
  const responseListener = useRef<Notifications.EventSubscription | null>(null);
  const registeredToken = useRef<string | null>(null);

  useEffect(() => {
    if (!user) return;

    // Register and send token to backend (fire-and-forget)
    registerForPushNotifications()
      .then((token) => {
        if (!token) return;
        registeredToken.current = token;
        api.post('/users/me/push-token', { token }).catch(() => {});
      })
      .catch(() => {});

    // Received while app is open
    notificationListener.current = Notifications.addNotificationReceivedListener(() => {
      // No-op: the system banner handles display
    });

    // Tapped from notification tray → navigate to verse
    responseListener.current = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const data = response.notification.request.content.data as Record<string, string>;
        if (data?.type === 'daily_verse') {
          // Navigate to the reader home; deep-linking to a specific verse
          // requires matching the verse ID from local data, which can be added later.
          router.push('/(app)/(tabs)/reader' as any);
        }
      }
    );

    return () => {
      notificationListener.current?.remove();
      responseListener.current?.remove();
    };
  }, [user?.uid]);

  // Remove token on sign-out
  useEffect(() => {
    if (!user && registeredToken.current) {
      api.delete('/users/me/push-token', { data: { token: registeredToken.current } }).catch(() => {});
      registeredToken.current = null;
    }
  }, [user]);

  return <>{children}</>;
}
