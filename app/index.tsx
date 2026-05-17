
// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { user, isGuest } = useAuthStore();
  return <Redirect href={(user || isGuest) ? '/(app)/(tabs)' : '/(auth)/welcome'} />;
}