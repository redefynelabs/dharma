// store/chatStore.ts
import { create } from 'zustand';
import { ChatSession, ChatMessage } from '@/types';

interface ChatState {
  sessions: ChatSession[];
  sessionsLoaded: boolean;
  messages: Record<string, ChatMessage[]>;
  titles: Record<string, string>;

  setSessions: (sessions: ChatSession[]) => void;
  prependSession: (session: ChatSession) => void;
  removeSession: (id: string) => void;
  clearSessions: () => void;
  updateSession: (id: string, updates: Partial<ChatSession>) => void;

  setMessages: (sessionId: string, msgs: ChatMessage[]) => void;
  setTitle: (sessionId: string, title: string) => void;

  reset: () => void;
}

export const useChatStore = create<ChatState>((set) => ({
  sessions: [],
  sessionsLoaded: false,
  messages: {},
  titles: {},

  setSessions: (sessions) => set({ sessions, sessionsLoaded: true }),
  prependSession: (session) =>
    set((s) => ({ sessions: [session, ...s.sessions] })),
  removeSession: (id) =>
    set((s) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _m, ...messages } = s.messages;
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [id]: _t, ...titles } = s.titles;
      return { sessions: s.sessions.filter((x) => x.id !== id), messages, titles };
    }),
  clearSessions: () =>
    set({ sessions: [], sessionsLoaded: false, messages: {}, titles: {} }),
  updateSession: (id, updates) =>
    set((s) => ({
      sessions: s.sessions.map((x) => (x.id === id ? { ...x, ...updates } : x)),
    })),

  setMessages: (sessionId, msgs) =>
    set((s) => ({ messages: { ...s.messages, [sessionId]: msgs } })),
  setTitle: (sessionId, title) =>
    set((s) => ({ titles: { ...s.titles, [sessionId]: title } })),

  reset: () =>
    set({ sessions: [], sessionsLoaded: false, messages: {}, titles: {} }),
}));
