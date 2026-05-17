import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Haptics from "expo-haptics";
import { chatApi } from "@/lib/api";
import { getIdToken } from "@/lib/auth";
import { waitForSession } from "@/lib/sessionCreation";
import { ChatMessage } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { BackButton, Topbar, GoldButton } from "@/components/UI";
import { ArrowUp, Square } from "lucide-react-native";
import {
  Colors,
  Fonts,
  FontSize,
  Spacing,
  Radius,
  ThemeColors,
  useThemeColors,
} from "@/theme";
import Config from "@/constants/config";

const FREE_DAILY_LIMIT = 10;
const STREAM_TIMEOUT_MS = 60_000;

type ScriptureFilter = "all" | "gita" | "ramayana" | "mahabharata";

const SCRIPTURE_ACCENT: Record<string, string> = {
  gita: Colors.gitaAccent,
  ramayana: Colors.ramayanaAccent,
  mahabharata: Colors.mahabharataAccent,
};

const SCRIPTURE_PILLS: { key: ScriptureFilter; sym: string; label: string }[] = [
  { key: "all",         sym: "◎", label: "All"         },
  { key: "gita",        sym: "ॐ", label: "Gita"        },
  { key: "ramayana",    sym: "◈", label: "Ramayana"    },
  { key: "mahabharata", sym: "✦", label: "Mahabharata" },
];

// ─── Markdown renderer ────────────────────────────────────────────────────────

/** Parse inline markdown: **bold**, *italic*, plain text */
function renderInline(
  text: string,
  baseStyle: object,
  boldStyle: object,
  italicStyle: object,
): React.ReactNode[] {
  // Split on **bold** and *italic* tokens
  const parts = text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <Text key={i} style={boldStyle}>
          {part.slice(2, -2)}
        </Text>
      );
    }
    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <Text key={i} style={italicStyle}>
          {part.slice(1, -1)}
        </Text>
      );
    }
    return <Text key={i} style={baseStyle}>{part}</Text>;
  });
}

interface MarkdownProps {
  content: string;
  baseStyle: object;
  boldStyle: object;
  italicStyle: object;
  bulletDotStyle: object;
  headingStyle: object;
}

