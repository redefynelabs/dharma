
// app/index.tsx
import { Redirect } from 'expo-router';
import { useAuthStore } from '@/store/authStore';

export default function Index() {
  const { user } = useAuthStore();
  return <Redirect href={user ? '/(app)/(tabs)' : '/(auth)/welcome'} />;
}