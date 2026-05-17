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
import NotificationProvider from '@/providers/NotificationProvider';
import { useAuthStore } from '@/store/authStore';
import { useReaderStore } from '@/store/readerStore';
import { useThemeStore } from '@/store/themeStore';
import { useBookmarkStore } from '@/store/bookmarkStore';
import { useThemeColors } from '@/theme';
import '../global.css';

SplashScreen.preventAutoHideAsync();

function RootLayoutNav() {
  const { isInitialized } = useAuthStore();
  const loadLastRead = useReaderStore((s) => s.loadLastRead);
  const loadTheme = useThemeStore((s) => s.loadTheme);
  const loadBookmarks = useBookmarkStore((s) => s.loadBookmarks);
  const colors = useThemeColors();

  useEffect(() => { loadLastRead(); loadTheme(); loadBookmarks(); }, []);

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
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: colors.bg1 } }}>
      <Stack.Screen name="(auth)" options={{ animation: 'fade' }} />
      <Stack.Screen name="(app)" />
    </Stack>
  );
}

function ThemedStatusBar() {
  const isDark = useThemeStore((s) => s.isDark);
  const colors = useThemeColors();
  return <StatusBar style={isDark ? 'light' : 'dark'} backgroundColor={colors.bg0} />;
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PurchasesProvider>
          <AuthProvider>
            <NotificationProvider>
              <ThemedStatusBar />
              <RootLayoutNav />
            </NotificationProvider>
          </AuthProvider>
        </PurchasesProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
