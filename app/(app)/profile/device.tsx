import { useEffect, useState, useCallback, useMemo } from 'react';
import {
  View, Text, ScrollView, StyleSheet, Platform,
  TouchableOpacity, Alert, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';
import { Topbar, BackButton } from '@/components/UI';
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing, Radius } from '@/theme';
import { deviceApi } from '@/lib/api';
import { getDeviceId } from '@/lib/deviceId';
import type { DeviceSession } from '@/types';

const FREE_LIMIT = 3;

function timeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const m = Math.floor(diff / 60_000);
  if (m < 1)  return 'Just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  return `${Math.floor(h / 24)}d ago`;
}

export default function DeviceScreen() {
  const router  = useRouter();
  const { user } = useAuthStore();
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const isPro       = user?.subscription.tier === 'pro';
  const dailyUsed   = user?.stats.dailyAiQueries ?? 0;
  const totalChats  = user?.stats.totalChats ?? 0;
  const usageRatio  = isPro ? 1 : Math.min(dailyUsed / FREE_LIMIT, 1);

  const [currentId, setCurrentId]   = useState<string | null>(null);
  const [sessions,  setSessions]     = useState<DeviceSession[]>([]);
  const [loading,   setLoading]      = useState(true);
  const [removing,  setRemoving]     = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [id, res] = await Promise.all([getDeviceId(), deviceApi.list()]);
      setCurrentId(id);
      setSessions(res.data.data?.devices ?? []);
    } catch { /* silently fail */ } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleRemove(session: DeviceSession) {
    Alert.alert(
      'Remove Device',
      `Sign out "${session.label}" from your account?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            setRemoving(session.deviceId);
            try {
              await deviceApi.remove(session.deviceId);
              setSessions((prev) => prev.filter((s) => s.deviceId !== session.deviceId));
            } catch {
              Alert.alert('Error', 'Could not remove device. Try again.');
            } finally {
              setRemoving(null);
            }
          },
        },
      ]
    );
  }

  const deviceRows = [
    { label: 'Platform',    value: Platform.OS === 'ios' ? 'iOS' : 'Android' },
    { label: 'OS Version',  value: String(Platform.Version) },
    { label: 'App Version', value: Constants.expoConfig?.version ?? '1.0.0' },
    { label: 'Build',       value: (Platform.OS === 'ios'
        ? Constants.expoConfig?.ios?.buildNumber
        : Constants.expoConfig?.android?.versionCode?.toString()) ?? '—' },
  ];

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <Topbar left={<BackButton onPress={() => router.back()} />} title="Device & Session" />

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>

        {/* ── Active Sessions ─────────────────────────── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionLabel}>ACTIVE SESSIONS</Text>
            {loading && <ActivityIndicator size="small" color={colors.goldDim} />}
          </View>

          <View style={styles.card}>
            {sessions.length === 0 && !loading ? (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>No sessions found</Text>
              </View>
            ) : (
              sessions.map((s, i) => {
                const isCurrent = s.deviceId === currentId;
                const isRemoving = removing === s.deviceId;
                return (
                  <View key={s.deviceId}>
                    <View style={styles.sessionRow}>
                      {/* Platform icon */}
                      <View style={[styles.deviceIcon, isCurrent && styles.deviceIconActive]}>
                        <Text style={[styles.deviceIconText, isCurrent && styles.deviceIconTextActive]}>
                          {s.platform === 'ios' ? '◈' : '⊡'}
                        </Text>
                      </View>

                      {/* Info */}
                      <View style={styles.sessionInfo}>
                        <View style={styles.sessionTitleRow}>
                          <Text style={styles.sessionLabel} numberOfLines={1}>{s.label}</Text>
                          {isCurrent && (
                            <View style={styles.currentBadge}>
                              <View style={styles.currentDot} />
                              <Text style={styles.currentBadgeText}>THIS DEVICE</Text>
                            </View>
                          )}
                        </View>
                        <Text style={styles.sessionMeta}>
                          v{s.appVersion}  ·  {isCurrent ? 'Active now' : timeAgo(s.lastActiveAt)}
                        </Text>
                      </View>

                      {/* Remove (other devices only) */}
                      {!isCurrent && (
                        <TouchableOpacity
                          onPress={() => handleRemove(s)}
                          style={styles.removeBtn}
                          disabled={isRemoving}
                          activeOpacity={0.6}
                        >
                          {isRemoving
                            ? <ActivityIndicator size="small" color={colors.danger} />
                            : <Text style={styles.removeText}>✕</Text>}
                        </TouchableOpacity>
                      )}
                    </View>
                    {i < sessions.length - 1 && <View style={styles.sep} />}
                  </View>
                );
              })
            )}
          </View>

          <Text style={styles.sessionHint}>
            Remove a device to sign it out. Your current session is unaffected.
          </Text>
        </View>

        {/* ── Usage ───────────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>USAGE</Text>
          <View style={styles.card}>

            <View style={styles.usageBlock}>
              <View style={styles.usageHeader}>
                <Text style={styles.usageTitle}>Daily Queries</Text>
                <Text style={styles.usageCount}>
                  {isPro ? '∞' : `${dailyUsed} / ${FREE_LIMIT}`}
                </Text>
              </View>
              <View style={styles.track}>
                <View style={[
                  styles.fill,
                  {
                    width: `${usageRatio * 100}%` as any,
                    backgroundColor: isPro
                      ? colors.gold
                      : dailyUsed >= FREE_LIMIT ? colors.danger : colors.gold,
                  },
                ]} />
              </View>
              <Text style={styles.usageHint}>
                {isPro
                  ? 'Unlimited queries with Premium'
                  : `${Math.max(0, FREE_LIMIT - dailyUsed)} remaining · resets at midnight`}
              </Text>
            </View>

            <View style={styles.sep} />

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Total Sessions</Text>
              <Text style={styles.rowValue}>{totalChats}</Text>
            </View>

          </View>
        </View>

        {/* ── This Device ─────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>THIS DEVICE</Text>
          <View style={styles.card}>
            {deviceRows.map((r, i) => (
              <View key={r.label}>
                <View style={styles.row}>
                  <Text style={styles.rowLabel}>{r.label}</Text>
                  <Text style={styles.rowValue}>{r.value}</Text>
                </View>
                {i < deviceRows.length - 1 && <View style={styles.sep} />}
              </View>
            ))}
          </View>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles(c: ThemeColors) {
  return useMemo(() => StyleSheet.create({
    safe:   { flex: 1, backgroundColor: c.bg0 },
    scroll: { padding: Spacing.xl, paddingBottom: 60, gap: 20 },

    // ── Section ───────────────────────────────────────
    section: { gap: 8 },
    sectionHeader: {
      flexDirection: 'row', alignItems: 'center',
      justifyContent: 'space-between', paddingLeft: 4, paddingRight: 2,
    },
    sectionLabel: {
      fontFamily: Fonts.cinzel, fontSize: 9, color: c.text2, letterSpacing: 2.5,
    },
    card: {
      backgroundColor: c.bg2, borderWidth: 0.5, borderColor: c.goldBorder,
      borderRadius: Radius.lg, overflow: 'hidden',
    },
    sep: {
      height: 0.5, backgroundColor: 'rgba(200,137,42,0.07)',
      marginHorizontal: Spacing.lg,
    },

    // ── Sessions ──────────────────────────────────────
    sessionRow: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
      paddingHorizontal: Spacing.lg, paddingVertical: 14,
    },
    deviceIcon: {
      width: 38, height: 38, borderRadius: 10,
      backgroundColor: c.bg3,
      borderWidth: 0.5, borderColor: c.goldBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    deviceIconActive: {
      borderColor: 'rgba(200,137,42,0.5)',
      backgroundColor: 'rgba(200,137,42,0.08)',
    },
    deviceIconText: {
      fontFamily: Fonts.cinzel, fontSize: 16, color: c.text2,
    },
    deviceIconTextActive: { color: c.gold },
    sessionInfo: { flex: 1 },
    sessionTitleRow: {
      flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 3,
    },
    sessionLabel: {
      fontFamily: Fonts.cinzel, fontSize: FontSize.sm,
      color: c.text0, flex: 1,
    },
    currentBadge: {
      flexDirection: 'row', alignItems: 'center', gap: 4,
      backgroundColor: 'rgba(39,174,96,0.1)',
      borderWidth: 0.5, borderColor: 'rgba(39,174,96,0.3)',
      borderRadius: Radius.full,
      paddingHorizontal: 7, paddingVertical: 2,
    },
    currentDot: {
      width: 5, height: 5, borderRadius: 3,
      backgroundColor: c.success,
      shadowColor: c.success,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 1, shadowRadius: 3,
    },
    currentBadgeText: {
      fontFamily: Fonts.cinzel, fontSize: 7,
      color: c.success, letterSpacing: 1,
    },
    sessionMeta: {
      fontFamily: Fonts.garamond, fontSize: FontSize.xs,
      color: c.text2, letterSpacing: 0.2,
    },
    removeBtn: {
      width: 32, height: 32, borderRadius: 8,
      backgroundColor: 'rgba(192,57,43,0.08)',
      borderWidth: 0.5, borderColor: 'rgba(192,57,43,0.2)',
      alignItems: 'center', justifyContent: 'center',
    },
    removeText: {
      fontFamily: Fonts.cinzel, fontSize: 10,
      color: c.danger,
    },
    emptyRow: {
      paddingHorizontal: Spacing.lg, paddingVertical: 20, alignItems: 'center',
    },
    emptyText: {
      fontFamily: Fonts.garamond, fontSize: FontSize.md, color: c.text2,
    },
    sessionHint: {
      fontFamily: Fonts.garamond, fontSize: FontSize.xs,
      color: c.text2, lineHeight: 18, paddingLeft: 4,
    },

    // ── Usage block ───────────────────────────────────
    usageBlock: {
      paddingHorizontal: Spacing.lg, paddingVertical: Spacing.lg,
    },
    usageHeader: {
      flexDirection: 'row', justifyContent: 'space-between',
      alignItems: 'center', marginBottom: 10,
    },
    usageTitle: {
      fontFamily: Fonts.garamond, fontSize: FontSize.md, color: c.text2,
    },
    usageCount: {
      fontFamily: Fonts.cinzel, fontSize: FontSize.sm, color: c.text0,
    },
    track: {
      height: 3, backgroundColor: c.bg4,
      borderRadius: 2, overflow: 'hidden', marginBottom: 8,
    },
    fill: {
      height: 3, borderRadius: 2,
      shadowColor: c.gold,
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.6, shadowRadius: 4,
    },
    usageHint: {
      fontFamily: Fonts.garamond, fontSize: FontSize.xs,
      color: c.text2, letterSpacing: 0.2,
    },

    // ── Info rows ─────────────────────────────────────
    row: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
      paddingHorizontal: Spacing.lg, paddingVertical: 15, gap: 20,
    },
    rowLabel: {
      fontFamily: Fonts.garamond, fontSize: FontSize.md, color: c.text2,
    },
    rowValue: {
      fontFamily: Fonts.garamondMedium, fontSize: FontSize.md, color: c.text0,
      textAlign: 'right',
    },
  }), [c]);
}
