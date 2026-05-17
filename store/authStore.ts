// store/authStore.ts
import { create } from 'zustand';
import { UserProfile } from '@/types';
import { userApi } from '@/lib/api';

interface AuthState {
  user: UserProfile | null;
  isGuest: boolean;
  isLoading: boolean;
  isInitialized: boolean;

  setUser: (user: UserProfile | null) => void;
  setGuest: (isGuest: boolean) => void;
  setLoading: (loading: boolean) => void;
  setInitialized: (initialized: boolean) => void;
  incrementDailyAiQueries: () => void;
  incrementDailyCommentary: () => void;
  incrementTotalChats: () => void;
  decrementTotalChats: (count?: number) => void;
  /** Silently re-fetches user from backend and updates store */
  refreshUser: () => Promise<void>;
  reset: () => void;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  user: null,
  isGuest: false,
  isLoading: false,
  isInitialized: false,

  setUser: (user) => set({ user, ...(user ? { isGuest: false } : {}) }),
  setGuest: (isGuest) => set({ isGuest }),
  setLoading: (isLoading) => set({ isLoading }),
  setInitialized: (isInitialized) => set({ isInitialized }),

  incrementDailyAiQueries: () => {
    const user = get().user;
    if (!user) return;
    set({ user: { ...user, stats: { ...user.stats, dailyAiQueries: (user.stats.dailyAiQueries ?? 0) + 1 } } });
  },

  incrementDailyCommentary: () => {
    const user = get().user;
    if (!user) return;
    set({ user: { ...user, stats: { ...user.stats, dailyCommentary: (user.stats.dailyCommentary ?? 0) + 1 } } });
  },

  incrementTotalChats: () => {
    const user = get().user;
    if (!user) return;
    set({ user: { ...user, stats: { ...user.stats, totalChats: (user.stats.totalChats ?? 0) + 1 } } });
  },

  decrementTotalChats: (count = 1) => {
    const user = get().user;
    if (!user) return;
    set({ user: { ...user, stats: { ...user.stats, totalChats: Math.max(0, (user.stats.totalChats ?? 0) - count) } } });
  },

  refreshUser: async () => {
    try {
      const res = await userApi.getMe();
      if (res.data.data) set({ user: res.data.data });
    } catch { /* silently fail — stale data is acceptable */ }
  },

  reset: () => set({ user: null, isGuest: false, isLoading: false }),
}));