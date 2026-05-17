import { useState, useCallback, useRef, useMemo } from 'react';
import {
  ScrollView, View, Text, TouchableOpacity,
  StyleSheet, Alert, Switch, RefreshControl, Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import Constants from 'expo-constants';
import { useAuthStore } from '@/store/authStore';
import { useThemeStore } from '@/store/themeStore';
import { useBookmarkStore } from '@/store/bookmarkStore';
import { signOut } from '@/lib/auth';
import { userApi } from '@/lib/api';
import { Divider } from '@/components/UI';
import { useThemeColors, ThemeColors, Fonts, FontSize, Spacing, Radius } from '@/theme';

const STALE_MS = 30_000; // re-fetch if data is older than 30s

const APP_VERSION = Constants.expoConfig?.version ?? '1.0.0';
const FREE_DAILY_LIMIT = 10;

export default function ProfileScreen() {
  const router = useRouter();
  const { user, isGuest, setUser, refreshUser } = useAuthStore();
  const { isDark, toggle: toggleTheme } = useThemeStore();
  const colors = useThemeColors();
  const styles = useStyles(colors);

  const { bookmarks } = useBookmarkStore();
  const isProUser = user?.subscription.tier === 'pro';
  const [refreshing, setRefreshing] = useState(false);
  const lastFetchedAt = useRef<number>(0);

  const dailyUsed = user?.stats.dailyAiQueries ?? 0;

  // Silent refresh on tab focus — skips if data was fetched recently
  useFocusEffect(
    useCallback(() => {
      const now = Date.now();
      if (now - lastFetchedAt.current > STALE_MS) {
        lastFetchedAt.current = now;
        refreshUser();
      }
    }, [])
  );

  // ── Handlers ────────────────────────────────────────

  async function handleRefresh() {
    setRefreshing(true);
    try {
      const res = await userApi.getMe();
      if (res.data.data) { setUser(res.data.data); lastFetchedAt.current = Date.now(); }
    } catch { /* silently fail — stale data is acceptable */ } finally {
      setRefreshing(false);
    }
  }

  async function handleToggleNotifications(value: boolean) {
    if (!user) return;
    // Optimistic update
    setUser({ ...user, preferences: { ...user.preferences, notificationsEnabled: value } });
    try {
      await userApi.updateMe({ preferences: { notificationsEnabled: value } });
    } catch {
      // Revert on failure
      setUser({ ...user, preferences: { ...user.preferences, notificationsEnabled: !value } });
    }
  }

  async function handleSignOut() {
    Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out', style: 'destructive',
        onPress: async () => {
          try { await signOut(); setUser(null); }
          catch (err: any) { Alert.alert('Error', err.message); }
        },
      },
    ]);
  }

  async function handleDeleteAccount() {
    Alert.alert(
      'Delete Account',
      'This will permanently delete your account and all data. This cannot be undone.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try { await userApi.deleteMe(); setUser(null); }
            catch (err: any) { Alert.alert('Error', err.message); }
          },
        },
      ]
    );
  }

  function formatDate(dateStr?: string) {
    if (!dateStr) return null;
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  const renewalDate = formatDate(user?.subscription.currentPeriodEnd);

  if (isGuest) {
    return (
      <SafeAreaView style={styles.safeArea} edges={['top']}>
        <View style={styles.guestWall}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarInitial}>ॐ</Text>
          </View>
          <Text style={styles.guestTitle}>Create Your Account</Text>
          <Text style={styles.guestSubtitle}>
            Sign in to track your journey, save bookmarks, and access your full profile.
          </Text>
          <TouchableOpacity
            style={styles.guestSignInBtn}
            onPress={() => router.push('/(auth)/sign-in')}
            activeOpacity={0.8}
          >
            <LinearGradient
              colors={['rgba(200,137,42,0.18)', 'rgba(200,137,42,0.06)']}
              style={styles.guestSignInInner}
            >
              <Text style={styles.guestSignInText}>SIGN IN</Text>
            </LinearGradient>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => router.push('/(auth)/sign-up')} activeOpacity={0.7}>
            <Text style={styles.guestRegisterText}>New here? Create account</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scroll}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={colors.gold} />}
      >

        {/* ── Hero ──────────────────────────────────── */}
        <View style={styles.hero}>
          <View style={styles.avatarRing}>
            <Text style={styles.avatarInitial}>{user?.displayName?.charAt(0).toUpperCase() ?? 'ॐ'}</Text>
          </View>
          <Text style={styles.displayName}>{user?.displayName ?? 'Seeker'}</Text>
          {user?.email ? <Text style={styles.email}>{user.email}</Text> : null}

          <TouchableOpacity
            onPress={() => router.push('/(app)/profile/edit' as any)}
            style={styles.editBtn}
            activeOpacity={0.7}
          >
            <Text style={styles.editBtnText}>Edit Profile</Text>
          </TouchableOpacity>

          <View style={styles.badgeRow}>
            <View style={styles.providerBadge}>
              <Text style={styles.providerText}>
                {user?.authProvider === 'google' ? '⊕  Google' : '✉  Email'}
              </Text>
            </View>
            {isProUser ? (
              <View style={styles.proBadge}>
                <Text style={styles.proText}>✦  PREMIUM</Text>
              </View>
            ) : (
              <TouchableOpacity onPress={() => router.push('/(app)/paywall')} activeOpacity={0.8}>
                <LinearGradient
                  colors={[`rgba(200,137,42,0.14)`, `rgba(232,168,58,0.08)`]}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.upgradeBadge}
                >
                  <Text style={styles.upgradeText}>✦  UPGRADE</Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* ── Stats ─────────────────────────────────── */}
        <View style={styles.statsRow}>
          <View style={[styles.statCell, styles.statBorder]}>
            <Text style={styles.statValue}>{user?.stats.totalChats ?? 0}</Text>
            <Text style={styles.statLabel}>Sessions</Text>
          </View>
          <View style={styles.statCell}>
            <Text style={styles.statValue}>{isProUser ? '∞' : `${dailyUsed}/${FREE_DAILY_LIMIT}`}</Text>
            <Text style={styles.statLabel}>Today</Text>
          </View>
        </View>

        {/* ── Subscription (pro only) ────────────────── */}
        {isProUser && (
          <>
            <Divider />
            <View style={styles.section}>
              <Text style={styles.sectionLabel}>SUBSCRIPTION</Text>
              <LinearGradient
                colors={['rgba(200,137,42,0.13)', 'rgba(200,137,42,0.04)', 'transparent']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.proCard}
              >
                {/* Header */}
                <View style={styles.proCardHeader}>
                  <Text style={styles.proCardSymbol}>✦</Text>
                  <View style={styles.proCardTitleBlock}>
                    <Text style={styles.proCardTitle}>Premium</Text>
                    <Text style={styles.proCardPeriod}>
                      {user.subscription.period
                        ? user.subscription.period.charAt(0).toUpperCase() + user.subscription.period.slice(1)
                        : 'Plan'}
                    </Text>
                  </View>
                  <View style={styles.proStatusPill}>
                    <View style={styles.proStatusDot} />
                    <Text style={styles.proStatusText}>Active</Text>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.proCardSep} />

                {/* Details */}
                <View style={styles.proCardDetails}>
                  {renewalDate && (
                    <View style={styles.proDetailRow}>
                      <Text style={styles.proDetailKey}>Renews</Text>
                      <Text style={styles.proDetailVal}>{renewalDate}</Text>
                    </View>
                  )}
                  <View style={styles.proDetailRow}>
                    <Text style={styles.proDetailKey}>Daily queries</Text>
                    <Text style={[styles.proDetailVal, { color: colors.gold }]}>Unlimited</Text>
                  </View>
                </View>
              </LinearGradient>
            </View>
          </>
        )}

        <Divider />

        {/* ── Preferences ───────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>PREFERENCES</Text>

          {/* Notifications row */}
          <View style={styles.row}>
            <View style={styles.rowIcon}><Text style={styles.rowGlyph}>◎</Text></View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Notifications</Text>
              <Text style={styles.rowSub}>Daily verse &amp; reminders</Text>
            </View>
            <Switch
              value={user?.preferences.notificationsEnabled ?? true}
              onValueChange={handleToggleNotifications}
              trackColor={{ false: colors.bg4, true: colors.goldDim }}
              thumbColor={colors.gold}
            />
          </View>

          {/* Theme toggle row */}
          <View style={styles.row}>
            <View style={styles.rowIcon}>
              <Text style={styles.rowGlyph}>{isDark ? '◑' : '◐'}</Text>
            </View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>{isDark ? 'Dark Mode' : 'Light Mode'}</Text>
              <Text style={styles.rowSub}>{isDark ? 'Switch to light theme' : 'Switch to dark theme'}</Text>
            </View>
            <Switch
              value={isDark}
              onValueChange={toggleTheme}
              trackColor={{ false: colors.goldBorder, true: colors.goldDim }}
              thumbColor={colors.gold}
            />
          </View>
        </View>

        <Divider />

        {/* ── Account ───────────────────────────────── */}
        <View style={styles.section}>
          <Text style={styles.sectionLabel}>ACCOUNT</Text>

          <TouchableOpacity style={styles.row} onPress={() => router.push('/(app)/profile/bookmarks' as any)} activeOpacity={0.7}>
            <View style={styles.rowIcon}><Text style={styles.rowGlyph}>◫</Text></View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Bookmarks</Text>
              <Text style={styles.rowSub}>{bookmarks.length === 0 ? 'No saved verses' : `${bookmarks.length} verse${bookmarks.length === 1 ? '' : 's'} saved`}</Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => router.push('/(app)/profile/privacy' as any)} activeOpacity={0.7}>
            <View style={styles.rowIcon}><Text style={styles.rowGlyph}>☰</Text></View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Privacy</Text>
              <Text style={styles.rowSub}>Data &amp; permissions</Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => router.push('/(app)/profile/about' as any)} activeOpacity={0.7}>
            <View style={styles.rowIcon}><Text style={styles.rowGlyph}>✦</Text></View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>About Dharma</Text>
              <Text style={styles.rowSub}>v{APP_VERSION}  ·  97,555 verses</Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.row} onPress={() => router.push('/(app)/profile/device' as any)} activeOpacity={0.7}>
            <View style={styles.rowIcon}><Text style={styles.rowGlyph}>⊡</Text></View>
            <View style={styles.rowBody}>
              <Text style={styles.rowLabel}>Device &amp; Session</Text>
              <Text style={styles.rowSub}>{Platform.OS === 'ios' ? 'iOS' : 'Android'}  ·  {user?.authProvider === 'google' ? 'Google' : 'Email'}</Text>
            </View>
            <Text style={styles.rowArrow}>›</Text>
          </TouchableOpacity>
        </View>

        <Divider />

        {/* ── Danger Zone ───────────────────────────── */}
        <View style={styles.dangerZone}>
          <TouchableOpacity style={styles.signOutBtn} onPress={handleSignOut} activeOpacity={0.8}>
            <Text style={styles.signOutText}>Sign Out</Text>
          </TouchableOpacity>
          {/* <TouchableOpacity onPress={handleDeleteAccount} style={styles.deleteLink} activeOpacity={0.7}>
            <Text style={styles.deleteLinkText}>Delete Account</Text>
          </TouchableOpacity> */}
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