function MarkdownContent({
  content,
  baseStyle,
  boldStyle,
  italicStyle,
  bulletDotStyle,
  headingStyle,
}: MarkdownProps) {
  // Split into paragraphs on double newlines
  const paragraphs = content.split(/\n{2,}/);

  return (
    <View style={{ gap: 10 }}>
      {paragraphs.map((para, pi) => {
        const trimmed = para.trim();
        if (!trimmed) return null;

        // Heading: # or ## at start
        const headingMatch = trimmed.match(/^#{1,3}\s+(.+)/);
        if (headingMatch) {
          return (
            <Text key={pi} style={headingStyle}>
              {headingMatch[1]}
            </Text>
          );
        }

        // Bullet list: lines starting with - or *
        const lines = trimmed.split("\n");
        const isList = lines.every((l) => /^[-*•]\s/.test(l.trim()) || l.trim() === "");
        if (isList) {
          return (
            <View key={pi} style={{ gap: 6 }}>
              {lines
                .filter((l) => l.trim())
                .map((line, li) => {
                  const content = line.replace(/^[-*•]\s/, "").trim();
                  return (
                    <View key={li} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                      <Text style={[bulletDotStyle, { marginTop: 3 }]}>•</Text>
                      <Text style={[baseStyle as any, { flex: 1 }]}>
                        {renderInline(content, baseStyle, boldStyle, italicStyle)}
                      </Text>
                    </View>
                  );
                })}
            </View>
          );
        }

        // Mixed paragraph: may have single-newline bullet items
        const hasBullets = lines.some((l) => /^[-*•]\s/.test(l.trim()));
        if (hasBullets) {
          return (
            <View key={pi} style={{ gap: 6 }}>
              {lines.filter((l) => l.trim()).map((line, li) => {
                const isBullet = /^[-*•]\s/.test(line.trim());
                if (isBullet) {
                  const text = line.replace(/^[-*•]\s/, "").trim();
                  return (
                    <View key={li} style={{ flexDirection: "row", gap: 8, alignItems: "flex-start" }}>
                      <Text style={[bulletDotStyle, { marginTop: 3 }]}>•</Text>
                      <Text style={[baseStyle as any, { flex: 1 }]}>
                        {renderInline(text, baseStyle, boldStyle, italicStyle)}
                      </Text>
                    </View>
                  );
                }
                return (
                  <Text key={li} style={baseStyle}>
                    {renderInline(line.trim(), baseStyle, boldStyle, italicStyle)}
                  </Text>
                );
              })}
            </View>
          );
        }

        // Regular paragraph — join single newlines with space
        const paraText = lines.join(" ");
        return (
          <Text key={pi} style={baseStyle}>
            {renderInline(paraText, baseStyle, boldStyle, italicStyle)}
          </Text>
        );
      })}
    </View>
  );
}

// ─── Message Bubble ───────────────────────────────────────────────────────────

const LOADING_PHASES = [
  "Searching scriptures…",
  "Thinking…",
  "Crafting response…",
];

function MessageBubble({ msg }: { msg: ChatMessage }) {
  const isTyping = msg.id === "typing";
  const isError = msg.id.startsWith("error-") || msg.id.startsWith("timeout-");
  const [phaseIdx, setPhaseIdx] = useState(0);
  const colors = useThemeColors();
  const styles = useStyles(colors);

  useEffect(() => {
    if (!isTyping) return;
    setPhaseIdx(0);
    const id = setInterval(
      () => setPhaseIdx((i) => (i + 1) % LOADING_PHASES.length),
      2000,
    );
    return () => clearInterval(id);
  }, [isTyping]);

  if (msg.role === "user") {
    return (
      <View style={styles.userRow}>
        <View style={styles.bubbleUser}>
          <LinearGradient
            colors={["rgba(200,137,42,0.14)", "rgba(200,137,42,0.07)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <Text style={styles.bubbleUserText}>{msg.content}</Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.aiRow}>
      <View style={styles.aiAvatar}>
        <Text style={styles.aiAvatarText}>◎</Text>
      </View>

      <View style={[styles.bubbleAi, isError && styles.bubbleError]}>
        {isTyping ? (
          <View style={styles.typingRow}>
            <ActivityIndicator size="small" color={colors.gold} />
            <Text style={styles.typingText}>{LOADING_PHASES[phaseIdx]}</Text>
          </View>
        ) : isError ? (
          <Text style={[styles.bubbleAiText, styles.bubbleErrorText]}>
            {msg.content}
          </Text>
        ) : (
          <>
            <MarkdownContent
              content={msg.content}
              baseStyle={styles.bubbleAiText}
              boldStyle={styles.mdBold}
              italicStyle={styles.mdItalic}
              bulletDotStyle={styles.mdBulletDot}
              headingStyle={styles.mdHeading}
            />

            {msg.sources && msg.sources.length > 0 && (
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
          </>
        )}
      </View>
    </View>
  );
}

function pill_label(key: ScriptureFilter) {
  if (key === "gita") return "Bhagavad Gita";
  if (key === "ramayana") return "Ramayana";
  if (key === "mahabharata") return "Mahabharata";
  return "scriptures";
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function ChatSessionScreen() {
  const { sessionId, prefill } = useLocalSearchParams<{
    sessionId: string;
    prefill?: string;
  }>();
  const router = useRouter();

  const { user, incrementDailyAiQueries } = useAuthStore();

  const colors = useThemeColors();
  const styles = useStyles(colors);

  const cachedMessages = useChatStore((s) => s.messages[sessionId]);
  const cachedTitle = useChatStore((s) => s.titles[sessionId]);
  const cacheSetMessages = useChatStore((s) => s.setMessages);
  const cacheSetTitle = useChatStore((s) => s.setTitle);
  const cacheUpdateSession = useChatStore((s) => s.updateSession);

  const [messages, setMessages] = useState<ChatMessage[]>(cachedMessages ?? []);
  const [loading, setLoading] = useState(!cachedMessages);
  const [refreshing, setRefreshing] = useState(false);
  const [sending, setSending] = useState(false);
  const [sessionTitle, setSessionTitle] = useState(
    cachedTitle ?? "Dharma Guide",
  );
  const [inputText, setInputText] = useState(prefill ?? "");
  const [scriptureFilter, setScriptureFilter] = useState<ScriptureFilter>("all");
  const flatListRef = useRef<FlatList>(null);

  const messagesRef = useRef<ChatMessage[]>(cachedMessages ?? []);
  const streamBufferRef = useRef("");
  const flushIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const streamTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const xhrRef = useRef<XMLHttpRequest | null>(null);

  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  const isPremium = user?.subscription.tier === "pro";
  const dailyUsed = user?.stats.dailyAiQueries ?? 0;
  const remaining = FREE_DAILY_LIMIT - dailyUsed;
  const limitReached = !isPremium && dailyUsed >= FREE_DAILY_LIMIT;

  useEffect(() => {
    if (!cachedMessages) loadMessages();
  }, [sessionId]);
  useEffect(() => {
    if (prefill && messages.length === 0 && !loading) {
      handleSend(prefill);
      setInputText("");
    }
  }, [loading]);

  async function loadMessages(isRefresh = false) {
    if (isRefresh) setRefreshing(true);
    else setLoading(true);
    try {
      const [sessionRes, messagesRes] = await Promise.all([
        chatApi.getSession(sessionId),
        chatApi.getMessages(sessionId, { limit: 50 }),
      ]);
      const title = sessionRes.data.data?.title ?? "Dharma Guide";
      const msgs = messagesRes.data.data?.messages ?? [];
      setSessionTitle(title);
      setMessages(msgs);
      cacheSetMessages(sessionId, msgs);
      cacheSetTitle(sessionId, title);
    } catch (err: any) {
      Alert.alert(
        "Failed to load",
        err?.response?.data?.error?.message ??
          err.message ??
          "Could not load messages",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }

  function cleanupStream() {
    if (flushIntervalRef.current) {
      clearInterval(flushIntervalRef.current);
      flushIntervalRef.current = null;
    }
    if (streamTimeoutRef.current) {
      clearTimeout(streamTimeoutRef.current);
      streamTimeoutRef.current = null;
    }
    streamBufferRef.current = "";
  }

  function handleStop() {
    xhrRef.current?.abort();
    xhrRef.current = null;
    cleanupStream();
    setMessages((prev) =>
      prev.filter((m) => m.id !== "typing" && m.id !== "streaming"),
    );
    setSending(false);
  }

  async function handleSend(text?: string) {
    const question = (text ?? inputText).trim();
    if (!question || sending) return;

    if (limitReached) {
      router.push("/(app)/paywall");
      return;
    }
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);

    const isFirstMessage = messages.length === 0;

    const tempUserMsg: ChatMessage = {
      id: `temp-${Date.now()}`,
      sessionId,
      role: "user",
      content: question,
      createdAt: new Date().toISOString(),
    };
    setMessages((prev) => [...prev, tempUserMsg]);
    setInputText("");
    setSending(true);

    setMessages((prev) => [
      ...prev,
      {
        id: "typing",
        sessionId,
        role: "assistant",
        content: "...",
        createdAt: new Date().toISOString(),
      },
    ]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      await waitForSession(sessionId);
      const [token, deviceId] = await Promise.all([
        getIdToken(),
        import('@/lib/deviceId').then((m) => m.getDeviceId()).catch(() => null),
      ]);

      // ── XHR-based SSE (React Native doesn't support response.body.getReader) ──
      await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        let processed = 0; // bytes of responseText already parsed
        let streamStarted = false;
        let sseRemainder = ""; // incomplete SSE line carried across onprogress calls
        let settled = false; // guard against double resolve/reject

        const settle = (fn: () => void) => {
          if (settled) return;
          settled = true;
          fn();
        };

        xhrRef.current = xhr;
        xhr.open(
          "POST",
          `${Config.API_BASE_URL}/chat/sessions/${sessionId}/ask/stream`,
        );
        xhr.setRequestHeader("Content-Type", "application/json");
        if (token) xhr.setRequestHeader("Authorization", `Bearer ${token}`);
        if (deviceId) xhr.setRequestHeader("X-Device-Id", deviceId);

        // ── flush interval: push accumulated chunks to UI every 50 ms ──
        streamBufferRef.current = "";
        flushIntervalRef.current = setInterval(() => {
          const accumulated = streamBufferRef.current;
          if (accumulated) {
            setMessages((prev) =>
              prev.map((m) =>
                m.id === "streaming" ? { ...m, content: accumulated } : m,
              ),
            );
          }
        }, 50);

        // ── hard timeout ──
        streamTimeoutRef.current = setTimeout(() => {
          xhr.abort();
          cleanupStream();
          const timeoutMsg: ChatMessage = {
            id: `timeout-${Date.now()}`,
            sessionId,
            role: "assistant",
            content: "The response took too long. Please try again.",
            createdAt: new Date().toISOString(),
          };
          setMessages(
            messagesRef.current
              .filter((m) => m.id !== "typing" && m.id !== "streaming")
              .concat([timeoutMsg]),
          );
          settle(resolve);
        }, STREAM_TIMEOUT_MS);

        // ── incremental SSE parsing ──
        xhr.onprogress = () => {
          const newText = xhr.responseText.slice(processed);
          processed = xhr.responseText.length;

          sseRemainder += newText;
          const events = sseRemainder.split("\n\n");
          sseRemainder = events.pop() ?? "";

          for (const event of events) {
            if (!event.startsWith("data: ")) continue;
            let data: any;
            try {
              data = JSON.parse(event.slice(6));
            } catch {
              continue;
            }

            if (data.type === "chunk") {
              if (!streamStarted) {
                streamStarted = true;
                streamBufferRef.current = data.text;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === "typing"
                      ? {
                          id: "streaming",
                          sessionId,
                          role: "assistant" as const,
                          content: data.text,
                          createdAt: new Date().toISOString(),
                        }
                      : m,
                  ),
                );
              } else {
                streamBufferRef.current += data.text;
              }
            } else if (data.type === "done") {
              cleanupStream();
              const finalMsgs = messagesRef.current
                .filter(
                  (m) =>
                    m.id !== "streaming" &&
                    m.id !== "typing" &&
                    m.id !== tempUserMsg.id,
                )
                .concat([
                  { ...tempUserMsg, id: `user-${Date.now()}` },
                  data.message,
                ]);
              setMessages(finalMsgs);
              cacheSetMessages(sessionId, finalMsgs);
              const sessionPatch: Partial<import("@/types").ChatSession> = {
                lastMessage: data.message.content.slice(0, 100),
                updatedAt: new Date().toISOString(),
              };
              cacheUpdateSession(sessionId, sessionPatch);
              incrementDailyAiQueries();

              // Auto-refresh title ~12s after first message (backend generates it async)
              if (isFirstMessage) {
                setTimeout(async () => {
                  try {
                    const res = await chatApi.getSession(sessionId);
                    const title = res.data.data?.title;
                    if (title && title !== "New Conversation") {
                      setSessionTitle(title);
                      cacheSetTitle(sessionId, title);
                      cacheUpdateSession(sessionId, { title });
                    }
                  } catch {}
                }, 12000);
              }

              settle(resolve);
            } else if (data.type === "error") {
              cleanupStream();
              settle(() =>
                reject(new Error(data.message ?? "Streaming error")),
              );
            }
          }
        };

        xhr.onload = () => {
          if (xhr.status === 429 || xhr.status === 403) {
            cleanupStream();
            setMessages(
              messagesRef.current.filter(
                (m) => m.id !== "typing" && m.id !== tempUserMsg.id,
              ),
            );
            router.push("/(app)/paywall");
            settle(resolve);
            return;
          }
          if (xhr.status >= 400) {
            cleanupStream();
            let errMsg = "Request failed";
            try {
              const e = JSON.parse(xhr.responseText);
              errMsg = e?.error?.message ?? errMsg;
            } catch {}
            settle(() => reject(new Error(errMsg)));
          }
          // 2xx: done event already called resolve via onprogress
        };

        xhr.onerror = () => {
          cleanupStream();
          settle(() =>
            reject(new Error("Network error. Please check your connection.")),
          );
        };

        xhr.send(JSON.stringify({
          question,
          ...(scriptureFilter !== "all" && { scripture: scriptureFilter }),
        }));
      });
    } catch (err: any) {
      cleanupStream();
      const msg: string = err?.message ?? "";
      if (
        msg.toLowerCase().includes("daily limit") ||
        msg.toLowerCase().includes("quota")
      ) {
        setMessages(
          messagesRef.current.filter(
            (m) =>
              m.id !== "typing" &&
              m.id !== "streaming" &&
              m.id !== tempUserMsg.id,
          ),
        );
        router.push("/(app)/paywall");
      } else {
        const errorMsg: ChatMessage = {
          id: `error-${Date.now()}`,
          sessionId,
          role: "assistant",
          content: msg || "Something went wrong. Please try again.",
          createdAt: new Date().toISOString(),
        };
        setMessages(
          messagesRef.current
            .filter((m) => m.id !== "typing" && m.id !== "streaming")
            .concat([errorMsg]),
        );
      }
    } finally {
      xhrRef.current = null;
      setSending(false);
      setTimeout(
        () => flatListRef.current?.scrollToEnd({ animated: true }),
        100,
      );
    }
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <Topbar
        left={<BackButton onPress={() => router.back()} />}
        title={sessionTitle}
        subtitle="Dharma Guide"
      />

      {/* Usage bar */}
      {!isPremium && !limitReached && remaining < FREE_DAILY_LIMIT && (
        <View style={styles.usageBar}>
          <View style={styles.usagePill}>
            <View
              style={[
                styles.usageFill,
                { width: `${(remaining / FREE_DAILY_LIMIT) * 100}%` as any },
              ]}
            />
          </View>
          <Text style={styles.usageText}>
            {remaining} free {remaining === 1 ? "message" : "messages"}{" "}
            remaining
          </Text>
          <TouchableOpacity onPress={() => router.push("/(app)/paywall")}>
            <Text style={styles.upgradeLink}>Upgrade ›</Text>
          </TouchableOpacity>
        </View>
      )}

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
      >
        {loading ? (
          <View style={styles.centered}>
            <ActivityIndicator color={colors.gold} />
          </View>
        ) : messages.length === 0 ? (
          <FlatList
            style={{ flex: 1 }}
            data={[]}
            renderItem={null}
            refreshing={refreshing}
            onRefresh={() => loadMessages(true)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <View style={styles.emptyRing}>
                  <Text style={styles.emptyGlyph}>◎</Text>
                </View>
                <Text style={styles.emptyTitle}>
                  What would you{"\n"}like to know?
                </Text>
                <View style={styles.emptyDivider}>
                  <View style={styles.emptyDividerLine} />
                  <Text style={styles.emptyDividerDot}>✦ · ✦</Text>
                  <View style={styles.emptyDividerLine} />
                </View>
                <Text style={styles.emptySubtitle}>
                  Ask any question and receive guidance drawn from the sacred
                  scriptures
                </Text>
              </View>
            }
            contentContainerStyle={{ flex: 1 }}
          />
        ) : (
          <FlatList
            ref={flatListRef}
            style={{ flex: 1 }}
            data={messages}
            keyExtractor={(m) => m.id}
            renderItem={({ item }) => <MessageBubble msg={item} />}
            contentContainerStyle={styles.chatList}
            onContentSizeChange={() =>
              flatListRef.current?.scrollToEnd({ animated: false })
            }
            showsVerticalScrollIndicator={false}
            refreshing={refreshing}
            onRefresh={() => loadMessages(true)}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
          />
        )}

        {limitReached ? (
          <SafeAreaView edges={["bottom"]} style={{ backgroundColor: colors.bg2 }}>
            <View style={styles.paywallBlock}>
              <Text style={styles.paywallTitle}>Daily limit reached</Text>
              <Text style={styles.paywallSub}>
                Upgrade for unlimited wisdom from the scriptures
              </Text>
              <GoldButton
                label="UNLOCK UNLIMITED WISDOM  ✦"
                onPress={() => router.push("/(app)/paywall")}
                style={{ alignSelf: "stretch" }}
              />
            </View>
          </SafeAreaView>
        ) : (
          <SafeAreaView edges={["bottom"]} style={styles.inputSafeArea}>
            <View style={styles.inputWrap}>
              {/* ── Input card: scripture filter + text input ── */}
              <View style={styles.inputCard}>
                {/* Scripture filter row */}
                <View style={styles.scriptureRow}>
                  {SCRIPTURE_PILLS.map((pill) => {
                    const active = scriptureFilter === pill.key;
                    const color = pill.key === "all" ? colors.gold : SCRIPTURE_ACCENT[pill.key];
                    return (
                      <TouchableOpacity
                        key={pill.key}
                        style={[
                          styles.scripturePill,
                          active
                            ? { backgroundColor: color, borderColor: color }
                            : { borderColor: "rgba(200,137,42,0.18)" },
                        ]}
                        onPress={() => setScriptureFilter(pill.key)}
                        disabled={sending}
                        activeOpacity={0.75}
                      >
                        <Text style={[
                          styles.scripturePillLabel,
                          { color: active ? colors.bg0 : colors.text2 },
                        ]}>
                          {pill.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Divider */}
                <View style={styles.inputCardDivider} />

                {/* Text + send */}
                <View style={styles.inputRow}>
                  <TextInput
                    style={styles.input}
                    value={inputText}
                    onChangeText={setInputText}
                    onSubmitEditing={() => handleSend()}
                    placeholder={
                      scriptureFilter === "all"
                        ? "Ask the scriptures…"
                        : `Ask the ${pill_label(scriptureFilter)}…`
                    }
                    placeholderTextColor={colors.text2}
                    returnKeyType="send"
                    multiline
                    editable={!sending}
                  />
                  <TouchableOpacity
                    onPress={sending ? handleStop : () => handleSend()}
                    style={[
                      styles.sendBtn,
                      !sending && !inputText.trim() && styles.sendBtnDim,
                      sending && styles.sendBtnStop,
                    ]}
                    disabled={!sending && !inputText.trim()}
                    activeOpacity={0.82}
                  >
                    {sending ? (
                      <Square size={14} color={colors.bg0} fill={colors.bg0} strokeWidth={0} />
                    ) : (
                      <ArrowUp size={18} color={colors.bg0} strokeWidth={2.5} />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            <Text style={styles.disclaimer}>
              Dharma AI can make mistakes. Always verify with original scriptures.
            </Text>
          </SafeAreaView>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────
function useStyles(colors: ThemeColors) {
  return useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.bg0 },
        centered: { flex: 1, alignItems: "center", justifyContent: "center" },

        // ── Usage bar ──────────────────────────────────────────────────────────────
        usageBar: {
          flexDirection: "row",
          alignItems: "center",
          gap: 10,
          paddingHorizontal: Spacing.xl,
          paddingVertical: 8,
          borderBottomWidth: 0.5,
          borderBottomColor: "rgba(200,137,42,0.07)",
        },
        usagePill: {
          height: 3,
          width: 48,
          borderRadius: 2,
          backgroundColor: Colors.bg3,
          overflow: "hidden",
        },
        usageFill: {
          position: "absolute",
          left: 0, top: 0, bottom: 0,
          backgroundColor: colors.gold,
          borderRadius: 2,
        },
        usageText: {
          flex: 1,
          fontFamily: Fonts.garamond,
          fontSize: 12,
          color: colors.text2,
        },
        upgradeLink: {
          fontFamily: Fonts.cinzel,
          fontSize: 9.5,
          color: colors.gold,
          letterSpacing: 1,
        },

        // ── Empty state ────────────────────────────────────────────────────────────
        emptyState: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
          gap: 16,
        },
        emptyRing: {
          width: 88, height: 88, borderRadius: 44,
          backgroundColor: colors.bg2,
          borderWidth: 0.5, borderColor: colors.goldBorder,
          alignItems: "center", justifyContent: "center",
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.25, shadowRadius: 20, elevation: 8,
          marginBottom: 8,
        },
        emptyGlyph: { fontFamily: Fonts.cinzel, fontSize: 32, color: colors.gold },
        emptyTitle: {
          fontFamily: Fonts.cinzelBold,
          fontSize: FontSize.lg,
          color: colors.text0,
          letterSpacing: 0.8,
          textAlign: "center",
          lineHeight: 28,
        },
        emptyDivider: { flexDirection: "row", alignItems: "center", gap: 10, width: "80%" },
        emptyDividerLine: { flex: 1, height: 0.5, backgroundColor: "rgba(200,137,42,0.18)" },
        emptyDividerDot: {
          fontFamily: Fonts.cinzel, fontSize: 9,
          color: colors.goldDim, letterSpacing: 4,
        },
        emptySubtitle: {
          fontFamily: Fonts.garamondItalic,
          fontSize: 14, color: colors.text2,
          textAlign: "center", lineHeight: 24,
        },

        // ── Messages ───────────────────────────────────────────────────────────────
        chatList: {
          paddingHorizontal: Spacing.lg,
          paddingTop: Spacing.lg,
          paddingBottom: 12,
          gap: 20,
        },

        // User bubble
        userRow: { alignItems: "flex-end" },
        bubbleUser: {
          maxWidth: "80%",
          borderWidth: 0.5,
          borderColor: "rgba(200,137,42,0.30)",
          borderRadius: 22,
          borderBottomRightRadius: 5,
          paddingHorizontal: 16,
          paddingVertical: 12,
          overflow: "hidden",
          backgroundColor: "rgba(200,137,42,0.10)",
        },
        bubbleUserText: {
          fontFamily: Fonts.garamond,
          fontSize: 16,
          color: colors.text0,
          lineHeight: 26,
        },

        // AI bubble
        aiRow: { flexDirection: "row", alignItems: "flex-start", gap: 10 },
        aiAvatar: {
          width: 30, height: 30, borderRadius: 15,
          backgroundColor: colors.bg2,
          borderWidth: 0.5, borderColor: colors.goldBorder,
          alignItems: "center", justifyContent: "center",
          flexShrink: 0, marginTop: 3,
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.18, shadowRadius: 6, elevation: 3,
        },
        aiAvatarText: { fontFamily: Fonts.cinzel, fontSize: 13, color: colors.gold },

        bubbleAi: {
          flex: 1,
          backgroundColor: colors.bg2,
          borderWidth: 0.5,
          borderColor: "rgba(200,137,42,0.16)",
          borderRadius: 22,
          borderTopLeftRadius: 5,
          paddingHorizontal: 15,
          paddingVertical: 13,
        },
        bubbleAiText: {
          fontFamily: Fonts.garamond,
          fontSize: 16,
          color: colors.text0,
          lineHeight: 28,
        },
        // Markdown inline styles
        mdBold: {
          fontFamily: Fonts.garamondItalic, // Garamond doesn't have bold; italic+gold gives emphasis
          fontSize: 16,
          color: colors.text0,
          lineHeight: 28,
        },
        mdItalic: {
          fontFamily: Fonts.garamondItalic,
          fontSize: 16,
          color: colors.gold,
          lineHeight: 28,
        },
        mdBulletDot: {
          fontFamily: Fonts.cinzel,
          fontSize: 10,
          color: colors.gold,
        },
        mdHeading: {
          fontFamily: Fonts.cinzelBold ?? Fonts.cinzel,
          fontSize: 14,
          color: colors.gold,
          letterSpacing: 0.6,
          lineHeight: 22,
        },
        highlighted: { color: colors.gold, fontFamily: Fonts.garamondItalic },

        // Typing
        typingRow: { flexDirection: "row", alignItems: "center", gap: 10 },
        typingText: {
          fontFamily: Fonts.garamondItalic,
          fontSize: 14,
          color: colors.goldDim,
          letterSpacing: 0.3,
        },

        // Error
        bubbleError: { borderColor: "rgba(220,80,80,0.25)", backgroundColor: "rgba(220,80,80,0.04)" },
        bubbleErrorText: { color: Colors.danger },

        // Sources
        sourceCard: { marginTop: 14, gap: 10 },
        sourceHeader: { flexDirection: "row", alignItems: "center", gap: 8 },
        sourceHeaderLine: { flex: 1, height: 0.5, backgroundColor: "rgba(200,137,42,0.18)" },
        sourceHeaderLabel: {
          fontFamily: Fonts.cinzel, fontSize: 7.5,
          color: colors.goldDim, letterSpacing: 2.5,
        },
        sourceItem: {
          gap: 4,
          paddingLeft: 10,
          borderLeftWidth: 1.5,
          borderLeftColor: "rgba(200,137,42,0.25)",
        },
        sourceRef: {
          fontFamily: Fonts.cinzel, fontSize: 9.5,
          color: colors.gold, letterSpacing: 0.5,
        },
        sourceText: {
          fontFamily: Fonts.garamond, fontSize: 12.5,
          color: colors.text2, lineHeight: 19,
        },

        // ── Paywall block ──────────────────────────────────────────────────────────
        paywallBlock: {
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.lg,
          paddingBottom: Spacing.md,
          borderTopWidth: 0.5,
          borderTopColor: colors.goldBorder,
          gap: 10,
        },
        paywallTitle: {
          fontFamily: Fonts.cinzel,
          fontSize: FontSize.sm,
          color: colors.text0,
          letterSpacing: 0.5,
          textAlign: "center",
        },
        paywallSub: {
          fontFamily: Fonts.garamondItalic,
          fontSize: FontSize.sm,
          color: colors.text2,
          textAlign: "center",
        },

        // ── Input area ─────────────────────────────────────────────────────────────
        disclaimer: {
          fontFamily: Fonts.garamond,
          fontSize: 11,
          color: colors.text2,
          textAlign: "center",
          opacity: 0.55,
          paddingHorizontal: Spacing.xl,
          paddingTop: 4,
          paddingBottom: 0,
        },
        inputSafeArea: { backgroundColor: colors.bg0 },
        inputWrap: {
          paddingHorizontal: Spacing.lg,
          paddingTop: 10,
          paddingBottom: 4,
          borderTopWidth: 0.5,
          borderTopColor: "rgba(200,137,42,0.09)",
          backgroundColor: colors.bg0,
        },
        inputCard: {
          backgroundColor: colors.bg2,
          borderWidth: 0.5,
          borderColor: colors.goldBorder,
          borderRadius: 20,
          overflow: "hidden",
        },

        // Scripture filter row (inside card)
        scriptureRow: {
          flexDirection: "row",
          paddingHorizontal: 10,
          paddingVertical: 8,
          gap: 6,
        },
        scripturePill: {
          flex: 1,
          alignItems: "center",
          borderWidth: 0.5,
          borderRadius: Radius.full,
          paddingVertical: 5,
        },
        scripturePillLabel: {
          fontFamily: Fonts.cinzel,
          fontSize: 8.5,
          letterSpacing: 0.5,
        },

        inputCardDivider: {
          height: 0.5,
          backgroundColor: "rgba(200,137,42,0.09)",
          marginHorizontal: 0,
        },

        // Text + send row
        inputRow: {
          flexDirection: "row",
          alignItems: "flex-end",
          paddingLeft: 16,
          paddingRight: 6,
          paddingVertical: 6,
        },
        input: {
          flex: 1,
          fontFamily: Fonts.garamond,
          fontSize: 16,
          color: colors.text0,
          maxHeight: 180,
          paddingVertical: 6,
        },
        sendBtn: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.gold,
          alignItems: "center",
          justifyContent: "center",
          alignSelf: "flex-end",
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: 2 },
          shadowOpacity: 0.4,
          shadowRadius: 8,
          elevation: 4,
        },
        sendBtnDim: { backgroundColor: Colors.bg3, shadowOpacity: 0 },
        sendBtnStop: { backgroundColor: Colors.danger, shadowColor: Colors.danger },
      }),
    [colors],
  );
}
