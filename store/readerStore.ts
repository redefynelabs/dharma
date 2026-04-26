// store/readerStore.ts
// Tracks the last verse a user read, persisted to AsyncStorage.
// No backend involved — purely local so it survives app restarts instantly.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dharma_last_read';

export interface LastReadEntry {
  book:       string;
  sectionKey: string;
  unitKey?:   string;
  verseId:    string;
  verseIndex: number;
  // Display fields — stored so home screen never needs to re-derive them
  ref:        string;   // e.g. "Bhagavad Gita · 2.47"
  preview:    string;   // first ~120 chars of English translation
  sym:        string;   // ॐ / ◈ / ✦
  accent:     string;   // scripture accent hex
  timestamp:  number;   // Date.now()
}

interface ReaderState {
  lastRead:     LastReadEntry | null;
  initialized:  boolean;

  /** Call once on app start to hydrate from disk */
  loadLastRead:  () => Promise<void>;
  /** Call from verse screen every time a new verse is opened */
  setLastRead:   (entry: LastReadEntry) => void;
  clearLastRead: () => void;
}

export const useReaderStore = create<ReaderState>((set) => ({
  lastRead:    null,
  initialized: false,

  loadLastRead: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const entry: LastReadEntry = JSON.parse(raw);
        set({ lastRead: entry, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  setLastRead: (entry) => {
    set({ lastRead: entry });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(entry)).catch(() => {});
  },

  clearLastRead: () => {
    set({ lastRead: null });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));
