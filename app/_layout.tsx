import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { useFonts } from 'expo-font';
import {
  Cinzel_400Regular,
  Cinzel_600SemiBold,
} from '@expo-google-fonts/cinzel';
import {
  EBGaramond_400Regular,
  EBGaramond_400Regular_Italic,
  EBGaramond_500Medium,
} from '@expo-google-fonts/eb-garamond';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import AuthProvider from '@/providers/AuthProvider';
import PurchasesProvider from '@/providers/PurchasesProvider';
import { useAuthStore } from '@/store/authStore';
import { useReaderStore } from '@/store/readerStore';
import { Colors } from '@/theme';
import '../global.css';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isInitialized } = useAuthStore();
  const loadLastRead = useReaderStore((s) => s.loadLastRead);

  useEffect(() => { loadLastRead(); }, []);

  const [fontsLoaded, fontError] = useFonts({
    Cinzel_400Regular,
    Cinzel_600SemiBold,
    EBGaramond_400Regular,
    EBGaramond_400Regular_Italic,
    EBGaramond_500Medium,
  });

  useEffect(() => {
    if (isInitialized && (fontsLoaded || fontError)) {
      SplashScreen.hideAsync();
    }
  }, [isInitialized, fontsLoaded, fontError]);

  if (!isInitialized || (!fontsLoaded && !fontError)) return null;

  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg1 } }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PurchasesProvider>
          <AuthProvider>
            <StatusBar style="light" backgroundColor={Colors.bg0} />
            <RootLayoutNav />
          </AuthProvider>
        </PurchasesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
