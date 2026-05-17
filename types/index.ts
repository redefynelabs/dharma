// types/index.ts

export type AuthProvider = 'email' | 'google';
export type Scripture = 'gita' | 'ramayana' | 'mahabharata';
export type SubscriptionTier = 'free' | 'pro';
export type SubscriptionState =
  | 'active'
  | 'expired'
  | 'cancelled'
  | 'grace_period'
  | 'billing_retry'
  | 'paused'
  | 'none';

// ─── User ─────────────────────────────────────────────

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  photoURL?: string;
  authProvider: AuthProvider;
  subscription: {
    tier: SubscriptionTier;
    state: SubscriptionState;
    period?: 'monthly' | 'yearly';
    currentPeriodEnd?: string;
  };
  preferences: UserPreferences;
  stats: {
    totalChats: number;
    dailyAiQueries: number;
    dailyCommentary: number;
  };
  isNewUser?: boolean;
}

export interface UserPreferences {
  preferredScripture: Scripture | 'all';
  language: 'en' | 'hi' | 'sa';
  notificationsEnabled: boolean;
}

// ─── Device Session ───────────────────────────────────

export interface DeviceSession {
  deviceId:   string;
  platform:   'ios' | 'android';
  osVersion:  string;
  appVersion: string;
  label:      string;
  createdAt:  string;
  lastActiveAt: string;
}

// ─── Chat ─────────────────────────────────────────────

export interface ChatSession {
  id: string;
  uid: string;
  title: string;
  scripture?: Scripture;
  messageCount: number;
  lastMessage: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  id: string;
  sessionId: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: ScriptureSource[];
  metadata?: {
    tokensUsed?: number;
    processingMs?: number;
  };
  createdAt: string;
}

export interface ScriptureSource {
  scripture: Scripture;
  reference: string;
  text: string;
  translation?: string;
  relevanceScore: number;
}

// ─── API ──────────────────────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
  };
  meta?: {
    timestamp: string;
  };
}

// ─── Scripture Verses ────────────────────────────────

export interface GitaVerse {
  id: string;
  book: 'gita';
  chapter: number;
  verse: number;
  reference: string;
  sanskrit: string;
  transliteration: string;
  english: string;
  hindi: string;
  word_meaning: string;
  commentary?: string;
  search_text: string;
}

export interface RamayanaVerse {
  id: string;
  book: 'ramayana';
  kanda: string;
  kanda_number: number;
  sarga: number;
  verse: number;
  reference: string;
  sanskrit: string;
  transliteration: string;
  english: string;
  word_meaning: string;
  commentary: string;
}

export interface MahabharataVerse {
  id: string;
  book: 'mahabharata';
  parva: string;
  parva_number: number;
  chapter: number;
  verse: number;
  reference: string;
  sanskrit: string;
  transliteration: string;
  english: string;
  hindi: string;
  commentary: string;
  search_text?: string;
}

export type ScriptureVerse = GitaVerse | RamayanaVerse | MahabharataVerse;

// ─── Subscription ─────────────────────────────────────

export interface SubscriptionPlan {
  id: string;
  name: string;
  price: number;
  period?: 'monthly' | 'yearly';
  productId?: string;
  savings?: string;
  features: string[];
}