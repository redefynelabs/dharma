// store/bookmarkStore.ts
// Local-only bookmark store — persisted to AsyncStorage.
// Cleared when app data is wiped. No backend involved.

import { create } from 'zustand';
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'dharma_bookmarks';

export interface BookmarkEntry {
  id:         string;   // verse ID — used as unique key
  book:       string;
  sectionKey: string;
  unitKey?:   string;
  verseIndex: number;
  ref:        string;   // e.g. "Bhagavad Gita · 2.47"
  preview:    string;   // first ~120 chars of English translation
  sym:        string;   // ॐ / ◈ / ✦
  accent:     string;   // scripture accent hex
  timestamp:  number;   // Date.now() when bookmarked
}

interface BookmarkState {
  bookmarks:   BookmarkEntry[];
  initialized: boolean;

  /** Call once on app start to hydrate from disk */
  loadBookmarks: () => Promise<void>;
  /** Toggle bookmark — adds if absent, removes if present */
  toggleBookmark: (entry: BookmarkEntry) => void;
  /** Check if a verse is bookmarked */
  isBookmarked: (id: string) => boolean;
  clearAll: () => void;
}

export const useBookmarkStore = create<BookmarkState>((set, get) => ({
  bookmarks:   [],
  initialized: false,

  loadBookmarks: async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const entries: BookmarkEntry[] = JSON.parse(raw);
        set({ bookmarks: entries, initialized: true });
      } else {
        set({ initialized: true });
      }
    } catch {
      set({ initialized: true });
    }
  },

  toggleBookmark: (entry) => {
    const { bookmarks } = get();
    const exists = bookmarks.some((b) => b.id === entry.id);
    const next = exists
      ? bookmarks.filter((b) => b.id !== entry.id)
      : [entry, ...bookmarks];
    set({ bookmarks: next });
    AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(next)).catch(() => {});
  },

  isBookmarked: (id) => get().bookmarks.some((b) => b.id === id),

  clearAll: () => {
    set({ bookmarks: [] });
    AsyncStorage.removeItem(STORAGE_KEY).catch(() => {});
  },
}));
