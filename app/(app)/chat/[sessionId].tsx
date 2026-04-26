import { useEffect, useRef, useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, FlatList,
  StyleSheet, KeyboardAvoidingView, Platform,
  ActivityIndicator, Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import { chatApi } from '@/lib/api';
import { getIdToken } from '@/lib/auth';
import { waitForSession } from '@/lib/sessionCreation';
import { ChatMessage } from '@/types';
import { useAuthStore } from '@/store/authStore';
import { useChatStore } from '@/store/chatStore';
import { BackButton, Topbar, GoldButton } from '@/components/UI';
import { Colors, Fonts, FontSize, Spacing, Radius } from '@/theme';
import Config from '@/constants/config';

const FREE_DAILY_LIMIT  = 3;
const STREAM_TIMEOUT_MS = 60_000;

// ─── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isTyping = msg.id === 'typing';
  const isError  = msg.id.startsWith('error-') || msg.id.startsWith('timeout-');

  if (msg.role === 'user') {
    return (
      <View style={styles.userRow}>
        <View style={styles.bubbleUser}>
          <LinearGradient
            colors={['rgba(200,137,42,0.14)', 'rgba(200,137,42,0.07)']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.bubbleUserText}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      {/* Avatar */}
      <View style={styles.aiAvatar}>
        <Text style={styles.aiAvatarText}>◎</Text>
      </View>

      {/* Bubble */}
      <View style={[
        styles.bubbleAi,
        isTyping && styles.bubbleTyping,
        isError  && styles.bubbleError,
      ]}>
        {/* Left accent bar */}
        {!isTyping && !isError && (
          <View style={styles.aiBubbleBar} />
        )}

        {isTyping ? (
          <View style={styles.typingDots}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={[styles.typingDot, { opacity: 0.35 + i * 0.25 }]} />
            ))}
          </View>
        ) : (
          <View style={styles.bubbleAiContent}>
            <Text style={[styles.bubbleAiText, isError && styles.bubbleErrorText]}>
              {isError
                ? msg.content
                : msg.content.split(/(\*[^*]+\*)/).map((part, i) =>
                    part.startsWith('*')
                      ? <Text key={i} style={styles.highlighted}>{part.slice(1, -1)}</Text>
                      : part
                  )
              }
            </Text>

            {/* Source references */}
            {!isError && msg.sources && msg.sources.length > 0 && (
              <View style={styles.sourceCard}>
                <View style={styles.sourceHeader}>
                  <View style={styles.sourceHeaderLine} />
                  <Text style={styles.sourceHeaderLabel}>SOURCES</Text>
                  <View style={styles.sourceHeaderLine} />
                </View>
                {msg.sources.slice(0, 2).map((source, i) => (
                  <View key={i} style={styles.sourceItem}>
                    <Text style={styles.sourceRef}>{source.reference}</Text>
                    <Text style={styles.sourceText} numberOfLines={2}>{source.text}</Text>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}
      </View>
    </View>
  );
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatSessionScreen() {
  const { sessionId, prefill } = useLocalSearchParams<{ sessionId: string; prefill?: string }>();
  const router  = useRouter();
  const insets  = useSafeAreaInsets();
  const { user, incrementDailyAiQueries } = useAuthStore();

  const cachedMessages   = useChatStore((s) => s.messages[sessionId]);
  const cachedTitle      = useChatStore((s) => s.titles[sessionId]);
  const cacheSetMessages = useChatStore((s) => s.setMessages);
  const cacheSetTitle    = useChatStore((s) => s.setTitle);
  const cacheUpdateSession = useChatStore((s) => s.updateSession);

  const [messages,      setMessages]      = useState<ChatMessage[]>(cachedMessages ?? []);
  const [loading,       setLoading]       = useState(!cachedMessages);
  const [refreshing,    setRefreshing]    = useState(false);
  const [sending,       setSending]       = useState(false);
  const [sessionTitle,  setSessionTitle]  = useState(cachedTitle ?? 'Dharma Guide');
  const [inputText,     setInputText]     = useState(prefill ?? '');
  const flatListRef = useRef<FlatList>(null);

  const messagesRef       = useRef<ChatMessage[]>(cachedMessages ?? []);
  const streamBufferRef   = useRef('');
  const flushIntervalRef  = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamTimeoutRef  = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { messagesRef.current = messages; }, [messages]);

  const isPremium   = user?.subscription.tier === 'pro';
  const dailyUsed   = user?.stats.dailyAiQueries ?? 0;
  const remaining   = FREE_DAILY_LIMIT - dailyUsed;
  const limitReached = !isPremium && dailyUsed >= FREE_DAILY_LIMIT;

  useEffect(() => { if (!cachedMessages) loadMessages(); }, [sessionId]);
  useEffect(() => {
    if (prefill && messages.length === 0 && !loading) { handleSend(prefill); setInputText(''); }
  }, [loading]);

  async function loadMessages(isRefresh = false) {
    if (isRefresh) setRefreshing(true); else setLoading(true);
    try {
      const [sessionRes, messagesRes] = await Promise.all([
        chatApi.getSession(sessionId),
        chatApi.getMessages(sessionId, { limit: 50 }),
      ]);
      const title = sessionRes.data.data?.title ?? 'Dharma Guide';
      const msgs  = messagesRes.data.data?.messages ?? [];
      setSessionTitle(title);
      setMessages(msgs);
      cacheSetMessages(sessionId, msgs);
      cacheSetTitle(sessionId, title);
    } catch (err: any) {
      Alert.alert('Failed to load', err?.response?.data?.error?.message ?? err.message ?? 'Could not load messages');
    } finally {
      setLoading(false); setRefreshing(false);
    }
  }

  function cleanupStream() {
    if (flushIntervalRef.current)  { clearInterval(flushIntervalRef.current);  flushIntervalRef.current = null; }
    if (streamTimeoutRef.current)  { clearTimeout(streamTimeoutRef.current);   streamTimeoutRef.current = null; }
    streamBufferRef.current = '';
  }

  async function handleSend(text?: string) {
    const question = (text ?? inputText).trim();
    if (!question || sending) return;

    if (limitReached) { router.push('/(app)/paywall'); return; }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`, sessionId, role: 'user',
      content: question, createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText('');
    setSending(true);

    setMessages((prev) => [
      ...prev,
      { id: 'typing', sessionId, role: 'assistant', content: '...', createdAt: new Date().toISOString() },
    ]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await waitForSession(sessionId);
      const token = await getIdToken();

      // ── XHR-based SSE (React Native doesn't support response.body.getReader) ──
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let processed = 0;       // bytes of responseText already parsed
        let streamStarted = false;
        let sseRemainder = '';   // incomplete SSE line carried across onprogress calls
        let settled = false;     // guard against double resolve/reject

        const settle = (fn: () => void) => {
          if (settled) return;
          settled = true;
          fn();
        };

        xhr.open('POST', `${Config.API_BASE_URL}/chat/sessions/${sessionId}/ask/stream`);
        xhr.setRequestHeader('Content-Type', 'application/json');
        if (token) xhr.setRequestHeader('Authorization', `Bearer ${token}`);

        // ── flush interval: push accumulated chunks to UI every 50 ms ──
        streamBufferRef.current = '';
        flushIntervalRef.current = setInterval(() => {
          const accumulated = streamBufferRef.current;
          if (accumulated) {
            setMessages((prev) => prev.map((m) =>
              m.id === 'streaming' ? { ...m, content: accumulated } : m
            ));
          }
        }, 50);

        // ── hard timeout ──
        streamTimeoutRef.current = setTimeout(() => {
          xhr.abort();
          cleanupStream();
          const timeoutMsg: ChatMessage = {
            id: `timeout-${Date.now()}`, sessionId, role: 'assistant',
            content: 'The response took too long. Please try again.',
            createdAt: new Date().toISOString(),
          };
          setMessages(messagesRef.current
            .filter((m) => m.id !== 'typing' && m.id !== 'streaming')
            .concat([timeoutMsg]));
          settle(resolve);
        }, STREAM_TIMEOUT_MS);

        // ── incremental SSE parsing ──
        xhr.onprogress = () => {
          const newText = xhr.responseText.slice(processed);
          processed = xhr.responseText.length;

          sseRemainder += newText;
          const events = sseRemainder.split('\n\n');
          sseRemainder = events.pop() ?? '';

          for (const event of events) {
            if (!event.startsWith('data: ')) continue;
            let data: any;
            try { data = JSON.parse(event.slice(6)); } catch { continue; }

            if (data.type === 'chunk') {
              if (!streamStarted) {
                streamStarted = true;
                streamBufferRef.current = data.text;
                setMessages((prev) => prev.map((m) =>
                  m.id === 'typing'
                    ? { id: 'streaming', sessionId, role: 'assistant' as const, content: data.text, createdAt: new Date().toISOString() }
                    : m
                ));
              } else {
                streamBufferRef.current += data.text;
              }
            } else if (data.type === 'done') {
              cleanupStream();
              const finalMsgs = messagesRef.current
                .filter((m) => m.id !== 'streaming' && m.id !== 'typing' && m.id !== tempUserMsg.id)
                .concat([{ ...tempUserMsg, id: `user-${Date.now()}` }, data.message]);
              setMessages(finalMsgs);
              cacheSetMessages(sessionId, finalMsgs);
              const sessionPatch: Partial<import('@/types').ChatSession> = {
                lastMessage: data.message.content.slice(0, 100),
                updatedAt: new Date().toISOString(),
              };
              if (data.title) {
                sessionPatch.title = data.title;
                setSessionTitle(data.title);
                cacheSetTitle(sessionId, data.title);
              }
              cacheUpdateSession(sessionId, sessionPatch);
              incrementDailyAiQueries();
              settle(resolve);
            } else if (data.type === 'error') {
              cleanupStream();
              settle(() => reject(new Error(data.message ?? 'Streaming error')));
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status === 429 || xhr.status === 403) {
            cleanupStream();
            setMessages(messagesRef.current.filter((m) => m.id !== 'typing' && m.id !== tempUserMsg.id));
            router.push('/(app)/paywall');
            settle(resolve);
            return;
          }
          if (xhr.status >= 400) {
            cleanupStream();
            let errMsg = 'Request failed';
            try { const e = JSON.parse(xhr.responseText); errMsg = e?.error?.message ?? errMsg; } catch {}
            settle(() => reject(new Error(errMsg)));
          }
          // 2xx: done event already called resolve via onprogress
        };

        xhr.onerror = () => {
          cleanupStream();
          settle(() => reject(new Error('Network error. Please check your connection.')));
        };

        xhr.send(JSON.stringify({ question }));
      });

    } catch (err: any) {
      cleanupStream();
      const msg: string = err?.message ?? '';
      if (msg.toLowerCase().includes('daily limit') || msg.toLowerCase().includes('quota')) {
        setMessages(messagesRef.current.filter((m) => m.id !== 'typing' && m.id !== 'streaming' && m.id !== tempUserMsg.id));
        router.push('/(app)/paywall');
      } else {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`, sessionId, role: 'assistant',
          content: msg || 'Something went wrong. Please try again.',
          createdAt: new Date().toISOString(),
        };
        setMessages(messagesRef.current
          .filter((m) => m.id !== 'typing' && m.id !== 'streaming')
          .concat([errorMsg]));
      }
    } finally {
      setSending(false);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar
        left={<BackButton onPress={() => router.back()} />}
        title={sessionTitle}
        subtitle="Dharma Guide"
      />

      {/* Usage bar */}
      {!isPremium && !limitReached && remaining < FREE_DAILY_LIMIT && (
        <View style={styles.usageBar}>
          <View style={styles.usagePill}>
            <View style={[styles.usageFill, { width: `${(remaining / FREE_DAILY_LIMIT) * 100}%` as any }]} />
          </View>
          <Text style={styles.usageText}>{remaining} free {remaining === 1 ? 'message' : 'messages'} remaining</Text>
          <TouchableOpacity onPress={() => router.push('/(app)/paywall')}>
            <Text style={styles.upgradeLink}>Upgrade ›</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={Colors.gold} />
          </View>
        ) : messages.length === 0 ? (
          <FlatList
            data={[]}
            renderItem={null}
            refreshing={refreshing}
            onRefresh={() => loadMessages(true)}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyRing}>
                  <Text style={styles.emptyGlyph}>◎</Text>
                </View>
                <Text style={styles.emptyTitle}>What would you{'\n'}like to know?</Text>
                <View style={styles.emptyDivider}>
                  <View style={styles.emptyDividerLine} />
                  <Text style={styles.emptyDividerDot}>✦  ·  ✦</Text>
                  <View style={styles.emptyDividerLine} />
                </View>
                <Text style={styles.emptySubtitle}>
                  Ask any question and receive guidance drawn from the sacred scriptures
                </Text>
              </View>
            }
            contentContainerStyle={{ flex: 1 }}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            contentContainerStyle={styles.chatList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => loadMessages(true)}
          />
        )}

        {limitReached ? (
          <View style={[styles.paywallBlock, { paddingBottom: insets.bottom + 12 }]}>
            <Text style={styles.paywallTitle}>Daily limit reached</Text>
            <Text style={styles.paywallSub}>Upgrade for unlimited wisdom from the scriptures</Text>
            <GoldButton
              label="UNLOCK UNLIMITED WISDOM  ✦"
              onPress={() => router.push('/(app)/paywall')}
              style={{ alignSelf: 'stretch' }}
            />
          </View>
        ) : (
          <View style={[styles.inputWrap, { paddingBottom: Math.max(insets.bottom, 12) }]}>
            <View style={styles.inputPill}>
              <TextInput
                style={styles.input}
                value={inputText}
                onChangeText={setInputText}
                onSubmitEditing={() => handleSend()}
                placeholder="Ask for wisdom…"
                placeholderTextColor={Colors.text2}
                returnKeyType="send"
                multiline
                editable={!sending}
              />
              <TouchableOpacity
                onPress={() => handleSend()}
                style={[styles.sendBtn, !inputText.trim() && styles.sendBtnDim]}
                disabled={!inputText.trim() || sending}
                activeOpacity={0.82}
              >
                {sending
                  ? <ActivityIndicator color={Colors.bg0} size="small" />
                  : <Text style={styles.sendBtnText}>›</Text>
                }
              </TouchableOpacity>
            </View>
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe:    { flex: 1, backgroundColor: Colors.bg0 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // ── Usage bar ──────────────────────────────────────────────────────────────
  usageBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    paddingHorizontal: Spacing.xl, paddingVertical: 8,
    borderBottomWidth: 0.5, borderBottomColor: 'rgba(200,137,42,0.07)',
  },
  usagePill: {
    height: 3, width: 48, borderRadius: 2,
    backgroundColor: Colors.bg3, overflow: 'hidden',
  },
  usageFill: {
    position: 'absolute', left: 0, top: 0, bottom: 0,
    backgroundColor: Colors.gold, borderRadius: 2,
  },
  usageText:   { flex: 1, fontFamily: Fonts.garamond, fontSize: 12, color: Colors.text2 },
  upgradeLink: { fontFamily: Fonts.cinzel, fontSize: 9.5, color: Colors.gold, letterSpacing: 1 },

  // ── Empty state ────────────────────────────────────────────────────────────
  emptyState: {
    flex: 1, alignItems: 'center', justifyContent: 'center',
    paddingHorizontal: 40, gap: 16,
  },
  emptyRing: {
    width: 88, height: 88, borderRadius: 44,
    backgroundColor: Colors.bg2,
    borderWidth: 0.5, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
    marginBottom: 8,
  },
  emptyGlyph: { fontFamily: Fonts.cinzel, fontSize: 32, color: Colors.gold },
  emptyTitle: {
    fontFamily: Fonts.cinzelBold, fontSize: FontSize.lg,
    color: Colors.text0, letterSpacing: 0.8,
    textAlign: 'center', lineHeight: 28,
  },
  emptyDivider: {
    flexDirection: 'row', alignItems: 'center', gap: 10, width: '80%',
  },
  emptyDividerLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(200,137,42,0.18)' },
  emptyDividerDot: {
    fontFamily: Fonts.cinzel, fontSize: 9,
    color: Colors.goldDim, letterSpacing: 4,
  },
  emptySubtitle: {
    fontFamily: Fonts.garamondItalic, fontSize: 14,
    color: Colors.text2, textAlign: 'center', lineHeight: 24,
  },

  // ── Messages ───────────────────────────────────────────────────────────────
  chatList: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.lg, paddingBottom: 16, gap: 16 },

  // User bubble
  userRow: { alignItems: 'flex-end' },
  bubbleUser: {
    maxWidth: '78%',
    borderWidth: 0.5, borderColor: 'rgba(200,137,42,0.28)',
    borderRadius: 20, borderBottomRightRadius: 4,
    paddingHorizontal: 16, paddingVertical: 12,
    overflow: 'hidden',
  },
  bubbleUserText: {
    fontFamily: Fonts.garamond, fontSize: 15,
    color: Colors.text0, lineHeight: 25,
  },

  // AI bubble
  aiRow:   { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  aiAvatar: {
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: Colors.bg2,
    borderWidth: 0.5, borderColor: Colors.goldBorder,
    alignItems: 'center', justifyContent: 'center',
    flexShrink: 0, marginTop: 2,
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.15, shadowRadius: 6, elevation: 3,
  },
  aiAvatarText: { fontFamily: Fonts.cinzel, fontSize: 14, color: Colors.gold },

  bubbleAi: {
    flex: 1,
    backgroundColor: Colors.bg2,
    borderWidth: 0.5, borderColor: 'rgba(200,137,42,0.14)',
    borderRadius: 20, borderTopLeftRadius: 4,
    overflow: 'hidden',
    flexDirection: 'row',
  },
  aiBubbleBar: {
    width: 2.5, backgroundColor: 'rgba(200,137,42,0.35)',
    flexShrink: 0,
  },
  bubbleAiContent: {
    flex: 1, paddingHorizontal: 14, paddingVertical: 13,
  },
  bubbleAiText: {
    fontFamily: Fonts.garamond, fontSize: 15,
    color: Colors.text0, lineHeight: 27,
  },
  highlighted: {
    color: Colors.gold, fontFamily: Fonts.garamondItalic,
  },

  // Typing
  bubbleTyping: {
    paddingHorizontal: 18, paddingVertical: 16,
    alignItems: 'center', flexDirection: 'row',
  },
  typingDots: { flexDirection: 'row', gap: 5, alignItems: 'center', padding: 4 },
  typingDot:  { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.gold },

  // Error
  bubbleError: { borderColor: 'rgba(220,80,80,0.3)' },
  bubbleErrorText: { color: Colors.danger },

  // Sources
  sourceCard: {
    marginTop: 12, gap: 10,
  },
  sourceHeader: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
  },
  sourceHeaderLine: { flex: 1, height: 0.5, backgroundColor: 'rgba(200,137,42,0.2)' },
  sourceHeaderLabel: {
    fontFamily: Fonts.cinzel, fontSize: 8, color: Colors.goldDim, letterSpacing: 2,
  },
  sourceItem: { gap: 3 },
  sourceRef:  { fontFamily: Fonts.cinzel, fontSize: 9.5, color: Colors.gold, letterSpacing: 0.8 },
  sourceText: { fontFamily: Fonts.garamond, fontSize: 12.5, color: Colors.text2, lineHeight: 19 },

  // ── Paywall block ──────────────────────────────────────────────────────────
  paywallBlock: {
    paddingHorizontal: Spacing.xl, paddingTop: Spacing.lg,
    borderTopWidth: 0.5, borderTopColor: Colors.goldBorder,
    backgroundColor: Colors.bg2, gap: 10,
  },
  paywallTitle: {
    fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
    color: Colors.text0, letterSpacing: 0.5, textAlign: 'center',
  },
  paywallSub: {
    fontFamily: Fonts.garamondItalic, fontSize: FontSize.sm,
    color: Colors.text2, textAlign: 'center',
  },

  // ── Input ──────────────────────────────────────────────────────────────────
  inputWrap: {
    paddingHorizontal: Spacing.lg, paddingTop: 10,
    borderTopWidth: 0.5, borderTopColor: 'rgba(200,137,42,0.09)',
    backgroundColor: Colors.bg0,
  },
  inputPill: {
    flexDirection: 'row', alignItems: 'flex-end',
    backgroundColor: Colors.bg2,
    borderWidth: 0.5, borderColor: Colors.goldBorder,
    borderRadius: 28, paddingLeft: 18, paddingRight: 5, paddingVertical: 5,
  },
  input: {
    flex: 1, fontFamily: Fonts.garamond, fontSize: 15,
    color: Colors.text0, maxHeight: 120, paddingVertical: 8,
  },
  sendBtn: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: Colors.gold,
    alignItems: 'center', justifyContent: 'center',
    alignSelf: 'flex-end',
    shadowColor: Colors.gold,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4, shadowRadius: 8, elevation: 4,
  },
  sendBtnDim: { backgroundColor: Colors.bg3, shadowOpacity: 0 },
  sendBtnText: {
    color: Colors.bg0, fontSize: 22, lineHeight: 24, fontFamily: Fonts.garamond,
  },
});
