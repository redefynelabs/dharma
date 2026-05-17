import { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
} from "react-native";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useRouter, useLocalSearchParams } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { LinearGradient } from "expo-linear-gradient";
import * as Crypto from "expo-crypto";
import { chatApi } from "@/lib/api";
import { ChatSession } from "@/types";
import { useAuthStore } from "@/store/authStore";
import { useChatStore } from "@/store/chatStore";
import { trackSession } from "@/lib/sessionCreation";
import {
  Colors,
  Fonts,
  FontSize,
  Spacing,
  Radius,
  ThemeColors,
  useThemeColors,
} from "@/theme";

const SCRIPTURE_ACCENT: Record<string, string> = {
  gita: Colors.gitaAccent,
  ramayana: Colors.ramayanaAccent,
  mahabharata: Colors.mahabharataAccent,
};

export default function ChatTabScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ prefill?: string }>();
  const { user, isGuest, incrementTotalChats, decrementTotalChats } = useAuthStore();

  const colors = useThemeColors();
  const styles = useStyles(colors);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safe} edges={["top"]}>
        <View style={styles.guestWall}>
          <View style={styles.emptyRing}>
            <Text style={styles.emptySymbol}>◎</Text>
          </View>
          <Text style={styles.guestTitle}>Sign In to Access</Text>
          <Text style={styles.guestSubtitle}>
            AI-guided wisdom from the Gita, Ramayana, and Mahabharata is available to registered seekers.
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => router.push("/(auth)/sign-in")}
            activeOpacity={0.82}
          >
            <LinearGradient
              colors={["rgba(200,137,42,0.18)", "rgba(200,137,42,0.06)"]}
              style={styles.startBtnInner}
            >
              <Text style={styles.startBtnText}>SIGN IN</Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  const sessions = useChatStore((s) => s.sessions);
  const sessionsLoaded = useChatStore((s) => s.sessionsLoaded);
  const setSessions = useChatStore((s) => s.setSessions);
  const prependSession = useChatStore((s) => s.prependSession);
  const removeSession = useChatStore((s) => s.removeSession);
  const clearSessions = useChatStore((s) => s.clearSessions);
  const cacheSetMessages = useChatStore((s) => s.setMessages);
  const cacheSetTitle = useChatStore((s) => s.setTitle);

  const [loading, setLoading] = useState(!sessionsLoaded);
  const [refreshing, setRefreshing] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [clearing, setClearing] = useState(false);
  const [modal, setModal] = useState<{
    title: string;
    message: string;
    confirmText: string;
    onConfirm: () => void;
  } | null>(null);
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!sessionsLoaded) loadSessions();
  }, []);
  useEffect(() => {
    if (params.prefill) handleNewChat(params.prefill);
  }, [params.prefill]);

  async function loadSessions() {
    setLoading(true);
    try {
      const res = await chatApi.getSessions({ limit: 30 });
      setSessions(res.data.data?.sessions ?? []);
    } catch {
      /* silently fail */
    } finally {
      setLoading(false);
    }
  }

  async function refreshSessions() {
    setRefreshing(true);
    try {
      const res = await chatApi.getSessions({ limit: 30 });
      setSessions(res.data.data?.sessions ?? []);
    } catch {
      /* silently fail */
    } finally {
      setRefreshing(false);
    }
  }

  function handleNewChat(prefillQuestion?: string) {
    if (creatingRef.current) return;
    creatingRef.current = true;

    const canAsk =
      user?.subscription.tier === "pro" ||
      (user?.stats.dailyAiQueries ?? 0) < 10;
    if (!canAsk) {
      router.push("/(app)/paywall");
      creatingRef.current = false;
      return;
    }

    const newId = Crypto.randomUUID();
    const now = new Date().toISOString();
    const optimisticSession: ChatSession = {
      id: newId,
      uid: user!.uid,
      title: "New Conversation",
      messageCount: 0,
      lastMessage: "",
      createdAt: now,
      updatedAt: now,
    };
    prependSession(optimisticSession);
    incrementTotalChats();
    cacheSetMessages(newId, []);
    cacheSetTitle(newId, "New Conversation");

    router.push({
      pathname: "/(app)/chat/[sessionId]",
      params: { sessionId: newId, prefill: prefillQuestion ?? "" },
    });

    const promise = chatApi
      .createSession({ id: newId })
      .then(() => {})
      .catch(() => {
        removeSession(newId);
        decrementTotalChats();
      });
    trackSession(newId, promise);
    creatingRef.current = false;
  }

  function confirmDeleteSession(session: ChatSession) {
    setModal({
      title: "Delete Conversation",
      message: `Delete "${session.title || "this conversation"}"? This cannot be undone.`,
      confirmText: "Delete",
      onConfirm: () => {
        setModal(null);
        deleteSession(session.id);
      },
    });
  }

  async function deleteSession(sessionId: string) {
    setDeletingId(sessionId);
    try {
      await chatApi.deleteSession(sessionId);
      removeSession(sessionId);
      decrementTotalChats();
    } catch {
      /* silently fail — item stays in list */
    } finally {
      setDeletingId(null);
    }
  }

  function confirmClearAll() {
    setModal({
      title: "Clear All History",
      message: `Delete all ${sessions.length} conversation${sessions.length !== 1 ? "s" : ""}? This cannot be undone.`,
      confirmText: "Delete All",
      onConfirm: () => {
        setModal(null);
        clearAll();
      },
    });
  }

  async function clearAll() {
    const count = sessions.length;
    setClearing(true);
    try {
      await chatApi.clearAllSessions();
      clearSessions();
      decrementTotalChats(count);
    } catch {
      refreshSessions();
    } finally {
      setClearing(false);
    }
  }

  function formatDate(dateStr: string) {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 86_400_000);
    if (diff === 0) return "Today";
    if (diff === 1) return "Yesterday";
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ConfirmModal
        visible={!!modal}
        title={modal?.title ?? ""}
        message={modal?.message ?? ""}
        confirmText={modal?.confirmText ?? "Confirm"}
        destructive
        onConfirm={modal?.onConfirm ?? (() => {})}
        onCancel={() => setModal(null)}
      />

      {/* ── Header ─────────────────────────────────────────────────────────── */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Text style={styles.headerLabel}>DHARMA GUIDE</Text>
          <Text style={styles.headerTitle}>Conversations</Text>
        </View>
        <TouchableOpacity
          style={styles.newBtn}
          onPress={() => handleNewChat()}
          activeOpacity={0.82}
        >
          <LinearGradient
            colors={["rgba(200,137,42,0.22)", "rgba(200,137,42,0.10)"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.newBtnInner}
          >
            <Text style={styles.newBtnText}>+ New</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>

      {/* ── Thin separator with optional clear ────────────────────────────── */}
      {sessions.length > 0 && (
        <View style={styles.subHeader}>
          <Text style={styles.subCount}>
            {sessions.length} dialogue{sessions.length !== 1 ? "s" : ""}
          </Text>
          <TouchableOpacity
            onPress={confirmClearAll}
            disabled={!!deletingId || clearing}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            style={!!deletingId || clearing ? { opacity: 0.4 } : undefined}
          >
            {clearing ? (
              <ActivityIndicator size="small" color={Colors.danger} />
            ) : (
              <Text style={styles.clearBtnText}>Clear all</Text>
            )}
          </TouchableOpacity>
        </View>
      )}

      {/* ── Content ────────────────────────────────────────────────────────── */}
      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator color={colors.gold} size="small" />
        </View>
      ) : sessions.length === 0 ? (
        <ScrollView
          contentContainerStyle={styles.emptyState}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={refreshSessions}
              tintColor={colors.gold}
            />
          }
        >
          <View style={styles.emptyRing}>
            <Text style={styles.emptySymbol}>◎</Text>
          </View>
          <Text style={styles.emptyTitle}>Begin a Dialogue</Text>
          <Text style={styles.emptySubtitle}>
            Ask a question and receive guidance grounded in sacred scripture —
            the Gita, Ramayana, and Mahabharata.
          </Text>
          <TouchableOpacity
            style={styles.startBtn}
            onPress={() => handleNewChat()}
            activeOpacity={0.82}
          >
            <LinearGradient
              colors={["rgba(200,137,42,0.18)", "rgba(200,137,42,0.06)"]}
              style={styles.startBtnInner}
            >
              <Text style={styles.startBtnText}>NEW CONVERSATION</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      ) : (
        <FlatList
          data={sessions}
          keyExtractor={(item) => item.id}
          onRefresh={refreshSessions}
          refreshing={refreshing}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.list}
          renderItem={({ item }) => {
            const isDeleting = deletingId === item.id;
            const scriptureKey = item.scripture?.toLowerCase() ?? "";
            const accent = SCRIPTURE_ACCENT[scriptureKey] ?? colors.goldDim;

            return (
              <TouchableOpacity
                activeOpacity={0.76}
                style={[styles.item, isDeleting && { opacity: 0.4 }]}
                onPress={() =>
                  !isDeleting &&
                  router.push({
                    pathname: "/(app)/chat/[sessionId]",
                    params: { sessionId: item.id },
                  })
                }
                onLongPress={() => !isDeleting && confirmDeleteSession(item)}
                delayLongPress={400}
              >
                {/* Avatar */}
                <View style={styles.itemAvatar}>
                  <Text style={styles.itemAvatarText}>◎</Text>
                </View>

                {/* Content */}
                <View style={styles.itemBody}>
                  <View style={styles.itemTop}>
                    <Text style={styles.itemTitle} numberOfLines={1}>
                      {item.title || "New Conversation"}
                    </Text>
                    <Text style={styles.itemDate}>
                      {formatDate(item.updatedAt)}
                    </Text>
                  </View>
                  <Text style={styles.itemPreview} numberOfLines={1}>
                    {item.lastMessage || `${item.messageCount} messages`}
                  </Text>
                  {item.scripture && (
                    <View
                      style={[
                        styles.scripturePill,
                        { borderColor: accent + "50" },
                      ]}
                    >
                      <Text
                        style={[styles.scripturePillText, { color: accent }]}
                      >
                        {item.scripture}
                      </Text>
                    </View>
                  )}
                </View>

                {/* Delete / loading */}
                {isDeleting ? (
                  <ActivityIndicator size="small" color={colors.gold} />
                ) : (
                  <TouchableOpacity
                    style={styles.deleteBtn}
                    onPress={() => confirmDeleteSession(item)}
                    hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  >
                    <Text style={styles.deleteBtnText}>✕</Text>
                  </TouchableOpacity>
                )}
              </TouchableOpacity>
            );
          }}
        />
      )}
    </SafeAreaView>
  );
}
function useStyles(colors: ThemeColors) {
  return useMemo(
    () =>
      StyleSheet.create({
        safe: { flex: 1, backgroundColor: colors.bg0 },
        centered: { flex: 1, alignItems: "center", justifyContent: "center" },

        // ── Header ─────────────────────────────────────────────────────────────────
        header: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Spacing.xl,
          paddingTop: Spacing.lg,
          paddingBottom: Spacing.lg,
        },
        headerLeft: { flex: 1 },
        headerLabel: {
          fontFamily: Fonts.cinzel,
          fontSize: 8.5,
          color: colors.goldDim,
          letterSpacing: 3,
          marginBottom: 4,
        },
        headerTitle: {
          fontFamily: Fonts.cinzelBold,
          fontSize: FontSize.xl,
          color: colors.text0,
          letterSpacing: 0.5,
        },
        newBtn: {
          borderRadius: Radius.full,
          overflow: "hidden",
          borderWidth: 0.5,
          borderColor: colors.goldBorder,
        },
        newBtnInner: { paddingHorizontal: 16, paddingVertical: 9 },
        newBtnText: {
          fontFamily: Fonts.cinzel,
          fontSize: 10,
          color: colors.gold,
          letterSpacing: 1,
        },

        // ── Sub-header (count + clear) ─────────────────────────────────────────────
        subHeader: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingHorizontal: Spacing.xl,
          paddingVertical: 10,
          borderBottomWidth: 0.5,
          borderBottomColor: "rgba(200,137,42,0.07)",
        },
        subCount: {
          fontFamily: Fonts.cinzel,
          fontSize: 9,
          color: colors.text0,
          letterSpacing: 2,
        },
        clearBtnText: {
          fontFamily: Fonts.garamond,
          fontSize: 12,
          color: colors.danger,
          letterSpacing: 0.3,
        },

        // ── List ───────────────────────────────────────────────────────────────────
        list: { paddingTop: 4, paddingBottom: 110 },

        item: {
          flexDirection: "row",
          alignItems: "center",
          gap: 14,
          paddingHorizontal: Spacing.xl,
          paddingVertical: 16,
          borderBottomWidth: 0.5,
          borderBottomColor: "rgba(200,137,42,0.06)",
        },
        itemAvatar: {
          width: 40,
          height: 40,
          borderRadius: 20,
          backgroundColor: colors.bg0,
          borderWidth: 0.5,
          borderColor: colors.goldBorder,
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        },
        itemAvatarText: {
          fontFamily: Fonts.cinzel,
          fontSize: 16,
          color: colors.gold,
        },
        itemBody: { flex: 1, gap: 4 },
        itemTop: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 8,
        },
        itemTitle: {
          flex: 1,
          fontFamily: Fonts.cinzel,
          fontSize: 12.5,
          color: colors.text0,
          letterSpacing: 0.3,
        },
        itemDate: {
          fontFamily: Fonts.garamond,
          fontSize: 11,
          color: colors.text0,
          flexShrink: 0,
        },
        itemPreview: {
          fontFamily: Fonts.garamondItalic,
          fontSize: 13,
          color: colors.text0,
          lineHeight: 19,
        },
        scripturePill: {
          alignSelf: "flex-start",
          borderWidth: 0.5,
          borderRadius: Radius.full,
          paddingHorizontal: 8,
          paddingVertical: 2,
          marginTop: 2,
        },
        scripturePillText: {
          fontFamily: Fonts.cinzel,
          fontSize: 8.5,
          letterSpacing: 0.8,
        },

        deleteBtn: {
          width: 26,
          height: 26,
          borderRadius: 13,
          backgroundColor: colors.bg0,
          borderWidth: 0.5,
          borderColor: "rgba(200,137,42,0.12)",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
        },
        deleteBtnText: {
          fontFamily: Fonts.garamond,
          fontSize: 11,
          color: colors.text0,
        },

        // ── Guest wall ─────────────────────────────────────────────────────────────
        guestWall: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
          gap: 20,
        },
        guestTitle: {
          fontFamily: Fonts.cinzelBold,
          fontSize: FontSize.xl,
          color: colors.text0,
          letterSpacing: 0.5,
          textAlign: "center",
        },
        guestSubtitle: {
          fontFamily: Fonts.garamondItalic,
          fontSize: FontSize.md,
          color: colors.text0,
          textAlign: "center",
          lineHeight: 26,
        },

        // ── Empty state ────────────────────────────────────────────────────────────
        emptyState: {
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: 40,
          gap: 20,
        },
        emptyRing: {
          width: 80,
          height: 80,
          borderRadius: 40,
          backgroundColor: colors.bg0,
          borderWidth: 0.5,
          borderColor: colors.goldBorder,
          alignItems: "center",
          justifyContent: "center",
          shadowColor: colors.gold,
          shadowOffset: { width: 0, height: 0 },
          shadowOpacity: 0.2,
          shadowRadius: 16,
          elevation: 8,
          marginBottom: 8,
        },
        emptySymbol: {
          fontFamily: Fonts.cinzel,
          fontSize: 28,
          color: colors.gold,
        },
        emptyTitle: {
          fontFamily: Fonts.cinzelBold,
          fontSize: FontSize.xl,
          color: colors.text0,
          letterSpacing: 0.5,
          textAlign: "center",
        },
        emptySubtitle: {
          fontFamily: Fonts.garamondItalic,
          fontSize: FontSize.md,
          color: colors.text0,
          textAlign: "center",
          lineHeight: 26,
        },
        startBtn: {
          borderRadius: Radius.full,
          overflow: "hidden",
          borderWidth: 0.5,
          borderColor: colors.goldBorder,
          marginTop: 8,
        },
        startBtnInner: { paddingHorizontal: 28, paddingVertical: 13 },
        startBtnText: {
          fontFamily: Fonts.cinzel,
          fontSize: 10,
          letterSpacing: 2,
          color: colors.gold,
        },
      }),
    [colors],
  );
}
