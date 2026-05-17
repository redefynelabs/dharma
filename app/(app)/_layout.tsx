// app/(app)/_layout.tsx
import { useEffect } from 'react';
import { Stack, Redirect, useRouter } from 'expo-router';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '@/store/authStore';

export default function AppLayout() {
  const { user, isGuest } = useAuthStore();
  const router = useRouter();

  // First-launch permissions check (skip for guests)
  useEffect(() => {
    if (!user) return;
    AsyncStorage.getItem('dharma_permissions_done').then((val) => {
      if (!val) router.replace('/(app)/permissions');
    });
  }, [user?.uid]);

  // Not signed in and not a guest — redirect to auth
  if (!user && !isGuest) return <Redirect href="/(auth)/welcome" />;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen
        name="permissions"
        options={{ presentation: 'card', animation: 'fade', gestureEnabled: false }}
      />
      <Stack.Screen
        name="chat/[sessionId]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="scripture/[id]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="paywall"
        options={{
          presentation: 'modal',
          animation: 'slide_from_bottom',
        }}
      />
      <Stack.Screen
        name="profile/edit"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="profile/privacy"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="profile/about"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="profile/device"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="profile/bookmarks"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="reader/verse"
        options={{
          presentation: 'card',
          animation: 'none',
        }}
      />
      <Stack.Screen
        name="reader/[book]/[sectionKey]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
      <Stack.Screen
        name="reader/[book]/[sectionKey]/[unitKey]"
        options={{
          presentation: 'card',
          animation: 'slide_from_right',
        }}
      />
    </Stack>
  );
}