function useStyles(colors: ThemeColors) {
  return useMemo(() => StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.bg0 },
    scroll: { paddingBottom: 100 },

    // Hero
    hero: {
      alignItems: 'center',
      paddingTop: Spacing.xxl, paddingBottom: Spacing.xl,
      borderBottomWidth: 0.5, borderBottomColor: `${colors.gold}1A`,
    },
    avatarRing: {
      width: 72, height: 72, borderRadius: 36,
      backgroundColor: colors.bg3, borderWidth: 1.5, borderColor: colors.gold,
      alignItems: 'center', justifyContent: 'center', marginBottom: 14,
      shadowColor: colors.gold, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.2, shadowRadius: 14, elevation: 4,
    },
    avatarInitial: { fontFamily: Fonts.cinzel, fontSize: 26, color: colors.gold },
    displayName: { fontFamily: Fonts.cinzel, fontSize: 18, color: colors.text0, letterSpacing: 1, marginBottom: 5 },
    email: { fontFamily: Fonts.garamond, fontSize: 13, color: colors.text2, marginBottom: 14 },
    editBtn: {
      paddingHorizontal: 16, paddingVertical: 6, borderRadius: Radius.full,
      borderWidth: 0.5, borderColor: colors.goldBorder,
      backgroundColor: colors.bg3, marginBottom: 12,
    },
    editBtnText: { fontFamily: Fonts.cinzel, fontSize: 10, color: colors.text1, letterSpacing: 1 },
    badgeRow: { flexDirection: 'row', gap: 8 },
    providerBadge: {
      paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full,
      backgroundColor: colors.bg3, borderWidth: 0.5, borderColor: colors.goldBorder,
    },
    providerText: { fontFamily: Fonts.cinzel, fontSize: 10, color: colors.text2, letterSpacing: 1 },
    proBadge: {
      paddingHorizontal: 12, paddingVertical: 5, borderRadius: Radius.full,
      backgroundColor: 'rgba(200,137,42,0.1)', borderWidth: 0.5, borderColor: colors.gold,
    },
    proText: { fontFamily: Fonts.cinzel, fontSize: 10, color: colors.gold, letterSpacing: 1.5 },
    upgradeBadge: {
      paddingHorizontal: 14, paddingVertical: 6, borderRadius: Radius.full,
      borderWidth: 0.5, borderColor: 'rgba(200,137,42,0.35)',
    },
    upgradeText: { fontFamily: Fonts.cinzel, fontSize: 10, color: colors.gold, letterSpacing: 1.5 },

    // Stats
    statsRow: {
      flexDirection: 'row',
      borderBottomWidth: 0.5, borderBottomColor: `${colors.gold}1A`,
    },
    statCell: { flex: 1, paddingVertical: 16, alignItems: 'center' },
    statBorder: { borderRightWidth: 0.5, borderRightColor: `${colors.gold}1A` },
    statValue: { fontFamily: Fonts.cinzel, fontSize: 20, color: colors.gold, marginBottom: 3 },
    statLabel: { fontFamily: Fonts.garamond, fontSize: 10, color: colors.text2, letterSpacing: 1.5, textTransform: 'uppercase' },

    // Section
    section: { paddingBottom: 4 },
    sectionLabel: {
      fontFamily: Fonts.cinzel, fontSize: 9, color: colors.text2,
      letterSpacing: 2.5, paddingHorizontal: Spacing.xl, paddingTop: 14, paddingBottom: 6,
    },

    // Premium subscription card
    proCard: {
      marginHorizontal: Spacing.xl, marginBottom: 8,
      borderWidth: 0.5, borderColor: 'rgba(200,137,42,0.35)',
      borderRadius: Radius.lg, overflow: 'hidden',
      padding: Spacing.lg,
    },
    proCardHeader: {
      flexDirection: 'row', alignItems: 'center', gap: 12,
    },
    proCardSymbol: {
      fontFamily: Fonts.cinzelBold, fontSize: 22, color: colors.gold,
    },
    proCardTitleBlock: { flex: 1 },
    proCardTitle: {
      fontFamily: Fonts.cinzelBold, fontSize: FontSize.base,
      color: colors.gold, letterSpacing: 1,
    },
    proCardPeriod: {
      fontFamily: Fonts.garamond, fontSize: FontSize.xs,
      color: colors.text2, marginTop: 1,
    },
    proStatusPill: {
      flexDirection: 'row', alignItems: 'center', gap: 5,
      backgroundColor: 'rgba(39,174,96,0.1)',
      borderWidth: 0.5, borderColor: 'rgba(39,174,96,0.3)',
      borderRadius: Radius.full, paddingHorizontal: 9, paddingVertical: 4,
    },
    proStatusDot: {
      width: 6, height: 6, borderRadius: 3,
      backgroundColor: colors.success,
      shadowColor: colors.success, shadowOffset: { width: 0, height: 0 },
      shadowOpacity: 0.8, shadowRadius: 3,
    },
    proStatusText: {
      fontFamily: Fonts.cinzel, fontSize: 9,
      color: colors.success, letterSpacing: 1,
    },
    proCardSep: {
      height: 0.5, backgroundColor: 'rgba(200,137,42,0.15)',
      marginVertical: Spacing.md,
    },
    proCardDetails: { gap: 8 },
    proDetailRow: {
      flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    },
    proDetailKey: {
      fontFamily: Fonts.garamond, fontSize: FontSize.sm, color: colors.text2,
    },
    proDetailVal: {
      fontFamily: Fonts.garamondMedium, fontSize: FontSize.sm, color: colors.text0,
    },

    // Setting rows
    row: {
      flexDirection: 'row', alignItems: 'center', gap: 14,
      paddingHorizontal: Spacing.xl, paddingVertical: 13,
      borderBottomWidth: 0.5, borderBottomColor: colors.goldBorder,
    },
    rowIcon: {
      width: 34, height: 34, borderRadius: 17, backgroundColor: colors.bg2,
      borderWidth: 0.5, borderColor: colors.goldBorder,
      alignItems: 'center', justifyContent: 'center',
    },
    rowGlyph: { fontFamily: Fonts.cinzel, fontSize: 13, color: colors.text1 },
    rowBody: { flex: 1 },
    rowLabel: { fontFamily: Fonts.garamond, fontSize: 15, color: colors.text0, marginBottom: 1 },
    rowSub: { fontFamily: Fonts.garamond, fontSize: 12, color: colors.text2 },
    rowArrow: { fontFamily: Fonts.garamond, fontSize: 20, color: colors.text2, lineHeight: 22 },

    // Danger zone
    dangerZone: { paddingHorizontal: Spacing.xl, paddingTop: Spacing.xl, paddingBottom: Spacing.lg, gap: 10 },
    signOutBtn: {
      paddingVertical: 13, borderRadius: Radius.sm,
      borderWidth: 0.5, borderColor: colors.goldBorder, alignItems: 'center',
    },
    signOutText: { fontFamily: Fonts.cinzel, fontSize: 11, letterSpacing: 2, color: colors.text1 },
    deleteLink: { alignItems: 'center', paddingVertical: 8 },
    deleteLinkText: { fontFamily: Fonts.garamond, fontSize: 13, color: colors.danger, letterSpacing: 0.3 },

    // Guest wall
    guestWall: {
      flex: 1, alignItems: 'center', justifyContent: 'center',
      paddingHorizontal: 40, gap: 16,
    },
    guestTitle: {
      fontFamily: Fonts.cinzelBold, fontSize: FontSize.xl,
      color: colors.text0, letterSpacing: 0.5, textAlign: 'center',
    },
    guestSubtitle: {
      fontFamily: Fonts.garamondItalic, fontSize: FontSize.md,
      color: colors.text2, textAlign: 'center', lineHeight: 26,
    },
    guestSignInBtn: {
      borderRadius: Radius.full, overflow: 'hidden',
      borderWidth: 0.5, borderColor: colors.goldBorder, marginTop: 8,
    },
    guestSignInInner: { paddingHorizontal: 36, paddingVertical: 13 },
    guestSignInText: {
      fontFamily: Fonts.cinzel, fontSize: 10, letterSpacing: 2, color: colors.gold,
    },
    guestRegisterText: {
      fontFamily: Fonts.garamond, fontSize: 14, color: colors.text2,
      letterSpacing: 0.3, marginTop: 4,
    },
  }), [colors]);
}
