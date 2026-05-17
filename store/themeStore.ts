// store/themeStore.ts
// Persists the user's light/dark theme preference to AsyncStorage.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dharma_theme';

interface ThemeState {
  isDark: boolean;
  initialized: boolean;
  loadTheme: () => Promise<void>;
  toggle: () => Promise<void>;
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  isDark: true,
  initialized: false,

  loadTheme: async () => {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (stored !== null) {
        set({ isDark: stored === 'dark', initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  toggle: async () => {
    const next = !get().isDark;
    set({ isDark: next });
    try {
      await AsyncStorage.setItem(STORAGE_KEY, next ? 'dark' : 'light');
    } catch { /* ignore persistence errors */ }
  },
}));
