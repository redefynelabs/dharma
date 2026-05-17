// lib/api.ts
import axios, { AxiosInstance, InternalAxiosRequestConfig } from 'axios';
import Config from '@/constants/config';
import { ApiResponse } from '@/types';

// ─── Error type with preserved HTTP status ────────────

export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status?: number,
    public readonly code?: string
  ) {
    super(message);
    this.name = 'ApiError';
  }

  get isNetworkError(): boolean {
    return this.status === undefined;
  }

  get isAuthError(): boolean {
    return this.status === 401 || this.status === 403;
  }

  get isQuotaError(): boolean {
    return this.status === 429;
  }
}

// ─── Axios Instance ───────────────────────────────────

const api: AxiosInstance = axios.create({
  baseURL: Config.API_BASE_URL,
  timeout: 30_000,
  headers: { 'Content-Type': 'application/json' },
});

// Attach fresh Firebase ID token + stable device ID to every request
api.interceptors.request.use(async (config: InternalAxiosRequestConfig) => {
  try {
    const { getIdToken } = await import('./auth');
    const token = await getIdToken();
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  } catch {
    // No user signed in — request will fail auth on the server
  }
  try {
    const { getDeviceId } = await import('./deviceId');
    const deviceId = await getDeviceId();
    config.headers['X-Device-Id'] = deviceId;
  } catch {
    // SecureStore unavailable — device quota check falls back to user-only
  }
  return config;
});

// Preserve status code and API error code in the thrown error
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status: number | undefined = error.response?.status;
    const code: string | undefined = error.response?.data?.error?.code;
    const message: string =
      error.response?.data?.error?.message ||
      error.message ||
      'Something went wrong';

    return Promise.reject(new ApiError(message, status, code));
  }
);

export default api;

// ─── Auth API ─────────────────────────────────────────

export const authApi = {
  sync: (device?: {
    deviceId: string;
    platform: 'ios' | 'android';
    osVersion: string;
    appVersion: string;
    label: string;
  }) => api.post<ApiResponse<import('@/types').UserProfile>>('/auth/sync', device ?? {}),
};

// ─── Device API ───────────────────────────────────────

export const deviceApi = {
  list: () =>
    api.get<ApiResponse<{ devices: import('@/types').DeviceSession[] }>>('/users/me/devices'),

  remove: (deviceId: string) =>
    api.delete<ApiResponse<{ removed: boolean }>>(`/users/me/devices/${deviceId}`),
};

// ─── User API ─────────────────────────────────────────

export const userApi = {
  getMe: () =>
    api.get<ApiResponse<import('@/types').UserProfile>>('/users/me'),

  updateMe: (data: {
    displayName?: string;
    preferences?: Partial<import('@/types').UserPreferences>;
  }) => api.patch<ApiResponse<{ updated: boolean }>>('/users/me', data),

  deleteMe: () =>
    api.delete<ApiResponse<{ deleted: boolean }>>('/users/me'),
};

// ─── Chat API ─────────────────────────────────────────

export const chatApi = {
  createSession: (data: {
    scripture?: import('@/types').Scripture;
    title?: string;
    id?: string; // client-generated UUID for optimistic creation
  }) =>
    api.post<ApiResponse<import('@/types').ChatSession>>('/chat/sessions', data),

  getSessions: (params?: { limit?: number; afterId?: string }) =>
    api.get<ApiResponse<{ sessions: import('@/types').ChatSession[]; hasMore: boolean }>>(
      '/chat/sessions',
      { params }
    ),

  getSession: (sessionId: string) =>
    api.get<ApiResponse<import('@/types').ChatSession>>(
      `/chat/sessions/${sessionId}`
    ),

  deleteSession: (sessionId: string) =>
    api.delete<ApiResponse<{ deleted: boolean }>>(
      `/chat/sessions/${sessionId}`
    ),

  clearAllSessions: () =>
    api.delete<ApiResponse<{ deleted: number }>>(
      '/chat/sessions'
    ),

  getMessages: (
    sessionId: string,
    params?: { limit?: number; beforeId?: string }
  ) =>
    api.get<ApiResponse<{ messages: import('@/types').ChatMessage[]; hasMore: boolean }>>(
      `/chat/sessions/${sessionId}/messages`,
      { params }
    ),

  ask: (
    sessionId: string,
    data: { question: string; scripture?: import('@/types').Scripture }
  ) =>
    api.post<
      ApiResponse<{
        message: import('@/types').ChatMessage;
        sources: import('@/types').ScriptureSource[];
        usage: { tokensUsed: number; processingMs: number };
      }>
    >(`/chat/sessions/${sessionId}/ask`, data),

  askStateless: (data: {
    question: string;
    scripture?: import('@/types').Scripture;
  }) =>
    api.post<
      ApiResponse<{
        answer: string;
        sources: import('@/types').ScriptureSource[];
        usage: { tokensUsed: number; processingMs: number };
      }>
    >('/chat/ask', data),
};

// ─── Verse API ────────────────────────────────────────

export const verseApi = {
  getCommentary: (scripture: string, reference: string) =>
    api.get<ApiResponse<{ commentary: string | null }>>(
      '/verses/commentary',
      { params: { scripture, reference } }
    ),

  commentary: (data: {
    scripture: import('@/types').Scripture;
    reference: string;
    sanskrit?: string;
    english: string;
  }) =>
    api.post<ApiResponse<{ commentary: string; cached: boolean }>>(
      '/verses/commentary',
      data
    ),
};

// ─── Notification API ─────────────────────────────────

export const notificationApi = {
  registerToken: (token: string) =>
    api.post<ApiResponse<{ registered: boolean }>>('/users/me/push-token', { token }),

  unregisterToken: (token: string) =>
    api.delete<ApiResponse<{ removed: boolean }>>('/users/me/push-token', { data: { token } }),
};

// ─── Subscription API ─────────────────────────────────

export const subscriptionApi = {
  getStatus: () =>
    api.get<ApiResponse<import('@/types').UserProfile['subscription']>>(
      '/subscriptions/status'
    ),

  sync: (revenueCatAppUserId?: string) =>
    api.post<ApiResponse<import('@/types').UserProfile['subscription']>>(
      '/subscriptions/sync',
      { revenueCatAppUserId }
    ),

  getPlans: () =>
    api.get<ApiResponse<{ plans: import('@/types').SubscriptionPlan[] }>>(
      '/subscriptions/plans'
    ),
};
